// The rewrite: the statechart's bug paths replayed against the pure code (lib/session.ts, lib/play.ts, lib/progress.ts),
// the level data and its bots, the board's fit, and the old links and saved progress.
// See ai_docs/statecharts/chhobi-photao/README.md.
import assert from "node:assert/strict";
import test from "node:test";
import { unlockedLevel, readLevels, recordLevel } from "../../../shared/game-core";
import { bloomMs, clockMs, countAt, rippleMs } from "../lib/anim.hot";
import { isSolved, lineStates, mistakes, puzzleOf, starsFor, LEVEL_COUNT } from "../lib/game";
import { givenOf, infoOf, isFinale, toolsOf, worldIndex, LEVEL_INFO, WORLDS } from "../lib/levels";
import { clockText, parseShared, sharedHash, starNote } from "../lib/link";
import { fitBoard, giveHint, mistakesToDrop, startPlay, stitch, strokeOrder, takeBack } from "../lib/play";
import { afterClear, neighbourLevel, playable, readUnlock, recommended } from "../lib/progress";
import * as session from "../lib/session";
import { rate, runBot, CAREFUL, FIRST_TIMER, STEADY } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const ones = (cells: readonly number[]) => cells.flatMap((mark, index) => (mark === 1 ? [index] : []));

test("bug 1, ClockStillWhileAway / PausedWhenBlurred: another window stops the clock, and it starts again only on চালিয়ে যাও", () => {
  let s = session.begin(session.title(), false);
  assert.equal(s.phase, "playing");
  // The clock waits for the first stitch: reading the numbers costs nothing.
  assert.equal(session.elapsed(s, 5000), 0);
  s = session.arm(s, 5000);
  assert.equal(session.elapsed(s, 8000), 3000);
  // You click into another window at +3 s (blur pauses): twelve seconds away, the clock doesn't move (before: ১.০ → ৬.০).
  s = session.pause(s, 8000, "away");
  assert.equal(s.phase, "paused");
  assert.equal(session.elapsed(s, 20000), 3000);
  assert.equal(session.canPlay(s), false);
  // The sheet is a choice moment: an away pause on top of it doesn't close it, and চালিয়ে যাও doesn't end it.
  s = session.resume(s, 20000, "away");
  assert.equal(session.elapsed(s, 21000), 4000);
  s = session.pause(s, 21000, "sheet");
  s = session.pause(s, 22000, "away");
  assert.equal(s.why, "sheet");
  assert.equal(session.resume(s, 23000, "away"), s);
  s = session.resume(s, 23000, "sheet");
  assert.equal(session.elapsed(s, 24000), 5000);
  // A pause before the first stitch resumes with the clock still waiting.
  let early = session.again();
  early = session.pause(early, 100, "away");
  early = session.resume(early, 9000, "away");
  assert.equal(early.phase, "playing");
  assert.equal(session.elapsed(early, 20000), 0);
  assert.equal(session.arm(early, 20000).since, 20000);
});

test("bug 2, InputReleasedWhenAway: nothing is stitched unless play is live, and a solved board refuses more", () => {
  // The board ends its stroke on blur, on the player's pause and on a buttonless mouse move, and calls onStitch only while canPlay.
  const s = session.again();
  assert.equal(session.canPlay(s), true);
  assert.equal(session.canPlay(session.pause(s, 0, "away")), false);
  assert.equal(session.canPlay(session.pause(s, 0, "sheet")), false);
  assert.equal(session.canPlay(session.title()), false);
  assert.equal(session.canPlay(session.finish(s, 10)), false);
  let play = startPlay(1);
  const { solution } = puzzleOf(1);
  play = stitch(play, solution.flatMap((filled, index) => (filled ? [index] : [])), 1, true).play;
  assert.ok(isSolved(play));
  const more = stitch(play, [1], 2, true);
  assert.equal(more.moved, 0);
  assert.equal(more.play, play);
  // The stroke runs from where it started towards the finger, along its row or column.
  assert.deepEqual(strokeOrder(5, 7, 9, "row"), [7, 8, 9]);
  assert.deepEqual(strokeOrder(5, 9, 5, "row"), [9, 8, 7, 6, 5]);
  assert.deepEqual(strokeOrder(5, 2, 17, "col"), [2, 7, 12, 17]);
  assert.deepEqual(strokeOrder(5, 17, 2, "col"), [17, 12, 7, 2]);
  assert.deepEqual(strokeOrder(5, 2, 9, "row"), [2, 3, 4], "a stroke stays on its row");
});

test("bug 3, ChoiceFreezesPlay: the sheet stops the clock, and picking a level from it starts clean", () => {
  let s = session.arm(session.again(), 0);
  s = session.pause(s, 4000, "sheet");
  assert.equal(session.elapsed(s, 60000), 4000);
  assert.equal(session.canPlay(s), false);
  // Picking a level mid-round plays it at once with a fresh clock.
  const next = session.again();
  assert.equal(session.elapsed(next, 90000), 0);
  assert.equal(next.armed, false);
});

test("a result key needs a fresh press after the screen appears", () => {
  const over = session.finish(session.arm(session.again(), 0), 5000);
  assert.equal(over.phase, "over");
  assert.equal(session.resultKey(over, 5100, false), false);
  assert.equal(session.resultKey(over, 5000 + session.RESULT_GUARD_MS, true), false, "a held key never skips it");
  assert.equal(session.resultKey(over, 5000 + session.RESULT_GUARD_MS, false), true);
  assert.equal(session.seconds(over, 99999), 5);
  assert.equal(session.seconds(session.finish(session.arm(session.again(), 0), 100), 1), 1, "a result is never 0 s");
});

test("a wrong stitch is refused: the cell stays empty, it counts once, and the stroke stops there", () => {
  let play = startPlay(1); // row 1 is "1 1 1": cells 5, 7, 9
  const hit = stitch(play, [5, 6, 7, 8, 9], 1, true);
  assert.deepEqual(ones(hit.play.cells), [5], "cell 5 went in, 6 was refused, and 7–9 were left alone");
  assert.equal(hit.refused, 6);
  assert.equal(hit.mistake, true);
  assert.equal(mistakes(hit.play), 1);
  assert.equal(hit.play.history.length, 1, "the cells that did go in are one undo step");
  // The same cell again is refused but not counted twice.
  const again = stitch(hit.play, [6], 1, true);
  assert.equal(again.refused, 6);
  assert.equal(again.mistake, false);
  assert.equal(mistakes(again.play), 1);
  assert.equal(again.moved, 0);
  // A refusal alone leaves no undo step.
  assert.equal(again.play.history.length, 1);
  // A ✕ on a picture cell is refused the same way; a ✕ on an empty cell is fine.
  const cross = stitch(play, [0], 2, true);
  assert.equal(cross.refused, 0);
  assert.equal(mistakes(cross.play), 1);
  assert.equal(cross.play.cells[0], 0);
  const fine = stitch(play, [6], 2, true);
  assert.equal(fine.refused, -1);
  assert.equal(fine.play.cells[6], 2);
  // So no state of the board ever holds a wrong mark.
  play = hit.play;
  const { solution } = puzzleOf(1);
  assert.ok(play.cells.every((mark, index) => mark !== 1 || solution[index]));
  assert.deepEqual(lineStates(play).rows.filter(state => state === "over"), []);
});

test("stars: mistakes and hints behave as before, and slow mode has no way in", () => {
  assert.equal(starsFor(0, false), 3);
  assert.equal(starsFor(2, false), 2);
  assert.equal(starsFor(3, false), 1);
  assert.equal(starsFor(0, true), 2);
  // The sim has no slow input at all: stitch(play, cells, mark, record, strokeSoFar) and the session never see it.
  assert.equal(mistakesToDrop(startPlay(1)), 1);
  let play = stitch(startPlay(1), [6], 1, true).play;
  assert.equal(mistakesToDrop(play), 2);
  play = stitch(stitch(play, [8], 1, true).play, [16], 1, true).play;
  assert.equal(mistakes(play), 3);
  assert.equal(mistakesToDrop(play), null);
  assert.equal(starNote(0, false), "ভুল ০ · ১টা ভুলে ২ তারা");
  assert.equal(starNote(1, false), "ভুল ১ · আর ২টায় ১ তারা");
  assert.equal(starNote(2, false), "ভুল ২ · আর ১টায় ১ তারা");
  assert.equal(starNote(3, false), "ভুল ৩");
  assert.equal(starNote(0, true), "হিন্ট নিয়েছ: ২ তারার বেশি হবে না");
});

test("নানির ফোঁড়: locked, part of the picture, the same everywhere, never the whole picture", () => {
  for (const level of levels) {
    const want = infoOf(level).given, got = givenOf(level), { solution } = puzzleOf(level);
    assert.equal(got.length, want, `level ${level}`);
    assert.ok(got.every(index => solution[index]), `level ${level} has a stitch outside the picture`);
    assert.deepEqual(givenOf(level), got);
    assert.ok(got.length < solution.filter(Boolean).length / 2 + 1);
    const play = startPlay(level);
    assert.deepEqual(ones(play.cells), [...got]);
    assert.ok(!isSolved(play));
    // They can't be wiped, crossed or toggled, and undo never takes them out.
    if (got.length) {
      assert.equal(stitch(play, [...got], 0, true).moved, 0);
      assert.equal(stitch(play, [...got], 2, true).moved, 0);
      assert.equal(stitch(play, [...got], 2, true).refused, -1);
    }
  }
  assert.deepEqual(levels.filter(level => infoOf(level).given).map(level => infoOf(level).given), [6, 3, 8, 4, 10, 5, 12, 6, 15, 8]);
  assert.ok(levels.filter(isFinale).every(level => infoOf(level).given === 0), "finales are alone");
  const played = stitch(startPlay(6), [...puzzleOf(6).solution.flatMap((filled, index) => (filled ? [index] : []))], 1, true).play;
  assert.ok(isSolved(played));
  assert.deepEqual(takeBack(played).cells.filter((mark, index) => mark === 1 && givenOf(6).includes(index)).length, givenOf(6).length);
});

test("undo is one step per stroke and the hint is never a mistake", () => {
  let play = startPlay(2);
  play = stitch(play, [10, 11, 12, 13, 14], 1, true).play;
  assert.equal(play.history.length, 1);
  play = stitch(play, [15, 16], 1, false, 5).play;
  assert.equal(play.history.length, 1, "a drag is one step");
  assert.equal(play.longest, 7);
  const back = takeBack(play);
  assert.deepEqual(ones(back.cells), []);
  assert.equal(back.stitches, play.stitches, "stitches never go back");
  const fresh = startPlay(2);
  assert.equal(takeBack(fresh), fresh, "nothing to take back");
  for (const level of levels) {
    let walk = startPlay(level), steps = 0;
    for (; !isSolved(walk) && steps < 400; steps++) {
      const helped = giveHint(walk);
      assert.ok(helped, `level ${level} hint stuck`);
      walk = helped.play;
    }
    assert.ok(isSolved(walk), `level ${level}`);
    assert.equal(mistakes(walk), 0);
    assert.equal(starsFor(mistakes(walk), walk.hints > 0), 2);
  }
});

test("the levels are data: a lesson for each, finales at the ends of the worlds, tools arriving one at a time", () => {
  assert.equal(LEVEL_INFO.length, LEVEL_COUNT);
  assert.deepEqual(levels.filter(isFinale), [10, 20, 30]);
  assert.deepEqual(WORLDS.map(world => [world.from, world.to]), [[1, 10], [11, 20], [21, 30]]);
  assert.deepEqual(WORLDS.map(world => world.finale), ["কলসি", "বিড়াল", "ইলিশ"]);
  for (const [index, world] of WORLDS.entries()) assert.equal(puzzleOf(world.to).picture.name, world.finale, `world ${index + 1} ends on its named picture`);
  assert.equal(worldIndex(1), 0); assert.equal(worldIndex(10), 0); assert.equal(worldIndex(11), 1); assert.equal(worldIndex(30), 2);
  assert.equal(new Set(LEVEL_INFO.map(info => info.teach)).size, LEVEL_COUNT, "no two levels teach the same line");
  for (const info of LEVEL_INFO) assert.ok(info.teach.length > 12 && info.teach.length < 90 && !/!!|আপনি|করুন/.test(info.teach));
  assert.deepEqual(toolsOf(1), { undo: false, cross: false, hint: false, strike: false });
  assert.deepEqual(toolsOf(2), { undo: true, cross: false, hint: false, strike: false });
  assert.deepEqual(toolsOf(4), { undo: true, cross: true, hint: false, strike: false });
  assert.deepEqual(toolsOf(5), { undo: true, cross: true, hint: true, strike: false });
  assert.deepEqual(toolsOf(11), { undo: true, cross: true, hint: true, strike: true });
  // New things per level: the fresh tags are where the table says, and each size's first level is tagged.
  assert.deepEqual([1, 2, 3, 4, 5].map(level => infoOf(level).fresh), ["ফোঁড়", "ফিরিয়ে আনো", "ভুল ঘর", "খালি দাগ", "হিন্ট"]);
  for (const level of [6, 16, 21, 26]) assert.match(infoOf(level).fresh ?? "", /×/, `level ${level} announces its size`);
});

test("what a level's lesson says is true of its board", () => {
  const { rows: r1, cols: c1 } = puzzleOf(1);
  assert.deepEqual(r1[0], [5]);
  assert.ok(c1.some(clue => clue[0] === 5));
  assert.deepEqual(puzzleOf(9).rows[2], [1, 4], "level 9: ‘১ ৪’ in six cells");
  assert.deepEqual(puzzleOf(14).rows[1], [1, 3, 1], "level 14: ‘১ ৩ ১’ in seven");
  assert.deepEqual(puzzleOf(18).rows[2], [2, 2, 2], "level 18: ‘২ ২ ২’ in eight");
  assert.deepEqual(puzzleOf(26).cols[1], [7, 2], "level 26: ‘৭ ২’ in ten");
  assert.deepEqual(puzzleOf(24).cols[3], [4, 3], "level 24: ‘৪ ৩’ in nine");
  assert.ok(puzzleOf(12).cols[0].length === 0 && puzzleOf(12).cols[6].length === 0, "level 12 has two empty columns");
  assert.ok(puzzleOf(25).cols[0].length === 0 && puzzleOf(25).cols[8].length === 0, "level 25 has two empty columns");
  const l13 = puzzleOf(13).picture.art;
  assert.ok(l13.every((row, r) => [...row].every((ch, c) => (ch === ".") === (l13[6 - r][c] === ".") && (ch === ".") === (row[6 - c] === "."))), "level 13 is the same in four directions");
  assert.deepEqual(puzzleOf(29).rows[3], [1, 1, 1, 1]);
  assert.deepEqual(puzzleOf(8).rows[1], [4], "level 8: ‘৪’ in six");
  assert.deepEqual(puzzleOf(27).rows[1], [8], "level 27: ‘৮’ in ten");
});

test("your own unlock: migrated once, raised only by clearing an open level, and a friend's level is a visit", () => {
  const stars = { 1: 3, 2: 2, 7: 1 };
  assert.deepEqual(readUnlock(null, stars, LEVEL_COUNT), { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true });
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 8, "the old rule opened everything below the highest cleared level");
  assert.deepEqual(readUnlock("5", stars, LEVEL_COUNT), { unlock: 5, migrated: false });
  assert.deepEqual(readUnlock("junk", { 1: 3 }, LEVEL_COUNT), { unlock: 2, migrated: true });
  assert.equal(readUnlock("99", {}, LEVEL_COUNT).unlock, LEVEL_COUNT);
  // A friend's far-ahead level records stars but opens nothing between.
  assert.equal(afterClear(3, 12, LEVEL_COUNT), 3);
  assert.equal(afterClear(3, 3, LEVEL_COUNT), 4);
  assert.equal(afterClear(3, 1, LEVEL_COUNT), 3);
  assert.equal(afterClear(30, 30, LEVEL_COUNT), 30);
  assert.equal(playable(12, 3, {}, 12), true);
  assert.equal(playable(12, 3, {}, 0), false);
  assert.equal(playable(12, 3, { 12: 2 }, 0), true, "kept once it has stars");
  assert.equal(playable(5, 3, {}, 12), false, "levels between stay closed");
  assert.equal(recommended(3, { 1: 3, 2: 1 }), 3);
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 3 }), 2);
  assert.equal(neighbourLevel(3, 1, 3, { 12: 2 }, 0, LEVEL_COUNT), 12);
  assert.equal(neighbourLevel(3, -1, 3, {}, 0, LEVEL_COUNT), 2);
  assert.equal(neighbourLevel(1, -1, 3, {}, 0, LEVEL_COUNT), 0);
  // Saved stars read and merge as before.
  assert.deepEqual(readLevels(JSON.stringify(recordLevel({ 1: 3 }, 1, 1)), LEVEL_COUNT), { 1: 3 });
});

test("old challenge links still open, and new play writes the same format", () => {
  for (const hash of ["s=70013&t=40&l=1&m=0", "s=70026&t=95&l=2&m=1&h=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF"]) {
    const parsed = parseShared(hash);
    assert.ok(parsed, hash);
    assert.equal(sharedHash(parsed!).includes(`l=${parsed!.level}`), true);
    assert.deepEqual(parseShared(sharedHash(parsed!)), parsed);
  }
  assert.equal(parseShared("s=70013&t=40&l=1&m=9"), null, "more mistakes than empty cells");
  assert.equal(clockText(65), "১:০৫");
  assert.equal(clockText(5), "০:০৫");
});

test("the board fits a phone, a laptop stage, and a 320 px screen, between 16 and 56 px a cell", () => {
  for (const level of levels) {
    const { size, rows, cols } = puzzleOf(level);
    const rowClues = Math.max(1, ...rows.map(clue => clue.length)), colClues = Math.max(1, ...cols.map(clue => clue.length));
    for (const [width, height] of [[300, 480], [372, 500], [520, 560], [600, 900]]) {
      const fit = fitBoard(width, height, size, rowClues, colClues);
      assert.ok(fit.cell >= 16 && fit.cell <= 56);
      if (fit.cell > 16) assert.ok(fit.width <= width && fit.height <= height, `level ${level} at ${width}×${height}`);
    }
    assert.ok(fitBoard(300, 480, size, rowClues, colClues).cell >= 20, `level ${level} is too small to tap on a 320 px phone`);
  }
  assert.equal(fitBoard(600, 900, 5, 3, 3).cell, 56);
});

test("the per-frame maths", () => {
  assert.equal(clockMs(1500, null, 99999), 1500);
  assert.equal(clockMs(1500, 1000, 3000), 3500);
  assert.equal(clockMs(0, 5000, 4000), 0, "never negative");
  assert.equal(countAt(100, 0), 0);
  assert.equal(countAt(100, 1), 100);
  assert.ok(countAt(100, 0.5) > 50, "eased out");
  assert.equal(rippleMs(0, 0), 0);
  assert.equal(bloomMs(5), 8 * 35 + 350);
});

test("the bots: level 1 is won inside 10 s, and the ladder gets harder in the numbers the design says", () => {
  // Level 1: a steady player wins, with 3 stars most of the time, inside 10 s of reading and dragging.
  const runs = Array.from({ length: 200 }, (_, seed) => runBot(1, STEADY, seed + 1));
  assert.ok(runs.every(run => run.won));
  assert.ok(runs.filter(run => run.seconds <= 10).length / runs.length >= 0.85, "level 1 inside 10 s");
  const median = runs.map(run => run.seconds).sort((a, b) => a - b)[100];
  assert.ok(median <= 8, `median ${median}`);
  assert.ok(runs.filter(run => run.stars === 3).length / runs.length >= 0.75);
  const steady: number[] = [], first: Record<number, ReturnType<typeof rate>> = {};
  for (const level of levels) {
    const f = rate(level, FIRST_TIMER, 120), s = rate(level, STEADY, 120);
    first[level] = f;
    steady[level] = s.three;
    assert.equal(f.win, 1, `level ${level} is always winnable`);
    if (level <= 5) assert.ok(f.two >= 0.95 && f.three >= 0.25 && f.three <= 0.75, `level ${level} first-timer ${JSON.stringify(f)}`);
    else if (level <= 20) assert.ok(f.two >= 0.75, `level ${level} first-timer ${JSON.stringify(f)}`);
    else assert.ok(f.two >= 0.45, `level ${level} first-timer ${JSON.stringify(f)}`);
    assert.ok(s.two >= 0.9 || level >= 21, `level ${level} steady ★★ ${s.two}`);
    assert.ok(s.two >= 0.8, `level ${level} steady ★★ ${s.two}`);
  }
  // A finale is no easier than the first level of its world, and the careful player still gets there on the big boards.
  for (const [first1, finale] of [[1, 10], [11, 20], [21, 30]]) assert.ok(steady[finale] <= steady[first1] + 0.03, `finale ${finale} vs ${first1}`);
  for (const level of [26, 27, 28, 29, 30]) assert.ok(rate(level, CAREFUL, 120).three >= 0.7, `level ${level} careful`);
});

test("the same seed plays the same game", () => {
  for (const level of [1, 12, 30]) {
    const a = runBot(level, STEADY, 5), b = runBot(level, STEADY, 5);
    assert.deepEqual(a.play.cells, b.play.cells);
    assert.equal(a.seconds, b.seconds);
    assert.deepEqual(givenOf(level), givenOf(level));
  }
});
