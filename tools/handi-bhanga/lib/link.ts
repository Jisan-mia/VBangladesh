// Scoring, challenge links and preview text. Server-safe: the share routes load this file, so it imports only pure game-core.
import { challengeHash, readChallenge, type LevelStars } from "../../../shared/game-core";

export const POTS = 35;

/**
 * Ten মেলা stalls, each one step harder: more tough pots, a faster ball (`speed`), ropes that sway in the breeze (`sway` units either way,
 * `swaySpeed` radians a second) and a wind that bends the ball (`wind`). Level 1 is the original stall, so old links replay unchanged.
 * `pass` is the score for 1 star; clearing every pot gives 2, clearing with 2 or more chances left gives 3.
 */
export const LEVELS = [
  { name: "পাড়ার মেলা", note: "আটটা মোটা হাঁড়ি, বাকিগুলো এক বাড়িতেই ভাঙে।", tough: 8, speed: 0, sway: 0, swaySpeed: 0, wind: 0, pass: 80 },
  { name: "স্কুলমাঠের মেলা", note: "মোটা হাঁড়ি একটু বেশি।", tough: 11, speed: 0, sway: 0, swaySpeed: 0, wind: 0, pass: 100 },
  { name: "নদীর ঘাটের মেলা", note: "বাতাসে দড়ি দোলে, হাঁড়িও।", tough: 11, speed: 0, sway: 3, swaySpeed: 1.4, wind: 0, pass: 130 },
  { name: "বৈশাখী মেলা", note: "বল ছোটে আরেকটু জোরে।", tough: 11, speed: 15, sway: 3, swaySpeed: 1.4, wind: 0, pass: 140 },
  { name: "রথের মেলা", note: "দড়ি দোলে আরও বেশি।", tough: 11, speed: 15, sway: 5, swaySpeed: 1.7, wind: 0, pass: 150 },
  { name: "পৌষমেলা", note: "উত্তুরে হাওয়া, বলও একটু বাঁকে।", tough: 11, speed: 15, sway: 5, swaySpeed: 1.7, wind: 0.12, pass: 150 },
  { name: "চৈত্রসংক্রান্তির মেলা", note: "মোটা হাঁড়ি আরও বেশি।", tough: 15, speed: 15, sway: 5, swaySpeed: 1.7, wind: 0.12, pass: 160 },
  { name: "নৌকাবাইচের মেলা", note: "নদীর জোর হাওয়া।", tough: 15, speed: 15, sway: 6, swaySpeed: 2, wind: 0.2, pass: 160 },
  { name: "চড়কের মেলা", note: "বল আরও জোরে।", tough: 15, speed: 30, sway: 6, swaySpeed: 2, wind: 0.2, pass: 170 },
  { name: "জেলার বড় মেলা", note: "সব একসঙ্গে: মোটা হাঁড়ি, দোল, হাওয়া।", tough: 18, speed: 30, sway: 6, swaySpeed: 2.3, wind: 0.25, pass: 170 },
] as const;
export const LEVEL_COUNT = LEVELS.length;
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

/** Stars for a score on a level: 0 below its pass mark, 1 above it, 2 for every pot, 3 for every pot with 2 or more chances left. */
export function starsOf(score: number, level: number) {
  const { pass } = LEVELS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
  return score < pass ? 0 : score >= ALL_POTS + 2 * CHANCE_POINTS ? 3 : score > ALL_POTS ? 2 : 1;
}

/** The near miss with exact numbers: pots to the next star, the chance a 3-star clear needs, or (at 3 stars) points to this phone's best. */
export function nearLine(score: number, level: number, best: number | null) {
  const { pass } = LEVELS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1], stars = starsOf(score, level);
  if (!stars) return `আর ${bn((pass - score) / POT_POINTS)}টা হাঁড়ি ভাঙলেই ১ তারা।`;
  if (stars === 1) return `আর ${bn(POTS - potsFrom(score))}টা হাঁড়ি ভাঙলেই দোকান সাফ, ২ তারা।`;
  if (stars === 2) return "আর একটা চান্স হাতে রেখে সাফ করলেই ৩ তারা।";
  return best !== null && score <= best && best < MAX_SCORE ? `আর ${bn(best - score + CHANCE_POINTS)} পয়েন্ট হলেই নতুন সেরা।` : "";
}

/** Before levels this phone kept one best score for the one stall there was (now level 1). Its stars, or 0 when there is nothing to move. */
export function migrateBest(stars: LevelStars, oldBest: string | null) {
  const score = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || oldBest === "" || !validScore(score)) return 0;
  return starsOf(score, 1);
}

export type Shared = { seed: number; score: number; name: string; level: number };

/** `s` seed, `t` score, `l` the stall (links from before levels have none and open stall 1), `n` name. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l"] });
  if (!challenge || !validScore(challenge.target)) return null;
  const rawLevel = challenge.extra.l ?? "1", level = Number(rawLevel);
  if (!/^[1-9]\d?$/.test(rawLevel) || level > LEVEL_COUNT) return null;
  return { seed: challenge.seed, score: challenge.target, name: challenge.name, level };
}

export const sharedHash = ({ seed, score, name, level }: Shared) => challengeHash({ seed, target: score, name, extra: level > 1 ? { l: level } : {} });

export const banner = ({ score, name }: Shared) => `${name || "বন্ধু"} ${bn(score)} করেছে। একই হাঁড়ির সারি, এবার তোমার পালা।`;
export const previewTitle = ({ score, name }: Shared) => name ? `${name} ${bn(score)} করেছে। তুমি পারবে?` : `হাঁড়িভাঙায় ${bn(score)}! তুমি পারবে?`;
export function caption({ score }: Pick<Shared, "score">) {
  const pots = potsFrom(score);
  return pots < POTS
    ? `হাঁড়িভাঙায় ৩৫টার ${bn(pots)}টা হাঁড়ি ভাঙলাম, ${bn(score)} পয়েন্ট। একই হাঁড়ির সারি তোমার জন্য রাখলাম, দেখি কয়টা পারো!`
    : `হাঁড়িভাঙায় ৩৫টা হাঁড়িই ভেঙে দিলাম, ${bn(score)} পয়েন্ট! একই সারি তোমার জন্য রাখলাম, দেখি পারো কি না।`;
}
