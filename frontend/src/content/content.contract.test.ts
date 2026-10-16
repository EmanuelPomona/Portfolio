// @vitest-environment node
// Owner: agent/backend. Content invariants C-01 to C-20 (docs/DATABASE.md), part of `npm run test:contract`.
// Each rule test takes a minimally altered copy of the REAL content that breaks that rule only, and
// expects exactly one violation with that rule and path.
import { describe, expect, it } from 'vitest';
import { content, type Content, type MediaId } from './index';
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

describe('image and photo rules', () => {
  // An id that exists in the real media manifest, so C-11 stays quiet while C-09 is exercised.
  const REAL_IMAGE = 'backgrounds/alpine-valley' as MediaId;

  it('C-09 flags alt text on a screen that has no image', () => {
    const c = variant((c) => (c.projects[0]!.screen.alt = 'SagePlan requirements dashboard'));
    expect(found(c)).toEqual(one('C-09', 'projects[0].screen.alt'));
  });

  it('C-09 flags a photo image with no alt text', () => {
    const c = variant((c) => (c.about.photos[0]!.image = REAL_IMAGE));
    expect(found(c)).toEqual(one('C-09', 'about.photos[0].alt'));
  });

  it('C-09 flags alt text shorter than 8 characters', () => {
    const c = variant((c) => Object.assign(c.about.photos[0]!, { image: REAL_IMAGE, alt: 'A hike' }));
    expect(found(c)).toEqual(one('C-09', 'about.photos[0].alt'));
  });

  it('C-09 flags alt text that only says "screenshot"', () => {
    const c = variant((c) => (c.projects[0]!.screen = { image: REAL_IMAGE, alt: 'Screenshot' }));
    expect(found(c)).toEqual(one('C-09', 'projects[0].screen.alt'));
  });

  it('C-09 accepts an image with descriptive alt text', () => {
    const c = variant((c) => Object.assign(c.about.photos[0]!, { image: REAL_IMAGE, alt: 'Snow on the San Gabriel Mountains' }));
    expect(found(c)).toEqual([]);
  });

  it('C-10 flags a caption with surrounding spaces', () => {
    const c = variant((c) => (c.about.photos[1]!.caption = ' Mt. Baldy at dawn'));
    expect(found(c)).toEqual(one('C-10', 'about.photos[1].caption'));
  });

  it('C-10 flags an empty caption', () => {
    const c = variant((c) => (c.about.photos[1]!.caption = ''));
    expect(found(c)).toEqual(one('C-10', 'about.photos[1].caption'));
  });

  it('C-10 flags a caption longer than 120 characters', () => {
    const c = variant((c) => (c.about.photos[1]!.caption = `M${'m'.repeat(120)}`)); // 121 characters
    expect(found(c)).toEqual(one('C-10', 'about.photos[1].caption'));
  });

  it('C-10 accepts a caption of exactly 120 characters', () => {
    const c = variant((c) => (c.about.photos[1]!.caption = `M${'m'.repeat(119)}`));
    expect(found(c)).toEqual([]);
  });

  it('C-11 flags a media id that is not in the manifest', () => {
    const c = variant((c) => (c.site.sectionsImage = 'backgrounds/missing' as MediaId));
    expect(found(c)).toEqual(one('C-11', 'site.sectionsImage'));
  });

  it('C-11 flags a project screenshot that has not been generated', () => {
    const c = variant((c) => (c.projects[0]!.screen = { image: 'projects/sageplan' as MediaId, alt: 'SagePlan requirements dashboard' }));
    expect(found(c)).toEqual(one('C-11', 'projects[0].screen.image'));
  });

  it('C-11 checks against the mediaIds option when given', () => {
    const c = variant((c) => (c.projects[0]!.screen = { image: 'projects/sageplan' as MediaId, alt: 'SagePlan requirements dashboard' }));
    const ids = ['backgrounds/alpine-valley', 'backgrounds/evergreen-forest', 'projects/sageplan'];
    expect(found(c, { mediaIds: ids })).toEqual([]);
    expect(found(content, { mediaIds: [] })).toEqual([
      { rule: 'C-11', path: 'site.heroImage' },
      { rule: 'C-11', path: 'site.sectionsImage' },
    ]);
  });

  it('C-17 flags more than 8 photos', () => {
    const c = variant((c) => {
      for (const n of [6, 7, 8, 9]) c.about.photos.push({ id: `photo-${n}`, aspect: '4:3', image: null, alt: null, caption: null });
    });
    expect(found(c)).toEqual(one('C-17', 'about.photos'));
  });

  it('C-17 accepts no photos at all', () => {
    const c = variant((c) => (c.about.photos = []));
    expect(found(c)).toEqual([]);
  });

  it('C-17 flags a photo id not shaped like photo-N', () => {
    const c = variant((c) => (c.about.photos[2]!.id = 'photo-three'));
    expect(found(c)).toEqual(one('C-17', 'about.photos[2].id'));
  });

  it('C-17 flags a duplicate photo id at the second occurrence', () => {
    const c = variant((c) => (c.about.photos[4]!.id = 'photo-1'));
    expect(found(c)).toEqual(one('C-17', 'about.photos[4].id'));
  });
});

describe('site rules', () => {
  it('C-12 flags nav sections in the wrong order', () => {
    const c = variant((c) => ([c.site.nav[1], c.site.nav[2]] = [c.site.nav[2]!, c.site.nav[1]!]));
    expect(found(c)).toEqual(one('C-12', 'site.nav'));
  });

  it('C-12 flags a missing nav section', () => {
    const c = variant((c) => c.site.nav.pop());
    expect(found(c)).toEqual(one('C-12', 'site.nav'));
  });

  it('C-13 flags a title longer than 70 characters', () => {
    const c = variant((c) => (c.site.title = `E${'e'.repeat(70)}`)); // 71 characters
    expect(found(c)).toEqual(one('C-13', 'site.title'));
  });

  it('C-13 accepts a title of exactly 70 characters', () => {
    const c = variant((c) => (c.site.title = `E${'e'.repeat(69)}`));
    expect(found(c)).toEqual([]);
  });

  it('C-13 flags a description longer than 160 characters', () => {
    const c = variant((c) => (c.site.description = `E${'e'.repeat(159)}.`)); // 161 characters
    expect(found(c)).toEqual(one('C-13', 'site.description'));
  });

  it('C-14 flags a date that does not exist', () => {
    const c = variant((c) => (c.site.updated = '2026-02-30'));
    expect(found(c)).toEqual(one('C-14', 'site.updated'));
  });

  it('C-14 flags a date not written as YYYY-MM-DD', () => {
    const c = variant((c) => (c.site.updated = '10/16/2026'));
    expect(found(c)).toEqual(one('C-14', 'site.updated'));
  });

  it('C-14 flags a date after today', () => {
    const c = variant((c) => (c.site.updated = '2026-10-17'));
    expect(found(c, { today: '2026-10-16' })).toEqual(one('C-14', 'site.updated'));
  });

  it('C-14 accepts a leap day', () => {
    const c = variant((c) => (c.site.updated = '2024-02-29'));
    expect(found(c)).toEqual([]);
  });

  it('C-14 defaults today to the current UTC date', () => {
    const c = variant((c) => (c.site.updated = '2999-01-01'));
    expect(validateContent(c).map(({ rule, path }) => ({ rule, path }))).toEqual(one('C-14', 'site.updated'));
  });

  it('C-15 flags an origin with a trailing slash', () => {
    const c = variant((c) => (c.site.origin = 'https://emanuel-ling.vercel.app/'));
    expect(found(c)).toEqual(one('C-15', 'site.origin'));
  });

  it('C-15 flags an origin with a path', () => {
    const c = variant((c) => (c.site.origin = 'https://emanuel-ling.vercel.app/portfolio'));
    expect(found(c)).toEqual(one('C-15', 'site.origin'));
  });

  it('C-15 flags an http origin', () => {
    const c = variant((c) => (c.site.origin = 'http://emanuel-ling.vercel.app'));
    expect(found(c)).toEqual(one('C-15', 'site.origin'));
  });

  it('C-15 accepts an https origin', () => {
    const c = variant((c) => (c.site.origin = 'https://emanuel-ling.vercel.app'));
    expect(found(c)).toEqual([]);
  });
});

describe('the real content', () => {
  it('satisfies every invariant C-01 to C-20', () => {
    const violations = validateContent(content);
    const report = violations.map((v) => `  ${v.rule} at ${v.path}: ${v.message}`).join('\n');
    expect(violations, `The content has problems. Fix each one, then run npm run test:contract again.\n${report}\n`).toEqual([]);
  });
});
