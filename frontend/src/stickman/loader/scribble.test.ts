// Owner: agent/stickman. TASK-203. The loader's scribble path: a seeded, smooth, looping curve.
import { describe, expect, it } from 'vitest';
import { createScribble } from './scribble';

const MS = 0.001;

describe('createScribble', () => {
  it('createScribble is deterministic per seed and stays inside the unit square for t ∈ [0, 10s]', () => {
    for (const seed of [1, 7, 42, 2026, 99991]) {
      const a = createScribble(seed);
      const b = createScribble(seed);
      let mismatches = 0;
      let outside = 0;
      for (let t = 0; t <= 10; t += MS) {
        const p = a(t);
        const q = b(t);
        if (p.x !== q.x || p.y !== q.y) mismatches++;
        if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) outside++;
      }
      expect(mismatches).toBe(0);
      expect(outside).toBe(0);
    }
  });

  it('different seeds draw different scribbles', () => {
    const a = createScribble(1);
    const b = createScribble(2);
    const differs = [0.5, 1.5, 3, 7].some((t) => a(t).x !== b(t).x || a(t).y !== b(t).y);
    expect(differs).toBe(true);
  });

  it('moves continuously: never more than 0.005 of the square per millisecond', () => {
    for (const seed of [3, 11, 31337]) {
      const s = createScribble(seed);
      let prev = s(0);
      let maxStep = 0;
      for (let t = MS; t <= 10; t += MS) {
        const p = s(t);
        maxStep = Math.max(maxStep, Math.hypot(p.x - prev.x, p.y - prev.y));
        prev = p;
      }
      expect(maxStep).toBeLessThan(0.005);
    }
  });

  it('loops like a hand scribbling: the heading turns through at least 3 full turns in 2s', () => {
    // A wandering Lissajous curve rarely curls back; a scribble keeps circling.
    for (let seed = 1; seed <= 50; seed++) {
      const s = createScribble(seed);
      let turn = 0;
      let prevHeading: number | null = null;
      const dt = 0.004;
      for (let t = 0; t < 2; t += dt) {
        const a = s(t);
        const b = s(t + dt);
        const heading = Math.atan2(b.y - a.y, b.x - a.x);
        if (prevHeading !== null) {
          let d = heading - prevHeading;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          turn += Math.abs(d);
        }
        prevHeading = heading;
      }
      expect(turn / (2 * Math.PI)).toBeGreaterThanOrEqual(3);
    }
  });

  it('fills the square like a ball of loops, not a line: extent over 0.5 on both axes in 10s', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = createScribble(seed);
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (let t = 0; t <= 10; t += 0.01) {
        const p = s(t);
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      expect(maxX - minX).toBeGreaterThan(0.5);
      expect(maxY - minY).toBeGreaterThan(0.5);
    }
  });
});
