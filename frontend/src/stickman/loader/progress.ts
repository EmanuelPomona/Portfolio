// Owner: agent/stickman. Loader progress and timing (docs/API.md §2.2). Pure; times in ms from mount.

/** Minimum visible time in show mode (L-07). */
export const MIN_MS = 1200;
/** Hard cap: exit starts here even if the hero never decodes (L-02). */
export const CAP_MS = 4500;
/** After ready, progress sprints from its current value to 100 over this long. */
export const SPRINT_MS = 250;
/** Show-mode exit: pencil drops, paper clears. ≤ 600 (L-03) and CAP_MS + EXIT_MS ≤ 5000 (contract). */
export const EXIT_MS = 450;
/** Fade-mode exit under reduced motion (L-05). */
export const FADE_MS = 300;

const HOLD = 90;

export interface ExitInputs {
  /** ms from mount at which `ready` settled, or null while it has not. */
  readyAt: number | null;
  /** ms from mount of the first pointerdown or keydown, or null. */
  skippedAt: number | null;
}

/** Ease-out rise to 90 at MIN_MS, then hold. */
function rise(t: number): number {
  const u = Math.min(1, Math.max(0, t / MIN_MS));
  return HOLD * (1 - (1 - u) ** 3);
}

/** Progress (0 to 100) at `t` ms from mount. */
export function progressAt(t: number, readyAt: number | null): number {
  if (readyAt === null || t < readyAt) return rise(t);
  const base = rise(readyAt);
  return base + (100 - base) * Math.min(1, (t - readyAt) / SPRINT_MS);
}

/** When the show-mode exit starts, in ms from mount. */
export function exitAt({ readyAt, skippedAt }: ExitInputs): number {
  if (skippedAt !== null) return skippedAt;
  if (readyAt === null) return CAP_MS;
  return Math.min(CAP_MS, Math.max(MIN_MS, readyAt + SPRINT_MS));
}

/** When the fade-mode exit starts: as soon as ready settles, capped. */
export function fadeExitAt({ readyAt, skippedAt }: ExitInputs): number {
  if (skippedAt !== null) return skippedAt;
  return Math.min(CAP_MS, readyAt ?? CAP_MS);
}
