---
id: TASK-304
title: Vercel config, security headers, and the preview deployment
status: BLOCKED
owner: backend
branch: agent/backend
priority: HIGH
round: 0
depends_on: [TASK-303]
blocked_on: contract
---

# TASK-304: Vercel config, security headers, and the preview deployment

## Objective

Give the reviewer and the owner a deployed preview URL. Lock in the security headers and caching,
including a CSP that allows the contract's inline gate script and boot-cover style **by hash**,
and a contract test that fails if anyone changes those inline blocks without updating the hash.

## Scope

- **Create:**
  - `vercel.json`, at the repo root.
  - `frontend/plugins/csp.contract.test.ts`. The "contract" in the name puts it in
    `npm run test:contract`.
- **Modify:** `frontend/src/content/site.ts`, to set `origin` to the project's production domain
  once Vercel reports it, and bump `updated`.
- **Report:** the preview URL, in `docs/handoffs/agent-backend.md`. The manager records it in
  `.env.example` and `docs/ARCHITECTURE.md`.

## Interfaces

**Consumes**
- The verbatim gate `<script>` and boot-cover `<style>` in `frontend/index.html` (API.md §2.4).
- The `npm run build` output `frontend/dist`.

**Produces**
- `vercel.json` with:
  - `"buildCommand": "npm run build"`
  - `"outputDirectory": "frontend/dist"`
  - `"installCommand": "npm ci"`
  - `"framework": null`
  - `cleanUrls`
- **Headers on `/(.*)`:**
  - `Content-Security-Policy`: `default-src 'self'`; `script-src 'self' 'sha256-<gate>'`;
    `style-src 'self' 'sha256-<boot-style>'`; `img-src 'self' data:`; `font-src 'self'`;
    `connect-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'none'`;
    `frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Caching (ADR-009):** `Cache-Control: public, max-age=31536000, immutable` on `/assets/(.*)`;
  `public, max-age=0, must-revalidate` on `/media/(.*)`, whose names are not content-hashed.

## Acceptance Criteria

- [ ] **B-05:** `curl -sI <preview>/` shows every header above, `/assets/...` shows
      `immutable`, and `/media/...` shows `must-revalidate`.
- [ ] **B-04:** `/favicon.svg`, `/og.jpg`, `/robots.txt`, and `/sitemap.xml` return 200 on the
      preview. The sitemap needs `origin` set.
- [ ] **CSP contract test:** it builds the site, extracts the inline gate script and boot-cover
      style from the **built** `index.html` (ADR-008: Vite minifies the style), checks the built gate
      equals the source gate, computes `sha256` in base64, and asserts both hashes appear in
      `vercel.json`'s CSP. The test name is
      `vercel CSP allows exactly the index.html inline gate and boot style`.
- [ ] The preview loads with **zero CSP violations caused by the site** in the console. The Vercel
      Toolbar script that Vercel injects into previews is not the site's; turning it off is an owner
      setting:
  - the loader runs (`?loader=1`);
  - fonts and media load;
  - JSON-LD is a data block and is not executed.

  Save the console as `docs/review/B-304-console.txt`.
- [ ] **F-01:** mobile Lighthouse on the preview, saved as `docs/review/B-304-lighthouse-mobile.html`,
      with scores pasted into the handoff. It may fall short only on frontend-owned causes; name
      them if so.

## Steps

1. TDD the CSP contract test against a hand-computed hash, then write `vercel.json`. Commit.
2. **Deployment needs the owner's Vercel login.**
   - If `vercel whoami` fails, set this task to `status: BLOCKED` with
     `blocked_on: credential`.
   - Write under `## Blocked on` in your status file:
     "owner must run `npx vercel login` once in this worktree".
   - Commit, push, and continue with anything else. This is the protocol's blocker path; do not
     invent a workaround.
3. Once logged in:
   - `npx vercel link` (project name `emanuel-ling`), then `npx vercel deploy` (a **preview**,
     never `--prod`);
   - record the URL;
   - set `site.origin` to the production domain shown by `npx vercel project inspect`,
     redeploy, and verify.

   Commit `site.ts`.
4. Run the header, asset, and console checks and Lighthouse, save the evidence, and commit.

## Notes

- **Skills:** `vercel:deploy`, `vercel:vercel-cli`, `ecc:security-review` (for the headers and
  CSP). Before handoff: `superpowers:requesting-code-review` and
  `superpowers:verification-before-completion`.
- Production deploys are the owner's decision to ship, so this task never runs `--prod`.
- The preview deploys whatever is on `agent/backend`: the walking skeleton plus your work. That
  is enough to verify headers and assets. The manager redeploys after integration for the full
  review.

## Integration notes

- **Round 1 (manager):** CCR-1 approved as ADR-008. `vite.config.ts` never inlines fonts
  (`d1fd0cc`, with `plugins/font-inlining.contract.test.ts`). CCR-2 approved as ADR-008; the test
  already hashes the built blocks. CCR-3 resolved by option (b) as ADR-009 (`665e7cd`). The manager
  redeploys a preview from integrated `main` for the full review (see Notes).

## Review History

| Round | Verdict | Summary |
|---|---|---|
