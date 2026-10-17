import { cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVideoPlayback } from './useVideoPlayback';

function Player({ wanted, startAt = 0 }: { readonly wanted: boolean; readonly startAt?: number }) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  useVideoPlayback(video, wanted, startAt);
  return <video ref={setVideo} data-testid="video" />;
}

/** Records every seek on `video`, and lets the test say how far it has loaded. */
function instrument(video: HTMLVideoElement, readyState: number) {
  const state = { time: 0, ready: readyState, seeks: [] as number[], refuse: false };
  Object.defineProperty(video, 'readyState', { configurable: true, get: () => state.ready });
  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    get: () => state.time,
    set: (t: number) => {
      if (state.refuse) throw new DOMException('Cannot seek now', 'InvalidStateError');
      state.time = t;
      state.seeks.push(t);
    },
  });
  return state;
}

describe('useVideoPlayback', () => {
  let play: ReturnType<typeof vi.spyOn>;
  let pause: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('touches nothing at rest', () => {
    render(<Player wanted={false} />);
    expect(play).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it('plays while wanted and pauses when it no longer is', () => {
    const { rerender } = render(<Player wanted />);
    expect(play).toHaveBeenCalledTimes(1);
    rerender(<Player wanted={false} />);
    expect(pause).toHaveBeenCalledTimes(1);
    rerender(<Player wanted />);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('with metadata already loaded, the first play seeks once and adds no re-seek', () => {
    const { rerender } = render(<Player wanted={false} startAt={11.989} />);
    const video = screen.getByTestId('video') as HTMLVideoElement;
    const state = instrument(video, 1); // HAVE_METADATA
    rerender(<Player wanted startAt={11.989} />);
    expect(state.seeks).toEqual([11.989]);
    state.time = 0;
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(state.seeks).toEqual([11.989]);
  });

  it('leaves alone a start position the engine already applied', () => {
    const { rerender } = render(<Player wanted={false} startAt={11.989} />);
    const video = screen.getByTestId('video') as HTMLVideoElement;
    const state = instrument(video, 0); // HAVE_NOTHING: the seek is a stored start position
    rerender(<Player wanted startAt={11.989} />);
    expect(state.seeks).toEqual([11.989]);
    // The engine honored it: currentTime already reads 11.989 when the metadata arrives.
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(state.seeks).toEqual([11.989]);
  });

  it('a seek the engine refuses never breaks playback', () => {
    // Older WebKit threw InvalidStateError for a seek before metadata. Thrown from an effect, that
    // would unmount the page on hover; the poster simply stays where it was instead.
    const { rerender } = render(<Player wanted={false} startAt={11.989} />);
    const state = instrument(screen.getByTestId('video') as HTMLVideoElement, 0);
    state.refuse = true;
    expect(() => rerender(<Player wanted startAt={11.989} />)).not.toThrow();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('pauses when the window unmounts while playing', () => {
    const { unmount } = render(<Player wanted />);
    unmount();
    expect(pause).toHaveBeenCalledTimes(1);
  });
});
