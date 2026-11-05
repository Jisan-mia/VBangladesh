// Headless players for the difficulty tests. A bot plays a round the way a child would: it counts fish by tapping each one,
// then answers. `skill` is the chance of the right answer on a try; a wrong try goes to a near neighbour or the other pond.
import { makeRng } from "../../../shared/game-core";
import { levelOf } from "../lib/levels";
import { ITEMS, answer, answerOf, createRound, glows, nextItem, tapFish, type Round } from "../lib/round";

export type Bot = { name: string; skill: (level: number, round: Round) => number };

/** How hard a pond is to see at a glance: a group of 5–6 is harder than 3, two groups add up, a size trick fools a younger eye. */
const hardness = (round: Round) => {
  const item = round.item;
  if (item.kind === "nojor") return item.parts.length > 1 ? 0.14 : item.n >= 5 ? 0.1 : 0.03;
  if (item.kind === "beshi") return item.bigFewer ? 0.12 : 0.04;
  if (item.kind === "merge") return 0.1;
  return item.n > 12 ? 0.08 : 0.02;
};

export const toddler: Bot = { name: "toddler", skill: () => 0 };                                           // taps anything
export const careful: Bot = { name: "careful", skill: (_level, round) => 0.97 - hardness(round) };       // a 4–5 year old paying attention
export const sharp: Bot = { name: "sharp", skill: (_level, round) => 0.995 - hardness(round) / 3 };      // a 6 year old

export type Play = { round: Round; taps: number; misses: number; firstTapsToWin: number };

/** Plays a whole round. Returns the final round and how many taps it took. A toddler picks uniformly among the answers on screen. */
export function playRound(level: number, bot: Bot, seed: number): Play {
  const rng = makeRng(seed * 31 + level);
  let round = createRound(level, seed), taps = 0, misses = 0, firstTapsToWin = 0;
  for (let guard = 0; guard < 400; guard++) {
    const item = round.item;
    if (round.stage === "count" && item.kind === "guni") {
      for (let fish = 0; fish < item.n; fish++) { round = tapFish(round, fish)!; taps++; }
    } else if (round.stage === "pick" || round.stage === "koto") {
      const right = answerOf(round);
      const options = item.kind === "beshi" && round.stage === "pick" ? [0, 1] : round.stage === "koto" && item.kind === "beshi" ? item.koto! : (item as { choices: number[] }).choices;
      // The answer glows after two tries, and a child then taps it.
      const pick = glows(round) ? right : rng() < bot.skill(level, round) ? right : options.filter(value => value !== right)[Math.floor(rng() * (options.length - 1))] ?? right;
      const result = answer(round, pick);
      round = result.round; taps++;
      if (result.outcome === "again") misses++;
    } else if (round.stage === "done") {
      if (round.index === 0 && firstTapsToWin === 0) firstTapsToWin = taps;
      const next = nextItem(round);
      if (!next) return { round, taps, misses, firstTapsToWin };
      round = next;
    }
  }
  throw new Error(`level ${level} did not end: ${levelOf(level).title}`);
}

export const ROUND_ITEMS = ITEMS;
