// Owner: agent/stickman. The per-frame protocol of the prototype's frame(), in one tested place.
import { describe, expect, it } from 'vitest';
import { POINT_RADIUS, stepFigure, type Figure } from './figure';
import { PACES } from './motion';

const SIZE = 32;

function figure(x: number, y: number, over: Partial<Figure['motion']> = {}, g: Partial<Figure['gestures']> = {}): Figure {
  return {
    motion: { pos: { x, y }, speed: 0, facing: 1, phase: 0, idle: 0, ...over },
    gestures: { cheer: 0, point: 0, sit: 0, ...g },
  };
}

describe('stepFigure', () => {
  it('points once within POINT_RADIUS sizes of the target while still', () => {
    expect(POINT_RADIUS).toBe(1.5);
    // already at the target: still, arrived, on a target -> point eases up at 8/s
    const f = stepFigure(figure(100, 100), { target: { x: 100, y: 100 }, onTarget: true, pressed: false }, 0.05, SIZE);
    expect(f.gestures.point).toBeCloseTo(0.4, 9);
  });

  it('judges arrival on the distance before the step, as the prototype does', () => {
    // 48.01px away (radius 1.5·32 = 48); dt 0.003: speed eases 0 -> 265·0.03 = 7.95 (still, ≤ 8),
    // the step of 0.024px ends inside the radius, but the frame started outside it: no point yet.
    const f = stepFigure(figure(0, 0), { target: { x: 48.01, y: 0 }, onTarget: true, pressed: false }, 0.003, SIZE);
    expect(f.motion.speed).toBeLessThanOrEqual(8);
    expect(48.01 - f.motion.pos.x).toBeLessThan(48);
    expect(f.gestures.point).toBe(0);
  });

  it('a press resets idle before the step, so a seated figure starts to stand', () => {
    // idle 6 would keep him seated; the press makes idle 0 + dt, so sit eases toward 0
    const seated = figure(10, 10, { idle: 6 }, { sit: 1 });
    const f = stepFigure(seated, { target: { x: 10, y: 10 }, onTarget: true, pressed: true }, 0.05, SIZE);
    expect(f.motion.idle).toBeCloseTo(0.05, 9);
    expect(f.gestures.sit).toBeCloseTo(0.8, 9); // 1 + (0 − 1)·min(1, 0.05·4)
    expect(f.gestures.cheer).toBeCloseTo(1 - 0.07, 9);
  });

  it('without a press, a long idle keeps him seated', () => {
    const seated = figure(10, 10, { idle: 6 }, { sit: 1 });
    const f = stepFigure(seated, { target: { x: 10, y: 10 }, onTarget: false, pressed: false }, 0.05, SIZE);
    expect(f.gestures.sit).toBe(1);
  });

  it('does not point while moving, judged on the eased speed', () => {
    const f = stepFigure(figure(0, 0, { speed: 300 }), { target: { x: 20, y: 0 }, onTarget: true, pressed: false }, 0.016, SIZE);
    expect(f.motion.speed).toBeGreaterThan(8);
    expect(f.gestures.point).toBe(0);
  });

  it('judges "moving" on the eased speed: settling at the target, he may point this frame', () => {
    // at the target, 8.8 px/s eases to 7.92 (≤ 8, still) at dt 0.01 -> point = min(1, 0.01·8) = 0.08
    const f = stepFigure(figure(5, 5, { speed: 8.8 }), { target: { x: 5, y: 5 }, onTarget: true, pressed: false }, 0.01, SIZE);
    expect(f.gestures.point).toBeCloseTo(0.08, 9);
  });

  it('passes the pace through to the motion step', () => {
    const f = stepFigure(figure(0, 0), { target: { x: 1000, y: 0 }, onTarget: false, pressed: false }, 0.2, SIZE, PACES.walk);
    expect(f.motion.speed).toBeCloseTo(180, 9);
  });
});
