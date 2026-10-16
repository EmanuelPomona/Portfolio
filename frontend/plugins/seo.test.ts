// Owner: agent/backend. Head metadata (TASK-303, docs/API.md §5). Runs in jsdom so the emitted HTML is
// parsed the way a browser or crawler would parse it, not matched as text.
import { describe, expect, it } from 'vitest';
import { contact, site as realSite, type Site } from '../src/content';
import { buildJsonLd, renderHead, renderRobots, renderSitemap } from './seo';

const ORIGIN = 'https://emanuel-ling.vercel.app';
const withOrigin: Site = { ...realSite, origin: ORIGIN };
const noOrigin: Site = { ...realSite, origin: '' };
const links = contact.links;

function parseHead(html: string): Document {
  return new DOMParser().parseFromString(`<!doctype html><html><head>${html}</head><body></body></html>`, 'text/html');
}

/** content of <meta property=key> or <meta name=key>, or null. */
function meta(doc: Document, key: string): string | null {
  return doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content') ?? null;
}

function jsonLdBlocks(doc: Document): unknown[] {
  return [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? ''));
}

describe('renderHead', () => {
  it('emits the description, Open Graph, Twitter card, theme color, and SVG favicon', () => {
    const doc = parseHead(renderHead(noOrigin, links));
    expect(meta(doc, 'description')).toBe(realSite.description);
    expect(meta(doc, 'og:type')).toBe('website');
    expect(meta(doc, 'og:title')).toBe(realSite.title);
    expect(meta(doc, 'og:description')).toBe(realSite.description);
    expect(meta(doc, 'og:image:width')).toBe('1200');
    expect(meta(doc, 'og:image:height')).toBe('630');
    expect(meta(doc, 'twitter:card')).toBe('summary_large_image');
    expect(meta(doc, 'theme-color')).toBe('#e3e8e5');
    const icon = doc.querySelector('link[rel="icon"]');
    expect([icon?.getAttribute('href'), icon?.getAttribute('type')]).toEqual(['/favicon.svg', 'image/svg+xml']);
  });

  it('omits canonical and og:url when origin is empty', () => {
    const doc = parseHead(renderHead(noOrigin, links));
    expect(doc.querySelector('link[rel="canonical"]')).toBeNull();
    expect(meta(doc, 'og:url')).toBeNull();
    expect(meta(doc, 'og:image')).toBe('/og.jpg');
  });

  it('includes canonical when origin is set', () => {
    const doc = parseHead(renderHead(withOrigin, links));
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://emanuel-ling.vercel.app/');
    expect(meta(doc, 'og:url')).toBe('https://emanuel-ling.vercel.app/');
    expect(meta(doc, 'og:image')).toBe('https://emanuel-ling.vercel.app/og.jpg');
  });

  it('renderHead escapes quotes and angle brackets', () => {
    const hostile: Site = {
      ...withOrigin,
      name: 'Eve</script><script>alert(1)</script>',
      title: `Say "hi" & <b>'bye'</b>`,
      description: '<img src=x onerror=alert(1)>',
    };
    const html = renderHead(hostile, links);
    const doc = parseHead(html);

    expect(doc.querySelectorAll('script')).toHaveLength(1);
    expect(doc.querySelector('img, b')).toBeNull();
    expect(meta(doc, 'og:title')).toBe(`Say "hi" & <b>'bye'</b>`);
    expect(meta(doc, 'description')).toBe('<img src=x onerror=alert(1)>');
    expect(jsonLdBlocks(doc)).toEqual([expect.objectContaining({ name: 'Eve</script><script>alert(1)</script>' })]);
    expect(html).not.toContain('<script>alert');
  });
});

describe('buildJsonLd', () => {
  it('JSON-LD parses and sameAs has LinkedIn and GitHub', () => {
    const blocks = jsonLdBlocks(parseHead(renderHead(withOrigin, links)));
    expect(blocks).toEqual([
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Emanuel Ling',
        url: 'https://emanuel-ling.vercel.app',
        sameAs: ['https://www.linkedin.com/in/emanuel-ling-915a73244', 'https://github.com/EmanuelPomona'],
        affiliation: { '@type': 'CollegeOrUniversity', name: 'Pomona College' },
      },
    ]);
  });

  it('leaves out url while origin is empty', () => {
    expect(buildJsonLd(noOrigin, links)).not.toHaveProperty('url');
    expect(buildJsonLd(noOrigin, links)).toMatchObject({ '@type': 'Person', name: 'Emanuel Ling' });
  });
});

describe('robots.txt and sitemap.xml', () => {
  it('robots.txt without Sitemap line when origin is empty', () => {
    expect(renderRobots(noOrigin)).toBe('User-agent: *\nAllow: /\n');
  });

  it('robots.txt points at the sitemap when origin is set', () => {
    expect(renderRobots(withOrigin)).toBe('User-agent: *\nAllow: /\n\nSitemap: https://emanuel-ling.vercel.app/sitemap.xml\n');
  });

  it('sitemap lists the canonical URL with the content date', () => {
    const xml = new DOMParser().parseFromString(renderSitemap(withOrigin), 'application/xml');
    expect(xml.querySelector('parsererror')).toBeNull();
    expect(xml.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    const urls = [...xml.getElementsByTagName('url')].map((u) => [
      u.getElementsByTagName('loc')[0]?.textContent,
      u.getElementsByTagName('lastmod')[0]?.textContent,
    ]);
    expect(urls).toEqual([['https://emanuel-ling.vercel.app/', realSite.updated]]);
  });
});

describe('every emitted string', () => {
  it('no em dash in any emitted string', () => {
    for (const s of [noOrigin, withOrigin]) {
      const emitted = [renderHead(s, links), JSON.stringify(buildJsonLd(s, links)), renderRobots(s)];
      if (s.origin) emitted.push(renderSitemap(s));
      for (const text of emitted) {
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toContain('\u2014');
      }
    }
  });
});
