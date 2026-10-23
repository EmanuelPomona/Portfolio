// Owner: agent/stickman. TASK-201 (S-04, S-10). Expected values are hand-derived from the prototype.
import { describe, expect, it } from 'vitest';
import { stepGestures, type GestureInputs, type GestureState } from './gestures';
import type { MotionState } from './motion';

const FRAME = 1 / 60;
const REST: GestureState = { cheer: 0, point: 0, sit: 0 };
const STILL: GestureInputs = { moving: false, arrived: false, onTarget: false, pressed: false };
const ON_TARGET: GestureInputs = { moving: false, arrived: true, onTarget: true, pressed: false };

function motion(idle: number): MotionState {
  return { pos: { x: 0, y: 0 }, speed: 0, facing: 1, phase: 0, idle };
}

/** Steps for `seconds`, letting idle grow as the motion step would while standing still. */
function hold(g: GestureState, i: GestureInputs, seconds: number, idle0 = 0): GestureState {
  let out = g;
  let idle = idle0;
  for (let t = 0; t < seconds - 1e-9; t += FRAME) {
    idle += FRAME;
    out = stepGestures(out, motion(idle), i, FRAME);
  }
  return out;
}

describe('stepGestures: sit', () => {
  it('sit approaches 1 after 2s idle and returns to 0 when moving', () => {
    const seated = hold(REST, STILL, 2, 2); // idle 2 -> 4s, eased at rate 6/s
    expect(seated.sit).toBeGreaterThan(0.99);

    let standing = seated;
    for (let t = 0; t < 2; t += FRAME) {
      standing = stepGestures(standing, motion(0), { ...STILL, moving: true }, FRAME);
    }
    expect(standing.sit).toBeLessThan(0.01);
  });

  it('does not sit before 2s idle', () => {
    expect(hold(REST, STILL, 1.98).sit).toBe(0);
  });

  it('seated within 0.5s of starting to sit (6/s ease)', () => {
    // from idle 2s, 30 frames at rate 6/s: 1 − (1 − 6/60)^30 = 0.958 (at 4/s it would be 0.874)
    expect(hold(REST, STILL, 0.5, 2).sit).toBeGreaterThanOrEqual(0.95);
  });

  it('starts sitting strictly after 2s idle', () => {
    expect(stepGestures(REST, motion(2), STILL, 0.1).sit).toBe(0);
    expect(stepGestures(REST, motion(2.01), STILL, 0.1).sit).toBeCloseTo(0.6, 9);
  });

  it('eases sit at rate 6/s', () => {
    // 0 + (1 - 0) * min(1, 0.1 * 6) = 0.6
    expect(stepGestures(REST, motion(6), STILL, 0.1).sit).toBeCloseTo(0.6, 9);
  });
});

describe('stepGestures: cheer', () => {
  it('a press starts the cheer at full strength, decaying in the same frame', () => {
    const g = stepGestures(REST, motion(0), { ...STILL, pressed: true }, 0.1);
    expect(g.cheer).toBeCloseTo(1 - 0.14, 9);
  });

  it('cheer decays from 1 to 0 in ~0.71s', () => {
    let g = stepGestures(REST, motion(0), { ...STILL, pressed: true }, FRAME);
    let t = FRAME;
    while (g.cheer > 0 && t < 2) {
      g = stepGestures(g, motion(0), STILL, FRAME);
      t += FRAME;
    }
    // 1 / 1.4 = 0.714s, to within one frame
    expect(t).toBeGreaterThan(0.714 - FRAME);
    expect(t).toBeLessThan(0.714 + FRAME);
    expect(g.cheer).toBe(0);
  });
});

describe('stepGestures: point', () => {
  it('point only rises when arrived on a target and not cheering', () => {
    expect(hold(REST, ON_TARGET, 0.25).point).toBeGreaterThan(0.8);

    expect(hold(REST, { ...ON_TARGET, arrived: false }, 0.25).point).toBe(0);
    expect(hold(REST, { ...ON_TARGET, onTarget: false }, 0.25).point).toBe(0);
    expect(hold(REST, { ...ON_TARGET, moving: true }, 0.25).point).toBe(0);
    // mid-cheer: still decaying, so no point yet
    const cheering = stepGestures({ cheer: 0.5, point: 0, sit: 0 }, motion(0), ON_TARGET, FRAME);
    expect(cheering.point).toBe(0);
  });

  it('eases point at rate 8/s and lowers it when the target is gone', () => {
    // 0 + 1 * min(1, 0.05 * 8) = 0.4
    const up = stepGestures(REST, motion(0), ON_TARGET, 0.05);
    expect(up.point).toBeCloseTo(0.4, 9);
    // 0.4 + (0 - 0.4) * 0.4 = 0.24
    const down = stepGestures(up, motion(0), STILL, 0.05);
    expect(down.point).toBeCloseTo(0.24, 9);
  });

  it('a press while pointing drops the point in favour of the cheer', () => {
    const pointing: GestureState = { cheer: 0, point: 1, sit: 0 };
    const pressed = stepGestures(pointing, motion(0), { ...ON_TARGET, pressed: true }, 0.05);
    expect(pressed.cheer).toBeGreaterThan(0.9);
    expect(pressed.point).toBeCloseTo(0.6, 9); // eased toward 0, not toward 1
  });
});
