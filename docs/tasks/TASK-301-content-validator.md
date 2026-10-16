---
id: TASK-301
title: Content validator, invariant contract tests, and owner editing guide
status: READY
owner: backend
branch: agent/backend
priority: HIGH
round: 0
depends_on: []
blocked_on: ""
---

# TASK-301: Content validator, invariant contract tests, and owner editing guide

## Objective

Make the content module safe for Emanuel to edit after launch.
- **A pure validator** enforces invariants C-01 to C-20 from `docs/DATABASE.md`.
- **A contract test** runs it on the real content, so `npm run test:contract` catches a bad
  edit before deploy.
- **A plain-language guide** lets Emanuel change text and add images.

## Scope

- **Create:**
  - `frontend/src/content/validate.ts`
  - `frontend/src/content/content.contract.test.ts`. The "contract" in the name puts it in
    `npm run test:contract`.
  - `frontend/src/content/README.md`, the owner guide.
- **May modify values in** `frontend/src/content/{site,projects,about,contact}.ts`, only to fix a
  real violation. If you find one, record it in the handoff; the approved copy wins otherwise.
- **Do not edit:** `types.ts` or `media.ts` (manager contracts).

## Interfaces

**Consumes:** `Content` and every entity type from `./types`; `isMediaId` from `./media`.

**Produces**

```ts
export type RuleId = 'C-01' | 'C-02' | 'C-03' | 'C-04' | 'C-05' | 'C-06' | 'C-07' | 'C-08' | 'C-09'
  | 'C-10' | 'C-11' | 'C-12' | 'C-13' | 'C-14' | 'C-15' | 'C-16' | 'C-17' | 'C-18' | 'C-19' | 'C-20';
export interface ContentViolation { rule: RuleId; path: string; message: string }
export function validateContent(c: Content, opts?: { today?: string; mediaIds?: readonly string[] }): ContentViolation[]
```

- `path` is a dotted locator, for example `projects[2].sentence`.
- `today` defaults to the current UTC date, for C-14.
- `mediaIds` defaults to the manifest keys, for C-11.

## Acceptance Criteria

- [ ] **B-01:** `npm run test:contract` passes, including this suite.
- [ ] **Each rule C-01 to C-20 has at least one test** in which a minimally altered copy of the
      real content violates that rule only, and `validateContent` returns exactly one violation
      with that `rule` and the right `path`.
- [ ] `validateContent(content)` on the real content returns `[]`.
- [ ] The guide `frontend/src/content/README.md` covers, in plain steps a non-engineer can
      follow:
  - edit a sentence or caption;
  - add a project screenshot (`media-src/projects/<id>.png`, then `npm run media`, then set
    `screen.image` and `alt`);
  - add a collage photo (`media-src/life/photo-N.jpg`, then `npm run media`, then set `image`,
    `alt`, `caption`);
  - run `npm run test:contract`;
  - commit.

  It explains each rule's error message in one line.

## Steps

1. Invoke `superpowers:test-driven-development`. For each rule, write the violating-fixture
   test, see it fail, and implement the check. Group commits by rule family:
   - `test: copy rules C-01, C-02, C-16, C-20`
   - `feat: validate copy rules`
   - …
2. Real-content test (`[]`). Commit.
3. The guide. Commit.

## Notes

- **Skills:** `superpowers:test-driven-development`, `ecc:error-handling` for message wording.
  Before handoff: `superpowers:requesting-code-review` and
  `superpowers:verification-before-completion`.
- **C-02 sentence check:** reject `[.!?]\s+[A-Z]` before the final character, and require a final
  `.`. Decimals like `0.13` and "e.g." in lowercase must not trip it.
- **C-07:** strip `https://`, then a leading `www.`, then a trailing `/`.
- **C-20:** match whole words case-insensitively, so "todos" in a real sentence would still be
  flagged. This is acceptable; document it in the guide.

## Review History

| Round | Verdict | Summary |
|---|---|---|
