// Owner: agent/stickman. TASK-201 (S-03, S-10). Expected values are hand-derived from the
// owner-approved prototype (docs/reference/stickman-cursor-spike.html), never from motion.ts.
import { describe, expect, it } from 'vitest';
import { PACES, desiredSpeed, stepMotion, type MotionState } from './motion';

const FRAME = 1 / 60;
const SIZE = 32;

function at(x: number, y: number, over: Partial<MotionState> = {}): MotionState {
  return { pos: { x, y }, speed: 0, facing: 1, phase: 0, idle: 0, ...over };
}

describe('desiredSpeed', () => {
  // d > 1.2 ? min(min(1150, 150 + 2.4d), 7d) : 0
  it.each([
    [0, 0],
    [1.2, 0], // the arrival radius is exclusive
    [10, 70], // 7d clamps: 150 + 24 = 174 > 70
    [100, 390], // 150 + 240 = 390 < 700
    [400, 1110], // 150 + 960
    [500, 1150], // 150 + 1200 = 1350, capped
    [10000, 1150],
  ])('desiredSpeed table: d=%s -> %s px/s', (d, expected) => {
    expect(desiredSpeed(d)).toBeCloseTo(expected, 9);
  });
});

describe('lab paces (the spike\'s Stroll / Walk / Hurries when far)', () => {
  // desired = d > 1.2 ? min(pace(d), 7d) : 0; stroll is a flat 85, walk a flat 180
  it.each([
    ['stroll', 100, 85],
    ['stroll', 10, 70], // still clamped by 7d near the target
    ['walk', 100, 180],
    ['walk', 1, 0],
    ['hurry', 100, 390],
  ] as const)('%s at d=%s -> %s px/s', (pace, d, expected) => {
    expect(desiredSpeed(d, PACES[pace])).toBeCloseTo(expected, 9);
  });

  it('hurry is the default pace', () => {
    expect(desiredSpeed(400)).toBe(desiredSpeed(400, PACES.hurry));
  });

  it('stepMotion honours the pace it is given', () => {
    // stroll: desired 85; 0 + 85 * min(1, 0.2 * 10) = 85
    const s = stepMotion(at(0, 0), { x: 1000, y: 0 }, 0.2, SIZE, PACES.stroll);
    expect(s.speed).toBeCloseTo(85, 9);
  });
});

describe('stepMotion', () => {
  it('eases speed toward desired at rate 10/s', () => {
    // far target: desired = 1150; 0 + (1150 - 0) * min(1, 0.05 * 10) = 575
    const s = stepMotion(at(0, 0), { x: 1000, y: 0 }, 0.05, SIZE);
    expect(s.speed).toBeCloseTo(575, 9);
    // and moves speed * dt along the line to the target: 575 * 0.05
    expect(s.pos.x).toBeCloseTo(28.75, 9);
    expect(s.pos.y).toBeCloseTo(0, 9);
  });

  it('caps the easing factor at 1 for long frames', () => {
    const s = stepMotion(at(0, 0), { x: 1000, y: 0 }, 0.2, SIZE);
    expect(s.speed).toBeCloseTo(1150, 9);
  });

  it('stepMotion never overshoots the target', () => {
    // Already at full speed 5px from the target: one 50ms frame could carry 57px.
    const near = stepMotion(at(0, 0, { speed: 1150 }), { x: 3, y: 4 }, 0.05, SIZE);
    expect(near.pos.x).toBeCloseTo(3, 9);
    expect(near.pos.y).toBeCloseTo(4, 9);

    // Over a whole 800px run the position is monotonic and never passes the target.
    let s = at(0, 0);
    let prev = 0;
    for (let i = 0; i < 180; i++) {
      s = stepMotion(s, { x: 800, y: 0 }, FRAME, SIZE);
      expect(s.pos.x).toBeLessThanOrEqual(800);
      expect(s.pos.x).toBeGreaterThanOrEqual(prev);
      prev = s.pos.x;
    }
  });

  it('facing does not flip on |dx| ≤ 1.5', () => {
    const moving = at(100, 100, { speed: 100, facing: 1 });
    expect(stepMotion(moving, { x: 98.6, y: 100 }, FRAME, SIZE).facing).toBe(1);
    // just past the dead zone it does flip
    expect(stepMotion(moving, { x: 98, y: 100 }, FRAME, SIZE).facing).toBe(-1);
  });

  it('facing does not flip while speed ≤ 6', () => {
    // dx = -2, desired = min(154.8, 14) = 14; speed eases to 14 * (10/60) = 2.33
    const slow = stepMotion(at(100, 100, { facing: 1 }), { x: 98, y: 100 }, FRAME, SIZE);
    expect(slow.speed).toBeLessThanOrEqual(6);
    expect(slow.facing).toBe(1);
  });

  it('idle accumulates only when speed ≤ 8', () => {
    let s = at(50, 50);
    for (let i = 0; i < 10; i++) s = stepMotion(s, { x: 50, y: 50 }, 0.1, SIZE);
    expect(s.idle).toBeCloseTo(1, 9);

    // moving (speed well above 8) resets it
    const moving = stepMotion(at(50, 50, { idle: 3, speed: 300 }), { x: 500, y: 50 }, FRAME, SIZE);
    expect(moving.idle).toBe(0);
  });

  it('advances the stride phase by speed·dt / (size·0.5)', () => {
    // speed 400 -> 400 + (1150 - 400) * 0.1 = 475; phase += 475 * 0.01 / 16 = 0.296875
    const s = stepMotion(at(0, 0, { speed: 400 }), { x: 1000, y: 0 }, 0.01, SIZE);
    expect(s.phase).toBeCloseTo(0.296875, 9);
  });

  it('does not mutate the input state', () => {
    const before = at(0, 0);
    stepMotion(before, { x: 500, y: 0 }, FRAME, SIZE);
    expect(before).toEqual(at(0, 0));
  });

  // S-03, engine half: 800px runs and settles in about 1.2s or less; 50px walks.
  it('an 800px jump runs and settles within 1.2px in at most 1.2s', () => {
    let s = at(0, 0);
    let maxSpeed = 0;
    let t = 0;
    while (Math.abs(800 - s.pos.x) >= 1.2 && t < 3) {
      s = stepMotion(s, { x: 800, y: 0 }, FRAME, SIZE);
      maxSpeed = Math.max(maxSpeed, s.speed);
      t += FRAME;
    }
    expect(t).toBeLessThanOrEqual(1.2);
    expect(maxSpeed).toBeGreaterThan(720); // full run blend: 220 + 500
  });

  it('a 50px move stays under the 220 px/s run threshold', () => {
    let s = at(0, 0);
    let maxSpeed = 0;
    for (let i = 0; i < 60; i++) {
      s = stepMotion(s, { x: 50, y: 0 }, FRAME, SIZE);
      maxSpeed = Math.max(maxSpeed, s.speed);
    }
    expect(maxSpeed).toBeGreaterThan(8); // he did walk
    expect(maxSpeed).toBeLessThan(220);
  });
});
