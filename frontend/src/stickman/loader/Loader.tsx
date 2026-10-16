// Owner: agent/stickman.
// STUB from the manager scaffold. TASK-203 replaces the body with the scribbling loader.
// It already honours the timing contract (docs/API.md §2.2): settles on `ready` or the 4.5s cap,
// records the visit, removes the boot cover, and calls onDone exactly once.
import { useEffect, useRef } from 'react';
import type { LoaderProps } from '../types';
import { LOADER_SEEN_KEY } from './mode';

const CAP_MS = 4500;

export function Loader({ ready, onDone }: LoaderProps) {
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    const cap = new Promise<void>((resolve) => setTimeout(resolve, CAP_MS));
    const settled = ready.then(
      () => undefined,
      () => undefined,
    );
    void Promise.race([settled, cap]).then(() => {
      if (cancelled || finished.current) return;
      finished.current = true;
      try {
        sessionStorage.setItem(LOADER_SEEN_KEY, '1');
      } catch {
        // Storage can be blocked (private mode); the loader simply shows again next visit.
      }
      document.getElementById('boot-cover')?.remove();
      onDoneRef.current();
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return null;
}
