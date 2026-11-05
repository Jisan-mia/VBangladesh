import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, LEVEL_COUNT, ORDER, WORLDS, givenOf, isLevel, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf, targetOf, worldOf } from "../lib/levels";
import { has, noteCount, rowsAt, ROWS, STEPS_NARROW } from "../lib/music";
import { beatAt, beatMs, playLength } from "../lib/play";
import { canCheck, canTap, check, clear, createRound, gapLine, hintOn, hintTune, listened, resultOf, tap } from "../lib/round";
import { EXAMPLE, NEED, judge } from "../lib/rules";
import { parseTune } from "../lib/music";
import { FIVE, GUESSER, LEARNER, playLevel } from "./bot";

const SEEDS = 2000;

test("levels: sixteen, ids 1–16 once each, four worlds with a finale each, old ids keep their old tunes", () => {
  assert.equal(LEVEL_COUNT, 16);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), Array.from({ length: 16 }, (_, i) => i + 1));
  assert.deepEqual(WORLDS.map(world => world.kind), ["copy", "copy", "gap", "make"]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id);
    assert.ok(ids.length >= 3);
    assert.ok(levelOf(ids[ids.length - 1]).finale, `${world.name} ends on a finale`);
    assert.equal(ids.filter(id => levelOf(id).finale).length, 1);
    assert.ok(ids.every(id => levelOf(id).kind === world.kind && worldOf(id) === world));
  }
  // The old ten (stars saved on them stay valid): these are the tunes they always had.
  const old = ["0 1 2 3 . .", "4 3 2 1 . .", "0 2 4 2 0 .", "2 2 4 4 2 .", "0 1 2 0 1 2", "4 2 3 1 2 0", "02 . 13 . 24 0", "4 3 24 1 02 .", "04 1 3 2 2 04", "0 13 2 4 13 0"];
  old.forEach((text, index) => assert.equal(levelOf(index + 1).tune, text, `id ${index + 1}`));
  assert.ok(isLevel(16) && !isLevel(17) && !isLevel(0));
  assert.equal(placeOf(1), 1); assert.equal(placeOf(6), 5); assert.equal(placeOf(16), 16);
  assert.equal(nextInOrder(6), 7); assert.equal(nextInOrder(16), 0);
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 1 }), 4, "play order, not id order");
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 3]))), 16);
});

test("worlds: each teaches one idea the tunes really have", () => {
  const tunes = (world: number) => levelsOfWorld(world as 0).map(id => targetOf(id)!);
  // World 0: single notes only, six beats; the first level is four notes and the finale has no rest.
  assert.ok(tunes(0).every(tune => tune.length === STEPS_NARROW && tune.every(mask => rowsAt(mask).length <= 1)));
  assert.equal(noteCount(targetOf(1)!), 4);
  assert.equal(noteCount(targetOf(6)!), 6);
  // The new idea of each level.
  assert.ok(targetOf(2)!.findIndex(Boolean) === 0 && rowsAt(targetOf(2)![0])[0] === 4, "down: starts on the top note");
  assert.ok(targetOf(4)!.some((mask, i, all) => mask && mask === all[i + 1]), "twice: the same note back to back");
  const hill = targetOf(3)!.filter(Boolean).map(mask => rowsAt(mask)[0]);
  assert.deepEqual(hill, [0, 2, 4, 2, 0], "hill: up and back down");
  // World 1: every tune has a beat with two notes together, and the pair of the last one spans the whole grid.
  assert.ok(tunes(1).every(tune => tune.some(mask => rowsAt(mask).length === 2)));
  assert.ok(tunes(1).every(tune => tune.every(mask => rowsAt(mask).length <= 2)));
  assert.deepEqual(rowsAt(targetOf(9)![0]), [0, 4]);
  // World 2: one note per beat, and each gap can be worked out from the tune around it (a repeat three beats away, or the mirror).
  for (const id of levelsOfWorld(2)) {
    const level = levelOf(id), tune = targetOf(id)!, gaps = level.gaps!;
    assert.ok(tune.every(mask => rowsAt(mask).length === 1));
    assert.ok(gaps.every(step => tune[step] !== 0));
    for (const step of gaps) {
      const clue = tune.some((mask, other) => !gaps.includes(other) && mask === tune[step] && (Math.abs(other - step) === 3 || other + step === 6));
      assert.ok(clue, `level ${id}: beat ${step} can be worked out`);
    }
  }
  assert.deepEqual(levelsOfWorld(2).map(id => levelOf(id).gaps!.length), [1, 2, 1, 2], "gaps grow: one, two, one in the middle, two");
  // World 3: a rule, no target.
  for (const id of levelsOfWorld(3)) assert.equal(targetOf(id), null);
});

test("givenOf: nothing on a copy or make level; a gap level has everything but its gaps", () => {
  assert.deepEqual(givenOf(1), Array(6).fill(0));
  assert.equal(givenOf(14), null);
  const given = givenOf(5)!;
  assert.deepEqual(given, parseTune("0 1 2 0 1 ."));
  assert.equal(noteCount(given), noteCount(targetOf(5)!) - 1);
});

test("rules: rising, hill and own accept what they should and nothing else", () => {
  for (const rule of ["rising", "hill", "own"] as const) { assert.ok(judge(rule, EXAMPLE[rule]).ok, `${rule} example`); assert.ok(noteCount(EXAMPLE[rule]) >= NEED[rule]); }
  const t = parseTune;
  assert.ok(judge("rising", t("0 1 2 3 . .")).ok && judge("rising", t(". 0 . 2 3 4")).ok, "any climb, with rests");
  assert.equal(judge("rising", t("0 1 2 . . .")).why, "few");
  assert.equal(judge("rising", t("0 2 1 3 . .")).why, "shape");
  assert.equal(judge("rising", t("0 1 2 3 3 .")).why, "shape", "a repeat is not a climb");
  assert.equal(judge("rising", t("0 1 2 13 . .")).why, "chord");
  assert.equal(judge("rising", t(". . . . . .")).why, "empty");
  assert.ok(judge("hill", t("1 2 3 4 3 .")).ok && judge("hill", t("0 1 3 2 1 0")).ok);
  assert.equal(judge("hill", t("0 1 2 3 4 .")).why, "shape", "up only is not a hill");
  assert.equal(judge("hill", t("4 3 2 1 0 .")).why, "shape");
  assert.equal(judge("hill", t("0 2 4 4 2 0")).why, "shape", "a flat top is not a hill");
  assert.equal(judge("hill", t("0 2 4 2 . .")).why, "few");
  assert.ok(judge("own", t("0 0 1 1 2 2")).ok && judge("own", t("04 1 3 2 0 .")).ok);
  assert.equal(judge("own", t("0 0 0 0 0 0")).why, "same");
  assert.equal(judge("own", t("0 1 2 . . .")).why, "few");
});

test("a round: listening is needed to check, taps respect gaps, clear goes back to the given notes", () => {
  let round = createRound(1);
  assert.equal(canCheck(round), false);
  round = tap(round, 0, 0);
  assert.equal(canCheck(round), false, "not heard yet");
  round = listened(round);
  assert.equal(round.listens, 1);
  assert.equal(canCheck(round), true);
  assert.deepEqual(clear(round).guess, Array(6).fill(0));
  // A gap level: only the gap column opens; the given notes stay.
  let gap = createRound(5);
  assert.equal(canTap(gap, 0), false); assert.equal(canTap(gap, 5), true);
  assert.equal(tap(gap, 0, 3), gap, "a locked column ignores the finger");
  gap = listened(tap(gap, 5, 2));
  assert.ok(has(gap.guess, 5, 2) && has(gap.guess, 0, 0));
  assert.deepEqual(clear(gap).guess, givenOf(5), "clear keeps the given notes");
  assert.equal(canCheck(listened(createRound(5))), false, "nothing placed in the gap yet");
  // A make level has nothing to hear.
  const make = createRound(14);
  assert.equal(canCheck(tap(make, 0, 0)), true);
  // Nothing changes once it is solved.
  const solved = check(listened(targetRound(1)));
  assert.equal(tap(solved, 0, 3), solved);
  assert.equal(clear(solved), solved);
});

function targetRound(id: number) {
  const round = createRound(id), target = targetOf(id)!;
  return { ...round, guess: target.map(mask => mask), heard: true };
}

test("checking: stars by tries, the line says what to change, extras wobble, the glow comes after two misses", () => {
  const miss = (id: number) => { const round = targetRound(id); return { ...round, guess: toggleCell(round.guess, 0, 4) }; };
  const toggleCell = (tune: number[], step: number, row: number) => tune.map((mask, i) => (i === step ? mask ^ (1 << row) : mask));
  let round = check(miss(1));
  assert.equal(round.solved, false);
  assert.equal(round.tries, 1);
  assert.equal(round.line, "৪টা নোটের ৪টা মিলেছে। ১টা ঘর বাড়তি, ওটা দুলছে।");
  assert.ok(round.wobble && has(round.wobble, 0, 4));
  assert.equal(hintOn(round), false);
  round = check(round);
  assert.equal(hintOn(round), true);
  // After two misses the glow shows the missing notes (none here: only an extra), then the extra comes off and it matches.
  assert.ok(hintTune(round)!.every(mask => mask === 0));
  const missing = check({ ...targetRound(1), guess: toggleCell(targetRound(1).guess, 2, 2) });
  assert.match(missing.line, /আরও ১টা বাকি। আবার শোনো।/);
  assert.equal(missing.wobble, null);
  const glow = check(check(missing));
  assert.equal(noteCount(hintTune(glow)!), 1);
  assert.ok(has(hintTune(glow)!, 2, 2));
  for (const [tries, stars] of [[1, 3], [2, 2], [3, 1], [9, 1]] as const) {
    let r = { ...targetRound(1), guess: toggleCell(targetRound(1).guess, 0, 4) };
    for (let i = 1; i < tries; i++) r = check(r);
    r = check({ ...r, guess: targetRound(1).guess });
    assert.equal(r.solved, true);
    assert.equal(r.stars, stars, `${tries} checks`);
    assert.equal(resultOf(r).tries, tries);
  }
  assert.doesNotMatch(round.line, /ভুল|হেরে|খারাপ/);
  // A gap line counts the gaps, not the notes that were given.
  assert.equal(gapLine(parseTune("0 1 2 0 1 2"), parseTune("0 1 2 0 1 3"), [5]), "১টা ফাঁকের ০টা মিলেছে। ১টা ঘর বাড়তি, ওটা দুলছে।");
  // Make levels: a line for each way to miss, never a target.
  const make = (id: number, tune: string) => check({ ...createRound(id), guess: parseTune(tune) });
  assert.equal(make(14, "0 1 . . . .").line, "আরও ২টা নোট লাগবে।");
  assert.equal(make(14, "0 2 1 3 . .").line, "প্রতিবার আগের চেয়ে ওপরের ঘরে চাপো।");
  assert.equal(make(14, "0 1 2 13 . .").line, "এক তালে একটা নোট বসাও।");
  assert.equal(make(15, "0 1 2 3 4 .").line, "ওপরে উঠে তারপর নিচে নামো।");
  assert.equal(make(16, "0 0 0 0 0 0").line, "অন্তত তিনটা আলাদা নোট বসাও।");
  assert.equal(make(14, ". . . . . .").line, "আগে ঘরে চাপো, তারপর মিলিয়ে দেখো।");
  assert.equal(make(16, "0 1 2 3 4 2").solved, true);
  assert.deepEqual(hintTune(check(check(make(14, "0 2 1 3 . .")))), EXAMPLE.rising);
});

test("playback: the notes that sound are the cells that light, a once-through tune ends, a gap is a silent beat", () => {
  for (const level of LEVELS.filter(item => item.tune)) {
    const tune = targetOf(level.id)!;
    const heard: number[][] = [];
    let step = 0;
    for (;;) { const { beat, next } = beatAt("target", tune, step, playLength(tune)); if (!beat) break; heard.push(beat.rows); assert.equal(beat.head, step); step = next; }
    assert.deepEqual(heard.flat().length, noteCount(tune.slice(0, playLength(tune))), `level ${level.id}: one lit cell for every note`);
  }
  assert.equal(playLength(parseTune("0 1 2 3 . .")), 4);
  assert.equal(playLength(parseTune(". . . . . .")), 1);
  // The ear of a gap level plays the whole row: the gap is a silent beat at the end too.
  const given = givenOf(5)!;
  const { beat } = beatAt("target", given, 5, given.length);
  assert.deepEqual(beat, { rows: [], head: 5 });
  assert.equal(beatAt("target", given, 6, given.length).beat, null);
  // The free grid loops over the whole row.
  assert.equal(beatAt("free", parseTune("0 . . . . ."), 6, 0).beat!.head, 0);
  assert.equal(beatMs(450, false), 450);
  assert.equal(beatMs(450, true), 600, "ধীরে খেলো slows the beat");
  assert.equal(beatMs(900, true), 900);
  assert.ok(LEVELS.every(level => 1000 / worldOf(level.id).ms < 3), "a cell never lights three times a second");
  assert.equal(ROWS, 5);
});

test("every level can be won: the right tune on a clean first check gives three stars", () => {
  for (const level of LEVELS) {
    const round = level.kind === "make" ? { ...createRound(level.id), guess: EXAMPLE[level.rule!] } : targetRound(level.id);
    const done = check({ ...round, heard: true });
    assert.equal(done.solved, true, `level ${level.id}`);
    assert.equal(done.stars, 3);
  }
});

test("bots: a guesser who follows the glow always finishes in three checks; kids get the stars the design says", () => {
  for (const level of LEVELS) {
    let guesserThree = 0, fiveThree = 0, learnerThree = 0, maxTries = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = playLevel(level.id, seed, GUESSER), f = playLevel(level.id, seed, FIVE), l = playLevel(level.id, seed, LEARNER);
      maxTries = Math.max(maxTries, g.tries, f.tries, l.tries);
      if (g.round.stars === 3) guesserThree++;
      if (f.round.stars === 3) fiveThree++;
      if (l.round.stars === 3) learnerThree++;
    }
    assert.ok(maxTries <= 3, `level ${level.id}: at most two misses, then the glow (${maxTries})`);
    assert.ok(guesserThree / SEEDS <= 0.08, `level ${level.id}: random taps rarely get three stars (${guesserThree / SEEDS})`);
    assert.ok(fiveThree / SEEDS >= 0.1 && fiveThree / SEEDS <= 0.95, `level ${level.id}: a five-year-old (${fiveThree / SEEDS})`);
    assert.ok(learnerThree / SEEDS >= 0.6, `level ${level.id}: a learner (${learnerThree / SEEDS})`);
    assert.ok(learnerThree >= fiveThree, `level ${level.id}: knowing more never hurts`);
  }
  // Level one is the easiest copy level for a five-year-old, and the gap levels are kinder than copying.
  const rate = (id: number) => Array.from({ length: SEEDS }, (_, i) => playLevel(id, i + 1, FIVE).round.stars === 3).filter(Boolean).length / SEEDS;
  assert.ok(rate(1) >= 0.4, `level 1: ${rate(1)}`);
  assert.ok(rate(1) >= rate(6) && rate(6) >= rate(10) - 0.2);
});

test("the first win comes inside ten seconds of play on level one, and the first check of each world's first level stays short", () => {
  let worst = 0;
  for (let seed = 1; seed <= SEEDS; seed++) worst = Math.max(worst, playLevel(1, seed, LEARNER).firstChecksAt);
  assert.ok(worst <= 10, `level 1 first check at ${worst} s`);
  for (const id of [5, 14]) { let slowest = 0; for (let seed = 1; seed <= 200; seed++) slowest = Math.max(slowest, playLevel(id, seed, LEARNER).firstChecksAt); assert.ok(slowest <= 10, `level ${id}: ${slowest}`); }
});

test("the end screen reports real stats", () => {
  const solved = check(listened(listened(targetRound(7))));
  const result = resultOf(solved);
  assert.deepEqual({ level: result.level, stars: result.stars, tries: result.tries, notes: result.notes, listens: result.listens }, { level: 7, stars: 3, tries: 1, notes: 7, listens: 2 });
  assert.deepEqual(result.tune, targetOf(7));
});
