// Owner: agent/stickman. The touch walker (docs/API.md §2.3), behind flags.touchStickman, which stays
// false until the owner approves it in the lab. He stands about 24px tall on the bottom edge, walks
// while the page scrolls, runs to the x of a tap, and cheers when the tap hit a target. Every listener
// is passive and the canvas is pointer-events: none, so he never blocks a tap or a scroll.
import { stepFigure, type Figure } from '../engine/figure';
import { MAX_DT, type MotionState } from '../engine/motion';
import { REST_POINT_ANGLE, computePose, lineWidthFor } from '../engine/pose';
import { approach, clamp, type Vec2 } from '../engine/vec';
import { drawFigure } from '../render/drawFigure';
import { findTarget } from './targets';

export const TOUCH_SIZE = 24;
/** Keep his feet this far in from the left and right edges. */
const EDGE = 16;
const SCROLL_GAIN = 0.25;
const MAX_WALK = 180;
/** stepMotion's near law is desired = 7·d, so a target v/7 ahead walks him at v. */
const NEAR_GAIN = 7;
/** Scroll speed eases toward 0 at this rate once scrolling stops. */
const SCROLL_SETTLE = 8;
const SCROLL_STALE_MS = 120;
/** His feet stand this far above the bottom edge (and the safe area). */
const FOOT_GAP = 6;

export interface TouchInput {
  /** Page scroll speed in px/s; the sign does not matter. */
  scrollVelocity: number;
  /** A pending tap's x, until he gets there; null for none. */
  tapX: number | null;
  viewportWidth: number;
}

/** The next target on his bottom line. */
export function touchTarget(s: MotionState, input: TouchInput, _dt: number): Vec2 {
  const lo = EDGE;
  const hi = input.viewportWidth - EDGE;
  if (input.tapX !== null) return { x: clamp(input.tapX, lo, hi), y: s.pos.y };
  const walk = Math.min(Math.abs(input.scrollVelocity) * SCROLL_GAIN, MAX_WALK);
  if (walk < 1) return { x: s.pos.x, y: s.pos.y };
  const lead = walk / NEAR_GAIN;
  let dir = s.facing;
  if (dir > 0 && s.pos.x + lead > hi) dir = -1;
  else if (dir < 0 && s.pos.x - lead < lo) dir = 1;
  return { x: clamp(s.pos.x + dir * lead, lo, hi), y: s.pos.y };
}

/** Farther than this between touchstart and touchend is a drag (a scroll), not a tap. */
const TAP_SLOP = 10;

/** A touch that ends where it began is a tap; anything that travelled was a scroll. */
export function isTap(start: Vec2, end: Vec2): boolean {
  return Math.hypot(end.x - start.x, end.y - start.y) < TAP_SLOP;
}

export interface TouchWalker {
  start(): void;
  stop(): void;
}

export function createTouchWalker(canvas: HTMLCanvasElement, opts: { size?: number } = {}): TouchWalker {
  const size = opts.size ?? TOUCH_SIZE;
  let ctx: CanvasRenderingContext2D | null = null;
  let running = false;
  let rafId = 0;
  let last = 0;
  let clock = 0;
  let dpr = 1;
  let vw = 0;
  let vh = 0;
  let safeBottom = 0;
  let probe: HTMLDivElement | null = null;

  let fig: Figure = {
    motion: { pos: { x: 24, y: 0 }, speed: 0, facing: 1, phase: 0, idle: 0 },
    gestures: { cheer: 0, point: 0, sit: 0 },
  };
  let tapX: number | null = null;
  let pressed = false;
  let scrollVelocity = 0;
  let lastScrollY = 0;
  let lastScrollAt = 0;

  const line = () => vh - safeBottom - FOOT_GAP;

  const measure = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    safeBottom = probe ? parseFloat(getComputedStyle(probe).paddingBottom) || 0 : 0;
    // A rotation can leave him off-screen; keep him inside the new width.
    const x = clamp(fig.motion.pos.x, EDGE, Math.max(EDGE, vw - EDGE));
    fig = { ...fig, motion: { ...fig.motion, pos: { x, y: fig.motion.pos.y } } };
  };

  const onScroll = () => {
    const now = performance.now();
    const dt = Math.max(1, now - lastScrollAt) / 1000;
    const v = (window.scrollY - lastScrollY) / dt;
    scrollVelocity = lastScrollAt === 0 ? 0 : approach(scrollVelocity, v, 12, dt);
    lastScrollY = window.scrollY;
    lastScrollAt = now;
  };

  let touchFrom: { at: Vec2; onTarget: boolean } | null = null;
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchFrom = t
      ? { at: { x: t.clientX, y: t.clientY }, onTarget: findTarget(e.target instanceof Element ? e.target : null) !== null }
      : null;
  };
  // Commit on touchend, and only for a tap: every drag-scroll also begins with a touchstart.
  const onTouchEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    const from = touchFrom;
    touchFrom = null;
    if (!t || !from || !isTap(from.at, { x: t.clientX, y: t.clientY })) return;
    tapX = t.clientX;
    if (from.onTarget) pressed = true;
  };
  const onTouchCancel = () => {
    touchFrom = null;
  };

  const onVisibility = () => {
    if (!running) return;
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (!rafId) {
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  };

  function frame(now: number) {
    if (!running || !ctx) return;
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt;
    if (now - lastScrollAt > SCROLL_STALE_MS) scrollVelocity = approach(scrollVelocity, 0, SCROLL_SETTLE, dt);

    fig = { ...fig, motion: { ...fig.motion, pos: { x: fig.motion.pos.x, y: line() } } };
    const target = touchTarget(fig.motion, { scrollVelocity, tapX, viewportWidth: vw }, dt);
    fig = stepFigure(fig, { target, onTarget: false, pressed }, dt, size);
    pressed = false;
    if (tapX !== null && Math.abs(fig.motion.pos.x - target.x) < 1.5) tapX = null;

    const { motion: s, gestures: g } = fig;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    drawFigure(ctx, computePose(s, g, REST_POINT_ANGLE, clock), s.pos, {
      size,
      facing: s.facing,
      lineWidth: lineWidthFor(size),
      color: '#fff',
    });
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      ctx = canvas.getContext('2d');
      if (!ctx) return;
      running = true;
      probe = document.createElement('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText =
        'position:fixed;left:0;bottom:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom)';
      document.body.appendChild(probe);
      measure();
      fig = { ...fig, motion: { ...fig.motion, pos: { x: 24, y: line() } } };
      lastScrollY = window.scrollY;
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
      window.addEventListener('touchcancel', onTouchCancel, { passive: true, capture: true });
      window.addEventListener('resize', measure, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      last = performance.now();
      if (!document.hidden) rafId = requestAnimationFrame(frame);
    },
    stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', onTouchCancel, { capture: true });
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', onVisibility);
      probe?.remove();
      probe = null;
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
