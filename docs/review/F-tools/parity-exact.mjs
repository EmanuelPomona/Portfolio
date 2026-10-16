// Deterministic parity: virtual clock in both pages, identical input, canvas pixels compared.
import { launch, sleep } from './cdp.mjs';
const CLOCK = `(() => {
  let now = 0; let q = [];
  performance.now = () => now;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { now += 1000 / 60; const run = q; q = []; for (const cb of run) cb(now); } return now; };
})();`;
const DIGEST = (sel) => `(() => {
  const c = document.querySelector(${JSON.stringify(sel)});
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, h = 2166136261, ink = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4, a = d[i + 3];
    if (a) { ink++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      h = Math.imul(h ^ (x * 7 + y * 13 + a), 16777619) >>> 0; }
  }
  return { bbox: [minX, minY, maxX, maxY], ink, hash: h.toString(16) };
})()`;
const b = await launch({ port: 9338 });
let same = 0, diff = 0;
try {
  const mk = async (url) => { const p = await b.newPage(); await p.send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK }); await p.goto(url, 900); return p; };
  const spike = await mk(process.env.SPIKE_URL);
  const lab = await mk(process.env.LAB_URL);
  const pages = [spike, lab];
  const both = (fn) => Promise.all(pages.map(fn));
  const step = (n) => both((p) => p.eval(`__step(${n})`));
  const check = async (label) => {
    const [a, c] = await Promise.all([spike.eval(DIGEST('#stick')), lab.eval(DIGEST('.lab-canvas'))]);
    const ok = a.hash === c.hash && a.ink === c.ink;
    ok ? same++ : diff++;
    console.log(`${ok ? 'SAME' : 'DIFF'}  ${label.padEnd(34)} ref bbox=${a.bbox} ink=${a.ink} hash=${a.hash} | port bbox=${c.bbox} ink=${c.ink} hash=${c.hash}`);
  };
  const move = async (x, y) => { await both((p) => p.mouse('mouseMoved', x, y)); await sleep(30); };
  const click = async (x, y) => { await both((p) => p.mouse('mousePressed', x, y, { button: 'left', buttons: 1, clickCount: 1 })); await both((p) => p.mouse('mouseReleased', x, y, { button: 'left', clickCount: 1 })); await sleep(30); };

  await step(1); await check('first frame, standing at anchor');
  await move(300, 500);
  for (const n of [6, 12, 24]) { await step(n); await check(`walking toward 300,500 +${n}f`); }
  await step(60); await check('arrived at 300,500');
  await move(1100, 500);
  for (const n of [3, 6, 9, 15, 30]) { await step(n); await check(`800px jump +${n}f (run, lean)`); }
  await step(60);
  await move(1150, 500); await step(8); await check('50px move +8f (walk)'); await step(40);
  await move(669.4, 41); await step(90); await check('resting on Projects (point)');
  await click(669.4, 41); for (const n of [1, 5, 10, 20]) { await step(n); await check(`cheer +${n}f`); }
  await step(30);
  await move(1154, 652); await step(90); await check('resting on window (point)');
  await step(5 * 60); await check('idle 5s+ (sitting)');
  await step(60); await check('idle 6s+ (seated)');
  console.log(`\n${same} identical, ${diff} different checkpoints`);
  const errs = lab.console.filter((m) => /error|exception|warn/i.test(m));
  console.log('lab console errors/warnings:', JSON.stringify(errs));
} finally { await b.close(); }
