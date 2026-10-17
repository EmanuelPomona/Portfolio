---
id: TASK-107
title: Photographic clouds drifting through the page
status: IN_PROGRESS
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-101, TASK-102]
blocked_on: ""
---

# TASK-107: Photographic clouds drifting through the page

## Objective

The owner asked: "Clouds should be hovering slightly within the page." Today only the hero's fog
drifts. Give the Projects, About, and Contact backgrounds two or three slow cloud layers, cut from the
owner's photographs, drifting behind the content (brief "Motion vocabulary", ADR-011).

## Scope

- **Create:** `frontend/src/components/Clouds/{Clouds.tsx,Clouds.module.css,Clouds.test.tsx}`.
- **Modify:** `frontend/src/components/Section/*` (render the layers behind the content), and, if
  the hero's pause logic is extracted to share it, `frontend/src/sections/Hero/*` plus a new hook in
  `frontend/src/hooks/` with its test.
- **Never:** new files in `media-src/` or `public/` (backend-owned), `index.html`, contract files.

## Interfaces

**Consumes:** `getMedia(id)` for `backgrounds/alpine-valley` and `backgrounds/evergreen-forest`,
using the same URLs the page already loads (no extra request); `usePrefersReducedMotion`.

**Produces:** `Clouds` (props of your choosing, documented in the file header), used only by
`Section`. Each layer root carries `data-drift="running" | "paused" | "off"`.

## Acceptance Criteria

- [ ] **M-01**, **M-02**, and the X-02 and F-02/F-03 parts of **M-05**, as written in `docs/ACCEPTANCE.md`.
- [ ] Hero drift (**H-02**) is unchanged.
- [ ] Tests, by name:
  - `renders aria-hidden, pointer-events-none cloud layers from an existing MediaId`
  - `uses the same image URL as the section backdrop, so no new request is made`
  - `pauses the drift while its section is out of view`
  - `pauses the drift while the tab is hidden`
  - `renders static layers under reduced motion`
  - `animates transform only, on a cycle of at least 60s` (assert from the CSS source, as BrowserWindow.test does)
- [ ] Evidence: `docs/review/F-107-clouds-1440-t0.png` and `-t10.png` (same scroll position, 10s
      apart), `F-107-clouds-390.png`, and the X-02 caption/lede contrast numbers re-measured at 390,
      768, 1440 with the layers at both ends of their drift, pasted in the handoff.

## Steps

1. Invoke `animate` before choosing the drift (purpose, property, curve, duration); record its answer.
2. TDD the six tests above, one at a time; commit each passing step.
3. Wire into `Section`; check in the browser at 1440/768/390; tune opacity until X-02 holds. Commit.
4. Capture evidence. Commit.

## Notes

- Skills: `animate`, `superpowers:test-driven-development`, `ecc:browser-qa`; before handoff
  `superpowers:requesting-code-review`, `superpowers:verification-before-completion`.
- "Slightly" is the owner's word: a few tens of pixels per cycle, low opacity, the photo's own fog
  regions (masked with the existing alpha-mask technique). If you have to look for it, it is right.

## Review History

| Round | Verdict | Summary |
|---|---|---|
