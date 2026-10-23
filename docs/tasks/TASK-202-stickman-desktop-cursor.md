---
id: TASK-202
title: StickmanLayer desktop cursor (fine pointer)
status: REVIEW
owner: stickman
branch: agent/stickman
priority: HIGH
round: 0
depends_on: [TASK-201]
blocked_on: ""
---

# TASK-202: StickmanLayer desktop cursor (fine pointer)

## Objective

Replace the `StickmanLayer` stub with the real desktop cursor. The full behavior is in API.md
§2.3:
- the activation matrix;
- the ring at the true pointer;
- `html.stickman-cursor`;
- default targets and the `data-stickman` opt-outs;
- point, cheer, and sit, plus the keyboard-focus reaction;
- pause when hidden;
- never intercepting input.

## Scope

- **Modify:** `frontend/src/stickman/layer/StickmanLayer.tsx`, the stub body.
- **Create:**
  - `frontend/src/stickman/layer/activation.ts` and `.test.ts`
  - `frontend/src/stickman/layer/targets.ts` and `.test.ts`
  - `frontend/src/stickman/layer/controller.ts` and `.test.ts`: the rAF loop, input wiring,
    and the canvas.
  - `frontend/src/stickman/layer/stickman.css`, imported by `StickmanLayer.tsx`.

## Interfaces

**Consumes**
- The TASK-201 engine and `drawFigure`.
- `StickmanLayerProps` from `../types`.
- The CSS var `--z-stickman`.

**Produces**
- `resolveActivation(q: { fine: boolean; coarse: boolean; reducedMotion: boolean; forcedColors: boolean; touch: boolean }): 'desktop' | 'touch' | 'off'`
- `findTarget(el: Element | null): Element | null`
  - Matches the nearest `a[href], button:not([disabled]), [data-stickman="target"]` ancestor.
  - Returns `null` inside `[data-stickman="ignore"]`.
- `createCursorController(canvas: HTMLCanvasElement, ring: HTMLElement, opts: { size: number }): { start(): void; stop(): void; handoff(at: Vec2): void }`
  - `handoff` is for TASK-203: the loader places him where the pencil was.
- Unchanged public signature: `StickmanLayer(props: StickmanLayerProps)`.

## Acceptance Criteria

- [ ] **S-01:** the native cursor is hidden and the ring sits exactly at the pointer. A click
      2px inside a nav link's edge activates it.
- [ ] **S-04:** point on rest, cheer on press (about 0.7s), sit after 5s. (2s from the pointer's stillness since TASK-207)
- [ ] **S-05:** a keyboard Tab to a link walks him to it, just below-left, and he points.
- [ ] **S-06:** visible on light fog and on a black window. Screenshots
      `docs/review/F-202-on-fog.png` and `F-202-on-window.png`.
- [ ] **S-07:** reduced motion, forced-colors, or a coarse pointer with `touch=false` leaves no
      stickman and no `html.stickman-cursor`. The class is removed on unmount and when a media
      query changes live.
- [ ] **S-08:** `document.elementFromPoint` at the ring position never returns the canvas or
      the ring (`pointer-events: none`), and text selection works.
- [ ] **S-09:** no long task over 50ms in a 5s trace of continuous movement. The rAF loop stops
      while `document.hidden`. Hovered-target rects are cached and refreshed only on
      `pointermove`, `scroll`, or `resize`.
- [ ] **S-10:** `npm run test:contract` passes against the real implementation.
- [ ] **Tests:**
  - `resolveActivation table` covers all 2^5 combinations, or the meaningful subset documented
    in the test.
  - `findTarget honours default selectors and data-stickman ignore/target`
  - `controller adds html.stickman-cursor in desktop mode and removes it on stop()`
  - **Review Focus 2:** `before the first pointermove the ring is hidden and the figure stands
    at the anchor (24px, innerHeight − 24px)`, and `keyboard focus moves the target`.
  - **Review Focus 3:** `a scroll event without pointermove re-resolves the target under the
    ring`. Stub `elementFromPoint`.

## Steps

1. TDD `resolveActivation`, then `findTarget`. Commit each.
2. TDD the testable parts of the controller (class lifecycle, anchor, re-resolution on scroll,
   focus target) with an injected clock and rAF. Commit.
3. Replace the stub with the real `StickmanLayer`. It subscribes to `matchMedia` changes for
   `(pointer: fine)`, `(pointer: coarse)`, `(prefers-reduced-motion: reduce)`, and
   `(forced-colors: active)`. Commit.
4. Write `stickman.css`:
   - the cursor-hiding rule from API.md §2.6;
   - the canvas and ring at `position: fixed`, `inset: 0`, `pointer-events: none`,
     `z-index: var(--z-stickman, 900)`, `mix-blend-mode: difference`;
   - `devicePixelRatio`-aware canvas sizing, capped at 2, and resizing on `resize`.

   Commit.
5. Verify in the browser on the main page (`npm run dev`) and in the lab, capture evidence, and
   commit.

## Notes

- **Skills:** `superpowers:test-driven-development`; `ecc:frontend-a11y` for forced-colors and
  focus; `ecc:react-performance` for the loop. Before handoff: `ecc:browser-qa`,
  `superpowers:requesting-code-review`, `superpowers:verification-before-completion`.
- The page is plain React with links. You need nothing from `agent/frontend` to verify; the
  skeleton's links are targets.

## Review History

| Round | Verdict | Summary |
|---|---|---|
