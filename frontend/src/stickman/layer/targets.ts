// Owner: agent/stickman. What the stickman treats as a target (docs/API.md §2.3).

/** Default targets. Pages opt in with data-stickman="target" and out with data-stickman="ignore". */
export const TARGET_SELECTOR = 'a[href], button:not([disabled]), [data-stickman="target"]';
export const IGNORE_SELECTOR = '[data-stickman="ignore"]';

/** The nearest target at or above `el`, or null when there is none or it sits in an ignored area. */
export function findTarget(el: Element | null): Element | null {
  if (!el || el.closest(IGNORE_SELECTOR)) return null;
  return el.closest(TARGET_SELECTOR);
}
