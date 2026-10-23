---
id: TASK-207
title: The stickman sits after 2s without movement (was 5s)
status: REVIEW
owner: stickman
branch: agent/stickman
priority: HIGH
round: 0
depends_on: [TASK-202]
blocked_on: ""
---

# TASK-207: The stickman sits after 2s without movement (was 5s)

## Objective

The owner asked: "decrease the time required for the cursor to be idle to make the stickman sit
down? If the user leaves the thingy in the position for 2 seconds, then make the stickman sit down."
Change the idle-sit threshold from 5s to **2s** (API.md §2.3, ACCEPTANCE S-04). Standing back up on
movement and the pose are unchanged.

**Specification change (manager, after the slice's BLOCKED report).** The first version kept the 4/s
ease and the idle clock based on his own speed, which cannot meet "seated by about 2.5s" or the
owner's "2 seconds" (measured: sitting starts 2.80-2.92s and seated 3.52-3.63s after the last pointer
move; F-207-results.txt §4). Ruling: **A + B**.
- **B:** the idle clock is the **pointer's** stillness. If he is still walking at 2s, the sit stays
  hidden while he walks and he sits as he arrives (the slice's `sit × (1 − walk)` note).
- **A:** `SIT_EASE` 4 → **6**/s.
Expected: sitting starts at about 2.0s and he is seated by about 2.47s after the last pointer move.
Record both as owner changes in `run-parity.sh`; never edit `docs/reference`.

**Owner hold continues:** no deploy, no push. Commit locally only.

## Scope

- **Modify:** `frontend/src/stickman/engine/gestures.ts` (`SIT_AFTER_S`), its tests, and any other
  test or copy that assumes 5s: the lab's help text ("Leave him alone for 5s and he sits") and
  anything in `layer/` or `loader/` tests that idles past a 5s sit.
- **Never:** `index.ts`, `types.ts`, `contract.test.tsx`, `index.html`, `flags.ts`.

## Acceptance Criteria

- [ ] **S-04** (2s text): measured from the pointer's last move, he does not start to sit before
      2.0s and is seated (sit ≥ 0.95) by about 2.5s; any movement stands him back up as before.
- [ ] Tests, by name (change the existing ones first and watch them fail on 5):
  - `sit approaches 1 after 2s idle and returns to 0 when moving`
  - `does not sit before 2s idle`
  - `the idle clock starts when the pointer stops, not when he arrives`
  - `seated within 0.5s of starting to sit (6/s ease)`
  - `a walk longer than 2s ends seated, with no sit shown mid-walk`
- [ ] The prototype-parity harness (F-201) is expected to differ only at the sit checkpoint; record
      which checkpoints changed and why, rather than updating the reference.
- [ ] Evidence `docs/review/F-207-results.txt`: in the browser at 1440, the measured time from the
      last pointer move to the start of sitting, and to fully seated; resting on a link and on fog.

## Notes

- **Skills:** `superpowers:test-driven-development`; before handoff
  `superpowers:verification-before-completion`.
- With 2s, the "point at a link while resting" pose lasts 2s before he sits; that is the owner's call.

## Review History

| Round | Verdict | Summary |
|---|---|---|
