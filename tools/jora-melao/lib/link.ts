// The challenge link, the result lines and the personal preview. Runs on the server too (share.ts → /api/share).
// Links without `v` are the ones shared before the rewrite: they open on the old deal (lib/legacy.ts) as "বন্ধুর পুরোনো বোর্ড".
// New links add `v=2`; `l` is then the ladder level (1–24), `m=2 a q` two players, `f` the flips that prove the moves.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { OLD_LEVELS, type OldSize } from "./legacy";
import { DUO_SIZES, LEVEL_COUNT, WORLDS, duoSpec, finaleName, isFinale, isLevel, levelAt, worldOf, type Spec } from "./levels";
import { band, flipsText, legacyGame, newGame, readFlips, replay, starsOf, type Game, type Players } from "./play";

export const MAX_MOVES = 999;
/** A link proves every game up to this many moves with its flips. Longer games aren't worth faking. */
export const PROOF_MOVES = 60;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

/** A finished game as a link carries it. Solo: `pairs` is [all, 0] and `names[1]` is empty. `level` is 0 outside the ladder. */
export type Card = {
  seed: number; v: 1 | 2; level: number; players: Players; cards: number; moves: number;
  pairs: [number, number]; names: [string, string]; flips: string;
};

/** The rules a card was played on. */
export function specOf(card: Pick<Card, "v" | "level" | "players" | "cards">): Spec {
  if (card.v === 2 && card.level) return levelAt(card.level);
  return duoSpec((card.cards === 12 ? 12 : 16) as 12 | 16);
}
/** The starting game of a card, on its own deal. */
export function gameOf(card: Pick<Card, "seed" | "v" | "level" | "players" | "cards">): Game {
  return card.v === 1 ? legacyGame(card.seed, card.cards as OldSize, card.players) : newGame(card.seed, specOf(card), card.players);
}

export function cardOf(game: Game, names: readonly string[], level = 0, v: 1 | 2 = 2): Card {
  const two = game.players === 2;
  return {
    seed: game.seed, v, level: two ? 0 : level, players: game.players, cards: game.board.length, moves: game.moves, pairs: [...game.pairs],
    names: [cleanName(names[0] ?? ""), two ? cleanName(names[1] ?? "") : ""],
    flips: game.moves <= PROOF_MOVES ? flipsText(game.flips) : "",
  };
}

export function cardHash(card: Card) {
  const extra: Record<string, string | number> = {};
  if (card.v === 2) extra.v = 2;
  if (card.players === 2 || card.v === 1) { if (card.cards !== 16) extra.g = card.cards; }
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
  const challenge = readChallenge(hash, { maxTarget: MAX_MOVES, extraKeys: ["v", "g", "l", "m", "a", "f", "q"] });
  if (!challenge) return null;
  const { v, g, l, m, a, f, q } = challenge.extra;
  if (v !== undefined && v !== "2") return null;
  if (m !== undefined && m !== "2") return null;
  const players: Players = m ? 2 : 1, moves = challenge.target;
  const level = l === undefined ? 0 : /^\d{1,2}$/.test(l) ? Number(l) : -1;
  let cards: number, start: Game;
  if (v === "2") {
    if (players === 2) {
      if (level || (g !== undefined && !["12", "16"].includes(g))) return null;
      cards = g ? Number(g) : 16;
      if (!(DUO_SIZES as readonly number[]).includes(cards)) return null;
    } else {
      if (!isLevel(level) || g !== undefined) return null;
      cards = levelAt(level).pairs * 2;
    }
    start = newGame(challenge.seed, players === 2 ? duoSpec(cards as 12 | 16) : levelAt(level), players);
  } else {
    if (g !== undefined && !["8", "12", "20"].includes(g)) return null;
    cards = g ? Number(g) : 16;
    if (level && (level < 1 || level > OLD_LEVELS.length || players === 2 || OLD_LEVELS[level - 1].size !== cards)) return null;
    if (level < 0) return null;
    // Two players still chose between ৩×৪ and ৪×৪ only; the other boards came from a level.
    if (!level && cards !== 12 && cards !== 16) return null;
    start = legacyGame(challenge.seed, cards as OldSize, players);
  }
  const all = cards / 2;
  if (moves < all) return null;
  if (players === 1 && (a !== undefined || q !== undefined)) return null;
  if (players === 2 && (a === undefined || !/^\d{1,2}$/.test(a) || Number(a) > all)) return null;
  const pairs: [number, number] = players === 2 ? [Number(a), all - Number(a)] : [all, 0];
  if (f === undefined) {
    if (moves <= PROOF_MOVES) return null;
  } else {
    const flips = readFlips(f);
    const end = flips && replay(start, flips);
    if (!end || end.phase !== "over" || end.moves !== moves || end.pairs[0] !== pairs[0]) return null;
  }
  return { seed: challenge.seed, v: v === "2" ? 2 : 1, level, players, cards, moves, pairs, names: [challenge.name, players === 2 ? cleanName(q ?? "") : ""], flips: f ?? "" };
}

/** The friend's card and mine are the same game when the board and the mode match. */
export const sameGame = (mine: Card, theirs: Card) => mine.seed === theirs.seed && mine.cards === theirs.cards && mine.players === theirs.players && mine.v === theirs.v && (mine.v === 1 || mine.level === theirs.level);

/** The stars a solo ladder card earned (0 for the old boards and two players). */
export const starsOfCard = (card: Card) => card.v === 2 && card.level && card.players === 1 ? starsOf(levelAt(card.level), card.moves) : 0;
export const worldOfCard = (card: Card) => card.v === 2 && card.level ? worldOf(card.level) : 0;
export const pairCount = (card: Card) => card.cards / 2;

export const DEFAULT_NAMES = ["প্রথমজন", "দ্বিতীয়জন"] as const;
/** A player's name for the screen and the card: what they typed, else "প্রথমজন"/"দ্বিতীয়জন". */
export const playerName = (names: readonly string[], seat: 0 | 1) => cleanName(names[seat] ?? "") || DEFAULT_NAMES[seat];
const who = (name: string) => name || "বন্ধু";

const SOLO_LINES = [
  "একটাও ভুল চাল নেই। দোকানি অবাক।",
  "কোনটা কোথায়, প্রায় সবই মনে ছিল।",
  "মনে রাখার হাত ভালো। জোড়াগুলো একে একে ধরা দিল।",
  "বেশ মনে রেখেছ। আরেক দানে আরও কম চাল লাগবে।",
  "সব জোড়া মিলেছে। পরের বার কোনটা কোথায়, একটু খেয়াল রেখো।",
  "ধৈর্য আছে বলতে হবে। ঘুরে ঘুরে সব খুঁজে বের করেছ।",
];
/** The kind line on a solo card, by moves per pair. */
export const soloLine = (moves: number, pairs: number) => SOLO_LINES[band(moves, pairs)];

/** Who won a two-player game, or null for a tie. */
export const winner = (card: Pick<Card, "pairs">) => card.pairs[0] === card.pairs[1] ? null : card.pairs[0] > card.pairs[1] ? 0 : 1;

export function duoLine(card: Card) {
  const top = winner(card);
  if (top === null) return "সমান সমান। আরেক দান না খেললেই না।";
  const name = playerName(card.names, top), gap = Math.abs(card.pairs[0] - card.pairs[1]);
  if (card.pairs[1 - top] === 0) return `${name} একাই সব জোড়া মিলিয়ে ফেলেছে।`;
  if (gap <= 2) return "একদম কাছাকাছি। এক-দুই জোড়ার এদিক-ওদিক।";
  return `আজ ${possessive(name)} মনে রাখার জোর বেশি।`;
}

export const humanLine = (card: Card) => card.players === 2 ? duoLine(card) : soloLine(card.moves, pairCount(card));
export const duoScore = (card: Card) => `${playerName(card.names, 0)} ${bn(card.pairs[0])} — ${playerName(card.names, 1)} ${bn(card.pairs[1])}`;
export const winnerTitle = (card: Card) => { const top = winner(card); return top === null ? "সমান সমান!" : `${playerName(card.names, top)} জিতেছে!`; };

/** After a friend's solo link: fewer moves is better. */
export function versusLine(mine: number, theirs: number, name: string) {
  const diff = Math.abs(mine - theirs);
  if (mine < theirs) return `${possessive(who(name))} চেয়ে ${bn(diff)} চাল কম।`;
  if (mine === theirs) return `সমান সমান। দুজনেরই ${bn(mine)} চাল।`;
  if (diff <= 3) return `আর একটু হলেই। ${possessive(who(name))} চেয়ে মাত্র ${bn(diff)} চাল বেশি।`;
  return `এবার ${who(name)} এগিয়ে। নতুন বোর্ডে আরেকবার দেখো।`;
}

/** "লেভেল ৫" or the finale's name: what the card and the banner call a ladder board. */
export const levelTitle = (level: number) => isFinale(level) ? finaleName(level) : `লেভেল ${bn(level)}`;

export function friendBanner(card: Card) {
  if (card.v === 1) return `${card.names[0] || "তোমার বন্ধু"} ${bn(card.moves)} চালে পেরেছে। পুরোনো বোর্ড, তবু একই খেলা।`;
  if (card.players === 2) return `${duoScore(card)}। একই বোর্ড, এবার তোমরা খেলো।`;
  return `${card.names[0] || "তোমার বন্ধু"} ${bn(card.moves)} চালে পেরেছে। একই বোর্ড, এবার তোমার পালা।`;
}
export const friendNote = (card: Card) => {
  const proof = card.flips ? "প্রতিটা চাল মিলিয়ে দেখা হয়েছে" : "অনেক লম্বা খেলা, চাল মিলিয়ে দেখা হয়নি";
  if (card.v === 1) return `বন্ধুর পুরোনো বোর্ড · ${bn(pairCount(card))} জোড়া · ${proof}`;
  return `${card.level ? `${levelTitle(card.level)} · ` : ""}${bn(pairCount(card))} জোড়া · ${proof}`;
};

export function previewTitle(card: Card) {
  if (card.players === 2) return `${duoScore(card)}। মেলার খেলনার জোড়া মেলাও, তোমরা খেলবে?`;
  const stars = starsOfCard(card);
  return `${card.names[0] || "এক বন্ধু"} ${card.v === 2 && card.level ? `${isFinale(card.level) ? `${finaleName(card.level)}-এ ` : `লেভেল ${bn(card.level)}-এ `}` : ""}${bn(card.moves)} চালে সব জোড়া মিলিয়েছে${stars === 3 ? ", তিন তারা" : ""}। তুমি পারবে?`;
}

export function caption(card: Card) {
  if (card.players === 2) return `জোড়া মেলাও খেললাম দুজনে: ${duoScore(card)}। তোমাদের বাসায় কে জিতবে?`;
  if (card.v === 2 && card.level) {
    const stars = starsOfCard(card), where = WORLDS[worldOf(card.level)].name;
    return `জোড়া মেলাও, ${levelTitle(card.level)} (${where}): ${bn(pairCount(card))} জোড়া ${bn(card.moves)} চালে মিলিয়েছি${stars ? `, ${bn(stars)} তারা` : ""}। একই বোর্ডে তুমি কত চালে পারবে?`;
  }
  return `মেলার খেলনার জোড়া মেলাও খেলে ${bn(card.moves)} চালে সব জোড়া মিলিয়েছি। একই বোর্ডে তুমি কত চালে পারবে?`;
}

export { LEVEL_COUNT };
