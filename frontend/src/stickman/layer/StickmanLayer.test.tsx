// Owner: agent/stickman. TASK-202 (S-07). StickmanLayer re-evaluates its media queries live.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { recordingContext } from '../testing/recordingContext';
import { StickmanLayer } from './StickmanLayer';

const html = document.documentElement;

/** A matchMedia whose answers can change after mount, notifying 'change' listeners. */
function liveMedia(initial: Record<string, boolean>) {
  const state = { ...initial };
  const listeners = new Map<string, Set<() => void>>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return state[query] ?? false;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(fn);
    },
    removeEventListener: (_: string, fn: () => void) => listeners.get(query)?.delete(fn),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return {
    set(query: string, matches: boolean) {
      state[query] = matches;
      act(() => listeners.get(query)?.forEach((fn) => fn()));
    },
    listenerCount: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
  };
}

const move = () =>
  act(() => {
    window.dispatchEvent(new (window.PointerEvent ?? MouseEvent)('pointermove', { clientX: 50, clientY: 50 }));
  });

const FINE = '(pointer: fine)';
const COARSE = '(pointer: coarse)';
const REDUCE = '(prefers-reduced-motion: reduce)';
const FORCED = '(forced-colors: active)';

const originalGetContext = HTMLCanvasElement.prototype.getContext;
const g = globalThis as { CanvasRenderingContext2D?: unknown };

function withCanvasSupport() {
  g.CanvasRenderingContext2D = function CanvasRenderingContext2D() {};
  HTMLCanvasElement.prototype.getContext = (() => recordingContext().ctx) as unknown as typeof originalGetContext;
}

beforeEach(() => {
  html.classList.remove('stickman-cursor');
  withCanvasSupport();
});

afterEach(() => {
  cleanup();
  delete g.CanvasRenderingContext2D;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

describe('StickmanLayer', () => {
  it('on a fine pointer hides the native cursor once the pointer moves, with an aria-hidden canvas and ring', () => {
    liveMedia({ [FINE]: true });
    const { container } = render(<StickmanLayer touch={false} />);
    expect(html.classList.contains('stickman-cursor')).toBe(false); // nothing to replace it yet
    move();
    expect(html.classList.contains('stickman-cursor')).toBe(true);
    const canvas = container.querySelector('canvas.stickman-canvas');
    const ring = container.querySelector('.stickman-ring');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(ring).toHaveAttribute('aria-hidden', 'true');
  });

  it('switches off live when reduced motion turns on, and back on when it turns off', () => {
    const media = liveMedia({ [FINE]: true });
    const { container } = render(<StickmanLayer touch={false} />);
    move();
    media.set(REDUCE, true);
    expect(html.classList.contains('stickman-cursor')).toBe(false);
    expect(container.querySelector('canvas')).toBeNull();
    media.set(REDUCE, false);
    move();
    expect(html.classList.contains('stickman-cursor')).toBe(true);
  });

  it('switches off live when forced colors turn on', () => {
    const media = liveMedia({ [FINE]: true });
    render(<StickmanLayer touch={false} />);
    media.set(FORCED, true);
    expect(html.classList.contains('stickman-cursor')).toBe(false);
  });

  it('follows a live change of pointer type', () => {
    const media = liveMedia({ [FINE]: true });
    const { container } = render(<StickmanLayer touch={false} />);
    media.set(FINE, false);
    media.set(COARSE, true);
    expect(html.classList.contains('stickman-cursor')).toBe(false);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing on a coarse pointer with touch=false', () => {
    liveMedia({ [COARSE]: true });
    const { container } = render(<StickmanLayer touch={false} />);
    expect(container.innerHTML).toBe('');
    expect(html.classList.contains('stickman-cursor')).toBe(false);
  });

  it('keeps the native cursor when the browser has no 2D canvas', () => {
    delete g.CanvasRenderingContext2D;
    liveMedia({ [FINE]: true });
    const { container } = render(<StickmanLayer touch={false} />);
    expect(container.innerHTML).toBe('');
    expect(html.classList.contains('stickman-cursor')).toBe(false);
  });

  it('removes the class and its media listeners on unmount', () => {
    const media = liveMedia({ [FINE]: true });
    const { unmount } = render(<StickmanLayer touch={false} />);
    expect(media.listenerCount()).toBeGreaterThan(0);
    unmount();
    expect(html.classList.contains('stickman-cursor')).toBe(false);
    expect(media.listenerCount()).toBe(0);
  });
});
