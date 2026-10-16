# Emanuel Ling Portfolio: Design

**Status:** approved by Emanuel on 2026-10-16 ("looks right to me").

This is the record of what the owner approved in the brainstorming session. The
living detail is in `docs/PRODUCT.md`, `docs/DESIGN_BRIEF.md`, and
`docs/ARCHITECTURE.md`. Where those disagree with this file, they win, and the
manager keeps this file in step.

---

## 1. Intent

Emanuel Ling is a CS + Math student at Pomona College. He needs an official
portfolio he is proud to put on his résumé and LinkedIn. His previous attempt was
rejected as "AI slop", and the reasons are concrete:

- Inter + Playfair Display typography.
- Frosted-glass cards (`backdrop-blur`).
- Eyebrow labels.
- Pill buttons reading "View Projects" and "Contact Me".
- A typing-text effect and a "Scroll to explore" chevron.
- A 3-column card grid and a grid background.
- A theme toggle and multiple routes.
- Copy such as "I care about building things that feel intentional."

Every one of these could appear on anyone's site.

**Who visits.**
- **Primary:** an internship recruiter or engineer screening for summer 2027. They
  arrive from a résumé or LinkedIn link, often on a phone, and stay under a
  minute. In that minute they must see what Emanuel has built, that it is real,
  and how to reach him.
- **Secondary:** Claremont peers, hackathon teammates, professors, and his church
  community.

**Why now.** It is October 2026, which is peak recruiting for summer 2027. A good
v1 shipped soon is worth more than a perfect one shipped in December.

**What makes it his.** It has one personal idea: a tiny hand-drawn stickman who is
the cursor. That idea is set against misty black-and-white mountain photography.
Color appears only where his real work and life are, and only when someone pays
attention.

## 2. Goals, non-goals, anti-goals

**Goals**
1. One page, deployed at a public URL.
2. After the loader, all four projects are reachable within about 10 seconds:
   scroll or one nav click.
3. The stickman cursor feels exactly like the approved prototype (section 4.1).
4. Fog-to-color holds everywhere. The page is monochrome, and project screens and
   life photos come alive on attention.
5. Phones get a designed layout, not a shrunken desktop.
6. Fast and accessible: mobile Lighthouse performance ≥ 90, WCAG 2.2 AA, fully
   keyboard navigable, and `prefers-reduced-motion` honored.
7. Emanuel can edit text and drop in images later without touching layout code.

**Non-goals for v1:** blog, case-study pages, CMS, contact form, theme toggle,
analytics dashboard, chatbot, résumé download, multiple routes, sound.

**Anti-goals.** Each of these is a failure even if everything technically works.
- It could be pasted onto another student's site with only the name changed.
- Any of the previous attempt's tells listed in section 1.
- A loader that makes a recruiter wait, or that cannot be skipped.
- A cursor that makes links hard to hit.
- Content that exists only on hover, and so is invisible on phones.
- Fake content: invented stats, lorem ipsum, AI-generated project art.
- Empty image slots that look broken instead of intentionally empty.

## 3. Constraints

- **Fonts (owner's ranking):** Instrument Serif is the favorite, then Cormorant
  Garamond, then Manrope.
- **Palette (owner's):** Deep Forest `#0F2E24`, Dark Charcoal `#242424`, Soft
  Ivory `#F8F9F7`, Mist Gray `#E3E8E5`.
- **Photography:** "Misty Monochrome Alpine Valley" is the hero background.
  "Ethereal Foggy Evergreen Forest" is the background for the projects and about
  sections. **These photos are the double-exposure technique.** No separate blend
  effect is to be built.
- **Navigation:** one page, with sections Home / Projects / About / Contact.
- **Images:** the owner has not supplied project screenshots or collage photos yet.
  He will add them later. v1 ships with designed empty slots.
- **Hosting:** Vercel, as with his other projects.
- **Process:** the repository runs the multi-agent protocol in
  `docs/AGENT_PROTOCOL.md`.

## 4. Decided by the owner

### 4.1 The stickman is the cursor

Tuned in a live prototype. The owner's verdict was "its actually perfect nothing
is off", followed by changes to size and click point. The prototype is preserved
at `docs/reference/stickman-cursor-spike.html` and is **the reference for feel**.

- **Size:** 32px tall on desktop. Strokes are about 1.8px, with round caps and
  joins.
- **Native cursor:** hidden. An **11px ring** (1.2px stroke) marks the true pointer
  position, and clicks land there.
- **Walking:** he walks to the ring.
  - Speed is `min(1150, 150 + 2.4 × distance)` px/s, clamped near the target to
    `distance × 7`.
  - He has arrived when he is within 1.2px.
  - Speed eases toward its target at a rate of 10/s.
  - Above about 220 px/s he leans forward and runs, with a longer stride.
  - He faces his direction of travel.
- **Reactions:**
  - After arriving on an interactive element, he points at it.
  - On press of an interactive element, he hops and cheers, arms up with a small
    wave, for about 0.7s.
  - After 5s idle, he sits down.
- **Contrast:** he is drawn so that he stays visible over both light fog and the
  dark frames. The prototype uses `mix-blend-mode: difference`.
- **One character:** the loader's scribbler and the cursor are the same stickman.

### 4.2 Loader

The stickman holds a pencil and scribbles random loops above a pill-shaped
progress bar, as in wireframe p1. When loading finishes he becomes the cursor.

### 4.3 Projects

- Each project is shown inside a **dark macOS-style browser window**. It is black
  until hovered, then comes to life in color (wireframe p2 and the browser mockup
  input).
- The windows alternate left and right, with the title opposite each one.
- Each description is **no more than one sentence**.
- The order and copy are approved. See section 7.

### 4.4 About

- A brief description.
- **Classes:** Linear Algebra; Data Structures and Algorithms.
- A scattered **photo collage**, as in wireframe p3. Photos are **faded until
  hovered**, and each has a small caption the owner adds later.
- **No explicit hobbies or life-updates lists.** The photos carry them.

### 4.5 Connect

LinkedIn and email (section 7).

## 5. Manager's calls

These are open to the owner's change.

1. **Stack.** Hand-coded React + TypeScript built with Vite, deployed as static
   files on Vercel. There is no server and no database. Content lives in typed
   data files.
2. **Loader timing.**
   - Shown on the first visit of a browser session only.
   - Progress rises to 90% over about 1.2s, then waits for the hero image to
     decode.
   - Minimum duration 1.2s; hard cap 4.5s.
   - Any click or key skips it.
   - Under reduced motion it is replaced by a 300ms fade.
3. **The moving thing.** The owner's notes ask for "some sort of moving thingy".
   It is a slow drift of fog across the hero.
4. **Scroll animation.** Sections clear out of the fog as they arrive: blur and
   opacity go to sharp.
5. **Touch devices.**
   - Project windows and photos come alive while they sit in the middle band of
     the viewport.
   - The stickman scales to about 24px. He lives on the bottom edge of the screen,
     walks along as the page scrolls, and runs to wherever the visitor taps.
   - (The owner deferred phones: "something we can worry about later".)
6. **Reduced motion.** No loader animation, normal cursor, no stickman, no fog
   drift, no reveal motion.
7. **Keyboard.** Every link is reachable by Tab with a visible focus ring. The
   stickman also reacts to keyboard focus.
8. **Empty image slots.** An empty project window shows its real URL in the
   address bar over a fogged screen with a quiet "screenshot soon" line. An empty
   photo slot shows a mist-tone panel with its caption slot. Both look intentional.
9. **Intro copy.** One or two sentences, drafted in Emanuel's voice and flagged for
   him to edit.
10. **GitHub.** It appears as a third link in Connect, because every project points
    there.

The following calls resolve the builder check (2026-10-16):

11. **Empty project windows.** An empty project window's screen is a flat
    fog-tone panel with the line "screenshot soon". It never contains a
    photograph, because a landscape under a `sageplan.vercel.app` address bar
    would read as fake project art.
    - The dark-to-color pipeline is still built now.
    - It is verified with a fixture image in tests and the lab page, never in
      shipped content.
    - The owner said "for now just leave spaces for it".
12. **Collage slots.** The collage has five slots, matching wireframe p3:
    - 4:3 landscape;
    - 2:3 tall;
    - small 4:3;
    - 9:16 tall;
    - 4:3 landscape.

    The slots are data-driven, so adding or removing a photo is a content edit.
13. **The intro.** The intro is About's "brief description", not a hero line.
    - It is drafted from verified facts only: CS + Math at Pomona, and software
      built for his classmates (SagePlan), his city (StreetSafe: LA), and his
      church (Revelation Youth, where he is music director).
    - It ships flagged for the owner's edit, and launch does not wait on that edit.
    - Classes are labeled "This semester": the owner listed them when asked what
      he is taking this semester.
14. **Touch stickman.** It is built in v1 behind a flag that is **off in
    production** until the owner tunes it in the lab page, as he did for desktop.
    Phones are complete without it: native touch, every reveal driven by the
    center band.
15. **Hero.** The hero holds the name and subtitle, plus a small
    LinkedIn · Email · GitHub row under the subtitle. That matches the prototype
    the owner saw, and puts contact on the first screen for screeners. No project
    window appears in the hero; the prototype's window was only a hover target.
16. **Wireframes.** They are binding for structure and order. Exact geometry is
    left to the builder. Copies are in `docs/reference/wireframes/`, with the
    owner's personal photos masked on page 3.

## 6. Left to the builder

- Exact type scale, spacing, and motion curves.
- Frame chrome detail.
- The collage's arrangement at each breakpoint.
- How the scribble path is generated.
- How the fog drift is built.
- The precise empty-state copy, within the brief.

All of these come under the constraints in `docs/DESIGN_BRIEF.md` and
`docs/DESIGN_CONSTRAINTS.md`.

## 7. Content (approved)

**Hero:** Emanuel Ling / CS + Math @ Pomona College

**Projects, in order.** "Built with" lines are drawn from each repository.

1. **SagePlan**
   - Sentence: "Shows a Pomona student which graduation requirements they have met
     and which courses offered next term would cover the rest."
   - Live: https://sageplan.vercel.app
   - Code: https://github.com/EmanuelPomona/SagePlan
   - Built with: React, TypeScript.
2. **StreetSafe: LA**
   - Sentence: "A community-reported map of broken sidewalks and blocked paths in
     Los Angeles for wheelchair users, stroller users, and blind or low-vision
     pedestrians."
   - Code: https://github.com/EmanuelPomona/Street-Safe-LA
   - Devpost: https://devpost.com/software/street-safe-la
   - Note: 3rd of 17 teams at CGU Hacks, built with Jay Li.
3. **Revelation Youth**
   - Sentence: "The website for the youth ministry at International Miracle Makers
     Church, giving its music, events, devotions, and merch one home."
   - Live: https://revelation-youth.vercel.app
   - Code: https://github.com/EmanuelPomona/Revelation-Youth
   - Built with: Next.js, React, TypeScript, Tailwind CSS.
4. **Snake AI**
   - Sentence: "A neural-network agent that teaches itself Snake by trial and
     error; its best game scored 35 against a random player's 0.13 average."
   - Code: https://github.com/EmanuelPomona/Snake-AI
   - Built with: Python, PyTorch.

**Classes:** Linear Algebra; Data Structures and Algorithms.

**Connect:**
- LinkedIn: https://www.linkedin.com/in/emanuel-ling-915a73244
- Email: emanuelling27@gmail.com
- GitHub: https://github.com/EmanuelPomona

## 8. Owner to supply later

- Project screenshots or short screen recordings.
- Collage photos and their captions.
- His edit of the intro sentence.
- A custom domain, if wanted.
