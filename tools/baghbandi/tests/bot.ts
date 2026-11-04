// Headless players for the tests: a casual person, a sharp one, and a solver that proves a lesson is a forced win.
import { makeRng, pick } from "../../../shared/game-core";
import { begin, botMove, humanSide, isBotTurn, legalMoves, play, threatened, winStars, BOT_LEVELS, TIGER, type Game, type Mode, type Side, type Start } from "../lib/game";

/** Someone who mostly knows the rules: `skill` of the time takes a jump as the tiger, or keeps goats safe. Seeded. */
export function person(game: Game, rng: () => number, skill: number) {
  const list = legalMoves(game);
  if (game.turn === TIGER) {
    const takes = list.flatMap((move, index) => move.over >= 0 ? [index] : []);
    return takes.length && rng() < skill ? takes[pick(rng, takes.length)] : pick(rng, list.length);
  }
  const safe = list.flatMap((move, index) => { const goats = game.goats.slice(); goats[move.from]--; goats[move.to] = 1; return threatened(goats, game.tigers).length ? [] : [index]; });
  return safe.length && rng() < skill ? safe[pick(rng, safe.length)] : pick(rng, list.length);
}
/** A sharp player: the top bot's own judgement on your side. */
export const sharp = (game: Game) => botMove({ ...game, level: BOT_LEVELS.length });
export const casual = (game: Game, rng: () => number) => person(game, rng, 0.9);
export const weak = (game: Game, rng: () => number) => person(game, rng, 0.6);

/** How often `player` wins a start (stars > 0), over `seeds` fresh seeds. */
export function winRate(mode: Mode, start: Start, player: (game: Game, rng: () => number) => number, seeds = 60) {
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const rng = makeRng(seed * 31 + 7);
    let game = begin(seed, mode, start);
    while (!game.over) game = play(game, isBotTurn(game) ? botMove(game) : player(game, rng))!;
    if (winStars(game) > 0) wins++;
  }
  return wins / seeds;
}

const key = (g: Game, own: number) => `${g.goats.join(",")}|${g.tigers.join(",")}|${g.turn}|${g.taken}|${g.moves.length}|${own}`;
/** True when `me` wins within `own` more of their own moves whatever the other side plays. */
export function forced(game: Game, me: Side, own: number, memo = new Map<string, boolean>()): boolean {
  if (game.over) return game.winner === me;
  const k = key(game, own), hit = memo.get(k);
  if (hit !== undefined) return hit;
  const list = legalMoves(game);
  const result = game.turn === me
    ? own > 0 && list.some((_, index) => forced(play(game, index)!, me, own - 1, memo))
    : list.every((_, index) => forced(play(game, index)!, me, own, memo));
  memo.set(k, result);
  return result;
}
/** The fewest own moves that force a win from a start (0 when none within `max`). */
export function shortestWin(mode: 1 | 2, start: Start, max = 4) {
  const game = begin(1, mode, start), me = humanSide(mode)!;
  for (let own = 1; own <= max; own++) if (forced(game, me, own)) return own;
  return 0;
}
