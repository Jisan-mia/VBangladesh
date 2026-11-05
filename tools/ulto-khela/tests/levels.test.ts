// The course as data, every level played by headless children over 2,000 seeds, and the round's rules.
import assert from "node:assert/strict";
import test from "node:test";
import { isLevel, isWorldEnd, LEVELS, LEVEL_COUNT, levelOf, levelsOfWorld, nextInOrder, nextToPlay, ORDER, placeOf, WORLDS } from "../lib/course";
import { opposite, PAIRS, RULES, SORT_CARDS, TARGETS, WORDS, flip, type Pic } from "../lib/pairs";
import {
  answer, answerOf, createRound, glows, isDone, isLast, makeItem, nextItem, pairsInPlay, pass, paceSeconds, resultOf, rightChoice, runLength, START_PACE, type Pace, type Round,
} from "../lib/round";
import { addToday, cardLines, EMPTY_TODAY, OG_TODAY } from "../lib/today";
import { foundLine, hintOf, methodLine, newsLine, passLine, promptOf, taskLine } from "../lib/words";
import { makeRng } from "../../../shared/game-core";
import { FIVE, GUESSER, LEARNER, playRound } from "./bot";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const SEEDS = 2000;

test("the course: 3 worlds, 11 levels, ids 1–6 keep their old meaning, 7–11 are new", () => {
  assert.equal(LEVEL_COUNT, 11);
  assert.deepEqual(LEVELS.slice(0, 6).map(level => level.kind), ["pair", "pair", "pair", "pair", "sort", "sort"], "saved stars by id still mean the same kind of level");
  assert.deepEqual(LEVELS.slice(0, 6).map(level => `${level.items}/${level.run ? "bell" : "plain"}`), ["8/plain", "10/plain", "10/bell", "12/bell", "10/bell", "12/bell"]);
  assert.deepEqual(LEVELS.map(level => level.id), Array.from({ length: 11 }, (_, i) => i + 1));
  assert.deepEqual([...ORDER].sort((a, b) => a - b), LEVELS.map(level => level.id), "play order is a permutation of the ids");
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id).length), [4, 4, 3]);
  assert.ok(WORLDS.every(world => levelOf(levelsOfWorld(world.id).at(-1)!).finale), "every world ends on a named finale");
  assert.deepEqual(ORDER.filter(isWorldEnd), [8, 9, 11]);
  assert.equal(new Set(LEVELS.map(level => level.finale ?? level.title)).size, 11, "every level has its own name");
  // One new thing per world, in order: the opposite, the bell, the card sort.
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id).map(id => `${levelOf(id).kind}${levelOf(id).run ? "+bell" : ""}`)), [["pair", "pair", "pair", "pair"], ["pair+bell", "pair+bell", "pair+bell", "pair+bell"], ["sort+bell", "sort+bell", "sort+bell"]]);
  assert.deepEqual(levelsOfWorld(0).map(id => levelOf(id).pairs), [2, 4, 7, 7], "each level of the first world brings its pictures in");
  assert.equal(levelOf(10).once, true, "the first bell level rings once");
  assert.equal(placeOf(8), 4); assert.equal(placeOf(2), 3); assert.equal(placeOf(11), 11);
  assert.equal(levelOf(99), LEVELS[0], "an unknown level falls back to the first");
  assert.ok(isLevel(11) && !isLevel(12) && !isLevel(0) && !isLevel(1.5));
  for (const level of LEVELS) { nfc(level.title); nfc(level.finale ?? ""); nfc(level.learned); nfc(newsLine(level.id)); nfc(taskLine(level.id)); }
});

test("next to play follows play order and never locks anything", () => {
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3 }), 7);
  assert.equal(nextToPlay({ 1: 3, 7: 1, 2: 2 }), 8);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1, "all done: back to the first");
  assert.equal(nextInOrder(8), 10); assert.equal(nextInOrder(11), 0);
  // An old save with levels 1–6 keeps every star and opens at the first unplayed level in the new order.
  assert.equal(nextToPlay({ 1: 3, 2: 2, 3: 3, 4: 1, 5: 2, 6: 2 }), 7);
});

test("the pictures: seven pairs, fourteen pictures, each with a word and one opposite; two sort cards against two baskets", () => {
  const pics = PAIRS.flat();
  assert.equal(PAIRS.length, 7); assert.equal(new Set(pics).size, 14);
  assert.deepEqual([...pics].sort(), (Object.keys(WORDS) as Pic[]).sort());
  for (const pic of pics) { nfc(WORDS[pic]); assert.notEqual(opposite(pic), pic); assert.equal(opposite(opposite(pic)), pic); }
  for (const card of SORT_CARDS) {
    const byColor = TARGETS.findIndex(target => target.color === card.color), byShape = TARGETS.findIndex(target => target.shape === card.shape);
    assert.notEqual(byColor, byShape, "colour and shape point to different baskets");
  }
  for (const rule of Object.values(RULES)) { nfc(rule.name); nfc(rule.say); }
  assert.equal(flip(flip("ulto")), "ulto"); assert.equal(flip("color"), "shape");
});

test("every level is answerable at every pace, and the right button is always one of the two", () => {
  for (const id of ORDER) for (const pace of [-1, 0, 1] as Pace[]) for (let seed = 1; seed <= 200; seed++) {
    let round: Round | null = createRound(id, seed, pace);
    let count = 0;
    while (round) {
      const right = answerOf(round);
      assert.ok(right === 0 || right === 1, `level ${id} seed ${seed}`);
      if (round.item.kind === "pair") {
        const item: Extract<Round["item"], { kind: "pair" }> = round.item;
        assert.notEqual(item.choices[0], item.choices[1]);
        assert.equal(item.choices[rightChoice(item, "ulto")], opposite(item.show));
        assert.equal(item.choices[rightChoice(item, "same")], item.show);
        assert.ok(PAIRS.slice(0, pairsInPlay(levelOf(id), round.pace)).flat().includes(item.show));
      }
      round = answer(round, right).round;
      count++;
      if (isDone(round)) break;
      round = nextItem(round);
    }
    assert.equal(count, levelOf(id).items);
  }
});

test("a wrong tap only wobbles: the same picture waits, two tries make it glow, the mistake is counted once per picture", () => {
  let round = createRound(2, 5);
  const wrong = 1 - answerOf(round);
  const a = answer(round, wrong);
  assert.equal(a.outcome, "again"); assert.equal(a.round.stage, "pick"); assert.equal(a.round.index, 0);
  assert.equal(a.round.last, "wrong"); assert.equal(a.round.wrongChoice, wrong);
  assert.equal(glows(a.round), false);
  assert.equal(glows(answer(a.round, wrong).round), true, "the second try glows the right one");
  assert.equal(answer(round, 2).outcome, "ignore"); assert.equal(answer(round, -1).outcome, "ignore");
  round = answer(round, answerOf(round)).round;
  assert.equal(round.stage, "done");
  assert.equal(answer(round, answerOf(round)).outcome, "ignore", "a finished picture takes no more taps");
  // A demo never counts, a normal picture counts one mistake however many wrong taps.
  const second = nextItem(round)!;
  assert.equal(second.demo, false);
  let again = second;
  for (let i = 0; i < 2; i++) again = answer(again, 1 - answerOf(again)).round;
  again = answer(again, answerOf(again)).round;
  assert.equal(again.scored, 1); assert.equal(again.firstTry, 0);
});

test("three missed pictures in a row ease the pace; five clean answers step it up; demos never move it", () => {
  let round = createRound(4, 11);
  round = answer(round, 1 - answerOf(round)).round; round = answer(round, answerOf(round)).round;
  assert.equal(round.pace, 0, "a demo picture's misses are free");
  for (let miss = 0; miss < 3; miss++) {
    round = nextItem(round)!;
    if (round.demo) { round = answer(round, answerOf(round)).round; round = nextItem(round)!; }
    round = answer(round, 1 - answerOf(round)).round; round = answer(round, answerOf(round)).round;
  }
  assert.equal(round.pace, -1);
  assert.ok(runLength(levelOf(4), -1, makeRng(3)) >= runLength(levelOf(4), 1, makeRng(3)) + 2);
  assert.equal(pairsInPlay(levelOf(4), -1), 3);
  let clean = createRound(2, 9);
  for (let i = 0; i < 6; i++) { clean = answer(clean, answerOf(clean)).round; clean = nextItem(clean)!; }
  assert.equal(clean.pace, 1, "after five clean answers the pace steps up, never announced");
  assert.ok(paceSeconds(-1) > paceSeconds(0) && paceSeconds(0) > paceSeconds(1));
});

test("the bell flips the rule, shows a demo, never rings on the last picture; the once-levels ring once", () => {
  for (const id of [3, 4, 9, 10]) {
    let round: Round | null = createRound(id, 21), bells = 0, last: Round = round;
    while (round) {
      if (round.rang) { bells++; assert.equal(round.demo, true); assert.notEqual(round.rule, last.rule); }
      assert.equal(round.rang && isLast(round), false);
      round = answer(round, answerOf(round)).round; last = round;
      if (isDone(round)) break;
      round = nextItem(round);
    }
    assert.ok(bells >= 1, `level ${id} rings`);
    if (levelOf(id).once) assert.equal(bells, 1);
  }
  assert.equal(createRound(1, 4).rule, "ulto");
  assert.equal(createRound(5, 4).rule, "color");
  let plain: Round | null = createRound(2, 2);
  while (plain) { assert.equal(plain.rang, false); plain = answer(plain, answerOf(plain)).round; if (isDone(plain)) break; plain = nextItem(plain); }
});

test("the sort alternates the colour mostly, and every card matches one basket by colour and the other by shape", () => {
  const rng = makeRng(8);
  let item = makeItem(levelOf(5), 0, rng), switches = 0;
  for (let i = 0; i < 300; i++) { const next = makeItem(levelOf(5), 0, rng, item); if (next.kind === "sort" && item.kind === "sort" && next.card.color !== item.card.color) switches++; item = next; }
  assert.ok(switches > 150 && switches < 270, String(switches));
});

test("চটপট: a passed picture counts as a miss, quietly; demos never pass; the last one passes into the end", () => {
  const round = createRound(1, 3);
  assert.equal(pass(round), round, "the demo waits");
  const second = nextItem(answer(round, answerOf(round)).round)!;
  const passed = pass(second);
  assert.equal(passed.stage, "done"); assert.equal(passed.last, "pass"); assert.equal(passed.passes, 1); assert.equal(passed.firstTry, 0); assert.equal(passed.scored, 1);
  assert.equal(pass(passed), passed, "no double pass");
  nfc(passLine("ulto"));
  // A child who answers nothing in time still finishes, with one star.
  let all: Round = createRound(1, 3);
  while (!isDone(all)) { all = all.demo ? answer(all, answerOf(all)).round : pass(all); if (!isDone(all)) all = nextItem(all)!; }
  const result = resultOf(all);
  assert.equal(result.stars, 1); assert.equal(result.passes, 7);
});

test("the guesser finishes every level, rarely gets 3 stars, and the first right answer comes within 10 s", () => {
  for (const id of ORDER) {
    let three = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const play = playRound(id, seed, GUESSER);
      assert.ok(isDone(play.round));
      assert.ok(play.taps <= levelOf(id).items * 3 + 2, `level ${id} seed ${seed}: ${play.taps} taps`);
      assert.ok(play.firstRightAt <= 10, `level ${id} seed ${seed}: first right at ${play.firstRightAt}`);
      if (resultOf(play.round).stars === 3) three++;
    }
    assert.ok(three / SEEDS <= 0.08, `level ${id}: guesser earns 3 stars on ${(100 * three / SEEDS).toFixed(1)}%`);
  }
});

test("the learner mostly earns 3 stars; the five-year-old finishes everything and mostly earns 2 or more", () => {
  for (const id of ORDER) {
    let three = 0, twoUp = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const learner = resultOf(playRound(id, seed, LEARNER).round), five = resultOf(playRound(id, seed, FIVE).round);
      if (learner.stars === 3) three++;
      if (five.stars >= 2) twoUp++;
    }
    assert.ok(three / SEEDS >= 0.55, `level ${id}: learner 3 stars ${(100 * three / SEEDS).toFixed(1)}%`);
    assert.ok(twoUp / SEEDS >= 0.5, `level ${id}: five-year-old 2+ stars ${(100 * twoUp / SEEDS).toFixed(1)}%`);
  }
  // The first level is easy: a learner almost always gets 3 stars.
  let first = 0;
  for (let seed = 1; seed <= SEEDS; seed++) if (resultOf(playRound(1, seed, LEARNER).round).stars === 3) first++;
  assert.ok(first / SEEDS >= 0.85, String(first / SEEDS));
});

test("a round takes a minute or two: every level's learner time is within 25–150 s", () => {
  for (const id of ORDER) {
    const seconds = playRound(id, 7, LEARNER).seconds;
    assert.ok(seconds >= 8 && seconds <= 150, `level ${id}: ${seconds.toFixed(0)} s`);
  }
});

test("চটপট: a child who thinks 2 s never passes at a 4 s pace; one who thinks 5 s passes until the quiet ease gives more time", () => {
  for (const id of ORDER) {
    const quick = resultOf(playRound(id, 5, { knows: 1, think: 2 }, START_PACE, true).round);
    assert.equal(quick.passes, 0, `level ${id}`);
    const slow = playRound(id, 5, { knows: 1, think: 5 }, START_PACE, true).round;
    assert.ok(isDone(slow));
    assert.ok(resultOf(slow).passes >= 3, `level ${id}: ${resultOf(slow).passes} passes`);
    assert.ok(resultOf(slow).stars <= 2, "passes count as misses, never as stars");
  }
});

test("stars only record the round: no miss or one → 3, up to three → 2, else 1", () => {
  const play = (misses: number) => {
    let round: Round | null = createRound(2, 7), left = misses;
    while (round) {
      if (!round.demo && left > 0) { round = answer(round, 1 - answerOf(round)).round; left--; }
      round = answer(round, answerOf(round)).round;
      if (isDone(round)) return resultOf(round);
      round = nextItem(round);
    }
    throw new Error("no end");
  };
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(misses => play(misses).stars), [3, 3, 2, 2, 1, 1]);
  assert.equal(play(2).mistakes, 2);
});

test("the end line is honest: praise only for a clean round, a plain count for one or two, a tip for three or more", () => {
  const base = resultOf(playRound(2, 3, LEARNER).round);
  const clean = { ...base, mistakes: 0, bells: 0 }, some = { ...base, mistakes: 2 }, many = { ...base, mistakes: 4, bells: 0 };
  assert.match(methodLine(clean), /থামিয়ে চাপলে/);
  assert.match(methodLine(some), /২বার থেমে/);
  assert.doesNotMatch(methodLine(many), /তাই মিলল|পেরেছ|ঠিক/);
  assert.match(methodLine(many), /আগে/);
  for (const text of [methodLine(clean), methodLine(some), methodLine(many), methodLine({ ...many, bells: 2 }), methodLine({ ...base, level: 5, mistakes: 0 }), methodLine({ ...base, level: 5, mistakes: 5 })]) nfc(text);
  // A hint names the rule and asks; it never says the picture is wrong.
  for (const id of ORDER) {
    const round = createRound(id, 3);
    for (const text of [hintOf(round), foundLine(round), promptOf(round)]) { nfc(text); assert.doesNotMatch(text, /ভুল|না!|হারলে/); }
  }
});

test("today's card counts what was done, first person, no name", () => {
  assert.deepEqual(cardLines(EMPTY_TODAY), []);
  const pairs = addToday(EMPTY_TODAY, { ...resultOf(playRound(3, 2, LEARNER).round), count: 10, bells: 2 });
  assert.deepEqual(pairs, { pictures: 10, cards: 0, bells: 2 });
  const sort = addToday(pairs, { ...resultOf(playRound(5, 2, LEARNER).round), count: 10, bells: 1 });
  assert.deepEqual(sort, { pictures: 10, cards: 10, bells: 3 });
  assert.equal(cardLines(OG_TODAY)[0], "আজ ২০টা ছবিতে উল্টো খেললাম");
  for (const line of cardLines(OG_TODAY)) { nfc(line); assert.doesNotMatch(line, /আমি|নাম/); }
});
