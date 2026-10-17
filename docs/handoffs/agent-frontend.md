# Handoffs: agent/frontend

## HANDOFF-1 — agent/frontend — 2026-10-16

### Summary

The whole page is built, TASK-101 to TASK-106, with no skeleton markup left:
- design tokens and the page shell;
- the hero with its fog drift;
- the attention system and the dark project windows;
- the alternating project plates;
- About with the scattered prints;
- Contact as a colophon, plus the footer.

**Verification**
- Built TDD-first: 19 test files, 103 tests.
- Checked in a real browser on the production build at 390, 768, 1024, 1280, 1440 and 1280 at 200%.
- An independent code reviewer found **1 Critical** issue (first visits could not be scrolled after the loader) and **1 Important** one (collage captions would be hidden once captions exist). Both are fixed and re-verified.

**Asks for the manager**
- **One contract change request**: the window's accessible name, to meet WCAG 2.5.3.
- **One plan question**: W-03, empty window at rest.
- **One process gap to note**: `ecc:vite-patterns` was never invoked.

**Task status**
- TASK-101, 102, 104, 105 and 106 move to `REVIEW`.
- TASK-103 is `BLOCKED` (`blocked_on: contract`) because of the request below. It is implemented as the contract is written.

### Tasks Completed

**TASK-101: design system, shell, nav, fog-clear reveal**
- H-03: each nav click updates the hash, lands the section 72px below the top under the fixed nav, and sets exactly one `aria-current`, in Deep Forest `rgb(15,46,36)`.
- R-03: all four nav items sit on one line inside 390px, each 44px tall.
- X-03: all 17 Tab stops show `2px solid rgb(15,46,36)` with a 3px offset, and all are 100% visible below the nav.
- X-04: one `h1` (the name). Projects, About and Contact are `h2`.
- X-05: under reduced motion every `[data-fog]` element is revealed at opacity 1, 0 animations run, the drift is `none`, and smooth scroll is off.
- D-03/D-04: the palette is the brief's only. Fonts loaded are Instrument Serif 400 (regular and italic) and Manrope Variable, Latin subset only.
- Unit tests (named in the task):
  - `returns true when (prefers-reduced-motion: reduce) matches and updates on change`
  - `marks revealed once the element intersects at 15%`
  - `is revealed immediately under reduced motion`
  - `never un-reveals`
  - `returns the id whose rect contains innerHeight/2`
  - `defaults to home`
  - `marks exactly one link aria-current`
  - `renders labels in site.nav order`
- Extra tests: tall elements reveal at 15% of the viewport; the last section is active at the bottom of the page; the nav band takes clicks.

**TASK-102: hero and Picture**
- H-01: the name is Instrument Serif 128px at the top left. The nav is centered (offset 0). The photo is full-bleed.
- H-02: the drift is transform only, 45s alternate (a 90s cycle). It moves 42px in 10s at 1440 and 28px at 390.
  - Scrolled away, it pauses and the transform freezes.
  - In a hidden tab it pauses (unit test).
  - Under reduced motion it is `none`.
- R-02 (hero): at 390 the name is 60px on one line, and the links are 44px.
- F-03: CLS is 0 in Lighthouse (mobile and desktop).
- Picture tests (all five named) pass.
- Hero test `renders name as the only h1, tagline, and heroLinks hrefs in order` passes.
- Mount contract rule 4: `ready` is a deferred promise settled by the `decode()` of the hero `<img>` actually rendered. Its rejection is marked handled.
- `?loader=1` releases `<main>` only once the hero image is complete.

**TASK-103: attention and BrowserWindow**
- `inCenterBand`: the task's table plus edge cases.
- `useAttention`: hover (fine pointer), keyboard focus within, coarse-pointer center band, reduced motion. Each is tested.
- W-02 (real mouse in Chrome):
  - At rest the lights are gray, there is no shadow, and the screen is `#161616`.
  - On attention the lights turn `#ff5f57` / `#febc2e` / `#28c840`, one shadow appears, the screen lifts to the fog panel, and the URL goes from `#9aa09d` (6.54:1) to Mist (14.0:1).
  - Keyboard focus gives the same attention state.
- W-03: every shipped window renders no `<img>` and shows "screenshot soon".
- W-04: tested with a fixture image. data-state toggles on hover and focus; the rest state is `grayscale(1)` under 0.86 glass.
- W-05: the name is "SagePlan, Live site", with `target=_blank` and `rel="noopener noreferrer"`.
- W-06: the address shows `project.addressBar` exactly, and the address text never truncates at 390, 768 or 1024.
- W-07: at 390 with touch emulation (`pointer: coarse` matched), the window attends at mid-viewport and reverts at 197 and 718 of 844.
- Review Focus 5: the computed `aspect-ratio` is `16 / 10` (1.600 at every width). A 2:3 fixture screenshot is cropped with `object-fit: cover`.

**TASK-104: projects**
- W-01: plates alternate left, right, left, right at 1024, 1280 and 1440.
- R-02: plates stack (window, title, caption) at 1023, 768, 390 and 640 (1280 at 200%).
- Review Focus 4: no window and caption overlap anywhere, and `scrollWidth == innerWidth` everywhere. The caption's bottom equals the window's bottom from 1024px up.
- P-02: every primary link is one Tab stop or one nav click away.
- Tests:
  - `renders four articles in content order with numbers 01..04`
  - `caption shows the exact sentence and meta joined by " · "`
  - `secondary links never repeat the primary href`
  - `data-side alternates left,right,left,right`
  - `a 60-character title fixture renders without truncation`
  - extra: headings are named "01 SagePlan" (not "01SagePlan"); a contrast regression guard.

**TASK-105: About and collage**
- A-01: order is description, "This semester", the two classes, then five prints at 4:3, 2:3, 4:3, 9:16 and 4:3, in a scatter echoing wireframe 3.
- A-02: empty prints have no image, no words, are `aria-hidden` and have no `figcaption`.
- A-03: with a fixture image, data-attended toggles on hover and focus. In the browser, the filter goes from `grayscale(1) contrast(0.72) brightness(1.08)` at rest to `none`.
- R-02: phones get an offset two-column arrangement that overlaps a little (7–11%). Tablet is an intermediate step. No horizontal scroll.
  - Spreads are exactly as tall as their lowest print (CSS `max()` over each print's ratio).
- Review Focus 5: six photos give six slots (positions 0–4 then 0), and a 120-character caption renders in full.
  - With captions, the spread loosens into a non-overlapping flow, so 0% of any caption is covered at 1440, 1024, 768 or 390.

**TASK-106: Connect, polish, evidence**
- K-01: LinkedIn, Email, GitHub in order with the exact hrefs. Email is `mailto:emanuelling27@gmail.com` and opens in the same tab.
- Footer shows "© 2026 Emanuel Ling" and "Updated October 2026". The date is parsed without `Date`, and a malformed date drops the line.
- R-01/R-02/R-03, Review Focus 4, and the states evidence: see Verification.
- X-01: Lighthouse Accessibility is 100 (mobile and desktop) and axe shows 0 critical. X-02 contrast is measured over the photos (numbers below).
- D-01 to D-05: self-check below. slop-check output is pasted below. U+2014 appears 0 times in `dist`.
- F-02: build sizes are pasted below. F-03: CLS 0.
- I-02: `docs/review/F-console.txt` shows 0 errors and 0 warnings.
- Connect test `renders LinkedIn, Email, GitHub in order with exact hrefs` passes.

### Files Changed

All are frontend-owned. No contract, content, stickman, config or backend file was changed; `git diff --name-only 3ea91a0..HEAD` was checked.

- `frontend/src/main.tsx`: Latin-only fonts, preload of the name's font and the hero image.
- `frontend/src/app/App.tsx`, `App.test.tsx`.
- `frontend/src/styles/`: `tokens.css`, `global.css`, `fonts.css`, `global.test.ts`.
- `frontend/src/hooks/`: `useMediaQuery`, `usePrefersReducedMotion`, `useFogReveal`, `useActiveSection`, `useAttention`, each with tests.
- `frontend/src/lib/`: `centerBand`, `format`, each with tests.
- `frontend/src/components/`: `Nav`, `Section`, `Picture`, `BrowserWindow`, `PhotoSlot`. Each has `.tsx`, `.module.css` and `.test.tsx`.
- `frontend/src/sections/`: `Hero`, `Projects`, `About`, `Connect`, `Footer`. Each has `.tsx`, `.module.css` and `.test.tsx`.
- `frontend/src/test-utils/media.ts`: a controllable `matchMedia` and IntersectionObserver for tests.
- `docs/status/agent-frontend.md`.
- `docs/tasks/TASK-101..106` (status only).
- `docs/review/F-*` (evidence).

### Contracts

**Changes made: none.** Every cross-agent contract is used as written.

**Notes for consumers**

- **Stickman slice: scroll lock.**
  - The page now releases the §2.4 gate's scroll lock itself, with `html[data-loader='show'] body:has(main:not([inert])) { overflow: visible; }` in `global.css`.
  - The real Loader does **not** need to touch `body` overflow. If it does, both are harmless.
  - The page never declares `cursor: none` and never styles `.stickman-*`. The `--z-*` tokens are unchanged.
- **Stickman slice: hero copy reveal.** It waits for `loaderDone`, then fog-clears as the paper clears. The Loader's exit and the reveal (0.9s) will overlap. That is intended.
- **Hero prop.** `Hero` takes an additive optional `ready` prop (default `true`). `Picture` takes an additive optional `onError`. Both are within the "Produces" interfaces, nothing removed.
- **Dependencies: none added.** Lighthouse 13.5.0 and axe-core 4.14.0 were installed only in the session scratchpad to measure. They are not in any `package.json`.

## CONTRACT CHANGE REQUEST — BrowserWindow accessible name (TASK-103, W-05)

**Current shape**
- Where it is set: docs/API.md §1, `project.primary` row; ACCEPTANCE W-05; TASK-103 Interfaces.
- The window link's accessible name is exactly `"<title>, <primary.label>"`, set with `aria-label`. For example: "SagePlan, Live site".

**Proposed shape**
- `"<title>, <primary.label>, <addressBar>"`. For example: "SagePlan, Live site, sageplan.vercel.app".
- It keeps the current prefix and adds the text the window visibly shows.

**Why**
- WCAG 2.5.3 Label in Name is Level A, so it falls inside the project's WCAG 2.2 AA goal.
- The only visible text inside the link is the address bar (plus "screenshot soon" while empty).
- A voice-control user who says the URL they see cannot activate the window.
- axe-core 4.14 reports `label-content-name-mismatch` (impact: serious) on all four windows, at 1440 and 390, at rest and on attention.
- Lighthouse does not run that rule (Accessibility 100), and X-01 counts only critical violations, so X-01 as written passes.

**What breaks if it is not changed**
- Nothing in the gate.
- The page ships a known Level A failure on its four primary links.

**If approved**
- The change is one line in `BrowserWindow.tsx` plus its W-05 test.
- API.md §1, ACCEPTANCE W-05 and TASK-103 change together, in one manager commit.

**Related clarification (no change needed for this branch)**
- §2.2 and §2.4 do not say who releases `html[data-loader='show'] body { overflow: hidden }` after the loader.
- The page releases it in CSS now (see Contracts).
- Suggest one sentence in §2.4 so the stickman Loader does not duplicate it.

## QUESTION FOR THE MANAGER — W-03 at rest

- **W-03 says** "Every v1 window shows … a flat fog-tone screen with 'screenshot soon'."
- **The brief's interaction states** say a window is "dark … at rest" and "the screen rises from black" on attention. The owner said "black until you hover."
- **What I built:** an empty window is **black at rest**, with "screenshot soon" in `#8a8f8c` (5.5:1). It lifts to the **flat fog-tone panel** on attention.
- **The other reading** (fog panel at rest) would remove "black until you hover" from every v1 window.
- **Please confirm or reverse.** Either way it is a two-line CSS change.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| ecc:frontend-design-direction | TASK-101 step 1, before any UI | Set the purpose (name to four live links in one scroll), the tone (photo-book editorial) and the scan order. I deliberately overrode its one-hue-palette warning with the brief. |
| frontend-design:frontend-design | TASK-101 step 1 | Two-pass plan reviewed against the brief: sentence-case "This semester" (no eyebrow), captions bottom-aligned to the window like plate captions, Contact as a colophon with real addresses, no arrows, eyebrows or monospace. |
| ui-ux-pro-max:ui-ux-pro-max | TASK-101 step 1 | I rejected its generated system (pure black and white, Playfair). I kept its UX rules: `scroll-padding-top` for the fixed nav, 44px targets, transform/opacity motion, exits faster than entrances (0.45s vs 0.7s), no reliance on `animationend`. |
| design-taste-frontend | TASK-101 step 1, anti-generic critique | Moved the tagline to Manrope (serif kept for the name and titles). Varied plate widths (7 and 6 columns) to break the mechanical zigzag. Italic descender clearance. Light-only. One shape rule. Shadow tinted to the fog. |
| superpowers:test-driven-development | TASK-101 step 2, before hook code | Red then green for every hook, component and section (103 tests). Each new module was first watched failing. |
| ecc:react-patterns | TASK-101, before hooks | `useSyncExternalStore` for media queries; a cleanup for every listener and observer; the reduced-motion latch done during render, not in an effect. |
| ecc:frontend-a11y | TASK-101, before Nav and Section | Semantic nav with `aria-current="true"`, sections `aria-labelledby` their `h2`, decorative backdrops `alt=""` plus `aria-hidden`, the nav kept inside the inert `<main>`. |
| vercel:react-best-practices | TASK-101, after the TSX edits | Moved `useActiveSection` into an `ActiveNav` leaf, so a section change re-renders only the nav. Ternary for the optional heading. |
| ecc:react-performance | TASK-102, hero LCP | React DOM `preload()` of the best hero source (`type` + `imagesrcset`, high priority) before render. Verified: one request, at High priority. |
| superpowers:systematic-debugging | TASK-104, X-02 caption contrast failure | Mapped captions into the photo's coordinates and found the pine cluster under plate 1's caption. Fixes, one at a time: mirror the backdrop only from 64rem, dissolve the caption-side edge early. Result: 0 failures at 9 widths. Also found the backdrop spilling into Contact. |
| ecc:make-interfaces-feel-better | TASK-106 step 3 | Measured: no `transition: all`, every target 44px or more and 8px or more apart, every text block wrapped. Changed: the hero name's optical offset (ink 57.4 to 60.0 px against the tagline's 60.1), a neutral outline on prints, the footer rule sized to the content. |
| ecc:browser-qa | TASK-106 step 4, production build | Lighthouse, axe, a keyboard pass, a reduced-motion pass, the console log and the full evidence set (see Verification). No visual baseline existed, so these captures are the baseline. |
| superpowers:requesting-code-review | TASK-106 step 5 | Dispatched an independent reviewer with only the requirements and the git range. Verdict: with fixes (1 Critical, 1 Important, 5 Minor). |
| superpowers:receiving-code-review | TASK-106 step 5, before fixing | Reproduced each finding before fixing it, one at a time, each with a test. 6 of 7 fixed. Finding 4 is the W-03 question above. |
| superpowers:verification-before-completion | Immediately before this handoff | A fresh run of every command in Verification. No implementation work after it; only this handoff, the status file and the task frontmatter. |

**Gaps, stated plainly**
- `ecc:vite-patterns` is listed in TASK-101's notes and was **not invoked**. The one Vite-specific decision (a bare package path in a CSS `url()`) was checked with a build probe instead.
- `ecc:e2e-testing` was not applicable. There is no E2E framework in the stack, and adding Playwright is a new dependency. The primary flow is scripted over the DevTools protocol (F-console.txt) instead.
- `superpowers:systematic-debugging` was **not** invoked for two short debugs early on: a rAF throttle stuck under a synchronous test stub, and a focus test that depended on test order. Both were root-caused by hypothesis and probe. This is recorded in the status file.

### Verification

Run fresh at HEAD `5a734ba`, from the repo root:

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 problems |
| `npm test` | exit 0: **19 files, 103 tests passed** |
| `npm run build` | exit 0: `index-*.js` 238.92 kB / **75.15 kB gzip** (budget 110); `index-*.css` 19.82 kB / **5.40 kB gzip** (budget 25) |
| `scripts/contract-test.sh` | exit 0: "no HTTP API declared … running module contract tests", 9 passed |
| `grep -rl $'—\|–' frontend/dist --exclude='*.map'` | 0 files (D-05) |
| secrets grep of `git diff 3ea91a0..HEAD` | none; `.env` is not tracked |

**`scripts/slop-check.sh frontend`** (D-03): every hit is a brief-listed justified exception.
```
[decorative drop shadow]  3 hit(s)   BrowserWindow.module.css: none / transition / var(--shadow-window) on attention
                                     = brief item 4: one elevation shadow, project windows only, on attention
[gradient]  4 hit(s)                 Hero.module.css (photo edge, fog band on the drift copy),
                                     Section.module.css (backdrop photo edges)
                                     = brief item 1: alpha masks on photographs only
7 mechanical hit(s) across frontend/
```

**Browser tooling.** The chrome-devtools MCP profile was locked by another session, and I did not kill another agent's browser. All browser checks ran in my own isolated headless Chrome 155 over the DevTools protocol (port 9333, profile in the scratchpad). The production build was served by `vite preview` on port 3101, so it would not collide with this worktree's dev server on 3001.

**Lighthouse (production build, local)**
- `docs/review/F-lighthouse-local-mobile.html`: Performance 90, Accessibility **100**, Best Practices 100 (96 on the first, cold run because of the favicon 404), SEO 82. LCP 3.5s, CLS **0**, TBT 0ms.
- `docs/review/F-lighthouse-local-desktop.html`: 100 / **100** / 100 / 82. LCP 0.7s, CLS **0**.

**axe-core 4.14 (WCAG 2.2 AA plus best practice)**
- At 1440 and 390, at rest and on attention: **0 critical**.
- 1 serious: `label-content-name-mismatch` ×4, the contract change request above.
- `color-contrast` is incomplete over the photos. axe cannot evaluate over images, so it is covered by the measurement below.

**X-02 contrast.** Measured against the darkest background pixel under each glyph run, with the text made transparent and the screenshot sampled with sharp.
- Hero (5 widths): name ≥ 11.69, tagline ≥ 9.59, links ≥ 10.41, the `·` separators ≥ 5.05.
- Projects (9 widths): 0 failures. Tightest is 4.89, a meta line over the faded edge at 1024.
- About (8 widths): 0 failures. The lede is ≥ 5.37 at stacked widths; "This semester" is ≥ 5.33.
- Solid pairs: `#4f5552` on Mist 6.15; window URL at rest 6.54; "screenshot soon" 5.5 at rest and 5.09 on attention.

**Scroll after the loader (Critical fix)**
- With `?loader=1` at 1440 and 390: wheel 1200 gives `scrollY` 1200, PageDown gives 1988 / 1932, `body` is `overflow-y: visible`.
- With `decode()` held open, the lock holds while the loader is up: `inert`, `hidden`, wheel moves to 0. It releases after the cap (wheel moves to 1200).

**Artifacts in `docs/review/`**
- Full pages (R-01): `F-01-desktop-1440.png` (1440×6460), `F-02-tablet-768.png` (768×6671), `F-03-mobile-390.png` (390×5301). Each has `scrollWidth == innerWidth`.
- Review Focus 4: `F-zoom-1280-200pct.png` (640 CSS px at DPR 2: stacked, no overlap, no horizontal scroll).
- States: `F-04-state-empty.png` (window at rest and an empty print), `F-05-state-attention.png` (both attended).
- I-02: `F-console.txt`. Production build, fresh session, cache cleared. Load, wheel, PageDown, Home, nav ×4, hover four windows and one print: **0 errors, 0 warnings**.
- Per-task:
  - `F-101-{desktop-1440,tablet-768,mobile-390,focus-ring}.png`
  - `F-102-hero-{1440,768,390}.png`
  - `F-103-window-{rest,attention,touch-center-390}.png`
  - `F-103-window-fixture-{rest,attention}.png`
  - `F-104-projects-{1440,1280,1024,768,390}.png`
  - `F-105-about-{1440,768,390}.png`
  - `F-105-photo-fixture-{rest,attention}.png`
- Fixture images were applied to `content/about.ts` and `projects.ts` locally only, then reverted. `git status` was clean afterwards, and no fixture is committed.

**DESIGN_CONSTRAINTS §5 self-check**
1. Reference points: matched. Windows are plates with captions set opposite; a full gray range; wide fog margins; Deep Forest only where you interact; hairlines; `01 / Title`.
2. Signature element: **not on this branch** (stickman stub). See below.
3. Gradient or shadow where flat would be stronger: no. Only the justified photo masks and the one window shadow.
4. Pure white canvas: no. Mist is the canvas and Ivory the lightest tone.
5. Three-card row or bento: no.
6. Typography: chosen, Instrument Serif and Manrope by role.
7. Em dash or "It's not X, it's Y": none.
8. Robotic or synthetic: no.
9. Primary test: no, this could not be pasted onto an AI startup. Fog photography, black windows that light up and plate-book captions belong to this person. The hero alone (big serif over a moody photo) is the most generic moment; the stickman is what completes it.

### What Was NOT Verified

- **The signature element (D-02, S-01 to S-10).** `StickmanLayer` is the scaffold stub on this branch, so the page shows the native cursor.
  - S-06 is not verified: is the stickman visible over the black windows? It needs the stickman branch integrated.
  - The hero copy's reveal timing against the real loader exit was only seen with the stub, which exits as soon as `ready` settles, with no 1.2s minimum.
- **The deployed preview.** F-01 (mobile Lighthouse on `PREVIEW_URL`) belongs to TASK-304. Everything here is local.
  - The local mobile Performance score is 90, exactly at the bar. The LCP element is the hero name, held until the loader's `ready`, at 3.5s under simulated slow 4G.
- **Browsers other than Chrome 155.** The page relies on `:has()` (which also drives the scroll-lock release), container query units, `mask-composite`, `color-mix()` and `text-wrap`.
  - Firefox before 121 lacks `:has()`, so the scroll lock would persist there after the loader.
  - Safari and Firefox were not run.
- **Real touch devices.** Only Chrome's touch emulation (`pointer: coarse`) was used. iOS Safari, the LinkedIn in-app browser and Android were not run.
- **Color arriving.** The repo's only images are the two monochrome backgrounds. The fixtures prove the darkening, the lift and the filter switch (`grayscale(1)` to `none`), but not visible color.
- **Screen readers.** No VoiceOver or NVDA pass. Only axe and accessible-name queries (Testing Library / dom-accessibility-api).
- **Forced-colors mode.** Not checked.
- **AVIF/WebP `<source>` output from TASK-302.** It was not exercised in a browser; the manifest is JPEG-only. The unit test covers one `<source>` per entry, in order.
- **Drift pausing in a hidden tab.** Unit test only; not verified in a browser.
- **Visual regression.** No baseline existed, so these captures are the first baseline (INCONCLUSIVE as a regression check, by the browser-qa skill's rule).

### Known Issues

- **Window label-in-name** (axe, serious ×4): pending the contract change request above.
- **Not frontend-owned (backend TASK-303):** `/favicon.ico` 404 on a cold profile, no meta description, and SEO 82. On `vite preview`, `/robots.txt` serves `index.html`.
- **Advisory, for the owner: the Projects backdrop.** From 1024px the evergreen photo is mirrored and its caption-side edge dissolves early. The dense pines therefore sit mostly behind the first window rather than beside the captions. This was required for X-02 (before the fix, the caption measured 1.8:1). There are fewer visible pines in Projects on desktop than in wireframe 2.
- **Advisory: captioned collage.** Once captions exist, a spread loosens from the overlapping scatter into a staggered flow that never covers a caption. The second row sits left of center and will want tuning when real photos (and their real aspects) arrive.
- **Advisory: the About backdrop.** Below 1024px it dissolves before the pine cluster to keep the lede at 4.5:1 or better, so phones and tablets see fog with fainter pines.
- **W-03 interpretation:** see the question above.

### Commit

`agent/frontend` at `5a734ba` (implementation and evidence), followed by this handoff's docs commit. There are 61 commits since `3ea91a0`, with no attribution trailers. The branch is pushed to `origin/agent/frontend`, so the contract change request is visible outside this session (protocol §6).

## HANDOFF-2 — agent/frontend — 2026-10-16

### Summary
The owner asked to see the stickman on the page. It lives on `agent/stickman` (TASK-201 to TASK-204, handed off), so I built a **throwaway combined preview**. No branch was merged; integration stays with the manager.
- **How:** a detached worktree of `agent/frontend` in the session scratchpad, with `agent/stickman`'s `frontend/src/stickman/**` and `frontend/stickman-lab.html` checked out on top. It was served at http://localhost:3201/.
- **Overlap:** the two branches change no file in common, so the combined tree has no conflicts.
- **Integration finding:** the combined tree had **3 failing tests**, all in my `App.test.tsx`.
  - They asserted the scaffold stub's timing: `#boot-cover` still present while loading, and release the instant `ready` settles.
  - The real Loader correctly removes the cover on mount (API.md §2.2, show mode step 1) and holds at least 1.2s.
  - **Fixed** by testing App's wiring against a controllable Loader mock. Loader timing remains covered by `src/stickman/contract.test.tsx`.
  - Merging the branches would otherwise have turned CI red.

### Tasks Completed
No new task. Test fix for TASK-102 (mount contract, rule 4) and TASK-106 (review finding 5).

### Files Changed
- `frontend/src/app/App.test.tsx`

### Contracts
None changed.

### Skills Used
| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:verification-before-completion | Re-invoked after the App.test change | Fresh runs (below). No implementation after it. |

### Verification
- **`agent/frontend` @ cf153dc:** typecheck 0, lint 0, `npm test` 19 files / **104 passed**, build unchanged (JS 75.15 kB gzip, CSS 5.40 kB gzip), `scripts/contract-test.sh` 9 passed.
- **Mutation check:** unwiring `onHeroDecode` turns 2 App tests red, as expected.
- **Combined preview** (my branch plus the stickman files, uncommitted): typecheck ok, **35 files / 321 tests passed**.
- **In the browser** (1440, real mouse, `?loader=1`, fresh session):
  - the loader shows progress (75, then 100) and releases `<main>` at about 2.0s;
  - `html.stickman-cursor` is set and the stickman canvas is present;
  - the stickman walks to and stands over a project window, which comes alive;
  - the hero copy is revealed;
  - a 1200px wheel scrolls the page (the scroll-lock release works with the real Loader);
  - the console has 0 errors.

### What Was NOT Verified
- The full stickman acceptance set (S-01 to S-10, T-01 to T-04) on the combined page. That is the stickman slice's evidence and the reviewer's gate.
- Phones and reduced motion on the combined preview.
- The preview is not a merge: `scripts/integrate.sh` has not been run, and the manager still owns integration.

### Known Issues
Unchanged from HANDOFF-1.

### Commit
`cf153dc` (test), followed by this docs commit, pushed to `origin/agent/frontend`.

## HANDOFF-3 — agent/frontend — 2026-10-16

### Summary
Round 2 is built and verified: TASK-109, then TASK-107, then TASK-108, in the order assigned. All three tasks are now `REVIEW`.
- **TASK-109, Contact as one sentence.** The section now reads "Contact: LinkedIn, Email, GitHub." The `h2` "Contact" sits inside the sentence and names the region. The punctuation is outside every link. The "opens in a new tab" notice is an `aria-describedby` to a hidden span, so the visible sentence stays clean.
- **TASK-107, clouds through the page.** Photographic cloud layers, cut from the owner's two photographs, drift behind Projects, About and Contact.
  - They are fetched at the same URLs as the existing hero and backdrop images, so there is no new request.
  - They move by transform only, on strokes of 60s or more.
  - They pause off-screen and in a hidden tab, and are static under reduced motion.
  - They are screened as one group over a Mist ground, so they can only lighten what sits behind text.
- **TASK-108, scroll depth and arrivals.**
  - The hero photograph, the section backdrops and each cloud layer travel slower than the content: at most 80px, `translate` only, one passive scroll listener, with the work done in rAF.
  - Each project window arrives from its own side, with its title and caption a beat behind.
  - Each About print settles into place, 50ms apart.
  - Arrivals play once and never replay, including after a reduced-motion or print toggle.
  - Focused content is always fully visible.
- **Independent code review:** verdict "with fixes", 0 Critical, 1 Important, 6 Minor. The Important finding (finished reveals replayed after a reduced-motion or print toggle) is fixed. So are five Minors; the sixth needs no change.

### Tasks Completed
- **TASK-109:** K-01, X-04, H-03, and the 4 named tests.
  - **Evidence:** `docs/review/F-109-contact-{1440,768,390}.png`.
  - **One line:** at 1440, 1280, 1024 and 768 (counted from text line boxes); two lines at 390, as K-01 allows.
  - **Links:** 105, 75 and 58px tall.
  - **Nav:** the Contact link lands on the section with `aria-current`.
- **TASK-107:** M-01, M-02, the X-02 and F-02/F-03 parts of M-05, H-02 unchanged, and the 6 named tests plus a blend regression test.
  - **Evidence:** `F-107-clouds-1440-t0.png` and `-t10.png` show +18.2px and −15.8px of movement in 10s; `F-107-clouds-390.png`.
  - **Pausing:** the drift is paused when scrolled away.
  - **Requests:** only `alpine-valley-1600.avif` and `evergreen-forest-1024.avif` are fetched, the same files as before.
- **TASK-108:** M-03, M-04, M-05, X-05, F-03, and the 10 named tests.
  - **Evidence:** `F-108-arrival-1440.gif` and `F-108-arrival-390.gif` (scrolling through Projects and About), and `F-108-perf-trace.txt`: 5s of real wheel and touch scrolling, 0 long tasks over 50ms, 0 script-forced layouts.
  - **Tests added beyond the named ten:** wiring, seam, focus, replay, measurement and Contact-layer tests.

**X-02 under the clouds (TASK-107 asks for these numbers).** Worst background pixel under each text run, with the text hidden and the layers held at each end of their drift. The stickman canvas is excluded, since its own strokes are not background:

| Section | Drift end | 390 | 768 | 1440 |
|---|---|---|---|---|
| Projects | start | 6.15 / 4.5 | 6.15 / 4.5 | 6.07 / 4.5 |
| Projects | end | 6.15 / 4.5 | 6.15 / 4.5 | 6.07 / 4.5 |
| About | start | 6.15 / 4.5 | 5.69 / 4.5 | 6.51 / 4.5 |
| About | end | 6.15 / 4.5 | 5.91 / 4.5 | 6.34 / 4.5 |
| Contact | start | 8.99 / 3 | 9.38 / 3 | 6.51 / 3 |
| Contact | end | 8.99 / 3 | 9.49 / 3 | 9.81 / 3 |

**X-02 under scroll depth (TASK-108, M-05).** Section backdrops can now sit anywhere from 0 to 80px below their resting place, so each text box was stretched by 80px up and down over backdrop-only pixels. The clouds were left out, since a screen can only lighten. Results:
- **Projects and About:** 15/15 runs pass at 390, 768, 1024, 1280 and 1440. The tightest is the Projects meta line at 1024, 4.79 / 4.5.
- **Hero:** measured live at scroll 0 to 500, it passes. Its tightest is the decorative dot at 390, 4.8 / 4.5.

### Files Changed
`frontend/src/` only:
- **TASK-109:** `sections/Connect/*`, `lib/format.*` (removed the now-unused `displayAddress`), `components/Section/*` (additive props `labelledBy`, `clouds`; Mist ground; `overflow: clip`).
- **TASK-107:** `components/Clouds/*` (new), `components/Picture/sizes.ts` (new: one `sizes` value per photograph use), `hooks/useDriftPlaying.*` (extracted from Hero), `sections/{Projects,About}/*.tsx` (`clouds`).
- **TASK-108:** `lib/depth.*` (new), `hooks/useScrollDepth.*` (new), `hooks/useFogReveal.*`, `styles/global.css` and `styles/tokens.css` (arrivals, settle, focus, `@property --depth`, `scroll-padding-bottom`), `sections/{Hero,Projects,About}/*`, `components/Clouds/*`, `components/Section/*`.
- **Test helpers:** `test-utils/cssTimings.ts` (new: reads timings from the CSS sources), `test-utils/frames.ts` (new: a hand-flushed rAF), `test-utils/media.ts` (a `top` option on the fake IntersectionObserver).
  - `test-utils/media.ts` is the frontend's own test helper, **not** the contract `media.ts`.
- **Docs and evidence:** `docs/review/F-107-*`, `F-108-*`, `F-109-*`, refreshed `F-01`, `F-02`, `F-03`, `F-zoom-1280-200pct`, `F-console.txt`, `F-lighthouse-local-*`; `docs/status/agent-frontend.md`; the three task files (status only).

### Contracts
None changed, and there is no contract change request this round.
- **Contract files untouched:** `git diff 68b0ebc..HEAD` touches none of `index.html`, `content/*` (including `types.ts` and `media.ts`), `stickman/*`, `flags.ts` or `vite.config.ts`.
- **New interfaces are frontend-internal:**
  - `depthOffset(m, factor, maxPx)` and `DEPTH` in `lib/depth.ts`;
  - `useScrollDepth(target, factor)` and `DEPTH_MAX_PX` in `hooks/useScrollDepth.ts`;
  - `settleWhenRevealed(el, onSettled)` in `hooks/useFogReveal.ts`;
  - the `data-arrive` and `data-reveal="instant"` attributes.
- **For the stickman slice:** windows and prints are never parallaxed, only backgrounds and clouds. Arrivals finish within about 1.1s and never replay, so cached target rects stay true.

**Choices made where the tasks left room (recorded as instructed):**
- **Contact is set in proper case,** as in the round-1 heading.
- **The clouds' screen blend sits on the `.clouds` wrapper,** over a Mist ground the Section paints. With the blend on each layer, the wrapper's stacking context isolated it and the dark rocks painted normally: contrast measured 1.13:1. On the wrapper it measures 6.51:1. A regression test guards this.
- **Cloud recipe:**
  - Projects and About: a valley layer (84s, ±44px, 50%) and a forest layer (66s, ∓36px, 42%).
  - Contact: one valley band, chosen in TSX so no hidden layer is mounted.
- **`useScrollDepth(target, factor)`** instead of a no-argument hook, to match `useDriftPlaying(target)`, so Clouds shares one root element without merged refs.
- **Depth is registered per cloud layer, not on the wrapper.** A tall section's wrapper would sit at the 80px clamp the whole time its top cloud is in view.
- **Depth factors** (farther lags more): backdrop 0.1, hero 0.08, valley cloud 0.06, forest cloud 0.04.
- **The backdrop moves down only** (`translate: 0 calc((var(--depth) + 80px) / 2)`, so 0 to 80px). **The hero photograph slides inside a still, masked frame.** Both decisions came from a measured seam: with depth on, the boundary luminance step was 0.15 to 0.27, against 0.008 with depth off. After the fix it is 0.008 with depth on.
- **Arrival timing:**
  - Distances: windows 48px; titles, captions and prints 16px.
  - The caption trails its window by 0.12s, a beat rather than a stagger.
  - Prints use the existing 0.05s stagger.
  - Arrivals use the same curve and 0.9s duration as the fog-clear, so they read as one gesture.
- **`data-reveal="instant"`** (no motion, never removed) is set when:
  - the observer finds an element above the viewport;
  - an element receives focus;
  - reduced motion is on;
  - a reveal that did play has finished. This is the replay fix.
- **Correction to my own earlier claim:** a smooth nav jump reveals the plates it passes through the normal arrival, not instantly. "Already above the viewport" applies when the observer's first report finds the element above, or when a jump carries a partly shown element off the top.

### Skills Used
| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:test-driven-development | Start of round 2, before any code | Red then green for every test listed above. Mutation checks: a synchronous write, a non-passive listener and a removed "above" branch each fail their test. |
| animate | TASK-107, before the cloud motion | CSS animation, translate3d only, ease-in-out alternate, strokes of 60s or more, negative delays; the blend on the group so the clouds only lighten. |
| animate | TASK-108 step 1, before arrivals and depth | Arrivals: CSS keyframes on the existing reveal attribute, `translate` only, the codebase's `--ease-out` and `--dur-reveal`, 48px and 16px distances and a 0.12s beat. Depth: one passive listener, writes in rAF, the value written on the layer itself, `@property --depth` not inherited. Reduced motion: no travel. |
| superpowers:systematic-debugging | TASK-108, the seam seen in the first arrival GIF | A luminance-step probe (depth live vs off), then in-page hypothesis tests. It found two root causes: the hero mask riding the moving layer, and negative backdrop offsets. Fixed in `e4e7187`. |
| ecc:browser-qa | Round 2 final QA, production build | Smoke at 390, 768, 1440 and 1280 at 200%, keyboard, reduced motion, axe, Lighthouse, console. Found focus rings cut off at the viewport bottom, fixed in `ea51782`. |
| superpowers:requesting-code-review | After browser QA | An independent reviewer, given only the requirements and the git range. Verdict "with fixes": 1 Important, 6 Minor. |
| superpowers:receiving-code-review | Before acting on the findings | Reproduced the Important finding on the production build first, then fixed one item at a time, each test-first: `8aaf421`, `ac11b8f`, `32dd711`, `8d8e6c9`, `b6ceac8`. |
| superpowers:verification-before-completion | Immediately before this handoff | A fresh run of every command under Verification. No implementation work after it; only this handoff, the status file and task frontmatter. |

**Gaps, stated plainly**
- **The design-pipeline skills were not re-invoked this round.** These are `ecc:frontend-design-direction`, `frontend-design:frontend-design`, `ui-ux-pro-max:ui-ux-pro-max`, `design-taste-frontend` and `ecc:make-interfaces-feel-better`. They were invoked in round 1 for the whole visual system, and round 2 stayed inside it: the same tokens, type and motion vocabulary rows the manager added. Contact's restyle reuses the display step and link style.
- **TASK-107's contrast regression (1.13:1) was debugged by hypothesis and probe, and my status file does not record a `superpowers:systematic-debugging` invocation for it,** so I do not claim one.
- **`ecc:e2e-testing` is not applicable.** There is no E2E framework, and the flows are scripted over the DevTools protocol instead.

### Verification
Fresh at `f607e14` (`agent/frontend`), immediately before this handoff:
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npx vitest run`: **47 files, 551 tests passed**.
- `npm run build`: exit 0. **JS 83.55 kB gzip, CSS 6.49 kB gzip** (budgets 110 and 25).
- `scripts/contract-test.sh`: exit 0, 5 files, **162 passed**.
- `scripts/slop-check.sh`: 19 mechanical hits, all under the brief's existing Justified exceptions. They are the alpha masks on photo edges (now including the clouds' masks), the one window shadow, and the stickman's difference ink (stickman slice files).
- **Diff review:**
  - no contract file touched, and nothing outside frontend-owned paths;
  - no credentials (the only scan matches are "design tokens");
  - `.env` untracked;
  - 0 attribution trailers;
  - 34 commits this round;
  - 0 em or en dashes in `dist/`.

**Browser** (production build, `vite preview` at :3101, isolated headless Chrome 155 over CDP; scripts in the session scratchpad):
- **Smoke at 1440, 768, 390 and 640 (1280 at 200%):**
  - console: 0 errors;
  - requests: 0 with a 4xx or 5xx status;
  - LCP: 48–64ms locally;
  - CLS: 0 to 0.0013;
  - overflow: none (scrollWidth never exceeds the viewport);
  - fog: 0 elements left unrevealed after a scroll-through.
- **Lighthouse:** mobile 97 / 100 / 100 / 100 (LCP 2.3s, CLS 0, TBT 0ms); desktop 100 / 100 / 100 / 100.
- **axe, WCAG 2.2 AA:** 0 critical. One serious item, which predates round 2; see Known Issues.
- **Arrivals:**
  - before reveal, parts sit at −48 / −16px (left plates) and +48 / +16px (right plates);
  - order: window, then title, then caption;
  - all parts end at `translate: none`, opacity 1, with no animations left;
  - prints are delayed 0, 50, 100, 150 and 200ms;
  - scrolling away and back shows a single state ("1|none|0");
  - after reduced-motion and print toggles, 0 reveal animations run anywhere.
- **Depth:**
  - `--depth` matches values recomputed from layout at every probed scroll position, and clamps at 80;
  - a resize alone moves nothing;
  - the hero photograph's top edge stays above the viewport (−11.5px);
  - every section boundary's luminance step equals the depth-off baseline.
- **Performance:** `F-108-perf-trace.txt`, 0 long tasks over 50ms at 1440 and 390.
- **Keyboard (22 stops):**
  - every stop fully opaque at the moment of focus, with a 2px ring;
  - windows are scrolled clear of the viewport bottom (`scroll-padding-bottom`);
  - the nav's Projects, About, Contact and Home links each land with `aria-current`.
- **Reduced motion (1440 and 390, `?loader=1`):** 10/10 sections revealed; 0 running animations, translated parts or `--depth` writes; `scroll-behavior: auto`.
- **Hero drift (H-02):** still running, 22.4px in 5s.

### What Was NOT Verified
- **Browsers other than Chromium.** Firefox and Safari were not run. The code relies on `@property`, the individual `translate` property, `mask-composite`, `:has()` and `Element.getAnimations({ subtree: true })`. All are in current Safari and Firefox, but I did not observe them there. Where `getAnimations` is missing, the settle step falls back to settling on the first reveal `animationend`.
- **Real phones.** 390 was emulated (touch, mobile viewport). The hero's 12px bleed for an iOS Safari URL bar collapsing at the top of the page is reasoned, not observed on a device.
- **Screen readers.** No VoiceOver or NVDA pass. Names and roles were checked only by axe and DOM inspection.
- **Low-end GPUs.** Not measured: the six masked cloud layers and the large hero layer are composited. The trace was unthrottled desktop Chromium; Lighthouse mobile (with CPU throttling) shows TBT 0.
- **The integrated page.** The stickman is not on this branch, so the arrivals and depth were not exercised together with the live cursor, or on `main`'s :3000.
- **The deployed site.** Lighthouse and console runs were against the local preview, not production.

### Known Issues
1. **axe `label-content-name-mismatch` (serious, 4 windows). This predates round 2.** The visible placeholder "screenshot soon" inside an empty window is not part of the contract-defined name (ADR-010: "<title>, <label>, <addressBar>"). It should clear once real screenshots replace the placeholders. Otherwise it needs a contract decision; I made no change.
2. **A first load of `/#about` lands at the top. This predates round 2.** `<main>` is hidden behind the loader at the moment the browser would scroll to the fragment, and nothing re-scrolls after the release. Fixing it would mean App or loader timing, outside these tasks; I am raising it for the manager.
3. **At 390, the wrapped Contact sentence's link tap areas overlap vertically by about 12px.** The links are 58px tall on a 46px line pitch. Each link still keeps about 46px to itself, so K-01's 44px holds. This came from the review; I made no change.
4. **`F-107-*` screenshots were captured before TASK-108.** The clouds had no depth then. They remain valid for M-01, which is about drift; depth is covered by `F-108-*`.

### Commit
`agent/frontend` at `f607e14` (implementation and evidence), followed by this handoff's docs commit, pushed to `origin/agent/frontend`.

## HANDOFF-4 — agent/frontend — 2026-10-17

### Summary
TASK-110 is built, verified on the real media, and moved to `REVIEW`. **Owner hold respected:** everything is committed locally on `agent/frontend`; nothing has been pushed or deployed.

A project window now renders `screen.video` exactly as API.md §1 and ADR-012 describe:
- **The element:** a muted, looping, `playsinline` `<video>` with `preload="none"`, `aria-hidden`, fitted with `contain` on the screen's black.
- **At rest:** its poster sits gray under the window's glass.
- **Attended** (hover, keyboard focus, or the coarse-pointer center band): it plays in color.
- **When attention leaves:** it pauses, holding its frame.
- **Never plays:** under reduced motion, off-screen, or in a hidden tab.
- **Failures:** a rejected `play()` is swallowed silently, and a video error falls back to the still poster.
- **First play:** it starts at `posterTime` (11.989s for Snake AI), so the poster flows into motion with no jump; later loops restart at 0.

Two independent reviews were run:
- **First review: "with fixes".** 2 Important findings (playing off-screen through kept keyboard focus; an untested poster picker) and 4 Minor. All are fixed, test-first.
- **Focused re-review of the fixes and `posterTime`: "Ready".** It found no Critical or Important issue, measured the poster as identical to the recording's frame at 11.989s, and listed 5 optional Minors. The four that are mine are fixed; the fifth is routed to you below.

### Tasks Completed
- **TASK-110:** W-08 (new), W-03 (amended), W-04, W-05, X-05, and the seven named tests plus the manager's `posterTime` test.
  - **W-08:**
    - **Rest:** poster gray under glass, paused (`F-110-snake-rest.png`).
    - **Attention:** plays muted and looping in color, starting from the poster frame (`F-110-snake-attention.png`, `F-110-snake-hover.gif`).
    - **Leaving:** pauses, holding its frame.
    - **Never plays:** under reduced motion, nor off-screen, including with keyboard focus kept on the window while the page scrolls.
    - **Network:** no `.mp4` request before first attention, and none at all under reduced motion.
    - **Fit:** `contain` on black.
  - **W-03:** a window only ever shows its own project's screenshot or recording; the shipped windows are checked against their content, and the data-driven W-03 tests still pass.
  - **W-04:** the real StreetSafe screenshot is darkened and gray at rest, full color on attention (`F-110-streetsafe-{rest,attention}.png`).
  - **W-05:** a filled window's name is "<title>, <label>, <addressBar>" with no "screenshot soon". axe reports 0 violations, `label-content-name-mismatch` included, at 1440, 768, 390, and 1280 at 200%.
  - **X-05:** under reduced motion the recording never plays; the poster shows, in color on attention.
  - **Named tests:** all seven, by their exact names, in `BrowserWindow.test.tsx`, plus `the first play starts at posterTime; later loops restart at 0`.

### Files Changed
`frontend/src/` only, plus evidence and status:
- **Component:** `components/BrowserWindow/BrowserWindow.{tsx,module.css,test.tsx}`.
- **Poster picker:** `components/BrowserWindow/poster.{ts,test.ts}` (new).
- **Hooks:**
  - `hooks/useVideoPlayback.{ts,test.tsx}` (new): play while wanted, pause holding the frame, the first-play seek to `posterTime`, a swallowed rejection, a guarded seek.
  - `hooks/useNearViewport.{ts,test.tsx}` (new): a latched "about to be seen" signal, for the poster.
- **Test helper:** `test-utils/media.ts`, which gains `optionsFor()` on the fake IntersectionObserver. This is the frontend's test helper, not the contract `media.ts`.
- **Evidence:** `docs/review/F-110-*`, refreshed `F-01`, `F-02`, `F-03`, `F-zoom-1280-200pct`, `F-console.txt`, `F-lighthouse-local-*`.
- **Records:** `docs/status/agent-frontend.md`; `docs/tasks/TASK-110-window-recording.md` (status only).

**Not touched by me:** content, `media-src/`, `public/`, and contract files. My 23 first-parent commits since `9c6cd40` touch only the files above; the content and media came in through your merges of TASK-305.

### Contracts
None changed; no contract change request.
- **Consumed:** `ProjectScreen.video`, `ProjectVideo.posterTime`, `getMedia`, `useAttention`, and `useDriftPlaying` (now the one "may this move" signal for the hero, the clouds and window recordings).
- **New frontend-internal interfaces:**
  - `useVideoPlayback(video, wanted, startAt?)`;
  - `useNearViewport(target, rootMargin?)`;
  - `posterUrl(media)` and `POSTER_WIDTH`.

**Choices made where the task left room:**
- **`src` sits on the `<video>` itself, not a `<source>` child,** so a 404 or a codec failure fires the video's own `error` event and the poster fallback works.
- **Poster:** the smallest WebP rendition at least 1280w, else the largest WebP, else the JPEG; never AVIF, because a poster cannot negotiate formats. It is set only once the window is within half a viewport, because a `<video poster>` cannot lazy-load the way the screenshots do.
- **Playback condition:** `attended && useDriftPlaying(video)`. Attention alone was not enough: keyboard focus survives Space or PageDown scrolling the window out of view, and the recording kept looping out of sight. That was reproduced in the browser, fixed, and re-checked.
- **First play:** seek to `posterTime`, then play. Before metadata this sets the default playback start position (HTML spec), and it is applied again on `loadedmetadata` for engines that drop it. A refused seek is swallowed, so a throw cannot escape the effect.
- **`animate` decision:** the play start and stop add no motion of their own. The window's existing glass and color transition carries the state change.

### Skills Used
| Skill | Stage invoked | What it actually changed |
|---|---|---|
| animate | Step 1, before any code | No new animation: the recording joins the window's existing filter transition (gray at rest, color on attention). A fade on play would double the glass fade. |
| superpowers:test-driven-development | Step 2, before the component code | Each named test and each hook test was watched failing first. It caught a test that could not fail: a `vi.spyOn` on `play()` marks its returned promise handled, so the rejection test uses a plain stub. |
| ecc:browser-qa | Fixture check, then real-content QA on the production build | W-08 numbers, the seamless start, network, 390 touch, keyboard, reduced motion, axe, console, full-page smoke, Lighthouse. |
| superpowers:requesting-code-review | After the fixture check; again after the review fixes and `posterTime` | First review "with fixes" (2 Important, 4 Minor); focused re-review "Ready" (0 Critical, 0 Important, 5 Minor). |
| superpowers:receiving-code-review | Before acting on each review | Reproduced the off-screen finding in the browser before fixing it; fixed one item at a time, test-first. Commits: `f1baa66`, `bb34b65`, `45811c4`, `7367805`, `e4109ff`, `1cb74eb`, `e222cc1`. |
| superpowers:verification-before-completion | Immediately before this handoff | A fresh run of everything under Verification. No implementation after it; only this handoff, the status file and the task status. |

### Verification
Fresh at `1de8413` (`agent/frontend`), immediately before this handoff:
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npx vitest run`: **51 files, 629 tests passed**.
- `npm run build`: exit 0. **JS 84.50 kB gzip, CSS 6.54 kB gzip** (budgets 110 and 25).
- `scripts/contract-test.sh`: exit 0, **193 passed**.
- `scripts/slop-check.sh`: 19 hits, the same justified exceptions as HANDOFF-3; none new.
- **Diff review:** my commits touch no contract, content, `public/` or `media-src/` file; no credentials; `.env` untracked; 0 attribution trailers; 0 em or en dashes in `dist/`.
- **Push:** not pushed (owner hold). `agent/frontend` is ahead of `origin`.

**Browser, on the real media** (production build, `vite preview` at :3101, headless Chrome 155 over CDP):
- **Seamless first play:**
  - the first playing frame is at 11.989s, and the earliest frame with picture data is 11.991–11.998s, so no frame from 0 is ever shown;
  - the poster against the recording's frame at 11.989s differs by a mean of 0.08 per channel, against 3.14 for a control frame 5s earlier;
  - the reviewer independently measured 33 differing pixels with AVFoundation.
- **W-08:**
  - poster attribute absent at the top of the page; 0 `.mp4` requests at rest;
  - hover: one request, playing, the playhead advancing from about 12s; leave: paused, holding its frame;
  - keyboard focus plays; scrolled away with focus kept, it pauses and stays paused;
  - reduced motion: attention (color) without playing, and 0 requests;
  - 390 touch: the center band plays it; leaving the band pauses it.
- **Native loop:** on a fixture with `posterTime: 2`, the first play started at 2.00s and the loop wrapped to 0.01s.
- **Forced media error** (fixture): the still poster replaces the video, `contain`, with bars in the screen's black `rgb(22, 22, 22)`; name unchanged.
- **Full-page smoke at 1440, 768, 390 and 640 (1280 at 200%):** console 0, no failed requests, CLS 0 to 0.0005, no overflow, **axe 0 violations**, 22 keyboard stops all opaque with a 2px ring, reduced motion fully static, nav jumps with `aria-current`, hero drift running.
- **Lighthouse (local preview):**
  - mobile 94 / 100 / 100 / 100 (LCP 2.4s, CLS 0, TBT 0); desktop 98 / 100 / 100 / 100;
  - the only flagged items predate this task (the hero AVIF's 5 KiB compression saving and the render-blocking CSS);
  - the poster is not loaded during Lighthouse's initial page load.
- **Loader release:** about 2.7s from navigation start in this session's runs. An A/B against the round-2 build (`698da7c`) on the same Chrome measured 2.71s for both builds, so the shift from earlier runs is environmental, not TASK-110.

### What Was NOT Verified
- **Safari (desktop or iOS) and Firefox.** Chromium only. Two things depend on engine behaviour I did not observe:
  - Whether WebKit keeps a `currentTime` set before metadata, or drops it. If it drops it, the `loadedmetadata` re-apply is what moves the playhead to `posterTime`, and no frame-accurate capture was made to rule out a one-frame flash of frame 0.
  - iOS `playsinline` and muted autoplay on a real device. React 19 sets `muted` as a property only.
- **Real phones.** 390 was touch emulation in Chrome.
- **Screen readers.** No VoiceOver or NVDA pass; names and roles were checked by axe and the DOM.
- **The integrated page on `main`, and production.** Everything ran on my branch's local preview; nothing was deployed (owner hold).

### Known Issues
1. **For you, to route to backend (from the re-review; not blocking with the shipped asset).** `frontend/scripts/video.swift` takes the poster and `posterTime` from the source `.mov` timeline and rounds `posterTime` to the nearest millisecond. The exported MP4 is re-timed to a 60 fps grid, so `posterTime` can land up to 0.5ms before the poster's frame starts.
   - With the current Snake AI asset this is invisible: the game ticks about every 50ms, and the frame shown at 11.989s is identical to the poster.
   - A future `posterSeconds` on a tick boundary would show the previous tick on first play, a one-cell jump.
   - The suggested fix is to take the poster from the written MP4 and round `posterTime` up, not to the nearest.
2. **The hover GIF's faint colored tints on black come from the 128-color GIF palette,** not the page. The PNG stills are exact.
3. **Without IntersectionObserver the recording never plays.** The poster still shows. `useDriftPlaying` needs IntersectionObserver, which every browser that plays H.264 inline has.

### Commit
`agent/frontend` at `1de8413` (implementation and evidence), followed by this handoff's docs commit. **Committed locally only, not pushed (owner hold).**
