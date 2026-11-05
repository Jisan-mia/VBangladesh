// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls):
// the levels your own play opened, and the last setup you chose. Stars live in useLevels ("ektukhani-levels-sap-ludu").
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, WORLDS } from "./levels";

export const OPEN_KEY = "ektukhani-sap-ludu-open";
export const SETUP_KEY = "ektukhani-sap-ludu-setup";
/** The old game's only save: the best solo race on the big board (fewer rolls is better). */
export const OLD_BEST_KEY = "ektukhani-best-sap-ludu";

/**
 * The highest level you may pick. The first time (no OPEN_KEY yet) it is what the stars give (unlockedLevel), and a phone
 * that already raced the big board in the old game (it has a best) opens the big-board world: that migration runs once,
 * because the caller writes OPEN_KEY right after. After that only your own play opens levels.
 */
export function readOpen(raw: string | null, stars: LevelStars, oldBest: string | null) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  const fromStars = unlockedLevel(stars, LEVEL_COUNT);
  const raced = oldBest !== null && Number.isFinite(Number(oldBest)) && Number(oldBest) > 0;
  return raced ? Math.max(fromStars, WORLDS[WORLDS.length - 1].from) : fromStars;
}

/** Clearing level `cleared` opens the next one only if `cleared` was already open: a friend's far-ahead level opens nothing in between. */
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;

/** The setup chips: একা or সবাই মিলে, the level, how many seats, which are the computer, and two pieces. */
export type Prefs = { mode: "solo" | "group"; level: number; seats: 2 | 3 | 4; bots: number; two: boolean };
export const DEFAULT_PREFS: Prefs = { mode: "solo", level: 1, seats: 2, bots: 0, two: false };

export function readPrefs(raw: string | null): Prefs {
  try {
    const value = JSON.parse(raw ?? "null") as Partial<Record<string, unknown>> | null;
    if (!value || typeof value !== "object") return DEFAULT_PREFS;
    const seats = value.n === 3 || value.n === 4 ? value.n : 2;
    const bots = Number.isInteger(value.b) && (value.b as number) > 0 && (value.b as number) % 2 === 0 && (value.b as number) < 1 << seats ? value.b as number : 0;
    const level = Number.isInteger(value.l) && (value.l as number) >= 1 && (value.l as number) <= LEVEL_COUNT ? value.l as number : 1;
    return { mode: value.m === "group" ? "group" : "solo", level, seats, bots, two: value.g === 1 };
  } catch { return DEFAULT_PREFS; }
}
export const writePrefs = (prefs: Prefs) => JSON.stringify({ m: prefs.mode, l: prefs.level, n: prefs.seats, b: prefs.bots, g: prefs.two ? 1 : 0 });
