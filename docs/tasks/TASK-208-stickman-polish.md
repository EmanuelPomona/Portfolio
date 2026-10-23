---
id: TASK-208
title: Stickman polish: a jitter dead zone for sitting, and stale 1.2s wording
status: BACKLOG
owner: stickman
branch: agent/stickman
priority: LOW
round: 0
depends_on: [TASK-207]
blocked_on: ""
---

# TASK-208: Stickman polish: a jitter dead zone for sitting, and stale 1.2s wording

## Objective

Raised by the slice in TASK-207 (HANDOFF-3, Known Issues).

1. **Dead zone (manager's ruling).** Since TASK-207 any pointer move restarts the 2s sit clock, even
   one under 1.2px that does not make him walk. A pen hovering or a jittery sensor would make him
   stand up (~0.5s) and sit again 2s later. Mice and trackpads send no moves while still, so this is
   rare. Ruling: moves that keep the pointer within **4px** of where the current stillness began do
   not restart the clock; a move beyond 4px does, exactly as now.
2. **Stale wording.** `loader/Loader.tsx` line 4's header comment says "minimum 1.2s", and the test at
   `loader/Loader.test.tsx` line 51 is named for 1.2s while it asserts `MIN_MS` = 2200 (TASK-206).

## Acceptance Criteria

- [ ] Tests: `jitter within 4px does not restart the sit clock`; `a move beyond 4px restarts it`;
      the existing "any move stands him up" test updated to the 4px rule.
- [ ] The two stale 1.2s mentions say 2.2s.
- [ ] S-04 timings unchanged for real moves (2.0s start, ~2.47s seated).

## Notes

Not urgent. Start when the slice is next free.

## Review History

| Round | Verdict | Summary |
|---|---|---|
