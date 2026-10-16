// Owner: agent/frontend. What "attending" means on a touch screen (TASK-103).

/**
 * True when the element's vertical midpoint lies within the middle `band` of the viewport:
 * [(1 - band) / 2 × vh, (1 + band) / 2 × vh], edges included.
 */
export function inCenterBand(
  rect: { readonly top: number; readonly bottom: number },
  viewportHeight: number,
  band = 0.4,
): boolean {
  const midpoint = (rect.top + rect.bottom) / 2;
  const low = ((1 - band) / 2) * viewportHeight;
  const high = ((1 + band) / 2) * viewportHeight;
  return midpoint >= low && midpoint <= high;
}
