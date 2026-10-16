# Portfolio v1 Implementation Plan

> **For agentic workers:** this plan is executed by **separate Claude Code sessions in separate
> worktrees** (docs/AGENT_PROTOCOL.md §23), not by subagents. Each task file in `docs/tasks/` is
> self-contained; read it, plus this page's Global Constraints and Review Focus, before starting.

**Goal:** Ship Emanuel Ling's one-page portfolio: the stickman cursor, the scribbling loader, four
projects in dark browser windows that come alive on attention, About, and Connect. It is static,
fast, and accessible, and it is deployed on Vercel.

**Architecture:** A static Vite + React + TypeScript site in `frontend/`, with no runtime backend.
Three branches run in parallel against in-repo TypeScript contracts that the manager has already
scaffolded:
- `agent/frontend` builds the page;
- `agent/stickman` builds the loader and cursor behind `src/stickman/index.ts`;
- `agent/backend` builds content validation, the media pipeline, head metadata, and deployment.

**Tech Stack:** React 19.3, Vite 8.3, TypeScript 6.0.3, Vitest 5, Testing Library, ESLint 10 +
typescript-eslint, sharp 0.35, @fontsource (Instrument Serif, Manrope). Hosting is Vercel.

**Spec:** docs/superpowers/specs/2026-10-16-portfolio-design.md (approved by the owner), detailed in
docs/PRODUCT.md, docs/DESIGN_BRIEF.md, docs/ARCHITECTURE.md, docs/API.md, docs/DATABASE.md,
docs/ACCEPTANCE.md.

## Global Constraints

- **Node:** Node ≥ 22.22.2 locally; CI runs Node 24. TypeScript stays at 6.0.x (typescript-eslint
  requires <6.1).
- **Dependencies:** no new dependency without listing it under `### Contracts` in your handoff.
  The manager resolves `package.json` at integration.
- **Ownership:** edit only the paths your role owns (docs/ARCHITECTURE.md "Directory Structure and
  Ownership"). Contract files change only through a CONTRACT CHANGE REQUEST.
- **Fonts:** Instrument Serif (display) and Manrope (text) only.
- **Palette:** Mist `#E3E8E5`, Ivory `#F8F9F7`, Charcoal `#242424`, secondary `#4F5552`, Deep Forest
  `#0F2E24`, screen-off `#161616` / chrome `#242424`, traffic lights `#FF5F57` `#FEBC2E` `#28C840`.
  There is no pure white.
- **Copy:** no em dash (U+2014) in interface copy. No placeholder words. Empty slots say
  "screenshot soon" (project windows) or show nothing (photos).
- **Stickman:**
  - 32px tall on desktop, about 24px on touch;
  - ring 11px with a 1.2px stroke;
  - `desired = d > 1.2 ? min(min(1150, 150 + 2.4·d), 7·d) : 0`, with speed easing at rate 10/s;
  - runs above about 220px/s;
  - cheer about 0.7s; sit after 5s idle.
- **Loader:** progress reaches 90% by 1.2s; minimum 1.2s; cap 4.5s; skip on pointerdown or
  keydown; exit ≤ 600ms; fade mode 300ms; storage key `el:loader-seen`; `?loader=1` forces it.
- **Reduced motion:** no loader animation, no stickman, no fog drift, no reveal motion. All
  content stays present.
- **Evidence widths:** 1440, 768, 390, plus 1280 at 200% zoom (Review Focus 4).
- **Budgets:** initial JS ≤ 110 KB gzip, CSS ≤ 25 KB gzip, hero AVIF ≤ 250 KB, CLS ≤ 0.05;
  mobile Lighthouse Perf ≥ 90, A11y ≥ 95.
- **Commits:** small and frequent, `type: what changed`, no attribution trailers (protocol §24).
  A task normally produces 3 to 10 commits.

## Review Focus

These are inputs the spec implies but that no acceptance criterion pins. Each has a test in the
task that owns the code.

1. **Loader in a background tab, or with the hero already cached.** `decode()` resolves at once and
   rAF may never fire. The loader must still honor the 1.2s minimum and exit through timers. It
   calls `onDone` once. Test owner: **TASK-203**.
2. **Keyboard-only or not-yet-moved pointer on a desktop.** Before the first `pointermove` the ring
   is hidden, the figure stands at a sensible anchor (not 0,0), and keyboard focus still drives
   him. Test owner: **TASK-202**.
3. **Scrolling with the mouse held still.** The element under the ring changes without a
   `pointermove`. On scroll, the target is re-resolved and point or cheer state stays correct.
   Test owner: **TASK-202**.
4. **Narrow desktop windows and 200% zoom** (1024 to 1280px, or 1280 at 200% = 640 CSS px).
   There is no horizontal scroll, no overlapping caption and window, and the layout switches
   cleanly between alternating and stacked. Evidence owner: **TASK-106** (browser QA); layout
   rules in **TASK-104** and **TASK-105**.
5. **The owner's content growing later.** A sixth photo, a 120-character caption, a longer project
   title, and a real screenshot whose aspect is not 16:10 must not break the layout. The
   screenshot uses `object-fit: cover` inside the fixed screen ratio. Test owners: **TASK-103**
   (screenshot aspect), **TASK-104** (long title), **TASK-105** (six photos, long caption).

## Task map and order

| Owner (branch) | Order | Tasks |
|---|---|---|
| frontend (`agent/frontend`) | 101 → 102 → 103 → 104, 105 → 106 | design system and shell; hero and Picture; attention and BrowserWindow; projects; about; connect, polish, and evidence |
| stickman (`agent/stickman`) | 201 → 202 → 203 → 204 | engine, rig, and lab; desktop cursor; loader; touch walker (flag off) |
| backend (`agent/backend`) | 301, 302, 303 → 304 | content validator; media pipeline; head metadata and assets; Vercel config and preview |

**No task waits on another branch.** The scaffold already provides working stubs:
- stickman `Loader` and `StickmanLayer`;
- a one-JPEG media manifest;
- a no-op `seoPlugin`;
- real content.

Integration happens at the manager's fresh-session merge (`scripts/integrate.sh`).
