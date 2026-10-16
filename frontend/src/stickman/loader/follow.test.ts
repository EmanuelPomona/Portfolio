// Owner: agent/stickman. TASK-203. The loader stickman follows his own pencil tip along the scribble.
import { describe, expect, it } from 'vitest';
import { feetFor, followTip, startFollow, type Follow } from './follow';

const SIZE = 32; // k = 0.8: the pencil tip sits 10·0.8 = 8px ahead of his feet
const FRAME = 1 / 60;

function run(from: Follow, vx: number, vy: number, seconds: number): Follow {
  let f = from;
  for (let t = 0; t < seconds - 1e-9; t += FRAME) {
    f = followTip(f, { x: f.motion.pos.x + vx * FRAME, y: f.motion.pos.y + vy * FRAME }, FRAME, SIZE);
  }
  return f;
}

describe('followTip', () => {
  it('keeps the pencil tip exactly on the scribble point', () => {
    const f = followTip(startFollow({ x: 100, y: 100 }), { x: 103, y: 101 }, FRAME, SIZE);
    expect(f.motion.pos).toEqual({ x: 103, y: 101 });
  });

  it("eases his speed toward the tip's real speed at rate 10/s", () => {
    // one 0.05s frame at 600 px/s: 0 + 600·min(1, 0.5) = 300
    const one = followTip(startFollow({ x: 0, y: 0 }), { x: 30, y: 0 }, 0.05, SIZE);
    expect(one.motion.speed).toBeCloseTo(300, 9);
    expect(run(startFollow({ x: 0, y: 0 }), 600, 0, 1).motion.speed).toBeCloseTo(600, 0);
  });

  it('faces the way the tip travels, ignoring slow horizontal drift', () => {
    expect(run(startFollow({ x: 500, y: 0 }), -300, 0, 0.2).motion.facing).toBe(-1);
    // 50 px/s sideways while running down: below the 90 px/s (1.5px per 60fps frame) dead zone
    expect(run(startFollow({ x: 500, y: 0 }), -50, 400, 0.5).motion.facing).toBe(1);
  });

  it('advances the stride with distance travelled, like the cursor', () => {
    // 480 px/s for 1s, eased from 0: ∫speed ≈ 480·(1 − 0.1) = 432px; phase ≈ 432 / 16 = 27
    const f = run(startFollow({ x: 0, y: 0 }), 480, 0, 1);
    expect(f.motion.phase).toBeGreaterThan(25);
    expect(f.motion.phase).toBeLessThan(30); // 480/16 = 30 at full speed throughout
    expect(f.motion.idle).toBe(0);
  });
});

describe('feetFor', () => {
  it('stands his feet a pencil-reach behind the tip', () => {
    const f = startFollow({ x: 200, y: 300 }); // facing right
    expect(feetFor(f, SIZE)).toEqual({ x: 192, y: 300 });
  });

  it('swings his feet around the planted tip when he turns, with no jump', () => {
    let f = run(startFollow({ x: 400, y: 0 }), 300, 0, 0.5); // settled facing right
    const before = feetFor(f, SIZE).x - f.motion.pos.x;
    expect(before).toBeCloseTo(-8, 6);
    f = followTip(f, { x: f.motion.pos.x - 5, y: 0 }, FRAME, SIZE); // reverses
    const after = feetFor(f, SIZE).x - f.motion.pos.x;
    // swing eases 1 -> −1 at 12/s: one frame moves it by 2·0.2 = 0.4, i.e. 3.2px, not 16px
    expect(after).toBeCloseTo(-8 * 0.6, 6);
    f = run(f, -300, 0, 0.8);
    expect(feetFor(f, SIZE).x - f.motion.pos.x).toBeCloseTo(8, 2);
  });
});
