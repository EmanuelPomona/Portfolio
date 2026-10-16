// @vitest-environment node
// Owner: manager. ADR-008: the CSP is `font-src 'self'`, so a font must never be inlined as a data: URI.
// Vite inlines any asset under 4 KB by default, which once turned a small Manrope subset into
// `data:font/woff2` and logged a CSP violation on every load. The real build no longer contains a
// font that small, so this asserts the guard in vite.config.ts itself.
import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config.ts';

type Decide = (file: string, content: Buffer) => boolean | undefined;

function inlineLimit(): unknown {
  const config = viteConfig({ command: 'build', mode: 'production' });
  return (config as { build?: { assetsInlineLimit?: unknown } }).build?.assetsInlineLimit;
}

describe('vite asset inlining (ADR-008)', () => {
  it('never inlines a font file, whatever its size', () => {
    const limit = inlineLimit();
    expect(typeof limit).toBe('function');
    const tiny = Buffer.alloc(16);
    for (const file of ['a.woff2', 'b.woff', 'c.ttf', 'd.otf', 'E.WOFF2']) {
      expect((limit as Decide)(`/x/${file}`, tiny)).toBe(false);
    }
  });

  it('leaves every other asset to the Vite default', () => {
    const limit = inlineLimit();
    expect(typeof limit).toBe('function');
    expect((limit as Decide)('/x/icon.svg', Buffer.alloc(16))).toBeUndefined();
    expect((limit as Decide)('/x/photo.png', Buffer.alloc(16))).toBeUndefined();
  });
});
