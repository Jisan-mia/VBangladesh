// Challenge links. Server-safe: share.ts loads this, so it reaches only game-core and the level data.
// New links: `#s=<seed>&t=<points they got>&r=<longest rally>&l=<level 1–12>&v=2[&d=e|h][&n=<name>]`.
// Links from before the rewrite have no `v`: `l` is 1–15 on the old ladder, mapped to the same place on the new one.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { fromOld, isMode, levelDef, LEVEL_COUNT, OLD_COUNT, OLD_POINTS, type Mode } from "./levels";

export const MAX_RALLY = 300;

/** A won match as the player reports it. Timing is real-time, so the score is their phone's word. */
export type Shared = {
  level: number; seed: number; them: number; rally: number; name: string; mode: Mode;
  /** The old ladder's level for a link from before the rewrite (its `t` counted a first-to-5 match), else 0. */
  old: number;
};

/** Anything malformed is refused (null). */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: 6, extraKeys: ["r", "l", "v", "d"] });
  // readChallenge reads a missing `t` as 0; a link without the score is refused.
  if (!read || !/(^|[#&])t=\d/.test(hash)) return null;
  const { l = "", r = "", v, d } = read.extra;
  if (!/^[1-9]\d?$/.test(l) || !/^[1-9]\d{0,2}$/.test(r)) return null;
  const rally = Number(r), value = Number(l);
  if (rally > MAX_RALLY) return null;
  if (v === undefined) {
    if (value > OLD_COUNT || read.target >= OLD_POINTS || d !== undefined) return null;
    return { level: fromOld(value), seed: read.seed, them: read.target, rally, name: read.name, mode: "n", old: value };
  }
  if (v !== "2" || value > LEVEL_COUNT) return null;
  if (d !== undefined && (d === "n" || !isMode(d))) return null;
  if (read.target >= levelDef(value).points) return null;
  return { level: value, seed: read.seed, them: read.target, rally, name: read.name, mode: (d as Mode | undefined) ?? "n", old: 0 };
}

/** The link in a fixed key order. An old link keeps its old form, so it means the same thing wherever it goes. */
export function sharedHash({ level, seed, them, rally, name, mode, old }: Shared) {
  const r = Math.max(1, Math.min(MAX_RALLY, rally));
  if (old) return challengeHash({ seed, target: them, name, extra: { r, l: old } });
  const extra: Record<string, string | number> = { r, l: level, v: 2 };
  if (mode !== "n") extra.d = mode;
  return challengeHash({ seed, target: them, name, extra });
}
