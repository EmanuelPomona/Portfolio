// Owner: agent/stickman. TASK-202 (S-07). The activation matrix of docs/API.md §2.3, all 2^5 rows.
import { describe, expect, it } from 'vitest';
import { resolveActivation } from './activation';

// fine, coarse, reducedMotion, forcedColors, touch -> expected
// API.md's rows are evaluated in order: the desktop row first, then the touch row, else off.
// (pointer: fine) and (pointer: coarse) describe the primary pointer, so both true does not occur in
// a browser; those rows only document the evaluation order.
const T = true;
const F = false;
const TABLE: Array<[boolean, boolean, boolean, boolean, boolean, 'desktop' | 'touch' | 'off']> = [
  // fine pointer: desktop unless reduced motion or forced colors
  [T, F, F, F, F, 'desktop'],
  [T, F, F, F, T, 'desktop'],
  [T, F, F, T, F, 'off'],
  [T, F, F, T, T, 'off'],
  [T, F, T, F, F, 'off'],
  [T, F, T, F, T, 'off'],
  [T, F, T, T, F, 'off'],
  [T, F, T, T, T, 'off'],
  // coarse pointer: the touch walker only when allowed, motion is allowed, and colors are not forced
  [F, T, F, F, F, 'off'],
  [F, T, F, F, T, 'touch'],
  [F, T, F, T, F, 'off'],
  [F, T, F, T, T, 'off'], // forced colors exclude the walker too (API.md §2.3, integration round 1)
  [F, T, T, F, F, 'off'],
  [F, T, T, F, T, 'off'],
  [F, T, T, T, F, 'off'],
  [F, T, T, T, T, 'off'],
  // no pointer at all (pointer: none): never
  [F, F, F, F, F, 'off'],
  [F, F, F, F, T, 'off'],
  [F, F, F, T, F, 'off'],
  [F, F, F, T, T, 'off'],
  [F, F, T, F, F, 'off'],
  [F, F, T, F, T, 'off'],
  [F, F, T, T, F, 'off'],
  [F, F, T, T, T, 'off'],
  // both reported (not a real browser state): the desktop row is checked first
  [T, T, F, F, F, 'desktop'],
  [T, T, F, F, T, 'desktop'],
  [T, T, F, T, F, 'off'],
  [T, T, F, T, T, 'off'],
  [T, T, T, F, F, 'off'],
  [T, T, T, F, T, 'off'],
  [T, T, T, T, F, 'off'],
  [T, T, T, T, T, 'off'],
];

describe('resolveActivation table', () => {
  it('covers all 32 combinations', () => {
    expect(new Set(TABLE.map((r) => r.slice(0, 5).join())).size).toBe(32);
  });

  it.each(TABLE)(
    'fine=%s coarse=%s reduced=%s forced=%s touch=%s -> %s',
    (fine, coarse, reducedMotion, forcedColors, touch, expected) => {
      expect(resolveActivation({ fine, coarse, reducedMotion, forcedColors, touch })).toBe(expected);
    },
  );
});
