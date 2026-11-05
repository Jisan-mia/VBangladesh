// Headless players. The greedy bot (lib/hint.ts) sees what a person sees and sets each level's moves and stars. These two play
// like people on a bus: they pick among the best few swaps and now and then take any swap that works. Their clear rates are
// the difficulty targets (levels.test.ts).
import { makeRng } from "../../../shared/game-core";
import { allMoves } from "../lib/board";
import { bestMove } from "../lib/hint";
import { createGame, move, type Game, type Run } from "../lib/rules";

export type Person = { pool: number; slip: number };
/** A casual player: one of the best three swaps, and one swap in eight is just any swap that works. */
export const casual: Person = { pool: 3, slip: 0.125 };
/** A steady player: one of the best two, and one in twenty is any swap. */
export const steady: Person = { pool: 2, slip: 0.05 };

function choose(game: Game, person: Person, rng: () => number): [number, number] | null {
  if (rng() < person.slip) {
    const all = allMoves(game.cells);
    return all.length ? all[Math.floor(rng() * all.length)] : null;
  }
  return bestMove(game, person.pool === 1 ? undefined : rng, person.pool);
}

/** One run of a level by a person with a personality seed. */
export function playPerson(run: Run, person: Person, seed: number) {
  const rng = makeRng(seed * 7919 + 13);
  let game = createGame(run);
  while (!game.over) {
    const pick = choose(game, person, rng);
    if (!pick) break;
    const next = move(game, pick[0], pick[1]);
    if (!next) break;
    game = next;
  }
  return game;
}

/** How often `person` clears a level over `count` personality seeds, and the median number of moves of the wins. */
export function rateOf(run: Run, person: Person, count: number) {
  let wins = 0;
  const lengths: number[] = [];
  for (let seed = 1; seed <= count; seed++) {
    const game = playPerson(run, person, seed);
    if (game.won) { wins++; lengths.push(game.moves.length); }
  }
  lengths.sort((a, b) => a - b);
  return { rate: wins / count, median: lengths[Math.floor(lengths.length / 2)] ?? 0 };
}
