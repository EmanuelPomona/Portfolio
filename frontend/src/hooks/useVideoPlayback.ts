// Owner: agent/frontend. A window's recording plays only while someone looks at it (TASK-110,
// ADR-012, W-08).
import { useEffect } from 'react';

/**
 * Plays `video` while `wanted` is true and pauses it, holding its frame, when it turns false (or
 * the window unmounts). Nothing is called at rest, so a resting window never touches its video.
 *
 * A rejected play() is swallowed on purpose: browsers reject it when a quick hover-out pauses it
 * before it starts, when autoplay policy refuses it, or when the codec is missing. None of those is
 * an error worth a console line; the poster simply stays.
 */
export function useVideoPlayback(video: HTMLVideoElement | null, wanted: boolean): void {
  useEffect(() => {
    if (!video || !wanted) return;
    const started = video.play() as Promise<void> | undefined;
    started?.catch(() => {});
    return () => video.pause();
  }, [video, wanted]);
}
