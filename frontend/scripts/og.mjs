// Owner: agent/backend. One-off generator for frontend/public/og.jpg, the Open Graph and Twitter share
// image referenced by plugins/seo.ts (TASK-303).
//
// Run from frontend/:   node scripts/og.mjs
// Re-run only when the alpine photograph changes, then commit public/og.jpg.
//
// What it does: takes media-src/backgrounds/alpine-valley.png (1672x941), covers 1200x630 anchored at
// the top so the summit stays in frame (about 45px of trees is trimmed from the bottom), and encodes a
// JPEG at quality 82 with mozjpeg. No metadata, no timestamps: the same photo gives the same bytes.
//
// Why there is no text: TASK-303 allows the name only in Instrument Serif and never in a fallback font.
// sharp's text renderer (Pango) ignored the Instrument Serif file on the build machine: its output was
// byte-identical to a render in a nonexistent font family, both from the fontsource WOFF and from a TTF
// converted from it. So the image ships without text; share cards show the name from og:title.
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SOURCE = fileURLToPath(new URL('../media-src/backgrounds/alpine-valley.png', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../public/og.jpg', import.meta.url));
const MAX_BYTES = 200 * 1024;

const info = await sharp(SOURCE)
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'top' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUTPUT);

if (info.size > MAX_BYTES) {
  console.error(`og.jpg is ${info.size} bytes; the budget is ${MAX_BYTES}. Lower the quality and re-run.`);
  process.exitCode = 1;
} else {
  console.log(`wrote public/og.jpg ${info.width}x${info.height}, ${info.size} bytes`);
}
