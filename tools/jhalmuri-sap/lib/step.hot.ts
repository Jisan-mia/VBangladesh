// One move of ঝালমুড়ি সাপ, run several times a second: it only mutates the Game made in game.ts (no allocation, no closures).
// Order inside a move: the waiting turn, the head's next cell (through a pipe if it is one), what it hits, the body slides,
// then food, chillies, crows and the gate. The seed alone fixes what comes out of the ঠোঙা and in which order.
import { pick } from "../../../shared/game-core";
import { CELLS, COLS, ROWS } from "./levels";
import { BONUS_EVERY, BONUS_LIFE, BONUS_POINTS, COMBO_MOVES, DX, DY, HOT_MOVES, MIN_LENGTH, POINTS, SOUR_CUT, type Dir, type Kind, type StepEvent } from "./rules";
import type { Game } from "./game";

// Repeats set how often each food comes out of the ঠোঙা: mostly মুড়ি and চানাচুর, তেঁতুল now and then.
const BAG: readonly Kind[] = ["muri", "muri", "muri", "chanachur", "chanachur", "chanachur", "peyaj", "peyaj", "morich", "morich", "tetul"];

function crowOn(game: Game, cell: number) {
  for (let i = 0; i < game.crows; i++) if (game.crowAt[i] === cell) return true;
  return false;
}

function taken(game: Game, cell: number) {
  return cell === game.food || cell === game.bonus || game.wall[cell] === 1 || game.occ[cell] === 1
    || cell === game.pipeA || cell === game.pipeB || game.gateCell[cell] === 1 || crowOn(game, cell);
}

/** The seeded cell, or the next free one after it, so a friend's food lands in the same place unless their snake is lying there. */
function freeFrom(game: Game, start: number) {
  for (let offset = 0; offset < CELLS; offset++) {
    const cell = (start + offset) % CELLS;
    if (!taken(game, cell)) return cell;
  }
  return -1;
}

/** On a `near` level the seeded cell is folded into a small window round the head. */
function nearHead(game: Game, start: number) {
  const span = game.near * 2 + 1, local = start % (span * span), head = game.ring[game.head];
  const x = Math.max(0, Math.min(COLS - 1, head % COLS + local % span - game.near));
  const y = Math.max(0, Math.min(ROWS - 1, Math.floor(head / COLS) + Math.floor(local / span) - game.near));
  return y * COLS + x;
}

// Every food draws exactly two numbers and every golden chilli one.
export function placeFood(game: Game) {
  game.kind = BAG[pick(game.rng, BAG.length)];
  const start = pick(game.rng, CELLS);
  game.food = -1;
  game.food = freeFrom(game, game.near ? nearHead(game, start) : start);
  if (game.food < 0) { game.over = true; game.won = true; }
}

function placeBonus(game: Game) {
  const start = pick(game.rng, CELLS);
  game.bonus = -1;
  game.bonus = freeFrom(game, start);
  game.bonusLife = game.bonus < 0 ? 0 : BONUS_LIFE;
}

/** Where the head lands from `cell` going `dir`: -1 off the board; a pipe mouth sends it out of the other one. */
export function landing(game: Game, cell: number, dir: number) {
  const x = cell % COLS + DX[dir], y = Math.floor(cell / COLS) + DY[dir];
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return -1;
  const next = y * COLS + x;
  return next === game.pipeA ? game.pipeB : next === game.pipeB ? game.pipeA : next;
}

/** The gate is due to be shut on this move count (whether or not it could shut yet). */
export const gateDue = (game: Game, moves: number) => game.gatePeriod > 0 && moves % game.gatePeriod >= game.gatePeriod - game.gateShutFor;
/** The gate's lamp blinks: it is due within `gateWarn` moves, or due but waiting for the snake to clear it. */
export function gateWarning(game: Game) {
  if (!game.gatePeriod || game.gateShut) return false;
  const phase = game.moves % game.gatePeriod, closeAt = game.gatePeriod - game.gateShutFor;
  return phase >= closeAt - game.gateWarn;
}

function gateClear(game: Game) {
  for (let cell = 0; cell < CELLS; cell++) if (game.gateCell[cell] === 1 && (game.occ[cell] === 1 || crowOn(game, cell))) return false;
  return true;
}

/** The next move's direction: the first waiting turn, or straight on. */
export const nextDir = (game: Game) => game.queued ? game.queue[0] : game.dir;

/** True when the next move, as things stand, ends the run: the edge glows. */
export function deadAhead(game: Game) {
  if (game.over) return false;
  const next = landing(game, game.ring[game.head], nextDir(game));
  if (next < 0 || game.wall[next] === 1 || crowOn(game, next)) return true;
  if (game.gateCell[next] === 1 && (game.gateShut || (gateDue(game, game.moves + 1) && gateClear(game)))) return true;
  const tail = game.ring[(game.head + game.length - 1) % CELLS];
  return game.occ[next] === 1 && (next !== tail || next === game.food || next === game.bonus);
}

function cutTail(game: Game, cells: number) {
  for (let i = 0; i < cells && game.length > MIN_LENGTH; i++) {
    const tail = game.ring[(game.head + game.length - 1) % CELLS];
    game.length--;
    game.occ[tail] = 0;
  }
}

/** A crow walks one cell along its line; at either end, or when the snake or the cell in front of the head is in its way, it turns round. */
function walkCrows(game: Game) {
  const front = landing(game, game.ring[game.head], game.dir);
  for (let i = 0; i < game.crows; i++) {
    const from = game.crowFrom[i], to = game.crowTo[i], at = game.crowAt[i];
    const unit = Math.floor(from / COLS) === Math.floor(to / COLS) ? 1 : COLS;
    if ((game.crowWay[i] > 0 && at === to) || (game.crowWay[i] < 0 && at === from)) { game.crowWay[i] = -game.crowWay[i] as -1 | 1; game.crowTurned = game.moves; }
    const next = at + game.crowWay[i] * (to > from ? unit : -unit);
    if (game.occ[next] === 1 || next === front || crowOn(game, next)) { game.crowWay[i] = -game.crowWay[i] as -1 | 1; game.crowTurned = game.moves; continue; }
    game.crowAt[i] = next;
  }
}

export function step(game: Game): StepEvent {
  if (game.over) return "none";
  if (game.queued) {
    game.dir = game.queue[0] as Dir;
    for (let i = 1; i < game.queued; i++) game.queue[i - 1] = game.queue[i];
    game.queued--;
  }
  const head = game.ring[game.head];
  const plain = head % COLS + DX[game.dir], row = Math.floor(head / COLS) + DY[game.dir];
  const next = landing(game, head, game.dir);
  const piped = next >= 0 && next !== row * COLS + plain;
  if (next < 0) return end(game, "fence");
  if (game.wall[next] === 1) return end(game, "tin");
  if (game.gateShut && game.gateCell[next] === 1) return end(game, "gate");
  if (crowOn(game, next)) return end(game, "crow");
  const eats = next === game.food, golden = next === game.bonus, grows = eats || golden;
  // The tail slides out of its cell this move, unless the snake is growing.
  const tail = game.ring[(game.head + game.length - 1) % CELLS];
  if (game.occ[next] === 1 && (grows || next !== tail)) return end(game, "tail");

  game.head = (game.head + CELLS - 1) % CELLS;
  game.ring[game.head] = next;
  game.length++;
  game.occ[next] = 1;
  if (!grows) {
    const last = game.ring[(game.head + game.length - 1) % CELLS];
    game.length--;
    if (last !== next) game.occ[last] = 0;
  }
  game.moves++;
  if (game.hot > 0) game.hot--;
  if (game.bonus >= 0 && !golden && --game.bonusLife <= 0) game.bonus = -1;
  if (golden) { game.bonus = -1; game.golden++; game.score += BONUS_POINTS; }
  if (grows) { game.combo = game.moves - game.lastBite <= COMBO_MOVES ? game.combo + 1 : 1; game.lastBite = game.moves; }
  if (eats) {
    game.eaten++;
    game.score += POINTS;
    if (game.hotOn && game.kind === "morich") game.hot = HOT_MOVES;
    if (game.sourOn && game.kind === "tetul") cutTail(game, SOUR_CUT);
    if (game.goal && game.eaten >= game.goal) { game.over = true; game.won = true; game.food = -1; game.bonus = -1; return "win"; }
    placeFood(game);
    if (!game.over && game.eaten % BONUS_EVERY === 0) placeBonus(game);
  }
  if (game.crows && game.moves % game.crowEvery === 0) walkCrows(game);
  if (game.gatePeriod) game.gateShut = gateDue(game, game.moves) && (game.gateShut || gateClear(game));
  if (game.won) return "win";
  return golden ? "bonus" : eats ? "eat" : piped ? "pipe" : "move";
}

function end(game: Game, what: "fence" | "tin" | "tail" | "crow" | "gate"): StepEvent {
  game.over = true;
  game.crash = what;
  return "crash";
}
