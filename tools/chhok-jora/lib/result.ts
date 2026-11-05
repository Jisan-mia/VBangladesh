// The end screen's words and numbers, the start card's star rule, and the edge warning. Kind either way, exact in numbers.
import { quiltStats, totalPoints, type Game } from "./quilt";
import { levelOf, starsFor } from "./levels";
import { bn } from "./challenge";

export type Stat = { label: string; value: number; of?: number; unit: "" | "time" };

/** "১:০৫" style clock, Bangla digits. */
export function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${bn(Math.floor(s / 60))}:${bn(s % 60).padStart(2, "০")}`;
}

/** The end screen's big line. `names` are the two sides as shown while playing. */
export function finishTitle(game: Game, level: number, names: readonly [string, string], firstClear: boolean) {
  const [mine, theirs] = game.score, line = `${bn(mine)}–${bn(theirs)}`;
  if (!level) return mine === theirs ? `${line}, সমান সমান!` : `${line}, ${names[mine > theirs ? 0 : 1]} জিতেছে!`;
  const info = levelOf(level);
  if (mine > theirs) return info?.finale && firstClear ? `${info.finale} পার!` : `${line}, কাঁথা তোমার!`;
  if (mine === theirs) return `${line}, সমান সমান`;
  return `${line}, এবার ${names[1]} জিতল`;
}

/** Four real numbers from the game, counted up on the end screen. */
export function finishStats(game: Game, seconds: number): Stat[] {
  const stats = quiltStats(game), total = totalPoints(game.setup);
  if (!game.setup.bot) {
    return [
      { label: "লাল সুতোর ফুল", value: game.score[0], of: total, unit: "" },
      { label: "নীল সুতোর ফুল", value: game.score[1], of: total, unit: "" },
      { label: "এক টানে সেরা", value: Math.max(stats.run[0], stats.run[1]), unit: "" },
      { label: "সময়", value: Math.round(seconds), unit: "time" },
    ];
  }
  return [
    { label: "তোমার ফুল", value: game.score[0], of: total, unit: "" },
    { label: "এক টানে সেরা", value: stats.run[0], unit: "" },
    { label: "ছেড়ে দেওয়া ঘর", value: stats.handed[0], unit: "" },
    { label: "সময়", value: Math.round(seconds), unit: "time" },
  ];
}

/** The line under the stats on a lesson: what the lesson was about, or how to fix it. */
export function lessonLine(game: Game, level: number) {
  const won = game.score[0] > game.score[1];
  switch (level) {
    case 1: return won ? "ঘর বন্ধ করলে আরেকটা ফোঁড়: এক টানে সব ফুল।" : "আগে যেখানে চার নম্বর পাশ পড়ে, সেখানে সেলাই দাও।";
    case 2: return won ? "তিন নম্বর ফোঁড় দাওনি, ঘরগুলো এল তোমার কাছে।" : "লাল আভার ফোঁড়ে ঘর চলে যায়। সাদা ফোঁড় খোঁজো।";
    case 3: return won ? "ছোট সারিটা দিলে, বড়টা এল তোমার হাতে।" : "দেখো, কোন ফোঁড়ে কম ঘর যায়। ছোট সারিটা আগে দাও।";
    case 7: return won ? "দুটো ঘর ছেড়ে দিয়েই বড় সারিটা পেলে।" : "শেষ দুটো ঘর নিয়ো না: দূরের ফোঁড়টা দাও, তারপর অপেক্ষা।";
    default: return "";
  }
}

/** The next goal in exact numbers: what one more star, or the win, would have taken. Empty when there's none. */
export function nextGoal(game: Game, level: number) {
  const info = levelOf(level);
  if (!info || !game.over) return "";
  const [mine, theirs] = game.score, stars = starsFor(level, game.score);
  if (!stars) {
    // Each flower that changes sides counts twice: k more for you means mine + k > theirs − k.
    const more = Math.floor((theirs - mine) / 2) + 1;
    return info.lesson ? "শেষ ফোঁড়টা ফিরিয়ে আনো, আবার দেখো।" : `আর ${bn(more)}টা ফুল পেলেই জিত।`;
  }
  if (stars === 3) return "";
  const target = stars === 1 ? info.two : info.three;
  return `আর ${bn(target - mine)}টা ফুল পেলে ${bn(stars + 1)} তারা।`;
}

/** How a level earns its stars, in one line for the start card. */
export function starRule(level: number) {
  const info = levelOf(level);
  if (!info) return "";
  const total = totalPoints(info.setup);
  return `${bn(total)}টার ${bn(info.three)}টা ফুল পেলে ৩ তারা`;
}

/**
 * The edge, 0 calm · 1 careful (the held or armed stitch gives flowers away) · 2 no safe stitch left on your turn
 * (every stitch now gives some away). Only on the mover's turn when a person moves.
 */
export function danger(game: Game, yourTurn: boolean, heldGift: number, leastGift: number) {
  if (game.over || !yourTurn) return 0;
  if (heldGift > 0 && heldGift > leastGift) return 1;
  return leastGift > 0 && Number.isFinite(leastGift) ? 2 : 0;
}

/** The line under the cloth when a stitch is held or armed and gives flowers away. */
export function warnLine(gift: number, armed: boolean, taker: string, least: number) {
  const base = `এই ফোঁড়ে ${taker} ${bn(gift)}টা ফুল পাবে।`;
  if (!armed) return base;
  return least > 0 ? `${base} অন্য ফোঁড়ে ${bn(least)}টা। তবু দিতে চাইলে আবার চাপো।` : `${base} তবু দিতে চাইলে আবার চাপো।`;
}

export const takerOf = (names: readonly [string, string], mover: 0 | 1) => names[mover === 0 ? 1 : 0];
