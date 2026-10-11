// Challenge links, score lines and preview text. Server-safe: share.ts loads this, so it imports only pure modules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { MAX_DUO, MAX_SOLO, PER_SIDE, QUEEN_POINTS, STRIKES, type Note, type Side } from "./rules";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const SIDE_NAME = ["সাদা", "কালো"] as const;
export const SIDE_OF = ["সাদার", "কালোর"] as const;

/** A finished game, as a link carries it. Physics differs a hair between phones, so we compare results and never replay them. */
export type Shared =
  | { mode: "solo"; seed: number; points: number; queen: boolean; name: string }
  | { mode: "duo"; seed: number; points: number; queen: boolean; winner: Side; name: string; other: string };

/**
 * s = seed, t = points, q=1 when the queen went in, n = name.
 * Two players add m=d, w = the winning side (0 white, 1 black) and o = the other player's name.
 * Impossible combinations (more points than pieces) reject the whole link.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SOLO, extraKeys: ["m", "q", "w", "o"] });
  if (!challenge) return null;
  const { seed, target: points, name, extra } = challenge;
  const queen = extra.q === "1";
  if (queen && points < QUEEN_POINTS) return null;
  if (extra.m === "d") {
    if (extra.w !== "0" && extra.w !== "1") return null;
    if (points - (queen ? QUEEN_POINTS : 0) > PER_SIDE) return null;
    return { mode: "duo", seed, points, queen, winner: Number(extra.w) as Side, name, other: cleanName(extra.o ?? "") };
  }
  if (extra.m !== undefined) return null;
  if (points - (queen ? QUEEN_POINTS : 0) > 2 * PER_SIDE) return null;
  return { mode: "solo", seed, points, queen, name };
}

export function sharedHash(shared: Shared) {
  const extra: Record<string, string> = {};
  if (shared.mode === "duo") { extra.m = "d"; extra.w = String(shared.winner); }
  if (shared.queen) extra.q = "1";
  if (shared.mode === "duo") { const other = cleanName(shared.other); if (other) extra.o = other; }
  return challengeHash({ seed: shared.seed, target: shared.points, name: shared.name, extra });
}

/** Coins in, counted from points: "৫টা গুটি, কুইন সহ". */
export function piecesLine(points: number, queen: boolean) {
  const coins = points - (queen ? QUEEN_POINTS : 0);
  if (coins === 0) return queen ? "শুধু কুইনটা" : "একটাও না";
  return queen ? `${bn(coins)}টা গুটি, কুইন সহ` : `${bn(coins)}টা গুটি`;
}

export const bands = [
  { below: 1, line: "আজ বোর্ডে পাউডার বেশি পড়েছে মনে হয়! আরেকবার?" },
  { below: 4, line: "হাত খুলছে। পরের বোর্ডে আরও ঢুকবে।" },
  { below: 8, line: "ক্লাবঘরে এমন টোকা দিলে সবাই চুপ করে দেখে।" },
  { below: 13, line: "বোর্ডের চার কোনা আজ তোমার কথা শুনছে।" },
  { below: Infinity, line: "পাড়ার চ্যাম্পিয়নও আজ তোমার কাছে টোকা শিখতে চাইবে!" },
] as const;
export const humanLine = (points: number) => bands.find(band => points < band.below)!.line;

export function duoLine(points: number) {
  if (points <= 2) return "হাড্ডাহাড্ডি বোর্ড! শেষ গুটি পর্যন্ত টানটান।";
  if (points >= 8) return "একতরফা বোর্ড! পরেরটায় শোধ নেওয়ার পালা।";
  return "জমজমাট বোর্ড হলো। আরেকটা হয়ে যাক?";
}

/** The name on a two-player card: the typed name, or the colour. */
export const playerName = (side: Side, name: string) => cleanName(name) || SIDE_NAME[side];

export function compareLine(points: number, target: number, name: string) {
  const who = name || "বন্ধু", gap = points - target;
  if (gap > 0) return `${possessive(who)} চেয়ে ${bn(gap)} পয়েন্ট বেশি!`;
  if (gap === 0) return `একদম সমান! ${who}ও ${bn(target)} পয়েন্ট করেছে।`;
  if (-gap <= 2) return `আর একটু হলেই! মাত্র ${bn(-gap)} পয়েন্ট কম।`;
  return `${who} এখনো ${bn(-gap)} পয়েন্ট এগিয়ে। আরেকবার?`;
}

export function banner(shared: Shared) {
  if (shared.mode === "duo") return `${playerName(shared.winner, shared.name)} জিতেছে, ${bn(shared.points)} পয়েন্টে। তোমরাও এক বোর্ড খেলবে?`;
  return `${shared.name || "বন্ধু"} ${bn(STRIKES)} চালে ${bn(shared.points)} পয়েন্ট করেছে। একই বোর্ড, এবার তোমার পালা।`;
}

export function previewTitle(shared: Shared) {
  if (shared.mode === "duo") return `ক্যারমে ${playerName(shared.winner, shared.name)} জিতেছে, ${bn(shared.points)} পয়েন্টে। তোমরাও খেলবে?`;
  return shared.name ? `${shared.name} ক্যারমে ${bn(shared.points)} পয়েন্ট করেছে। তুমি পারবে?` : `ক্যারমে ${bn(STRIKES)} চালে ${bn(shared.points)} পয়েন্ট! তুমি পারবে?`;
}

export function caption(shared: Shared) {
  if (shared.mode === "duo") return `এক ফোনে দুজনে ক্যারম খেললাম, বোর্ড গেল ${possessive(playerName(shared.winner, shared.name))} ঘরে, ${bn(shared.points)} পয়েন্টে! তোমরাও এক বোর্ড খেলে দেখো।`;
  return shared.points > 0
    ? `ক্যারমে ${bn(STRIKES)} চালে ${bn(shared.points)} পয়েন্ট করলাম (${piecesLine(shared.points, shared.queen)})! একই বোর্ড তোমার জন্য সাজিয়ে রাখলাম, দেখি কয়টা ঢোকাও।`
    : `ক্যারমে ${bn(STRIKES)} চালে একটাও ঢোকাতে পারিনি! একই বোর্ড তোমার জন্য রাখলাম, দেখি তুমি পারো কি না।`;
}

/** "আমাদের নিয়ম": the house rules settleDuo() implements, in the order a new player needs them. */
export const RULES = [
  "সাদা আগে মারে। নিজের রঙের গুটি ঢুকলে আবার তোমার চাল।",
  "কুইন (লাল) যেকোনো সময় ঢোকানো যায়। তবে একই চালে বা পরের চালে নিজের একটা গুটি ঢুকিয়ে কভার করতে হবে, নইলে কুইন মাঝে ফেরত।",
  "স্ট্রাইকার গর্তে পড়লে ফাউল: পালা শেষ, আর তোমার ঢোকানো একটা গুটি মাঝে ফেরত। ঢোকানো গুটি না থাকলে পরে যেটা ঢোকাবে, সেটা ফেরত যাবে।",
  "অন্যের রঙের গুটি ঢোকালে সেটা ওর ঘরেই যায়, তোমার পালা শেষ।",
  "কুইন কভার হওয়ার আগে কারও শেষ গুটি ঢুকলে সেটা মাঝে ফেরত আসে।",
  "যার নয়টা গুটি আগে শেষ, বোর্ড তার। পয়েন্ট: অন্যজনের বাকি গুটি, আর কুইন কভার করলে আরও ৩।",
] as const;
export const SOLO_RULE = "১০ চালে যত পারো ঢোকাও। প্রতি গুটি ১, কুইন ৩ পয়েন্ট। স্ট্রাইকার গর্তে পড়লে ওই চালের গুটি আর আগের একটা গুটি মাঝে ফেরত।";

/** The line under the board after a strike. */
export function noteText(note: Note, { mode, gained, turn, queenBy }: { mode: "solo" | "duo"; gained: number; turn: Side; queenBy: Side | -1 }) {
  const next = `${SIDE_OF[turn]} পালা।`;
  switch (note) {
    case "start": return mode === "solo" ? "স্ট্রাইকার থেকে নিচে টেনে ছাড়ো" : "সাদা আগে। স্ট্রাইকার থেকে নিচে টেনে ছাড়ো";
    case "miss": return mode === "solo" ? "এবার ঢুকল না। পরের চালে হবে।" : `ঢুকল না। ${next}`;
    case "pocket": return `দারুণ! +${bn(gained)}`;
    case "queen": return mode === "solo" ? `কুইন ঢুকেছে! +${bn(gained)}` : "কুইন ঢুকেছে! এবার নিজের একটা গুটি ঢুকিয়ে কভার করো।";
    case "foul": return mode === "solo" ? "ফাউল! স্ট্রাইকার গর্তে, গুটি মাঝে ফিরল।" : `ফাউল! স্ট্রাইকার গর্তে, একটা গুটি ফেরত। ${next}`;
    case "cover": return `কভার! কুইন এখন ${queenBy === -1 ? "" : SIDE_OF[queenBy]}।${queenBy === turn ? " আবার তোমার চাল।" : ` ${next}`}`;
    case "queen-back": return `কভার হলো না, কুইন মাঝে ফিরল। ${next}`;
    case "last-back": return `কুইনের আগে শেষ গুটি না! গুটিটা মাঝে ফিরল। ${next}`;
    case "again": return "নিজের গুটি ঢুকেছে, আবার তোমার চাল!";
    case "theirs": return `ওর গুটি ঢুকে গেল! ${next}`;
    case "turn": return `${next} ফোনটা ওকে দাও।`;
    case "won": return "বোর্ড শেষ!";
  }
}
