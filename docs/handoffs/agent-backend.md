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
