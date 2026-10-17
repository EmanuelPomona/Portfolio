// Owner: agent/frontend. When ambient drift may run: the hero's fog (TASK-102) and the clouds
// through the page (TASK-107) pause by the same rules.
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** True while the target is on screen, the tab is visible, and motion is allowed. */
export function useDriftPlaying(target: HTMLElement | null): boolean {
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);

  useEffect(() => {
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setInView(entry.isIntersecting);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return inView && visible && !reduced;
}
