// Words, the result card's data and the challenge link. Server-safe: share.ts imports this, so it uses game-core, never React or game-kit.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { HITS_MAX, starsOf } from "./game";
import { LEVEL_COUNT, STORM_CLEAR, isStorm, worldOf } from "./levels";
import { SUN_POINTS, makeWave } from "./wave";

const whole = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => whole.format(value);

/** One finished wave: `c` clouds popped (the storm counts 5), `r` রোদ caught, `h` times wet (3 means soaked). */
export type Card = { seed: number; level: number; score: number; popped: number; suns: number; hits: number; name: string };

/** Reads a link: `s` seed, `t` score, `l` wave, `c` popped, `r` রোদ, `h` hits, `n` name. Every number is checked against that seed's own sky. */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: 9999, extraKeys: ["l", "c", "r", "h"] });
  if (!challenge) return null;
  const { l = "", c = "0", r = "0", h = "0" } = challenge.extra;
  if (!/^[1-9]\d?$/.test(l) || Number(l) > LEVEL_COUNT || !/^(0|[1-9]\d?)$/.test(c) || !/^(0|[1-9]\d?)$/.test(r) || !/^[0-3]$/.test(h)) return null;
  const level = Number(l), popped = Number(c), suns = Number(r), hits = Number(h);
  const wave = makeWave(challenge.seed, level);
  if (popped > wave.total || suns > wave.suns || challenge.target > wave.maxScore || challenge.target < suns * SUN_POINTS) return null;
  return { seed: challenge.seed, level, score: challenge.target, popped, suns, hits, name: challenge.name };
}

export const cardHash = (card: Card) => challengeHash({ seed: card.seed, target: card.score, name: card.name, extra: { l: card.level, c: card.popped, r: card.suns, h: card.hits } });

export const cardStars = (card: Card) => starsOf(makeWave(card.seed, card.level), card.popped, card.hits);
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${isStorm(level) ? "কালবৈশাখী" : worldOf(level).name}`;
export const clearLine = (level: number) => (isStorm(level) ? STORM_CLEAR : worldOf(level).clear);

/** The human line on the card, from how the wave went. */
export function humanLine(card: Card, goal: number) {
  if (card.hits >= HITS_MAX) return "তিনবার ভিজে প্লেন নেতিয়ে পড়ল। নতুন পাতা ছিঁড়ে আবার ভাঁজ দাও।";
  const enough = card.popped >= goal;
  if (!card.hits && enough) return isStorm(card.level) ? "কালবৈশাখী পার, প্লেনে একফোঁটা পানিও লাগেনি।" : "একফোঁটা পানিও লাগেনি। খাতার পাতা এখনো খড়খড়ে।";
  if (!card.hits) return "গায়ে একফোঁটাও পড়েনি, তবে কয়েকটা মেঘ পালিয়ে গেল।";
  if (enough) return "মেঘ ঠিকই ফাটল, ডানায় শুধু দুই-এক ফোঁটা পানির দাগ।";
  return "ভিজে ভিজেও পার হলো। কাগজটা একটু নরম হয়ে গেছে।";
}

/** The exact gap to the next star, or to clearing. */
export function nearLine(card: Card, goal: number, left: number) {
  if (card.hits >= HITS_MAX) return left > 0 ? `লেভেল শেষ হতে আর ${bn(left)} সেকেন্ড বাকি ছিল।` : "";
  const missing = goal - card.popped;
  if (missing > 0) return `আর ${bn(missing)}টা মেঘ ফাটালে আরেকটা তারা।`;
  if (card.hits) return `একবারও না ভিজলে ৩ তারা। এবার ভিজেছ ${bn(card.hits)} বার।`;
  return "";
}

const who = (name: string) => name || "বন্ধু";

/** A kind comparison after playing a friend's sky. */
export function versusLine(mine: number, theirs: number, name: string) {
  const gap = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(who(name))} চেয়ে ${bn(gap)} পয়েন্ট বেশি!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${bn(mine)} পয়েন্ট।`;
  if (gap <= 40) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(gap)} পয়েন্ট কম।`;
  return `${who(name)} এগিয়ে, ${bn(gap)} পয়েন্ট। আরেকবার ওড়াও।`;
}

export const friendBanner = (card: Card) => `${card.name || "তোমার বন্ধু"} লেভেল ${bn(card.level)}-এ ${bn(card.score)} পয়েন্ট করেছে। একই আকাশ, একই মেঘ, এবার তোমার পালা।`;
export const friendNote = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর · ${levelLabel(card.level)}`;
export const previewTitle = (card: Card) => `${card.name || "এক বন্ধু"} কাগজের প্লেনে ${bn(card.score)} পয়েন্ট করেছে। তুমি পারবে?`;
export function caption(card: Card) {
  const dry = card.hits === 0 ? "একবারও ভিজিনি" : card.hits >= HITS_MAX ? "শেষে ভিজে গেছি" : `ভিজেছি ${bn(card.hits)} বার`;
  return `কাগজের প্লেনে লেভেল ${bn(card.level)}, ${bn(card.score)} পয়েন্ট, ${dry}। তোমার প্লেন শুকনো থাকবে?`;
}
