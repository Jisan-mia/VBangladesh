// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls).
import type { LevelStars } from "../../../shared/game-core";
import type { Hand } from "./game";
import { LEVEL_COUNT } from "./levels";

/** The boards your own play has opened (a friend's far-ahead board never opens the ones between). */
export const OPEN_KEY = "ektukhani-carrom-open";
/** সহজ, মাঝারি or ওস্তাদ. */
export const HAND_KEY = "ektukhani-carrom-hand";
/** The two old toggles the difficulty replaced: নিশানা রেখা ("0" = off) and বড় স্ট্রাইকার ("1" = on). */
export const OLD_ASSIST_KEY = "ektukhani-carrom-assist";
export const OLD_BIG_KEY = "ektukhani-carrom-big";
/** Before boards, this phone kept one best score from random boards. */
export const OLD_BEST_KEY = "ektukhani-best-carrom";

/**
 * Your own open boards. Saved: read it. Not saved yet (an older version of the game): migrate once from the stars, counting
 * only the unbroken run of cleared boards from 1, so a friend's board 10 cleared out of order doesn't open 2–9.
 */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = raw === null ? NaN : Number(raw);
  if (Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return { open: saved, migrated: false };
  let run = 0;
  while (run < LEVEL_COUNT && (stars[run + 1] ?? 0) > 0) run++;
  return { open: Math.min(LEVEL_COUNT, run + 1), migrated: true };
}

/** Clearing the frontier board opens the next one; clearing any other board (an earlier one, a friend's) opens nothing. */
export const openAfter = (open: number, level: number) => level === open && open < LEVEL_COUNT ? open + 1 : open;

/** You may play a board you opened yourself, or the one a friend's link brought you to this visit. */
export const playable = (level: number, open: number, visit: number) => level >= 1 && level <= LEVEL_COUNT && (level <= open || level === visit);

/** Where a returning player starts: the furthest open board that still lacks three stars. */
export function recommended(stars: LevelStars, open: number) {
  for (let level = open; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return open;
}

/** The difficulty, migrated once from the two old toggles: বড় স্ট্রাইকার on → সহজ, নিশানা রেখা off → ওস্তাদ, else মাঝারি. */
export function readHand(raw: string | null, assist: string | null, big: string | null): { hand: Hand; migrated: boolean } {
  if (raw === "e" || raw === "n" || raw === "h") return { hand: raw, migrated: false };
  return { hand: big === "1" ? "e" : assist === "0" ? "h" : "n", migrated: true };
}

/** The old phone-wide best (random boards) becomes board 1's stars, once: 1 point for one star, 4 for two, 6 for three. */
export function migrateBest(saved: LevelStars, raw: string | null) {
  if (raw === null || Object.keys(saved).length) return 0;
  const best = Number(raw);
  if (!Number.isInteger(best) || best < 1) return 0;
  return best >= 6 ? 3 : best >= 4 ? 2 : 1;
}
