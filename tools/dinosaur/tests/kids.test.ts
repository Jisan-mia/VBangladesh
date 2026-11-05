import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const game = read("components/game.tsx"), css = read("product.css");

test("no voice anywhere: no speak(), SpeakButton or speechSynthesis in the game", () => {
  for (const path of files(root)) assert.doesNotMatch(readFileSync(path, "utf8"), /\bspeak\s*\(|SpeakButton|speechSynthesis|useBanglaVoice/, path);
});

test("the game lives in the player and the kids' rules hold", () => {
  assert.match(read("page.tsx"), /<GamePage site=\{site\} kids /);
  assert.match(game, /useGamePlayer\(\{[\s\S]*?onPause[\s\S]*?onResume[\s\S]*?onRestart[\s\S]*?onLevels/);
  assert.doesNotMatch(files(root).map(path => readFileSync(path, "utf8")).join("\n"), /location\.hash|history\.(push|replace)State|pushState/, "no history or hash");
  assert.match(game, /window\.addEventListener\('keydown'/, "keys at the window");
  assert.match(game, /event\.currentTarget\.blur\(\)/, "buttons blur after a click");
  assert.match(game, /<RestScreen/);
  assert.match(game, /<ParentGate/);
  assert.match(game, /if \(key === 'p' \|\| key === 'P'\) \{ event\.preventDefault\(\); player\.requestPause\(\)/, "P is the player's pause");
  assert.doesNotMatch(game, /SoundToggle|setSlow|ধীরে খেলো/, "the player's menu has the sound and slow switches");
  assert.doesNotMatch(files(root).map(path => readFileSync(path, "utf8")).join("\n"), /new AudioContext|navigator\.vibrate|Math\.random/, "sound only through the kit; no Math.random in the logic");
});

test("timers are cleared: every small one with clearAll, the dig beat with its effect cleanup, the idle hint with its interval", () => {
  assert.match(game, /useEffect\(\(\) => \(\) => \{ clearAll\(\); silenceScheduled\(\); \}, \[\]\)/);
  assert.match(game, /return \(\) => clearTimeout\(id\);/);
  assert.match(game, /return \(\) => clearInterval\(id\);/);
  assert.match(game, /if \(!settling \|\| frozen\) return;/, "the beat waits while paused");
});

test("nothing under 16 px, and the dig sand is not covered by anything that takes the finger", () => {
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ""), /font-size:1[0-5]px/);
  assert.match(css, /\.dn-under,\.dn-rocks,\.dn-dust,\.dn-halo\{pointer-events:none\}/);
  assert.match(css, /\.dn-sand\{touch-action:none/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.dn\[data-slow\] \*/);
});

test("the look: square corners except what is truly round, and glow only to signal", () => {
  const radii = [...css.matchAll(/border-radius:([^;}]+)/g)].map(match => match[1]);
  for (const radius of radii) assert.match(radius, /^(50%|[0-4]px)$/, radius);
  assert.doesNotMatch(css, /box-shadow:0 0 \d+px|filter:blur|text-shadow:0 0/, "no soft glows");
  assert.doesNotMatch(css, /linear-gradient|radial-gradient/, "flat colour, no gradients");
});

test("sound: only the shared kit, no loops, and every sound the components call exists", () => {
  const sound = read("lib/sound.ts");
  assert.match(sound, /from "\.\.\/\.\.\/\.\.\/shared\/game-sound"/);
  assert.doesNotMatch(sound, /\bloop\(|AudioContext|setInterval/, "no loops: every sound is a one-shot");
  const defined = new Set([...sound.matchAll(/^  (\w+): /gm)].map(match => match[1]));
  const used = new Set(files(root).filter(path => /\.tsx?$/.test(path)).flatMap(path => [...readFileSync(path, "utf8").matchAll(/\bsound\.(\w+)\(/g)].map(match => match[1])));
  assert.ok(used.size >= 10, `${used.size} sounds in use`);
  for (const name of used) assert.ok(defined.has(name), `sound.${name} is defined`);
  assert.ok(defined.size >= 10 && defined.size <= 16);
  // Every sound has a picture twin (scheduled tones cut by the player's pause: stars and the tune use `tone(…, delay)`, not setTimeout)
  assert.doesNotMatch(sound, /setTimeout/);
});
