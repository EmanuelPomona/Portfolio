---
id: TASK-206
title: Loader minimum 2.2s, with the scribble and progress paced to match
status: READY
owner: stickman
branch: agent/stickman
priority: HIGH
round: 0
depends_on: [TASK-203]
blocked_on: ""
---

# TASK-206: Loader minimum 2.2s

## Objective

The owner asked: "Make the loading screen a little bit longer." Raise the show-mode minimum from
1.2s to **2.2s** (API.md §2.2, ADR-011) and stretch the progress ramp to reach 90% at 2.2s, so the
extra second reads as more drawing, not a stall. Unchanged: the 4.5s cap (L-02), skip on any
`pointerdown`/`keydown` (L-03), the 450ms exit, and fade mode (L-05). This supersedes TASK-203's
1.2s figures.

## Scope

- **Modify:** `frontend/src/stickman/loader/progress.{ts,test.ts}`, the loader's own tests that
  assume 1.2s, and the scribble pacing in `loader/scribble.ts` / `loader/artist.ts` if the ball would
  look finished before 2.2s; the lab replay if it hard-codes timing.
- **Never:** `index.ts`, `types.ts`, `contract.test.tsx` (manager), `index.html`, `flags.ts`.

## Acceptance Criteria

- [ ] **L-07** (round 2 text): visible at least 2200ms in show mode, even with the hero cached.
- [ ] **L-02, L-03, L-05, L-06** still hold.
- [ ] Tests, by name:
  - `progressAt rises to ~90 at 2200ms and holds without ready`
  - `with ready already resolved at mount, still waits the 2.2s minimum`
  - `a skip before the minimum still exits immediately`
  - `the cap is still 4500ms from mount`
  - `the scribble keeps adding path between 1.2s and 2.2s` (no stall in the drawing)
- [ ] The manager adds a contract clause at integration: "show mode with `ready` already settled does
      not call `onDone` before 2200ms". Make sure your implementation passes it.
- [ ] Evidence: `docs/review/F-206-results.txt` with measured times for L-07 (hero cached), L-02 (hero
      blocked), L-03 (click at about 300ms); `F-206-loader-2000ms.png` showing the drawing still
      growing.

## Steps

1. Change the tests above first; run; they fail on 1200. 
2. Change `MIN_MS` and the ramp; adjust scribble pacing if needed. `npm test` green. Commit.
3. Browser timing checks; evidence. Commit.

## Notes

- Skills: `superpowers:test-driven-development`; before handoff `superpowers:verification-before-completion`.
- `CAP_MS + EXIT_MS` stays ≤ 5000 (contract test bound).

## Review History

| Round | Verdict | Summary |
|---|---|---|
