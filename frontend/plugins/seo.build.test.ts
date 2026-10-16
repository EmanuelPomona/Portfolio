// @vitest-environment node
// Owner: agent/backend. seoPlugin inside a real `vite build` of a throwaway site (TASK-303 B-03, B-04).
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import { contact, site as realSite, type Site } from '../src/content';
import { seoPlugin } from './seo';

const FIXTURE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Fallback title</title>
  </head>
  <body><p>fixture</p></body>
</html>
`;

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

/** Build a one-page site with seoPlugin and return its dist folder. */
async function buildWith(site: Site, html = FIXTURE_HTML): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'seo-build-'));
  roots.push(root);
  await writeFile(path.join(root, 'index.html'), html);
  const outDir = path.join(root, 'dist');
  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [seoPlugin({ site, links: contact.links })],
    build: { outDir, emptyOutDir: true },
  });
  return outDir;
}

const count = (text: string, pattern: RegExp) => text.match(new RegExp(pattern.source, 'g'))?.length ?? 0;

describe('seoPlugin in a vite build', { timeout: 60_000 }, () => {
  it('replaces the fallback title and injects the head tags once', async () => {
    const site: Site = { ...realSite, origin: 'https://emanuel-ling.vercel.app', title: 'Emanuel Ling, $& and $1 intact' };
    const html = await readFile(path.join(await buildWith(site), 'index.html'), 'utf8');

    expect(count(html, /<title>/)).toBe(1);
    expect(html).toContain('<title>Emanuel Ling, $&amp; and $1 intact</title>');
    expect(html).not.toContain('Fallback title');
    expect(count(html, /<meta name="description"/)).toBe(1);
    expect(count(html, /<script type="application\/ld\+json">/)).toBe(1);
    expect(html).toContain('<meta property="og:image" content="https://emanuel-ling.vercel.app/og.jpg" />');
    expect(html).toContain('<link rel="canonical" href="https://emanuel-ling.vercel.app/" />');
  });

  it('emits robots.txt and sitemap.xml when origin is set', async () => {
    const dist = await buildWith({ ...realSite, origin: 'https://emanuel-ling.vercel.app' });

    expect(await readFile(path.join(dist, 'robots.txt'), 'utf8')).toContain(
      'Sitemap: https://emanuel-ling.vercel.app/sitemap.xml',
    );
    expect(await readFile(path.join(dist, 'sitemap.xml'), 'utf8')).toContain('<loc>https://emanuel-ling.vercel.app/</loc>');
  });

  it('emits robots.txt without a Sitemap line, and no sitemap.xml, while origin is empty', async () => {
    const dist = await buildWith({ ...realSite, origin: '' });

    expect(await readFile(path.join(dist, 'robots.txt'), 'utf8')).toBe('User-agent: *\nAllow: /\n');
    expect(existsSync(path.join(dist, 'sitemap.xml'))).toBe(false);
  });

  it('fails the build when index.html has no <title> to replace', async () => {
    await expect(buildWith(realSite, FIXTURE_HTML.replace('<title>Fallback title</title>', ''))).rejects.toThrow(
      /no <title>/,
    );
  });
});

describe('seoPlugin on pages other than index.html', () => {
  type Hook = (html: string, ctx: { path: string; filename: string }) => string;
  const hook = seoPlugin({ site: realSite, links: contact.links }).transformIndexHtml as Hook;

  it('leaves the stickman lab page untouched', () => {
    const lab = '<!doctype html><html><head><title>Stickman lab</title></head><body></body></html>';
    expect(hook(lab, { path: '/stickman-lab.html', filename: '/repo/frontend/stickman-lab.html' })).toBe(lab);
  });

  it('does not fail on another page that has no <title>', () => {
    const page = '<!doctype html><html><head></head><body></body></html>';
    expect(hook(page, { path: '/stickman-lab.html', filename: '/repo/frontend/stickman-lab.html' })).toBe(page);
  });
});
