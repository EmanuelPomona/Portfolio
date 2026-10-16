import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installMatchMedia } from '../test-utils/media';
import { useAttention } from './useAttention';
import { COARSE_POINTER_QUERY, FINE_POINTER_QUERY } from './useMediaQuery';
import { REDUCED_MOTION_QUERY } from './usePrefersReducedMotion';

function Probe() {
  const { ref, attended } = useAttention<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="probe">
      <a href="#x">inside</a>
      <output>{attended ? 'attended' : 'rest'}</output>
    </div>
  );
}

function placeAt(el: HTMLElement, top: number, bottom: number) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
    height: bottom - top,
    left: 0,
    right: 100,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
}

function scroll() {
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

describe('useAttention', () => {
  let media: ReturnType<typeof installMatchMedia> | undefined;
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });
  afterEach(() => {
    cleanup();
    media?.restore();
    vi.restoreAllMocks();
  });

  it('hover sets attended on fine pointer', () => {
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true });
    render(<Probe />);
    const el = screen.getByTestId('probe');
    expect(el).toHaveAttribute('data-attended', 'false');
    fireEvent.mouseEnter(el);
    expect(el).toHaveAttribute('data-attended', 'true');
    expect(el).toHaveTextContent('attended');
    fireEvent.mouseLeave(el);
    expect(el).toHaveAttribute('data-attended', 'false');
  });

  it('ignores hover on a coarse pointer, where a tap emulates mouseenter', () => {
    media = installMatchMedia({ [COARSE_POINTER_QUERY]: true });
    render(<Probe />);
    const el = screen.getByTestId('probe');
    placeAt(el, 0, 100); // well outside the band
    fireEvent.mouseEnter(el);
    expect(el).toHaveAttribute('data-attended', 'false');
  });

  it('focus-visible within sets attended', () => {
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true });
    render(<Probe />);
    const el = screen.getByTestId('probe');
    const link = screen.getByRole('link');
    // A key press first, as a keyboard user arrives: :focus-visible follows input modality, so a
    // focus() right after mouse events (earlier tests) would correctly not count.
    fireEvent.keyDown(document, { key: 'Tab' });
    act(() => link.focus());
    expect(el).toHaveAttribute('data-attended', 'true');
    act(() => link.blur());
    expect(el).toHaveAttribute('data-attended', 'false');
  });

  it('coarse pointer uses center band on scroll', () => {
    media = installMatchMedia({ [COARSE_POINTER_QUERY]: true });
    render(<Probe />);
    const el = screen.getByTestId('probe');
    placeAt(el, 300, 500); // midpoint 400, inside [240, 560]
    scroll();
    expect(el).toHaveAttribute('data-attended', 'true');
    placeAt(el, 0, 200); // midpoint 100
    scroll();
    expect(el).toHaveAttribute('data-attended', 'false');
  });

  it('reduced motion still reports attended', () => {
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true, [REDUCED_MOTION_QUERY]: true });
    render(<Probe />);
    const el = screen.getByTestId('probe');
    fireEvent.mouseEnter(el);
    expect(el).toHaveAttribute('data-attended', 'true');
  });

  it('stops listening to scroll when unmounted', () => {
    media = installMatchMedia({ [COARSE_POINTER_QUERY]: true });
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Probe />);
    unmount();
    expect(remove.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
  });
});
