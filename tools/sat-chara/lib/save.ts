// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls).
import { readLevels, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT } from "./levels";
import { OLD_COUNT } from "./old-levels";

/** Stars per level (the key every game uses; before the rewrite it held 30 old levels). */
export const STARS_KEY = "ektukhani-levels-sat-chara";
/** Set once the old 30-level stars have moved to the new 15. */
export const MIGRATED_KEY = "ektukhani-sat-chara-v2";
/** The levels your own play has opened (a friend's far-ahead level never opens the ones between). */
export const OPEN_KEY = "ektukhani-sat-chara-open";
/** সহজ, মাঝারি or ওস্তাদ. */
export const HAND_KEY = "ektukhani-sat-chara-hand";

export type Hand = "e" | "n" | "h";
export const HANDS: readonly Hand[] = ["e", "n", "h"];
export const isHand = (value: unknown): value is Hand => value === "e" || value === "n" || value === "h";
export const HAND_NAME: Record<Hand, string> = { e: "সহজ", n: "মাঝারি", h: "ওস্তাদ" };
export const HAND_LINE: Record<Hand, string> = {
  e: "পুরো পথ দেখায়, বল কোথায় লাগবে তাও।",
  n: "পথের প্রথম অর্ধেক দেখায়।",
  h: "শুধু শুরুর কয়েকটা ফোঁটা।",
};

/** An old level's new number: old 1–2 → 1, 3–4 → 2, … 29–30 → 15 (the same place, the same order). */
export const newLevelOf = (old: number) => Math.min(LEVEL_COUNT, Math.max(1, Math.ceil(old / 2)));

/**
 * The stars, migrated once. Not migrated yet: read the raw value as old levels 1–30, move each to its new number, best
 * stars kept. Already migrated: read it as it is.
 */
export function migrateStars(raw: string | null, migrated: boolean): { stars: LevelStars; changed: boolean } {
  if (migrated) return { stars: readLevels(raw, LEVEL_COUNT), changed: false };
  const old = readLevels(raw, OLD_COUNT), stars: LevelStars = {};
  for (const [key, earned] of Object.entries(old)) {
    const level = newLevelOf(Number(key));
    stars[level] = Math.max(stars[level] ?? 0, earned);
  }
  return { stars, changed: true };
}

/**
 * Your own open levels. Saved: read it. Not saved yet: migrate once from the stars, counting only the unbroken run of
 * cleared levels from 1, so a level cleared out of order (a friend's) doesn't open the ones between.
 */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = raw === null ? NaN : Number(raw);
  if (Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return { open: Math.max(saved, runOpen(stars)), migrated: false };
  return { open: runOpen(stars), migrated: true };
}
function runOpen(stars: LevelStars) {
  let run = 0;
  while (run < LEVEL_COUNT && (stars[run + 1] ?? 0) > 0) run++;
  return Math.min(LEVEL_COUNT, run + 1);
}

/** Clearing the frontier level opens the next one; clearing any other level (an earlier one, a friend's) opens nothing. */
export const openAfter = (open: number, level: number) => level === open && open < LEVEL_COUNT ? open + 1 : open;

/** You may play a level you opened yourself, or the one a friend's link brought you to this visit. */
export const playable = (level: number, open: number, visit: number) => level >= 1 && level <= LEVEL_COUNT && (level <= open || level === visit);

/** Where a returning player starts: the furthest open level that still lacks three stars. */
export function recommended(stars: LevelStars, open: number) {
  for (let level = open; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return open;
}

export const readHand = (raw: string | null): Hand => isHand(raw) ? raw : "n";
