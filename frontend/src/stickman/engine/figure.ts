// Owner: agent/stickman. One frame of the figure, in the prototype's exact order of operations:
//   1. a press resets idle (the spike's pointerdown handler);
//   2. arrival is judged on the distance BEFORE this frame's step;
//   3. motion steps, then gestures step on the post-step motion and the eased speed.
// Every frame loop (cursor, loader, touch walker) goes through here so the order cannot drift.
import { stepGestures, type GestureState } from './gestures';
import { MOVING_SPEED, PACES, stepMotion, type MotionState, type Pace } from './motion';
import type { Vec2 } from './vec';

export interface Figure {
  motion: MotionState;
  gestures: GestureState;
}

export interface FigureInput {
  /** Where he is walking to (feet, CSS px). */
  target: Vec2;
  /** The pointer or keyboard focus rests on a target. */
  onTarget: boolean;
  /** A press on a target happened since the last frame. */
  pressed: boolean;
}

/** He counts as arrived (and may point) within this many figure heights of his target. */
export const POINT_RADIUS = 1.5;

export function stepFigure(
  f: Figure,
  input: FigureInput,
  dt: number,
  size: number,
  pace: Pace = PACES.hurry,
): Figure {
  const start = input.pressed ? { ...f.motion, idle: 0 } : f.motion;
  const dist = Math.hypot(input.target.x - start.pos.x, input.target.y - start.pos.y);
  const motion = stepMotion(start, input.target, dt, size, pace);
  const gestures = stepGestures(
    f.gestures,
    motion,
    {
      moving: motion.speed > MOVING_SPEED,
      arrived: dist < POINT_RADIUS * size,
      onTarget: input.onTarget,
      pressed: input.pressed,
    },
    dt,
  );
  return { motion, gestures };
}
