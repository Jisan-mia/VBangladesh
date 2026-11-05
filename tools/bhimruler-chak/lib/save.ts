// What this phone keeps, as pure functions over raw localStorage strings (the component reads and writes them).
// - Stars per level stay in `ektukhani-levels-bhimruler-chak` (through useLevels): the 30 level numbers are the same, and
//   stars only go up, so nothing earned before the rewrite is lost.
// - Your own open level: `ektukhani-bhimruler-chak-open`. Set once from those stars (unlockedLevel, which opens everything
//   below your highest star, exactly as the old game did). After that only your own play opens levels: a friend's far-ahead
//   orchard records its stars but never opens the ones in between. unlockedLevel itself is never changed.
// - Best times: `ektukhani-best-bhimruler-chak-v2-l<N>` for the new orchards, the old `bhimruler-chak-l<N>` for an old link.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT } from "./levels";

export const TOOL = "bhimruler-chak";
export const OPEN_KEY = `ektukhani-${TOOL}-open`;
export const bestSlug = (level: number, legacy: boolean) => legacy ? `${TOOL}-l${level}` : `${TOOL}-v2-l${level}`;

/** Your open level: the one saved, else (once) what the saved stars opened before the rewrite. */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && raw !== "" && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  return unlockedLevel(stars, LEVEL_COUNT);
}

/** Clearing your open level (or any below it) opens the next one; a friend's far-ahead level opens nothing. */
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;

/** Where a visit starts: the furthest open level you haven't three-starred, so nobody replays what they've mastered. */
export function startLevel(stars: LevelStars, open: number) {
  for (let level = open; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return open;
}
