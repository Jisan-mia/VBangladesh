// The end screen's words and numbers, for lessons and full games alike. Kind either way, exact in numbers.
import { humanSide, ownMoves, winStars, GOAT, GOATS, TIGER, type Game } from "./game";
import { bn, headline, humanLine, nearMiss, sideWord } from "./link";

const goatsOnBoard = (game: Game) => game.goats.reduce((sum, count) => sum + count, 0);
/** Goats a start began with (20 on the full board, a handful in a lesson). */
export const goatsAtStart = (game: Game) => game.start.goats.reduce((sum, count) => sum + count, 0);

/** The end screen's big line. */
export function finishTitle(game: Game) {
  const me = humanSide(game.mode);
  if (me === null) return `${headline(game)}!`;
  const won = game.winner === me, own = bn(ownMoves(game));
  if (me === TIGER) {
    if (won) return game.ending === "stuck" ? "ছাগলের আর চাল নেই!" : `${bn(game.taken)}টা ধরা, ${own} চালে`;
    return game.ending === "trap" ? "বাঘ আটকা পড়ল" : "চাল ফুরিয়ে গেল";
  }
  if (won) return game.ending === "trap" ? "বাঘ বন্দি!" : `টিকে গেছ, ${bn(game.start.cap)} চাল`;
  return game.ending === "hunt" ? `বাঘ ধরল ${bn(game.taken)}টা` : game.ending === "free" ? "বাঘ ছাড়া পেল" : "ছাগলের আর চাল নেই";
}

export type Stat = { label: string; value: number; of?: number; unit: "" | "time" };

/** Four real numbers from the game, counted up on the end screen. */
export function finishStats(game: Game, seconds: number, takeBacks: number): Stat[] {
  const me = humanSide(game.mode);
  const moves: Stat = me === null ? { label: "মোট চাল", value: game.moves.length, unit: "" } : { label: "তোমার চাল", value: ownMoves(game), unit: "" };
  const goats: Stat = me === GOAT
    ? { label: "বাঁচানো ছাগল", value: goatsOnBoard(game), of: goatsAtStart(game), unit: "" }
    : { label: "ধরা ছাগল", value: game.taken, of: game.start.goal, unit: "" };
  return [moves, goats, { label: "সময়", value: Math.round(seconds), unit: "time" }, { label: "ফিরিয়ে আনা", value: takeBacks, unit: "" }];
}

/** "১:০৫" style clock, Bangla digits. */
export function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${bn(Math.floor(s / 60))}:${bn(s % 60).padStart(2, "০")}`;
}

/** The kind line under the stats. */
export function finishLine(game: Game) {
  const me = humanSide(game.mode);
  if (game.start.par === undefined) return humanLine(game);
  const won = me !== null && game.winner === me;
  if (me === TIGER) return won ? game.start.goal > 2 ? `${bn(game.taken)}টা ধরা, হাতে ছিল আরও ${bn(game.start.cap - game.moves.length)} চাল।` : "লাফের নিয়ম শেখা হয়ে গেল।" : "পেছনে ফাঁকা আছে এমন ছাগল খোঁজো, আলো জ্বলা বাঘে চাপো।";
  if (won) return game.tigers.length > 1 ? "দুটো বাঘই বন্দি, একটা ছাগলও যায়নি।" : "বাঘের কোনো পথ খোলা নেই।";
  return game.ending === "hunt" ? "লাল দাগের ছাগলের পেছনটা ফাঁকা ছিল।" : "বাঘের একটা পথ খোলা ছিল। সবুজ আলো দেখো।";
}

/** The next goal in exact numbers: what one more star, or the win, would have taken. Empty when there's none. */
export function nextGoal(game: Game) {
  const me = humanSide(game.mode), par = game.start.par;
  if (me === null || !game.over) return "";
  if (par === undefined) return nearMiss(game);
  const stars = winStars(game), own = ownMoves(game);
  if (!stars) {
    if (me === TIGER) return `আর ${bn(game.start.goal - game.taken)}টা ধরলেই জিত। শেষ চালটা ফিরিয়ে আবার দেখো।`;
    return "শেষ চালটা ফিরিয়ে আনো, আবার দেখো।";
  }
  if (stars === 3) return "";
  return `আর ${bn(own - (stars === 2 ? par : par + 2))} চাল কম লাগলে ${bn(stars + 1)} তারা।`;
}

/** How a level earns its stars, in one line for the start card. */
export function starRule(game: Game) {
  const me = humanSide(game.mode), par = game.start.par;
  if (me === null) return "";
  if (par !== undefined) return `${bn(par)} চালে পারলে ৩ তারা`;
  return me === TIGER ? "৪০ চালের মধ্যে ৮টা ধরলে ৩ তারা" : "বাঘ বন্দি করলে ৩ তারা";
}

/** The edge warning, 0 calm · 1 careful · 2 about to lose, from the person's point of view. */
export function danger(game: Game, threats: number, tigerRoom: number) {
  const me = humanSide(game.mode);
  if (me === null || game.over) return 0;
  if (me === GOAT) return !threats ? 0 : game.taken >= game.start.goal - 1 ? 2 : 1;
  // The tiger's warnings belong to real games: in a lesson the board is small on purpose.
  if (game.start.par !== undefined && game.start.cap < 30) return 0;
  const left = game.start.cap - game.moves.length;
  if (tigerRoom <= 1) return 2;
  return tigerRoom <= 3 || left <= 10 ? 1 : 0;
}

export { sideWord, GOATS };
