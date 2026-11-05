// Challenge links. Server-safe: share.ts loads this, so it reaches only game-core and the level data.
// New links: `#s=<seed>&t=<tenths of a second>&l=<level 1–12>&v=2[&d=e|h][&p=1][&b=<badges>][&n=<name>]`.
// Links from before the rewrite have no `v`: `l` is 1–9 on the old ladder (no `l` is its level 1), mapped to the same place on
// the new one, and they keep their old form when re-serialised. `t` counts the palm bonus (p=1); the time badges must agree.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { badgesOf, BADGE_IDS, BONUS, type Badge } from "./badges";
import { fromOld, isMode, LEVEL_COUNT, MAX_SCORE, OLD_COUNT, type Mode } from "./levels";

/** A spin as the player reports it. Timing is real-time, so the score is their phone's word. */
export type Shared = {
  seed: number; level: number; score: number; palm: boolean; badges: Badge[]; name: string; mode: Mode;
  /** The old ladder's level for a link from before the rewrite, else 0. */
  old: number;
};

/** Anything malformed is refused (null). */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "p", "b", "v", "d"] });
  if (!read) return null;
  const { l, p = "0", b, v, d } = read.extra;
  if (!/^[01]$/.test(p)) return null;
  const palm = p === "1", spun = read.target - (palm ? BONUS : 0);
  if (spun < 0) return null;
  const tokens = b ? b.split("-") : [];
  if (tokens.some(token => !(BADGE_IDS as string[]).includes(token)) || new Set(tokens).size !== tokens.length) return null;
  const badges = BADGE_IDS.filter(id => tokens.includes(id));
  const expected = badgesOf(spun, palm, 0, 1);
  for (const id of ["t10", "t20", "t30", "palm"] as const) if (badges.includes(id) !== expected.includes(id)) return null;
  if (v === undefined) {
    const raw = l ?? "1", value = Number(raw);
    if (!/^[1-9]$/.test(raw) || value > OLD_COUNT || d !== undefined) return null;
    return { seed: read.seed, level: fromOld(value), score: read.target, palm, badges, name: read.name, mode: "n", old: value };
  }
  if (v !== "2" || l === undefined || !/^[1-9]\d?$/.test(l) || Number(l) > LEVEL_COUNT) return null;
  if (d !== undefined && (d === "n" || !isMode(d))) return null;
  return { seed: read.seed, level: Number(l), score: read.target, palm, badges, name: read.name, mode: (d as Mode | undefined) ?? "n", old: 0 };
}

/** The link in a fixed key order. An old link keeps its old form (level 1 without `l` is never written: old links always carried `l`). */
export function sharedHash({ seed, level, score, palm, badges, name, mode, old }: Shared) {
  const tail = { ...(palm && { p: 1 }), ...(badges.length && { b: badges.join("-") }) };
  if (old) return challengeHash({ seed, target: score, name, extra: { l: old, ...tail } });
  return challengeHash({ seed, target: score, name, extra: { l: level, v: 2, ...(mode !== "n" && { d: mode }), ...tail } });
}

/**
 * The floor for a level you start: the friend's own seed when it is the friend's level and mode (so "একই উঠান" on the
 * banner stays true, from the level list as much as from আবার খেলো), else the fresh seed given.
 */
export const seedFor = (friend: Pick<Shared, "level" | "seed" | "mode"> | null, level: number, mode: Mode, fresh: number) =>
  friend && friend.level === level && friend.mode === mode ? friend.seed : fresh;
