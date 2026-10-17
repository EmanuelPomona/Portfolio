// Owner: agent/frontend. A window's recording plays only while someone looks at it (TASK-110,
// ADR-012, W-08).
import { useEffect, useRef } from 'react';

/** HTMLMediaElement.HAVE_METADATA: duration and dimensions are known, so a seek can land. */
const HAVE_METADATA = 1;

/**
 * Moves the playhead: a deliberate side effect on the media element, like play() and pause(). An
 * engine that refuses the seek (older WebKit threw InvalidStateError before metadata) just plays
 * from where it is; a throw here would escape the effect and unmount the page.
 */
function seek(video: HTMLMediaElement, seconds: number): void {
  try {
    video.currentTime = seconds;
  } catch {
    // Refused: the recording starts from its current position instead.
  }
}

/**
 * Plays `video` while `wanted` is true and pauses it, holding its frame, when it turns false (or
 * the window unmounts). Nothing is called at rest, so a resting window never touches its video.
 * The caller decides `wanted` (attention, on screen, tab visible, motion allowed).
 *
 * `startAt` (seconds) is where the poster frame was taken: the first play starts there, so the
 * still flows into motion with no jump; after that the video resumes from wherever it paused, and
 * the native loop restarts at 0. Before metadata (preload="none"), setting currentTime sets the
 * element's default playback start position, which it seeks to once it knows its duration; the
 * seek is applied again on loadedmetadata for engines that drop it.
 *
 * A rejected play() is swallowed on purpose: browsers reject it when a quick hover-out pauses it
 * before it starts, when autoplay policy refuses it, or when the codec is missing. None of those is
 * an error worth a console line; the poster simply stays.
 */
export function useVideoPlayback(video: HTMLVideoElement | null, wanted: boolean, startAt = 0): void {
  // The element whose first play has happened; a new element (a remount) starts at startAt again.
  const startedFor = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!video || !wanted) return;
    if (startedFor.current !== video) {
      startedFor.current = video;
      if (startAt > 0) {
        seek(video, startAt);
        if (video.readyState < HAVE_METADATA) {
          const reapply = () => {
            if (video.currentTime < startAt) seek(video, startAt);
          };
          video.addEventListener('loadedmetadata', reapply, { once: true });
        }
      }
    }
    const playing = video.play() as Promise<void> | undefined;
    playing?.catch(() => {});
    return () => video.pause();
  }, [video, wanted, startAt]);
}
