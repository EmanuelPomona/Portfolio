import { cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MediaAsset } from '../../content';
import { Picture } from './Picture';

// Synthetic fixture in the media.generated.ts shape; no real asset is referenced.
const asset: MediaAsset = {
  id: 'fixtures/plate',
  width: 1600,
  height: 1000,
  placeholder: '#8a8f8c',
  sources: [
    { type: 'image/avif', srcset: '/media/fixtures/plate-640.avif 640w, /media/fixtures/plate-1600.avif 1600w' },
    { type: 'image/webp', srcset: '/media/fixtures/plate-640.webp 640w, /media/fixtures/plate-1600.webp 1600w' },
  ],
  fallback: {
    src: '/media/fixtures/plate-1600.jpg',
    srcset: '/media/fixtures/plate-640.jpg 640w, /media/fixtures/plate-1600.jpg 1600w',
  },
};

describe('Picture', () => {
  let decode: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    decode = vi.fn(() => Promise.resolve());
    Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: decode });
  });
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
  });

  it('renders a source per media.sources entry in order', () => {
    const { container } = render(<Picture media={asset} alt="A plate" sizes="50vw" />);
    const sources = [...container.querySelectorAll('picture > source')];
    expect(sources.map((s) => s.getAttribute('type'))).toEqual(['image/avif', 'image/webp']);
    expect(sources.map((s) => s.getAttribute('srcset'))).toEqual(asset.sources.map((s) => s.srcset));
    expect(sources.every((s) => s.getAttribute('sizes') === '50vw')).toBe(true);
    // The <img> comes last, after every <source>.
    expect(container.querySelector('picture')!.lastElementChild!.tagName).toBe('IMG');
  });

  it('sets width/height/placeholder from the asset', () => {
    const { getByRole } = render(<Picture media={asset} alt="A plate" sizes="50vw" />);
    const img = getByRole('img', { name: 'A plate' });
    expect(img).toHaveAttribute('width', '1600');
    expect(img).toHaveAttribute('height', '1000');
    expect(img).toHaveAttribute('src', asset.fallback.src);
    expect(img).toHaveAttribute('srcset', asset.fallback.srcset);
    expect(img).toHaveAttribute('sizes', '50vw');
    expect(img.style.backgroundColor).toBe('rgb(138, 143, 140)');
  });

  it('priority sets eager + fetchpriority=high', () => {
    const { getByRole } = render(<Picture media={asset} alt="A plate" sizes="100vw" priority />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('default is lazy + async', () => {
    const { getByRole } = render(<Picture media={asset} alt="A plate" sizes="100vw" />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).not.toHaveAttribute('fetchpriority');
  });

  it('calls onDecode once', () => {
    const onDecode = vi.fn();
    const { rerender } = render(
      <StrictMode>
        <Picture media={asset} alt="" sizes="100vw" priority onDecode={onDecode} />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <Picture media={asset} alt="" sizes="100vw" priority onDecode={onDecode} />
      </StrictMode>,
    );
    expect(onDecode).toHaveBeenCalledTimes(1);
    expect(onDecode.mock.calls[0]![0]).toBeInstanceOf(Promise);
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it('applies the className to the <img>', () => {
    const { container } = render(<Picture media={asset} alt="" sizes="100vw" className="plate" />);
    expect(container.querySelector('img')).toHaveClass('plate');
  });
});
