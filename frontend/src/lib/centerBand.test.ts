import { describe, expect, it } from 'vitest';
import { inCenterBand } from './centerBand';

// The task's table. With vh = 800 and the default band 0.4, the band is [240, 560].
describe('inCenterBand', () => {
  it.each([
    { name: 'midpoint at center', rect: { top: 300, bottom: 500 }, expected: true },
    { name: 'midpoint at 100', rect: { top: 0, bottom: 200 }, expected: false },
    { name: 'midpoint at 560', rect: { top: 520, bottom: 600 }, expected: true },
    { name: 'midpoint at 600', rect: { top: 560, bottom: 640 }, expected: false },
  ])('$name -> $expected', ({ rect, expected }) => {
    expect(inCenterBand(rect, 800)).toBe(expected);
  });

  it('includes the band top edge (midpoint at 240)', () => {
    expect(inCenterBand({ top: 200, bottom: 280 }, 800)).toBe(true);
  });

  it('honors a custom band width', () => {
    // band 0.2 on 800 -> [320, 480]
    expect(inCenterBand({ top: 260, bottom: 340 }, 800, 0.2)).toBe(false); // midpoint 300
    expect(inCenterBand({ top: 300, bottom: 360 }, 800, 0.2)).toBe(true); // midpoint 330
  });
});
