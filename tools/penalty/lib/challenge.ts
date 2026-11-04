// Challenge links. Server-safe: share.ts loads this, so it reaches only game-core, the levels and the rules.
// `#s=<seed>&t=<ours>&a=<theirs>&m=<match 1–12>&n=<name>`. Links from the old eight-match ladder carry `l=<1–8>` instead:
// they still open, on the match with the same team, and are checked by the old five-kick rules.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { isLevel, OLD_LEVELS } from "./levels";
import { realWin, MAX_ROUNDS } from "./rules";

/** A won match as the player reports it. Kicks and dives are real-time, so the score is their phone's word. */
export type Shared = { level: number; seed: number; us: number; them: number; name: string; legacy?: number };

const GOALS = /^(0|[1-9]\d?)$/;

export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_ROUNDS, extraKeys: ["a", "l", "m"] });
  if (!read) return null;
  const a = read.extra.a ?? "", m = read.extra.m, l = read.extra.l;
  if (!GOALS.test(a)) return null;
  const them = Number(a), us = read.target;
  if (m !== undefined) {
    if (!/^([1-9]|1[0-2])$/.test(m) || !isLevel(Number(m))) return null;
    const level = Number(m);
    return realWin(level, us, them) ? { level, seed: read.seed, us, them, name: read.name } : null;
  }
  if (l === undefined || !/^[1-8]$/.test(l)) return null;
  const level = OLD_LEVELS[Number(l)];
  return realWin(level, us, them, 5, "shootout") ? { level, seed: read.seed, us, them, name: read.name, legacy: Number(l) } : null;
}

/** The same key order as before, so the same card gives the same short link. */
export const sharedHash = ({ level, seed, us, them, name, legacy }: Shared) =>
  challengeHash({ seed, target: us, name, extra: legacy ? { a: them, l: legacy } : { a: them, m: level } });
