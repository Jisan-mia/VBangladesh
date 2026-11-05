// The statechart rules (ai_docs/statecharts/jora-melao) replayed against the pure session reducer.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS } from "../lib/levels";
import { flip, newGame, type Game } from "../lib/play";
import * as session from "../lib/session";

const T = session.TIMING;
const peekBoard = () => session.start(session.ready(newGame(3, LEVELS[8])), 0);
const birdsBoard = () => session.start(session.ready(newGame(4, LEVELS[18])), 0);
const plainBoard = () => session.start(session.ready(newGame(5, LEVELS[2])), 0);
const wrong = (g: Game) => { const b = g.board.findIndex(id => id !== g.board[0]); return [0, b] as const; };
/** Taps two cards that do not match. */
const miss = (run: session.Run, now: number) => { const [a, b] = wrong(run.game); return session.tap(session.tap(run, now, a, T), now, b, T); };

test("the sign starts the board: a peek on the hat's tables (all up, its clock running), plain play elsewhere", () => {
  const peek = peekBoard();
  assert.equal(peek.game.phase, "peek");
  assert.equal(peek.timer, "peek");
  assert.equal(peek.dur, 3000);
  assert.equal(plainBoard().game.phase, "play");
  const again = plainBoard();
  assert.equal(session.start(again, 5), again, "the sign works once");
});

test("the peek ends exactly when its time is up, and carries the overshoot into play time", () => {
  const run = peekBoard();
  assert.equal(session.tick(run, 2999), run);
  const next = session.tick(run, 3100);
  assert.equal(next.game.phase, "play");
  assert.equal(next.timer, null);
  assert.equal(session.playMs(next, 3100), 100, "play time starts when the peek ended, not when it was noticed");
  assert.equal(session.peekLeft(run, 500), 3);
  assert.equal(session.peekLeft(run, 2001), 1);
});

test("rule · PausedWhenHidden: a hidden tab or a blur freezes the peek's clock and the miss timer", () => {
  let run = session.pause(peekBoard(), 1000, "away");
  assert.equal(run.why, "away");
  assert.equal(session.elapsed(run, 60_000), 1000, "away time is never charged to the peek");
  assert.equal(session.tick(run, 60_000), run);
  run = session.resume(run, 61_000, "away", T.breath);
  assert.equal(session.peekLeft(run, 61_000), 2, "nothing was lost or gained: 2 s of 3 s were left");
  assert.equal(session.tick(run, 62_900).game.phase, "peek");
  assert.equal(session.tick(run, 63_400).game.phase, "play", "the 350 ms breath, then the 2 s that were left");
});

test("rule · NothingShowingWhilePaused: a missed pair turns back the moment you go away (and the birds fly if due)", () => {
  let run = miss(plainBoard(), 100);
  assert.equal(run.game.open.length, 2);
  assert.equal(run.timer, "miss");
  run = session.pause(run, 200, "away");
  assert.equal(run.game.open.length, 0);
  assert.equal(run.timer, null);
  // On the birds' table the second miss is due: pausing turns the pair back and the birds fly right then.
  let birds = birdsBoard();
  birds = session.tick(miss(birds, 0), 1000);
  birds = miss(birds, 1100);
  const before = birds.game.board.slice();
  birds = session.pause(birds, 1200, "away");
  assert.equal(birds.game.open.length, 0);
  assert.equal(birds.game.flights, 1);
  assert.notDeepEqual(birds.game.board, before);
});

test("rule · NoProgressWhilePaused: a tap while paused turns nothing, and the tap that wakes the board is not a move", () => {
  const run = session.pause(plainBoard(), 10, "away");
  assert.equal(session.tap(run, 20, 0, T), run);
  const awake = session.resume(run, 30, "away", 0);
  assert.equal(awake.game, run.game, "waking changes no card");
  assert.equal(awake.game.flips.length, 0);
});

test("rule · LevelListFreezesPlay: the list outranks an away pause, and only closing it resumes", () => {
  let run = session.pause(peekBoard(), 100, "sheet");
  assert.equal(run.why, "sheet");
  run = session.pause(run, 200, "away");
  assert.equal(run.why, "sheet");
  assert.equal(session.resume(run, 300, "away", 0), run, "coming back from another window does not close the list");
  assert.equal(session.elapsed(run, 99_999), 100);
  run = session.resume(run, 400, "sheet", 0);
  assert.equal(run.why, null);
  // Away first, then the list: the list takes over.
  let both = session.pause(peekBoard(), 100, "away");
  both = session.pause(both, 150, "sheet");
  assert.equal(both.why, "sheet");
});

test("rule · NoDoubleResult: the end freezes play time, and nothing after it moves the board", () => {
  let run = plainBoard(), now = 0;
  // A perfect clear by reading the board (a test may look).
  for (const index of run.game.board.map((_, i) => i)) {
    if (run.game.found[index] >= 0) continue;
    const mate = run.game.board.findIndex((id, other) => other !== index && id === run.game.board[index]);
    now += 400; run = session.tap(run, now, index, T);
    now += 400; run = session.tap(run, now, mate, T);
  }
  assert.equal(run.game.phase, "over");
  const spent = session.playMs(run, now);
  assert.equal(spent, now, "the clock counted from the moment play began to the last flip");
  assert.equal(session.playMs(run, now + 60_000), spent, "stopped at the end");
  assert.equal(session.tap(run, now + 1, 0, T), run);
  assert.equal(session.tick(run, now + 5000), run);
  assert.equal(session.pause(run, now + 10, "away"), run, "nothing to pause after the end");
});

test("play time counts only while the board is in play: not the peek, not a pause", () => {
  let run = session.tick(peekBoard(), 3000);
  run = session.tap(run, 3500, 0, T);
  assert.equal(session.playMs(run, 4500), 1500, "from the peek's end (3000)");
  run = session.pause(run, 4500, "away");
  assert.equal(session.playMs(run, 90_000), 1500, "frozen while away");
  run = session.resume(run, 90_000, "away", 0);
  assert.equal(session.playMs(run, 91_000), 2500);
});

test("a missed pair turns back by itself after its time, longer in ধীরে খেলো, and a tap on another card turns it back sooner", () => {
  const run = miss(plainBoard(), 0);
  assert.equal(session.tick(run, 999).game.open.length, 2);
  assert.equal(session.tick(run, 1000).game.open.length, 0);
  const slowRun = (() => { const [a, b] = wrong(plainBoard().game); const r = session.tap(plainBoard(), 0, a, session.SLOW_TIMING); return session.tap(r, 0, b, session.SLOW_TIMING); })();
  assert.equal(session.tick(slowRun, 1799).game.open.length, 2);
  assert.equal(session.tick(slowRun, 1800).game.open.length, 0);
  const other = run.game.board.findIndex((_, i) => !run.game.open.includes(i));
  const sooner = session.tap(run, 300, other, T);
  assert.deepEqual(sooner.game.open, [other]);
  assert.equal(sooner.timer, null);
});

test("on the birds' table a tap turns the missed pair back and the cards fly first; the flip needs a second tap", () => {
  let run = miss(birdsBoard(), 0);
  run = session.tick(run, 1000);
  run = miss(run, 1100);
  const other = run.game.board.findIndex((_, i) => !run.game.open.includes(i) && run.game.found[i] < 0);
  const tapped = session.tap(run, 1200, other, T);
  assert.equal(tapped.game.open.length, 0, "only turned back");
  assert.equal(tapped.game.flights, 1);
  assert.equal(tapped.game.flips.length, run.game.flips.length);
});

test("session and play agree: flipping through the reducer equals flipping the pure game", () => {
  let run = plainBoard(), game = run.game;
  for (const index of [0, 1, 2, 3, 4, 5]) {
    const before = run.game;
    run = session.tap(run, 100 * (index + 1), index, T);
    game = flip(before, index);
    assert.deepEqual(run.game, game);
  }
});
