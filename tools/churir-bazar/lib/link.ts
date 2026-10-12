// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { COLOUR_NAMES } from "./art";
import { RAINBOW, SPARKLE } from "./board";
import { encodeMoves, isLevel, levelOf, levelStars, replay, type Game, type Goal } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const WORLDS = ["গ্রামের মেলা", "বৈশাখী মেলা", "চুড়িপট্টি", "রাতের মেলা"] as const;
export const worldOf = (level: number) => Math.max(0, Math.min(3, Math.floor((level - 1) / 10)));

/** A cleared level, proven by replaying its moves. */
export type Shared = { level: number; score: number; count: number; moves: string; name: string };
export const MAX_SCORE = 999_999;

/** `#s=<the level's seed>&t=<score>&l=<level>&m=<moves>&n=<name>`. Nothing is taken on trust: the moves are replayed. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "m"] });
  if (!read) return null;
  const level = read.extra.l ?? "", moves = read.extra.m ?? "";
  if (!/^[1-9]\d?$/.test(level) || !isLevel(Number(level)) || levelOf(Number(level)).seed !== read.seed || !/^[A-Za-z0-9_-]{2,120}$/.test(moves)) return null;
  const game = replay(Number(level), moves);
  return game && game.score === read.target ? fromGame(game, read.name) : null;
}

export const sharedHash = ({ level, score, moves, name }: Pick<Shared, "level" | "score" | "moves"> & { name?: string }) =>
  challengeHash({ seed: levelOf(level).seed, target: score, name, extra: { l: level, m: moves } });

/** Only a cleared level makes a link. */
export function fromGame(game: Game, name: string): Shared | null {
  if (!game.won || !game.moves.length) return null;
  return { level: game.level, score: game.score, count: game.moves.length, moves: encodeMoves(game.moves), name: cleanName(name) };
}

// ---- goals ----
const thing = ([target]: Goal) => (target === SPARKLE ? "ঝিকমিক" : target === RAINBOW ? "রংধনু" : COLOUR_NAMES[target]);
/** "২০টা লাল চুড়ি তোলো" or "২টা ঝিকমিক চুড়ি বানাও" */
export const goalText = (goal: Goal, count = goal[1]) => `${bn(count)}টা ${thing(goal)} চুড়ি ${goal[0] >= SPARKLE ? "বানাও" : "তোলো"}`;
/** "২০টা লাল, ১টা রংধনু" */
export const goalsShort = (level: number) => levelOf(level).goals.map(goal => `${bn(goal[1])}টা ${thing(goal)}`).join(", ");
/** "২০টা লাল চুড়ি তোলো, ২৫ চালে" */
export const goalLine = (level: number) => `${levelOf(level).goals.map(goal => goalText(goal)).join(", ")}, ${bn(levelOf(level).moves)} চালে`;
/** What a goal chip says out loud. */
export const goalLabel = (goal: Goal, left: number) => (left ? `${thing(goal)} চুড়ি, আর ${bn(left)}টা বাকি` : `${thing(goal)} চুড়ি, হয়ে গেছে`);

/** The moves ran out: the goal that came closest. "আর ৩টা নীল চুড়ি হলেই হতো।" */
export function missLine(level: number, left: readonly number[]) {
  const goals = levelOf(level).goals, open = left.map((count, index) => ({ count, goal: goals[index] })).filter(item => item.count > 0);
  if (!open.length) return "";
  const close = open.reduce((best, item) => (item.count < best.count ? item : best));
  return open.length === 1 ? `আর ${bn(close.count)}টা ${thing(close.goal)} চুড়ি হলেই হতো।` : `আর ${bn(close.count)}টা ${thing(close.goal)} চুড়ি বাকি ছিল, সঙ্গে আরও ${bn(open.length - 1)}টা লক্ষ্য।`;
}

// ---- lines ----
const CLEAR_LINES = [
  ["মেলার মাঠে সন্ধ্যা নামছে, হাতে নতুন চুড়ি।", "চুড়িওয়ালা খালা আরেক গোছা নামিয়ে দিলেন।", "নাগরদোলার পাশের দোকানটা প্রায় খালি।"],
  ["বৈশাখের ভিড়ে এই দোকানেই লাইন।", "লাল-সাদা শাড়ির সঙ্গে লাল চুড়ি, মিলে গেল।", "ঢোলের শব্দের ভেতর রিনিঝিনি।"],
  ["চুড়িপট্টির গলিতে এক দোকান পার, সামনে আরও আছে।", "একটা কাচের চুড়িও ভাঙেনি।", "দোকানি বললেন, কাল নতুন মাল আসবে।"],
  ["হারিকেনের আলোয় চুড়িগুলো ঝিকমিক করছে।", "রাত বাড়ছে, তোমার দোকান এখনো খোলা।", "মেলা ভাঙার আগে শেষ গোছাটাও বিক্রি।"],
] as const;
export const clearLine = (level: number) => CLEAR_LINES[worldOf(level)][(level - 1) % 3];

/** The card's human line, by stars. */
export const STAR_LINES = ["", "পার হয়েছে। পরের বার আরও পয়েন্ট তোলা যায়।", "সব চুড়ি তোলা। আর একটু পয়েন্ট হলে ৩ তারা।", "৩ তারা। খালা আরেক গোছা চুড়ি আনতে গেলেন।"] as const;

/** "রাফি ১২ নম্বর লেভেলে ৩২৪০ পয়েন্ট পেয়েছে" */
export function feat({ level, score, name }: Pick<Shared, "level" | "score" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} ${bn(level)} নম্বর লেভেলে ${bn(score)} পয়েন্ট পেয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

/** After playing a friend's level: more points win. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু", ahead = mine - theirs;
  if (ahead > 0) return `${possessive(who)} চেয়ে ${bn(ahead)} পয়েন্ট বেশি!`;
  if (ahead === 0) return `একদম সমান! ${who}ও ${bn(theirs)} পয়েন্ট।`;
  if (-ahead <= Math.max(150, theirs * 0.1)) return `আর একটু হলেই! মাত্র ${bn(-ahead)} পয়েন্ট কম।`;
  return `${who} এখনো ${bn(-ahead)} পয়েন্ট এগিয়ে। আরেকবার?`;
}

export const caption = ({ level, score }: Pick<Shared, "level" | "score">) =>
  `চুড়ির বাজারের ${bn(level)} নম্বর লেভেলে ${bn(score)} পয়েন্ট পেলাম, ${bn(levelStars(level, score))} তারা। তুমি কত পাবে?`;
