import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, LEVEL_COUNT, ORDER, WORLDS, isLevel, isWorldEnd, levelOf, levelsOfWorld, minutesOf, nextInOrder, nextToPlay, placeOf } from "../lib/levels";
import {
  GLOW_AFTER, START_PACE, cardKey, check, choiceCount, choose, createRound, currentItem, demoOf, glowOn, isDone, makeItems, modesOf, nextItem, nextPace, readChoices, resultOf, say, starsOf, turn, type Pace,
} from "../lib/round";
import { makeRng } from "../../../shared/game-core";
import { hands, mod, onFace, ringNumbers, same, sayTime } from "../lib/time";
import { FIVE, GUESSER, LEARNER, playRound } from "./bot";

const SEEDS = 400;
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("levels: ids 1–5 keep their old meaning (saved stars), 6–11 are new, every one in the play order once", () => {
  assert.equal(LEVEL_COUNT, 11);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), Array.from({ length: 11 }, (_, i) => i + 1));
  assert.deepEqual([1, 2, 3, 4, 5].map(id => levelOf(id).title), ["ঠিক ঘণ্টা", "সাড়ে", "সোয়া", "৫ মিনিট করে", "সকাল না সন্ধ্যা?"]);
  assert.deepEqual([1, 2, 3, 4, 5].map(id => levelOf(id).world), [0, 1, 2, 3, 3]);
  assert.ok(isLevel(11) && !isLevel(0) && !isLevel(12) && !isLevel(1.5));
  assert.equal(levelOf(99).id, 1, "an unknown id falls back to the first level");
  assert.equal(placeOf(6), 2); assert.equal(placeOf(11), 11); assert.equal(nextInOrder(11), 0); assert.equal(nextInOrder(1), 6);
  for (const level of LEVELS) { nfc(level.title); nfc(level.news); nfc(level.off); assert.ok(level.example.m % 5 === 0); }
  assert.equal(new Set(LEVELS.map(level => level.title)).size, LEVEL_COUNT, "no two levels share a name");
});

test("worlds: four, each ending in a named finale, one new idea per level", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 6], [2, 7, 8], [3, 9, 10], [4, 5, 11]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), last = ids[ids.length - 1];
    assert.ok(levelOf(last).finale && isWorldEnd(last), `${world.name} ends in a finale`);
    assert.ok(ids.slice(0, -1).every(id => !isWorldEnd(id)));
  }
  assert.ok(LEVELS.filter(level => level.finale).every(level => level.items === 8), "a finale is longer");
  assert.ok(LEVELS.filter(level => !level.finale).every(level => level.items === 6));
  assert.deepEqual(minutesOf(levelOf(1)), [0]);
  assert.deepEqual(minutesOf(levelOf(2)), [30, 0]);
  assert.deepEqual(minutesOf(levelOf(3)), [15, 0, 30]);
  assert.deepEqual(minutesOf(levelOf(9)), [45, 0, 15]);
  assert.ok(levelOf(4).ask.every(m => m % 15 !== 0), "level ৯ drills the in-between minutes");
  assert.equal(levelOf(1).lockMinute, true); assert.equal(levelOf(6).lockMinute, false); assert.equal(levelOf(6).startAway, true);
  assert.equal(levelOf(4).step, 5); assert.equal(levelOf(3).step, 15);
  assert.equal(levelOf(5).part, true); assert.equal(levelOf(4).part, false);
  assert.deepEqual([4, 5, 11].map(id => levelOf(id).targetClock), ["always", "slip", "slip"], "the target is a picture; in the last world it comes after a slip");
  assert.ok(LEVELS.filter(level => level.world < 3).every(level => level.targetClock === "always" && level.pickClock === "always"), "worlds 1–3 always show the picture clock");
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 6: 2 }), 2, "the next in play order without stars");
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1);
});

test("rounds: the day in order, set first, no three alike in a row, this level's minutes only, same seed same day", () => {
  for (const level of LEVELS) for (let seed = 1; seed <= 60; seed++) {
    const items = makeItems(level.id, seed);
    assert.equal(items.length, level.items, `level ${level.id}`);
    assert.equal(items[0].activity.id, "wake"); assert.equal(items.at(-1)!.activity.id, "sleep");
    assert.equal(items[0].mode, "set");
    const minutes = items.map(item => item.time.h * 60 + item.time.m);
    for (let i = 1; i < items.length; i++) assert.ok(minutes[i] > minutes[i - 1], `level ${level.id} seed ${seed}: times rise`);
    for (const item of items) assert.ok(level.ask.includes(item.time.m), `level ${level.id}: ${item.time.m}`);
    for (let i = 2; i < items.length; i++) assert.ok(!(items[i].mode === items[i - 1].mode && items[i].mode === items[i - 2].mode), "no three alike");
    const sets = items.filter(item => item.mode === "set").length;
    assert.ok(sets >= Math.floor(items.length / 2) && sets <= Math.ceil(items.length / 2) + 1, `level ${level.id}: ${sets} set items`);
    assert.deepEqual(makeItems(level.id, seed), items, "same seed, same day");
    // No "set" item starts solved, and the long hand starts at 12 unless the finale sends it away.
    for (const item of items) {
      assert.ok(!same(item.start, item.time), `level ${level.id}: an item starts solved`);
      if (!level.startAway) assert.equal(mod(item.start, 60), 0); else assert.ok(mod(item.start, 60) % 15 === 0 && mod(item.start, 60) !== 0);
    }
  }
  assert.ok(makeItems(1, 5).every(item => item.time.m === 0), "level ১: o'clock only");
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(seed => makeItems(2, seed).map(item => item.activity.id).join())).size > 3, "the days differ");
  const m = modesOf(6, makeRng(3)); assert.equal(m.length, 6); assert.equal(m[0], "set");
});

test("দেড়টা and আড়াইটা level always has both", () => {
  for (let seed = 1; seed <= 80; seed++) {
    const said = makeItems(7, seed).map(item => sayTime(item.time));
    assert.ok(said.includes("দেড়টা") && said.includes("আড়াইটা"), said.join());
    assert.ok(said.every(text => text.startsWith("সাড়ে") || text === "দেড়টা" || text === "আড়াইটা"));
  }
});

test("“কয়টা বাজে?” cards hold the answer once, read differently, draw differently, and use only taught words", () => {
  for (const level of LEVELS) for (const count of [2, 3, 4]) for (let seed = 1; seed <= 20; seed++) {
    for (const item of makeItems(level.id, seed)) {
      const cards = readChoices(item.time, level, count, seed);
      assert.equal(cards.length, count, `level ${level.id}`);
      const said = cards.map(time => say(time, level));
      assert.equal(new Set(said).size, count, `no two cards read alike: ${said.join()}`);
      assert.equal(said.filter(text => text === say(item.time, level)).length, 1);
      if (!level.part) assert.equal(new Set(cards.map(time => mod(time.h * 60 + time.m, 720))).size, count, "no two cards draw alike");
      for (const time of cards) assert.ok(minutesOf(level).includes(time.m), `level ${level.id}: ${time.m}`);
    }
  }
  // পৌনে ৫টা: the first mix-up is the hour one off.
  assert.ok(readChoices({ h: 16, m: 45 }, levelOf(9), 2, 1).some(time => say(time, levelOf(9)) === "পৌনে ৬টা"));
  // The sky level: the same time at the other end of the day.
  assert.deepEqual(readChoices({ h: 19, m: 0 }, levelOf(5), 2, 1).map(time => say(time, levelOf(5))), ["সকাল ৭টা", "সন্ধ্যা ৭টা"]);
});

test("cards: 2, 3 or 4 by the pace, never 4 in the minutes worlds (their words are long)", () => {
  const eased = { right: 0, wrong: 3, help: 1 as const }, harder = { right: 5, wrong: 0, help: -1 as const };
  const readCount = (level: number, pace: Pace) => { for (let seed = 1; seed < 50; seed++) { let round = createRound(level, seed, pace); for (let at = 0; at < round.items.length; at++) { if (currentItem(round).mode === "read") return round.choices.length; round = nextItem({ ...round, solved: true }); } } throw new Error("no read item"); };
  assert.equal(readCount(3, eased), 2); assert.equal(readCount(3, START_PACE), 3); assert.equal(readCount(3, harder), 4);
  assert.equal(readCount(4, harder), 3); assert.equal(readCount(11, harder), 3); assert.equal(readCount(11, eased), 2);
});

test("the target picture: where the ghost finger goes, and which numbers ring", () => {
  const find = (level: number, wanted: (i: ReturnType<typeof makeItems>[number]) => boolean) => { for (let seed = 1; seed < 200; seed++) { const item = makeItems(level, seed).find(wanted); if (item) return item; } throw new Error("none"); };
  const hourOnly = find(1, item => item.time.h === 7 || item.time.h === 8);
  assert.equal(demoOf(hourOnly).hand, "hour"); assert.equal(demoOf(hourOnly).from, 0);
  assert.equal(demoOf(hourOnly).to, mod(hands(hourOnly.time.h * 60).hour, 360));
  const half = find(2, item => item.time.m === 30);
  assert.equal(demoOf(half).hand, "minute"); assert.equal(demoOf(half).to, 180);
  const away = find(6, item => item.time.m === 0);
  assert.equal(demoOf(away).hand, "minute", "the finale's long hand starts away: it comes home first");
  assert.equal(demoOf(away).to, 0);
  assert.deepEqual(ringNumbers({ h: 8, m: 30 }, "minute"), [6]);
  assert.deepEqual(ringNumbers({ h: 8, m: 0 }, "minute"), [12]);
  assert.deepEqual(ringNumbers({ h: 8, m: 30 }, "hour"), [8, 9], "between 8 and 9");
  assert.deepEqual(ringNumbers({ h: 4, m: 45 }, "hour"), [5], "পৌনে ৫: just before 5");
  assert.deepEqual(ringNumbers({ h: 4, m: 15 }, "hour"), [4]);
  assert.deepEqual(ringNumbers({ h: 12, m: 0 }, "hour"), [12]);
  assert.deepEqual(ringNumbers({ h: 11, m: 45 }, "hour"), [12], "পৌনে ১২ → 12, never 0 or 13");
});

test("a set item: a slip names the hand to fix (the long one first), two slips show the answer, three tries at most", () => {
  const level = 2;
  let round = createRound(level, 11);
  while (currentItem(round).mode !== "set") round = createRound(level, round.seed + 1);
  const item = currentItem(round), target = item.time.h * 60 + item.time.m;
  assert.equal(glowOn(round), false);
  // The short hand right, the long hand wrong: the long hand is the one named.
  round = check(turn(round, mod(item.time.h, 12) * 60 + (item.time.m === 30 ? 0 : 30)));
  assert.equal(round.solved, false); assert.equal(round.tries, 1); assert.equal(round.wrongHand, "minute");
  assert.equal(round.firstTry, 0);
  round = check(turn(round, mod(item.time.h + 1, 12) * 60 + item.time.m));
  assert.equal(round.wrongHand, "hour", "the long hand is right now; the short hand is the one");
  assert.equal(round.tries, 2); assert.ok(glowOn(round), `after ${GLOW_AFTER} slips the answer shows`);
  round = turn(round, target);
  assert.equal(round.wrongHand, null, "turning a hand clears the wobble");
  round = check(round);
  assert.ok(round.solved); assert.equal(round.firstTry, 0, "a slip means not first time");
  assert.equal(check(round), round, "a solved item is not checked twice");
  assert.equal(turn(round, 0), round, "and its hands no longer turn");
  assert.equal(round.misses, 2);
});

test("a read item: a wrong card is remembered and shows its own clock, the right card ends it", () => {
  let round = createRound(2, 5);
  while (currentItem(round).mode !== "read") { round = { ...round, solved: true }; round = nextItem(round); }
  const item = currentItem(round), wrong = round.choices.find(card => cardKey(card) !== cardKey(item.time))!;
  const after = choose(round, wrong);
  assert.equal(after.tries, 1); assert.deepEqual(after.tried, [cardKey(wrong)]);
  assert.equal(choose(after, wrong), after, "a card already tried is ignored");
  assert.equal(choose(after, { h: 3, m: 55 }), after, "a time that is not a card is ignored");
  const right = choose(after, item.time);
  assert.ok(right.solved); assert.equal(right.firstTry, 0);
  assert.equal(choose(right, wrong), right);
  assert.equal(check(round), round, "✓ does nothing on a read item");
  const first = choose(round, item.time);
  assert.equal(first.firstTry, 1);
});

test("difficulty steps: three slips ease, five right step up, never announced", () => {
  let pace: Pace = START_PACE;
  assert.equal(choiceCount(pace), 3);
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.help, 1); assert.equal(choiceCount(pace), 2);
  pace = nextPace(pace, true);
  assert.equal(pace.help, 0);
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.help, -1); assert.equal(choiceCount(pace), 4);
  pace = nextPace(pace, false);
  assert.equal(pace.help, 0, "one slip drops back to normal");
  const eased = { ...createRound(1, 3), pace: { right: 0, wrong: 3, help: 1 as const } };
  assert.ok(glowOn(eased), "eased: the answer shows from the start");
});

test("stars are a record: all but one right first time → 3, half → 2, any finished round → 1", () => {
  assert.deepEqual([6, 5, 4, 3, 2, 0].map(n => starsOf(n, 6)), [3, 3, 2, 2, 1, 1]);
  assert.deepEqual([8, 7, 6, 4, 3].map(n => starsOf(n, 8)), [3, 3, 2, 2, 1]);
});

test("the bots: a guesser always finishes; a five-year-old and a learner earn their stars; stars mean something", () => {
  for (const level of LEVELS) {
    let guessThree = 0, fiveThree = 0, learnerThree = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const guess = playRound(level.id, seed, GUESSER), five = playRound(level.id, seed, FIVE), learner = playRound(level.id, seed, LEARNER);
      assert.ok(isDone(guess.round) && guess.taps <= 3 * level.items, `level ${level.id}: guesser needs at most three tries an item`);
      assert.equal(resultOf(guess.round).count, level.items);
      if (resultOf(guess.round).stars === 3) guessThree++;
      if (resultOf(five.round).stars === 3) fiveThree++;
      if (resultOf(learner.round).stars === 3) learnerThree++;
    }
    assert.ok(guessThree / SEEDS <= 0.06, `level ${level.id}: guesser gets 3 stars ${guessThree / SEEDS}`);
    assert.ok(fiveThree / SEEDS >= (level.items === 8 ? 0.4 : 0.55), `level ${level.id}: a five-year-old gets 3 stars ${fiveThree / SEEDS}`);
    assert.ok(learnerThree / SEEDS >= 0.78, `level ${level.id}: a learner gets 3 stars ${learnerThree / SEEDS}`);
  }
});

test("a child who knows it wins the first item within 10 seconds, and a round takes under two minutes", () => {
  for (const level of LEVELS) for (let seed = 1; seed <= 100; seed++) {
    const play = playRound(level.id, seed, { knows: 1, think: 2 });
    assert.ok(play.firstRightAt <= 10, `level ${level.id}: ${play.firstRightAt}`);
    assert.equal(play.round.misses, 0);
    assert.ok(play.seconds <= 120, `level ${level.id}: ${play.seconds}`);
  }
});

test("a round replays: the same seed gives the same cards and the same result", () => {
  for (const id of ORDER) {
    const a = playRound(id, 42, FIVE), b = playRound(id, 42, FIVE);
    assert.deepEqual(resultOf(a.round), resultOf(b.round));
    assert.deepEqual(createRound(id, 9), createRound(id, 9));
  }
  const round = createRound(1, 9);
  assert.deepEqual(onFace(round.total), onFace(currentItem(round).start));
});
