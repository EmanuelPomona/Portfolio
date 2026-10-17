// Owner: agent/stickman. TASK-203. The loader's canvases, with recording contexts and a manual rAF.
import { afterEach, describe, expect, it } from 'vitest';
import { PENCIL_TIP } from '../engine/pose';
import { recordingContext } from '../testing/recordingContext';
import { GRAPHITE_PASSES, createLoaderArtist, graphitePassAlpha, type LoaderArtist } from './artist';

describe('graphitePassAlpha', () => {
  it('splits a target opacity into k passes that compound back to it', () => {
    // p = 1 − (1 − a)^(1/k): a = 0.85, k = 3 -> 1 − 0.15^(1/3) = 0.46867…
    const p = graphitePassAlpha(0.85, 3);
    expect(p).toBeCloseTo(0.468666, 5);
    expect(1 - (1 - p) ** 3).toBeCloseTo(0.85, 9);
    expect(graphitePassAlpha(0.6, 1)).toBeCloseTo(0.6, 9);
  });
});

let artist: LoaderArtist | null = null;
afterEach(() => {
  artist?.stop();
  artist = null;
});

function harness() {
  const scribbleRec = recordingContext();
  const figureRec = recordingContext();
  const scribble = document.createElement('canvas');
  const figure = document.createElement('canvas');
  scribble.getContext = (() => scribbleRec.ctx) as unknown as typeof scribble.getContext;
  figure.getContext = (() => figureRec.ctx) as unknown as typeof figure.getContext;
  const stage = document.createElement('div');
  stage.getBoundingClientRect = () =>
    ({ left: 100, top: 100, width: 300, height: 150, right: 400, bottom: 250, x: 100, y: 100, toJSON: () => ({}) }) as DOMRect;
  let now = 0;
  let queue: FrameRequestCallback[] = [];
  artist = createLoaderArtist({
    scribble,
    figure,
    stage,
    seed: 7,
    size: 32,
    env: { now: () => now, raf: (cb) => queue.push(cb), cancelRaf: () => (queue = []) },
  });
  const frames = (n: number) => {
    for (let i = 0; i < n; i++) {
      now += 1000 / 60;
      const run = queue;
      queue = [];
      run.forEach((cb) => cb(now));
    }
  };
  const count = (calls: typeof scribbleRec.calls, name: string) => calls.filter(([n]) => n === name).length;
  return { a: artist, scribbleRec, figureRec, frames, count, pending: () => queue.length };
}

describe('createLoaderArtist', () => {
  it('never clears the scribble canvas and adds only the new stretch of line each frame', () => {
    const { a, scribbleRec, figureRec, frames, count } = harness();
    a.start();
    frames(1); // the first frame only sets the clock
    scribbleRec.clear();
    figureRec.clear();
    frames(3);
    expect(count(scribbleRec.calls, 'clearRect')).toBe(0);
    expect(count(scribbleRec.calls, 'stroke')).toBe(3 * GRAPHITE_PASSES);
    // the figure canvas is redrawn from scratch every frame
    expect(count(figureRec.calls, 'clearRect')).toBe(3);
  });

  it('draws the line in the stage box', () => {
    const { a, scribbleRec, frames } = harness();
    a.start();
    frames(30);
    const pts = scribbleRec.calls.filter(([n]) => n === 'lineTo').map(([, x, y]) => [x as number, y as number]);
    expect(pts.length).toBeGreaterThan(0);
    for (const [x, y] of pts) {
      expect(x).toBeGreaterThanOrEqual(100 - 1);
      expect(x).toBeLessThanOrEqual(400 + 1);
      expect(y).toBeGreaterThanOrEqual(100 - 1);
      expect(y).toBeLessThanOrEqual(250 + 1);
    }
  });

  it('letGo returns where his feet are and he stops drawing', () => {
    const { a, scribbleRec, frames, count } = harness();
    a.start();
    frames(20);
    const feet = a.letGo();
    expect(Number.isFinite(feet.x) && Number.isFinite(feet.y)).toBe(true);
    expect(feet.y).toBeGreaterThanOrEqual(100 - 1); // his feet are on the line, inside the stage
    expect(feet.y).toBeLessThanOrEqual(250 + 1);
    scribbleRec.clear();
    frames(10);
    expect(count(scribbleRec.calls, 'stroke')).toBe(0);
    // letting go twice returns the same place
    expect(a.letGo()).toEqual(feet);
  });

  it('the pencil tip touches the end of the line, every frame', () => {
    const { a, scribbleRec, figureRec, frames } = harness();
    a.start();
    frames(1);
    for (let i = 0; i < 40; i++) {
      scribbleRec.clear();
      figureRec.clear();
      frames(1);
      // end of this frame's stretch of line (first graphite pass has no offset)
      const strokes = scribbleRec.calls;
      const firstStroke = strokes.findIndex(([n]) => n === 'stroke');
      const pass0 = strokes.slice(0, firstStroke).filter(([n]) => n === 'lineTo');
      const [, lx, ly] = pass0.at(-1)!;
      // the pencil outline starts with moveTo(PENCIL_TIP), in rig units under
      // translate(feet) scale(k·mirror, k)
      const calls = figureRec.calls;
      const translate = calls.find(([n]) => n === 'translate')!;
      const scale = calls.find(([n]) => n === 'scale')!;
      const pencilTip = calls.find(([n, x, y]) => n === 'moveTo' && x === PENCIL_TIP.x && y === PENCIL_TIP.y)!;
      expect(pencilTip).toBeDefined();
      const sx = (translate[1] as number) + (pencilTip[1] as number) * (scale[1] as number);
      const sy = (translate[2] as number) + (pencilTip[2] as number) * (scale[2] as number);
      expect(sx).toBeCloseTo(lx as number, 6);
      expect(sy).toBeCloseTo(ly as number, 6);
    }
  });

  it('the scribble keeps adding path between 1.2s and 2.2s', () => {
    // the longer minimum must read as more drawing, not a stall
    const { a, scribbleRec, frames } = harness();
    a.start();
    frames(72); // 1.2s
    scribbleRec.clear();
    frames(60); // to 2.2s
    const pts = scribbleRec.calls
      .filter(([n]) => n === 'lineTo')
      .map(([, x, y]) => ({ x: x as number, y: y as number }));
    let length = 0;
    for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    // three graphite passes trace the same path, so a third of the total is the new line: > 150px per second
    expect(length / 3).toBeGreaterThan(150);
  });

  it('stop() cancels its frame', () => {
    const { a, frames, pending } = harness();
    a.start();
    frames(2);
    expect(pending()).toBe(1);
    a.stop();
    expect(pending()).toBe(0);
  });
});
