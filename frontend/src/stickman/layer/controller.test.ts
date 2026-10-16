// Owner: agent/stickman. TASK-202. The cursor controller with an injected clock, rAF, and
// elementFromPoint (jsdom has none), observed through inspect() and a recording 2D context.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordingContext } from '../testing/recordingContext';
import { createCursorController, type CursorController } from './controller';

const html = document.documentElement;
const FRAME = 1000 / 60;

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left, top, width, height, right: left + width, bottom: top + height, x: left, y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function pointer(type: string, target: EventTarget, x: number, y: number) {
  const Ctor = window.PointerEvent ?? MouseEvent;
  const e = new Ctor(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  return e;
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

let controller: CursorController | null = null;

function harness({ withContext = true } = {}) {
  document.body.innerHTML =
    '<a id="link" href="/x">Projects</a><p id="plain">text</p><a id="other" href="/y">Other</a>';
  const $ = (id: string) => document.getElementById(id)!;
  $('link').getBoundingClientRect = () => rect(400, 30, 80, 20);
  $('other').getBoundingClientRect = () => rect(600, 300, 100, 40);

  const rec = recordingContext();
  const canvas = document.createElement('canvas');
  canvas.getContext = (() => (withContext ? rec.ctx : null)) as typeof canvas.getContext;
  const ring = document.createElement('div');
  document.body.append(canvas, ring);

  let now = 0;
  let queue: FrameRequestCallback[] = [];
  const elementFromPoint = vi.fn<(x: number, y: number) => Element | null>(() => null);
  controller = createCursorController(canvas, ring, {
    size: 32,
    env: {
      now: () => now,
      raf: (cb) => queue.push(cb),
      cancelRaf: () => {
        queue = [];
      },
      elementFromPoint,
    },
  });
  const frames = (n: number) => {
    for (let i = 0; i < n; i++) {
      now += FRAME;
      const run = queue;
      queue = [];
      for (const cb of run) cb(now);
    }
  };
  return { c: controller, $, rec, canvas, ring, frames, elementFromPoint, pending: () => queue.length };
}

beforeEach(() => {
  html.classList.remove('stickman-cursor');
  setHidden(false);
});

afterEach(() => {
  controller?.stop();
  controller = null;
  document.body.innerHTML = '';
});

describe('createCursorController', () => {
  it('controller adds html.stickman-cursor in desktop mode and removes it on stop()', () => {
    const { c, frames, pending } = harness();
    c.start();
    expect(html.classList.contains('stickman-cursor')).toBe(true);
    frames(2);
    expect(pending()).toBe(1);
    c.stop();
    expect(html.classList.contains('stickman-cursor')).toBe(false);
    expect(pending()).toBe(0);
  });

  it('stop() removes its listeners: later input changes nothing', () => {
    const { c, $ } = harness();
    c.start();
    c.stop();
    pointer('pointermove', $('plain'), 300, 200);
    expect(c.inspect().target).toEqual({ x: 24, y: innerHeight - 24 });
  });

  it('does not hide the native cursor when there is no 2D canvas', () => {
    const { c } = harness({ withContext: false });
    c.start();
    expect(html.classList.contains('stickman-cursor')).toBe(false);
  });

  it('before the first pointermove the ring is hidden and the figure stands at the anchor (24px, innerHeight − 24px)', () => {
    const { c, ring, rec, frames } = harness();
    c.start();
    frames(30);
    const anchor = { x: 24, y: innerHeight - 24 };
    expect(ring.style.visibility).toBe('hidden');
    expect(c.inspect().pos).toEqual(anchor);
    expect(rec.calls).toContainEqual(['translate', anchor.x, anchor.y]);
  });

  it('puts the ring exactly at the pointer and shows it on the first pointermove', () => {
    const { c, $, ring } = harness();
    c.start();
    pointer('pointermove', $('plain'), 300.5, 200);
    expect(ring.style.visibility).toBe('visible');
    expect(ring.style.transform).toBe('translate(300.5px, 200px)');
    expect(c.inspect().target).toEqual({ x: 300.5, y: 200 });
  });

  it('walks to the pointer and points once he rests on a target', () => {
    const { c, $, frames } = harness();
    c.start();
    pointer('pointermove', $('link'), 440, 40);
    frames(120);
    const snap = c.inspect();
    expect(snap.hover).toBe($('link'));
    expect(Math.hypot(snap.pos.x - 440, snap.pos.y - 40)).toBeLessThan(1.5);
    expect(snap.gestures.point).toBeGreaterThan(0.9);
  });

  it('keyboard focus moves the target', () => {
    const { c, $, frames } = harness();
    c.start();
    $('link').focus();
    frames(1);
    // just below-left of rect(400, 30, 80, 20): x = left − 0.4·size, y = bottom + 0.3·size
    expect(c.inspect().target.x).toBeCloseTo(400 - 12.8, 6);
    expect(c.inspect().target.y).toBeCloseTo(50 + 9.6, 6);
    frames(150);
    expect(c.inspect().gestures.point).toBeGreaterThan(0.9);
  });

  it('a pointermove after keyboard focus hands control back to the pointer', () => {
    const { c, $, frames } = harness();
    c.start();
    $('link').focus();
    frames(1);
    pointer('pointermove', $('plain'), 100, 100);
    frames(1);
    expect(c.inspect().target).toEqual({ x: 100, y: 100 });
  });

  it('a scroll event without pointermove re-resolves the target under the ring', () => {
    const { c, $, frames, elementFromPoint } = harness();
    c.start();
    pointer('pointermove', $('link'), 440, 40);
    frames(2);
    expect(c.inspect().hover).toBe($('link'));

    elementFromPoint.mockReturnValue($('plain'));
    window.dispatchEvent(new Event('scroll'));
    frames(1);
    expect(elementFromPoint).toHaveBeenLastCalledWith(440, 40);
    expect(c.inspect().hover).toBeNull();

    elementFromPoint.mockReturnValue($('other'));
    window.dispatchEvent(new Event('scroll'));
    frames(1);
    expect(c.inspect().hover).toBe($('other'));
  });

  it('a press on a target cheers, and the layer never cancels or stops the event', () => {
    const { c, $, frames } = harness();
    c.start();
    const seen = vi.fn();
    $('link').addEventListener('pointerdown', seen);
    const e = pointer('pointerdown', $('link'), 440, 40);
    expect(e.defaultPrevented).toBe(false);
    expect(seen).toHaveBeenCalledTimes(1);
    frames(1);
    expect(c.inspect().gestures.cheer).toBeGreaterThan(0.9);
  });

  it('a press on plain content does not cheer', () => {
    const { c, $, frames } = harness();
    c.start();
    pointer('pointerdown', $('plain'), 10, 10);
    frames(1);
    expect(c.inspect().gestures.cheer).toBe(0);
  });

  it('pauses the frame loop while the document is hidden and resumes after', () => {
    const { c, frames, pending } = harness();
    c.start();
    frames(1);
    setHidden(true);
    expect(pending()).toBe(0);
    setHidden(false);
    expect(pending()).toBe(1);
  });

  it('hovered-target rects are cached: read on pointermove, scroll, or resize, never per frame', () => {
    const { c, $, frames, elementFromPoint } = harness();
    const read = vi.spyOn($('link'), 'getBoundingClientRect');
    c.start();
    pointer('pointermove', $('link'), 440, 40);
    frames(20);
    expect(read).toHaveBeenCalledTimes(1);
    elementFromPoint.mockReturnValue($('link'));
    window.dispatchEvent(new Event('scroll'));
    frames(20);
    expect(read).toHaveBeenCalledTimes(2);
    window.dispatchEvent(new Event('resize'));
    frames(20);
    expect(read).toHaveBeenCalledTimes(3);
  });

  it('handoff places him where the loader left him, and he stays until the pointer moves', () => {
    const { c, frames } = harness();
    c.start();
    c.handoff({ x: 512, y: 400 });
    frames(60);
    expect(c.inspect().pos).toEqual({ x: 512, y: 400 });
  });

  it('sizes the canvas backing store for devicePixelRatio, capped at 2', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 3 });
    try {
      const { c, canvas } = harness();
      c.start();
      expect(canvas.width).toBe(innerWidth * 2);
      expect(canvas.height).toBe(innerHeight * 2);
      expect(canvas.style.width).toBe(`${innerWidth}px`);
    } finally {
      if (original) Object.defineProperty(window, 'devicePixelRatio', original);
    }
  });

  it('configure() changes the size he is drawn at', () => {
    const { c, rec, frames } = harness();
    c.start();
    c.configure({ size: 36 });
    rec.clear();
    frames(1);
    expect(rec.calls).toContainEqual(['scale', 0.9, 0.9]);
  });
});
