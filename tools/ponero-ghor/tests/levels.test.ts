// The levels as data, the plates behind old links, the solver's proof that every plate can be three-starred, and the
// headless bots that tune the targets.
import assert from "node:assert/strict";
import test from "node:test";
import { levelBoard, parOf, starsOf, targetOf, threeStar, twoStar, LEVEL_COUNT } from "../lib/game";
import { infoOf, isFinale, LEVEL_INFO, WORLDS, type Look } from "../lib/levels";
import { sizeOf } from "../lib/board";
import { casual, firstTimer, strong } from "./bot";

const LOOKS: readonly Look[] = ["digits", "picture", "faint", "only"];

test("four worlds cover levels 1–30 in order, each one plate size, each ending in a named, picture-only finale", () => {
  assert.equal(LEVEL_INFO.length, LEVEL_COUNT);
  assert.equal(WORLDS[0].from, 1);
  assert.equal(WORLDS[WORLDS.length - 1].to, LEVEL_COUNT);
  WORLDS.forEach((world, index) => {
    if (index) assert.equal(world.from, WORLDS[index - 1].to + 1, `${world.name} follows on`);
    for (let level = world.from; level <= world.to; level++) assert.equal(sizeOf(level), world.size, `level ${level} is ${world.size}×${world.size}`);
    const finale = infoOf(world.to);
    assert.equal(finale.finale, true, `${world.name} ends in a finale`);
    assert.equal(finale.look, "only", "the finale is the picture alone");
    for (let level = world.from; level < world.to; level++) assert.ok(!isFinale(level));
    // The ঘুঁটি only ever lose help inside a world: digits → picture → faint → picture only.
    for (let level = world.from + 1; level <= world.to; level++) assert.ok(LOOKS.indexOf(infoOf(level).look) >= LOOKS.indexOf(infoOf(level - 1).look), `level ${level}`);
    // The finale is the plate of its world that asks the most.
    for (let level = world.from; level < world.to; level++) assert.ok(targetOf(world.to) >= targetOf(level), `${world.name}: ${level} asks less than the finale`);
  });
  assert.equal(WORLDS.filter((_, i) => i < WORLDS.length).length, 4);
});

test("every level names one new thing, in plain Bangla", () => {
  const lessons = new Set<string>();
  for (const [index, info] of LEVEL_INFO.entries()) {
    assert.ok(info.name.length >= 3 && info.name.length <= 18, `level ${index + 1} name`);
    assert.ok(info.teach.length >= 20 && info.teach.length <= 90, `level ${index + 1} lesson is one line (${info.teach.length})`);
    assert.equal(info.teach, info.teach.normalize("NFC"));
    assert.doesNotMatch(info.teach, /আপনি|করুন|দেখুন|অসাধারণ|সহজেই/);
    assert.ok(!lessons.has(info.teach), `level ${index + 1} repeats a lesson`);
    lessons.add(info.teach);
  }
  for (const world of WORLDS) {
    const names = new Set<string>();
    for (let level = world.from; level <= world.to; level++) { assert.ok(!names.has(infoOf(level).name)); names.add(infoOf(level).name); }
  }
  assert.ok(infoOf(1).look === "digits" && parOf(1) === 2, "level 1 is two pushes on plain digits: a win inside ten seconds");
});

test("the thirty plates behind old links never change", () => {
  let hash = 2166136261;
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const cell of levelBoard(level).cells) { hash ^= cell + 1; hash = Math.imul(hash, 16777619) >>> 0; }
  assert.equal(hash, 1873167568);
});

test("the solver proves every plate can be three-starred: the strong bot earns 3 stars on all 30", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const game = strong(level);
    assert.equal(game.won, true, `level ${level} solved`);
    assert.ok(game.moves.length <= threeStar(level), `level ${level}: ${game.moves.length} > ${threeStar(level)}`);
    assert.equal(starsOf(game.moves.length, level), 3);
    if (level <= 10) assert.equal(game.moves.length, parOf(level), `level ${level}: the true shortest`);
  }
});

test("bots: a casual player (the method, wandering one push in eight) finishes every plate and mostly earns two stars", () => {
  let world1 = 0, world1Runs = 0;
  for (let level = 1; level <= 10; level++) for (let seed = 1; seed <= 40; seed++) {
    const game = casual(level, seed);
    assert.equal(game.won, true, `level ${level} seed ${seed}`);
    world1Runs++;
    if (starsOf(game.moves.length, level) >= 2) world1++;
  }
  assert.ok(world1 / world1Runs >= 0.8, `world 1: two stars on ${world1}/${world1Runs}`);
  let rest = 0, restRuns = 0;
  for (let level = 11; level <= LEVEL_COUNT; level++) for (let seed = 1; seed <= 4; seed++) {
    const game = casual(level, seed);
    assert.equal(game.won, true, `level ${level} seed ${seed}`);
    assert.ok(game.moves.length <= twoStar(level) * 2, `level ${level}: a sane length`);
    restRuns++;
    if (starsOf(game.moves.length, level) >= 2) rest++;
  }
  assert.ok(rest / restRuns >= 0.9, `worlds 2–4: two stars on ${rest}/${restRuns}`);
});

test("bots: three stars take thought on ৩×৩ — the casual player misses them on some plates", () => {
  let three = 0, runs = 0;
  for (let level = 6; level <= 10; level++) for (let seed = 1; seed <= 40; seed++) { runs++; if (starsOf(casual(level, seed).moves.length, level) === 3) three++; }
  assert.ok(three / runs <= 0.5, `levels 6–10: three stars on ${three}/${runs}`);
});

test("bots: a first-timer solves level 1 inside ten seconds (95% within 10 pushes, one push in five at random)", () => {
  let ten = 0;
  for (let seed = 1; seed <= 200; seed++) if (firstTimer(1, seed, 10).won) ten++;
  assert.ok(ten / 200 >= 0.95, `within 10: ${ten}/200`);
});
