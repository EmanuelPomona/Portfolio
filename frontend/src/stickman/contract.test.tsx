// Owner: manager. The stickman contract (docs/API.md §2), checked against whatever implementation
// is behind src/stickman/index.ts. The scaffold stubs pass it; the real implementation must too.
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOADER_SEEN_KEY, Loader, StickmanLayer, loaderMode } from './index';
import type { LoaderComponent, StickmanLayerComponent } from './types';

// Compile-time half of the contract: the exports keep their signatures.
const loaderSignature: LoaderComponent = Loader;
const layerSignature: StickmanLayerComponent = StickmanLayer;

function mockMatchMedia(isMatch: (query: string) => boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isMatch(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

const html = document.documentElement;

describe('stickman contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    delete html.dataset.loader;
    html.classList.remove('stickman-cursor');
    const cover = document.createElement('div');
    cover.id = 'boot-cover';
    document.body.appendChild(cover);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.getElementById('boot-cover')?.remove();
  });

  it('keeps the exported signatures', () => {
    expect(typeof loaderSignature).toBe('function');
    expect(typeof layerSignature).toBe('function');
  });

  it('loaderMode reads html[data-loader] and defaults to skip', () => {
    expect(loaderMode()).toBe('skip');
    for (const mode of ['show', 'fade', 'skip'] as const) {
      html.dataset.loader = mode;
      expect(loaderMode()).toBe(mode);
    }
    html.dataset.loader = 'unexpected';
    expect(loaderMode()).toBe('skip');
  });

  it('uses the sessionStorage key shared with the index.html gate', () => {
    expect(LOADER_SEEN_KEY).toBe('el:loader-seen');
  });

  it('Loader calls onDone exactly once within 5s even if ready never settles', async () => {
    html.dataset.loader = 'show';
    mockMatchMedia(() => false);
    const onDone = vi.fn();
    render(<Loader ready={new Promise(() => {})} onDone={onDone} />);
    await vi.advanceTimersByTimeAsync(5000);
    expect(onDone).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('Loader treats a rejected ready as ready, records the visit, and removes the boot cover', async () => {
    html.dataset.loader = 'show';
    mockMatchMedia(() => false);
    const failed = Promise.reject(new Error('hero image failed'));
    failed.catch(() => {});
    const onDone = vi.fn();
    render(<Loader ready={failed} onDone={onDone} />);
    await vi.advanceTimersByTimeAsync(5000);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(LOADER_SEEN_KEY)).toBe('1');
    expect(document.getElementById('boot-cover')).toBeNull();
  });

  it('Loader in fade mode finishes within 1s of ready', async () => {
    html.dataset.loader = 'fade';
    mockMatchMedia((q) => q.includes('reduce'));
    const onDone = vi.fn();
    render(<Loader ready={Promise.resolve()} onDone={onDone} />);
    await vi.advanceTimersByTimeAsync(1000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('StickmanLayer never hides the native cursor under reduced motion', () => {
    mockMatchMedia((q) => q.includes('reduce') || q.includes('fine'));
    render(<StickmanLayer touch={false} />);
    expect(html.classList.contains('stickman-cursor')).toBe(false);
  });

  it('StickmanLayer never hides the native cursor on a coarse pointer', () => {
    mockMatchMedia((q) => q.includes('coarse'));
    render(<StickmanLayer touch={false} />);
    expect(html.classList.contains('stickman-cursor')).toBe(false);
  });

  it('StickmanLayer restores the native cursor when it unmounts', () => {
    mockMatchMedia((q) => q.includes('fine') && !q.includes('reduce'));
    const { unmount } = render(<StickmanLayer touch={false} />);
    unmount();
    expect(html.classList.contains('stickman-cursor')).toBe(false);
  });
});
