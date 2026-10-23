// Owner: agent/stickman. TASK-207 evidence (ACCEPTANCE S-04): on the real page at 1440, how long
// after the last pointer move he starts to sit and is seated, resting on a hero link and on the fog,
// and how fast any movement stands him back up. Since the ruling (A + B) the sit clock is the
// pointer's stillness and the ease is 6/s: sitting should start 2.0s after the last move (plus up
// to two frames: the next frame, and idle > 2.0 being strict) and reach 0.95 467ms later.
//
// sit is read exactly from what is drawn. drawFigure strokes leg, leg, then the torso, which starts
// at the hip; with the figure still (walk = 0, so no bob and no hop) the hip is at
// y = -16 + 8·sit rig units (engine/pose.ts). The page's own canvas calls are observed, nothing in
// the app is changed. Each draw records t, performance.now() at draw time, and ft, its frame's rAF
// begin time (the controller's clock); precision is one frame (~17ms).
//
// Usage (npm run dev running): node docs/review/F-tools/sit-timing.mjs <outDir> [baseUrl]
import { writeFileSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';

const OUT = process.argv[2] ?? 'docs/review';
const BASE = process.argv[3] ?? `http://localhost:${process.env.FRONTEND_PORT ?? 3009}/`;
const HIP_Y = -16;
const SIT_DROP = 8;

const SAMPLER = `(() => {
  const P = CanvasRenderingContext2D.prototype;
  const translate = P.translate, moveTo = P.moveTo, scale = P.scale;
  const draws = []; let cur = null;
  window.__draws = draws;
  window.__lastMove = null;
  window.__lastMoveStamp = null;
  window.__frameTs = null;
  addEventListener('pointermove', (e) => { window.__lastMove = performance.now(); window.__lastMoveStamp = e.timeStamp; }, { capture: true, passive: true });
  // the frame's begin time, which the controller's clock uses (rAF timestamp)
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => { window.__frameTs = ts; cb(ts); });
  const ours = (ctx) => ctx.canvas && ctx.canvas.classList && ctx.canvas.classList.contains('stickman-canvas');
  P.translate = function (x, y) {
    if (ours(this)) { cur = { t: performance.now(), ft: window.__frameTs, x, y, n: 0, hip: null }; draws.push(cur); if (draws.length > 3000) draws.shift(); }
    return translate.call(this, x, y);
  };
  P.scale = function (x, y) {
    if (cur && ours(this) && cur.k === undefined) cur.k = y;
    return scale.call(this, x, y);
  };
  P.moveTo = function (x, y) {
    if (cur && ours(this) && ++cur.n === 3) cur.hip = { x, y };
    return moveTo.call(this, x, y);
  };
})();`;

const lines = [];
const log = (k, v = '') => {
  const l = v === '' ? k : `${k.padEnd(64)} ${typeof v === 'string' ? v : JSON.stringify(v)}`;
  lines.push(l);
  console.log(l);
};
const ms = (x) => (x == null ? 'never' : `${x.toFixed(1)} ms`);
const sitOf = (d) => (d.hip.y - HIP_Y) / SIT_DROP;

/** Moves the pointer like a hand, then reads the frames drawn for `wait` ms after the last move. */
async function rest(p, from, to, wait) {
  await p.moveTo(from, to, 240);
  const lastMove = await p.eval('window.__lastMove');
  const stamp = await p.eval('window.__lastMoveStamp');
  await sleep(wait);
  const draws = await p.eval(`window.__draws.filter((d) => d.t >= ${lastMove - 50})`);
  return { lastMove, stamp, draws };
}

function analyse({ lastMove, stamp, draws }) {
  const valid = draws.filter((d) => d.hip && d.hip.x === 0);
  const after = valid.filter((d) => d.t >= lastMove);
  const frameMs = after.length > 1 ? (after.at(-1).t - after[0].t) / (after.length - 1) : NaN;
  // his feet stop on the last frame the drawn position changes (he closes the final gap exactly)
  let feet = 0;
  for (let i = 1; i < after.length; i++) if (Math.hypot(after[i].x - after[i - 1].x, after[i].y - after[i - 1].y) > 1e-6) feet = i;
  const feetStop = after[feet].t;
  // sitting starts on the first still frame where sit is above 0 and rising (while he settles, the
  // walk bob reads as a small negative sit; a residual sit from before only falls)
  const still = after.slice(feet + 1);
  let start = null;
  for (let i = 1; i < still.length; i++) if (sitOf(still[i]) > 1e-3 && sitOf(still[i]) > sitOf(still[i - 1])) { start = still[i]; break; }
  const seated = start && still.find((d) => d.t >= start.t && sitOf(d) >= 0.95);
  const beforeStart = start ? still.filter((d) => d.t < start.t) : still;
  const sitAt = (t) => { const d = after.filter((x) => x.t <= t).at(-1); return d ? sitOf(d) : NaN; };
  return {
    frames: after.length,
    invalid: draws.length - valid.length,
    frameMs,
    feetAfterMove: feetStop - lastMove,
    startAfterMove: start && start.t - lastMove,
    startAfterStamp: start && start.t - stamp,
    // in the engine's own clock: from the begin time of the frame that first saw the move
    startFrames: start && after.length && start.ft - after[0].ft,
    dispatchAfterFrame: after.length ? lastMove - after[0].ft : NaN,
    startAfterFeet: start && start.t - feetStop,
    seatedAfterMove: seated && seated.t - lastMove,
    seatedAfterFeet: seated && seated.t - feetStop,
    easeIn: start && seated && seated.t - start.t,
    sitAtStart: start && sitOf(start),
    sitAt25Move: sitAt(lastMove + 2500),
    sitAt25Feet: sitAt(feetStop + 2500),
    maxSitBefore: beforeStart.reduce((m, d) => Math.max(m, sitOf(d)), 0),
    lastSit: after.length ? sitOf(after.at(-1)) : NaN,
  };
}

function report(label, a) {
  log(`${label}: frames analysed / dropped (hip.x != 0) / mean frame`, `${a.frames} / ${a.invalid} / ${a.frameMs.toFixed(2)} ms`);
  log(`${label}: last move -> his feet stop on the pointer`, ms(a.feetAfterMove));
  log(`${label}: last move -> sitting starts (S-04: not before 2.0s; engine 2.0s + up to 2 frames)`, ms(a.startAfterMove));
  log(`${label}: last move -> seated (sit >= 0.95; S-04: by about 2.5s)`, ms(a.seatedAfterMove));
  log(`${label}: event timestamp (e.timeStamp) -> sitting starts`, ms(a.startAfterStamp));
  log(`${label}: frame that saw the move -> sitting frame, in rAF begin times (engine clock; > 2000)`, ms(a.startFrames));
  log(`${label}: the move's handler ran after that frame began by`, ms(a.dispatchAfterFrame));
  log(`${label}: feet stop -> sitting starts`, ms(a.startAfterFeet));
  log(`${label}: feet stop -> seated (sit >= 0.95)`, ms(a.seatedAfterFeet));
  log(`${label}: sitting starts -> seated (ease 6/s: 28 frame intervals = 467 ms)`, ms(a.easeIn));
  log(`${label}: sit 2.5s after the last move / 2.5s after the feet stop`, `${a.sitAt25Move.toFixed(3)} / ${a.sitAt25Feet.toFixed(3)}`);
  log(`${label}: sit on the first sitting frame (6/60 = 0.1000) / highest sit before it`, `${a.sitAtStart?.toFixed(4)} / ${a.maxSitBefore.toFixed(4)}`);
  log(`${label}: sit on the last frame`, a.lastSit.toFixed(4));
}

async function clip(p, at, name) {
  const { data } = await p.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: Math.max(0, at.x - 120), y: Math.max(0, at.y - 90), width: 240, height: 130, scale: 1 },
  });
  writeFileSync(`${OUT}/${name}`, Buffer.from(data, 'base64'));
}

const b = await launch({ port: 9347 });
try {
  const p = await b.newPage({ w: 1440, h: 900, dpr: 1 });
  await p.send('Page.addScriptToEvaluateOnNewDocument', { source: SAMPLER });
  await p.send('Page.navigate', { url: BASE });
  // first visit of the session: wait for the loader to hand him over and release the page
  for (let t = 0; t < 10000 && (await p.eval(`document.documentElement.dataset.loader !== 'skip' || !!document.querySelector('.stickman-loader')`).catch(() => true)); t += 50) await sleep(50);
  await sleep(600);
  log(`TASK-207 sit timing, ${BASE}, 1440x900 @1x, headless Chrome, ${new Date().toISOString()}`);

  const pick = await p.eval(`(() => {
    const vis = (r) => r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
    const links = [...document.querySelectorAll('a[href]')].filter((a) => vis(a.getBoundingClientRect()));
    const centre = (a) => { const r = a.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), text: a.textContent.trim(), href: a.getAttribute('href') }; };
    // a link with room above it for his full height; the top nav is recorded separately
    const link = links.find((a) => a.getBoundingClientRect().top > 150) ?? links[0];
    const interactive = (x, y) => !!document.elementFromPoint(x, y)?.closest('a, button, input, [tabindex], [role="button"]');
    let fog = null;
    for (const [x, y] of [[1180, 720], [1240, 640], [260, 720], [1120, 520], [320, 560]]) if (!interactive(x, y)) { fog = { x, y, under: document.elementFromPoint(x, y)?.className || document.elementFromPoint(x, y)?.tagName }; break; }
    return { link: centre(link), nav: centre(links[0]), fog };
  })()`);
  log('resting target, link', pick.link);
  log('top nav link (still only)', pick.nav);
  log('resting target, fog (no link, button or tabindex under it)', pick.fog);

  const stage = { x: 720, y: 600 };
  await p.moveTo({ x: 700, y: 620 }, stage, 160);
  await sleep(1200); // idle < 2s: standing, so each case starts from standing
  log('html.stickman-cursor (the layer took over the cursor)', await p.eval(`document.documentElement.classList.contains('stickman-cursor')`));

  // 1. resting on a link
  const linkRun = await rest(p, stage, pick.link, 4200);
  log('');
  report('link', analyse(linkRun));
  // any movement stands him back up
  const seatedHip = await p.eval('window.__draws.at(-1)');
  const nudgeFrom = { x: pick.link.x, y: pick.link.y };
  const nudgeAt = await p.eval('performance.now()');
  await p.moveTo(nudgeFrom, { x: nudgeFrom.x + 40, y: nudgeFrom.y + 30 }, 100);
  await sleep(1600);
  const up = (await p.eval(`window.__draws.filter((d) => d.t >= ${nudgeAt})`)).filter((d) => d.hip && d.hip.x === 0);
  const firstMoved = up.find((d) => d.x !== seatedHip.x || d.y !== seatedHip.y);
  // the pose draws sit × (1 − walk) (pose.ts), so walking hides the sit at once; the sit value
  // itself eases back at 6/s and shows again, smaller, once he stops after the nudge
  const stood = up.find((d) => d.t >= (firstMoved?.t ?? Infinity) && sitOf(d) < 0.05);
  let upFeet = 0;
  for (let i = 1; i < up.length; i++) if (Math.hypot(up[i].x - up[i - 1].x, up[i].y - up[i - 1].y) > 1e-6) upFeet = i;
  const settled = up.slice(upFeet + 1);
  const dip = settled.reduce((m, d) => Math.max(m, sitOf(d)), 0);
  const k = seatedHip.k ?? NaN;
  const clear = settled.find((d) => sitOf(d) < 0.01);
  log('link: seated, then a 50px nudge: first frame he moves, after the nudge starts', ms(firstMoved && firstMoved.t - nudgeAt));
  log('link: drawn hip back at standing height (< 0.05), after the nudge starts', ms(stood && stood.t - nudgeAt));
  log('link: after he stops from the nudge (feet stop)', ms(up[upFeet].t - nudgeAt));
  log('link: then the highest drawn sit / hip drop in px', `${dip.toFixed(3)} / ${(dip * SIT_DROP * k).toFixed(2)} px (k = ${k.toFixed(3)} px per rig unit)`);
  log('link: drawn sit below 0.01 again, after the nudge starts', ms(clear && clear.t - nudgeAt));

  // 2. resting on the fog
  await p.moveTo({ x: nudgeFrom.x + 40, y: nudgeFrom.y + 30 }, stage, 200);
  await sleep(1200);
  const fogRun = await rest(p, stage, pick.fog, 4200);
  log('');
  report('fog', analyse(fogRun));

  // 3. stills, in a separate pass so screenshots never stall the measured frames
  for (const [name, at] of [['link', pick.link], ['fog', pick.fog]]) {
    await p.moveTo(at, stage, 200);
    await sleep(1200);
    await p.moveTo(stage, at, 240);
    await sleep(1500);
    await clip(p, at, `F-207-${name}-1500ms-standing.png`);
    await sleep(2500);
    await clip(p, at, `F-207-${name}-4000ms-seated.png`);
  }
  // the top nav: his feet are on a link 28px from the top edge
  await p.moveTo(pick.fog, stage, 200);
  await sleep(1200);
  await p.moveTo(stage, pick.nav, 240);
  await sleep(1500);
  await clip(p, { x: pick.nav.x, y: 90 }, 'F-207-nav-top-edge-1500ms-DEFECT.png');
  await sleep(2500);
  await clip(p, { x: pick.nav.x, y: 90 }, 'F-207-nav-top-edge-4000ms-seated.png');
  log('');
  log('stills', 'F-207-{link,fog}-1500ms-standing.png, F-207-{link,fog}-4000ms-seated.png, F-207-nav-top-edge-{1500ms-DEFECT,4000ms-seated}.png (ms after the last move)');
  log('console errors/warnings', p.console.filter((m) => /error|warn|exception/i.test(m)));
} finally {
  await b.close();
}
writeFileSync(`${OUT}/F-207-sit-timing.txt`, lines.join('\n') + '\n');
