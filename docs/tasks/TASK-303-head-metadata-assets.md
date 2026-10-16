---
id: TASK-303
title: Head metadata plugin, favicon, Open Graph image, robots, sitemap
status: IN_PROGRESS
owner: backend
branch: agent/backend
priority: MEDIUM
round: 0
depends_on: []
blocked_on: ""
---

# TASK-303: Head metadata plugin, favicon, Open Graph image, robots, sitemap

## Objective

When a recruiter pastes the link into Slack, LinkedIn, or iMessage, it should show a real title,
description, and image, and search engines should get the right signals.
- Implement `seoPlugin()` (API.md §5).
- Add the static share assets.

## Scope

- **Modify:** `frontend/plugins/seo.ts`, the stub.
- **Create:**
  - `frontend/plugins/seo.test.ts`
  - `frontend/public/favicon.svg`
  - `frontend/scripts/og.mjs`: a one-off generator, documented in the script header.
  - `frontend/public/og.jpg`
- **Emitted at build by the plugin:** `robots.txt` and `sitemap.xml`. They are not hand-written
  files.

## Interfaces

**Consumes:** `site`, `contact` from `src/content`; the Vite `Plugin` type.

**Produces**
- `renderHead(site: Site, links: readonly Link[]): string`. Pure; an HTML string of head tags.
- `buildJsonLd(site: Site, links: readonly Link[]): Record<string, unknown>`, a schema.org
  `Person`:
  - `name`, and `url` (= `site.origin`, when set);
  - `sameAs` = the LinkedIn and GitHub hrefs;
  - `affiliation: { "@type": "CollegeOrUniversity", "name": "Pomona College" }`.
- `seoPlugin(opts?: { site?: Site; links?: readonly Link[] }): Plugin`
  - `transformIndexHtml` replaces the fallback `<title>` and injects `renderHead`'s output.
  - `generateBundle` emits `robots.txt`, always, with a `Sitemap:` line only when `site.origin`
    is set, and emits `sitemap.xml` only when `site.origin` is set.

## Acceptance Criteria

- [ ] **B-03:** the built `dist/index.html` contains:
  - `<title>` equal to `site.title`;
  - meta description;
  - `og:title`, `og:description`, `og:type=website`, `og:image` (absolute when `origin` is set,
    otherwise root-relative);
  - `twitter:card=summary_large_image`;
  - `theme-color` `#e3e8e5`;
  - `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`;
  - exactly one JSON-LD block that parses.
- [ ] **B-04**, for the files: `favicon.svg`, `og.jpg` (1200×630, under 200 KB), and
      `robots.txt` exist in `dist/`, and `sitemap.xml` exists when `origin` is set.
- [ ] **favicon.svg** is the stickman's standing pose as a 1.8px-equivalent charcoal line drawing
      on a transparent ground, with a dark-mode variant via `prefers-color-scheme` inside the SVG.
      Use the proportions in TASK-201's rig: legs 8+8, torso 13.2, head radius 3.9, in a 40-unit
      box.
- [ ] **og.jpg** is a crop of the alpine photograph. Text is optional: if `og.mjs` cannot
      typeset Instrument Serif reliably, ship it without text. Never use a system fallback font
      for the name.
- [ ] **Tests:**
  - `renderHead escapes quotes and angle brackets`
  - `omits canonical and og:url when origin is empty`
  - `includes canonical when origin is set`
  - `JSON-LD parses and sameAs has LinkedIn and GitHub`
  - `no em dash in any emitted string`
  - `robots.txt without Sitemap line when origin is empty`

## Steps

1. Invoke `superpowers:test-driven-development`. TDD `renderHead` and `buildJsonLd`. Commit.
2. Wire the plugin hooks, build, and inspect `dist/index.html`. Commit.
3. `favicon.svg`. Commit.
4. `og.mjs`, then `og.jpg`. Commit.

## Notes

- **Skills:** `superpowers:test-driven-development`, `ecc:seo`. Before handoff:
  `superpowers:requesting-code-review` and `superpowers:verification-before-completion`.
- Do not edit `index.html`; it is frontend-owned. The plugin is the only way you touch the head.

## Review History

| Round | Verdict | Summary |
|---|---|---|
