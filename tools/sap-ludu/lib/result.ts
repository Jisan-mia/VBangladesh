// The challenge link, the result lines and the personal preview. Runs on the server too (share.ts → /api/share).
// Old links (`s t n` solo, `s t p g c n2 n3 n4` group) still parse and replay on the classic board; `l` (a level of the
// একা ladder) and `b` (computer seats) are new keys.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { CLASSIC, type Board } from "./board";
import { band, choicesText, classicSetup, isBot, leadSquare, levelSetup, placeOf, readChoices, replaySetup, starsOf, type Game, type Pieces, type Players, type Setup } from "./game";
import { LEVEL_COUNT, levelOf } from "./levels";
import { rivalName } from "./rivals";

export const MAX_TARGET = 999;
/** Names on the board and the card: up to 16 letters each. */
export const MAX_PLAYER_NAME = 16;
/** A link carries at most this many choices (100 hex digits); a game with more is shared without its replay. */
export const MAX_CHOICES = 400;
export const SEAT_NAMES = ["গোলাপি", "নীল", "কমলা", "বেগুনি"] as const;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);
const ORDINALS = ["১ম", "২য়", "৩য়", "৪র্থ"];
export const ordinal = (place: number) => ORDINALS[place - 1] ?? `${bn(place)}তম`;

export const cleanPlayerName = (name: string) => [...cleanName(name)].slice(0, MAX_PLAYER_NAME).join("").trim();
/** A seat's name: what was typed, else its colour ("নীল"). Solo has no default name; lines word themselves around it. */
export const seatName = (names: readonly string[], seat: number) => cleanPlayerName(names[seat] ?? "") || SEAT_NAMES[seat];

/** A finished game as a link carries it; everything else (who won, bites, ladders) comes from replaying it. */
export type Card = { seed: number; players: Players; pieces: Pieces; choices: number[]; names: string[]; level: number; bots: number };
export type Result = { card: Card; game: Game };

export function cardOf(game: Game, names: readonly string[]): Card {
  return {
    seed: game.seed, players: game.players, pieces: game.pieces, choices: [...game.choices], level: game.setup.level, bots: game.setup.bots,
    names: Array.from({ length: game.setup.level ? 1 : game.players }, (_, seat) => cleanPlayerName(names[seat] ?? "")),
  };
}

/** A seat's name on a result: the computer's own name, what was typed, or its colour. */
export function nameIn(card: Pick<Card, "names" | "bots" | "level">, seat: number) {
  if (seat > 0 && (card.level || ((card.bots >> seat) & 1))) return rivalName(seat);
  return seatName(card.names, seat);
}
/** "তুমি" for your seat in a race of your own, else the seat's name. */
export const whoIn = (card: Pick<Card, "names" | "bots" | "level" | "players">, seat: number) => seat === 0 && (card.level || card.players === 1) ? cleanPlayerName(card.names[0] ?? "") || "তুমি" : nameIn(card, seat);

/** The number a friend tries to beat: your rolls in a race of your own, else the winner's. */
export const winnerMoves = (game: Game) => game.setup.until === "me" ? game.moves[0] : game.moves[game.winner] ?? 0;

/**
 * `s` seed, `t` the rolls, `l` the level (একা), `p` players (2–4), `g=2` two pieces each, `b` computer seats, `c` the
 * choices, `n`/`n2`/`n3`/`n4` names. Empty if it can't be a link.
 */
export function cardHash(card: Card, game: Game) {
  if (card.choices.length > MAX_CHOICES || game.phase !== "over") return "";
  const extra: Record<string, string | number> = {};
  if (card.level) extra.l = card.level;
  else {
    if (card.players > 1) extra.p = card.players;
    if (card.players > 1 && card.pieces === 2) extra.g = 2;
    if (card.bots) extra.b = card.bots;
  }
  if (card.choices.length) extra.c = choicesText(card.choices);
  if (!card.level) for (let seat = 1; seat < card.players; seat++) if (card.names[seat] && !((card.bots >> seat) & 1)) extra[`n${seat + 1}`] = card.names[seat];
  return challengeHash({ seed: card.seed, target: Math.min(MAX_TARGET, winnerMoves(game)), name: card.names[0], extra });
}

/** The setup a link describes, or null when its keys don't fit together. */
function setupOf(extra: Record<string, string>): Setup | null {
  const { l, p, g, b, n2, n3, n4 } = extra;
  if (l !== undefined) {
    if (!/^[1-9]\d?$/.test(l) || Number(l) > LEVEL_COUNT || p !== undefined || g !== undefined || b !== undefined || n2 !== undefined || n3 !== undefined || n4 !== undefined) return null;
    return levelSetup(Number(l));
  }
  if (p !== undefined && !/^[234]$/.test(p)) return null;
  const players = (p ? Number(p) : 1) as Players;
  if (g !== undefined && (g !== "2" || players === 1)) return null;
  const pieces: Pieces = players === 1 || g ? 2 : 1;
  if ([n2, n3, n4].some((name, index) => name !== undefined && index + 2 > players)) return null;
  let bots = 0;
  if (b !== undefined) {
    if (!/^\d{1,2}$/.test(b) || players === 1) return null;
    bots = Number(b);
    if (bots === 0 || bots % 2 || bots >= 1 << players) return null;
  }
  return classicSetup(players, pieces, bots);
}

/**
 * Reads a link and replays it from the seed with its choices: it must end, and the rolls must match `t`.
 * Null for anything broken, out of range or not adding up.
 */
export function parseCard(hash: string): Result | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TARGET, extraKeys: ["l", "p", "g", "b", "c", "n2", "n3", "n4"] });
  if (!challenge) return null;
  const setup = setupOf(challenge.extra);
  if (!setup) return null;
  const c = challenge.extra.c ?? "";
  if (c.length > MAX_CHOICES / 4) return null;
  const choices = readChoices(c);
  if (!choices) return null;
  // The hex pads the choices to a multiple of four; the replay accepts only the real count.
  let game: Game | null = null;
  for (let count = Math.max(0, choices.length - 3); count <= choices.length && !game; count++) game = replaySetup(setup, challenge.seed, choices.slice(0, count));
  if (!game || choicesText(game.choices) !== c || Math.min(MAX_TARGET, winnerMoves(game)) !== challenge.target) return null;
  const { n2, n3, n4 } = challenge.extra;
  const names = setup.level ? [cleanPlayerName(challenge.name)]
    : [cleanPlayerName(challenge.name), ...[n2, n3, n4].slice(0, setup.players - 1).map((name, index) => isBot(setup, index + 1) ? "" : cleanPlayerName(name ?? ""))];
  return { card: { seed: challenge.seed, players: setup.players, pieces: setup.pieces, choices: game.choices, names, level: setup.level, bots: setup.bots }, game };
}

/** The friend's game and mine are the same race when the seed and the setup match. */
export const sameRace = (mine: Card, theirs: Card) => mine.seed === theirs.seed && mine.players === theirs.players && mine.pieces === theirs.pieces && mine.level === theirs.level;

/** The square each seat's leading piece reached. */
export const bestSquares = (game: Game) => Array.from({ length: game.players }, (_, seat) => leadSquare(game, seat));

export const biteText = (bites: number) => bites === 0 ? "একবারও সাপ কামড়ায়নি" : `সাপ কামড়াল ${bn(bites)} বার`;
export const climbText = (climbs: number) => climbs === 0 ? "সিঁড়ি পায়নি" : `সিঁড়ি ${bn(climbs)}টা`;

const SOLO_LINES = [
  "সিঁড়ির পর সিঁড়ি। আজ ছক্কা তোমার কথা শুনছে।",
  "সাপগুলো আজ ঘুমিয়ে ছিল মনে হয়।",
  "সিঁড়িও পেলে, সাপও পেলে, তবু ঠিকই পৌঁছে গেছ।",
  "সাপে কেটেছে বারবার, তবু গুটি উঠেই এল।",
  "এত সাপ পেরিয়েও ১০০-তে। ধৈর্য আছে বলতে হবে।",
];

/** The kind line on the card. Solo: by rolls. A level: by place. Group: by how the race went. */
export function humanLine(result: Result) {
  const { card, game } = result, me = game.winner;
  if (card.level) {
    const place = placeOf(game), lost = game.lost[0], gained = game.gained[0];
    if (place === 1 && game.bites[0] === 0) return "একটা সাপও ছুঁতে পারেনি। সোজা ঘরে।";
    if (place === 1 && lost > gained) return `সাপে ${bn(lost)} ঘর নেমেও সবার আগে ঘরে।`;
    if (place === 1) return gained ? `সিঁড়িতে ${bn(gained)} ঘর উঠে সবার আগে ঘরে।` : "সিঁড়ি ছাড়াই সবার আগে ঘরে।";
    const first = nameIn(card, game.home[0]);
    return lost ? `${first} আগে পৌঁছাল। সাপ নামিয়েছে ${bn(lost)} ঘর।` : `${first} একটু আগে পৌঁছাল। পরেরবার তুমি।`;
  }
  if (card.players === 1) return game.bites[0] === 0 ? "একটা সাপও ছুঁতে পারেনি। আজ কপাল ঝকঝকে।" : SOLO_LINES[band(winnerMoves(game))];
  const name = nameIn(card, me), squares = bestSquares(game), next = Math.max(...squares.filter((_, seat) => seat !== me));
  if (game.bites[me] === 0) return `${possessive(name)} গায়ে একবারও সাপ লাগেনি, সোজা ১০০-তে।`;
  if (next >= 90) return `গায়ে গায়ে লড়াই। আরেকজন তখন ${bn(next)}-এ দাঁড়িয়ে।`;
  if (game.bites[me] >= Math.max(...game.bites) && game.bites[me] >= 2) return `সবচেয়ে বেশি সাপের কামড় খেয়েও জিতে গেল ${name}।`;
  if (next < 60) return "অন্যরা তখনো মাঝপথে, একাই দৌড়।";
  return `আজ ${possessive(name)} ভাগ্য সবচেয়ে ভালো।`;
}

/** "রাফি জিতল!", "১ম হয়ে ঘরে!" or, solo, "রাফি ১০০-তে!" / "১০০-তে উঠেছ!". */
export function headline(result: Result) {
  const { card, game } = result;
  if (card.level) {
    const place = placeOf(game);
    return place === 1 ? "১ম হয়ে ঘরে!" : `${ordinal(place)} হয়ে ঘরে`;
  }
  if (card.players > 1) return `${nameIn(card, game.winner)} জিতল!`;
  return card.names[0] ? `${card.names[0]} ১০০-তে!` : "১০০-তে উঠেছ!";
}

/** The best ladder and the worst snake of a seat, for the card: "সেরা সিঁড়ি: আম্মুর হাতের খিচুড়ি". */
export function highlights(game: Game, seat = game.setup.until === "me" ? 0 : game.winner) {
  const { board } = game.setup, ladder = game.bestLadder[seat], snake = game.worstSnake[seat], lines: string[] = [];
  if (ladder >= 0) lines.push(`সেরা সিঁড়ি: ${board.jumps[ladder].caption}`);
  if (snake >= 0) lines.push(`বড় কামড়: ${board.jumps[snake].caption}`);
  return lines;
}

/** One line of everyone's finishing squares: "রাফি ১০০ · মিম ৮৭ · নীল ৬৫". */
export function scoreboard(result: Result) {
  return bestSquares(result.game).map((square, seat) => `${nameIn(result.card, seat)} ${bn(square)}`).join(" · ");
}

/** The end screen's numbers for one seat. */
export function raceStats(game: Game, seat: number) {
  return { rolls: game.moves[seat], sixes: game.sixes[seat], gained: game.gained[seat], lost: game.lost[seat], climbs: game.climbs[seat], bites: game.bites[seat] };
}

const who = (name: string) => name || "বন্ধু";

/** After a friend's link, on the same dice: fewer rolls is better. */
export function versusLine(mine: number, theirs: number, name: string) {
  const diff = Math.abs(mine - theirs);
  if (mine < theirs) return `${possessive(who(name))} চেয়ে ${bn(diff)} চাল কম!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${bn(mine)} চাল।`;
  if (diff <= 3) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(diff)} চাল বেশি।`;
  return `এবার ${who(name)} এগিয়ে। একই ছক্কায় আরেকবার দেখো!`;
}

/** A solo race that just missed this phone's best (fewer rolls is better): how many fewer would have done it. Empty when it isn't close. */
export function nearBest(moves: number, best: number | null) {
  if (best === null || moves < best) return "";
  const fewer = moves - best + 1;
  return fewer <= 10 ? `আর ${bn(fewer)} চাল কম লাগলেই নতুন সেরা।` : "";
}

/** The third star's near miss on a level: "আর ২ চাল কম হলেই ৩ তারা।" */
export function nearPar(game: Game) {
  if (!game.setup.level || placeOf(game) !== 1) return "";
  const over = game.moves[0] - levelOf(game.setup.level).par;
  return over > 0 && over <= 4 ? `আর ${bn(over)} চাল কম হলেই ৩ তারা।` : "";
}

const levelName = (level: number) => `লেভেল ${bn(level)} (${levelOf(level).name})`;

export function friendBanner(result: Result) {
  const { card, game } = result, moves = bn(winnerMoves(game));
  if (card.level) return `${card.names[0] || "তোমার বন্ধু"} ${levelName(card.level)}-এ ${moves} চালে ঘরে ফিরেছে, ${ordinal(placeOf(game))} হয়ে।`;
  if (card.players === 1) return `${card.names[0] || "তোমার বন্ধু"} ${moves} চালে ১০০-তে উঠেছে। একই ছক্কা, কার ভাগ্য ভালো?`;
  return `${nameIn(card, game.winner)} জিতেছে ${moves} চালে, ${bn(card.players)} জনের খেলায়। এবার তোমরা খেলো!`;
}
export const friendNote = (result: Result) => result.card.level || result.card.players === 1
  ? "একই ছক্কা পড়বে। কোন গুটি চালবে, সেটা তোমার হাতে।"
  : "ওদের প্রতিটা চাল মিলিয়ে দেখা হয়েছে। তোমাদের খেলায় ছক্কা পড়বে নতুন করে।";

export function previewTitle(result: Result) {
  const { card, game } = result, moves = bn(winnerMoves(game));
  if (card.level) return `${card.names[0] || "এক বন্ধু"} সাপলুডুর ${levelName(card.level)}-এ ${moves} চালে ঘরে। একই ছক্কায় তুমি পারবে?`;
  if (card.players === 1) return `${card.names[0] || "এক বন্ধু"} ${moves} চালে ১০০-তে উঠেছে। একই ছক্কায় তুমি পারবে?`;
  return `${nameIn(card, game.winner)} জিতল ${moves} চালে, ${biteText(game.bites[game.winner])}! তোমরা সাপলুডু খেলবে?`;
}

export function caption(result: Result) {
  const { card, game } = result, moves = bn(winnerMoves(game));
  if (card.level) return `সাপলুডুর ${levelName(card.level)}-এ ${moves} চালে ঘরে ফিরলাম, ${ordinal(placeOf(game))} হয়ে। একই ছক্কায় তুমি কত চালে পারবে?`;
  if (card.players === 1) return `সাপলুডুতে ${moves} চালে ১০০-তে উঠলাম, ${biteText(game.bites[0])}! একই ছক্কায় তুমি কত চালে পারবে?`;
  return `সাপলুডুতে আজ ${nameIn(card, game.winner)} জিতল ${moves} চালে! তোমাদের বাসায় কার ভাগ্য ভালো?`;
}

/** What a landing says: the caption, and the squares. */
export function jumpLine(board: Board, jump: number) {
  const { from, to, caption: text } = board.jumps[jump], up = to > from;
  return { title: `${text}!`, sub: `${bn(from)} থেকে ${bn(to)}-তে ${to === board.last ? "উঠে ঘরে!" : up ? "উঠল" : "নামল"}`, up };
}

/** The classic board's landing line, for old callers. */
export const jumpNews = (jump: number) => jumpLine(CLASSIC, jump);

/** Stars for a result (levels only). */
export const resultStars = (result: Result) => starsOf(result.game);

/** The classic board, for callers that still assume it. */
export const CLASSIC_BOARD = CLASSIC;
