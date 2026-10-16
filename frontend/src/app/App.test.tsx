import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installIntersectionObserver, installMatchMedia } from '../test-utils/media';
import { App } from './App';

// Mount contract (docs/API.md §2.5) exercised through the scaffold's stickman stubs, which honour
// the Loader timing contract: done when `ready` settles, or at the 4.5s cap.

function setLoaderMode(mode: 'show' | 'fade' | 'skip') {
  document.documentElement.dataset.loader = mode;
  const cover = document.createElement('div');
  cover.id = 'boot-cover';
  document.body.prepend(cover);
}

function mockDecode(impl: () => Promise<void>) {
  Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: impl });
}

describe('App mount contract', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia();
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
    vi.useRealTimers();
    Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
    document.getElementById('boot-cover')?.remove();
    delete document.documentElement.dataset.loader;
  });

  it('keeps <main> inert and busy while the hero image has not decoded', () => {
    vi.useFakeTimers();
    setLoaderMode('show');
    mockDecode(() => new Promise(() => {})); // never settles: only the cap could end the loader
    render(<App />);
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toHaveAttribute('inert');
    expect(main).toHaveAttribute('aria-busy', 'true');
    act(() => vi.advanceTimersByTime(3000));
    expect(main).toHaveAttribute('inert');
    expect(document.getElementById('boot-cover')).not.toBeNull();
  });

  it('releases <main> once the hero image the page renders has decoded', async () => {
    setLoaderMode('show');
    let decoded!: () => void;
    mockDecode(() => new Promise<void>((resolve) => (decoded = resolve)));
    render(<App />);
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toHaveAttribute('inert');
    await act(async () => decoded());
    expect(main).not.toHaveAttribute('inert');
    expect(main).toHaveAttribute('aria-busy', 'false');
    expect(document.getElementById('boot-cover')).toBeNull();
    expect(sessionStorage.getItem('el:loader-seen')).toBe('1');
  });

  it('counts a failed hero decode as ready, without an unhandled rejection', async () => {
    setLoaderMode('show');
    const unhandled = vi.fn();
    window.addEventListener('unhandledrejection', unhandled);
    let fail!: () => void;
    mockDecode(() => new Promise<void>((_, reject) => (fail = () => reject(new Error('decode failed')))));
    render(<App />);
    await act(async () => fail());
    expect(screen.getByRole('main')).not.toHaveAttribute('inert');
    await act(async () => new Promise((r) => setTimeout(r, 0)));
    expect(unhandled).not.toHaveBeenCalled();
    window.removeEventListener('unhandledrejection', unhandled);
  });

  it('mounts no loader and leaves <main> interactive in skip mode', () => {
    setLoaderMode('skip');
    mockDecode(() => new Promise(() => {}));
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).not.toHaveAttribute('inert');
    expect(main).toHaveAttribute('aria-busy', 'false');
  });
});
