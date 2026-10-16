---
id: TASK-203
title: Scribbling loader with progress, timing rules, and cursor handoff
status: IN_PROGRESS
owner: stickman
branch: agent/stickman
priority: HIGH
round: 0
depends_on: [TASK-201, TASK-202]
blocked_on: ""
---

# TASK-203: Scribbling loader with progress, timing rules, and cursor handoff

## Objective

Replace the `Loader` stub with the owner's wireframe-1 loader:
- a sheet of Soft Ivory paper;
- the tiny stickman holding a pencil much larger than he is;
- a dense ball of looping graphite scribble growing from his pencil tip;
- a pill-shaped outline progress bar below it.

When it finishes, he lets go of the pencil and becomes the cursor. All timing rules are in API.md
§2.2.

## Scope

- **Modify:** `frontend/src/stickman/loader/Loader.tsx`, the stub body.
- **Create:**
  - `frontend/src/stickman/loader/progress.ts` and `.test.ts`
  - `frontend/src/stickman/loader/scribble.ts` and `.test.ts`
  - `frontend/src/stickman/loader/loader.css`
- **Modify:** the lab page, to add a "replay loader" control.
- **Do not edit:** `loader/mode.ts` semantics (contract), `index.html` (frontend-owned), or
  `contract.test.tsx` (manager).

## Interfaces

**Consumes**
- `drawFigure` with `pencil: true` (TASK-201).
- The controller's `handoff(at: Vec2)` (TASK-202).
- `LOADER_SEEN_KEY` and `loaderMode()`.

**Produces**
- `progressAt(t: number, readyAt: number | null): number` (0 to 100)
  - Ease-out rise to 90 at t = 1200ms, then hold.
  - Once `readyAt` is set, rise linearly from the current value to 100 over 250ms.
- `exitAt(o: { readyAt: number | null; skippedAt: number | null }): number` (ms from mount)
  - If `skippedAt` is set, the result is `skippedAt`.
  - Otherwise `min(4500, max(1200, readyAt + 250))`.
  - With `readyAt = null`, the result is 4500.
- `createScribble(seed: number): (t: number) => Vec2`
  - Deterministic for a seed.
  - A smooth looping path in the unit square.
  - Built from a sum of 3 to 5 sinusoids per axis with seeded frequencies and phases.
  - Never leaves `[0, 1]²`.
- Unchanged public signature: `Loader(props: LoaderProps)`.

## Acceptance Criteria

- [ ] **L-01:** first paint is the ivory loader, with no hero flash. Screenshot at about 400ms:
      `docs/review/F-203-loader.png`, showing the paper, scribble, stickman and pencil, and bar.
- [ ] **L-02:** with the hero image blocked in DevTools, it exits by 4.5s and the page works.
- [ ] **L-03:** a click or key starts the exit at once, and the exit takes 600ms or less.
- [ ] **L-04:** a reload in the same tab shows no loader; `?loader=1` forces it.
- [ ] **L-05:** in fade mode there is no scribble, and it fades in 300ms or less after `ready`.
- [ ] **L-06:** `role="progressbar"` with a live `aria-valuenow` and `aria-label="Loading"`.
      The canvas is `aria-hidden`.
- [ ] **L-07:** visible for at least 1.2s in show mode.
- [ ] **S-10:** `npm run test:contract` passes against the real Loader.
- [ ] **Tests**, written first (protocol §14):
  - `progressAt hits ~90 at 1200ms and holds without ready`
  - `progressAt reaches 100 within 250ms of ready`
  - `exitAt table`:

    | readyAt | skippedAt | Result |
    |---|---|---|
    | 100 | — | 1200 |
    | 3000 | — | 3250 |
    | null | — | 4500 |
    | — | 500 | 500 |
    | 5000 | — | 4500 |

  - `createScribble is deterministic per seed and stays inside the unit square for t ∈ [0, 10s]`
  - **Review Focus 1:** `exits through timers and calls onDone once even if requestAnimationFrame
    never fires`, and `with ready already resolved at mount, still waits the 1.2s minimum`.
    Stub rAF as a no-op and use fake timers.

## Steps

1. TDD `progress.ts`, then `scribble.ts`. Commit each.
2. Build the Loader view:
   - Draw the scribble on a **never-cleared** canvas. Each frame adds only the new segment at
     the pencil tip.
   - Get the graphite feel from several low-opacity passes: per-pass alpha
     `p = 1 − (1 − a)^(1/k)`. This is the franceszhao.ca technique in `docs/status/main.md`.
   - The stickman sits at the tip with `pencil: true`.
   - The bar is an outline pill whose fill is `--color-forest`.

   Commit.
3. Timing: the mount time, `readyAt`, skip listeners on `pointerdown` and `keydown` (capture,
   passive), the cap timer, and the exit. Drive timing with `setTimeout`, never rAF, so
   background tabs still finish. Commit.
4. Exit and handoff:
   - the pencil drops;
   - `handoff()` places the cursor stickman at his current screen position;
   - the paper clears (an opacity or clip transition of 600ms or less);
   - set `LOADER_SEEN_KEY`, remove `#boot-cover`, and call `onDone` once.

   Commit.
5. Fade mode. Commit.
6. Lab replay control, evidence, and a full-page check with `?loader=1`. Commit.

## Notes

- **Skills:** `superpowers:test-driven-development`; `ecc:motion-foundations` or
  `ecc:motion-patterns` for the exit curve; `ecc:frontend-a11y`. Before handoff:
  `ecc:browser-qa`, `superpowers:requesting-code-review`, `superpowers:verification-before-completion`.
- The highlighter yellow in the wireframe is not a palette color. The bar is graphite outline
  and forest fill.
- Do not show a percentage counter as large typography. Recon shows that is a cliché. A small
  Manrope "75%" inside or beside the pill, as in the wireframe, is fine.

## Review History

| Round | Verdict | Summary |
|---|---|---|
