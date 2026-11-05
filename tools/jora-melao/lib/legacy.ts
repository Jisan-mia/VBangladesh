// The game before the rewrite, kept so its links still replay on the exact board they were played on.
// Frozen: the toy order, the shuffle and the old level table are part of every old link (`#s=&t=&g=&l=&f=`, no `v`).
// tests/rewrite.test.ts pins this deal by a hash of many boards. Never edit; new rules live in board.ts and levels.ts.
import { makeRng, pick } from "../../../shared/game-core";

/** The fair-stall toys in their old order: a legacy board's toy index is also its picture id (pictures.ts keeps them first). */
export const OLD_TOYS = ["belun", "ghuri", "latim", "bansi", "ektara", "putul", "tomtom", "jhunjhuni", "charki", "nouka"] as const;
export type OldSize = 8 | 12 | 16 | 20;

/** The 12 old solo levels: the board size of each, and its old par (only the size matters now). */
export const OLD_LEVELS: ReadonlyArray<{ size: OldSize; three: number; two: number }> = [
  { size: 8, three: 7, two: 9 }, { size: 8, three: 6, two: 8 }, { size: 8, three: 6, two: 7 },
  { size: 12, three: 10, two: 13 }, { size: 12, three: 9, two: 12 }, { size: 12, three: 9, two: 11 },
  { size: 16, three: 14, two: 18 }, { size: 16, three: 13, two: 16 }, { size: 16, three: 12, two: 15 },
  { size: 20, three: 18, two: 23 }, { size: 20, three: 17, two: 21 }, { size: 20, three: 16, two: 20 },
];
export const OLD_LEVEL_COUNT = OLD_LEVELS.length;

function shuffle<T>(rng: () => number, items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = pick(rng, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** The old deal: the same seed and size give the same toys in the same places, and the same face-up demo pair. */
export function oldDeal(seed: number, size: OldSize) {
  const rng = makeRng(seed);
  const toys = shuffle(rng, OLD_TOYS.map((_, index) => index)).slice(0, size / 2);
  const board = shuffle(rng, toys.flatMap(toy => [toy, toy]));
  const shown = toys[pick(rng, toys.length)];
  const first = board.indexOf(shown);
  return { board, demo: [first, board.indexOf(shown, first + 1)] };
}

/** The old stars from moves on an old level. */
export function oldStars(level: number, moves: number) {
  const row = OLD_LEVELS[level - 1];
  if (!row) return 0;
  return moves <= row.three ? 3 : moves <= row.two ? 2 : 1;
}

/**
 * The old one-time move, kept as it was: this phone's best on ৩×৪ and ৪×৪ (fewest moves) became stars on old levels 4 and 7.
 * Returns the old level store to write, or null when there's nothing to move. save.ts runs it before reading the old stars.
 */
export function migrateOldBests(levelsRaw: string | null, best12: string | null, best16: string | null) {
  if (levelsRaw !== null) return null;
  const stars: Record<number, number> = {};
  for (const [raw, size] of [[best12, 12], [best16, 16]] as const) {
    const moves = Number(raw);
    if (raw === null || !Number.isInteger(moves) || moves < size / 2) continue;
    const level = OLD_LEVELS.findIndex(entry => entry.size === size) + 1;
    stars[level] = oldStars(level, moves);
  }
  return Object.keys(stars).length ? JSON.stringify(stars) : null;
}
