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
