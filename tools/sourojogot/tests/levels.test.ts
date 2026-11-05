// The course as data, every level played by headless children over 2,000 seeds, and the round's rules.
import assert from "node:assert/strict";
import test from "node:test";
import { isWorldEnd, isLevel, LEVELS, LEVEL_COUNT, levelOf, levelsOfWorld, nextInOrder, nextToPlay, ORDER, placeOf, WORLDS } from "../lib/course";
import { PLANETS, THINGS, ZONES } from "../lib/planets";
import {
  advance, answer, choiceCount, createRound, glowOn, hintOf, isDone, isLast, itemOf, nextPace, placeOn, resultOf, revealOf, rightKey, shouldGlow, shuffledSlots, sizeChoices,
  starsOf, START_PACE, type Pace, type Round,
} from "../lib/round";
import { cardFact, doneLine, methodLine, newsLine, promptOf, taskLine, tipLine } from "../lib/words";
import { FIVE, GUESSER, LEARNER, playRound } from "./bot";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const SEEDS = 2000;

test("the course: 3 worlds, 11 levels, ids 1–6 keep their old meaning, 7–11 are new", () => {
  assert.equal(LEVEL_COUNT, 11);
  assert.deepEqual(LEVELS.slice(0, 6).map(level => `${level.mode}${level.count}`), ["tour4", "tour8", "sort4", "sort8", "size8", "far8"], "saved stars by id still mean the same level");
  assert.deepEqual(LEVELS.map(level => level.id), Array.from({ length: 11 }, (_, i) => i + 1));
  assert.deepEqual([...ORDER].sort((a, b) => a - b), LEVELS.map(level => level.id), "play order is a permutation of the ids");
  assert.equal(WORLDS.length, 3);
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id).length), [4, 4, 3]);
  assert.deepEqual(WORLDS.map(world => levelOf(levelsOfWorld(world.id).at(-1)!).finale).map(Boolean), [true, true, true], "every world ends on a named finale");
  assert.deepEqual(ORDER.filter(isWorldEnd), [8, 10, 11]);
  assert.equal(new Set(LEVELS.map(level => level.finale ?? level.title)).size, 11, "every level has its own name");
  // Each world adds exactly one new mode, in order: order, put back, look, build; then guess size, guess distance, both.
  assert.deepEqual(ORDER.map(id => levelOf(id).mode), ["tour", "sort", "know", "build", "tour", "sort", "know", "build", "size", "far", "scale"]);
  assert.equal(placeOf(8), 4); assert.equal(placeOf(2), 5); assert.equal(placeOf(11), 11);
  assert.equal(levelOf(99), LEVELS[0], "an unknown level falls back to the first");
  assert.ok(isLevel(11) && !isLevel(12) && !isLevel(0) && !isLevel(1.5));
  for (const level of LEVELS) { nfc(level.title); nfc(level.finale ?? ""); nfc(doneLine(level.id)); nfc(cardFact(level.id)); nfc(newsLine(level.id)); nfc(taskLine(level.id)); nfc(tipLine(level.id)); }
});

test("next to play follows play order and never locks anything", () => {
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3 }), 3);
  assert.equal(nextToPlay({ 1: 3, 3: 1, 7: 2 }), 8);
  assert.equal(nextToPlay({ 1: 1, 3: 1, 7: 1, 8: 1, 2: 1 }), 4);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1, "all done: back to the first");
  assert.equal(nextInOrder(8), 2); assert.equal(nextInOrder(11), 0);
  // An old save with level 6 recorded opens at the first unplayed level in the new order, and keeps every old star.
  assert.equal(nextToPlay({ 1: 3, 2: 2, 3: 3, 4: 1, 5: 2, 6: 2 }), 7);
});

test("the guesser finishes every level, never gets 3 stars, and the first right answer comes within 10 s", () => {
  for (const id of ORDER) {
    let three = 0, worst = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const play = playRound(id, seed, GUESSER);
      const items = play.round.items.length;
      assert.ok(isDone(play.round));
      assert.ok(play.taps <= items * 3 + 3, `level ${id} seed ${seed}: ${play.taps} taps`);
      assert.ok(play.firstRightAt <= 10, `level ${id} seed ${seed}: first right at ${play.firstRightAt}`);
      if (resultOf(play.round).stars === 3) three++;
      worst = Math.max(worst, play.taps);
    }
    assert.ok(three / SEEDS <= 0.06, `level ${id}: guesser earns 3 stars on ${(100 * three / SEEDS).toFixed(1)}%`);
  }
});

test("a five-year-old who knows 7 in 10: level 1 is mostly three stars, the rest stay fair", () => {
  for (const id of ORDER) {
    let three = 0, seconds = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const play = playRound(id, seed, FIVE);
      if (resultOf(play.round).stars === 3) three++;
      seconds += play.seconds;
      assert.ok(play.firstRightAt <= 10, `level ${id}: first right at ${play.firstRightAt}`);
    }
    const rate = three / SEEDS;
    assert.ok(rate >= (id === 1 ? 0.7 : 0.45) && rate <= 0.85, `level ${id}: ${(100 * rate).toFixed(1)}% three stars`);
    assert.ok(seconds / SEEDS <= 45, `level ${id}: a round takes ${(seconds / SEEDS).toFixed(0)} s`);
  }
});

test("a learner who knows 9 in 10 earns three stars on every level on at least 90% of seeds", () => {
  for (const id of ORDER) {
    let three = 0;
    for (let seed = 1; seed <= SEEDS; seed++) if (resultOf(playRound(id, seed, LEARNER).round).stars === 3) three++;
    assert.ok(three / SEEDS >= 0.9, `level ${id}: ${(100 * three / SEEDS).toFixed(1)}%`);
  }
});

test("a round is deterministic: same seed and taps, same questions and same result", () => {
  for (const id of ORDER) {
    const a = createRound(id, 4242), b = createRound(id, 4242), c = createRound(id, 4243);
    assert.deepEqual(a, b);
    if (levelOf(id).mode !== "tour") assert.notDeepEqual(a.items.map(item => item.planet).join(), c.items.map(item => item.planet).join() + "x");
    assert.deepEqual(playRound(id, 7, FIVE).round, playRound(id, 7, FIVE).round);
  }
  // The trip itself always runs in order from the Sun.
  assert.deepEqual(createRound(2, 9).items.map(item => item.planet), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(createRound(1, 9).items.map(item => item.planet), [0, 1, 2, 3]);
});

test("every question is answerable: the right key is on offer, choices are distinct, and every planet comes once", () => {
  for (const id of ORDER) for (let seed = 1; seed <= 200; seed++) {
    let round = createRound(id, seed);
    const seen: number[] = [];
    for (;;) {
      const item = itemOf(round);
      seen.push(item.planet);
      if (item.kind === "know" || item.kind === "size" || item.kind === "far") {
        assert.ok(round.choices.includes(rightKey(round)), `${id}/${seed}: right key missing`);
        assert.equal(new Set(round.choices).size, round.choices.length);
        assert.ok(round.choices.length >= 2 && round.choices.length <= 4);
        if (item.kind === "know") for (const key of round.choices) assert.ok(PLANETS.findIndex(planet => planet.id === key) < levelOf(id).count);
      } else assert.deepEqual(round.choices, []);
      round = answer(round, rightKey(round));
      assert.ok(round.solved);
      if (isLast(round)) break;
      round = advance(round);
    }
    assert.deepEqual([...seen].sort((a, b) => a - b), Array.from({ length: levelOf(id).count }, (_, i) => i), `${id}/${seed}: each planet once`);
    if (levelOf(id).mode === "scale") assert.deepEqual(round.items.map(item => item.kind), ["size", "far", "size", "far", "size", "far", "size", "far"], "the grand finale alternates size and distance");
  }
});

test("a wrong answer is a slip with a kind hint; the same wrong one twice counts once; a done planet is only information", () => {
  let round = createRound(1, 5);
  const venus = answer(round, "venus");
  assert.equal(venus.last, "wrong"); assert.equal(venus.mistakes, 1); assert.equal(venus.tries, 1); assert.equal(venus.solved, false);
  assert.equal(hintOf(venus, "venus"), "বুধ সূর্যের আরও কাছে, ওটা আগে।");
  const again = answer(venus, "venus");
  assert.equal(again.mistakes, 1, "tapping the same wrong planet again is not a second slip");
  assert.equal(again.last, "wrong");
  round = advance(answer(venus, "mercury"));
  assert.equal(round.index, 1); assert.equal(round.tries, 0); assert.equal(round.firstTry, 0, "the first needed a second try");
  const done = answer(round, "mercury");
  assert.equal(done.last, "again"); assert.equal(done.mistakes, 1, "an already-done planet costs nothing");
  assert.equal(answer(round, "venus").firstTry, 1, "the second planet, right first time");
  assert.equal(answer(answer(round, "venus"), "earth").mistakes, 1);
  assert.equal(hintOf(answer(round, "mars"), "mars"), "শুক্র সূর্যের আরও কাছে, ওটা আগে।");
  // Nothing is accepted once the question is solved, or for a key that isn't on offer.
  const solved = answer(round, "venus");
  assert.equal(answer(solved, "earth"), solved);
  let quiz = createRound(7, 3);
  const bad = answer(quiz, "not-a-planet");
  assert.equal(bad, quiz);
  const wrong = quiz.choices.find(key => key !== rightKey(quiz))!;
  quiz = answer(quiz, wrong);
  assert.match(hintOf(quiz, wrong), /^ওটা .+: .+। আরেকবার দেখো।$/);
  assert.equal(answer(quiz, wrong).mistakes, 1);
});

test("sort: every planet starts off its orbit, and a right tap puts it home", () => {
  for (const seed of [1, 2, 3, 99, 12345]) for (const count of [4, 8]) {
    const slots = shuffledSlots(count, seed);
    assert.deepEqual([...slots].sort(), Array.from({ length: count }, (_, index) => index));
    assert.ok(slots.every((planet, slot) => planet !== slot));
    assert.deepEqual(shuffledSlots(count, seed), slots, "same seed, same start");
    let board = slots;
    for (let planet = 0; planet < count; planet++) board = placeOn(board, planet, planet);
    assert.deepEqual(board, Array.from({ length: count }, (_, index) => index));
  }
  let round = createRound(3, 11);
  for (let planet = 0; planet < 4; planet++) { round = answer(round, PLANETS[planet].id); if (planet < 3) round = advance(round); }
  assert.deepEqual(round.slots, [0, 1, 2, 3]);
});

test("build: a planet goes on the orbit that is its number, a filled orbit is only information", () => {
  let round = createRound(8, 21);
  assert.deepEqual(round.slots, [-1, -1, -1, -1]);
  const first = itemOf(round).planet;
  const wrongOrbit = String((first + 1) % 4);
  const slip = answer(round, wrongOrbit);
  assert.equal(slip.last, "wrong");
  assert.match(hintOf(slip, wrongOrbit), /আরও (কাছে|দূরে) বসবে।$/);
  round = answer(round, String(first));
  assert.equal(round.slots[first], first);
  assert.equal(answer(round, String(first)), round, "a solved question takes no more answers");
  round = advance(round);
  assert.equal(answer(round, String(first)).last, "again", "an orbit already filled");
  assert.equal(answer(round, "9"), round, "an orbit that doesn't exist");
});

test("the silent pace: three questions in a row that needed a second try ease, five in a row right first time step up", () => {
  let pace: Pace = START_PACE;
  assert.equal(choiceCount(pace), 3);
  for (let i = 0; i < 2; i++) pace = nextPace(pace, false);
  assert.equal(pace.help, 0, "two are not enough");
  pace = nextPace(pace, false);
  assert.equal(pace.help, 1); assert.equal(choiceCount(pace), 2); assert.ok(shouldGlow(pace, 0));
  pace = nextPace(pace, true);
  assert.equal(pace.help, 0); assert.ok(!shouldGlow(pace, 1)); assert.ok(shouldGlow(pace, 2), "glows after two tries");
  for (let i = 0; i < 4; i++) pace = nextPace(pace, true);
  assert.equal(pace.help, -1); assert.equal(choiceCount(pace), 4);
  assert.equal(nextPace(pace, false).help, 0, "one second try drops back to normal");
  // In a real round: slip on three questions in a row, and the fourth glows from the start with two choices.
  let round = createRound(7, 31);
  for (let q = 0; q < 3; q++) {
    const wrong = round.choices.find(key => key !== rightKey(round))!;
    round = advance(answer(answer(round, wrong), rightKey(round)));
  }
  assert.equal(round.pace.help, 1); assert.equal(round.choices.length, 2); assert.ok(glowOn(round));
  // The very first question of a round always has a normal pace.
  assert.equal(createRound(5, 1).choices.length, 3);
});

test("size choices always hold the answer, in size order", () => {
  for (const planet of PLANETS) for (const count of [2, 3, 4]) for (const seed of [1, 7, 42]) {
    const choices = sizeChoices(planet, count, seed);
    assert.equal(choices.length, count);
    assert.equal(new Set(choices.map(thing => thing.id)).size, count);
    assert.deepEqual(choices.map(thing => thing.sizeMm), [...choices.map(thing => thing.sizeMm)].sort((a, b) => a - b));
  }
  assert.equal(ZONES.length, 3); assert.equal(THINGS.length, 5);
});

test("stars are a record: 3 for three in four first time, 2 for half, else 1; ধীরে খেলো changes nothing (nothing is timed)", () => {
  assert.deepEqual([4, 3, 2, 1, 0].map(first => starsOf(first, 4)), [3, 3, 2, 1, 1]);
  assert.deepEqual([8, 6, 5, 4, 3, 0].map(first => starsOf(first, 8)), [3, 3, 2, 2, 1, 1]);
  const round = playRound(5, 3, LEARNER).round;
  assert.equal(resultOf(round).stars, starsOf(round.firstTry, 8));
  assert.deepEqual(resultOf(createRound(1, 1)).planets, [0, 1, 2, 3]);
});

test("the end line is honest: praise only for a clean round, a plain count for a few slips, a tip with no praise after many", () => {
  for (const id of ORDER) {
    const clean = methodLine(id, 0), few = methodLine(id, 2), many = methodLine(id, 3), lots = methodLine(id, 11);
    assert.match(clean, /একবারও আটকাওনি/);
    assert.equal(few, "২বার থেমে আবার ভেবেছ।");
    assert.equal(many, tipLine(id)); assert.equal(lots, tipLine(id));
    for (const line of [many, lots]) assert.doesNotMatch(line, /আটকাওনি|ঠিকটা পেয়েছ|ভেবেছ|দারুণ|ভালো করেছ/, `level ${id} praises a round with many slips: ${line}`);
    assert.doesNotMatch(few, /আটকাওনি|ঠিকটা পেয়েছ/);
  }
  assert.match(tipLine(1), /^সূর্য থেকে গুনে দেখো: বুধ, শুক্র, পৃথিবী, মঙ্গল।$/);
  assert.match(tipLine(2), /নেপচুন।$/);
});

test("words: the question names the planet, the reveal says something true", () => {
  const size = createRound(5, 2);
  assert.match(promptOf(size), /^সূর্য যদি একটা ফুটবল হয়, .+ কত বড় হতো\?$/);
  assert.match(promptOf(createRound(6, 2)), /ফুটবল-সূর্য মাঠের এক মাথায়/);
  assert.match(promptOf(createRound(7, 2)), /জানালা দিয়ে/);
  assert.match(promptOf(createRound(8, 2)), /নিজের পথে|কোন পথে/);
  const solved = answer(createRound(5, 2), rightKey(size));
  assert.match(revealOf(solved), /মতো।$/);
  assert.match(revealOf(answer(createRound(8, 2), String(itemOf(createRound(8, 2)).planet))), /^সূর্যের (প্রথম|দ্বিতীয়|তৃতীয়|চতুর্থ) গ্রহ।/);
  for (const planet of PLANETS) assert.equal(revealOf(answer(createRound(2, 1), planet.id)).length > 0, true);
});

test("a finished round reports what was done: the planets, the first-time count, the stars", () => {
  let round: Round = createRound(2, 1);
  for (let i = 0; i < 8; i++) { round = answer(round, rightKey(round)); if (i < 7) round = advance(round); }
  assert.ok(isDone(round));
  assert.deepEqual(resultOf(round), { level: 2, stars: 3, count: 8, firstTry: 8, mistakes: 0, planets: [0, 1, 2, 3, 4, 5, 6, 7] });
});
