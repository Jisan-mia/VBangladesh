// Saved progress: practice stars per level in ektukhani-levels-moner-rong. The first version stored six sets under the same key;
// they move once to the new level ids (guarded by a flag), keeping the same counts. Every level is open: a child never meets a lock.
import { readLevels, recordLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, OLD_SET_TO_LEVEL, worldOf, type WorldId } from "./levels";

export const TOOL = "moner-rong";
export const STARS_KEY = `ektukhani-levels-${TOOL}`;
export const MOVED_KEY = `ektukhani-moved-${TOOL}`;
export const WORLD_KEY = `ektukhani-world-${TOOL}`;

/**
 * The one-time move. Returns the stars to write (old set n lands on its new level, keeping the higher count), or null when the
 * move already ran. `read` returns the raw stored value for a key.
 */
export function moveOldStars(read: (key: string) => string | null): LevelStars | null {
  if (read(MOVED_KEY) === "1") return null;
  const old = readLevels(read(STARS_KEY), 6);
  let stars: LevelStars = {};
  for (const [set, earned] of Object.entries(old)) {
    const level = OLD_SET_TO_LEVEL[Number(set)];
    if (level) stars = recordLevel(stars, level, earned);
  }
  return stars;
}

/** Stars are practice: one more each time a level is played through, up to three. Never how many fitted. */
export const practised = (before: number) => Math.min(3, Math.max(0, Math.round(before) || 0) + 1);

export const readStars = (raw: string | null): LevelStars => readLevels(raw, LEVEL_COUNT);
export const readWorld = (raw: string | null): WorldId => (["rod", "jhor", "mela"] as const).find(id => id === raw) ?? worldOf("rod").id;
