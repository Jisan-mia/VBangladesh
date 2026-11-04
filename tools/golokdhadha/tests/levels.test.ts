// Every level: generated from its seed and pinned, solvable without traps, inside its star targets for both bots,
// and teaching one new thing; plus the daily maze, par times and this phone's unlock.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { checksum, exits } from "../lib/board";
import {
  bestOf, boardOf, dailyBoard, dhakaDate, fastestTenths, isDailySeed, LEVEL_COUNT, LEVELS, levelBoard, nextAhead, openingLevel, openLevel,
  parOf, readAhead, starsOf, suggestedLevel, WORLDS, type Mode,
} from "../lib/levels";
import { bestWalk, trapFree } from "../lib/solve";
import { playBot } from "./bot";

/** If one of these changes, a shipped maze changed under everyone's links and saved stars. Never update them casually. */
const PINNED = ["4v2txz", "1m1onx6", "11lce0y", "1rcenm0", "8s67ho", "5w7x4u", "14jx5et", "194w69p", "t6tqfj", "c4qihc", "nq706a", "4rn5bs", "g4ibvn", "1udh8jw", "x4t5xo", "1n9drkv", "1nhdpuj", "166vjnj", "1iesxv7", "1so1whv", "jvl2fd", "sgd7yu", "va2ker", "btuyzu", "1d3lx5o", "5a6hlp", "1w0t56v", "19pfq3p", "69zpmy", "1grqity"];

const lvl = (level: number) => ({ level, seed: 0, old: false });
const count = (board: ReturnType<typeof levelBoard>["board"]) => {
  let keys = 0, gates = 0, oneWay = 0, stands = 0;
  for (let i = 0; i < board.open.length; i++) {
    if (board.key[i]) keys++;
    if (board.portal[i] >= 0) stands++;
    for (let d = 1; d <= 8; d <<= 1) if (board.oneWay[i] & d) oneWay++;
    if (board.gate[i * 4 + 1] || board.gate[i * 4 + 2]) gates++;
  }
  return { keys, gates, oneWay, stands };
};

test("30 levels in five worlds of six, each world ending on a named finale", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.equal(WORLDS.length, 5);
  for (let world = 0; world < 5; world++) {
    const mine = LEVELS.filter(def => def.world === world);
    assert.equal(mine.length, 6);
    assert.deepEqual(mine.map(def => def.finale), [false, false, false, false, false, true], `world ${world}: the finale is last`);
  }
  assert.equal(new Set(LEVELS.map(def => def.name)).size, 30, "every level has its own name");
  for (const def of LEVELS) assert.ok(def.teach.length > 8 && def.teach.length < 70, def.name);
});

test("every level's board is pinned, solvable, free of traps, and never circles", () => {
  LEVELS.forEach((def, index) => {
    const { board, graph } = levelBoard(index + 1);
    assert.equal(checksum(board), PINNED[index], `level ${index + 1} ${def.name}`);
    assert.equal(board.size, def.spec.size);
    assert.ok(graph.sound, "no lane circles for ever");
    assert.ok(trapFree(graph), `level ${index + 1}: from everywhere you can reach, the shop is still reachable`);
    const best = bestWalk(graph, 14, 0.5)!;
    assert.ok(Math.abs(best.swipes - def.spec.swipes) <= 2, `level ${index + 1}: ${best.swipes} turns, wanted about ${def.spec.swipes}`);
  });
});

test("each world brings its own piece, and the pieces each level asks for are really needed", () => {
  LEVELS.forEach((def, index) => {
    const { board } = levelBoard(index + 1), pieces = count(board), best = bestOf(lvl(index + 1)), spec = def.spec;
    if (spec.keys) { assert.equal(pieces.keys, spec.keys.count); assert.equal(pieces.gates, spec.keys.count); assert.equal(best.keys, spec.keys.count, `level ${index + 1}: the best walk takes every key`); }
    else assert.equal(pieces.keys + pieces.gates, 0);
    if (spec.rides) { assert.equal(pieces.stands, spec.rides * 2); assert.ok(best.rides >= spec.rides, `level ${index + 1}: the rides are the only way across`); }
    else assert.equal(pieces.stands, 0);
    assert.equal(pieces.oneWay > 0, !!spec.current, `level ${index + 1}: one-way lanes only where the spec has them`);
    assert.equal(board.dark > 0, !!spec.dark);
    for (let cell = 0; cell < board.open.length; cell++) if (board.portal[cell] >= 0) assert.equal(exits(board, cell, 3), 1, "a stand sits at a lane's end");
  });
  // World by world, the new piece first appears in that world.
  assert.ok(LEVELS.slice(0, 6).every(def => !def.spec.keys && !def.spec.current && !def.spec.dark && !def.spec.rides));
  assert.ok(LEVELS[6].spec.keys && !LEVELS.slice(0, 6).some(def => def.spec.keys));
  assert.ok(LEVELS[12].spec.current && !LEVELS.slice(0, 12).some(def => def.spec.current));
  assert.ok(LEVELS[18].spec.dark && !LEVELS.slice(0, 18).some(def => def.spec.dark));
  assert.ok(LEVELS[24].spec.rides && !LEVELS.slice(0, 24).some(def => def.spec.rides));
});

test("par: three stars come before two, nobody can beat the shortest walk, and level 1 is won in seconds", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const mode of ["e", "n", "h"] as Mode[]) for (const slow of [false, true]) {
    const par = parOf(lvl(level), mode, slow), fastest = fastestTenths(lvl(level), slow);
    assert.ok(fastest < par.three && par.three < par.two, `level ${level} ${mode} ${slow}`);
  }
  assert.ok(parOf(lvl(1), "n", false).three <= 50);
  assert.equal(starsOf(10, parOf(lvl(1), "e", false), "e"), 2, "easy tops out at two stars");
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const fast = parOf(lvl(level), "n", false), slow = parOf(lvl(level), "n", true), walk = bestOf(lvl(level)).cells;
    // ধীরে খেলো adds exactly the slower walking, never a free allowance on top.
    assert.ok(slow.three - fast.three <= Math.ceil(walk * (1 / 7 - 1 / 14) * 10) + 1, `level ${level}`);
  }
});

const RUNS = 120;
function rates(level: number, mode: Mode, slow: boolean) {
  const par = parOf(lvl(level), mode, slow);
  let skilled3 = 0, casual2 = 0, casual3 = 0, finished = 0, quick = 0;
  for (let run = 0; run < RUNS; run++) {
    const a = playBot(lvl(level), mode, "skilled", run * 7 + 1, slow), b = playBot(lvl(level), mode, "casual", run * 13 + 5, slow);
    if (starsOf(a.tenths, par, mode) === 3) skilled3++;
    const stars = starsOf(b.tenths, par, mode);
    if (stars >= 2) casual2++;
    if (stars === 3) casual3++;
    if (a.finished && b.finished) finished++;
    if (b.tenths <= 100) quick++;
  }
  return { skilled3: skilled3 / RUNS, casual2: casual2 / RUNS, casual3: casual3 / RUNS, finished: finished / RUNS, quick: quick / RUNS };
}

test("bots: every run reaches the shop; the skilled bot earns 3 stars, the casual bot 2, and 3 stars stays a real target", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const r = rates(level, "n", false);
    assert.equal(r.finished, 1, `level ${level}`);
    assert.ok(r.skilled3 >= 0.85, `level ${level}: skilled 3★ ${r.skilled3}`);
    assert.ok(r.casual2 >= 0.7, `level ${level}: casual 2★ ${r.casual2}`);
    assert.ok(r.casual3 <= 0.3, `level ${level}: casual 3★ ${r.casual3}`);
  }
  assert.ok(rates(1, "n", false).quick >= 0.9, "the casual bot clears level 1 inside 10 s");
});

test("bots: ধীরে খেলো never makes stars easier, and কঠিন stays fair", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const normal = rates(level, "n", false), slow = rates(level, "n", true), hard = rates(level, "h", false);
    assert.ok(slow.skilled3 <= normal.skilled3 + 0.05 && slow.casual2 <= normal.casual2 + 0.05, `level ${level}: slow is not easier`);
    assert.ok(slow.skilled3 >= 0.85 && slow.casual2 >= 0.6, `level ${level}: slow still fair (${slow.skilled3}, ${slow.casual2})`);
    assert.equal(hard.finished, 1);
    assert.ok(hard.skilled3 >= 0.85 && hard.casual2 >= 0.6, `level ${level}: hard (${hard.skilled3}, ${hard.casual2})`);
  }
});

test("the daily maze follows Dhaka's calendar, takes a world's piece by date, and is always fair", () => {
  assert.equal(dhakaDate(Date.UTC(2026, 9, 11, 17, 59)), 20261011);
  assert.equal(dhakaDate(Date.UTC(2026, 9, 11, 18, 0)), 20261012, "midnight in Dhaka is 18:00 UTC");
  for (const ok of [20261012, 20280229, 20991231]) assert.ok(isDailySeed(ok), String(ok));
  for (const bad of [20251231, 20261301, 20261032, 20270229, 21000101, 2026101, 20261012.5]) assert.ok(!isDailySeed(bad), String(bad));
  let day = Date.UTC(2026, 10, 1, 6);
  for (let i = 0; i < 40; i++, day += 86_400_000) {
    const seed = dhakaDate(day), { board, graph } = dailyBoard(seed);
    assert.equal(board.size, 12);
    assert.equal(board.world, seed % 5);
    assert.ok(trapFree(graph) && graph.sound, String(seed));
  }
  assert.equal(checksum(dailyBoard(20261104).board), "htjelb", "the daily is the same on every phone");
  assert.equal(boardOf({ level: 0, seed: 20261104, old: false }), dailyBoard(20261104), "cached");
});

test("this phone's unlock: old progress opens what it opened, and a friend's far level opens no gap", () => {
  assert.equal(openLevel({}, []), 1);
  const old = readLevels('{"1":3,"2":2,"3":1}', LEVEL_COUNT);
  assert.equal(openLevel(old, []), unlockedLevel(old, LEVEL_COUNT), "saved progress from before opens the same");
  assert.equal(openingLevel(old), 4, "starts on the furthest open level not at three stars");
  // Clear a friend's level 20 with only 1–2 cleared: it keeps its stars, 3–19 stay shut.
  const mine = { 1: 3, 2: 3 }, ahead = nextAhead(mine, [], 20), after = { ...mine, 20: 2 };
  assert.deepEqual(ahead, [20]);
  assert.equal(openLevel(after, ahead), 3);
  // Reaching it by your own play makes it yours.
  let stars: Record<number, number> = { ...after }, list = ahead;
  for (let level = 3; level <= 19; level++) { list = nextAhead(stars, list, level); stars = { ...stars, [level]: 1 }; }
  assert.equal(openLevel(stars, list), 21);
  assert.deepEqual(readAhead("junk"), []);
  assert.deepEqual(readAhead("[3, 3, 99, \"4\", 7]"), [3, 7]);
  assert.equal(suggestedLevel({ 1: 3, 2: 1 }, 3), 3);
});
