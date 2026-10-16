// Owner: agent/stickman. The activation matrix of docs/API.md §2.3. Pure.

export type Activation = 'desktop' | 'touch' | 'off';

export interface ActivationQuery {
  /** (pointer: fine) */
  fine: boolean;
  /** (pointer: coarse) */
  coarse: boolean;
  /** (prefers-reduced-motion: reduce) */
  reducedMotion: boolean;
  /** (forced-colors: active) */
  forcedColors: boolean;
  /** StickmanLayerProps.touch, wired to flags.touchStickman */
  touch: boolean;
}

/** The media queries behind each field, re-evaluated live by StickmanLayer. */
export const ACTIVATION_MEDIA = {
  fine: '(pointer: fine)',
  coarse: '(pointer: coarse)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  forcedColors: '(forced-colors: active)',
} as const satisfies Record<Exclude<keyof ActivationQuery, 'touch'>, string>;

export function resolveActivation(q: ActivationQuery): Activation {
  if (q.fine && !q.reducedMotion && !q.forcedColors) return 'desktop';
  if (q.coarse && q.touch && !q.reducedMotion && !q.forcedColors) return 'touch';
  return 'off';
}
