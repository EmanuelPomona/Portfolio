// Owner: agent/stickman. The desktop cursor: input wiring, the rAF loop, and the canvas
// (docs/API.md §2.3). React-free so the frame loop never touches React state.
//
// Layout reads are bounded: a hovered target's rect is read at most once per frame, and only after
// a pointermove, scroll, or resize. A scroll re-resolves the element under the ring (it can change
// without a pointermove). The layer never calls preventDefault or stops propagation.
import { stepGestures, type GestureState } from '../engine/gestures';
import { MAX_DT, MOVING_SPEED, PACES, stepMotion, type MotionState, type Pace } from '../engine/motion';
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

  const anchor = (): Vec2 => ({ x: ANCHOR_INSET, y: window.innerHeight - ANCHOR_INSET });
  let target = anchor();
  let s: MotionState = { pos: { ...target }, speed: 0, facing: 1, phase: 0, idle: 0 };
  let g: GestureState = { cheer: 0, point: 0, sit: 0 };

  let ctx: CanvasRenderingContext2D | null = null;
  let running = false;
  let rafId = 0;
  let last = 0;
  let clock = 0;
  let dpr = 1;

  let pointerSeen = false;
  let placed = false; // handoff() has placed him; do not drift back to the anchor
  let hover: Element | null = null;
  let hoverCenter: Vec2 | null = null;
  let focus: Element | null = null;
  let focusCenter: Vec2 | null = null;
  let rectsDirty = false;
  let scrollDirty = false;
  let pressed = false;

  const showRing = (on: boolean) => {
    ring.style.visibility = on ? 'visible' : 'hidden';
  };

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  };

  const onPointerMove = (e: PointerEvent) => {
    pointerSeen = true;
    focus = null;
    target = { x: e.clientX, y: e.clientY };
    ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    showRing(true);
    hover = findTarget(e.target instanceof Element ? e.target : null);
    rectsDirty = true;
  };

  const onPointerDown = (e: PointerEvent) => {
    const hit = findTarget(e.target instanceof Element ? e.target : null);
    if (!hit) return;
    pressed = true;
    if (hit !== hover) {
      hover = hit;
      rectsDirty = true;
    }
  };

  const onPointerOut = (e: PointerEvent) => {
    if (!e.relatedTarget) showRing(false); // the pointer left the window
  };

  const onScroll = () => {
    scrollDirty = true;
    rectsDirty = true;
  };

  const onResize = () => {
    resize();
    rectsDirty = true;
    if (!pointerSeen && !placed) target = anchor();
  };

  const onFocusIn = (e: FocusEvent) => {
    const el = e.target instanceof Element ? e.target : null;
    const hit = findTarget(el);
    focus = hit && el && isFocusVisible(el) ? hit : null;
    if (focus) rectsDirty = true;
  };

  const onFocusOut = (e: FocusEvent) => {
    if (!e.relatedTarget) focus = null;
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
    if (scrollDirty && pointerSeen && !focus) {
      hover = findTarget(env.elementFromPoint(target.x, target.y));
    }
    scrollDirty = false;
    if (!rectsDirty) return;
    rectsDirty = false;
    hoverCenter = hover ? center(hover.getBoundingClientRect()) : null;
    if (focus) {
      const r = focus.getBoundingClientRect();
      focusCenter = center(r);
      const half = size / 2;
      target = {
        x: Math.min(window.innerWidth - half, Math.max(half, r.left - 0.4 * size)),
        y: Math.min(window.innerHeight - 4, Math.max(size + 4, r.bottom + 0.3 * size)),
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

    if (pressed) s = { ...s, idle: 0 };
    // The prototype judges "arrived" on the distance before this frame's step.
    const dist = Math.hypot(target.x - s.pos.x, target.y - s.pos.y);
    s = stepMotion(s, target, dt, size, pace);
    g = stepGestures(
      g,
      s,
      { moving: s.speed > MOVING_SPEED, arrived: dist < 1.5 * size, onTarget: pointAt !== null, pressed },
      dt,
    );
    pressed = false;

    const angle = pointAt ? pointAngleTo(s, g, size, pointAt) : REST_POINT_ANGLE;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
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
      document.documentElement.classList.add(CURSOR_CLASS);
      showRing(pointerSeen);
      resize();
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
      document.documentElement.classList.remove(CURSOR_CLASS);
      showRing(false);
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
    handoff(at) {
      placed = true;
      s = { ...s, pos: { ...at }, speed: 0, idle: 0 };
      if (!pointerSeen) target = { ...at };
    },
    configure(o) {
      if (o.size !== undefined) size = o.size;
      if (o.pace !== undefined) pace = o.pace;
    },
    inspect() {
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
