// Owner: agent/frontend. Scroll depth (TASK-108, M-03): how far a background lags the content.

/**
 * How much each layer lags the content (0 = moves with it). Farther layers lag more, so the page
 * reads in depth: the far forest, then the valley photograph, then the clouds, then the plates.
 * Feel values, tuned in the browser; with the 80px clamp, 0.1 is about the most a viewport-tall
 * layer can use before it would pin at the clamp while still in view.
 */
export const DEPTH = {
  backdrop: 0.1,
  hero: 0.08,
  valleyCloud: 0.06,
  forestCloud: 0.04,
} as const;

export interface DepthMeasure {
  /** The element's top in document coordinates (its layout position, without any depth offset). */
  readonly top: number;
  readonly height: number;
  readonly scrollY: number;
  readonly viewportHeight: number;
}

/**
 * The translateY, in px, that makes a layer travel slower than the content by `factor`.
 * 0 when the element's center is at the viewport's center; positive (down) once the element has
 * scrolled past it, so the layer lags behind; clamped to [-maxPx, maxPx].
 */
export function depthOffset(m: DepthMeasure, factor: number, maxPx: number): number {
  const distance = m.top + m.height / 2 - (m.scrollY + m.viewportHeight / 2);
  const offset = -distance * factor;
  // `+ 0` folds -0 into 0, so a centered element reads as exactly 0.
  return Math.min(maxPx, Math.max(-maxPx, offset)) + 0;
}
