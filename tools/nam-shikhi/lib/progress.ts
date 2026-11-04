// Saved progress: stars per level id in ektukhani-levels-nam-shikhi (useLevels), moved once from the six old per-pack keys,
// the world last played, and which level to suggest. Every level is open: a child never meets a lock.
import { readLevels, recordLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, OLD_LEVELS, newLevelFor, worldLevels } from "./levels";
import { PACKS, type PackId } from "./packs";

export const TOOL = "nam-shikhi";
export const STARS_KEY = `ektukhani-levels-${TOOL}`;
/** Set once the old per-pack stars have moved, so the move runs once. */
export const MOVED_KEY = `ektukhani-moved-${TOOL}`;
export const WORLD_KEY = `ektukhani-world-${TOOL}`;
export const oldKey = (pack: PackId) => `ektukhani-levels-${TOOL}-${pack}`;

/**
 * The one-time move: every old (pack, level) with stars lands on its new level, keeping the higher count. Returns the stars to
 * write, or null when there is nothing to do (already moved). `read` returns the raw stored value for a key.
 */
export function moveOldStars(read: (key: string) => string | null): LevelStars | null {
  if (read(MOVED_KEY) === "1") return null;
  let stars = readLevels(read(STARS_KEY), LEVEL_COUNT);
  for (const pack of PACKS) {
    const modes = OLD_LEVELS[pack.id], old = readLevels(read(oldKey(pack.id)), modes.length);
    for (const [index, earned] of Object.entries(old)) {
      const level = newLevelFor(pack.id, modes[Number(index) - 1]);
      if (level) stars = recordLevel(stars, level, earned);
    }
  }
  return stars;
}

/** The level to suggest in a world: the first without stars, else the first with fewer than 3, else its finale. */
export function recommended(world: PackId, stars: LevelStars) {
  const levels = worldLevels(world);
  return (levels.find(level => !stars[level.id]) ?? levels.find(level => (stars[level.id] ?? 0) < 3) ?? levels[levels.length - 1]).id;
}

/** After a round, শেষ leaves the next level of the same world ready (the finale stays on the finale). */
export function nextUp(level: number, world: PackId) {
  const levels = worldLevels(world), at = levels.findIndex(item => item.id === level);
  return levels[Math.min(levels.length - 1, at + 1)]?.id ?? level;
}

export const readWorld = (raw: string | null): PackId => PACKS.some(pack => pack.id === raw) ? raw as PackId : "pashu";
