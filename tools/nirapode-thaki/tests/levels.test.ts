import assert from "node:assert/strict";
import test from "node:test";
import { ICONS, SCENES } from "../lib/art";
import { LEVEL_COUNT, ORDER, WORLDS, isWorldEnd, itemsOf, levelFromHash, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf } from "../lib/levels";
import {
  HINT_AFTER, MAX_CHOICES, MIN_CHOICES, START_PACE, answer, cardLine, choiceCount, choicesFor, createRound, currentItem, hintOn, isLast, nextPace, nextQuestion, resultOf, starsOf, type Pace,
} from "../lib/play";
import { SETS } from "../lib/sets";
import { FIVE, GUESSER, LEARNER, playRound } from "./bot";

const SEEDS = 2000;
const bn = (n: number) => new Intl.NumberFormat("bn-BD").format(n);
const rate = (level: number, child: typeof FIVE, ok: (stars: number) => boolean) => {
  let hits = 0;
  for (let seed = 1; seed <= SEEDS; seed++) if (ok(resultOf(playRound(level, seed, child).round).stars)) hits++;
  return hits / SEEDS;
};

test("levels: ids 1–6 are the six scenes in their old order (saved stars and #s= links), three finales are new ids", () => {
  assert.equal(LEVEL_COUNT, 9);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(id => levelOf(id).sets[0]), SETS.map(set => set.id));
  assert.deepEqual([...ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9], "the play order lists every level once");
  for (const id of [1, 2, 3, 4, 5, 6]) assert.equal(itemsOf(id).length, 5, `scene ${id}`);
  for (const id of [7, 8, 9]) assert.equal(itemsOf(id).length, 6, `finale ${id}`);
  assert.equal(levelFromHash("#s=jhor"), 6);
  assert.equal(levelFromHash("#s=rasta"), 1);
  assert.equal(levelFromHash("#s=nope"), null);
  assert.equal(levelFromHash(""), null);
  assert.equal(levelFromHash("#s=rasta&x=1"), null);
});

test("worlds: three, each with two scenes and a named finale made of three questions from each", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 5, 7], [3, 4, 8], [2, 6, 9]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), finale = levelOf(ids[2]);
    assert.ok(finale.finale && isWorldEnd(ids[2]) && !isWorldEnd(ids[0]) && !isWorldEnd(ids[1]));
    assert.deepEqual([...finale.sets].sort(), [levelOf(ids[0]).sets[0], levelOf(ids[1]).sets[0]].sort(), `${finale.title} borrows its world's two scenes`);
    const items = itemsOf(ids[2]);
    for (const set of finale.sets) assert.equal(items.filter(item => item.set === set).length, 3, `${finale.title}: three from ${set}`);
    // alternates between the two pictures, so the scene changes on every question
    for (let at = 1; at < items.length; at++) assert.notEqual(items[at].scene, items[at - 1].scene, `${finale.title} question ${at}`);
  }
  assert.deepEqual(ORDER.map(id => placeOf(id)), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(nextInOrder(7), 3);
  assert.equal(nextInOrder(9), 0);
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3 }), 5);
  assert.equal(nextToPlay({ 1: 3, 5: 2, 7: 1, 3: 1, 4: 1, 8: 1, 2: 1, 6: 1, 9: 1 }), 1, "everything done: back to the start");
});

test("every question: a pictured safe answer, at least three wrong pictures, no repeats, a ring inside the scene", () => {
  for (const set of SETS) for (const q of set.questions) {
    const all = [q.right, ...q.wrong];
    assert.ok(q.wrong.length >= 3, `${set.id}/${q.id}: a fourth picture can't appear`);
    assert.equal(new Set(all.map(choice => choice.id)).size, all.length, `${set.id}/${q.id} ids`);
    assert.equal(new Set(all.map(choice => choice.icon)).size, all.length, `${set.id}/${q.id}: two choices share one picture`);
    for (const choice of all) assert.ok(ICONS[choice.icon], `${set.id}/${q.id}/${choice.id} icon ${choice.icon}`);
    assert.ok(SCENES[set.scene]);
    assert.ok(q.look.r >= 16 && q.look.x - q.look.r >= 0 && q.look.x + q.look.r <= 320 && q.look.y - q.look.r >= 0 && q.look.y + q.look.r <= 160, `${set.id}/${q.id} ring`);
    if (q.prop) assert.ok(ICONS[q.prop.icon], `${q.id} prop`);
  }
});

test("a round: the safe picture is offered once, the wrong ones come most-tempting first, never a repeat", () => {
  for (const seed of [1, 7, 99, 12345]) for (const set of SETS) for (const q of set.questions) for (const count of [2, 3, 4]) {
    const choices = choicesFor(q, count, seed);
    assert.equal(choices.length, count);
    assert.equal(choices.filter(choice => choice.id === q.right.id).length, 1);
    assert.equal(new Set(choices.map(choice => choice.id)).size, count);
    for (let at = 0; at < count - 1; at++) assert.ok(choices.some(choice => choice.id === q.wrong[at].id), `${q.id}: ${q.wrong[at].id} dropped before a weaker one`);
  }
  assert.deepEqual(choicesFor(SETS[0].questions[0], 3, 5).map(choice => choice.id), choicesFor(SETS[0].questions[0], 3, 5).map(choice => choice.id), "same seed, same order");
});

test("difficulty: a first question of two on level ১, three elsewhere, within one of that, never outside 2–4", () => {
  const first = createRound(1, 1);
  assert.equal(first.choices.length, 2);
  assert.equal(createRound(5, 1).choices.length, 3);
  assert.equal(createRound(7, 1).choices.length, 3);
  const high: Pace = { offset: 1, right: 0, missed: 0 }, low: Pace = { offset: -1, right: 0, missed: 0 };
  assert.equal(createRound(5, 1, high).choices.length, 4);
  assert.equal(createRound(5, 1, low).choices.length, 2);
  assert.equal(choiceCount(levelOf(5), { offset: 5, right: 0, missed: 0 }, 2, 9), MAX_CHOICES);
  assert.equal(choiceCount(levelOf(5), { offset: -5, right: 0, missed: 0 }, 2, 9), MIN_CHOICES);
});

test("difficulty: three misses in a row take a picture away, five right in a row add one, and the run carries into the next round", () => {
  let pace = START_PACE;
  for (let miss = 1; miss <= 2; miss++) pace = nextPace(pace, false);
  assert.equal(pace.offset, 0);
  pace = nextPace(pace, false);
  assert.deepEqual(pace, { offset: -1, right: 0, missed: 0 });
  assert.deepEqual(nextPace(pace, false).offset, -1, "never below one under");
  pace = START_PACE;
  for (let right = 1; right <= 4; right++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 0);
  pace = nextPace(pace, true);
  assert.deepEqual(pace, { offset: 1, right: 0, missed: 0 });
  assert.equal(nextPace(nextPace(nextPace(nextPace(nextPace(pace, true), true), true), true), true).offset, 1, "never above one over");
  assert.equal(nextPace(nextPace(START_PACE, true), false).right, 0, "a miss breaks the run");
  // gap: five in a row used to reset every round, so a five-question scene could never reach it from a fresh start
  let round = createRound(5, 3);
  for (let at = 0; at < 5; at++) { round = answer(round, currentItem(round).question.right.id); if (!isLast(round)) round = nextQuestion(round); }
  assert.equal(round.pace.offset, 1, "five right in a row, then the pace is up");
  const again = createRound(5, 4, round.pace);
  assert.equal(again.choices.length, 4, "the next round opens with a fourth picture");
});

test("a wrong tap: counted once per picture, the safe one glows after two different misses, a question takes at most three taps", () => {
  let round = createRound(5, 9);
  const item = currentItem(round), wrong = round.choices.filter(choice => choice.id !== item.question.right.id);
  round = answer(round, wrong[0].id);
  assert.equal(round.misses, 1);
  assert.equal(answer(round, wrong[0].id), round, "the same wrong picture again is not a new miss");
  assert.equal(hintOn(round), false);
  round = answer(round, wrong[1].id);
  assert.equal(round.misses, 2);
  assert.equal(hintOn(round), true);
  assert.equal(HINT_AFTER, 2);
  assert.equal(answer(round, "not-on-screen"), round);
  round = answer(round, item.question.right.id);
  assert.equal(round.solved, true);
  assert.equal(round.firstTry, 0, "found after misses: not a first-tap right");
  assert.equal(answer(round, wrong[0].id), round, "taps after solving are ignored");
});

test("stars are a record: a scene of five → ৪+ is 3, 3+ is 2; a finale of six → 5+ is 3", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(n => starsOf(n, 5)), [1, 1, 1, 2, 3, 3]);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(n => starsOf(n, 6)), [1, 1, 1, 2, 2, 3, 3]);
  const done = resultOf(playRound(2, 11, LEARNER).round);
  assert.equal(cardLine({ level: 1, count: 5 }, bn), "আজ রাস্তা পার হওয়ার ৫টা নিয়ম শিখলাম");
  assert.equal(cardLine({ level: 9, count: 6 }, bn), "আজ বর্ষার বিকেল: ৬টা নিয়ম মনে করলাম");
  assert.equal(done.count, 5);
});

test("every level, every seed: a guesser finishes in at most three taps a question and wins 3 stars rarely", () => {
  for (const id of ORDER) {
    let threes = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const play = playRound(id, seed, GUESSER);
      assert.ok(play.mostTaps <= 3, `level ${id} seed ${seed}: ${play.mostTaps} taps on one question`);
      assert.ok(play.round.solved && isLast(play.round));
      if (resultOf(play.round).stars === 3) threes++;
    }
    assert.ok(threes / SEEDS <= 0.1, `level ${id}: a guesser got 3 stars on ${(threes / SEEDS * 100).toFixed(1)}%`);
  }
});

test("a five-year-old who knows it 70%: 3 stars on level ১ on ≥ 75% of seeds, on each finale on 45–80%", () => {
  const first = rate(1, FIVE, stars => stars === 3);
  assert.ok(first >= 0.75, `level 1: ${first}`);
  for (const id of [7, 8, 9]) {
    const share = rate(id, FIVE, stars => stars === 3);
    assert.ok(share >= 0.45 && share <= 0.8, `finale ${id}: ${share}`);
  }
});

test("a learner who knows it 90% gets 3 stars on every level on ≥ 90% of seeds", () => {
  for (const id of ORDER) { const share = rate(id, LEARNER, stars => stars === 3); assert.ok(share >= 0.9, `level ${id}: ${share}`); }
});

test("the first right tap comes within 10 s for every child, and a round takes a minute or less", () => {
  for (const id of ORDER) for (const child of [GUESSER, FIVE, LEARNER]) for (let seed = 1; seed <= 200; seed++) {
    const play = playRound(id, seed, child);
    assert.ok(play.firstRightAt <= 10, `level ${id}: first right at ${play.firstRightAt}s`);
    assert.ok(play.seconds <= 75, `level ${id}: a round took ${play.seconds}s`);
  }
});

test("the pace changes what a child sees: after a clean scene the next round shows four pictures, after three misses two", () => {
  const clean = playRound(5, 1, { knows: 1, think: 1 });
  assert.equal(clean.round.pace.offset, 1);
  const rough = playRound(2, 1, { knows: 0, think: 1 });
  assert.ok(rough.round.pace.offset <= 0);
  const sizes = playRound(5, 2, { knows: 1, think: 1 }, { offset: 1, right: 0, missed: 0 }).sizes;
  assert.deepEqual(sizes, [4, 4, 4, 4, 4]);
});
