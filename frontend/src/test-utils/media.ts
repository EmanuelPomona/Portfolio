// Owner: agent/frontend. Test-only helpers: a controllable matchMedia and IntersectionObserver.
// Imported by *.test.ts(x) only; never by application code.

type Listener = (event: MediaQueryListEvent) => void;

interface FakeQuery {
  matches: boolean;
  listeners: Set<Listener>;
}

/**
 * Replaces window.matchMedia with one whose answers the test controls.
 * `set(query, true)` flips a query and notifies its listeners, the way a browser does when the
 * user changes a system setting. Unknown queries do not match.
 */
export function installMatchMedia(initial: Record<string, boolean> = {}) {
  const queries = new Map<string, FakeQuery>();
  const get = (query: string): FakeQuery => {
    let q = queries.get(query);
    if (!q) {
      q = { matches: initial[query] ?? false, listeners: new Set() };
      queries.set(query, q);
    }
    return q;
  };

  const original = window.matchMedia;
  window.matchMedia = ((query: string) => {
    const q = get(query);
    const mql = {
      media: query,
      get matches() {
        return q.matches;
      },
      onchange: null,
      addEventListener: (_type: 'change', fn: Listener) => q.listeners.add(fn),
      removeEventListener: (_type: 'change', fn: Listener) => q.listeners.delete(fn),
      addListener: (fn: Listener) => q.listeners.add(fn),
      removeListener: (fn: Listener) => q.listeners.delete(fn),
      dispatchEvent: () => false,
    };
    return mql as unknown as MediaQueryList;
  }) as typeof window.matchMedia;

  return {
    set(query: string, matches: boolean) {
      const q = get(query);
      q.matches = matches;
      for (const fn of [...q.listeners]) fn({ matches, media: query } as MediaQueryListEvent);
    },
    listenerCount(query: string) {
      return get(query).listeners.size;
    },
    restore() {
      window.matchMedia = original;
    },
  };
}

interface FakeObserver {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  elements: Set<Element>;
  observer: IntersectionObserver;
}

/**
 * Replaces IntersectionObserver with one the test drives by hand:
 * `intersect(el, ratio)` delivers an entry for `el` to every observer watching it.
 */
export function installIntersectionObserver() {
  const observers: FakeObserver[] = [];
  const original = window.IntersectionObserver;

  class Fake {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds: readonly number[] = [];
    private readonly record: FakeObserver;
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.record = {
        callback,
        options,
        elements: new Set(),
        observer: this as unknown as IntersectionObserver,
      };
      observers.push(this.record);
    }
    observe(el: Element) {
      this.record.elements.add(el);
    }
    unobserve(el: Element) {
      this.record.elements.delete(el);
    }
    disconnect() {
      this.record.elements.clear();
    }
    takeRecords() {
      return [];
    }
  }

  window.IntersectionObserver = Fake as unknown as typeof IntersectionObserver;

  return {
    intersect(
      el: Element,
      ratio: number,
      { height = 1000, viewportHeight = window.innerHeight }: { height?: number; viewportHeight?: number } = {},
    ) {
      const visible = height * ratio;
      const entry = {
        target: el,
        isIntersecting: ratio > 0,
        intersectionRatio: ratio,
        boundingClientRect: { top: 0, bottom: height, height } as DOMRectReadOnly,
        intersectionRect: { top: 0, bottom: visible, height: visible } as DOMRectReadOnly,
        rootBounds: { top: 0, bottom: viewportHeight, height: viewportHeight } as DOMRectReadOnly,
        time: 0,
      } as IntersectionObserverEntry;
      for (const o of observers) {
        if (o.elements.has(el)) o.callback([entry], o.observer);
      }
    },
    watching(el: Element) {
      return observers.some((o) => o.elements.has(el));
    },
    restore() {
      window.IntersectionObserver = original;
    },
  };
}
