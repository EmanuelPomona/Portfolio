---
id: TASK-309
title: C-17 allows up to 12 About photos (was 8)
status: REVIEW
owner: backend
branch: agent/backend
priority: MEDIUM
round: 0
depends_on: [TASK-301]
blocked_on: ""
---

# TASK-309: C-17 allows up to 12 About photos (was 8)

## Objective

The photo wall (TASK-111, ADR-013) is built and tested for 1 to 12 photos (A-05), but C-17 still caps
`about.photos` at 8, so a 9th photo fails validation. Raise the cap to **12** (DATABASE C-17, amended
on main). Nothing else in C-17 changes.

**Owner hold continues:** no deploy, no push. Commit locally only.

## Scope

- **Modify:** `frontend/src/content/validate.ts` (C-17 bound and its comment),
  `frontend/src/content/content.contract.test.ts` (C-17 cases), `frontend/src/content/README.md`
  (the owner guide's photo count).

## Acceptance Criteria

- [ ] Tests, both bases, one violation each: `13 photos violates C-17`; `12 photos is valid`.
- [ ] `validateContent(content)` returns `[]`; all gates exit 0.

## Notes

- **Skills:** `superpowers:test-driven-development`; `superpowers:verification-before-completion`.

## Review History

| Round | Verdict | Summary |
|---|---|---|
