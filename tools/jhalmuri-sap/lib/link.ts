// Challenge links and preview text. Server-safe: the share routes load this file, so it imports only pure game-core.
import { challengeHash, readChallenge } from "../../../shared/game-core";

export const POINTS = 10;
// A full board holds 192 cells, so 189 bites at most (a quarter of them golden): no real run gets near 3000.
export const MAX_SCORE = 3000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type Shared = { seed: number; score: number; name: string };

/** Reads a challenge link. Scores only ever move in steps of 10, so anything else is a forged link. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE });
  if (!challenge || challenge.target % POINTS !== 0) return null;
  return { seed: challenge.seed, score: challenge.target, name: challenge.name };
}

export const sharedHash = ({ seed, score, name }: Shared) => challengeHash({ seed, target: score, name });

export const banner = ({ score, name }: Shared) => `${name || "বন্ধু"} ${bn(score)} করেছে। একই ঠোঙা, তোমার পালা।`;
export const previewTitle = ({ score, name }: Shared) => name ? `${name} ${bn(score)} করেছে। তুমি পারবে?` : `ঝালমুড়ি সাপে ${bn(score)}! তুমি পারবে?`;
export const caption = ({ score }: Pick<Shared, "score">) => `ঝালমুড়ি সাপে আমার স্কোর ${bn(score)}। একই ঠোঙা তোমার জন্য রাখলাম, দেখি কত পারো!`;
