# STATUS: agent/backend
Task: TASK-301 (then 302, 303, 304 in order)
Round: 0
Last updated: 2026-10-16T17:25:00Z

## Skills invoked so far
- ecc:contract-first @ TASK-301 start, before validator -> shapes imported from types.ts (no redeclared copies); DATABASE.md is the invariant source; provider check = validate the real exported `content`; fixtures JSON-cloned because heroLinks/contact.links share refs (structuredClone would double-count)
- superpowers:test-driven-development @ TASK-301 start -> per-rule violating fixture with literal {rule, path}, watched red before each impl; commits grouped by rule family
- ecc:error-handling @ TASK-301 start -> validator returns typed {rule, path, message} list (Result style), never throws on content, collects all violations; URL parse errors become violations; messages say what is wrong + how to fix, for a non-engineer

## Done
- [x] Read protocol, skill routing, tasks 301-304, PRODUCT, ARCHITECTURE, API, openapi, DATABASE, ACCEPTANCE, DECISIONS, manager handoff
- [x] `scripts/bootstrap.sh` -> ports frontend 3002 / backend 8002 (backend port unused, ADR-001)
- [x] Baseline green before any change: `npm run typecheck` exit 0, `npm run lint` exit 0, `npm test` 9 passed

- [x] TASK-301 step 1: C-01..C-20 TDD in 5 families, each `test:` commit watched red (assertion failures, not errors) then `feat:` green (2c2d040..98a13ea)
- [x] TASK-301 step 2: real-content test; proved it fails by temporarily putting an em dash + "TBD" in site.tagline (reported C-01 + C-20 at site.tagline), restored

- [x] TASK-301 step 3: owner guide frontend/src/content/README.md (04473ab); every rule C-01..C-20 explained; C-20 false positives documented; TS error example is real tsc output
- [x] No real content violations found -> no value files changed

## In progress
- [ ] TASK-302: media pipeline. Next: invoke backend-patterns, error-handling (pipeline failure behavior), TDD helpers
- [ ] TASK-301: code review + verification deferred to the combined pre-handoff pass (status stays IN_PROGRESS until then)

## Verified
- Baseline (pre-change) -> typecheck/lint/test all pass on 3ea91a0
- B-01 -> `npm run test:contract`: tsc ok, 2 files, 78 passed (69 content + 9 stickman)

## Blocked on
- nothing
