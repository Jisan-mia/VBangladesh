// The ladder, proven: one new kind of bush per world, a named finale closing each, every level no-guess over many seeds
// (and quick to lay, measured so a busy machine can't fail it), and the bots' target rates per level.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, PER_WORLD, WORLDS, isFinale, levelOf, worldOf } from "../lib/levels";
import { flood, generate, kinds, solve, MANGO, MAX_TRIES, POST } from "../lib/orchard";
import { CASUAL, SHARP, STEADY, playOnce, rates } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

test("ladder: three orchards of ten, one new line each, a named finale closing every orchard", () => {
  assert.equal(WORLDS.length * PER_WORLD, LEVEL_COUNT);
  assert.equal(new Set(levels.map(level => levelOf(level)!.line)).size, LEVEL_COUNT, "each level says one new thing of its own");
  for (const level of levels) {
    const info = levelOf(level)!;
    assert.equal(Boolean(info.finale), isFinale(level), `level ${level}: a finale exactly at the end of an orchard`);
    assert.equal(info.forgive, isFinale(level) ? 1 : 2);
    assert.ok(info.line.length <= 95, `level ${level}: one short line (${info.line.length})`);
    assert.equal(info.line, info.line.normalize("NFC"));
    assert.ok(info.cols <= 9, "nine columns at most, so a bush stays tappable on a phone");
    assert.ok(info.rows <= 13);
    assert.ok(info.nests / (info.cols * info.rows) <= 0.2, "density stays fair");
  }
  assert.deepEqual(levels.filter(isFinale).map(level => levelOf(level)!.finale), ["বুড়ো আমগাছ", "ফজলির বাগান", "কানসাটের বড় বাগান"]);
  // One new kind of bush per world: none in the first, mangoes in the second, posts in every level of the third.
  for (const level of levels) {
    const { mangoes = 0, posts = 0 } = levelOf(level)!, world = worldOf(level);
    if (world === 1) assert.ok(!mangoes && !posts, `level ${level}`);
    if (world === 2) assert.ok(mangoes > 0 && !posts, `level ${level}`);
    if (world === 3) assert.ok(posts > 0, `level ${level}`);
  }
  // Each step grows the orchard or its par, never shrinks it, within a world.
  for (const level of levels.slice(1)) {
    if (worldOf(level) !== worldOf(level - 1)) continue;
    const a = levelOf(level - 1)!, b = levelOf(level)!;
    assert.ok(b.par >= a.par && b.nests >= a.nests && b.cols * b.rows >= a.cols * a.rows, `level ${level}`);
  }
});

test("every level, 40 seeds each: no guessing from the entry, the kinds asked for are placed, and laying is quick", () => {
  let worst = 0;
  for (const level of levels) {
    const info = levelOf(level)!;
    for (let trial = 0; trial < 40; trial++) {
      const seed = 1000 + level * 7919 + trial * 104729;
      const laid = generate(info, seed, { see: info.see, teach: level === 1 });
      assert.ok(laid.fair, `level ${level} seed ${seed}`);
      // Counted, not timed: a busy machine can't make this flaky.
      assert.ok(laid.tries < MAX_TRIES / 8, `level ${level} seed ${seed}: ${laid.tries} tries`);
      worst = Math.max(worst, laid.tries);
      const o = laid.orchard, open = new Uint8Array(o.cols * o.rows);
      assert.equal(o.nest[o.start], 0);
      assert.ok(flood(o, open, o.start).length >= 8, "the entry opens an area");
      assert.ok(solve(o, open).cleared, `level ${level} needs no guessing`);
      assert.equal(kinds(o, MANGO), info.mangoes ?? 0);
      assert.equal(kinds(o, POST), info.posts ?? 0);
      if (info.see) assert.ok([...open.keys()].some(cell => open[cell] && o.kind[cell]), `level ${level}: the new kind shows in the first opening`);
    }
  }
  // Timing as well, but only the fastest of three runs of the slowest case counts, with room for a slow, busy machine.
  const slow = levelOf(30)!;
  const times = [0, 1, 2].map(() => { const t = performance.now(); for (let k = 0; k < 10; k++) generate(slow, 50 + k); return (performance.now() - t) / 10; });
  assert.ok(Math.min(...times) < 60, `laying level 30 took ${Math.min(...times).toFixed(1)}ms on average (a cheap phone is about 5× slower)`);
  assert.ok(worst > 0);
});

test("bots: level 1 is won within 10 seconds; every level is clearable; ★★★ is a real target; each finale is its world's hardest", () => {
  // Level 1: won inside 10 s by a steady player every time, and by a casual one (who stops to think at every step) most times.
  for (const [skill, want] of [[CASUAL, 70], [STEADY, 95]] as const) {
    let quick = 0;
    for (let k = 0; k < 100; k++) { const run = playOnce(1, 11 + k * 7919, skill, 5 + k); if (run.won && run.seconds <= 10) quick++; }
    assert.ok(quick >= want, `level 1 inside 10 s, ${skill.name}: ${quick}/100`);
  }
  const hardest = new Map<number, { level: number; won: number }>();
  for (const level of levels) {
    const casual = rates(level, CASUAL, 50), steady = rates(level, STEADY, 40), sharp = rates(level, SHARP, 25);
    const tag = `level ${level}: casual won ${casual.won} ★★★ ${casual.three} ★★ ${casual.two}, steady ★★★ ${steady.three}, sharp ★★★ ${sharp.three}`;
    assert.ok(casual.won >= (worldOf(level) === 1 && !isFinale(level) ? 0.94 : 0.8), tag);
    assert.ok(casual.two >= 0.78, tag);
    assert.ok(steady.three >= 0.7, tag);
    assert.ok(sharp.three >= 0.95, tag);
    if (level > 3) assert.ok(casual.three <= 0.8, `${tag}: ★★★ must be earned`);
    const world = worldOf(level), now = hardest.get(world);
    if (!now || casual.won < now.won || (casual.won === now.won && isFinale(level))) hardest.set(world, { level, won: casual.won });
  }
  for (const [world, { level }] of hardest) assert.ok(isFinale(level), `world ${world}: the hardest level for the casual bot is ${level}, not its finale`);
});
