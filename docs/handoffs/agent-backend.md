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
