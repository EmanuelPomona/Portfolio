// @vitest-environment node
// Owner: agent/backend. `npm run video` (scripts/video.swift, ADR-012, TASK-305). The script needs macOS
// AVFoundation, so these tests are skipped elsewhere (CI runs on Linux). The fixture is the real
// committed recording; the MP4 is checked by reading its boxes here, independently of the Swift code.
import { execFile } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { mp4Info } from './mp4-boxes.mjs';

const SCRIPT = fileURLToPath(new URL('./video.swift', import.meta.url));
const RECORDING = fileURLToPath(new URL('../media-src/video/snake-ai.mov', import.meta.url));
const SETTINGS = { cropTop: 51, cropBottom: 1, posterSeconds: 12 };
const MAX_BYTES = 3 * 1024 * 1024;
const execFileAsync = promisify(execFile);
const roots = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), 'video-'));
  roots.push(root);
  const ws = {
    src: path.join(root, 'media-src', 'video'),
    out: path.join(root, 'public', 'media', 'video'),
    posters: path.join(root, 'media-src', 'projects'),
    run: () =>
      execFileAsync('swift', ['-suppress-warnings', SCRIPT, '--src', ws.src, '--out', ws.out, '--posters', ws.posters], {
        maxBuffer: 1 << 20,
      }),
    files: async () => [
      ...(await readdir(ws.out).catch(() => [])).map((f) => `out/${f}`),
      ...(await readdir(ws.posters).catch(() => [])).map((f) => `posters/${f}`),
    ].sort(),
  };
  await mkdir(ws.src, { recursive: true });
  return ws;
}

async function addRecording(ws, id, settings = SETTINGS) {
  await copyFile(RECORDING, path.join(ws.src, `${id}.mov`));
  if (settings) await writeFile(path.join(ws.src, `${id}.json`), JSON.stringify(settings));
}

/** Decode the MP4's frame at `seconds` to a PNG with AVFoundation (test-only snippet, not in the script). */
async function mp4Frame(mp4, seconds, png) {
  const code = `
import AVFoundation
import ImageIO
import UniformTypeIdentifiers
let env = ProcessInfo.processInfo.environment
let generator = AVAssetImageGenerator(asset: AVURLAsset(url: URL(fileURLWithPath: env["MP4"]!)))
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
let (image, _) = try await generator.image(at: CMTime(seconds: Double(env["SECONDS"]!)!, preferredTimescale: 600))
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: env["PNG"]!) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, image, nil)
_ = CGImageDestinationFinalize(dest)
`;
  await execFileAsync('swift', ['-e', code], { env: { ...process.env, MP4: mp4, SECONDS: String(seconds), PNG: png } });
  return sharp(png).raw().toBuffer({ resolveWithObject: true });
}

/** Brightest channel along row y between x0 and x1 (step 4), and counts of snake-green and food-red pixels. */
function look({ data, info }, y = 0, x0 = 300, x1 = 1100) {
  const ch = info.channels;
  let rowMax = 0;
  for (let x = x0; x < x1; x += 4) rowMax = Math.max(rowMax, ...data.subarray((y * info.width + x) * ch, (y * info.width + x) * ch + 3));
  let green = 0;
  let red = 0;
  for (let i = 0; i < data.length; i += ch) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (g > 180 && r < 80 && b < 80) green++;
    if (r > 180 && g < 80 && b < 80) red++;
  }
  return { rowMax, green, red };
}

describe.skipIf(process.platform !== 'darwin')('npm run video (macOS AVFoundation)', { timeout: 300_000 }, () => {
  it('writes an H.264 MP4 without audio, title bar cropped, even size, under 3 MB, and its poster', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app');

    const { stdout } = await ws.run();

    expect(await ws.files()).toEqual(['out/demo-app.mp4', 'posters/demo-app.png']);
    expect(stdout).toContain('demo-app.mp4');
    const mp4 = await readFile(path.join(ws.out, 'demo-app.mp4'));
    expect(mp4.length).toBeLessThanOrEqual(MAX_BYTES);
    const info = mp4Info(mp4);
    expect(info.formats).toEqual(['avc1']);
    expect(info.handlers).not.toContain('soun');
    expect(info.sizes).toEqual([[1270, 954]]); // 1006 rows minus 51 title-bar rows minus 1 corner row

    // The title bar is grey (about 57) and the game field black, so row 0 must already be the field,
    // in the poster and in the video itself; both must show the snake and the food.
    const poster = await sharp(path.join(ws.posters, 'demo-app.png')).raw().toBuffer({ resolveWithObject: true });
    expect([poster.info.width, poster.info.height]).toEqual([1270, 954]);
    const frame = await mp4Frame(path.join(ws.out, 'demo-app.mp4'), 12, path.join(ws.out, '..', 'frame.png'));
    expect([frame.info.width, frame.info.height]).toEqual([1270, 954]);
    for (const image of [poster, frame]) {
      const seen = look(image);
      expect(seen.rowMax).toBeLessThan(20);
      expect(seen.green).toBeGreaterThan(1000); // the snake
      expect(seen.red).toBeGreaterThan(500); // the food
    }
  });

  it('fails without a settings file and writes nothing', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', null);

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/demo-app.mov');
    expect(failure.stderr).toContain('demo-app.json');
    expect(await ws.files()).toEqual([]);
  });

  it('fails when the cropped height is odd and writes nothing', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', { ...SETTINGS, cropBottom: 0 });

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('955');
    expect(await ws.files()).toEqual([]);
  });

  it('fails on a recording it cannot read and leaves earlier outputs intact', async () => {
    const ws = await workspace();
    await mkdir(ws.out, { recursive: true });
    await mkdir(ws.posters, { recursive: true });
    await writeFile(path.join(ws.out, 'demo-app.mp4'), 'previous mp4');
    await writeFile(path.join(ws.posters, 'demo-app.png'), 'previous poster');
    await writeFile(path.join(ws.src, 'demo-app.mov'), 'this is not a movie');
    await writeFile(path.join(ws.src, 'demo-app.json'), JSON.stringify(SETTINGS));

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/demo-app.mov');
    expect(await ws.files()).toEqual(['out/demo-app.mp4', 'posters/demo-app.png']);
    expect(await readFile(path.join(ws.out, 'demo-app.mp4'), 'utf8')).toBe('previous mp4');
    expect((await stat(path.join(ws.posters, 'demo-app.png'))).size).toBe('previous poster'.length);
  });

  it('rejects a recording name that is not lowercase kebab-case', async () => {
    const ws = await workspace();
    await addRecording(ws, 'Demo_App');

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/Demo_App.mov: name must be lowercase kebab-case');
    expect(await ws.files()).toEqual([]);
  });

  it('crops the sides with cropLeft and cropRight', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', { ...SETTINGS, cropLeft: 10, cropRight: 10 });

    await ws.run();

    expect(mp4Info(await readFile(path.join(ws.out, 'demo-app.mp4'))).sizes).toEqual([[1250, 954]]);
    expect((await sharp(path.join(ws.posters, 'demo-app.png')).metadata()).width).toBe(1250);
  });

  it('fails when the cropped width is odd, pointing at cropRight', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', { ...SETTINGS, cropRight: 1 });

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('1269');
    expect(failure.stderr).toContain('cropRight');
    expect(await ws.files()).toEqual([]);
  });

  it('fails on a negative crop', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', { ...SETTINGS, cropTop: -1 });

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/demo-app.mov');
    expect(await ws.files()).toEqual([]);
  });

  it('fails when posterSeconds is past the end of the recording', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', { ...SETTINGS, posterSeconds: 99 });

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('posterSeconds must be between 0 and 33.7');
    expect(await ws.files()).toEqual([]);
  });

  it('reports a recording in a format other than .mov', async () => {
    const ws = await workspace();
    await writeFile(path.join(ws.src, 'demo-app.gif'), 'GIF89a');

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/demo-app.gif: unsupported file type');
  });

  it('writes nothing when any one of several recordings fails', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app');
    await addRecording(ws, 'other-app', null);

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/other-app.mov');
    expect(await ws.files()).toEqual([]);
  });

  it('removes its partial files when a check after encoding fails', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app');
    // A read-only posters folder makes the poster write fail after the MP4 is already encoded.
    await mkdir(ws.posters, { recursive: true });
    await chmod(ws.posters, 0o555);

    const failure = await ws.run().then(() => null, (error) => error);
    await chmod(ws.posters, 0o755);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/demo-app.mov: could not write the poster frame');
    expect(await ws.files()).toEqual([]);
  });

  it('removes its partial files when moving them into place fails', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app');
    // A non-empty directory at the final MP4 path makes the rename fail.
    await mkdir(path.join(ws.out, 'demo-app.mp4', 'blocker'), { recursive: true });

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(await ws.files()).toEqual(['out/demo-app.mp4']);
  });
});
