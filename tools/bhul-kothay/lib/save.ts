// What this phone keeps, as pure string ⇄ value functions (the component does the localStorage calls). The old game's stars
// stay where they were; the new ladder has its own. Your open levels are written once from the old rules, then rise only by
// your own clears. The shared unlockedLevel opens everything below the highest recorded level, which is right for this
// one-time move and wrong after a friend's far-ahead link, so the game keeps its own unlock afterwards.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEGACY_COUNT } from "./legacy";
import { STAGE_COUNT } from "./levels";

export const TOOL = "bhul-kothay";
/** The new ladder's stars live under useLevels(LADDER); the old game's under the old key, never rewritten. */
export const LADDER = `${TOOL}-ladder`;
export const OLD_LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const OPEN_KEY = `ektukhani-unlock-${TOOL}`;
/** Best times: `bhul-kothay-g<level>` for the ladder; old links keep the old `bhul-kothay-l<level>`. */
export const bestSlug = (level: number, legacy: boolean) => `${TOOL}-${legacy ? "l" : "g"}${level}`;

/**
 * The highest level you may pick. The first time, it is the most either rule gives: the new stars by unlockedLevel, and the
 * old 30 levels one for one (both ladders climb the same way), so nobody loses a level they could play.
 */
export function readOpen(raw: string | null, stars: LevelStars, oldRaw: string | null) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= STAGE_COUNT) return { open: saved, migrated: false };
  const old = readLevels(oldRaw, LEGACY_COUNT);
  const fromOld = Object.keys(old).length ? Math.min(STAGE_COUNT, unlockedLevel(old, LEGACY_COUNT)) : 1;
  return { open: Math.max(unlockedLevel(stars, STAGE_COUNT), fromOld), migrated: true };
}

/** After a clear: the next level opens only when this one was already open. A friend's far-ahead level opens nothing. */
export const openAfter = (open: number, cleared: number) => cleared >= 1 && cleared <= open ? Math.min(STAGE_COUNT, Math.max(open, cleared + 1)) : open;

/** The level to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(open: number, stars: LevelStars) {
  for (let level = 1; level <= open; level++) if (!stars[level]) return level;
  for (let level = 1; level <= open; level++) if ((stars[level] ?? 0) < 3) return level;
  return open;
}

/** A level can be played when it is open, or it is the friend's level on this link. */
export const playable = (level: number, open: number, visit: number) => level >= 1 && level <= STAGE_COUNT && (level <= open || level === visit);
