import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parentNote, site } from "../content";
import { LITTLE, GUESTS } from "../lib/people";
import { EMPTY_TODAY, addToday, cardLines, divisionLine } from "../lib/round";
import { share } from "../share";
import { PERFECT, playRound } from "./bot";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const read = (path: string) => readFileSync(join(root, path), "utf8");
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("today's card counts what was done, first person, no name, no stars", () => {
  let today = addToday(EMPTY_TODAY, playRound(1, 1, PERFECT).result);
  assert.deepEqual(cardLines(today), ["আজ ৮ জন মেহমানকে সমান ভাগ দিলাম"]);
  today = addToday(today, playRound(4, 2, PERFECT).result);
  assert.equal(today.cuts.length, 4);
  const lines = cardLines(today);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /^৪টা রুটি কেটে .* বানালাম$/);
  today = addToday(today, playRound(5, 3, PERFECT).result);
  assert.match(cardLines(today)[2], /^৪টা ভাগের নাম বললাম$/);
  assert.deepEqual(cardLines(EMPTY_TODAY), []);
  for (const line of cardLines(today)) { nfc(line); assert.ok(![...GUESTS, ...LITTLE].some(guest => line.includes(guest.name))); assert.doesNotMatch(line, /তারা|পেল না|শেষ টুকরো/); }
  assert.match(divisionLine({ plates: 3, per: 2, food: "pitha" }), /^৬ ÷ ৩ = ২টা করে পিঠা$/);
  assert.ok(today.table, "the last table is kept for the card");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network and nothing a child types: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/shoman-bhag/page.tsx")];
  assert.ok(sources.length >= 18);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\/|<input|<textarea/, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("bug 1, SilentWhenMuted: there is no voice anywhere", () => {
  for (const file of files(root)) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /speechSynthesis|SpeechSynthesisUtterance|\bspeak\(|SpeakButton|useBanglaVoice/, file);
  }
  const sound = read("lib/sound.ts");
  assert.match(sound, /from "..\/..\/..\/shared\/game-sound"/);
  assert.doesNotMatch(sound, /AudioContext|loop\(|navigator\.vibrate/, "only the kit makes sound, and nothing loops");
});

test("bug 5, NoReadingNeeded: every choice on every screen is a picture, at least 96 px", () => {
  const board = read("components/board.tsx"), end = read("components/end-screen.tsx"), title = read("components/title.tsx"), list = read("components/level-list.tsx"), css = read("product.css");
  // each <button …>…</button> in the board, the end screen and the title carries a picture (an svg or a Pic)
  for (const [name, text] of [["board", board], ["end", end], ["title", title], ["list", list]] as const) {
    const buttons = text.match(/<button[\s\S]*?<\/button>/g) ?? [];
    assert.ok(buttons.length > 0, name);
    for (const button of buttons) assert.match(button, /<Pic|<svg|<Frac|<Weave/, `${name}: ${button.slice(0, 80)}`);
  }
  // the three leftover choices, which used to be words: each has its own drawing
  const choices = board.match(/className="sb-choice"[\s\S]*?<\/button>/g) ?? [];
  assert.equal(choices.length, 3);
  assert.ok(choices.every(choice => /<Pic/.test(choice)));
  // end buttons, the ➜ and every choice are at least 96 px tall
  const px = (selector: string) => { const rule = css.match(new RegExp(`${selector.replace(/[.]/g, "\\.")}\\{[^}]*\\}`)); const m = rule?.[0].match(/(?:min-)?height:(\d+)px/); return m ? Number(m[1]) : 0; };
  for (const selector of [".sb-big", ".sb-knife", ".sb-choice", ".sb-tile"]) assert.ok(px(selector) >= 96, `${selector} ${px(selector)}`);
  assert.ok(px(".sb-next") >= 96); assert.match(css, /\.sb-next\{[^}]*width:104px;height:104px/);
  assert.match(css, /\.sb-big\{[^}]*min-height:112px/);
  assert.match(css, /\.sb-end-actions\{display:grid;grid-template-columns:1fr 1fr/, "আবার খেলো and শেষ are equal");
  assert.match(css, /\.sb-seat\{[^}]*min-height:150px/);
});

test("GamePage with the kids frame, and the page keeps its title, H1 and parent note", () => {
  const page = read("page.tsx");
  assert.match(page, /<GamePage site=\{site\} kids title=\{site\.headline\} note=\{<ParentNote/);
  assert.doesNotMatch(page, /PageFrame|<Faq|<h1/);
  assert.match(read("components/game.tsx"), /const SLUG = 'shoman-bhag'/, "saved progress keeps its key");
  assert.match(read("components/game.tsx"), /useGamePlayer\(\{/);
  assert.equal(site.slug, "shoman-bhag"); assert.equal(site.headline, "মেহমান এসেছে, পিঠা সমান ভাগ করো");
  for (const text of Object.values(parentNote)) nfc(text);
});

test("no sound or slow toggle of its own, no pause button: the player's menu has them", () => {
  const game = read("components/game.tsx");
  assert.doesNotMatch(game, /SoundToggle|setSlow|useSound\(|aria-pressed/);
  assert.match(game, /player\.requestPause\(\)/);
});

test("motion respects ধীরে খেলো and prefers-reduced-motion, and never animates layout", () => {
  const css = read("product.css");
  assert.match(css, /\.sb\[data-slow\]/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css, /transition:\s*all/);
  assert.doesNotMatch(css, /@keyframes[^{]*\{[^}]*\{[^}]*(width|height|margin|padding|top|left)\s*:/, "keyframes use transform and opacity");
  const game = read("components/game.tsx");
  assert.match(game, /live\.current\.slow \|\| calm\(\)/, "the flying piece is skipped in slow mode and under reduced motion");
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ভাগ ও ভগ্নাংশ শেখার খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^একটা জিনিসকে কয়েকটা সমান ভাগ করলে/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ", "কথা শোনা"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  assert.equal(site.steps.length, 5);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
