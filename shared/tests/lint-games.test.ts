import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'lint-games.mjs');

type Violation = { file: string; line: number; rule: string; severity: string; message: string; baselined: boolean };
type Report = { newErrors: number; newWarnings: number; baselined: number; violations: Violation[] };

const roots: string[] = [];
after(() => { for (const root of roots) rmSync(root, { recursive: true, force: true }); });

function tree(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'lint-games-'));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text.normalize('NFC'));
  }
  return root;
}

function lint(root: string, ...args: string[]) {
  const run = spawnSync(process.execPath, [SCRIPT, '--root', root, '--json', '--all', ...args], { encoding: 'utf8' });
  assert.equal(run.stderr, '');
  return { code: run.status, report: JSON.parse(run.stdout) as Report };
}

const at = (report: Report, file: string, rule: string) => report.violations.filter(v => v.file === file && v.rule === rule).map(v => v.line);

test('hot files: allocations inside functions are errors, module scope and allowed lines are fine', () => {
  const file = 'tools/g/lib/step.hot.ts';
  const root = tree({
    [file]: [
      'const pool = new Float32Array(64);',            // 1 module scope: fine
      'const offsets = [1, 2, 3];',                    // 2 module scope: fine
      'export function step(state: any, list: number[]) {',
      '  const pos = { x: 1 };',                       // 4 object literal
      '  const tmp = [1, 2];',                         // 5 array literal
      '  const v = new Float32Array(2);',              // 6 new
      '  const f = () => 1;',                          // 7 arrow
      '  const g = function () { return 2; };',        // 8 function expression
      '  const copy = [...list];',                     // 9 array literal + spread
      '  const doubled = list.map(n => n * 2);',       // 10 .map (callback not double counted)
      '  list.forEach(n => { state.n = n; });',        // 11 .forEach with inline callback
      '  list.forEach(step);',                         // 12 .forEach with a named function: fine
      '  const label = `score ${state.n}`;',           // 13 template literal
      '  const plain = `score`;',                      // 14 no substitution: fine
      '  // lint-games-allow: one-off debug overlay',
      '  const dbg = { on: true };',                   // 16 allowed
      '  for (let i = 0; i < list.length; i++) pool[i] = list[i] + offsets[0];', // 17 fine
      '  return list.filter(Boolean).reduce((a, b) => a + b, 0);', // 18 .filter and .reduce
      '}',
    ].join('\n'),
  });
  const { report } = lint(root, '--no-baseline');
  assert.deepEqual(at(report, file, 'hot-alloc'), [4, 5, 6, 7, 8, 9, 9, 10, 11, 13, 18, 18]);
  assert.ok(report.violations.every(v => v.severity === 'error'));
});

test('audio and vibration belong to shared/game-sound.ts', () => {
  const root = tree({
    'shared/game-sound.ts': 'let a = new AudioContext();\nnavigator.vibrate?.(10);\n',
    'tools/g/components/play.tsx': [
      'const a = new AudioContext();',
      'const b = new (window as any).webkitAudioContext();',
      'const Ctor = window.AudioContext || (window as any).webkitAudioContext;',
      'navigator.vibrate(20);',
      'navigator.vibrate?.([10, 20]);',
    ].join('\n'),
  });
  const { report } = lint(root, '--no-baseline');
  const file = 'tools/g/components/play.tsx';
  assert.deepEqual(at(report, file, 'audio-outside-kit'), [1, 2, 3]);
  assert.deepEqual(at(report, file, 'direct-vibrate'), [4, 5]);
  assert.equal(report.violations.filter(v => v.file === 'shared/game-sound.ts').length, 0);
});

test('Math.random and Date.now() are banned in tools/*/lib, except link, share and seed files', () => {
  const root = tree({
    'tools/g/lib/game.ts': [
      'export const roll = () => Math.random();',
      'export const stamp = () => Date.now();',
      'export const ref = Date.now;',               // not a call: fine
      '// lint-games-allow: daily seed comes from the calendar',
      'export const day = Date.now();',
    ].join('\n'),
    'tools/g/lib/share-link.ts': 'export const id = Math.random();\n',
    'tools/g/lib/seed.ts': 'export const s = Date.now();\n',
    'tools/g/lib/challenge-link.ts': 'export const s = Math.random();\n',
    'tools/g/components/play.tsx': 'const r = Math.random();\n',
  });
  const { report } = lint(root, '--no-baseline');
  assert.deepEqual(at(report, 'tools/g/lib/game.ts', 'sim-nondeterminism'), [1, 2]);
  assert.equal(report.violations.filter(v => v.rule === 'sim-nondeterminism').length, 2);
});

test('literal ড় ঢ় য় inside a regex character class is an error', () => {
  const file = 'shared/text.ts';
  const root = tree({
    [file]: [
      'export const a = /[অ-ড়]/;',               // 1 range broken by NFC
      'export const b = /[ঢ়য়]+/u;',             // 2
      'export const c = /(?:ড়|ঢ়|য়)/;',          // 3 alternation: fine
      'export const d = /[\\u09DC\\u09DD]/;',     // 4 escapes: fine
      'export const e = new RegExp("[য়]");',     // 5 string pattern
      'export const f = /য়\\[x]/;',               // 6 outside the class: fine
      'export const g = "[ড়]";',                 // 7 plain string: fine
    ].join('\n'),
  });
  const { report } = lint(root, '--no-baseline');
  assert.deepEqual(at(report, file, 'nukta-in-regex-class'), [1, 2, 5]);
});

test("kids' tools may not fetch, share or call /api/", () => {
  const body = [
    'import { postShare } from "../../../shared/share-client";',
    'import { ShareBar } from "../../../shared/share-kit";',
    'export function Play() {',
    '  fetch("/x");',
    '  window.fetch("/y");',
    '  const url = "/api/tally/kid";',
    '  return <ShareBar />;',
    '}',
  ].join('\n');
  const root = tree({
    'lib/catalog.ts': 'export const catalog = [{ slug: "kid", category: "ছোটদের জন্য" }, { slug: "big", category: "গেম" }];\n',
    'tools/kid/components/play.tsx': body,
    'tools/kid2/content.ts': 'export const site = { slug: "kid2", category: "ছোটদের জন্য" };\n',
    'tools/kid2/page.tsx': 'export default function P() { fetch("/api/share"); return null; }\n',
    'tools/big/components/play.tsx': body,
  });
  const { report } = lint(root, '--no-baseline');
  assert.deepEqual(at(report, 'tools/kid/components/play.tsx', 'kids-network'), [1, 2, 4, 5, 6, 7]);
  assert.deepEqual(at(report, 'tools/kid2/page.tsx', 'kids-network'), [1, 1]);
  assert.equal(at(report, 'tools/big/components/play.tsx', 'kids-network').length, 0);
});

test('discarded timers in components are warnings and do not fail the run', () => {
  const file = 'tools/g/components/play.tsx';
  const root = tree({
    [file]: [
      'export function Play() {',
      '  setTimeout(() => go(), 300);',                       // 2 warning
      '  window.setInterval(tick, 1000);',                    // 3 warning
      '  const id = window.setTimeout(go, 10);',              // 4 kept: fine
      '  timer.current = setTimeout(go, 10);',                // 5 kept: fine
      '  useEffect(() => { const t = setInterval(tick, 5); return () => clearInterval(t); }, []);', // 6 fine
      '  onClick(() => setTimeout(go, 5));',                  // 7 warning: returned to a caller that ignores it
      '}',
    ].join('\n'),
    'tools/g/lib/game.ts': 'setTimeout(() => 1, 5);\n',   // only components are checked
  });
  const { code, report } = lint(root, '--no-baseline');
  assert.deepEqual(at(report, file, 'uncleared-timer'), [2, 3, 7]);
  assert.ok(report.violations.every(v => v.severity === 'warning'));
  assert.equal(code, 0);
  assert.equal(report.newWarnings, 3);
});

test('the baseline holds existing violations and fails only on new ones', () => {
  const files = { 'tools/g/lib/game.ts': 'export const a = Math.random();\n' };
  const root = tree(files);
  const baseline = join(root, 'baseline.json');
  assert.equal(lint(root, '--no-baseline').code, 1);

  spawnSync(process.execPath, [SCRIPT, '--root', root, '--baseline', baseline, '--write-baseline'], { encoding: 'utf8' });
  const held = lint(root, '--baseline', baseline);
  assert.equal(held.code, 0);
  assert.equal(held.report.baselined, 1);
  assert.equal(held.report.newErrors, 0);

  writeFileSync(join(root, 'tools/g/lib/game.ts'), 'export const a = Math.random();\nexport const b = Math.random();\n');
  const grown = lint(root, '--baseline', baseline);
  assert.equal(grown.code, 1);
  assert.equal(grown.report.newErrors, 1);
  assert.deepEqual(grown.report.violations.filter(v => !v.baselined).map(v => v.line), [2]);

  // Paying the debt down and pruning shrinks the baseline, so the old count cannot creep back.
  writeFileSync(join(root, 'tools/g/lib/game.ts'), 'export const a = 1;\n');
  spawnSync(process.execPath, [SCRIPT, '--root', root, '--baseline', baseline, '--prune-baseline'], { encoding: 'utf8' });
  writeFileSync(join(root, 'tools/g/lib/game.ts'), 'export const a = Math.random();\n');
  assert.equal(lint(root, '--baseline', baseline).code, 1);
});

test('the text output is file:line rule message', () => {
  const root = tree({ 'tools/g/lib/game.ts': 'export const a = Math.random();\n' });
  const run = spawnSync(process.execPath, [SCRIPT, '--root', root, '--no-baseline'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /^tools\/g\/lib\/game\.ts:1 sim-nondeterminism Math\.random/m);
});
