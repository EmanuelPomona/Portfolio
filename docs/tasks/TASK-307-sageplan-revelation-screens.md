---
id: TASK-307
title: SagePlan and Revelation Youth screenshots in their windows
status: READY
owner: backend
branch: agent/backend
priority: HIGH
round: 0
depends_on: [TASK-305]
blocked_on: ""
---

# TASK-307: SagePlan and Revelation Youth screenshots in their windows

## Objective

The owner uploaded screenshots for the last two empty windows: "go ahead and update the screens for
the other 2 projects as I have uploaded the screenshots for them". After this, all four windows show
real media. No contract change: screenshots are already in the contract (TASK-305 did StreetSafe).

**Owner hold continues:** no deploy (no `vercel` calls) and no push. Commit locally only.

## Inputs (gitignored; copy, never reference)

Both are 1920×937 RGBA. The names contain a narrow no-break space (U+202F) before "PM": use globs.
- `docs/inputs/Screenshot 2026-10-18 at 11.58.42*PM.png` is **SagePlan** (light theme; content
  column x 330..1577; rows 0..7 are the browser's dark edge and shadow; a scrollbar from x≈1904).
- `docs/inputs/Screenshot 2026-10-18 at 11.59.00*PM.png` is **Revelation Youth** (dark green hero;
  content x 393..1515; rows 0..1 are the browser edge; a scrollbar from x≈1904).

## Scope

- **Create:**
  - `frontend/media-src/projects/sageplan.png`: crop **left 210, top 8, width 1486, height 929**
    (16:10, centred on the content column, edge and scrollbar removed), alpha flattened.
  - `frontend/media-src/projects/revelation-youth.png`: crop **left 206, top 2, width 1496,
    height 935** (exactly 16:10; title, nav, theme toggle, and both info lines kept).
  - Their renditions and manifest entries from `npm run media`.
- **Modify:** `frontend/src/content/projects.ts` (the two screens), `site.updated` to `2026-10-19`.
- **Never:** `types.ts`, `media.ts`, any frontend component or test, `index.html`, `vite.config.ts`.

Look at both crops before committing. If a crop cuts anything the description lists as kept, adjust
by the smallest amount and record the new rect in your handoff.

## Content values

- `sageplan`: `screen: { image: 'projects/sageplan', alt: 'SagePlan planner page with a pasted course history and the Breadth, Overlays, and Foundations requirement circles' }`
- `revelation-youth`: `screen: { image: 'projects/revelation-youth', alt: 'Revelation Youth home page: the name in large serif over a blurred green background, with the tagline Just a Moment With God' }`

## Acceptance Criteria

- [ ] **C-09, C-11, C-21, C-22** pass; `validateContent(content)` returns `[]`.
- [ ] **B-02:** `npm run media` twice: the second prints 0 written and `git status` is clean.
- [ ] npm test, typecheck, lint, build, and `scripts/contract-test.sh` all exit 0. The shipped-window
      tests are data-driven and must stay green with all four windows filled.
- [ ] Evidence `docs/review/B-307-media.txt`: both crop rects, both source and output dimensions, the
      rendition widths and the largest AVIF size per image, and the command output above.

## Notes

- **Skills:** `superpowers:test-driven-development` only if you change code;
  `superpowers:verification-before-completion` before handoff.
- No frontend task: `BrowserWindow` already renders screenshots (W-04). The manager verifies all
  four windows in the browser at integration.

## Review History

| Round | Verdict | Summary |
|---|---|---|
