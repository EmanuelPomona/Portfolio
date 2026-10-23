// Owner: agent/stickman. One frame of the figure, in the prototype's exact order of operations:
//   1. a press resets idle (the spike's pointerdown handler); any move of his target, i.e. the
//      pointer, zeroes it after the step (TASK-207: he sits 2s after the pointer stops, not after
//      he does; the frame that sees the move counts none, as part of it came before the move);
//   2. arrival is judged on the distance BEFORE this frame's step;
//   3. motion steps, then gestures step on the post-step motion and the eased speed.
// The cursor and touch-walker loops go through here so the order cannot drift (the loader's figure
// follows the pencil tip instead, loader/follow.ts).
import { stepGestures, type GestureState } from './gestures';
import { MOVING_SPEED, PACES, stepMotion, type MotionState, type Pace } from './motion';
import type { Vec2 } from './vec';

export interface Figure {
  motion: MotionState;
  gestures: GestureState;
  /** The previous frame's target (pointer, keyboard focus, or touch target), to tell when it moved. */
  target: Vec2;
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
  const moved = input.target.x !== f.target.x || input.target.y !== f.target.y;
  const start = input.pressed ? { ...f.motion, idle: 0 } : f.motion;
  const dist = Math.hypot(input.target.x - start.pos.x, input.target.y - start.pos.y);
  const stepped = stepMotion(start, input.target, dt, size, pace);
  const motion = moved ? { ...stepped, idle: 0 } : stepped;
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
  return { motion, gestures, target: { ...input.target } };
}
