# API Contract

This project has **no HTTP API** (ADR-001). Its cross-agent contracts are
**in-repo TypeScript modules**:

- **The TypeScript files are authoritative for shapes:** field names, optionality,
  and literal types.
- **This document is authoritative for behavior:** what values mean, timing,
  DOM, and CSS rules.

`docs/openapi.yaml` carries `x-no-http-api: true`, so `scripts/contract-test.sh`
runs `npm run test:contract`: a typecheck plus every `*contract*` test.

The manager owns every file named in this document as a contract. Changes go
through `docs/AGENT_PROTOCOL.md` §6. The prose and the TypeScript change
**together**, in one manager commit.

| Boundary | Canonical artifact | Provider | Consumer |
|---|---|---|---|
| Content | `frontend/src/content/types.ts` | backend (values in `site/projects/about/contact.ts`) | frontend |
| Media | `frontend/src/content/media.ts` | backend (`npm run media` → `media.generated.ts`) | frontend |
| Stickman | `frontend/src/stickman/types.ts` + `index.ts` | stickman slice | frontend (`App.tsx`) |
| Flags | `frontend/src/config/flags.ts` | manager | frontend, stickman |
| Head metadata | `frontend/plugins/seo.ts` → `seoPlugin(): Plugin` | backend | `vite.config.ts` |

---

## 1. Content: `frontend/src/content`

**Import rule.** The rest of the app imports content only from `src/content`
(its `index.ts`), never from the individual value files. Content is static and
synchronous: no fetch, no loading state, and no runtime errors. Invalid content
fails `npm run typecheck` or `npm test` at build time.

**Exports:**
- `content`, `site`, `projects`, `about`, `contact`;
- `getMedia(id)` and `isMediaId(id)`;
- all types.

**What the consumer does with each field.** Field definitions and invariants are
in `docs/DATABASE.md`.

| Field | Consumer behavior |
|---|---|
| `site.nav` | Drives the nav, in order. Each `id` is also the DOM id of its `<section>`. `label` doubles as the section heading. `home` has no visible heading. |
| `site.name`, `site.tagline`, `site.heroLinks` | The hero, top to bottom. |
| `site.heroImage`, `site.sectionsImage` | Decorative backgrounds. Render with `alt=""` or as CSS backgrounds. Never announced to screen readers. |
| `projects` | Render order. The displayed number is `String(i + 1).padStart(2, '0')`. |
| `project.primary` | The browser window's link target and its accessible name: "<title>, <primary.label>, <addressBar>" (ADR-010: the name contains the visible address, WCAG 2.5.3). `http(s)` links open in a new tab with `rel="noopener noreferrer"`. |
| `project.secondary` | Small links after the meta line. May be empty, and is never the same URL as `primary`. |
| `project.addressBar` | Rendered verbatim in the window's address field. |
| `project.meta` | One line, items joined with " · ". |
| `project.screen.image === null` | The window's **empty state**: near-black at rest with the words "screenshot soon"; on attention the screen lifts to a flat fog-tone panel (ADR-010). Never substitute any other image. |
| `about.description` | Rendered as is. `descriptionIsDraft` is **never** rendered; it exists for the owner's tooling. |
| `about.classes` | `label` as a small heading, `items` as a list. |
| `about.photos[i].image === null` | A mist-tone panel at `aspect`. |
| `about.photos[i].caption === null` | No caption text. The frontend may reserve the caption line, but must never print placeholder words. |
| `contact.links` | The Contact section, in order. A `mailto:` link opens in the same tab. |

## 2. Stickman: `frontend/src/stickman`

### 2.1 Exports

| Export | Kind | Contract |
|---|---|---|
| `Loader` | `(props: LoaderProps) => JSX.Element \| null` | §2.2 |
| `StickmanLayer` | `(props: StickmanLayerProps) => JSX.Element \| null` | §2.3 |
| `loaderMode()` | `() => 'show' \| 'fade' \| 'skip'` | Reads `<html data-loader>`. Anything other than `show` or `fade` is `skip`. |
| `LOADER_SEEN_KEY` | `'el:loader-seen'` | sessionStorage key shared with the §2.4 gate. |

The page imports only from `src/stickman` (its `index.ts`).
`src/stickman/contract.test.tsx` (manager-owned) asserts the testable half of
§2.2 and §2.3. The scaffold stubs pass it, and the real implementation must keep
passing it.

### 2.2 Loader

**Props**
- `ready: Promise<unknown>` settles when the hero image has decoded. A rejection
  counts as ready.
- `onDone()` is called **exactly once**, after the loader has fully exited.

**Mode `show`** (first visit of the session, motion allowed):
1. On mount, it removes `#boot-cover` and paints its own sheet of Soft Ivory
   paper.
2. The stickman, holding a pencil, scribbles looping lines. Progress rises
   smoothly toward 90% over about 1.2s, holds, and sprints to 100% once `ready`
   settles.
3. **Minimum** visible time is 1.2s. **Cap** is 4.5s from mount: at the cap it
   exits even if `ready` never settled.
4. **Skip:** any `pointerdown` or `keydown` starts the exit immediately.
5. **Exit:** at most 600ms. The stickman lets go of the pencil and becomes the
   cursor (§2.3), and the paper clears.
6. **Finish:** set `sessionStorage[LOADER_SEEN_KEY] = '1'`, ensure `#boot-cover` is
   gone, set `<html data-loader>` to `skip` (this releases the §2.4 scroll lock),
   and call `onDone()`.

While the paper is up the Loader shows the native `progress` cursor, because the
ring (`--z-stickman`) sits under the paper (`--z-loader`).

Under the contract test this means `onDone` fires within 5s of mount whatever
`ready` does.

**Mode `fade`** (first visit, `prefers-reduced-motion: reduce`):
- No scribble and no movement.
- The ivory sheet fades out in at most 300ms once `ready` settles. The cap still
  applies.
- `onDone` is called within 1s of `ready`.

**Mode `skip`:** the page does not mount the Loader (§2.5).

**Accessibility.** The sheet exposes `role="progressbar"` with
`aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow`, and
`aria-label="Loading"`. The scribble canvas is `aria-hidden`.

### 2.3 StickmanLayer

**Props.** `touch: boolean` allows the touch walker. Wire it to
`flags.touchStickman`.

**Activation.** The media queries are re-evaluated live. A change of pointer type
or motion preference switches the layer without a reload.

| Conditions | Result |
|---|---|
| `(pointer: fine)` and not `(prefers-reduced-motion: reduce)` and not `(forced-colors: active)` | **Desktop cursor.** Adds `html.stickman-cursor`, which hides the native cursor, on the first `pointermove` after activation, so a still pointer is never left blank. |
| `(pointer: coarse)` and `touch === true` and not reduced motion and not `(forced-colors: active)` | **Touch walker.** The native touch behavior is untouched. (The forced-colors exclusion was added at integration round 1.) |
| anything else | Renders `null`. The native cursor is untouched, and `html.stickman-cursor` is absent. |

On unmount or deactivation it **always** removes `html.stickman-cursor`.

**Desktop cursor behavior.** The feel reference is
`docs/reference/stickman-cursor-spike.html` (owner-approved).
- **Ring.** An 11px ring (1.2px stroke) sits exactly at the pointer, and clicks
  land there.
- **Figure.** About 32px tall, about 1.8px stroke, round caps and joins.
- **Speed law.** `desired = d > 1.2 ? min(min(1150, 150 + 2.4·d), 7·d) : 0` px/s.
  Speed eases toward `desired` at rate 10/s. Above about 220px/s he runs: longer
  stride, forward lean. He faces his direction of travel.
- **Point.** Once arrived (`d < 1.5 × size`) on a target, he points at its center.
- **Cheer.** On `pointerdown` on a target: a hop plus arms up with a wave, about
  0.7s.
- **Sit.** After 5s with no movement.
- **Keyboard.** On keyboard focus of a target (`:focus-visible`), he walks to
  just below-left of the element and points at it.
- **Pause.** When the tab is hidden, the rAF loop pauses.

**Targets and opt-outs**
- **Targets:** `a[href]`, `button:not([disabled])`, and `[data-stickman="target"]`.
- **Ignored:** anything inside `[data-stickman="ignore"]`.
- **Never:** the layer never calls `preventDefault`, never stops propagation, and
  never intercepts pointer events.

**Rendering**
- One fixed, full-viewport `<canvas>` plus the ring element.
- Both are `pointer-events: none` and `aria-hidden="true"`.
- `z-index: var(--z-stickman)`, with `mix-blend-mode: difference` so he stays
  legible on light fog and black windows.

**Touch walker.** It ships behind the flag, off in production until the owner
approves it.
- He stands about 24px tall on the bottom edge, above `env(safe-area-inset-bottom)`.
- He walks with scroll velocity, runs horizontally to the x of a tap, and cheers
  if the tap hit a target.
- He never blocks taps.
- Before the flag flips, `index.html`'s viewport meta gains `viewport-fit=cover`,
  so `env(safe-area-inset-bottom)` is non-zero on notched phones (TASK-205).

### 2.4 `index.html` gate and boot cover

These are verbatim and frontend-owned. Do not reword them; keep the script before
the first stylesheet.

```html
<script>
  (function () {
    var mode = 'skip';
    try {
      var forced = /[?&]loader=1(&|$)/.test(location.search);
      var seen = sessionStorage.getItem('el:loader-seen') === '1';
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (forced || !seen) mode = reduced ? 'fade' : 'show';
    } catch (e) {
      mode = 'skip';
    }
    document.documentElement.dataset.loader = mode;
  })();
</script>
<style>
  #boot-cover { display: none; }
  html[data-loader='show'] #boot-cover,
  html[data-loader='fade'] #boot-cover {
    display: block; position: fixed; inset: 0; z-index: 1000; background: #f8f9f7;
  }
  html[data-loader='show'] body { overflow: hidden; }
</style>
<!-- first child of <body>: -->
<div id="boot-cover" aria-hidden="true"></div>
```

- `?loader=1` forces the loader. This is for the reviewer and the owner.
- Storage being blocked means `skip`.
- **CSP (ADR-008).** `vercel.json` allows these two blocks by the sha256 of their
  **served** bytes, from the built `index.html`. Vite serves the gate script
  verbatim and minifies the boot style. Editing either block requires new hashes;
  `npm run test:contract` names the mismatch.
- **Scroll-lock release.** `html[data-loader='show'] body { overflow: hidden }`
  is released twice, and either alone suffices: the page's CSS releases it once
  `<main>` is no longer `inert`, and the Loader sets `data-loader` to `skip` at
  finish (§2.2).

### 2.5 Mount contract (`frontend/src/app/App.tsx`)

The frontend may restructure everything around this, but keeps these four rules:

```tsx
const heroReady = useMemo(() => decodeImage(getMedia(site.heroImage).fallback.src), [site.heroImage]);
const [loaderDone, setLoaderDone] = useState(() => loaderMode() === 'skip');

<StickmanLayer touch={flags.touchStickman} />                      {/* always mounted */}
{!loaderDone && <Loader ready={heroReady} onDone={() => setLoaderDone(true)} />}
<main aria-busy={!loaderDone} inert={!loaderDone}>…</main>         {/* inert while loading */}
```

1. `StickmanLayer` is mounted once, for the life of the page.
2. `Loader` is mounted only while `loaderDone` is false.
3. `<main>` is `inert` and `aria-busy` while the loader is up.
4. `ready` is created once, from the same hero source the hero renders. If the
   frontend later renders the hero with `srcset`, it passes the decode promise of
   that actual `<img>` instead.

Entrance animations that depend on the loader start when `loaderDone` becomes
true.

### 2.6 CSS contract

- `--z-nav: 100`, `--z-stickman: 900`, and `--z-loader: 1000` are defined in
  `frontend/src/styles/tokens.css`. These values are contract.
- The stickman module ships its own CSS, including
  `html.stickman-cursor, html.stickman-cursor * { cursor: none !important; }`.
  The frontend never declares `cursor: none`. It may use `cursor: pointer`.
- The frontend never styles classes prefixed `stickman-`.

### 2.7 Lab page

- `frontend/stickman-lab.html` is served at `/stickman-lab.html` by `npm run dev`.
- It is **not** in the production build, because Vite builds only `index.html`.
- It hosts tuning controls (size, pace, ring) and a touch-walker toggle that
  overrides the flag locally.
- It is how the owner approves the touch walker.

## 3. Media

**Consumer.**
`getMedia(id: MediaId): MediaAsset`. `MediaId` is the union of keys in
`media.generated.ts`, so an unknown id is a type error. The frontend's
`<Picture>` renders:

```html
<picture>
  <source type="image/avif" srcset="…" sizes="…" />   <!-- one per sources[] entry, in order -->
  <source type="image/webp" srcset="…" sizes="…" />
  <img src="{fallback.src}" srcset="{fallback.srcset}" sizes="…"
       width="{width}" height="{height}" alt="…" loading="lazy|eager" decoding="async"
       style="background-color: {placeholder}" />
</picture>
```

- The hero is `loading="eager"` with `fetchpriority="high"`.
- Everything else is `loading="lazy"`.
- `sizes` is the frontend's call, per layout.

**Provider: `npm run media`** (`frontend/scripts/media.mjs`).
- **Input:** `frontend/media-src/**/*.{png,jpg,jpeg,webp}`. The id is the relative
  path without its extension, lowercase kebab-case (`projects/sageplan`). Any
  other name **fails** the run with a message naming the file.
- **Output:** `frontend/public/media/<id>-<w>.{avif,webp,jpg}` for each width in
  **[640, 1024, 1600, 2400]** that does not exceed the original width. The
  original width is also included when it falls between steps. Then
  `frontend/src/content/media.generated.ts`, keys sorted, matching the shape in
  `media.ts`.
- **`placeholder`:** the mean color of the image, as `#rrggbb`.
- **Deterministic:** the same inputs produce byte-identical outputs. Stale outputs
  for deleted sources are removed.
- **Caching (ADR-009).** Rendition names are not content-hashed, so `/media/*` is
  served `public, max-age=0, must-revalidate`. Only Vite's hashed `/assets/*` is
  `immutable`.
- **Exit codes:** non-zero on any failure. It never leaves a half-written manifest.

## 4. Flags: `frontend/src/config/flags.ts`

`flags.touchStickman` is `false` in production until the owner approves the touch
walker in the lab page (approved design §5.14). Only the manager changes a flag,
after that approval.

## 5. Head metadata: `frontend/plugins/seo.ts`

`seoPlugin(): Plugin`, a Vite `transformIndexHtml` plugin, injects these from
`site` at build and dev time:
- `<title>`, meta description, canonical (when `site.origin` is set);
- Open Graph and Twitter tags;
- `theme-color`, favicon links;
- one `application/ld+json` Person block: name, url, sameAs = LinkedIn and GitHub,
  affiliation Pomona College.

`index.html` keeps only its fallback `<title>`. The plugin replaces it.

## 6. Root scripts (stable names)

`dev`, `build`, `preview`, `test`, `test:contract`, `typecheck`, `lint`, `media`.
Each one proxies to the `frontend` workspace. CI and `scripts/*.sh` depend on
these names.
