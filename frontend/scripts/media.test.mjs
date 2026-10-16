// @vitest-environment node
// Owner: agent/backend. Media pipeline tests (TASK-302): pure helpers, then the real CLI against temp dirs.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { meanColor, mediaIdFromPath, planWidths, renditionPath } from './media-lib.mjs';

describe('mediaIdFromPath', () => {
  it('mediaIdFromPath accepts kebab paths and rejects "My Photo.PNG"', () => {
    expect(mediaIdFromPath('projects/sageplan.png')).toBe('projects/sageplan');
    expect(mediaIdFromPath('backgrounds/alpine-valley.png')).toBe('backgrounds/alpine-valley');
    expect(mediaIdFromPath('life/photo-2.jpg')).toBe('life/photo-2');
    expect(mediaIdFromPath('life/photo-2.jpeg')).toBe('life/photo-2');
    expect(mediaIdFromPath('og-source.webp')).toBe('og-source');
    expect(() => mediaIdFromPath('My Photo.PNG')).toThrow(
      new Error('media-src/My Photo.PNG: name must be lowercase kebab-case'),
    );
  });

  it.each([
    'projects/sage_plan.png',
    'projects/-sageplan.png',
    'projects/sageplan-.png',
    'Projects/sageplan.png',
    'projects/sageplan.PNG',
    'projects/sageplan',
    'projects//sageplan.png',
  ])('rejects %s', (rel) => {
    expect(() => mediaIdFromPath(rel)).toThrow(`media-src/${rel}: name must be lowercase kebab-case`);
  });
});

describe('planWidths', () => {
  it('planWidths(1672) = [640,1024,1600,1672]', () => {
    expect(planWidths(1672)).toEqual([640, 1024, 1600, 1672]);
  });

  it('planWidths(1024) = [640,1024]', () => {
    expect(planWidths(1024)).toEqual([640, 1024]);
  });

  it('planWidths(500) = [500]', () => {
    expect(planWidths(500)).toEqual([500]);
  });

  it('planWidths(3000) = [640,1024,1600,2400]', () => {
    expect(planWidths(3000)).toEqual([640, 1024, 1600, 2400]);
  });

  it('planWidths(2400) = [640,1024,1600,2400]', () => {
    expect(planWidths(2400)).toEqual([640, 1024, 1600, 2400]);
  });

  it.each([0, -5, 12.5, Number.NaN])('rejects a width of %s', (w) => {
    expect(() => planWidths(w)).toThrow(RangeError);
  });
});

describe('renditionPath', () => {
  it('builds /media/<id>-<width>.<ext>', () => {
    expect(renditionPath('projects/sageplan', 1024, 'avif')).toBe('/media/projects/sageplan-1024.avif');
    expect(renditionPath('backgrounds/alpine-valley', 1672, 'jpg')).toBe('/media/backgrounds/alpine-valley-1672.jpg');
  });
});

describe('meanColor', () => {
  it('averages RGB pixels into #rrggbb, rounding half up', () => {
    expect(meanColor(Buffer.from([0x12, 0x34, 0x56, 0x12, 0x34, 0x56]), 3)).toBe('#123456');
    expect(meanColor(Buffer.from([0, 0, 0, 255, 255, 255]), 3)).toBe('#808080');
  });
});

// ---- The real CLI, run as a child process against a temp workspace ----

const SCRIPT = fileURLToPath(new URL('./media.mjs', import.meta.url));
const execFileAsync = promisify(execFile);
const workspaces = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), 'media-pipeline-'));
  workspaces.push(root);
  const ws = {
    src: path.join(root, 'media-src'),
    out: path.join(root, 'public', 'media'),
    manifest: path.join(root, 'media.generated.ts'),
    run: () => execFileAsync(process.execPath, [SCRIPT, '--src', ws.src, '--out', ws.out, '--manifest', ws.manifest]),
  };
  await mkdir(ws.src, { recursive: true });
  return ws;
}

/** A 700x400 JPEG with a diagonal gradient, so the encoders have real detail to work on. */
async function gradientJpeg(file) {
  const [w, h] = [700, 400];
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) px.set([x % 256, y % 256, (x + y) % 256], (y * w + x) * 3);
  }
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(px, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 90 }).toFile(file);
}

/** A 300x200 PNG of one flat color, so its mean color is known exactly. */
async function flatPng(file) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp({ create: { width: 300, height: 200, channels: 3, background: '#123456' } }).png().toFile(file);
}

/** Every file under `dir`, as sorted forward-slash paths relative to it. */
async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
    .sort();
}

/** sha256 of every output file plus the manifest. */
async function snapshot(ws) {
  const hashes = {};
  for (const rel of await listFiles(ws.out)) {
    hashes[rel] = createHash('sha256').update(await readFile(path.join(ws.out, rel))).digest('hex');
  }
  hashes['<manifest>'] = createHash('sha256').update(await readFile(ws.manifest)).digest('hex');
  return hashes;
}

/** The manifest object: the generated file is `export const mediaManifest = <JSON> as const satisfies ...`. */
async function readManifest(file) {
  const text = await readFile(file, 'utf8');
  expect(text.startsWith('// GENERATED by `npm run media`')).toBe(true);
  const m = /export const mediaManifest = ([\s\S]*) as const satisfies Record<string, MediaAsset>;\n$/.exec(text);
  if (!m) throw new Error(`unexpected manifest layout:\n${text}`);
  return JSON.parse(m[1]);
}

describe('npm run media (pipeline)', { timeout: 60_000 }, () => {
  it('adding a fixture creates its renditions and manifest entry, and ignores non-images', async () => {
    const ws = await workspace();
    await gradientJpeg(path.join(ws.src, 'projects', 'demo-app.jpg'));
    await flatPng(path.join(ws.src, 'life', 'photo-1.png'));
    await writeFile(path.join(ws.src, 'README.md'), '# notes');
    await writeFile(path.join(ws.src, 'life', '.gitkeep'), '');

    await ws.run();

    expect(await listFiles(ws.out)).toEqual([
      'life/photo-1-300.avif',
      'life/photo-1-300.jpg',
      'life/photo-1-300.webp',
      'projects/demo-app-640.avif',
      'projects/demo-app-640.jpg',
      'projects/demo-app-640.webp',
      'projects/demo-app-700.avif',
      'projects/demo-app-700.jpg',
      'projects/demo-app-700.webp',
    ]);
    const manifest = await readManifest(ws.manifest);
    expect(Object.keys(manifest)).toEqual(['life/photo-1', 'projects/demo-app']);
    expect(manifest['life/photo-1']).toEqual({
      id: 'life/photo-1',
      width: 300,
      height: 200,
      placeholder: '#123456',
      sources: [
        { type: 'image/avif', srcset: '/media/life/photo-1-300.avif 300w' },
        { type: 'image/webp', srcset: '/media/life/photo-1-300.webp 300w' },
      ],
      fallback: { src: '/media/life/photo-1-300.jpg', srcset: '/media/life/photo-1-300.jpg 300w' },
    });
    expect(manifest['projects/demo-app']).toEqual({
      id: 'projects/demo-app',
      width: 700,
      height: 400,
      placeholder: expect.stringMatching(/^#[0-9a-f]{6}$/),
      sources: [
        { type: 'image/avif', srcset: '/media/projects/demo-app-640.avif 640w, /media/projects/demo-app-700.avif 700w' },
        { type: 'image/webp', srcset: '/media/projects/demo-app-640.webp 640w, /media/projects/demo-app-700.webp 700w' },
      ],
      fallback: {
        src: '/media/projects/demo-app-700.jpg',
        srcset: '/media/projects/demo-app-640.jpg 640w, /media/projects/demo-app-700.jpg 700w',
      },
    });
    const small = await sharp(path.join(ws.out, 'projects', 'demo-app-640.webp')).metadata();
    expect([small.format, small.width]).toEqual(['webp', 640]);
    const avif = await sharp(path.join(ws.out, 'projects', 'demo-app-700.avif')).metadata();
    expect([avif.format, avif.compression, avif.width, avif.height]).toEqual(['heif', 'av1', 700, 400]);
  });

  it('pipeline is byte-deterministic across two runs', async () => {
    const ws = await workspace();
    await gradientJpeg(path.join(ws.src, 'projects', 'demo-app.jpg'));
    await flatPng(path.join(ws.src, 'life', 'photo-1.png'));

    await ws.run();
    const first = await snapshot(ws);
    await ws.run();

    expect(Object.keys(first)).toHaveLength(10);
    expect(await snapshot(ws)).toEqual(first);
  });

  it('stale outputs are removed', async () => {
    const ws = await workspace();
    await gradientJpeg(path.join(ws.src, 'projects', 'demo-app.jpg'));
    await flatPng(path.join(ws.src, 'life', 'photo-1.png'));
    await ws.run();
    await writeFile(path.join(ws.out, 'notes.txt'), 'not a rendition');

    await rm(path.join(ws.src, 'life', 'photo-1.png'));
    await ws.run();

    expect(await listFiles(ws.out)).toEqual([
      'notes.txt',
      'projects/demo-app-640.avif',
      'projects/demo-app-640.jpg',
      'projects/demo-app-640.webp',
      'projects/demo-app-700.avif',
      'projects/demo-app-700.jpg',
      'projects/demo-app-700.webp',
    ]);
    expect((await readdir(ws.out)).sort()).toEqual(['notes.txt', 'projects']);
    expect(Object.keys(await readManifest(ws.manifest))).toEqual(['projects/demo-app']);
  });

  it('a failing source leaves the previous manifest intact', async () => {
    const ws = await workspace();
    await flatPng(path.join(ws.src, 'life', 'photo-1.png'));
    await ws.run();
    const before = await snapshot(ws);

    await writeFile(path.join(ws.src, 'life', 'photo-2.png'), 'this is not an image');
    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/life/photo-2.png');
    expect(await snapshot(ws)).toEqual(before);
  });

  it('a badly named source fails the run, names the file, and writes nothing', async () => {
    const ws = await workspace();
    await flatPng(path.join(ws.src, 'life', 'photo-1.png'));
    await flatPng(path.join(ws.src, 'My Photo.PNG'));

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/My Photo.PNG: name must be lowercase kebab-case');
    expect(await listFiles(ws.out)).toEqual([]);
    await expect(readFile(ws.manifest)).rejects.toThrow();
  });

  it('an unsupported file type fails the run and names the file', async () => {
    const ws = await workspace();
    await writeFile(path.join(ws.src, 'photo-3.heic'), 'heic bytes');

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/photo-3.heic: unsupported file type');
  });

  it('two sources with the same name fail the run', async () => {
    const ws = await workspace();
    await flatPng(path.join(ws.src, 'life', 'photo-1.png'));
    await gradientJpeg(path.join(ws.src, 'life', 'photo-1.jpg'));

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/life/photo-1.png');
  });
});
