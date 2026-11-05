// The match rules: judging, one pull per beat, combos, the new beat kinds, heaves, tempo changes, pauses, and the old ladder
// replaying exactly as the old rope.ts played it.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { LEVELS, LEVEL_COUNT, MODES, OLD_COUNT } from "../lib/levels";
import { MIN_BEATS, MIN_BEATS_V2 } from "../lib/link";
import {
  beatFloor, beatPhase, beatTime, breath, countIn, createMatch, judge, kindOf, nearestBeat, periodAt, resume, tap, windowOf,
  BIG, COUNT, COUNT_IN, HEAVE, KIND, MAX_BEATS, QUIET, REST, WARN, type Match,
} from "../lib/match";
import { advance } from "../lib/step.hot";
import { mash, play, tapsFor, STEADY } from "./bot";
import * as legacy from "./legacy/rope";

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
/** Taps once per beat of a fixed period, like the old tests did. */
function rhythm(period: number, seed: number, mean: number, spread: number, skip = 0) {
  const r = makeRng(seed), out: number[] = [];
  for (let beat = COUNT_IN; beat < COUNT_IN + MAX_BEATS + 5; beat++) if (r() >= skip) out.push(beat * period + mean + spread * gauss(r));
  return out.sort((a, b) => a - b);
}
function playLegacy(level: number, seed: number, taps: number[], frame = 1000 / 60) {
  const match = legacy.makeMatch(level, seed);
  let next = 0;
  for (let t = -400; match.winner === null && t < 200_000; t += frame) {
    while (next < taps.length && taps[next] <= t) legacy.tap(match, 0, taps[next++]);
    legacy.update(match, t);
  }
  return match;
}
/** Steps a match to `t` with taps at `taps`, from wherever it is. */
function run(m: Match, until: number, taps: number[] = [], from = -400) {
  let next = 0;
  for (let t = from; t <= until && m.winner === null; t += 1000 / 60) {
    while (next < taps.length && taps[next] <= t) tap(m, 0, taps[next++]);
    advance(m, t);
  }
}

test("old links replay exactly: the old ladder under the new rules is the old rope.ts, tap for tap", () => {
  for (let level = 1; level <= OLD_COUNT; level++) {
    const period = legacy.periodOf(level, false);
    for (const [seed, mean, spread, skip] of [[11, 40, 80, 0.05], [512, 20, 40, 0], [77, 70, 140, 0.15]] as const) {
      const taps = [...rhythm(period, seed, mean, spread, skip), ...mash(createMatch(seed, level, "n", true), seed, 2)].sort((a, b) => a - b);
      const before = playLegacy(level, seed, taps), after = play(level, seed, taps, "n", true);
      assert.equal(after.winner, before.winner, `level ${level} seed ${seed}`);
      assert.equal(after.beats, before.beats, `level ${level} seed ${seed}`);
      assert.ok(Math.abs(after.x - before.x) < 1e-12, `level ${level} seed ${seed}: ${after.x} vs ${before.x}`);
      assert.deepEqual([after.sides[0].perfect, after.sides[0].good, after.sides[0].slips, after.sides[0].missed, after.sides[1].perfect, after.sides[1].good],
        [before.sides[0].perfect, before.sides[0].good, before.sides[0].slips, before.sides[0].missed, before.sides[1].perfect, before.sides[1].good]);
    }
  }
});

test("the same seed gives the same match, a different seed a different one", () => {
  const probe = createMatch(777, 8), taps = tapsFor(probe, STEADY, 5);
  const a = play(8, 777, taps), b = play(8, 777, taps), c = play(8, 778, taps);
  assert.deepEqual([a.winner, a.beats, a.x, a.sides[1].perfect, a.heaves], [b.winner, b.beats, b.x, b.sides[1].perfect, b.heaves]);
  assert.notDeepEqual([c.beats, c.x, c.sides[1].perfect], [a.beats, a.x, a.sides[1].perfect]);
});

test("taps are judged by their time against the beat, with a window that leans late; modes scale it", () => {
  const w = windowOf("n");
  assert.equal(judge(0, w), "perfect");
  assert.equal(judge(-w.perfectEarly, w), "perfect");
  assert.equal(judge(w.perfectLate + 1, w), "good");
  assert.equal(judge(w.late, w), "good");
  assert.equal(judge(w.late + 1, w), "off");
  assert.equal(judge(-w.early - 1, w), "off");
  assert.ok(windowOf("e").late > w.late && windowOf("h").late < w.late);
  const m = createMatch(1, 1);
  assert.equal(nearestBeat(m, 3 * periodAt(m, 3) + 180), 3);
  assert.equal(nearestBeat(m, 4 * periodAt(m, 4) - 140), 4);
});

test("the windows never overlap at any tempo, mode or tempo change, so each tap belongs to one beat", () => {
  for (const slow of [false, true]) for (const mode of MODES) for (let level = 0; level <= LEVEL_COUNT; level++) {
    const m = createMatch(1, level, mode, false, slow), w = m.win;
    for (let i = 0; i < m.segs; i++) assert.ok(w.early + w.late < m.segP[i] * 0.85, `level ${level} ${mode} slow ${slow} segment ${i}`);
  }
});

test("tempo changes keep the beat grid continuous and a tap near the seam finds the right beat", () => {
  const m = createMatch(3, 11);
  assert.equal(m.segs, 3);
  for (let i = 1; i < m.segs; i++) {
    const k = m.segAt[i];
    assert.ok(Math.abs(beatTime(m, k) - (beatTime(m, k - 1) + m.segP[i - 1])) < 1e-9, "the change lands on a beat");
    assert.equal(nearestBeat(m, beatTime(m, k) + 20), k);
    assert.equal(nearestBeat(m, beatTime(m, k - 1) + 20), k - 1);
    assert.equal(beatFloor(m, beatTime(m, k) + 1), k);
  }
  assert.ok(m.segP[1] > m.segP[0] && m.segP[2] < m.segP[0], "level 11 slows, then speeds past where it began");
});

test("one pull per beat: a second tap on the same beat slips, so does a tap in the gap", () => {
  const m = createMatch(1, 2), period = periodAt(m, 0);
  advance(m, COUNT_IN * period - 200);
  assert.equal(tap(m, 0, period), "early", "taps in the count-in are ignored");
  assert.equal(m.v, 0);
  assert.equal(tap(m, 0, COUNT_IN * period + 10), "perfect");
  const after = m.v;
  assert.ok(after > 0, "a pull drags the ribbon towards us");
  assert.equal(tap(m, 0, COUNT_IN * period + 60), "extra");
  assert.ok(m.v < after && m.sides[0].combo === 0, "the double tap slips and breaks the combo");
  assert.equal(tap(m, 0, (COUNT_IN + 0.5) * period), "off");
  assert.equal(m.sides[0].slips, 2);
});

test("combos pull harder from level 2 on; level 1 has none", () => {
  const pullOf = (level: number, combo: number) => { const m = createMatch(1, level); m.sides[0].combo = combo; tap(m, 0, beatTime(m, COUNT_IN)); return m.v; };
  assert.ok(pullOf(2, 5) > pullOf(2, 0) * 1.25);
  assert.equal(pullOf(1, 5), pullOf(1, 0));
});

test("a বড় ঢোল right on the beat pulls double; a rest slips if tapped and is fine if left alone", () => {
  const m = createMatch(9, 3);
  assert.equal(kindOf(m, COUNT_IN) & KIND, BIG, "every 4th beat from the first is big");
  assert.equal(kindOf(m, COUNT_IN + 1) & KIND, 1);
  const plain = createMatch(9, 3); tap(plain, 0, beatTime(plain, COUNT_IN + 1));
  tap(m, 0, beatTime(m, COUNT_IN));
  assert.ok(Math.abs(m.v - 2 * plain.v) < 1e-9);
  assert.equal(m.sides[0].bigs, 1);

  const r = createMatch(4242, 5);
  let rest = -1;
  for (let k = COUNT_IN; k < COUNT_IN + 40 && rest < 0; k++) if ((kindOf(r, k) & KIND) === REST) rest = k;
  assert.ok(rest >= COUNT_IN + 6, "rests come after the first bars");
  const left = createMatch(4242, 5);
  assert.equal(tap(r, 0, beatTime(r, rest) + 10), "rest");
  assert.ok(r.v < 0 && r.sides[0].wrongRests === 1);
  run(left, beatTime(left, rest) - 200);
  const missed = left.sides[0].missed;
  run(left, beatTime(left, rest) + 400, [], beatTime(left, rest) - 200);
  assert.equal(left.sides[0].missed, missed, "leaving a rest alone is not a miss");
  assert.equal(left.sides[0].rested, 1);
  const counts = [0, 0];
  for (let seed = 1; seed < 50; seed++) { const s = createMatch(seed, 5); for (let k = COUNT_IN; k < COUNT_IN + 60; k++) counts[(kindOf(s, k) & KIND) === REST ? 1 : 0]++; }
  assert.ok(counts[1] / (counts[0] + counts[1]) > 0.08 && counts[1] / (counts[0] + counts[1]) < 0.2, "about one beat in eight is a rest");
});

test("a quiet stretch is 4 beats in every 12 on level 9 and later, and only there", () => {
  const m = createMatch(1, 9), quiet = [];
  for (let k = COUNT_IN; k < COUNT_IN + 24; k++) if (kindOf(m, k) & QUIET) quiet.push(k - COUNT_IN);
  assert.deepEqual(quiet, [8, 9, 10, 11, 20, 21, 22, 23]);
  for (let level = 1; level < 9; level++) for (let k = 0; k < 60; k++) assert.equal(kindOf(createMatch(1, level), k) & QUIET, 0);
});

test("a heave lands on its beats, and a tap right on the beat holds it (before or after it lands)", () => {
  const def = LEVELS[3].surge!;
  const m = createMatch(5, 4), first = COUNT_IN + def.first;
  assert.ok(kindOf(m, first - 2) & WARN && kindOf(m, first - 1) & WARN, "two beats of warning");
  assert.ok(kindOf(m, first) & HEAVE && kindOf(m, first + 1) & HEAVE && !(kindOf(m, first + 2) & HEAVE));
  // Nobody taps: the heave yanks the rope.
  const slack = createMatch(5, 4);
  run(slack, beatTime(slack, first) + 20);
  assert.equal(slack.heaves, 1); assert.equal(slack.held, 0);
  assert.ok(slack.heave > 0.9);
  // A tap right on it after the heave landed: held, and the rope comes back.
  const late = createMatch(5, 4);
  run(late, beatTime(late, first) + 20);
  const before = late.v;
  assert.equal(tap(late, 0, beatTime(late, first) + 40), "perfect");
  assert.equal(late.held, 1);
  assert.ok(late.v - before > 0.5, "the heave's pull is undone");
  // A hair early: held before it lands.
  const early = createMatch(5, 4);
  run(early, beatTime(early, first) - 40);
  tap(early, 0, beatTime(early, first) - 30);
  run(early, beatTime(early, first) + 20, [], beatTime(early, first) - 30);
  assert.equal(early.heaves, 1); assert.equal(early.held, 1);
  // A tap a little off (good) doesn't hold it.
  const loose = createMatch(5, 4);
  run(loose, beatTime(loose, first) + 20);
  assert.equal(tap(loose, 0, beatTime(loose, first) + 160), "good");
  assert.equal(loose.held, 0);
  assert.ok(breath(createMatch(5, 4), beatTime(m, first - 1) + 1) > 0.7, "the দম bar is nearly full just before");
});

test("dew on level 10: a slip costs double and a missed beat slips a little", () => {
  const dry = createMatch(1, 9), wet = createMatch(1, 10);
  tap(dry, 0, beatTime(dry, COUNT_IN) + 400); tap(wet, 0, beatTime(wet, COUNT_IN) + 400);
  assert.ok(Math.abs(wet.v - 2 * dry.v) < 1e-9);
  const idle = createMatch(1, 10); idle.def = { ...idle.def, perfect: 0, good: 0 };
  run(idle, beatTime(idle, COUNT_IN + 2));
  assert.ok(idle.x < 0, "missed beats on a wet field slide the ribbon back");
});

test("their team digs in near our line on level 7", () => {
  const m = createMatch(1, 7), w = (x: number) => { m.x = x; return m.def.weight * m.rival * (1 + m.def.digIn * Math.min(1, Math.max(0, (x - 0.5) / 0.5))); };
  assert.ok(w(0.95) > w(0.2) * 1.6);
});

test("combos climb, and a beat with no pull breaks them", () => {
  const m = createMatch(1, 0), period = periodAt(m, 0);
  for (let beat = COUNT_IN; beat < COUNT_IN + 4; beat++) { advance(m, beat * period); tap(m, 0, beat * period + 20); }
  assert.equal(m.sides[0].combo, 4);
  advance(m, (COUNT_IN + 4) * period + 300);
  assert.equal(m.sides[0].combo, 0);
  assert.equal(m.sides[0].missed, 1);
  assert.equal(m.sides[0].best, 4);
});

test("a dropped-frame phone judges the same taps the same way", () => {
  const probe = createMatch(42, 6), taps = tapsFor(probe, STEADY, 3);
  const smooth = play(6, 42, taps), choppy = play(6, 42, taps, "n", false, false, 110);
  assert.equal(choppy.winner, smooth.winner);
  assert.equal(choppy.sides[0].perfect, smooth.sides[0].perfect);
  assert.ok(Math.abs(choppy.beats - smooth.beats) <= 1);
});

test("a match always ends, and a stalemate goes to whoever leans", () => {
  const idle = play(0, 1, []);
  assert.equal(idle.winner, -1, "nobody pulled: a draw");
  assert.equal(idle.beats, MAX_BEATS);
  const lost = play(6, 9, []);
  assert.equal(lost.winner, 1, "doing nothing loses to a bot");
});

test("a pause carries on with a fresh count-in and no free pulls, even across a tempo change", () => {
  for (const level of [2, 6]) {
    const m = createMatch(5, level), taps: number[] = [];
    for (let k = COUNT_IN; k < COUNT_IN + 4; k++) taps.push(beatTime(m, k) + 10);
    const t = beatTime(m, COUNT_IN + (level === 6 ? 12 : 4)) + 100;
    run(m, t, taps);
    resume(m, t);
    assert.equal(m.sides[0].combo, 0);
    const next = beatFloor(m, t) + 1;
    assert.ok(countIn(m, beatTime(m, next) + 5) > 0, "the count-in runs again");
    assert.equal(tap(m, 0, beatTime(m, next)), "early");
    const bot = m.sides[1].perfect + m.sides[1].good;
    run(m, beatTime(m, m.playFrom) - 10, [], t);
    assert.equal(m.sides[1].perfect + m.sides[1].good, bot, "the other team waits out the count-in too");
  }
});

test("beat phase and count-in read the clock", () => {
  const m = createMatch(1, 1), p = periodAt(m, 0);
  assert.equal(beatPhase(m, 0), 0);
  assert.ok(Math.abs(beatPhase(m, p / 2) - 0.5) < 1e-9);
  assert.deepEqual([countIn(m, -100), countIn(m, 10), countIn(m, p + 10), countIn(m, 2 * p + 10), countIn(m, 3 * p + 10)], [3, 3, 2, 1, 0]);
  assert.equal(kindOf(m, 0), COUNT);
});

test("no win is ever faster than the links allow, on any level, mode or seed", () => {
  for (const old of [false, true]) for (const mode of old ? ["n" as const] : MODES) for (let level = 1; level <= (old ? OLD_COUNT : LEVEL_COUNT); level++) for (let seed = 1; seed < 25; seed++) {
    const m = createMatch(seed, level, mode, old);
    m.def = { ...m.def, perfect: 0, good: 0 };
    const taps: number[] = [];
    for (let k = COUNT_IN; k < COUNT_IN + 60; k++) if ((kindOf(m, k) & KIND) !== REST) taps.push(beatTime(m, k) + 5);
    run(m, 200_000, taps);
    assert.equal(m.winner, 0);
    assert.ok(m.beats >= (old ? MIN_BEATS : MIN_BEATS_V2), `level ${level} ${mode} old ${old}: ${m.beats}`);
  }
});
