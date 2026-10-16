// Owner: agent/stickman. TASK-204. The touch walker's targeting (docs/API.md §2.3), with the real
// motion engine stepping toward each target.
import { describe, expect, it } from 'vitest';
import { stepMotion, type MotionState } from '../engine/motion';
import { touchTarget } from './touchWalker';

const VW = 390;
const SIZE = 24;
const FRAME = 1 / 60;
const at = (x: number, facing: 1 | -1 = 1): MotionState => ({ pos: { x, y: 800 }, speed: 0, facing, phase: 0, idle: 0 });
const none = { scrollVelocity: 0, tapX: null, viewportWidth: VW };

/** Walk with a constant input for `seconds`; returns the final state and the mean speed of the last second. */
function walk(start: MotionState, input: { scrollVelocity: number; tapX: number | null }, seconds: number) {
  let s = start;
  let travelled = 0;
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i++) {
    const t = touchTarget(s, { ...input, viewportWidth: VW }, FRAME);
    const next = stepMotion(s, t, FRAME, SIZE);
    if (i >= frames - 60) travelled += Math.abs(next.pos.x - s.pos.x);
    s = next;
  }
  return { s, speed: travelled };
}

describe('touchTarget', () => {
  it('tap sets target x clamped to the viewport', () => {
    expect(touchTarget(at(100), { ...none, tapX: 200 }, FRAME)).toEqual({ x: 200, y: 800 });
    expect(touchTarget(at(100), { ...none, tapX: 3 }, FRAME)).toEqual({ x: 16, y: 800 });
    expect(touchTarget(at(100), { ...none, tapX: 1000 }, FRAME)).toEqual({ x: 374, y: 800 });
  });

  it('no target change without input: he stays where he is', () => {
    expect(touchTarget(at(150), none, FRAME)).toEqual({ x: 150, y: 800 });
  });

  it('scroll velocity walks him at most 180 px/s', () => {
    // 400 px/s of scroll walks him at 400·0.25 = 100 px/s; 5000 px/s is capped at 180
    const slow = walk(at(40), { scrollVelocity: 400, tapX: null }, 1.5);
    expect(slow.speed).toBeGreaterThan(90);
    expect(slow.speed).toBeLessThan(110);
    const fast = walk(at(40), { scrollVelocity: -5000, tapX: null }, 1.2);
    expect(fast.speed).toBeGreaterThan(165);
    expect(fast.speed).toBeLessThanOrEqual(181);
  });

  it('walks forward the way he faces, whichever way the page scrolls', () => {
    expect(touchTarget(at(200, 1), { ...none, scrollVelocity: -600 }, FRAME).x).toBeGreaterThan(200);
    expect(touchTarget(at(200, -1), { ...none, scrollVelocity: 600 }, FRAME).x).toBeLessThan(200);
  });

  it('turns around at the edges and never leaves the viewport', () => {
    let s = at(340, 1);
    let turned = false;
    for (let i = 0; i < 600; i++) {
      s = stepMotion(s, touchTarget(s, { ...none, scrollVelocity: 2000 }, FRAME), FRAME, SIZE);
      expect(s.pos.x).toBeGreaterThanOrEqual(16);
      expect(s.pos.x).toBeLessThanOrEqual(374);
      if (s.facing === -1) turned = true;
    }
    expect(turned).toBe(true);
  });

  it('a tap wins over scrolling', () => {
    expect(touchTarget(at(100), { ...none, scrollVelocity: 900, tapX: 300 }, FRAME)).toEqual({ x: 300, y: 800 });
  });
});
