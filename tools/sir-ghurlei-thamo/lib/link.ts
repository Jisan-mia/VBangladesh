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
/** Classes (levels). Class 5 is the original routine: links without a class open it. */
export const LEVEL_COUNT = 10, CLASSIC = 5;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => numbers.format(value);
/** 224 → "২২.৪" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

/** `level` is the class; the original one (CLASSIC) is left out, so its links keep their old shape. */
export type Shared = { seed: number; tenths: number; catches: number; name: string; level?: number };

/** A friend's link `#s=<seed>&t=<tenths>&c=<times caught>&l=<class>&n=<name>`: the seed and class replay the same lesson; the time is their own phone's claim. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["c", "l"] });
  if (!challenge || challenge.target < MIN_TENTHS) return null;
  const caught = challenge.extra.c ?? "0", level = challenge.extra.l ?? String(CLASSIC);
  if (!/^\d{1,2}$/.test(caught) || Number(caught) > MAX_CATCHES) return null;
  if (!/^[1-9]\d?$/.test(level) || Number(level) > LEVEL_COUNT) return null;
  const shared: Shared = { seed: challenge.seed, tenths: challenge.target, catches: Number(caught), name: challenge.name };
  if (Number(level) !== CLASSIC) shared.level = Number(level);
  return shared;
}

export const sharedHash = ({ seed, tenths, catches, name, level }: Shared) =>
  challengeHash({ seed, target: tenths, name, extra: { c: catches, ...(level && level !== CLASSIC ? { l: level } : {}) } });

export const previewTitle = ({ tenths, name, level }: Shared) => `${name || "এক বন্ধু"} ${level && level !== CLASSIC ? `ক্লাস ${bn(level)}-এ ` : ""}${seconds(tenths)} সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। তুমি পারবে?`;
