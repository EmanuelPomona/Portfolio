// Owner: agent/frontend. Live reduced-motion preference (TASK-101).
import { useMediaQuery } from './useMediaQuery';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** True while the visitor asks for reduced motion. Re-renders when the setting changes. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}
