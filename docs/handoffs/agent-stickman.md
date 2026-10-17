# Handoffs: agent-stickman

## HANDOFF-1 — agent/stickman — 2026-10-16

### Summary

The stickman slice is built end to end behind the manager's unchanged public API
(`frontend/src/stickman/index.ts`):

- **Engine and rig (TASK-201):** a pure, tested port of the approved prototype. Fed identical input
  under a virtual 60 fps clock, the production cursor reproduces the prototype **pixel for pixel at
  19 of 19 checkpoints** (walk, run with lean, point, cheer, sit).
- **Desktop cursor (TASK-202):** the real `StickmanLayer`, with:
  - live media queries;
  - a ring at the true pointer;
  - point, cheer, and sit;
  - the keyboard-focus reaction;
  - pausing while hidden;
  - no input interception.
- **Loader (TASK-203):** the wireframe-1 loader. The stickman draws a dense ball of graphite loops
  with a pencil larger than he is. At the end he drops the pencil and becomes the cursor. All timing
  runs on timers.
- **Touch walker (TASK-204):** built and demoable in the lab behind `flags.touchStickman`, which is
  still `false`.

### Tasks Completed

| Task | Criteria satisfied (evidence below) |
|---|---|
| TASK-201 | S-10 (engine TDD), S-03, S-02 (engineering parity; owner sign-off pending) |
| TASK-202 | S-01, S-04, S-05, S-06, S-07, S-08, S-09, S-10 |
| TASK-203 | L-01, L-02, L-03, L-04, L-05, L-06, L-07, S-10 |
| TASK-204 | T-01, T-02, T-03 |

### Files Changed

All files are under `frontend/src/stickman/` unless marked otherwise:

| Area | Files |
|---|---|
| Engine | `engine/{vec,motion,gestures,pose,figure}.ts` |
| Renderer | `render/drawFigure.ts` |
| Layer | `layer/{activation,targets,controller,cursorChannel,touchWalker}.ts`, `layer/StickmanLayer.tsx` (stub replaced), `layer/stickman.css` |
| Loader | `loader/{progress,scribble,follow,artist}.ts`, `loader/Loader.tsx` (stub replaced), `loader/loader.css` |
| Lab | `lab/{main,Lab}.tsx`, `lab/lab.css`, `frontend/stickman-lab.html` (dev only, not in `dist`) |
| Tests | `testing/recordingContext.ts` (test utility), plus a `*.test.ts(x)` beside every module |
| Evidence | `docs/review/F-201-*`, `F-202-*`, `F-203-*`, `F-204-*`, `docs/review/F-tools/` (reproducible parity harness) |

Untouched, as required: `index.ts`, `types.ts`, `contract.test.tsx`, `frontend/src/config/flags.ts`,
and `frontend/index.html`.

### Contracts

The public signatures in `types.ts` and `index.ts` are unchanged. Behavior notes for consumers
(frontend `App.tsx`, the manager):

1. **The Loader releases the page at finish.** It sets `<html data-loader>` to `skip`.
   - The gate's verbatim CSS, `html[data-loader='show'] body { overflow: hidden }`, otherwise
     outlives the loader. On `main` today a first-visit page cannot be wheel-scrolled: a 600px wheel
     scroll gives `scrollY` 0.
   - `loaderMode()` is read once at mount by `App`, so nothing else is affected.
   - **Manager:** please record this in API.md §2.2 "Finish".
2. **The native cursor is hidden from the first `pointermove`, not from mount.** A still pointer is
   never left blank. API.md §2.3 says the layer "adds `html.stickman-cursor`" without saying when.
   Review Focus 2 holds: the ring is hidden before the first move.
3. **Exit timing.**
   - The show-mode exit is **450ms**, not the task's ≤600ms, because `contract.test.tsx` needs
     `onDone` within 5s of mount at the 4.5s cap.
   - The fade is **250ms**. API.md says "over 300ms" and L-05 says "300ms or less"; at 300ms, timer
     latency measured 305ms.
   - The cap is 4.5s from mount *and* from navigation start (L-02), never below the 1.2s minimum.
4. **The Loader shows the native `progress` cursor** while its paper is up. The ring sits under the
   paper (`--z-stickman` is below `--z-loader`), so without this there would be no pointer at all.
5. **Slice-internal additions**, not exported from `index.ts`:
   - `layer/cursorChannel.ts`, the Loader-to-cursor handoff;
   - `createCursorController(...).configure()` and `.inspect()`;
   - `DrawOptions.mirror`.
6. **For the manager:**
   - The API.md touch row does not exclude `forced-colors`. I implemented it as written.
   - `contract.test.tsx`'s "restores the native cursor on unmount" now passes vacuously in jsdom,
     because there is no `CanvasRenderingContext2D`, so the layer stays off. Real coverage is in
     `layer/StickmanLayer.test.tsx`, which stubs the canvas. You may want to stub it in the contract
     test too.
   - `scripts/slop-check.sh` reports 10 "pure white" hits. All are `#fff` as the difference-blend
     ink of the figure and ring. It renders as the inverse of what is beneath, never as a white
     surface. Please add that line to DESIGN_BRIEF.md "Justified exceptions".

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:test-driven-development | Before each module of 201–204 (re-invoked for 203) | Every module was RED first (missing module or stub). Expected values are hand-derived. RED tests caught two real design weaknesses: a sparse scribble extent, and wandering curves that never looped. |
| ecc:frontend-design-direction | Before the lab UI (201) and the loader view (203) | Lab: a spartan tool mirroring the spike. Loader: one moving thing, and the line *is* the progress. |
| frontend-design:frontend-design | Same two stages | Token plans, reviewed against the generic default. All-caps panel labels became sentence case. The outline pill has no grey track. |
| ui-ux-pro-max:ui-ux-pro-max | Same two stages | Verified: 24px targets, transform-only ring, `aria-busy` with a progressbar, ease-in for the pencil drop. Some queries had no verified match, and I said so. |
| design-taste-frontend | Same two stages (anti-generic critique) | Conflicts resolved toward the brief: the custom cursor and Instrument Serif are the brief's own choices, and the passive scroll listener is justified. Zero em dashes. |
| ecc:motion-foundations | 201 easing review | Kept the prototype's ease rather than re-tuning it. The ring has zero lag. No animation library. |
| ecc:motion-patterns | 203 exit curve | Paper fade 450ms `cubic-bezier(0.22,1,0.36,1)`, gravity ease-in for the pencil drop, fade opacity only. |
| superpowers:systematic-debugging | Evidence harness hang (201); loader pencil geometry (203) | Root causes: a hidden headless tab blocked input for 5s (fixed with one window per page), and the drawn tip drifted off the line during turns (fixed with a continuous mirror). Each was instrumented before fixing. |
| superpowers:requesting-code-review | After 201, after 202, after 203/204 | Three independent reviews, each "with fixes" and 0 critical. Every Important item was fixed: weak thresholds and a missing pose guard (201); a blank native cursor and an unpinned state machine (202); lab replays ignoring the hero delay, and drag-scrolls counted as taps (203/204). |
| superpowers:receiving-code-review | After each review | Every item was verified before acting. All valid items were fixed and mutation-checked. Pushback (idle-redraw skip) was recorded as debt. |
| ecc:frontend-a11y | 202, **late**, as a post-implementation review | Checklist passed. Residual risk recorded: hiding the native cursor also hides an OS-enlarged accessibility cursor. |
| ecc:react-performance | 202, **late**, as a post-implementation review | Loop kept outside React, primitive `useSyncExternalStore` snapshot, bundle measured. |
| ecc:browser-qa | Before the 202 handoff; QA continued for 203 and 204 | Network, CLS, nav links, structural a11y. Verdict: SHIP WITH FIXES; the open items belong to other tasks. |
| superpowers:verification-before-completion | Immediately before this handoff's final commit | See Verification. |

### Verification

Run from the repo root on the final commit (recorded in docs/status/agent-stickman.md):

Fresh run at `642b1b4`, immediately before this commit:

- `npm test`: **17 files, 226 tests, all passed**.
- `scripts/contract-test.sh`: "no HTTP API declared… running module contract tests", **9/9**,
  against the real Loader and StickmanLayer.
- `npm run typecheck` and `npm run lint`: exit 0.
- `npm run build`:
  - `dist` holds only `index.html`, with no lab code;
  - JS **78.14 KB gzip** (budget 110), CSS **4.24 KB gzip** (budget 25);
  - **0** files in `dist` contain U+2014.
- The manager-owned files (`index.ts`, `types.ts`, `contract.test.tsx`, `flags.ts`, `index.html`)
  show an empty `git diff 3ea91a0`.
- A credentials grep over the branch diff found no secrets.
- 49 commits on the branch before this one.

Runtime, in headless system Chrome over CDP, with evidence in `docs/review/`:

**F-201 (`F-201-parity-exact.txt`):**
- Prototype vs production controller: 19/19 identical canvas hashes.
- Reproduce with `docs/review/F-tools/run-parity.sh`.

**F-202 (`F-202-results.txt`):**
- The ring is centred exactly on the pointer.
- A click 2px inside a link's edge activates it.
- `elementFromPoint` at the ring returns the page element.
- Drag-selection works.
- 0 long tasks in 5s of movement, including at 4× CPU throttle.
- Reduced motion and forced colors switch the layer off live; a coarse pointer shows nothing.
- Images: on fog, on a black window, gestures, keyboard focus, and the page at 1440, 768, and 390.

**F-203 (`F-203-results.txt` and loader images):**
- L-01: first paint is ivory (mean RGB 247.9, 248.9, 246.9 at 100ms).
- L-02: with the hero hanging, the exit begins 4502ms after navigation start and the page is usable.
- L-03: a click starts the exit in 14ms; the loader is gone 467ms later.
- L-04: a reload shows no loader.
- L-05: fade 253ms, no canvas.
- L-06: live progressbar, `<main>` inert, Tab reaches nothing.
- L-07: visible 1210ms.
- The page scrolls after finish.

**F-204 (`F-204-results.txt`, `F-204-touch-walker.webm`):**
- At 390px with touch, he walks during scroll and runs to a tap.
- A tapped link still receives its click; `elementFromPoint` returns the link.

### What Was NOT Verified

- **S-02 owner sign-off.** I only proved engineering parity (pixel-identical). The owner has not
  compared the lab with the spike. The same applies to approving the touch walker (T-03 flips only
  after that).
- **A real visible browser at 60 fps.** The interactive Chrome window was occluded (`document.hidden`,
  0 rAF/s), so all runtime evidence comes from headless Chrome. Headless timing is real; the visual
  feel on a physical trackpad and display is not verified.
- **Real touch hardware, iOS Safari, and the real safe-area inset** (headless reports 0). Touch was
  emulated.
- **Retina rendering.** Evidence ran at dpr 1, plus dpr 2 for the touch run. A DPR change mid-session
  is unit-tested only.
- **axe-core / Lighthouse:** not run; axe is not installed and I did not download it.
- **Visual regression:** no baseline exists.
- **The integrated page.** The frontend's real sections are not on this branch. Everything ran on the
  manager's unstyled skeleton and in the lab.
- **The cursor over mid-grey photo areas,** where the difference blend is weakest. S-06 covers only
  fog and black.

### Known Issues

- **The skeleton page's CLS is 0.0681** (budget 0.05). It is identical with the stickman on or off:
  a font swap under the loader cover. This is the frontend's F-03.
- **`/favicon.ico` returns 404** (TASK-303).
- **Debt (pushback, recorded):** the cursor redraws every frame even when seated. Skipping redraws
  needs epsilon tuning for a gain nobody has measured; S-09 is clean.
- **Debt:** the loader artist and the touch walker resize their canvases on `resize` but not on a DPR
  change without one; only the desktop cursor listens for that. The cost is a slightly soft line
  after moving the window between displays.
- **Loader artist resize** (review minor): resizing mid-loader clears the never-cleared scribble
  canvas, and both canvases cover the full viewport. The drawing restarts from where he is. It is
  rare inside a load of 4.5s or less.
- **Safe area** (review minor, manager/frontend): neither `index.html` nor the lab sets
  `viewport-fit=cover`, so `env(safe-area-inset-bottom)` is 0 and the walker's safe-area offset has
  no effect yet. `index.html` is frontend-owned.
- **Lab** (review minors): a replay always uses show mode, so the lab cannot preview fade mode. On
  phones the loader figure is 26px and the cursor 32px, and `handoff()` does not pass facing, so he
  can flip as the paper clears.
- An **OS-enlarged accessibility cursor** is hidden along with the native cursor. This sits within
  the brief's accepted custom-cursor exception.

### Commit

Final commit and the full log: `git log --oneline 3ea91a0..HEAD` on `agent/stickman` (46+ commits).

## HANDOFF-2 — agent/stickman — 2026-10-16

### Summary
TASK-206 (ADR-011, owner: "Make the loading screen a little bit longer"). The show-mode minimum is
now **2.2s** and the progress ramp reaches 90% at 2.2s, so the extra second is more drawing, not a
stall. Unchanged: the 4.5s cap (also from navigation start), skip, the 450ms exit, and the 250ms
fade.

### Tasks Completed
TASK-206: L-07 (round 2), with L-02, L-03, L-05, and L-06 still holding. All named tests are
present:
- `progressAt rises to ~90 at 2200ms and holds without ready`
- `with ready already resolved at mount, still waits the 2.2s minimum`
- `a skip before the minimum still exits immediately`
- `the cap is still 4500ms from mount`
- `the scribble keeps adding path between 1.2s and 2.2s` (more than 150px of new line per second)

### Files Changed
- `frontend/src/stickman/loader/progress.ts`: `MIN_MS` is now 2200; the ramp derives from it.
- `frontend/src/stickman/loader/{progress,Loader,artist,scribble}.test.ts(x)`.
- `docs/review/F-206-results.txt`, plus the loader screenshots `F-206-loader-{100,400,2000,2500,4300}ms.png` and `F-206-after-handoff.png`.

### Contracts
No interface changes. This passes the planned contract clause ("show mode with `ready` settled does
not call `onDone` before 2200ms"): with fake timers, nothing leaves before exactly 2200ms.

### Skills Used
| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:test-driven-development | Before the change | The named tests were RED on 1200 (6 failing), then GREEN after `MIN_MS = 2200`. The scribble bound checks were rewritten to one assertion per seed, so they no longer starve other tests. |
| superpowers:verification-before-completion | Immediately before this handoff | See Verification. |

### Verification
Fresh run at `edf2491`:
- `npm test`: 43 files, **530/530**. The stickman tests alone: 232/232.
- `npm run test:contract`: 162/162.
- typecheck and lint: exit 0.
- build: JS 82.40 KB gzip.
- Manager-owned files unchanged since 90f4ffb.

Browser checks in headless Chrome (`F-206-results.txt`):

| Criterion | Result |
|---|---|
| L-07, hero cached | The exit begins 2195–2196ms after the sheet appears; the sheet is on screen until about 2655ms. |
| L-02, hero hangs | The exit begins 4502ms after navigation start; the page is usable afterwards. |
| L-03, click at about 300ms | The exit begins 18ms later; the loader is gone 476ms after the click. |
| L-05 | Fade 256ms. |
| Page release | The page scrolls after finish. |

### What Was NOT Verified
- **L-07's last few ms in the browser.** Measured from when the sheet appears, the exit begins
  4–5ms before 2200. The Loader schedules on `Date.now()` (needed for fake timers) while the
  observer uses `performance.now()`, and they differ by a few ms; the load average was 18–24 during
  these runs. The unit test is exact at 2200. If the reviewer reads L-07 as "the exit must start at
  ≥ 2200ms by `performance.now()`", this is a 0.2% gap.
- **The full suite is intermittent under extreme machine load.** At a load average of 18, 2–3
  frontend-owned tests (About, Projects, Hero, PhotoSlot, useAttention) sometimes exceed vitest's 5s
  timeout. They pass in isolation (74/74 in 1.7s), and the last full runs passed 530/530. They are
  not my files; I left them alone.
- **The owner's feel for the new length.** The owner has not watched the loader yet.

### Known Issues
None new. HANDOFF-1's Known Issues still apply.

### Commit
`agent/stickman` @ the commit that adds this section (pushed).
