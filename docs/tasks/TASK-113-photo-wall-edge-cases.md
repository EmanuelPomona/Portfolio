---
id: TASK-113
title: Photo wall edge cases: when a one-row tile may break the two-row rule
status: BACKLOG
owner: frontend
branch: agent/frontend
priority: LOW
round: 0
depends_on: [TASK-111]
blocked_on: ""
---

# TASK-113: Photo wall edge cases: when a one-row tile may break the two-row rule

## Objective

Raised by frontend in TASK-111 (HANDOFF-8). The two-row rule ("no tile shorter than two row units")
removed the sliver tiles but costs unusual sets: 4+ landscape-only photos on 4 columns get
near-square tiles; uniform 16:9 sets on 4 columns lose span variety or get a full-width gutter; uniform
4:1 panoramas get gutters or stacks; phone panoramas wider than 4:1 crop past factor 2.

**Manager's ruling, one principle: a one-row tile is allowed only when it is the photo's own shape, or
when the alternative is worse than a sliver.**
- (a) To avoid a full-width gutter: **no** (a sliver reads worse than a gutter).
- (b) To avoid collapsing into a single-width stack of full-width cards: **yes** (a stack is the
  uniform grid the owner rejected).
- (c) For panoramas wider than 4:1 on phones: **yes** (the one-row tile is the panorama's own shape).

## Acceptance Criteria

- [ ] Tests: `a one-row tile appears only for a panorama wider than 4:1 or to avoid a single-width stack`;
      the existing two-row test narrowed to that exception.
- [ ] Today's five slots and every realistic mix keep their current layouts.

## Notes

Start when the owner's real photos arrive, or when frontend is next free. Not urgent.

## Review History

| Round | Verdict | Summary |
|---|---|---|
