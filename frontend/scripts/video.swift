// Owner: agent/backend. `npm run video`: project recordings (ADR-012, docs/API.md §3 "Project recordings").
// macOS only: it uses AVFoundation, so the project needs no ffmpeg.
//
//   frontend/media-src/video/<id>.mov  (+ <id>.json, the settings measured for that recording)
//     -> frontend/public/media/video/<id>.mp4   H.264, no audio track, title bar cropped, even size, <= 3 MB
//     -> frontend/media-src/projects/<id>.png   the poster frame, same crop; `npm run media` then
//                                               makes its renditions like any screenshot
//
// Usage: swift scripts/video.swift [--src media-src/video] [--out public/media/video] [--posters media-src/projects]
// Flag values resolve against the current folder; the defaults are frontend/'s own folders.
//
// Settings file, next to the recording:
//   { "cropTop": 51, "cropBottom": 1, "posterSeconds": 12 }
//   cropTop        rows to remove from the top: the recorded window's title bar. Measure it on a
//                  frame: it is the index of the first row of the app's own content.
//   cropBottom     rows to remove from the bottom, usually 0 or 1 to make the height even.
//   posterSeconds  the moment shown before the video plays.
//
// Encoding: AVAssetExportSession, preset HighestQuality (H.264, not HEVC), MP4, optimized for network
// use (moov box first), with a video composition that crops by translating the frame up by cropTop.
// Only the video track is exported. The encode is not byte-identical across runs (ADR-012), so it is
// re-run by hand when the source changes, and the output is committed.
//
// Failure: every problem is reported as `media-src/video/<file>: <reason>` and the run exits 1. All
// output goes to temporary files first and is checked (codec, no audio, size, 3 MB); nothing replaces
// an existing file unless every recording succeeded.
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let maxBytes = 3 * 1024 * 1024
let kebab = try! NSRegularExpression(pattern: "^[a-z0-9]+(-[a-z0-9]+)*$")
let frontend = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()

/// A problem the owner can act on; its message is printed as is.
struct Problem: Error {
  let message: String
  init(_ file: String, _ reason: String) { message = "media-src/video/\(file): \(reason)" }
}

struct Settings: Decodable {
  let cropTop: Int
  let cropBottom: Int
  let posterSeconds: Double
}

struct Output {
  let id: String
  let finalVideo: URL
  let finalPoster: URL
  let tempVideo: URL
  let tempPoster: URL
  var summary = ""
}

func folder(_ flag: String, _ fallback: String) -> URL {
  let args = CommandLine.arguments
  if let i = args.firstIndex(of: flag), i + 1 < args.count {
    return URL(fileURLWithPath: args[i + 1], relativeTo: URL(fileURLWithPath: FileManager.default.currentDirectoryPath))
      .standardizedFileURL
  }
  return frontend.appendingPathComponent(fallback)
}

func fourCC(_ code: FourCharCode) -> String {
  let bytes: [UInt8] = [UInt8((code >> 24) & 255), UInt8((code >> 16) & 255), UInt8((code >> 8) & 255), UInt8(code & 255)]
  return String(decoding: bytes, as: UTF8.self)
}

func writePNG(_ image: CGImage, to url: URL) -> Bool {
  guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { return false }
  CGImageDestinationAddImage(dest, image, nil)
  return CGImageDestinationFinalize(dest)
}

/// Encodes one recording into temporary files next to their final places, and checks the result.
func encode(_ mov: URL, outDir: URL, posterDir: URL) async throws -> Output {
  let file = mov.lastPathComponent
  let id = mov.deletingPathExtension().lastPathComponent
  guard kebab.firstMatch(in: id, range: NSRange(id.startIndex..., in: id)) != nil else {
    throw Problem(file, "name must be lowercase kebab-case")
  }
  let settingsURL = mov.deletingPathExtension().appendingPathExtension("json")
  guard let data = try? Data(contentsOf: settingsURL) else {
    throw Problem(file, "needs a settings file \(id).json next to it with cropTop, cropBottom, and posterSeconds")
  }
  guard let settings = try? JSONDecoder().decode(Settings.self, from: data) else {
    throw Problem(file, "\(id).json must look like {\"cropTop\": 51, \"cropBottom\": 1, \"posterSeconds\": 12}")
  }

  let asset = AVURLAsset(url: mov)
  let tracks: [AVAssetTrack]
  let duration: CMTime
  do {
    tracks = try await asset.loadTracks(withMediaType: .video)
    duration = try await asset.load(.duration)
  } catch {
    throw Problem(file, "could not read the recording (\(error.localizedDescription))")
  }
  guard let track = tracks.first else { throw Problem(file, "has no video track") }
  let natural = try await track.load(.naturalSize)
  guard try await track.load(.preferredTransform).isIdentity else {
    throw Problem(file, "is rotated; record the window upright")
  }
  let width = Int(natural.width)
  let height = Int(natural.height) - settings.cropTop - settings.cropBottom
  guard settings.cropTop >= 0, settings.cropBottom >= 0, height > 0 else {
    throw Problem(file, "cropTop and cropBottom must be 0 or more and leave some of the \(Int(natural.height)) rows")
  }
  guard width % 2 == 0, height % 2 == 0 else {
    throw Problem(file, "the cropped frame would be \(width)x\(height); both must be even, so change cropBottom by 1")
  }
  let seconds = CMTimeGetSeconds(duration)
  guard settings.posterSeconds >= 0, settings.posterSeconds < seconds else {
    throw Problem(file, "posterSeconds must be between 0 and \(String(format: "%.1f", seconds))")
  }

  let output = Output(
    id: id,
    finalVideo: outDir.appendingPathComponent("\(id).mp4"),
    finalPoster: posterDir.appendingPathComponent("\(id).png"),
    tempVideo: outDir.appendingPathComponent(".\(id).partial.mp4"),
    tempPoster: posterDir.appendingPathComponent(".\(id).partial.png")
  )
  try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
  try FileManager.default.createDirectory(at: posterDir, withIntermediateDirectories: true)
  try? FileManager.default.removeItem(at: output.tempVideo)

  // Video only: a composition holding just the video track, cropped by moving the frame up.
  let composition = AVMutableComposition()
  guard let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
    throw Problem(file, "could not set up the export")
  }
  try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: track, at: .zero)
  let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
  layer.setTransform(CGAffineTransform(translationX: 0, y: -CGFloat(settings.cropTop)), at: .zero)
  let instruction = AVMutableVideoCompositionInstruction()
  instruction.timeRange = CMTimeRange(start: .zero, duration: duration)
  instruction.layerInstructions = [layer]
  let videoComposition = AVMutableVideoComposition()
  videoComposition.renderSize = CGSize(width: width, height: height)
  let fps = max(1, Int32((try await track.load(.nominalFrameRate)).rounded()))
  videoComposition.frameDuration = CMTime(value: 1, timescale: fps)
  videoComposition.instructions = [instruction]

  guard let session = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
    throw Problem(file, "could not set up the export")
  }
  session.videoComposition = videoComposition
  session.shouldOptimizeForNetworkUse = true
  do {
    try await session.export(to: output.tempVideo, as: .mp4)
  } catch {
    throw Problem(file, "the export failed (\(error.localizedDescription))")
  }

  // Check what was written before it can replace anything.
  let written = AVURLAsset(url: output.tempVideo)
  let outVideo = try await written.loadTracks(withMediaType: .video)
  let outAudio = try await written.loadTracks(withMediaType: .audio)
  let codec = try await outVideo.first?.load(.formatDescriptions).first.map { fourCC(CMFormatDescriptionGetMediaSubType($0)) }
  let outSize = try await outVideo.first?.load(.naturalSize) ?? .zero
  let bytes = (try FileManager.default.attributesOfItem(atPath: output.tempVideo.path)[.size] as? Int) ?? Int.max
  guard outVideo.count == 1, outAudio.isEmpty, codec == "avc1" else {
    throw Problem(file, "the export is not a single H.264 video track (codec \(codec ?? "none"), \(outAudio.count) audio tracks)")
  }
  guard Int(outSize.width) == width, Int(outSize.height) == height else {
    throw Problem(file, "the export is \(Int(outSize.width))x\(Int(outSize.height)), expected \(width)x\(height)")
  }
  guard bytes <= maxBytes else {
    throw Problem(file, "the export is \(bytes) bytes, over the 3 MB (\(maxBytes) bytes) limit; trim the recording")
  }

  // The poster: the frame at posterSeconds, exactly, with the same crop.
  let generator = AVAssetImageGenerator(asset: asset)
  generator.requestedTimeToleranceBefore = .zero
  generator.requestedTimeToleranceAfter = .zero
  let frame: CGImage
  let actual: CMTime
  do {
    (frame, actual) = try await generator.image(at: CMTime(seconds: settings.posterSeconds, preferredTimescale: 600))
  } catch {
    throw Problem(file, "could not read the poster frame (\(error.localizedDescription))")
  }
  guard let poster = frame.cropping(to: CGRect(x: 0, y: settings.cropTop, width: width, height: height)),
    writePNG(poster, to: output.tempPoster)
  else {
    throw Problem(file, "could not write the poster frame")
  }

  var done = output
  done.summary = String(
    format: "%@: public/media/video/%@.mp4 (H.264, %dx%d, %.1fs, %d bytes, no audio), media-src/projects/%@.png (poster at %.3fs)",
    file, id, width, height, seconds, bytes, id, CMTimeGetSeconds(actual))
  return done
}

let srcDir = folder("--src", "media-src/video")
let outDir = folder("--out", "public/media/video")
let posterDir = folder("--posters", "media-src/projects")
let recordings = ((try? FileManager.default.contentsOfDirectory(at: srcDir, includingPropertiesForKeys: nil)) ?? [])
  .filter { $0.pathExtension.lowercased() == "mov" }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

var outputs: [Output] = []
var problems: [String] = []
for mov in recordings {
  do {
    outputs.append(try await encode(mov, outDir: outDir, posterDir: posterDir))
  } catch let problem as Problem {
    problems.append(problem.message)
  } catch {
    problems.append("media-src/video/\(mov.lastPathComponent): \(error.localizedDescription)")
  }
}

if !problems.isEmpty {
  for output in outputs {
    try? FileManager.default.removeItem(at: output.tempVideo)
    try? FileManager.default.removeItem(at: output.tempPoster)
  }
  for problem in problems { FileHandle.standardError.write(Data("\(problem)\n".utf8)) }
  FileHandle.standardError.write(Data("npm run video: \(problems.count) problem(s); nothing was written.\n".utf8))
  exit(1)
}

for output in outputs {
  // rename(2) replaces the destination atomically.
  guard rename(output.tempVideo.path, output.finalVideo.path) == 0, rename(output.tempPoster.path, output.finalPoster.path) == 0 else {
    FileHandle.standardError.write(Data("npm run video: could not move \(output.id) into place (errno \(errno))\n".utf8))
    exit(1)
  }
  print(output.summary)
}
print("npm run video: \(outputs.count) recording(s).")
