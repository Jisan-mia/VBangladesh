// Challenge links, names and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and game.ts.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { humanSide, isLevel, replay, winStars, GOAT, GOAT_STARS_KEPT, LEGACY_LEVEL, MAX_MOVES, TIGER, TIGER_GOAL, TIGER_STARS, type Game, type Mode, type Side } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** One character a move: its place in that position's move list. A position never has more than 56 moves, so 64 symbols always do. */
const MOVE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const encodeMoves = (moves: readonly number[]) => moves.map(index => MOVE_CHARS[index]).join("");
export function decodeMoves(text: string) {
  if (!new RegExp(`^[A-Za-z0-9_-]{1,${MAX_MOVES}}$`).test(text)) return null;
  return [...text].map(char => MOVE_CHARS.indexOf(char));
}

export type Shared = { mode: Mode; name: string; other: string; game: Game };

/**
 * A finished game: `#s=<seed>&t=<goats taken>&p=<0 two people, 1 বাঘ, 2 ছাগল>&m=<moves>&l=<bot level>&o=<tiger player, two people only>&n=<name>`.
 * Two people: n is whoever played the goats. No `l` means level 7, the bot from before levels, so old links still replay. The moves are replayed and every bot move re-checked, so the result is proven, not claimed.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: TIGER_GOAL, extraKeys: ["p", "m", "o", "l"] });
  if (!challenge) return null;
  const { p, m, o, l } = challenge.extra;
  const mode = p === "0" ? 0 : p === "1" ? 1 : p === "2" ? 2 : null;
  const moves = decodeMoves(m ?? "");
  const level = l === undefined ? LEGACY_LEVEL : /^[1-9]$/.test(l) ? Number(l) : 0;
  if (mode === null || !moves || !isLevel(level)) return null;
  const game = replay(challenge.seed, mode, moves, mode === 0 ? LEGACY_LEVEL : level);
  if (!game?.over || game.taken !== challenge.target) return null;
  return { mode, name: challenge.name, other: mode === 0 ? cleanName(o ?? "") : "", game };
}

export function sharedHash({ mode, name, other, game }: Shared) {
  const extra: Record<string, string> = { p: String(mode), m: encodeMoves(game.moves) };
  if (mode !== 0 && game.level !== LEGACY_LEVEL) extra.l = String(game.level);
  const second = cleanName(other);
  if (mode === 0 && second) extra.o = second;
  return challengeHash({ seed: game.seed, target: game.taken, name, extra });
}

export const sideWord = (side: Side) => side === GOAT ? "ছাগল" : "বাঘ";

/** Who plays each side, [goats, tigers]: "তুমি" (or a friend) and "বট", or names once two people type them. */
export function playNames(mode: Mode, names: readonly [string, string], you = "তুমি"): [string, string] {
  const [first, second] = names.map(cleanName);
  return mode === 1 ? ["বট", first || you] : mode === 2 ? [first || you, "বট"] : [first, second];
}

/** The same on a card or preview, seen by others: "আমি" instead of "তুমি". */
export function cardNames(mode: Mode, name: string, other: string): [string, string] {
  return mode === 1 ? ["বট", cleanName(name) || "আমি"] : mode === 2 ? [cleanName(name) || "আমি", "বট"] : [cleanName(name), cleanName(other)];
}

/** "ছাগল জিতল ৩৪ চালে" */
export const headline = (game: Game) => `${sideWord(game.winner ?? GOAT)} জিতল ${bn(game.moves.length)} চালে`;

/** "৭টা ছাগল গেছে · বাঘ বন্দি" */
export function detail(game: Game) {
  const lost = game.taken ? `${bn(game.taken)}টা ছাগল গেছে` : "একটা ছাগলও যায়নি";
  const how = game.ending === "trap" ? "বাঘ বন্দি" : game.ending === "hold" ? `${bn(MAX_MOVES)} চাল টিকে গেছে` : "বাঘের পেট ভরা";
  return `${lost} · ${how}`;
}

/** The kind line on the card. Never says anyone did badly. */
export function humanLine(game: Game) {
  switch (game.ending) {
    case "trap": return game.taken ? "বাঘ আজ বন্দি!" : "একটা ছাগলও না খুইয়ে বাঘ বন্দি!";
    case "hold": return game.taken <= 3 ? "উঠোন ভরা ছাগল, বাঘের পেট খালি!" : "শেষ চাল পর্যন্ত টিকে থাকল ছাগলের পাল!";
    default: return game.moves.length < 50 ? "বাঘ আজ এক দৌড়েই ভরপেট!" : "অনেক লড়াই, শেষমেশ বাঘের পেট ভরল!";
  }
}

/** The headline of a finished game, for previews, the friend banner and captions. */
export function feat({ mode, name, other, game }: Shared) {
  const who = cleanName(name) || "এক বন্ধু";
  const moves = bn(game.moves.length), taken = bn(game.taken);
  if (mode === 0) {
    const [goats, tigers] = cardNames(0, name, other);
    const pair = goats && tigers ? `${goats} আর ${possessive(tigers)} বাঘবন্দি` : "দুজনের বাঘবন্দি";
    return `${pair}: ${headline(game)}`;
  }
  if (mode === 1) return game.winner === TIGER ? `${who} বাঘ হয়ে ${moves} চালে ${taken}টা ছাগল ধরেছে` : `${who} বাঘ হয়ে ${taken}টা ছাগল ধরেছে`;
  if (game.winner !== GOAT) return `${who} ছাগল হয়ে খেলেছে, বাঘ ${taken}টা ধরেছে`;
  return game.ending === "trap" ? `${who} ছাগল হয়ে বাঘকে ${moves} চালে আটকেছে` : `${who} ছাগল হয়ে ${moves} চাল টিকে গেছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। ${shared.mode === 0 ? "তোমরাও খেলো!" : "তুমি পারবে?"}`;

export const bannerNote = "চালগুলো আবার মিলিয়ে দেখেছি, ফলটা সত্যি। একই শুরু, একই বট, এবার তোমার পালা।";

/** After playing from a friend's link: kind either way. Same side as the friend, against the same bot level: a real comparison. */
export function compareLine(mine: Game, friend: Shared) {
  const who = cleanName(friend.name) || "বন্ধু";
  const side = humanSide(mine.mode);
  const won = mine.winner === side;
  if (side !== null && friend.mode === mine.mode && friend.game.level === mine.level) {
    const theirs = friend.game, theyWon = theirs.winner === side;
    if (won && theyWon) {
      const gap = theirs.moves.length - mine.moves.length;
      if (gap > 0) return `${possessive(who)} চেয়ে ${bn(gap)} চাল কম লাগল!`;
      if (gap === 0) return `একদম ${possessive(who)} সমান, ${bn(mine.moves.length)} চালে!`;
      return `জিতেছ! ${who} অবশ্য ${bn(-gap)} চাল কমে পেরেছিল।`;
    }
    if (won) return `${who} যেটা পারেনি, তুমি পেরেছ!`;
    if (theyWon) return `${who} পেরেছিল। আর একটু হলেই! আরেকবার?`;
    // Neither won: tigers compare goats taken, goats compare goats kept.
    const gap = side === TIGER ? mine.taken - theirs.taken : theirs.taken - mine.taken;
    if (gap > 0) return side === TIGER ? `${possessive(who)} চেয়ে ${bn(gap)}টা ছাগল বেশি ধরেছ!` : `${possessive(who)} চেয়ে ${bn(gap)}টা ছাগল বেশি বাঁচালে!`;
    if (gap === 0) return `একদম সমান! ${who}ও ${bn(theirs.taken)}টা ${side === TIGER ? "ধরেছিল" : "হারিয়েছিল"}।`;
    return `আর একটু হলেই! মাত্র ${bn(-gap)}টার ব্যবধান।`;
  }
  if (won) return `জিতে গেছ! কার্ডটা ${who}কে পাঠাও।`;
  const theirs = humanSide(friend.mode);
  return theirs === null ? "আরেকবার খেলে দেখো!" : `${who} ছিল ${sideWord(theirs)}। তুমিও একবার ${sideWord(theirs)} হয়ে দেখো!`;
}

/** The next goal in exact numbers, after a game against the bot: what one more star, or the win, would have taken. Empty when there's none. */
export function nearMiss(game: Game) {
  const side = humanSide(game.mode);
  if (side === null || !game.over) return "";
  const stars = winStars(game), moves = game.moves.length;
  if (side === TIGER) {
    if (!stars) return `আর ${bn(TIGER_GOAL - game.taken)}টা ছাগল ধরলেই জিত।`;
    if (stars === 3) return "";
    const target = TIGER_STARS[3 - stars - 1];
    return `আর ${bn(moves - target)} চাল কম লাগলে ${bn(stars + 1)} তারা।`;
  }
  if (!stars) return `আর ${bn(MAX_MOVES - moves)} চাল টিকে থাকলেই জিত।`;
  if (stars === 3) return "";
  return stars === 2 ? "বাঘ বন্দি করতে পারলে ৩ তারা।" : `আর ${bn(game.taken - GOAT_STARS_KEPT)}টা ছাগল কম হারালে ২ তারা।`;
}

export function caption({ mode, name, other, game }: Shared) {
  if (mode === 0) {
    const [goats, tigers] = cardNames(0, name, other);
    const who = goats && tigers ? `${goats} ছাগল, ${tigers} বাঘ। ` : "";
    return `${who}বাঘবন্দিতে ${headline(game)}! তোমরাও দুজনে খেলে দেখো।`;
  }
  if (mode === 1) return game.winner === TIGER
    ? `বাঘবন্দিতে বাঘ হয়ে ${bn(game.moves.length)} চালে ${bn(game.taken)}টা ছাগল ধরলাম! তুমি পারবে?`
    : `বাঘবন্দিতে বাঘ হয়ে ${bn(game.taken)}টা ছাগল ধরলাম, তবু ছাগলেরা জিতে গেল। তুমি বাঘ হয়ে পারবে?`;
  if (game.winner === GOAT) return game.ending === "trap"
    ? `বাঘবন্দিতে ছাগল হয়ে বাঘকে ${bn(game.moves.length)} চালে আটকালাম! তুমি বাঘ হয়ে পারবে?`
    : `বাঘবন্দিতে ছাগল হয়ে ${bn(game.moves.length)} চাল টিকে গেলাম! তুমি বাঘ হয়ে পারবে?`;
  return `বাঘবন্দিতে ছাগল হয়ে খেললাম, বাঘ ${bn(game.taken)}টা ধরে ফেলল। তুমি পারবে?`;
}
