import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { about, getMedia, type LifePhoto } from '../../content';
import { CAPTION_MIN_ROWS, orientationOf, planWall } from '../../lib/photoWall';
import { installIntersectionObserver, installMatchMedia } from '../../test-utils/media';
import { DESKTOP_QUERY, PhotoWall, TABLET_QUERY } from './PhotoWall';

const css = readFileSync(join(__dirname, 'PhotoWall.module.css'), 'utf8');
const slotCss = readFileSync(join(__dirname, '../../components/PhotoSlot/PhotoSlot.module.css'), 'utf8');

const empty = (id: string, aspect: LifePhoto['aspect'], caption: string | null = null): LifePhoto => ({
  id,
  aspect,
  image: null,
  alt: null,
  caption,
});

/** Tiles in DOM order, with their placement. */
function tiles(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('[data-tile]')].map((el) => ({
    id: el.dataset.tile!,
    column: el.style.gridColumn,
    row: el.style.gridRow,
    el,
  }));
}

describe('PhotoWall', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia({ [DESKTOP_QUERY]: true, [TABLET_QUERY]: true });
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
  });

  it('places every about.photos entry by grid-column and grid-row spans from planWall', () => {
    const { container } = render(<PhotoWall photos={about.photos} />);
    const ratios = about.photos.map((p) => {
      const [w, h] = p.aspect.split(':').map(Number);
      return { id: p.id, ratio: w! / h! };
    });
    const plan = planWall(ratios, 6);
    const placed = tiles(container);
    expect(placed.map((t) => t.id).sort()).toEqual(about.photos.map((p) => p.id).sort());
    for (const t of plan.tiles) {
      const el = placed.find((x) => x.id === t.id)!;
      expect(el.column).toBe(`${t.col} / span ${t.colSpan}`);
      expect(el.row).toBe(`${t.row} / span ${t.rowSpan}`);
      expect(el.el.querySelector('figure')).not.toBeNull();
    }
    const wall = container.querySelector<HTMLElement>('[data-wall]')!;
    expect(wall.style.getPropertyValue('--rows')).toBe(String(plan.rows));
    // Reading order: keyboard focus moves across the wall the way the eye does.
    const order = [...plan.tiles].sort((a, b) => a.row - b.row || a.col - b.col).map((t) => t.id);
    expect(placed.map((t) => t.id)).toEqual(order);
  });

  it("uses the image's manifest ratio, and aspect while the slot is empty", () => {
    // TEST FIXTURE ONLY: a portrait photograph (1024x1536) in a slot whose aspect says 16:9.
    const photo: LifePhoto = { id: 'photo-a', aspect: '16:9', image: 'backgrounds/evergreen-forest', alt: 'Fixture', caption: null };
    const photos = [photo, empty('photo-b', '9:16'), empty('photo-c', '4:3')];
    const { container } = render(<PhotoWall photos={photos} />);
    const media = getMedia('backgrounds/evergreen-forest');
    const plan = planWall(
      [
        { id: 'photo-a', ratio: media.width / media.height },
        { id: 'photo-b', ratio: 9 / 16 },
        { id: 'photo-c', ratio: 4 / 3 },
      ],
      6,
    );
    for (const t of plan.tiles) {
      const el = tiles(container).find((x) => x.id === t.id)!;
      expect(el.column).toBe(`${t.col} / span ${t.colSpan}`);
      expect(el.row).toBe(`${t.row} / span ${t.rowSpan}`);
    }
    const a = tiles(container).find((x) => x.id === 'photo-a')!.el;
    expect(a.dataset.orientation).toBe('portrait');
    expect(orientationOf(media.width / media.height)).toBe('portrait');
  });

  it('switches to 6, 4, and 2 columns at the desktop, tablet, and phone breakpoints', () => {
    const { container } = render(<PhotoWall photos={about.photos} />);
    const wall = () => container.querySelector<HTMLElement>('[data-wall]')!;
    expect(wall().style.getPropertyValue('--cols')).toBe('6');
    act(() => media.set(DESKTOP_QUERY, false));
    expect(wall().style.getPropertyValue('--cols')).toBe('4');
    act(() => media.set(TABLET_QUERY, false));
    expect(wall().style.getPropertyValue('--cols')).toBe('2');
    // Every column count still places every photo.
    expect(tiles(container)).toHaveLength(about.photos.length);
  });

  it('renders no wall for zero photos', () => {
    const { container } = render(<PhotoWall photos={[]} />);
    expect(container.querySelector('[data-wall]')).toBeNull();
    expect(container.querySelector('figure')).toBeNull();
  });

  it("a caption sits on a solid label at the tile's bottom edge, only when written", () => {
    const photos = [empty('photo-a', '4:3', 'Rehearsal before the spring concert'), empty('photo-b', '2:3'), empty('photo-c', '4:3')];
    const { container } = render(<PhotoWall photos={photos} />);
    const captions = [...container.querySelectorAll('figcaption')];
    expect(captions).toHaveLength(1);
    expect(captions[0]!.closest('[data-tile]')).toHaveAttribute('data-tile', 'photo-a');
    // A captioned photo gets a tile tall enough for its label.
    const tile = captions[0]!.closest<HTMLElement>('[data-tile]')!;
    expect(Number(tile.style.gridRow.split('span ')[1])).toBeGreaterThanOrEqual(CAPTION_MIN_ROWS);
    // The label: in the tile's own grid cell, at its bottom edge, on a solid ground.
    const rule = slotCss.match(/\n\.caption\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/grid-area:\s*1\s*\/\s*1/);
    // Safe: a label taller than its tile shows its start, never loses its first lines.
    expect(rule).toMatch(/align-self:\s*safe end/);
    expect(rule).toMatch(/background(-color)?:\s*var\(--color-mist\)/);
    expect(slotCss).not.toMatch(/position:\s*absolute/);
  });

  it('the wall CSS has no absolute positioning and one gap', () => {
    expect(css).not.toMatch(/position:\s*absolute/);
    // No masonry and no multi-column flow: only grid placement.
    expect(css).not.toMatch(/masonry|(^|[\s;{])columns:/);
    expect(css.match(/(^|[\s;{])gap:/g) ?? []).toHaveLength(1);
    expect(css).not.toMatch(/row-gap|column-gap/);
    expect(css).toMatch(/grid-template-columns:\s*repeat\(var\(--cols\)/);
  });
});
