// Owner: agent/frontend. Scroll depth (TASK-108, M-03): backgrounds and clouds travel slower than
// the content. One shared passive scroll listener for the whole page; the work happens in
// requestAnimationFrame; layouts are read on mount and resize only, never per frame.
import { useEffect } from 'react';
import { depthOffset } from '../lib/depth';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** M-03: a layer never strays more than this from its place in the layout. */
export const DEPTH_MAX_PX = 80;

interface Layer {
  readonly factor: number;
  top: number;
  height: number;
  /** The --depth last written, in px; null before the first frame. */
  offset: number | null;
}

const layers = new Map<HTMLElement, Layer>();
let frame = 0;
let stale = true;
let resizeObserver: ResizeObserver | null = null;

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

function onScroll() {
  schedule();
}

function onResize() {
  stale = true;
  schedule();
}

function update() {
  frame = 0;
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  if (stale) {
    // Reads first, all together. Each rect includes the offset this hook wrote, so take it out to
    // get the layer's own layout position.
    stale = false;
    for (const [el, layer] of layers) {
      const rect = el.getBoundingClientRect();
      layer.top = rect.top + scrollY - (layer.offset ?? 0);
      layer.height = rect.height;
    }
  }
  for (const [el, layer] of layers) {
    const raw = depthOffset({ top: layer.top, height: layer.height, scrollY, viewportHeight }, layer.factor, DEPTH_MAX_PX);
    const offset = Math.round(raw * 10) / 10 + 0;
    if (offset !== layer.offset) {
      layer.offset = offset;
      el.style.setProperty('--depth', `${offset}px`);
    }
  }
}

function register(el: HTMLElement, factor: number) {
  layers.set(el, { factor, top: 0, height: 0, offset: null });
  if (layers.size === 1) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    // The page's height also changes without a resize (fonts swapping in, a spread growing): the
    // body's size is the cheapest signal that the cached positions are stale.
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(document.body);
    }
  }
  stale = true;
  schedule();
}

function unregister(el: HTMLElement) {
  layers.delete(el);
  el.style.removeProperty('--depth');
  if (layers.size === 0) {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
}

/**
 * Writes --depth (px) on `target` so its CSS can `translate: 0 var(--depth)`: the layer lags the
 * content by `factor`, clamped to DEPTH_MAX_PX. Under reduced motion it does nothing and removes
 * --depth. Apply it to decorative layers only; never to what a visitor reads or points at.
 */
export function useScrollDepth(target: HTMLElement | null, factor = 0.1): void {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!target || reduced) return;
    register(target, factor);
    return () => unregister(target);
  }, [target, factor, reduced]);
}
