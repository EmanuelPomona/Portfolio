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

describe('project rules', () => {
  it('C-03 flags a project id that is not lowercase kebab-case', () => {
    const c = variant((c) => (c.projects[1]!.id = 'StreetSafe_LA'));
    expect(found(c)).toEqual(one('C-03', 'projects[1].id'));
  });

  it('C-03 flags a duplicate project id at the second occurrence', () => {
    const c = variant((c) => (c.projects[3]!.id = 'sageplan'));
    expect(found(c)).toEqual(one('C-03', 'projects[3].id'));
  });

  it('C-04 flags a project with no meta items', () => {
    const c = variant((c) => (c.projects[0]!.meta = []));
    expect(found(c)).toEqual(one('C-04', 'projects[0].meta'));
  });

  it('C-04 flags a project with five meta items', () => {
    const c = variant((c) => c.projects[2]!.meta.push('Vercel'));
    expect(found(c)).toEqual(one('C-04', 'projects[2].meta'));
  });

  it('C-04 flags a meta item longer than 40 characters', () => {
    const c = variant((c) => (c.projects[1]!.meta[0] = '3rd of 17 teams at the Claremont Graduate University hackathon'));
    expect(found(c)).toEqual(one('C-04', 'projects[1].meta[0]'));
  });

  it('C-04 accepts a meta item of exactly 40 characters', () => {
    const c = variant((c) => (c.projects[1]!.meta[0] = 'x'.repeat(40)));
    expect(found(c)).toEqual([]);
  });

  it('C-04 flags a meta item with trailing punctuation', () => {
    const c = variant((c) => (c.projects[0]!.meta[1] = 'TypeScript.'));
    expect(found(c)).toEqual(one('C-04', 'projects[0].meta[1]'));
  });

  it('C-07 flags an address bar that keeps the scheme', () => {
    const c = variant((c) => (c.projects[0]!.addressBar = 'https://sageplan.vercel.app'));
    expect(found(c)).toEqual(one('C-07', 'projects[0].addressBar'));
  });

  it('C-07 strips a leading www. and a trailing slash from the primary href', () => {
    const c = variant((c) => (c.projects[3]!.primary.href = 'https://www.github.com/EmanuelPomona/Snake-AI/'));
    expect(found(c)).toEqual([]);
  });

  it('C-07 flags an address bar that keeps www.', () => {
    const c = variant((c) => {
      c.projects[3]!.primary.href = 'https://www.github.com/EmanuelPomona/Snake-AI';
      c.projects[3]!.addressBar = 'www.github.com/EmanuelPomona/Snake-AI';
    });
    expect(found(c)).toEqual(one('C-07', 'projects[3].addressBar'));
  });

  it('C-08 flags a live link that is not the primary', () => {
    const c = variant((c) => {
      const p = c.projects[0]!;
      [p.primary, p.secondary[0]] = [p.secondary[0]!, p.primary];
      p.addressBar = 'github.com/EmanuelPomona/SagePlan';
    });
    expect(found(c)).toEqual(one('C-08', 'projects[0].secondary[0].kind'));
  });

  it('C-08 flags a primary link that is neither live nor code', () => {
    const c = variant((c) => {
      const p = c.projects[1]!;
      [p.primary, p.secondary[0]] = [p.secondary[0]!, p.primary];
      p.addressBar = 'devpost.com/software/street-safe-la';
    });
    expect(found(c)).toEqual(one('C-08', 'projects[1].primary.kind'));
  });
});

describe('link rules', () => {
  it('C-05 flags an http:// link', () => {
    const c = variant((c) => (c.projects[1]!.secondary[0]!.href = 'http://devpost.com/software/street-safe-la'));
    expect(found(c)).toEqual(one('C-05', 'projects[1].secondary[0].href'));
  });

  it('C-05 flags an https link that does not parse', () => {
    const c = variant((c) => (c.projects[1]!.secondary[0]!.href = 'https://devpost com/software'));
    expect(found(c)).toEqual(one('C-05', 'projects[1].secondary[0].href'));
  });

  it('C-05 flags a relative link', () => {
    const c = variant((c) => (c.projects[1]!.secondary[0]!.href = '/projects'));
    expect(found(c)).toEqual(one('C-05', 'projects[1].secondary[0].href'));
  });

  it('C-05 flags a mailto link without an @', () => {
    const c = variant((c) => c.projects[3]!.secondary.push({ kind: 'email', label: 'Email', href: 'mailto:emanuelling27' }));
    expect(found(c)).toEqual(one('C-05', 'projects[3].secondary[0].href'));
  });

  it('C-06 flags a secondary link that repeats the primary href', () => {
    const c = variant((c) => (c.projects[0]!.secondary[0]!.href = 'https://sageplan.vercel.app'));
    expect(found(c)).toEqual(one('C-06', 'projects[0].secondary[0].href'));
  });

  it('C-06 flags two secondary links with the same href', () => {
    const c = variant((c) =>
      c.projects[1]!.secondary.push({ kind: 'devpost', label: 'Devpost', href: 'https://devpost.com/software/street-safe-la' }),
    );
    expect(found(c)).toEqual(one('C-06', 'projects[1].secondary[1].href'));
  });

  it('C-18 flags contact links missing a required kind', () => {
    const c = variant((c) => (c.contact.links[2]!.kind = 'code'));
    expect(found(c)).toEqual(one('C-18', 'contact.links'));
  });

  it('C-18 flags a repeated contact link kind', () => {
    const c = variant((c) =>
      c.contact.links.push({ kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/emanuel-ling-915a73244' }),
    );
    expect(found(c)).toEqual(one('C-18', 'contact.links[3].kind'));
  });

  it('C-19 flags a hero link whose href is not in the contact links', () => {
    const c = variant((c) => (c.site.heroLinks[2]!.href = 'https://github.com/EmanuelPomona/Portfolio'));
    expect(found(c)).toEqual(one('C-19', 'site.heroLinks[2].href'));
  });
});
