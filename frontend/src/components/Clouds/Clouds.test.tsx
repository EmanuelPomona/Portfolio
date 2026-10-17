import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getMedia, site } from '../../content';
import { REDUCED_MOTION_QUERY } from '../../hooks/usePrefersReducedMotion';
import { Hero } from '../../sections/Hero/Hero';
import { installFrames } from '../../test-utils/frames';
import { installIntersectionObserver, installMatchMedia } from '../../test-utils/media';
import { Section } from '../Section/Section';
import { Clouds } from './Clouds';

const css = readFileSync(join(__dirname, 'Clouds.module.css'), 'utf8');

/** The URLs a <picture> can fetch: its <source> srcsets and the <img> srcset, with sizes. */
function candidates(img: HTMLImageElement) {
  const picture = img.closest('picture')!;
  return {
    sources: [...picture.querySelectorAll('source')].map((s) => `${s.getAttribute('srcset')} | ${s.getAttribute('sizes')}`),
    img: `${img.getAttribute('srcset')} | ${img.getAttribute('sizes')}`,
  };
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('Clouds', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia();
    Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: () => Promise.resolve() });
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
    Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  it('renders aria-hidden, pointer-events-none cloud layers from an existing MediaId', () => {
    const { container } = render(<Clouds section="projects" />);
    const root = container.querySelector('[data-clouds]')!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(css).toMatch(/\.clouds\s*\{[^}]*pointer-events:\s*none/);
    const layers = root.querySelectorAll('[data-drift]');
    expect(layers.length).toBeGreaterThanOrEqual(2);
    const srcs = [...root.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(expect.arrayContaining([getMedia(site.heroImage).fallback.src, getMedia(site.sectionsImage).fallback.src]));
    for (const img of root.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '');
  });

  it('uses the same image URL as the section backdrop, so no new request is made', () => {
    const section = render(
      <Section id="about" heading="About" backdrop="evergreen" clouds>
        <p>body</p>
      </Section>,
    );
    const imgs = [...section.container.querySelectorAll('img')];
    const backdrop = imgs.find((img) => !img.closest('[data-clouds]'))!;
    const cloudEvergreen = imgs.find((img) => img.closest('[data-clouds]') && img.getAttribute('src') === getMedia(site.sectionsImage).fallback.src)!;
    expect(candidates(cloudEvergreen)).toEqual(candidates(backdrop));

    const cloudAlpine = imgs.find((img) => img.closest('[data-clouds]') && img.getAttribute('src') === getMedia(site.heroImage).fallback.src)!;
    const hero = render(<Hero site={site} onHeroDecode={() => {}} />);
    const heroImg = hero.container.querySelector('#home img') as HTMLImageElement;
    expect(candidates(cloudAlpine)).toEqual(candidates(heroImg));
  });

  it('pauses the drift while its section is out of view', () => {
    const { container } = render(<Clouds section="projects" />);
    const root = container.querySelector('[data-clouds]') as HTMLElement;
    const states = () => [...root.querySelectorAll('[data-drift]')].map((l) => l.getAttribute('data-drift'));
    expect(new Set(states())).toEqual(new Set(['paused']));
    act(() => io.intersect(root, 0.4));
    expect(new Set(states())).toEqual(new Set(['running']));
    act(() => io.intersect(root, 0));
    expect(new Set(states())).toEqual(new Set(['paused']));
  });

  it('pauses the drift while the tab is hidden', () => {
    const { container } = render(<Clouds section="about" />);
    const root = container.querySelector('[data-clouds]') as HTMLElement;
    act(() => io.intersect(root, 1));
    setHidden(true);
    expect(root.querySelector('[data-drift]')).toHaveAttribute('data-drift', 'paused');
    setHidden(false);
    expect(root.querySelector('[data-drift]')).toHaveAttribute('data-drift', 'running');
  });

  it('renders static layers under reduced motion', () => {
    media.restore();
    media = installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    const { container } = render(<Clouds section="contact" />);
    const root = container.querySelector('[data-clouds]') as HTMLElement;
    act(() => io.intersect(root, 1));
    for (const layer of root.querySelectorAll('[data-drift]')) expect(layer).toHaveAttribute('data-drift', 'off');
    expect(css).toMatch(/\[data-drift='off'\][^{]*\{[^}]*animation:\s*none/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*animation:\s*none/);
  });

  it('screens the cloud group as a whole, so the photos can only lighten what is behind text', () => {
    // Regression: with the screen blend on the layers, .clouds (a stacking context, via z-index)
    // isolated it, and the photos' dark rocks painted normally: text contrast fell to 1.13:1.
    expect(css).toMatch(/\.clouds\s*\{[^}]*mix-blend-mode:\s*screen/);
    expect(css).not.toMatch(/\.layer\s*\{[^}]*mix-blend-mode/);
  });

  it('each layer lags the scroll on its own --depth, by translate, apart from its drift', () => {
    const frames = installFrames();
    try {
      const { container } = render(<Clouds section="about" />);
      frames.flush();
      const layers = [...container.querySelectorAll<HTMLElement>('[data-drift]')];
      const depths = layers.map((l) => l.style.getPropertyValue('--depth'));
      for (const d of depths) expect(d).toMatch(/^-?[\d.]+px$/);
      // Different factors, so the two layers never move as one sheet.
      expect(new Set(depths).size).toBe(layers.length);
      // translate, not transform: the drift keeps transform to itself.
      expect(css).toMatch(/\.layer\s*\{[^}]*translate:\s*0 var\(--depth/);
    } finally {
      frames.restore();
    }
  });

  it('renders only the layers a section shows, so no hidden layer is measured or moved', () => {
    const contact = render(<Clouds section="contact" />);
    const layers = contact.container.querySelectorAll('[data-drift]');
    expect(layers).toHaveLength(1);
    expect(layers[0]!.querySelector('img')).toHaveAttribute('src', getMedia(site.heroImage).fallback.src);
    expect(css).not.toMatch(/display:\s*none/);
  });

  it('animates transform only, on a cycle of at least 60s', () => {
    const keyframes = [...css.matchAll(/@keyframes[^{]+\{((?:[^{}]*\{[^}]*\})*)\s*\}/g)].map((m) => m[1]!);
    expect(keyframes.length).toBeGreaterThan(0);
    for (const body of keyframes) {
      const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
      expect(new Set(props)).toEqual(new Set(['transform']));
    }
    const durations = [...css.matchAll(/--drift-duration:\s*([\d.]+)s/g)].map((m) => Number(m[1]));
    expect(durations.length).toBeGreaterThan(0);
    for (const d of durations) expect(d).toBeGreaterThanOrEqual(60);
  });
});
