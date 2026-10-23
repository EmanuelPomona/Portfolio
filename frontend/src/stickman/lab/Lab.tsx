// Owner: agent/stickman. Dev-only tuning lab (docs/API.md §2.7). Reproduces the approved spike's
// page so the port can be compared with docs/reference/stickman-cursor-spike.html side by side.
// The figure is the production cursor controller; the lab only adds tuning controls.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { SIT_AFTER_S } from '../engine/gestures';
import { PACES, type PaceName } from '../engine/motion';
import { createCursorController, type CursorController } from '../layer/controller';
import { registerCursorHandoff } from '../layer/cursorChannel';
import { TOUCH_SIZE, createTouchWalker } from '../layer/touchWalker';
import { Loader } from '../loader/Loader';
import '../layer/stickman.css';
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

/** How long the pretend hero image takes to decode when replaying the loader. */
type HeroDelay = 'instant' | 'slow' | 'never';
const HERO_DELAYS: readonly HeroDelay[] = ['instant', 'slow', 'never'];
const HERO_LABELS: Record<HeroDelay, string> = { instant: 'Hero ready', slow: 'Hero in 2s', never: 'Hero never' };
const heroReady = (d: HeroDelay): Promise<void> =>
  d === 'never' ? new Promise(() => {}) : new Promise((r) => setTimeout(r, d === 'slow' ? 2000 : 0));

interface Replay {
  key: number;
  ready: Promise<void>;
}
let replays = 0;
/** Called from a click: set what the index.html gate sets on a first visit, then mount a Loader. */
function startReplay(d: HeroDelay): Replay {
  document.documentElement.dataset.loader = 'show';
  replays += 1;
  return { key: replays, ready: heroReady(d) };
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
  const [replay, setReplay] = useState<Replay | null>(null);
  const [touch, setTouch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLOutputElement>(null);
  const cursorRef = useRef<CursorController | null>(null);
  const initial = useRef(settings);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mark = markRef.current;
    if (!canvas || !mark) return;
    if (touch) {
      // The lab overrides flags.touchStickman locally; production keeps it false (approved design §5.14).
      const walker = createTouchWalker(canvas, { size: TOUCH_SIZE });
      walker.start();
      return () => walker.stop();
    }
    const { size, pace } = initial.current;
    const cursor = createCursorController(canvas, mark, { size, pace: PACES[pace] });
    cursor.start();
    // Start where the spike starts him, so a side-by-side comparison begins identically.
    cursor.handoff({ x: innerWidth * 0.42, y: innerHeight * 0.7 });
    cursorRef.current = cursor;
    const release = registerCursorHandoff((at) => cursor.handoff(at)); // the loader hands him over

    // A tuning readout, a few times a second; never per frame and never through React state.
    const timer = setInterval(() => {
      const r = readoutRef.current;
      if (!r) return;
      const { speed, gestures: g } = cursor.inspect();
      r.textContent = `${Math.round(speed)} px/s | point ${g.point.toFixed(2)} | cheer ${g.cheer.toFixed(2)} | sit ${g.sit.toFixed(2)}`;
    }, 200);

    return () => {
      clearInterval(timer);
      release();
      cursor.stop();
      cursorRef.current = null;
    };
  }, [touch]);

  useEffect(() => {
    cursorRef.current?.configure({ size: settings.size, pace: PACES[settings.pace] });
  }, [settings.size, settings.pace]);

  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <>
    <div className={`lab${overPanel ? ' lab--over-panel' : ''}`}>
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
        Leave him alone for {SIT_AFTER_S}s and he sits. Tab through the links and he follows the focus.
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
        <Choice
          label="Touch walker"
          options={['off', 'on'] as const}
          value={touch ? 'on' : 'off'}
          name={(v) => (v === 'on' ? 'On' : 'Off')}
          onPick={(v) => setTouch(v === 'on')}
        />
        <div className="lab-row" role="group" aria-label="Replay the loader">
          <span>Loader</span>
          {HERO_DELAYS.map((d) => (
            <button key={d} type="button" onClick={() => setReplay(startReplay(d))}>
              {HERO_LABELS[d]}
            </button>
          ))}
        </div>
        {!touch && <output ref={readoutRef} className="lab-readout" aria-live="off" />}
      </div>

      {replay && <Loader key={replay.key} ready={replay.ready} onDone={() => setReplay(null)} />}

      <canvas ref={canvasRef} className="lab-canvas" aria-hidden="true" />
      <div ref={markRef} className={`lab-mark lab-mark--${settings.mark}`} aria-hidden="true" />
    </div>
    {/* Outside the fixed scene so the document grows and the window scrolls. */}
    {touch && <div className="lab-scroll" aria-hidden="true" />}
    </>
  );
}
