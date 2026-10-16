# STATUS: agent/backend
Task: TASK-301 (then 302, 303, 304 in order)
Round: 0
Last updated: 2026-10-16T18:00:00Z

## Skills invoked so far
- ecc:contract-first @ TASK-301 start, before validator -> shapes imported from types.ts (no redeclared copies); DATABASE.md is the invariant source; provider check = validate the real exported `content`; fixtures JSON-cloned because heroLinks/contact.links share refs (structuredClone would double-count)
- superpowers:test-driven-development @ TASK-301 start -> per-rule violating fixture with literal {rule, path}, watched red before each impl; commits grouped by rule family
- ecc:error-handling @ TASK-301 start -> validator returns typed {rule, path, message} list (Result style), never throws on content, collects all violations; URL parse errors become violations; messages say what is wrong + how to fix, for a non-engineer
- ecc:backend-patterns @ TASK-302 start, before pipeline design -> pure helpers (media-lib.mjs) split from I/O (media.mjs); run is transaction-like: validate all names + encode everything in memory, touch disk only if every source succeeded, manifest written last via temp+rename; decode each source once
- ecc:error-handling @ TASK-302 start (re-invoked; harness answered "already loaded, instructions unchanged", applied from that load) -> known failures print `media-src/<rel>: <reason>` to stderr without stack + exit 1; unexpected errors print stack; all sources attempted so one run lists every problem
- superpowers:systematic-debugging @ TASK-302 step 3 (browser probe stuck "pending") -> root cause: img.decode() never resolves in headless Chrome here (no display link, CVDisplayLinkCreateWithCGDisplay failed); onload works. Environmental, not a product bug.
- ecc:seo @ TASK-303 start, before renderHead -> self-referencing canonical `${origin}/` only when origin set; robots allows all + Sitemap line only with origin; sitemap = the one public URL with lastmod=site.updated; Person JSON-LD limited to facts on the page; og:image with explicit 1200x630
- ecc:security-review @ TASK-304 start, before CSP/headers -> strict hash-only CSP (no unsafe-inline/eval) hashing the bytes actually served (built, minified style) not the source; .vercel/ must stay uncommitted; run npm audit; JSON-LD escaping (TASK-303) is the XSS boundary
- vercel:vercel-cli @ TASK-304 step 2, before any CLI use -> check auth with `vercel whoami --format json`; never auto-link or start login myself; verify target with `vercel project inspect --non-interactive`; protected previews via `vercel curl`, never disable protection
- vercel:deploy @ TASK-304 step 2 -> preflight (CLI, link, git status clean); PREVIEW only, never --prod; post-deploy `vercel inspect` + smoke check
- superpowers:requesting-code-review @ pre-handoff, after implementation of 301-304 (range 3ea91a0..255dc97) -> dispatched a read-only general-purpose reviewer with the 4 task specs, DATABASE/API sections, and the known deviations; findings pending
- superpowers:receiving-code-review @ after review verdict (With fixes) -> verified each finding against code before acting; #1 reproduced (updated +1 day => 64/69 content tests fail); plan: #1 fix, #3 C-21 placeholder check, #4 index.html guard, #5 .JPG hint, #8 og check-then-write, #6 verify in Chrome, #2 -> CCR-3, #7 known issue
- (probe, scratchpad only) all 3 formats byte-stable across 3 processes on this mac; hero 1600w AVIF q50=53.6KB, q60=73.9KB -> chose AVIF q60/effort 4, WebP q80/effort 4, JPEG q80 mozjpeg

## Done
- [x] Read protocol, skill routing, tasks 301-304, PRODUCT, ARCHITECTURE, API, openapi, DATABASE, ACCEPTANCE, DECISIONS, manager handoff
- [x] `scripts/bootstrap.sh` -> ports frontend 3002 / backend 8002 (backend port unused, ADR-001)
- [x] Baseline green before any change: `npm run typecheck` exit 0, `npm run lint` exit 0, `npm test` 9 passed

- [x] TASK-301 step 1: C-01..C-20 TDD in 5 families, each `test:` commit watched red (assertion failures, not errors) then `feat:` green (2c2d040..98a13ea)
- [x] TASK-301 step 2: real-content test; proved it fails by temporarily putting an em dash + "TBD" in site.tagline (reported C-01 + C-20 at site.tagline), restored

- [x] TASK-301 step 3: owner guide frontend/src/content/README.md (04473ab); every rule C-01..C-20 explained; C-20 false positives documented; TS error example is real tsc output
- [x] No real content violations found -> no value files changed

- [x] TASK-302 step 1: helpers TDD (f4160c9 red -> 1432ae3 green): mediaIdFromPath, planWidths, renditionPath
- [x] TASK-302 step 2: CLI integration tests red (fab889b) -> pipeline green (763e2d5); input-shape tests (6d09165) mutation-checked: removing autoOrient / flatten each turns its test red; toColourspace('srgb') + raw depth were redundant (sharp 0.35 outputs 8-bit sRGB by default for gray/CMYK/rgb16) -> removed, 16-bit test pins it
- [x] TASK-302 step 3: real run (18f636c): alpine 640/1024/1600/1672, evergreen 640/1024; second run "0 written, manifest unchanged", git status clean; build ok; headless Chrome 155 loads all 18 renditions (onload, natural sizes correct)

- [x] TASK-302 step 4: C-21 media.contract.test.ts (a2296dd): 5 checks (listed 3 + orphaned entry + source width changed), each proven to fail by a real state mutation (new unprocessed image / removed source / missing rendition / resized source / dangling content image), restored, tree clean
- [x] Owner guide explains C-21 (9e88b05)

- [x] TASK-303 step 1: renderHead/buildJsonLd/robots/sitemap TDD (9a5f16f red -> 5c9d504 green), parsed with DOMParser in jsdom
- [x] TASK-303 step 2: plugin hooks TDD via real `vite build` of a temp site (2247bcf red -> green); real `npm run build` dist/index.html has every B-03 tag, one JSON-LD block, robots.txt without Sitemap (origin empty)

- [x] TASK-303 step 3: favicon.svg (bb0f3b9): rig proportions, stroke 2.25u (=1.8px@32), charcoal via presentation attrs (survives a CSP that blocks inline style), dark via @media; slight stance = VISUAL CALL to flag; rendered 16/32/128 light+dark and viewed
- [x] TASK-303 step 4: og.jpg 1200x630, 64,338 B, deterministic (same sha256 twice); NO TEXT: Pango ignored Instrument Serif fontfile (WOFF and fontTools-converted TTF both byte-identical to a nonexistent-family render) -> shipped without text per task rule
- [x] Real build: dist has favicon.svg, og.jpg, robots.txt, index.html with 1 JSON-LD block

- [x] TASK-304 step 1: CSP contract test (9482449 red) -> vercel.json (21d0f69 green); hashes computed independently with openssl from built index.html; mutation: +1 space in gate -> test red; source style hash JYAd9.. != served Wd3nS.. (why we hash the build)
- [x] Vercel auth OK (whoami: emanuelling27-2425, team-boh-buh, hobby). Created project emanuel-ling (no Git connection: avoids auto prod deploys on push), linked; removed CLI-created .env.local (OIDC token); .gitignore += .vercel only (e5974b3)

- [x] TASK-304 deploy 1 (53cb8e6, clean git-archive export): Vercel assigned the project's FIRST deployment to PRODUCTION (no --prod passed): https://emanuel-ling.vercel.app serves the skeleton. Owner decision pending; nothing deleted.
- [x] TASK-304 site.origin = https://emanuel-ling.vercel.app (454dc58); deploy 2 = PREVIEW https://emanuel-ling-oh4a2xaqd-team-boh-buh.vercel.app (dpl_6JfxyCWN96hdoo55KoQQiArueHaf), protected by Vercel Authentication
- [x] B-05 via `vercel curl -- --head`: CSP + nosniff + referrer + permissions on /, immutable on /media and /assets. B-04: favicon/og/robots/sitemap 200. (vercel curl auto-created an automation-bypass secret on the project; never written to repo, redacted from evidence)
- [x] Console (?loader=1, headless Chrome 155, virtual 8s): gate ran (data-loader=show), boot cover removed, main not inert, 1 JSON-LD not executed; 1 CSP violation (data: font). Lighthouse mobile: Perf 96, A11y 94 (target-size, frontend), BP 92 (2 CSP violations), SEO n/a (robots fetch 302 behind SSO + Vercel preview noindex). Evidence 938f257.
- [x] CCR-1 (font inlining vs font-src 'self') + CCR-2 (hash served style) written to docs/handoffs/agent-backend.md; fix for CCR-1 verified locally, NOT committed (vite.config.ts is manager-owned); TASK-304 -> BLOCKED blocked_on: contract

## In progress
- [ ] Pre-handoff: requesting-code-review over 301-304, fix findings, full verification, verification-before-completion, HANDOFF-1, push
- [ ] TASK-301: code review + verification deferred to the combined pre-handoff pass (status stays IN_PROGRESS until then)

## Verified
- Baseline (pre-change) -> typecheck/lint/test all pass on 3ea91a0
- B-01 -> `npm run test:contract`: tsc ok, 3 files, 83 passed (69 content + 9 stickman + 5 C-21)
- B-02 -> second real `npm run media`: "0 written, 0 stale removed, manifest unchanged"; `git status` clean; temp-dir add/delete covered by media.test.mjs
- Hero AVIF 1600w = 75,638 bytes (budget 250 KB)

## Blocked on
- TASK-304 zero-CSP-violation criterion: CCR-1 (manager: vite.config.ts assetsInlineLimit for fonts, or alternative). Toolbar violation on previews needs an OWNER setting (Vercel Toolbar off for previews).
