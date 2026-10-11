// Scoring, challenge links and preview text. Server-safe: the share routes load this file, so it imports only pure game-core.
import { challengeHash, readChallenge } from "../../../shared/game-core";

export const POTS = 35;
export const CHANCES = 3;
export const POT_POINTS = 10;
export const CHANCE_POINTS = 50;
const ALL_POTS = POTS * POT_POINTS;
export const MAX_SCORE = ALL_POTS + CHANCES * CHANCE_POINTS;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** Short of a full clear only whole pots count (0–340); clearing all 35 adds 50 per chance still left, so 400, 450 or 500. Anything else is a forged link. */
export function validScore(score: number) {
  if (!Number.isInteger(score) || score < 0 || score % POT_POINTS !== 0) return false;
  return score < ALL_POTS || (score > ALL_POTS && score <= MAX_SCORE && (score - ALL_POTS) % CHANCE_POINTS === 0);
}
export const potsFrom = (score: number) => Math.min(POTS, score / POT_POINTS);
export const chancesFrom = (score: number) => score > ALL_POTS ? (score - ALL_POTS) / CHANCE_POINTS : 0;

/** "৩৫টার ২৮টা", or after a full clear "৩৫টার ৩৫টা, ২ চান্স বাকি". */
export function tallyLine(score: number) {
  const pots = potsFrom(score), left = chancesFrom(score);
  const head = `${bn(POTS)}টার ${bn(pots)}টা`;
  if (pots < POTS) return head;
  return left === CHANCES ? `${head}, ${bn(left)} চান্সই বাকি` : `${head}, ${bn(left)} চান্স বাকি`;
}

export type Shared = { seed: number; score: number; name: string };

export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE });
  if (!challenge || !validScore(challenge.target)) return null;
  return { seed: challenge.seed, score: challenge.target, name: challenge.name };
}

export const sharedHash = ({ seed, score, name }: Shared) => challengeHash({ seed, target: score, name });

export const banner = ({ score, name }: Shared) => `${name || "বন্ধু"} ${bn(score)} করেছে। একই হাঁড়ির সারি, এবার তোমার পালা।`;
export const previewTitle = ({ score, name }: Shared) => name ? `${name} ${bn(score)} করেছে। তুমি পারবে?` : `হাঁড়িভাঙায় ${bn(score)}! তুমি পারবে?`;
export function caption({ score }: Pick<Shared, "score">) {
  const pots = potsFrom(score);
  return pots < POTS
    ? `হাঁড়িভাঙায় ৩৫টার ${bn(pots)}টা হাঁড়ি ভাঙলাম, ${bn(score)} পয়েন্ট। একই হাঁড়ির সারি তোমার জন্য রাখলাম, দেখি কয়টা পারো!`
    : `হাঁড়িভাঙায় ৩৫টা হাঁড়িই ভেঙে দিলাম, ${bn(score)} পয়েন্ট! একই সারি তোমার জন্য রাখলাম, দেখি পারো কি না।`;
}
