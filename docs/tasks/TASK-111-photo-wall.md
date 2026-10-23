---
id: TASK-111
title: About photo wall as a data-driven asymmetrical bento grid
status: REVIEW
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-105, TASK-108]
blocked_on: ""
---

# TASK-111: About photo wall as a data-driven asymmetrical bento grid

## Objective

The owner asked to redesign the About photo collage as a "Dynamic Asymmetrical Bento Grid" and
approved the manager's playback (ADR-013). Replace the overlapping scatter with one solid rectangle
of tiles whose widths and heights vary, generated from `about.photos`, deterministic, and shaped by
each photo's orientation. Only the gallery changes; the rest of About stays as it is.

**References (the owner's).** (1) An editorial bento of portraits: about five equal columns, one big
feature tile spanning two columns and most of the height, the other columns split at different
heights (short over tall, tall over short), so no horizontal gutter crosses the whole wall; a thin
uniform gutter; slightly rounded corners; the whole thing a perfect rectangle. (2) A sheet of tiled
"collage frames": squares filled edge to edge with irregular rectangles and one gutter. Aim for (1)'s
art direction; never copy its slightly rounded large radius beyond the site's existing token.

**Owner hold continues:** no deploy, no push. Commit locally only.

## Scope

- **Create:** `frontend/src/lib/photoWall.{ts,test.ts}` (pure planner),
  `frontend/src/sections/About/PhotoWall.{tsx,module.css,test.tsx}`.
- **Modify:** `frontend/src/sections/About/About.{tsx,module.css,test.tsx}` (remove the scatter),
  `PhotoSlot` only if it must accept a tile instead of an aspect (keep its rest/attention behavior).
- **Never:** content files, contract files, other sections.

## Interfaces

**Produces** (`frontend/src/lib/photoWall.ts`):
- `type Orientation = 'portrait' | 'landscape' | 'square'`
- `orientationOf(ratio: number): Orientation` (width / height; < 0.85 portrait, > 1.18 landscape)
- `interface WallItem { readonly id: string; readonly ratio: number }`
- `interface Tile { readonly id: string; readonly col: number; readonly row: number; readonly colSpan: number; readonly rowSpan: number }` (1-based starts)
- `interface WallLayout { readonly columns: number; readonly rows: number; readonly source: 'curated' | 'packed'; readonly tiles: readonly Tile[] }`
- `ROW_UNIT = 0.5` (a row is half a column width; a tile's ratio is `colSpan / (rowSpan * ROW_UNIT)`, gutters ignored)
- `planWall(items: readonly WallItem[], columns: 2 | 4 | 6): WallLayout`: curated patterns for 1 to 6
  items (choose the pattern, and the assignment of photos to its tiles, that best fits
  orientations, with deterministic tie-breaks by order and id); a gap-free packing for 7 or more.

**Consumes:** `about.photos` (`aspect` while `image` is null), `getMedia(image)` `width`/`height`
for the real ratio, `useMediaQuery`, `useFogReveal` / arrivals (TASK-108).

## Acceptance Criteria

- [ ] **A-01, A-02, A-03, A-04, A-05, A-06** (`docs/ACCEPTANCE.md`), **X-02**, **X-05**, **R-01**, **F-03**.
- [ ] Planner tests, by name:
  - `orientationOf classes ratios: below 0.85 portrait, above 1.18 landscape, else square`
  - `fills the rectangle exactly: every cell covered once, no overlap` (n = 1..12, columns 2/4/6, ratio mixes: all portrait, all landscape, all square, alternating, and today's five aspects)
  - `is deterministic: the same items give the same layout`
  - `gives every photo a tile of its own orientation, up to 6 photos on 4 and 6 columns`
  - `keeps every tile within a factor of 2 of its photo's ratio, even for extremes` (include 4:1 and 1:3)
  - `varies spans: with 3 or more photos, at least two column spans and two row spans`
  - `staggers rows: with 4 or more photos on 4 and 6 columns, no horizontal gutter crosses the full width`
  - `uses curated patterns up to 6 photos and packing from 7`
  - `composes 1 and 2 photos into a solid, intentional rectangle`
  - `2 columns: a solid rectangle with at least two tile sizes`
- [ ] Component tests, by name:
  - `places every about.photos entry by grid-column and grid-row spans from planWall`
  - `uses the image's manifest ratio, and aspect while the slot is empty`
  - `switches to 6, 4, and 2 columns at the desktop, tablet, and phone breakpoints`
  - `renders no wall for zero photos`
  - `a caption sits on a solid label at the tile's bottom edge, only when written`
  - `the wall CSS has no absolute positioning and one gap` (from the CSS source)
- [ ] Browser evidence (production build): `docs/review/F-111-wall-{1440,768,390}.png` with today's
      five empty slots; arrivals settle; console clean; axe 0.
      **Owner decision (2026-10-19):** the fixture walls (3/6/9/12) are cancelled ("Skip samples,
      finish"); the planner's unit tests over 1 to 12 photos stand in for them, and the owner will
      judge real layouts when the photos arrive. The caption X-02 check is covered by its component
      test until a real caption exists.

## Steps

1. Invoke `frontend-design:frontend-design` and `animate` (only if motion changes) before the UI;
   record their answers. `superpowers:test-driven-development` before code.
2. TDD the planner: orientation, then the rectangle invariant over all n and columns, then the
   curated patterns 1..6 (draw them on paper first, after reference (1)), then packing, then the
   staggering and variety rules. Commit at each green step.
3. TDD `PhotoWall`, then swap it into `About`; delete the scatter CSS. Commit.
4. Browser check at 1440/768/390 with today's slots (fixture walls cancelled by the owner).
   Commit with evidence.

## Notes

- **Skills:** `frontend-design:frontend-design`, `superpowers:test-driven-development`,
  `ecc:browser-qa`; before handoff `superpowers:requesting-code-review`,
  `superpowers:verification-before-completion`.
- Packing idea, not a mandate: chunk 7+ photos into groups of 3 to 6 and stack curated patterns,
  alternating mirrored variants, so the wall stays art-directed and gap-free.
- Portraits use `object-position: 50% 35%`; others centered.

## Review History

| Round | Verdict | Summary |
|---|---|---|
