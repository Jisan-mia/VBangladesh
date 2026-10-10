// Renders a tool's real share card into (1) a homepage thumbnail and (2) a 1200x630 social preview. Same-origin, so site fonts apply.
// Usage: node scripts/og-image.mjs <slug> public/previews/<slug>.webp public/social/<slug>.png "<title, part after | is highlighted>" "<subtitle>" <bg> <ink> <accent> [hash] [evalBeforeGrab]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [slug, previewOut, socialOut, title, sub, bg, ink, accent, hash = '', before = ''] = process.argv.slice(2);
const profile = mkdtempSync(join(tmpdir(), 'og-'));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const done = code => { chrome.kill('SIGKILL'); rmSync(profile, { recursive: true, force: true }); process.exit(code); };
setTimeout(() => { console.error('timed out'); done(1); }, 90000);
let target;
for (let i = 0; i < 60 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} if (!target) await sleep(250); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); const events = [];
ws.addEventListener('message', m => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else events.push(msg); });
const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const run = async expression => { const r = await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed'); return r.result.result.value; };
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Page.enable');
await send('Page.navigate', { url: `http://127.0.0.1:3100/${slug}${hash ? '#' + hash : ''}` });
for (let i = 0; i < 120 && !events.some(e => e.method === 'Page.loadEventFired'); i++) await sleep(250);
await sleep(4000);
if (before) { await run(before); await sleep(1500); }
const card = await run(`const c = document.querySelector('.kit-card canvas') || [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; return c ? c.toDataURL('image/png') : null;`);
if (!card) { console.error('no card canvas found'); done(1); }
// Homepage thumbnails are small: 540px-wide WebP keeps them tens of KB instead of multi-MB PNGs.
const thumb = await run(`const img = new Image(); img.src = ${JSON.stringify(card)}; await img.decode(); const c = document.createElement('canvas'); c.width = 540; c.height = Math.round(540 * img.height / img.width); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/webp', 0.86);`);
writeFileSync(previewOut, Buffer.from(thumb.split(',')[1], 'base64'));
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
const [plain, hi = ''] = title.split('|');
await run(`window.__og = ${JSON.stringify({ card, plain, hi, sub, bg, ink, accent })};`);
await run(`
  const og = window.__og;
  document.body.style.overflow = 'hidden'; window.scrollTo(0, 0);
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:2147483647;width:1200px;height:630px;display:grid;grid-template-columns:1fr 470px;align-items:center;gap:30px;padding:0 0 0 72px;box-sizing:border-box;overflow:hidden;font-family:var(--font-display)';
  o.style.background = og.bg; o.style.color = og.ink;
  const left = document.createElement('div');
  left.innerHTML = '<p style="display:flex;align-items:center;gap:10px;font-size:30px;font-weight:700;margin:0 0 18px"><svg width="38" height="38" viewBox="0 0 38 38" fill="none"><path d="M5 16 24 4l9 17-20 12Z" fill="#e44b32"/><path d="m5 16 16 1 3-13M21 17l-8 16M21 17l12 4" stroke="white" stroke-width="1.6" stroke-linejoin="round"/></svg>একটুখানি</p><h1 style="font-size:64px;line-height:1.3;margin:0 0 20px;font-weight:800"></h1><p style="font-size:28px;margin:0;opacity:.8"></p>';
  const h1 = left.querySelector('h1'); h1.append(og.plain);
  const span = document.createElement('span'); span.style.color = og.accent; span.textContent = og.hi; h1.append(span);
  left.querySelector('p:last-child').textContent = og.sub;
  const img = document.createElement('img'); img.src = og.card;
  img.style.cssText = 'width:430px;height:auto;transform:rotate(3deg) translateY(40px);box-shadow:0 20px 50px #0005;border-radius:10px';
  o.append(left, img); document.body.append(o);
  await img.decode(); await document.fonts.ready;
`);
await sleep(1200);
const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
writeFileSync(socialOut, Buffer.from(shot.result.data, 'base64'));
console.log(`saved ${previewOut} and ${socialOut}`);
done(0);
