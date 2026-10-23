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

// Five empty slots, independent of whatever photos the real content holds.
const emptyAbout: AboutContent = { ...about, photos: [1, 2, 3, 4, 5].map((n) => slot(`photo-${n}`, '4:3')) };

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

  it('renders every slot as a tile of the photo wall, empty ones as mist panels (A-01, A-02)', () => {
    const { container } = render(<About about={emptyAbout} heading="About" />);
    const wall = container.querySelectorAll('[data-wall]');
    expect(wall).toHaveLength(1);
    const tiles = [...container.querySelectorAll('[data-tile]')];
    expect(tiles.map((t) => t.getAttribute('data-tile')).sort()).toEqual(emptyAbout.photos.map((p) => p.id).sort());
    for (const t of tiles) expect(t.querySelector('figure')).toHaveAttribute('data-empty', 'true');
    // The scatter is gone: no spreads, no positioned places.
    expect(container.querySelector('[data-spread], [data-pos]')).toBeNull();
  });

  it('six photos recompose the wall with six tiles', () => {
    const six: AboutContent = { ...emptyAbout, photos: [...emptyAbout.photos, slot('photo-6', '3:2')] };
    const { container } = render(<About about={six} heading="About" />);
    expect(container.querySelectorAll('[data-wall]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-tile]')).toHaveLength(6);
  });

  it('renders no wall when there are no photos', () => {
    const none: AboutContent = { ...about, photos: [] };
    const { container } = render(<About about={none} heading="About" />);
    expect(container.querySelector('figure')).toBeNull();
    expect(container.querySelector('[data-wall]')).toBeNull();
  });

  it('a 120-character caption renders fully', () => {
    const caption =
      'Tunnel View in Yosemite on the first clear morning after a week of rain, with the valley floor still white under clouds.';
    const captioned: AboutContent = { ...about, photos: [slot('photo-1', '4:3', caption)] };
    render(<About about={captioned} heading="About" />);
    expect(screen.getByText(caption).textContent).toBe(caption);
  });

  it('About prints settle with a stagger of at most 0.08s per print', () => {
    const { container } = render(<About about={about} heading="About" />);
    const wall = container.querySelector('[data-wall]')!;
    expect(wall).toHaveAttribute('data-arrive', 'settle');
    expect(wall).toHaveAttribute('data-fog', 'stagger');
    const wallCss = readFileSync(join(__dirname, 'PhotoWall.module.css'), 'utf8');
    const delay = resolveNumber(partDeclaration(wallCss, 'tile', '--arrive-delay') ?? '0s');
    const starts = [...wall.children].map((_, i) => fogDelay(i + 1) + delay);
    expect(starts.length).toBeGreaterThan(1);
    for (let i = 1; i < starts.length; i++) {
      const step = starts[i]! - starts[i - 1]!;
      // A stagger, never all at once, and never slower than 0.08s per print. Past the fifth the
      // prints share the last delay (global.css caps the stagger), so a step may also be 0 there.
      if (i < 5) expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThanOrEqual(0.08 + 1e-9);
    }
    // Each print settles about 16px down into place.
    expect(resolveNumber(partDeclaration(wallCss, 'tile', '--arrive-distance') ?? '0px')).toBe(16);
    expect(globalCss).toMatch(/\[data-arrive='settle'\]\s*\{[^}]*--arrive-dir-y:\s*-1/);
  });

  it('never renders the draft flag', () => {
    const { container } = render(<About about={about} heading="About" />);
    expect(container.textContent).not.toMatch(/draft/i);
  });
});
