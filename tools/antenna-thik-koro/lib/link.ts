// Server-safe: share.ts (and so /api/share and /api/tally) imports this, so it reaches only shared/game-core, never React.
import { challengeHash, readChallenge } from "../../../shared/game-core";

export const ROUNDS = 5;
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

export type Shared = { seed: number; tenths: number; name: string };

/** A friend's link `#s=<seed>&t=<tenths>&n=<name>`: the seed replays the same five channels; the time is their own phone's claim. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS });
  if (!challenge || challenge.target < MIN_TENTHS) return null;
  return { seed: challenge.seed, tenths: challenge.target, name: challenge.name };
}
export const sharedHash = ({ seed, tenths, name }: Shared) => challengeHash({ seed, target: tenths, name });

export const previewTitle = ({ tenths, name }: Shared) => `${name || "এক বন্ধু"} ${seconds(tenths)} সেকেন্ডে ${bn(ROUNDS)}টা চ্যানেলের ছবি এনেছে। তুমি পারবে?`;
