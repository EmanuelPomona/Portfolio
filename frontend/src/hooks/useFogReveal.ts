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

/** The reveal's own keyframes, in global.css. */
const REVEAL_ANIMATIONS = new Set(['fog-clear', 'arrive']);

/** True while any reveal keyframe on the element or its parts is still due (running or delayed). */
function revealPending(el: Element): boolean {
  if (typeof el.getAnimations !== 'function') return false;
  return el
    .getAnimations({ subtree: true })
    .some((a) => 'animationName' in a && REVEAL_ANIMATIONS.has((a as CSSAnimation).animationName) && a.playState !== 'finished');
}

/**
 * Calls `onSettled` once the reveal's last keyframe on `el` (or its parts) has ended or been
 * cancelled. Setting data-reveal="instant" then retires the animation for good: a finished reveal
 * that keeps its `animation` declared restarts whenever a media query (reduced motion, print)
 * removes it and gives it back. The reveal itself never waits for this; it only tidies up.
 * Returns the cleanup.
 */
export function settleWhenRevealed(el: Element, onSettled: () => void): () => void {
  const onEnd = (event: Event) => {
    const name = (event as AnimationEvent).animationName;
    if (REVEAL_ANIMATIONS.has(name) && !revealPending(el)) onSettled();
  };
  el.addEventListener('animationend', onEnd);
  el.addEventListener('animationcancel', onEnd);
  return () => {
    el.removeEventListener('animationend', onEnd);
    el.removeEventListener('animationcancel', onEnd);
  };
}

/**
 * Sets data-revealed="true" on the element the first time 15% of it is in view, and never
 * un-reveals. Under reduced motion the element is revealed immediately. The CSS in global.css
 * does the visual work for elements marked data-fog="self" or data-fog="stagger", and for the
 * arrivals of elements that also carry data-arrive (TASK-108).
 *
 * data-reveal="instant" turns the motion off for good (it is never removed, so nothing replays).
 * It is set when an element is found entirely above the viewport, when it receives focus (focused
 * content is then fully visible in the same frame, M-04), under reduced motion, and once a
 * reveal that did play has finished.
 */
export function useFogReveal<T extends HTMLElement>(): {
  ref: (el: T | null) => void;
  revealed: boolean;
} {
  const [element, setElement] = useState<T | null>(null);
  const [reveal, setReveal] = useState<Reveal>('fogged');
  const revealed = reveal !== 'fogged';
  const reduced = usePrefersReducedMotion();

  // Latch on reduced motion during render, so the first paint is already revealed. Instant, so
  // turning reduced motion off later never plays a reveal for content that is already shown.
  if (reduced && !revealed) setReveal('instant');

  useLayoutEffect(() => {
    if (!element || !revealed) return;
    element.setAttribute('data-revealed', 'true');
    if (reveal === 'instant') element.setAttribute('data-reveal', 'instant');
  }, [element, revealed, reveal]);

  // Once the reveal has played, retire it, so nothing can replay it.
  useEffect(() => {
    if (!element || reveal !== 'animate') return;
    return settleWhenRevealed(element, () => setReveal('instant'));
  }, [element, reveal]);

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
