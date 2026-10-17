# Handoffs: agent/backend

## CONTRACT CHANGE REQUEST — CCR-1 (TASK-304): fonts must not be inlined as data: URIs

**Status:** open. TASK-304 is `BLOCKED`, `blocked_on: contract`.

**Current shape**
- TASK-304's CSP has `font-src 'self'` (implemented exactly, in `vercel.json`).
- `frontend/vite.config.ts` (manager) uses Vite's default `build.assetsInlineLimit` of 4096 bytes.
- `frontend/src/main.tsx` (frontend) imports every Manrope Variable subset (`@fontsource-variable/manrope`).

**What happens:** the Manrope `cyrillic-ext` subset is about 3.4 KB, so Vite inlines it into the CSS as a
`data:font/woff2` URI. `font-src 'self'` blocks it on every page load, which logs a CSP violation.
Evidence: `docs/review/B-304-console.txt`, and `errors-in-console` in `docs/review/B-304-lighthouse-mobile.html`.

**Proposed shape (preferred).** One line in `frontend/vite.config.ts`, inside the returned config:

```ts
build: { assetsInlineLimit: (file: string) => (/\.(woff2?|ttf|otf)$/i.test(file) ? false : undefined) },
```

Verified locally on `agent/backend` and NOT committed, because the file is manager-owned:
- the build emits `assets/manrope-cyrillic-ext-wght-normal-*.woff2` (2.55 kB) as a file;
- the CSS contains 0 `data:font` URIs;
- `tsc` passes, and `plugins/csp.contract.test.ts` passes 5/5.

**Alternatives**
- (b) frontend imports only the Latin subsets of Manrope.
- (c) `font-src 'self' data:` in `vercel.json`. Backend can make this change in one commit, but the CSP is
  then looser than TASK-304 specifies.

**Why:** it keeps the CSP exactly as specified and serves every font from `'self'`.

**What breaks if unchanged**
- A CSP error is logged on every page load (TASK-304 "zero CSP violations", I-02).
- Glyphs in that subset fall back to another font.
- Lighthouse Best Practices stays below 95 (F-01).

## CONTRACT CHANGE REQUEST — CCR-2 (TASK-304): hash the served inline blocks, not the source

**Status:** implemented as described below; it needs the manager's acknowledgment and a note in the
contract.

**Current shape:** TASK-304 says the CSP test extracts the gate `<script>` and the boot-cover `<style>`
from `frontend/index.html` and asserts their hashes appear in the CSP.

**What happens:** Vite minifies the inline boot-cover `<style>` during the build, so the bytes served
differ from the source:
- source style hash: `sha256-JYAd9ELZiZ00WPF6SBiv2M4evHFUrPrGFQlYjztQ0YM=`;
- served style hash: `sha256-Wd3nSQojsP45W9OgtYDG4lFsAv9R3LMcDOWtrpT2OWs=`.

Browsers hash what they receive. A CSP built from the source hash would block the boot cover in
production, so the loader would flash (L-01). The gate `<script>` is served byte-for-byte unchanged.

**Implemented:** `frontend/plugins/csp.contract.test.ts` builds the real site and hashes the inline
blocks of the built `index.html`. It also asserts that the built gate equals the source gate, and that
`vercel.json` lists exactly those two hashes. The test name is unchanged.

**Proposed contract text** (API.md §2.4 or TASK-304): "The CSP hashes are of the served (built) inline
blocks. The gate script is served verbatim; Vite minifies the boot style."

**What breaks if unchanged:** nothing today. If someone later "fixes" the test to hash the source, the
deployed boot cover is blocked.

## CONTRACT CHANGE REQUEST — CCR-3 (TASK-304, API.md §3): `/media` is immutable but its names are not content-hashed

**Status:** open. `vercel.json` implements TASK-304 as written. Raised by the pre-handoff code review.

**Current shape**
- TASK-304: `Cache-Control: public, max-age=31536000, immutable` on `/media/(.*)`.
- API.md §3: renditions are named `<id>-<w>.{avif,webp,jpg}`. The name depends only on the source's
  path and the width, not on its content.

**What breaks:** README §2 tells the owner how to replace a screenshot (for example, a new
`projects/sageplan.png` of the same width). That keeps every rendition URL the same. Any browser that
already has the old file, the owner's included, keeps showing it for up to a year without
revalidating. Vercel's CDN is purged on deploy; browser caches are not.

**Proposed shape**, either of:
- (a) Preferred: add a short content hash to rendition names, such as `<id>-<w>.<hash8>.<ext>`. This
  changes the API.md §3 naming, `media.mjs`, and its tests (backend). Anything that reads URLs from
  the manifest (`getMedia`) is unaffected. Anything that hard-codes a rendition path breaks: TASK-201's
  lab page names `/media/backgrounds/alpine-valley-1672.jpg`, so it would have to use `getMedia()`.
- (b) Make `/media/(.*)` revalidating, for example `public, max-age=0, must-revalidate`, and keep
  `immutable` for `/assets/(.*)`, which Vite does content-hash. This is a one-line change in
  `vercel.json` plus the CSP test's expectation (backend).

**Why:** `immutable` is only safe on content-addressed URLs.

## HANDOFF-1 — agent/backend — 2026-10-16

### Summary

All four backend tasks are implemented, reviewed, and verified. TASK-304 is `BLOCKED` on one
contract change.
- **TASK-301 to TASK-303** are ready for review.
- **TASK-304** is `BLOCKED` (`blocked_on: contract`, CCR-1).
  - Its config, CSP, headers, and preview deployment are done and verified.
  - Its "zero CSP violations" criterion is not met: one violation needs CCR-1, the other an owner setting.

**What was built**
- **Content validator** for C-01 to C-20, with tests built to survive the owner's later edits, and a
  plain-language owner guide.
- **Media pipeline:** deterministic `npm run media` (AVIF/WebP/JPEG, atomic manifest, stale cleanup),
  and the C-21 freshness test.
- **SEO plugin:** head tags, Person JSON-LD, `robots.txt`, `sitemap.xml`, the stickman favicon, and
  the share image.
- **Deployment:** `vercel.json` with a hash-based CSP, the security and cache headers, and a preview on
  Vercel.

**Preview URL:** https://emanuel-ling-oh4a2xaqd-team-boh-buh.vercel.app (Vercel project
`team-boh-buh/emanuel-ling`, deployment `dpl_6JfxyCWN96hdoo55KoQQiArueHaf`, built from commit
`454dc58`).
- It is behind Vercel Authentication. Open it while logged in to Vercel, or use `vercel curl`.
- Its build output matches HEAD: the JS bundle is byte-identical, and index.html differs only by the
  toolbar script that Vercel injects into previews.
- **For the manager:** record it as `PREVIEW_URL`.

**Owner decisions needed (no code involved)**
1. **Production is already live.** Vercel sends a project's first deployment to production. I did not
   pass `--prod`.
   - https://emanuel-ling.vercel.app is publicly serving the walking skeleton from commit `53cb8e6`,
     and it can be indexed.
   - Nothing has been deleted. Either leave it, or take it down in the Vercel dashboard.
2. **The Vercel Toolbar on previews** injects `vercel.live/.../feedback.js`, which the CSP blocks.
   Turning the toolbar off for this project's previews removes the second violation.
3. **`vercel curl` created a "Protection Bypass for Automation" secret** on the project. Revoke it once
   review is done, under Settings, Deployment Protection. It is not in the repository, and it is
   redacted from the evidence.
4. **The project has no Git connection,** on purpose, so that pushes do not deploy to production. How
   the site gets published is still open.

### Tasks Completed

**TASK-301: content validator, contract tests, owner guide (ready for review)**
- **B-01:** `npm run test:contract` passes: 159 tests, exit 0.
- **One violation per rule:** every rule from C-01 to C-20 has at least one test that changes one
  thing and expects exactly one `{rule, path}`.
  - Each rule test runs against two bases: the real content, and the content as it looks after the
    owner follows the README (a later date, a screenshot, a captioned photo, a sixth slot, one class,
    a one-item meta line).
- **The real content is clean:** `validateContent(content)` returns `[]` (the "the real content" test).
- **Owner guide** (`frontend/src/content/README.md`). In plain steps:
  - edit text;
  - add a screenshot or a photo, including `.HEIC` and `.JPG` advice;
  - run `npm run test:contract`;
  - commit, and note that a push does not publish.

  It also explains every rule from C-01 to C-21 in one line, and documents C-20's false alarms.
- **No content values needed fixing.** The real content had no violations.

**TASK-302: media pipeline (ready for review)**
- **B-02:** a second run prints "0 written, 0 stale removed, manifest unchanged", and `git status` is
  clean. In temp folders, adding a fixture creates its renditions and manifest entry, and deleting
  it removes them (tested).
- **C-21:** `media.contract.test.ts` makes the three required checks, plus:
  - no manifest entry without a source;
  - each source width matches its manifest entry;
  - each source's mean colour equals the manifest placeholder, which catches a replaced image of
    the same size.
- **Width plans:** the alpine photo gets 640, 1024, 1600, and 1672; the evergreen photo gets 640 and 1024.
- **Hero AVIF at 1600w:** 75,638 bytes, against a 250 KB budget (the `ls -l` is under Verification).
- **Encoder settings:** documented in the `media.mjs` header.
  - AVIF: q60, effort 4, 4:4:4.
  - WebP: q80, effort 4.
  - JPEG: q80, mozjpeg.
- **Every required test exists under its exact name.**
- **Determinism:** all three formats are byte-stable on this machine, so no decoded-pixel fallback
  was needed.

**TASK-303: head metadata, favicon, OG image, robots, sitemap (ready for review)**
- **B-03:** `dist/index.html` has:
  - the title;
  - the description;
  - `og:title`, `og:description`, `og:type`, and `og:image` (absolute when an origin is set);
  - `twitter:card`;
  - `theme-color #e3e8e5`;
  - the SVG icon link;
  - exactly one JSON-LD block, which parses.
- **B-04 files:**
  - `favicon.svg`;
  - `og.jpg` (1200×630, 64,338 B);
  - `robots.txt`;
  - `sitemap.xml` (emitted because the origin is now set).
- **Every required test exists under its exact name.**
- **Extras:**
  - a real `vite build` integration test;
  - the plugin only rewrites `index.html`;
  - the build fails loudly when `<title>` is missing.

**TASK-304: Vercel config and preview (BLOCKED, `blocked_on: contract`)**
- **Done:**
  - **B-05:** all headers are present on the preview, and `/media` and `/assets` are `immutable`.
  - **B-04:** all four files return 200 on the preview.
  - **The CSP contract test** passes under its exact name; see CCR-2 for how it hashes.
  - **Lighthouse** has run and its report is saved.
- **Not met: zero CSP violations.** Two remain:
  1. A `data:` font, which is CCR-1.
  2. The preview toolbar, which is owner decision 2.

### Files Changed

**Content** (`frontend/src/content/`)
- `validate.ts` (new)
- `content.contract.test.ts` (new)
- `media.contract.test.ts` (new)
- `README.md` (new)
- `media.generated.ts` (regenerated)
- `site.ts`: `origin` only

**Media** (`frontend/scripts/`)
- `media.mjs` (the stub replaced)
- `media-lib.mjs` (new)
- `media-lib.d.mts` (new)
- `media.test.mjs` (new)
- `og.mjs` (new)

**Plugins** (`frontend/plugins/`)
- `seo.ts` (the stub replaced)
- `seo.test.ts` (new)
- `seo.build.test.ts` (new)
- `share-assets.test.ts` (new)
- `csp.contract.test.ts` (new)

**Assets** (`frontend/public/`)
- `favicon.svg` (new)
- `og.jpg` (new)
- `media/backgrounds/*` (regenerated: 18 renditions)

**Repository root and media sources**
- `vercel.json` (new)
- `.gitignore`: one line, `.vercel`, added when the project was linked to Vercel. This is a shared file.
- `frontend/media-src/README.md`: now points to the guide.

**Docs**
- `docs/review/B-304-console.txt`
- `docs/review/B-304-lighthouse-mobile.html`
- `docs/tasks/TASK-30{1,2,3,4}` (status only)
- `docs/tasks/INDEX.md`
- `docs/status/agent-backend.md`
- this file

**Untouched contract files:** `types.ts`, `media.ts`, `index.html`, and `vite.config.ts` were not
edited.

### Contracts

- **`validateContent(c, { today?, mediaIds? }) => ContentViolation[]`**, with `RuleId` covering C-01
  to C-20, exactly as TASK-301 specifies.
- **Media pipeline:**
  - The manifest keeps the `media.ts` shape, but is now written as JSON inside `as const satisfies`.
  - Rendition URLs are `/media/<id>-<w>.<ext>`.
  - `media-lib.mjs` exports `mediaIdFromPath`, `planWidths`, `renditionPath`, `meanColor`,
    `manifestEntry`, `renderManifest`, `isRenditionFile`, `prepareSource`, `IVORY`, and `WIDTH_STEPS`.
- **`seoPlugin(opts?)`**, plus `renderHead`, `buildJsonLd`, `renderRobots`, and `renderSitemap`.
  `vite.config.ts` still calls `seoPlugin()` unchanged.
- **`vercel.json`:**
  - CSP: `script-src 'self' 'sha256-ufw5f6ifwImT+jxH5JK7bjG6qG0aSdcv/WESYWhlPfs='` and
    `style-src 'self' 'sha256-Wd3nSQojsP45W9OgtYDG4lFsAv9R3LMcDOWtrpT2OWs='`.
  - **For frontend:** editing the gate script or the boot style in `index.html` requires new hashes.
    `npm run test:contract` names the mismatch.
- **Open change requests:** CCR-1, CCR-2, and CCR-3 above.
- **Dependencies:** none added.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| ecc:contract-first | Start of TASK-301, before the validator | Shapes are imported from `types.ts`, never redeclared. The real exported `content` is the provider check. Fixtures are cloned through JSON because `heroLinks` and `contact.links` share objects. |
| superpowers:test-driven-development | Start of TASK-301; applied in 301 to 304 | Each change had a failing test before the code, committed as a `test:` then `feat:` pair. For code that already existed, mutation checks: removing autoOrient or flatten, a one-space gate change, and five C-21 state mutations each turned a test red. |
| ecc:error-handling | Start of TASK-301. Invoked again at the start of TASK-302; the harness replied "already loaded" | The validator returns typed `{rule, path, message}` violations and never throws, with messages written for the owner. The CLI reports `media-src/<path>: <reason>`, exits 1, and writes nothing. |
| ecc:backend-patterns | Start of TASK-302, before designing the pipeline | Pure helpers are split from I/O. The run works like a transaction: encode everything in memory, write only if every source succeeds, and write the manifest last, atomically. |
| superpowers:systematic-debugging | TASK-302 step 3, when the browser probe stayed "pending" | Root cause: `img.decode()` never resolves in headless Chrome on this Mac, which has no display link. Confirmed with an onload probe. A test-harness artefact, not a product bug. |
| ecc:seo | Start of TASK-303, before `renderHead` | Self-referencing canonical only when the origin is set. `robots.txt` adds its Sitemap line only with an origin. The sitemap lists just the one public URL, with `lastmod`. JSON-LD holds only facts that are on the page. |
| ecc:security-review | Start of TASK-304, before the CSP | A strict, hash-only CSP over the bytes actually served. `.vercel` and the bypass secret are kept out of the repository and the evidence. |
| vercel:vercel-cli | TASK-304 step 2, before any CLI use | `whoami`, then project creation with no Git connection. `vercel curl` for the protected preview; protection was never disabled. |
| vercel:deploy | TASK-304 step 2 | Preflight checks, then a preview deployment only, built from a clean `git archive` of HEAD. |
| superpowers:requesting-code-review | Before the handoff, after implementing 301 to 304 | A read-only reviewer returned "With fixes": 1 Critical, 2 Important, 5 Minor. |
| superpowers:receiving-code-review | After the review verdict | Each finding was checked against the code first; #1 was reproduced (64 of 69 tests failed). Five fixed with tests, one verified as not a defect in Chrome, one filed as CCR-3, one recorded as a known issue. |
| superpowers:verification-before-completion | Immediately before this handoff | Everything under Verification was re-run fresh. No implementation work followed it. |

**Not invoked**
- **ecc:api-design:** there is no HTTP API (ADR-001), and the module interfaces were fully specified
  by the tasks.
- **Framework skills** (fastapi, django, nestjs, postgres, prisma, database-migrations): none of those
  frameworks is present.

### Verification

All of these ran on HEAD `43bdcc9`, after the review fixes:

```
$ scripts/bootstrap.sh            -> ports frontend 3002 / backend 8002; "ready"
$ npm test                        -> exit 0; Test Files 8 passed (8); Tests 209 passed (209)
    5/5 plugins/csp.contract.test.ts        6/6 plugins/seo.build.test.ts
   10/10 plugins/seo.test.ts                2/2 plugins/share-assets.test.ts
   32/32 scripts/media.test.mjs           139/139 src/content/content.contract.test.ts
    6/6 src/content/media.contract.test.ts  9/9 src/stickman/contract.test.tsx
$ npm run typecheck               -> exit 0
$ npm run lint                    -> exit 0
$ npm run build                   -> built; index JS 226.75 kB (70.98 kB gzip); CSS 7.00 kB (3.52 kB gzip)
$ scripts/contract-test.sh        -> exit 0; "no HTTP API declared ... running module contract tests"; 4 files, 159 passed
$ npm run media  (twice)          -> "2 image(s), 18 renditions (0 written, 0 stale removed), manifest unchanged."; git status clean
$ ls -l frontend/public/media/backgrounds/alpine-valley-1600.avif
-rw-r--r--  1 emanuel  staff  75638 Oct 16 10:30 frontend/public/media/backgrounds/alpine-valley-1600.avif
$ vercel curl / --deployment <preview> -- --head --silent
HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self' 'sha256-ufw5f6ifwImT+jxH5JK7bjG6qG0aSdcv/WESYWhlPfs='; style-src 'self' 'sha256-Wd3nSQojsP45W9OgtYDG4lFsAv9R3LMcDOWtrpT2OWs='; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
permissions-policy: camera=(), microphone=(), geolocation=()
referrer-policy: strict-origin-when-cross-origin
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
$ vercel curl <path> --deployment <preview> -- --head --silent
/favicon.svg   200 image/svg+xml
/og.jpg        200 image/jpeg
/robots.txt    200 text/plain       (has "Sitemap: https://emanuel-ling.vercel.app/sitemap.xml")
/sitemap.xml   200 application/xml  (<loc>https://emanuel-ling.vercel.app/</loc>, <lastmod>2026-10-16</lastmod>)
/media/backgrounds/alpine-valley-1600.avif  200  cache-control: public, max-age=31536000, immutable
/assets/index-BlNxRWFv.js                   200  cache-control: public, max-age=31536000, immutable
```

**Lighthouse, mobile, on the preview** (13.5.0, simulated throttling, one run),
`docs/review/B-304-lighthouse-mobile.html`:
- **Performance 96:** FCP 1.3 s, LCP 1.8 s, TBT 0 ms, CLS 0.123.
- **Accessibility 94.**
- **Best Practices 92.**
- **SEO:** not scored. See What Was NOT Verified.

**Below target, and why**
- **Accessibility 94:** `target-size` fails on the skeleton's unstyled hero links. Frontend owns this
  (R-02, TASK-101 and TASK-102).
- **Best Practices 92:** the two CSP violations. One is CCR-1; the other is the preview-only toolbar
  (owner decision 2).
- **CLS 0.123:** above the 0.05 budget. It comes from the unstyled skeleton, which frontend owns.

**Console:** `docs/review/B-304-console.txt`. The run used `?loader=1`, headless Chrome 155, and an 8 s
virtual-time budget.
- The gate ran: `data-loader="show"`.
- The boot cover was removed, and `<main>` was no longer `aria-busy` or `inert`.
- There is one JSON-LD block, and it was not executed.
- The Manrope Latin font and the hero JPEG load (200).
- **CSP violations:** 1 in this run (the `data:` font) and 2 in the Lighthouse run (the font plus the
  toolbar).

**Mutation and regression checks**, all run and all restored afterwards:
- **Content suite:** moving `updated` forward one day had made 64 of 69 tests fail. With the fix, the
  reviewer's scenarios pass 138 of 139. The one failure is the real-clock gate correctly flagging a
  date in the future.
- **C-21:** replacing a source with a different image of the same size makes C-21 fail
  (`#bcbcbd` vs `#e4e3e5`).
- **CSP:** adding one space to the gate script makes the CSP contract test fail.
- **Favicon:** with the CSP header on the SVG response, Chrome still applies the dark style (rendered
  identically with and without the CSP).

**CI:** GitHub Actions `ci` on `agent/backend` at `255dc97` completed successfully in 43 s.

**Skill audit:** `scripts/audit-skills.sh .` exited 0 with "all claims corroborated by the
transcript". All 12 claimed skills are marked OK, and the transcript positions match the stages
claimed: contract-first and TDD at 9%, backend-patterns at 29%, systematic-debugging at 44%, seo at
48%, security-review at 65%, the vercel skills at 69 to 70%, requesting and receiving code review at
84 and 86%, and verification-before-completion at 96%.

### What Was NOT Verified

- **Zero CSP violations on the preview: not met.** See CCR-1 and owner decision 2. TASK-304 stays
  `BLOCKED` until those are resolved.
- **SEO score.** Lighthouse could not score it on the protected preview: its `robots.txt` fetch got
  the SSO redirect (302), and Vercel adds `x-robots-tag: noindex` to every preview. `robots.txt` and
  `sitemap.xml` were checked directly instead. Score it on production once the owner promotes.
- **Header check method.** I did not use a plain `curl -sI <preview>`, because the preview needs a
  login (302). Every header check went through `vercel curl`.
- **The favicon's dark variant** was checked only in Chrome, as an `<img>`. Not checked: Firefox (not
  installed), Safari, and the real tab-strip rendering.
- **Lighthouse ran once,** headless, on this Mac. The run-to-run variance is unknown.
- **Loader timing in a real, headed browser.** Headless Chrome here never resolves `img.decode()`, so
  the loader exits through its 4.5 s cap in that setup. Loader timing belongs to stickman/frontend.
- **Media byte-determinism across machines.** Checked only on macOS arm64 (sharp 0.35.5). Vercel does
  not run the pipeline (ADR-005).
- **Real phone photos** (EXIF-rotated JPEGs, Display-P3) were not tried. Only synthetic fixtures
  were: EXIF orientation 6, alpha, grayscale, and 16-bit.
- **The owner guide** has not been followed by a non-engineer.
- **The production deployment** (owner decision 1): I checked only its headers (200, CSP present), not
  its content.
- **CI** was not run on HEAD `43bdcc9`; it runs on the push of this handoff.

### Known Issues

- **CCR-1:** a `data:` font is blocked by `font-src 'self'`. The fix is proposed for `vite.config.ts`
  (manager-owned).
- **CCR-2:** hashing the built `index.html` differs from TASK-304's wording and needs the manager to
  acknowledge it.
- **CCR-3:** `/media` is `immutable` while its file names are not content-hashed, so a replaced image
  can stay stale for up to a year.
- **Vite config warning:** `plugins/seo.ts` imports `../src/content`, a directory. Vite warns that
  this breaks once its native config loader becomes the default. Importing `index.ts` directly would
  only move the problem to the extensionless imports inside `src/content`. Deferred; not urgent.
- **C-20 false alarms:** "todos" and hrefs such as `todo-app` are flagged. This is documented in the
  guide.
- **C-21 blind spot:** it misses a replacement image with an identical mean colour, such as a mirrored
  copy.
- **Visual calls, advisory:**
  - The favicon spreads the arms and legs slightly instead of using the rig's literal rest pose.
  - `og.jpg` has no text, because Pango ignored the Instrument Serif file.

### Commit

`agent/backend` at the commit that adds this handoff. It has 57 commits since baseline `3ea91a0`, each
a single change, and is pushed to `origin/agent/backend`.

## HANDOFF-2 — agent/backend — 2026-10-16

### Summary

TASK-305 is implemented, reviewed, fixed after review, and verified. It is set to `REVIEW`.

**What shipped (owner hold: committed locally only, no deploy, no push)**
- **StreetSafe: LA:** the window now shows the owner's screenshot.
- **Snake AI:** the window holds a 33.7 s H.264 recording plus its poster.
- **`npm run video`:** a new macOS AVFoundation script, with no ffmpeg and no new dependency.
- **Content rule C-22:** enforced, with tests.
- **Owner guide:** explains screenshots (crop to 16:10 first) and recordings.
- SagePlan and Revelation Youth stay empty, as specified.

**The MP4**
- `frontend/public/media/video/snake-ai.mp4`.
- **Codec and tracks:** H.264 (`avc1`), a single video track, no audio track.
- **Size:** 1270×954 (even), 33.7 s, **485,602 bytes**, against a 3,145,728-byte cap.
- **Streams while downloading:** `moov` comes before `mdat`.
- **Title-bar crop:** rows 0 to 50 removed. Row 51 is the measured first row of content.
- **Bottom row:** one corner row removed so the height is even.
- **Poster:** `frontend/media-src/projects/snake-ai.png`, frame 11.989 s (requested 12 s), the same
  crop, showing both the snake and the food.

### Tasks Completed

TASK-305: StreetSafe screenshot, Snake AI recording, `npm run video`, and C-22. Set to `REVIEW`.

- **B-06** (except the preview line, which the owner hold blocks):
  - `npm run video` turns `media-src/video/snake-ai.mov` into `public/media/video/snake-ai.mp4`
    (H.264, no audio, title bar cropped, ≤ 3 MB) and the poster `media-src/projects/snake-ai.png`;
  - `npm run media` then makes the poster renditions (640, 1024, 1270);
  - C-22 passes.
- **B-01, B-02, C-21 still pass.** `npm run media` run twice printed "0 written … manifest unchanged",
  and `git status` showed 0 changed paths.
  - `npm run media` and C-21 now skip `media-src/video/`. Before that change, putting the `.mov`
    there broke both of them. The fix was test-first.
- **C-22: one test per clause, on both bases.** There are 7 failing cases (video without image; bad
  `src`; missing file; over 3 MB; width not a positive integer; fractional height; `width < height`),
  each run on the real content and on the owner-edited content. There are also boundary tests at
  exactly 3 MiB, plus a test that `videoSizes` is optional.
- **`validateContent(content)` returns `[]`** for the real content, with the actual file sizes read
  from disk.
- **Evidence:** `docs/review/B-305-media.txt`. It holds:
  - the MP4's codec, dimensions, duration, size and audio check, from both `mdls` and the box parse;
  - the poster frame time;
  - the crop rows, measured on three source frames;
  - both PNGs' dimensions;
  - the test, typecheck, lint, build and contract output;
  - the poster's path.
- **Content values** match the task's text: the `streetsafe-la` and `snake-ai` screens.
  - `video: { src: '/media/video/snake-ai.mp4', width: 1270, height: 954 }`.
  - `site.updated` was already 2026-10-16, today in PDT, so it needed no bump. In UTC it is already
    2026-10-17.

### Files Changed

All on `agent/backend` since `12e9c35`, committed locally and not pushed (the commit count is under Commit).

**Media sources** (`frontend/media-src/`)
- `projects/streetsafe-la.png` (new): the screenshot cropped to 16:10.
- `video/snake-ai.mov` (new): byte-identical to the input recording.
- `video/snake-ai.json` (new): the measured crop and poster settings.
- `projects/snake-ai.png` (new): the poster.

**Generated output**
- `frontend/public/media/video/snake-ai.mp4` (new).
- `frontend/public/media/projects/*` (new): 18 renditions.
- `frontend/src/content/media.generated.ts` (regenerated).

**Scripts** (`frontend/scripts/`)
- `video.swift` (new).
- `video.test.mjs` (new): 13 tests.
- `mp4-boxes.mjs` and `mp4-boxes.d.mts` (new): a test utility that reads MP4 boxes.
- `media.mjs`: skips `media-src/video/`.
- `media.test.mjs`: plus 1 test.

**Content** (`frontend/src/content/`)
- `validate.ts`: C-22, and the `videoSizes` option.
- `content.contract.test.ts`: C-22 tests; the real-content gate reads file sizes; the C-11 fixture now
  derives its ids from the content.
- `media.contract.test.ts`: C-21 skips `video/`; recording checks added.
- `projects.ts`: the two screens.
- `README.md`: the owner guide.

**Other**
- `frontend/package.json`: the `"video"` script, which TASK-305 lists in its scope.
- `docs/review/B-305-media.txt`
- `docs/tasks/TASK-305-project-media.md` (status only) and `docs/tasks/INDEX.md`
- `docs/status/agent-backend.md`
- this file

**Untouched:** `types.ts`, `media.ts`, `index.html`, `vite.config.ts`, and every frontend component
or test. `git diff 12e9c35..HEAD` over them is empty.

### Contracts

- **`validateContent(c, opts?)`** gains an additive option:
  `videoSizes?: Readonly<Record<string, number>>`, mapping a URL to its size in bytes. The validator
  stays I/O-free, so C-22's file clauses run only when the caller passes it. The real-content gate
  does.
  - `RuleId` gains `'C-22'`. 3 MB is 3 × 1024 × 1024 bytes everywhere.
- **`npm run video`** (macOS only; it runs `swift -suppress-warnings scripts/video.swift`):
  - **Inputs:** `media-src/video/<id>.mov` plus `<id>.json`, which takes `cropTop`, `cropBottom`,
    `posterSeconds`, and the optional `cropLeft` and `cropRight`.
  - **Outputs:** `public/media/video/<id>.mp4` and `media-src/projects/<id>.png`.
  - **Failure:** all-or-nothing. It exits 1, prints `media-src/video/<file>: <reason>`, and leaves no
    partial files.
  - **Other files:** any file other than `.mov` in `media-src/video` is reported as a problem.
- **Not a contract change:** `media-src/video/` is invisible to `npm run media` and to C-21.
- **For frontend (TASK-110):**
  - `screen.video` is set on `snake-ai`. Its poster is the `projects/snake-ai` MediaAsset.
  - The `streetsafe-la` screenshot is exactly 16:10 (1533×958).
- **Dependencies:** none.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:test-driven-development | Start of TASK-305. The call returned "already loaded, instructions unchanged" | Each piece started with a failing test and then passed: the `media-src/video` skip; the C-21 skip, red only once the `.mov` was present; the 13 `npm run video` tests; C-22 with 14 failures; the review fixes with 5 failures. Mutation checks: a crop with no translate, cleanup removed, an orphan MP4, and a wrong declared width each turned the matching test red. |
| ecc:backend-patterns | Before writing `video.swift`. The call returned "already loaded, instructions unchanged" | Treat each run as a transaction. Encode the MP4 and the poster to dot-prefixed temporary files, check codec, audio and size, and only then `rename(2)` them into place, and only if every recording succeeded. A failed run removes its temporary files (fixed after review). |
| superpowers:requesting-code-review | Before the handoff, on `12e9c35..2fb25a6`. The call returned "already loaded, instructions unchanged" | A read-only reviewer independently verified the crop: the MP4 aligns with source row 51, and the poster is pixel-identical. Verdict "With fixes": 1 Important, 7 Minor. |
| superpowers:receiving-code-review | After that verdict. The call returned "already loaded, instructions unchanged" | Finding #1 (partial MP4 leak) was confirmed in the code before acting. Findings 1 to 8 were fixed, each with tests. The reviewer's "declined to judge" list was accepted. |
| superpowers:verification-before-completion | Immediately before this handoff. The call returned "already loaded, instructions unchanged" | Every result under Verification was produced fresh on `5c82dc8`. No implementation work followed. |

Every TASK-305 invocation returned "already loaded". The instructions in force are the ones loaded
earlier in this session and recorded under HANDOFF-1.

### Verification

Fresh on HEAD `5c82dc8`. Full detail is in `docs/review/B-305-media.txt`.

```
npm test                 exit 0   Test Files 48 passed (48), Tests 598 passed (598)   (video.test.mjs 13/13 ran on darwin)
npm run typecheck        exit 0
npm run lint             exit 0
npm run build            exit 0   index-BboVf9C3.js 264.03 kB (83.99 kB gzip); index-UMwyIuSq.css 24.37 kB (6.49 kB gzip)
scripts/contract-test.sh exit 0   5 files, 185 passed
npm run media (x2)       "4 image(s), 36 renditions (0 written, 0 stale removed), manifest unchanged."; git status clean
mdls snake-ai.mp4        H.264, Video only, 1270x954, 33.7 s, 485602 bytes
MP4 boxes                ftyp(28) moov(27484) mdat(458090); avc1; handlers: vide; tkhd 1270x954
crop rows (src frames)   0 s: row50=54 row51=0 | 12 s: row50=57 row51=0 | 30 s: row50=57 row51=0
decoded MP4 frames       1 s and 12 s: row 0 max 0 (no title bar)
poster                   11.989 s; re-made in a temp folder it is byte-identical to the committed PNG
scripts/audit-skills.sh  exit 0, "all claims corroborated by the transcript"; TASK-305 invocations at
                         TDD 78%, backend-patterns 80%, requesting/receiving review 90-92%, verification 97%
```

### What Was NOT Verified

- **B-06's preview line** (`/media/video/snake-ai.mp4` returns 200 with `video/mp4` on the preview).
  The owner's hold forbids deploying, so this was not checked.
- **The recording playing in the page.** TASK-110 (frontend) renders it: attention playback, poster,
  `contain` fit, reduced motion. I checked only the file, and I did not open it in a browser's
  `<video>` element.
- **Browser support for this exact encode.** It is H.264 High in MP4, which every current browser
  plays. I did not test Firefox or Safari.
- **Running the video tests in CI.** `video.test.mjs` is skipped off macOS, and CI is Linux. The 13
  tests ran only on this Mac (macOS 26, Swift 6.3.3).
- **Older macOS.** The AVFoundation calls used are back-deployed, according to the reviewer's SDK
  check. I did not run the script on anything older than macOS 26.
- **The MP4 is not byte-identical between runs.** Only its size and contents were checked. ADR-012
  accepts this.
- **The owner guide's recording steps** have not been followed by the owner. That includes measuring
  `cropTop`, Shift-Command-5's "selected portion", and QuickTime's trim and export.
- **The two corner pixels.** About 7 faint grey corner pixels remain in the MP4's bottom rows. I judged
  them invisible on black, but no visual review in the page has been done.

### Known Issues

- **The poster jumps.** The poster is the 11.989 s frame, but playback starts at 0 s, so the picture
  changes the moment the video starts. This is the frontend's decision (TASK-110). If it matters,
  start playback at the poster time, or pick a poster near the start.
- **The poster carries a Rec.709 ICC profile,** inherited from the HEVC source. sharp converts it to
  sRGB for the renditions.
- **The output is 60 fps,** the source's rate. The file is far below the size cap.
- **The C-22 file clauses need `videoSizes`.** Called without it, `validateContent` checks only the
  shape. The only real call, the contract gate, passes it.
- **This branch edits the shared `docs/tasks/INDEX.md`,** because `scripts/tasks.sh` regenerates it
  whenever a task status changes. The manager may prefer to regenerate it at integration instead.

### Commit

`agent/backend` at the commit that adds the audit result to this handoff, which builds on
`5c82dc8`. There are 29 commits since `12e9c35`, this one included. Committed locally only; not
pushed, because of the owner's hold.

## HANDOFF-3 — agent/backend — 2026-10-16

### Summary

TASK-305 follow-up for the manager's contract change `13d778b`: `ProjectVideo.posterTime` (ADR-012
amendment). TASK-305 stays in `REVIEW`. Committed locally only; not pushed (owner hold).

- **Content:** the `snake-ai` video now has `posterTime: 11.989`, the poster's exact frame time as
  `npm run video` reports it.
- **C-22:** `posterTime`, when present, must be a finite number ≥ 0. Test-first: the tests failed in
  `1a5755f`, and the rule went green in `bf447e6`.
- **`npm run video`** now also prints the line to paste into `projects.ts`, for example:
  `video: { src: '/media/video/snake-ai.mp4', width: 1270, height: 954, posterTime: 11.989 }`.
  - `posterTime` is rounded to the millisecond. Seeking there shows the same frame: the frame starts
    at 11.98867 s and lasts 16.7 ms at 60 fps.
  - Test-first: the test failed in `c22bce1`, and the script went green in `0dc964d`.
- **Owner guide:** step 4 shows the printed line, and step 7 says to paste it and explains
  `posterTime`. The C-22 row mentions `posterTime`.

### Tasks Completed

TASK-305 (still `REVIEW`). The follow-up's three items:
1. **`posterTime` set** in `projects.ts`.
2. **C-22 clause, one test per case on both bases:** a negative value, NaN, and Infinity are each
   flagged at `projects[0].screen.video.posterTime`; 11.989 is accepted.
3. **Poster time printed** in the paste-ready line, and documented in the guide.

### Files Changed

- `frontend/src/content/projects.ts`
- `frontend/src/content/validate.ts`
- `frontend/src/content/content.contract.test.ts`
- `frontend/scripts/video.swift`
- `frontend/scripts/video.test.mjs`
- `frontend/src/content/README.md`
- this file
- `docs/status/agent-backend.md`

The MP4 and the poster are unchanged. I ran `npm run video` once to show the printed line. That
re-encoded the MP4, which ADR-012 says is never byte-identical (it came out the same size,
485,602 B), so I restored the committed, already-verified file with `git checkout --`. The poster
came out byte-identical.

### Contracts

- **No new contract.** This implements the manager's `13d778b` (`types.ts` `posterTime?`, and C-22 in
  DATABASE.md).
- **`npm run video` output** gains a second line per recording:
  `  for projects.ts: video: { ... }`.

### Skills Used

| Skill | Stage invoked | What it actually changed |
|---|---|---|
| superpowers:test-driven-development | Before the `posterTime` tests. The call returned "already loaded, instructions unchanged" | Six failures on both bases, then the rule. The printed-line test failed first, then the script. |
| superpowers:verification-before-completion | Immediately before this handoff. The call returned "already loaded, instructions unchanged" | Everything under Verification was produced fresh on `45ccb94`. No implementation work followed. |

### Verification

Fresh on HEAD `45ccb94`:

```
npm test                 exit 0   Test Files 48 passed (48), Tests 606 passed (606)   (video.test.mjs ran on darwin)
npm run typecheck        exit 0
npm run lint             exit 0
npm run build            exit 0
scripts/contract-test.sh exit 0   5 files, 193 passed
npm run media (x2)       "4 image(s), 36 renditions (0 written, 0 stale removed), manifest unchanged."; git status clean
```

### What Was NOT Verified

- **The first play starting at `posterTime`** in the page. That is TASK-110's playback code. I only
  checked the value and that the frame lands correctly: 11.989 s falls inside the frame shown in the
  poster.
- **The preview** (owner hold), and Firefox and Safari, as before.

### Known Issues

- None new. The HANDOFF-2 notes still apply, except "the poster jumps", which `posterTime` resolves
  once TASK-110 honors it.

### Commit

`agent/backend` at the commit that adds this handoff. Committed locally only; not pushed (owner hold).
