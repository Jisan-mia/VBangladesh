// What this phone keeps, as pure functions over raw localStorage strings (the component reads and writes them).
// - The stars of each ladder: `ektukhani-levels-baghbandi-bagh-v2` / `-chhagol-v2` (12 levels each, through useLevels).
// - Your own open level per ladder: `ektukhani-baghbandi-bagh-open` / `-chhagol-open`. A friend's far-ahead level records its
//   stars but never opens the levels in between, so the open level is kept apart from the stars (unlockedLevel stays as it is).
// - The side you played last: `ektukhani-baghbandi-side`.
// Before this ladder, `ektukhani-levels-baghbandi-bagh` / `-chhagol` held the bot's 8 levels, and before that only a best score.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { migrateBest, GOAT, TIGER, type Mode, type Side } from "./game";
import { BOT_OFFSET, LEVEL_COUNT } from "./levels";

const BOT_LEVEL_COUNT = LEVEL_COUNT - BOT_OFFSET;
const side = (s: Side) => s === TIGER ? "bagh" : "chhagol";
/** The useLevels slug of a ladder. */
export const ladderKey = (s: Side) => `baghbandi-${side(s)}-v2`;
export const levelsKey = (s: Side) => `ektukhani-levels-${ladderKey(s)}`;
export const openKey = (s: Side) => `ektukhani-baghbandi-${side(s)}-open`;
/** The keys of the ladder before this one, and of the best score before levels. */
export const oldLevelsKey = (s: Side) => `ektukhani-levels-baghbandi-${side(s)}`;
export const oldBestKey = (s: Side) => `ektukhani-best-baghbandi-${side(s)}`;
export const SIDE_KEY = "ektukhani-baghbandi-side";

/**
 * Once per ladder: the old bot levels 1–8 become levels 5–12 (the same bot, the same stars), or an old best that proves a win
 * becomes one star on level 11 (the bot from before levels). Returns the JSON to save, or null when the new ladder already exists.
 * Writes "{}" when there is nothing to move, so it never runs again.
 */
export function migrateLadder(s: Side, current: string | null, oldLevels: string | null, oldBest: string | null) {
  if (current !== null) return null;
  const moved: LevelStars = {};
  if (oldLevels !== null) {
    for (const [level, stars] of Object.entries(readLevels(oldLevels, BOT_LEVEL_COUNT))) moved[Number(level) + BOT_OFFSET] = stars;
  } else {
    const best = migrateBest(s, oldBest, null);
    if (best) for (const [level, stars] of Object.entries(JSON.parse(best) as LevelStars)) moved[Number(level) + BOT_OFFSET] = stars;
  }
  return JSON.stringify(moved);
}

/** Your open level: the one saved, or (once, on first read) one past your highest star, as before. */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return Math.max(saved, 1);
  return unlockedLevel(stars, LEVEL_COUNT);
}

/** Clearing your open level opens the next one; clearing an older one, or a friend's far-ahead one, opens nothing. */
export const openAfter = (open: number, cleared: number) => cleared === open && open < LEVEL_COUNT ? open + 1 : open;

/** The side you played last ("1" বাঘ, "2" ছাগল, "0" দুজনে); a newcomer starts as the tiger, the quickest first win. */
export function readSide(raw: string | null): Mode {
  return raw === "0" ? 0 : raw === "2" ? 2 : 1;
}
export const sideOfMode = (mode: Mode): Side | null => mode === 1 ? TIGER : mode === 2 ? GOAT : null;
