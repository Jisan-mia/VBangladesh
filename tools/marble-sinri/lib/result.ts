// Words, near misses and the challenge link. Server-safe: share.ts imports this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { MARBLES, STAGE_COUNT, STAGE_ROWS, STAGES, stageOf, startRowOf } from "./game";

export const MAX_SCORE = 9999;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A finished run as the player reports it. The run is real-time, so the score is their phone's word. */
export type Card = { seed: number; stage: number; score: number; marbles: number; colour: number; name: string };

/** `#s=<seed>&t=<steps>&l=<starting stage>&m=<marbles>&c=<colour>&n=<name>`. One marble sits on a row at most, so m ≤ t. */
export function parseCard(hash: string): Card | null {
  const read = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "m", "c"] });
  if (!read) return null;
  const { l = "", m = "", c = "" } = read.extra;
  if (!new RegExp(`^[1-${STAGE_COUNT}]$`).test(l) || !/^(0|[1-9]\d{0,3})$/.test(m) || !new RegExp(`^[0-${MARBLES.length - 1}]$`).test(c)) return null;
  const marbles = Number(m);
  if (marbles > read.target) return null;
  return { seed: read.seed, stage: Number(l), score: read.target, marbles, colour: Number(c), name: read.name };
}

export const cardHash = (card: Card) => challengeHash({ seed: card.seed, target: card.score, name: card.name, extra: { l: card.stage, m: card.marbles, c: card.colour } });

/** 0-based stage the marble got down to. */
export const reachedStage = (score: number, start: number) => stageOf(startRowOf(start) + score);
export const stageName = (index: number) => STAGES[Math.max(0, Math.min(STAGE_COUNT - 1, index))].name;

const LINES = [
  "ছাদের রেলিং থেকে নামা শুরু। কাচের গায়ে এখনো রোদ।",
  "চিলেকোঠার পাশ দিয়ে টুপটুপ করে নামছে।",
  "সিঁড়িঘরের আধো-অন্ধকারেও মার্বেল পথ হারায়নি।",
  "চারতলা পেরিয়ে গেছে, নিচ থেকে রান্নার গন্ধ আসছে।",
  "দোতলায় নেমে এসেছে, গলির হইচই এখন শোনা যায়।",
  "পাশের বাড়ির বাঁশের ভারায় ঠকঠক করে নামছে।",
  "মাচার তক্তা পার, মিস্ত্রিরাও কাজ থামিয়ে দেখছে।",
  "গলির ড্রেনের তক্তা পর্যন্ত নেমে এসেছে।",
] as const;
/** The card's line, seen by friends: where the marble got to. */
export const humanLine = (score: number, start: number) => LINES[reachedStage(score, start)];

/** After a run: the closest thing within reach, with the exact number. */
export function nearLine({ score, start, best, cleared }: { score: number; start: number; best: number | null; cleared: ReadonlyArray<{ stage: number; stars: number }> }) {
  const row = startRowOf(start) + score, index = Math.floor(row / STAGE_ROWS);
  const toStage = index < STAGE_COUNT ? (index + 1) * STAGE_ROWS - row : Infinity;
  const toBest = best !== null && best >= score ? best - score + 1 : Infinity;
  if (Math.min(toStage, toBest) <= 8) return toBest <= toStage ? `আর ${bn(toBest)} ধাপ নামলে নতুন রেকর্ড।` : `আর ${bn(toStage)} ধাপ নামলে ${stageName(index)} পার।`;
  const last = cleared[cleared.length - 1];
  if (last && last.stars < 3) return `${stageName(last.stage - 1)} পার হলো ${bn(last.stars)} তারায়। একবারও না পড়লে ৩ তারা।`;
  return "";
}

const who = (name: string) => name || "বন্ধু";

/** After a friend's stairs: kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const gap = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(who(name))} চেয়ে ${bn(gap)} ধাপ বেশি!`;
  if (mine === theirs) return `সমান সমান! দুজনেই ${bn(mine)} ধাপ।`;
  if (gap <= 5) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(gap)} ধাপ কম।`;
  return `${who(name)} এগিয়ে, ${bn(gap)} ধাপ। আরেকবার গড়াও!`;
}

export const friendBanner = (card: Card) => `${card.name || "তোমার বন্ধু"} ${bn(card.score)} ধাপ নেমেছে। একই সিঁড়ি, এবার তোমার পালা।`;
export const friendNote = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর · শুরু ${stageName(card.stage - 1)} থেকে`;
export const previewTitle = (card: Card) => `${card.name || "এক বন্ধু"} মার্বেল গড়িয়ে ${bn(card.score)} ধাপ নেমেছে। তুমি পারবে?`;
export function caption(card: Card) {
  const picked = card.marbles ? ` পথে ${bn(card.marbles)}টা মার্বেল কুড়িয়েছি।` : "";
  return `মার্বেল-সিঁড়িতে ${bn(card.score)} ধাপ নামলাম, ${stageName(reachedStage(card.score, card.stage))} পর্যন্ত।${picked} তুমি কত ধাপ পারবে?`;
}
