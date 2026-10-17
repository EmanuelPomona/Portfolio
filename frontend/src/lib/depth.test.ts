import { describe, expect, it } from 'vitest';
import { depthOffset } from './depth';

describe('depthOffset', () => {
  it("depthOffset is 0 when the element's center is at the viewport's center", () => {
    // Center at 1000 + 400 = 1400 in the document; viewport center at 1000 + 400 = 1400.
    expect(depthOffset({ top: 1000, height: 800, scrollY: 1000, viewportHeight: 800 }, 0.1, 80)).toBe(0);
    // The same geometry anywhere on the page.
    expect(depthOffset({ top: 0, height: 900, scrollY: 0, viewportHeight: 900 }, 0.25, 80)).toBe(0);
  });

  it('depthOffset scales with distance by factor and is clamped to ±maxPx', () => {
    const at = (scrollY: number, factor = 0.1, maxPx = 80) =>
      depthOffset({ top: 2000, height: 600, scrollY, viewportHeight: 800 }, factor, maxPx);
    // Element center 2300. Viewport center = scrollY + 400. At scrollY 1900 they meet.
    // Scrolled 200px past that, the content has moved up 200px; the layer lags by 20px (down).
    expect(at(2100)).toBeCloseTo(20);
    // 300px before it, the element is still below center and the layer sits 30px higher.
    expect(at(1600)).toBeCloseTo(-30);
    // Proportional to the factor.
    expect(at(2100, 0.25)).toBeCloseTo(50);
    // Clamped both ways.
    expect(at(4000)).toBe(80);
    expect(at(0)).toBe(-80);
    expect(at(2100, 0.25, 40)).toBe(40);
  });
});
