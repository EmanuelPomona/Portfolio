// Owner: agent/backend.
// STUB from the manager scaffold. TASK-303 makes this inject the head tags (title, description,
// canonical, Open Graph, Twitter, favicon, Person JSON-LD) from src/content/site.ts at build time.
import type { Plugin } from 'vite';
import type { Link, Site } from '../src/content';

export function renderHead(_site: Site, _links: readonly Link[]): string {
  return '';
}

export function buildJsonLd(_site: Site, _links: readonly Link[]): Record<string, unknown> {
  return {};
}

export function renderRobots(_site: Site): string {
  return '';
}

export function renderSitemap(_site: Site): string {
  return '';
}

export function seoPlugin(_opts: { site?: Site; links?: readonly Link[] } = {}): Plugin {
  return { name: 'el-seo' };
}
