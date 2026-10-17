import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { site } from '../../content';
import { REDUCED_MOTION_QUERY } from '../../hooks/usePrefersReducedMotion';
import { installFrames } from '../../test-utils/frames';
import { installIntersectionObserver, installMatchMedia } from '../../test-utils/media';
import { Hero } from './Hero';

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('Hero', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia();
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      configurable: true,
      value: () => Promise.resolve(),
    });
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
    Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  it('renders name as the only h1, tagline, and heroLinks hrefs in order', () => {
    render(<Hero site={site} onHeroDecode={() => {}} />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(site.name);
    expect(screen.getByText(site.tagline)).toBeInTheDocument();
    const section = document.getElementById('home')!;
    const links = within(section).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(site.heroLinks.map((l) => l.href));
    // The background photograph is decorative.
    expect(within(section).queryAllByRole('img')).toHaveLength(0);
  });

  it('opens web links in a new tab and mailto in the same tab', () => {
    render(<Hero site={site} onHeroDecode={() => {}} />);
    for (const link of site.heroLinks) {
      const a = document.querySelector(`a[href="${link.href}"]`)!;
      if (link.href.startsWith('mailto:')) {
        expect(a).not.toHaveAttribute('target');
      } else {
        expect(a).toHaveAttribute('target', '_blank');
        expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  it('reports the hero image decode through onHeroDecode', () => {
    const onHeroDecode = vi.fn();
    render(<Hero site={site} onHeroDecode={onHeroDecode} />);
    expect(onHeroDecode).toHaveBeenCalledTimes(1);
    expect(onHeroDecode.mock.calls[0]![0]).toBeInstanceOf(Promise);
  });

  it('fog drift runs only while the hero is in view and the tab is visible', () => {
    render(<Hero site={site} onHeroDecode={() => {}} />);
    const hero = document.getElementById('home')!;
    const drift = hero.querySelector('[data-drift]')!;
    expect(drift).toHaveAttribute('data-drift', 'paused');

    act(() => io.intersect(hero, 0.6));
    expect(drift).toHaveAttribute('data-drift', 'running');

    setHidden(true);
    expect(drift).toHaveAttribute('data-drift', 'paused');
    setHidden(false);
    expect(drift).toHaveAttribute('data-drift', 'running');

    act(() => io.intersect(hero, 0));
    expect(drift).toHaveAttribute('data-drift', 'paused');
  });

  it('fog drift does not run under reduced motion', () => {
    media.restore();
    media = installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    render(<Hero site={site} onHeroDecode={() => {}} />);
    const hero = document.getElementById('home')!;
    act(() => io.intersect(hero, 1));
    expect(hero.querySelector('[data-drift]')).toHaveAttribute('data-drift', 'paused');
  });

  it('lets the photograph lag the scroll (--depth) inside a still frame, so no edge ever shows', () => {
    const frames = installFrames();
    try {
      const { container } = render(<Hero site={site} onHeroDecode={() => {}} />);
      frames.flush();
      const img = container.querySelector('#home img')!;
      const frame = img.closest('[aria-hidden="true"]') as HTMLElement;
      // The layer that moves sits inside the frame; the frame itself (and its dissolve mask) stays.
      const layer = img.parentElement!.closest('div') as HTMLElement;
      expect(layer).not.toBe(frame);
      expect(frame.contains(layer)).toBe(true);
      expect(layer.style.getPropertyValue('--depth')).toMatch(/^-?[\d.]+px$/);
      expect(frame.style.getPropertyValue('--depth')).toBe('');
      // Regression: with the mask on the moving element, its fade slid below the hero and the
      // hero's clip cut the photo while still opaque (a 0.26 luminance step at the boundary).
      const css = readFileSync(join(__dirname, 'Hero.module.css'), 'utf8');
      const photo = css.match(/\.photo\s*\{([^}]*)\}/)![1]!;
      expect(photo).toMatch(/mask-image/);
      expect(photo).not.toMatch(/translate/);
      expect(photo).toMatch(/inset:\s*-\d+px 0 0/);
      expect(css).toMatch(/\.depth\s*\{[^}]*translate:\s*0 var\(--depth/);
    } finally {
      frames.restore();
    }
  });

  it('holds the copy in the fog until ready, then clears it', () => {
    const { rerender } = render(<Hero site={site} onHeroDecode={() => {}} ready={false} />);
    const copy = screen.getByRole('heading', { level: 1 }).closest('[data-fog]')!;
    expect(copy).not.toHaveAttribute('data-revealed', 'true');
    rerender(<Hero site={site} onHeroDecode={() => {}} ready />);
    expect(copy).toHaveAttribute('data-revealed', 'true');
  });
});
