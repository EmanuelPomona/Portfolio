// @vitest-environment node
// Owner: agent/backend. vercel.json's CSP and headers (TASK-304, B-05). Part of `npm run test:contract`.
//
// The CSP allows the two inline blocks of index.html by hash. A browser hashes the bytes it RECEIVES,
// and Vite minifies the inline boot-cover <style> during the build, so the served style text differs
// from the source. This test therefore builds the real site and hashes the inline blocks of the BUILT
// index.html, and also checks that the gate <script> reaches the build byte-for-byte unchanged.
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const FRONTEND = fileURLToPath(new URL('..', import.meta.url));
const REPO = path.dirname(FRONTEND);
const IMMUTABLE = 'public, max-age=31536000, immutable';
const REVALIDATE = 'public, max-age=0, must-revalidate';

/** A CSP source expression for `text`: 'sha256-<base64>'. */
const cspHash = (text: string) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

/** Text of every inline executable <script> (no src, not a JSON data block) and every <style>. */
function inlineBlocks(html: string): { scripts: string[]; styles: string[] } {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/\bsrc\s*=/i.test(attrs!) && !/\btype\s*=\s*["']?application\/(ld\+)?json/i.test(attrs!))
    .map((m) => m[2]!);
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]!);
  return { scripts, styles };
}

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}
interface VercelConfig {
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  framework: null;
  cleanUrls: boolean;
  headers: HeaderRule[];
}

async function vercelConfig(): Promise<VercelConfig> {
  return JSON.parse(await readFile(path.join(REPO, 'vercel.json'), 'utf8')) as VercelConfig;
}

function header(config: VercelConfig, source: string, key: string): string | undefined {
  return config.headers.find((rule) => rule.source === source)?.headers.find((h) => h.key === key)?.value;
}

/** CSP directives as { name: [source expressions] }. */
function directives(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((parts) => parts[0])
      .map(([name, ...values]) => [name!, values]),
  );
}

describe('cspHash', () => {
  it('matches sha256 computed independently with openssl', () => {
    // printf '%s' 'alert(1)' | openssl dgst -sha256 -binary | base64
    expect(cspHash('alert(1)')).toBe("'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='");
    // Whitespace is part of the hashed text: printf '%s' $'\n  x\n' | openssl ...
    expect(cspHash('\n  x\n')).toBe("'sha256-1eshTJd1L+Q+NaBPmq2vBA50pk8FF/53YkjxOFk63VY='");
  });
});

describe('vercel.json', { timeout: 120_000 }, () => {
  let outDir = '';
  let built = { scripts: [] as string[], styles: [] as string[] };

  beforeAll(async () => {
    outDir = await mkdtemp(path.join(tmpdir(), 'csp-build-'));
    await build({
      root: FRONTEND,
      configFile: path.join(FRONTEND, 'vite.config.ts'),
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    });
    built = inlineBlocks(await readFile(path.join(outDir, 'index.html'), 'utf8'));
  });
  afterAll(() => rm(outDir, { recursive: true, force: true }));

  it('vercel CSP allows exactly the index.html inline gate and boot style', async () => {
    const source = inlineBlocks(await readFile(path.join(FRONTEND, 'index.html'), 'utf8'));
    expect([source.scripts.length, source.styles.length]).toEqual([1, 1]);
    expect([built.scripts.length, built.styles.length]).toEqual([1, 1]);
    expect(built.scripts[0]).toBe(source.scripts[0]);

    const csp = directives(header(await vercelConfig(), '/(.*)', 'Content-Security-Policy') ?? '');
    expect(csp['script-src']).toEqual(["'self'", cspHash(built.scripts[0]!)]);
    expect(csp['style-src']).toEqual(["'self'", cspHash(built.styles[0]!)]);
  });

  it('keeps every other CSP directive strict', async () => {
    const value = header(await vercelConfig(), '/(.*)', 'Content-Security-Policy') ?? '';
    expect(value).not.toMatch(/unsafe-inline|unsafe-eval/);
    const { 'script-src': _script, 'style-src': _style, ...rest } = directives(value);
    expect(rest).toEqual({
      'default-src': ["'self'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'none'"],
      'frame-ancestors': ["'none'"],
    });
  });

  it('sends the security headers on every path, caches hashed assets as immutable, and revalidates media', async () => {
    const config = await vercelConfig();
    expect(header(config, '/(.*)', 'X-Content-Type-Options')).toBe('nosniff');
    expect(header(config, '/(.*)', 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(header(config, '/(.*)', 'Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(header(config, '/assets/(.*)', 'Cache-Control')).toBe(IMMUTABLE);
    // ADR-009: rendition names are not content-hashed, so a replaced photo must not be cached for a year.
    expect(header(config, '/media/(.*)', 'Cache-Control')).toBe(REVALIDATE);
  });

  it('builds the static site with the root scripts', async () => {
    const { buildCommand, outputDirectory, installCommand, framework, cleanUrls } = await vercelConfig();
    expect({ buildCommand, outputDirectory, installCommand, framework, cleanUrls }).toEqual({
      buildCommand: 'npm run build',
      outputDirectory: 'frontend/dist',
      installCommand: 'npm ci',
      framework: null,
      cleanUrls: true,
    });
  });
});
