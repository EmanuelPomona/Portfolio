// Owner: agent/frontend. Test-only: a requestAnimationFrame the test flushes by hand.
// Imported by *.test.ts(x) only; never by application code.
import { act } from '@testing-library/react';
import { vi } from 'vitest';

export function installFrames() {
  let queue: FrameRequestCallback[] = [];
  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    queue.push(cb);
    return queue.length;
  });
  const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  return {
    pending: () => queue.length,
    flush() {
      const run = queue;
      queue = [];
      act(() => {
        for (const cb of run) cb(0);
      });
    },
    restore() {
      raf.mockRestore();
      caf.mockRestore();
    },
  };
}
