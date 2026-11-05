// Difficulty and honesty, by headless children (tests/bot.ts) that write every set through the same pure rules the board
// uses. 40 seeds a set. The rates are the design's promises: see ai_docs/game-dev/rewrites/borno-likhi.md.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS } from "../lib/levels";
import { accuracyOf, down, move, newRound, starsOf, strokeOf, type Round } from "../lib/trace";
import { FOUR, PRECISE, WILD, scribble, writeSet, type Child } from "./bot";

const SEEDS = 40;
function rates(child: Child) {
  let sets = 0, stuck = 0, three = 0, twoUp = 0, tries = 0, letters = 0;
  for (const level of LEVELS) for (let seed = 1; seed <= SEEDS; seed++) {
    const play = writeSet(level.id, seed, child);
    sets++; tries += play.tries; letters += level.letters.length;
    if (play.stuck) { stuck++; continue; }
    const stars = starsOf(play.round.helps, accuracyOf(play.round));
    if (stars === 3) three++;
    if (stars >= 2) twoUp++;
  }
  return { sets, stuck: stuck / sets, three: three / sets, twoUp: twoUp / sets, triesPerLetter: tries / letters };
}

test("a careful finger clears every set, and 3 stars come to a careful finger (≥ 95% of sets)", () => {
  const r = rates(PRECISE);
  assert.equal(r.stuck, 0);
  assert.ok(r.three >= 0.95, `3 stars on ${(r.three * 100).toFixed(0)}% of sets`);
});

test("a shaky 4-year-old clears every set, 2 stars or more on ≥ 95% of sets, 3 stars on ≥ 85%", () => {
  const r = rates(FOUR);
  assert.equal(r.stuck, 0);
  assert.ok(r.twoUp >= 0.95, `2+ stars ${(r.twoUp * 100).toFixed(0)}%`);
  assert.ok(r.three >= 0.85, `3 stars ${(r.three * 100).toFixed(0)}%`);
});

test("a toddler banging near the path still gets through (≥ 99% of sets), and the stars say how well", () => {
  const r = rates(WILD), careful = rates(PRECISE);
  assert.ok(r.stuck <= 0.01, `stuck ${(r.stuck * 100).toFixed(1)}%`);
  assert.ok(r.three < careful.three - 0.2, "a wild hand earns fewer 3-star sets than a careful one");
  assert.ok(r.twoUp >= 0.75, `2+ stars ${(r.twoUp * 100).toFixed(0)}%`);
});

test("scribbling is not tracing: it takes far longer, and it never earns more than 1 star", () => {
  const careful = rates(PRECISE);
  let tries = 0, letters = 0;
  for (const level of LEVELS) for (let seed = 1; seed <= 6; seed++) {
    const play = scribble(level.id, seed);
    tries += play.tries; letters += level.letters.length;
    if (!play.stuck) assert.equal(starsOf(play.round.helps, accuracyOf(play.round)), 1, `${level.title}: a scribbled set is 1 star`);
  }
  assert.ok(tries / letters >= careful.triesPerLetter * 3, `scribble ${(tries / letters).toFixed(1)} tries a letter, careful ${careful.triesPerLetter.toFixed(1)}`);
});

test("tracing a stroke backwards, or any stroke from its far end, never fills it", () => {
  for (const level of LEVELS) for (const char of level.letters) {
    let round: Round = newRound(level.id);
    round = { ...round, letters: [char], index: 0 };
    const stroke = strokeOf(round)!;
    if (stroke.dot) continue;
    const back = [...stroke.samples].reverse();
    let [now] = down(round, back[0]);
    for (let i = 2; i < back.length; i += 2) [now] = move(now, back[i - 2], back[i]);
    assert.ok(now.stroke === 0 && !now.letterDone, `${char}: backwards does not write the stroke`);
  }
});

test("the first stroke of the first set is written within 10 s of finger time", () => {
  const round = newRound(1), stroke = strokeOf(round)!;
  const events = Math.ceil(stroke.samples.length / 3) + 3;
  assert.ok(events * 16 + 450 < 10000, `${events} events`);
  let now = down(round, stroke.samples[0])[0], count = 1;
  for (let i = 3; i < stroke.samples.length && now.stroke === 0; i += 3) { [now] = move(now, stroke.samples[i - 3], stroke.samples[i]); count++; }
  assert.equal(now.stroke, 1, "the stroke is written");
  assert.ok(count * 16 + 450 < 10000);
});
