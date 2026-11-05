// The walker's rules, 60 steps a second: it mutates the game in place and allocates nothing.
// `steer` and `walkTo` take input the moment it arrives (the walker answers on the next frame); `stepGame` moves time on.
import { blockedBy, DIRS, exits, neighbour, onward, OPPOSITE, passable, sideTo, type Dir } from "./board";
import { EV, lightAround, type Game } from "./game";
import { RIDE } from "./solve";

const BUMP = 0.2;

function bump(game: Game, dir: Dir, kind: number) {
  game.bumpDir = dir; game.bumpKind = kind; game.bumpAge = BUMP;
  game.bumps++;
  game.events |= EV.bump;
}

/** Starts walking from `at` through `dir` (already checked open). The first move starts the clock. */
function set(game: Game, dir: Dir) {
  game.to = neighbour(game.board.size, game.at, dir);
  game.heading = dir;
  game.runCells = 0;
  game.swipes++;
  if (game.phase === "ready") { game.phase = "walk"; game.events |= EV.start; }
}

function standStill(game: Game) {
  game.to = -1; game.ghost = -1; game.progress = 0; game.target = -1;
  game.events |= EV.stop;
}

/** Stopped at `at`: take the turn asked for on the way, if it's open, or stand. */
function stopHere(game: Game) {
  const pending = game.pending;
  game.pending = 0;
  game.target = -1;
  if (pending && passable(game.board, game.at, pending, game.mask)) { set(game, pending); return; }
  standStill(game);
}

/** The pencil: stepping back onto the cell behind you rubs the line out, like a magazine maze. */
function pencil(game: Game, cell: number) {
  const { trail } = game;
  if (game.trailLen >= 2 && trail[game.trailLen - 2] === cell) { game.trailLen--; game.backtracks++; }
  else if (game.trailLen < trail.length) trail[game.trailLen++] = cell;
  if (game.walkedLen < game.walked.length) game.walked[game.walkedLen++] = cell;
  lightAround(game, cell);
}

/** The walker reaches `cell`. Returns true when the walk goes on. */
function arrive(game: Game, cell: number) {
  const { board } = game;
  const crossed = board.oneWay[cell] & OPPOSITE[game.heading];
  game.at = cell;
  game.to = -1;
  game.steps++;
  game.runCells++;
  pencil(game, cell);
  game.events |= EV.step;
  if (crossed) game.events |= EV.current;
  if (cell === board.exit) {
    game.phase = "over"; game.progress = 0; game.pending = 0; game.target = -1;
    game.events |= EV.finish;
    return false;
  }
  const key = board.key[cell];
  if (key && !(game.mask & key)) {
    game.mask |= key; game.keys++;
    game.opened = key; game.openAge = 0;
    game.events |= EV.key | EV.gate;
    game.progress = 0;
    stopHere(game);
    return false;
  }
  const stand = board.portal[cell];
  if (stand >= 0) {
    game.rideFrom = cell; game.ride = RIDE; game.rides++;
    game.at = stand;
    pencil(game, stand);
    game.events |= EV.ride;
    game.to = -1; game.progress = 0;
    return false;
  }
  if (game.target >= 0) {
    if (cell === game.target || !passable(board, cell, game.heading, game.mask)) { stopHere(game); return false; }
    game.to = neighbour(board.size, cell, game.heading);
    return true;
  }
  const next = onward(board, cell, game.heading, game.mask);
  if (next && game.runCells <= board.open.length) { game.to = neighbour(board.size, cell, next); game.heading = next; return true; }
  if (exits(board, cell, game.mask) === 1 && cell !== board.start) game.deadEnds++;
  game.progress = 0;
  stopHere(game);
  return game.to >= 0;
}

/** A swipe, an arrow key or a pad press. Returns false when it bumped (or the run is over). */
export function steer(game: Game, dir: Dir) {
  if (game.phase === "over") return false;
  if (game.ride > 0) { game.pending = dir; return true; }
  const back = OPPOSITE[game.heading];
  if (game.to >= 0) {
    // Turning back mid-lane is instant, except against a one-way lane's flow.
    if (dir === back) {
      if (!passable(game.board, game.to, back, game.mask)) { bump(game, dir, 3); return false; }
      game.ghost = game.to; game.to = -1; game.heading = dir;
      game.pending = 0; game.target = -1; game.swipes++;
      return true;
    }
    game.pending = dir;
    return true;
  }
  if (game.ghost >= 0) {
    if (dir === back) { game.to = game.ghost; game.ghost = -1; game.heading = dir; game.pending = 0; return true; }
    game.pending = dir;
    return true;
  }
  const why = blockedBy(game.board, game.at, dir, game.mask);
  if (why) { game.heading = dir; bump(game, dir, why); return false; }
  set(game, dir);
  return true;
}

/** A tap on a cell straight down an open lane from where the walker stands: walk there. Returns false if it isn't one. */
export function walkTo(game: Game, cell: number) {
  if (game.phase === "over" || game.to >= 0 || game.ghost >= 0 || game.ride > 0 || cell === game.at) return false;
  const { board } = game, size = board.size;
  const sameRow = Math.floor(cell / size) === Math.floor(game.at / size), sameCol = cell % size === game.at % size;
  if (!sameRow && !sameCol) return false;
  const dir = sideTo(size, game.at, sameRow ? game.at + (cell > game.at ? 1 : -1) : game.at + (cell > game.at ? size : -size));
  if (!dir) return false;
  for (let here = game.at; here !== cell; here = neighbour(size, here, dir)) {
    if (!passable(board, here, dir, game.mask)) return false;
    // A stand or a key on the way stops the walk there, so the lane counts only up to it.
    const next = neighbour(size, here, dir);
    if (next !== cell && (board.portal[next] >= 0 || (board.key[next] && !(game.mask & board.key[next])) || next === board.exit)) return false;
  }
  game.target = cell;
  set(game, dir);
  return true;
}

/** Moves time on by `dt` seconds. The clock runs from the first move to the shop. */
export function stepGame(game: Game, dt: number) {
  if (game.phase === "over") return;
  if (game.phase === "walk") game.elapsed += dt;
  if (game.bumpAge > 0) game.bumpAge = Math.max(0, game.bumpAge - dt);
  if (game.openAge < 9) game.openAge += dt;
  if (game.ride > 0) {
    game.ride -= dt;
    if (game.ride <= 0) { game.ride = 0; stopHere(game); }
    return;
  }
  if (game.ghost >= 0) {
    game.progress -= dt * game.speed;
    if (game.progress > 0) return;
    // Back at `at`: carry on down the lane the way it now faces, or stop at a junction.
    const left = -game.progress;
    game.ghost = -1; game.progress = 0;
    const next = onward(game.board, game.at, game.heading, game.mask);
    if (game.pending || !next) { stopHere(game); return; }
    game.to = neighbour(game.board.size, game.at, next); game.heading = next; game.progress = left;
  }
  if (game.to < 0) return;
  game.progress += dt * game.speed;
  while (game.to >= 0 && game.progress >= 1) {
    game.progress -= 1;
    if (!arrive(game, game.to)) { if (game.to < 0) game.progress = 0; return; }
  }
}

/** Where the walker is drawn, in cells (col, row), written into `out` (a preallocated pair). */
export function walkerAt(game: Game, out: Float64Array) {
  const size = game.board.size, at = game.at, ax = at % size, ay = Math.floor(at / size);
  const other = game.ghost >= 0 ? game.ghost : game.to, t = other >= 0 ? game.progress : 0;
  out[0] = ax; out[1] = ay;
  if (other >= 0) { out[0] += (other % size - ax) * t; out[1] += (Math.floor(other / size) - ay) * t; }
  return out;
}

/** The side each of the four pad arrows walks, in screen order (for the hint glow): N E S W. */
export const PAD_DIRS = DIRS;
