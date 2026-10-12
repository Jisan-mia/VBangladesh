// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, nextStar, possibleScore, starsOf, MAX_SCORE } from "./game";
import { bn, worldOf } from "./levels";

export { bn };

/** A played round: the seed behind its sums, right answers and score (the friend's own phone's claim), an optional first name. */
export type Shared = { seed: number; level: number; right: number; score: number; name: string };

/** `#s=<seed>&t=<score>&l=<level>&r=<right>&n=<name>`. Refused unless the level exists and the score fits the right answers. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "r"] });
  const level = read?.extra.l ?? "", right = read?.extra.r ?? "";
  if (!read || !/^[1-9]\d?$/.test(level) || !isLevel(Number(level)) || !/^(0|[1-9]\d{0,2})$/.test(right) || !possibleScore(Number(right), read.target)) return null;
  return { seed: read.seed, level: Number(level), right: Number(right), score: read.target, name: read.name };
}

export const sharedHash = ({ seed, level, right, score, name }: Shared) => challengeHash({ seed, target: score, name, extra: { l: level, r: right } });

/** "রাফি লেভেল ১২-এ ২৩টা হিসাব মিলিয়েছে" */
export const feat = ({ level, right, name }: Pick<Shared, "level" | "right" | "name">) =>
  `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এ ${bn(right)}টা হিসাব মিলিয়েছে`;
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

/** The card's human line, by stars, with the shop in it. */
export function humanLine(level: number, right: number) {
  const stars = starsOf(level, right), world = worldOf(level), bazar = world === 2;
  if (stars === 3) return ["খাতার এক পাতা শেষ, পেনসিলের শিস এখনো ধারালো।", "দোকানের খাতার পুরো পাতা মিলেছে, ক্যালকুলেটর ছুঁতেও হয়নি।", "দোকানদার ক্যালকুলেটর খোঁজার আগেই মোট বলে দিয়েছ।"][world];
  if (stars === 2) return bazar ? "ফর্দ মিলেছে। দোকানদার একবার চোখ তুলে তাকিয়েছে।" : "হিসাব মিলেছে। আর কয়েকটা হলে পাতা ভরে যেত।";
  if (stars === 1) return `লেভেল পার, ${bn(right)}টা মিলেছে। এবার আরেকটু চটপট।`;
  return right ? `${bn(right)}টা মিলেছে, ঘড়িটা একটু আগে থেমে গেল।` : "ঘড়িটা এবার আগে থেমেছে। আরেকবার চাপো, হিসাব নতুন।";
}

/** The near-miss line, with the exact number. Empty at three stars. */
export function nearLine(level: number, right: number) {
  const next = nextStar(level, right);
  if (!next) return "";
  return next.stars === 1 ? `আর ${bn(next.need)}টা মিললেই লেভেল পার।` : `আর ${bn(next.need)}টা মিললে ${bn(next.stars)} তারা।`;
}

/** After a friend's round: more right answers wins, then the score; kind either way. */
export function compareLine(mine: Pick<Shared, "right" | "score">, theirs: Shared) {
  const who = cleanName(theirs.name) || "বন্ধু";
  if (mine.right > theirs.right) return `${possessive(who)} চেয়ে ${bn(mine.right - theirs.right)}টা বেশি!`;
  if (mine.right === theirs.right) return mine.score === theirs.score ? `একদম সমান! ${who}ও ${bn(theirs.right)}টা মিলিয়েছিল।` : `${bn(mine.right)}টা করে সমান। পয়েন্টে ${mine.score > theirs.score ? "তুমি" : who} এগিয়ে।`;
  if (theirs.right - mine.right <= 2) return `আর একটু হলেই! মাত্র ${bn(theirs.right - mine.right)}টা কম।`;
  return `${who} এখনো ${bn(theirs.right - mine.right)}টা এগিয়ে। আরেকবার?`;
}

export const caption = (level: number, right: number, score: number) =>
  `‘মুখে মুখে হিসাব’ খেলার লেভেল ${bn(level)}-এ ${bn(right)}টা হিসাব মেলালাম, ${bn(score)} পয়েন্ট। তুমি কয়টা পারবে?`;
