import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  addToday, answerOf, cardLines, cut, decide, doneLine, EMPTY_TODAY, endLine, FOOD_NAME, FRACTIONS, GUESTS, glows, guestsFor, hintLine, hintTarget, ITEMS,
  LEFTOVER_AT, LEVELS, LEVEL_COUNT, LITTLE, makeItem, moods, newRound, nextItem, perRange, pick, praiseLine, question, roundStars, SHARE_FOODS, specOf,
  tapBasket, tapPlate, target, type Leftover, type Round,
} from "../lib/game";
import { cutLines, faceArt, FOOD_ART, pieceArt, wedge } from "../lib/shapes";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const give = (round: Round, plate: number) => tapPlate(tapBasket(round).round, plate);

/** Plays the serving on screen. `misses` overfills a plate (then fixes it) or gives wrong answers first. */
function solve(round: Round, misses = 0, leftover: Leftover = "share"): Round {
  const item = round.item;
  if (item.kind === "share") {
    for (let miss = 0; miss < misses; miss++) {
      // Fill plate 0 one past its share, then move the extra one to the emptiest plate.
      while (round.plates[0] <= target(round)) round = give(round, 0).round;
      round = tapPlate(round, 0).round;
      round = tapPlate(round, 1).round;
    }
    for (let guard = 0; round.stage === "share" && guard < 200; guard++) {
      const low = round.plates.indexOf(Math.min(...round.plates));
      if (round.plates.some(count => count > target(round))) { const high = round.plates.findIndex(count => count > target(round)); round = tapPlate(tapPlate(round, high).round, low).round; }
      else round = give(round, low).round;
    }
    if (round.stage === "left") round = decide(round, leftover).round;
    if (round.stage === "cut") {
      for (let miss = 0; miss < misses; miss++) round = cut(round, item.guests.length === 2 ? 3 : 2).round;
      round = cut(round, item.guests.length).round;
      for (let plate = 0; plate < item.guests.length; plate++) round = tapPlate(round, plate).round;
    }
    return round;
  }
  for (let miss = 0; miss < misses; miss++) round = pick(round, item.kind === "fair" ? 1 - answerOf(round) : answerOf(round) === 2 ? 3 : 2).round;
  return pick(round, answerOf(round)).round;
}
function play(level: number, misses = 0, seed = 7, leftover: Leftover = "share") {
  let round = newRound(level, false, 0, seed);
  for (let guard = 0; guard < ITEMS + 1; guard++) {
    round = solve(round, misses, leftover);
    assert.equal(round.stage, "done");
    const next = nextItem(round);
    if (!next) return round;
    round = next;
  }
  throw new Error("a round always ends");
}

test("content data: foods, guests and fractions are complete, NFC and distinct", () => {
  for (const food of [...SHARE_FOODS, "ruti" as const]) { assert.ok(FOOD_ART[food].length > 0, food); nfc(FOOD_NAME[food]); }
  assert.equal(new Set(Object.values(FOOD_NAME)).size, 5);
  assert.deepEqual(SHARE_FOODS.map(food => FOOD_NAME[food]), ["পিঠা", "আম", "মোয়া", "জিলাপি"]);
  const names = [...GUESTS, ...LITTLE].map(guest => guest.name);
  assert.equal(new Set(names).size, names.length);
  names.forEach(nfc);
  assert.ok(LITTLE.every(guest => guest.small) && GUESTS.every(guest => !guest.small));
  assert.deepEqual([2, 3, 4].map(parts => FRACTIONS[parts].word), ["অর্ধেক", "তিন ভাগের এক ভাগ", "চার ভাগের এক ভাগ"]);
  for (const parts of [2, 3, 4]) { nfc(FRACTIONS[parts].word); nfc(FRACTIONS[parts].school); assert.equal(cutLines(parts).split("M").length - 1, parts); }
  assert.ok(wedge(4, 0).startsWith("M50 50L50 8A42 42"), "the first piece points up");
  for (const guest of [...GUESTS, ...LITTLE]) for (const mood of ["wait", "smile", "happy", "sad", "oh"] as const) assert.ok(faceArt(guest, mood).length >= 4);
  assert.equal(pieceArt(3).length, 1);
});

test("difficulty steps: 2 plates → 3 → 4, then cutting, then naming", () => {
  assert.equal(LEVEL_COUNT, 5);
  assert.deepEqual(LEVELS.map(spec => spec.kind), ["share", "share", "share", "cut", "name"]);
  assert.deepEqual(LEVELS.slice(0, 3).map(spec => spec.plates), [2, 3, 4]);
  for (const spec of LEVELS) nfc(spec.label);
  for (let level = 1; level <= 3; level++) {
    assert.ok(perRange(level, true)[1] < perRange(level, false)[1], "the ease serves less");
  }
});

test("every serving is complete and solvable in every step, eased or not", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const eased of [false, true]) for (let seed = 1; seed <= 200; seed++) for (let index = 0; index < ITEMS; index++) {
    const item = makeItem(level, makeRng(seed), eased, index), spec = specOf(level);
    if (item.kind === "share") {
      const n = item.guests.length, [low, high] = perRange(level, eased);
      if (spec.kind === "share") assert.equal(n, spec.plates);
      assert.ok(n >= 2 && n <= 4);
      assert.equal(new Set(item.guests.map(guest => guest.name)).size, n, "no guest twice at a table");
      assert.equal(item.guests.filter(guest => guest.small).length, 1, "one youngest at every table");
      assert.equal(item.extra, spec.kind === "cut" || index === LEFTOVER_AT ? 1 : 0);
      assert.equal(item.cut, spec.kind === "cut");
      const per = (item.total - item.extra) / n;
      assert.ok(Number.isInteger(per) && per >= low && per <= high, `${level}/${index}: ${item.total} for ${n}`);
      assert.ok(item.total <= 13, "fits the basket");
      if (eased && item.cut) assert.ok(n === 2 || n === 4, "the ease cuts halves and quarters");
    } else if (item.kind === "name") {
      assert.ok(item.choices.includes(item.parts));
      assert.ok(item.shaded >= 0 && item.shaded < item.parts);
      assert.equal(item.choices.length, eased ? 2 : 3);
      assert.deepEqual([...item.choices].sort(), item.choices);
    } else {
      assert.equal(index, LEFTOVER_AT);
      assert.ok(item.parts === 2 || item.parts === 4);
      assert.ok(item.fairSide === 0 || item.fairSide === 1);
    }
    const round = solve(newRound(level, eased, 0, seed));
    assert.equal(round.stage, "done");
    nfc(question(newRound(level, eased, 0, seed)));
    nfc(doneLine(round));
  }
  // The cutting step meets halves, thirds and quarters in one round.
  const plates = Array.from({ length: ITEMS }, (_, index) => makeItem(4, makeRng(3), false, index)).map(item => item.kind === "share" ? item.guests.length : 0);
  assert.deepEqual([...new Set(plates.slice(0, 3))].sort(), [2, 3, 4]);
});

test("sharing: lift from the basket, drop on a plate; take back; a plate past its share is a gentle miss", () => {
  let round = newRound(1, false, 0, 11);
  if (round.item.kind !== "share") throw new Error("share");
  assert.equal(tapPlate(round, 0).event, "ignore", "an empty plate has nothing to lift");
  let step = tapBasket(round);
  assert.equal(step.event, "pick"); assert.equal(step.round.hand, "basket");
  assert.equal(tapBasket(step.round).round.hand, null, "tap the basket again to put it down");
  step = tapPlate(step.round, 0);
  assert.equal(step.event, "drop");
  round = step.round;
  assert.deepEqual(round.plates, [1, 0]); assert.equal(round.basket, round.item.kind === "share" ? round.item.total - 1 : 0);
  assert.deepEqual(moods(round), ["smile", "sad"], "less than someone else looks sad");
  // Lift from a plate and move it.
  round = tapPlate(round, 0).round; assert.equal(round.hand, 0);
  round = tapPlate(round, 1).round; assert.deepEqual(round.plates, [0, 1]);
  round = tapPlate(round, 1).round; round = tapBasket(round).round;
  assert.deepEqual(round.plates, [0, 0], "back in the basket");
  // Overfill plate 0.
  while (round.plates[0] < target(round)) round = give(round, 0).round;
  assert.equal(round.tries, 0);
  step = give(round, 0);
  assert.equal(step.event, "over");
  assert.equal(step.round.clean, false); assert.equal(step.round.tries, 1);
  assert.equal(moods(step.round)[0], "oh");
  assert.deepEqual(hintTarget(step.round), { plate: 0 }, "the ghost points at the full plate");
  assert.match(hintLine(step.round, "over"), /বেশি হয়ে গেল/);
  const done = solve(step.round);
  assert.equal(done.stage, "done"); assert.equal(done.firstTry, 0);
  assert.deepEqual(moods(done), ["happy", "happy"]);
});

test("the last one: every choice is fine, only the faces change, stars stay the same", () => {
  let round = newRound(2, false, 0, 5);
  for (let index = 0; index < LEFTOVER_AT; index++) round = nextItem(solve(round))!;
  if (round.item.kind !== "share") throw new Error("share");
  let fair = round;
  for (let guard = 0; fair.stage === "share"; guard++) fair = give(fair, guard % 3).round;
  assert.equal(fair.stage, "left");
  assert.equal(fair.basket, 1);
  assert.match(question(fair), /^শেষ .+টা কে পাবে\?$/);
  const youngest = fair.item.kind === "share" ? fair.item.guests.findIndex(guest => guest.small) : -1;
  const faces = (choice: Leftover) => moods(decide(fair, choice).round);
  assert.deepEqual(faces("share"), ["happy", "happy", "happy"]);
  assert.deepEqual(faces("keep"), ["smile", "smile", "smile"]);
  assert.equal(faces("small")[youngest], "happy");
  assert.equal(faces("small").filter(mood => mood === "smile").length, 2);
  assert.deepEqual(faces(1), ["sad", "happy", "sad"]);
  assert.deepEqual(moods(tapPlate(fair, 1).round), ["sad", "happy", "sad"], "tapping a plate gives it there");
  for (const choice of ["share", "small", "keep", 0] as Leftover[]) {
    const after = decide(fair, choice).round;
    assert.equal(after.stage, "done"); assert.equal(after.firstTry, fair.firstTry + 1, "no choice costs a star");
    const line = doneLine(after);
    nfc(line);
    assert.doesNotMatch(line, /ঠিক|ভুল|ভালো|উচিত/, "no verdict");
  }
  assert.equal(decide(fair, 9).event, "ignore");
});

test("cutting: one piece per guest; a wrong cut says why; the piece is named", () => {
  let round = newRound(4, false, 0, 2);
  round = nextItem(solve(round))!;
  if (round.item.kind !== "share") throw new Error("share");
  const n = round.item.guests.length;
  for (let guard = 0; round.stage === "share"; guard++) round = give(round, guard % n).round;
  assert.equal(round.stage, "cut");
  assert.deepEqual(hintTarget(round), { cut: n });
  const wrong = cut(round, n === 2 ? 4 : 2);
  assert.equal(wrong.event, "again");
  assert.match(hintLine(round, "again", n === 2 ? 4 : 2), /^টুকরো হতো [২৪]টা, মেহমান [২৩৪] জন।$/);
  let step = cut(wrong.round, n);
  assert.equal(step.event, "right"); assert.equal(step.round.stage, "give"); assert.equal(step.round.cutInto, n);
  round = step.round;
  for (let plate = 0; plate < n; plate++) {
    assert.deepEqual(hintTarget(round), { plate });
    step = tapPlate(round, plate);
    assert.equal(tapPlate(step.round, plate).event, "ignore", "one piece each");
    round = step.round;
  }
  assert.equal(round.stage, "done");
  assert.equal(doneLine(round), `প্রত্যেকে পেল ${new Intl.NumberFormat("bn-BD").format(target(round))}টা রুটি আর ${FRACTIONS[n].word}।`);
});

test("naming: a miss costs a try, two tries make the answer glow, three in a row quietly ease the next card", () => {
  let round = newRound(5, false, 0, 4);
  const right = answerOf(round), wrongValue = right === 2 ? 3 : 2;
  round = pick(round, wrongValue).round;
  assert.equal(glows(round), false);
  assert.equal(hintLine(round, "again"), "রুটিটা কয় টুকরো, গুনে দেখো।");
  round = pick(round, wrongValue).round;
  assert.equal(glows(round), true);
  round = pick(round, wrongValue).round;
  assert.ok(round.eased, "three misses in a row");
  const item = round.item;
  const step = pick(round, right);
  assert.equal(step.event, "right"); assert.equal(step.round.item, item, "nothing changes under the finger");
  const next = nextItem(step.round)!;
  if (next.item.kind === "name") assert.equal(next.item.choices.length, 2);
  // The fair card.
  let fair = nextItem(next.stage === "pick" ? solve(next) : next)!;
  if (fair.item.kind !== "fair") throw new Error("fair");
  fair = pick(fair, 1 - fair.item.fairSide).round;
  assert.equal(hintLine(fair, "again"), "ওই রুটির টুকরোগুলো ছোট-বড়।");
});

test("five first-try servings lift the ease", () => {
  let round = newRound(2, true, 0, 9);
  for (let index = 0; index < ITEMS - 1; index++) { round = solve(round); assert.ok(round.eased); round = nextItem(round)!; }
  round = solve(round);
  assert.equal(round.rightRun, 4); assert.ok(round.eased);
  const again = solve(newRound(round.level, round.eased, round.rightRun, 3));
  assert.equal(again.rightRun, 5); assert.equal(again.eased, false);
});

test("a round is four servings, then it waits; stars only record it", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const round = play(level);
    assert.equal(round.index, ITEMS - 1);
    assert.equal(nextItem(round), null, "never auto-advances past the round");
    assert.equal(round.firstTry, ITEMS);
    assert.equal(roundStars(round.firstTry), 3);
    assert.ok(praiseLine(round).length > 0);
    nfc(endLine(round));
    const messy = play(level, 1);
    assert.equal(messy.firstTry, 0);
    assert.equal(praiseLine(messy), "", "no praise for a hard round");
  }
  assert.deepEqual([0, 1, 2, 3, 4].map(roundStars), [1, 1, 2, 2, 3]);
  assert.equal(endLine(play(1)), `${new Intl.NumberFormat("bn-BD").format(8)} জন মেহমান সমান ভাগ পেল।`);
  assert.equal(endLine(play(5)), "৪টা ভাগের নাম বললে।");
  assert.match(endLine(play(4)), /^৪টা রুটি কেটে [০-৯]+ জনকে সমান দিলে।$/);
  // The last-piece choice never changes the stars.
  assert.equal(play(1, 0, 7, 0).firstTry, play(1, 0, 7, "keep").firstTry);
});

test("tables: the youngest moves seat; guests never repeat", () => {
  for (let n = 2; n <= 4; n++) for (let index = 0; index < 6; index++) {
    const guests = guestsFor(n, index);
    assert.equal(guests.length, n);
    assert.equal(guests.findIndex(guest => guest.small), index % n);
  }
});

test("today's card counts what was done, first person, no name", () => {
  let today = addToday(EMPTY_TODAY, play(1));
  assert.deepEqual(cardLines(today), ["আজ ৮ জন মেহমানকে সমান ভাগ দিলাম"]);
  today = addToday(today, play(4, 0, 3));
  assert.equal(today.cuts.length, 4);
  const lines = cardLines(today);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /^৪টা রুটি কেটে অর্ধেক, তিন ভাগের এক ভাগ আর চার ভাগের এক ভাগ বানালাম$/);
  assert.deepEqual(cardLines({ ...EMPTY_TODAY, named: 4 }), ["আজ ৪টা ভাগের নাম বললাম"]);
  assert.deepEqual(cardLines(EMPTY_TODAY), []);
  for (const line of lines) assert.ok(![...GUESTS, ...LITTLE].some(guest => line.includes(guest.name)));
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/shoman-bhag/page.tsx")];
  assert.ok(sources.length >= 10);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ভাগ ও ভগ্নাংশ শেখার খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^একটা জিনিসকে কয়েকটা সমান ভাগ করলে/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
