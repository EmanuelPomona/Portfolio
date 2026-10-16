/**
 * MEDIA CONTRACT. Owner: manager.
 * The manifest itself (media.generated.ts) is produced by `npm run media` (owner: agent/backend).
 * Semantics: docs/API.md §3 and docs/DATABASE.md "MediaAsset".
 */
import { mediaManifest } from './media.generated';

/** Modern formats, best first. JPEG is always present as `fallback`. */
export type MediaFormat = 'image/avif' | 'image/webp';

export interface MediaSource {
  readonly type: MediaFormat;
  /** Standard srcset string: "/media/x-640.avif 640w, /media/x-1280.avif 1280w". */
  readonly srcset: string;
}

export interface MediaAsset {
  /** Path under frontend/media-src without extension, e.g. "backgrounds/alpine-valley". */
  readonly id: string;
  /** Intrinsic size of the largest rendition, in pixels. Used for aspect ratio and to prevent layout shift. */
  readonly width: number;
  readonly height: number;
  /** CSS color of the image's average tone, painted before the image decodes. */
  readonly placeholder: string;
  /** Ordered best first (avif, then webp). May be empty. */
  readonly sources: readonly MediaSource[];
  /** JPEG: `src` is the largest rendition; `srcset` lists every JPEG width. */
  readonly fallback: { readonly src: string; readonly srcset: string };
}

export type MediaId = keyof typeof mediaManifest;

export function getMedia(id: MediaId): MediaAsset {
  return mediaManifest[id];
}

export function isMediaId(id: string): id is MediaId {
  return Object.hasOwn(mediaManifest, id);
}
