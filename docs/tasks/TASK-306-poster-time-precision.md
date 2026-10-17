---
id: TASK-306
title: posterTime lands on the poster's exact MP4 frame
status: BACKLOG
owner: backend
branch: agent/backend
priority: LOW
round: 0
depends_on: [TASK-305]
blocked_on: ""
---

# TASK-306: posterTime lands on the poster's exact MP4 frame

## Objective

Raised by frontend in TASK-110 (HANDOFF-4, Known Issue 1). `frontend/scripts/video.swift` takes the
poster time from the source `.mov` timeline and rounds it to the nearest millisecond. The exported
MP4 sits on a 60 fps grid, so `posterTime` can land up to 0.5 ms before the poster's frame. With the
shipped Snake AI asset it is invisible (the poster at 11.989 s is on its frame), but a future poster
on a game-tick boundary would show the previous tick for the first frame of the first play.

## Scope

- **Modify:** `frontend/scripts/video.swift`, `frontend/scripts/video.test.mjs`.

## Acceptance Criteria

- [ ] The poster is taken from the **written MP4**, and the printed `posterTime` is the MP4 frame's
      presentation time rounded **up** to the millisecond.
- [ ] A test with a fixture whose requested poster time falls between two frames shows the printed
      `posterTime` selects the poster's frame, not the one before it.
- [ ] Re-running `npm run video` on `snake-ai.mov` keeps `posterTime: 11.989` (or the content and
      the poster are updated together, in one commit).

## Notes

- Not urgent: no shipped asset is affected. Start only after the owner's publishing hold lifts or
  when a new recording arrives, whichever is first.

## Review History

| Round | Verdict | Summary |
|---|---|---|
