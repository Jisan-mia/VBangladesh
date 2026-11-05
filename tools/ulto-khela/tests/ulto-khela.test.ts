import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parentNote, site } from "../content";
import { WORDS } from "../lib/pairs";
import { share } from "../share";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("every picture has its art, and every sort card too", () => {
  const art = readFileSync(join(root, "components/pics.tsx"), "utf8");
  for (const pic of Object.keys(WORDS)) assert.match(art, new RegExp(`\\n  ${pic}: \\(\\) =>`), pic);
  assert.match(art, /export function SortArt/); assert.match(art, /export function LaunchArt/); assert.match(art, /export function PairArt/);
  assert.doesNotMatch(art, /<img|href=|xlink/, "art is drawn in code and loads nothing");
});

test("the #og preview draws a fixed card and never touches storage, stars or play time", () => {
  const og = readFileSync(join(root, "components/og-card.tsx"), "utf8");
  assert.doesNotMatch(og, /localStorage|sessionStorage|indexedDB|useLevels|useKidsSession|atBreak|record\(|addToday/);
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /og \? <OgCard[^\n]*: <Play \/>/, "the game, with its stars and session clock, isn't rendered on #og");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
  nfc(share.preview("x").title); nfc(share.preview("x").description);
});

test("the page uses the shared player in kids mode with the parent note", () => {
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage site=\{site\} kids title=\{site\.headline\} note=\{<ParentNote/);
  assert.match(page, /<UltoGame \/>/);
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /useGamePlayer\(\{[\s\S]*onPause[\s\S]*onResume[\s\S]*onRestart[\s\S]*onLevels/);
  assert.doesNotMatch(game, /SoundToggle|useSound|setSlow/, "the player's menu owns sound and ধীরে খেলো");
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/ulto-khela/page.tsx")];
  assert.ok(sources.length >= 15);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("saved progress keeps its key and the dev hook is dev-only", () => {
  const game = readFileSync(join(root, "components/game.tsx"), "utf8");
  assert.match(game, /const SLUG = 'ulto-khela'/);
  assert.match(game, /useLevels\(SLUG, LEVEL_COUNT\)/);
  assert.match(game, /process\.env\.NODE_ENV === 'production'\) return/);
  assert.doesNotMatch(game, /localStorage/, "only the kit writes: stars and the daily time");
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("বিপরীত শব্দ"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^যে শব্দের মানে আরেকটা শব্দের ঠিক উল্টো/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ", "কয়টা ধাপ"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer]), ...Object.values(parentNote)]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন|IQ|জিনিয়াস/, "তুমি voice, no brain claims");
  }
});
