---
id: TASK-110
title: Project windows show screenshots and play recordings while attended
status: REVIEW
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-103]
blocked_on: ""
---

# TASK-110: Project windows show screenshots and play recordings while attended

## Objective

The owner's first real media lands in TASK-305 (backend): a StreetSafe: LA screenshot and a Snake AI
recording. Make `BrowserWindow` render `screen.video` exactly as `docs/API.md` §1 says (ADR-012),
and verify the real screenshot and recording in the browser once the manager syncs TASK-305 to you.

**Owner hold:** "dont actually connect the website for now". Do **not** deploy and do **not** push.
Commit locally only.

## Scope

- **Modify:** `frontend/src/components/BrowserWindow/BrowserWindow.{tsx,module.css,test.tsx}`; a
  hook in `frontend/src/hooks/` if the play/pause logic deserves one (with its test).
- **Never:** content files, `media-src/`, `public/`, contract files.

## Interfaces

**Consumes:** `ProjectScreen.video?: ProjectVideo` (`{ src, width, height }`) from `src/content`
(`types.ts`, already on main); `getMedia(screen.image)` for the poster; `useAttention`
(`attended`); `usePrefersReducedMotion`.

## Acceptance Criteria

- [ ] **W-08** (new), **W-03** (amended), **W-04**, **W-05** (no "screenshot soon" in a filled
      window's name), **X-05**, as written in `docs/ACCEPTANCE.md`.
- [ ] Tests, by name (mock `HTMLMediaElement.prototype.play/pause`; jsdom cannot play):
  - `renders a muted, looping, playsinline video with preload="none" and the poster from screen.image`
  - `plays on attention and pauses, holding its frame, when attention leaves`
  - `never plays under reduced motion; the poster shows instead`
  - `a rejected play() is swallowed, with no unhandled rejection or console error`
  - `falls back to the still poster when the video errors`
  - `the video is aria-hidden and the window's name is unchanged`
  - `fits the recording with contain on black` (from the CSS source)
- [ ] Browser evidence on the production build, after the manager's sync of TASK-305:
  - `docs/review/F-110-streetsafe-{rest,attention}.png` (the real screenshot, W-04);
  - `docs/review/F-110-snake-{rest,attention}.png` and `F-110-snake-hover.gif` (W-08);
  - network: no `.mp4` request before the Snake AI window is first attended;
  - reduced motion: the video never plays;
  - 390 with touch: center-band attention plays it, leaving the band pauses it;
  - console clean; axe 0 violations (label-in-name included).

## Steps

1. Invoke `animate` for the rest-to-play transition (if any) and record the answer.
2. TDD the seven tests, one at a time; commit each passing step.
3. Browser check with a fixture recording if you need one before the sync (any small H.264 MP4
   you generate in your scratchpad, never committed).
4. After the sync: real-content evidence. Commit.

## Notes

- **Skills:** `animate`, `superpowers:test-driven-development`, `ecc:browser-qa`; before handoff
  `superpowers:requesting-code-review`, `superpowers:verification-before-completion`.
- The window name logic (`, screenshot soon` only while empty) and the data-driven W-03 tests are
  already on main (`be53f05`, `b03068a`); keep them passing.
- Play only what someone is looking at: attention already implies the window is on screen; still
  pause on `visibilitychange` to hidden.

## Review History

| Round | Verdict | Summary |
|---|---|---|
