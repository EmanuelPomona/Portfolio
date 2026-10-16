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
