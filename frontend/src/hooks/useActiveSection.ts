// Owner: agent/frontend. Which section the visitor is in, for the nav (TASK-101).
import { useEffect, useState } from 'react';
import type { SectionId } from '../content';

const DEFAULT: SectionId = 'home';

function measure(ids: readonly SectionId[], current: SectionId): SectionId {
  const doc = document.documentElement;
  const viewport = window.innerHeight;
  // At the very bottom of a scrollable page the last section is the one being read, even when it
  // is too short to reach the viewport's center.
  if (ids.length > 0 && doc.scrollHeight > viewport && window.scrollY + viewport >= doc.scrollHeight - 2) {
    return ids[ids.length - 1]!;
  }
  const center = viewport / 2;
  for (const id of ids) {
    const rect = document.getElementById(id)?.getBoundingClientRect();
    if (rect && rect.top <= center && rect.bottom > center) return id;
  }
  return current;
}

/**
 * The section whose box contains the viewport's vertical center. Defaults to 'home'.
 * Measured on scroll and resize, at most once per animation frame. State changes only when the
 * answer changes, so scrolling inside one section does not re-render the page.
 */
export function useActiveSection(ids: readonly SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>(DEFAULT);
  const key = ids.join(' ');

  useEffect(() => {
    const list = key.split(' ') as SectionId[];
    let pending = false;
    let frame = 0;
    const update = () => {
      pending = false;
      setActive((current) => measure(list, current));
    };
    const schedule = () => {
      if (pending) return;
      pending = true; // set before the request, so the throttle holds whenever the frame runs
      frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (pending) window.cancelAnimationFrame(frame);
    };
  }, [key]);

  return active;
}
