// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls):
// the levels your own play has opened (with the old 24-level ladder migrated once), and free play's last pick.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { PACKS, packById, type PackId } from "./packs";
import { STAGE_COUNT, worldStart } from "./levels";
import { type Level } from "./grid";

/** The new ladder's stars live under useLevels(LEVELS_SLUG); the old ladder's under the old key, never rewritten. */
export const LEVELS_SLUG = "shobdo-khoja-boi";
export const OLD_LEVELS_KEY = "ektukhani-levels-shobdo-khoja";
export const OLD_COUNT = 24;
export const OPEN_KEY = "ektukhani-shobdo-khoja-open";
export const FREE_KEY = "ektukhani-shobdo-khoja-free";

/**
 * The old ladder was the eight packs three times over (সহজ, কঠিন, quicker কঠিন), in the same pack order as the new
 * worlds. Reaching old level r (the old rule: one past the highest with stars) opens the start of world r; reaching the
 * কঠিন round opens up to the last world's start; reaching the third round opens everything.
 */
export function migrateOld(old: LevelStars) {
  if (!Object.keys(old).length) return 1;
  const reached = unlockedLevel(old, OLD_COUNT), packs = PACKS.length;
  if (reached <= packs) return worldStart(reached - 1);
  return reached <= packs * 2 ? worldStart(packs - 1) : STAGE_COUNT;
}

/**
 * The highest level you may pick. The first time, it's the most the old rules gave (the new stars by unlockedLevel,
 * and the old ladder migrated), so nobody loses an open level. After that only your own play opens levels: clearing
 * level L opens L + 1 when L was already open, and a friend's far-ahead level records its stars but opens nothing between.
 */
export function readOpen(raw: string | null, stars: LevelStars, oldRaw: string | null) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= STAGE_COUNT) return saved;
  return Math.max(unlockedLevel(stars, STAGE_COUNT), migrateOld(readLevels(oldRaw, OLD_COUNT)));
}
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(STAGE_COUNT, Math.max(open, cleared + 1)) : open;

/** Where a visit starts, and the level the sheet recommends: the furthest one open, as the old game did. */
export const startLevel = (open: number) => open;

/** Free play's last pick: "<pack>.<0|1>", else ফুল সহজ. */
export function readFree(raw: string | null): { pack: PackId; level: Level } {
  const [id, level] = (raw ?? "").split(".");
  const pack = packById(id ?? "");
  return { pack: pack ? pack.id : "phul", level: level === "1" ? 1 : 0 };
}
export const writeFree = (pack: PackId, level: Level) => `${pack}.${level}`;

