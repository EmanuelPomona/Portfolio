# Handoffs: main

## HANDOFF-1 — main — 2026-10-16

### Summary

Mode A planning is complete for Emanuel Ling's portfolio, and the owner approved the design in
chat.

**Inputs and research**
- Read every file in `docs/inputs/`.
- Analyzed eight reference sites, visually and at the code level.
- Mined the previous attempt for its tells and for salvageable content.
- Prototyped the stickman cursor live with the owner (final: 32px, ring, "hurries when far").

**Written**
- Product, design brief, architecture (with model assignment), contracts, acceptance, and the plan.
- 14 tasks across three owners.
- 7 ADRs.

**Built and verified**
- The scaffold: workspace, pinned toolchain, contract types, working stubs, approved content,
  and media. It is built and tested.

**Worktree created**
- The stickman slice worktree (`agent/stickman`).

### Tasks Completed

Planning only. No implementation task is claimed. All 14 tasks are `READY` (see
`docs/tasks/INDEX.md`):

| Owner | Tasks |
|---|---|
| `agent/frontend` | TASK-101 to TASK-106 |
| `agent/stickman` | TASK-201 to TASK-204 |
| `agent/backend` | TASK-301 to TASK-304 |

### Files Changed

**Planning documents**
- `docs/superpowers/specs/2026-10-16-portfolio-design.md` (approved intent, builder-check answers)
- `docs/PRODUCT.md`, `docs/DESIGN_BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/API.md`,
  `docs/openapi.yaml`, `docs/DATABASE.md`, `docs/ACCEPTANCE.md`, `docs/DECISIONS.md`
- `docs/superpowers/plans/2026-10-16-portfolio-v1.md`, `docs/tasks/TASK-1xx/2xx/3xx-*.md`,
  `docs/tasks/INDEX.md`

**Reference material**
- `docs/reference/stickman-cursor-spike.html` (owner-approved feel)
- `docs/reference/wireframes/*.jpg` (owner wireframes; personal photos masked on page 3)

**Scaffold**
- Root `package.json` and `package-lock.json`.
- `frontend/` (package.json, vite.config.ts, tsconfig.json, eslint.config.js, index.html), and
  these files inside it:

  | Area | Files |
  |---|---|
  | Content | `src/content/*` |
  | Stickman | `src/stickman/*` |
  | Config | `src/config/flags.ts` |
  | App shell | `src/app/App.tsx`, `src/main.tsx`, `src/styles/*` |
  | Tests | `src/test/setup.ts` |
  | Stubs | `plugins/seo.ts`, `scripts/media.mjs` |
  | Media | `media-src/**`, `public/media/backgrounds/*` |

- `backend/README.md`, `README.md`

**Infrastructure fixes**
- `.github/workflows/ci.yml`:
  - Node 20 → 24;
  - the handoff-schema check now skips `docs/handoffs/`, because a real handoff would otherwise
    turn CI red.
- `scripts/contract-test.sh`: the `x-no-http-api` route to `npm run test:contract`.
- `.env.example`: dropped the unused secret placeholders.
- `.gitignore`: added `.superpowers/`.

**Status:** `docs/status/main.md`

### Contracts

Every cross-agent contract is new and manager-owned (`docs/API.md`):

| Contract | Files |
|---|---|
| Content | `frontend/src/content/types.ts`; invariants C-01 to C-21 in `docs/DATABASE.md` |
| Media | `frontend/src/content/media.ts` (manifest shape, `getMedia`, `isMediaId`) |
| Stickman | `frontend/src/stickman/types.ts` and `index.ts` (`Loader`, `StickmanLayer`, `loaderMode`, `LOADER_SEEN_KEY`), plus `contract.test.tsx` |
| Page wiring | the `index.html` gate and boot cover (API.md §2.4), the mount contract (§2.5), the CSS contract (§2.6) |
| Flags | `frontend/src/config/flags.ts` (`touchStickman: false`) |
| Head metadata | `seoPlugin(): Plugin` in `frontend/plugins/seo.ts` |
| Root scripts | `dev`, `build`, `preview`, `test`, `test:contract`, `typecheck`, `lint`, `media` |

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:brainstorming | Step 1, before any product decision | Recon of 8 reference sites and the previous attempt. A live stickman prototype tuned by the owner over 3 iterations (18 → 28 → 32px, dot → ring). Decisions on double exposure, faded photos, content, and contact. The written design. The builder check (4 questions, all resolved as manager's calls 11 to 16). |
| ecc:product-lens | Step 2, before the design doc and PRODUCT.md | Named the primary user (the internship screener on a phone, under 60s), why now (the fall 2026 recruiting cycle), anti-goals, risks R1 to R5, and success metrics. It shaped the 4.5s cap, center-band reveals, and the designed empty states. |
| ecc:contract-first | Step 6, before API.md and DATABASE.md | Made the TypeScript files the canonical artifacts, with prose for semantics only and no duplicated shapes. Added `x-no-http-api` and the contract-test routing. A manager-owned stickman contract test that stubs and the real implementation both pass. Fields driven by consumer jobs. |
| superpowers:writing-plans | Step 10, before docs/tasks/ | The plan header with global constraints and five review-focus failure modes, each pinned to an owning task's test. Interfaces blocks per task. The self-review fixed three dependency gaps. |
| ecc:architecture-decision-records | Step 12, after tasks | ADR-001 to ADR-007 in `docs/DECISIONS.md`, at the protocol's location rather than the skill's `docs/adr/`. |
| superpowers:verification-before-completion | Step 13, immediately before this handoff's final commit | See Verification. Nothing was implemented after it. |

### Verification

All commands were run on `main`, after the scaffold commits:

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | 1 file, **9 passed** (the stickman contract against the stubs) |
| `npm run build` | built; `dist/assets/index-*.js` 225.81 KB (**70.85 KB gzip**); CSS 3.52 KB gzip |
| `scripts/contract-test.sh` | "no HTTP API declared … running module contract tests"; 9 passed |
| `scripts/tasks.sh` | 14 tasks, all READY; INDEX regenerated and committed |
| `scripts/status.sh` | 5 branches level at `bd676ba` (main, backend, frontend, reviewer, stickman) |

**Runtime check** (`npm run dev` on FRONTEND_PORT 3000, chrome-devtools):
- the first visit has `data-loader="show"`;
- the stub removes `#boot-cover`, sets `el:loader-seen=1`, and clears `inert` from `<main>`;
- `h1` reads "Emanuel Ling";
- there are 4 project articles;
- the sections are `home`, `projects`, `about`, `contact`.

**Console:** one error, a 404 for `/favicon.ico`. TASK-303 adds the favicon.

**CI-grep self-check:** the design-constraint marker string appears only in
`docs/DESIGN_CONSTRAINTS.md`. The handoff-schema heading appears only in
`docs/AGENT_PROTOCOL.md`, plus this handoff, which the fixed check now skips.

The first verification pass caught this file quoting the design-constraint marker string, which
would have failed CI. The wording was fixed, and verification was re-run from the start.

### What Was NOT Verified

- **CI on GitHub.** There is no remote run. The checks were reproduced locally.
- **A clean `npm install` with the default npm cache.** `~/.npm` contains root-owned files
  (EACCES). Installs succeeded only with a temporary `--cache`. Every worktree's `bootstrap.sh`
  will hit the same error until the owner runs `sudo chown -R 501:20 ~/.npm`.
- **Vercel.** Nothing has been deployed, and the owner's Vercel login has not been checked.
  TASK-304 may block on it.
- **The design itself.** No designed UI exists yet. The skeleton is intentionally unstyled.
  Typography, palette, and motion choices are in the brief and are unverified at runtime.
- **The stickman port.** Only the prototype was verified, live with the owner.
- **Asset licenses.** The two background photographs came from the owner's inputs, and their
  source and license are unknown. Their filenames suggest they may be AI-generated or stock
  images.
- **Intro copy.** It is a facts-only draft (`descriptionIsDraft: true`), and the owner has not
  read it yet.

### Known Issues

- **`/favicon.ico` 404** until TASK-303 lands.
- **The hero photo's source is 1672px wide,** so it may look slightly soft on 2× displays at
  1440. Fog is forgiving. A higher-resolution original from the owner would fix it.
- **The reviewer must launch with `--model opus`** (ADR-007). `scripts/launch-agents.sh` prints
  the template's default command without that flag.

### Commit

`main` at `bd676ba` (planning and scaffold), plus the commit that adds this handoff.

## HANDOFF-2 — main — 2026-10-16

### Summary

Integration round 1 is complete and verified. `agent/backend`, `agent/frontend`, and `agent/stickman`
are merged into `main` with **0 conflicts**. The branches shared no file. Every open change request
is resolved in the contract documents and implemented. The integrated site runs end to end.

**For the reviewer:** all 14 v1 tasks are in `REVIEW` at round 0. TASK-205 is `BACKLOG` and is not
part of this review. Launch with `--model opus` (ADR-007).

**Preview:** https://emanuel-ling-mij8hp576-team-boh-buh.vercel.app (`main` @ `3977ba4`)
- It is behind Vercel Authentication: log in, or use `vercel curl`.

### Tasks Completed

No implementation task is claimed by `main`. Integration moved these tasks:

| Task | Change | Why |
|---|---|---|
| TASK-103 | BLOCKED → REVIEW | The CCR was approved (ADR-010) and implemented at `57e1041`. W-03 was confirmed as built. |
| TASK-304 | BLOCKED → REVIEW | CCR-1 and CCR-2 approved (ADR-008), CCR-3 resolved (ADR-009). Redeployed. Zero site-caused CSP violations (`M-304-csp-console.txt`). |
| TASK-205 | new, BACKLOG | Safe-area viewport and a real-phone check, needed before the touch flag can flip. |

**Change requests resolved**

| Request | From | Resolution |
|---|---|---|
| CCR-1: fonts inlined as `data:` | backend | **Approved, preferred option.** `vite.config.ts` never inlines fonts (`d1fd0cc`), guarded by `plugins/font-inlining.contract.test.ts`. Frontend's Latin-only imports had already removed the trigger. |
| CCR-2: hash the served blocks | backend | **Approved.** API.md §2.4 and TASK-304 now say the hashes are of the built blocks. The test already did this. |
| CCR-3: `/media` immutable, names not hashed | backend | **Option (b).** `/media` is `public, max-age=0, must-revalidate` (`665e7cd`); `/assets` stays `immutable`. ADR-009. |
| BrowserWindow accessible name | frontend | **Approved.** "<title>, <label>, <addressBar>" (`57e1041`). API.md §1, ACCEPTANCE W-05, and TASK-103 were updated together. |
| W-03 at rest | frontend | **Confirmed as built:** black at rest, fog panel on attention. API.md §1, W-03, and TASK-103 were reworded. |
| Scroll-lock release | frontend, stickman | **Recorded:** both the page CSS and the Loader release it, and either alone suffices (API.md §2.4, §2.2 Finish). |
| Loader timing and cursor notes | stickman | **Recorded:** fade ≤300ms, `progress` cursor under the paper, the native cursor hidden from the first `pointermove` (§2.2, §2.3). |
| Touch row lacks forced-colors | stickman | **Contract amended and implemented** (`9b8aa02`). |
| Vacuous contract-test clause | stickman | **Fixed:** the contract test gives the layer a no-op 2D context and asserts the class appears before checking that it is removed (`d7d0c04`). Mutation-checked. |
| `#fff` slop-check hits | stickman | **Listed** under DESIGN_BRIEF "Justified exceptions" as difference-blend ink. |
| `viewport-fit=cover` | stickman | **Deferred** to TASK-205. The flag is off in production. |

### Files Changed

- **Contracts and decisions:** `docs/DECISIONS.md` (ADR-008 to ADR-010), `docs/API.md`, `docs/ACCEPTANCE.md`,
  `docs/DESIGN_BRIEF.md`, `docs/ARCHITECTURE.md` (Deployed Preview), `.env.example` (`PREVIEW_URL`).
- **Integration glue** (each test was written and watched failing first):
  - `frontend/src/components/BrowserWindow/BrowserWindow.{tsx,test.tsx}`
  - `vercel.json`, `frontend/plugins/csp.contract.test.ts`
  - `frontend/vite.config.ts`, `frontend/plugins/font-inlining.contract.test.ts` (new)
  - `frontend/src/stickman/contract.test.tsx`
  - `frontend/src/stickman/layer/activation.{ts,test.ts}`
- **Tasks:** `TASK-103`, `TASK-304` (status, wording, integration notes), `TASK-205` (new), `INDEX.md`.
- **Evidence:** `docs/review/M-*` (8 files) and `docs/review/M-304-csp-console.txt`.
- **Status:** `docs/status/main.md`; the Mode A status was moved to `docs/archive/status-main-mode-a.md`.

### Contracts

Changed by the manager in this round, all in the documents above:
- API.md §1: the window's accessible name, and the empty-window rest state.
- API.md §2.2: Finish sets `data-loader=skip`; fade ≤300ms; `progress` cursor while the paper is up.
- API.md §2.3: the cursor class is added on the first `pointermove`; the touch row excludes forced
  colors; `viewport-fit=cover` comes before the flag flips.
- API.md §2.4: the CSP hashes the served blocks; the scroll-lock release.
- API.md §3: `/media` revalidates.
- ACCEPTANCE: W-03, W-05, B-05, T-03.

No TypeScript contract file (`types.ts`, `media.ts`, `stickman/index.ts`, `stickman/types.ts`,
`flags.ts`) changed. `flags.touchStickman` is still `false`.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| ecc:architecture-decision-records | Step 4, before amending contracts | ADR-008 to ADR-010, in the Nygard format at the protocol's location (`docs/DECISIONS.md`), each with rejected alternatives. |
| superpowers:test-driven-development | Step 9, before any glue code | Every glue change began with a test watched failing for the right reason: 2 + 1 + 2 + 1 + 2 REDs. Mutating the activation guards turned the new contract clauses red. |
| vercel:deploy | Step 8, before redeploying | Preflight (CLI, link, no monorepo tool, clean tree). A **preview** only, from a clean `git archive`, then inspected. Production was not touched. |
| superpowers:verification-before-completion | Step 11, immediately before this handoff | Everything under Verification was re-run on a fresh clone of committed `main`. No implementation after it. |

### Verification

**Skill audit** (`scripts/audit-skills.sh`):

| Worktree | Claims corroborated | Exit |
|---|---|---|
| Backend | 12/12 | 0 |
| Frontend | 15/15 | 0 |
| Stickman | 14/14 | 0 |

No violations, so nothing was added to `docs/DEBT.md`.

**Clean clone of `main` @ `84813ec`** (CI reproduced locally):

| Check | Result |
|---|---|
| CI doc checks: constraints copy, schema copy, shared files, CLAUDE.md, scripts parse, index current | all ok |
| Secrets grep | none |
| `.env` committed | no |
| `npm ci` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; JS 258.88 kB (**82.40 kB gzip**, budget 110); CSS 21.52 kB (**5.85 kB gzip**, budget 25) |
| `npm test` | **43 files, 525 passed** |
| `scripts/contract-test.sh` | "no HTTP API declared …"; **5 files, 162 passed** |
| I-01: bootstrap, then `npm run dev` | 200 on `FRONTEND_PORT` 3000, with the plugin's `<title>` and the gate |

**Runtime** (production build, headless Chrome 155 over CDP; `docs/review/M-results.json`):

| Check | Result |
|---|---|
| `?loader=1` at 1440 | `show`, progressbar present, `<main>` inert, then released. Afterwards `data-loader=skip`, boot cover gone, `aria-busy=false`, seen=1. |
| Page structure | one `h1` "Emanuel Ling"; `h2` Projects, About, Contact; sections home, projects, about, contact |
| Stickman | class absent before the first move, present after; 1 aria-hidden canvas plus the ring; `elementFromPoint` returns a page element |
| Windows | all 4 names contain the visible address (label-in-name true), `target=_blank`, `rel="noopener noreferrer"` |
| Attention | hover gives `attention`, leaving gives `rest` |
| Scroll and nav | a 1200px wheel gives scrollY 1200; nav "About" sets `#about` with exactly one `aria-current` |
| Horizontal overflow | 0 at 1440, 768, and 390 |
| 390 with touch | coarse pointer, no stickman class or canvas, nav on one line, 44px targets |
| Reduced motion | `fade`, released in 265ms, no stickman, 0 running animations |
| Forced colors | no stickman |
| Console | **0 entries** across all phases (`M-console.txt`) |

**Preview** (`vercel curl`, deployment `dpl_3z5XCEwCBied9dY6Gm1xYofpY1K3`, target preview):

| Path | Result |
|---|---|
| `/` | 200 with the CSP (gate and style hashes), nosniff, Referrer-Policy, Permissions-Policy, HSTS |
| `/favicon.svg`, `/og.jpg`, `/robots.txt`, `/sitemap.xml` | 200 |
| `/assets/index-xE03CyjF.js` | `immutable` |
| `/media/...avif` | `must-revalidate` |

- The served JS and CSS are byte-identical to the local build (sha256), with 0 `data:font` URIs.
- The served `index.html` differs only by Vercel's preview Toolbar `<script>`.

**CSP in a browser:** the identical `dist` was served with `vercel.json`'s headers applied verbatim,
then the full runtime run was repeated under them. Result: **0 `securitypolicyviolation` events and
0 console entries** (`docs/review/M-304-csp-console.txt`).

**History**
- 18 first-parent commits this round, each one change.
- No attribution trailers; author Emanuel Ling.
- Every worker head is an ancestor of `main`.

### What Was NOT Verified

- **The protected preview in a browser.** It needs the project's bypass secret, which I chose not
  to retrieve. The browser CSP run used identical bytes and identical headers on localhost instead.
  The reviewer or the owner should open the preview while logged in to Vercel.
- **F-01, mobile Lighthouse on the preview:** not re-run after integration. The last scores
  (backend, skeleton) and frontend's local run predate the merged bundle, which is about 7 KB gzip
  larger with the stickman. **This is the reviewer's to measure.**
- **axe on the integrated page.** axe is not installed in the repo. Label-in-name was checked
  directly (accessible name contains the visible text) and in unit tests, not by axe's rule.
- **S-02 (owner sign-off) and the stickman's look at rest.** At 32px, resting or pointing reads as
  head, one stroke, and ring, with limbs collinear. That matches the slice's own `F-202-gestures.png`
  and the prototype parity (19/19), so it is not an integration regression. Whether it reads as "a
  stickman" is the owner's call in the lab.
- **Real devices, Safari, Firefox, screen readers, a headed 60fps display:** not run. Headless Chrome
  only.
- **Loader timing with a slow hero.** Locally the hero decoded quickly: `<main>` was released about
  1.8s after navigation. The 4.5s cap path (L-02) was not exercised here; it is the slice's F-203
  evidence.
- **CI on GitHub (I-03).** `main` is 221 commits ahead of `origin/main` and was **not pushed**. The
  owner decides.
- **I-05 (a demo recording):** not produced.

### Known Issues

**Owner decisions**, carried from backend HANDOFF-1. None of these is code:
1. Production `https://emanuel-ling.vercel.app` still serves the walking skeleton. Promote or take
   it down.
2. Turn off the Vercel Toolbar for previews.
3. Revoke the automation-bypass secret after review.
4. Choose how the site gets published; the project has no Git connection.

**Code, deferred**
- Vite warns that `plugins/seo.ts` pulls in extensionless imports from `src/content`, which breaks
  once Vite's native config loader becomes the default. It is harmless today.

**Disclosed process gap:** frontend did not invoke `ecc:vite-patterns`, which TASK-101's notes
listed, and said so in its handoff. This is not a false claim, so it is not a violation.

**Stale worktree:** frontend's own throwaway preview worktree (detached, under its session scratchpad)
is left in place. It is not the manager's to remove.

### Commit

`main` @ the commit that adds this handoff, following `fd239e1`. Merges: `9a68f3e` (backend),
`5384eaa` (frontend), `a85aacf` (stickman).

## HANDOFF-3 — main — 2026-10-16

### Summary

Round 2 delivers the owner's four requests, implemented by the running agent sessions and
integrated here in the same session, at the owner's instruction ("Finish all task before getting
back").
- **Clouds** drift through the page.
- **Scroll animations:** depth, plus plate and print arrivals.
- **The loader** is longer: minimum 1.2s → 2.2s.
- **Contact** is one sentence: "Contact: LinkedIn, Email, GitHub."

Both merges were clean. The manager added the 2.2s contract clause and fixed two pre-existing
issues the agents raised: the axe label-in-name failure, and the first-visit deep link. The preview
was redeployed. All 18 v1 and round 2 tasks are `REVIEW` at round 0, and TASK-205 is `BACKLOG`.

**Preview:** https://emanuel-ling-23mjaa59u-team-boh-buh.vercel.app (`main` @ `5c0f122`; Vercel login
required). **Local:** `npm run preview` → http://localhost:3000.

### Tasks Completed

| Task | Owner | Criteria | Head |
|---|---|---|---|
| TASK-109 Contact as one sentence | frontend | K-01, X-04, H-03 | `3754e22` |
| TASK-107 Clouds through the page | frontend | M-01, M-02, M-05 (X-02, F-02, F-03), H-02 unchanged | `3754e22` |
| TASK-108 Scroll depth and arrivals | frontend | M-03, M-04, M-05, X-05, F-03 | `3754e22` |
| TASK-206 Loader minimum 2.2s | stickman | L-07 (round 2), L-02, L-03, L-05, L-06 | `62bfde3` |

**Manager integration glue** (each fix test-first):

| Commit | Change |
|---|---|
| `c4e37dc` | Contract clause: show mode waits 2200ms with `ready` already settled. MIN 1200 turns it red. |
| `c604165`, `be53f05`, `f83628c` | An empty window's name ends ", screenshot soon", and a whitespace node separates the address from the placeholder. Root cause, found with systematic-debugging in axe 4.14's source: `visibleVirtual` joins sibling text with no separator and reads "appscreenshot". |
| `279f1fe` | A first visit to `/#about` lands on About once the loader releases `<main>`. Skip mode is untouched. |
| `f4cbb5f` | The task index was regenerated (verification caught it stale). |

### Files Changed

- **Contracts and decisions** (`0f43d36`, `c604165`): `docs/DESIGN_BRIEF.md` (two motion rows and
  the Quiet principle), `docs/API.md` §1 and §2.2, `docs/ACCEPTANCE.md` (M-01 to M-05, K-01, L-07,
  W-05), `docs/DECISIONS.md` (ADR-011, and an ADR-010 amendment), the design spec note.
- **Plan and tasks:** `docs/superpowers/plans/2026-10-16-round-2.md`, `TASK-107`, `TASK-108`,
  `TASK-109`, `TASK-206`.
- **Merged from workers:** frontend (sections, components, hooks, lib, styles, test-utils, and F-107
  to F-109 evidence); stickman (`loader/progress.ts` and loader tests, F-206 evidence).
- **Manager glue:** `frontend/src/stickman/contract.test.tsx`,
  `frontend/src/components/BrowserWindow/BrowserWindow.{tsx,test.tsx}`,
  `frontend/src/app/App.{tsx,test.tsx}`.
- **Evidence:** `docs/review/M2-*`.
- **Records:** `docs/ARCHITECTURE.md` and `.env.example` (`PREVIEW_URL`), `docs/status/main.md`.

### Contracts

- API.md §2.2: the minimum is 2.2s (was 1.2s); the ramp runs over about 2.2s. The cap, skip, exit,
  and fade are unchanged.
- API.md §1: the window name is "<title>, <label>, <addressBar>", plus ", screenshot soon" while
  the screen is empty.
- No TypeScript contract shape changed. `flags.touchStickman` is still `false`.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:brainstorming | Round 2, before product decisions | The owner opted out of questions, so the readings became recorded manager's calls (ADR-011). |
| superpowers:writing-plans | Round 2, before the task files | Plan header with global constraints and five review-focus failure modes, each pinned to a named test. |
| superpowers:test-driven-development | Integration glue | RED then GREEN for the contract clause (mutation-checked), the window name and separator, and the deep link. |
| superpowers:systematic-debugging | axe still failing after the first name fix | Probes, then axe's source: the real root cause (sibling text fused). A single fix, verified with axe at both widths. |
| superpowers:verification-before-completion | Immediately before this handoff | Fresh clone CI reproduction, below. It caught the stale index. No implementation after it. |

### Verification

**Worker claims checked:**
- **Skill audit:** frontend 15/15 corroborated, plus `animate` ×3 and TDD at 66%, checked by hand
  because the audit regex skips one-word skill names. Stickman 14/14.
- **Scope:** neither branch touched a contract file, and the two branches share no file.

**Fresh clone of `main` @ `7a7752a`:**

| Check | Result |
|---|---|
| CI doc checks | all ok after `f4cbb5f` (index re-checked current) |
| Secrets, `.env` | none; not committed |
| `npm ci` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; JS **83.65 kB gzip**, CSS **6.49 kB gzip** (budgets 110 and 25); 0 em dashes |
| `npm test` | **47 files, 562 passed**; on merged `main` the suite also passed twice at load average 29 |
| `scripts/contract-test.sh` | **5 files, 163 passed** |

**Runtime** (production build, headless Chrome 155 over CDP; `docs/review/M2-results.json`,
`M2-regression-results.json`):

| Check | Result |
|---|---|
| L-07 | `<main>` released 2710ms after navigation start (2.2s minimum + 450ms exit) |
| K-01 | text reads exactly "Contact: LinkedIn, Email, GitHub."; the `h2` labels the section; hrefs and targets correct; no addresses; links ≥ 58px tall at 390 |
| M-01, M-02 | clouds running and moving in Projects and About; paused in Contact while it is off-screen; `aria-hidden`; only `alpine-valley-1600.avif` and `evergreen-forest-1024.avif` |
| M-03 | 8 depth layers, clamped at exactly 80px |
| M-04 | 4 plates (`from-left`/`from-right` by side) and the collage (`settle`): all revealed and settled |
| Reduced motion | 0 running animations, 0 depth writes, 0 unrevealed |
| Round 1 regression | loader, stickman (hidden until the first move; never blocks), window names and attention, wheel, nav `aria-current`, 0 overflow at 1440/768/390, coarse pointer, forced colors: all pass |
| Console | 0 page entries |

**axe 4.14** (`M2-axe-*.json`):
- before: `label-content-name-mismatch` serious ×4;
- after, at 1440 and 390: 0 violations under WCAG 2.2 AA (label-in-name passes 4/4).

**Layout after the separator:** window height equals chrome plus screen plus exactly the 2px border,
and the screen ratio is still 1.600.

**Deep link:** a first visit to `/?loader=1#about` stays at the top under the loader, then lands
with About at 72px (= `scroll-padding-top`).

**Preview:** target preview, READY. The CSP and headers match. `/media` is `must-revalidate`. The
served bundle `index-CWbJ2tPp.js` is identical to the local build.

### What Was NOT Verified

- **The reviewer gate.** No reviewer session was running, so nothing is `APPROVED`. Launch with
  `--model opus` (ADR-007).
- **Safari, Firefox, real phones, screen readers, low-end GPUs:** not run, as frontend also states.
  The new motion relies on `@property`, the individual `translate` property, and `mask-composite`.
- **Lighthouse after the manager glue.** Frontend's 97/100/100/100 (mobile) predates `279f1fe` and
  `f83628c`. Both are tiny, but neither was re-scored.
- **The protected preview in a browser.** Only `vercel curl` was used, as in round 1.
- **Owner sign-off** on the feel of the drift and arrivals (taste; advisory).

### Known Issues

- **A faint seam (advisory, visual).** A luminance step of about 0.015 at the About → Contact
  boundary at some scroll positions, where a section clips its cloud layer (`overflow: clip`). It
  is visible on close inspection. A full-page edge scan finds no new full-width seam compared with
  round 1.
- **The wrapped Contact sentence at 390:** link tap areas overlap vertically by about 12px. Each
  keeps at least 44px (K-01 holds).
- **Vite's native-config warning** about extensionless imports (carried from round 1).
- **The owner actions from HANDOFF-2 still stand:** production still serves the skeleton; the
  preview Toolbar; the bypass secret; `main` not pushed.

### Commit

`main` @ the commit adding this handoff, following `93b8874`. Merges: `0b52d92` (frontend) and
`2122143` (stickman).

## HANDOFF-4 — main — 2026-10-17

### Summary

Round 3 puts the owner's first real project media into the macOS windows, implemented by backend
(TASK-305) and frontend (TASK-110) and integrated here. **StreetSafe: LA** shows the real screenshot.
**Snake AI** plays the real recording while attended, starting seamlessly from its poster frame.
SagePlan and Revelation Youth still read "screenshot soon". **Owner hold respected:** no deploy, no
push.

### Tasks Completed

| Task | Owner | Criteria | Head |
|---|---|---|---|
| TASK-305 Project media, `npm run video`, C-22 | backend | B-06 (preview line deferred by the hold), B-01, B-02, C-21, C-22 | `4f3d0a7` |
| TASK-110 Window recording | frontend | W-08, W-03, W-04, W-05, X-05 | `70b672a` |

**Manager work this round**
- `2ac1ada`: the contract (ADR-012). `ProjectVideo` and the optional `screen.video`, C-22, the API
  rows, W-03 amended, W-08 and B-06 added, the root `video` script.
- `b03068a`: the shipped-window tests made data-driven, so backend's content change kept `main`
  green. Checked with a filled-window mutation.
- `13d778b`: `posterTime`, after backend flagged a jump from the poster at 11.989s back to 0 on first
  play.
- Integration finding: the letterbox was `#161616` next to the recording's `#000`, against W-08's
  "on black". Routed to frontend and fixed at `70b672a`.
- TASK-306 (backlog): `posterTime` precision in `video.swift`, raised by frontend.

### Files Changed

- **Contracts:** `frontend/src/content/types.ts`, `docs/API.md`, `docs/DATABASE.md`,
  `docs/ACCEPTANCE.md`, `docs/DESIGN_BRIEF.md`, `docs/DECISIONS.md` (ADR-012 and its amendment),
  `package.json` (the `video` script).
- **Tasks:** `TASK-305`, `TASK-110`, `TASK-306`, `INDEX.md`.
- **Merged from backend:**
  - `media-src/projects/{streetsafe-la,snake-ai}.png`, `media-src/video/snake-ai.{mov,json}`;
  - `public/media/projects/*` and `public/media/video/snake-ai.mp4` (485,602 B);
  - `scripts/video.swift` and its tests, `media.mjs` (skips `media-src/video`);
  - `validate.ts` (C-22), `projects.ts`, the owner guide.
- **Merged from frontend:** `BrowserWindow.{tsx,module.css,test.tsx}`, `poster.ts`, and the hooks
  `useVideoPlayback` and `useNearViewport`.
- **Manager test change:** `BrowserWindow.test.tsx` (`b03068a`).
- **Evidence:** `docs/review/M3-*`.

### Contracts

- `ProjectScreen.video?: { src, width, height, posterTime? }`: additive and optional. A filled
  window's name drops ", screenshot soon".
- **C-22:** a video requires an image; a valid `src` whose file exists; at most 3 MB; positive
  integer dimensions with `width` ≥ `height`; `posterTime` finite and ≥ 0.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:verification-before-completion | Immediately before this handoff | A fresh clean clone of `062aef9`, plus the owner-hold and merge-integrity checks below. No implementation after it. |

(The contract and test work earlier in this round followed the TDD discipline already invoked this
session: the RED filled-window mutation for `b03068a`. No other skill is claimed for round 3.)

### Verification

**Worker claims checked**

| Branch | Checks |
|---|---|
| Backend | Skill audit 12/12. Scope: 41 files, no forbidden path. MP4 by `mdls`: H.264, video only, 1270×954, 33.7s, 485,602 B. Crops viewed. The follow-up's MP4 and poster blobs are byte-identical to the verified ones. |
| Frontend | Skill audit corroborated. Scope limited to BrowserWindow, its hooks, its test helper, and its own evidence. |

**Clean clone of `main` @ `062aef9`**

| Check | Result |
|---|---|
| CI doc checks | ok; index current |
| Secrets, `.env` | none; not committed |
| `npm ci` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; JS **84.50 kB gzip**, CSS **6.54 kB gzip**; `dist/media/video/snake-ai.mp4` present; 0 em dashes |
| `npm test` | **51 files, 629 passed** (twice on `main` after the TASK-110 merge) |
| `scripts/contract-test.sh` | **5 files, 193 passed** |

**Runtime** (production build, headless Chrome 155, CDP; `docs/review/M3-results.json`)

| Check | Result |
|---|---|
| StreetSafe | `streetsafe-la-1024.avif`; `grayscale(1)` at rest, `none` on attention; no "screenshot soon" in the name |
| Snake AI at rest | video paused; muted, loop, `playsinline`, `preload="none"`, `aria-hidden`; poster `snake-ai-1270.webp`; `contain` |
| Lazy loading | **0 `.mp4` requests before attention**, 1 after |
| Seamless first play | the first `playing` frame is at **11.99s** (`posterTime` 11.989) |
| Leave | paused, with the frame held |
| Reduced motion | attended but never plays; 0 `.mp4` requests |
| Letterbox | `#000000` bars and field on attention; uniform `#131313` at rest |
| axe 4.14 | 0 WCAG 2.2 AA violations at 1440 and 390; label-in-name passes 4/4 |
| Console | 0 entries |

**Owner hold**
- `origin/*` refs are unchanged from the start of the round.
- The newest Vercel deployment is the round 2 preview, from before the hold.

### What Was NOT Verified

- **The reviewer gate:** no reviewer session ran. All 20 v1 to round 3 tasks are `REVIEW`.
- **Safari, Firefox, iOS:** autoplay and inline playback of the H.264 MP4 were not observed there.
  Muted inline play is allowed by policy in each.
- **The still fallback's black letterbox in a browser.** It is covered by a CSS-source test only, as
  frontend states.
- **The preview line of B-06**, `video/mp4` served by Vercel: deferred by the owner hold.
- **Real phones:** the 390 center-band play was verified by frontend in emulation only.

### Known Issues

- **TASK-306 (backlog):** `posterTime` rounding in `video.swift`; no shipped asset is affected.
- **Advisory, carried from HANDOFF-3:** the faint About → Contact cloud seam, and Vite's
  native-config warning.
- **Owner actions:** publishing stays on hold by the owner's choice. The SagePlan and Revelation
  Youth media and the five About photos are still to come.

### Commit

`main` @ the commit adding this handoff. Merges: `0a84041` and `b778123` (backend), and `911fc1d`
and `062aef9` (frontend).

## HANDOFF-5 — main — 2026-10-19

### Summary

Round 4 fills the last two empty windows with the owner's screenshots (TASK-307, backend). All four
project windows now show real media. On the owner's explicit request, `main` was pushed to GitHub
(`628db58`, fast-forward, 361 commits of history), and CI passed there. The publishing hold stands:
the Vercel project has no Git connection, and nothing was deployed.

### Tasks Completed

- **TASK-307** (backend, `60180aa`):
  - SagePlan cropped to 1486×929, Revelation Youth cropped to 1496×935 (16:10; browser edge and
    scrollbar removed; the rects were measured by the manager);
  - renditions at 640 and 1024 plus the source width;
  - alt texts; `site.updated` set to 2026-10-19.
- **Blocker:** three frontend tests rendered the real SagePlan as the empty window, a coupling from
  the manager's `b03068a`. Frontend fixed them with an `emptyWindow` fixture (`3d07856`, shown red
  then green with SagePlan filled). Backend never touched the frontend test.

### Files Changed

- **From backend:** `media-src/projects/{sageplan,revelation-youth}.png`, 18 renditions,
  `media.generated.ts`, `projects.ts`, `site.ts`, B-307 evidence.
- **From frontend:** `BrowserWindow.test.tsx` (the fixture only).
- **Manager:** `TASK-307`, status, this handoff, `docs/review/M4-*`.

### Contracts

None changed.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:verification-before-completion | Immediately before this handoff | Fresh gates on `60180aa`, merge integrity, and the publishing hold, below. No implementation after it. |

### Verification

**On `main` @ `60180aa`**

| Check | Result |
|---|---|
| `npm run typecheck`, `lint`, `build` | exit 0 |
| `npm test` | 629/629 |
| `scripts/contract-test.sh` | 193/193 |
| `npm run media` | 0 written; tree clean |
| Index | current |

**Runtime** (headless Chrome 155; `docs/review/M4-results.json`)

| Window | Media | At rest → on attention |
|---|---|---|
| SagePlan | `sageplan-1024.avif` | `grayscale(1)` → `none` |
| StreetSafe: LA | `streetsafe-la-1024.avif` | `grayscale(1)` → `none` |
| Revelation Youth | `revelation-youth-1024.avif` | `grayscale(1)` → `none` |
| Snake AI | video with `snake-ai-1270.webp` poster | `grayscale(1)` → `none`, playing |

- No window shows "screenshot soon"; names are "<title>, <label>, <address>".
- 0 `.mp4` requests before hovering the Snake AI window.
- Console: 0 entries.
- axe 4.14: 0 WCAG 2.2 AA violations at 1440 and 390; label-in-name passes 4/4.

**GitHub:** CI run 39213865348 on the pushed `main`: success (I-03).

### What Was NOT Verified

- Safari, Firefox, and real phones.
- The reviewer gate (no reviewer session ran).
- Commits after `628db58`, this round's included, are **not on GitHub** yet. Pushing them waits for
  the owner.

### Known Issues

- TASK-306 (backlog).
- The advisory cloud seam.
- The five About photos have not been supplied yet.

### Commit

`main` @ the commit adding this handoff, following `60180aa`.
