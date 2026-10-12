// Words, score bands and the challenge link. Copy never says "গুলি" alone (the brief: after 2024 that word is raw); the small stick is "কাঠি".
// Server-safe: share.ts (and so the share API) imports this file, so it uses game-core, never React or game-kit.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { LEVEL_COUNT, LEVELS, type Shot } from "./game";

export const HITS = 3;
export const MAX_HIT = 60;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
export const ordinal = (index: number) => ["১ম", "২য়", "৩য়"][index] ?? bn(index + 1);

export type Card = { seed: number; total: number; hits: string[]; name: string; level: number };

const HIT_TOKEN = /^(c|m|60|[1-5]?\d)$/;

/**
 * Reads a challenge link (`s` seed, `t` total, `h` the three hits, `l` the level, `n` name). The hits must add up to the total.
 * Links from before the tournament have no `l` and open level 1, the same field they were played on.
 */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: HITS * MAX_HIT, extraKeys: ["h", "l"] });
  if (!challenge) return null;
  const hits = (challenge.extra.h ?? "").split("-");
  if (hits.length !== HITS || !hits.every(hit => HIT_TOKEN.test(hit))) return null;
  const sum = hits.reduce((count, hit) => count + (/\d/.test(hit) ? Number(hit) : 0), 0);
  if (sum !== challenge.target) return null;
  const rawLevel = challenge.extra.l ?? "1", level = Number(rawLevel);
  if (!/^[1-9]\d?$/.test(rawLevel) || level > LEVEL_COUNT) return null;
  return { seed: challenge.seed, total: challenge.target, hits, name: challenge.name, level };
}

// Level 1 leaves `l` out, so its links stay exactly the old format.
export const cardHash = (card: Card) => challengeHash({ seed: card.seed, target: card.total, name: card.name, extra: { h: card.hits.join("-"), ...(card.level > 1 && { l: card.level }) } });

/** After a level: who won, by how much, and the gap to winning when it was close. */
export function matchLine(total: number, level: number) {
  const { rival, score } = LEVELS[level - 1];
  if (total > score) return `${rival}কে ${bn(total - score)} ডাং-এ হারালে।`;
  if (total === score) return `${rival} আর তুমি সমান, ${bn(score)} ডাং। জিততে আর ১ ডাং লাগত।`;
  return `${rival} জিতল, ${bn(score)} বনাম ${bn(total)}।`;
}

export const hitLabel = (token: string) => token === "c" ? "ক্যাচ" : token === "m" ? "ফসকে" : `${bn(Number(token))} ডাং`;

export type Band = "zero" | "warm" | "good" | "great" | "master";
export function bandOf(total: number): Band {
  if (total <= 0) return "zero";
  if (total < 25) return "warm";
  if (total < 55) return "good";
  if (total < 85) return "great";
  return "master";
}

const lines: Record<Band, string> = {
  zero: "তিনবারই ফসকাল। হলুদ দাগ আসা পর্যন্ত একটু সবুর করো।",
  warm: "হাত সবে গরম হচ্ছে। আরেক দান হোক!",
  good: "ভালোই মেরেছ! পাড়ার মাঠে নাম হবে।",
  great: "জাত খেলোয়াড়! ফিল্ডাররা দৌড়ে হয়রান।",
  master: "মাঠের ওস্তাদ! এমন মার পাড়ায় কেউ ভোলে না।",
};
export const humanLine = (total: number) => lines[bandOf(total)];

/** What the kids on the side shout when a hit ends. */
export function shout(shot: Shot) {
  switch (shot.kind) {
    case "ground": return "দেরি হলো!";
    case "whiff": return "আগেই মারলে!";
    case "caught": return "ক্যাচ! আউট!";
    case "pond": return "পানিতে!";
    case "cow": return "গরুর কাছে!";
    default: return shot.distance >= 25 ? "উড়ে গেল!" : shot.distance >= 12 ? "সাবাশ!" : "চলবে!";
  }
}

/** The sentence a screen reader hears after each hit. */
export function hitNews(shot: Shot) {
  if (shot.kind === "ground") return "দেরি হয়ে গেল, কাঠি মাটিতে পড়েছে। এবার ০ ডাং।";
  if (shot.kind === "whiff") return "একটু আগেই মেরে ফেলেছ, কাঠি তখনো উঠছিল। এবার ০ ডাং।";
  if (shot.kind === "caught") return "ফিল্ডার ধরে ফেলেছে, আউট। এবার ০ ডাং।";
  if (shot.kind === "pond") return `পুকুরে পড়েছে। পাড় পর্যন্ত ${bn(shot.distance)} ডাং।`;
  if (shot.kind === "cow") return `গরুর পায়ের কাছে থামল। ${bn(shot.distance)} ডাং।`;
  return `${shout(shot)} ${bn(shot.distance)} ডাং।`;
}

const who = (name: string) => name || "বন্ধু";

/** Kind comparison after playing a friend's field. */
export function versusLine(mine: number, theirs: number, name: string) {
  const diff = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(who(name))} চেয়ে ${bn(diff)} ডাং বেশি!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${bn(mine)} ডাং।`;
  if (diff <= 5) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(diff)} ডাং কম।`;
  return `${who(name)} এগিয়ে, ${bn(diff)} ডাং। আরেকবার চেষ্টা করো!`;
}

export const friendBanner = (card: Card) => `${card.name || "তোমার বন্ধু"} ${bn(card.total)} ডাং মেরেছে। একই মাঠ, এবার তোমার পালা।`;
export const friendNote = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর`;
export const previewTitle = (card: Card) => `${card.name || "এক বন্ধু"} ${bn(card.total)} ডাং মেরেছে। তুমি পারবে?`;
export const caption = (card: Card) => `ডাংগুলিতে তিন মারে ${bn(card.total)} ডাং! একই মাঠে তুমি কত পারো?`;
