# Acceptance Criteria

What "done" means for this project. The reviewer gates against this file and
against the per-task criteria in `docs/tasks/`.
- Each criterion has an ID that tasks and handoffs quote.
- Each says how to check it.
- Evidence goes in `docs/review/`, with the names from protocol §22.

**Severity.** Functional criteria can block, per protocol §11. Criteria marked
**(advisory)** are visual and never block on their own; taste disputes go to the
owner.

**Where to check.** Use the deployed preview when `PREVIEW_URL` is set.
Otherwise use `npm run dev` after `scripts/bootstrap.sh`. Force the loader with
`?loader=1`.

---

## Product

- [ ] **P-01** The primary demo flow in `docs/PRODUCT.md` completes end to end at
      1440px and at 390px. Step 7's stickman part applies only if
      `flags.touchStickman` is on.
- [ ] **P-02** After the loader ends, a tester who has never seen the site can
      open each of the four projects' primary links within 10s (stopwatch).

## Loader (stickman slice)

- [ ] **L-01** In a fresh session, the first paint is the ivory loader. No hero
      appears first: check a performance trace or the screenshots at 100ms and
      400ms. At about 400ms the screenshot shows the paper, the scribble, the
      stickman with his pencil, and the progress bar.
- [ ] **L-02** With `/media/backgrounds/*` blocked in DevTools, the loader still
      exits within 4.5s of navigation start, and the page is usable.
- [ ] **L-03** A click or a key press during the loader finishes the exit within
      600ms.
- [ ] **L-04** A reload in the same tab shows no loader and no flash
      (`html[data-loader="skip"]`). A new session, or `?loader=1`, shows it again.
- [ ] **L-05** Under `prefers-reduced-motion: reduce` there is no scribble. The
      ivory sheet fades out in 300ms or less once the hero has decoded.
- [ ] **L-06** While the loader is up, Tab cannot reach any page link, because
      `<main inert>`. The sheet exposes `role="progressbar"` and its
      `aria-valuenow` changes.
- [ ] **L-07** In `show` mode the loader is visible for at least 1.2s.

## Stickman cursor (stickman slice; desktop, fine pointer)

- [ ] **S-01** The native cursor is hidden across the page, and an 11px ring sits
      exactly at the pointer. Clicking 2px inside the edge of a nav link
      activates it.
- [ ] **S-02 (advisory, owner sign-off)** Side by side with
      `docs/reference/stickman-cursor-spike.html` at 32px, "hurries when far", and
      ring, the owner cannot tell the walk, run, lean, facing, point, cheer, and
      sit apart. Record the owner's words in the review.
- [ ] **S-03** On an 800px pointer jump he runs, with a visible lean, and arrives
      in about 1.2s or less. On a 50px move he walks.
- [ ] **S-04** Resting on a link, he points at it. Pressing a link makes him hop
      and cheer for about 0.7s. After 5s with no movement he sits.
- [ ] **S-05** Tabbing to a link with the keyboard makes him walk to it and point.
- [ ] **S-06** He is clearly visible both over light fog and over a dark project
      window. Provide a screenshot of each.
- [ ] **S-07** Under reduced motion, under `forced-colors: active`, or on a coarse
      pointer with the flag off, there is no stickman. The native cursor shows and
      `html` has no `stickman-cursor` class.
- [ ] **S-08** The stickman layer never intercepts input:
      `document.elementFromPoint` at the ring position returns the page element,
      never the canvas. Text selection still works.
- [ ] **S-09** A performance trace of 5s of continuous pointer movement shows no
      long task over 50ms attributable to the stickman. His loop pauses while the
      tab is hidden.
- [ ] **S-10** `npm run test:contract` passes. It includes
      `src/stickman/contract.test.tsx` and the speed-law and state-machine tests
      written TDD-first.

## Touch walker (stickman slice; behind `flags.touchStickman`)

- [ ] **T-01** With the flag `false`, a coarse pointer shows no stickman and every
      tap behaves natively.
- [ ] **T-02** In `/stickman-lab.html` with the touch toggle on, in 390px touch
      emulation:
      - he stands on the bottom edge, above `env(safe-area-inset-bottom)`;
      - he walks while the page scrolls;
      - he runs to the x of a tap;
      - he never blocks a tap.
- [ ] **T-03** The flag flips to `true` only after the owner's approval is
      recorded in `docs/status/main.md`.

## Hero (frontend)

- [ ] **H-01** At 1440 the hero matches wireframe-1's structure:
      - nav centered at the top;
      - "Emanuel Ling" top left, with computed `font-family` Instrument Serif;
      - "CS + Math @ Pomona College" below it;
      - the LinkedIn · Email · GitHub row;
      - the alpine photograph filling the frame.
- [ ] **H-02** The fog drifts visibly over 10s. It pauses when the hero is off
      screen or the tab is hidden, and it is still under reduced motion.
- [ ] **H-03** Each nav link scrolls to its section. The section in view is marked
      with `aria-current` and Deep Forest styling.

## Projects (frontend)

- [ ] **W-01** Four windows appear in the approved order (SagePlan, StreetSafe:
      LA, Revelation Youth, Snake AI), alternating sides at ≥1024px. Each shows:
      - the number "0N";
      - the italic title;
      - the exact sentence from content;
      - the meta line;
      - its primary and secondary links.
- [ ] **W-02** At rest the window body is near-black and the traffic lights are
      gray. On hover or keyboard focus:
      - the lights color in;
      - the URL brightens;
      - one elevation shadow appears;
      - the screen lifts out of black.

      Provide paired screenshots, `-rest` and `-attention`.
- [ ] **W-03** Every v1 window shows the empty state: a flat fog-tone screen with
      "screenshot soon". **No photograph appears inside any window.**
- [ ] **W-04** A component test with a fixture image shows that the rest state
      is darkened or desaturated, and the attention state is full color.
- [ ] **W-05** Activating a window opens `primary.href` in a new tab with
      `rel="noopener noreferrer"`. Its accessible name is "<title>, <label>".
- [ ] **W-06** The address field shows exactly `project.addressBar`.
- [ ] **W-07** At 390 with touch emulation, a window in the viewport's middle band
      shows the attention state, and reverts when it leaves the band.

## About (frontend)

- [ ] **A-01** About shows:
      - the description;
      - "This semester" with Linear Algebra and Data Structures and Algorithms;
      - five photo slots at 4:3, 2:3, 4:3, 9:16, and 4:3, in a loose, overlapping
        scatter that echoes wireframe-3. **Not a grid.**
- [ ] **A-02** Empty slots are mist-tone panels. No placeholder words appear, and
      no caption text appears when the caption is `null`.
- [ ] **A-03** A component test with a fixture image shows grayscale and low
      contrast at rest, and full color on attention.

## Connect (frontend)

- [ ] **K-01** LinkedIn, Email, and GitHub appear with the exact hrefs from
      `contact.ts`. Email is `mailto:emanuelling27@gmail.com`.

## Responsive (frontend)

- [ ] **R-01** Screenshots exist at 1440, 768, and 390, and no width scrolls
      horizontally (`scrollWidth <= innerWidth`).
- [ ] **R-02** At 390 the layout is designed, not shrunk:
      - each project stacks as window, then caption;
      - the name fits within two lines;
      - the collage reflows to a phone arrangement;
      - every tap target is at least 44px tall.
- [ ] **R-03** At 390 all four nav items are reachable without horizontal scroll.

## Accessibility (all)

- [ ] **X-01** Lighthouse Accessibility is at least 95, and axe reports zero
      critical violations.
- [ ] **X-02** Contrast is at least 4.5:1 for body text and 3:1 for text 24px and
      larger, measured against the actual background, including over the photos.
- [ ] **X-03** Every interactive element has a visible 2px Deep Forest focus ring,
      and Tab order follows visual order.
- [ ] **X-04** There is one `h1`, and the section headings are `h2`. Decorative
      images are `alt=""` or CSS. The stickman canvas and ring are `aria-hidden`.
- [ ] **X-05** Under reduced motion there is no fog drift, no reveal motion, no
      loader animation, and no stickman. All content is still present.

## Design (advisory, except where noted)

- [ ] **D-01** The reviewer answers the primary test in
      `docs/DESIGN_CONSTRAINTS.md` §1 with "no", giving reasons tied to the brief's
      reference points.
- [ ] **D-02** The signature element is present and visible: the stickman cursor,
      from the first second after the loader, on desktop.
- [ ] **D-03** Deep Forest is the only interface hue. Every `scripts/slop-check.sh`
      hit is either removed or listed under "Justified exceptions" in
      `docs/DESIGN_BRIEF.md`.
- [ ] **D-04** The computed fonts are Instrument Serif and Manrope only.
- [ ] **D-05 (functional)** No em dash appears in interface copy. Grep `dist/` for
      U+2014; it must be absent outside sourcemaps.

## Content, media, and build (backend)

- [ ] **B-01** `npm run test:contract` passes, including C-01 through C-21 from
      `docs/DATABASE.md`.
- [ ] **B-02** `npm run media` is deterministic:
      - a second run leaves `git status` clean;
      - adding a fixture image produces AVIF, WebP, and JPEG at the contracted
        widths, plus a manifest entry;
      - deleting it removes them.
- [ ] **B-03** The built `dist/index.html` has:
      - the title and meta description;
      - Open Graph and Twitter tags;
      - favicon links;
      - a `theme-color`;
      - one valid JSON-LD Person block.
- [ ] **B-04** `/favicon.svg`, `/og.jpg` (1200×630), `/robots.txt`, and
      `/sitemap.xml` return 200 on the preview.
- [ ] **B-05** The preview sends security headers:
      - a CSP with no `unsafe-eval`, allowing the gate script by hash;
      - `X-Content-Type-Options: nosniff`;
      - `Referrer-Policy`;
      - `frame-ancestors 'none'`.

      `/assets/*` and `/media/*` are served `immutable`.

## Performance (all)

- [ ] **F-01** Mobile Lighthouse on the preview scores Performance ≥ 90,
      Accessibility ≥ 95, Best Practices ≥ 95, and SEO ≥ 95. Save the report in
      `docs/review/`.
- [ ] **F-02** In the `vite build` output, initial JS is at most 110 KB gzip and
      CSS at most 25 KB gzip.
- [ ] **F-03** CLS is at most 0.05.

## Integration and demo

- [ ] **I-01** A clean clone, then `scripts/bootstrap.sh`, then `npm run dev`
      serves on `FRONTEND_PORT` with no manual steps.
- [ ] **I-02** The browser console has no errors or warnings during the primary
      flow (`docs/review/R-console.txt`).
- [ ] **I-03** CI is green on `main`.
- [ ] **I-04** The preview URL is recorded in `docs/ARCHITECTURE.md` and as
      `PREVIEW_URL`.
- [ ] **I-05** A recording of the working demo exists in `docs/review/`.

Content is static and always present, so there is no seed step (ADR-001).
