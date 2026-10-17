import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { about, type About as AboutContent, type LifePhoto } from '../../content';
import { fogDelay, globalCss, partDeclaration, resolveNumber } from '../../test-utils/cssTimings';
import { installIntersectionObserver, installMatchMedia } from '../../test-utils/media';
import { About } from './About';

const slot = (id: string, aspect: LifePhoto['aspect'], caption: string | null = null): LifePhoto => ({
  id,
  aspect,
  image: null,
  alt: null,
  caption,
});

describe('About', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia();
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
  });

  it('shows the description, then "This semester", then the classes, then the photos (A-01)', () => {
    const { container } = render(<About about={about} heading="About" />);
    const region = screen.getByRole('region', { name: 'About' });
    expect(region).toHaveAttribute('id', 'about');
    const description = within(region).getByText(about.description);
    const label = within(region).getByRole('heading', { level: 3, name: 'This semester' });
    const classes = within(region).getAllByRole('listitem').map((li) => li.textContent);
    expect(classes).toEqual(['Linear Algebra', 'Data Structures and Algorithms']);
    const firstSlot = container.querySelector('figure')!;
    const order = [description, label, within(region).getAllByRole('listitem')[0]!, firstSlot];
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('renders slots with aspect ratios 4/3, 2/3, 4/3, 9/16, 4/3 in order', () => {
    const { container } = render(<About about={about} heading="About" />);
    const ratios = [...container.querySelectorAll('figure')].map((f) => (f as HTMLElement).style.getPropertyValue('--ratio'));
    expect(ratios).toEqual(['4 / 3', '2 / 3', '4 / 3', '9 / 16', '4 / 3']);
  });

  it('places the slots by index with the scatter recipe, in one spread for five', () => {
    const { container } = render(<About about={about} heading="About" />);
    const spreads = container.querySelectorAll('[data-spread]');
    expect(spreads).toHaveLength(1);
    expect(spreads[0]).toHaveAttribute('data-fill', '5');
    expect([...container.querySelectorAll('figure')].map((f) => f.closest('[data-pos]')!.getAttribute('data-pos'))).toEqual(['0', '1', '2', '3', '4']);
  });

  it('six photos render six slots, cycling positions after five', () => {
    const six: AboutContent = { ...about, photos: [...about.photos, slot('photo-6', '3:2')] };
    const { container } = render(<About about={six} heading="About" />);
    const figures = [...container.querySelectorAll('figure')];
    expect(figures).toHaveLength(6);
    expect(figures.map((f) => f.closest('[data-pos]')!.getAttribute('data-pos'))).toEqual(['0', '1', '2', '3', '4', '0']);
    expect([...container.querySelectorAll('[data-spread]')].map((s) => s.getAttribute('data-fill'))).toEqual(['5', '1']);
  });

  it('renders no collage when there are no photos', () => {
    const none: AboutContent = { ...about, photos: [] };
    const { container } = render(<About about={none} heading="About" />);
    expect(container.querySelector('figure')).toBeNull();
    expect(container.querySelector('[data-spread]')).toBeNull();
  });

  it('a 120-character caption renders fully', () => {
    const caption =
      'Tunnel View in Yosemite on the first clear morning after a week of rain, with the valley floor still white under clouds.';
    const captioned: AboutContent = { ...about, photos: [slot('photo-1', '4:3', caption)] };
    render(<About about={captioned} heading="About" />);
    expect(screen.getByText(caption).textContent).toBe(caption);
  });

  it('loosens a captioned spread into a flow so no print covers a caption', () => {
    // Regression: in the overlapping scatter, later prints covered up to 100% of an earlier
    // print's caption (measured in the browser at 1440, 1024, 768, and 390 with 120-char captions).
    const css = readFileSync(join(__dirname, 'About.module.css'), 'utf8');
    const spread = css.match(/\.spread\[data-captioned='true'\]\s*\{([^}]*)\}/)?.[1] ?? '';
    const place = css.match(/\.spread\[data-captioned='true'\] \.place\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(spread).toMatch(/display:\s*flex/);
    expect(spread).toMatch(/flex-wrap:\s*wrap/);
    expect(spread).toMatch(/height:\s*auto/);
    expect(place).toMatch(/position:\s*relative/);

    const captioned: AboutContent = { ...about, photos: about.photos.map((p, i) => (i === 1 ? { ...p, caption: 'A caption' } : p)) };
    const { container } = render(<About about={captioned} heading="About" />);
    expect(container.querySelector('[data-spread]')).toHaveAttribute('data-captioned', 'true');
  });

  it('About prints settle with a stagger of at most 0.08s per print', () => {
    const { container } = render(<About about={about} heading="About" />);
    const spread = container.querySelector('[data-spread]')!;
    expect(spread).toHaveAttribute('data-arrive', 'settle');
    expect(spread).toHaveAttribute('data-fog', 'stagger');
    const aboutCss = readFileSync(join(__dirname, 'About.module.css'), 'utf8');
    const delay = resolveNumber(partDeclaration(aboutCss, 'place', '--arrive-delay') ?? '0s');
    const starts = [...spread.children].map((_, i) => fogDelay(i + 1) + delay);
    expect(starts.length).toBeGreaterThan(1);
    for (let i = 1; i < starts.length; i++) {
      const step = starts[i]! - starts[i - 1]!;
      // A stagger, never all at once, and never slower than 0.08s per print.
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThanOrEqual(0.08 + 1e-9);
    }
    // Each print settles about 16px down into place.
    expect(resolveNumber(partDeclaration(aboutCss, 'place', '--arrive-distance') ?? '0px')).toBe(16);
    expect(globalCss).toMatch(/\[data-arrive='settle'\]\s*\{[^}]*--arrive-dir-y:\s*-1/);
  });

  it('never renders the draft flag', () => {
    const { container } = render(<About about={about} heading="About" />);
    expect(container.textContent).not.toMatch(/draft/i);
  });
});
