// Owner: agent/stickman. Test utility: a CanvasRenderingContext2D stand-in that records every call
// and property write. jsdom has no canvas implementation. Imported by tests only.

export type Call = [string, ...unknown[]];

export interface Recording {
  ctx: CanvasRenderingContext2D;
  calls: Call[];
  /** save() depth: 0 when every save has a matching restore. */
  depth: () => number;
  clear: () => void;
}

export function recordingContext(): Recording {
  const calls: Call[] = [];
  const state: Record<string, unknown> = {};
  let depth = 0;
  const ctx = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop in state) return state[prop];
        return (...args: unknown[]) => {
          if (prop === 'save') depth++;
          if (prop === 'restore') depth--;
          calls.push([prop, ...args]);
        };
      },
      set(_t, prop: string, value) {
        state[prop] = value;
        calls.push([`set:${prop}`, value]);
        return true;
      },
    },
  ) as CanvasRenderingContext2D;
  return { ctx, calls, depth: () => depth, clear: () => (calls.length = 0) };
}

/** Vertices passed to moveTo/lineTo, in order. */
export const vertices = (calls: Call[]) =>
  calls.filter(([n]) => n === 'moveTo' || n === 'lineTo').map(([, x, y]) => [x, y]);
