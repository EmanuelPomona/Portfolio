// Owner: agent/stickman. TASK-203. Loader progress and timing rules (docs/API.md §2.2).
// Expected values are hand-derived; see the arithmetic in the comments.
import { describe, expect, it } from 'vitest';
import { CAP_MS, EXIT_MS, FADE_MS, MIN_MS, exitAt, fadeExitAt, progressAt } from './progress';

describe('progressAt', () => {
  it('progressAt hits ~90 at 1200ms and holds without ready', () => {
    // ease-out rise 90·(1 − (1 − t/1200)³)
    expect(progressAt(0, null)).toBe(0);
    expect(progressAt(600, null)).toBeCloseTo(78.75, 9); // 90·(1 − 0.125)
    expect(progressAt(1200, null)).toBeCloseTo(90, 9);
    expect(progressAt(3000, null)).toBeCloseTo(90, 9);
    expect(progressAt(4500, null)).toBeCloseTo(90, 9);
  });

  it('progressAt reaches 100 within 250ms of ready', () => {
    // ready at 500: base = 90·(1 − (7/12)³) = 90·1385/1728 = 72.1354…; halfway at 625
    const base = (90 * 1385) / 1728;
    expect(progressAt(500, 500)).toBeCloseTo(base, 9);
    expect(progressAt(625, 500)).toBeCloseTo(base + (100 - base) / 2, 9);
    expect(progressAt(750, 500)).toBe(100);
    expect(progressAt(4000, 500)).toBe(100);
    // ready during the hold: from 90 to 100 over 250ms
    expect(progressAt(2125, 2000)).toBeCloseTo(95, 9);
    expect(progressAt(2250, 2000)).toBe(100);
  });

  it('before ready settles it follows the rise, even if ready is known to come later', () => {
    expect(progressAt(600, 900)).toBeCloseTo(78.75, 9);
  });

  it('a hero already decoded at mount sprints to 100 in 250ms', () => {
    expect(progressAt(0, 0)).toBe(0);
    expect(progressAt(250, 0)).toBe(100);
  });

  it('never decreases and stays within 0 to 100', () => {
    for (const readyAt of [null, 0, 300, 1199, 1200, 2500, 4400]) {
      let prev = -1;
      for (let t = 0; t <= 5000; t += 25) {
        const p = progressAt(t, readyAt);
        expect(p).toBeGreaterThanOrEqual(prev);
        expect(p).toBeLessThanOrEqual(100);
        prev = p;
      }
    }
  });
});

describe('exitAt', () => {
  it.each([
    [100, null, 1200], // min(4500, max(1200, 350))
    [3000, null, 3250],
    [null, null, 4500],
    [null, 500, 500],
    [5000, null, 4500],
    [100, 300, 300], // a skip wins over everything, even before the minimum
  ] as const)('exitAt table: readyAt=%s skippedAt=%s -> %s', (readyAt, skippedAt, expected) => {
    expect(exitAt({ readyAt, skippedAt })).toBe(expected);
  });
});

describe('fadeExitAt (reduced motion)', () => {
  it.each([
    [0, null, 0], // fades as soon as the hero is ready: no minimum
    [3000, null, 3000],
    [null, null, 4500], // the cap still applies
    [6000, null, 4500],
    [3000, 200, 200],
  ] as const)('readyAt=%s skippedAt=%s -> %s', (readyAt, skippedAt, expected) => {
    expect(fadeExitAt({ readyAt, skippedAt })).toBe(expected);
  });
});

describe('timing constants', () => {
  it('keep the contract: onDone within 5s at the cap, exit at most 600ms, fade at most 300ms', () => {
    expect(MIN_MS).toBe(1200);
    expect(CAP_MS).toBe(4500);
    expect(exitAt({ readyAt: null, skippedAt: null }) + EXIT_MS).toBeLessThanOrEqual(5000);
    expect(EXIT_MS).toBeLessThanOrEqual(600);
    expect(FADE_MS).toBeLessThanOrEqual(300);
  });
});
