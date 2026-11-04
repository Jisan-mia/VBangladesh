// The game before the rewrite: 15 levels in three places, each a fixed number of casts. Kept only so old challenge links
// (no `v`) still parse by exactly the rules they were made under. Nothing else reads it.
import { FISH } from "./species";

/** [place, casts] for old levels 1..15. */
const OLD: ReadonlyArray<readonly [place: number, casts: number]> = [
  [0, 3], [0, 3], [0, 4], [0, 4], [0, 5],
  [1, 4], [1, 4], [1, 5], [1, 5], [1, 5],
  [2, 4], [2, 5], [2, 5], [2, 5], [2, 6],
];
export const OLD_LEVELS = OLD.length;
export const OLD_MAX_GRAMS = 5000;

/** An old link's numbers, or null if the old game would have refused it. */
export function readOld(level: number, catches: number, big: string, grams: number) {
  if (!Number.isInteger(level) || level < 1 || level > OLD_LEVELS || catches > OLD[level - 1][1]) return null;
  if (!catches) return grams === 0 && big === "" ? { big: -1 } : null;
  const index = Number(big);
  if (big === "" || index >= FISH.length || !FISH[index].places.includes(OLD[level - 1][0])) return null;
  // Plausible weights only: at least the lightest fish each, at most the biggest one's top weight each.
  if (grams < catches * 20 || grams > catches * FISH[index].grams[1]) return null;
  return { big: index };
}
