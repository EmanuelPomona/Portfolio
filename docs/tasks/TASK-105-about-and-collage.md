---
id: TASK-105
title: About section with classes and the scattered photo collage
status: IN_PROGRESS
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-102, TASK-103]
blocked_on: ""
---

# TASK-105: About section with classes and the scattered photo collage

## Objective

Build About from wireframe-3:
- the brief description;
- "This semester" with the two classes;
- a loose, overlapping scatter of five photo slots. **Not a grid.**

Each `PhotoSlot` is grayscale and sunk into the fog at rest, and comes to full color on
attention. The empty v1 slots are mist-tone panels at their aspect ratios.

## Scope

- **Create:**
  - `frontend/src/components/PhotoSlot/{PhotoSlot.tsx,PhotoSlot.module.css,PhotoSlot.test.tsx}`
  - `frontend/src/sections/About/{About.tsx,About.module.css,About.test.tsx}`
- **Modify:** `frontend/src/app/App.tsx`, to replace the skeleton about markup.

## Interfaces

**Consumes**
- `about: About` and `LifePhoto`
- `useAttention` (TASK-103)
- `Picture` (TASK-102)
- `Section` and `useFogReveal` (TASK-101)

**Produces**
- `<PhotoSlot photo={LifePhoto} sizes={string} />`
  - Renders a `<figure>` with `aspect-ratio` from `aspect`: `'4:3'` becomes `4 / 3`.
  - It sets `data-attended` and holds `Picture` or the empty panel.
  - `<figcaption>` appears only when `caption !== null`.
- `<About about={About} heading="About" />`
  - Inside `<Section id="about" backdrop="evergreen">`.
  - The collage positions slots by index with a deterministic scatter recipe. It works for 0
    to 8 photos, cycling positions after five.

## Acceptance Criteria

- [ ] **A-01:** the description, then "This semester", then Linear Algebra and Data Structures
      and Algorithms, then five slots at 4:3, 2:3, 4:3, 9:16, 4:3 in a scatter echoing
      wireframe-3.
- [ ] **A-02:** empty slots are mist panels with no placeholder words, and no `figcaption`
      when the caption is `null`.
- [ ] **A-03:** a fixture test with `image: 'backgrounds/evergreen-forest'` (test-only) asserts
      the `<img>` is present, `data-attended` toggles on hover and focus, and the rest-state
      class applies the grayscale filter.
- [ ] **R-02:** at 390 the collage is a designed phone arrangement: offset single or double
      column, still overlapping a little, never a shrunken desktop scatter. At 768 it is an
      intermediate arrangement.
- [ ] **Tests:**
  - `renders slots with aspect ratios 4/3, 2/3, 4/3, 9/16, 4/3 in order`
  - `no figcaption when caption is null`
  - **Review Focus 5:** `six photos render six slots` and `a 120-character caption renders
    fully`.
- [ ] Evidence: `docs/review/F-105-about-{1440,768,390}.png`, plus one attention screenshot
      with the fixture applied locally. Do not commit the fixture to content.

## Steps

1. TDD PhotoSlot. Commit.
2. TDD About markup. Commit.
3. Collage CSS per breakpoint. Verify in the browser and commit each breakpoint.
4. Reveal entrance and attention transition (grayscale and contrast to full), with none under
   reduced motion. Commit.
5. Evidence. Commit.

## Notes

- Do not render `about.descriptionIsDraft`.
- The collage's overlap must not trap focus or hide captions. Raise the attended slot's
  `z-index` within the collage only, staying well below `--z-nav`.

## Review History

| Round | Verdict | Summary |
|---|---|---|
