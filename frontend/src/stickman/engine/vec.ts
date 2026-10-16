// Owner: agent/stickman. Tiny 2D helpers shared by the engine, renderer, and layers.

export interface Vec2 {
  x: number;
  y: number;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Exponential-style ease used throughout the prototype: `v += (target − v)·min(1, rate·dt)`. */
export const approach = (v: number, target: number, rate: number, dt: number): number =>
  v + (target - v) * Math.min(1, rate * dt);
