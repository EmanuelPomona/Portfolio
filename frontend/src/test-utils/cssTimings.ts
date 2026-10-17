// Owner: agent/frontend. Test-only: reads motion timings from the CSS sources, because Vitest does
// not compute styles from CSS files. Imported by *.test.ts(x) only; never by application code.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const styles = join(__dirname, '..', 'styles');
export const tokensCss = readFileSync(join(styles, 'tokens.css'), 'utf8');
export const globalCss = readFileSync(join(styles, 'global.css'), 'utf8');

/** A token's raw value from tokens.css, e.g. tokenValue('--reveal-stagger') -> '0.05s'. */
export function tokenValue(name: string): string {
  const match = tokensCss.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token ${name} not found in tokens.css`);
  return match[1]!.trim();
}

/** Resolves '0.12s', '48px' or 'var(--token)' to a number in seconds or px. */
export function resolveNumber(value: string): number {
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  const raw = ref ? tokenValue(ref[1]!) : value;
  const n = raw.match(/^(-?[\d.]+)(s|px)$/);
  if (!n) throw new Error(`cannot resolve ${value}`);
  return Number(n[1]);
}

/**
 * The fog-clear delay, in seconds, of the n-th child (1-based) of a data-fog="stagger" element:
 * global.css sets --fog-delay as calc(k * var(--reveal-stagger)) per :nth-child.
 */
export function fogDelay(n: number): number {
  const stagger = resolveNumber(tokenValue('--reveal-stagger'));
  let k = 0;
  const rules = globalCss.matchAll(
    /> :nth-child\(([^)]+)\)\s*\{\s*--fog-delay:\s*calc\(([\d.]+) \* var\(--reveal-stagger\)\);?\s*\}/g,
  );
  for (const [, selector, factor] of rules) {
    const exact = /^\d+$/.test(selector!) && Number(selector) === n;
    const from = selector!.match(/^n \+ (\d+)$/);
    if (exact || (from && n >= Number(from[1]))) k = Number(factor);
  }
  return k * stagger;
}

/**
 * The value of `prop` in the last rule of a CSS module whose selector list names `.cls` on its
 * own (outside @media), or null when no such rule sets it.
 */
export function partDeclaration(css: string, cls: string, prop: string): string | null {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');
  let value: string | null = null;
  for (const [, selectors, body] of flat.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!selectors!.split(',').some((s) => s.trim() === `.${cls}`)) continue;
    const decl = body!.match(new RegExp(`${prop}:\\s*([^;]+);`));
    if (decl) value = decl[1]!.trim();
  }
  return value;
}
