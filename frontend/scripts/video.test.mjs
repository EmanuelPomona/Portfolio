// @vitest-environment node
// Owner: agent/backend. `npm run video` (scripts/video.swift, ADR-012, TASK-305). The script needs macOS
// AVFoundation, so these tests are skipped elsewhere (CI runs on Linux). The fixture is the real
// committed recording; the MP4 is checked by reading its boxes here, independently of the Swift code.
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('./video.swift', import.meta.url));
const RECORDING = fileURLToPath(new URL('../media-src/video/snake-ai.mov', import.meta.url));
const SETTINGS = { cropTop: 51, cropBottom: 1, posterSeconds: 12 };
const MAX_BYTES = 3 * 1024 * 1024;
const execFileAsync = promisify(execFile);
const roots = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), 'video-'));
  roots.push(root);
  const ws = {
    src: path.join(root, 'media-src', 'video'),
    out: path.join(root, 'public', 'media', 'video'),
    posters: path.join(root, 'media-src', 'projects'),
    run: () =>
      execFileAsync('swift', [SCRIPT, '--src', ws.src, '--out', ws.out, '--posters', ws.posters], {
        maxBuffer: 1 << 20,
      }),
    files: async () => [
      ...(await readdir(ws.out).catch(() => [])).map((f) => `out/${f}`),
      ...(await readdir(ws.posters).catch(() => [])).map((f) => `posters/${f}`),
    ].sort(),
  };
  await mkdir(ws.src, { recursive: true });
  return ws;
}

async function addRecording(ws, id, settings = SETTINGS) {
  await copyFile(RECORDING, path.join(ws.src, `${id}.mov`));
  if (settings) await writeFile(path.join(ws.src, `${id}.json`), JSON.stringify(settings));
}

/** Codec, handler types, and track size of an MP4, from its boxes (ISO BMFF). */
function mp4Info(buf) {
  const info = { handlers: [], formats: [], sizes: [] };
  const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);
  const walk = (start, end) => {
    for (let at = start; at + 8 <= end; ) {
      let size = buf.readUInt32BE(at);
      const type = buf.toString('latin1', at + 4, at + 8);
      if (size === 1) size = Number(buf.readBigUInt64BE(at + 8));
      if (size === 0) size = end - at;
      if (size < 8) break;
      if (CONTAINERS.has(type)) walk(at + 8, at + size);
      if (type === 'hdlr') info.handlers.push(buf.toString('latin1', at + 16, at + 20));
      if (type === 'stsd') info.formats.push(buf.toString('latin1', at + 20, at + 24));
      if (type === 'tkhd') {
        const tail = at + size; // width and height are the last two 16.16 fixed-point fields
        info.sizes.push([buf.readUInt32BE(tail - 8) / 65536, buf.readUInt32BE(tail - 4) / 65536]);
      }
      at += size;
    }
  };
  walk(0, buf.length);
  return info;
}

describe.skipIf(process.platform !== 'darwin')('npm run video (macOS AVFoundation)', { timeout: 300_000 }, () => {
  it('writes an H.264 MP4 without audio, title bar cropped, even size, under 3 MB, and its poster', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app');

    const { stdout } = await ws.run();

    expect(await ws.files()).toEqual(['out/demo-app.mp4', 'posters/demo-app.png']);
    expect(stdout).toContain('demo-app.mp4');
    const mp4 = await readFile(path.join(ws.out, 'demo-app.mp4'));
    expect(mp4.length).toBeLessThanOrEqual(MAX_BYTES);
    const info = mp4Info(mp4);
    expect(info.formats).toEqual(['avc1']);
    expect(info.handlers).not.toContain('soun');
    expect(info.sizes).toEqual([[1270, 954]]); // 1006 rows minus 51 title-bar rows minus 1 corner row

    const poster = await sharp(path.join(ws.posters, 'demo-app.png')).raw().toBuffer({ resolveWithObject: true });
    expect([poster.info.width, poster.info.height]).toEqual([1270, 954]);
    const ch = poster.info.channels;
    const pixel = (x, y) => [...poster.data.subarray((y * 1270 + x) * ch, (y * 1270 + x) * ch + 3)];
    // The title bar is grey (about 57); the game field is black. Row 0 must already be the field.
    expect(Math.max(...Array.from({ length: 200 }, (_, i) => Math.max(...pixel(300 + i * 4, 0))))).toBeLessThan(20);
    let green = 0;
    let red = 0;
    for (let i = 0; i < poster.data.length; i += ch) {
      const [r, g, b] = [poster.data[i], poster.data[i + 1], poster.data[i + 2]];
      if (g > 180 && r < 80 && b < 80) green++;
      if (r > 180 && g < 80 && b < 80) red++;
    }
    expect(green).toBeGreaterThan(1000); // the snake
    expect(red).toBeGreaterThan(500); // the food
  });

  it('fails without a settings file and writes nothing', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', null);

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/demo-app.mov');
    expect(failure.stderr).toContain('demo-app.json');
    expect(await ws.files()).toEqual([]);
  });

  it('fails when the cropped height is odd and writes nothing', async () => {
    const ws = await workspace();
    await addRecording(ws, 'demo-app', { ...SETTINGS, cropBottom: 0 });

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('955');
    expect(await ws.files()).toEqual([]);
  });

  it('fails on a recording it cannot read and leaves earlier outputs intact', async () => {
    const ws = await workspace();
    await mkdir(ws.out, { recursive: true });
    await mkdir(ws.posters, { recursive: true });
    await writeFile(path.join(ws.out, 'demo-app.mp4'), 'previous mp4');
    await writeFile(path.join(ws.posters, 'demo-app.png'), 'previous poster');
    await writeFile(path.join(ws.src, 'demo-app.mov'), 'this is not a movie');
    await writeFile(path.join(ws.src, 'demo-app.json'), JSON.stringify(SETTINGS));

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/demo-app.mov');
    expect(await ws.files()).toEqual(['out/demo-app.mp4', 'posters/demo-app.png']);
    expect(await readFile(path.join(ws.out, 'demo-app.mp4'), 'utf8')).toBe('previous mp4');
    expect((await stat(path.join(ws.posters, 'demo-app.png'))).size).toBe('previous poster'.length);
  });

  it('rejects a recording name that is not lowercase kebab-case', async () => {
    const ws = await workspace();
    await addRecording(ws, 'Demo_App');

    const failure = await ws.run().then(() => null, (error) => error);

    expect(failure).toMatchObject({ code: 1 });
    expect(failure.stderr).toContain('media-src/video/Demo_App.mov: name must be lowercase kebab-case');
    expect(await ws.files()).toEqual([]);
  });
});
