// @vitest-environment node
// Owner: agent/backend. Content invariants C-01 to C-20 (docs/DATABASE.md), part of `npm run test:contract`.
// Each rule test takes a minimally altered copy of the REAL content that breaks that rule only, and
// expects exactly one violation with that rule and path.
import { describe, expect, it } from 'vitest';
import { content } from './index';
import type { Content } from './types';
import { validateContent, type RuleId } from './validate';

const TODAY = '2026-10-16';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

/**
 * A deep copy of the real content with one edit applied. JSON cloning on purpose: site.heroLinks and
 * contact.links share Link objects, and a reference-preserving clone would turn one edit into two.
 */
function variant(edit: (c: Mutable<Content>) => void): Content {
  const copy = JSON.parse(JSON.stringify(content)) as Mutable<Content>;
  edit(copy);
  return copy;
}

/** Rule and path of every violation; also asserts each one carries a readable message. */
function found(c: Content, opts: { today?: string; mediaIds?: readonly string[] } = {}) {
  const violations = validateContent(c, { today: TODAY, ...opts });
  for (const v of violations) expect(v.message.trim().length).toBeGreaterThan(10);
  return violations.map(({ rule, path }) => ({ rule, path }));
}

const one = (rule: RuleId, path: string) => [{ rule, path }];

describe('copy rules', () => {
  it('C-01 flags an em dash in a class name', () => {
    const c = variant((c) => (c.about.classes.items[1] = 'Data Structures — Algorithms'));
    expect(found(c)).toEqual(one('C-01', 'about.classes.items[1]'));
  });

  it('C-01 flags an em dash in a nested link label', () => {
    const c = variant((c) => (c.projects[1]!.secondary[0]!.label = 'Devpost — 3rd place'));
    expect(found(c)).toEqual(one('C-01', 'projects[1].secondary[0].label'));
  });

  it('C-01 allows an en dash', () => {
    const c = variant((c) => (c.about.classes.items[1] = 'Data Structures – Algorithms'));
    expect(found(c)).toEqual([]);
  });

  it('C-02 flags a project sentence that is two sentences', () => {
    const c = variant(
      (c) => (c.projects[0]!.sentence = 'Shows a Pomona student which requirements they have met. It also plans next term.'),
    );
    expect(found(c)).toEqual(one('C-02', 'projects[0].sentence'));
  });

  it('C-02 flags an exclamation mark followed by a capital as a sentence break', () => {
    const c = variant((c) => (c.projects[0]!.sentence = 'Plans your degree! Then it plans next term.'));
    expect(found(c)).toEqual(one('C-02', 'projects[0].sentence'));
  });

  it('C-02 flags a project sentence without a final period', () => {
    const c = variant((c) => (c.projects[2]!.sentence = 'The website for the youth ministry at International Miracle Makers Church'));
    expect(found(c)).toEqual(one('C-02', 'projects[2].sentence'));
  });

  it('C-02 flags a project sentence longer than 200 characters', () => {
    const c = variant((c) => (c.projects[3]!.sentence = `A${'a'.repeat(199)}.`)); // 201 characters
    expect(found(c)).toEqual(one('C-02', 'projects[3].sentence'));
  });

  it('C-02 accepts exactly 200 characters', () => {
    const c = variant((c) => (c.projects[3]!.sentence = `A${'a'.repeat(198)}.`)); // 200 characters
    expect(found(c)).toEqual([]);
  });

  it('C-02 does not split on decimals or a lowercase e.g.', () => {
    const c = variant(
      (c) => (c.projects[3]!.sentence = 'An agent that averages 0.13 at first, e.g. against a random player, and then improves.'),
    );
    expect(found(c)).toEqual([]);
  });

  it('C-16 flags an about description of three sentences', () => {
    const c = variant((c) => (c.about.description = 'I study math. I build software. I lead worship music.'));
    expect(found(c)).toEqual(one('C-16', 'about.description'));
  });

  it('C-16 flags an about description longer than 320 characters', () => {
    const c = variant((c) => (c.about.description = `I study math${'s'.repeat(300)}. I build software for people.`));
    expect(found(c)).toEqual(one('C-16', 'about.description'));
  });

  it('C-16 flags an about description with no closing punctuation', () => {
    const c = variant((c) => (c.about.description = 'I study computer science and math at Pomona College'));
    expect(found(c)).toEqual(one('C-16', 'about.description'));
  });

  it('C-16 accepts a single sentence', () => {
    const c = variant((c) => (c.about.description = 'I study computer science and math at Pomona College.'));
    expect(found(c)).toEqual([]);
  });

  it('C-20 flags a placeholder word in any string', () => {
    const c = variant((c) => (c.about.classes.items[0] = 'TBD'));
    expect(found(c)).toEqual(one('C-20', 'about.classes.items[0]'));
  });

  it('C-20 matches "coming soon" case-insensitively', () => {
    const c = variant((c) => (c.projects[3]!.meta[1] = 'Coming Soon'));
    expect(found(c)).toEqual(one('C-20', 'projects[3].meta[1]'));
  });

  it('C-20 flags a plural placeholder word such as "todos"', () => {
    const c = variant((c) => (c.about.description = 'I keep my todos in a paper notebook.'));
    expect(found(c)).toEqual(one('C-20', 'about.description'));
  });

  it('C-20 ignores a placeholder word inside a longer word', () => {
    const c = variant((c) => (c.about.classes.items[0] = 'Photodocumentation'));
    expect(found(c)).toEqual([]);
  });
});
