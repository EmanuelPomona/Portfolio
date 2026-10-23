---
id: TASK-112
title: Photo wall stays a sensible height for one or two photos
status: BACKLOG
owner: frontend
branch: agent/frontend
priority: LOW
round: 0
depends_on: [TASK-111]
blocked_on: ""
---

# TASK-112: Photo wall stays a sensible height for one or two photos

## Objective

Raised by frontend in TASK-111 (HANDOFF-7). A single 2:3 portrait fills the full text column and makes
a wall about 1960px tall at 1440. Ruling: **the wall is never taller than about one viewport at
desktop** (cap ~ 80vh or 760px, whichever is smaller); for one or two photos, narrow the wall (fewer
columns, start-aligned in the text column) rather than crop harder. Today's five slots are unaffected.

## Acceptance Criteria

- [ ] 1 and 2 photos of every orientation: wall height ≤ the cap at 1440 and 768; still a solid
      rectangle (A-04), orientation kept (A-05).
- [ ] 3+ photos: layouts unchanged (existing tests stay green).

## Notes

Start when the owner's real photos arrive, or when frontend is next free. Squares exception and the
orientation-over-side-by-side pair trade-off are accepted as built (manager, 2026-10-19).

## Review History

| Round | Verdict | Summary |
|---|---|---|
