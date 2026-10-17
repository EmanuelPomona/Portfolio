// @vitest-environment node
// Owner: agent/backend. Content invariants C-01 to C-20 and C-22 (docs/DATABASE.md), part of `npm run test:contract`.
//
// Each rule test copies a base content, breaks exactly one rule, and expects exactly one violation with
// that rule and path. Fixtures set up everything they rely on themselves (dates relative to the base's
// own `updated`, whole image slots, fresh links), so the suite keeps passing when the owner edits the
// real content by following README.md. Every rule test runs against two bases to prove it.
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { content, type Content, type Link, type MediaId } from './index';
import { validateContent, type RuleId } from './validate';

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

/**
 * A deep copy of `base` with one change applied. JSON cloning on purpose: site.heroLinks and
 * contact.links share Link objects, and a reference-preserving clone would turn one edit into two.
 */
function edit(base: Content, change: (c: Mutable<Content>) => void): Content {
  const copy = JSON.parse(JSON.stringify(base)) as Mutable<Content>;
  change(copy);
  return copy;
}

/** Make sure the collage has at least `n` slots, adding empty ones with fresh photo-N ids. */
function ensurePhotos(c: Mutable<Content>, n: number): void {
  while (c.about.photos.length < n) {
    const next = Math.max(0, ...c.about.photos.map((p) => Number(p.id.replace('photo-', '')) || 0)) + 1;
    c.about.photos.push({ id: `photo-${next}`, aspect: '4:3', image: null, alt: null, caption: null });
  }
}

/** Every non-null image reference in `c`, as the dotted path a C-11 violation would report. */
function imagePaths(c: Content): string[] {
  return [
    'site.heroImage',
    'site.sectionsImage',
    ...c.projects.flatMap((p, i) => (p.screen.image === null ? [] : [`projects[${i}].screen.image`])),
    ...c.about.photos.flatMap((ph, i) => (ph.image === null ? [] : [`about.photos[${i}].image`])),
  ];
}

/** The day after an ISO date. */
const nextDay = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** An image id that always exists: the hero background (the real-content test fails if it does not). */
const KNOWN_IMAGE = content.site.heroImage;
/** An image id that no `npm run media` run will ever produce. */
const NEVER_GENERATED = 'never/generated-in-tests' as MediaId;
/** A link no real project uses, for fixtures that add links. */
const freshLink = (kind: Link['kind'], href: string): Mutable<Link> => ({ kind, label: 'Extra', href });

/**
 * Content as it looks after the owner follows README.md: a later edit date, a screenshot, a captioned
 * photo, a sixth slot, one class, a one-item meta line.
 */
const ownerEdited = edit(content, (c) => {
  c.site.updated = '2027-03-01';
  c.projects[0]!.screen = { image: KNOWN_IMAGE, alt: 'SagePlan showing which requirements are met' };
  c.projects[0]!.meta = ['React'];
  c.about.classes.items = ['Real Analysis'];
  ensurePhotos(c, 2);
  Object.assign(c.about.photos[1]!, { image: KNOWN_IMAGE, alt: 'Leading worship on keyboard', caption: 'Sunday service' });
  ensurePhotos(c, c.about.photos.length + 1);
});

const one = (rule: RuleId, path: string) => [{ rule, path }];

describe.each([
  ['the real content', content],
  ['content after typical owner edits', ownerEdited],
])('rules on %s', (_label, base) => {
  const today = base.site.updated;
  const variant = (change: (c: Mutable<Content>) => void) => edit(base, change);

  /** Rule and path of every violation, validated as of the base's own date; messages must be readable. */
  function found(c: Content, opts: Parameters<typeof validateContent>[1] = {}) {
    const violations = validateContent(c, { today, ...opts });
    for (const v of violations) expect(v.message.trim().length).toBeGreaterThan(10);
    return violations.map(({ rule, path }) => ({ rule, path }));
  }

  it('the base content is valid as of its own date', () => {
    expect(found(base)).toEqual([]);
  });

  describe('copy rules', () => {
    it('C-01 flags an em dash in a class name', () => {
      const c = variant((c) => (c.about.classes.items[0] = 'Data Structures \u2014 Algorithms'));
      expect(found(c)).toEqual(one('C-01', 'about.classes.items[0]'));
    });

    it('C-01 flags an em dash in a nested link label', () => {
      const n = base.projects[0]!.secondary.length;
      const c = variant((c) => c.projects[0]!.secondary.push({ ...freshLink('code', 'https://example.org/em-dash'), label: 'Code \u2014 v2' }));
      expect(found(c)).toEqual(one('C-01', `projects[0].secondary[${n}].label`));
    });

    it('C-01 allows an en dash', () => {
      const c = variant((c) => (c.about.classes.items[0] = 'Data Structures \u2013 Algorithms'));
      expect(found(c)).toEqual([]);
    });

    it('C-02 flags a project sentence that is two sentences', () => {
      const c = variant((c) => (c.projects[0]!.sentence = 'Shows which requirements are met. It also plans next term.'));
      expect(found(c)).toEqual(one('C-02', 'projects[0].sentence'));
    });

    it('C-02 flags an exclamation mark followed by a capital as a sentence break', () => {
      const c = variant((c) => (c.projects[0]!.sentence = 'Plans your degree! Then it plans next term.'));
      expect(found(c)).toEqual(one('C-02', 'projects[0].sentence'));
    });

    it('C-02 flags a project sentence without a final period', () => {
      const c = variant((c) => (c.projects[0]!.sentence = 'The website for the youth ministry at a church in Los Angeles'));
      expect(found(c)).toEqual(one('C-02', 'projects[0].sentence'));
    });

    it('C-02 flags a project sentence longer than 200 characters', () => {
      const c = variant((c) => (c.projects[0]!.sentence = `A${'a'.repeat(199)}.`)); // 201 characters
      expect(found(c)).toEqual(one('C-02', 'projects[0].sentence'));
    });

    it('C-02 accepts exactly 200 characters', () => {
      const c = variant((c) => (c.projects[0]!.sentence = `A${'a'.repeat(198)}.`)); // 200 characters
      expect(found(c)).toEqual([]);
    });

    it('C-02 does not split on decimals or a lowercase e.g.', () => {
      const c = variant(
        (c) => (c.projects[0]!.sentence = 'An agent that averages 0.13 at first, e.g. against a random player, and then improves.'),
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
      const c = variant((c) => (c.projects[0]!.meta = ['Coming Soon']));
      expect(found(c)).toEqual(one('C-20', 'projects[0].meta[0]'));
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
      const c = variant((c) => (c.projects[0]!.id = 'StreetSafe_LA'));
      expect(found(c)).toEqual(one('C-03', 'projects[0].id'));
    });

    it('C-03 flags a duplicate project id at the second occurrence', () => {
      const last = base.projects.length - 1;
      const c = variant((c) => (c.projects[last]!.id = c.projects[0]!.id));
      expect(found(c)).toEqual(one('C-03', `projects[${last}].id`));
    });

    it('C-04 flags a project with no meta items', () => {
      const c = variant((c) => (c.projects[0]!.meta = []));
      expect(found(c)).toEqual(one('C-04', 'projects[0].meta'));
    });

    it('C-04 flags a project with five meta items', () => {
      const c = variant((c) => (c.projects[0]!.meta = ['React', 'TypeScript', 'Vite', 'Vitest', 'Vercel']));
      expect(found(c)).toEqual(one('C-04', 'projects[0].meta'));
    });

    it('C-04 flags a meta item longer than 40 characters', () => {
      const c = variant((c) => (c.projects[0]!.meta = ['3rd of 17 teams at the Claremont Graduate University hackathon']));
      expect(found(c)).toEqual(one('C-04', 'projects[0].meta[0]'));
    });

    it('C-04 accepts a meta item of exactly 40 characters', () => {
      const c = variant((c) => (c.projects[0]!.meta = ['x'.repeat(40)]));
      expect(found(c)).toEqual([]);
    });

    it('C-04 flags a meta item with trailing punctuation', () => {
      const c = variant((c) => (c.projects[0]!.meta = ['TypeScript.']));
      expect(found(c)).toEqual(one('C-04', 'projects[0].meta[0]'));
    });

    it('C-07 flags an address bar that keeps the scheme', () => {
      const c = variant((c) => (c.projects[0]!.addressBar = `https://${c.projects[0]!.addressBar}`));
      expect(found(c)).toEqual(one('C-07', 'projects[0].addressBar'));
    });

    it('C-07 strips a leading www. and a trailing slash from the primary href', () => {
      const c = variant((c) => {
        c.projects[0]!.primary.href = 'https://www.example.org/demo/';
        c.projects[0]!.addressBar = 'example.org/demo';
      });
      expect(found(c)).toEqual([]);
    });

    it('C-07 flags an address bar that keeps www.', () => {
      const c = variant((c) => {
        c.projects[0]!.primary.href = 'https://www.example.org/demo';
        c.projects[0]!.addressBar = 'www.example.org/demo';
      });
      expect(found(c)).toEqual(one('C-07', 'projects[0].addressBar'));
    });

    it('C-08 flags a live link that is not the primary', () => {
      const n = base.projects[0]!.secondary.length;
      const c = variant((c) => c.projects[0]!.secondary.push(freshLink('live', 'https://example.org/live')));
      expect(found(c)).toEqual(one('C-08', `projects[0].secondary[${n}].kind`));
    });

    it('C-08 flags a primary link that is neither live nor code', () => {
      const c = variant((c) => {
        c.projects[0]!.primary = freshLink('devpost', 'https://devpost.com/software/example');
        c.projects[0]!.addressBar = 'devpost.com/software/example';
      });
      expect(found(c)).toEqual(one('C-08', 'projects[0].primary.kind'));
    });
  });

  describe('link rules', () => {
    const n = base.projects[0]!.secondary.length;

    it('C-05 flags an http:// link', () => {
      const c = variant((c) => c.projects[0]!.secondary.push(freshLink('devpost', 'http://devpost.com/software/example')));
      expect(found(c)).toEqual(one('C-05', `projects[0].secondary[${n}].href`));
    });

    it('C-05 flags an https link that does not parse', () => {
      const c = variant((c) => c.projects[0]!.secondary.push(freshLink('devpost', 'https://devpost com/software')));
      expect(found(c)).toEqual(one('C-05', `projects[0].secondary[${n}].href`));
    });

    it('C-05 flags a relative link', () => {
      const c = variant((c) => c.projects[0]!.secondary.push(freshLink('code', '/projects')));
      expect(found(c)).toEqual(one('C-05', `projects[0].secondary[${n}].href`));
    });

    it('C-05 flags a mailto link without an @', () => {
      const c = variant((c) => c.projects[0]!.secondary.push(freshLink('email', 'mailto:emanuelling27')));
      expect(found(c)).toEqual(one('C-05', `projects[0].secondary[${n}].href`));
    });

    it('C-06 flags a secondary link that repeats the primary href', () => {
      const c = variant((c) => c.projects[0]!.secondary.push(freshLink('code', c.projects[0]!.primary.href)));
      expect(found(c)).toEqual(one('C-06', `projects[0].secondary[${n}].href`));
    });

    it('C-06 flags two secondary links with the same href', () => {
      const c = variant((c) => {
        c.projects[0]!.secondary.push(freshLink('devpost', 'https://devpost.com/software/example'));
        c.projects[0]!.secondary.push(freshLink('devpost', 'https://devpost.com/software/example'));
      });
      expect(found(c)).toEqual(one('C-06', `projects[0].secondary[${n + 1}].href`));
    });

    it('C-18 flags contact links missing a required kind', () => {
      const github = base.contact.links.findIndex((l) => l.kind === 'github');
      const c = variant((c) => (c.contact.links[github]!.kind = 'code'));
      expect(found(c)).toEqual(one('C-18', 'contact.links'));
    });

    it('C-18 flags a repeated contact link kind', () => {
      const m = base.contact.links.length;
      const c = variant((c) => c.contact.links.push({ ...c.contact.links[0]! }));
      expect(found(c)).toEqual(one('C-18', `contact.links[${m}].kind`));
    });

    it('C-19 flags a hero link whose href is not in the contact links', () => {
      const c = variant((c) => (c.site.heroLinks[0]!.href = 'https://example.org/not-a-contact-link'));
      expect(found(c)).toEqual(one('C-19', 'site.heroLinks[0].href'));
    });
  });

  describe('image and photo rules', () => {
    it('C-09 flags alt text on a screen that has no image', () => {
      const c = variant((c) => (c.projects[0]!.screen = { image: null, alt: 'SagePlan requirements dashboard' }));
      expect(found(c)).toEqual(one('C-09', 'projects[0].screen.alt'));
    });

    it('C-09 flags a photo image with no alt text', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        Object.assign(c.about.photos[0]!, { image: KNOWN_IMAGE, alt: null });
      });
      expect(found(c)).toEqual(one('C-09', 'about.photos[0].alt'));
    });

    it('C-09 flags alt text shorter than 8 characters', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        Object.assign(c.about.photos[0]!, { image: KNOWN_IMAGE, alt: 'A hike' });
      });
      expect(found(c)).toEqual(one('C-09', 'about.photos[0].alt'));
    });

    it('C-09 flags alt text that only says "screenshot"', () => {
      const c = variant((c) => (c.projects[0]!.screen = { image: KNOWN_IMAGE, alt: 'Screenshot' }));
      expect(found(c)).toEqual(one('C-09', 'projects[0].screen.alt'));
    });

    it('C-09 accepts an image with descriptive alt text', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        Object.assign(c.about.photos[0]!, { image: KNOWN_IMAGE, alt: 'Snow on the San Gabriel Mountains' });
      });
      expect(found(c)).toEqual([]);
    });

    it('C-10 flags a caption with surrounding spaces', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        c.about.photos[0]!.caption = ' Mt. Baldy at dawn';
      });
      expect(found(c)).toEqual(one('C-10', 'about.photos[0].caption'));
    });

    it('C-10 flags an empty caption', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        c.about.photos[0]!.caption = '';
      });
      expect(found(c)).toEqual(one('C-10', 'about.photos[0].caption'));
    });

    it('C-10 flags a caption longer than 120 characters', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        c.about.photos[0]!.caption = `M${'m'.repeat(120)}`; // 121 characters
      });
      expect(found(c)).toEqual(one('C-10', 'about.photos[0].caption'));
    });

    it('C-10 accepts a caption of exactly 120 characters', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        c.about.photos[0]!.caption = `M${'m'.repeat(119)}`;
      });
      expect(found(c)).toEqual([]);
    });

    it('C-11 flags a media id that is not in the manifest', () => {
      const c = variant((c) => (c.site.sectionsImage = NEVER_GENERATED));
      expect(found(c)).toEqual(one('C-11', 'site.sectionsImage'));
    });

    it('C-11 flags a project screenshot that has not been generated', () => {
      const c = variant((c) => (c.projects[0]!.screen = { image: NEVER_GENERATED, alt: 'SagePlan requirements dashboard' }));
      expect(found(c)).toEqual(one('C-11', 'projects[0].screen.image'));
    });

    it('C-11 checks against the mediaIds option when given', () => {
      const c = variant((c) => (c.projects[0]!.screen = { image: NEVER_GENERATED, alt: 'SagePlan requirements dashboard' }));
      expect(found(c, { mediaIds: [KNOWN_IMAGE, base.site.sectionsImage, NEVER_GENERATED] })).toEqual([]);
      expect(found(base, { mediaIds: [] })).toEqual(imagePaths(base).map((path) => ({ rule: 'C-11', path })));
    });

    it('C-17 flags more than 8 photos', () => {
      const c = variant((c) => ensurePhotos(c, 9));
      expect(found(c)).toEqual(one('C-17', 'about.photos'));
    });

    it('C-17 accepts no photos at all', () => {
      const c = variant((c) => (c.about.photos = []));
      expect(found(c)).toEqual([]);
    });

    it('C-17 flags a photo id not shaped like photo-N', () => {
      const c = variant((c) => {
        ensurePhotos(c, 1);
        c.about.photos[0]!.id = 'photo-three';
      });
      expect(found(c)).toEqual(one('C-17', 'about.photos[0].id'));
    });

    it('C-17 flags a duplicate photo id at the second occurrence', () => {
      const last = Math.max(2, base.about.photos.length) - 1;
      const c = variant((c) => {
        ensurePhotos(c, 2);
        c.about.photos[last]!.id = c.about.photos[0]!.id;
      });
      expect(found(c)).toEqual(one('C-17', `about.photos[${last}].id`));
    });
  });

  describe('recording rules (C-22)', () => {
    const SRC = '/media/video/demo-app.mp4' as const;
    const recording = { src: SRC, width: 1270, height: 954 };
    /** Byte sizes of every recording the base already has, plus the fixture's. */
    const sizes = (extra: Record<string, number> = { [SRC]: 485_602 }) => ({
      ...Object.fromEntries(base.projects.flatMap((p) => (p.screen.video ? [[p.screen.video.src, 1000]] : []))),
      ...extra,
    });
    /** projects[0] with a poster and a recording; `change` then breaks one clause. */
    const withRecording = (change: (v: Mutable<NonNullable<Content['projects'][number]['screen']['video']>>, c: Mutable<Content>) => void = () => {}) =>
      variant((c) => {
        const video = { ...recording };
        c.projects[0]!.screen = { image: KNOWN_IMAGE, alt: 'The demo app running in a browser window', video };
        change(video, c);
      });

    it('C-22 accepts a recording with a poster, a valid src, a present file, and a landscape size', () => {
      expect(found(withRecording(), { videoSizes: sizes() })).toEqual([]);
    });

    it('C-22 flags a recording without a poster image', () => {
      const c = withRecording((_v, c) => Object.assign(c.projects[0]!.screen, { image: null, alt: null }));
      expect(found(c, { videoSizes: sizes() })).toEqual(one('C-22', 'projects[0].screen.image'));
    });

    it('C-22 flags a src outside /media/video/<lowercase-name>.mp4', () => {
      const c = withRecording((v) => (v.src = '/media/video/Demo_App.mp4'));
      expect(found(c, { videoSizes: sizes({ '/media/video/Demo_App.mp4': 1000 }) })).toEqual(
        one('C-22', 'projects[0].screen.video.src'),
      );
    });

    it('C-22 flags a recording whose file is missing', () => {
      expect(found(withRecording(), { videoSizes: sizes({}) })).toEqual(one('C-22', 'projects[0].screen.video.src'));
    });

    it('C-22 flags a file over 3 MB', () => {
      expect(found(withRecording(), { videoSizes: sizes({ [SRC]: 3 * 1024 * 1024 + 1 }) })).toEqual(
        one('C-22', 'projects[0].screen.video.src'),
      );
    });

    it('C-22 accepts a file of exactly 3 MB', () => {
      expect(found(withRecording(), { videoSizes: sizes({ [SRC]: 3 * 1024 * 1024 }) })).toEqual([]);
    });

    it('C-22 flags a width that is not a positive integer', () => {
      const c = withRecording((v) => (v.width = 0));
      expect(found(c, { videoSizes: sizes() })).toEqual(one('C-22', 'projects[0].screen.video.width'));
    });

    it('C-22 flags a fractional height', () => {
      const c = withRecording((v) => (v.height = 953.5));
      expect(found(c, { videoSizes: sizes() })).toEqual(one('C-22', 'projects[0].screen.video.height'));
    });

    it('C-22 flags a recording taller than it is wide', () => {
      const c = withRecording((v) => Object.assign(v, { width: 954, height: 1270 }));
      expect(found(c, { videoSizes: sizes() })).toEqual(one('C-22', 'projects[0].screen.video'));
    });

    it('C-22 checks the file only when videoSizes is given', () => {
      expect(found(withRecording())).toEqual([]);
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
      const c = variant((c) => (c.site.updated = nextDay(today)));
      expect(found(c)).toEqual(one('C-14', 'site.updated'));
    });

    it('C-14 accepts a leap day', () => {
      const c = variant((c) => (c.site.updated = '2024-02-29'));
      expect(found(c)).toEqual([]);
    });

    it('C-14 defaults today to the current UTC date', () => {
      const c = variant((c) => (c.site.updated = '2999-01-01'));
      expect(validateContent(c).filter((v) => v.rule === 'C-14').map((v) => v.path)).toEqual(['site.updated']);
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
});

/** Byte size of every recording the content references, read from frontend/public (missing files left out). */
function recordingSizes(c: Content): Record<string, number> {
  const publicDir = fileURLToPath(new URL('../../public', import.meta.url));
  return Object.fromEntries(
    c.projects.flatMap((p) => {
      const src = p.screen.video?.src;
      const file = src && path.join(publicDir, src);
      return file && existsSync(file) ? [[src, statSync(file).size]] : [];
    }),
  );
}

describe('the real content', () => {
  it('satisfies every invariant C-01 to C-20 and C-22', () => {
    const violations = validateContent(content, { videoSizes: recordingSizes(content) });
    const report = violations.map((v) => `  ${v.rule} at ${v.path}: ${v.message}`).join('\n');
    expect(violations, `The content has problems. Fix each one, then run npm run test:contract again.\n${report}\n`).toEqual([]);
  });
});
