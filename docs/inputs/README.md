# Inputs — source material for the manager

Drop anything the manager should plan from in this folder: resume, project
write-ups, ideas, screenshots, mood/reference images, sites you like, copy
drafts, links (paste them into a `.md` or `.txt` file).

**Everything here except this README is gitignored.** It stays on this machine
and never enters the repo history, so a public portfolio repo cannot leak a raw
PDF or personal document. What gets committed is what the manager distills from
it: `docs/PRODUCT.md`, `docs/DESIGN_BRIEF.md`, the task files, and so on.

## Rules

- The manager reads every file here at the start of planning and lists what it
  read in `docs/status/main.md`.
- Worker worktrees do NOT see this folder. If a file here becomes part of the
  site (a background image, a headshot, a resume PDF for download), the manager
  writes a task that copies the chosen, final version into the tracked asset
  directory. Raw inputs are never referenced by path from site code.
- Add new material at any time. Tell the manager it is there; it re-reads the
  folder and records what changed.
