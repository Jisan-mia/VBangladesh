// Live check in Orca's built-in browser, in a tab of its own so parallel agents don't collide:
// a real phone layout (Pixel 9, 412 CSS px), your --eval checks, console errors, and an image of the top of the screen.
// Usage: node scripts/orca-shot.mjs <url> <out.png> [--device="Pixel 9"] [--wait=ms] [--eval="js; may await; throw to fail"] [--keep]
// shortcut: Orca repeats the image below its pane in phone mode, so only the top ~1000 device px are kept; full-page and 320px images come from scripts/shot.mjs.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
const [url, out] = args.filter(a => !a.startsWith('--'));
if (!url || !out) { console.error('usage: node scripts/orca-shot.mjs <url> <out.png> [--device="Pixel 9"] [--wait=ms] [--eval=js] [--keep]'); process.exit(1); }

const orca = (...cmd) => {
  const reply = JSON.parse(execFileSync('orca', [...cmd, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  if (!reply.ok) throw new Error(`orca ${cmd[0]}: ${reply.error?.code} ${reply.error?.message}`);
  return reply.result;
};
const value = (page, expression) => orca('eval', '--page', page, '--expression', expression).result;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const page = orca('tab', 'create', '--url', 'about:blank').browserPageId;
try {
  // Orca captures only what its pane really shows; an emulated phone taller than the pane repeats in the image. Crop to the pane.
  const paneHeight = Number(value(page, 'Math.round(innerHeight * devicePixelRatio)'));
  orca('goto', '--page', page, '--url', url);
  try { orca('wait', '--page', page, '--load', 'networkidle'); } catch { /* dev pages may keep a socket open */ }
  // Device emulation only sticks after navigation (goto/reload reset it).
  orca('exec', '--page', page, '--command', `set device "${flags.device ?? 'Pixel 9'}"`);
  await sleep(Number(flags.wait ?? 2000));
  if (flags.eval) {
    const result = String(value(page, `(async () => { ${flags.eval} })().then(() => 'ok', e => 'error: ' + e.message)`));
    if (result.startsWith('error:')) throw new Error(`--eval ${result}`);
    await sleep(600);
  }
  const shot = orca('screenshot', '--page', page, '--format', 'png');
  // Newer Orca returns a temp file path; older builds returned base64 data.
  const png = shot.path ? readFileSync(shot.path) : Buffer.from(shot.data, 'base64');
  writeFileSync(out, png);
  const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  const keep = Math.min(paneHeight, 1000);
  if (height > keep) execFileSync('sips', ['--cropToHeightWidth', String(keep), String(width), '--cropOffset', '0', '0', out], { stdio: 'ignore' });
  const errors = (orca('console', '--page', page, '--limit', '100').messages ?? orca('console', '--page', page, '--limit', '100').entries ?? [])
    .filter(entry => /error/i.test(entry.type ?? entry.level ?? ''));
  for (const entry of errors) console.log(`console error: ${String(entry.text ?? entry.message ?? JSON.stringify(entry)).slice(0, 300)}`);
  console.log(`saved ${out} · ${errors.length} console errors`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (!flags.keep) {
    const tab = orca('tab', 'list').tabs.find(item => item.browserPageId === page);
    if (tab) orca('tab', 'close', '--index', String(tab.index));
  }
}
