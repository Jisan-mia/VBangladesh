// Challenge links, names and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and game.ts.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { replay, BOX_COUNT, EDGE_COUNT, type Level } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** One character per stitch: 40 gaps, 40 symbols, all safe in a URL. */
const MOVE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCD";
export const encodeMoves = (moves: readonly number[]) => moves.map(edge => MOVE_CHARS[edge]).join("");
export function decodeMoves(text: string) {
  if (!/^[0-9a-zA-D]{1,40}$/.test(text)) return null;
  return [...text].map(char => MOVE_CHARS.indexOf(char));
}

export type Shared = { seed: number; level: Level; moves: number[]; name: string; other: string; score: [number, number]; owner: number[] };

/**
 * A finished game: `#s=<seed>&t=<first player's boxes>&l=<0 two people, 1 সহজ, 2 কঠিন>&m=<moves>&o=<second name>&n=<name>`.
 * The moves are replayed and every bot stitch re-checked, so the score is proven, not claimed. Anything that doesn't add up is refused.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: BOX_COUNT, extraKeys: ["l", "m", "o"] });
  if (!challenge) return null;
  const { l, m, o } = challenge.extra;
  const level = l === "0" ? 0 : l === "1" ? 1 : l === "2" ? 2 : null;
  const moves = decodeMoves(m ?? "");
  if (level === null || !moves || moves.length !== EDGE_COUNT - 2) return null;
  const game = replay(challenge.seed, level, moves);
  if (!game?.over || game.score[0] !== challenge.target) return null;
  return { seed: challenge.seed, level, moves, name: challenge.name, other: level === 0 ? cleanName(o ?? "") : "", score: game.score, owner: game.owner };
}

export function sharedHash({ seed, level, moves, name, other, score }: Omit<Shared, "owner">) {
  const extra: Record<string, string> = { l: String(level), m: encodeMoves(moves) };
  const second = cleanName(other);
  if (level === 0 && second) extra.o = second;
  return challengeHash({ seed, target: score[0], name, extra });
}

export const levelName = (level: 1 | 2) => level === 1 ? "সহজ" : "কঠিন";

/** Names while playing: "তুমি" and "বট", or the two thread colours until people type their names. */
export function playNames(level: Level, names: readonly [string, string]): [string, string] {
  const [first, second] = names.map(cleanName);
  return level ? [first || "তুমি", "বট"] : [first || "লাল সুতো", second || "নীল সুতো"];
}

/** Names on a card or preview, seen by others: "আমি" instead of "তুমি". */
export function cardNames(level: Level, name: string, other: string): [string, string] {
  return level ? [cleanName(name) || "আমি", "বট"] : [cleanName(name) || "লাল সুতো", cleanName(other) || "নীল সুতো"];
}

const graphemes = new Intl.Segmenter("bn", { granularity: "grapheme" });
function initial(name: string) {
  const parts = [...graphemes.segment(name)].map(part => part.segment);
  // Older segmenters split a conjunct after the hasanta (ক্ + ষ); keep the pair together.
  const first = parts[0]?.endsWith("্") ? parts[0] + (parts[1] ?? "") : parts[0] ?? "";
  return first.toLocaleUpperCase("en");
}

/** The letter stitched in each flower's heart, so colour is never the only sign of whose box it is. Same letter for both: ১ and ২. */
export function initials(names: readonly [string, string]): [string, string] {
  const pair: [string, string] = [initial(names[0]), initial(names[1])];
  return pair[0] && pair[1] && pair[0] !== pair[1] ? pair : ["১", "২"];
}

/** "রাফি ১১ — মিম ৫" */
export const scoreLine = (names: readonly [string, string], score: readonly [number, number]) => `${names[0]} ${bn(score[0])} — ${names[1]} ${bn(score[1])}`;

/** The kind line on the card, by how the boxes split. Never says anyone did badly. */
export function humanLine(level: Level, score: readonly [number, number], names: readonly [string, string]) {
  const [mine, theirs] = score;
  if (mine === theirs) return "আটে আট, কাঁথা আধাআধি!";
  if (level) {
    if (mine >= 12) return "বট প্রায় একটা ফুলও ফোটাতে পারেনি!";
    if (mine > theirs) return "সুঁই-সুতোয় হাত পাকা, বট হার মানল।";
    if (mine >= 6) return "এক-দুই ঘরের জন্য বট এগিয়ে গেল!";
    return "এবার বটের ফুলই বেশি ফুটল।";
  }
  const winner = mine > theirs ? names[0] : names[1], gap = Math.abs(mine - theirs);
  if (gap <= 2) return "শেষ ঘর পর্যন্ত লড়াই!";
  return gap >= 8 ? `কাঁথা ভরা ${possessive(winner)} ফুলে!` : `কাঁথায় ${possessive(winner)} ফুলই বেশি।`;
}

/** The headline of a finished game, for previews, the friend banner and captions. */
export function feat({ level, score, name, other }: Pick<Shared, "level" | "score" | "name" | "other">) {
  const who = cleanName(name) || "এক বন্ধু";
  if (!level) {
    const [first, second] = cardNames(0, name, other);
    return `${first} আর ${possessive(second)} ছক-জোড়া: ${bn(score[0])}–${bn(score[1])}`;
  }
  const bot = `${levelName(level)} বট`;
  if (score[0] > score[1]) return `${who} ${bot}কে ${bn(score[0])}–${bn(score[1])} ঘরে হারিয়েছে`;
  if (score[0] === score[1]) return `${who} ${bot}ের সাথে ${bn(score[0])}–${bn(score[1])} সমান করেছে`;
  return `${who} ${bot}ের সাথে ${bn(score[0])}টা ঘর পেয়েছে`;
}

export const previewTitle = (shared: Shared) => shared.level ? `${feat(shared)}। তুমি পারবে?` : `${feat(shared)}। তোমরাও খেলো!`;

export const bannerNote = (shared: Shared) => shared.level
  ? "চালগুলো মিলিয়ে দেখেছি, ফল সত্যি। একই শুরু, একই বট, এবার তোমার পালা।"
  : "চালগুলো মিলিয়ে দেখা ফল। একই শুরু থেকে এবার তোমরা খেলো।";

/** After playing a friend's link against the same bot: kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine > theirs) return `${possessive(who)} চেয়ে ${bn(mine - theirs)} ঘর বেশি!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)}টা ঘর পেয়েছিল।`;
  if (theirs - mine <= 2) return `আর একটু হলেই! মাত্র ${bn(theirs - mine)} ঘর কম।`;
  return `${who} এখনো ${bn(theirs - mine)} ঘর এগিয়ে। আরেকবার?`;
}

export function caption({ level, score, name, other }: Pick<Shared, "level" | "score" | "name" | "other">) {
  if (!level) return `${scoreLine(cardNames(0, name, other), score)}। ছক-জোড়ায় আমাদের কাঁথা দেখো, এবার তোমরা খেলো!`;
  const bot = `${levelName(level)} বট`;
  if (score[0] > score[1]) return `ছক-জোড়ায় ${bot}কে ${bn(score[0])}–${bn(score[1])} ঘরে হারালাম! একই শুরু, একই বট, দেখি তুমি পারো কি না।`;
  return `ছক-জোড়ায় ${bot}ের সাথে ${bn(score[0])}টা ঘর পেলাম। একই বট তোমার জন্য, দেখি তুমি কয়টা পাও!`;
}
