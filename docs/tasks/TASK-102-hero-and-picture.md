---
id: TASK-102
title: Hero section and responsive Picture component
status: IN_PROGRESS
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-101]
blocked_on: ""
---

# TASK-102: Hero section and responsive Picture component

## Objective

Build the hero from wireframe-1:
- the alpine photograph, full-bleed;
- the centered nav from TASK-101;
- "Emanuel Ling" in Instrument Serif at the top left;
- "CS + Math @ Pomona College" below it;
- the small LinkedIn · Email · GitHub row;
- a slow fog drift, the owner's "moving thingy".

Build the `Picture` component every image on the page uses, and feed the loader the hero's real
decode promise.

## Scope

- **Create:**
  - `frontend/src/components/Picture/{Picture.tsx,Picture.module.css,Picture.test.tsx}`
  - `frontend/src/sections/Hero/{Hero.tsx,Hero.module.css,Hero.test.tsx}`
- **Modify:** `frontend/src/app/App.tsx`, for the hero and `heroReady` wiring only.

## Interfaces

**Consumes**
- `site.name`, `site.tagline`, `site.heroLinks`, `site.heroImage`.
- `getMedia(id): MediaAsset` (API.md §3).
- TASK-101 tokens and `usePrefersReducedMotion`.

**Produces**
- `<Picture media={MediaAsset} alt={string} sizes={string} priority?={boolean} className?={string} onDecode?={(p: Promise<void>) => void} />`
  - Renders the `<picture>` structure in API.md §3: one `<source>` per `media.sources` entry,
    in order, then an `<img>` with `src`, `srcset`, `sizes`, `width`, `height`, and a
    `background-color: placeholder`.
  - `priority` means `loading="eager"` and `fetchpriority="high"`. Otherwise
    `loading="lazy"` and `decoding="async"`.
  - It calls `onDecode` once with the `<img>`'s `decode()` promise.
- `<Hero site={Site} onHeroDecode={(p: Promise<void>) => void} />`
- **The mount contract stays intact:** `App` passes the Loader a `ready` promise that settles
  when the hero `<img>` actually decodes (API.md §2.5 rule 4). Use a deferred promise created
  once, resolved or rejected from `onHeroDecode`.

## Acceptance Criteria

- [ ] **H-01:** the hero at 1440 matches wireframe-1's structure, with the computed name font
      Instrument Serif.
- [ ] **H-02:** the fog drift is visible over 10s.
  - One cycle takes 60s or more.
  - It is transform or opacity only.
  - It pauses when the hero is out of view (IntersectionObserver) or `document.hidden`.
  - It does not run under reduced motion.
- [ ] **R-02**, for the hero: at 390 the name fits within two lines, and the links row is
      reachable with 44px tap targets.
- [ ] **F-03:** no layout shift from the hero image or the fonts. Use `width`, `height`, and the
      placeholder color.
- [ ] **Picture tests:**
  - `renders a source per media.sources entry in order`
  - `sets width/height/placeholder from the asset`
  - `priority sets eager + fetchpriority=high`
  - `default is lazy + async`
  - `calls onDecode once`
- [ ] **Hero test:** `renders name as the only h1, tagline, and heroLinks hrefs in order`.

## Steps

1. Write the Picture tests, see them fail, implement, and see them pass. Commit
   `feat: add Picture component`.
2. Write the Hero test, then implement the Hero markup and CSS.
   - The photo dissolves into Mist at its edges with alpha masks only, as the brief's
     justified exception allows.
   - Text contrast over the photo must pass **X-02**. Measure over the actual pixels behind the
     name and the links.
3. **Fog drift.** One layer that drifts slowly:
   - a translated and mirrored copy of the hero photo, masked to its fog bands;
   - or a CSS-only soft mask moving across.

   Do not add new image files. Run `scripts/slop-check.sh`. A gradient used as a mask is
   justified in the brief; a color gradient is not.
4. **Wire `onHeroDecode`.** In the browser, check that `?loader=1` still exits after the hero
   paints (contract stub).
5. **Capture evidence.** `docs/review/F-102-hero-{1440,768,390}.png`.
6. **Commit per step.**

## Notes

- **Skills:** the design pipeline from TASK-101 applies if you substantially change the visual
  system. `ecc:react-performance` applies for the LCP image.
- `sizes` for the hero is `100vw`.
- The scaffold manifest has a JPEG fallback only. After TASK-302 merges, `sources` gains AVIF
  and WebP with no change to your code.

## Review History

| Round | Verdict | Summary |
|---|---|---|
