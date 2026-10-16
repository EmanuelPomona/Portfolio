// Owner: agent/stickman. Must agree with the gate script in index.html (docs/API.md §2.4).
import type { LoaderMode } from '../types';

/** sessionStorage key the gate script reads and the Loader writes. Contract value. */
export const LOADER_SEEN_KEY = 'el:loader-seen';

export function loaderMode(): LoaderMode {
  if (typeof document === 'undefined') return 'skip';
  const value = document.documentElement.dataset.loader;
  return value === 'show' || value === 'fade' ? value : 'skip';
}
