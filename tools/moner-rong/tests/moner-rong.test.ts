import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { FACES, FEELINGS, ORDER } from "../lib/faces";
import { LEVELS, OLD_SET_TO_LEVEL } from "../lib/levels";
import { alsoLine, bn, cardHead, endLine, listWords, mirrorLine, sayLine, type Today } from "../lib/lines";
import { MOVED_KEY, STARS_KEY, moveOldStars, practised, readWorld } from "../lib/progress";
import { createRound, advance, chooseKind, fitting, nameFeeling } from "../lib/round";
import { SCENES } from "../lib/scenes";
import { site } from "../content";
import { share } from "../share";
import { COUNT_FRAMES, paintCount, type CountUp } from "../components/count.hot";

const root = join(import.meta.dirname, "..");
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

/** Every source file of the tool except the tests. */
function sources() {
  const found: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) found.push(path); } };
  walk(root);
  return found;
}

test("there are twenty pictures, each with one to three feelings, two kind things and a clue", () => {
  assert.equal(SCENES.length, 20);
  assert.equal(new Set(SCENES.map(scene => scene.id)).size, 20);
  for (const scene of SCENES) {
    assert.ok(scene.feels.length >= 1 && scene.feels.length <= 3, scene.id);
    assert.equal(scene.kind.length, 2);
    assert.equal(new Set(scene.kind.map(kind => kind.icon)).size, 2, `${scene.id}: two different pictures`);
    for (const text of [scene.text, scene.clue, scene.ask, scene.q ?? "", ...scene.kind.flatMap(kind => [kind.text, kind.after])]) nfc(text);
    assert.ok(scene.clue.length > 0 && scene.ask.endsWith("?"), scene.id);
  }
  assert.ok(SCENES.every(scene => scene.who.length > 0 && scene.whose.length > 0));
  // Every one of the 20 pictures is used by some level.
  const used = new Set(LEVELS.flatMap(level => level.scenes));
  for (const scene of SCENES) assert.ok(used.has(scene.id), `${scene.id} is in a level`);
});

test("six feelings, each with a face drawn in strokes; no teeth and no streaming tears", () => {
  assert.equal(ORDER.length, 6);
  for (const feeling of ORDER) { assert.ok(FACES[feeling].length >= 3, feeling); nfc(FEELINGS[feeling].word); }
  assert.ok(FACES.calm.length >= 2);
});

test("feeling lines read the way children say them", () => {
  const ghuri = SCENES.find(scene => scene.id === "ghuri")!;
  assert.equal(sayLine(ghuri, "mon-kharap"), "রাফির মন খারাপ।");
  assert.equal(sayLine(ghuri, "rag"), "রাফির রাগ হচ্ছে।");
  assert.equal(alsoLine(ghuri, "rag"), "রাগ আর মন খারাপ, দুটোই হতে পারে।");
  assert.equal(alsoLine(SCENES[0], "khushi"), "");
  assert.equal(alsoLine(SCENES.find(scene => scene.id === "cake")!, "obak"), "অবাক, রাগ, মন খারাপ, তিনটাই হতে পারে।");
  assert.equal(listWords(["lojja", "khushi", "bhoy"]), "খুশি, ভয় আর লজ্জা");
  assert.equal(mirrorLine(2), "এবার আয়নায় একটা রাগের মুখ বানাও তো।");
  const round = createRound(1, 1);
  for (;;) { nameFeeling(round, fitting(round)[0]); chooseKind(round, 0); if (!advance(round)) break; }
  assert.match(endLine(round), /^৩টা ছবিতে মন চিনলে: /);
  const today: Today = { scenes: 9, feelings: ["khushi"] };
  assert.equal(cardHead(today), "আজ ৯টা ছবিতে");
  assert.equal(bn(12), "১২");
});

test("old saved stars (six sets under the same key) move once to the new level ids, keeping the counts", () => {
  const store = new Map<string, string>([[STARS_KEY, JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 2, 5: 1, 6: 3 })]]);
  const read = (key: string) => store.get(key) ?? null;
  const moved = moveOldStars(read)!;
  assert.deepEqual(moved, { 1: 3, 2: 2, 4: 1, 5: 2, 7: 1, 8: 3 });
  assert.deepEqual(OLD_SET_TO_LEVEL, { 1: 1, 2: 2, 3: 4, 4: 5, 5: 7, 6: 8 });
  store.set(STARS_KEY, JSON.stringify(moved));
  store.set(MOVED_KEY, "1");
  assert.equal(moveOldStars(read), null, "the move runs once");
  assert.equal(moveOldStars(() => null)?.[1], undefined, "nothing saved, nothing moved");
  assert.deepEqual(moveOldStars(() => "not json"), {});
  // Hostile values are dropped by the shared reader.
  assert.deepEqual(moveOldStars(key => key === STARS_KEY ? JSON.stringify({ 1: 9, 9: 2, x: 1, 2: 0 }) : null), {});
});

test("stars are practice: one more per play-through, never above three, never below one", () => {
  assert.deepEqual([0, 1, 2, 3, 4, -4, Number.NaN].map(practised), [1, 2, 3, 3, 3, 1, 1]);
  assert.equal(readWorld("jhor"), "jhor");
  assert.equal(readWorld("<script>"), "rod");
  assert.equal(readWorld(null), "rod");
});

test("the end screen's count-up allocates nothing and settles on the real numbers", () => {
  const nodes = [{ textContent: "" }, { textContent: "" }] as unknown as HTMLElement[];
  const count: CountUp = {
    nodes, frames: [4, 3].map(value => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(value * frame / (COUNT_FRAMES - 1))))), last: new Int16Array(2).fill(-1),
  };
  paintCount(count, 0.3);
  assert.notEqual(nodes[0].textContent, "");
  paintCount(count, 1);
  assert.equal(nodes[0].textContent, "৪");
  assert.equal(nodes[1].textContent, "৩");
  const hot = readFileSync(join(root, "components/count.hot.ts"), "utf8");
  assert.doesNotMatch(hot.split("export function paintCount")[1], /=>|\.map\(|\.filter\(|\bnew\b|`/, "no allocation in the per-frame body");
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "set=1", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("the tool never touches the network, never speaks, never pushes history or sets the hash, and every file is NFC", () => {
  const files = [...sources(), join(root, "../../app/moner-rong/page.tsx")];
  assert.ok(files.length >= 15);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|ShareBar|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
    assert.doesNotMatch(source, /\bspeak\(|SpeakButton|speechSynthesis|useBanglaVoice/, `${file} speaks`);
    assert.doesNotMatch(source, /location\.hash\s*=|pushState|history\.replaceState\(null/, `${file} touches history`);
    assert.doesNotMatch(source, /Math\.random|Date\.now\(/, `${file} must stay deterministic or use the kit`);
    nfc(source);
  }
});

test("the game uses the player, the kids' kit and the shared sound only", () => {
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /useGamePlayer\(\{[\s\S]*onPause[\s\S]*onResume[\s\S]*onRestart[\s\S]*onLevels/);
  assert.match(game, /atBreak\(\)/);
  assert.match(game, /player\.requestPause\(\)/);
  assert.doesNotMatch(game, /SoundToggle|useSlowMode\(\)\s*;?\s*[\s\S]*aria-pressed=\{slow\}/, "no toggles of its own");
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage[^>]*\bkids\b/);
  for (const file of sources()) assert.doesNotMatch(readFileSync(file, "utf8"), /new (AudioContext|webkitAudioContext)|navigator\.vibrate/, file);
});

test("content: SEO limits, no voice promised, and the questions parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("ছোটদের অনুভূতি চেনার খেলা"));
  assert.equal(site.headline, "কার মনে আজ কোন রং?");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^সাধারণত ছয়টা/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ", "তারা"]) assert.ok(questions.includes(must), must);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline !== site.title);
  const voice = site.faq.find(item => item.question === "খেলা কি নিজে থেকে কথা বলে?")!;
  assert.match(voice.answer, /^না।/);
  for (const text of [site.title, site.description, site.lead, site.guideIntro!, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => item === voice ? [item.question] : [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন|কণ্ঠ|স্পিকার|পড়ে শোনায়/, "তুমি voice, and no voice promised");
  }
  nfc(voice.answer);
});
