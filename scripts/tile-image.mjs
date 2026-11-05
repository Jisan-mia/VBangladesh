// Square 320×320 game tiles for the portal grid, cropped from each game's real play area.
// Usage: node --import tsx scripts/tile-image.mjs [slug ...] [--workers=4] [--sheet=.shots/tiles-sheet.png] [--sheet-only]
//   No slugs = every game and kids' game. The dev server must run at http://127.0.0.1:3100.
// It looks for [data-tile] inside #tool, else the biggest canvas or svg there, else a board-like element.
// Start cards and hints that float over the board are hidden for the shot. With no usable play area it crops
// public/previews/<slug>.webp instead. Per-game fixes (a better element, a click first) live in `overrides`.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { catalog } from '../lib/catalog.ts';

const ORIGIN = 'http://127.0.0.1:3100';
const SIZE = 320, TARGET_BYTES = 16_000;
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
const games = catalog.filter(tool => tool.category === 'গেম' || tool.category === 'ছোটদের জন্য').map(tool => tool.slug);
const slugs = args.filter(a => !a.startsWith('--'));
const queue = flags['sheet-only'] ? [] : [...(slugs.length ? slugs : games)];
const unknown = queue.filter(slug => !catalog.some(tool => tool.slug === slug));
if (unknown.length) { console.error('not in the catalog:', unknown.join(', ')); process.exit(1); }

/**
 * select: a CSS selector for the play area (inside #tool unless it starts with "body ").
 * before: JS run once the page settles (start a level, dismiss a card). keepOverlays: don't hide floating cards.
 * focus: [x, y] in 0..1, where the square sits inside a wide or tall area (default centre).
 * A selected element is shot as it is; a found canvas or svg grows to its wrapper when that is barely bigger.
 * zoom: crop a smaller square than the area (0.6 = 60% of the short side).
 * preview: [x, y, side] skip the page and crop the share card: x and side as fractions of its width, y of its height.
 * The cards put a headline on top, so the crop aims at the art below it.
 */
const overrides = {
  // Per game, after the start button: which element to shoot and where the square sits in it.
  'bhangti-nai': { select: '.bt-scene', zoom: 0.62, focus: [0.15, 1], keepOverlays: true, wait: 1500 },
  'ghontar-sur': { select: '.gs-bells', focus: [0.5, 0] },
  'jora-melao': { select: '.jm-mat' },
  // The brass থালা of chits is the art; its words are hidden for the shot.
  'chor-police': { select: '.cp-start', zoom: 0.78, focus: [0.5, 0.15], before: `document.querySelectorAll('.cp-start-label').forEach(e => { e.style.visibility = 'hidden'; });` },
  'paka-kancha': { select: '.pk-board' },
  'chhaya-melao': { select: '.cs-wall', focus: [0.5, 0.12], keepOverlays: true },
  // The storm scene has no mangoes in view mid-play, so its tile is the earlier, brighter shot of the tree (kept by hand, not re-shot).
  'chhip-felo': { select: '.cf-pond', focus: [0.5, 1] },
  'deri-hoye-gelo': { focus: [0.5, 0.85] },
  'tarer-fanke-belun': { focus: [0.5, 0.8] },
  'dosh-ghater-nouka': { focus: [0.5, 0.52] },
  // The board is mostly empty before play; the share card has the snake and the ঠোঙা.
  'jhalmuri-sap': { preview: [0.05, 0.1, 0.9] },
  'chhok-jora': { preview: [0.14, 0.2, 0.72] },
  // Its numbered pieces are buttons and spill past the grid box; the card shows the whole tin.
  'ponero-ghor': { preview: [0.16, 0.25, 0.68] },
  'chhobi-photao': { preview: [0.18, 0.28, 0.64] },
  'mukhe-mukhe-hisab': { preview: [0.05, 0.2, 0.9] },
  'chhobir-tukro': { preview: [0.1, 0.17, 0.8] },
  'kagojer-urojahaj': { preview: [0.12, 0.36, 0.76] },
  'pati-buni': { preview: [0.07, 0.2, 0.5] },
  // Kids' games are mostly words and buttons on the page; their cards show the pictures. Some pages also show a hint hand.
  'kar-chinho': { preview: [0.05, 0.28, 0.9] },
  'nam-shikhi': { preview: [0.05, 0.24, 0.9] },
  'golper-mor': { preview: [0.12, 0.1, 0.76] },
  'juktoborno': { preview: [0.05, 0.24, 0.9] },
  'moner-rong': { preview: [0.12, 0.2, 0.76] },
  'gune-dekhi': { preview: [0.04, 0.22, 0.92] },
  'abc-bazar': { preview: [0.05, 0.22, 0.9] },
  'ulto-khela': { preview: [0.05, 0.17, 0.9] },
  'shoman-bhag': { preview: [0.1, 0.13, 0.8] },
  'chhorar-tal': { preview: [0.05, 0.3, 0.9] },
  'ammur-number': { preview: [0.17, 0.2, 0.66] },
  'sur-banai': { preview: [0.08, 0.22, 0.84] },
  'sourojogot': { preview: [0, 0.2, 1] },
  'dinosaur': { preview: [0.04, 0.18, 0.92] },
  'sat-tukro': { preview: [0.05, 0.16, 0.9] },
  'borno-likhi': { preview: [0.05, 0.24, 0.9] },
};

// The start button of each game's launch screen: pressing it draws the play board, then we wait for things to move.
const starts = {
  'konta-nei': '.kn-shutter', 'bhangti-nai': '.bt-cover', 'ghontar-sur': '.gs-giant', 'churui-tarao': '.ct-go',
  'moshar-raat': '.mr-go', 'marble-sinri': '.ms-go', 'shobdo-khoja': '.sk-go', 'dudh-uthlano': '.du-title-start', 'antenna-thik-koro': '.at-title-start',
  'deri-hoye-gelo': '.dh-title-start', 'danguli': '.dg-title-start', 'sir-ghurlei-thamo': '.sg-title-start', 'paka-kancha': '.pk-go',
  'baicher-nouka': '.bn-title-start', 'tarer-fanke-belun': '.tb-title-start', 'vo-katta': '.vk-title-start', 'golokdhadha': '.gd-title-start',
  'golir-badminton': '.gb-title-start', 'atir-aam': '.aa-title-start', 'churir-bazar': '.cb-title-start', 'chhip-felo': '.cf-title-start',
  'latim': '.lt-title-start', 'ki-hobe': '.ki-start', 'o-te-ojogor': '.oj-start', 'ghori-dekhi': '.gd-start', 'chhaya-melao': '.cs-stall',
  'roshi-tana': '.rt-title-start', 'mongole-rover': '.mr-hill', 'daripalla': '.dp-startbtn', 'prithibi-ghuri': '.pg-env', 'dosh-ghater-nouka': '.dg-startbtn',
  'jora-melao': '.jm-sign', 'hat-dhui': '.hd-hero', 'nirapode-thaki': '.nt-card',
};
// The first-run story has a skip button (a click with no pointer counts as the long press).
const press = (sel, wait = 2500) => `document.querySelector(${JSON.stringify(sel)})?.click(); await new Promise(r => setTimeout(r, 1500)); for (const skip of document.querySelectorAll('[class*=skip]:not(.skip-link)')) skip.click(); await new Promise(r => setTimeout(r, ${wait}));`;
const tap = (sel, wait = 400) => `document.querySelector(${JSON.stringify(sel)})?.click(); await new Promise(r => setTimeout(r, ${wait}));`;
// Games that need a few moves before the board has something on it.
const moves = {
  // Two guesses so the rows show coloured mangoes.
  'paka-kancha': `for (const guess of [[0, 1, 2, 3], [4, 5, 6, 7]]) { const keys = [...document.querySelectorAll('.pk-key:not(.pk-erase):not(.pk-check)')]; for (const i of guess) { keys[i]?.click(); await new Promise(r => setTimeout(r, 150)); } document.querySelector('.pk-check')?.click(); await new Promise(r => setTimeout(r, 900)); }`,
};
for (const [slug, sel] of Object.entries(starts)) overrides[slug] = { before: press(sel) + (moves[slug] || ''), ...overrides[slug] };
for (const slug of Object.keys(moves)) if (!starts[slug]) overrides[slug] = { before: moves[slug], ...overrides[slug] };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const outDir = join(process.cwd(), 'public', 'tiles');
mkdirSync(outDir, { recursive: true });

async function browser() {
  const profile = mkdtempSync(join(tmpdir(), 'tile-'));
  const port = 9300 + Math.floor(Math.random() * 600);
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 80 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('Chrome did not start');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); let events = [];
  ws.addEventListener('message', m => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else events.push(msg); });
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const run = async expression => {
    const r = await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed');
    return r.result.result.value;
  };
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 900, deviceScaleFactor: 2, mobile: true });
  await send('Page.enable'); await send('Runtime.enable');
  const close = () => { chrome.kill('SIGKILL'); setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 400); };
  const open = async url => {
    events = [];
    await send('Page.navigate', { url });
    for (let i = 0; i < 160 && !events.some(e => e.method === 'Page.loadEventFired'); i++) await sleep(250);
  };
  return { send, run, open, close };
}

// Finds the play area and returns its page rect, after hiding what floats over it.
const findArea = (o) => `
  const o = ${JSON.stringify(o)};
  const tool = document.querySelector('#tool') || document.body;
  const big = el => { const r = el.getBoundingClientRect(); return r.width * r.height; };
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 120 && r.height > 120 && s.visibility !== 'hidden' && s.display !== 'none'; };
  let area = null;
  if (o.select) area = document.querySelector(o.select.startsWith('body ') ? o.select : '#tool ' + o.select);
  if (!area) area = tool.querySelector('[data-tile]');
  if (!area) {
    const drawn = [...tool.querySelectorAll('canvas, svg')].filter(visible).filter(el => !el.closest('button, a, .kit-card'));
    drawn.sort((a, b) => big(b) - big(a));
    if (drawn[0] && big(drawn[0]) > 150 * 150) area = drawn[0];
  }
  if (!area) {
    const boards = [...tool.querySelectorAll('[class*=board], [class*=stage], [class*=arena], [class*=field], [class*=grid], [class*=play]')].filter(visible);
    boards.sort((a, b) => big(b) - big(a));
    if (boards[0] && big(boards[0]) > 200 * 200) area = boards[0];
  }
  if (!area) return null;
  // A drawn svg inside a wrapper: use the wrapper when it is barely bigger (keeps the frame and backdrop).
  const wrap = area.parentElement;
  if (!o.select && wrap && wrap !== tool && big(wrap) < big(area) * 1.35) area = wrap;
  if (!o.keepOverlays) {
    const box = area.getBoundingClientRect();
    for (const el of document.querySelectorAll('body *')) {
      if (el === area || el.contains(area) || el.matches('canvas, svg, svg *')) continue;
      const s = getComputedStyle(el);
      if (s.position !== 'absolute' && s.position !== 'fixed' && s.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      const overlaps = r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom;
      // Hide floating cards and hints (they carry buttons or words), not the art layers.
      if (overlaps && (el.querySelector('button, p, h2, h3') || el.matches('button, p') || (el.textContent || '').trim().length > 14)) el.style.visibility = 'hidden';
    }
  }
  area.scrollIntoView({ block: 'center' });
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const r = area.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, tag: area.tagName.toLowerCase(), cls: String(area.className?.baseVal ?? area.className ?? '').slice(0, 60) };
`;

// Draws an image (data URL) square-cropped into a 320 canvas and returns WebP bytes under the size target.
// `crop` is a JS expression over `img`; the default is the centred square.
const encode = (src, crop = '(() => { const s = Math.min(img.width, img.height); return { x: (img.width - s) / 2, y: (img.height - s) / 2, s }; })()') => `
  const img = new Image(); img.src = ${JSON.stringify(src)}; await img.decode();
  const crop = ${crop};
  const c = document.createElement('canvas'); c.width = c.height = ${SIZE};
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(img, crop.x, crop.y, crop.s, crop.s, 0, 0, ${SIZE}, ${SIZE});
  let q = 0.82, url = c.toDataURL('image/webp', q);
  while (url.length * 0.75 > ${TARGET_BYTES} && q > 0.4) { q -= 0.06; url = c.toDataURL('image/webp', q); }
  return url;
`;

async function tileFromPage(b, slug) {
  const o = overrides[slug] || {};
  if (o.preview) return null;
  await b.open(`${ORIGIN}/${slug}`);
  // First load in dev compiles on demand; wait for #tool to have content.
  for (let i = 0; i < 40; i++) { if (await b.run(`return !!document.querySelector('#tool canvas, #tool svg, #tool button')`)) break; await sleep(500); }
  await sleep(1800);
  // Games inside the shared player show a launch card on a phone: press খেলো so the game itself is on screen.
  if (await b.run(`const play = document.querySelector('.gp-play'); if (play) play.click(); return !!play`)) await sleep(2000);
  if (o.before) { await b.run(o.before); await sleep(1500); }
  if (o.wait) await sleep(o.wait);
  if (flags.full) {
    const info = await b.run(`const t = document.querySelector('#tool') || document.body; const d = e => (e.tagName.toLowerCase() + '.' + String(e.className?.baseVal ?? e.className).split(' ')[0] + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)); return { buttons: [...t.querySelectorAll('button')].map(e => d(e) + ' "' + e.textContent.trim().slice(0, 20) + '"'), drawn: [...t.querySelectorAll('canvas, svg')].map(d).slice(0, 12) };`);
    console.log(slug, JSON.stringify(info));
    const full = await b.send('Page.captureScreenshot', { format: 'png' });
    mkdirSync(join(process.cwd(), 'scratchpad', 'tiles'), { recursive: true });
    writeFileSync(join(process.cwd(), 'scratchpad', 'tiles', `full-${slug}.png`), Buffer.from(full.result.data, 'base64'));
  }
  const area = await b.run(findArea(o));
  if (!area) return null;
  await sleep(500);
  const short = Math.min(area.width, area.height) * (o.zoom || 1);
  const [fx, fy] = o.focus || [0.5, 0.5];
  const clip = { x: area.x + (area.width - short) * fx, y: area.y + (area.height - short) * fy, width: short, height: short, scale: 1 };
  const shot = await b.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
  if (!shot.result?.data) return null;
  const url = await b.run(encode(`data:image/png;base64,${shot.result.data}`));
  return { url, how: `${area.tag}${area.cls ? '.' + area.cls.split(' ')[0] : ''} ${Math.round(area.width)}×${Math.round(area.height)}` };
}

async function tileFromPreview(b, slug, [fx, fy, fs] = [0.07, 0.12, 0.86]) {
  const file = join(process.cwd(), 'public', 'previews', `${slug}.webp`);
  if (!existsSync(file)) return null;
  await b.open(`${ORIGIN}/about`);
  const src = `data:image/webp;base64,${readFileSync(file).toString('base64')}`;
  const url = await b.run(encode(src, `(() => { const s = Math.min(img.width * ${fs}, img.height); return { x: Math.min(img.width - s, img.width * ${fx}), y: Math.min(img.height - s, img.height * ${fy}), s }; })()`));
  return { url, how: 'preview crop' };
}

const results = [];
async function worker() {
  const b = await browser();
  try {
    while (queue.length) {
      const slug = queue.shift();
      let tile = null;
      try { tile = await tileFromPage(b, slug); } catch (error) { console.error(`${slug}: ${error.message.split('\n')[0]}`); }
      if (!tile) tile = await tileFromPreview(b, slug, overrides[slug]?.preview);
      if (!tile) { console.error(`${slug}: no play area and no preview`); continue; }
      const bytes = Buffer.from(tile.url.split(',')[1], 'base64');
      writeFileSync(join(outDir, `${slug}.webp`), bytes);
      results.push({ slug, how: tile.how, kb: (bytes.length / 1024).toFixed(1) });
      console.log(`${slug}: ${tile.how}, ${(bytes.length / 1024).toFixed(1)} KB`);
    }
  } finally { b.close(); }
}

await Promise.all(Array.from({ length: Math.min(Number(flags.workers) || 4, queue.length) }, worker));

// Contact sheet: every tile with its slug, for a quick look.
if (flags.sheet) {
  const b = await browser();
  try {
    // --sheet-from=previews shows the share cards instead, to judge a fallback before using it.
    const fullDir = join(process.cwd(), 'scratchpad', 'tiles');
    const dir = flags['sheet-full'] ? fullDir : flags['sheet-dir'] ? flags['sheet-dir'] : flags['sheet-from'] === 'previews' ? join(process.cwd(), 'public', 'previews') : outDir;
    const list = (slugs.length ? slugs : games).filter(slug => existsSync(join(dir, flags['sheet-full'] ? `full-${slug}.png` : `${slug}.webp`)));
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.open('about:blank');
    const cells = list.map(slug => `<figure><img src="data:image/${flags['sheet-full'] ? 'png' : 'webp'};base64,${readFileSync(join(dir, flags['sheet-full'] ? `full-${slug}.png` : `${slug}.webp`)).toString('base64')}"><figcaption>${slug}</figcaption></figure>`).join('');
    await b.run(`document.body.innerHTML = ${JSON.stringify(`<style>body{margin:0;background:#222;font:11px sans-serif;color:#eee}main{display:grid;grid-template-columns:repeat(${flags['sheet-full'] ? 6 : 8},${flags['sheet-full'] ? 190 : 140}px);align-items:start;gap:8px;padding:8px}figure{margin:0}img{width:${flags['sheet-full'] ? 190 : 140}px;${flags['sheet-from'] || flags['sheet-full'] ? '' : 'height:140px;'}border-radius:12px;display:block}</style><main>${cells}</main>`)}; await Promise.all([...document.images].map(i => i.decode().catch(() => {})));`);
    const m = await b.send('Page.getLayoutMetrics');
    const shot = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: Math.ceil(m.result.cssContentSize.height), scale: 1 }, captureBeyondViewport: true });
    writeFileSync(flags.sheet, Buffer.from(shot.result.data, 'base64'));
    console.log(`sheet: ${flags.sheet}`);
  } finally { b.close(); }
}
setTimeout(() => process.exit(0), 600);
