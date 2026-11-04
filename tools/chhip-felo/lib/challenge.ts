// Challenge links. Server-safe: share.ts (and so /api/share) imports this, so it reaches only pure modules, never React.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { readOld } from "./legacy";
import { BOSSES, FISH, MAX_GRAMS } from "./species";
import { isLevel, isMode, levelDef, MODE_INFO, type Mode } from "./levels";

export const SLUG = "chhip-felo";
const MAX_TARGET = 40000;

/**
 * A friend's trip. The water is rebuilt from seed and level; the weight is their phone's count. `old`: a link from
 * before the rewrite, which opens the same seed on the same level number and shows its weight only as their claim.
 */
export type Shared = {
  seed: number; level: number; grams: number; catches: number;
  /** The heaviest fish's index into FISH (a boss counts as its kind), or -1 for an empty basket. */
  big: number;
  name: string; mode: Mode;
  /** v=2 only: baits lost, whether the level was cleared, whether its boss came up. */
  lost: number; won: boolean; boss: boolean;
  old: boolean;
};

/**
 * Old: `#s=<seed>&t=<grams>&l=<level>&c=<fish>&b=<biggest>&n=<name>`.
 * New: the same plus `v=2`, `d=e|h` off স্বাভাবিক, and `k=<baits lost>`. Anything impossible rejects the link.
 */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_TARGET, extraKeys: ["l", "c", "b", "v", "d", "k"] });
  if (!read) return null;
  const { l = "", c = "", b = "", v, d, k } = read.extra;
  if (!/^[1-9]\d?$/.test(l) || !/^\d$/.test(c) || !/^(|0|[1-9]\d?)$/.test(b)) return null;
  const level = Number(l), catches = Number(c), grams = read.target;
  if (v === undefined) {
    if (d !== undefined || k !== undefined) return null;
    const old = readOld(level, catches, b, grams);
    return old ? { seed: read.seed, level, grams, catches, big: old.big, name: read.name, mode: "n", lost: 0, won: false, boss: false, old: true } : null;
  }
  const mode = d ?? "n";
  if (v !== "2" || !isLevel(level) || !isMode(mode) || !/^\d$/.test(k ?? "")) return null;
  const def = levelDef(level), lost = Number(k), spare = MODE_INFO[mode].spare;
  if (catches > def.need || lost > spare + 1) return null;
  const won = catches === def.need;
  // A trip ends with the basket full or the baits gone.
  if (won ? lost > spare : lost !== spare + 1) return null;
  const boss = won && def.boss >= 0 ? BOSSES[def.boss] : null;
  if (!catches) return grams === 0 && b === "" ? { seed: read.seed, level, grams: 0, catches: 0, big: -1, name: read.name, mode, lost, won, boss: false, old: false } : null;
  const big = Number(b);
  if (b === "" || big >= FISH.length) return null;
  if (boss ? big !== boss.fish : !def.pool.includes(big)) return null;
  const others = catches - (boss ? 1 : 0);
  const low = others * 20 + (boss ? boss.grams[0] : 0), high = others * (boss ? MAX_GRAMS : FISH[big].grams[1]) + (boss ? boss.grams[1] : 0);
  if (grams < low || grams > high) return null;
  return { seed: read.seed, level, grams, catches, big, name: read.name, mode, lost, won, boss: boss !== null, old: false };
}

/** Old links write exactly the old format; new ones add v=2, the mode (off স্বাভাবিক) and the baits lost. */
export const sharedHash = ({ seed, level, grams, catches, big, name, mode, lost, old }: Omit<Shared, "won" | "boss">) => challengeHash({
  seed, target: grams, name,
  extra: { l: level, c: catches, ...(catches ? { b: big } : {}), ...(old ? {} : { v: 2, ...(mode === "n" ? {} : { d: mode }), k: lost }) },
});

