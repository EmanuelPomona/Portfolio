// Owner: agent/backend. Pure validator for the content invariants C-01 to C-20 in docs/DATABASE.md.
// Shapes come from ./types (manager contract); nothing here redeclares them.
//
// It never throws on bad content: it collects every violation so the owner sees all problems at
// once. Messages are written for a non-engineer; frontend/src/content/README.md explains each rule.
import type { Content } from './types';

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

/** Length in characters as a reader counts them (code points, not UTF-16 units). */
const length = (s: string) => [...s].length;

/** Sentences in `s`, counting breaks before the final character only. */
const sentenceCount = (s: string) => 1 + (s.slice(0, -1).match(SENTENCE_BREAK)?.length ?? 0);

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
  _opts: { today?: string; mediaIds?: readonly string[] } = {},
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

  return out;
}
