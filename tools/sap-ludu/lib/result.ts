// The challenge link, the result lines and the personal preview. Runs on the server too (share.ts → /api/share).
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { JUMPS, LAST } from "./board";
import { band, choicesText, readChoices, replay, type Game, type Pieces, type Players } from "./game";

export const MAX_TARGET = 999;
/** Names on the board and the card: up to 16 letters each. */
export const MAX_PLAYER_NAME = 16;
/** A link carries at most this many choices (100 hex digits); a game with more is shared without its replay. */
export const MAX_CHOICES = 400;
export const SEAT_NAMES = ["গোলাপি", "নীল", "কমলা", "বেগুনি"] as const;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

export const cleanPlayerName = (name: string) => [...cleanName(name)].slice(0, MAX_PLAYER_NAME).join("").trim();
/** A seat's name: what was typed, else its colour ("নীল"). Solo has no default name; lines word themselves around it. */
export const seatName = (names: readonly string[], seat: number) => cleanPlayerName(names[seat] ?? "") || SEAT_NAMES[seat];

/** A finished game as a link carries it; everything else (who won, bites, ladders) comes from replaying it. */
export type Card = { seed: number; players: Players; pieces: Pieces; choices: number[]; names: string[] };
export type Result = { card: Card; game: Game };

export function cardOf(game: Game, names: readonly string[]): Card {
  return { seed: game.seed, players: game.players, pieces: game.pieces, choices: [...game.choices], names: Array.from({ length: game.players }, (_, seat) => cleanPlayerName(names[seat] ?? "")) };
}

/** The winner's rolls: the number a friend tries to beat. */
export const winnerMoves = (game: Game) => game.moves[game.winner] ?? 0;

/** `s` seed, `t` the winner's rolls, `p` players (2–4), `g=2` two pieces each, `c` the choices, `n`/`n2`/`n3`/`n4` names. Empty if it can't be a link. */
export function cardHash(card: Card, game: Game) {
  if (card.choices.length > MAX_CHOICES || game.phase !== "over") return "";
  const extra: Record<string, string | number> = {};
  if (card.players > 1) extra.p = card.players;
  if (card.players > 1 && card.pieces === 2) extra.g = 2;
  if (card.choices.length) extra.c = choicesText(card.choices);
  for (let seat = 1; seat < card.players; seat++) if (card.names[seat]) extra[`n${seat + 1}`] = card.names[seat];
  return challengeHash({ seed: card.seed, target: Math.min(MAX_TARGET, winnerMoves(game)), name: card.names[0], extra });
}

/**
 * Reads a link and replays it from the seed with its choices: it must end, and the winner's rolls must match `t`.
 * Null for anything broken, out of range or not adding up.
 */
export function parseCard(hash: string): Result | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TARGET, extraKeys: ["p", "g", "c", "n2", "n3", "n4"] });
  if (!challenge) return null;
  const { p, g, c = "", n2, n3, n4 } = challenge.extra;
  if (p !== undefined && !/^[234]$/.test(p)) return null;
  const players = (p ? Number(p) : 1) as Players;
  if (g !== undefined && (g !== "2" || players === 1)) return null;
  const pieces: Pieces = players === 1 || g ? 2 : 1;
  const extraNames = [n2, n3, n4];
  if (extraNames.some((name, index) => name !== undefined && index + 2 > players)) return null;
  if (c.length > MAX_CHOICES / 4) return null;
  const choices = readChoices(c);
  if (!choices) return null;
  // The hex pads the choices to a multiple of four; the replay accepts only the real count.
  let game: Game | null = null;
  for (let count = Math.max(0, choices.length - 3); count <= choices.length && !game; count++) game = replay(challenge.seed, players, pieces, choices.slice(0, count));
  if (!game || choicesText(game.choices) !== c || Math.min(MAX_TARGET, winnerMoves(game)) !== challenge.target) return null;
  const names = [cleanPlayerName(challenge.name), ...extraNames.slice(0, players - 1).map(name => cleanPlayerName(name ?? ""))];
  return { card: { seed: challenge.seed, players, pieces, choices: game.choices, names }, game };
}

/** The friend's game and mine are the same race when the seed and the setup match. */
export const sameRace = (mine: Card, theirs: Card) => mine.seed === theirs.seed && mine.players === theirs.players && mine.pieces === theirs.pieces;

/** The square each seat's leading piece reached. */
export function bestSquares(game: Game) {
  return Array.from({ length: game.players }, (_, seat) => Math.max(...game.pos.slice(seat * game.pieces, seat * game.pieces + game.pieces)));
}

export const biteText = (bites: number) => bites === 0 ? "একবারও সাপ কামড়ায়নি" : `সাপ কামড়াল ${bn(bites)} বার`;
export const climbText = (climbs: number) => climbs === 0 ? "সিঁড়ি পায়নি" : `সিঁড়ি ${bn(climbs)}টা`;

const SOLO_LINES = [
  "সিঁড়ির পর সিঁড়ি! আজ ছক্কা তোমার কথা শুনছে।",
  "দারুণ দৌড়! সাপগুলো আজ ঘুমিয়ে ছিল মনে হয়।",
  "সিঁড়িও পেলে, সাপও পেলে, তবু ঠিকঠাক পৌঁছে গেছ।",
  "সাপে কেটেছে বারবার, তবু হাল ছাড়োনি!",
  "এত সাপ পেরিয়েও ১০০-তে! ধৈর্য আছে বলতে হবে।",
];

/** The kind line on the card. Solo: by rolls, with a special word for a snake-free run. Group: by how the race went. */
export function humanLine(result: Result) {
  const { card, game } = result, me = game.winner;
  if (card.players === 1) return game.bites[0] === 0 ? "একটা সাপও ছুঁতে পারেনি! আজ কপাল ঝকঝকে।" : SOLO_LINES[band(winnerMoves(game))];
  const name = seatName(card.names, me), squares = bestSquares(game), next = Math.max(...squares.filter((_, seat) => seat !== me));
  if (game.bites[me] === 0) return `${possessive(name)} গায়ে একবারও সাপ লাগেনি, সোজা ১০০-তে!`;
  if (next >= 90) return `গায়ে গায়ে লড়াই! আরেকজন তখন ${bn(next)}-এ দাঁড়িয়ে।`;
  if (game.bites[me] >= Math.max(...game.bites) && game.bites[me] >= 2) return `সবচেয়ে বেশি সাপের কামড় খেয়েও জিতে গেল ${name}!`;
  if (next < 60) return "অন্যরা তখনো মাঝপথে, একাই দৌড়!";
  return `আজ ${possessive(name)} ভাগ্য সবচেয়ে ভালো!`;
}

/** "রাফি জিতল!" or, solo, "রাফি ১০০-তে!" / "১০০-তে উঠেছ!". */
export function headline(result: Result) {
  const { card, game } = result;
  if (card.players > 1) return `${seatName(card.names, game.winner)} জিতল!`;
  return card.names[0] ? `${card.names[0]} ১০০-তে!` : "১০০-তে উঠেছ!";
}

/** The best ladder and the worst snake of the winner, for the card: "সেরা সিঁড়ি: আম্মুর হাতের খিচুড়ি". */
export function highlights(game: Game) {
  const ladder = game.bestLadder[game.winner], snake = game.worstSnake[game.winner], lines: string[] = [];
  if (ladder >= 0) lines.push(`সেরা সিঁড়ি: ${JUMPS[ladder].caption}`);
  if (snake >= 0) lines.push(`বড় কামড়: ${JUMPS[snake].caption}`);
  return lines;
}

/** One line of everyone's finishing squares: "রাফি ১০০ · মিম ৮৭ · নীল ৬৫". */
export function scoreboard(result: Result) {
  const squares = bestSquares(result.game);
  return squares.map((square, seat) => `${seatName(result.card.names, seat)} ${bn(square)}`).join(" · ");
}

const who = (name: string) => name || "বন্ধু";

/** After a friend's solo link, on the same dice: fewer rolls is better. */
export function versusLine(mine: number, theirs: number, name: string) {
  const diff = Math.abs(mine - theirs);
  if (mine < theirs) return `${possessive(who(name))} চেয়ে ${bn(diff)} চাল কম!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${bn(mine)} চাল।`;
  if (diff <= 3) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(diff)} চাল বেশি।`;
  return `এবার ${who(name)} এগিয়ে। একই ছক্কায় আরেকবার দেখো!`;
}

export function friendBanner(result: Result) {
  const { card, game } = result, moves = bn(winnerMoves(game));
  if (card.players === 1) return `${card.names[0] || "তোমার বন্ধু"} ${moves} চালে ১০০-তে উঠেছে। একই ছক্কা, কার ভাগ্য ভালো?`;
  return `${seatName(card.names, game.winner)} জিতেছে ${moves} চালে, ${bn(card.players)} জনের খেলায়। এবার তোমরা খেলো!`;
}
export const friendNote = (result: Result) => result.card.players === 1
  ? "একই ছক্কা পড়বে। দুই গুটির কোনটা চালবে, সেটা তোমার হাতে।"
  : "ওদের প্রতিটা চাল মিলিয়ে দেখা হয়েছে। তোমাদের খেলায় ছক্কা পড়বে নতুন করে।";

export function previewTitle(result: Result) {
  const { card, game } = result, moves = bn(winnerMoves(game));
  if (card.players === 1) return `${card.names[0] || "এক বন্ধু"} ${moves} চালে ১০০-তে উঠেছে। একই ছক্কায় তুমি পারবে?`;
  return `${seatName(card.names, game.winner)} জিতল ${moves} চালে, ${biteText(game.bites[game.winner])}! তোমরা সাপলুডু খেলবে?`;
}

export function caption(result: Result) {
  const { card, game } = result, moves = bn(winnerMoves(game));
  if (card.players === 1) return `সাপলুডুতে ${moves} চালে ১০০-তে উঠলাম, ${biteText(game.bites[0])}! একই ছক্কায় তুমি কত চালে পারবে?`;
  return `সাপলুডুতে আজ ${seatName(card.names, game.winner)} জিতল ${moves} চালে! তোমাদের বাসায় কার ভাগ্য ভালো?`;
}

/** What a landing says: the caption, and the squares. */
export function jumpNews(jump: number) {
  const { from, to, caption: text } = JUMPS[jump], up = to > from;
  return { title: `${text}!`, sub: `${bn(from)} থেকে ${bn(to)}-তে ${to === LAST ? "উঠে জিত!" : up ? "উঠল" : "নামল"}`, up };
}
