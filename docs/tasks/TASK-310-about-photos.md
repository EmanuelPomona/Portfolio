---
id: TASK-310
title: Fill the About photo wall with the owner's 10 photos
status: REVIEW
owner: backend
branch: agent/backend
priority: HIGH
round: 0
depends_on: [TASK-111, TASK-309]
blocked_on: ""
---

# TASK-310: Fill the About photo wall with the owner's 10 photos

## Objective

The owner uploaded the About photos and asked for them to fill the wall: "There are more images than
rectangles right now but just make more rectangles". Replace today's five empty slots with **all 10
photos**. The wall (TASK-111) recomposes itself from `about.photos` and supports up to 12, so no layout
code changes; this is media and content only. ASAP.

**Owner instructions for this task:** essential tests only, once (no repeated QA loops, no
code-review dispatch for this content change). **One commit** for the whole task (protocol §24,
revised today), status and handoff included in it. No deploy, no push.

## Inputs (gitignored; copy, never reference)

`docs/inputs/Pictures for portfolio/` (10 files):
- 8 HEIC, 4032×3024 as stored (check EXIF orientation: some may be portrait):
  `IMG_2882`, `IMG_3316`, `IMG_3826`, `IMG_4379`, `IMG_5111`, `IMG_5445`, `IMG_5642`, `IMG_5644` (3088×2316)
- `38D04DF0-90B6-4BD3-BEBF-F2B830883773.PNG` (1536×1024)
- `IMG_5675.jpg` (1179×2091)

## Scope

- **Create:** `frontend/media-src/about/photo-1.jpg` … `photo-10.jpg` (the PNG may stay PNG):
  - convert HEIC with macOS `sips` (no new dependency); apply the EXIF orientation so pixels are
    upright;
  - **strip all metadata, especially GPS location** (these are phone photos and the sources are
    committed and published); verify none remains;
  - downscale so the long edge is at most 2400px (the pipeline's largest width); JPEG quality ~85.
- Run `npm run media` for the renditions and manifest.
- **Modify:** `frontend/src/content/about.ts`: `photos` becomes 10 entries `photo-1` … `photo-10`,
  ordered by capture date, oldest first. Each has `image: 'about/photo-N'`, `aspect` set to the
  nearest `PhotoAspect` of the upright image, `alt` written from looking at the photo (C-09: concrete,
  at least 8 characters, never just "photo"), and `caption: null` (the owner adds captions later).
  `site.updated` to today.

## Acceptance Criteria

- [ ] C-09, C-11, C-17 (≤ 12), C-21 pass; `validateContent(content)` returns `[]`.
- [ ] No GPS or other EXIF in any committed source (show the check's output).
- [ ] `npm test`, typecheck, lint, build, `scripts/contract-test.sh` exit 0 (run once).
- [ ] `npm run media` twice: the second writes 0.
- [ ] `docs/review/B-310-media.txt`: each photo's source file, capture date, upright size, aspect,
      largest AVIF bytes; the metadata check.

## Notes

- The wall is frontend's; if a photo looks badly cropped in its tile, say which one in the handoff,
  don't change layout code.
- Skills: `superpowers:verification-before-completion` before handoff (once).

## Review History

| Round | Verdict | Summary |
|---|---|---|
