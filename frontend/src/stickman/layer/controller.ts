// Owner: agent/stickman. The desktop cursor: input wiring, the rAF loop, and the canvas
// (docs/API.md §2.3). React-free so the frame loop never touches React state.
//
// Layout reads are bounded: a hovered target's rect is read at most once per frame, and only after
// a pointermove, scroll, or resize; the viewport size is cached on resize. A scroll or resize
// re-resolves the element under the ring (it can change without a pointermove). The native cursor
// is hidden only once the pointer has moved, so a still pointer is never left with nothing on it.
// The layer never calls preventDefault or stops propagation.
import { stepFigure, type Figure } from '../engine/figure';
import type { GestureState } from '../engine/gestures';
import { MAX_DT, PACES, type Pace } from '../engine/motion';
import { REST_POINT_ANGLE, computePose, lineWidthFor, pointAngleTo } from '../engine/pose';
import type { Vec2 } from '../engine/vec';
import { drawFigure } from '../render/drawFigure';
import { findTarget } from './targets';

export const CURSOR_CLASS = 'stickman-cursor';
/** Where he waits before the pointer has moved: bottom-left, clear of the content. */
export const ANCHOR_INSET = 24;

export interface ControllerEnv {
  now: () => number;
  raf: (cb: FrameRequestCallback) => number;
  cancelRaf: (id: number) => void;
  elementFromPoint: (x: number, y: number) => Element | null;
}

export interface CursorOptions {
  size: number;
  pace?: Pace;
  /** Stroke colour. White plus mix-blend-mode: difference keeps him legible on fog and black. */
  color?: string;
  env?: Partial<ControllerEnv>;
}

export interface CursorSnapshot {
  pos: Vec2;
  speed: number;
  facing: 1 | -1;
  gestures: GestureState;
  /** Where he is walking to. */
  target: Vec2;
  /** The target under the ring, or null. */
  hover: Element | null;
  /** The keyboard-focused target he is attending to, or null. */
  focus: Element | null;
  running: boolean;
}

export interface CursorController {
  start(): void;
  stop(): void;
  /** Places him at `at` (feet, CSS px). The loader calls this as he lets go of the pencil. */
  handoff(at: Vec2): void;
  configure(o: { size?: number; pace?: Pace }): void;
  inspect(): CursorSnapshot;
}

const center = (r: DOMRect): Vec2 => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
/** An element that left the document or is display: none has no box to walk to. */
const usable = (el: Element, r: DOMRect) => el.isConnected && (r.width > 0 || r.height > 0);

function isFocusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true; // engines without :focus-visible: treat focus as visible
  }
}

export function createCursorController(
  canvas: HTMLCanvasElement,
  ring: HTMLElement,
  opts: CursorOptions,
): CursorController {
  const env: ControllerEnv = {
    now: () => performance.now(),
    raf: (cb) => requestAnimationFrame(cb),
    cancelRaf: (id) => cancelAnimationFrame(id),
    elementFromPoint: (x, y) => document.elementFromPoint(x, y),
    ...opts.env,
  };
  let size = opts.size;
  let pace = opts.pace ?? PACES.hurry;
  const color = opts.color ?? '#fff';

  let vw = window.innerWidth;
  let vh = window.innerHeight;
  const anchor = (): Vec2 => ({ x: ANCHOR_INSET, y: vh - ANCHOR_INSET });
  let target = anchor();
  let fig: Figure = {
    motion: { pos: { ...target }, speed: 0, facing: 1, phase: 0, idle: 0 },
    target: { ...target },
    gestures: { cheer: 0, point: 0, sit: 0 },
  };

  let ctx: CanvasRenderingContext2D | null = null;
  let running = false;
  let rafId = 0;
  let last = 0;
  let clock = 0;
  let dpr = 1;
  let dprQuery: MediaQueryList | null = null;

  /** The true pointer position, once it has moved. */
  let pointer: Vec2 | null = null;
  let placed = false; // handoff() has placed him; do not drift back to the anchor
  let lastInput: 'key' | 'pointer' | null = null;
  let hover: Element | null = null;
  let hoverCenter: Vec2 | null = null;
  let focus: Element | null = null;
  let focusCenter: Vec2 | null = null;
  let rectsDirty = false;
  let hitTestDirty = false;
  let pressed = false;

  const showRing = (on: boolean) => {
    ring.style.visibility = on ? 'visible' : 'hidden';
  };

  const resize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
  };

  // Moving the window to a display with another pixel ratio fires no resize event.
  const onDprChange = () => {
    resize();
    watchDpr();
  };
  const watchDpr = () => {
    dprQuery?.removeEventListener('change', onDprChange);
    dprQuery = typeof window.matchMedia === 'function' ? window.matchMedia(`(resolution: ${dpr}dppx)`) : null;
    dprQuery?.addEventListener?.('change', onDprChange);
  };

  /** Back to the ring after keyboard focus ends; what is under the ring is looked up again. */
  const releaseFocus = () => {
    if (!focus) return;
    focus = null;
    focusCenter = null;
    if (pointer) {
      target = { ...pointer };
      hitTestDirty = true;
      rectsDirty = true;
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointer) document.documentElement.classList.add(CURSOR_CLASS);
    pointer = { x: e.clientX, y: e.clientY };
    lastInput = 'pointer';
    focus = null;
    focusCenter = null;
    target = { ...pointer };
    ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    showRing(true);
    hover = findTarget(e.target instanceof Element ? e.target : null);
    rectsDirty = true;
  };

  const onPointerDown = (e: PointerEvent) => {
    lastInput = 'pointer';
    const hit = findTarget(e.target instanceof Element ? e.target : null);
    if (!hit) return;
    pressed = true;
    if (hit !== hover) {
      hover = hit;
      rectsDirty = true;
    }
  };

  const onKeyDown = () => {
    lastInput = 'key';
  };

  const onPointerOut = (e: PointerEvent) => {
    if (!e.relatedTarget) showRing(false); // the pointer left the window
  };

  const onScroll = () => {
    hitTestDirty = true;
    rectsDirty = true;
  };

  const onResize = () => {
    resize();
    hitTestDirty = true;
    rectsDirty = true;
    if (!pointer && !placed) target = anchor();
  };

  const onFocusIn = (e: FocusEvent) => {
    const el = e.target instanceof Element ? e.target : null;
    const hit = findTarget(el);
    if (hit && el && isFocusVisible(el) && lastInput !== 'pointer') {
      focus = hit;
      rectsDirty = true;
    } else {
      releaseFocus();
    }
  };

  const onFocusOut = (e: FocusEvent) => {
    if (!e.relatedTarget) releaseFocus();
  };

  const schedule = () => {
    rafId = env.raf(frame);
  };

  const onVisibility = () => {
    if (!running) return;
    if (document.hidden) {
      env.cancelRaf(rafId);
      rafId = 0;
    } else if (!rafId) {
      last = env.now();
      schedule();
    }
  };

  function refreshRects() {
    if (hitTestDirty && pointer && !focus) {
      hover = findTarget(env.elementFromPoint(pointer.x, pointer.y));
    }
    hitTestDirty = false;
    if (!rectsDirty) return;
    rectsDirty = false;

    if (hover) {
      const r = hover.getBoundingClientRect();
      if (usable(hover, r)) hoverCenter = center(r);
      else {
        hover = null;
        hoverCenter = null;
      }
    } else hoverCenter = null;

    if (focus) {
      const r = focus.getBoundingClientRect();
      if (!usable(focus, r)) {
        releaseFocus();
        return;
      }
      focusCenter = center(r);
      const half = size / 2;
      target = {
        x: Math.min(vw - half, Math.max(half, r.left - 0.4 * size)),
        y: Math.min(vh - 4, Math.max(size + 4, r.bottom + 0.3 * size)),
      };
    } else focusCenter = null;
  }

  function frame(now: number) {
    if (!running || !ctx) return;
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt;

    refreshRects();
    const pointAt = focus ? focusCenter : hoverCenter;

    fig = stepFigure(fig, { target, onTarget: pointAt !== null, pressed }, dt, size, pace);
    pressed = false;

    const { motion: s, gestures: g } = fig;
    const angle = pointAt ? pointAngleTo(s, g, size, pointAt) : REST_POINT_ANGLE;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    drawFigure(ctx, computePose(s, g, angle, clock), s.pos, {
      size,
      facing: s.facing,
      lineWidth: lineWidthFor(size),
      color,
    });
    schedule();
  }

  const listen = (on: boolean) => {
    const m = on ? 'addEventListener' : 'removeEventListener';
    window[m]('pointermove', onPointerMove as EventListener, { passive: true, capture: true });
    window[m]('pointerdown', onPointerDown as EventListener, { passive: true, capture: true });
    window[m]('keydown', onKeyDown, { passive: true, capture: true });
    document[m]('pointerout', onPointerOut as EventListener, { passive: true });
    window[m]('scroll', onScroll, { passive: true, capture: true });
    window[m]('resize', onResize, { passive: true });
    document[m]('focusin', onFocusIn as EventListener);
    document[m]('focusout', onFocusOut as EventListener);
    document[m]('visibilitychange', onVisibility);
  };

  return {
    start() {
      if (running) return;
      ctx = canvas.getContext('2d');
      if (!ctx) return; // no canvas: keep the native cursor
      running = true;
      if (pointer) document.documentElement.classList.add(CURSOR_CLASS);
      showRing(pointer !== null);
      resize();
      watchDpr();
      listen(true);
      last = env.now();
      if (!document.hidden) schedule();
    },
    stop() {
      if (!running) return;
      running = false;
      env.cancelRaf(rafId);
      rafId = 0;
      listen(false);
      dprQuery?.removeEventListener('change', onDprChange);
      dprQuery = null;
      document.documentElement.classList.remove(CURSOR_CLASS);
      showRing(false);
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
    handoff(at) {
      placed = true;
      fig = { ...fig, motion: { ...fig.motion, pos: { ...at }, speed: 0, idle: 0 } };
      if (!pointer) target = { ...at };
    },
    configure(o) {
      if (o.size !== undefined) size = o.size;
      if (o.pace !== undefined) pace = o.pace;
    },
    inspect() {
      const { motion: s, gestures: g } = fig;
      return {
        pos: { ...s.pos },
        speed: s.speed,
        facing: s.facing,
        gestures: { ...g },
        target: { ...target },
        hover,
        focus,
        running,
      };
    },
  };
}
