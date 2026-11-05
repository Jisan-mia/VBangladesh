// Difficulty by bots. Each plays a whole level at 60 steps a second the way a person would (late or early hands, beats missed,
// taps between beats), over 120 seeds, and the rates it earns are asserted. Stars are a record only and the game is forgiving by
// design: every bot finishes every level, a small child still earns two stars, and the third star is nearer for a steady hand.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS } from "../lib/levels";
import { CHILD, RANDOM, STEADY, TODDLER, playLevel, rate } from "./bot";

test("every bot finishes every level, in about the time the plan says", () => {
  for (const level of LEVELS) for (const player of [RANDOM, TODDLER, CHILD, STEADY]) {
    const played = playLevel(level.id, player, 7);
    assert.equal(played.run.phase, 2, `${level.rhyme}`);
    assert.ok(Math.abs(played.ms / 1000 - (level.beatMs * 2 + played.run.plan.total) / 1000) < 0.1, `${level.rhyme} ${played.ms}`);
  }
});

test("a 3-year-old (a late, loose hand that misses a third of the beats) earns two stars nearly every time, and three on the first levels most of the time", () => {
  for (const level of LEVELS) assert.ok(rate(level.id, TODDLER, 2) >= 0.97, `${level.rhyme} two stars: ${rate(level.id, TODDLER, 2)}`);
  assert.ok(rate(1, TODDLER, 3) >= 0.6, `hattima ${rate(1, TODDLER, 3)}`);
  assert.ok(rate(5, TODDLER, 3) >= 0.6, `notun ${rate(5, TODDLER, 3)}`);
  // The finales are for a steadier hand: still reachable, not a sure thing.
  for (const level of LEVELS.filter(item => item.finale)) {
    const three = rate(level.id, TODDLER, 3);
    assert.ok(three >= 0.2 && three <= 0.85, `${level.finale} ${three}`);
  }
});

test("a 5-year-old (steady enough, misses one beat in seven) earns three stars on 90% of rounds, a 6-year-old on nearly all", () => {
  for (const level of LEVELS) {
    assert.ok(rate(level.id, CHILD, 3) >= 0.9, `${level.rhyme} child ${rate(level.id, CHILD, 3)}`);
    assert.ok(rate(level.id, STEADY, 3) >= 0.97, `${level.rhyme} steady ${rate(level.id, STEADY, 3)}`);
  }
});

test("the first win comes within 10 seconds on the first level, for every kind of hand", () => {
  for (const player of [TODDLER, CHILD, STEADY]) for (let seed = 1; seed <= 30; seed++) {
    const played = playLevel(1, player, seed);
    assert.ok(played.firstOnBeatMs > 0 && played.firstOnBeatMs < 10000, `${seed}: ${played.firstOnBeatMs}`);
  }
});

test("mashing the drum wins nothing extra by hitting the same beat twice: a beat is one hit", () => {
  const masher = playLevel(1, RANDOM, 3);
  assert.ok(masher.hits <= masher.words);
  assert.ok(masher.run.taps > masher.hits, "many more taps than hits");
  assert.ok(masher.stars >= 1 && masher.stars <= 3);
});

test("the same seed plays the same round (the rules are deterministic)", () => {
  for (const level of LEVELS) {
    const a = playLevel(level.id, CHILD, 42), b = playLevel(level.id, CHILD, 42);
    assert.equal(a.hits, b.hits);
    assert.equal(a.onBeat, b.onBeat);
    assert.deepEqual(Array.from(a.run.hit), Array.from(b.run.hit));
  }
});
