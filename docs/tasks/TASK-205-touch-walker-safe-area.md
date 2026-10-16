---
id: TASK-205
title: Safe-area viewport and real-phone check before the touch flag flips
status: BACKLOG
owner: stickman
branch: agent/stickman
priority: LOW
round: 0
depends_on: [TASK-204]
blocked_on: ""
---

# TASK-205: Safe-area viewport and real-phone check before the touch flag flips

## Objective

Make the touch walker stand where API.md §2.3 says, above `env(safe-area-inset-bottom)`, on a real
notched phone. Today `frontend/index.html` has no `viewport-fit=cover`, so the inset is always 0 and
the walker's safe-area offset has no effect (stickman HANDOFF-1, Known Issues).

This task starts only when the owner has approved the touch walker in `/stickman-lab.html`
(ADR-006, T-03). Until then `flags.touchStickman` stays `false` and phones are complete without it.

## Scope

- **Modify:** `frontend/index.html`, the viewport meta only:
  `width=device-width, initial-scale=1, viewport-fit=cover`. The gate script and boot style above
  it are hashed by the CSP; do not touch them (API.md §2.4, ADR-008).
- **Modify:** `frontend/stickman-lab.html`, the same viewport meta.
- **Not in scope:** the flag itself. Only the manager flips it, after this task is `DONE`.

## Acceptance Criteria

- [ ] On a real iPhone with a home indicator, in Safari, the walker's feet sit above the home
      indicator, in portrait and in landscape. Save `docs/review/F-205-safe-area-{portrait,landscape}.png`.
- [ ] With `viewport-fit=cover`, the page itself (nav, hero name, Contact) is not clipped by the
      notch or the home indicator in landscape on the same phone. If it is, file the fix as a
      frontend task rather than padding it here.
- [ ] `npm run test:contract` still passes. The CSP hashes are unchanged, because only the meta
      changed.

## Notes

- **Skills:** `ecc:browser-qa`; `superpowers:verification-before-completion` before handoff.
- The forced-colors exclusion for the walker, first raised in the same handoff, was already
  implemented on `main` during integration round 1 (`9b8aa02`).

## Review History

| Round | Verdict | Summary |
|---|---|---|
