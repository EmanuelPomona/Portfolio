// Owner: agent/backend. Types for ./media-lib.mjs, so TypeScript tests (C-21) can share the pipeline's helpers.
import type { Sharp } from 'sharp';
import type { MediaAsset } from '../src/content/media';

export declare const IVORY: string;
export declare const WIDTH_STEPS: readonly number[];
export declare function prepareSource(image: Sharp): Sharp;
export declare function mediaIdFromPath(rel: string): string;
export declare function planWidths(originalWidth: number): number[];
export declare function renditionPath(id: string, width: number, ext: 'avif' | 'webp' | 'jpg'): string;
export declare function isRenditionFile(rel: string): boolean;
export declare function meanColor(data: Uint8Array, channels: number): string;
export declare function manifestEntry(
  id: string,
  widths: number[],
  size: { width: number; height: number },
  placeholder: string,
): MediaAsset;
export declare function renderManifest(manifest: Record<string, MediaAsset>): string;
