import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  botSpin, cardLine, cardSub, endLine, expected, hint, levelOf, methodLine, newRace, spin, spinValue, starsOf, step, tap, stepMode,
  LEVELS, LEVEL_COUNT, WORDS, bn, type Race,
} from "../lib/race";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});

/** Plays one whole race: the child taps right except for `missEvery`, আব্বু is the gentle bot. Returns the finished race. */
function play(level: number, seed: number, missEvery = 0) {
  const rng = makeRng(seed);
  let race = newRace(level), taps = 0, guard = 0;
  while (!race.over) {
    assert.ok(guard++ < 2000, "a race always ends");
    if (race.spin === null) { race = spin(race, race.turn === 1 ? botSpin(race, rng) : spinValue(rng)); continue; }
    if (race.auto || race.turn === 1) { race = race.auto ? step(race) : tap(race, 1, expected(race)!).race; continue; }
    const want = expected(race)!;
    taps++;
    race = tap(race, 0, missEvery && taps % missEvery === 0 ? (want === 1 ? 2 : want - 1) : want).race;
  }
  return race;
}

test("number words 1–20 are right, NFC and unique", () => {
  assert.equal(WORDS.slice(1).join(" "), "এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ বিশ");
  assert.equal(new Set(WORDS.slice(1)).size, 20);
  for (const word of WORDS) assert.equal(word, word.normalize("NFC"));
  assert.equal(bn(17), "১৭");
});

test("levels: a straight 1–10 board first, then 1–20, glow only at the start, unique titles", () => {
  assert.equal(LEVEL_COUNT, 5);
  assert.deepEqual(LEVELS.map(level => level.n), [10, 10, 10, 20, 20]);
  assert.deepEqual(LEVELS.map(level => level.mode), ["step", "step", "predict", "step", "predict"]);
  assert.deepEqual(LEVELS.map(level => level.glow), [true, false, false, false, false]);
  assert.equal(new Set(LEVELS.map(level => level.title)).size, LEVEL_COUNT);
  for (const level of LEVELS) assert.equal(level.title, level.title.normalize("NFC"));
  assert.equal(levelOf(0), LEVELS[0]);
  assert.equal(levelOf(99), LEVELS[LEVEL_COUNT - 1]);
});

test("a step turn: the child taps each ghat in order, then it is আব্বু's turn", () => {
  let race = spin(newRace(2), 2);
  assert.equal(race.target, 2);
  assert.equal(expected(race), 1);
  assert.equal(tap(race, 1, 1).outcome, "ignore", "the other boat can't move on the child's turn");
  race = tap(race, 0, 1).race;
  assert.deepEqual(race.pos, [1, 0]);
  assert.equal(expected(race), 2);
  race = tap(race, 0, 2).race;
  assert.deepEqual(race.pos, [2, 0]);
  assert.equal(race.turn, 1);
  assert.equal(race.spin, null);
  assert.equal(race.counted, 2);
});

test("a predict turn: tap where the boat stops, then it counts there by itself", () => {
  let race = spin(newRace(3), 2);
  assert.equal(expected(race), 2);
  const miss = tap(race, 0, 1);
  assert.equal(miss.outcome, "miss");
  race = tap(miss.race, 0, 2).race;
  assert.ok(race.auto);
  assert.equal(expected(race), null);
  race = step(race);
  assert.deepEqual(race.pos, [1, 0]);
  race = step(race);
  assert.deepEqual(race.pos, [2, 0]);
  assert.equal(race.turn, 1);
});

test("mistakes: wobble, then a ring, then the answer glows; misses never move a boat", () => {
  let race = spin(newRace(2), 1);
  assert.equal(hint(race), 0);
  race = tap(race, 0, 5).race;
  assert.equal(hint(race), 1);
  race = tap(race, 0, 5).race;
  assert.equal(hint(race), 2);
  assert.deepEqual(race.pos, [0, 0]);
  assert.equal(race.misses, 2);
  assert.equal(hint(spin(newRace(1), 1)), 2, "level 1 always glows");
});

test("three misses in a row quietly ease the game; five right in a row lift it again between turns", () => {
  let race = spin(newRace(3), 2);
  for (let index = 0; index < 3; index++) race = tap(race, 0, 9).race;
  assert.ok(race.eased);
  assert.ok(stepMode(race), "predict turns back into one ghat at a time");
  assert.equal(expected(race), 1);
  // Five right taps across turns, with আব্বু moving in between.
  let rights = 0;
  while (race.eased) {
    assert.ok(rights < 12, "eases off after five right taps");
    if (race.spin === null) { race = spin(race, 1); continue; }
    if (race.turn === 1) { race = step(race); continue; }
    race = tap(race, 0, expected(race)!).race;
    rights++;
  }
  assert.ok(rights >= 5);
  assert.equal(race.turn, 1, "the rule changed between turns, not under a finger");
});

test("the last ghat: a big spin stops at the end, the child's arrival ends the race", () => {
  let race: Race = { ...newRace(1), pos: [9, 3] };
  race = spin(race, 2);
  assert.equal(race.target, 10);
  race = tap(race, 0, 10).race;
  assert.ok(race.over);
  assert.equal(race.first, 0);
  assert.equal(endLine(race, "আব্বু"), "তোমার নৌকা আগে ১০ নম্বর ঘাটে পৌঁছাল!");
});

test("when আব্বু arrives first the child keeps playing to the end", () => {
  let race: Race = { ...newRace(1), pos: [5, 9], turn: 1 };
  race = step(spin(race, 1));
  assert.equal(race.first, 1);
  assert.equal(race.over, false);
  assert.equal(race.turn, 0);
  race = spin(race, 1);
  race = tap(race, 0, 6).race;
  assert.equal(race.turn, 0, "আব্বু has finished, so the child goes again");
  assert.equal(endLine({ ...race, first: 1 }, "আব্বু"), "আব্বুর নৌকা আগে পৌঁছাল। তোমারটাও এখন ১০ নম্বর ঘাটে।");
});

test("whole races end in a sensible number of turns, and the gentle আব্বু lets the child win most games", () => {
  let wins = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const race = play(1 + (seed % LEVEL_COUNT), seed);
    assert.equal(race.pos[0], race.n);
    assert.equal(race.counted, race.n);
    if (race.first === 0) wins++;
  }
  assert.ok(wins > 120 && wins < 195, `child won ${wins} of 200`);
});

test("spinners only give 1 or 2", () => {
  const rng = makeRng(7), race = newRace(1);
  const values = new Set(Array.from({ length: 500 }, () => [spinValue(rng), botSpin(race, rng)]).flat());
  assert.deepEqual([...values].sort(), [1, 2]);
});

test("stars record clean counting, not who won", () => {
  assert.equal(starsOf(0), 3);
  assert.equal(starsOf(1), 3);
  assert.equal(starsOf(2), 2);
  assert.equal(starsOf(4), 2);
  assert.equal(starsOf(5), 1);
  assert.equal(starsOf(play(2, 3, 2).misses), 1);
  assert.equal(starsOf(play(2, 3).misses), 3);
  assert.match(methodLine(play(2, 3)), /একটাও/);
  assert.match(methodLine(play(2, 3, 2)), /টা ঘাট গুনে এলে।$/);
});

test("card lines carry no name", () => {
  const today = { games: 3, counted: 30, n: 10 };
  assert.equal(cardLine(today), "আজ ১ থেকে ১০ গুনে গুনে নৌকা চালালাম");
  assert.equal(cardSub(today), "৩টা খেলা, ৩০টা ঘাট গোনা");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/dosh-ghater-nouka/page.tsx")];
  assert.ok(sources.length >= 8);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("সংখ্যা গণনা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^এক, দুই, তিন/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, ...site.steps, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
