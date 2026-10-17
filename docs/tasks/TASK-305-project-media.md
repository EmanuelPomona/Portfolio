---
id: TASK-305
title: StreetSafe screenshot, Snake AI recording, npm run video, and C-22
status: REVIEW
owner: backend
branch: agent/backend
priority: HIGH
round: 0
depends_on: [TASK-302, TASK-301]
blocked_on: ""
---

# TASK-305: StreetSafe screenshot, Snake AI recording, `npm run video`, and C-22

## Objective

The owner supplied the first real project media and asked to replace the empty windows with it.
Ship both, within the contract in ADR-012, `docs/API.md` §1 and §3 ("Project recordings"), and
`docs/DATABASE.md` (`screen.video`, C-22). SagePlan and Revelation Youth stay empty.

**Owner hold:** "dont actually connect the website for now". Do **not** deploy (no `vercel` calls)
and do **not** push. Commit locally only.

## Inputs (gitignored; copy, never reference)

- `docs/inputs/Screenshot 2026-10-14 at 4.56.11 PM copy.png`. The name contains a narrow
  no-break space (U+202F) before "PM": use a glob (`docs/inputs/Screenshot*`). 1920×958 RGBA,
  StreetSafe: LA (map, markers, "25 reports" list).
- `docs/inputs/Untitled 2.mov`: Snake AI. QuickTime, **HEVC**, 1270×1006, 33.7s, 818 KB. The top of
  every frame is the recorded app's own macOS title bar ("Snake RL"), about 50px.

## Scope

- **Create:**
  - `frontend/media-src/projects/streetsafe-la.png`: the screenshot **cropped to x 387..1920,
    y 0..958** (1533×958, 16:10, anchored right; ADR-012), alpha flattened as the pipeline does.
  - `frontend/media-src/video/snake-ai.mov`: the recording, copied unchanged (the committed source).
  - `frontend/scripts/video.swift` (or a `.mjs` wrapper around it) and the `"video"` script in
    `frontend/package.json` (root already proxies `npm run video`). For each
    `media-src/video/<id>.mov` it writes:
    - `frontend/public/media/video/<id>.mp4`: H.264, no audio track, the title bar cropped off (find
      the exact first row of the app's content, do not guess), even dimensions, at most 3 MB;
    - `frontend/media-src/projects/<id>.png`: the poster, one frame where the snake and the food are
      both visible, with the identical crop.
    It prints what it wrote and exits non-zero on any failure, writing nothing partial.
  - The renditions and manifest entries from `npm run media` for both PNGs.
- **Modify:**
  - `frontend/src/content/projects.ts`: `streetsafe-la` and `snake-ai` screens (values below).
  - `frontend/src/content/validate.ts` and `content.contract.test.ts`: rule **C-22**.
  - `frontend/src/content/README.md` (owner guide): how to add a screenshot (crop to 16:10 first)
    and a recording (`npm run video`, macOS only).
- **Never:** `types.ts`, `media.ts`, `index.html`, `vite.config.ts`, any frontend component or test.

## Content values

- `streetsafe-la`: `screen: { image: 'projects/streetsafe-la', alt: 'Street-Safe: LA map of Los Angeles with orange hazard markers beside a list of 25 recent reports' }`
- `snake-ai`: `screen: { image: 'projects/snake-ai', alt: 'The trained agent playing Snake: a green snake chasing a red square on a black field', video: { src: '/media/video/snake-ai.mp4', width: <encoded width>, height: <encoded height> } }`
- Bump `site.updated` to today.

## Acceptance Criteria

- [ ] **B-06** (`docs/ACCEPTANCE.md`), except the preview line (owner hold: no deploy).
- [ ] **B-01, B-02, C-21** still pass: `npm run media` twice leaves `git status` clean.
- [ ] **C-22** has one-violation-per-clause tests on both bases, as TASK-301's rules do:
      video without image; bad `src` pattern; missing file; file over 3 MB; non-positive or
      fractional `width`/`height`; `width < height`.
- [ ] `validateContent(content)` returns `[]` for the real content.
- [ ] Evidence `docs/review/B-305-media.txt`: the MP4's codec, dimensions, duration, size, and
      no-audio (from AVFoundation or `mdls`); the poster frame time; the crop rows; both PNGs'
      dimensions; and `npm test`, typecheck, lint, build output. Attach the poster PNG path.

## Notes

- **Skills:** `superpowers:test-driven-development` (C-22 first, red, then the rule);
  `ecc:backend-patterns` for the script's all-or-nothing writes; before handoff
  `superpowers:requesting-code-review` and `superpowers:verification-before-completion`.
- AVFoundation route: `AVAssetExportSession` with an `AVMutableVideoComposition` whose crop is a
  transform plus `renderSize`, preset `AVAssetExportPresetHighestQuality` (H.264, not the HEVC
  presets), `fileType .mp4`, `shouldOptimizeForNetworkUse = true`, video track only.
  `AVAssetImageGenerator` for the poster with tolerance zero.
- `/media/video/*` is already covered by the `/media` cache rule and the CSP's `default-src 'self'`.
- Frontend renders the window (TASK-110) in parallel against a fixture; the manager syncs your
  merged assets to frontend for real-content evidence.

## Review History

| Round | Verdict | Summary |
|---|---|---|
