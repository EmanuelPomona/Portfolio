---
id: TASK-103
title: Attention system and the dark macOS BrowserWindow
status: REVIEW
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-102]
blocked_on: ""
---

# TASK-103: Attention system and the dark macOS BrowserWindow

## Objective

Implement the site's supporting principle, "color is earned by attention", as one reusable hook.
Then build the project window that uses it.
- The window is black until it is hovered, focused, or (on touch) in the middle band of the
  viewport.
- On attention it comes to life:
  - the traffic lights color in;
  - the URL brightens;
  - one elevation shadow appears;
  - the screen lifts from black.
- With no screenshot, its screen is near-black at rest reading "screenshot soon", and lifts to the
  flat fog-tone panel on attention (ADR-010).

## Scope

- **Create:**
  - `frontend/src/lib/centerBand.ts` and `.test.ts`
  - `frontend/src/hooks/useAttention.ts` and `.test.tsx`
  - `frontend/src/components/BrowserWindow/{BrowserWindow.tsx,BrowserWindow.module.css,BrowserWindow.test.tsx}`

## Interfaces

**Consumes**
- `Project` (from `src/content`); `getMedia`.
- `Picture` (TASK-102).
- `usePrefersReducedMotion` (TASK-101).

**Produces**
- `inCenterBand(rect: { top: number; bottom: number }, viewportHeight: number, band = 0.4): boolean`
  - True when the element's vertical midpoint lies within
    `[(1 - band) / 2 × vh, (1 + band) / 2 × vh]`.
- `useAttention<T extends HTMLElement>(): { ref: (el: T | null) => void; attended: boolean }`
  - `attended` is true when any of these holds:
    - hover, on fine pointers;
    - `:focus-visible` within;
    - coarse pointer and `inCenterBand` (checked on scroll, throttled to rAF).
  - It mirrors the value as `data-attended="true|false"` on the element.
- `<BrowserWindow project={Project} sizes={string} />`
  - The whole window is one `<a href={primary.href} target="_blank" rel="noopener noreferrer">`
    with `aria-label={`${title}, ${primary.label}`}`.
  - It shows chrome (three lights, an address field rendering `project.addressBar` verbatim)
    and a screen at a fixed 16:10 ratio.
  - It sets `data-state="rest" | "attention"`.
  - The screen is either `Picture`, with `object-fit: cover`, or the empty state.
  - An image `onError` falls back to the empty state.

## Acceptance Criteria

- [ ] **W-02:** rest and attention visuals, with paired screenshots
      `docs/review/F-103-window-rest.png` and `F-103-window-attention.png`.
- [ ] **W-03:** v1 windows show the empty state (black at rest, fog panel on attention), and no
      photograph ever appears inside a window.
- [ ] **W-04:** a fixture test with `screen.image = 'backgrounds/evergreen-forest'`, which is a
      test fixture only and never shipped content. It asserts the `<img>` is present, and that
      `data-state` toggles between rest and attention on hover and on focus.
- [ ] **W-05:** the accessible name is "<title>, <label>, <addressBar>" (ADR-010), with new tab
      and `rel="noopener noreferrer"`, and axe reports no `label-content-name-mismatch`.
- [ ] **W-06:** the address field shows exactly `project.addressBar`.
- [ ] **W-07:** at 390 with touch emulation, the window in the middle band is attended and
      reverts when it leaves.
- [ ] **S-06** (support): the window's black body is a surface the stickman must stay visible
      on. Capture a screenshot with the stickman stub replaced if the stickman branch has been
      integrated; otherwise note it under What Was NOT Verified.
- [ ] **Review Focus 5:** test `a non-16:10 screenshot is cropped with object-fit cover inside
      the 16:10 screen`. Assert the computed `aspect-ratio` on the screen and the
      `object-fit` class.

## Steps

1. **TDD `inCenterBand`**, with this table:

   | Case | Rect | vh | band | Expected |
   |---|---|---|---|---|
   | midpoint at center | `{top: 300, bottom: 500}` | 800 | default | true |
   | midpoint at 100 | `{top: 0, bottom: 200}` | 800 | default | false |
   | midpoint at 560 | `{top: 520, bottom: 600}` | 800 | default | true |
   | midpoint at 600 | `{top: 560, bottom: 640}` | 800 | default | false |

   The band is [240, 560].
2. **TDD `useAttention`.**
   - Test: `hover sets attended on fine pointer`.
   - Test: `focus-visible within sets attended`.
   - Test: `coarse pointer uses center band on scroll`.
   - Test: `reduced motion still reports attended`. The visual transition is CSS, so motion
     preference must not hide the information.
3. **TDD BrowserWindow**, with the tests named in the Acceptance Criteria. Then the CSS:
   - the chrome follows the stock dark macOS reference in the brief;
   - the lights are `--color-chrome` gray at rest and `--color-light-*` on attention;
   - the shadow appears only on attention, as the brief's justified exception;
   - the transition uses `--dur-attend`, with none under reduced motion.
4. **Optional nice-to-have,** only if everything above is verified: a cursor-local "wipe the fog
   off the glass" reveal before full attention, using a radial alpha mask at the pointer. See
   the snippet in `docs/status/main.md` (7sadakonr recon).
5. **Capture evidence and commit per step.**

## Notes

- The window is a link, so the stickman's default target rule covers it. It points at the
  window and cheers on press, with no extra attributes needed.
- **Skills:** `ecc:frontend-a11y`; `ecc:make-interfaces-feel-better` after the structure is
  right.

## Integration notes

- **Round 1 (manager):** the frontend's contract change request was approved as ADR-010. The
  manager implemented the one-line name change on `main` at `57e1041`, with the W-05 test
  updated first and a new label-in-name test over every shipped window. W-03 was confirmed as
  built: black at rest, fog panel on attention. The task returns to `REVIEW`.

## Review History

| Round | Verdict | Summary |
|---|---|---|
