// Challenge links. Server-safe: share.ts loads this, so it reaches only game-core and the level data.
// Old links (`#s=&t=&l=&b=&n=`, no `v`) keep the old game's rules; new ones add `v=2` and `d` (the mode).
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { countOf, heartsOf, isLevel, DEFAULT_MODE, LEVEL_COUNT, MODES } from "./levels";

/** A night the player got through, as they report it. Taps are real-time, so the count is their phone's word. */
export type Shared = { level: number; seed: number; zaps: number; bites: number; name: string; mode: number; old: boolean };

/** How many mosquitoes each night of the old 20-night game had: an old link may not claim more than that. */
export const OLD_COUNTS = [8, 10, 12, 13, 14, 16, 17, 18, 20, 22, 23, 24, 26, 27, 29, 30, 32, 34, 37, 40] as const;
const MAX_COUNT = Math.max(...OLD_COUNTS, ...Array.from({ length: LEVEL_COUNT }, (_, index) => countOf(index + 1)));

export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_COUNT, extraKeys: ["l", "b", "v", "d"] });
  if (!read) return null;
  const { l = "", b = "", v, d } = read.extra;
  if (!/^[1-9]\d?$/.test(l) || !/^\d$/.test(b)) return null;
  const level = Number(l), bites = Number(b);
  if (!isLevel(level)) return null;
  if (v === undefined) {
    // The old game: a won night had fewer than 3 bites, and zaps plus bites never passed that night's mosquitoes.
    if (bites >= 3 || read.target + bites > OLD_COUNTS[level - 1] || d !== undefined) return null;
    return { level, seed: read.seed, zaps: read.target, bites, name: read.name, mode: DEFAULT_MODE, old: true };
  }
  if (v !== "2") return null;
  const mode = d === undefined ? DEFAULT_MODE : /^\d$/.test(d) && Number(d) < MODES.length ? Number(d) : -1;
  if (mode < 0 || bites >= heartsOf(mode) || read.target > countOf(level)) return null;
  return { level, seed: read.seed, zaps: read.target, bites, name: read.name, mode, old: false };
}

export const sharedHash = ({ level, seed, zaps, bites, name, mode, old }: Shared) =>
  challengeHash({ seed, target: zaps, name, extra: old ? { l: level, b: bites } : { l: level, b: bites, v: 2, d: mode } });
