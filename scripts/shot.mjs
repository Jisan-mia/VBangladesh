// Phone screenshot via Chrome DevTools Protocol (true mobile emulation, JS runs, optional interaction).
// Usage: node scripts/shot.mjs <url> <out.png> [width=390] [height=844] [--full] [--wait=ms] [--eval="js run before the shot"]
//   --full  captures the whole page height.   --eval lets you click/type first, e.g. --eval="document.querySelector('button').click()"
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
const [url, out, width = '390', height = '844'] = args.filter(a => !a.startsWith('--'));
if (!url || !out) { console.error('usage: node shot.mjs <url> <out.png> [width] [height] [--full] [--wait=ms] [--eval=js]'); process.exit(1); }
const profile = mkdtempSync(join(tmpdir(), 'shot-'));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const done = code => { chrome.kill('SIGKILL'); rmSync(profile, { recursive: true, force: true }); process.exit(code); };
setTimeout(() => { console.error('timed out'); done(1); }, 60000);
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} if (!target) await sleep(250); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', m => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else events.push(msg); });
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const w = Number(width), h = Number(height);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url });
  for (let i = 0; i < 120 && !events.some(e => e.method === 'Page.loadEventFired'); i++) await sleep(250);
  await sleep(Number(flags.wait) || 2500);
  if (typeof flags.eval === 'string') {
    const r = await send('Runtime.evaluate', { expression: `(async () => { ${flags.eval} })()`, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) console.error('eval error:', r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    await sleep(1200);
  }
  const errors = events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text);
  if (errors.length) console.error('page errors:', errors.slice(0, 3).join('\n'));
  let clip;
  if (flags.full) { const m = await send('Page.getLayoutMetrics'); clip = { x: 0, y: 0, width: w, height: Math.min(Math.ceil(m.result.cssContentSize.height), 12000), scale: 1 }; }
  const shot = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log(`saved ${out}`);
  done(0);
} catch (error) { console.error(String(error)); done(1); }
