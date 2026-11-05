// Challenge links. Server-safe: share.ts loads this, so it reaches only game-core, the levels and the words.
//   New:  #s=<the level's seed>&t=<balls 1–3>&v=2&c=<level 1–15>[&d=e|h]&n=<name>
//   Old:  #s=<the old level's seed>&t=<balls 1–3>&l=<old level 1–30>&n=<name>   (before the rewrite; still opens that pile)
// Real-time aim can't be re-checked, so the ball count is the friend's own phone's word. Anything else is refused.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { isLevel, seedOf } from "./levels";
import { isOldLevel, oldSeedOf } from "./old-levels";
import { isHand } from "./save";
import { previewTitle, type Claim } from "./words";
import { BALLS } from "./game";

export type Shared = Claim;
export { previewTitle };

const LEVEL_RE = /^[1-9]\d?$/;

export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: BALLS, extraKeys: ["l", "c", "v", "d"] });
  if (!read || read.target < 1) return null;
  const { l, c, v, d } = read.extra;
  if (v !== undefined || c !== undefined) {
    if (v !== "2" || !c || !LEVEL_RE.test(c)) return null;
    const level = Number(c);
    if (!isLevel(level) || read.seed !== seedOf(level)) return null;
    if (d !== undefined && (!isHand(d) || d === "n")) return null;
    return { kind: "level", level, balls: read.target, hand: isHand(d) ? d : "n", name: read.name };
  }
  if (!l || !LEVEL_RE.test(l)) return null;
  const level = Number(l);
  if (!isOldLevel(level) || read.seed !== oldSeedOf(level)) return null;
  return { kind: "old", level, balls: read.target, hand: "n", name: read.name };
}

export function sharedHash({ kind, level, balls, hand, name }: Shared) {
  const target = Math.min(BALLS, Math.max(1, Math.round(balls)));
  if (kind === "old") return challengeHash({ seed: oldSeedOf(level), target, name, extra: { l: level } });
  return challengeHash({ seed: seedOf(level), target, name, extra: hand === "n" ? { v: 2, c: level } : { v: 2, c: level, d: hand } });
}
