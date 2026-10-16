// Owner: agent/frontend. "Color is earned by attention" as one reusable signal (TASK-103).
import { useEffect, useLayoutEffect, useState } from 'react';
import { inCenterBand } from '../lib/centerBand';
import { COARSE_POINTER_QUERY, FINE_POINTER_QUERY, useMediaQuery } from './useMediaQuery';

function isFocusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return el.matches(':focus'); // engines without :focus-visible
  }
}

/**
 * True while the visitor attends to the element:
 * - hovering it, on a fine pointer;
 * - with keyboard focus (:focus-visible) anywhere inside it;
 * - on a coarse pointer, while its midpoint sits in the viewport's middle band (checked on
 *   scroll and resize, at most once per frame).
 * Mirrors the value as data-attended="true|false" on the element. Motion preference never hides
 * it: the visual transition is CSS, and reduced motion only removes the animation.
 */
export function useAttention<T extends HTMLElement>(): {
  ref: (el: T | null) => void;
  attended: boolean;
} {
  const [element, setElement] = useState<T | null>(null);
  const fine = useMediaQuery(FINE_POINTER_QUERY);
  const coarse = useMediaQuery(COARSE_POINTER_QUERY);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [banded, setBanded] = useState(false);

  useEffect(() => {
    if (!element) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    const focusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && isFocusVisible(event.target)) setFocused(true);
    };
    const focusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !element.contains(next)) setFocused(false);
    };
    element.addEventListener('mouseenter', enter);
    element.addEventListener('mouseleave', leave);
    element.addEventListener('focusin', focusIn);
    element.addEventListener('focusout', focusOut);
    return () => {
      element.removeEventListener('mouseenter', enter);
      element.removeEventListener('mouseleave', leave);
      element.removeEventListener('focusin', focusIn);
      element.removeEventListener('focusout', focusOut);
    };
  }, [element]);

  useEffect(() => {
    if (!element || !coarse) return;
    let pending = false;
    let frame = 0;
    const measure = () => {
      pending = false;
      setBanded(inCenterBand(element.getBoundingClientRect(), window.innerHeight));
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      frame = window.requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (pending) window.cancelAnimationFrame(frame);
    };
  }, [element, coarse]);

  const attended = (fine && hovered) || focused || (coarse && banded);

  useLayoutEffect(() => {
    element?.setAttribute('data-attended', attended ? 'true' : 'false');
  }, [element, attended]);

  return { ref: setElement, attended };
}
