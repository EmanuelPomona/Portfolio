// Owner: agent/stickman. The loader's scribble: a seeded sum of 3 to 5 sinusoids per axis. Pure.
//
// It is built the way a hand scribbles. One loop wave shares its frequency across both axes a
// quarter-cycle apart, so the tip circles (the loops of the owner's wireframe); a slower drift per
// axis carries the circling around the ball; a small fast wobble and 0 to 2 slow wander terms keep it
// from ever quite repeating. (Independent per-axis frequencies alone give wandering Lissajous curves
// that rarely curl back.) Worst-case tip speed ≈ 4.75 squares/s, under the 5/s smoothness bound.
import type { Vec2 } from '../engine/vec';

/** Loop radius (fraction of the square) and loops per second. */
const LOOP = 0.16;
const LOOP_HZ: readonly [number, number] = [1.9, 2.5];
/** The circling drifts around the ball. */
const DRIFT = 0.24;
const DRIFT_HZ: readonly [number, number] = [0.45, 0.75];
/** A small fast wobble on the loop, like a hand's tremor. */
const WOBBLE = 0.04;
const WOBBLE_HZ: readonly [number, number] = [3, 4];
/** Up to two slow wander terms. Total amplitude ≤ 0.48: the path stays inside [0.02, 0.98]. */
const WANDER = 0.02;
const WANDER_HZ: readonly [number, number] = [0.2, 0.4];

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
const TAU = Math.PI * 2;

const sum = (ws: Wave[], t: number) => ws.reduce((s, v) => s + v.a * Math.sin(v.w * t + v.p), 0.5);

/** A deterministic scribble for `seed`: `t` in seconds to a point in the unit square. */
export function createScribble(seed: number): (t: number) => Vec2 {
  const rand = prng(seed);
  const turn = rand() < 0.5 ? 1 : -1; // clockwise or not
  const quarter = (turn * Math.PI) / 2;

  const loopW = TAU * between(rand, LOOP_HZ);
  const loopP = rand() * TAU;
  const wobbleW = TAU * between(rand, WOBBLE_HZ);
  const wobbleP = rand() * TAU;
  const axis = (offset: number): Wave[] => {
    const waves: Wave[] = [
      { a: LOOP, w: loopW, p: loopP + offset },
      { a: DRIFT, w: TAU * between(rand, DRIFT_HZ), p: rand() * TAU },
      { a: WOBBLE, w: wobbleW, p: wobbleP + offset },
    ];
    const extra = Math.floor(rand() * 3); // 0 to 2: 3 to 5 sinusoids in all
    for (let i = 0; i < extra; i++) waves.push({ a: WANDER, w: TAU * between(rand, WANDER_HZ), p: rand() * TAU });
    return waves;
  };
  const xs = axis(0);
  const ys = axis(quarter);
  return (t) => ({ x: sum(xs, t), y: sum(ys, t) });
}
