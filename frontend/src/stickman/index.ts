/**
 * STICKMAN PUBLIC API. Owner: manager. Re-exports only; agent/stickman owns the modules behind it.
 * The page imports from here and nowhere else under src/stickman/.
 */
export type { LoaderMode, LoaderProps, StickmanLayerProps } from './types';
export { LOADER_SEEN_KEY, loaderMode } from './loader/mode';
export { Loader } from './loader/Loader';
export { StickmanLayer } from './layer/StickmanLayer';
