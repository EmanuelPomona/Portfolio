# backend/

Intentionally empty. This project has **no runtime backend** (docs/DECISIONS.md, ADR-001).

The `agent/backend` worktree owns the build-time and data side instead: the content module
(`frontend/src/content/`), the media pipeline (`frontend/scripts/media.mjs`), head metadata
(`frontend/plugins/seo.ts`), and deployment (`vercel.json`). See docs/ARCHITECTURE.md.
