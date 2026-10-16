// Owner: agent/stickman. TASK-203: the Loader's timing, accessibility, and handoff (docs/API.md §2.2).
// Timing is driven by timers, never by rAF, so these run with fake timers and a no-op rAF.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordingContext } from '../testing/recordingContext';
import { registerCursorHandoff } from '../layer/cursorChannel';
import { Loader } from './Loader';
import { LOADER_SEEN_KEY } from './mode';
import { CAP_MS, EXIT_MS, FADE_MS, MIN_MS } from './progress';

const html = document.documentElement;
const sheet = () => document.querySelector('[role="progressbar"]');
const leaving = () => sheet()?.classList.contains('is-leaving') ?? false;
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

const originalRaf = window.requestAnimationFrame;
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const g = globalThis as { CanvasRenderingContext2D?: unknown };

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  html.dataset.loader = 'show';
  window.requestAnimationFrame = (() => 0) as typeof window.requestAnimationFrame; // never fires
  const cover = document.createElement('div');
  cover.id = 'boot-cover';
  document.body.appendChild(cover);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  window.requestAnimationFrame = originalRaf;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  delete g.CanvasRenderingContext2D;
  delete html.dataset.loader;
  document.getElementById('boot-cover')?.remove();
});

describe('Loader timing (show mode)', () => {
  it('exits through timers and calls onDone once even if requestAnimationFrame never fires', async () => {
    const onDone = vi.fn();
    render(<Loader ready={Promise.resolve()} onDone={onDone} />);
    await advance(MIN_MS + EXIT_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
    await advance(10_000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('with ready already resolved at mount, still waits the 1.2s minimum', async () => {
    const onDone = vi.fn();
    render(<Loader ready={Promise.resolve()} onDone={onDone} />);
    await advance(MIN_MS - 1);
    expect(leaving()).toBe(false);
    await advance(1);
    expect(leaving()).toBe(true);
    await advance(EXIT_MS - 1);
    expect(onDone).not.toHaveBeenCalled();
    await advance(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('exits 250ms after a late ready', async () => {
    let settle: () => void = () => {};
    render(<Loader ready={new Promise<void>((r) => (settle = r))} onDone={vi.fn()} />);
    await advance(3000);
    await act(async () => settle());
    await advance(249);
    expect(leaving()).toBe(false);
    await advance(1);
    expect(leaving()).toBe(true);
  });

  it('exits at the 4.5s cap when ready never settles, and is gone within 5s', async () => {
    const onDone = vi.fn();
    render(<Loader ready={new Promise(() => {})} onDone={onDone} />);
    await advance(CAP_MS - 1);
    expect(leaving()).toBe(false);
    await advance(1);
    expect(leaving()).toBe(true);
    await advance(EXIT_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('counts the cap from navigation start when the browser reports one (ACCEPTANCE L-02)', async () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{} as PerformanceEntry]);
    vi.spyOn(performance, 'now').mockReturnValue(300); // mounted 300ms after navigation
    render(<Loader ready={new Promise(() => {})} onDone={vi.fn()} />);
    await advance(CAP_MS - 300 - 1);
    expect(leaving()).toBe(false);
    await advance(1);
    expect(leaving()).toBe(true);
  });

  it('a very slow mount still shows the loader for the minimum', async () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{} as PerformanceEntry]);
    vi.spyOn(performance, 'now').mockReturnValue(4000);
    render(<Loader ready={new Promise(() => {})} onDone={vi.fn()} />);
    await advance(MIN_MS - 1);
    expect(leaving()).toBe(false);
    await advance(1);
    expect(leaving()).toBe(true);
  });

  it('a pointerdown starts the exit at once, without cancelling the event', async () => {
    const onDone = vi.fn();
    render(<Loader ready={new Promise(() => {})} onDone={onDone} />);
    await advance(300);
    const e = new (window.PointerEvent ?? MouseEvent)('pointerdown', { bubbles: true, cancelable: true });
    act(() => {
      document.body.dispatchEvent(e);
    });
    expect(e.defaultPrevented).toBe(false);
    await advance(0);
    expect(leaving()).toBe(true);
    await advance(EXIT_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('a keydown also skips', async () => {
    const onDone = vi.fn();
    render(<Loader ready={new Promise(() => {})} onDone={onDone} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await advance(EXIT_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('unmounting early clears its timers and never calls onDone', async () => {
    const onDone = vi.fn();
    const { unmount } = render(<Loader ready={Promise.resolve()} onDone={onDone} />);
    await advance(200);
    unmount();
    await advance(10_000);
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('Loader finish', () => {
  it('records the visit, removes the boot cover, and releases the page for scrolling', async () => {
    render(<Loader ready={Promise.resolve()} onDone={vi.fn()} />);
    await advance(MIN_MS + EXIT_MS);
    expect(sessionStorage.getItem(LOADER_SEEN_KEY)).toBe('1');
    expect(document.getElementById('boot-cover')).toBeNull();
    // html[data-loader='show'] body { overflow: hidden } must not outlive the loader
    expect(html.dataset.loader).toBe('skip');
  });

  it('removes the boot cover as soon as it paints its own sheet', () => {
    render(<Loader ready={new Promise(() => {})} onDone={vi.fn()} />);
    expect(document.getElementById('boot-cover')).toBeNull();
    expect(sheet()).not.toBeNull();
  });
});

describe('Loader accessibility', () => {
  it('exposes a live progressbar labelled Loading', async () => {
    render(<Loader ready={new Promise(() => {})} onDone={vi.fn()} />);
    const bar = sheet()!;
    expect(bar).toHaveAttribute('aria-label', 'Loading');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    await advance(600);
    // 90·(1 − 0.5³) = 78.75 at 600ms
    expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(75);
    expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(79);
  });

  it('hides its canvases from assistive technology', () => {
    g.CanvasRenderingContext2D = function CanvasRenderingContext2D() {};
    HTMLCanvasElement.prototype.getContext = (() => recordingContext().ctx) as unknown as typeof originalGetContext;
    render(<Loader ready={new Promise(() => {})} onDone={vi.fn()} />);
    const canvases = document.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThan(0);
    canvases.forEach((c) => expect(c).toHaveAttribute('aria-hidden', 'true'));
  });
});

describe('Loader fade mode (reduced motion)', () => {
  beforeEach(() => {
    html.dataset.loader = 'fade';
  });

  it('draws no scribble and fades out within 300ms of ready', async () => {
    g.CanvasRenderingContext2D = function CanvasRenderingContext2D() {};
    const onDone = vi.fn();
    render(<Loader ready={Promise.resolve()} onDone={onDone} />);
    expect(document.querySelector('canvas')).toBeNull();
    await advance(0);
    expect(leaving()).toBe(true);
    await advance(FADE_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('Loader handoff to the cursor', () => {
  it('places the cursor stickman where the loader stickman stands, once, as the exit begins', async () => {
    g.CanvasRenderingContext2D = function CanvasRenderingContext2D() {};
    HTMLCanvasElement.prototype.getContext = (() => recordingContext().ctx) as unknown as typeof originalGetContext;
    const handoff = vi.fn();
    const release = registerCursorHandoff(handoff);
    try {
      render(<Loader ready={Promise.resolve()} onDone={vi.fn()} />);
      await advance(MIN_MS - 1);
      expect(handoff).not.toHaveBeenCalled();
      await advance(1);
      expect(handoff).toHaveBeenCalledTimes(1);
      const [at] = handoff.mock.calls[0]!;
      expect(Number.isFinite(at.x) && Number.isFinite(at.y)).toBe(true);
      await advance(EXIT_MS + 1000);
      expect(handoff).toHaveBeenCalledTimes(1);
    } finally {
      release();
    }
  });
});
