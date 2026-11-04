// Headless players for the tests. The strong bot plans a safe path every move; the casual one reacts a move late and sometimes
// picks a random safe turn, like a person on a bus with one thumb.
import { makeRng } from "../../../shared/game-core";
import { levelOf } from "../lib/levels";
import { bodyCells, createGame, deadAhead, gateDue, landing, step, turn, CELLS, COLS, type Dir, type Game } from "../lib/snake";

const ORDERS: Dir[][] = [[0, 1, 2, 3], [1, 3, 0, 2], [3, 2, 1, 0], [2, 0, 3, 1]];

/** Cells the bot keeps away from now: tin, the shut (or about-to-shut) gate, each crow and the cells either side of it on its line. */
function danger(game: Game) {
  const bad = new Uint8Array(CELLS);
  for (let cell = 0; cell < CELLS; cell++) {
    if (game.wall[cell]) bad[cell] = 1;
    if (game.gateCell[cell] && (game.gateShut || gateDue(game, game.moves + 2) || gateDue(game, game.moves + 4))) bad[cell] = 1;
  }
  for (let i = 0; i < game.crows; i++) {
    const at = game.crowAt[i], unit = Math.floor(game.crowFrom[i] / COLS) === Math.floor(game.crowTo[i] / COLS) ? 1 : COLS;
    for (const cell of [at, at - unit, at + unit]) if (cell >= 0 && cell < CELLS) bad[cell] = 1;
  }
  return bad;
}

/** Shortest path (cells after the head) to any goal, avoiding `blocked`; null when there is none. */
function path(game: Game, head: number, dir: number, blocked: Uint8Array, goals: Set<number>, order: Dir[]) {
  const from = new Map<number, number>([[head, -1]]), firstDir = new Map<number, number>([[head, dir]]), queue = [head];
  while (queue.length) {
    const cell = queue.shift()!;
    for (const d of order) {
      if ((d + 2) % 4 === firstDir.get(cell)) continue;
      const next = landing(game, cell, d);
      if (next < 0 || blocked[next] || from.has(next)) continue;
      from.set(next, cell); firstDir.set(next, d);
      if (goals.has(next)) {
        const cells = [next];
        while (from.get(cells[0]) !== head) cells.unshift(from.get(cells[0])!);
        return { cells, dirs: cells.map(c => firstDir.get(c)!) };
      }
      queue.push(next);
    }
  }
  return null;
}

/** The safe bot's choice: the food (or chilli) if the tail is still reachable afterwards, else follow the tail, else any move that doesn't crash. */
export function strongMove(game: Game, order: Dir[] = ORDERS[0]): Dir | null {
  const body = bodyCells(game), head = body[0], bad = danger(game);
  const blocked = bad.slice();
  for (const cell of body.slice(0, -1)) blocked[cell] = 1;
  const goals = new Set([game.food, game.bonus].filter(cell => cell >= 0 && !bad[cell]));
  const toFood = goals.size ? path(game, head, game.dir, blocked, goals, order) : null;
  if (toFood) {
    const after = [...toFood.cells].reverse().concat(body).slice(0, body.length + 1);
    const afterBlocked = bad.slice();
    for (const cell of after.slice(1, -1)) afterBlocked[cell] = 1;
    if (path(game, after[0], toFood.dirs[toFood.dirs.length - 1], afterBlocked, new Set([after[after.length - 1]]), order)) return toFood.dirs[0] as Dir;
  }
  const tailBlocked = bad.slice();
  for (const cell of body.slice(1, -1)) tailBlocked[cell] = 1;
  const toTail = path(game, head, game.dir, tailBlocked, new Set([body[body.length - 1]]), order);
  if (toTail && toTail.cells[0] !== body[body.length - 1]) return toTail.dirs[0] as Dir;
  for (const d of order) {
    if ((d + 2) % 4 === game.dir) continue;
    const next = landing(game, head, d);
    if (next >= 0 && !blocked[next]) return d;
  }
  return toFood ? toFood.dirs[0] as Dir : null;
}

export type Run = { game: Game; moves: number };

/** The strong bot: plans every move. Tries each steering habit until one clears (a greedy snake can coil into itself). */
export function playStrong(seed: number, level: number, limit = 3000): Run {
  let game = createGame(seed, level);
  for (const order of ORDERS) {
    game = createGame(seed, level);
    for (let moves = 0; moves < limit && !game.over; moves++) {
      const dir = strongMove(game, order);
      if (dir !== null) turn(game, dir);
      step(game);
    }
    if (game.won) break;
  }
  return { game, moves: game.moves };
}

/** The casual bot: one try. About 10–20% of the time (more on quicker levels) it reacts a move late (goes straight on unless that crashes), 5% of the time it turns somewhere random but safe. */
export function playCasual(seed: number, level: number, limit = 3000, slip = 0.05): Run {
  const game = createGame(seed, level), rng = makeRng(seed ^ 0x5eed);
  // A quicker snake gives a person less time: the chance of a late reaction grows with the square of the speed.
  const late = level ? 0.1 * (230 / levelOf(level).ms) ** 2 : 0.12;
  for (let moves = 0; moves < limit && !game.over; moves++) {
    const roll = rng();
    let dir = strongMove(game);
    if (roll < slip) {
      const random = Math.floor(rng() * 4) as Dir, before = game.queued;
      if (turn(game, random) && deadAhead(game)) game.queued = before; else if (game.queued > before) dir = null;
    } else if (roll < slip + late && !deadAhead(game)) dir = null;
    if (dir !== null) turn(game, dir);
    step(game);
  }
  return { game, moves: game.moves };
}

export const rate = (level: number, seeds: number[], play: (seed: number, level: number) => Run) =>
  seeds.filter(seed => play(seed, level).game.won).length / seeds.length;
