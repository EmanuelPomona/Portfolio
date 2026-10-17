// @vitest-environment node
// Owner: agent/backend. C-21 (docs/DATABASE.md): the media manifest is current with media-src/ and
// public/media/. Part of `npm run test:contract`. Every failure here is fixed by running `npm run media`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { meanColor, prepareSource } from '../../scripts/media-lib.mjs';
import { mp4Info } from '../../scripts/mp4-boxes.mjs';
import { content } from './index';
import { mediaManifest } from './media.generated';

const FRONTEND = fileURLToPath(new URL('../..', import.meta.url));
const MEDIA_SRC = path.join(FRONTEND, 'media-src');
const PUBLIC = path.join(FRONTEND, 'public');
const LARGEST_STEP = 2400; // docs/API.md §3: no rendition is wider than 2400 or than the original.
const RUN_MEDIA = 'Run `npm run media` and commit what it changes.';

const entries = Object.values(mediaManifest);

/**
 * Image sources in media-src, as [id, file] with forward-slash ids. Dotfiles and notes are not sources,
 * and media-src/video/ holds recordings for `npm run video` (C-22 covers those), not images.
 */
function sources(): [id: string, file: string][] {
  return readdirSync(MEDIA_SRC, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(MEDIA_SRC, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
    .filter((rel) => !rel.split('/').some((part) => part.startsWith('.')) && !rel.toLowerCase().endsWith('.md'))
    .filter((rel) => !rel.startsWith('video/'))
    .sort()
    .map((rel): [string, string] => [rel.slice(0, rel.lastIndexOf('.')), path.join(MEDIA_SRC, rel)]);
}

/** Every URL a manifest entry points at. */
function urlsOf(entry: (typeof entries)[number]): string[] {
  const srcsets = [...entry.sources.map((s) => s.srcset), entry.fallback.srcset];
  return [entry.fallback.src, ...srcsets.flatMap((srcset) => srcset.split(', ').map((part) => part.split(' ')[0]!))];
}

describe('C-21 media manifest is current', () => {
  it('every image in media-src has a manifest entry', () => {
    const missing = sources()
      .map(([id]) => id)
      .filter((id) => !Object.hasOwn(mediaManifest, id));
    expect(missing, `These images are not processed yet. ${RUN_MEDIA}`).toEqual([]);
  });

  it('every manifest entry still has its image in media-src', () => {
    const ids = new Set(sources().map(([id]) => id));
    const orphaned = entries.map((e) => e.id).filter((id) => !ids.has(id));
    expect(orphaned, `These images were removed from media-src. ${RUN_MEDIA}`).toEqual([]);
  });

  it("every entry's renditions exist under public/media", () => {
    const absent = entries.flatMap(urlsOf).filter((url) => !existsSync(path.join(PUBLIC, url)));
    expect(absent, `These files are missing. ${RUN_MEDIA}`).toEqual([]);
  });

  it('every entry matches the current width of its source image', async () => {
    const stale: string[] = [];
    for (const [id, file] of sources()) {
      const entry = entries.find((e) => e.id === id);
      if (!entry) continue; // reported by the first test
      const meta = await sharp(file).metadata();
      const expected = Math.min(meta.autoOrient.width, LARGEST_STEP);
      if (entry.width !== expected) stale.push(`${id}: manifest says ${entry.width}px wide, the image needs ${expected}px`);
    }
    expect(stale, `These images changed since they were processed. ${RUN_MEDIA}`).toEqual([]);
  });

  // A replaced image of the same size keeps its width, so also recompute the placeholder (the mean color)
  // from the current source with the pipeline's own decode recipe. This misses only a replacement with
  // an identical mean color, such as a mirrored copy.
  it('every entry was made from the current version of its image', { timeout: 60_000 }, async () => {
    const stale: string[] = [];
    for (const [id, file] of sources()) {
      const entry = entries.find((e) => e.id === id);
      if (!entry) continue; // reported by the first test
      const { data, info } = await prepareSource(sharp(file)).raw().toBuffer({ resolveWithObject: true });
      const placeholder = meanColor(data, info.channels);
      if (entry.placeholder !== placeholder) {
        stale.push(`${id}: the image changed (average color ${placeholder}; the manifest has ${entry.placeholder})`);
      }
    }
    expect(stale, `These images were replaced since they were processed. ${RUN_MEDIA}`).toEqual([]);
  });

  it('every non-null image in the content points at a manifest entry', () => {
    const { site, projects, about } = content;
    const images: [string, string | null][] = [
      ['site.heroImage', site.heroImage],
      ['site.sectionsImage', site.sectionsImage],
      ...projects.map((p, i): [string, string | null] => [`projects[${i}].screen.image`, p.screen.image]),
      ...about.photos.map((ph, i): [string, string | null] => [`about.photos[${i}].image`, ph.image]),
    ];
    const dangling = images.filter(([, id]) => id !== null && !Object.hasOwn(mediaManifest, id));
    expect(dangling, `These images are not in the manifest. ${RUN_MEDIA}`).toEqual([]);
  });
});

// Recordings (ADR-012). C-22 itself is checked by validateContent; these keep the files and the
// content in step: no encoded recording ships unused, and the size a project declares (which sets the
// layout before the video loads) is the file's real size.
describe('recordings in public/media/video', () => {
  const VIDEO_DIR = path.join(PUBLIC, 'media', 'video');
  const used = content.projects.flatMap((p) => (p.screen.video ? [p.screen.video] : []));

  it('every encoded recording is used by a project', () => {
    const files = existsSync(VIDEO_DIR) ? readdirSync(VIDEO_DIR).filter((f) => !f.startsWith('.')) : [];
    const unused = files.filter((f) => !used.some((v) => v.src === `/media/video/${f}`));
    expect(unused, 'These recordings are not used by any project. Delete them, or set a project\'s screen.video.').toEqual([]);
  });

  it('every project recording is H.264 at the width and height the project declares', () => {
    const wrong = used.flatMap((v) => {
      const file = path.join(PUBLIC, v.src);
      if (!existsSync(file)) return []; // C-22 reports a missing file
      const info = mp4Info(readFileSync(file));
      const ok = info.formats.join() === 'avc1' && info.sizes.length === 1 && info.sizes[0]![0] === v.width && info.sizes[0]![1] === v.height;
      return ok ? [] : [`${v.src}: the file is ${info.formats.join() || 'no video'} ${info.sizes.map((s) => s.join('x')).join()}, the project says ${v.width}x${v.height}`];
    });
    expect(wrong, 'Copy the size npm run video printed into projects.ts.').toEqual([]);
  });
});
