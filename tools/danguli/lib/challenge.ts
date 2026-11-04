// Challenge links. Server-safe: share.ts loads this, so it reaches only game-core and the level data.
// New links: `#s=<seed>&t=<total ডাং>&h=<hit>-<hit>-<hit>&l=<level 1–12>&v=2[&d=e|h][&n=<name>]`.
// Links from before the rewrite have no `v`: `l` is 1–10 on the old ladder (no `l` is its level 1), mapped to the same place
// on the new one. Each hit is its ডাং, "c" for caught or "m" for a miss, and the hits must add up to the total.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { fromOld, HITS, isMode, LEVEL_COUNT, MAX_HIT, OLD_COUNT, type Mode } from "./levels";

/** A round as the player reports it. Timing is real-time, so the score is their phone's word. */
export type Shared = {
  level: number; seed: number; total: number; hits: string[]; name: string; mode: Mode;
  /** The old ladder's level for a link from before the rewrite, else 0. */
  old: number;
};

const HIT_TOKEN = /^(c|m|60|[1-5]?\d)$/;
export const hitValue = (token: string) => /\d/.test(token) ? Number(token) : 0;

/** Anything malformed is refused (null). */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: HITS * MAX_HIT, extraKeys: ["h", "l", "v", "d"] });
  // readChallenge reads a missing `t` as 0; a link without the score is refused.
  if (!read || !/(^|[#&])t=\d/.test(hash)) return null;
  const { h = "", l, v, d } = read.extra;
  const hits = h.split("-");
  if (hits.length !== HITS || !hits.every(hit => HIT_TOKEN.test(hit))) return null;
  if (hits.reduce((sum, hit) => sum + hitValue(hit), 0) !== read.target) return null;
  if (v === undefined) {
    const raw = l ?? "1", value = Number(raw);
    if (!/^[1-9]\d?$/.test(raw) || value > OLD_COUNT || d !== undefined) return null;
    return { level: fromOld(value), seed: read.seed, total: read.target, hits, name: read.name, mode: "n", old: value };
  }
  if (v !== "2" || l === undefined || !/^[1-9]\d?$/.test(l) || Number(l) > LEVEL_COUNT) return null;
  if (d !== undefined && (d === "n" || !isMode(d))) return null;
  return { level: Number(l), seed: read.seed, total: read.target, hits, name: read.name, mode: (d as Mode | undefined) ?? "n", old: 0 };
}

/** The link in a fixed key order. An old link keeps its old form (level 1 without `l`), so it means the same thing wherever it goes. */
export function sharedHash({ level, seed, total, hits, name, mode, old }: Shared) {
  if (old) return challengeHash({ seed, target: total, name, extra: { h: hits.join("-"), ...(old > 1 && { l: old }) } });
  const extra: Record<string, string | number> = { h: hits.join("-"), l: level, v: 2 };
  if (mode !== "n") extra.d = mode;
  return challengeHash({ seed, target: total, name, extra });
}

/**
 * The field for a level you start: the friend's own seed when it is the friend's level and mode (so "একই মাঠ" on the
 * banner stays true, from the level list as much as from আবার খেলো), else the fresh seed given.
 */
export const seedFor = (friend: Pick<Shared, "level" | "seed" | "mode"> | null, level: number, mode: Mode, fresh: number) =>
  friend && friend.level === level && friend.mode === mode ? friend.seed : fresh;
