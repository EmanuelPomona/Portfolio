// Owner: agent/stickman. The loader stickman is led by his own pencil: the tip traces the scribble
// exactly, and his stride, speed, and facing are derived from how the tip moves. (The cursor's
// speed law would lag a fast scribble by up to ~190px, so it cannot be used here.) Pure.
import type { MotionState } from '../engine/motion';
import { PENCIL_TIP, RIG_UNITS } from '../engine/pose';
import { approach, type Vec2 } from '../engine/vec';

export interface Follow {
  /** pos is the pencil tip on screen; the rest drives the gait as for the cursor. */
  motion: MotionState;
  /** −1..1: eases toward facing, so his feet swing around the planted tip instead of jumping. */
  swing: number;
}

const SPEED_EASE = 10; // the engine's rate
const SWING_EASE = 12;
/** Horizontal speed needed to face a new way: 1.5px per frame at 60 fps, as in the engine. */
const FACE_VX = 90;
const FACE_MIN_SPEED = 6;

export function startFollow(tip: Vec2): Follow {
  return { motion: { pos: { ...tip }, speed: 0, facing: 1, phase: 0, idle: 0 }, swing: 1 };
}

export function followTip(f: Follow, tip: Vec2, dt: number, size: number): Follow {
  if (dt <= 0) return f;
  const vx = (tip.x - f.motion.pos.x) / dt;
  const vy = (tip.y - f.motion.pos.y) / dt;
  const speed = approach(f.motion.speed, Math.hypot(vx, vy), SPEED_EASE, dt);
  const facing: 1 | -1 =
    Math.abs(vx) > FACE_VX && speed > FACE_MIN_SPEED ? (vx > 0 ? 1 : -1) : f.motion.facing;
  return {
    motion: {
      pos: { ...tip },
      speed,
      facing,
      phase: f.motion.phase + (speed * dt) / (size * 0.5),
      idle: 0,
    },
    swing: approach(f.swing, facing, SWING_EASE, dt),
  };
}

/** His feet on screen: a pencil-reach behind the tip, mirrored smoothly by swing. */
export function feetFor(f: Follow, size: number): Vec2 {
  const k = size / RIG_UNITS;
  return { x: f.motion.pos.x - PENCIL_TIP.x * k * f.swing, y: f.motion.pos.y - PENCIL_TIP.y * k };
}
