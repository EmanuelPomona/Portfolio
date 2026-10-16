// Minimal Chrome DevTools Protocol driver: launches headless system Chrome, opens pages,
// sends real input, screencasts, and records/encodes. Node 22+ (global WebSocket, fetch).
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333, width = 1440, height = 900, profileDir } = {}) {
  const dir = profileDir ?? mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chrome-'));
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    `--window-size=${width},${height}`, '--hide-scrollbars', '--mute-audio', '--no-first-run',
    '--no-default-browser-check', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank',
  ], { stdio: 'ignore' });
  let info;
  for (let i = 0; i < 50; i++) {
    try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(100); }
  }
  if (!info) throw new Error('chrome did not start');
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? reject(new Error(`${msg.error.message} ${msg.error.data ?? ''}`)) : resolve(msg.result);
    } else for (const l of listeners) l(msg);
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const browser = {
    send, on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    async newPage({ url = 'about:blank', w = width, h = height, dpr = 1, mobile = false, touch = false } = {}) {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank', newWindow: true });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const s = (m, p) => send(m, p, sessionId);
      await s('Page.enable'); await s('Runtime.enable'); await s('Log.enable');
      await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
      if (touch) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      const console = [];
      browser.on((msg) => {
        if (msg.sessionId !== sessionId) return;
        if (msg.method === 'Runtime.consoleAPICalled') console.push(`[${msg.params.type}] ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
        if (msg.method === 'Runtime.exceptionThrown') console.push(`[exception] ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
        if (msg.method === 'Log.entryAdded') console.push(`[${msg.params.entry.level}] ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
      });
      const page = {
        sessionId, targetId, send: s, console,
        async goto(u, waitMs = 600) {
          const loaded = new Promise((r) => { const off = browser.on((m) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') { off(); r(); } }); });
          await s('Page.navigate', { url: u }); await loaded; await sleep(waitMs);
        },
        async eval(expr) {
          const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
          if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
          return r.result.value;
        },
        mouse: (type, x, y, extra = {}) => s('Input.dispatchMouseEvent', { type, x, y, button: extra.button ?? 'none', buttons: extra.buttons ?? 0, clickCount: extra.clickCount ?? 0, pointerType: 'mouse' }),
        async moveTo(from, to, ms, steps = Math.max(2, Math.round(ms / 16))) {
          for (let i = 1; i <= steps; i++) { const t = i / steps; await page.mouse('mouseMoved', from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t); await sleep(ms / steps); }
        },
        async click(x, y) {
          await page.mouse('mousePressed', x, y, { button: 'left', buttons: 1, clickCount: 1 });
          await sleep(60);
          await page.mouse('mouseReleased', x, y, { button: 'left', buttons: 0, clickCount: 1 });
        },
        key: async (key, code = key, keyCode = 0) => { await s('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode }); await s('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode }); },
        async shot() { const { data } = await s('Page.captureScreenshot', { format: 'png' }); return Buffer.from(data, 'base64'); },
        async startCast({ quality = 60, maxWidth, maxHeight, everyNthFrame = 1 } = {}) {
          const frames = [];
          const off = browser.on(async (m) => {
            if (m.sessionId === sessionId && m.method === 'Page.screencastFrame') {
              frames.push({ t: m.params.metadata.timestamp, data: m.params.data });
              s('Page.screencastFrameAck', { sessionId: m.params.sessionId }).catch(() => {});
            }
          });
          await s('Page.startScreencast', { format: 'jpeg', quality, everyNthFrame, ...(maxWidth ? { maxWidth, maxHeight } : {}) });
          return async () => { await s('Page.stopScreencast'); off(); return frames; };
        },
      };
      if (url !== 'about:blank') await page.goto(url);
      return page;
    },
    async close() { try { await send('Browser.close'); } catch {} proc.kill(); await sleep(300); if (!profileDir) rmSync(dir, { recursive: true, force: true }); },
  };
  return browser;
}

/** Encodes screencast frame tracks (each [{t, data}]) into a side-by-side webm, in real time, inside Chrome. */
export async function encodeWebm(browser, tracks, { w, h, labels = [] }) {
  const enc = await browser.newPage({ w: w * tracks.length, h: h + 28 });
  const t0 = Math.min(...tracks.map((tr) => tr[0]?.t ?? Infinity));
  const payload = JSON.stringify(tracks.map((tr) => tr.map((f) => ({ t: f.t - t0, d: f.data }))));
  await enc.eval(`window.__tracks = ${payload}; window.__labels = ${JSON.stringify(labels)}; 0`);
  const b64 = await enc.eval(`(async () => {
    const W = ${w}, H = ${h}, n = __tracks.length;
    const c = document.createElement('canvas'); c.width = W * n; c.height = H + 28; document.body.appendChild(c);
    const g = c.getContext('2d'); g.fillStyle = '#f8f9f7'; g.fillRect(0, 0, c.width, c.height);
    const load = (d) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/jpeg;base64,' + d; });
    const imgs = await Promise.all(__tracks.map((tr) => Promise.all(tr.map((f) => load(f.d)))));
    const end = Math.max(...__tracks.map((tr) => tr.at(-1)?.t ?? 0)) + 0.3;
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 1.6e6 });
    const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start(250);
    const start = performance.now();
    const idx = __tracks.map(() => 0);
    await new Promise((resolve) => {
      const draw = () => {
        const now = (performance.now() - start) / 1000;
        g.fillStyle = '#f8f9f7'; g.fillRect(0, 0, c.width, 28);
        g.fillStyle = '#242424'; g.font = '600 14px system-ui'; 
        __tracks.forEach((tr, k) => {
          while (idx[k] + 1 < tr.length && tr[idx[k] + 1].t <= now) idx[k]++;
          const im = imgs[k][idx[k]]; if (im) g.drawImage(im, k * W, 28, W, H);
          g.fillText((__labels[k] || '') + '   t=' + now.toFixed(1) + 's', k * W + 10, 19);
        });
        if (now < end) requestAnimationFrame(draw); else resolve();
      };
      draw();
    });
    rec.stop(); await done;
    const blob = new Blob(chunks, { type: 'video/webm' });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  })()`);
  await browser.send('Target.closeTarget', { targetId: enc.targetId });
  return Buffer.from(b64, 'base64');
}
