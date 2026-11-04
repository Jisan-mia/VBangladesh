// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls).
// The stars stay where they always were (useLevels("atir-aam"), same level numbers); your own open level gets its own key.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT } from "./levels";

export const OPEN_KEY = "ektukhani-atir-aam-open";

/**
 * Your own open level. The first time it's what the old rule gave (one past the highest level with stars), so nobody
 * loses a level. After that, clearing level L opens L + 1 only when L was open; a friend's far level opens nothing.
 */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && raw.trim() !== "" && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  return unlockedLevel(stars, LEVEL_COUNT);
}
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;
/** Where to open, and the level the list recommends: the furthest open level not three-starred, else the first that isn't. */
export function startLevel(stars: LevelStars, open: number) {
  if ((stars[open] ?? 0) < 3) return open;
  for (let level = 1; level <= open; level++) if ((stars[level] ?? 0) < 3) return level;
  return open;
}
