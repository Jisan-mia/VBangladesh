// ঝালমুড়ি সাপ's rules in one import: the set-up (game.ts), one move (step.hot.ts), speeds, and the lines on the end screen and card.
import { possessive } from "../../../shared/bangla";
import { bn } from "./link";
import { levelInterval, levelOf } from "./levels";
import { BONUS_EVERY, LEVEL_EVERY } from "./rules";
import type { Game } from "./game";

export * from "./game";
export { deadAhead, gateDue, gateWarning, landing, nextDir, step } from "./step.hot";

/** Classic milliseconds per move: a gentle crawl at first, a little quicker every 5 foods. ধীরে খেলো starts slower and never passes 240ms. */
export function interval(eaten: number, slow: boolean) {
  const level = Math.floor(eaten / LEVEL_EVERY);
  return slow ? Math.max(240, 320 - level * 8) : Math.max(100, 220 - level * 12);
}
/** The green chilli's burst: much quicker, a little quicker in ধীরে খেলো (never past 192ms there). */
export const HOT_SPEED = 0.62;
export const HOT_SPEED_SLOW = 0.8;
/** One move of this run right now, in ms. */
export function moveMs(game: Game, slow: boolean) {
  const base = game.goal ? levelInterval(game.level, slow) : interval(game.eaten, slow);
  return game.hot > 0 ? Math.round(base * (slow ? HOT_SPEED_SLOW : HOT_SPEED)) : base;
}

/** The classic game's speed step, shown as "গতি ৩": one up every 5 bites until the snake can't go faster (step 11). */
export const speedStep = (eaten: number) => Math.min(11, 1 + Math.floor(eaten / LEVEL_EVERY));

export const bands = [
  { min: 0, line: "ঠোঙা তো সবে খুলল!" },
  { min: 300, line: "ঝাল সামলে ভালোই খেয়েছ।" },
  { min: 901, line: "ঠোঙা প্রায় খালি!" },
] as const;
export const humanLine = (score: number) => bands.findLast(band => score >= band.min)!.line;

/** After a friend's challenge: kind either way. */
export function compareLine(score: number, target: number, name: string) {
  const who = name || "বন্ধু";
  if (score > target) return `${possessive(who)} চেয়ে ${bn(score - target)} বেশি!`;
  if (score === target) return `একদম সমান! ${who}ও ${bn(target)}।`;
  const gap = target - score;
  if (gap <= Math.max(50, Math.round(target * 0.15))) return `আর একটু হলেই! মাত্র ${bn(gap)} কম।`;
  return `${who} এখনো ${bn(gap)} এগিয়ে। আরেকবার?`;
}

/** The line under a level result: one picture for a clear, the bites left for a crash. */
export function levelLine(level: number, stars: number, eaten: number) {
  if (stars === 3) return "সবগুলো সোনালি মরিচ পেটে। ঝাল একদম ঠিকঠাক।";
  if (stars) return "ঠোঙা খালি। সোনালি মরিচ কিছু রয়ে গেল।";
  return `লেভেল ${bn(level)}: ${bn(levelOf(level).goal)}টার মধ্যে ${bn(eaten)}টা খাওয়া হলো।`;
}

/** What ended the run, in one short line (shown under the heading). */
export const crashLine = { fence: "বেড়ায় ধাক্কা।", tin: "টিনে ধাক্কা।", tail: "নিজের লেজে কামড়!", crow: "কাকের গায়ে ধাক্কা।", gate: "রেলগেট বন্ধ ছিল।", "": "" } as const;

/** What one more try would change, with the exact number; "" when there's nothing close to chase. */
export function nearMiss({ level, won, eaten, golden, score, best }: { level: number; won: boolean; eaten: number; golden: number; score: number; best: number | null }) {
  if (level) {
    const goal = levelOf(level).goal;
    if (!won) return `আর ${bn(goal - eaten)}টা খেলেই লেভেল ${bn(level)} পার।`;
    const offered = Math.floor((goal - 1) / BONUS_EVERY), half = Math.ceil(offered / 2);
    if (golden >= offered) return "";
    const next = golden >= half ? 3 : offered === half ? 3 : 2, need = (next === 3 ? offered : half) - golden;
    return `আর ${bn(need)}টা সোনালি মরিচ পেলেই ${bn(next)} তারা।`;
  }
  if (best === null || score >= best || best - score > Math.max(60, Math.round(best * 0.25))) return "";
  return `আর ${bn(best - score)} পয়েন্ট হলেই নতুন সেরা।`;
}
