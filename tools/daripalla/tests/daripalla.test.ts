import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site, parentNote } from "../content";
import { LEVEL_COUNT } from "../lib/levels";
import { share } from "../share";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("the #og preview draws a fixed card and never touches storage, stars or play time", () => {
  const og = readFileSync(join(root, "components/og-card.tsx"), "utf8");
  assert.doesNotMatch(og, /localStorage|sessionStorage|indexedDB|useLevels|useKidsSession|atBreak|record\(|addToday/);
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /og \? <OgCard[^\n]*: <Game \/>/, "the game, with its stars and session clock, isn't rendered on #og");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("saved progress: old stars for ids 1–7 keep their meaning, the new ids 8–11 are accepted, nothing locks", () => {
  const old = readLevels('{"1":3,"2":2,"3":1,"4":3,"5":3,"6":2,"7":1}', LEVEL_COUNT);
  assert.deepEqual(old, { 1: 3, 2: 2, 3: 1, 4: 3, 5: 3, 6: 2, 7: 1 });
  assert.equal(recordLevel(old, 11, 3)[11], 3);
  assert.deepEqual(readLevels('{"12":3,"0":2,"x":1}', LEVEL_COUNT), {}, "ids outside 1–11 are dropped");
  assert.equal(unlockedLevel({ 7: 1 }, LEVEL_COUNT), 8, "game-core's unlock rule is untouched");
});

test("no network, no voice: the tool's source never calls fetch, imports share-client, speaks or reads speechSynthesis", () => {
  const sources = [...files(root), join(root, "../../app/daripalla/page.tsx")];
  assert.ok(sources.length >= 20);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.doesNotMatch(text, /speechSynthesis|\bspeak\(|SpeakButton|useBanglaVoice/, `${file}: no voice anywhere`);
    assert.doesNotMatch(text, /location\.hash\s*=[^=]|history\.pushState/, `${file}: never touch the hash or push history`);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("the game keeps the shared patterns: the player's pause, GamePage, kids mode, no own sound toggle, no timers in play", () => {
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /useGamePlayer\(\{[\s\S]*onPause[\s\S]*onResume[\s\S]*onRestart[\s\S]*onLevels/);
  assert.match(game, /requestPause\(\)/);
  assert.doesNotMatch(game, /SoundToggle|setTimeout|setInterval/, "one clock, no loose timers, the player owns sound");
  assert.match(game, /atBreak\(\)/);
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage site=\{site\} kids /);
  assert.match(page, /ParentNote/);
  const css = readFileSync(join(root, "product.css"), "utf8");
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\[data-slow\]/);
  // The end buttons are pictures at least 96 px tall, and the next-pan button too.
  assert.match(css, /\.dp-big\{[^}]*min-height:112px/);
  assert.match(css, /\.dp-next\{[^}]*min-height:96px/);
  const end = readFileSync(join(root, "components/end-screen.tsx"), "utf8");
  assert.match(end, /<svg[^>]*aria-hidden="true">[\s\S]*<span>আবার খেলো<\/span>/);
  assert.match(end, /<span>শেষ<\/span>/);
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("শিশুদের যোগ অংক"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].question, /সমান চিহ্ন/);
  assert.match(site.faq[0].answer, /^সমান চিহ্ন মানে দুই পাশের মান একই/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.steps.length >= 4);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer]), ...Object.values(parentNote)]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন|IQ|জিনিয়াস|কেজি ওজন/, "তুমি voice, no brain claims");
    assert.doesNotMatch(text, /ধাপ/, "levels are লেভেল everywhere now");
  }
});
