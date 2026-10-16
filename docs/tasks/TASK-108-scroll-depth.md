---
id: TASK-108
title: Scroll depth and arrivals (backgrounds slower, plates from their side, prints settle)
status: READY
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-107, TASK-104, TASK-105]
blocked_on: ""
---

# TASK-108: Scroll depth and arrivals

## Objective

The owner asked for "Scroll animations". Give them one job, distance (brief "Motion vocabulary",
ADR-011): backgrounds and the TASK-107 clouds travel slower than the content; each project window
arrives from its own side with its caption a beat behind; each About print settles into place. The
existing fog-clear reveal stays.

## Scope

- **Create:** `frontend/src/lib/depth.{ts,test.ts}`, `frontend/src/hooks/useScrollDepth.{ts,test.tsx}`.
- **Modify:** `frontend/src/hooks/useFogReveal.*`, `frontend/src/styles/global.css`,
  `frontend/src/components/Section/*`, `frontend/src/components/Clouds/*`,
  `frontend/src/sections/{Hero,Projects,About}/*`.

## Interfaces

**Produces:**
- `depthOffset(m: { top: number; height: number; scrollY: number; viewportHeight: number }, factor: number, maxPx: number): number`
  in `lib/depth.ts`: the background's translateY in px. 0 when the element's center is at the
  viewport's center; proportional to that distance times `factor`; clamped to `[-maxPx, maxPx]`.
  `maxPx` is 80 (M-03).
- `useScrollDepth()`: one shared passive `scroll` listener for the page, work done in
  `requestAnimationFrame`, rects measured on mount and `resize` only; writes `--depth` (px) on each
  registered element; no-op, with `--depth` removed, under reduced motion.
- Arrivals: `data-arrive="from-left" | "from-right" | "settle"` on an element that already uses
  `useFogReveal`; the CSS offsets it until `data-revealed="true"`.

## Acceptance Criteria

- [ ] **M-03**, **M-04**, and **M-05**, as written in `docs/ACCEPTANCE.md`; **X-05**; **F-03**.
- [ ] Tests, by name:
  - `depthOffset is 0 when the element's center is at the viewport's center`
  - `depthOffset scales with distance by factor and is clamped to ±maxPx`
  - `useScrollDepth registers one passive scroll listener for any number of elements`
  - `useScrollDepth writes --depth inside requestAnimationFrame, never in the scroll handler`
  - `clears depth offsets when reduced motion turns on`
  - `plates arrive from their own side: data-arrive matches data-side`
  - `the caption's arrival starts after its window's`
  - `About prints settle with a stagger of at most 0.08s per print`
  - `reveals an element that is already above the viewport` (nav jump or `#about` load)
  - `focus within an unrevealed arrival reveals it immediately`
- [ ] Evidence: `docs/review/F-108-arrival-{1440,390}.webm` or `.gif` (scrolling through Projects and
      About), and a performance trace summary of 5s of scrolling with no long task over 50ms.

## Steps

1. Invoke `animate` for the arrival curves and distances; record its answer.
2. TDD `depthOffset` (pure). Commit.
3. TDD `useScrollDepth`. Commit.
4. TDD arrivals (data-arrive, above-viewport, focus). Commit.
5. Wire backgrounds and clouds to `--depth`; browser check at 1440/768/390, reduced motion, nav
   jumps, keyboard Tab through Projects. Commit.
6. Evidence. Commit.

## Notes

- Skills: `animate`, `superpowers:test-driven-development`, `ecc:browser-qa`; before handoff
  `superpowers:requesting-code-review`, `superpowers:verification-before-completion`.
- The stickman caches hovered targets' rects: arrivals finish before a window can be attended,
  and the windows themselves are not parallaxed (only backgrounds and clouds are), so his pointing
  stays true.
- Arrival distances stay small (about 48px for windows, 16px for captions and prints); the fog
  does the drama.

## Review History

| Round | Verdict | Summary |
|---|---|---|
