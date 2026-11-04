// Headless players for the tests: people of different skill who see what the screen shows (the warning, the flower counts),
// a perfect solver for small cloths, and win rates over many seeds.
import { makeRng, pick } from "../../../shared/game-core";
import { begin, botMove, closes, gifts, isBotTurn, isSafe, leastGift, openGaps, play, totalPoints, worth, type Game, type Setup } from "../lib/quilt";

export type Person = (game: Game, rng: () => number) => number;

/**
 * A person with three habits: `take` a box they can close, `heed` the red warning when a safe stitch exists, and pick the
 * stitch the warning says gives away least once there is no safe stitch (`least`). Otherwise they tap anywhere.
 */
export const person = (take: number, heed: number, least: number): Person => (game, rng) => {
  const free = openGaps(game.drawn);
  const takes = free.filter(edge => closes(game.geo, game.drawn, edge));
  if (takes.length && rng() < take) return takes[pick(rng, takes.length)];
  const safe = free.filter(edge => isSafe(game.geo, game.drawn, edge) && !closes(game.geo, game.drawn, edge));
  if (safe.length && rng() < heed) return safe[pick(rng, safe.length)];
  if (!safe.length && rng() < least) {
    const all = gifts(game), low = leastGift(all), best = free.filter(edge => all[edge] === low);
    return best[pick(rng, best.length)];
  }
  return free[pick(rng, free.length)];
};

/** First time on the cloth: takes a box three times in four, heeds the warning four times in five, and at the end heeds the
 * second tap (a stitch that gives away more than it must) half the time. */
export const beginner = person(0.75, 0.8, 0.5);
/** Knows the rules and reads the warning; at the end gives the smallest chain most of the time. */
export const casual = person(0.9, 0.95, 0.6);
/** Never misses a box or a warning, always gives the smallest chain; doesn't know the double-deal. */
export const careful = person(1, 1, 1);

/** A strong player: the old কঠিন bot's play (smallest chain, the double-deal), from player 0's seat. */
export const sharp: Person = game => {
  const mirror = { ...game, setup: { ...game.setup, bot: { kind: "legacy" as const, level: 2 as const } }, turn: 1 as const };
  return botMove(mirror);
};

export function playOut(seed: number, setup: Setup, who: Person, rngSeed = seed * 31 + 7) {
  const rng = makeRng(rngSeed);
  let game = begin(seed, setup);
  for (let guard = 0; !game.over && guard < 400; guard++) {
    const edge = isBotTurn(game) ? botMove(game) : who(game, rng);
    game = play(game, edge)!;
  }
  return game;
}

/** How often this person beats the setup's bot, over `count` seeds. */
export function winRate(setup: Setup, who: Person, count: number, from = 1) {
  let wins = 0;
  for (let n = 0; n < count; n++) {
    const game = playOut(from + n * 7919, setup, who);
    if (game.score[0] > game.score[1]) wins++;
  }
  return wins / count;
}

/** Perfect play: the best (mover's flowers − the other side's) still to come from this position. */
export function solve(game: Game) {
  const memo = new Map<string, number>(), g = game.geo, drawn = game.drawn.slice();
  const value = (): number => {
    const key = drawn.map(done => done ? 1 : 0).join("");
    const known = memo.get(key);
    if (known !== undefined) return known;
    let best = -Infinity;
    for (let edge = 0; edge < g.edges; edge++) {
      if (drawn[edge]) continue;
      let gain = 0;
      for (let k = 0; k < 2; k++) {
        const box = g.edgeBox[2 * edge + k];
        if (box < 0) continue;
        let count = 0;
        for (let s = 0; s < 4; s++) if (drawn[g.boxEdge[4 * box + s]]) count++;
        if (count === 3) gain += worth(game.setup, box);
      }
      drawn[edge] = true;
      const next = gain ? gain + value() : -value();
      drawn[edge] = false;
      if (next > best) best = next;
    }
    const result = best === -Infinity ? 0 : best;
    memo.set(key, result);
    return result;
  };
  return value();
}

/** The flowers player 0 can be sure of from here against any reply (it is player 0's turn). */
export function guaranteed(game: Game) {
  const left = totalPoints(game.setup) - game.score[0] - game.score[1];
  const net = solve(game) * (game.turn === 0 ? 1 : -1);
  return game.score[0] + (left + net) / 2;
}
