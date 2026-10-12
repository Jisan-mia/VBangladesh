// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { cleanName, MAX_SEED } from "../../../shared/game-core";
import { stageName, TOP } from "./board";
import { encodeMoves, isLevel, levelOf, limitOf, replay, startGame, MAX_LINK_MOVES, type Game } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A finished run: `level` 0 is the open garden. Score, top stage and move count all come from replaying the moves. */
export type Shared = { level: number; seed: number; moves: string; count: number; score: number; top: number; name: string };

/**
 * Open garden: `#s=<seed>&t=<score>&c=<moves>&m=<the moves, three a character>&n=<name>`.
 * A level: `#l=<level>&t=<moves>&m=…&n=…`. The moves are replayed from the start, so nothing is taken on trust.
 */
export function parseShared(hash: string): Shared | null {
  if (hash.length > 2000) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const level = params.get("l"), target = params.get("t") ?? "", moves = params.get("m") ?? "", name = cleanName(params.get("n") ?? "");
  if (level !== null) {
    if (!/^[1-9]\d?$/.test(level) || !isLevel(Number(level)) || !/^[1-9]\d{0,3}$/.test(target)) return null;
    const game = replay(startGame(0, Number(level)), moves, Number(target));
    return game ? fromGame(game, name) : null;
  }
  const seed = params.get("s") ?? "", count = params.get("c") ?? "";
  if (!/^[1-9]\d{0,8}$/.test(seed) || Number(seed) > MAX_SEED || !/^(0|[1-9]\d{0,6})$/.test(target) || !/^[1-9]\d{0,3}$/.test(count)) return null;
  const game = replay(startGame(Number(seed)), moves, Number(count));
  return game && game.score === Number(target) ? fromGame(game, name) : null;
}

export function sharedHash({ level, seed, moves, count, score, name }: Omit<Shared, "top" | "name"> & { name?: string }) {
  const params = level ? new URLSearchParams({ l: String(level), t: String(count), m: moves }) : new URLSearchParams({ s: String(seed), t: String(score), c: String(count), m: moves });
  const clean = cleanName(name ?? "");
  if (clean) params.set("n", clean);
  return params.toString();
}

/** What a link can carry: a cleared level, or any open-garden run with at least one move. */
export function fromGame(game: Game, name: string): Shared | null {
  if (!game.moves.length || game.moves.length > MAX_LINK_MOVES || (game.level && !game.won)) return null;
  return { level: game.level, seed: game.seed, moves: encodeMoves(game.moves), count: game.moves.length, score: game.score, top: game.top, name: cleanName(name) };
}

// ---- words ----
/** What each stage looks like when you reach it: the milestone, the level-clear line and the card's line. */
export const STAGE_LINES = [
  "আঁটিটা মাটিতে পড়েছে। এবার জোড়া মেলাও।",
  "চারা গজিয়েছে, দুটো কচি পাতা।",
  "চারা এখন গাছ। ছায়াটা এখনো ছোট।",
  "গাছ ভরে মুকুল, মৌমাছি ঘুরছে।",
  "ডালে ডালে গুটি আম। ঝড় না এলেই হয়।",
  "কাঁচা আম। লবণ-মরিচ নিয়ে বসা যায়।",
  "পাকা আম নামল। জ্যৈষ্ঠের দুপুর জমে গেল।",
  "এক ঝুড়ি আম। পাড়ার সবাইকে দুটো করে।",
  "আঁটি থেকে পুরো বাগান। এবার ছায়ায় বসো।",
] as const;
export const stageLine = (stage: number) => STAGE_LINES[Math.max(1, Math.min(TOP, stage)) - 1];

const GOALS = ["", "একটা চারা গজাও", "চারা থেকে গাছ বানাও", "গাছে মুকুল আনো", "গুটি আম ধরাও", "কাঁচা আম বানাও", "পাকা আম বানাও", "এক ঝুড়ি আম বানাও", "পুরো বাগান বানাও"];
/** "পাকা আম বানাও" */
export const goalText = (level: number) => GOALS[levelOf(level).target - 1];
/** "পাকা আম বানাও, ১৩০ চালের মধ্যে" */
export const goalLine = (level: number) => `${goalText(level)}, ${bn(limitOf(level))} চালের মধ্যে`;

/** "রাফি পাকা আম পর্যন্ত গেছে, ১২৪০ পয়েন্ট" or "রাফি ৭ নম্বর লেভেল ৬২ চালে পার করেছে" */
export function feat({ level, count, score, top, name }: Pick<Shared, "level" | "count" | "score" | "top" | "name">) {
  const who = cleanName(name) || "এক বন্ধু";
  return level ? `${who} ${bn(level)} নম্বর লেভেল ${bn(count)} চালে পার করেছে` : `${who} ${stageName(top)} পর্যন্ত গেছে, ${bn(score)} পয়েন্ট`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

/** After playing a friend's run. Open garden: more points win. A level: fewer moves win. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string, level: boolean) {
  const who = cleanName(name) || "বন্ধু", unit = level ? "চাল" : "পয়েন্ট";
  const ahead = level ? theirs - mine : mine - theirs;
  if (ahead > 0) return `${possessive(who)} চেয়ে ${bn(ahead)} ${unit} ${level ? "কম" : "বেশি"}!`;
  if (ahead === 0) return `একদম সমান! ${who}ও ${bn(theirs)} ${unit}।`;
  const gap = -ahead;
  if (gap <= Math.max(5, theirs * 0.15)) return `আর একটু হলেই! মাত্র ${bn(gap)} ${unit} ${level ? "বেশি" : "কম"}।`;
  return `${who} এখনো ${bn(gap)} ${unit} এগিয়ে। আরেকবার?`;
}

export function caption({ level, count, score, top }: Pick<Shared, "level" | "count" | "score" | "top">) {
  return level
    ? `আঁটি থেকে আমের ${bn(level)} নম্বর লেভেল ${bn(count)} চালে পার করলাম। তুমি কত চালে পারবে?`
    : `আঁটি থেকে আম খেলায় ${stageName(top)} পর্যন্ত গেলাম, ${bn(score)} পয়েন্ট। তুমি কতদূর যাবে?`;
}
