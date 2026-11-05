// The levels as data: ranges, one new thing per level, every pond complete and answerable, and the difficulty tuned with bots.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { LOOKS, PIPS, choicesFor, gridFor, lined, makeItem, scatter, span } from "../lib/items";
import { LEVELS, LEVEL_COUNT, ORDER, WORLDS, isWorldEnd, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf } from "../lib/levels";
import { ITEMS, answer, answerOf, createRound, glows, nextItem, resultOf, roundStars, tapFish } from "../lib/round";
import { careful, playRound, sharp, toddler } from "./bot";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const rate = (level: number, bot: typeof careful, test: (play: ReturnType<typeof playRound>) => boolean, runs = 300) => {
  let hits = 0;
  for (let seed = 1; seed <= runs; seed++) if (test(playRound(level, bot, seed))) hits++;
  return hits / runs;
};

test("three worlds of four, ids 1–9 keep their old meaning, finales are new ids 10–12", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(LEVELS.map(level => level.id), [1, 2, 3, 10, 4, 5, 6, 11, 7, 8, 9, 12]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id);
    assert.equal(ids.length, 4);
    assert.ok(isWorldEnd(ids[3]) && !ids.slice(0, 3).some(isWorldEnd), "only the last level of a world is a finale");
    assert.ok(levelOf(ids[3]).finale);
  }
  // Old ids: guni 1–3, এক নজরে 4–6, কোনটায় বেশি 7–9.
  assert.deepEqual([1, 2, 3].map(id => levelOf(id).kind), ["guni", "guni", "guni"]);
  assert.deepEqual([4, 5, 6].map(id => levelOf(id).kind), ["nojor", "nojor", "nojor"]);
  assert.deepEqual([7, 8, 9].map(id => levelOf(id).kind), ["beshi", "beshi", "beshi"]);
  assert.deepEqual([10, 11, 12].map(id => levelOf(id).kind), ["guni", "nojor", "merge"]);
  assert.equal(placeOf(10), 4); assert.equal(placeOf(12), 12);
  assert.equal(nextInOrder(3), 10); assert.equal(nextInOrder(12), 0);
  for (const level of LEVELS) { nfc(level.title); nfc(level.label); nfc(level.idea); assert.ok(level.min >= 1 && level.min < level.max); }
  assert.equal(new Set(LEVELS.map(level => level.title)).size, 12, "every level has its own name");
});

test("each level teaches one new thing: ranges grow inside a world, the youngest answer with pictures", () => {
  const maxes = (world: 0 | 1 | 2) => levelsOfWorld(world).map(id => levelOf(id).max);
  assert.deepEqual(maxes(0), [5, 10, 15, 20]);
  assert.ok(levelOf(4).pictures && !levelOf(5).pictures, "dot rows first, then numerals");
  assert.ok(!levelOf(4).parts && !levelOf(5).parts && levelOf(6).parts === 2 && levelOf(11).parts === 2, "adding comes in the third step");
  assert.ok(levelOf(9).koto && !levelOf(8).koto);
  assert.equal(levelOf(12).kind, "merge");
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 1 }), 3);
  assert.equal(nextToPlay({ 1: 1, 2: 1, 3: 1, 10: 2 }), 4, "play order, finale before the next world");
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 3]))), 1);
});

test("dice patterns: n spots for 1–6, all distinct and inside the square", () => {
  for (let n = 1; n <= 6; n++) {
    assert.equal(PIPS[n].length, n);
    assert.equal(new Set(PIPS[n].map(spot => spot.join())).size, n);
    for (const [x, y] of PIPS[n]) assert.ok(x > 0.1 && x < 0.9 && y > 0.1 && y < 0.9);
  }
  assert.equal(LOOKS.length, 4);
});

test("every pond is complete and answerable in every level, eased or not", () => {
  for (const spec of LEVELS) for (const eased of [false, true]) for (let seed = 1; seed <= 300; seed++) {
    const index = seed % 5, [low, high] = span(spec.id, eased, Boolean(spec.warm) && index === 0), item = makeItem(spec.id, makeRng(seed), eased, index);
    assert.equal(item.kind, spec.kind);
    if (item.kind === "guni") {
      assert.ok(item.n >= low && item.n <= high);
      assert.equal(item.spots.length, item.n);
      assert.ok(item.grid[0] * item.grid[1] >= item.n);
      assert.equal(new Set(item.spots.map(spot => `${Math.round(spot.x / 5)},${Math.round(spot.y / 5)}`)).size, item.n, "no two fish on one spot");
      assert.ok(item.choices.includes(item.n));
    } else if (item.kind === "nojor") {
      assert.ok(item.n >= low && item.n <= high, `${spec.id}: ${item.n}`);
      assert.equal(item.parts.reduce((a, b) => a + b, 0), item.n);
      assert.ok(item.parts.every(part => part >= 1 && part <= (spec.group ?? 6)), "each group is one dice pattern");
      assert.equal(item.parts.length, spec.parts ?? 1);
      assert.ok(item.choices.includes(item.n));
      if (spec.look) assert.equal(item.look, spec.look);
    } else if (item.kind === "merge") {
      assert.ok(item.n >= low && item.n <= high);
      assert.equal(item.counts[0] + item.counts[1], item.n);
      assert.equal(item.spots[0].length, item.counts[0]); assert.equal(item.spots[1].length, item.counts[1]);
      assert.ok(item.counts.every(count => count >= 1 && count <= 6));
      assert.ok(item.choices.includes(item.n));
    } else {
      const [a, b] = item.counts;
      assert.notEqual(a, b, "never equal");
      assert.ok(Math.min(a, b) >= 1 && Math.max(a, b) <= 10);
      assert.equal(item.spots[0].length, a); assert.equal(item.spots[1].length, b);
      if (spec.id === 7 || eased) assert.ok(Math.abs(a - b) >= (spec.koto ? 1 : 2), "easy gaps first");
      if (item.koto) { assert.ok(Math.abs(a - b) <= 3); assert.ok(item.koto.includes(Math.abs(a - b))); }
    }
    const choices = item.kind === "beshi" ? item.koto : item.choices;
    if (choices) {
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices).size, 3);
      assert.deepEqual([...choices].sort((x, y) => x - y), choices, "tiles in counting order");
      assert.ok(choices.every(value => value >= 1 && value <= 20));
    }
  }
});

test("choices are near neighbours; ponds keep every fish a big cell", () => {
  assert.deepEqual(choicesFor(1, 1, 6, () => 0), [1, 2, 3]);
  assert.deepEqual(choicesFor(20, 1, 20, () => 0), [18, 19, 20]);
  assert.deepEqual(gridFor(5), [3, 2]); assert.deepEqual(gridFor(10), [3, 4]); assert.deepEqual(gridFor(20), [4, 5]);
  // On a 320px phone the pond is about 290px wide: 3 columns keep each fish cell at 96px for up to 12 fish; 13–20 stay ≥ 72px.
  assert.ok(290 / gridFor(12)[0] >= 96 && 290 / gridFor(20)[0] >= 72);
  const spots = scatter(20, [4, 5], makeRng(3));
  assert.ok(spots.every(spot => spot.x > 0 && spot.x < 100 && spot.y > 0 && spot.y < 100));
  assert.deepEqual(lined(3).map(spot => [spot.x, spot.y]), [[30, 11], [70, 11], [30, 30]]);
});

test("the first win comes fast: level 1's first pond is a warm-up of two or three fish", () => {
  for (const id of [1, 4, 7]) for (let seed = 1; seed <= 100; seed++) {
    const item = createRound(id, seed).item;
    if (item.kind === "guni") assert.ok(item.n <= 3, `${item.n}`);
    if (item.kind === "nojor") assert.ok(item.n <= 2);
    if (item.kind === "beshi") assert.ok(Math.max(...item.counts) <= 3);
  }
  // 3 fish + the answer = 4 taps at most; about five seconds for a small hand.
  for (let seed = 1; seed <= 100; seed++) assert.ok(playRound(1, sharp, seed).firstTapsToWin <= 5);
});

test("a mistake costs a try, two tries make the answer glow, three in a row quietly ease the next pond", () => {
  let round = createRound(5, 5);
  const right = answerOf(round);
  const wrong = right === 1 ? 2 : right - 1;
  round = answer(round, wrong).round;
  assert.equal(glows(round), false);
  round = answer(round, wrong).round;
  assert.equal(glows(round), true);
  assert.equal(round.eased, false);
  round = answer(round, wrong).round;
  assert.ok(round.eased, "three misses in a row");
  const same = round.item;
  const result = answer(round, right);
  assert.equal(result.outcome, "right");
  assert.equal(result.round.item, same, "nothing changes under the finger");
  const next = nextItem(result.round)!;
  const [, easedHigh] = span(next.level, true);
  if (next.item.kind === "nojor") assert.ok(next.item.n <= easedHigh);
  assert.equal(next.tries, 0);
  assert.equal(result.round.firstTry, 0);
});

test("counting: each fish once; the total question comes after the last fish; no answer before", () => {
  let round = createRound(1, 11);
  assert.equal(round.stage, "count");
  assert.equal(answer(round, 3).outcome, "ignore");
  round = tapFish(round, 1)!;
  assert.deepEqual(round.counted, [1]);
  assert.equal(tapFish(round, 1), null, "a counted fish doesn't count twice");
  assert.equal(tapFish(round, 99), null);
  const item = round.item;
  if (item.kind !== "guni") throw new Error("guni");
  for (let fish = 0; fish < item.n; fish++) round = tapFish(round, fish) ?? round;
  assert.equal(round.stage, "pick");
  assert.equal(round.counted.length, item.n);
  assert.equal(tapFish(round, 0), null, "no counting after the last fish");
});

test("five first-try answers lift the ease", () => {
  let round = createRound(3, 9, true, 0);
  for (let index = 0; index < 5; index++) {
    const item = round.item;
    if (item.kind === "guni") for (let fish = 0; fish < item.n; fish++) round = tapFish(round, fish)!;
    assert.ok(round.eased || index === 4);
    round = answer(round, answerOf(round)).round;
    const next = nextItem(round);
    if (next) round = next;
  }
  assert.equal(round.rightRun, 5);
  assert.equal(round.eased, false);
});

test("which has more: the pond, then (level 9) how many more; the merge finale asks the total", () => {
  let round = createRound(9, 4);
  if (round.item.kind !== "beshi") throw new Error("beshi");
  const more = round.item.counts[0] > round.item.counts[1] ? 0 : 1, gap = Math.abs(round.item.counts[0] - round.item.counts[1]);
  round = answer(round, 1 - more).round;
  assert.equal(round.tries, 1);
  round = answer(round, more).round;
  assert.equal(round.stage, "koto");
  assert.equal(answerOf(round), gap);
  round = answer(round, gap).round;
  assert.equal(round.stage, "done");
  assert.equal(round.firstTry, 0, "one miss means not first try");
  const merge = createRound(12, 4);
  if (merge.item.kind !== "merge") throw new Error("merge");
  assert.equal(answerOf(merge), merge.item.counts[0] + merge.item.counts[1]);
  assert.equal(answer(merge, answerOf(merge)).round.stage, "done");
});

test("a round is five ponds, then it waits; stars only record it", () => {
  for (const spec of LEVELS) {
    const play = playRound(spec.id, sharp, 3);
    assert.equal(play.round.index, ITEMS - 1);
    assert.equal(nextItem(play.round), null, "never auto-advances past the round");
    const result = resultOf(play.round);
    assert.equal(result.level, spec.id);
    assert.ok(result.stars >= 1 && result.stars <= 3);
  }
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(roundStars), [1, 1, 2, 2, 3, 3]);
});

// ---- difficulty, tuned with bots ----
test("a toddler who taps anything always finishes every level, and stars are not free", () => {
  for (const spec of LEVELS) {
    let threeStars = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const play = playRound(spec.id, toddler, seed);
      assert.equal(play.round.index, ITEMS - 1);
      assert.ok(play.misses <= ITEMS * (spec.koto ? 4 : 2), "the glow after two tries means at most two wrong taps per question");
      if (resultOf(play.round).stars === 3) threeStars++;
    }
    // Guessing among three tiles gets 3 stars about 4% of the time; between two ponds about 19%.
    assert.ok(threeStars / 300 < (spec.kind === "beshi" ? 0.3 : 0.12), `${spec.id}: ${threeStars / 300}`);
  }
});

test("a careful 4–5 year old earns three stars on most levels, a sharp 6 year old on nearly all", () => {
  for (const spec of LEVELS) {
    const three = (play: ReturnType<typeof playRound>) => resultOf(play.round).stars === 3;
    const c = rate(spec.id, careful, three), s = rate(spec.id, sharp, three);
    assert.ok(c >= 0.7, `careful ${spec.id} ${spec.title}: ${c}`);
    assert.ok(s >= 0.93, `sharp ${spec.id} ${spec.title}: ${s}`);
    assert.ok(s >= c - 0.02);
  }
});

test("a careful child clears a round in a minute or two of taps", () => {
  for (const spec of LEVELS) {
    let most = 0;
    for (let seed = 1; seed <= 100; seed++) most = Math.max(most, playRound(spec.id, careful, seed).taps);
    // Roughly one tap a second: under 3 minutes even for the 20-fish finale.
    assert.ok(most <= 160, `${spec.id}: ${most}`);
  }
});
