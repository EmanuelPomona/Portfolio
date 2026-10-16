// Owner: agent/frontend. A live media query, re-evaluated when the device or setting changes.
import { useCallback, useSyncExternalStore } from 'react';

export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
export const COARSE_POINTER_QUERY = '(pointer: coarse)';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
