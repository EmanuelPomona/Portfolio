// Owner: agent/frontend. Fog-clear scroll reveal (TASK-101).
import { useEffect, useLayoutEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** The share of the element, or of the viewport for very tall elements, that must be in view. */
const SHARE = 0.15;
const THRESHOLDS = [0, 0.02, 0.05, 0.1, SHARE];

function isEnoughInView(entry: IntersectionObserverEntry): boolean {
  if (!entry.isIntersecting) return false;
  if (entry.intersectionRatio >= SHARE) return true;
  // An element taller than the viewport / 0.15 can never reach a 15% ratio, so it also counts
  // once it fills 15% of the viewport.
  const viewport = entry.rootBounds?.height ?? window.innerHeight;
  return entry.intersectionRect.height >= SHARE * viewport;
}

/** Entirely above the viewport: a nav jump went past it, or the page loaded at a later section. */
function isAbove(entry: IntersectionObserverEntry): boolean {
  return !entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0);
}

/** fogged: waiting. animate: clears (and arrives) with motion. instant: shown at once, no motion. */
type Reveal = 'fogged' | 'animate' | 'instant';

/**
 * Sets data-revealed="true" on the element the first time 15% of it is in view, and never
 * un-reveals. Under reduced motion the element is revealed immediately. The CSS in global.css
 * does the visual work for elements marked data-fog="self" or data-fog="stagger", and for the
 * arrivals of elements that also carry data-arrive (TASK-108).
 *
 * Two cases also set data-reveal="instant", which turns the motion off for good (it is never
 * removed, so nothing replays): an element found entirely above the viewport, and an element that
 * receives focus. Focused content is then fully visible in the same frame (M-04).
 */
export function useFogReveal<T extends HTMLElement>(): {
  ref: (el: T | null) => void;
  revealed: boolean;
} {
  const [element, setElement] = useState<T | null>(null);
  const [reveal, setReveal] = useState<Reveal>('fogged');
  const revealed = reveal !== 'fogged';
  const reduced = usePrefersReducedMotion();

  // Latch on reduced motion during render, so the first paint is already revealed.
  if (reduced && !revealed) setReveal('animate');

  useLayoutEffect(() => {
    if (!element || !revealed) return;
    element.setAttribute('data-revealed', 'true');
    if (reveal === 'instant') element.setAttribute('data-reveal', 'instant');
  }, [element, revealed, reveal]);

  // Focus inside, by keyboard or otherwise: show it now, whatever the scroll position or motion.
  useEffect(() => {
    if (!element || reveal === 'instant') return;
    const onFocusIn = () => setReveal('instant');
    element.addEventListener('focusin', onFocusIn);
    return () => element.removeEventListener('focusin', onFocusIn);
  }, [element, reveal]);

  useEffect(() => {
    if (!element || revealed) return;
    if (typeof IntersectionObserver === 'undefined') {
      // No observer support: show the content rather than leave it in the fog.
      const id = setTimeout(() => setReveal('animate'), 0);
      return () => clearTimeout(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(isEnoughInView)) {
          observer.disconnect();
          setReveal('animate');
        } else if (entries.some(isAbove)) {
          observer.disconnect();
          setReveal('instant');
        }
      },
      { threshold: THRESHOLDS },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, revealed]);

  return { ref: setElement, revealed };
}
