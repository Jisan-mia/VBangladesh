import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { cardText } from "../lib/draw-card";
import { bothRead, empty, finish, isRead, nextUnread, readCount, readProgress, todayOf } from "../lib/progress";
import { PEOPLE, STORIES, STORY_IDS, lastMood, pathOf, whose, type Panel } from "../lib/stories";
import { parentNote, site } from "../content";
import { share } from "../share";

const panels = (): Panel[] => STORIES.flatMap(story => [...story.intro, ...story.choices.flatMap(choice => choice.panels)]);
const words = () => STORIES.flatMap(story => [story.title, story.question, ...panels().map(panel => panel.text), ...story.choices.flatMap(choice => [choice.label, choice.talk])]);
const PLACES = new Set(["class", "home", "uthan", "roof", "math", "goli", "stairs"]);
const MOODS = new Set(["happy", "sad", "worried", "calm", "surprised", "shy"]);

test("8–10 stories, each with one turn, two sides, and 4–6 panels on every path", () => {
  assert.ok(STORIES.length >= 8 && STORIES.length <= 10);
  assert.equal(new Set(STORY_IDS).size, STORIES.length);
  assert.equal(new Set(STORIES.map(story => story.title)).size, STORIES.length);
  for (const story of STORIES) {
    assert.equal(story.choices.length, 2, story.id);
    assert.ok(story.intro.length >= 2, `${story.id}: a start before the turn`);
    for (const side of [0, 1] as const) {
      const length = pathOf(story, side).length;
      assert.ok(length >= 4 && length <= 6, `${story.id} side ${side}: ${length} panels`);
      assert.ok(story.choices[side].panels.length >= 1);
    }
    assert.notEqual(story.choices[0].label, story.choices[1].label);
    assert.ok(story.question.endsWith("?"), story.id);
  }
});

test("every panel has a known place, a known cast with a face, real props and words", () => {
  for (const story of STORIES) {
    assert.ok(PEOPLE[story.hero] && PEOPLE[story.other], story.id);
    assert.notEqual(story.hero, story.other);
    assert.ok([...story.intro, ...story.choices.flatMap(choice => choice.panels)].some(panel => panel.cast.some(actor => actor[0] === story.other)), `${story.id}: the other person appears`);
    for (const panel of [...story.intro, ...story.choices.flatMap(choice => choice.panels)]) {
      assert.ok(PLACES.has(panel.place), panel.text);
      assert.ok(panel.cast.length >= 1, panel.text);
      for (const [who, mood, x] of panel.cast) {
        assert.ok(PEOPLE[who], `${who} in ${story.id}`);
        assert.ok(MOODS.has(mood));
        assert.ok(x >= 0 && x <= 320);
      }
      assert.equal(new Set(panel.cast.map(actor => actor[0])).size, panel.cast.length, `${panel.text}: nobody twice`);
      for (const [, x, y] of panel.props ?? []) assert.ok(x >= 0 && x <= 320 && y >= 0 && y <= 200, panel.text);
      assert.ok(panel.text.length > 10 && panel.text.length < 140, panel.text);
    }
    assert.ok(MOODS.has(lastMood(story, 0)) && MOODS.has(lastMood(story, 1)));
  }
});

test("Bangla is NFC, panel text is unique, and nothing preaches or scores", () => {
  for (const text of [...words(), ...Object.values(parentNote), site.title, site.description, site.lead, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"), text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/, text);
  }
  const texts = panels().map(panel => panel.text);
  assert.equal(new Set(texts).size, texts.length);
  for (const text of words()) assert.doesNotMatch(text, /মনে রাখবে|তাই সবসময়|উচিত|ঠিক কাজ|ভুল কাজ|শাবাশ|সঠিক|!/, text);
  // Endings are pictures, not lessons: every path's last line is a plain statement.
  for (const story of STORIES) for (const choice of story.choices) assert.match(choice.panels.at(-1)!.text, /[।”]$/, story.id);
});

test("the cast is mixed: girls and boys lead, a wheelchair and glasses appear, every name is unique", () => {
  const heroes = STORIES.map(story => PEOPLE[story.hero]);
  assert.ok(heroes.filter(person => person.dress).length >= 3, "girls lead stories");
  assert.ok(heroes.filter(person => !person.dress).length >= 3, "boys lead stories");
  const used = new Set(panels().flatMap(panel => panel.cast.map(actor => actor[0])));
  assert.ok([...used].some(who => PEOPLE[who].wheelchair));
  assert.ok([...used].some(who => PEOPLE[who].glasses));
  for (const who of Object.keys(PEOPLE)) assert.ok(used.has(who), `${who} is drawn somewhere`);
  const names = Object.values(PEOPLE).map(person => person.name);
  assert.equal(new Set(names).size, names.length);
});

test("progress: read marks only, sides deduped, today resets on a new day, junk is dropped", () => {
  let progress = empty();
  assert.equal(nextUnread(progress), STORY_IDS[0]);
  progress = finish(progress, "tiffin", 1, "2026-10-15");
  progress = finish(progress, "tiffin", 1, "2026-10-15");
  assert.deepEqual(progress.read.tiffin, [1]);
  assert.ok(isRead(progress, "tiffin") && !bothRead(progress, "tiffin"));
  progress = finish(progress, "tiffin", 0, "2026-10-15");
  assert.deepEqual(progress.read.tiffin, [0, 1]);
  assert.ok(bothRead(progress, "tiffin"));
  assert.equal(nextUnread(progress), STORY_IDS[1]);
  progress = finish(progress, "cup", 0, "2026-10-15");
  assert.deepEqual(todayOf(progress, "2026-10-15"), ["tiffin", "cup"]);
  assert.deepEqual(todayOf(progress, "2026-10-16"), []);
  progress = finish(progress, "aam", 0, "2026-10-16");
  assert.deepEqual(progress.today, ["aam"]);
  assert.equal(readCount(progress), 3);

  const back = readProgress(JSON.stringify(progress));
  assert.deepEqual(back, progress);
  assert.deepEqual(readProgress("{oops"), empty());
  assert.deepEqual(readProgress(null), empty());
  const junk = readProgress(JSON.stringify({ read: { tiffin: [0, 0, 5, "x"], hacked: [0], __proto__: [1] }, day: "yesterday", today: ["tiffin"], stars: 3 }));
  assert.deepEqual(junk, { read: { tiffin: [0] }, day: "", today: [] });
  assert.ok(!("stars" in junk), "no stars or score anywhere");
});

test("all stories read means no ghost finger target", () => {
  let progress = empty();
  for (const id of STORY_IDS) progress = finish(progress, id, 0, "2026-10-15");
  assert.equal(nextUnread(progress), null);
  assert.equal(readCount(progress), STORIES.length);
});

test("the parent card says what was read today, with no name and no score", () => {
  let progress = finish(empty(), "tiffin", 0, "2026-10-15");
  progress = finish(progress, "tiffin", 1, "2026-10-15");
  progress = finish(progress, "ghuri", 0, "2026-10-15");
  const text = cardText(todayOf(progress, "2026-10-15"), progress);
  assert.equal(text.headline, "আজ ২টা গল্প পড়লাম");
  assert.equal(text.sub, "১টায় দুই মোড়ই দেখলাম");
  assert.deepEqual(text.rows.map(row => [row.title, row.both]), [["পড়ে যাওয়া টিফিন", true], ["লাল ঘুড়ি", false]]);
  assert.equal(cardText([], empty()).headline, "আজ গল্পের মোড়ে ছিলাম");
  const many = STORY_IDS.reduce((acc, id) => finish(acc, id, 0, "2026-10-15"), empty());
  assert.equal(cardText(many.today, many).rows.length, 5, "the card list stops before the footer band");
});

test("possessive names read right, including মং", () => {
  assert.equal(whose("তানিম"), "তানিমের");
  assert.equal(whose("নানু"), "নানুর");
  assert.equal(whose("মং"), "মংয়ের");
  for (const story of STORIES) assert.doesNotMatch(whose(PEOPLE[story.other].name), /ংে/);
});

test("share: no result links and no tally", () => {
  assert.equal(share.normalize(""), null);
  assert.equal(share.normalize("s=1&t=3&n=রাফি"), null);
  assert.equal(share.tally, undefined);
  assert.match(share.preview("").title, /গল্পের মোড়/);
});

test("the tool's source never calls fetch or imports share-client", () => {
  const root = join(import.meta.dirname, "..");
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.(ts|tsx)$/.test(name)) files.push(path); } };
  walk(root);
  files.push(join(root, "../../app/golper-mor/page.tsx"));
  assert.ok(files.length >= 7);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, file);
    assert.doesNotMatch(source, /share-client|\/api\/|XMLHttpRequest|sendBeacon|WebSocket/, file);
  }
});

test("content: SEO limits, unique H1, at least 6 FAQs with the must-have questions", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("ছোটদের নৈতিক গল্প"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^৯টা গল্প/);
  for (const question of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === question), question);
  assert.equal(site.privacy.length, 1);
  assert.match(site.privacy[0], /এই ফোনের ব্রাউজারে/);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
});
