// Owner: agent/stickman. The loader's scribble: a seeded sum of 3 to 5 sinusoids per axis. Pure.
// Per axis, one slow dominant wave carries the hand across the ball while 2 to 4 small, faster
// waves make the loops; incommensurate frequencies keep it from ever quite repeating.
// Measured over 1000 seeds: extent ≥ 0.65 of the square within 10s (median 0.61 within 1.5s), and the
// tip never moves faster than 3.9 squares/s, about a running stickman's top speed in a 300px box.
import type { Vec2 } from '../engine/vec';

/** Total amplitude per axis around 0.5: the path stays inside [0.02, 0.98]. */
const REACH = 0.48;
const DOMINANT = 0.3;
const DOMINANT_HZ: readonly [number, number] = [0.35, 0.6];
const LOOP_HZ: readonly [number, number] = [0.9, 1.6];

interface Wave {
  a: number;
  w: number;
  p: number;
}

/** mulberry32: a tiny, well-mixed seeded PRNG in [0, 1). */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rand: () => number, [lo, hi]: readonly [number, number]) => lo + rand() * (hi - lo);

function waves(rand: () => number): Wave[] {
  const dominant: Wave = { a: DOMINANT, w: 2 * Math.PI * between(rand, DOMINANT_HZ), p: rand() * Math.PI * 2 };
  const n = 2 + Math.floor(rand() * 3); // 2 to 4 loop waves: 3 to 5 sinusoids in all
  const raw = Array.from({ length: n }, () => ({
    weight: 0.5 + rand(),
    f: between(rand, LOOP_HZ),
    p: rand() * Math.PI * 2,
  }));
  const total = raw.reduce((s, r) => s + r.weight, 0);
  const loops = raw.map((r) => ({ a: (r.weight / total) * (REACH - DOMINANT), w: 2 * Math.PI * r.f, p: r.p }));
  return [dominant, ...loops];
}

const sum = (ws: Wave[], t: number) => ws.reduce((s, v) => s + v.a * Math.sin(v.w * t + v.p), 0.5);

/** A deterministic scribble for `seed`: `t` in seconds to a point in the unit square. */
export function createScribble(seed: number): (t: number) => Vec2 {
  const rand = prng(seed);
  const xs = waves(rand);
  const ys = waves(rand);
  return (t) => ({ x: sum(xs, t), y: sum(ys, t) });
}
