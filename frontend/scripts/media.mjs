// Owner: agent/backend. `npm run media`: the image pipeline (docs/API.md §3, ADR-005).
//
//   frontend/media-src/**/*.{png,jpg,jpeg,webp}
//     -> frontend/public/media/<id>-<width>.{avif,webp,jpg}
//     -> frontend/src/content/media.generated.ts (keys sorted)
//
// Usage: node scripts/media.mjs [--src media-src] [--out public/media] [--manifest src/content/media.generated.ts]
// Flag values resolve against the current folder; the defaults are frontend/'s own folders. The flags
// exist so the tests can run the real pipeline against a temp folder.
//
// Encoder settings. They are fixed so that the same input always gives the same bytes:
//   AVIF  quality 60, effort 4, chroma 4:4:4
//   WebP  quality 80, effort 4
//   JPEG  quality 80, mozjpeg (trellis quantisation, overshoot deringing, optimised scans)
// Widths: 640, 1024, 1600, 2400, never wider than the original, plus the original width when it falls
// between steps (helpers in ./media-lib.mjs).
//
// Each source is decoded once: auto-oriented from EXIF, flattened onto Ivory #f8f9f7 if it has
// transparency, and output as 8-bit sRGB (sharp's default, which also converts grayscale, CMYK, and
// 16-bit sources; the tests pin it). Every rendition is resized from that decode with lanczos3.
// No metadata (EXIF, ICC, XMP) and no timestamps are written. Sources are processed in sorted order.
//
// Failure: every problem (a badly named file, an unsupported type, an unreadable image) is reported
// as `media-src/<path>: <reason>`, and the run exits 1 WITHOUT touching public/media or the manifest.
// On success it writes changed renditions, deletes stale ones (only files named like renditions), and
// replaces the manifest atomically (temp file, then rename).
import { mkdir, readdir, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import {
  isRenditionFile,
  manifestEntry,
  meanColor,
  mediaIdFromPath,
  planWidths,
  prepareSource,
  renderManifest,
} from './media-lib.mjs';

const FRONTEND = fileURLToPath(new URL('..', import.meta.url));
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
/** @type {[ext: 'avif' | 'webp' | 'jpg', encode: (s: sharp.Sharp) => sharp.Sharp][]} */
const FORMATS = [
  ['avif', (s) => s.avif({ quality: 60, effort: 4, chromaSubsampling: '4:4:4' })],
  ['webp', (s) => s.webp({ quality: 80, effort: 4 })],
  ['jpg', (s) => s.jpeg({ quality: 80, mozjpeg: true })],
];

/** Forward-slash paths of every file under `dir`, relative to it, sorted. Missing folder: []. */
async function listFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
    .sort();
}

/** Sources to process, sorted by id, plus every naming problem found. */
async function discover(srcDir) {
  const sources = [];
  const problems = [];
  const byId = new Map();
  for (const rel of await listFiles(srcDir)) {
    const ignored = rel.split('/').some((part) => part.startsWith('.')) || rel.toLowerCase().endsWith('.md');
    if (ignored) continue;
    if (!IMAGE_EXTENSIONS.has(path.extname(rel).toLowerCase())) {
      problems.push(`media-src/${rel}: unsupported file type; save it as .png, .jpg, or .webp`);
      continue;
    }
    let id;
    try {
      id = mediaIdFromPath(rel);
    } catch (error) {
      problems.push(error.message);
      continue;
    }
    if (byId.has(id)) {
      problems.push(`media-src/${rel}: has the same name as media-src/${byId.get(id)}; keep only one of them`);
      continue;
    }
    byId.set(id, rel);
    sources.push({ id, rel, file: path.join(srcDir, rel) });
  }
  sources.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { sources, problems };
}

/** Every rendition of one source, in memory, plus its manifest entry. */
async function encode({ id, file }) {
  const { data, info } = await prepareSource(sharp(file)).raw().toBuffer({ resolveWithObject: true });
  const raw = { raw: { width: info.width, height: info.height, channels: info.channels } };
  const widths = planWidths(info.width);
  const files = new Map();
  let size = { width: 0, height: 0 };
  for (const width of widths) {
    for (const [ext, encoder] of FORMATS) {
      const out = await encoder(sharp(data, raw).resize({ width })).toBuffer({ resolveWithObject: true });
      files.set(`${id}-${width}.${ext}`, out.data);
      size = { width: out.info.width, height: out.info.height };
    }
  }
  return { files, widths, entry: manifestEntry(id, widths, size, meanColor(data, info.channels)) };
}

/** Write `bytes` to `file` unless it already holds exactly those bytes. Returns whether it wrote. */
async function writeIfChanged(file, bytes) {
  const current = await readFile(file).catch(() => null);
  if (current?.equals(Buffer.from(bytes))) return false;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return true;
}

/** Delete renditions nobody produced this run, then any folders left empty. Returns the count deleted. */
async function removeStale(outDir, keep) {
  let removed = 0;
  for (const rel of await listFiles(outDir)) {
    if (isRenditionFile(rel) && !keep.has(rel)) {
      await rm(path.join(outDir, rel));
      removed++;
    }
  }
  const dirs = (await readdir(outDir, { recursive: true, withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => path.join(e.parentPath, e.name))
    .sort((a, b) => b.length - a.length);
  for (const dir of dirs) {
    if ((await readdir(dir)).length === 0) await rmdir(dir);
  }
  return removed;
}

async function main() {
  const { values } = parseArgs({
    options: { src: { type: 'string' }, out: { type: 'string' }, manifest: { type: 'string' } },
    strict: true,
  });
  const srcDir = path.resolve(values.src ?? path.join(FRONTEND, 'media-src'));
  const outDir = path.resolve(values.out ?? path.join(FRONTEND, 'public', 'media'));
  const manifestFile = path.resolve(values.manifest ?? path.join(FRONTEND, 'src', 'content', 'media.generated.ts'));

  const { sources, problems } = await discover(srcDir);
  const results = [];
  if (problems.length === 0) {
    for (const source of sources) {
      try {
        results.push(await encode(source));
      } catch (error) {
        problems.push(`media-src/${source.rel}: could not read the image (${error.message})`);
      }
    }
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(problem);
    console.error(`npm run media: ${problems.length} problem(s); nothing was written.`);
    process.exitCode = 1;
    return;
  }

  const keep = new Set();
  const manifest = {};
  let written = 0;
  for (const { files, widths, entry } of results) {
    for (const [rel, bytes] of files) {
      keep.add(rel);
      if (await writeIfChanged(path.join(outDir, rel), bytes)) written++;
    }
    manifest[entry.id] = entry;
    console.log(`${entry.id}  ${entry.width}x${entry.height}  widths ${widths.join(', ')}`);
  }
  await mkdir(outDir, { recursive: true });
  const removed = await removeStale(outDir, keep);

  const text = renderManifest(manifest);
  const current = await readFile(manifestFile, 'utf8').catch(() => null);
  if (current !== text) {
    const temp = `${manifestFile}.${process.pid}.tmp`;
    await mkdir(path.dirname(manifestFile), { recursive: true });
    await writeFile(temp, text);
    await rename(temp, manifestFile);
  }
  console.log(
    `npm run media: ${results.length} image(s), ${keep.size} renditions (${written} written, ${removed} stale removed), ` +
      `manifest ${current === text ? 'unchanged' : 'updated'}.`,
  );
}

main().catch((error) => {
  console.error('npm run media failed unexpectedly:');
  console.error(error);
  process.exitCode = 1;
});
