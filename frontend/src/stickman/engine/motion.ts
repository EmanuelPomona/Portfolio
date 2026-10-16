// Owner: agent/stickman. The speed law and motion step, ported unchanged from the owner-approved
// prototype (docs/reference/stickman-cursor-spike.html, "hurries when far"). Pure: no DOM, no clock.
import { approach, type Vec2 } from './vec';

export interface MotionState {
  /** Feet position in CSS px. */
  pos: Vec2;
  /** Current speed in px/s. */
  speed: number;
  facing: 1 | -1;
  /** Stride phase in radians; advances with distance walked relative to size. */
  phase: number;
  /** Seconds since he last moved. */
  idle: number;
}

/** Within this distance (px) he wants no speed at all: he has arrived. */
export const ARRIVE_PX = 1.2;
/** Above this speed (px/s) he counts as moving: idle resets, he cannot point. */
export const MOVING_SPEED = 8;
/** The frame loop clamps dt to this (s), so a stalled tab does not teleport him. */
export const MAX_DT = 0.05;

const MAX_SPEED = 1150;
const BASE_SPEED = 150;
const SPEED_PER_PX = 2.4;
const NEAR_GAIN = 7;
const SPEED_EASE = 10;
const FACE_DEADZONE_PX = 1.5;
const FACE_MIN_SPEED = 6;

export function desiredSpeed(distance: number): number {
  if (distance <= ARRIVE_PX) return 0;
  return Math.min(Math.min(MAX_SPEED, BASE_SPEED + SPEED_PER_PX * distance), NEAR_GAIN * distance);
}

export function stepMotion(s: MotionState, target: Vec2, dt: number, size: number): MotionState {
  const dx = target.x - s.pos.x;
  const dy = target.y - s.pos.y;
  const dist = Math.hypot(dx, dy);

  const speed = approach(s.speed, desiredSpeed(dist), SPEED_EASE, dt);

  let pos = s.pos;
  if (dist > 0.01) {
    const step = Math.min(dist, speed * dt);
    pos = { x: s.pos.x + (dx / dist) * step, y: s.pos.y + (dy / dist) * step };
  }

  const facing: 1 | -1 =
    Math.abs(dx) > FACE_DEADZONE_PX && speed > FACE_MIN_SPEED ? (dx > 0 ? 1 : -1) : s.facing;
  const moving = speed > MOVING_SPEED;

  return {
    pos,
    speed,
    facing,
    phase: s.phase + (speed * dt) / (size * 0.5),
    idle: moving ? 0 : s.idle + dt,
  };
}
