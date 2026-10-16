// Owner: agent/backend. Head metadata Vite plugin (docs/API.md §5, TASK-303).
// Pure renderers first; the plugin wires them into index.html and the build output.
import type { Plugin } from 'vite';
import type { Link, Site } from '../src/content';

/** Mist, the page's ground color (docs/DESIGN_CONSTRAINTS.md palette). */
const THEME_COLOR = '#e3e8e5';
const OG_IMAGE = { path: '/og.jpg', width: 1200, height: 630 };

/** Escape text for an HTML attribute value or text node. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** JSON safe inside <script>: no "<", ">", or "&" can end the block or start markup. JSON.parse undoes it. */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

/** Canonical URL of the page, or null while the origin is unknown. */
const canonicalOf = (site: Site) => (site.origin ? `${site.origin}/` : null);

/** schema.org Person for the page owner. `url` appears once the origin is known. */
export function buildJsonLd(site: Site, links: readonly Link[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    ...(site.origin ? { url: site.origin } : {}),
    sameAs: links.filter((l) => l.kind === 'linkedin' || l.kind === 'github').map((l) => l.href),
    affiliation: { '@type': 'CollegeOrUniversity', name: 'Pomona College' },
  };
}

/** Every head tag except <title>, as one HTML string. Pure. */
export function renderHead(site: Site, links: readonly Link[]): string {
  const canonical = canonicalOf(site);
  const image = site.origin ? `${site.origin}${OG_IMAGE.path}` : OG_IMAGE.path;
  const metaName = (name: string, content: string) => `<meta name="${name}" content="${escapeHtml(content)}" />`;
  const metaProp = (prop: string, content: string) => `<meta property="${prop}" content="${escapeHtml(content)}" />`;
  return [
    metaName('description', site.description),
    canonical && `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    metaName('theme-color', THEME_COLOR),
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    metaProp('og:type', 'website'),
    metaProp('og:site_name', site.name),
    metaProp('og:title', site.title),
    metaProp('og:description', site.description),
    canonical && metaProp('og:url', canonical),
    metaProp('og:image', image),
    metaProp('og:image:width', String(OG_IMAGE.width)),
    metaProp('og:image:height', String(OG_IMAGE.height)),
    metaName('twitter:card', 'summary_large_image'),
    `<script type="application/ld+json">${jsonForScript(buildJsonLd(site, links))}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

/** robots.txt: everything is public; the sitemap is announced once the origin is known. */
export function renderRobots(site: Site): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (site.origin) lines.push('', `Sitemap: ${site.origin}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}

/** sitemap.xml for the one public page. Only meaningful when the origin is set. */
export function renderSitemap(site: Site): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${escapeHtml(`${site.origin}/`)}</loc>`,
    `    <lastmod>${escapeHtml(site.updated)}</lastmod>`,
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');
}

export function seoPlugin(_opts: { site?: Site; links?: readonly Link[] } = {}): Plugin {
  return { name: 'el-seo' };
}
