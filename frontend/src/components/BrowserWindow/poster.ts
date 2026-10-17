// Owner: agent/frontend. The one URL a window's recording shows at rest (TASK-110, ADR-012).
import type { MediaAsset } from '../../content';

/** A window draws at most 760 CSS px wide: this covers it at about 1.7x without the largest file. */
export const POSTER_WIDTH = 1280;

/**
 * One URL for <video poster>, which cannot choose from a srcset or negotiate formats: the smallest
 * WebP rendition at least POSTER_WIDTH wide (else the largest WebP), or the JPEG fallback when the
 * asset has no WebP. Never AVIF, which not every browser that plays the video can decode.
 */
export function posterUrl(media: MediaAsset): string {
  const webp = media.sources.find((source) => source.type === 'image/webp');
  if (!webp) return media.fallback.src;
  const candidates = webp.srcset
    .split(',')
    .map((candidate) => {
      const [url = '', width = '0'] = candidate.trim().split(/\s+/);
      return { url, width: Number.parseInt(width, 10) };
    })
    .sort((a, b) => a.width - b.width);
  return (candidates.find((c) => c.width >= POSTER_WIDTH) ?? candidates.at(-1))?.url || media.fallback.src;
}
