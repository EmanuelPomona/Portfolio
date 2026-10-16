// Owner: agent/stickman. TASK-203. The loader's scribble path: a seeded, smooth, looping curve.
import { describe, expect, it } from 'vitest';
import { createScribble } from './scribble';

const MS = 0.001;

describe('createScribble', () => {
  it('createScribble is deterministic per seed and stays inside the unit square for t ∈ [0, 10s]', () => {
    for (const seed of [1, 7, 42, 2026, 99991]) {
      const a = createScribble(seed);
      const b = createScribble(seed);
      for (let t = 0; t <= 10; t += MS) {
        const p = a(t);
        expect(b(t)).toEqual(p);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
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
      for (let t = MS; t <= 10; t += MS) {
        const p = s(t);
        expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThan(0.005);
        prev = p;
      }
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
