# Design Brief

Written by the manager before frontend work begins. It gives frontend the design
*problem* for this product.

**Sources**
- The owner's approved intent: `docs/superpowers/specs/2026-10-16-portfolio-design.md`.
- The stickman's tuned behavior: `docs/reference/stickman-cursor-spike.html`. Open
  it in a browser.
- The owner's hand-drawn wireframes, the strongest input of all:
  `docs/reference/wireframes/`.

---

## Target audience

1. **The screener.** An internship recruiter or engineer, at a laptop between
   résumés, or in the LinkedIn in-app browser on a phone. Mildly bored, skimming,
   and generous with about 45 seconds. They will not hunt for anything and will
   not wait for anything. They do notice craft, and they remember the one
   candidate whose site did something.
2. **The friend.** A classmate, teammate, or church member who lingers, plays
   with the stickman, and hovers every photo.

Design for the screener first. Reward the friend second.

## Primary interface job

Get a skimming visitor from Emanuel's name to his four real projects, with
working links, in one scroll. Meanwhile, the stickman makes the visit
unmistakably his.

## Reference points

1. **Ansel Adams' Yosemite prints, and the photo book that holds them.**
   Emanuel's own collage includes Tunnel View, so this is not an arbitrary pick.
   - *Borrow:* a full tonal range of grays, and photographs treated as plates with
     generous margins and small captions set beneath.
   - *Borrow:* color as the exception that has to earn its place.
   - The project windows and life photos are plates. The fog is the matte.
2. **micahhoang.com.**
   - *Borrow:* deep forest-green ink carrying an entire typographic system on a
     pale ground.
   - *Borrow:* hairline 1px rules.
   - *Borrow:* numbering in the form `01 / SagePlan`.
   - *Borrow:* the confidence to leave a viewport mostly empty.
   - *Do not borrow:* his 2-column card grid.
3. **xkcd, for the stickman only.**
   - *Borrow:* uniform-weight, round-capped pencil line.
   - *Borrow:* a head that is a plain circle, with no face.
   - *Borrow:* a gesture vocabulary of a few poses (walk, point, cheer, sit) that
     carries all the humor.
   - He is a line drawing, never a mascot sticker.

Structural precedent, not visual: 7sadakonr.xyz/project alternates a dark device
frame with a numbered text column. That is the skeleton of the owner's Projects
wireframe. Take the layout and none of its glow, gradients, or sparkles.

## Desired character

| Adjective | Consequence for the interface |
|---|---|
| Quiet | One serif voice. Most of every viewport is fog. Apart from the stickman, the only ambient motion is the fog itself drifting: in the hero, and (since round 2, owner request) through the sections behind the plates. It is slow enough to notice only when you stop reading. |
| Hand-made | The only drawn marks are graphite line art: the stickman, the scribble, the ring. No icon library. If an arrow is needed, it is a typed glyph (↗). |
| Honest | Real URLs in the address bars. Real numbers from the READMEs. Empty slots say "screenshot soon" plainly. |
| Cold, alpine | Neutral-to-cool grays from the photographs. Deep Forest is the only hue the interface itself uses. |
| Playful, in small doses | The stickman's reactions are the only jokes. Copy stays plain and specific. |

## Anti-character

This must never feel like any of the following.

- **A developer-portfolio template:**
  - pill CTAs, cards, frosted glass, glow, gradient text;
  - tech-logo walls or skill bars;
  - "Hi, I'm Emanuel", "Currently / Previously", or "Let's build something
    together".
- **The previous attempt:** Inter, Playfair, glass cards, a typing effect, or
  "scroll to explore".
- **A cute mascot site:** no face on the stickman, no speech bubbles, no bounce on
  everything.
- **A hacker terminal:** no monospace-on-black, no green glow.
- **A wedding invitation:** no script faces, no ornaments, no Cormorant set at
  body size.

## Typography

**Display face: Instrument Serif** (regular and italic). The owner's first choice.

**Text face: Manrope** (variable, about 400–600).

**Why these, for this product**

- **Instrument Serif:**
  - It is narrow, high-contrast, and slightly eccentric, so it reads like the
    title page of a photography book (reference 1) rather than a startup.
  - It has only one weight, so hierarchy has to come from size, spacing, and
    italics. That enforces the quiet character.
  - Use italic for titles of works (project names), the way a book sets plate
    titles.
- **Manrope:**
  - Its open apertures stay legible at 13–16px over a busy fog photograph.
  - Its slightly geometric construction carries the "CS + Math" register without
    a monospace face.
- **Cormorant Garamond is rejected for this build.** At text sizes over mist it is
  too thin to pass contrast, and two serifs would blur the hierarchy.
- **No third family.** Metadata uses Manrope: uppercase, letter-spacing about
  0.08em, `font-variant-numeric: tabular-nums`.

**Starting points.** Frontend tunes these.
- **Name:** about 96–128px desktop, 56–64px mobile; letter-spacing -0.02 to
  -0.03em; line-height about 0.9.
- **Section titles:** about 56–72px.
- **Project titles:** italic, about 40–56px.
- **Body:** 16–17px, line-height about 1.6.
- **Meta:** 12–13px.

**Loading.** Self-host both faces through the `@fontsource` packages already in
`frontend/package.json`, using Latin subsets and `font-display: swap`. Preload the
Instrument Serif regular file used by the hero name.

## Palette

Every color has one job. The photographs supply all other tonality.

| Role | Color | Why |
|---|---|---|
| canvas (air) | Mist Gray `#E3E8E5` and the photographs | The fog everything sits in. Section backgrounds are photos dissolving into this tone. |
| paper | Soft Ivory `#F8F9F7` | The loader's sheet of paper, and lifted text plates where a photo would fail contrast. Never a full-page canvas. |
| primary text and graphite | Dark Charcoal `#242424` | All text, the stickman, the scribble, the ring. Hairlines are this color at reduced alpha. |
| secondary text | `#4F5552` (charcoal toward mist) | Meta lines, captions, URL text. Must pass 4.5:1 on Mist Gray. Frontend verifies, and adjusts the hex if it does not. |
| accent and action (evergreen) | Deep Forest `#0F2E24` | The only interface hue: link underline on hover and focus, focus ring, active nav item, loader progress fill. |
| screen off | `#161616` body and `#242424` chrome | Project windows at rest. "Black until you hover", in the owner's words. |
| life | The screenshots and photos themselves | The only full color on the page. It appears only on attention: hover, focus, or the touch center band. |
| traffic lights | `#FF5F57` / `#FEBC2E` / `#28C840` | Literal macOS chrome. Gray at rest; they color in as part of a window coming alive. |
| warning / error | Dark Charcoal text on Soft Ivory | The only failure state on a static site is a missing or broken image. It falls back to the empty-slot treatment with plain wording. No red. |

## Information density

**Sparse.** There are four projects, two classes, and five photos. Each viewport
holds one idea.

The projects section should feel like turning pages in a plate book: about one
window and its caption per screen height on desktop.

## Content hierarchy

1. **Who:** "Emanuel Ling", then "CS + Math @ Pomona College", then a small
   LinkedIn · Email · GitHub row. The stickman is noticed within a second because
   he moves with the hand.
2. **What he built:** each project's italic title, then its one sentence, then its
   meta line and its live and code links. The window is the plate; the sentence is
   the caption.
3. **Who he is beyond code:** the brief description, the classes, the photos.
4. **How to reach him:** LinkedIn, Email, GitHub, repeated at the end.

The nav (Home / Projects / About / Contact) is always reachable but visually
subordinate. It is small Manrope, centered, as in the owner's wireframe.

## Signature element

**The stickman is the cursor.** He is a pencil-line figure the visitor drives
around the page.
- He walks to the ring and hurries when it is far away.
- He points at what you rest on, cheers when you click, and sits down when you
  stop.
- He first appears scribbling the loader's loops with his pencil, so he has
  literally drawn the site.

This could not appear on another site:
- It came from the owner's own notes, his reference photo of a stickman on a
  rock, and his wireframe.
- It is tuned to the owner's verdict: 32px, ring, "hurries when far".
- It is set against his alpine fog.

**Supporting principle, which is not the signature: color is earned by
attention.** Everything is monochrome fog until the visitor attends to a project
window or a photo. On touch devices, "attends" means the item sits in the middle
band of the viewport.

## The owner's wireframes

The images are in `docs/reference/wireframes/`. They are binding for **structure
and order**; exact geometry is the builder's.

| File | What it shows |
|---|---|
| `wireframe-1-loader-and-hero.jpg`, loader | A blank sheet. In the middle, a dense ball of looping pencil scribble. At the end of the line, a tiny stickman holding a pencil much larger than he is. Below the scribble, a pill-shaped outline progress bar labeled "75% …". (The yellow is the owner's highlighter, not a palette color.) |
| `wireframe-1-loader-and-hero.jpg`, hero | Full-bleed misty alpine photograph. The nav is centered at the top and underlined: Home, Projects, About, Contact. Top left: "Emanuel Ling", and below it "CS + Math @ Pomona College". The mountains fill the right two-thirds. |
| `wireframe-2-projects.jpg` | Background of fog with pine clusters. "Projects" heading top left. Three framed screens alternate sides down the page (left, right, left), each with its title large on the opposite side: SagePlan, StreetSafe, Snake-AI. Build all four projects in this rhythm. |
| `wireframe-3-about-photos-masked.jpg` | Same fog background. "About Me" heading. "Brief description:" then "Classes:" as short lines. Then a loose, overlapping scatter of five photos at varied sizes and offsets, in reading order: 4:3 landscape; 2:3 tall; small 4:3; 9:16 tall; 4:3 landscape. **Not a grid.** The photos are masked here for privacy; the owner supplies them later. *Superseded for layout by ADR-013 (round 6): the owner chose an asymmetrical bento wall.* |

The browser-window reference is a stock mockup in the owner's inputs. It shows
standard dark macOS browser chrome:
- three traffic lights;
- one tab with a ×, and a +;
- back, forward, and reload;
- a rounded address field with a lock and URL;
- share and star glyphs, a menu, and a thin scrollbar.

Reproduce it in CSS. Simplify the toolbar to the traffic lights and the address
field if the extra glyphs become noise at small sizes.

## Interaction states

Frontend covers every relevant state from protocol §8.

- **Project window**
  - Rest: dark, traffic lights gray, URL text dim.
  - Attention: hover, focus-visible on its link, or the touch center band.
    - The screen rises from black to full color over about 600–800ms.
    - The traffic lights color in.
    - The URL brightens.
    - One soft elevation shadow appears (justified below).
  - Pressed: the stickman cheers. The window itself does not bounce or scale.
  - Empty (any window without a screenshot yet): the window still comes alive (lights,
    URL, lift). Its screen is a **flat fog-tone panel**, never a photograph,
    with the quiet line "screenshot soon".
  - Error (image failed): identical to empty.
- **Photo slot**
  - Rest: grayscale, low contrast, sunk into the fog.
  - Attention: full color and full contrast. The caption, or its empty slot,
    becomes readable.
  - Empty (any slot without a photo yet): a mist-tone panel in its tile.
- **Photo wall** (owner, round 6; ADR-013): an editorial bento wall, not a scatter. One solid
  rectangle of tiles with a single thin gutter, a feature tile, and columns whose breaks are
  staggered so no gutter crosses the whole wall; references were an editorial bento of portraits
  and a tiled "collage frames" sheet. Each photo's own shape (tall, wide, square) chooses its
  tile, so cropping stays small. It keeps the section's fog, type, and rest/attention states.
- **Links:** charcoal text with a hairline underline. On hover or focus, the
  underline and text turn Deep Forest. The focus ring is a 2px Deep Forest
  outline with a 3px offset, visible on every interactive element.
- **Loading:** see the approved design §5.2. The stickman slice owns the loader.

## Motion vocabulary

Each motion has a job. Nothing else moves.

| Motion | Job |
|---|---|
| Stickman | Signature; it is the cursor. Owned by the stickman slice. |
| Loader scribble | Feedback while assets load. Owned by the stickman slice. |
| Fog drift in the hero | The owner's "moving thingy". Slow (one cycle of 60s or more), and paused when the hero is off-screen or the tab is hidden. |
| Fog-clear reveal | Each section rises from about blur(6px) and 0 opacity to sharp, about 0.9s, staggered no more than 0.06s. It reads as walking out of fog. The filter is removed after settling. |
| Cloud drift through the page (round 2) | The owner's "clouds hovering slightly within the page". The fog keeps moving behind the plates, so the page feels like air rather than paper. Photographic only, cut from the owner's two photographs; never drawn, never a CSS radial blob. Each layer drifts a few tens of pixels on a cycle of 60s or more, and pauses when its section is off-screen or the tab is hidden. |
| Scroll depth (round 2) | The owner's "scroll animations", given one job: distance. Backgrounds and clouds travel slower than the plates, so the fog reads as farther away than the windows and prints. Each project window arrives from its own side, with its caption a beat behind; each About print settles into place. Arrivals happen once and never replay. |
| Attention reveal | The color arrival described above. A window with a recording (ADR-012) also plays it while attended and pauses when attention leaves: the project literally comes alive, and nothing plays that nobody is looking at. |

Under `prefers-reduced-motion: reduce`, every row is off or becomes an instant or
opacity-only change.

## Justified exceptions

| Pattern from `DESIGN_CONSTRAINTS.md` | Why it belongs in this product |
|---|---|
| Drop shadow (item 4) | A project window is literally a window floating over fog. One soft elevation shadow, on project windows only, appears on attention. Nowhere else. |
| Gradients (item 1) | Fog is a gradient. Allowed only as alpha masks: photo edges dissolving into Mist Gray, and the optional cursor-local fog wipe. Never a color-to-color decorative gradient, never on text. |
| Multi-hue (item 3) | The three traffic-light colors are literal macOS chrome. They appear only on an attended window. |
| Pure white (item 2) | No white surface anywhere; Ivory is the lightest tone. `#fff` appears only as the `mix-blend-mode: difference` ink of the stickman figure and ring, where it renders as the inverse of whatever is beneath, never as white. |
| Custom cursor | The owner's signature request. Kept accessible: the true click point is always marked, the native cursor is used on coarse pointers, under reduced motion, and in forced-colors mode. |
| `mix-blend-mode: difference` on the stickman and ring | Keeps one line drawing legible over both pale fog and black windows without two code paths. Tuned and approved in the prototype. |
