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

/**
 * Sets data-revealed="true" on the element the first time 15% of it is in view, and never
 * un-reveals. Under reduced motion the element is revealed immediately. The CSS in global.css
 * does the visual work for elements marked data-fog="self" or data-fog="stagger".
 */
export function useFogReveal<T extends HTMLElement>(): {
  ref: (el: T | null) => void;
  revealed: boolean;
} {
  const [element, setElement] = useState<T | null>(null);
  const [revealed, setRevealed] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Latch on reduced motion during render, so the first paint is already revealed.
  if (reduced && !revealed) setRevealed(true);

  useLayoutEffect(() => {
    if (element && revealed) element.setAttribute('data-revealed', 'true');
  }, [element, revealed]);

  useEffect(() => {
    if (!element || revealed) return;
    if (typeof IntersectionObserver === 'undefined') {
      // No observer support: show the content rather than leave it in the fog.
      const id = setTimeout(() => setRevealed(true), 0);
      return () => clearTimeout(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(isEnoughInView)) {
          observer.disconnect();
          setRevealed(true);
        }
      },
      { threshold: THRESHOLDS },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, revealed]);

  return { ref: setElement, revealed };
}
