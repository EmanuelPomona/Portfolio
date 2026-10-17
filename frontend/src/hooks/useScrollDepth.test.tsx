import { act, cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFrames } from '../test-utils/frames';
import { installMatchMedia } from '../test-utils/media';
import { REDUCED_MOTION_QUERY } from './usePrefersReducedMotion';
import { useScrollDepth } from './useScrollDepth';

function Layer({ id, factor = 0.1 }: { readonly id: string; readonly factor?: number }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useScrollDepth(el, factor);
  return <div ref={setEl} data-testid={id} />;
}

function setScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
}

const depth = (el: HTMLElement) => el.style.getPropertyValue('--depth');

describe('useScrollDepth', () => {
  let media: ReturnType<typeof installMatchMedia>;
  let frames: ReturnType<typeof installFrames>;
  beforeEach(() => {
    media = installMatchMedia();
    frames = installFrames();
    setScroll(0);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    // Every layer's layout box sits at document top 2000, 600px tall.
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(2000);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(null);
    // Its painted box is somewhere else: a layer's CSS may map --depth to any translate, so the
    // transformed rect says nothing reliable about where the layer sits in the layout.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 2037,
      bottom: 2637,
      height: 600,
      left: 0,
      right: 1000,
      width: 1000,
      x: 0,
      y: 2037,
      toJSON: () => ({}),
    } as DOMRect);
  });
  afterEach(() => {
    cleanup();
    frames.restore();
    media.restore();
    vi.restoreAllMocks();
    setScroll(0);
  });

  it('useScrollDepth registers one passive scroll listener for any number of elements', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <>
        <Layer id="a" />
        <Layer id="b" />
        <Layer id="c" factor={0.05} />
      </>,
    );
    const scrolls = add.mock.calls.filter(([type]) => type === 'scroll');
    expect(scrolls).toHaveLength(1);
    expect(scrolls[0]![2]).toMatchObject({ passive: true });

    unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
  });

  it('useScrollDepth writes --depth inside requestAnimationFrame, never in the scroll handler', () => {
    render(<Layer id="a" />);
    const el = screen.getByTestId('a');
    frames.flush(); // the first frame measures and places the layer
    // Center 2300, viewport center 400: 1900px below, so -190px, clamped to -80px.
    expect(depth(el)).toBe('-80px');

    setScroll(2100);
    for (let i = 0; i < 3; i++) window.dispatchEvent(new Event('scroll'));
    // Nothing written yet, and three scroll events asked for one frame.
    expect(depth(el)).toBe('-80px');
    expect(frames.pending()).toBe(1);

    frames.flush();
    // 200px past center: the layer lags by 20px.
    expect(depth(el)).toBe('20px');
  });

  it('a resize alone never moves a layer: positions come from the layout, not the painted box', () => {
    // Regression (review, round 2): re-measuring subtracted the raw --depth from a rect whose CSS
    // translate was a mapping of it, so a resize nudged the backdrop.
    render(<Layer id="a" />);
    const el = screen.getByTestId('a');
    setScroll(2100);
    frames.flush();
    expect(depth(el)).toBe('20px');
    window.dispatchEvent(new Event('resize'));
    frames.flush();
    expect(depth(el)).toBe('20px');
  });

  it('reads the viewport height when it measures, not on every frame', () => {
    render(<Layer id="a" />);
    const el = screen.getByTestId('a');
    setScroll(2100);
    frames.flush();
    expect(depth(el)).toBe('20px');
    // A new height is only picked up with the resize that comes with it.
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    window.dispatchEvent(new Event('scroll'));
    frames.flush();
    expect(depth(el)).toBe('20px');
    window.dispatchEvent(new Event('resize'));
    frames.flush();
    // Viewport center now 2100 + 500 = 2600, 300px past the layer's center 2300: 30px.
    expect(depth(el)).toBe('30px');
  });

  it('clears depth offsets when reduced motion turns on', () => {
    render(<Layer id="a" />);
    const el = screen.getByTestId('a');
    frames.flush();
    expect(depth(el)).toBe('-80px');

    act(() => media.set(REDUCED_MOTION_QUERY, true));
    expect(depth(el)).toBe('');

    setScroll(2100);
    window.dispatchEvent(new Event('scroll'));
    frames.flush();
    expect(depth(el)).toBe('');
  });
});
