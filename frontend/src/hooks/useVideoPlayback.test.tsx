import { act, cleanup, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVideoPlayback } from './useVideoPlayback';

function Player({ wanted }: { readonly wanted: boolean }) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  useVideoPlayback(video, wanted);
  return <video ref={setVideo} data-testid="video" />;
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
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
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  it('touches nothing at rest', () => {
    render(<Player wanted={false} />);
    expect(play).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it('pauses while the tab is hidden and plays again when it returns, if still wanted', () => {
    render(<Player wanted />);
    expect(play).toHaveBeenCalledTimes(1);
    setHidden(true);
    expect(pause).toHaveBeenCalledTimes(1);
    setHidden(false);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('does not start in a hidden tab', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    render(<Player wanted />);
    expect(play).not.toHaveBeenCalled();
  });
});
