// Owner: agent/frontend. "Is this about to be seen?", latched (TASK-110): what loading="lazy" does
// for an <img>, for things that cannot lazy-load themselves, such as a <video poster>.
import { useEffect, useState } from 'react';

/**
 * False until `target` comes within `rootMargin` of the viewport (by default half a viewport ahead),
 * then true for good. Where IntersectionObserver is missing it turns true at once, so content is
 * never held back.
 */
export function useNearViewport(target: Element | null, rootMargin = '50% 0px'): boolean {
  // Without IntersectionObserver there is nothing to wait for: near from the first render.
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (!target || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          setNear(true);
        }
      },
      { rootMargin },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [target, near, rootMargin]);

  return near;
}
