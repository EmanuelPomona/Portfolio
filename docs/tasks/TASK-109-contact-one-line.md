---
id: TASK-109
title: Contact as one sentence, "Contact: LinkedIn, Email, GitHub."
status: REVIEW
owner: frontend
branch: agent/frontend
priority: HIGH
round: 0
depends_on: [TASK-106]
blocked_on: ""
---

# TASK-109: Contact as one sentence, "Contact: LinkedIn, Email, GitHub."

## Objective

The owner asked: "Instead of listing linked in, email, and github, put them all in one line like
this: Contact: linkedin, email, github." Replace the v1 colophon list (label plus address per link)
with one sentence. Proper-case labels from `contact.ts` (manager's call, ADR-011).

## Scope

- **Modify:** `frontend/src/sections/Connect/Connect.{tsx,module.css,test.tsx}`.
- **May modify:** `frontend/src/components/Section/*` if the heading needs an inline variant
  (additive prop only; every other section renders exactly as before).
- **May remove:** `displayAddress` in `frontend/src/lib/format.ts` and its tests, if nothing else uses it.

## Acceptance Criteria

- [ ] **K-01** as written in `docs/ACCEPTANCE.md` (round 2 text).
- [ ] **X-04** still holds: the section is labelled by an `h2` named "Contact".
- [ ] **H-03** still holds: the nav's Contact link lands on the section with `aria-current`.
- [ ] Tests, by name:
  - `renders Contact as one sentence reading "Contact: LinkedIn, Email, GitHub."` (the line's `textContent`, whitespace collapsed, equals that string exactly)
  - `links have the exact contact.ts hrefs in order, and the punctuation is outside every link`
  - `mailto opens in the same tab; LinkedIn and GitHub open a new tab with rel="noopener noreferrer"`
  - `prints no addresses`
- [ ] Evidence: `docs/review/F-109-contact-{1440,768,390}.png`. One line at 1440 and 768.

## Steps

1. Change the Connect tests to the four above. Run them; they fail. Commit nothing yet.
2. Implement. Run `npm test`; all green. Commit (`feat: set Contact as one sentence`).
3. Check 1440, 768, 390 in a browser (production build); capture the evidence. Commit.

## Notes

- Skills: `superpowers:test-driven-development`; before handoff `superpowers:verification-before-completion`.
- Set it in the serif at section-heading scale, so the sentence reads as the colophon's last line.
  Links keep the v1 underline and Deep Forest focus ring; each needs a 44px tap target (padding,
  not a taller line box that breaks the sentence).

## Review History

| Round | Verdict | Summary |
|---|---|---|
