// @vitest-environment node
// Owner: agent/backend. The static share image the head tags point at (TASK-303 B-04).
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const OG = fileURLToPath(new URL('../public/og.jpg', import.meta.url));

describe('public/og.jpg', () => {
  it('is a 1200x630 JPEG, the size share cards expect', async () => {
    const meta = await sharp(OG).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['jpeg', 1200, 630]);
  });

  it('is under 200 KB', () => {
    expect(statSync(OG).size).toBeLessThan(200 * 1024);
  });
});
