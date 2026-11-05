import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, LEVEL_COUNT, PER_WORLD, changes, isFinale, lesson, worldOf } from "../lib/levels";
import { newGame, starsOf } from "../lib/play";
import { PICTURES, worldSet } from "../lib/pictures";
import { PLAYERS, play } from "./bot";

const SEEDS = 300;
/** Per level: how often each player earns each star count, over the same 300 deals. */
const rates = (() => {
  const done = new Map<number, Record<"casual" | "steady" | "sharp", number[]>>();
  return (level: number) => {
    let row = done.get(level);
    if (!row) {
      row = { casual: [0, 0, 0, 0], steady: [0, 0, 0, 0], sharp: [0, 0, 0, 0] };
      const spec = LEVELS[level - 1];
      for (let seed = 1; seed <= SEEDS; seed++) for (const name of ["casual", "steady", "sharp"] as const) row[name][starsOf(spec, play(seed, spec, PLAYERS[name]).game.moves)]++;
      done.set(level, row);
    }
    return row;
  };
})();
const share = (counts: number[], atLeast: number) => counts.slice(atLeast).reduce((sum, n) => sum + n, 0) / SEEDS;

test("the ladder: 3 worlds × 8, a finale last in each, and every level teaches one thing", () => {
  assert.equal(LEVEL_COUNT, 24);
  LEVELS.forEach((spec, index) => {
    const level = index + 1;
    assert.equal(worldOf(level), spec.world);
    assert.ok(spec.three < spec.two && spec.three >= spec.pairs, `level ${level}: par`);
    assert.ok(spec.two - spec.three >= 2 || level === 1, `level ${level}: a one-move slip must not skip a star`);
    assert.ok(lesson(level).length > 0, `level ${level} says what is new`);
    assert.ok(changes(level).length >= 1, `level ${level} has a chip`);
    if (level % PER_WORLD !== 1) {
      const before = LEVELS[index - 1];
      const moved = (["pairs", "alike", "peek", "every", "flyers"] as const).filter(key => spec[key] !== before[key]);
      assert.equal(moved.length, 1, `level ${level} changes exactly one thing: ${moved}`);
    }
  });
  assert.deepEqual([8, 16, 24].map(isFinale).concat([7].map(isFinale)), [true, true, true, false]);
  assert.deepEqual(LEVELS.filter(spec => isFinale(LEVELS.indexOf(spec) + 1)).map(spec => spec.pairs), [12, 12, 12]);
  // The three tables' twists.
  assert.ok(LEVELS.slice(0, 8).every(spec => !spec.peek && !spec.every));
  assert.ok(LEVELS.slice(8, 16).every(spec => spec.peek > 0 && !spec.every));
  assert.ok(LEVELS.slice(16).every(spec => !spec.peek && spec.every > 0));
});

test("every board can be dealt: enough pictures, each twice, look-alikes in pairs", () => {
  for (const [index, spec] of LEVELS.entries()) {
    for (let seed = 1; seed <= 60; seed++) {
      const game = newGame(seed, spec);
      assert.equal(game.board.length, spec.pairs * 2);
      const counts = new Map<number, number>();
      for (const id of game.board) counts.set(id, (counts.get(id) ?? 0) + 1);
      assert.equal(counts.size, spec.pairs, `level ${index + 1}`);
      assert.ok([...counts.values()].every(count => count === 2));
      assert.ok([...counts.keys()].every(id => PICTURES[id].world === spec.world));
      const twins = [...counts.keys()].filter(id => PICTURES[id].twinOf >= 0 && counts.has(PICTURES[id].twinOf));
      assert.equal(twins.length, spec.alike, `level ${index + 1} look-alike pairs`);
      assert.equal(game.demo !== null, spec.demo);
    }
  }
  for (const world of [0, 1, 2]) assert.equal(worldSet(world).base.length, 10);
});

test("level 1: a casual player clears it inside 10 seconds on nearly every deal", () => {
  const spec = LEVELS[0];
  let quick = 0;
  for (let seed = 1; seed <= SEEDS; seed++) if (play(seed, spec, PLAYERS.casual).seconds <= 10) quick++;
  assert.ok(quick / SEEDS >= 0.95, `${quick}/${SEEDS}`);
});

test("stars mean something: the sharp player gets three on most deals, the steady one on about half, the casual one on few", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const row = rates(level), label = `level ${level}`;
    assert.ok(share(row.sharp, 3) >= 0.85, `${label}: sharp ★★★ ${share(row.sharp, 3)}`);
    assert.ok(share(row.steady, 3) >= 0.45, `${label}: steady ★★★ ${share(row.steady, 3)}`);
    assert.ok(share(row.casual, 2) >= (level < PER_WORLD ? 0.75 : 0.6), `${label}: casual ★★+ ${share(row.casual, 2)}`);
    if (level >= 3) assert.ok(share(row.casual, 3) <= 0.7, `${label}: casual ★★★ ${share(row.casual, 3)}`);
  }
});

test("each finale is the hardest board of its table", () => {
  for (const world of [0, 1, 2]) {
    const finale = (world + 1) * PER_WORLD, others = Array.from({ length: PER_WORLD - 1 }, (_, i) => world * PER_WORLD + i + 1);
    const lowest = Math.min(...others.map(level => share(rates(level).steady, 3)));
    assert.ok(share(rates(finale).steady, 3) <= lowest + 0.0001, `world ${world + 1}: finale ${share(rates(finale).steady, 3)} vs ${lowest}`);
  }
});
