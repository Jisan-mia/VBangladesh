// The levels as data, and bots proving each is playable to the end at its target rate.
import assert from "node:assert/strict";
import test from "node:test";
import { ITEMS, itemById } from "../lib/items";
import { LEVELS, LEVEL_COUNT, WORLDS, levelOf, nextUp, placeInWorld, recommended, worldLevels } from "../lib/levels";
import { EASE_AFTER, HARDEN_AFTER, createRound, current, itemsOf, predict, shownChoices, watched, advance } from "../lib/round";
import { play } from "./bot";

test("three worlds, nine levels, ids 1–9, each finale last in its world", () => {
  assert.equal(LEVEL_COUNT, 9);
  assert.deepEqual(LEVELS.map(level => level.id), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(WORLDS.length, 3);
  for (const world of WORLDS) {
    const levels = worldLevels(world.id);
    assert.equal(levels.length, 3, world.id);
    assert.equal(levels[2].finale, true, `${world.id}: the third level is its finale`);
    assert.ok(!levels[0].finale && !levels[1].finale);
    assert.deepEqual(levels.map(level => placeInWorld(level.id)), [1, 2, 3]);
  }
  assert.equal(levelOf(0), LEVELS[0]);
  assert.equal(levelOf(99), LEVELS[8]);
  assert.equal(nextUp(3), 4);
  assert.equal(nextUp(9), 9);
  assert.equal(recommended("pukur", {}), 1);
  assert.equal(recommended("pukur", { 1: 2 }), 2);
  assert.equal(recommended("pukur", { 1: 1, 2: 1, 3: 1 }), 3, "all done: the finale");
});

test("every level names real experiments, every experiment is used, and each level teaches one thing", () => {
  const used = new Set<string>();
  for (const level of LEVELS) {
    for (const id of [...level.fixed, ...level.pool]) { assert.ok(ITEMS.some(item => item.id === id), `${level.id}: ${id}`); used.add(id); }
    assert.ok(level.take >= 2 && level.take <= level.pool.length, `level ${level.id} take`);
    assert.ok(level.name.length > 0 && level.line.length > 10);
  }
  assert.deepEqual([...used].sort(), ITEMS.map(item => item.id).sort(), "all 21 experiments are in a level");
  // The first level of each world: the whole pool, in teaching order, the same every time.
  for (const id of [1, 2, 4, 5, 7, 8]) {
    const items = itemsOf(id, 1);
    assert.deepEqual(items.map(item => item.id), levelOf(id).pool.map(itemById).map(item => item.id));
    assert.deepEqual(itemsOf(id, 99).map(item => item.id), items.map(item => item.id), "no draw: the same for every seed");
  }
});

test("level 1 wins in ten seconds: three experiments of two picture choices, the coconut first", () => {
  const items = itemsOf(1, 5);
  assert.equal(items.length, 3);
  assert.equal(items[0].id, "narkel-it");
  for (const item of items) { assert.equal(item.choices.length, 2); assert.equal(item.scene, "pond"); }
});

test("finales: fixed ones always in, the rest drawn by seed, no repeats, same seed same round", () => {
  const seen = new Set<string>();
  for (let seed = 1; seed <= 60; seed++) {
    const items = itemsOf(9, seed);
    assert.equal(items.length, 4);
    assert.equal(new Set(items.map(item => item.id)).size, 4, "no repeats");
    assert.ok(items.some(item => item.id === "chand") && items.some(item => item.id === "brishti"), "the moon and the rain are always there");
    assert.deepEqual(itemsOf(9, seed).map(item => item.id), items.map(item => item.id));
    items.forEach(item => seen.add(item.id));
    assert.ok(itemsOf(3, seed).some(item => item.id === "borof"));
    assert.equal(itemsOf(6, seed).length, 4);
  }
  assert.ok(seen.size >= 6, "the mix varies");
});

test("bot: a random guesser finishes every level, every seed, with the last guess winning", () => {
  for (const level of LEVELS) for (let seed = 1; seed <= 400; seed++) {
    const round = play(level.id, seed, { knows: 0, replays: true });
    assert.equal(round.full, true);
    assert.equal(round.matched.length, round.items.length, "one guess per experiment");
  }
});

test("bot: a child who knows 70% matches about 70% on level 1 and every level stays playable by a 4-year-old", () => {
  let right = 0, total = 0;
  for (let seed = 1; seed <= 400; seed++) { const round = play(1, seed, { knows: 0.7 }); right += round.right; total += round.items.length; }
  const rate = right / total;
  assert.ok(rate > 0.72 && rate < 0.85, `level 1: two picture choices, so a 70% child gets ${(rate * 100).toFixed(0)}% (70% known plus lucky guesses)`);
  for (const level of LEVELS) {
    let hit = 0, all = 0;
    for (let seed = 1; seed <= 400; seed++) { const round = play(level.id, seed, { knows: 0.7 }); hit += round.right; all += round.items.length; }
    assert.ok(hit / all >= 0.7, `level ${level.id}: ${(hit / all * 100).toFixed(0)}%`);
  }
});

test("difficulty: three missed guesses drop a wrong choice, five matched bring it back, never announced", () => {
  const three = ITEMS.find(item => item.choices.length === 3)!;
  assert.equal(shownChoices(three, false).length, 3);
  const eased = shownChoices(three, true);
  assert.equal(eased.length, 2);
  assert.ok(eased.includes(three.answer));
  const two = ITEMS.find(item => item.choices.length === 2)!;
  assert.deepEqual(shownChoices(two, true), [0, 1]);

  const round = createRound(6, 5);
  const answer = (right: boolean) => {
    const item = current(round);
    predict(round, right ? item.answer : shownChoices(item, round.eased).find(index => index !== item.answer)!);
    watched(round); round.index + 1 < round.items.length && advance(round);
  };
  for (let i = 0; i < EASE_AFTER - 1; i++) answer(false);
  assert.equal(round.eased, false);
  answer(false);
  assert.equal(round.eased, true, `eased after ${EASE_AFTER} misses in a row`);
  const again = createRound(6, 7, true, 0);
  for (let i = 0; i < HARDEN_AFTER - 1; i++) { const item = current(again); predict(again, item.answer); watched(again); advance(again); if (again.index >= again.items.length - 1) break; }
  assert.equal(createRound(2, 1, true).eased, true, "the next round keeps the eased pace, silently");
});
