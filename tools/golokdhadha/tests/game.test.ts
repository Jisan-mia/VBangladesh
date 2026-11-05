// The walker's rules (lib/step.hot.ts) on small hand-built boards: swipes to the next turn, turning back mid-lane,
// buffered turns, bumps and why, keys and gates, one-way lanes, rides, taps, the pencil and the clock.
import assert from "node:assert/strict";
import test from "node:test";
import { E, emptyBoard, makeOneWay, N, openWall, S, setGate, W, type Board, type Dir } from "../lib/board";
import { createGame, EV, tenthsOf, trailOf, type Game } from "../lib/game";
import { levelBoard, parOf, starsOf } from "../lib/levels";
import { bestSide, buildGraph, costToGo, RIDE, swipe } from "../lib/solve";
import { stepGame, steer, walkTo } from "../lib/step.hot";

const DT = 1 / 60;
const run = (game: Game, seconds: number) => { for (let i = 0; i < Math.round(seconds / DT); i++) stepGame(game, DT); };
const where = { level: 1, seed: 0, old: false };

/**
 * 0 → 1 → 2 → 3 east, down to 7, a junction: west to 6 → 5 (a dead end), south to 11 → 15 (the shop).
 *   0 1 2 3
 *   4 5 6 7
 *   8 9 . 11
 *   . . . 15
 */
function lanes(edit?: (board: Board) => void) {
  const board = emptyBoard(4, 1);
  openWall(board, 0, E); openWall(board, 1, E); openWall(board, 2, E); openWall(board, 3, S);
  openWall(board, 7, W); openWall(board, 6, W); openWall(board, 7, S); openWall(board, 11, S);
  edit?.(board);
  return createGame(where, "n", false, { board, graph: buildGraph(board) });
}

test("a swipe walks round the bend to the next junction and stops; the clock starts on the first move", () => {
  const game = lanes();
  run(game, 0.5);
  assert.equal(game.elapsed, 0, "no clock before the first move");
  assert.equal(game.phase, "ready");
  assert.ok(steer(game, E));
  assert.ok(game.events & EV.start);
  run(game, 1);
  assert.equal(game.at, 7);
  assert.equal(game.to, -1, "standing at the junction");
  assert.deepEqual(trailOf(game), [0, 1, 2, 3, 7]);
  assert.ok(Math.abs(game.elapsed - 1) < 1e-9);
  const out = { cell: 0, mask: 0, cells: 0, rides: 0, done: false, picked: 0 };
  assert.ok(swipe(game.board, 0, E, 0, out));
  assert.equal(out.cell, 7, "the solver's swipe ends where the walker stops");
  assert.equal(out.cells, 4);
});

test("a turn asked for on the way is taken at the junction without stopping", () => {
  const game = lanes();
  steer(game, E);
  run(game, 0.1);
  assert.ok(steer(game, S), "buffered");
  run(game, 1);
  assert.equal(game.phase, "over");
  assert.equal(game.at, 15);
  // 6 cells at 14 a second, and nothing more: no stop at the junction.
  assert.ok(game.elapsed <= 6 / 14 + 2 * DT, String(game.elapsed));
  assert.equal(game.swipes, 2);
});

test("swiping back mid-lane turns round at once and walks back home", () => {
  const game = lanes();
  steer(game, E);
  run(game, 0.05);
  assert.ok(game.to === 1 && game.progress > 0.5);
  const before = game.progress;
  assert.ok(steer(game, W));
  assert.equal(game.ghost, 1);
  assert.equal(game.progress, before, "it turns where it stands, no jump");
  run(game, 0.2);
  assert.equal(game.at, 0);
  assert.equal(game.to, -1);
  assert.deepEqual(trailOf(game), [0], "it never reached the next cell, so the line didn't grow");
});

test("bumps say why: a wall, a gate without its key, a one-way lane from its wrong end", () => {
  const wall = lanes();
  assert.equal(steer(wall, N), false);
  assert.equal(wall.bumpKind, 1);
  assert.ok(wall.events & EV.bump);
  assert.equal(wall.phase, "ready", "a bump doesn't start the clock");

  const locked = lanes(board => setGate(board, 3, S, 1));
  steer(locked, E); run(locked, 1);
  assert.equal(locked.at, 3, "a locked gate is a wall: the lane ends at it");
  assert.equal(steer(locked, S), false);
  assert.equal(locked.bumpKind, 2);

  // With the gate at the junction shut, the lane runs on past it to the key; picking it up stops the walker and opens the gate.
  const gated = lanes(board => { setGate(board, 7, S, 1); board.key[5] = 1; });
  steer(gated, E); run(gated, 1);
  assert.equal(gated.at, 5);
  assert.equal(gated.mask, 1);
  assert.equal(gated.keys, 1);
  steer(gated, E); run(gated, 1);
  assert.equal(gated.at, 7, "the junction stops it again");
  assert.ok(steer(gated, S));
  run(gated, 1);
  assert.equal(gated.phase, "over");

  const current = lanes(board => makeOneWay(board, 3, S));
  steer(current, E); run(current, 1);
  assert.equal(current.at, 7);
  assert.ok(current.events & EV.current, "crossing the lane splashes");
  assert.equal(steer(current, N), false);
  assert.equal(current.bumpKind, 3);
});

test("turning back on a one-way lane is refused; you can't swim upstream", () => {
  const game = lanes(board => makeOneWay(board, 3, S));
  steer(game, E);
  // Walk until it's crossing 3 → 7.
  for (let i = 0; i < 200 && !(game.at === 3 && game.to === 7); i++) stepGame(game, DT / 4);
  assert.equal(game.to, 7);
  assert.equal(steer(game, N), false);
  assert.equal(game.bumpKind, 3);
  run(game, 0.5);
  assert.equal(game.at, 7, "it carried on");
});

test("a রিকশা stand carries you to the other stand and stops there; stepping back on rides you back", () => {
  // 0 → 1 → 2 (stand A) | stand B at 12, then 12 → 13 → 14 → 15 the shop. The rows between are walled off.
  const board = emptyBoard(4, 2);
  openWall(board, 0, E); openWall(board, 1, E); openWall(board, 12, E); openWall(board, 13, E); openWall(board, 14, E);
  board.portal[2] = 12; board.portal[12] = 2;
  const game = createGame(where, "n", false, { board, graph: buildGraph(board) });
  steer(game, E);
  run(game, 0.25);
  assert.equal(game.at, 12);
  assert.ok(game.ride > 0);
  assert.equal(steer(game, E), true, "a swipe during the ride waits for its end");
  run(game, RIDE + 0.5);
  assert.equal(game.phase, "over");
  assert.equal(game.rides, 1);
  // Back again from the far side.
  const back = createGame(where, "n", false, { board, graph: buildGraph(board) });
  steer(back, E); run(back, 1);
  steer(back, E); run(back, 0.1);
  steer(back, W); run(back, 1);
  assert.equal(back.at, 2, "turned back onto the stand, and rode back");
  assert.equal(back.rides, 2);
});

test("a tap walks straight down an open lane to that cell, and only there", () => {
  const game = lanes();
  assert.equal(walkTo(game, 5), false, "not in a straight line");
  assert.equal(walkTo(game, 2), true);
  run(game, 1);
  assert.equal(game.at, 2, "stops at the tapped cell, not the junction");
  assert.equal(walkTo(game, 15), false, "the wall below 2");
});

test("the pencil rubs out a dead end walked back, and the stats count it", () => {
  const game = lanes();
  steer(game, E); run(game, 1);
  steer(game, W); run(game, 1);
  assert.equal(game.at, 5);
  assert.equal(game.deadEnds, 1);
  steer(game, E); run(game, 1);
  assert.deepEqual(trailOf(game), [0, 1, 2, 3, 7]);
  assert.equal(game.backtracks, 2);
  steer(game, S); run(game, 1);
  assert.equal(game.steps, 4 + 2 + 2 + 2);
});

test("same inputs, same run: determinism on a real level", () => {
  const play = () => {
    const game = createGame({ level: 9, seed: 0, old: false }, "n", false), cost = costToGo(game.graph, 1 / 14, 0.5, RIDE);
    let t = 0;
    while (game.phase !== "over" && t < 4000) {
      if (game.to < 0 && game.ghost < 0 && game.ride <= 0) steer(game, (1 << bestSide(game.graph, game.at * 4 + game.mask, cost, 1 / 14, 0.5, RIDE)) as Dir);
      stepGame(game, DT); t++;
    }
    return game;
  };
  const a = play(), b = play();
  assert.equal(a.phase, "over");
  assert.equal(a.elapsed, b.elapsed);
  assert.deepEqual(trailOf(a), trailOf(b));
  assert.equal(a.keys, 2);
  assert.equal(starsOf(tenthsOf(a.elapsed), parOf(a.where, "n", false), "n"), 3, "the best walk with no thinking is three stars");
  assert.equal(levelBoard(9).board, a.board);
});
