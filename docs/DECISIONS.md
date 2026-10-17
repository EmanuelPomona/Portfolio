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
| ADR-008 | The CSP is computed over the served build, and fonts are never inlined | accepted | 2026-10-16 |
| ADR-009 | Only content-hashed URLs are `immutable`; `/media` revalidates | accepted | 2026-10-16 |
| ADR-010 | A project window is named by what it shows, and is black until attended | accepted | 2026-10-16 |
| ADR-011 | Round 2 motion: clouds through the page, scroll depth, a 2.2s loader minimum | accepted | 2026-10-16 |

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

## ADR-008: The CSP is computed over the served build, and fonts are never inlined

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager, at integration round 1. Resolves
backend CCR-1 and CCR-2.

### Context

The production CSP is strict: `font-src 'self'`, with the inline gate script and boot style allowed
only by hash (TASK-304). Two build behaviours broke the assumption that the source matches what is
served. Vite inlines any asset under 4 KB as a `data:` URI, so a small font subset became
`data:font/woff2`, which `font-src 'self'` blocks on every load. Vite also minifies the inline boot
`<style>`, so its served hash differs from its source hash. Browsers hash what they receive.

### Decision

`frontend/vite.config.ts` never inlines font files (`build.assetsInlineLimit` returns `false` for
`.woff2?/.ttf/.otf`). The CSP hashes are of the **built** `index.html` inline blocks. The contract
test builds the site and hashes those, and also asserts the built gate script equals the source gate.

### Alternatives considered

- **Latin-only font imports (frontend).** Frontend already did this, so the immediate trigger is gone.
  Not sufficient alone: any future small subset or icon font would silently re-break the CSP.
- **`font-src 'self' data:`.** One line, but it loosens the policy to fix a build quirk.
- **Hash the source blocks, as TASK-304 first said.** It would pass a source-only test and block the
  boot cover in production, so the loader would flash.

### Consequences

- **Positive:** the CSP stays exactly as specified. The test fails if anyone edits the inline blocks
  without updating `vercel.json`.
- **Negative:** each font file costs one request instead of being inlined in the CSS.
- **Risk:** a Vite upgrade that changes minification changes the style hash. The contract test names
  the mismatch.

## ADR-009: Only content-hashed URLs are `immutable`; `/media` revalidates

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager, at integration round 1. Resolves
backend CCR-3.

### Context

TASK-304 served `/media/(.*)` with `public, max-age=31536000, immutable`. Media renditions are named
`<id>-<w>.<ext>`, from the source path and width only. The owner will replace screenshots and photos
(the owner guide tells them how), and a replacement of the same width keeps the same URL. Any browser
holding the old file would keep showing it for up to a year. Vercel purges its CDN on deploy; browser
caches are not purged.

### Decision

`/assets/(.*)` (Vite content-hashes these) stays `immutable`. `/media/(.*)` is served
`public, max-age=0, must-revalidate`, so a repeat visit revalidates with the ETag and gets a 304 when
nothing changed. API.md §3 naming is unchanged.

### Alternatives considered

- **Content hashes in rendition names (`<id>-<w>.<hash8>.<ext>`).**
  - Pros: true immutability.
  - Cons: changes API.md §3, `media.mjs` and its tests, and every hard-coded rendition path (the lab
    page).
  - Why not: more change than a one-page site with a handful of images needs right now.
- **Keep `immutable`.** Rejected: the owner's own browser would show stale screenshots.

### Consequences

- **Positive:** a replaced photo appears on the next visit.
- **Negative:** repeat visits make one conditional request per image (a 304, no body).
- **Revisit** if image count or repeat traffic grows: switch to hashed names then.

## ADR-010: A project window is named by what it shows, and is black until attended

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** manager, at integration round 1. Resolves
the frontend CCR (TASK-103, W-05) and the frontend question on W-03.

### Context

The window link's accessible name was "<title>, <primary.label>". The only visible text inside the
link is the address bar, so the name did not contain the visible label: WCAG 2.5.3 Label in Name, Level
A. axe reports `label-content-name-mismatch` (serious) on all four windows. Separately, W-03 said an
empty window shows "a flat fog-tone screen", while the brief and the owner ("black until you hover")
say a window is dark at rest.

### Decision

- The accessible name is "<title>, <primary.label>, <addressBar>", for example
  "SagePlan, Live site, sageplan.vercel.app".
- An empty window is near-black at rest with "screenshot soon", and lifts to the flat fog-tone panel
  on attention. This confirms what frontend built.

### Alternatives considered

- **Keep the name and drop `aria-label`, letting the content name the link.** The name would become
  just the URL, losing the project title for screen-reader users.
- **Fog panel at rest.** Removes the owner's "black until you hover" from every v1 window.

### Consequences

- **Positive:** the four primary links pass Label in Name. W-03 now matches the brief and the owner.
- **Negative:** the screen-reader name is longer by the address.
- **Amended at round 2 integration:** axe still flagged `label-content-name-mismatch` on the empty
  windows, because "screenshot soon" is visible text inside the link. While the screen is empty the
  name ends ", screenshot soon"; with a real screenshot it is the three parts only.

## ADR-011: Round 2 motion: clouds through the page, scroll depth, a 2.2s loader minimum

**Date:** 2026-10-16. **Status:** accepted. **Deciders:** the owner (the requests), manager (the
calls). The owner asked for autonomous completion, so the readings below are the manager's.

### Context

After seeing the integrated site, the owner asked for four changes: "Clouds should be hovering
slightly within the page", "Scroll animations", "Make the loading screen a little bit longer", and
Contact as one line, "Contact: linkedin, email, github." The brief said "Nothing else moves" and the
constraints reject "animation applied because animation is possible" and "radial gradient orbs".
Product-lens risk R1 is loader friction for a recruiter on a phone.

### Decision

- **Clouds** are photographic layers cut from the owner's two photographs, drifting slowly
  (60s+ cycles) behind every background section. Transform only, paused off-screen and hidden.
- **Scroll animations** get one job, depth: backgrounds and clouds travel slower than the plates,
  windows arrive from their own side, prints settle. Once, never replayed.
- **Loader minimum** 1.2s → 2.2s, with the progress ramp stretched to match. The 4.5s cap, the
  skip on any click or key, and the fade mode are unchanged.
- **Contact** is the sentence "Contact: LinkedIn, Email, GitHub.", proper-case like the hero.
- All of it is off, or instant, under reduced motion. The brief's motion table gains two rows.

### Alternatives considered

- **CSS-drawn clouds (blurred radial gradients).** Cheap, but it is the constraints' "radial
  gradient orbs" and would read as a template. Rejected.
- **A scroll-animation library** (GSAP, Lenis). ADR-002 says no animation library; IntersectionObserver,
  one passive scroll listener, and CSS cover this.
- **Loader minimum 3s or more.** "A little bit longer" plus R1 argues for a modest step; 2.2s
  roughly doubles the felt time while the cap keeps slow networks from waiting longer.
- **Lowercase link labels**, as typed. Read as casual typing; proper case matches the hero row.

### Consequences

- **Positive:** the page feels like moving air, which is the brief's own metaphor carried further.
- **Negative:** every first visit now costs about 1s more before the page; more motion to keep
  inside the performance budget and the contrast measurements.
- **Risk:** motion over text lowering contrast. M-05 makes X-02 a gate for the new layers.
