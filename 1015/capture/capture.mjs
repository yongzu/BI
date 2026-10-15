// Headless Chrome section capture via CDP.
// usage: node capture.mjs <config.json> <outDir>
// config: [{ "url": "...", "shots": [{ "id": "aiml-01", "y": 0, "wait": 4000 }], "wheel": false, "first": 5000 }]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [cfgPath, outDir] = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = join(outDir, '..', 'chrome-profile');
const port = 9333;
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--window-size=1280,800', '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank',
], { stdio: 'ignore' });

let ws, seq = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq;
  pending.set(id, { res, rej });
  ws.send(JSON.stringify({ id, method, params }));
});

try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(500); }
  }
  const page = targets.find((t) => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    }
  });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

  for (const pg of cfg) {
    await send('Page.navigate', { url: pg.url });
    await sleep(pg.first ?? 5000);
    let cur = 0;
    for (const s of pg.shots) {
      if (pg.wheel) {
        // real wheel events so scroll-driven pages mount their sections
        while (cur < s.y) {
          const step = Math.min(400, s.y - cur);
          await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 640, y: 400, deltaX: 0, deltaY: step });
          cur += step;
          await sleep(120);
        }
        if (cur > s.y) { await send('Runtime.evaluate', { expression: `scrollTo(0,${s.y})` }); cur = s.y; }
      } else {
        await send('Runtime.evaluate', { expression: `scrollTo(0,${s.y})` });
      }
      await sleep(s.wait ?? 4000);
      const { result } = await send('Runtime.evaluate', { expression: 'scrollY', returnByValue: true });
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
      writeFileSync(join(outDir, `${s.id}.jpg`), Buffer.from(shot.data, 'base64'));
      console.log(s.id, 'scrollY=', result.value);
    }
  }
} catch (e) {
  console.error('ERR', e.message);
} finally {
  try { ws?.close(); } catch {}
  proc.kill();
}
