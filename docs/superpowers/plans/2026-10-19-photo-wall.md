# About Photo Wall (asymmetrical bento) Implementation Plan

> **For agentic workers:** executed by the frontend agent session in its own worktree
> (AGENT_PROTOCOL §15), task by task; steps use checkbox syntax.

**Goal:** Replace the About scatter with a data-driven, deterministic asymmetrical bento wall.

**Architecture:** A pure planner (`frontend/src/lib/photoWall.ts`) turns `{ id, ratio }[]` and a
column count into explicit grid placements: curated patterns up to 6 photos, deterministic packing
beyond. A `PhotoWall` component renders `about.photos` with CSS Grid spans and the existing
`PhotoSlot` rest/attention behavior.

**Tech Stack:** React, TypeScript, plain CSS Grid, Vitest. No new dependency (ADR-002).

**Spec:** ADR-013; `docs/ACCEPTANCE.md` A-01, A-04, A-05, A-06; `docs/DESIGN_BRIEF.md` "Photo wall";
`docs/API.md` §1 `about.photos`; the owner's two references (described in ADR-013 and TASK-111).

## Global Constraints

- CSS Grid `grid-column` / `grid-row` with spans only; no absolute positioning, no masonry, no uniform grid.
- One solid rectangle, one gutter, corners sharp or slightly rounded (use the existing radius token).
- Columns: 6 at ≥ 64rem, 4 at ≥ 48rem, 2 below; row unit = half a column width.
- Orientation: ratio < 0.85 portrait, > 1.18 landscape, else square.
- Deterministic: no randomness, no `Date`, no layout reads in the planner.
- The About section's colors, background, type, rest/attention states, empty mist panels, and settle arrival are unchanged.
- No em dash in copy (D-05); budgets F-02, CLS F-03, contrast X-02 hold.

## Review Focus

1. Extreme ratios (a 4:1 panorama, a 1:3 phone screenshot): the wall stays solid and the crop stays bounded. (`keeps every tile within a factor of 2 of its photo's ratio, even for extremes`)
2. One or two photos: still a deliberate composition, not a lone stretched tile. (`composes 1 and 2 photos into a solid, intentional rectangle`)
3. Adding a 7th photo switches from curated to packing without a broken wall. (`fills the rectangle exactly...` over 1..12)
4. A phone at 390: still varied, never a single column of equal cards. (`2 columns: a solid rectangle with at least two tile sizes`)
5. A long caption once written: stays on one solid label inside its tile and passes X-02. (`a caption sits on a solid label at the tile's bottom edge, only when written`)

---

Task: TASK-111 (frontend).
