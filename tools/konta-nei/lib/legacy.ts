// The level table and shelf generator from before the rewrite, kept byte for byte so a link without `v` (every link
// shared before the rewrite) replays exactly the same three shelves. Never change this file.
import { makeRng, pick } from "../../../shared/game-core";
import { ITEM_IDS, type ItemId } from "./items";

/** gap: the item's place stays empty · move: the shelf closes up and two items change places · swap: a new item takes its place */
export type Twist = "gap" | "move" | "swap";
/** items on the shelf, seconds to look, answer choices, how many choices were never on the shelf */
export type Level = { count: number; view: number; choices: number; unseen: number; twist: Twist };

const row = (twist: Twist) => ([count, view, choices, unseen]: number[]): Level => ({ count, view, choices, unseen, twist });

export const LEVELS: readonly Level[] = [
  ...[[4, 5, 3, 0], [4, 4, 3, 1], [5, 5, 3, 1], [5, 4, 4, 1], [6, 5, 4, 2], [6, 4, 4, 2], [7, 5, 4, 2], [7, 4, 4, 3], [8, 6, 4, 3], [8, 5, 4, 3]].map(row("gap")),
  ...[[5, 5, 4, 1], [6, 5, 4, 2], [6, 4, 4, 2], [7, 5, 4, 2], [7, 4, 6, 3], [8, 6, 6, 3], [8, 5, 6, 3], [9, 6, 6, 3], [10, 7, 6, 4], [10, 6, 6, 4]].map(row("move")),
  ...[[6, 5, 4, 1], [7, 5, 4, 2], [8, 6, 6, 2], [8, 5, 6, 3], [9, 6, 6, 3], [10, 7, 6, 3], [10, 6, 6, 4], [11, 7, 6, 4], [12, 8, 6, 4], [12, 7, 6, 4]].map(row("swap")),
];

export const LEVEL_COUNT = LEVELS.length;
/** The three shops, ten levels each. */
export const WORLDS = ["পাড়ার দোকান", "বাজারের দোকান", "হাটের দোকান"] as const;
export const worldOf = (level: number) => Math.floor((level - 1) / 10);
export const levelOf = (level: number): Level => LEVELS[level - 1];

export type LegacyRound = { shelf: ItemId[]; missing: ItemId; slot: number; after: (ItemId | null)[]; newcomer: ItemId | null; choices: ItemId[] };

function shuffle<T>(rng: () => number, list: readonly T[]) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

function makeRound(level: number, rng: () => number, avoid: readonly ItemId[] = []): LegacyRound {
  const { count, choices, unseen, twist } = levelOf(level);
  const pool = shuffle(rng, ITEM_IDS);
  const shelf = pool.slice(0, count), never = pool.slice(count);
  const open = shelf.map((_, index) => index).filter(index => !avoid.includes(shelf[index]));
  const slot = open[pick(rng, open.length)], missing = shelf[slot];
  let after: (ItemId | null)[], newcomer: ItemId | null = null;
  if (twist === "gap") after = shelf.map((id, index) => index === slot ? null : id);
  else if (twist === "move") {
    after = shelf.filter((_, index) => index !== slot);
    const a = pick(rng, after.length);
    let b = pick(rng, after.length - 1);
    if (b >= a) b++;
    [after[a], after[b]] = [after[b], after[a]];
  } else {
    newcomer = never.shift()!;
    after = shelf.map((id, index) => index === slot ? newcomer : id);
  }
  const still = shuffle(rng, shelf.filter(id => id !== missing));
  const onShelf = (newcomer ? [newcomer, ...still] : still).slice(0, choices - 1 - unseen);
  return { shelf, missing, slot, after, newcomer, choices: shuffle(rng, [missing, ...onShelf, ...never.slice(0, unseen)]) };
}

/** A pre-rewrite level's three shelves, exactly as the old game made them for this level and seed. */
export function legacyLevel(level: number, seed: number): LegacyRound[] {
  const rng = makeRng((Math.imul(seed, 31) + level) >>> 0), rounds: LegacyRound[] = [];
  for (let index = 0; index < 3; index++) rounds.push(makeRound(level, rng, rounds.map(round => round.missing)));
  return rounds;
}
