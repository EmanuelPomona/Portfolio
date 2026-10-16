// Owner: agent/stickman. TASK-202/203. The loader reaches the live cursor through this channel.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handoffCursor, registerCursorHandoff } from './cursorChannel';

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
});

describe('cursorChannel', () => {
  it('delivers a handoff to the registered cursor and reports that it did', () => {
    const fn = vi.fn();
    cleanup = registerCursorHandoff(fn);
    expect(handoffCursor({ x: 10, y: 20 })).toBe(true);
    expect(fn).toHaveBeenCalledWith({ x: 10, y: 20 });
  });

  it('reports false when no cursor is live (touch, reduced motion, forced colors)', () => {
    expect(handoffCursor({ x: 1, y: 2 })).toBe(false);
  });

  it('unregistering stops delivery, and a stale unregister does not remove a newer cursor', () => {
    const first = vi.fn();
    const second = vi.fn();
    const offFirst = registerCursorHandoff(first);
    cleanup = registerCursorHandoff(second); // e.g. StrictMode remount
    offFirst();
    expect(handoffCursor({ x: 3, y: 4 })).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
