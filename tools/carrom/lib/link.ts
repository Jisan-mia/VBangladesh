// Challenge links, score lines and preview text. Server-safe: share.ts loads this, so it imports only pure modules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge, starsFor } from "../../../shared/game-core";
import { MAX_SOLO, QUEEN_POINTS, STRIKES, type Hand, type Note, type Side } from "./game";
import { LEVEL_COUNT, LEVELS, OLD_BOARDS, type LevelSpec } from "./levels";
import { PER_SIDE } from "./table";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const SIDE_NAME = ["সাদা", "কালো"] as const;
export const SIDE_OF = ["সাদার", "কালোর"] as const;
const HAND_WORD: Record<Hand, string> = { e: "সহজ", n: "মাঝারি", h: "ওস্তাদ" };

/** A finished game, as a link carries it. Physics can differ a hair between phones, so we compare results and never replay them. */
export type Shared =
  | { mode: "level"; level: number; seed: number; strikes: number; name: string; hand?: Hand }
  | { mode: "solo"; seed: number; points: number; queen: boolean; name: string; level?: number }
  | { mode: "duo"; seed: number; points: number; queen: boolean; winner: Side; name: string; other: string };

/** The most strikes a cleared board can have taken: its budget plus the strikes black coins cost on the way. */
const MAX_STRIKES = 60;

/**
 * s = seed, t = points (or strikes for a board), n = name.
 * - A board from the ladder adds c = its number (the seed must be that board's) and d = the difficulty (e, n, h).
 * - দশ চাল adds q=1 when the queen went in, and l = an old board (1–10) for links made before the ladder.
 * - Two players add m=d, w = the winning side (0 white, 1 black) and o = the other player's name.
 * Impossible combinations (more points than pieces, a board number that doesn't match its seed) reject the whole link.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_STRIKES, extraKeys: ["m", "q", "w", "o", "l", "c", "d"] });
  if (!challenge) return null;
  const { seed, target, name, extra } = challenge;
  if (extra.c !== undefined) {
    if (extra.m !== undefined || extra.l !== undefined || extra.q !== undefined) return null;
    const level = /^\d{1,2}$/.test(extra.c) ? Number(extra.c) : 0;
    if (level < 1 || level > LEVEL_COUNT || LEVELS[level - 1].seed !== seed || target < 1) return null;
    const hand = extra.d === "e" || extra.d === "n" || extra.d === "h" ? extra.d : undefined;
    if (extra.d !== undefined && !hand) return null;
    return { mode: "level", level, seed, strikes: target, name, ...(hand ? { hand } : {}) };
  }
  if (target > MAX_SOLO) return null;
  const points = target, queen = extra.q === "1";
  if (queen && points < QUEEN_POINTS) return null;
  if (extra.m === "d") {
    if (extra.w !== "0" && extra.w !== "1") return null;
    if (points - (queen ? QUEEN_POINTS : 0) > PER_SIDE) return null;
    return { mode: "duo", seed, points, queen, winner: Number(extra.w) as Side, name, other: cleanName(extra.o ?? "") };
  }
  if (extra.m !== undefined) return null;
  if (points - (queen ? QUEEN_POINTS : 0) > 2 * PER_SIDE) return null;
  if (extra.l === undefined) return { mode: "solo", seed, points, queen, name };
  const level = /^\d{1,2}$/.test(extra.l) ? Number(extra.l) : 0;
  if (level < 1 || level > OLD_BOARDS.length || OLD_BOARDS[level - 1].seed !== seed) return null;
  return { mode: "solo", seed, points, queen, name, level };
}

export function sharedHash(shared: Shared) {
  const extra: Record<string, string> = {};
  if (shared.mode === "level") {
    extra.c = String(shared.level);
    if (shared.hand) extra.d = shared.hand;
    return challengeHash({ seed: shared.seed, target: shared.strikes, name: shared.name, extra });
  }
  if (shared.mode === "duo") { extra.m = "d"; extra.w = String(shared.winner); }
  if (shared.mode === "solo" && shared.level) extra.l = String(shared.level);
  if (shared.queen) extra.q = "1";
  if (shared.mode === "duo") { const other = cleanName(shared.other); if (other) extra.o = other; }
  return challengeHash({ seed: shared.seed, target: shared.points, name: shared.name, extra });
}

// ---- boards from the ladder ----

/** "বোর্ড ৩ · কোণাকুণি" */
export const levelLabel = (level: number) => `বোর্ড ${bn(level)} · ${LEVELS[level - 1].name}`;
export const handWord = (hand: Hand) => HAND_WORD[hand];

/** Stars for strikes used on a cleared board. */
export const starsForStrikes = (spec: LevelSpec, strikes: number) => strikes <= spec.par ? 3 : strikes <= spec.two ? 2 : 1;

/** The exact gap to the next star, or "" at three. */
export function strikesNear(spec: LevelSpec, strikes: number) {
  if (strikes <= spec.par) return "";
  const goal = strikes <= spec.two ? spec.par : spec.two;
  return `আর ${bn(strikes - goal)} চাল কম হলে ${bn(goal === spec.par ? 3 : 2)} তারা।`;
}

/** The dry line under a board's result. */
export function levelLine(spec: LevelSpec, cleared: boolean, stars: number, left: number) {
  if (!cleared) return left === 1 ? "চাল শেষ, বোর্ডে মাত্র একটা গুটি বাকি।" : `চাল শেষ, বোর্ডে আর ${bn(left)}টা গুটি।`;
  if (spec.boss && stars === 3) return `${spec.boss.who} এবার চুপচাপ তোমার টোকা দেখছে।`;
  if (stars === 3) return "যত চাল লাগার কথা, তার মধ্যেই সাফ।";
  if (stars === 2) return "সাফ। হাত বসে গেছে, আর একটু মাপ বাকি।";
  return "সাফ হয়েছে। এবার কম চালে চেষ্টা করো।";
}

export function compareStrikes(strikes: number, theirs: number, name: string) {
  const who = name || "বন্ধু", gap = theirs - strikes;
  if (gap > 0) return `${possessive(who)} চেয়ে ${bn(gap)} চাল কম!`;
  if (gap === 0) return `একদম সমান! ${who}ও ${bn(theirs)} চালে সাফ করেছে।`;
  return `${who} ${bn(theirs)} চালে পেরেছে, তুমি ${bn(strikes)} চালে। আরেকবার?`;
}

// ---- দশ চাল ----

/** Stars on an old board (a link made before the ladder): 0 below its pass mark. */
export function oldBoardStars(points: number, level: number) {
  const board = OLD_BOARDS[level - 1];
  return !board || points < board.one ? 0 : starsFor(points, board.three, board.two);
}

/** The one near-miss line after দশ চাল on an old board, or a new-best gap. */
export function pointsNear(points: number, level: number, before: number | null) {
  const board = OLD_BOARDS[level - 1];
  if (board) {
    if (points < board.one) return `আর ${bn(board.one - points)} পয়েন্ট হলেই বোর্ড পার।`;
    const next = points < board.two ? board.two : points < board.three ? board.three : 0;
    if (next && next - points <= 3) return `আর ${bn(next - points)} পয়েন্ট হলে ${bn(next === board.two ? 2 : 3)} তারা।`;
  }
  if (before !== null && points <= before && before - points < 2) return `আর ${bn(before - points + 1)} পয়েন্ট হলেই নতুন সেরা।`;
  return "";
}

/** Coins in, counted from points: "৫টা গুটি, কুইন সহ". */
export function piecesLine(points: number, queen: boolean) {
  const coins = points - (queen ? QUEEN_POINTS : 0);
  if (coins === 0) return queen ? "শুধু কুইনটা" : "একটাও না";
  return queen ? `${bn(coins)}টা গুটি, কুইন সহ` : `${bn(coins)}টা গুটি`;
}

export const bands = [
  { below: 1, line: "আজ বোর্ডে পাউডার বেশি পড়েছে মনে হয়। আরেকবার?" },
  { below: 4, line: "হাত খুলছে। পরের বোর্ডে আরও ঢুকবে।" },
  { below: 8, line: "ক্লাবঘরে এমন টোকা দিলে সবাই চুপ করে দেখে।" },
  { below: 13, line: "বোর্ডের চার কোনা আজ তোমার কথা শুনছে।" },
  { below: Infinity, line: "পাড়ার চ্যাম্পিয়ন এবার তোমার টোকা দেখতে চাইবে।" },
] as const;
export const humanLine = (points: number) => bands.find(band => points < band.below)!.line;

export function duoLine(points: number) {
  if (points <= 2) return "হাড্ডাহাড্ডি বোর্ড, শেষ গুটি পর্যন্ত টানটান।";
  if (points >= 8) return "একতরফা বোর্ড। পরেরটায় শোধ নেওয়ার পালা।";
  return "জমজমাট বোর্ড হলো। আরেকটা হয়ে যাক?";
}

/** The name on a two-player card: the typed name, or the colour. */
export const playerName = (side: Side, name: string) => cleanName(name) || SIDE_NAME[side];

export function compareLine(points: number, target: number, name: string) {
  const who = name || "বন্ধু", gap = points - target;
  if (gap > 0) return `${possessive(who)} চেয়ে ${bn(gap)} পয়েন্ট বেশি!`;
  if (gap === 0) return `একদম সমান! ${who}ও ${bn(target)} পয়েন্ট করেছে।`;
  if (-gap <= 2) return `আর একটু হলেই। মাত্র ${bn(-gap)} পয়েন্ট কম।`;
  return `${who} এখনো ${bn(-gap)} পয়েন্ট এগিয়ে। আরেকবার?`;
}

// ---- what a link says ----

export function banner(shared: Shared) {
  if (shared.mode === "level") return `${shared.name || "বন্ধু"} ${levelLabel(shared.level)} সাফ করেছে ${bn(shared.strikes)} চালে। একই বোর্ড, এবার তোমার পালা।`;
  if (shared.mode === "duo") return `${playerName(shared.winner, shared.name)} জিতেছে, ${bn(shared.points)} পয়েন্টে। তোমরাও এক বোর্ড খেলবে?`;
  return `${shared.name || "বন্ধু"} ${bn(STRIKES)} চালে ${bn(shared.points)} পয়েন্ট করেছে। একই বোর্ড, এবার তোমার পালা।`;
}

export function previewTitle(shared: Shared) {
  if (shared.mode === "level") {
    const where = `ক্যারমের বোর্ড ${bn(shared.level)}`;
    return shared.name ? `${shared.name} ${where} সাফ করেছে ${bn(shared.strikes)} চালে। তুমি পারবে?` : `${where}, ${bn(shared.strikes)} চালে সাফ। তুমি পারবে?`;
  }
  if (shared.mode === "duo") return `ক্যারমে ${playerName(shared.winner, shared.name)} জিতেছে, ${bn(shared.points)} পয়েন্টে। তোমরাও খেলবে?`;
  return shared.name ? `${shared.name} ক্যারমে ${bn(shared.points)} পয়েন্ট করেছে। তুমি পারবে?` : `ক্যারমে ${bn(STRIKES)} চালে ${bn(shared.points)} পয়েন্ট! তুমি পারবে?`;
}

export function caption(shared: Shared) {
  if (shared.mode === "level") return `ক্যারমের "${LEVELS[shared.level - 1].name}" বোর্ড ${bn(shared.strikes)} চালে সাফ করলাম। একই বোর্ড তোমার জন্য রাখলাম, দেখি তুমি কয় চালে পারো।`;
  if (shared.mode === "duo") return `এক ফোনে দুজনে ক্যারম খেললাম, বোর্ড গেল ${possessive(playerName(shared.winner, shared.name))} ঘরে, ${bn(shared.points)} পয়েন্টে। তোমরাও এক বোর্ড খেলে দেখো।`;
  return shared.points > 0
    ? `ক্যারমে ${bn(STRIKES)} চালে ${bn(shared.points)} পয়েন্ট করলাম (${piecesLine(shared.points, shared.queen)})। একই বোর্ড তোমার জন্য সাজিয়ে রাখলাম, দেখি কয়টা ঢোকাও।`
    : `ক্যারমে ${bn(STRIKES)} চালে একটাও ঢোকাতে পারিনি। একই বোর্ড তোমার জন্য রাখলাম, দেখি তুমি পারো কি না।`;
}

// ---- rules and the line under the board ----

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
export const LEVEL_RULE = "সাদা গুটি সব ঢোকালে বোর্ড সাফ। কালো ঢুকলে এক চাল কাটা যায়। স্ট্রাইকার গর্তে পড়লে ওই চালের সাদা আর আগের একটা সাদা মাঝে ফেরত।";

/** The line under the board after a strike. */
export function noteText(note: Note, { mode, gained, turn, queenBy, left }: { mode: "level" | "board" | "duo"; gained: number; turn: Side; queenBy: Side | -1; left: number }) {
  const next = `${SIDE_OF[turn]} পালা।`;
  switch (note) {
    case "start": return mode === "duo" ? "সাদা আগে। নিচে টেনে ছাড়ো" : "নিচে টেনে ছাড়ো, নয়তো মারো চাপো";
    case "miss": return mode === "duo" ? `ঢুকল না। ${next}` : "এবার ঢুকল না। নিশানাটা আরেকটু দেখো।";
    case "pocket":
      if (mode === "level") return left ? `ঢুকেছে! আর ${bn(left)}টা।` : "ঢুকেছে!";
      return `ঢুকেছে! +${bn(gained)}`;
    case "queen":
      if (mode === "board") return `কুইন ঢুকেছে! +${bn(gained)}`;
      return "কুইন ঢুকেছে! এবার একটা সাদা ঢোকাও, কভার হবে।";
    case "foul":
      if (mode === "duo") return `ফাউল! স্ট্রাইকার গর্তে, একটা গুটি ফেরত। ${next}`;
      return mode === "level" ? "ফাউল! স্ট্রাইকার গর্তে, একটা সাদা মাঝে ফিরল।" : "ফাউল! স্ট্রাইকার গর্তে, গুটি মাঝে ফিরল।";
    case "cover":
      if (mode === "level") return "কভার! কুইন এখন তোমার।";
      return `কভার! কুইন এখন ${queenBy === -1 ? "" : SIDE_OF[queenBy]}।${queenBy === turn ? " আবার তোমার চাল।" : ` ${next}`}`;
    case "queen-back": return mode === "duo" ? `কভার হলো না, কুইন মাঝে ফিরল। ${next}` : "কভার হলো না, কুইন মাঝে ফিরল।";
    case "last-back": return mode === "duo" ? `কুইনের আগে শেষ গুটি না! গুটিটা মাঝে ফিরল। ${next}` : "কুইনের কভার ছাড়া শেষ সাদা না। গুটিটা মাঝে ফিরল।";
    case "again": return "নিজের গুটি ঢুকেছে, আবার তোমার চাল!";
    case "theirs": return `ওর গুটি ঢুকে গেল। ${next}`;
    case "turn": return `${next} ফোনটা ওকে দাও।`;
    case "black": return "কালো ঢুকেছে, এক চাল কাটা গেল।";
    case "clear": return "বোর্ড সাফ!";
    case "out": return "চাল শেষ।";
    case "won": return "বোর্ড শেষ!";
  }
}
