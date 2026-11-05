// The ladder from before the rewrite (two worlds of nine, a mango beside each digit, four different digits), kept only so a
// level link made then (`l` without `v`) opens the same code with the same pad and tries. Its stars aren't recorded: the
// level numbers now mean the new ladder's codes. Never change these numbers.
import type { Rules } from './rules';

const OLD: ReadonlyArray<{ digits: number; tries: number }> = [
  { digits: 5, tries: 7 }, { digits: 5, tries: 6 }, { digits: 5, tries: 5 },
  { digits: 6, tries: 7 }, { digits: 6, tries: 6 }, { digits: 6, tries: 5 },
  { digits: 7, tries: 7 }, { digits: 7, tries: 6 }, { digits: 7, tries: 5 },
  { digits: 8, tries: 7 }, { digits: 8, tries: 6 }, { digits: 8, tries: 5 },
  { digits: 9, tries: 7 }, { digits: 9, tries: 6 }, { digits: 9, tries: 6 },
  { digits: 10, tries: 7 }, { digits: 10, tries: 7 }, { digits: 10, tries: 7 },
];
export const OLD_LEVEL_COUNT = OLD.length;
/** The old world size: a phone with an old best (and no levels yet) got levels 1–9 with one star each, once. */
export const OLD_WORLD_SIZE = 9;
export const isOldLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= OLD_LEVEL_COUNT;
export const oldRules = (level: number): Rules => ({ ...OLD[Math.min(OLD_LEVEL_COUNT, Math.max(1, level)) - 1], repeat: false, feedback: 'digit' });

/**
 * Once, before levels existed on this phone: someone who already solved a full code (an old best) doesn't redo the first
 * world. Returns the new level store (levels 1–9 with one star each), or null when there's nothing to move. Unchanged.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isInteger(best) || best < 1 || best > 7) return null;
  return JSON.stringify(Object.fromEntries(Array.from({ length: OLD_WORLD_SIZE }, (_, index) => [index + 1, 1])));
}
