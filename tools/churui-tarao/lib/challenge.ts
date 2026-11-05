// Challenge links. Server-safe: share.ts loads this, so it reaches only game-core, the level data and the pure afternoon.
// Old links (`#s=&t=&c=&l=&n=`, no `v`) are checked against the old afternoon; new ones add `v=2` and `d` (the mode).
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { createGame, starsOf, GRAIN } from "./afternoon";
import { biteOf, isLevel, DEFAULT_MODE, MODES } from "./levels";
import { oldMaxSaved, OLD_LEVELS } from "./legacy";

/** An afternoon the player got through, as they report it: grain left (%) and birds shooed. Taps are real-time, so it is their phone's word. */
export type Shared = { level: number; seed: number; grain: number; shooed: number; name: string; mode: number; old: boolean };

export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: GRAIN, extraKeys: ["c", "l", "v", "d"] });
  if (!read) return null;
  const { c = "", l = "1", v, d } = read.extra;
  if (!/^\d{1,2}$/.test(c) || !/^[1-9]\d?$/.test(l)) return null;
  const shooed = Number(c), level = Number(l), grain = read.target;
  if (v === undefined) {
    // The old game: ten fields; no more sparrows than came, no grain the unshooed ones couldn't have eaten.
    if (level > OLD_LEVELS || d !== undefined) return null;
    const most = oldMaxSaved(read.seed, level, shooed);
    if (most < 0 || grain > most) return null;
    return { level, seed: read.seed, grain, shooed, name: read.name, mode: DEFAULT_MODE, old: true };
  }
  if (v !== "2" || !isLevel(level)) return null;
  const mode = d === undefined ? DEFAULT_MODE : /^\d$/.test(d) && Number(d) < MODES.length ? Number(d) : -1;
  if (mode < 0) return null;
  // A new card is made only for a ক্ষেত passed; the grain left is a whole number of pecks off the full field.
  const bite = biteOf(mode);
  if (starsOf(level, grain) === 0 || (GRAIN - grain) % bite !== 0 || shooed > createGame(level, read.seed, mode).n) return null;
  return { level, seed: read.seed, grain, shooed, name: read.name, mode, old: false };
}

export const sharedHash = ({ level, seed, grain, shooed, name, mode, old }: Shared) =>
  challengeHash({ seed, target: grain, name, extra: old ? { c: shooed, ...(level > 1 && { l: level }) } : { c: shooed, l: level, v: 2, d: mode } });
