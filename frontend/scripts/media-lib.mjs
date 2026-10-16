// Owner: agent/backend. Pure helpers for the media pipeline (docs/API.md §3). No I/O here.

/**
 * Manifest id for a source path relative to media-src: the path without its extension.
 * @param {string} rel e.g. "projects/sageplan.png"
 * @returns {string} e.g. "projects/sageplan"
 */
export function mediaIdFromPath(rel) {
  return rel;
}

/**
 * Rendition widths for an image `originalWidth` pixels wide, ascending.
 * @param {number} originalWidth
 * @returns {number[]}
 */
export function planWidths(originalWidth) {
  return [originalWidth];
}

/**
 * Public URL path of one rendition.
 * @param {string} id
 * @param {number} width
 * @param {'avif' | 'webp' | 'jpg'} ext
 * @returns {string}
 */
export function renditionPath(id, width, ext) {
  return `${id}.${ext}${width}`;
}
