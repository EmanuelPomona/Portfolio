// Owner: agent/backend. Pure validator for the content invariants C-01 to C-20 in docs/DATABASE.md.
// Shapes come from ./types (manager contract); nothing here redeclares them.
//
// It never throws on bad content: it collects every violation so the owner sees all problems at
// once. Messages are written for a non-engineer; frontend/src/content/README.md explains each rule.
import { isMediaId } from './media';
import type { Content, LifePhoto, Link, LinkKind, ProjectScreen } from './types';

export type RuleId = 'C-01' | 'C-02' | 'C-03' | 'C-04' | 'C-05' | 'C-06' | 'C-07' | 'C-08' | 'C-09'
  | 'C-10' | 'C-11' | 'C-12' | 'C-13' | 'C-14' | 'C-15' | 'C-16' | 'C-17' | 'C-18' | 'C-19' | 'C-20';

export interface ContentViolation {
  rule: RuleId;
  /** Dotted locator into the content, e.g. `projects[2].sentence`. */
  path: string;
  /** Plain-language explanation and fix, written for the site owner. */
  message: string;
}

const EM_DASH = '—';
/** A sentence end followed by the start of another sentence. Decimals (0.13) and "e.g. the" do not match. */
const SENTENCE_BREAK = /[.!?]\s+[A-Z]/g;
/** Whole words, case-insensitive, with an optional plural "s" ("todos" is flagged, "photodocument" is not). */
const PLACEHOLDER = /\b(?:lorem|ipsum|todo|tbd|placeholder)s?\b|\bcoming\s+soon\b/i;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TRAILING_PUNCTUATION = /[.,;:!?]$/;
const MAILTO = /^mailto:[^\s@]+@[^\s@]+$/;
const REQUIRED_CONTACT_KINDS: readonly LinkKind[] = ['linkedin', 'email', 'github'];
const GENERIC_ALT = /^(?:image|photo|screenshot)[.!]?$/i;
const PHOTO_ID = /^photo-\d+$/;

/** Length in characters as a reader counts them (code points, not UTF-16 units). */
const length = (s: string) => [...s].length;

/** Sentences in `s`, counting breaks before the final character only. */
const sentenceCount = (s: string) => 1 + (s.slice(0, -1).match(SENTENCE_BREAK)?.length ?? 0);

/** Why `href` is not an allowed link, or null when it is (C-05). */
function hrefProblem(href: string): string | null {
  if (href.startsWith('mailto:')) {
    return MAILTO.test(href) ? null : 'An email link must look like mailto:name@example.com.';
  }
  if (!href.startsWith('https://')) return 'Links must start with https:// (or mailto: for email).';
  try {
    new URL(href);
    return null;
  } catch {
    return `"${href}" is not a valid web address.`;
  }
}

/** Every string anywhere in `value`, with its dotted path. */
function* strings(value: unknown, path: string): Generator<[path: string, text: string]> {
  if (typeof value === 'string') {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${path}[${i}]`);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) yield* strings(child, path ? `${path}.${key}` : key);
  }
}

export function validateContent(
  c: Content,
  opts: { today?: string; mediaIds?: readonly string[] } = {},
): ContentViolation[] {
  const out: ContentViolation[] = [];
  const add = (rule: RuleId, path: string, message: string) => out.push({ rule, path, message });

  // C-01: no em dash anywhere.
  for (const [path, text] of strings(c, '')) {
    if (text.includes(EM_DASH)) {
      add('C-01', path, 'Contains an em dash (the long dash). Use a comma, a colon, or parentheses instead.');
    }
  }

  // C-02: each project sentence is exactly one sentence, ends with a period, and is at most 200 characters.
  c.projects.forEach((p, i) => {
    const path = `projects[${i}].sentence`;
    if (!p.sentence.endsWith('.')) add('C-02', path, 'The project sentence must end with a period.');
    const n = sentenceCount(p.sentence);
    if (n > 1) {
      add('C-02', path, `The project sentence must be one sentence, but it reads as ${n}. Join them with a comma or a semicolon.`);
    }
    if (length(p.sentence) > 200) {
      add('C-02', path, `The project sentence is ${length(p.sentence)} characters; the limit is 200.`);
    }
  });

  // C-03, C-04, C-07, C-08: project structure.
  const projectIds = new Set<string>();
  c.projects.forEach((p, i) => {
    const at = `projects[${i}]`;

    if (!KEBAB.test(p.id)) {
      add('C-03', `${at}.id`, `The project id "${p.id}" must be lowercase words joined by hyphens, like "street-safe".`);
    }
    if (projectIds.has(p.id)) add('C-03', `${at}.id`, `The project id "${p.id}" is already used by another project.`);
    projectIds.add(p.id);

    if (p.meta.length < 1 || p.meta.length > 4) {
      add('C-04', `${at}.meta`, `The meta line has ${p.meta.length} items; it needs 1 to 4.`);
    }
    p.meta.forEach((item, j) => {
      if (length(item) > 40) add('C-04', `${at}.meta[${j}]`, `"${item}" is ${length(item)} characters; each meta item is at most 40.`);
      if (TRAILING_PUNCTUATION.test(item)) add('C-04', `${at}.meta[${j}]`, `"${item}" ends with punctuation; remove it.`);
    });

    const address = p.primary.href.replace(/^https:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
    if (p.addressBar !== address) {
      add('C-07', `${at}.addressBar`, `The address bar must read "${address}": the main link without https://, www., or a trailing slash.`);
    }

    if (p.primary.kind !== 'live' && p.primary.kind !== 'code') {
      add('C-08', `${at}.primary.kind`, `The main link must be the live site or the code, not "${p.primary.kind}".`);
    }
    p.secondary.forEach((link, j) => {
      if (link.kind === 'live') {
        add('C-08', `${at}.secondary[${j}].kind`, 'A live site link must be the main link (primary), not a secondary one.');
      }
    });
  });

  // C-05: every link is https:// or mailto:name@domain.
  const links: [path: string, link: Link][] = [
    ...c.site.heroLinks.map((l, i): [string, Link] => [`site.heroLinks[${i}]`, l]),
    ...c.projects.flatMap((p, i): [string, Link][] => [
      [`projects[${i}].primary`, p.primary],
      ...p.secondary.map((l, j): [string, Link] => [`projects[${i}].secondary[${j}]`, l]),
    ]),
    ...c.contact.links.map((l, i): [string, Link] => [`contact.links[${i}]`, l]),
  ];
  for (const [path, link] of links) {
    const problem = hrefProblem(link.href);
    if (problem) add('C-05', `${path}.href`, problem);
  }

  // C-06: no two links in one project share an href.
  c.projects.forEach((p, i) => {
    const seen = new Set([p.primary.href]);
    p.secondary.forEach((link, j) => {
      if (seen.has(link.href)) {
        add('C-06', `projects[${i}].secondary[${j}].href`, `This link repeats another link of the same project (${link.href}). Remove one.`);
      }
      seen.add(link.href);
    });
  });

  // C-18: contact link kinds are unique and include LinkedIn, Email, and GitHub.
  const contactKinds = new Set<string>();
  c.contact.links.forEach((link, i) => {
    if (contactKinds.has(link.kind)) {
      add('C-18', `contact.links[${i}].kind`, `There is already a "${link.kind}" contact link. Keep one of each kind.`);
    }
    contactKinds.add(link.kind);
  });
  const missingKinds = REQUIRED_CONTACT_KINDS.filter((kind) => !contactKinds.has(kind));
  if (missingKinds.length > 0) {
    add('C-18', 'contact.links', `The contact links must include ${missingKinds.join(', ')}.`);
  }

  // C-19: every hero link also appears in the contact links.
  const contactHrefs = new Set(c.contact.links.map((link) => link.href));
  c.site.heroLinks.forEach((link, i) => {
    if (!contactHrefs.has(link.href)) {
      add('C-19', `site.heroLinks[${i}].href`, `The hero link ${link.href} must also be one of the contact links.`);
    }
  });

  // C-09: an image and its alt text come together, and the alt text describes something.
  const slots: [path: string, slot: { readonly image: string | null; readonly alt: string | null }][] = [
    ...c.projects.map((p, i): [string, ProjectScreen] => [`projects[${i}].screen`, p.screen]),
    ...c.about.photos.map((ph, i): [string, LifePhoto] => [`about.photos[${i}]`, ph]),
  ];
  for (const [at, { image, alt }] of slots) {
    if (image === null && alt !== null) {
      add('C-09', `${at}.alt`, 'There is alt text but no image. Set both image and alt, or set both to null.');
    }
    if (image !== null && alt === null) {
      add('C-09', `${at}.alt`, 'This image needs alt text: a short description of what it shows.');
    }
    if (alt !== null) {
      if (length(alt.trim()) < 8) {
        add('C-09', `${at}.alt`, `The alt text "${alt}" is too short; describe the image in at least 8 characters.`);
      } else if (GENERIC_ALT.test(alt.trim())) {
        add('C-09', `${at}.alt`, `The alt text "${alt}" must say what the image shows, not just what kind of image it is.`);
      }
    }
  }

  // C-10: a caption is null, or trimmed, non-empty text of at most 120 characters.
  c.about.photos.forEach((ph, i) => {
    const path = `about.photos[${i}].caption`;
    if (ph.caption === null) return;
    if (ph.caption.trim() === '') add('C-10', path, 'The caption is empty. Use null for no caption.');
    else if (ph.caption !== ph.caption.trim()) add('C-10', path, 'The caption has spaces at the start or end; remove them.');
    if (length(ph.caption) > 120) add('C-10', path, `The caption is ${length(ph.caption)} characters; the limit is 120.`);
  });

  // C-11: every referenced image exists in the media manifest.
  const known = opts.mediaIds ? new Set(opts.mediaIds) : null;
  const hasMedia = (id: string) => (known ? known.has(id) : isMediaId(id));
  const images: [path: string, id: string | null][] = [
    ['site.heroImage', c.site.heroImage],
    ['site.sectionsImage', c.site.sectionsImage],
    ...c.projects.map((p, i): [string, string | null] => [`projects[${i}].screen.image`, p.screen.image]),
    ...c.about.photos.map((ph, i): [string, string | null] => [`about.photos[${i}].image`, ph.image]),
  ];
  for (const [path, id] of images) {
    if (id !== null && !hasMedia(id)) {
      add('C-11', path, `There is no generated image "${id}". Put the file in frontend/media-src/ and run npm run media.`);
    }
  }

  // C-17: 0 to 8 photos, with unique ids shaped like photo-N.
  if (c.about.photos.length > 8) {
    add('C-17', 'about.photos', `There are ${c.about.photos.length} photos; the collage holds at most 8.`);
  }
  const photoIds = new Set<string>();
  c.about.photos.forEach((ph, i) => {
    if (!PHOTO_ID.test(ph.id)) add('C-17', `about.photos[${i}].id`, `The photo id "${ph.id}" must look like photo-1, photo-2, and so on.`);
    if (photoIds.has(ph.id)) add('C-17', `about.photos[${i}].id`, `The photo id "${ph.id}" is already used by another photo.`);
    photoIds.add(ph.id);
  });

  // C-16: the about description is one or two complete sentences and at most 320 characters.
  {
    const path = 'about.description';
    const text = c.about.description;
    if (!/[.!?]$/.test(text)) add('C-16', path, 'The description must end with a period, question mark, or exclamation mark.');
    const n = sentenceCount(text);
    if (n > 2) add('C-16', path, `The description must be one or two sentences, but it reads as ${n}.`);
    if (length(text) > 320) add('C-16', path, `The description is ${length(text)} characters; the limit is 320.`);
  }

  // C-20: no placeholder words anywhere.
  for (const [path, text] of strings(c, '')) {
    const hit = PLACEHOLDER.exec(text);
    if (hit) add('C-20', path, `Contains the placeholder word "${hit[0]}". Replace it with real text, or remove the entry.`);
  }

  // Stable sort: rule order first, then the order the content was walked.
  return out.sort((a, b) => a.rule.localeCompare(b.rule));
}
