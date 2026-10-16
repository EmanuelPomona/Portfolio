---
id: TASK-201
title: Stickman motion engine, canvas rig, and lab page
status: REVIEW
owner: stickman
branch: agent/stickman
priority: HIGH
round: 0
depends_on: []
blocked_on: ""
---

# TASK-201: Stickman motion engine, canvas rig, and lab page

## Objective

Turn the owner-approved prototype (`docs/reference/stickman-cursor-spike.html`) into:
- a **tested, pure motion engine**;
- a **canvas renderer**;
- a dev-only **lab page** that reproduces the prototype's feel exactly.

The prototype's tuned numbers are the spec. Port them; do not re-tune them.

## Scope

- **Create:**
  - `frontend/src/stickman/engine/vec.ts`: `Vec2` and small helpers.
  - `frontend/src/stickman/engine/motion.ts` and `.test.ts`
  - `frontend/src/stickman/engine/gestures.ts` and `.test.ts`
  - `frontend/src/stickman/engine/pose.ts` and `.test.ts`
  - `frontend/src/stickman/render/drawFigure.ts`
  - `frontend/src/stickman/lab/main.tsx` and `frontend/src/stickman/lab/Lab.tsx`
  - `frontend/stickman-lab.html`. Dev-only; Vite builds only `index.html`.
- **Do not edit:** `frontend/src/stickman/index.ts`, `types.ts`, or `contract.test.tsx`
  (manager-owned).

## Interfaces

**Produces**, consumed by TASK-202 to 204:

```ts
export interface Vec2 { x: number; y: number }
export interface MotionState { pos: Vec2; speed: number; facing: 1 | -1; phase: number; idle: number }
export function desiredSpeed(distance: number): number
export function stepMotion(s: MotionState, target: Vec2, dt: number, size: number): MotionState
export interface GestureState { cheer: number; point: number; sit: number }
export interface GestureInputs { moving: boolean; arrived: boolean; onTarget: boolean; pressed: boolean }
export function stepGestures(g: GestureState, s: MotionState, i: GestureInputs, dt: number): GestureState
export interface Pose { /* joint angles + offsets in 40-unit rig space; your design */ }
export function computePose(s: MotionState, g: GestureState, pointAngle: number, clock: number): Pose
export function drawFigure(ctx: CanvasRenderingContext2D, pose: Pose, at: Vec2,
  opts: { size: number; facing: 1 | -1; lineWidth: number; color: string; pencil?: boolean }): void
```

These values come from the prototype and are fixed:
- `desiredSpeed(d) = d > 1.2 ? min(min(1150, 150 + 2.4·d), 7·d) : 0`
- speed eases toward desired at rate 10/s: `speed += (desired − speed)·min(1, 10·dt)`
- the step toward the target is clamped so he never overshoots
- facing flips only when `|dx| > 1.5` and `speed > 6`
- moving means `speed > 8`
- `phase += speed·dt / (size·0.5)`
- `idle` resets while moving
- sit target is `idle > 5 ? 1 : 0`, eased at rate 4/s
- cheer decays at 1.4/s
- point eases at rate 8/s, and only when `!moving && cheer === 0 && arrived && onTarget`, where
  `arrived` means `d < 1.5·size`
- run blend is `clamp((speed − 220)/500, 0, 1)`
- line width is `size < 15 ? 1.15 : size < 22 ? 1.45 : 1.8` px

## Acceptance Criteria

- [ ] **S-10** (engine part): every test below is written **before** its implementation, per
      protocol §14, and passes.
- [ ] **S-03:** in the lab at 32px, an 800px jump runs with a lean and arrives in about 1.2s
      or less, and a 50px move walks.
- [ ] **S-02** (lab parity): the lab at 32px, hurry, and ring is indistinguishable from the
      reference file side by side. Record a short screen recording
      `docs/review/F-201-lab-parity.webm` or `.gif`.
- [ ] **Tests:**
  - `desiredSpeed table`:

    | d | Expected |
    |---|---|
    | 0 | 0 |
    | 1.2 | 0 |
    | 10 | 70 |
    | 100 | 390 |
    | 400 | 1110 |
    | 500 | 1150 |
    | 10000 | 1150 |

  - `stepMotion never overshoots the target`
  - `facing does not flip on |dx| ≤ 1.5`
  - `idle accumulates only when speed ≤ 8`
  - `sit approaches 1 after 5s idle and returns to 0 when moving`
  - `cheer decays from 1 to 0 in ~0.71s`
  - `point only rises when arrived on a target and not cheering`
- [ ] `npm run test:contract` still passes (the stubs are untouched by this task).

## Steps

1. Invoke `superpowers:test-driven-development`. Write `motion.test.ts`, run it and see the
   failure, implement `motion.ts`, run it and see it pass, then commit
   `feat: add stickman speed law and motion step`.
2. Same cycle for `gestures.ts`. Commit.
3. Write `pose.ts` (`computePose`), porting the prototype's rig:
   - legs 8+8, arms 6.4+6, torso to neck 13.2, head radius 3.9 at 17.4, hip at −16;
   - bob, lean, hop, and sit blends;
   - the cheer wave `sin(clock·22)·0.35`.

   Test: `standing pose has feet at y=0 and head above hip`. Commit.
4. Write `drawFigure.ts`, porting the prototype's `limb()` and `draw()` and adding an optional
   pencil in the front hand for the loader. Commit.
5. Build the lab page:
   - a full-viewport canvas over the alpine photo (`/media/backgrounds/alpine-valley-1672.jpg`);
   - the ring;
   - controls for size 28/32/36, pace, and ring/dot;
   - a few links and a dark window as targets.

   Verify parity in the browser. Commit.

## Notes

- **Skills:**
  - `ecc:frontend-design-direction`, `frontend-design:frontend-design`, `ui-ux-pro-max:ui-ux-pro-max`,
    and `design-taste-frontend` before the lab UI. Keep the lab spartan; it is a tool.
  - `ecc:motion-foundations` for easing review.
  - Before handoff: `superpowers:requesting-code-review` and
    `superpowers:verification-before-completion`.
- The rig uses 40-unit local space with feet at the origin, scaled by `size / 40`. This is how the
  prototype works.

## Review History

| Round | Verdict | Summary |
|---|---|---|
