// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel } from "./levels";
import { nextStar, possibleScore, starsOf, MAX_SCORE } from "./score";
import { ROUNDS, type Round, type Version } from "./shelf";
import { itemName, type ItemId } from "./items";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** "১.৪" seconds from ms, one decimal. */
export const seconds = (ms: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false, maximumFractionDigits: 1 }).format(Math.max(0.1, Math.round(ms / 100) / 10));

/**
 * A played level: the seed that made its shelves, the score (the friend's own phone's claim), an optional first name, and
 * the shelf generator (`v` 1 for every link made before the rewrite, which carried no `v`; 2 for the new ladder).
 */
export type Shared = { seed: number; level: number; score: number; name: string; v: Version };

/** `#s=<seed>&t=<score>&l=<level>&n=<name>[&v=2]`. Refused unless the level exists and some real run could score that. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "v"] });
  const level = read?.extra.l ?? "", v = read?.extra.v;
  if (!read || !/^[1-9]\d?$/.test(level) || !isLevel(Number(level)) || !possibleScore(read.target)) return null;
  if (v !== undefined && v !== "2") return null;
  return { seed: read.seed, level: Number(level), score: read.target, name: read.name, v: v === "2" ? 2 : 1 };
}

export const sharedHash = ({ seed, level, score, name, v }: Shared) =>
  challengeHash({ seed, target: score, name, extra: v === 2 ? { l: level, v: 2 } : { l: level } });

/** "রাফি লেভেল ৭-এ ৪১০ পেয়েছে" */
export const feat = ({ level, score, name }: Pick<Shared, "level" | "score" | "name">) => `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এ ${bn(score)} পেয়েছে`;
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
/** The game is real time, so a friend's score is their phone's word, said plainly. */
export const friendClaim = (shared: Pick<Shared, "name">) => `একই তিনটা তাক, এবার তোমার পালা। স্কোরটা ${shared.name ? possessive(cleanName(shared.name)) : "বন্ধুর"} নিজের ফোনের।`;

/** "৩টায় ৩টা" */
export const rightOf = (right: number) => `${bn(ROUNDS)}টায় ${bn(right)}টা`;

const names = (ids: readonly ItemId[]) => ids.map(itemName).join(" আর ");

/** The card's human line: by stars, naming what slipped past when the game knows it. */
export function humanLine(right: number, score: number, missed: readonly ItemId[] = []) {
  const stars = starsOf(right, score);
  if (stars === 3) return "তিন তাকেই ঠিক, তাও চটপট। মামা ঘুরে দাঁড়ানোর আগেই উত্তর তৈরি।";
  if (stars === 2) return "তিন তাকেই ঠিক। একটু ভেবে বলেছ, ভুল হয়নি একটাও।";
  if (right === 2) return missed.length ? `তিনটার দুটো ধরেছ। শুধু ${names(missed)} চোখ এড়িয়ে গেছে।` : "তিনটার দুটো ধরেছ। একটা জিনিস তাকের ভিড়ে লুকিয়ে ছিল।";
  return missed.length ? `এবার ${names(missed)} চোখ এড়িয়ে গেছে। আরেকবার তাকটা দেখো।` : "তাকটা এবার একটু বেশি ভরা ছিল। আরেকবার দেখো।";
}

/** The near-miss line, with the exact number. Empty at three stars. */
export function nearLine(right: number, score: number) {
  const next = nextStar(right, score);
  if (!next) return "";
  if ("points" in next) return `আর ${bn(next.points)} পয়েন্ট পেলে ৩ তারা। উত্তরটা একটু আগে দাও।`;
  const stars = starsOf(right, score);
  return stars ? `আর ${bn(next.right)}টা ঠিক হলে ${bn(stars + 1)} তারা।` : `আর ${bn(next.right)}টা ঠিক হলেই লেভেল পার।`;
}

/** The level-clear line: one picture of the shop. */
export const clearLine = (count: number, right: number) => right === ROUNDS
  ? `${bn(count)}টা জিনিসের তাক, তিনবারই ধরে ফেলেছ।`
  : `${bn(count)}টা জিনিসের তাক, তিনবারের দুবার ধরেছ।`;

/** After a friend's level: the higher score wins, and it stays kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine > theirs) return `${possessive(who)} চেয়ে ${bn(mine - theirs)} বেশি!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)} পেয়েছিল।`;
  if (theirs - mine <= 30) return `আর একটু হলেই! মাত্র ${bn(theirs - mine)} কম।`;
  return `${who} এখনো ${bn(theirs - mine)} এগিয়ে। আরেকবার?`;
}

export const caption = (level: number, right: number, score: number) =>
  `‘কোনটা নেই?’ খেলার লেভেল ${bn(level)}-এ ${rightOf(right)} ধরলাম, স্কোর ${bn(score)}। তুমি কয়টা ধরতে পারবে?`;

/** Under the shelf once the shelf is decided: what went, and why your pick wasn't it. */
export function revealLine(round: Round, picks: readonly ItemId[], streak: number) {
  const gone = names(round.gone), wrong = picks.find(id => !round.gone.includes(id));
  if (!wrong) return `ঠিক! মামা ${gone} সরিয়েছিল।${streak >= 2 ? ` টানা ${bn(streak)}টা।` : ""}`;
  const why = round.after.includes(wrong) ? "তো তাকেই আছে" : round.shelf.includes(wrong) ? "তো তাকেই ছিল" : "তাকে ছিলই না";
  return `উঁহু, মামা ${gone} সরিয়েছিল। ${itemName(wrong)} ${why}।`;
}

/** The question's line: the world's ask, or on a finale how many are still to find. */
export const askLine = (worldAsk: string, two: boolean, picked: number) =>
  !two ? worldAsk : picked ? "একটা পেয়েছ। আরেকটা কোনটা নেই?" : "দুটো নেই। দুটোই বাছো।";
