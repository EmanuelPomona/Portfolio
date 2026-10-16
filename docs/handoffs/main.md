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
