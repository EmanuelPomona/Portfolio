// Owner: agent/stickman. TASK-201. drawFigure against a recording 2D context: the breaks this
// catches are leaked transforms, a stroke not corrected for scale, and a missing limb or pencil.
import { describe, expect, it } from 'vitest';
import { PENCIL_TIP, REST_POINT_ANGLE, computePose } from '../engine/pose';
import { drawFigure } from './drawFigure';

type Call = [string, ...unknown[]];

function recorder() {
  const calls: Call[] = [];
  const state: Record<string, unknown> = {};
  let depth = 0;
  const ctx = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop in state) return state[prop];
        return (...args: unknown[]) => {
          if (prop === 'save') depth++;
          if (prop === 'restore') depth--;
          calls.push([prop, ...args]);
        };
      },
      set(_t, prop: string, value) {
        state[prop] = value;
        calls.push([`set:${prop}`, value]);
        return true;
      },
    },
  ) as CanvasRenderingContext2D;
  return { ctx, calls, depth: () => depth };
}

const pose = computePose(
  { pos: { x: 0, y: 0 }, speed: 0, facing: 1, phase: 0, idle: 0 },
  { cheer: 0, point: 0, sit: 0 },
  REST_POINT_ANGLE,
  0,
);
const vertices = (calls: Call[]) =>
  calls.filter(([n]) => n === 'moveTo' || n === 'lineTo').map(([, x, y]) => [x, y]);

describe('drawFigure', () => {
  it('places the rig at his feet, scaled by size/40 and mirrored by facing, and restores state', () => {
    const r = recorder();
    drawFigure(r.ctx, pose, { x: 120, y: 340 }, {
      size: 32,
      facing: -1,
      lineWidth: 1.8,
      color: '#fff',
    });
    const names = r.calls.map(([n]) => n);
    expect(names[0]).toBe('save');
    expect(names.at(-1)).toBe('restore');
    expect(r.depth()).toBe(0);
    expect(r.calls).toContainEqual(['translate', 120, 340]);
    expect(r.calls).toContainEqual(['scale', -0.8, 0.8]);
  });

  it('mirrors continuously by `mirror` when given, so a paper figure can turn edge-on', () => {
    const r = recorder();
    drawFigure(r.ctx, pose, { x: 0, y: 0 }, { size: 40, facing: 1, mirror: -0.25, lineWidth: 1.8, color: '#fff' });
    expect(r.calls).toContainEqual(['scale', -0.25, 1]);
  });

  it('strokes in round caps and joins at lineWidth px regardless of scale', () => {
    const r = recorder();
    drawFigure(r.ctx, pose, { x: 0, y: 0 }, { size: 32, facing: 1, lineWidth: 1.8, color: '#242424' });
    expect(r.calls).toContainEqual(['set:lineWidth', 1.8 / 0.8]);
    expect(r.calls).toContainEqual(['set:strokeStyle', '#242424']);
    expect(r.calls).toContainEqual(['set:lineCap', 'round']);
    expect(r.calls).toContainEqual(['set:lineJoin', 'round']);
  });

  it('strokes both legs, the torso, the head circle, and both arms', () => {
    const r = recorder();
    drawFigure(r.ctx, pose, { x: 0, y: 0 }, { size: 32, facing: 1, lineWidth: 1.8, color: '#fff' });
    expect(r.calls.filter(([n]) => n === 'stroke')).toHaveLength(6);
    expect(r.calls).toContainEqual(['arc', pose.head.x, pose.head.y, 3.9, 0, Math.PI * 2]);
    const v = vertices(r.calls);
    for (const l of [...pose.legs, ...pose.arms]) {
      expect(v).toContainEqual([l.end.x, l.end.y]);
    }
    expect(v).toContainEqual([pose.neck.x, pose.neck.y]);
  });

  it('draws a pencil whose point sits at PENCIL_TIP only when asked', () => {
    const without = recorder();
    drawFigure(without.ctx, pose, { x: 0, y: 0 }, { size: 32, facing: 1, lineWidth: 1.8, color: '#fff' });
    expect(vertices(without.calls)).not.toContainEqual([PENCIL_TIP.x, PENCIL_TIP.y]);

    const withPencil = recorder();
    drawFigure(withPencil.ctx, pose, { x: 0, y: 0 }, {
      size: 32,
      facing: 1,
      lineWidth: 1.8,
      color: '#fff',
      pencil: true,
    });
    expect(vertices(withPencil.calls)).toContainEqual([PENCIL_TIP.x, PENCIL_TIP.y]);
    expect(withPencil.calls.filter(([n]) => n === 'stroke').length).toBeGreaterThan(6);
    expect(withPencil.depth()).toBe(0);
  });
});
