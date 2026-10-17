// Owner: agent/frontend. A window's recording plays only while someone looks at it (TASK-110,
// ADR-012, W-08).
import { useEffect } from 'react';

/**
 * Plays `video` while `wanted` is true and pauses it, holding its frame, when it turns false.
 */
export function useVideoPlayback(video: HTMLVideoElement | null, wanted: boolean): void {
  useEffect(() => {
    if (!video) return;
    if (wanted) void video.play();
    else video.pause();
  }, [video, wanted]);
}
