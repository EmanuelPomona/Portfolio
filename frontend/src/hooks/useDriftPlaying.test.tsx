import { act, cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installIntersectionObserver, installMatchMedia } from '../test-utils/media';
import { useDriftPlaying } from './useDriftPlaying';
import { REDUCED_MOTION_QUERY } from './usePrefersReducedMotion';

function Probe() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const playing = useDriftPlaying(el);
  return <div ref={setEl} data-testid="probe" data-playing={String(playing)} />;
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('useDriftPlaying', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia();
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  it('plays only while the element is in view and the tab is visible', () => {
    render(<Probe />);
    const el = screen.getByTestId('probe');
    expect(el).toHaveAttribute('data-playing', 'false');
    act(() => io.intersect(el, 0.3));
    expect(el).toHaveAttribute('data-playing', 'true');
    setHidden(true);
    expect(el).toHaveAttribute('data-playing', 'false');
    setHidden(false);
    expect(el).toHaveAttribute('data-playing', 'true');
    act(() => io.intersect(el, 0));
    expect(el).toHaveAttribute('data-playing', 'false');
  });

  it('never plays under reduced motion', () => {
    media.restore();
    media = installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    render(<Probe />);
    const el = screen.getByTestId('probe');
    act(() => io.intersect(el, 1));
    expect(el).toHaveAttribute('data-playing', 'false');
  });
});
