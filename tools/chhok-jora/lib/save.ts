// What this phone keeps, as pure functions over raw localStorage strings (the component reads and writes them).
// - The ladder's stars: `ektukhani-levels-chhok-jora` (12 levels, through useLevels).
// - Your own open level: `ektukhani-chhok-jora-open`. A friend's far-ahead level records its stars but never opens the levels
//   in between, so the open level is kept apart from the stars (unlockedLevel itself stays as it is).
// - The mode you played last (`ektukhani-chhok-jora-mode`) and the two-people cloth (`ektukhani-chhok-jora-size`).
// Before the ladder there were only two bests, `ektukhani-best-chhok-jora-sohoj` and `-kothin` (boxes out of 16): they move
// once into stars on levels 5 and 8, which are the very same two bots.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEGACY_LEVELS, LEVEL_COUNT, PAIR_SIZES, starsFor, type PairSize } from "./levels";

export const LADDER_SLUG = "chhok-jora";
export const LEVELS_KEY = `ektukhani-levels-${LADDER_SLUG}`;
export const OPEN_KEY = "ektukhani-chhok-jora-open";
export const MODE_KEY = "ektukhani-chhok-jora-mode";
export const SIZE_KEY = "ektukhani-chhok-jora-size";
export const OLD_BEST_KEYS: Record<1 | 2, string> = { 1: "ektukhani-best-chhok-jora-sohoj", 2: "ektukhani-best-chhok-jora-kothin" };

/** একা (the ladder), দুজনে, কাটাকুটি. */
export type Mode = "solo" | "pair" | "kata";

/**
 * Once: an old best that beat the bot becomes that level's stars by its own rule (9 of 16 is one star, 10 two, 12 three).
 * Returns the JSON to save, or null when the ladder already exists. Writes "{}" when there is nothing to move, so it never runs again.
 */
export function migrateLadder(current: string | null, sohoj: string | null, kothin: string | null) {
  if (current !== null) return null;
  const moved: LevelStars = {};
  for (const [bot, raw] of [[1, sohoj], [2, kothin]] as const) {
    const best = Number(raw);
    if (raw === null || !Number.isInteger(best) || best < 0 || best > 16) continue;
    const level = LEGACY_LEVELS[bot], stars = starsFor(level, [best, 16 - best]);
    if (stars) moved[level] = stars;
  }
  return JSON.stringify(moved);
}

/** Your open level: the one saved, or (once, on first read) one past your highest star, as unlockedLevel always gave. */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  return unlockedLevel(stars, LEVEL_COUNT);
}

/** Clearing your open level opens the next one; clearing an older one, or a friend's far-ahead one, opens nothing. */
export const openAfter = (open: number, cleared: number) => cleared === open && open < LEVEL_COUNT ? open + 1 : open;

export const readMode = (raw: string | null): Mode => raw === "pair" ? "pair" : raw === "kata" ? "kata" : "solo";
export const readSize = (raw: string | null): PairSize => PAIR_SIZES.find(size => String(size) === raw) ?? 4;
