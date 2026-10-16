import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { about, type About as AboutContent, type LifePhoto } from '../../content';
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

  it('never renders the draft flag', () => {
    const { container } = render(<About about={about} heading="About" />);
    expect(container.textContent).not.toMatch(/draft/i);
  });
});
