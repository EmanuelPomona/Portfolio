# Architectural Decisions

Decisions that affect more than one agent. Format: Nygard-style, via `ecc:architecture-decision-records`.
Superseded decisions stay here and link their replacement.

| ADR | Title | Status | Date |
|---|---|---|---|
| ADR-001 | No runtime backend; contracts are TypeScript modules | accepted | 2026-10-16 |
| ADR-002 | Vite + React + TypeScript, plain CSS, no animation library | accepted | 2026-10-16 |
| ADR-003 | Manager-owned scaffold with working contract stubs | accepted | 2026-10-16 |
| ADR-004 | The stickman is its own slice agent behind a small public API | accepted | 2026-10-16 |
| ADR-005 | Generated media is committed, produced by a deterministic pipeline | accepted | 2026-10-16 |
| ADR-006 | Touch walker ships behind a flag that stays off until the owner approves | accepted | 2026-10-16 |
| ADR-007 | Reviewer runs on Opus for this project | accepted | 2026-10-16 |

---

## ADR-001: No runtime backend; contracts are TypeScript modules

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager. The owner approved a static
site in the design ("no server or database").

### Context

The template assumes a frontend, a backend, an HTTP contract (`openapi.yaml`), and a database.
A one-page portfolio has no user data, no forms, and no dynamic content. The `agent/backend`
worktree and the `scripts/contract-test.sh` gate still exist, and would either sit idle or
invent an API to justify themselves.

### Decision

- The site is static: Vite build output on Vercel.
- The cross-agent contracts are in-repo TypeScript modules (`docs/API.md`) and a content schema
  (`docs/DATABASE.md`).
- `docs/openapi.yaml` declares `x-no-http-api: true`. In that case `scripts/contract-test.sh`
  runs `npm run test:contract`: a typecheck plus every `*contract*` test.
- `agent/backend` owns the build-time data side:
  - content validation;
  - the media pipeline;
  - head metadata;
  - Vercel config.

### Alternatives considered

- **Keep a small API**, such as a contact form or a "now" endpoint.
  - Pros: uses the template as designed.
  - Cons: adds a server, secrets, spam handling, and an attack surface for no owner-requested
    feature.
  - Why not: it is out of scope (PRODUCT.md), and the owner asked only for LinkedIn and email
    links.
- **Leave `agent/backend` idle.**
  - Pros: the least coordination.
  - Cons: wastes a parallel lane, and pushes the pipeline, SEO, and deploy onto the frontend's
    critical path.
  - Why not: those are well-specified, independent, and testable.

### Consequences

- **Positive:** no runtime failure modes, no secrets, and a CDN-fast first paint. The contract
  test still gates integration.
- **Negative:** `BACKEND_PORT` and `VITE_API_BASE_URL` are unused, and `bootstrap.sh` prints "no
  seed script". Both are expected here.
- **Risk:** someone later adds a real endpoint without removing `x-no-http-api`.
  - Mitigation: the flag's own description in `openapi.yaml` says to remove it.

---

## ADR-002: Vite + React + TypeScript, plain CSS, no animation library

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager.

### Context

The site is one page with heavy custom motion: a canvas stickman, a scribble loader, fog,
reveals. Visual distinctiveness decides the outcome, and the previous attempt (Next.js,
Tailwind, Framer Motion, Inter) read as generic. Recruiters often open the link on phones, so
the performance budget matters.

### Decision

- React 19.3 with Vite 8.3 and TypeScript, pinned at **6.0.3** because typescript-eslint 8.71
  supports TypeScript below 6.1 only.
- Plain CSS: tokens plus CSS Modules.
- **No** Tailwind, no UI kit, no animation library. Motion is CSS, IntersectionObserver, and rAF
  on canvas.
- Fonts are self-hosted with `@fontsource`.
- CI runs on Node 24, because jsdom 30 and Vitest 5 need Node 22.12 or later.

### Alternatives considered

- **Next.js** (the owner's previous stack).
  - Pros: familiar; SSR.
  - Cons: SSR and routing buy nothing on a single static page, and they complicate the
    pre-paint loader gate.
  - Why not: there is no server-rendered need.
- **Astro with React islands.**
  - Pros: zero-JS sections.
  - Cons: the stickman spans the whole page and reacts to every link, which is awkward across
    islands.
  - Why not: one React tree is simpler for three agents.
- **GSAP or Framer Motion.**
  - Pros: fast to author.
  - Cons: bundle weight. The stickman is procedural anyway, and library-default easing is part
    of the "templated" look.
  - Why not: every motion in the brief is small enough to hand-build.
- **Tailwind.**
  - Pros: speed.
  - Cons: pulls agents toward utility-default layouts.
  - Why not: the brief needs bespoke typography and spacing.

### Consequences

- **Positive:** about 71 KB gzip initial JS for the skeleton, so the budget has headroom. Full
  control of motion.
- **Negative:** more hand-written CSS and motion code.
- **Risk:** TypeScript stays one major behind, which is acceptable.
  - Revisit when typescript-eslint supports TypeScript 7.

---

## ADR-003: Manager-owned scaffold with working contract stubs

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager.

### Context

Three branches start in parallel. If each scaffolded its own `package.json`, Vite config, and
types, the first integration would be a merge conflict across every config file. And the
frontend could not demo the page before the stickman existed.

### Decision

During planning, the manager commits the scaffold:
- the workspace, pinned dependencies, and configs;
- the contract types (`content/types.ts`, `media.ts`, `stickman/types.ts` and `index.ts`,
  `config/flags.ts`);
- **working stubs**: a Loader that already honors the timing cap, a null StickmanLayer, a no-op
  `seoPlugin`, and a one-JPEG media manifest;
- the approved content values;
- a manager-owned stickman contract test that the stubs pass and the real implementation must
  also pass.

### Alternatives considered

- **Task 1 for frontend is "scaffold".**
  - Pros: the manager writes no code.
  - Cons: it serializes everyone behind one task and an extra integration.
  - Why not: it costs a full round of human coordination.
- **Each agent scaffolds its own part.**
  - Pros: no manager code.
  - Cons: guaranteed config conflicts.
  - Why not: the protocol's goal is clean merges.

### Consequences

- **Positive:** every agent can run the whole page on day one, and stubs swap out with no
  signature change.
- **Negative:** the manager owns the config files, so dependency changes route through
  handoffs.
- **Risk:** stubs mask a missing integration.
  - Mitigation: the contract test runs against whatever is behind `stickman/index.ts`.

---

## ADR-004: The stickman is its own slice agent behind a small public API

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager.

### Context

The stickman (loader, cursor, touch walker) is the signature element and the riskiest motion
work. It is tuned by the owner, and it is demoable without any page section. Folding it into
the frontend agent would put the two largest pieces of visual work on one serial lane.

### Decision

- Add a slice agent with `scripts/new-agent.sh stickman`, on branch `agent/stickman`, owning
  `frontend/src/stickman/**` and `frontend/stickman-lab.html`.
- The page touches it only through `src/stickman/index.ts`: `Loader`, `StickmanLayer`,
  `loaderMode`, and `LOADER_SEEN_KEY`.
- DOM, CSS, and timing rules are in `docs/API.md` §2.

### Alternatives considered

- **Frontend owns the stickman.**
  - Pros: one fewer agent.
  - Cons: serial, and it doubles the frontend's critical path.
  - Why not: the slice passes the protocol's test: it can be demoed alone in the lab page.
- **Make the stickman a library package** (`packages/stickman`).
  - Pros: harder isolation.
  - Cons: more workspace plumbing for one consumer.
  - Why not: a directory boundary with a contract test is enough.

### Consequences

- **Positive:** parallel work, and the owner tunes the stickman in the lab independently of
  layout.
- **Negative:** the loader-to-cursor handoff and the page's `inert` and `onDone` wiring are
  cross-branch.
  - They are pinned by the mount contract (API.md §2.5) and the contract test.

---

## ADR-005: Generated media is committed, produced by a deterministic pipeline

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager.

### Context

Responsive AVIF, WebP, and JPEG renditions plus a typed manifest are needed. Generating them at
deploy time would make typecheck depend on a build step (the manifest is imported by types) and
would make the reviewer's bytes differ from the deploy's.

### Decision

- `npm run media` (sharp) writes `frontend/public/media/**` and
  `src/content/media.generated.ts`, and **both are committed**.
- The pipeline must be byte-deterministic and remove stale outputs.
- A contract test (C-21) fails when outputs are out of date.

### Alternatives considered

- **Generate in `prebuild` and gitignore the outputs.**
  - Pros: a smaller repo.
  - Cons: `typecheck` fails on a clean clone before the build, and sharp must run on Vercel.
  - Why not: it breaks the CI order (typecheck runs before build).
- **A hosted image CDN** (Vercel Image Optimization).
  - Pros: no pipeline.
  - Cons: a runtime dependency and cost, and Vite static has no `next/image`.
  - Why not: it contradicts ADR-001.

### Consequences

- **Positive:** identical bytes everywhere, and adding a photo is one command.
- **Negative:** the repo grows with each photo, by roughly 1 to 2 MB per photo across
  renditions.
- **Risk:** sharp output that is not byte-stable across platforms.
  - Mitigation: TASK-302 documents any non-stable format and compares decoded pixels for it.

---

## ADR-006: Touch walker ships behind a flag that stays off until the owner approves

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager. The owner deferred phones:
"something we can worry about later".

### Context

The desktop cursor was approved only after live tuning. The phone version has no prototype, and
most recruiters arrive on phones. Shipping an untuned walker risks the first impression; shipping
nothing on phones loses the signature there.

### Decision

- TASK-204 builds the walker, demoable in `/stickman-lab.html`.
- `flags.touchStickman` stays `false` in production until the owner tunes and approves it.
- The manager flips the flag and records the approval in `docs/status/main.md`.

### Alternatives considered

- **Ship it on.**
  - Pros: the signature appears everywhere.
  - Cons: untuned motion on the most common device.
  - Why not: the owner's approval process for the stickman is tuning first.
- **Do not build it in v1.**
  - Pros: a smaller plan.
  - Cons: nothing to tune, which delays phones indefinitely.
  - Why not: the slice has capacity, and the work is independent.

### Consequences

- **Positive:** phones are complete (native touch, center-band reveals) from day one.
- **Negative:** phones lack the stickman until the owner approves it.

---

## ADR-007: Reviewer runs on Opus for this project

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager.

### Context

The template's reviewer defaults to Sonnet, because visual findings are advisory. On this project
the gate's hardest judgments are the primary design test ("could this be pasted onto another
site?") and whether the stickman's feel matches the approved prototype at runtime. The previous
attempt failed on exactly these.

### Decision

Launch the reviewer with `claude --agent reviewer --model opus`. The agent definition file is
unchanged; the override is per launch.

### Alternatives considered

- **Sonnet (the template default).**
  - Pros: cost.
  - Cons: weaker taste and motion judgment where this project's risk lives.
  - Why not: a missed "generic" verdict is the costliest failure here.

### Consequences

- **Positive:** a stronger gate on distinctiveness and feel.
- **Negative:** higher review cost per round.
