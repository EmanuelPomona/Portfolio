// Owner: agent/stickman. The loader's drawing: the stickman runs the scribble with his large pencil,
// and the line is laid down where its tip goes (docs/API.md §2.2, wireframe 1).
//
// Two canvases. The scribble canvas is NEVER cleared: each frame adds only the new stretch of line,
// in several low-opacity passes (the franceszhao.ca graphite technique). The figure canvas is redrawn
// every frame. Timing never depends on this rAF loop; the Loader exits through timers.
import { MAX_DT } from '../engine/motion';
import { REST_POINT_ANGLE, computePose, holdPencil, lineWidthFor, RIG_UNITS } from '../engine/pose';
import type { Vec2 } from '../engine/vec';
import { drawFigure, strokePencil } from '../render/drawFigure';
import { feetFor, followTip, startFollow, type Follow } from './follow';
import { createScribble } from './scribble';

export const INK = '#242424';
export const GRAPHITE_PASSES = 3;
const GRAPHITE_ALPHA = 0.85;
const GRAPHITE_WIDTH = 1.35;
/** Sub-pixel offsets per pass: three slightly misregistered strokes read as graphite, not vector. */
const PASS_OFFSETS: readonly Vec2[] = [
  { x: 0, y: 0 },
  { x: 0.35, y: -0.3 },
  { x: -0.3, y: 0.35 },
];
/** Sample the path finely so a slow frame still draws a curve, not a chord. */
const SUBSTEP_S = 1 / 240;
/** The pencil falls for this long after he lets go (within the Loader's exit). */
export const DROP_MS = 320;
const NO_GESTURE = { cheer: 0, point: 0, sit: 0 } as const;

/** Per-pass alpha so that k passes compound to a: p = 1 − (1 − a)^(1/k). */
export function graphitePassAlpha(a: number, k: number): number {
  return 1 - (1 - a) ** (1 / k);
}

export interface ArtistEnv {
  now: () => number;
  raf: (cb: FrameRequestCallback) => number;
  cancelRaf: (id: number) => void;
}

export interface ArtistOptions {
  scribble: HTMLCanvasElement;
  figure: HTMLCanvasElement;
  /** An element whose box is where the pencil tip may travel. Read on start and resize only. */
  stage: HTMLElement;
  seed: number;
  /** Figure height in CSS px. */
  size: number;
  env?: Partial<ArtistEnv>;
}

export interface LoaderArtist {
  start(): void;
  /** He lets go of the pencil. Returns his feet on screen, for the cursor handoff. Idempotent. */
  letGo(): Vec2;
  stop(): void;
}

export function createLoaderArtist(o: ArtistOptions): LoaderArtist {
  const env: ArtistEnv = {
    now: () => performance.now(),
    raf: (cb) => requestAnimationFrame(cb),
    cancelRaf: (id) => cancelAnimationFrame(id),
    ...o.env,
  };
  const sctx = o.scribble.getContext('2d');
  const fctx = o.figure.getContext('2d');
  const path = createScribble(o.seed);
  const size = o.size;
  const k = size / RIG_UNITS;
  const passAlpha = graphitePassAlpha(GRAPHITE_ALPHA, GRAPHITE_PASSES);

  let box = { left: 0, top: 0, width: 0, height: 0 };
  let dpr = 1;
  let vw = 0;
  let vh = 0;
  const toScreen = (p: Vec2): Vec2 => ({ x: box.left + p.x * box.width, y: box.top + p.y * box.height });

  let t = 0; // scribble time, s
  let clock = 0;
  let last: number | null = null;
  let rafId = 0;
  let running = false;
  let follow: Follow = startFollow({ x: 0, y: 0 });
  let tip: Vec2 = { x: 0, y: 0 };
  let dropped: { at: number; feet: Vec2; facing: 1 | -1; mirror: number; tip: Vec2; top: Vec2 } | null = null;

  const measure = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = window.innerWidth;
    vh = window.innerHeight;
    for (const c of [o.scribble, o.figure]) {
      c.width = Math.round(vw * dpr);
      c.height = Math.round(vh * dpr);
      c.style.width = `${vw}px`;
      c.style.height = `${vh}px`;
    }
    const r = o.stage.getBoundingClientRect();
    box = { left: r.left, top: r.top, width: r.width, height: r.height };
    tip = toScreen(path(t));
    follow = { ...follow, motion: { ...follow.motion, pos: { ...tip } } };
  };

  const facingOf = (f: Follow): 1 | -1 => (f.swing >= 0 ? 1 : -1);
  /** The paper figure turns edge-on through the swing; never exactly 0 (a degenerate transform). */
  const mirrorOf = (f: Follow): number => facingOf(f) * Math.max(0.02, Math.abs(f.swing));

  function drawSegment(points: Vec2[]) {
    if (!sctx || points.length === 0) return;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.strokeStyle = INK;
    sctx.lineWidth = GRAPHITE_WIDTH;
    sctx.lineCap = 'round';
    sctx.lineJoin = 'round';
    sctx.globalAlpha = passAlpha;
    for (const off of PASS_OFFSETS.slice(0, GRAPHITE_PASSES)) {
      sctx.beginPath();
      sctx.moveTo(tip.x + off.x, tip.y + off.y);
      for (const p of points) sctx.lineTo(p.x + off.x, p.y + off.y);
      sctx.stroke();
    }
    sctx.globalAlpha = 1;
  }

  function drawFallingPencil(ms: number) {
    if (!fctx || !dropped) return;
    const u = Math.min(1, ms / DROP_MS);
    if (u >= 1) return;
    const fall = u * u; // gravity: ease-in
    const len = Math.hypot(dropped.top.x - dropped.tip.x, dropped.top.y - dropped.tip.y);
    const start = Math.atan2(dropped.tip.x - dropped.top.x, dropped.tip.y - dropped.top.y);
    // Rotate about the planted tip until the shaft lies flat behind him.
    const lean = start + (Math.PI / 2 - start) * fall;
    const top = { x: dropped.tip.x - Math.sin(lean) * len, y: dropped.tip.y - Math.cos(lean) * len };
    fctx.save();
    fctx.translate(dropped.feet.x, dropped.feet.y);
    fctx.scale(k * dropped.mirror, k);
    fctx.globalAlpha = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
    fctx.strokeStyle = INK;
    fctx.lineCap = 'round';
    fctx.lineJoin = 'round';
    fctx.lineWidth = lineWidthFor(size) / k;
    strokePencil(fctx, dropped.tip, top);
    fctx.restore();
  }

  function frame(ts: number) {
    if (!running) return;
    const dt = last === null ? 0 : Math.min(MAX_DT, Math.max(0, (ts - last) / 1000));
    last = ts;
    clock += dt;

    if (dt > 0 && !dropped) {
      const points: Vec2[] = [];
      const end = t + dt;
      while (t < end) {
        t = Math.min(end, t + SUBSTEP_S);
        points.push(toScreen(path(t)));
      }
      drawSegment(points);
      tip = points[points.length - 1] ?? tip;
      follow = followTip(follow, tip, dt, size);
    } else if (dt > 0) {
      follow = followTip(follow, follow.motion.pos, dt, size); // he stands; his stride settles
    }

    if (fctx) {
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.clearRect(0, 0, vw, vh);
      const pose = computePose(follow.motion, NO_GESTURE, REST_POINT_ANGLE, clock);
      drawFigure(fctx, pose, dropped ? dropped.feet : feetFor(follow, size), {
        size,
        facing: dropped ? dropped.facing : facingOf(follow),
        mirror: dropped ? dropped.mirror : mirrorOf(follow),
        lineWidth: lineWidthFor(size),
        color: INK,
        pencil: !dropped,
      });
      if (dropped) drawFallingPencil(env.now() - dropped.at);
    }
    rafId = env.raf(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      measure();
      follow = startFollow(tip);
      window.addEventListener('resize', measure, { passive: true });
      rafId = env.raf(frame);
    },
    letGo() {
      if (!dropped) {
        const pose = holdPencil(computePose(follow.motion, NO_GESTURE, REST_POINT_ANGLE, clock));
        dropped = {
          at: env.now(),
          feet: feetFor(follow, size),
          facing: facingOf(follow),
          mirror: mirrorOf(follow),
          tip: pose.pencil.tip,
          top: pose.pencil.top,
        };
      }
      return { ...dropped.feet };
    },
    stop() {
      running = false;
      env.cancelRaf(rafId);
      rafId = 0;
      window.removeEventListener('resize', measure);
    },
  };
}
