// Owner: agent/stickman. The stickman layer (docs/API.md §2.3): the desktop cursor on fine pointers,
// nothing otherwise. Media queries are re-evaluated live; a change switches modes without a reload.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { StickmanLayerProps } from '../types';
import { ACTIVATION_MEDIA, resolveActivation, type Activation } from './activation';
import { createCursorController } from './controller';
import { registerCursorHandoff } from './cursorChannel';
import { TOUCH_SIZE, createTouchWalker } from './touchWalker';
import './stickman.css';

/** The owner's verdict: "for computers in full screen 32 px is perfect". */
export const DESKTOP_SIZE = 32;

const QUERIES = Object.values(ACTIVATION_MEDIA);

/** No 2D canvas (very old engines, jsdom): keep the native cursor rather than hide it for nothing. */
const canDraw = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  typeof CanvasRenderingContext2D !== 'undefined';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const lists = QUERIES.map((q) => window.matchMedia(q));
  for (const l of lists) l.addEventListener?.('change', onChange);
  return () => {
    for (const l of lists) l.removeEventListener?.('change', onChange);
  };
}

function activation(touch: boolean): Activation {
  if (!canDraw()) return 'off';
  const m = (q: string) => window.matchMedia(q).matches;
  return resolveActivation({
    fine: m(ACTIVATION_MEDIA.fine),
    coarse: m(ACTIVATION_MEDIA.coarse),
    reducedMotion: m(ACTIVATION_MEDIA.reducedMotion),
    forcedColors: m(ACTIVATION_MEDIA.forcedColors),
    touch,
  });
}

export function StickmanLayer({ touch }: StickmanLayerProps) {
  const mode = useSyncExternalStore(
    subscribe,
    () => activation(touch),
    () => 'off' as const,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (mode === 'touch' && canvas) {
      const walker = createTouchWalker(canvas, { size: TOUCH_SIZE });
      walker.start();
      return () => walker.stop();
    }
    if (mode !== 'desktop') return;
    const ring = ringRef.current;
    if (!canvas || !ring) return;
    const cursor = createCursorController(canvas, ring, { size: DESKTOP_SIZE });
    cursor.start();
    const release = registerCursorHandoff((at) => cursor.handoff(at));
    return () => {
      release();
      cursor.stop(); // always restores the native cursor
    };
  }, [mode]);

  if (mode === 'off') return null;
  return (
    <>
      <canvas ref={canvasRef} className="stickman-canvas" aria-hidden="true" />
      {mode === 'desktop' && <div ref={ringRef} className="stickman-ring" aria-hidden="true" />}
    </>
  );
}
