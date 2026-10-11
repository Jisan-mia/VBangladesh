// The challenge link and the numbers it carries. Server-safe: share.ts imports this, so it reaches only shared/game-core, never React.
import { challengeHash, readChallenge } from "../../../shared/game-core";

export const SLUG = "sir-ghurlei-thamo";
/** Benches in the row; the chit starts on the first and must reach the last. */
export const BENCHES = 8;
/** Benches per second while the chit is moving, at normal speed. */
export const SPEED = 0.75;
/** Score is tenths of a second. Even a never-stopping chit needs this long, so a faster link is forged. */
export const MIN_TENTHS = Math.ceil(((BENCHES - 1) / SPEED) * 10);
export const MAX_TENTHS = 6000;
export const MAX_CATCHES = 60;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => numbers.format(value);
/** 224 → "২২.৪" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

export type Shared = { seed: number; tenths: number; catches: number; name: string };

/** A friend's link `#s=<seed>&t=<tenths>&c=<times caught>&n=<name>`: the seed replays the same class; the time is their own phone's claim. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["c"] });
  if (!challenge || challenge.target < MIN_TENTHS) return null;
  const caught = challenge.extra.c ?? "0";
  if (!/^\d{1,2}$/.test(caught) || Number(caught) > MAX_CATCHES) return null;
  return { seed: challenge.seed, tenths: challenge.target, catches: Number(caught), name: challenge.name };
}

export const sharedHash = ({ seed, tenths, catches, name }: Shared) => challengeHash({ seed, target: tenths, name, extra: { c: catches } });

export const previewTitle = ({ tenths, name }: Shared) => `${name || "এক বন্ধু"} ${seconds(tenths)} সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। তুমি পারবে?`;
