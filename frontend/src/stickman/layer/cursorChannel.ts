// Owner: agent/stickman. Slice-internal: how the Loader hands the stickman to the live cursor.
// Loader and StickmanLayer are siblings in App (docs/API.md §2.5), so they meet here.
import type { Vec2 } from '../engine/vec';

type Handoff = (at: Vec2) => void;
let current: Handoff | null = null;

/** StickmanLayer registers its controller's handoff while the desktop cursor is live. */
export function registerCursorHandoff(fn: Handoff): () => void {
  current = fn;
  return () => {
    if (current === fn) current = null;
  };
}

/** Places the cursor stickman at `at`. Returns false when no desktop cursor is live. */
export function handoffCursor(at: Vec2): boolean {
  if (!current) return false;
  current(at);
  return true;
}
