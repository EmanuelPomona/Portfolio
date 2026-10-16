// Owner: agent/stickman. The first-visit loader (docs/API.md §2.2, owner wireframe 1).
//
// Timing runs on timers, never on requestAnimationFrame, so a background tab or a stalled renderer
// still finishes: minimum 1.2s, sprint 250ms after ready, hard cap 4.5s, skip on any pointerdown or
// keydown, exit 450ms (fade 300ms under reduced motion). The scribble and stickman are drawn by a
// separate rAF artist that the timeline never waits for.
import { useEffect, useRef, useState } from 'react';
import { handoffCursor } from '../layer/cursorChannel';
import type { LoaderProps } from '../types';
import { createLoaderArtist } from './artist';
import { LOADER_SEEN_KEY, loaderMode } from './mode';
import { EXIT_MS, FADE_MS, exitAt, fadeExitAt, progressAt } from './progress';
import './loader.css';

const SKIP_EVENTS = ['pointerdown', 'keydown'] as const;
const LISTEN = { capture: true, passive: true } as const;

/** No 2D canvas (very old engines, jsdom): the paper and progress still work, without the drawing. */
const canDraw = () => typeof CanvasRenderingContext2D !== 'undefined';

export function Loader({ ready, onDone }: LoaderProps) {
  const [mode] = useState(loaderMode);
  const [draw] = useState(() => mode === 'show' && canDraw());
  const [seed] = useState(() => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);

  const sheetRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scribbleRef = useRef<HTMLCanvasElement>(null);
  const figureRef = useRef<HTMLCanvasElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // We paint our own sheet now; the gate's boot cover has done its job.
    document.getElementById('boot-cover')?.remove();

    const t0 = Date.now();
    const elapsed = () => Date.now() - t0;
    let readyAt: number | null = null;
    let skippedAt: number | null = null;
    let exiting = false;
    let finished = false;
    let cancelled = false;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const sheet = sheetRef.current;
    const scribble = scribbleRef.current;
    const figure = figureRef.current;
    const stage = stageRef.current;
    const artist =
      draw && scribble && figure && stage
        ? createLoaderArtist({ scribble, figure, stage, seed, size: window.innerWidth < 600 ? 26 : 32 })
        : null;
    artist?.start();

    const meter = () => {
      const p = Math.round(progressAt(elapsed(), readyAt));
      sheet?.setAttribute('aria-valuenow', String(p));
      if (fillRef.current) fillRef.current.style.clipPath = `inset(0 ${100 - p}% 0 0 round 999px)`;
      if (valueRef.current) valueRef.current.textContent = `${p}%`;
    };
    meter();
    const ticker = setInterval(meter, 100);

    const onSkip = () => {
      if (exiting || skippedAt !== null) return;
      skippedAt = elapsed();
      arm();
    };
    const unlisten = () => {
      for (const type of SKIP_EVENTS) window.removeEventListener(type, onSkip, LISTEN);
    };

    const finish = () => {
      if (finished || cancelled) return;
      finished = true;
      clearInterval(ticker);
      artist?.stop();
      try {
        sessionStorage.setItem(LOADER_SEEN_KEY, '1');
      } catch {
        // Storage can be blocked (private mode); the loader simply shows again next visit.
      }
      document.getElementById('boot-cover')?.remove();
      // Release html[data-loader='show'] body { overflow: hidden } from the gate: the loader is over.
      document.documentElement.dataset.loader = 'skip';
      onDoneRef.current();
    };

    const beginExit = () => {
      if (exiting || cancelled) return;
      exiting = true;
      unlisten();
      if (artist) handoffCursor(artist.letGo()); // he lets go of the pencil and becomes the cursor
      sheet?.classList.add('is-leaving');
      finishTimer = setTimeout(finish, mode === 'fade' ? FADE_MS : EXIT_MS);
    };

    function arm() {
      if (exiting || cancelled) return;
      clearTimeout(exitTimer);
      const at = mode === 'fade' ? fadeExitAt({ readyAt, skippedAt }) : exitAt({ readyAt, skippedAt });
      exitTimer = setTimeout(beginExit, Math.max(0, at - elapsed()));
    }

    const settle = () => {
      if (cancelled || readyAt !== null) return;
      readyAt = elapsed();
      arm();
    };

    if (mode === 'skip') {
      // The page should not mount us in skip mode (docs/API.md §2.5); if it does, get out of the way.
      finishTimer = setTimeout(finish, 0);
    } else {
      for (const type of SKIP_EVENTS) window.addEventListener(type, onSkip, LISTEN);
      ready.then(settle, settle); // a rejection counts as ready
      arm();
    }

    return () => {
      cancelled = true;
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      clearInterval(ticker);
      unlisten();
      artist?.stop();
    };
  }, [ready, mode, draw, seed]);

  if (mode === 'skip') return null;
  return (
    <div
      ref={sheetRef}
      className="stickman-loader"
      data-mode={mode}
      data-stickman="ignore"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      {draw && (
        <>
          <div ref={stageRef} className="stickman-loader__stage" aria-hidden="true" />
          <canvas ref={scribbleRef} className="stickman-loader__scribble" aria-hidden="true" />
          <canvas ref={figureRef} className="stickman-loader__figure" aria-hidden="true" />
        </>
      )}
      {mode === 'show' && (
        <div className="stickman-loader__meter" aria-hidden="true">
          <span className="stickman-loader__pill">
            <span ref={fillRef} className="stickman-loader__fill" />
          </span>
          <span ref={valueRef} className="stickman-loader__value">
            0%
          </span>
        </div>
      )}
    </div>
  );
}
