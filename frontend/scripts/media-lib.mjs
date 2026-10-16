// Owner: agent/backend. Pure helpers for the media pipeline (docs/API.md §3). No I/O here.

/** Rendition steps in pixels. An image never gets a rendition wider than itself. */
export const WIDTH_STEPS = Object.freeze([640, 1024, 1600, 2400]);

/** Lowercase kebab-case segments separated by "/", then a supported image extension. */
const SOURCE_NAME = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*\.(png|jpe?g|webp)$/;

/**
 * Manifest id for a source path relative to media-src: the path without its extension.
 * @param {string} rel e.g. "projects/sageplan.png"
 * @returns {string} e.g. "projects/sageplan"
 */
export function mediaIdFromPath(rel) {
  if (!SOURCE_NAME.test(rel)) throw new Error(`media-src/${rel}: name must be lowercase kebab-case`);
  return rel.slice(0, rel.lastIndexOf('.'));
}

/**
 * Rendition widths for an image `originalWidth` pixels wide, ascending: every step that fits,
 * plus the original width when it falls between steps (below the largest step).
 * @param {number} originalWidth
 * @returns {number[]}
 */
export function planWidths(originalWidth) {
  if (!Number.isInteger(originalWidth) || originalWidth < 1) {
    throw new RangeError(`image width must be a positive integer, got ${originalWidth}`);
  }
  const widths = WIDTH_STEPS.filter((w) => w <= originalWidth);
  const largestStep = WIDTH_STEPS[WIDTH_STEPS.length - 1];
  if (!WIDTH_STEPS.includes(originalWidth) && originalWidth < largestStep) widths.push(originalWidth);
  return widths;
}

/**
 * Public URL path of one rendition.
 * @param {string} id
 * @param {number} width
 * @param {'avif' | 'webp' | 'jpg'} ext
 * @returns {string}
 */
export function renditionPath(id, width, ext) {
  return `/media/${id}-${width}.${ext}`;
}
