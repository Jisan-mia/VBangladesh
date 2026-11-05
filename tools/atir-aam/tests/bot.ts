// Headless players. The look-ahead bot sees the seeded drops exactly, so it sets each level's par (scripts/make-levels.ts)
// and proves every level can be cleared inside ★★★. The casual bot plays one swipe deep with a rough eye and makes a
// wrong swipe now and then, like a person on a bus; its clear rates are the difficulty targets (levels.test.ts).
import { makeRng } from "../../../shared/game-core";
import { CROW, STONE, WEED, type Dir } from "../lib/board";
import { createGame, move, pickOffer, recommend, type Game, type Run } from "../lib/rules";

const DIRS: readonly Dir[] = [0, 1, 2, 3];

/** Big plates hug a corner along a snake, with room to spare. */
export function worth(cells: readonly number[], size: number) {
  let value = 0, empty = 0;
  for (let cell = 0; cell < cells.length; cell++) {
    const stage = cells[cell];
    if (stage === 0) { empty++; continue; }
    if (stage === STONE || stage === CROW) continue;
    if (stage === WEED) { value -= 8; continue; }
    const row = Math.floor(cell / size), col = cell % size, along = row % 2 ? size - 1 - col : col;
    value += 4 ** stage * 4 ** ((size * size - (row * size + along)) / size);
  }
  return value * (1 + empty * 0.1) + empty * 50;
}

/** A finished game is worth its result; otherwise the board. */
const judge = (game: Game) => game.won ? 1e15 - game.moves.length : game.over ? -1e12 : worth(game.cells, game.size);

function search(game: Game, depth: number): number {
  if (!depth || game.over) return judge(game);
  let best = -Infinity;
  for (const dir of DIRS) {
    const next = move(game, dir);
    if (next) best = Math.max(best, search(next, depth - 1));
  }
  return best === -Infinity ? judge(game) : best;
}

/** The look-ahead bot's swipe, or null when stuck. */
export function lookAhead(game: Game, depth = game.size > 4 ? 2 : 3): Dir | null {
  let pick: Dir | null = null, best = -Infinity;
  for (const dir of DIRS) {
    const next = move(game, dir);
    if (!next) continue;
    const value = search(next, depth - 1);
    if (value > best) { best = value; pick = dir; }
  }
  return pick;
}

/** Plays a whole run with a chooser; offers take the recommended pick. */
export function playOut(start: Game, choose: (game: Game) => Dir | null, cap = 3000) {
  let game = start;
  while (!game.over && game.moves.length < cap) {
    if (game.offer) { game = pickOffer(game, game.offer.indexOf(recommend(game, game.offer)))!; continue; }
    const dir = choose(game);
    if (dir === null) break;
    const next = move(game, dir);
    if (!next) break;
    game = next;
  }
  return game;
}

/**
 * Par: the fewest moves of three strong, deterministic runs (the look-ahead bot and two steady players that never slip),
 * ignoring the move limit. Null if none clears it.
 */
export function botPar(run: Run, cap = 2000): number | null {
  // a run without a limit, to measure par: the same plot and events
  const start = createGame(run), free: Game = { ...start, spec: { ...start.spec, bot: 100000 } };
  let best: number | null = null;
  for (const choose of [(g: Game) => lookAhead(g), steady(1, 0), steady(2, 0)]) {
    const game = playOut(free, choose, cap);
    if (game.won && (best === null || game.moves.length < best)) best = game.moves.length;
  }
  return best;
}

/** A casual player: one swipe deep, a fuzzy eye, and a wrong swipe `slip` of the time. */
export function casual(personality: number, slip = 0.2) {
  const rng = makeRng(personality);
  return (game: Game): Dir | null => {
    const options: Array<{ dir: Dir; value: number }> = [];
    for (const dir of DIRS) {
      const next = move(game, dir);
      if (next) options.push({ dir, value: next.won ? Infinity : judge(next) * (0.75 + rng() * 0.5) });
    }
    if (!options.length) return null;
    if (rng() < slip) return options[Math.floor(rng() * options.length)].dir;
    return options.reduce((a, b) => b.value > a.value ? b : a).dir;
  };
}

/** A steady player: two swipes deep, a wrong swipe `slip` of the time. */
export function steady(personality: number, slip = 0.05) {
  const rng = makeRng(personality);
  return (game: Game): Dir | null => {
    let pick: Dir | null = null, best = -Infinity;
    const any: Dir[] = [];
    for (const dir of DIRS) {
      const next = move(game, dir);
      if (!next) continue;
      any.push(dir);
      const value = search(next, 1) * (0.9 + rng() * 0.2);
      if (value > best) { best = value; pick = dir; }
    }
    if (any.length && rng() < slip) return any[Math.floor(rng() * any.length)];
    return pick;
  };
}

/** How often a bot clears `run` over `count` personalities, and its median move count when it does. */
export function rateOf(run: Run, make: (person: number) => (game: Game) => Dir | null, count = 30) {
  let won = 0;
  const counts: number[] = [];
  for (let person = 1; person <= count; person++) {
    const game = playOut(createGame(run), make(person * 7919));
    if (game.won) { won++; counts.push(game.moves.length); }
  }
  counts.sort((a, b) => a - b);
  return { rate: won / count, median: counts[Math.floor(counts.length / 2)] ?? 0 };
}
