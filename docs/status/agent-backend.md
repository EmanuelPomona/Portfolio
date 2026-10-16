# STATUS: agent/backend
Task: TASK-301 (then 302, 303, 304 in order)
Round: 0
Last updated: 2026-10-16T17:25:00Z

## Skills invoked so far
- ecc:contract-first @ TASK-301 start, before validator -> shapes imported from types.ts (no redeclared copies); DATABASE.md is the invariant source; provider check = validate the real exported `content`; fixtures JSON-cloned because heroLinks/contact.links share refs (structuredClone would double-count)
- superpowers:test-driven-development @ TASK-301 start -> per-rule violating fixture with literal {rule, path}, watched red before each impl; commits grouped by rule family
- ecc:error-handling @ TASK-301 start -> validator returns typed {rule, path, message} list (Result style), never throws on content, collects all violations; URL parse errors become violations; messages say what is wrong + how to fix, for a non-engineer
- ecc:backend-patterns @ TASK-302 start, before pipeline design -> pure helpers (media-lib.mjs) split from I/O (media.mjs); run is transaction-like: validate all names + encode everything in memory, touch disk only if every source succeeded, manifest written last via temp+rename; decode each source once
- ecc:error-handling @ TASK-302 start (re-invoked; harness answered "already loaded, instructions unchanged", applied from that load) -> known failures print `media-src/<rel>: <reason>` to stderr without stack + exit 1; unexpected errors print stack; all sources attempted so one run lists every problem
- (probe, scratchpad only) all 3 formats byte-stable across 3 processes on this mac; hero 1600w AVIF q50=53.6KB, q60=73.9KB -> chose AVIF q60/effort 4, WebP q80/effort 4, JPEG q80 mozjpeg

## Done
- [x] Read protocol, skill routing, tasks 301-304, PRODUCT, ARCHITECTURE, API, openapi, DATABASE, ACCEPTANCE, DECISIONS, manager handoff
- [x] `scripts/bootstrap.sh` -> ports frontend 3002 / backend 8002 (backend port unused, ADR-001)
- [x] Baseline green before any change: `npm run typecheck` exit 0, `npm run lint` exit 0, `npm test` 9 passed

- [x] TASK-301 step 1: C-01..C-20 TDD in 5 families, each `test:` commit watched red (assertion failures, not errors) then `feat:` green (2c2d040..98a13ea)
- [x] TASK-301 step 2: real-content test; proved it fails by temporarily putting an em dash + "TBD" in site.tagline (reported C-01 + C-20 at site.tagline), restored

- [x] TASK-301 step 3: owner guide frontend/src/content/README.md (04473ab); every rule C-01..C-20 explained; C-20 false positives documented; TS error example is real tsc output
- [x] No real content violations found -> no value files changed

- [x] TASK-302 step 1: helpers TDD (f4160c9 red -> 1432ae3 green): mediaIdFromPath, planWidths, renditionPath
- [x] TASK-302 step 2: CLI integration tests red (fab889b) -> pipeline green (763e2d5); input-shape tests (6d09165) mutation-checked: removing autoOrient / flatten each turns its test red; toColourspace('srgb') + raw depth were redundant (sharp 0.35 outputs 8-bit sRGB by default for gray/CMYK/rgb16) -> removed, 16-bit test pins it
- [x] TASK-302 step 3: real run (18f636c): alpine 640/1024/1600/1672, evergreen 640/1024; second run "0 written, manifest unchanged", git status clean; build ok; headless Chrome 155 loads all 18 renditions (onload, natural sizes correct)
- superpowers:systematic-debugging @ TASK-302 step 3 (browser probe stuck "pending") -> root cause: img.decode() never resolves in headless Chrome here (no display link, CVDisplayLinkCreateWithCGDisplay failed); onload works. Environmental, not a product bug.

## In progress
- [ ] TASK-302 step 4: C-21 media.contract.test.ts
- [ ] TASK-301: code review + verification deferred to the combined pre-handoff pass (status stays IN_PROGRESS until then)

## Verified
- Baseline (pre-change) -> typecheck/lint/test all pass on 3ea91a0
- B-01 -> `npm run test:contract`: tsc ok, 2 files, 78 passed (69 content + 9 stickman)

## Blocked on
- nothing
