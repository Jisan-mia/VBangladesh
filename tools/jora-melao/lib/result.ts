// The challenge link, the result lines and the personal preview. Runs on the server too (share.ts → /api/share).
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { LEVELS, band, flipsText, isLevel, pairsOf, readFlips, replay, type Game, type Players, type Size } from "./game";

export const MAX_MOVES = 999;
/** A link proves every game up to this many moves with its flips (two hex digits a move). Longer games aren't worth faking. */
export const PROOF_MOVES = 60;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);
export const sizeLabel = (size: Size) => `${bn(size / 4)}×৪`;

/** A finished game as a link carries it. Solo: `pairs` is [all, 0] and `names[1]` is empty. `level` is 0 outside the solo levels. */
export type Card = { seed: number; size: Size; players: Players; moves: number; pairs: [number, number]; names: [string, string]; flips: string; level: number };

export function cardOf(game: Game, names: readonly string[], level = 0): Card {
  const two = game.players === 2;
  return {
    seed: game.seed, size: game.size, players: game.players, moves: game.moves, pairs: [...game.pairs], level: two ? 0 : level,
    names: [cleanName(names[0] ?? ""), two ? cleanName(names[1] ?? "") : ""],
    flips: game.moves <= PROOF_MOVES ? flipsText(game.flips) : "",
  };
}

/** `s` seed, `t` moves, `g` the card count when not 16, `l` the solo level, `m=2` two players with `a` the first one's pairs and `q` the second name, `f` the flips. */
export function cardHash(card: Card) {
  const extra: Record<string, string | number> = {};
  if (card.size !== 16) extra.g = card.size;
  if (card.level) extra.l = card.level;
  if (card.players === 2) extra.m = 2;
  if (card.players === 2) extra.a = card.pairs[0];
  if (card.flips) extra.f = card.flips;
  if (card.players === 2 && card.names[1]) extra.q = card.names[1];
  return challengeHash({ seed: card.seed, target: Math.min(MAX_MOVES, card.moves), name: card.names[0], extra });
}

/**
 * Reads a friend's link and re-plays its flips on the same board: the moves and pairs must come out exactly as claimed.
 * Null for anything broken, out of range or not adding up.
 */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_MOVES, extraKeys: ["g", "l", "m", "a", "f", "q"] });
  if (!challenge) return null;
  const { g, l, m, a, f, q } = challenge.extra;
  if ((g !== undefined && !["8", "12", "20"].includes(g)) || (m !== undefined && m !== "2")) return null;
  const size = (g ? Number(g) : 16) as Size, players: Players = m ? 2 : 1, all = pairsOf(size), moves = challenge.target;
  const level = l === undefined ? 0 : /^\d{1,2}$/.test(l) ? Number(l) : -1;
  if (level && (!isLevel(level) || players === 2 || LEVELS[level - 1].size !== size)) return null;
  // Two players still choose between ৩×৪ and ৪×৪ only; the other boards come from a level.
  if (!level && size !== 12 && size !== 16) return null;
  if (moves < all) return null;
  if (players === 1 && (a !== undefined || q !== undefined)) return null;
  if (players === 2 && (a === undefined || !/^\d{1,2}$/.test(a) || Number(a) > all)) return null;
  const pairs: [number, number] = players === 2 ? [Number(a), all - Number(a)] : [all, 0];
  if (f === undefined) {
    if (moves <= PROOF_MOVES) return null;
  } else {
    const flips = readFlips(f);
    const end = flips && replay(challenge.seed, size, players, flips);
    if (!end || end.phase !== "over" || end.moves !== moves || end.pairs[0] !== pairs[0]) return null;
  }
  return { seed: challenge.seed, size, players, moves, pairs, names: [challenge.name, players === 2 ? cleanName(q ?? "") : ""], flips: f ?? "", level };
}

/** The friend's card and mine are the same game when the board and the mode match. */
export const sameGame = (mine: Card, theirs: Card) => mine.seed === theirs.seed && mine.size === theirs.size && mine.players === theirs.players && mine.level === theirs.level;

export const DEFAULT_NAMES = ["প্রথমজন", "দ্বিতীয়জন"] as const;
/** A player's name for the screen and the card: what they typed, else "প্রথমজন"/"দ্বিতীয়জন". */
export const playerName = (names: readonly string[], seat: 0 | 1) => cleanName(names[seat] ?? "") || DEFAULT_NAMES[seat];
const who = (name: string) => name || "বন্ধু";

const SOLO_LINES = [
  "একটাও ভুল চাল নেই! মেলার খেলনাওয়ালাও অবাক।",
  "কোনটা কোথায়, প্রায় সবই মনে ছিল।",
  "মনে রাখার হাত ভালো! জোড়াগুলো একে একে ধরা দিল।",
  "বেশ মনে রেখেছ। আরেক দানে আরও কম চাল লাগবে।",
  "সব জোড়া মিলেছে! পরের বার কোনটা কোথায়, একটু খেয়াল রেখো।",
  "ধৈর্য আছে বলতে হবে! মেলা ঘুরে ঘুরে সব খুঁজে বের করেছ।",
];
/** The kind line on a solo card, by moves per pair. */
export const soloLine = (moves: number, size: Size) => SOLO_LINES[band(moves, size)];

/** Who won a two-player game, or null for a tie. */
export const winner = (card: Pick<Card, "pairs">) => card.pairs[0] === card.pairs[1] ? null : card.pairs[0] > card.pairs[1] ? 0 : 1;

export function duoLine(card: Card) {
  const top = winner(card);
  if (top === null) return "সমান সমান! এবার আরেক দান না খেললেই না।";
  const name = playerName(card.names, top), gap = Math.abs(card.pairs[0] - card.pairs[1]);
  if (card.pairs[1 - top] === 0) return `${name} একাই সব জোড়া মিলিয়ে ফেলেছে!`;
  if (gap <= 2) return "একদম কাছাকাছি! এক-দুই জোড়ার এদিক-ওদিক।";
  return `আজ ${possessive(name)} মনে রাখার জোর বেশি!`;
}

export const humanLine = (card: Card) => card.players === 2 ? duoLine(card) : soloLine(card.moves, card.size);
export const duoScore = (card: Card) => `${playerName(card.names, 0)} ${bn(card.pairs[0])} — ${playerName(card.names, 1)} ${bn(card.pairs[1])}`;
export const winnerTitle = (card: Card) => { const top = winner(card); return top === null ? "সমান সমান!" : `${playerName(card.names, top)} জিতেছে!`; };

/** After a friend's solo link: fewer moves is better. */
export function versusLine(mine: number, theirs: number, name: string) {
  const diff = Math.abs(mine - theirs);
  if (mine < theirs) return `${possessive(who(name))} চেয়ে ${bn(diff)} চাল কম!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${bn(mine)} চাল।`;
  if (diff <= 3) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(diff)} চাল বেশি।`;
  return `এবার ${who(name)} এগিয়ে। নতুন খেলায় আরেকবার দেখো!`;
}

export function friendBanner(card: Card) {
  if (card.players === 2) return `${duoScore(card)} জোড়া। একই খেলা, এবার তোমরা খেলো।`;
  return `${card.names[0] || "তোমার বন্ধু"} ${bn(card.moves)} চালে পেরেছে। একই খেলা, এবার তোমার পালা।`;
}
export const friendNote = (card: Card) => `${card.level ? `লেভেল ${bn(card.level)} · ` : ""}${sizeLabel(card.size)} · ${card.flips ? "প্রতিটা চাল মিলিয়ে দেখা হয়েছে" : "অনেক লম্বা খেলা, চাল মিলিয়ে দেখা হয়নি"}`;

export function previewTitle(card: Card) {
  if (card.players === 2) return `${duoScore(card)} জোড়া! মেলার খেলনার জোড়া মেলাও, তোমরা খেলবে?`;
  return `${card.names[0] || "এক বন্ধু"} ${card.level ? `লেভেল ${bn(card.level)}-এ ` : ""}${bn(card.moves)} চালে সব জোড়া মিলিয়েছে। তুমি পারবে?`;
}

export function caption(card: Card) {
  if (card.players === 2) return `জোড়া মেলাও খেললাম দুজনে: ${duoScore(card)}। তোমাদের বাসায় কে জিতবে?`;
  if (card.level) return `জোড়া মেলাও, লেভেল ${bn(card.level)}: ${bn(card.size)}টা কার্ড ${bn(card.moves)} চালে মিলিয়েছি! একই খেলায় তুমি কত চালে পারবে?`;
  return `মেলার খেলনার জোড়া মেলাও খেলে ${bn(card.moves)} চালে সব জোড়া মিলিয়েছি! একই খেলায় তুমি কত চালে পারবে?`;
}
