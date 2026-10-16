---
id: TASK-101
title: Design system, page shell, nav, and fog-clear reveal
status: IN_PROGRESS
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: []
blocked_on: ""
---

# TASK-101: Design system, page shell, nav, and fog-clear reveal

## Objective

Turn the scaffold's unstyled walking skeleton into the page's real foundation:
- design tokens and typography from `docs/DESIGN_BRIEF.md`;
- the four sections with their backgrounds;
- the centered nav with an active-section state;
- the fog-clear scroll reveal;
- reduced-motion and focus behavior that every later task inherits.

Section *contents* stay as the skeleton's plain markup. Later tasks replace them.

## Scope

- **Modify:**
  - `frontend/src/styles/tokens.css`: add the design tokens. Keep the three `--z-*` contract lines
    unchanged.
  - `frontend/src/styles/global.css`
  - `frontend/src/main.tsx`: import Latin-only font CSS files.
  - `frontend/src/app/App.tsx`: compose Nav and Section. Keep the mount contract (API.md §2.5).
- **Create:**
  - `frontend/src/hooks/usePrefersReducedMotion.ts` and `.test.ts`
  - `frontend/src/hooks/useFogReveal.ts` and `.test.tsx`
  - `frontend/src/hooks/useActiveSection.ts` and `.test.tsx`
  - `frontend/src/components/Nav/{Nav.tsx,Nav.module.css,Nav.test.tsx}`
  - `frontend/src/components/Section/{Section.tsx,Section.module.css}`

## Interfaces

**Consumes**
- From `src/content`: `site.nav: readonly NavItem[]`, `SectionId`, `getMedia`, `site.sectionsImage`.

**Produces**, for TASK-102 to 106:
- `usePrefersReducedMotion(): boolean`. Live; re-renders on change.
- `useFogReveal<T extends HTMLElement>(): { ref: (el: T | null) => void; revealed: boolean }`.
  - It sets `data-revealed="true"` on the element the first time 15% of it is in view. It never
    un-reveals.
  - Under reduced motion it is revealed immediately.
- `useActiveSection(ids: readonly SectionId[]): SectionId`. The section whose box contains the
  viewport's vertical center. Defaults to `'home'`.
- `<Nav items={readonly NavItem[]} active={SectionId} />`
  - Renders `<nav aria-label="Sections">`.
  - The active link has `aria-current="true"`.
- `<Section id={SectionId} heading?: string backdrop?: 'evergreen' | 'none'>{children}</Section>`
  - Renders `<section id>` with an `h2` when `heading` is given.
  - `backdrop="evergreen"` paints `site.sectionsImage` dissolving into Mist. The backdrop is
    decorative, so it has `alt=""` or is a CSS background.
- **CSS custom properties.** Names are fixed here; values follow the brief:
  - colors: `--color-mist`, `--color-ivory`, `--color-ink`, `--color-ink-2`, `--color-forest`,
    `--color-screen-off`, `--color-chrome`, `--color-light-red`, `--color-light-yellow`,
    `--color-light-green`;
  - fonts: `--font-display`, `--font-text`;
  - spacing and type: `--space-1` … `--space-9`, a fluid type scale `--step--1` … `--step-6`;
  - shape and motion: `--radius-window`, `--ease-out`, `--dur-reveal` (0.9s), `--dur-attend`
    (0.7s).
- The global focus ring: 2px `--color-forest`, offset 3px, on `:focus-visible`.

## Acceptance Criteria

- [ ] **H-03:** nav links scroll to their sections, and the section in view gets
      `aria-current` and Deep Forest styling.
- [ ] **R-03:** at 390px all four nav items are reachable without horizontal scroll.
- [ ] **X-03:** focus ring present on every interactive element.
- [ ] **X-04:** one `h1` (the hero name), with section headings as `h2`.
- [ ] **X-05**, for what exists so far: reduced motion disables the reveal transition, and
      content is still visible.
- [ ] **D-03, D-04:** tokens use only the brief's palette, and the computed fonts are Instrument
      Serif and Manrope only. `scripts/slop-check.sh frontend` hits are each removed or justified
      in the brief.
- [ ] Unit tests below pass. `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`
      are green.

## Steps

1. **Design pipeline.** Invoke, in order:
   - `ecc:frontend-design-direction`
   - `frontend-design:frontend-design`
   - `ui-ux-pro-max:ui-ux-pro-max`
   - `design-taste-frontend` (as the anti-generic critique)

   Record each in `docs/status/agent-frontend.md`. Then write the type scale, spacing rhythm,
   radius logic, and motion tokens into `tokens.css`.
2. **TDD `usePrefersReducedMotion`.**
   - Test name: `returns true when (prefers-reduced-motion: reduce) matches and updates on change`.
   - Mock `matchMedia`, flip `matches`, and fire the listener.
3. **TDD `useFogReveal`.**
   - Test: `marks revealed once the element intersects at 15%` (mock IntersectionObserver).
   - Test: `is revealed immediately under reduced motion`.
   - Test: `never un-reveals`.
4. **TDD `useActiveSection`.**
   - Test: `returns the id whose rect contains innerHeight/2` (stub `getBoundingClientRect`).
   - Test: `defaults to home`.
5. **Build Nav and Section.**
   - Nav test: `marks exactly one link aria-current` and `renders labels in site.nav order`.
6. **Write the CSS.**
   - Implement the reveal in CSS: `[data-revealed]` moves from blur(6px) and opacity 0 to clear
     over `--dur-reveal`. The filter is removed after settling, and siblings stagger by at most
     0.06s.
   - Under `prefers-reduced-motion: reduce`, there is no transition.
7. **Run the app and capture evidence.** Run `scripts/bootstrap.sh && source .env && npm run dev`.
   Check at 1440, 768, and 390. Save `docs/review/F-101-desktop-1440.png`, `-tablet-768.png`, and
   `-mobile-390.png`.
8. **Commit after each step that leaves the branch green.** Example messages:
   - `feat: add design tokens and type scale`
   - `feat: add fog-clear reveal hook`

## Notes

- **Skills during implementation:** `vercel:react-best-practices`, `ecc:react-patterns`,
  `ecc:vite-patterns`, `ecc:frontend-a11y`.
- **Before handoff:** `ecc:browser-qa`, `superpowers:requesting-code-review`, then
  `superpowers:verification-before-completion`.
- Self-host fonts with Latin subsets only:
  - `@fontsource/instrument-serif/latin-400.css`
  - `@fontsource/instrument-serif/latin-400-italic.css`
  - `@fontsource-variable/manrope/wght.css`, or that package's Latin file

  Preload the hero name's woff2 if the build exposes a stable URL. Otherwise rely on
  `font-display: swap`.
- Never declare `cursor: none`, and never style `.stickman-*` (API.md §2.6).

## Review History

| Round | Verdict | Summary |
|---|---|---|
