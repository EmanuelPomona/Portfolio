---
id: TASK-106
title: Connect section, footer, polish pass, and full-page evidence
status: READY
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-102, TASK-104, TASK-105]
blocked_on: ""
---

# TASK-106: Connect section, footer, polish pass, and full-page evidence

## Objective

Finish the page:
- the Connect section (LinkedIn, Email, GitHub) and a quiet footer;
- a polish pass over everything;
- the full evidence set the reviewer gates on.

## Scope

- **Create:** `frontend/src/sections/Connect/{Connect.tsx,Connect.module.css,Connect.test.tsx}`
- **Modify:** `frontend/src/app/App.tsx`, plus any frontend-owned file for polish fixes.
- **Evidence:** `docs/review/F-*`

## Interfaces

**Consumes**
- `contact.links`, `site.name`, `site.updated`
- Everything from TASK-101 to TASK-105.

**Produces**
- `<Connect links={readonly Link[]} heading="Contact" />`, inside `<Section id="contact">`.
- A footer with "© 2026 Emanuel Ling".
  - Nice-to-have: "Updated <Month YYYY>", derived from `site.updated`. No em dash.

## Acceptance Criteria

- [ ] **K-01:** the exact hrefs, and Email is `mailto:emanuelling27@gmail.com`.
- [ ] **R-01, R-02, R-03:** `docs/review/F-01-desktop-1440.png`, `F-02-tablet-768.png`, and
      `F-03-mobile-390.png` as full-page captures, with no horizontal scroll at any width.
- [ ] **Review Focus 4:** `docs/review/F-zoom-1280-200pct.png`, with no overlap and no
      horizontal scroll.
- [ ] **States:** `docs/review/F-NN-state-empty.png` (window and photo empty states) and
      `F-NN-state-attention.png`. There is no loading or error state in the page itself: the
      loader belongs to the stickman slice, and image errors fall back to empty.
- [ ] **X-01, X-02:** local Lighthouse Accessibility ≥ 95 on `npm run build && npm run preview`,
      and axe shows no critical violations. Measure contrast over the photos and record the
      numbers in the handoff.
- [ ] **D-01 to D-05:**
  - self-check against `docs/DESIGN_CONSTRAINTS.md` §5;
  - `scripts/slop-check.sh frontend` output pasted into the handoff, with every hit justified
    in the brief or removed;
  - no U+2014 in `frontend/dist` (outside sourcemaps).
- [ ] **F-02:** paste the `vite build` sizes into the handoff. JS must be ≤ 110 KB gzip and CSS
      ≤ 25 KB gzip.
- [ ] **F-03:** the CLS from the Lighthouse run is ≤ 0.05.
- [ ] **I-02:** `docs/review/F-console.txt` for the primary flow, with zero errors and zero
      warnings.
- [ ] **Connect test:** `renders LinkedIn, Email, GitHub in order with exact hrefs`.

## Steps

1. TDD Connect. Commit.
2. Footer. Commit.
3. Invoke `ecc:make-interfaces-feel-better` and apply its findings: spacing, optical alignment,
   hit areas, text wrapping. Commit each logical fix separately.
4. Invoke `ecc:browser-qa`. Capture every artifact above, then commit the evidence.
5. Invoke `superpowers:requesting-code-review`, then
   `superpowers:verification-before-completion`. Write the handoff to
   `docs/handoffs/agent-frontend.md`.

## Notes

- If the stickman branch has not been integrated yet, the page shows the native cursor (stub).
  That is expected. List the stickman-dependent checks (S-06, D-02) under What Was NOT Verified.
- "Contact" is the nav label (`site.nav`). The section heading matches it.

## Review History

| Round | Verdict | Summary |
|---|---|---|
