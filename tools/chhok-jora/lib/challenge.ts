// Challenge links, names and every line of shared text. Server-safe: share.ts loads this, so it reaches only game-core,
// quilt.ts and levels.ts.
//
// Link formats (all after #):
// - the old ones, still written for the same games: `s t l m o n`, with `l` 0 (two people on 4×4), 1 (সহজ, now level 5) or
//   2 (কঠিন, now level 8);
// - a ladder level: `s t q m n`, `q` the level (never a lesson);
// - two people on another cloth: `s t l=0 z m o n`, `z` 3 or 5.
// `t` is the first player's flowers. The moves are replayed and every bot stitch re-checked, so the score is proven.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { replay, totalPoints, type Game } from "./quilt";
import { isLesson, legacyOf, levelOf, pairSetup, LEGACY_LEVELS, LEVEL_COUNT, type PairSize } from "./levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** One character per stitch. The old 40 (a 4×4 cloth) are the start of these 62, so old links decode the same. */
const MOVE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const encodeMoves = (moves: readonly number[]) => moves.map(edge => MOVE_CHARS[edge]).join("");
export function decodeMoves(text: string) {
  if (!/^[0-9a-zA-Z]{1,80}$/.test(text)) return null;
  return [...text].map(char => MOVE_CHARS.indexOf(char));
}

/** A finished quilt from a link or this game. `level` 0 is two people (on `size`). */
export type Shared = { level: number; size: PairSize; name: string; other: string; game: Game };

export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: 60, extraKeys: ["l", "q", "m", "o", "z"] });
  if (!challenge) return null;
  const { l, q, m, o, z } = challenge.extra;
  let level: number, size: PairSize = 4;
  if (q !== undefined) {
    if (l !== undefined || !/^[1-9]\d?$/.test(q)) return null;
    level = Number(q);
    if (level > LEVEL_COUNT || isLesson(level)) return null;
  } else if (l === "1" || l === "2") level = LEGACY_LEVELS[l === "1" ? 1 : 2];
  else if (l === "0") {
    level = 0;
    if (z !== undefined) { if (z !== "3" && z !== "5") return null; size = Number(z) as PairSize; }
  } else return null;
  if (level && z !== undefined) return null;
  const moves = decodeMoves(m ?? "");
  const setup = level ? levelOf(level)!.setup : pairSetup(size);
  if (!moves) return null;
  const game = replay(challenge.seed, setup, moves);
  if (!game?.over || game.score[0] !== challenge.target) return null;
  return { level, size, name: challenge.name, other: level === 0 ? cleanName(o ?? "") : "", game };
}

export function sharedHash({ level, size, name, other, game }: Shared) {
  const old = legacyOf(level);
  const extra: Record<string, string> = level === 0 ? { l: "0" } : old ? { l: String(old) } : { q: String(level) };
  if (level === 0 && size !== 4) extra.z = String(size);
  extra.m = encodeMoves(game.moves);
  const second = cleanName(other);
  if (level === 0 && second) extra.o = second;
  return challengeHash({ seed: game.seed, target: game.score[0], name, extra });
}

/** Who sewed against you on this level ("" for two people). */
export const rivalOf = (level: number) => levelOf(level)?.rival ?? "";

/** Names while playing: "তুমি" and the rival, or the two thread colours until people type their names. */
export function playNames(level: number, names: readonly [string, string]): [string, string] {
  const [first, second] = names.map(cleanName);
  return level ? [first || "তুমি", rivalOf(level)] : [first || "লাল সুতো", second || "নীল সুতো"];
}
/** Names on a card or preview, seen by others: "আমি" instead of "তুমি". */
export function cardNames(level: number, name: string, other: string): [string, string] {
  return level ? [cleanName(name) || "আমি", rivalOf(level)] : [cleanName(name) || "লাল সুতো", cleanName(other) || "নীল সুতো"];
}

const graphemes = new Intl.Segmenter("bn", { granularity: "grapheme" });
function initial(name: string) {
  const parts = [...graphemes.segment(name)].map(part => part.segment);
  // Older segmenters split a conjunct after the hasanta (ক্ + ষ); keep the pair together.
  const first = parts[0]?.endsWith("্") ? parts[0] + (parts[1] ?? "") : parts[0] ?? "";
  return first.toLocaleUpperCase("en");
}
/** The letter stitched in each motif's heart, so colour is never the only sign of whose box it is. Same letter for both: ১ and ২. */
export function initials(names: readonly [string, string]): [string, string] {
  const pair: [string, string] = [initial(names[0]), initial(names[1])];
  return pair[0] && pair[1] && pair[0] !== pair[1] ? pair : ["১", "২"];
}

/** "রাফি ১১ — মিম ৫" */
export const scoreLine = (names: readonly [string, string], score: readonly [number, number]) => `${names[0]} ${bn(score[0])} — ${names[1]} ${bn(score[1])}`;

/** The kind line on the card and the finish screen, by how the flowers split. Never says anyone did badly. */
export function humanLine(level: number, score: readonly [number, number], names: readonly [string, string], total: number) {
  const [mine, theirs] = score;
  if (mine === theirs) return "আধাআধি ফুল, কাঁথা সমান সমান!";
  if (level) {
    const rival = names[1];
    if (theirs <= total / 8) return `${rival} প্রায় একটা ফুলও ফোটাতে পারেনি!`;
    if (mine > theirs) return mine - theirs <= 2 ? "শেষ ঘর পর্যন্ত লড়াই, কাঁথা তোমার।" : "সুঁই-সুতোয় হাত পাকা।";
    if (theirs - mine <= 2) return `এক-দুই ঘরের জন্য ${rival} এগিয়ে গেল!`;
    return `এবার ${possessive(rival)} ফুলই বেশি ফুটল।`;
  }
  const winner = mine > theirs ? names[0] : names[1], gap = Math.abs(mine - theirs);
  if (gap <= 2) return "শেষ ঘর পর্যন্ত লড়াই!";
  return gap >= total / 2 ? `কাঁথা ভরা ${possessive(winner)} ফুলে!` : `কাঁথায় ${possessive(winner)} ফুলই বেশি।`;
}

/** The headline of a finished game, for previews, the friend card and captions. */
export function feat({ level, name, other, game }: Shared) {
  const [mine, theirs] = game.score;
  if (!level) {
    const [first, second] = cardNames(0, name, other);
    return `${first} আর ${possessive(second)} ছক-জোড়া: ${bn(mine)}–${bn(theirs)}`;
  }
  const who = cleanName(name) || "এক বন্ধু", rival = rivalOf(level);
  if (mine > theirs) return `${who} ${rival}কে ${bn(mine)}–${bn(theirs)} ফুলে হারিয়েছে`;
  if (mine === theirs) return `${who} ${possessive(rival)} সাথে ${bn(mine)}–${bn(theirs)} সমান করেছে`;
  return `${who} ${possessive(rival)} সাথে ${bn(mine)}টা ফুল পেয়েছে`;
}

export const previewTitle = (shared: Shared) => shared.level ? `${feat(shared)}। তুমি পারবে?` : `${feat(shared)}। তোমরাও খেলো!`;

/** After playing a friend's link on the same level: kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine > theirs) return `${possessive(who)} চেয়ে ${bn(mine - theirs)}টা ফুল বেশি!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)}টা ফুল পেয়েছিল।`;
  if (theirs - mine <= 2) return `আর একটু হলেই! মাত্র ${bn(theirs - mine)}টা ফুল কম।`;
  return `${who} এখনো ${bn(theirs - mine)}টা ফুল এগিয়ে। আরেকবার?`;
}

export function caption(shared: Shared) {
  const { level, name, other, game } = shared;
  if (!level) return `${scoreLine(cardNames(0, name, other), game.score)}। ছক-জোড়ায় আমাদের কাঁথা দেখো, এবার তোমরা খেলো!`;
  const rival = rivalOf(level), [mine, theirs] = game.score;
  if (mine > theirs) return `ছক-জোড়ায় ${rival}কে ${bn(mine)}–${bn(theirs)} ফুলে হারালাম! একই শুরু, একই ${rival}, দেখি তুমি পারো কি না।`;
  return `ছক-জোড়ায় ${possessive(rival)} সাথে ${bn(mine)}টা ফুল পেলাম। একই শুরু তোমার জন্য, দেখি তুমি কয়টা পাও!`;
}

export const possessiveName = possessive;
export const totalOf = (shared: Shared) => totalPoints(shared.game.setup);
