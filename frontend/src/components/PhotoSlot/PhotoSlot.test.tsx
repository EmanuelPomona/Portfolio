import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LifePhoto } from '../../content';
import { FINE_POINTER_QUERY } from '../../hooks/useMediaQuery';
import { installMatchMedia } from '../../test-utils/media';
import { PhotoSlot } from './PhotoSlot';

const css = readFileSync(join(__dirname, 'PhotoSlot.module.css'), 'utf8');

const empty: LifePhoto = { id: 'photo-1', aspect: '4:3', image: null, alt: null, caption: null };
// TEST FIXTURE ONLY (A-03). Shipped content has no life photos yet.
const withImage: LifePhoto = {
  id: 'fixture',
  aspect: '2:3',
  image: 'backgrounds/evergreen-forest',
  alt: 'Fixture photo',
  caption: 'Fixture caption',
};

describe('PhotoSlot', () => {
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true });
  });
  afterEach(() => {
    cleanup();
    media.restore();
  });

  it('renders a figure whose ratio comes from aspect ("4:3" becomes 4 / 3)', () => {
    const { container } = render(<PhotoSlot photo={empty} sizes="40vw" />);
    const figure = container.querySelector('figure')!;
    expect(figure.style.getPropertyValue('--ratio')).toBe('4 / 3');
    expect(figure).toHaveAttribute('data-aspect', '4:3');
    expect(css).toMatch(/\.frame\s*\{[^}]*aspect-ratio:\s*var\(--ratio\)/);
  });

  it('renders an empty slot as a bare panel: no image, no words, hidden from assistive tech (A-02)', () => {
    const { container } = render(<PhotoSlot photo={empty} sizes="40vw" />);
    const figure = container.querySelector('figure')!;
    expect(container.querySelector('img')).toBeNull();
    expect(figure.textContent).toBe('');
    expect(figure).toHaveAttribute('aria-hidden', 'true');
    expect(figure).not.toHaveAttribute('tabindex');
  });

  it('no figcaption when caption is null', () => {
    const { container } = render(<PhotoSlot photo={{ ...withImage, caption: null }} sizes="40vw" />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('renders the caption when there is one', () => {
    render(<PhotoSlot photo={withImage} sizes="40vw" />);
    expect(screen.getByText('Fixture caption').tagName).toBe('FIGCAPTION');
  });

  it('shows the fixture image and toggles data-attended on hover and focus (A-03)', () => {
    const { container } = render(<PhotoSlot photo={withImage} sizes="40vw" />);
    const figure = container.querySelector('figure')!;
    expect(screen.getByRole('img', { name: 'Fixture photo' })).toBeInTheDocument();
    expect(figure).toHaveAttribute('tabindex', '0');
    expect(figure).toHaveAttribute('data-attended', 'false');

    fireEvent.mouseEnter(figure);
    expect(figure).toHaveAttribute('data-attended', 'true');
    fireEvent.mouseLeave(figure);
    expect(figure).toHaveAttribute('data-attended', 'false');

    fireEvent.keyDown(document, { key: 'Tab' });
    act(() => figure.focus());
    expect(figure).toHaveAttribute('data-attended', 'true');
    act(() => figure.blur());
    expect(figure).toHaveAttribute('data-attended', 'false');
  });

  it('rests in grayscale and low contrast, and comes to full color on attention (A-03)', () => {
    expect(css).toMatch(/\.image\s*\{[^}]*filter:\s*grayscale\(1\)\s+contrast\(0\.\d+\)/);
    expect(css).toMatch(/\.slot\[data-attended='true'\] \.image\s*\{[^}]*filter:\s*none/);
  });

  it('a 120-character caption renders fully', () => {
    const caption =
      'Tunnel View in Yosemite on the first clear morning after a week of rain, with the valley floor still white under clouds.';
    expect(caption).toHaveLength(120);
    render(<PhotoSlot photo={{ ...withImage, caption }} sizes="40vw" />);
    expect(screen.getByText(caption).textContent).toBe(caption);
    expect(css).not.toMatch(/\.caption\s*\{[^}]*(text-overflow|line-clamp)/);
  });

  it('falls back to the empty panel when the image fails to load', () => {
    const { container } = render(<PhotoSlot photo={withImage} sizes="40vw" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
  });
});
