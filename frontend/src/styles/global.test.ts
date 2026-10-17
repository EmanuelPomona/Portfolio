import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(__dirname, 'global.css'), 'utf8');
const html = readFileSync(join(__dirname, '../../index.html'), 'utf8');

describe('global.css', () => {
  it('releases the loader gate scroll lock once <main> stops being inert', () => {
    // The index.html gate (API.md §2.4, verbatim) locks the page while the loader is up...
    expect(html).toMatch(/html\[data-loader='show'\] body \{ overflow: hidden; \}/);
    // ...and nothing else ever clears data-loader, so the page must release the lock itself when
    // the loader is done (mount contract: <main> is inert exactly while the loader is up).
    // Regression: first visits could not be scrolled with wheel, trackpad, touch, or keys.
    const release = css.match(/html\[data-loader='show'\] body:has\(main:not\(\[inert\]\)\)\s*\{([^}]*)\}/);
    expect(release?.[1]).toMatch(/overflow:\s*visible/);
  });

  it('scrolls focused content clear of both viewport edges, ring included', () => {
    // Measured: tabbing down to a project window scrolled its border box flush with the viewport
    // bottom, so its 2px ring (3px offset) was cut off. The top already clears the fixed nav.
    const root = css.match(/\nhtml\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(root).toMatch(/scroll-padding-top:/);
    expect(root).toMatch(/scroll-padding-bottom:\s*var\(--space-4\)/);
  });
});
