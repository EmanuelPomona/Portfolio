/**
 * STICKMAN CONTRACT. Owner: manager. Implementations: agent/stickman.
 * Behavior: docs/API.md §2. Change only through a CONTRACT CHANGE REQUEST.
 */
import type { JSX } from 'react';

/** Value of <html data-loader>, set by the gate script in index.html before first paint. */
export type LoaderMode = 'show' | 'fade' | 'skip';

export interface LoaderProps {
  /** Settles when the hero image has decoded. A rejection counts as ready. */
  readonly ready: Promise<unknown>;
  /** Called exactly once, after the loader has fully exited. */
  readonly onDone: () => void;
}

export interface StickmanLayerProps {
  /** Allows the touch walker on coarse pointers. Wire to flags.touchStickman. */
  readonly touch: boolean;
}

export type LoaderComponent = (props: LoaderProps) => JSX.Element | null;
export type StickmanLayerComponent = (props: StickmanLayerProps) => JSX.Element | null;
