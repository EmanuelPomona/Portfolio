import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installIntersectionObserver, installMatchMedia } from '../test-utils/media';
import { App } from './App';

// App's side of the mount contract (docs/API.md §2.5), independent of how the Loader animates.
// The stickman module is replaced by a controllable Loader: the real one's timing (2.2s minimum,
// 4.5s cap, exit) is the stickman slice's, covered by src/stickman/contract.test.tsx.
const loader = vi.hoisted(() => ({
  ready: null as Promise<unknown> | null,
  done: null as (() => void) | null,
}));

vi.mock('../stickman', async (importActual) => {
  const actual = await importActual<typeof import('../stickman')>();
  return {
    ...actual, // loaderMode and LOADER_SEEN_KEY stay real: they read the gate's data-loader
    Loader: ({ ready, onDone }: { ready: Promise<unknown>; onDone: () => void }) => {
      loader.ready = ready;
      loader.done = onDone;
      return <div data-testid="loader" />;
    },
    StickmanLayer: ({ touch }: { touch: boolean }) => <div data-testid="stickman-layer" data-touch={String(touch)} />,
  };
});

function mockDecode(impl: () => Promise<void>) {
  Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: impl });
}

describe('App mount contract', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia();
    loader.ready = null;
    loader.done = null;
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
    Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
    delete document.documentElement.dataset.loader;
  });

  it('mounts the loader while loading, with <main> inert and busy, and the stickman layer always', () => {
    document.documentElement.dataset.loader = 'show';
    mockDecode(() => new Promise(() => {}));
    render(<App />);
    const main = screen.getByRole('main', { hidden: true });
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    expect(main).toHaveAttribute('inert');
    expect(main).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('stickman-layer')).toHaveAttribute('data-touch', 'false'); // flags.touchStickman
  });

  it('hands the loader a ready that settles when the rendered hero image decodes', async () => {
    document.documentElement.dataset.loader = 'show';
    let decoded!: () => void;
    mockDecode(() => new Promise<void>((resolve) => (decoded = resolve)));
    render(<App />);
    const settled = vi.fn();
    void loader.ready!.then(settled, settled);
    await act(async () => {});
    expect(settled).not.toHaveBeenCalled();
    await act(async () => decoded());
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('rejects ready when the hero decode fails, without an unhandled rejection', async () => {
    document.documentElement.dataset.loader = 'show';
    const unhandled = vi.fn();
    window.addEventListener('unhandledrejection', unhandled);
    let fail!: () => void;
    mockDecode(() => new Promise<void>((_, reject) => (fail = () => reject(new Error('decode failed')))));
    render(<App />);
    const ready = loader.ready!;
    await act(async () => fail());
    await expect(ready).rejects.toThrow('decode failed');
    await act(async () => new Promise((r) => setTimeout(r, 0)));
    expect(unhandled).not.toHaveBeenCalled();
    window.removeEventListener('unhandledrejection', unhandled);
  });

  it('releases <main> and unmounts the loader when the loader calls onDone', () => {
    document.documentElement.dataset.loader = 'show';
    mockDecode(() => Promise.resolve());
    render(<App />);
    act(() => loader.done!());
    const main = screen.getByRole('main');
    expect(main).not.toHaveAttribute('inert');
    expect(main).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByTestId('loader')).toBeNull();
    expect(screen.getByTestId('stickman-layer')).toBeInTheDocument(); // still mounted
  });

  describe('a link to a section (#about) on a first visit', () => {
    const scrolled = vi.fn();
    beforeEach(() => {
      scrolled.mockReset();
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value(this: Element) {
          scrolled(this.id);
        },
      });
      history.replaceState(null, '', '#about');
    });
    afterEach(() => {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
      history.replaceState(null, '', location.pathname);
    });

    it('scrolls to the fragment once the loader releases <main>, not before', () => {
      document.documentElement.dataset.loader = 'show';
      mockDecode(() => Promise.resolve());
      render(<App />);
      expect(scrolled).not.toHaveBeenCalled();
      act(() => loader.done!());
      expect(scrolled).toHaveBeenCalledTimes(1);
      expect(scrolled).toHaveBeenCalledWith('about');
    });

    it('leaves the fragment to the browser when no loader was shown', () => {
      document.documentElement.dataset.loader = 'skip';
      mockDecode(() => new Promise(() => {}));
      render(<App />);
      expect(scrolled).not.toHaveBeenCalled();
    });

    it('does nothing when the fragment names no element', () => {
      history.replaceState(null, '', '#nowhere');
      document.documentElement.dataset.loader = 'show';
      mockDecode(() => Promise.resolve());
      render(<App />);
      act(() => loader.done!());
      expect(scrolled).not.toHaveBeenCalled();
    });
  });

  it('mounts no loader and leaves <main> interactive in skip mode', () => {
    document.documentElement.dataset.loader = 'skip';
    mockDecode(() => new Promise(() => {}));
    render(<App />);
    expect(screen.queryByTestId('loader')).toBeNull();
    const main = screen.getByRole('main');
    expect(main).not.toHaveAttribute('inert');
    expect(main).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByTestId('stickman-layer')).toBeInTheDocument();
  });
});
