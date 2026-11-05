// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, nextStar, possibleScore, starsOf, MAX_SCORE } from "./game";
import { bn, finaleName, worldOf, WORLD } from "./levels";

export { bn };

/** How many of a round's first sums the card shows, each marked as it went. */
export const CARD_SUMS = 6;

/**
 * A played round: the seed behind its sums, right answers and score (the friend's own phone's claim), an optional first
 * name, and `marks`: how the first sums went ("1" right, "0" wrong; shorter if the round ended sooner). Old links have
 * no marks (null), and their card shows the sums without ticks.
 */
export type Shared = { seed: number; level: number; right: number; score: number; name: string; marks: string | null };

/** `#s=<seed>&t=<score>&l=<level>&r=<right>&n=<name>&k=<marks>`. Refused unless the level exists and the score fits the right answers. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "r", "k"] });
  const level = read?.extra.l ?? "", right = read?.extra.r ?? "", marks = read?.extra.k;
  if (!read || !/^[1-9]\d?$/.test(level) || !isLevel(Number(level)) || !/^(0|[1-9]\d{0,3})$/.test(right) || !possibleScore(Number(right), read.target)) return null;
  // Marks that don't fit the claim are dropped, not the link: the sums still replay.
  const fits = marks !== undefined && new RegExp(`^[01]{0,${CARD_SUMS}}$`).test(marks) && [...marks].filter(mark => mark === "1").length <= Number(right);
  return { seed: read.seed, level: Number(level), right: Number(right), score: read.target, name: read.name, marks: fits ? marks! : null };
}

export const sharedHash = ({ seed, level, right, score, name, marks }: Shared) =>
  challengeHash({ seed, target: score, name, extra: marks === null ? { l: level, r: right } : { l: level, r: right, k: marks } });

/** "রাফি লেভেল ১২-এ ২৩টা হিসাব মিলিয়েছে" */
export const feat = ({ level, right, name }: Pick<Shared, "level" | "right" | "name">) =>
  `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এ ${bn(right)}টা হিসাব মিলিয়েছে`;
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
/** Under a friend's card on the start screen. */
export const friendClaim = (shared: Shared) => `একই হিসাব, একই ক্রমে, এবার তোমার পালা। স্কোরটা ${shared.name ? possessive(cleanName(shared.name)) : "বন্ধুর"} নিজের ফোনের।`;

/** The card's and end screen's human line, by stars, in the world's own place. */
export function humanLine(level: number, right: number, wrong = 0) {
  const stars = starsOf(level, right), world = worldOf(level);
  if (stars === 3) return finaleName(level) ? WORLD[world].finaleLine : ["স্লেট ভরে গেছে, চকের গুঁড়া হাতে।", "খাতার এক পাতা শেষ, পেনসিলের শিস এখনো ধারালো।", "দোকানদার ক্যালকুলেটর খোঁজার আগেই মোট বলে দিয়েছ।"][world];
  if (stars === 2) return world === 2 ? "ফর্দ মিলেছে। দোকানদার একবার চোখ তুলে তাকিয়েছে।" : "হিসাব মিলেছে। আর কয়েকটা হলে পাতা ভরে যেত।";
  if (stars === 1) return wrong >= 3 ? `লেভেল পার, ${bn(right)}টা মিলেছে। ভুলগুলো সময় খেয়েছে।` : `লেভেল পার, ${bn(right)}টা মিলেছে। এবার আরেকটু চটপট।`;
  if (wrong > right) return "তাড়াহুড়োয় ভুল বেশি, ভুলে সময় কাটে। এবার একটু থেমে বলো।";
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

/** "১.৪" seconds, one decimal, Bangla digits. */
export const seconds = (ms: number) => new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.max(0, ms) / 1000);
