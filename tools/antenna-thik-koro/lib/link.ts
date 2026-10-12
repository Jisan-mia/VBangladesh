// Server-safe: share.ts (and so /api/share and /api/tally) imports this, so it reaches only shared/game-core, never React.
import { challengeHash, readChallenge } from "../../../shared/game-core";

export const ROUNDS = 5;
/** Levels live in antenna.ts; the count is here so links can check `l` without loading the rules. */
export const LEVEL_COUNT = 12;
/** Seconds the antenna must stay in the sweet spot before the picture locks. */
export const DWELL = 0.45;
/** Score is tenths of a second. Five dwells alone take 2.25 s, so a faster link is forged. */
export const MIN_TENTHS = Math.ceil(DWELL * ROUNDS * 10);
export const MAX_TENTHS = 6000;

const numbers = new Intl.NumberFormat("bn-BD");
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const bn = (value: number) => numbers.format(value);
/** 473 → "৪৭.৩" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

export type Shared = { seed: number; tenths: number; name: string; level: number };

/**
 * A friend's link `#s=<seed>&t=<tenths>&l=<level>&n=<name>`: the seed and level replay the same five channels; the time is their own phone's claim.
 * Links from before levels have no `l` and open level 1, the same game they were played on.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["l"] });
  if (!challenge || challenge.target < MIN_TENTHS) return null;
  const raw = challenge.extra.l ?? "1", level = Number(raw);
  if (!/^[1-9]\d?$/.test(raw) || level > LEVEL_COUNT) return null;
  return { seed: challenge.seed, tenths: challenge.target, name: challenge.name, level };
}
// Level 1 leaves `l` out, so its links stay exactly the old format.
export const sharedHash = ({ seed, tenths, name, level }: Shared) => challengeHash({ seed, target: tenths, name, extra: level > 1 ? { l: level } : {} });

export const previewTitle = ({ tenths, name }: Shared) => `${name || "এক বন্ধু"} ${seconds(tenths)} সেকেন্ডে ${bn(ROUNDS)}টা চ্যানেলের ছবি এনেছে। তুমি পারবে?`;
