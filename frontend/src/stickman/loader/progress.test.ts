// Owner: agent/stickman. TASK-203. Loader progress and timing rules (docs/API.md §2.2).
// Expected values are hand-derived; see the arithmetic in the comments.
import { describe, expect, it } from 'vitest';
import { CAP_MS, EXIT_MS, FADE_MS, MIN_MS, exitAt, fadeExitAt, progressAt } from './progress';

describe('progressAt', () => {
  it('progressAt rises to ~90 at 2200ms and holds without ready', () => {
    // ease-out rise 90·(1 − (1 − t/2200)³)
    expect(progressAt(0, null)).toBe(0);
    expect(progressAt(1100, null)).toBeCloseTo(78.75, 9); // 90·(1 − 0.125)
    expect(progressAt(1200, null)).toBeLessThan(90); // still drawing toward 90 after 1.2s
    expect(progressAt(2200, null)).toBeCloseTo(90, 9);
    expect(progressAt(3000, null)).toBeCloseTo(90, 9);
    expect(progressAt(4500, null)).toBeCloseTo(90, 9);
  });

  it('progressAt reaches 100 within 250ms of ready', () => {
    // ready at 500: base = 90·(1 − (17/22)³) = 90·5735/10648 = 48.4739…; halfway at 625
    const base = (90 * 5735) / 10648;
    expect(progressAt(500, 500)).toBeCloseTo(base, 9);
    expect(progressAt(625, 500)).toBeCloseTo(base + (100 - base) / 2, 9);
    expect(progressAt(750, 500)).toBe(100);
    expect(progressAt(4000, 500)).toBe(100);
    // ready during the hold: from 90 to 100 over 250ms
    expect(progressAt(3125, 3000)).toBeCloseTo(95, 9);
    expect(progressAt(3250, 3000)).toBe(100);
  });

  it('before ready settles it follows the rise, even if ready is known to come later', () => {
    expect(progressAt(1100, 1500)).toBeCloseTo(78.75, 9);
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
    [100, null, 2200], // min(4500, max(2200, 350))
    [2000, null, 2250],
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

describe('the cap', () => {
  it('the cap is still 4500ms from mount', () => {
    expect(CAP_MS).toBe(4500);
    expect(exitAt({ readyAt: null, skippedAt: null })).toBe(4500);
    expect(exitAt({ readyAt: 9000, skippedAt: null })).toBe(4500);
  });
});

describe('timing constants', () => {
  it('keep the contract: onDone within 5s at the cap, exit at most 600ms, fade at most 300ms', () => {
    expect(MIN_MS).toBe(2200);
    expect(exitAt({ readyAt: null, skippedAt: null }) + EXIT_MS).toBeLessThanOrEqual(5000);
    expect(EXIT_MS).toBeLessThanOrEqual(600);
    expect(FADE_MS).toBeLessThanOrEqual(300);
  });
});
