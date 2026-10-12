// Words, score bands and the challenge link.
// Server-safe: share.ts (and so the share API) imports this file, so it uses game-core, never React or game-kit.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { GHATS, LEVEL_COUNT, type Verdict } from "./game";

export const MAX_SACKS = 999;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
export const sacksLabel = (count: number) => `${bn(count)}টা বস্তা`;

/** What a link carries: the seed (the same swings), the ghat, sacks stacked, "ঠিক মাঝে" drops, the longest run of them, and a name. */
export type Card = { seed: number; sacks: number; perfect: number; streak: number; name: string; level: number };

const COUNT = /^(0|[1-9]\d{0,2})$/;

/**
 * Reads `s`, `t` (sacks), `p` (perfect drops), `c` (longest streak), `l` (the ghat) and `n`. Counts must fit inside each other: c ≤ p ≤ t.
 * Links from before ghats have no `l` and open ghat 1, the same swings they were played on.
 */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SACKS, extraKeys: ["p", "c", "l"] });
  if (!challenge) return null;
  const p = challenge.extra.p ?? "0", c = challenge.extra.c ?? "0";
  if (!COUNT.test(p) || !COUNT.test(c)) return null;
  const perfect = Number(p), streak = Number(c);
  if (perfect > challenge.target || streak > perfect || (perfect > 0) !== (streak > 0)) return null;
  const rawLevel = challenge.extra.l ?? "1", level = Number(rawLevel);
  if (!/^[1-9]\d?$/.test(rawLevel) || level > LEVEL_COUNT) return null;
  return { seed: challenge.seed, sacks: challenge.target, perfect, streak, name: challenge.name, level };
}

// Ghat 1 leaves `l` out, so its links stay exactly the old format.
export const cardHash = (card: Card) => challengeHash({ seed: card.seed, target: card.sacks, name: card.name, extra: { p: card.perfect, c: card.streak, ...(card.level > 1 && { l: card.level }) } });

/** "ঘাট ৩ · নারায়ণগঞ্জ" */
export const ghatLabel = (level: number) => `ঘাট ${bn(level)} · ${GHATS[level - 1].name}`;

export type Band = "zero" | "start" | "good" | "great" | "master";
export function bandOf(sacks: number): Band {
  if (sacks <= 0) return "zero";
  if (sacks < 8) return "start";
  if (sacks < 18) return "good";
  if (sacks < 30) return "great";
  return "master";
}

const lines: Record<Band, string> = {
  zero: "প্রথম বস্তাটাই ফসকাল! দোলটা চিনে নাও, পরেরবার হবে।",
  start: "শুরুটা ভালো। আরেক দানে পাহাড় আরও উঁচু হবে!",
  good: "ভালোই সাজিয়েছ! ঘাটের সবাই তাকিয়ে আছে।",
  great: "পাকা হাত! সর্দার খাতায় তোমার নাম লিখে রাখল।",
  master: "এ তো ওভারলোড ট্রাক! চাকা বসে গেল বলে।",
};
export const humanLine = (sacks: number) => lines[bandOf(sacks)];

/** The shout over the pile when a sack lands. */
export function shout(verdict: Verdict, combo: number) {
  if (verdict === "perfect") return combo >= 2 ? `ঠিক মাঝে! ×${bn(combo)}` : "ঠিক মাঝে!";
  if (verdict === "good") return "বসে গেল!";
  if (verdict === "wide") return "একটু সরে গেল";
  return verdict === "slip" ? "ফসকে গেল!" : "বেশি হেলে গেল!";
}

/** The sentence a screen reader hears after each drop. */
export function dropNews(verdict: Verdict, sacks: number) {
  if (verdict === "perfect") return `ঠিক মাঝে! ${sacksLabel(sacks)}।`;
  if (verdict === "good") return `বসে গেছে। ${sacksLabel(sacks)}।`;
  if (verdict === "wide") return `একটু সরে বসেছে। ${sacksLabel(sacks)}।`;
  return `${missReason(verdict)} খেলা শেষ, ${sacksLabel(sacks)}।`;
}

export const missReason = (verdict: Verdict | null) => verdict === "lean"
  ? "পাহাড় ওলনের দাগ ছেড়ে বেশি হেলে গিয়েছিল, তাই ওপরের বস্তাটা গড়িয়ে গেল।"
  : "বস্তাটা নিচেরটার ওপর অর্ধেকও পড়েনি, তাই গড়িয়ে গেল।";

const who = (name: string) => name || "বন্ধু";

/** Kind comparison after playing a friend's swings. */
export function versusLine(mine: number, theirs: number, name: string) {
  const diff = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(who(name))} চেয়ে ${sacksLabel(diff)} বেশি!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${sacksLabel(mine)}।`;
  if (diff <= 3) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(diff)}টা কম।`;
  return `${who(name)} এগিয়ে, ${sacksLabel(diff)}। আরেকবার চেষ্টা করো!`;
}

export const friendBanner = (card: Card) => `${card.name || "তোমার বন্ধু"} ${card.level > 1 ? `${GHATS[card.level - 1].name} ঘাটে ` : ""}${sacksLabel(card.sacks)} সাজিয়েছে। একই দোল, এবার তোমার পালা।`;
export const friendNote = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর`;
export const previewTitle = (card: Card) => `${card.name || "এক বন্ধু"} ${sacksLabel(card.sacks)} সাজিয়েছে। তুমি পারবে?`;
export const caption = (card: Card) => `বস্তার পাহাড়ে ${sacksLabel(card.sacks)} সাজালাম! একই দোলে তুমি কয়টা পারো?`;
