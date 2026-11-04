// The rewrite: every statechart bug replayed against the pure logic, the session clock, saved grids, the dailies,
// the lessons, the end-screen maths and the bot-tuned star rates.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { recordLevel, unlockedLevel } from "../../../shared/game-core";
import {
  clashes, dailyPuzzle, digitsLeft, filledRight, giveHint, isSolved, levelPuzzle, place, startGame, starsEarned, toggleNote, undo, worldOf, LEVEL_COUNT,
} from "../lib/game";
import { DAILIES, DAILY_ORDER, LESSONS, LEVELS, WORLDS, isFinale } from "../lib/levels";
import { bn, caption, feat, finaleName, fromPuzzle, parseShared, puzzleLabel, sharedHash } from "../lib/link";
import { countSolutions, makePuzzle, SHAPES } from "../lib/sudoku";
import * as session from "../lib/session";
import { addDay, dropWip, fromWip, hasWork, openAfter, putWip, puzzleKey, readDaily, readDays, readOpen, readWip, shiftDay, streak, toWip, week, WIP_LIMIT } from "../lib/save";
import { clockSeconds, countAt, easeOut, starTimeUsed, starsOnTrack } from "../lib/tick.hot";
import { share } from "../share";
import { bot, PLAYERS } from "./bot";

const component = readFileSync(new URL("../components/sudoku-game.tsx", import.meta.url), "utf8");

function solveAll(level: number) {
  const puzzle = levelPuzzle(level)!;
  let game = startGame(puzzle);
  puzzle.puzzle.forEach((value, cell) => { if (!value) game = place(game, cell, puzzle.solution[cell])!; });
  return game;
}

// ---- bug 1: ClockStillWhileAway ----
test("bug 1 · ClockStillWhileAway: a blur stops the clock, and it starts again only on চালিয়ে যাও", () => {
  let s = session.begin(session.ready(), 1000);
  assert.equal(session.elapsed(s, 3000), 2);
  s = session.pause(s, 3000, "away");                       // you click into another window
  assert.equal(s.phase, "paused");
  assert.equal(session.elapsed(s, 63_000), 2, "a minute in another window adds nothing");
  assert.equal(session.canMove(s), false, "and nothing on the grid can change");
  s = session.resume(s, 63_000, "away");
  assert.equal(session.elapsed(s, 64_000), 3);
  // The component pauses on window blur and on a hidden tab, not only through the player's menu.
  assert.match(component, /addEventListener\("blur", away\)/);
  assert.match(component, /visibilitychange", hide/);
  assert.match(component, /onPause: \(\) => pauseFor\("away"\)/);
});

test("session: the sheet outranks an away pause, and each pause ends only by its own door", () => {
  let s = session.begin(session.ready(5), 0);
  s = session.pause(s, 2000, "sheet");                      // you open সব লেভেল mid-puzzle
  assert.equal(session.elapsed(s, 2000), 7);
  s = session.pause(s, 3000, "away");                       // then another window
  assert.equal(s.why, "sheet");
  assert.equal(session.resume(s, 4000, "away").phase, "paused", "the menu's চালিয়ে যাও doesn't close the sheet");
  s = session.resume(s, 4000, "sheet");
  assert.equal(s.phase, "playing");
  s = session.finish(s, 6000);
  assert.equal(s.phase, "over");
  assert.equal(session.elapsed(s, 99_000), 9, "the result's time never moves");
  assert.equal(session.begin(s, 1).phase, "over");
  assert.equal(session.pause(session.ready(), 1, "away").phase, "ready", "nothing to pause on the start card");
});

// ---- bug 2: ChimesOnlyOnTheResult ----
test("bug 2 · ChimesOnlyOnTheResult: no hand-rolled chime or bell timers left to ring over a new grid", () => {
  assert.doesNotMatch(component, /setTimeout\(\(\) => sfx\.star/, "star chimes come from StarReveal, which clears them on unmount");
  assert.doesNotMatch(component, /setTimeout\(\(\) => sound\.bell/, "line bells are scheduled on the audio clock, so a pause cuts them");
  assert.match(component, /function clearFlash\(\) \{ window\.clearTimeout\(flashTimer\.current\)/);
  assert.match(component, /clearFlash\(\);\n\s+setPencil\(false\);/, "load() clears the line flash");
  const finish = readFileSync(new URL("../components/finish.tsx", import.meta.url), "utf8");
  assert.match(finish, /<StarReveal count=/);
  assert.match(finish, /cancelAnimationFrame\(frame\.current\)/, "the count-up stops on unmount");
});

// ---- bug 3: YourLinkOpens ----
test("bug 3 · YourLinkOpens: a link opens for every hint count, 0 up to all the blanks", () => {
  for (const puzzle of [levelPuzzle(1)!, levelPuzzle(25)!, dailyPuzzle(20261104)!, dailyPuzzle(20261104, "e")!, dailyPuzzle(20261104, "m")!]) {
    for (let hints = 0; hints <= puzzle.empty; hints++) {
      const mine = fromPuzzle(puzzle, 125, hints, "মিম");
      assert.deepEqual(parseShared(sharedHash(mine)), mine, `${puzzleKey(puzzle)} with ${hints} hints`);
      assert.equal(share.normalize(sharedHash(mine)), sharedHash(mine));
    }
    assert.equal(parseShared(sharedHash({ ...fromPuzzle(puzzle, 125, 0, ""), hints: puzzle.empty + 1 })), null, "more hints than blanks is refused");
  }
  // The live replay: 47 hints on the 4 November daily.
  assert.deepEqual(parseShared("s=20261104&t=2&h=47"), { level: 0, day: 20261104, seconds: 2, hints: 47, name: "" });
});

// ---- bug 4: WorkNeverLostByOneTap ----
test("bug 4 · WorkNeverLostByOneTap: switching puzzles or reloading brings the half-done grid back", () => {
  const level = levelPuzzle(21)!;
  let game = startGame(level);
  const blanks = level.puzzle.map((v, cell) => v ? -1 : cell).filter(cell => cell >= 0);
  game = place(game, blanks[0], level.solution[blanks[0]])!;
  game = place(game, blanks[1], level.solution[blanks[1]] % 9 + 1)!;      // a wrong one
  game = toggleNote(game, blanks[2], 4)!;
  game = giveHint(game, blanks[3])!.game;
  assert.ok(hasWork(game));
  let store = putWip(null, puzzleKey(level), toWip(game, 491.7));        // eight minutes in
  store = putWip(store, puzzleKey(dailyPuzzle(20261104)!), toWip(startGame(dailyPuzzle(20261104)!), 3));   // you tap আজকের ধাঁধা
  const back = fromWip(readWip(store, "l21"), level)!;                   // লেভেলে ফেরো
  assert.deepEqual(back.game.values, game.values);
  assert.deepEqual(back.game.notes, game.notes);
  assert.equal(back.game.hints, 1);
  assert.equal(back.game.mistakes, 1);
  assert.equal(back.seconds, 491);
  assert.equal(filledRight(back.game), 2);
  assert.equal(readWip(dropWip(store, "l21"), "l21"), null, "নতুন করে শুরু clears only that grid");
  assert.ok(readWip(dropWip(store, "l21"), "d20261104"));
  // The component saves on every move, on pause and on pagehide, and load() reads the saved grid back.
  assert.match(component, /keep\(next, elapsed\(\)\)/);
  assert.match(component, /addEventListener\("pagehide", keepNow\)/);
  assert.match(component, /fromWip\(readWip\(read\(WIP_KEY\), k\), next\)/);
});

test("saved grids: hostile or stale storage is refused, and only the newest few are kept", () => {
  const puzzle = levelPuzzle(12)!, good = toWip(place(startGame(puzzle), puzzle.puzzle.indexOf(0), 1)!, 40);
  assert.ok(fromWip(good, puzzle));
  const bad: unknown[] = [
    null, 7, "x", { ...good, v: good.v.slice(1) }, { ...good, v: [...good.v].map((d, cell) => cell === puzzle.puzzle.findIndex(Boolean) ? "0" : d).join("") }, { ...good, v: good.v.replace(/^./, "9") },
    { ...good, m: "zzzzz" }, { ...good, m: good.m.replace(/^[^.]+/, "1") }, { ...good, s: -1 }, { ...good, s: 1e9 }, { ...good, x: 1.5 },
    { ...good, h: [puzzle.puzzle.findIndex(Boolean)] }, { ...good, h: [9999] },
  ];
  for (const wip of bad) assert.equal(fromWip(wip, puzzle), null, JSON.stringify(wip));
  assert.equal(fromWip(good, levelPuzzle(25)!), null, "another puzzle's grid never fits");
  assert.equal(readWip("{broken", "l1"), null);
  let store: string | null = null;
  for (let level = 1; level <= WIP_LIMIT + 3; level++) store = putWip(store, `l${level}`, good);
  assert.equal(Object.keys(JSON.parse(store!)).length, WIP_LIMIT);
  assert.equal(readWip(store, "l1"), null);
  assert.ok(readWip(store, `l${WIP_LIMIT + 3}`));
  assert.equal(hasWork(startGame(puzzle)), false);
});

// ---- bug 5: OpenLevelsAreEarned ----
test("bug 5 · OpenLevelsAreEarned: a friend's far-ahead level records its stars but opens nothing in between", () => {
  let stars = {}, open = readOpen(null, stars);
  assert.equal(open, 1, "a new phone has level 1");
  stars = recordLevel(stars, 3, 3);                          // you solve a friend's level 3
  open = openAfter(open, 3);
  assert.equal(open, 1, "levels 2 and 3 stay closed for your own play");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 4, "the shared rule is untouched (migrations rely on it)");
  open = openAfter(open, 1);
  assert.equal(open, 2, "your own clear opens the next level");
  assert.equal(openAfter(40, 40), 40);
  // Migration, once: an old phone keeps every level the old rule opened.
  assert.equal(readOpen(null, { 1: 3, 2: 2, 5: 1 }), 6);
  assert.equal(readOpen("4", { 1: 3, 2: 2, 5: 1 }), 4, "after that the saved value is the truth");
  for (const raw of ["0", "41", "x", "2.5"]) assert.equal(readOpen(raw, { 1: 3 }), 2, raw);
  assert.match(component, /if \(read\(OPEN_KEY\) === null\) write\(OPEN_KEY, String\(mine\)\)/);
});

// ---- keys ----
test("keys: Enter goes to the game, results need a fresh press, and clicked buttons drop focus", () => {
  assert.match(component, /const fresh = !event\.repeat;/);
  assert.match(component, /fresh && finish && event\.timeStamp > finish\.at \+ 400/);
  assert.match(component, /if \(run\.phase === "paused"\) \{\n\s+if \(enter\)/, "keys do nothing to the grid while paused");
  assert.match(component, /function dropFocus/);
  assert.match(component, /onClick=\{dropFocus\}/);
});

// ---- moves ----
test("mistakes are counted kindly, clashes say why, and the pad counts what's left", () => {
  const puzzle = levelPuzzle(1)!;
  let game = startGame(puzzle);
  const blank = puzzle.puzzle.indexOf(0), right = puzzle.solution[blank];
  const wrong = [1, 2, 3, 4].find(d => d !== right)!;
  game = place(game, blank, wrong)!;
  assert.equal(game.mistakes, 1);
  assert.ok(clashes(game, blank).every(peer => game.values[peer] === wrong));
  game = undo(game)!;
  assert.equal(game.mistakes, 1, "undo doesn't hide a mistake");
  game = place(game, blank, right)!;
  assert.equal(game.mistakes, 1, "a right digit costs nothing");
  assert.equal(starsEarned(10, 0, puzzle.par), 3, "and mistakes never cost a star");
  const left = digitsLeft(game);
  assert.equal(left.reduce((a, b) => a + b, 0), puzzle.empty - 1);
  assert.deepEqual(digitsLeft(solveAll(1)).slice(1), [0, 0, 0, 0]);
  assert.equal(filledRight(solveAll(30)), levelPuzzle(30)!.empty);
  assert.ok(isSolved(solveAll(40)));
});

// ---- the daily ----
test("dailies: three difficulties a day, each one-answer, and the classic link opens the same grid as before", () => {
  // Before the rewrite the daily was makePuzzle(<date>, 9×9, 46): a link without z must still open exactly that.
  for (const day of [20261012, 20261104, 20270301]) {
    assert.deepEqual(dailyPuzzle(day)!.puzzle, makePuzzle(day, SHAPES[9], 46).puzzle);
    assert.deepEqual(parseShared(`s=${day}&t=300`), { level: 0, day, seconds: 300, hints: 0, name: "" });
  }
  for (let d = 1; d <= 12; d++) {
    for (const kind of DAILY_ORDER) {
      const puzzle = dailyPuzzle(20261100 + d, kind)!;
      assert.equal(puzzle.shape.n, DAILIES[kind].size);
      assert.equal(countSolutions(puzzle.puzzle, puzzle.shape), 1);
      assert.ok(Math.abs(puzzle.empty - DAILIES[kind].empty) <= 6, `${kind} ${d}: ${puzzle.empty}`);
    }
    assert.ok(dailyPuzzle(20261100 + d, "e")!.par < dailyPuzzle(20261100 + d, "m")!.par);
    assert.ok(dailyPuzzle(20261100 + d, "m")!.par < dailyPuzzle(20261100 + d, "h")!.par);
  }
  for (const state of ["s=20261104&t=40&z=x", "s=20261104&t=40&z=h", `s=${LEVELS[0][2]}&t=40&l=1&z=e`, "s=20261104&t=40&z="]) assert.equal(parseShared(state), null, state);
  const easy = parseShared("s=20261104&t=95&z=e&n=%E0%A6%AE%E0%A6%BF%E0%A6%AE")!;
  assert.equal(easy.kind, "e");
  assert.equal(puzzleLabel(easy), "৪ নভেম্বরের সহজ ধাঁধা");
  assert.equal(feat(easy), "মিম ৪ নভেম্বরের সহজ সুডোকু মিলিয়েছে ১ মিনিট ৩৫ সেকেন্ডে");
  assert.match(caption(easy), /৪ নভেম্বরের সহজ ধাঁধা মেলালাম/);
  assert.equal(puzzleLabel({ level: 0, day: 20261104 }), "৪ নভেম্বরের ধাঁধা", "the classic daily's words are unchanged");
  assert.equal(readDaily(null), "e"); assert.equal(readDaily("m"), "m"); assert.equal(readDaily("junk"), "e");
});

test("the week strip and the streak", () => {
  let days = readDays(null);
  for (const day of [20261101, 20261102, 20261103, 20261104, 20261030]) days = addDay(days, day);
  days = addDay(days, 20260231);
  assert.deepEqual(days, [20261030, 20261101, 20261102, 20261103, 20261104]);
  assert.equal(streak(days, 20261104), 4);
  assert.equal(streak(days, 20261105), 4, "today still open: yesterday's run counts");
  assert.equal(streak(days, 20261106), 0);
  assert.equal(shiftDay(20260301, -1), 20260228);
  assert.equal(shiftDay(20261231, 1), 20270101);
  const strip = week(days, 20261104);
  assert.equal(strip.length, 7);
  assert.deepEqual(strip.map(d => d.day), [20261029, 20261030, 20261031, 20261101, 20261102, 20261103, 20261104]);
  assert.deepEqual(strip.map(d => d.done), [false, true, false, true, true, true, true]);
  assert.deepEqual(readDays('["x",20261104,20261104,99999999]'), [20261104]);
  assert.deepEqual(readDays("{"), []);
});

// ---- levels as data ----
test("levels: four worlds, one lesson per level, a named finale at 10, 20, 30 and 40", () => {
  assert.equal(LESSONS.length, LEVEL_COUNT);
  assert.equal(new Set(LESSONS).size, LEVEL_COUNT, "every level teaches something different");
  for (const lesson of LESSONS) {
    assert.equal(lesson, lesson.normalize("NFC"));
    assert.ok(lesson.length <= 80, lesson);
    assert.doesNotMatch(lesson, /আপনি|করুন|অসাধারণ|!/);
  }
  assert.deepEqual(WORLDS.map(w => w.from), [1, 11, 21, 31]);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.equal(worldOf(level), Math.floor((level - 1) / 10));
  for (const level of [10, 20, 30, 40]) {
    assert.ok(isFinale(level));
    assert.equal(finaleName(level), WORLDS[level / 10 - 1].finale);
    assert.ok(LESSONS[level - 1].startsWith(`${bn(levelPuzzle(level)!.empty)}টা ফাঁকা ঘর`), `the finale's line names its exact blanks (${level})`);
  }
  assert.equal(finaleName(9), ""); assert.equal(finaleName(0), "");
  assert.ok(LESSONS[10].includes("৬×৬") && levelPuzzle(11)!.shape.n === 6, "the 6×6 box shape is announced on level 11");
  assert.ok(LESSONS[20].includes("৯×৯") && levelPuzzle(21)!.shape.n === 9);
  assert.ok(LESSONS[11].includes("খসড়া"), "pencil marks are introduced as the grid grows");
  assert.equal(levelPuzzle(10)!.par, 60, "ছোট মামা's minute is the real three-star time");
});

// ---- the clock, the meter and the count-up ----
test("tick: clock, star meter and count-up maths", () => {
  assert.equal(clockSeconds(5, 1000, true, 3000), 7);
  assert.equal(clockSeconds(5, 1000, false, 3000), 5);
  assert.equal(clockSeconds(5, 3000, true, 1000), 5, "never runs backwards");
  assert.equal(easeOut(0), 0); assert.equal(easeOut(1), 1); assert.equal(easeOut(2), 1); assert.ok(easeOut(0.5) > 0.5);
  assert.equal(countAt(47, 1), 47); assert.equal(countAt(47, 0), 0);
  const par = levelPuzzle(25)!.par;
  for (const [seconds, hints] of [[10, 0], [par, 0], [par + 1, 0], [par * 3, 0], [10, 1], [10, 4]]) {
    assert.equal(starsOnTrack(seconds, hints, par), starsEarned(seconds, hints, par), `${seconds}s ${hints}h`);
  }
  assert.equal(starTimeUsed(0, 60), 0); assert.equal(starTimeUsed(60, 60), 1); assert.equal(starTimeUsed(999, 60), 1);
});

// ---- difficulty by bots ----
test("bots: level 1 inside ten seconds, easy worlds easy, 9×9 asks for speed, finales the hardest stars", () => {
  const RUNS = 60;
  const rate = (level: number, skill: (typeof PLAYERS)[keyof typeof PLAYERS], pass: (seconds: number, par: number) => boolean) => {
    const puzzle = levelPuzzle(level)!;
    let good = 0;
    for (let i = 0; i < RUNS; i++) if (pass(Math.round(bot(puzzle, level * 7919 + i, skill).seconds), puzzle.par)) good++;
    return good / RUNS;
  };
  const three = (seconds: number, par: number) => starsEarned(seconds, 0, par) === 3;
  const twoPlus = (seconds: number, par: number) => starsEarned(seconds, 0, par) >= 2;
  // A steady player (the start tap included) wins level 1 inside ten seconds.
  assert.ok(rate(1, PLAYERS.steady, s => s + 1 <= 10) >= 0.95);
  assert.ok(rate(1, PLAYERS.casual, s => s + 1 <= 15) >= 0.95, "a casual one inside fifteen");
  // Worlds 1–2: even a casual player earns three stars almost always.
  for (const level of [1, 5, 10, 11, 15, 20]) assert.ok(rate(level, PLAYERS.casual, three) >= 0.9, `casual 3★ on ${level}`);
  // 9×9: a casual player gets two stars, a steady one three.
  for (const level of [21, 25, 30, 31, 35, 40]) {
    assert.ok(rate(level, PLAYERS.casual, twoPlus) >= 0.9, `casual 2★ on ${level}`);
    assert.ok(rate(level, PLAYERS.steady, three) >= 0.85, `steady 3★ on ${level}`);
    assert.equal(rate(level, PLAYERS.strong, three), 1, `strong 3★ on ${level}`);
  }
  // The two 9×9 finales are where a casual player's third star is rarest.
  assert.ok(rate(30, PLAYERS.casual, three) <= 0.1);
  assert.ok(rate(40, PLAYERS.casual, three) <= 0.1);
});
