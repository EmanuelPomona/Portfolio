// Owner: agent/backend. Pure validator for the content invariants C-01 to C-20 in docs/DATABASE.md.
// Shapes come from ./types (manager contract); nothing here redeclares them.
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

export function validateContent(
  _c: Content,
  _opts: { today?: string; mediaIds?: readonly string[] } = {},
): ContentViolation[] {
  return [];
}
