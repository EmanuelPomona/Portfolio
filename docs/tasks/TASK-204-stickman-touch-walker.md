---
id: TASK-204
title: Touch walker for coarse pointers (behind flag, off in production)
status: READY
owner: stickman
branch: agent/stickman
priority: MEDIUM
round: 0
depends_on: [TASK-202]
blocked_on: ""
---

# TASK-204: Touch walker for coarse pointers (behind flag, off in production)

## Objective

Build the phone version of the stickman so the owner can tune it in the lab, as he did on desktop.
- He stands about 24px tall on the bottom edge of the screen.
- He walks while the page scrolls and runs to the x of a tap.
- He cheers when a tap hits a target, and never blocks a tap.

It ships behind `flags.touchStickman`, which **stays `false`**. Only the manager flips it, after
the owner approves (approved design §5.14).

## Scope

- **Create:** `frontend/src/stickman/layer/touchWalker.ts` and `.test.ts`
- **Modify:**
  - `frontend/src/stickman/layer/StickmanLayer.tsx`, for touch mode when
    `resolveActivation` returns `'touch'`;
  - the lab page, to add a "touch walker" toggle that overrides the flag locally.

## Interfaces

**Consumes**
- `MotionState`, `stepMotion`, `stepGestures`, `computePose`, `drawFigure` (TASK-201).
- `resolveActivation` (TASK-202).

**Produces**
- `touchTarget(s: MotionState, input: { scrollVelocity: number; tapX: number | null; viewportWidth: number }, dt: number): Vec2`
  - The next target on the bottom line.
  - A tap sets the target x, clamped to `[16, viewportWidth − 16]`.
  - Scroll velocity, in px/s, walks him forward in his facing direction at `min(|v|·0.25, 180)`
    px/s, turning around at the edges.

## Acceptance Criteria

- [ ] **T-01:** with the flag `false`, a coarse pointer shows no stickman and taps are native.
      This is covered by the contract test plus a manual check.
- [ ] **T-02:** in the lab with the toggle on, in 390px touch emulation:
  - he stands above `env(safe-area-inset-bottom)` at about 24px;
  - he walks during scroll;
  - he runs to the x of a tap;
  - he cheers on a target tap;
  - he never blocks taps.

  Record `docs/review/F-204-touch-walker.webm` or `.gif`.
- [ ] **T-03:** `frontend/src/config/flags.ts` is unchanged on this branch.
- [ ] **Tests:**
  - `tap sets target x clamped to the viewport`
  - `scroll velocity walks him at most 180 px/s`
  - `turns around at the edges`
  - `no target change without input`

## Steps

1. TDD `touchWalker.ts`. Commit.
2. Touch mode in StickmanLayer: the same canvas, a bottom-line anchor, and passive `touchstart`
   and `scroll` listeners. Commit.
3. Lab toggle, evidence. Commit.

## Notes

- **Skills:** `superpowers:test-driven-development`; `apple-design` for touch feel (optional);
  `ecc:browser-qa`.
- Phones are complete without this walker, so it is MEDIUM priority. Ship TASK-202 and 203 first.

## Review History

| Round | Verdict | Summary |
|---|---|---|
