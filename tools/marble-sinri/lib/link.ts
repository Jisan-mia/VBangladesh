// Challenge links and every line said about a result. Server-safe: share.ts imports this, so it reaches only pure modules.
// Two formats:
//  - old (before the rewrite): `#s=<seed>&t=<steps>&l=<stage 1-8>&m=<marbles>&c=<colour>&n=<name>`, an endless staircase;
//  - new: `#s=<seed>&t=<tenths of a second>&v=2&w=<floor 1-12>&m=<marbles>&h=<falls>&c=<colour>&n=<name>`.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { STAGE_COUNT, STAGES, STAGE_ROWS, stageOf, startRowOf } from "./legacy";
import { isFinale, LEVEL_COUNT, levelOf, MARBLES, WORLDS } from "./levels";

/** The old endless score's ceiling, and the new floor time's (an hour, in tenths). */
export const MAX_SCORE = 9999;
export const MAX_TENTHS = 36000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** Tenths of a second as "১২.৪". */
export const seconds = (tenths: number) => `${bn(Math.floor(tenths / 10))}.${bn(tenths % 10)}`;
export const starsOfFalls = (falls: number) => Math.max(1, 3 - falls);

export type OldCard = { v: 1; seed: number; stage: number; score: number; marbles: number; colour: number; name: string };
export type FloorCard = { v: 2; seed: number; level: number; tenths: number; marbles: number; falls: number; colour: number; name: string };
export type Shared = OldCard | FloorCard;

export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: Math.max(MAX_SCORE, MAX_TENTHS), extraKeys: ["v", "w", "l", "m", "h", "c"] });
  if (!read) return null;
  const { v = "", w = "", l = "", m = "", h = "", c = "" } = read.extra;
  const colour = new RegExp(`^[0-${MARBLES.length - 1}]$`).test(c) ? Number(c) : -1;
  if (colour < 0 || !/^(0|[1-9]\d{0,3})$/.test(m)) return null;
  const marbles = Number(m);
  if (v === "2") {
    if (!/^([1-9]|1[0-2])$/.test(w) || !/^[0-9]$/.test(h) || read.target < 1 || read.target > MAX_TENTHS) return null;
    const level = Number(w);
    if (level > LEVEL_COUNT || marbles > levelOf(level).steps) return null;
    return { v: 2, seed: read.seed, level, tenths: read.target, marbles, falls: Number(h), colour, name: read.name };
  }
  // The old format, checked exactly as before the rewrite. One marble sits on a row at most, so m ≤ t.
  if (v !== "" || !new RegExp(`^[1-${STAGE_COUNT}]$`).test(l) || read.target > MAX_SCORE || marbles > read.target) return null;
  return { v: 1, seed: read.seed, stage: Number(l), score: read.target, marbles, colour, name: read.name };
}

export function sharedHash(card: Shared) {
  if (card.v === 1) return challengeHash({ seed: card.seed, target: card.score, name: card.name, extra: { l: card.stage, m: card.marbles, c: card.colour } });
  return challengeHash({ seed: card.seed, target: card.tenths, name: card.name, extra: { v: 2, w: card.level, m: card.marbles, h: card.falls, c: card.colour } });
}

export const floorName = (level: number) => levelOf(level).name;
export const floorLabel = (level: number) => `তলা ${bn(level)} · ${floorName(level)}`;
export const worldName = (level: number) => WORLDS[levelOf(level).world].name;

// ---- the old endless stairs ----
/** 0-based old stage the marble got down to. */
export const reachedStage = (score: number, start: number) => stageOf(startRowOf(start) + score);
export const stageName = (index: number) => STAGES[Math.max(0, Math.min(STAGE_COUNT - 1, index))].name;
const OLD_LINES = [
  "ছাদের রেলিং থেকে নামা শুরু। কাচের গায়ে এখনো রোদ।",
  "চিলেকোঠার পাশ দিয়ে টুপটুপ করে নামছে।",
  "সিঁড়িঘরের আধো-অন্ধকারেও মার্বেল পথ হারায়নি।",
  "চারতলা পেরিয়ে গেছে, নিচ থেকে রান্নার গন্ধ আসছে।",
  "দোতলায় নেমে এসেছে, গলির হইচই এখন শোনা যায়।",
  "পাশের বাড়ির বাঁশের ভারায় ঠকঠক করে নামছে।",
  "মাচার তক্তা পার, মিস্ত্রিরাও কাজ থামিয়ে দেখছে।",
  "গলির ড্রেনের তক্তা পর্যন্ত নেমে এসেছে।",
] as const;
export const oldLine = (score: number, start: number) => OLD_LINES[reachedStage(score, start)];
/** Steps the old stairs had left to the next old stage, for the near-miss line. */
export const toNextStage = (score: number, start: number) => {
  const row = startRowOf(start) + score, index = Math.floor(row / STAGE_ROWS);
  return index < STAGE_COUNT ? (index + 1) * STAGE_ROWS - row : Infinity;
};

// ---- the new floors ----
const FLOOR_LINES = [
  "ছাদের কার্নিশ থেকে টুপ করে নিচের তাকে।",
  "কার্নিশে পড়ে থাকা মার্বেলগুলোও পকেটে।",
  "টবের ক্যাকটাস ছুঁয়েও দেখেনি।",
  "দড়ির কাপড় উড়ছিল, মার্বেল পথ হারায়নি।",
  "মোছা সিঁড়িতেও পা পিছলায়নি।",
  "রেলিং বেয়ে সাঁই করে নেমে এসেছে।",
  "ফাটা ধাপ ভাঙার আগেই সরে গেছে।",
  "লোডশেডিংয়ের অন্ধকারে হারিকেনের আলোয় নেমেছে।",
  "গোল বাঁশের মাথাতেও ঠিক থেমেছে।",
  "তক্তার ফাঁক দিয়ে টুপ করে নিচে।",
  "সিঁড়ির তাড়ার সাথে তাল রেখেছে।",
  "ছাদ থেকে গলি, পুরো বাড়ি পার। মার্বেল এখন বন্ধুদের গর্তে।",
] as const;
export const floorLine = (level: number) => FLOOR_LINES[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];

const who = (name: string) => name || "বন্ধু";

/** After a friend's floor (time, lower is better) or old stairs (steps, higher is better): kind either way. */
export function compareLine(mine: Shared, theirs: Shared) {
  if (mine.v === 1 && theirs.v === 1) {
    const gap = Math.abs(mine.score - theirs.score);
    if (mine.score > theirs.score) return `${possessive(who(theirs.name))} চেয়ে ${bn(gap)} ধাপ বেশি।`;
    if (mine.score === theirs.score) return `সমান সমান, দুজনেই ${bn(mine.score)} ধাপ।`;
    if (gap <= 5) return `আর একটু হলেই! ${possessive(who(theirs.name))} চেয়ে মাত্র ${bn(gap)} ধাপ কম।`;
    return `${who(theirs.name)} এগিয়ে, ${bn(gap)} ধাপ। আরেকবার গড়াও।`;
  }
  if (mine.v === 2 && theirs.v === 2) {
    const gap = Math.abs(mine.tenths - theirs.tenths), mineStars = starsOfFalls(mine.falls), theirStars = starsOfFalls(theirs.falls);
    if (mineStars !== theirStars) return mineStars > theirStars ? `${possessive(who(theirs.name))} চেয়ে বেশি তারা: ${bn(mineStars)} বনাম ${bn(theirStars)}।` : `${who(theirs.name)} ${bn(theirStars)} তারা পেয়েছে, তুমি ${bn(mineStars)}। কম পড়লেই ধরে ফেলবে।`;
    if (gap === 0) return `সমান সমান, দুজনেই ${seconds(mine.tenths)} সেকেন্ড।`;
    if (mine.tenths < theirs.tenths) return `${possessive(who(theirs.name))} চেয়ে ${seconds(gap)} সেকেন্ড আগে নেমেছ।`;
    return `${who(theirs.name)} ${seconds(gap)} সেকেন্ড আগে নেমেছে। আরেকবার গড়াও।`;
  }
  return "";
}

export function friendBanner(card: Shared) {
  if (card.v === 1) return `${card.name || "তোমার বন্ধু"} ${bn(card.score)} ধাপ নেমেছে। একই সিঁড়ি, এবার তোমার পালা।`;
  return `${card.name || "তোমার বন্ধু"} ${floorName(card.level)} পার করেছে ${seconds(card.tenths)} সেকেন্ডে, ${bn(starsOfFalls(card.falls))} তারায়। একই সিঁড়ি, এবার তোমার পালা।`;
}
export function friendNote(card: Shared) {
  if (card.v === 1) return `${possessive(who(card.name))} নিজের ফোনের স্কোর · পুরোনো সিঁড়ি, শুরু ${stageName(card.stage - 1)} থেকে`;
  return `${possessive(who(card.name))} নিজের ফোনের হিসাব · ${floorLabel(card.level)}`;
}
export function previewTitle(card: Shared) {
  if (card.v === 1) return `${card.name || "এক বন্ধু"} মার্বেল গড়িয়ে ${bn(card.score)} ধাপ নেমেছে। তুমি পারবে?`;
  return `${card.name || "এক বন্ধু"} মার্বেল গড়িয়ে ${floorName(card.level)} পার করেছে ${seconds(card.tenths)} সেকেন্ডে। তুমি পারবে?`;
}
export function caption(card: Shared) {
  if (card.v === 1) {
    const picked = card.marbles ? ` পথে ${bn(card.marbles)}টা মার্বেল কুড়িয়েছি।` : "";
    return `মার্বেল-সিঁড়িতে ${bn(card.score)} ধাপ নামলাম, ${stageName(reachedStage(card.score, card.stage))} পর্যন্ত।${picked} তুমি কত ধাপ পারবে?`;
  }
  const whole = card.level === LEVEL_COUNT ? " ছাদ থেকে গলি, পুরো বাড়ি।" : "";
  return `মার্বেল-সিঁড়িতে ${floorName(card.level)} পার করলাম ${seconds(card.tenths)} সেকেন্ডে, ${bn(starsOfFalls(card.falls))} তারায়।${whole} তুমি কত তাড়াতাড়ি নামবে?`;
}

/** After a floor: the closest thing within reach, with the exact number. */
export function nearMiss({ won, falls, left, tenths, best, level }: { won: boolean; falls: number; left: number; tenths: number; best: number | null; level: number }) {
  if (!won) return left > 0 ? `আর ${bn(left)} ধাপ নামলেই ${isFinale(level) ? floorName(level) : "এই তলা"} পার।` : "";
  if (falls === 1) return "একবারও না পড়লে ★★★।";
  if (falls > 1) return `${bn(falls)} বার পড়েছ। একবার কম পড়লেই ★★।`;
  if (best !== null && best < tenths && tenths - best <= 30) return `নিজের সেরা ${seconds(best)} সেকেন্ড। আর ${seconds(tenths - best)} সেকেন্ড আগে নামলেই।`;
  return "";
}
/** After an old link's stairs. */
export function oldNearMiss(score: number, start: number, best: number | null) {
  const toStage = toNextStage(score, start), toBest = best !== null && best >= score ? best - score + 1 : Infinity;
  if (Math.min(toStage, toBest) > 8) return "";
  return toBest <= toStage ? `আর ${bn(toBest)} ধাপ নামলে নতুন রেকর্ড।` : `আর ${bn(toStage)} ধাপ নামলে ${stageName(Math.floor((startRowOf(start) + score) / STAGE_ROWS))} পার।`;
}
