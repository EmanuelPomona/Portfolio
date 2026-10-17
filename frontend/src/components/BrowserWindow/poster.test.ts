import { describe, expect, it } from 'vitest';
import type { MediaAsset } from '../../content';
import { POSTER_WIDTH, posterUrl } from './poster';

/** A synthetic manifest entry: renditions at the given widths, in the given formats. */
function asset(widths: readonly number[], formats: readonly ('avif' | 'webp')[] = ['avif', 'webp']): MediaAsset {
  const srcset = (ext: string) => widths.map((w) => `/media/x/shot-${w}.${ext} ${w}w`).join(', ');
  const largest = Math.max(...widths);
  return {
    id: 'x/shot',
    width: largest,
    height: Math.round(largest * 0.625),
    placeholder: '#222',
    sources: formats.map((f) => ({ type: `image/${f}`, srcset: srcset(f) })),
    fallback: { src: `/media/x/shot-${largest}.jpg`, srcset: srcset('jpg') },
  } as MediaAsset;
}

describe('posterUrl', () => {
  it('picks the smallest WebP rendition at least POSTER_WIDTH wide', () => {
    expect(POSTER_WIDTH).toBe(1280);
    expect(posterUrl(asset([640, 1280, 1600, 1920]))).toBe('/media/x/shot-1280.webp');
    expect(posterUrl(asset([640, 1024, 1600, 2400]))).toBe('/media/x/shot-1600.webp');
    // The manifest's order is not relied on.
    expect(posterUrl(asset([2400, 640, 1600, 1024]))).toBe('/media/x/shot-1600.webp');
  });

  it('picks the largest WebP when every rendition is narrower', () => {
    expect(posterUrl(asset([640, 1024]))).toBe('/media/x/shot-1024.webp');
  });

  it('falls back to the JPEG when there is no WebP, and never picks AVIF', () => {
    // A poster cannot negotiate formats, so AVIF (not universal) is never the poster.
    expect(posterUrl(asset([640, 1600], ['avif']))).toBe('/media/x/shot-1600.jpg');
    expect(posterUrl(asset([640, 1600], []))).toBe('/media/x/shot-1600.jpg');
  });
});
