// Owner: agent/stickman. TASK-201. Rig: 40-unit local space, feet at the origin, y down.
// Expected values are hand-derived from the prototype's draw().
import { describe, expect, it } from 'vitest';
import type { GestureState } from './gestures';
import type { MotionState } from './motion';
import {
  PENCIL_LENGTH,
  PENCIL_TIP,
  REST_POINT_ANGLE,
  computePose,
  holdPencil,
  lineWidthFor,
  pointAngleTo,
  rigToScreen,
  runBlend,
  type Limb,
} from './pose';

const STAND: MotionState = { pos: { x: 0, y: 0 }, speed: 0, facing: 1, phase: 0, idle: 0 };
const NONE: GestureState = { cheer: 0, point: 0, sit: 0 };

const len = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(b.x - a.x, b.y - a.y);
/** Rig angle of a segment: 0 points down, +π/2 points forward. */
const angle = (from: { x: number; y: number }, to: { x: number; y: number }) =>
  Math.atan2(to.x - from.x, to.y - from.y);

describe('runBlend', () => {
  it.each([
    [0, 0],
    [220, 0],
    [470, 0.5],
    [720, 1],
    [2000, 1],
  ])('speed %s -> %s', (speed, expected) => {
    expect(runBlend(speed)).toBeCloseTo(expected, 9);
  });
});

describe('lineWidthFor', () => {
  it.each([
    [12, 1.15],
    [14.9, 1.15],
    [15, 1.45],
    [21.9, 1.45],
    [22, 1.8],
    [32, 1.8],
  ])('size %s -> %s px', (size, expected) => {
    expect(lineWidthFor(size)).toBe(expected);
  });
});

describe('computePose', () => {
  it('standing pose has feet at y=0 and head above hip', () => {
    const p = computePose(STAND, NONE, REST_POINT_ANGLE, 0);
    for (const leg of p.legs) {
      expect(leg.end.x).toBeCloseTo(0, 9);
      expect(leg.end.y).toBeCloseTo(0, 9);
    }
    expect(p.hip).toEqual({ x: 0, y: -16 });
    expect(p.head.y).toBeCloseTo(-16 - 17.4, 9);
    expect(p.head.y).toBeLessThan(p.hip.y);
    expect(p.headRadius).toBe(3.9);
  });

  it('keeps the rig lengths: legs 8+8, arms 6.4+6, neck 13.2 above the hip', () => {
    const p = computePose({ ...STAND, speed: 600, phase: 1.1 }, NONE, REST_POINT_ANGLE, 0.3);
    const check = (l: Limb, a: number, b: number) => {
      expect(len(l.root, l.joint)).toBeCloseTo(a, 9);
      expect(len(l.joint, l.end)).toBeCloseTo(b, 9);
    };
    p.legs.forEach((l) => check(l, 8, 8));
    p.arms.forEach((l) => check(l, 6.4, 6));
    expect(len(p.hip, p.neck)).toBeCloseTo(13.2, 9);
    expect(len(p.hip, p.shoulder)).toBeCloseTo(11, 9);
  });

  it('leans forward by 0.16 rad at a full run and not at a walk', () => {
    const run = computePose({ ...STAND, speed: 1150 }, NONE, REST_POINT_ANGLE, 0);
    expect(angle(run.hip, run.neck)).toBeCloseTo(Math.PI - 0.16, 9);
    const walk = computePose({ ...STAND, speed: 120 }, NONE, REST_POINT_ANGLE, 0);
    expect(walk.neck.x).toBeCloseTo(walk.hip.x, 9);
  });

  it('bobs the hip by −|sin(phase)|·1.4 while walking', () => {
    // walk blend = clamp(120 / 60) = 1; phase π/2 -> bob = −1.4
    const p = computePose({ ...STAND, speed: 120, phase: Math.PI / 2 }, NONE, REST_POINT_ANGLE, 0);
    expect(p.hip.y).toBeCloseTo(-17.4, 9);
  });

  it('sitting lowers the hip by 8 and folds the legs forward', () => {
    const p = computePose(STAND, { ...NONE, sit: 1 }, REST_POINT_ANGLE, 0);
    expect(p.hip.y).toBeCloseTo(-8, 9);
    expect(angle(p.legs[0].root, p.legs[0].joint)).toBeCloseTo(1.45, 9);
    expect(angle(p.legs[0].joint, p.legs[0].end)).toBeCloseTo(0.05, 9);
  });

  it('cheer hops and raises both arms, with the wave sin(clock·22)·0.35', () => {
    // cheer 0.9: c = 1; hop = sin((1 − 0.9)/0.45·π)·5 = 3.2139
    const atZero = computePose(STAND, { ...NONE, cheer: 0.9 }, REST_POINT_ANGLE, 0);
    expect(atZero.hip.y).toBeCloseTo(-16 - 3.21394, 4);
    for (const arm of atZero.arms) expect(arm.end.y).toBeLessThan(atZero.shoulder.y);
    expect(angle(atZero.arms[0].joint, atZero.arms[0].end)).toBeCloseTo(Math.PI - 0.5, 9);

    const atPeak = computePose(STAND, { ...NONE, cheer: 0.9 }, REST_POINT_ANGLE, Math.PI / 44);
    expect(angle(atPeak.arms[0].joint, atPeak.arms[0].end)).toBeCloseTo(Math.PI - 0.5 + 0.35, 9);
  });

  it('pointing aims the whole front arm along pointAngle', () => {
    const p = computePose(STAND, { ...NONE, point: 1 }, Math.PI / 2, 0);
    const front = p.arms[0];
    expect(front.root).toEqual(p.shoulder);
    expect(front.end.x).toBeCloseTo(p.shoulder.x + 12.4, 9);
    expect(front.end.y).toBeCloseTo(p.shoulder.y, 9);
  });
});

// Golden angles, each derived by hand from the spike's draw(). [upper, lower] segment angles.
describe('computePose gait and gesture angles', () => {
  const seg = (l: Limb) => [angle(l.root, l.joint), angle(l.joint, l.end)];
  const pose = (speed: number, phase: number, g: Partial<GestureState> = {}, clock = 0) =>
    computePose({ ...STAND, speed, phase }, { ...NONE, ...g }, REST_POINT_ANGLE, clock);

  it('walk (speed 120, phase π/2): swing 0.5, knee bend 0.15, arm swing 0.45 + rest offsets', () => {
    // walk 1, run 0, swing 0.5. legs: a = ±0.5; lift = max(0, sin(π/2 ± π/2)) = 0 -> bend 0.15
    // arms: a = ∓0.45 + (0.08 | −0.04); a2 = a + 0.25 + 0.12
    const p = pose(120, Math.PI / 2);
    seg(p.legs[0]).forEach((v, i) => expect(v).toBeCloseTo([0.5, 0.35][i]!, 9));
    seg(p.legs[1]).forEach((v, i) => expect(v).toBeCloseTo([-0.5, -0.65][i]!, 9));
    seg(p.arms[0]).forEach((v, i) => expect(v).toBeCloseTo([-0.37, 0][i]!, 9));
    seg(p.arms[1]).forEach((v, i) => expect(v).toBeCloseTo([0.41, 0.78][i]!, 9));
  });

  it('full run (speed 720, phase 0): the lifting knee bends by 0.15 + (0.7 + 0.5)', () => {
    const p = pose(720, 0);
    seg(p.legs[0]).forEach((v, i) => expect(v).toBeCloseTo([0, -1.35][i]!, 9));
    seg(p.legs[1]).forEach((v, i) => expect(v).toBeCloseTo([0, -0.15][i]!, 9));
  });

  it('full run (speed 720, phase π/2): swing 0.85 and the forearm opens by 0.25 + 0.5', () => {
    // front thigh = 0.85; front arm a = −0.85·0.9 + 0.08 = −0.685, a2 = a + 0.75 + 0.12 = 0.185
    const p = pose(720, Math.PI / 2);
    expect(seg(p.legs[0])[0]).toBeCloseTo(0.85, 9);
    expect(seg(p.arms[0])[1]).toBeCloseTo(0.185, 9);
  });

  it('slow walk (speed 30): blends by speed / 60', () => {
    // walk 0.5: swing 0.25; bob = −1·1.4·0.5 = −0.7
    const p = pose(30, Math.PI / 2);
    expect(seg(p.legs[0])[0]).toBeCloseTo(0.25, 9);
    expect(p.hip.y).toBeCloseTo(-16.7, 9);
  });

  it('seated arms rest at [0.35, 0.9] and [−0.25, 0.3]', () => {
    const p = pose(0, 0, { sit: 1 });
    seg(p.arms[0]).forEach((v, i) => expect(v).toBeCloseTo([0.35, 0.9][i]!, 9));
    seg(p.arms[1]).forEach((v, i) => expect(v).toBeCloseTo([-0.25, 0.3][i]!, 9));
  });

  it('cheer raises the arms by min(1, cheer·4) and hops only above cheer 0.55', () => {
    // cheer 0.1 -> c 0.4: front upper arm = 0.08 + (π − 0.5 − 0.08)·0.4
    expect(seg(pose(0, 0, { cheer: 0.1 }).arms[0])[0]).toBeCloseTo(0.08 + (Math.PI - 0.58) * 0.4, 9);
    expect(pose(0, 0, { cheer: 0.56 }).hip.y).toBeCloseTo(-16 - 5 * Math.sin((0.44 / 0.45) * Math.PI), 9);
    expect(pose(0, 0, { cheer: 0.5 }).hip.y).toBeCloseTo(-16, 9);
  });

  it('the back arm waves in the opposite sense', () => {
    // clock π/44 -> wave 0.35; back forearm = −(π − 0.5) − 0.35
    const p = pose(0, 0, { cheer: 0.9 }, Math.PI / 44);
    expect(seg(p.arms[1])[1]).toBeCloseTo(-(Math.PI - 0.5) - 0.35, 9);
  });
});

describe('pointAngleTo', () => {
  // standing shoulder: hip (0,−16) + 11 up = (0,−27) in rig units; size 40 -> 1px per unit
  const s: MotionState = { ...STAND, pos: { x: 100, y: 200 } };

  it('is π/2 for a target straight ahead at shoulder height, whichever way he faces', () => {
    expect(pointAngleTo(s, NONE, 40, { x: 300, y: 173 })).toBeCloseTo(Math.PI / 2, 9);
    const left: MotionState = { ...s, facing: -1 };
    expect(pointAngleTo(left, NONE, 40, { x: -100, y: 173 })).toBeCloseTo(Math.PI / 2, 9);
  });

  it('mirrors the leaning shoulder when he faces left', () => {
    // full run: lean 0.16, phase 0 so no bob; shoulder in rig units (sin(0.16)·11, −16 − cos(0.16)·11)
    // facing −1 mirrors x on screen; a target 50 forward (left) and 50 below is π/4
    const run: MotionState = { ...s, speed: 1150, facing: -1 };
    const sx = 100 - Math.sin(0.16) * 11;
    const sy = 200 - 16 - Math.cos(0.16) * 11;
    expect(pointAngleTo(run, NONE, 40, { x: sx - 50, y: sy + 50 })).toBeCloseTo(Math.PI / 4, 9);
  });

  it('is 0 for a target straight below the shoulder and scales with size', () => {
    // size 20 -> k 0.5 -> shoulder at y = 200 − 13.5
    expect(pointAngleTo(s, NONE, 20, { x: 100, y: 400 })).toBeCloseTo(0, 9);
    expect(pointAngleTo(s, NONE, 20, { x: 200, y: 186.5 })).toBeCloseTo(Math.PI / 2, 9);
  });
});

describe('rigToScreen', () => {
  it('scales rig units by size/40 from his feet and mirrors x by facing', () => {
    // size 32 -> k 0.8: the pencil tip (10, 0) lands 8px ahead of his feet
    expect(rigToScreen(PENCIL_TIP, { x: 100, y: 200 }, 32, 1)).toEqual({ x: 108, y: 200 });
    expect(rigToScreen(PENCIL_TIP, { x: 100, y: 200 }, 32, -1)).toEqual({ x: 92, y: 200 });
    // size 40 -> k 1: a point 40 units up is 40px up
    expect(rigToScreen({ x: 0, y: -40 }, { x: 100, y: 200 }, 40, -1)).toEqual({ x: 100, y: 160 });
  });
});

describe('holdPencil', () => {
  it('never aims the hand past the top of the pencil when the shaft is out of reach', () => {
    // A shoulder far above the pencil: the reachable grip is clamped to the shaft's top end,
    // not to a point beyond it.
    const base = computePose(STAND, NONE, REST_POINT_ANGLE, 0);
    const p = holdPencil({ ...base, shoulder: { x: 0, y: -200 } });
    const hand = p.arms[0].end;
    const toTop = angle(p.shoulder, p.pencil.top);
    expect(angle(p.shoulder, hand)).toBeCloseTo(toTop, 2);
  });

  it('plants the tip on the ground ahead of his feet and keeps the front hand on the shaft', () => {
    for (const speed of [0, 200, 1100]) {
      for (const phase of [0, 0.7, 2.4]) {
        const p = holdPencil(computePose({ ...STAND, speed, phase }, NONE, REST_POINT_ANGLE, 0));
        expect(p.pencil.tip).toEqual(PENCIL_TIP);
        expect(p.pencil.tip.y).toBe(0);
        expect(len(p.pencil.tip, p.pencil.top)).toBeCloseTo(PENCIL_LENGTH, 9);
        expect(PENCIL_LENGTH).toBeGreaterThan(40); // larger than he is

        // the hand lies on the tip→top segment
        const hand = p.arms[0].end;
        const along = len(p.pencil.tip, hand) + len(hand, p.pencil.top);
        expect(along).toBeCloseTo(PENCIL_LENGTH, 6);
        // and the arm keeps its bone lengths
        expect(len(p.arms[0].root, p.arms[0].joint)).toBeCloseTo(6.4, 9);
        expect(len(p.arms[0].joint, p.arms[0].end)).toBeCloseTo(6, 9);
      }
    }
  });
});
