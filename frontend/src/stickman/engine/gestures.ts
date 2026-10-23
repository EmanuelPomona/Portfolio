// Owner: agent/stickman. Point, cheer, and sit blends, ported from the owner-approved prototype.
// Pure. stepFigure resets MotionState.idle on a press and whenever the pointer (his target) moves.
import type { MotionState } from './motion';
import { approach } from './vec';

export interface GestureState {
  /** 1 at the press, decaying to 0 over about 0.71s. */
  cheer: number;
  /** 0..1 blend of the front arm toward the target. */
  point: number;
  /** 0..1 blend toward the seated pose. */
  sit: number;
}

export interface GestureInputs {
  /** Speed is above the moving threshold. */
  moving: boolean;
  /** Within 1.5 × size of the pointer. */
  arrived: boolean;
  /** The pointer (or keyboard focus) rests on a target. */
  onTarget: boolean;
  /** A press on a target happened since the last step. */
  pressed: boolean;
}

export const SIT_AFTER_S = 2;
const SIT_EASE = 6; // owner, TASK-207: seated by about 2.5s (the prototype eased at 4/s)
const CHEER_DECAY = 1.4;
const POINT_EASE = 8;

export function stepGestures(
  g: GestureState,
  s: MotionState,
  i: GestureInputs,
  dt: number,
): GestureState {
  const sit = approach(g.sit, s.idle > SIT_AFTER_S ? 1 : 0, SIT_EASE, dt);
  const cheer = Math.max(0, (i.pressed ? 1 : g.cheer) - dt * CHEER_DECAY);
  const wantPoint = !i.moving && cheer === 0 && i.arrived && i.onTarget ? 1 : 0;
  const point = approach(g.point, wantPoint, POINT_EASE, dt);
  return { cheer, point, sit };
}
