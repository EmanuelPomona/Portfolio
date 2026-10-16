# Emanuel Ling: portfolio

A one-page portfolio. A tiny hand-drawn stickman is the cursor, walking through misty
black-and-white mountains, and projects and photos come into color only when you pay attention
to them. It is a static Vite + React + TypeScript site on Vercel.

## Run it

```bash
scripts/bootstrap.sh     # installs deps, writes .env with this worktree's port
source .env
npm run dev              # http://localhost:$FRONTEND_PORT   (add ?loader=1 to replay the loader)
                         # stickman lab: http://localhost:$FRONTEND_PORT/stickman-lab.html
npm test                 # unit + contract tests
npm run build            # frontend/dist
```

## Edit content or add images

- **Text:** `frontend/src/content/`
- **Images:** drop them into `frontend/media-src/`, run `npm run media`, then point the content
  at them.

Step-by-step guide: `frontend/src/content/README.md`.

## How this repo is built

The site is built by several Claude Code agents in separate git worktrees, under
`docs/AGENT_PROTOCOL.md`.

| Topic | File |
|---|---|
| What and why | `docs/PRODUCT.md`, `docs/superpowers/specs/2026-10-16-portfolio-design.md` |
| Design problem | `docs/DESIGN_BRIEF.md`, plus `docs/reference/` (wireframes, stickman prototype) |
| Architecture and ownership | `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` |
| Contracts | `docs/API.md`, `docs/DATABASE.md` |
| Done means | `docs/ACCEPTANCE.md` |
| Work | `docs/tasks/INDEX.md`, `docs/superpowers/plans/2026-10-16-portfolio-v1.md` |
