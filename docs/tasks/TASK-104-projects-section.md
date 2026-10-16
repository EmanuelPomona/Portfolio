---
id: TASK-104
title: Projects section with alternating windows and captions
status: REVIEW
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-103]
blocked_on: ""
---

# TASK-104: Projects section with alternating windows and captions

## Objective

Build the Projects section from wireframe-2, in the plate-book rhythm the brief describes.
- Four `BrowserWindow`s, in content order, alternate sides on wide screens, with each caption
  set opposite its window.
- **Caption:** the number `0N`, the italic title, the one sentence, the meta line, and the
  secondary links.
- **On phones:** each project stacks as window, then caption.
- About one window and its caption per screen height on desktop.

## Scope

- **Create:** `frontend/src/sections/Projects/{Projects.tsx,Projects.module.css,Projects.test.tsx}`
- **Modify:** `frontend/src/app/App.tsx`, to replace the skeleton projects markup.

## Interfaces

**Consumes**
- `projects: readonly Project[]`
- `BrowserWindow` (TASK-103)
- `Section` and `useFogReveal` (TASK-101)

**Produces**
- `<Projects projects={readonly Project[]} heading="Projects" />`
  - Each project renders as `<article id={`project-${id}`} data-side="left|right">`.
    - Even indexes put the window on the left; odd indexes on the right.
    - The heading is `h3`, holding the number and the italic title.
  - Inside `<Section id="projects" backdrop="evergreen">`.

## Acceptance Criteria

- [ ] **W-01:** at 1440 and 1280, the four projects appear in content order and alternate.
      Each shows its number, italic title, exact sentence, meta (joined " · "), and secondary
      links.
- [ ] **P-02:** a fresh tester reaches every primary link within 10s of the loader ending, using
      the nav or scrolling.
- [ ] **R-02:** at 768 and 390, every project stacks with the window first. There is no overlap
      and no horizontal scroll.
- [ ] **Review Focus 4:** layout rules hold from 1024 to 1280px, and at 1280 with 200% zoom.
      Below 1024 the layout stacks; at 1024 and up it alternates with no caption collision.
      Capture `docs/review/F-104-projects-1024.png` and `F-104-projects-1280.png`.
- [ ] **Tests:**
  - `renders four articles in content order with numbers 01..04`
  - `caption shows the exact sentence and meta joined by " · "`
  - `secondary links never repeat the primary href`
  - `data-side alternates left,right,left,right`
  - **Review Focus 5:** `a 60-character title fixture renders without truncation`. Assert the
    full text is present. Set `overflow-wrap: anywhere` and `text-wrap: balance` on titles in
    CSS.

## Steps

1. Write the tests, implement the markup, and commit `feat: render projects in content order`.
2. Write the layout CSS:
   - at 1024px and up, a two-column composition that alternates;
   - below 1024, stacked;
   - the caption text column at about 36 to 44ch.

   Commit after each breakpoint is verified in the browser, for example
   `style: alternate project windows at 1024+`.
3. Add the `useFogReveal` entrance per article.
4. Capture evidence at 1440, 1280, 1024, 768, and 390. Commit.

## Notes

- The brief's anti-character applies: no cards around captions, no pill tags for `meta`, and
  the `meta` line is plain small text.
- `sizes` for BrowserWindow: `(min-width: 1024px) 56vw, 92vw`, tuned to the actual layout.

## Review History

| Round | Verdict | Summary |
|---|---|---|
