import { cleanup, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVideoPlayback } from './useVideoPlayback';

function Player({ wanted }: { readonly wanted: boolean }) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  useVideoPlayback(video, wanted);
  return <video ref={setVideo} data-testid="video" />;
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

  it('pauses when the window unmounts while playing', () => {
    const { unmount } = render(<Player wanted />);
    unmount();
    expect(pause).toHaveBeenCalledTimes(1);
  });
});
