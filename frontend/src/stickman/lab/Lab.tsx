// Owner: agent/stickman. Dev-only tuning lab (docs/API.md §2.7). Reproduces the approved spike's
// page so the port can be compared with docs/reference/stickman-cursor-spike.html side by side.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { stepGestures, type GestureState } from '../engine/gestures';
import { MAX_DT, MOVING_SPEED, PACES, stepMotion, type MotionState, type PaceName } from '../engine/motion';
import { REST_POINT_ANGLE, computePose, lineWidthFor, pointAngleTo } from '../engine/pose';
import type { Vec2 } from '../engine/vec';
import { drawFigure } from '../render/drawFigure';
import './lab.css';

type Size = 28 | 32 | 36;
type Mark = 'ring' | 'dot';
interface Settings {
  size: Size;
  pace: PaceName;
  mark: Mark;
}

const SIZES: readonly Size[] = [28, 32, 36];
const PACE_LABELS: Record<PaceName, string> = { stroll: 'Stroll', walk: 'Walk', hurry: 'Hurries when far' };
const MARK_LABELS: Record<Mark, string> = { ring: 'Ring', dot: 'Tiny dot' };

const TARGETS = 'a[href], button:not([disabled]), [data-stickman="target"]';

/**
 * The lab's own frame loop, a straight port of the spike's. TASK-202 replaces it with
 * createCursorController from ../layer/controller.
 */
function startLabFigure(canvas: HTMLCanvasElement, mark: HTMLElement, read: () => Settings) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
  };
  resize();

  const target: Vec2 = { x: innerWidth * 0.42, y: innerHeight * 0.7 };
  let s: MotionState = { pos: { ...target }, speed: 0, facing: 1, phase: 0, idle: 0 };
  let g: GestureState = { cheer: 0, point: 0, sit: 0 };
  let hover: Element | null = null;
  let hoverCenter: Vec2 | null = null;
  let pressed = false;

  const resolve = (el: EventTarget | null) => {
    const hit = el instanceof Element ? el.closest(TARGETS) : null;
    hover = hit && !hit.closest('[data-stickman="ignore"]') ? hit : null;
    if (hover) {
      const r = hover.getBoundingClientRect();
      hoverCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } else hoverCenter = null;
  };
  const onMove = (e: PointerEvent) => {
    target.x = e.clientX;
    target.y = e.clientY;
    mark.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    resolve(e.target);
  };
  const onDown = (e: PointerEvent) => {
    resolve(e.target);
    if (hover) pressed = true;
  };
  addEventListener('resize', resize);
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onDown, { passive: true });

  let raf = 0;
  let last = performance.now();
  let clock = 0;
  const frame = (now: number) => {
    const { size, pace } = read();
    const dt = Math.min(MAX_DT, (now - last) / 1000);
    last = now;
    clock += dt;

    if (pressed) s = { ...s, idle: 0 };
    // The spike judges "arrived" on the distance before this frame's step.
    const dist = Math.hypot(target.x - s.pos.x, target.y - s.pos.y);
    s = stepMotion(s, target, dt, size, PACES[pace]);
    g = stepGestures(
      g,
      s,
      { moving: s.speed > MOVING_SPEED, arrived: dist < 1.5 * size, onTarget: hover !== null, pressed },
      dt,
    );
    pressed = false;

    const angle = hoverCenter ? pointAngleTo(s, g, size, hoverCenter) : REST_POINT_ANGLE;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    drawFigure(ctx, computePose(s, g, angle, clock), s.pos, {
      size,
      facing: s.facing,
      lineWidth: lineWidthFor(size),
      color: '#fff',
    });
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerdown', onDown);
  };
}

function Choice<T extends string | number>(props: {
  label: string;
  options: readonly T[];
  value: T;
  name: (v: T) => string;
  onPick: (v: T) => void;
}) {
  return (
    <div className="lab-row" role="group" aria-label={props.label}>
      <span>{props.label}</span>
      {props.options.map((o) => (
        <button key={o} type="button" aria-pressed={o === props.value} onClick={() => props.onPick(o)}>
          {props.name(o)}
        </button>
      ))}
    </div>
  );
}

const noJump = (e: MouseEvent) => e.preventDefault();

export function Lab() {
  const [settings, setSettings] = useState<Settings>({ size: 32, pace: 'hurry', mark: 'ring' });
  const [overPanel, setOverPanel] = useState(false);
  const settingsRef = useRef(settings);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mark = markRef.current;
    if (!canvas || !mark) return;
    return startLabFigure(canvas, mark, () => settingsRef.current);
  }, []);

  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className={`lab lab--own-cursor${overPanel ? ' lab--over-panel' : ''}`}>
      <nav className="lab-nav" aria-label="Sample targets">
        {['Home', 'Projects', 'About', 'Contact'].map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} onClick={noJump}>
            {l}
          </a>
        ))}
      </nav>

      <div className="lab-name">
        <h1>Emanuel Ling</h1>
        <p>CS + Math @ Pomona College</p>
        <div className="lab-links">
          <a href="#linkedin" onClick={noJump}>LinkedIn</a>
          <a href="#email" onClick={noJump}>Email</a>
          <a href="#github" onClick={noJump}>GitHub</a>
        </div>
      </div>

      <div className="lab-work">
        <h2>SagePlan</h2>
        <a className="lab-window" href="#sageplan" onClick={noJump} aria-label="SagePlan, sample window">
          <span className="lab-chrome" aria-hidden="true">
            <i className="lab-light lab-light--r" />
            <i className="lab-light lab-light--y" />
            <i className="lab-light lab-light--g" />
            <span className="lab-url">sageplan.vercel.app</span>
          </span>
          <span className="lab-screen">screenshot soon</span>
        </a>
      </div>

      <aside className="lab-note" data-stickman="ignore">
        <b>Stickman lab.</b> Dev only, never in the production build. Compare with
        docs/reference/stickman-cursor-spike.html at 32px, Hurries when far, Ring.
        <br />
        Move the mouse and he walks to the ring. Rest on a link and he points. Click one and he cheers.
        Leave him alone for 5s and he sits.
      </aside>

      <div
        className="lab-panel"
        data-stickman="ignore"
        onPointerEnter={() => setOverPanel(true)}
        onPointerLeave={() => setOverPanel(false)}
      >
        <Choice label="Size" options={SIZES} value={settings.size} name={(v) => `${v}px`} onPick={set('size')} />
        <Choice
          label="Pace"
          options={Object.keys(PACES) as PaceName[]}
          value={settings.pace}
          name={(v) => PACE_LABELS[v]}
          onPick={set('pace')}
        />
        <Choice
          label="Click point"
          options={['ring', 'dot'] as const}
          value={settings.mark}
          name={(v) => MARK_LABELS[v]}
          onPick={set('mark')}
        />
      </div>

      <canvas ref={canvasRef} className="lab-canvas" aria-hidden="true" />
      <div ref={markRef} className={`lab-mark lab-mark--${settings.mark}`} aria-hidden="true" />
    </div>
  );
}
