---
id: TASK-302
title: Deterministic media pipeline (npm run media) and manifest freshness test
status: IN_PROGRESS
owner: backend
branch: agent/backend
priority: HIGH
round: 0
depends_on: []
blocked_on: ""
---

# TASK-302: Deterministic media pipeline (npm run media) and manifest freshness test

## Objective

Replace the `npm run media` stub with the sharp pipeline specified in API.md §3. It turns
`frontend/media-src/**` into responsive AVIF, WebP, and JPEG renditions plus the typed manifest.
Then regenerate the two background photos with it.

## Scope

- **Modify:** `frontend/scripts/media.mjs`, the stub.
- **Create:**
  - `frontend/scripts/media-lib.mjs`: pure helpers.
  - `frontend/scripts/media.test.mjs`: unit and integration tests.
  - `frontend/src/content/media.contract.test.ts`: C-21, the freshness check.
- **Regenerate:** `frontend/public/media/**` and `frontend/src/content/media.generated.ts`.
  Delete the scaffold's `*-1672.jpg` and `*-1024.jpg` single renditions if the plan no longer
  produces them.
- **Do not edit:** `media.ts` (contract).

## Interfaces

**Consumes:** sharp 0.35.5 (already installed); the `MediaAsset` shape in `src/content/media.ts`.

**Produces**
- `mediaIdFromPath(rel: string): string`
  - `'projects/sageplan.png'` gives `'projects/sageplan'`.
  - It throws `Error("media-src/<rel>: name must be lowercase kebab-case")` on anything matching
    neither `^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*\.(png|jpe?g|webp)$`.
- `planWidths(originalWidth: number): number[]`
  - Takes the subset of `[640, 1024, 1600, 2400]` that is at most `originalWidth`, plus
    `originalWidth` itself when it is not in the set and exceeds the largest kept step.
  - The result is sorted ascending.
- `renditionPath(id: string, width: number, ext: 'avif' | 'webp' | 'jpg'): string`, for example
  `/media/projects/sageplan-1024.avif`.
- **CLI:** `node scripts/media.mjs [--src media-src] [--out public/media] [--manifest src/content/media.generated.ts]`.
  The flags exist for tests.
- **Manifest:** keys sorted; `sources` ordered avif, then webp; `fallback.src` is the largest
  JPEG; `placeholder` is the mean color as `#rrggbb`; written atomically (temp file, then
  rename). The file header comment stays.

## Acceptance Criteria

- [ ] **B-02:** a second run leaves `git status` clean. In a temp dir, adding a fixture creates
      the renditions and its manifest entry, and deleting it removes them (stale-output
      cleanup).
- [ ] **C-21:** `media.contract.test.ts` (node environment) asserts:
  - every file in `media-src/` has a manifest entry;
  - every entry's renditions exist under `public/media/`;
  - every non-null `image` in content points at an entry.
- [ ] Width plans:
  - the alpine background (1672 wide) produces widths 640, 1024, 1600, and 1672;
  - the evergreen background (1024 wide) produces 640 and 1024.
- [ ] The hero AVIF at 1600w is ≤ 250 KB (budget). Paste `ls -l` output into the handoff.
- [ ] Encoder settings are documented in the script header: AVIF quality, WebP quality, JPEG
      quality with mozjpeg, and `effort`.
- [ ] **Tests:**
  - `mediaIdFromPath accepts kebab paths and rejects "My Photo.PNG"`
  - `planWidths(1672) = [640,1024,1600,1672]`
  - `planWidths(1024) = [640,1024]`
  - `planWidths(500) = [500]`
  - `planWidths(3000) = [640,1024,1600,2400]`
  - `pipeline is byte-deterministic across two runs` (hash every output)
  - `stale outputs are removed`
  - `a failing source leaves the previous manifest intact`

## Steps

1. Invoke `superpowers:test-driven-development`. Write the helper tests first, then the helpers.
   Commit.
2. Write the pipeline integration tests against a temp fixture dir: create two tiny images with
   sharp inside the test. Then the pipeline. Commit.
3. Run it on the real `media-src/`, commit the regenerated outputs separately
   (`chore: regenerate media renditions`), and confirm `npm run build` and the frontend still
   render the hero.
4. Write the C-21 contract test. Commit.

## Notes

- **Skills:** `superpowers:test-driven-development`, `ecc:error-handling`. Before handoff:
  `superpowers:requesting-code-review` and `superpowers:verification-before-completion`.
- **Determinism:** fix the encoder options, strip metadata, process files in sorted order, and
  never embed timestamps. If one sharp format is not byte-stable on this platform, say so in the
  handoff and fall back to content-hash comparison of decoded pixels for that format. Do not
  silently skip the test.
- The hero is decorative. No `alt` belongs in the manifest; alt text lives in content.

## Review History

| Round | Verdict | Summary |
|---|---|---|
