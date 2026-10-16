// Owner: agent/backend.
// STUB from the manager scaffold. TASK-303 makes this inject the head tags (title, description,
// canonical, Open Graph, Twitter, favicon, Person JSON-LD) from src/content/site.ts at build time.
import type { Plugin } from 'vite';

export function seoPlugin(): Plugin {
  return { name: 'el-seo' };
}
