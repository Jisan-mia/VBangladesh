// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and game.ts.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { decodeMoves, encodeMoves, isLevel, isSolved, levelSeed, makePuzzle, MAX_MOVES, replay, shortBy, sizeOf, starsFor, worldOf, WORLDS } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A cleared level: the presses (proven by replaying them), whether a hint was taken (the player's own word), an optional name. */
export type Shared = { level: number; moves: number[]; hinted: boolean; name: string };

/**
 * `#s=<level's seed>&t=<presses>&l=<level>&m=<presses, one character each>&h=1 if a hint was taken&n=<name>`.
 * The presses are replayed from the level's start and must light every bulb in exactly `t` presses. Anything else is refused.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_MOVES, extraKeys: ["l", "m", "h"] });
  if (!challenge) return null;
  const { l = "", m = "", h } = challenge.extra;
  const level = /^[1-9]\d?$/.test(l) ? Number(l) : 0;
  if (!isLevel(level) || challenge.seed !== levelSeed(level) || (h !== undefined && h !== "1")) return null;
  const moves = decodeMoves(m, sizeOf(level));
  if (!moves || moves.length !== challenge.target) return null;
  const game = replay(level, moves);
  if (!game || !isSolved(game)) return null;
  return { level, moves, hinted: h === "1", name: challenge.name };
}

export function sharedHash({ level, moves, hinted, name }: Shared) {
  return challengeHash({ seed: levelSeed(level), target: moves.length, name, extra: { l: level, m: encodeMoves(moves), ...(hinted ? { h: 1 } : {}) } });
}

export const parOf = (level: number) => makePuzzle(level).par;
export const starsOf = ({ level, moves, hinted }: Pick<Shared, "level" | "moves" | "hinted">) => starsFor(moves.length, parOf(level), hinted);

const CLEAR_LINES = [
  ["সব বাতি জ্বলছে। হারিকেনটা আজ তোলাই থাক।", "বারান্দা আলো। পড়ার টেবিলে ফেরা যায়।", "সব বাতি জ্বলল। মশারি টানানোর আগে আরেকটা বোর্ড?"],
  ["মেসের সব বাতি জ্বলল। কেউ আর অন্ধকারে চা ঢালবে না।", "সব বাতি জ্বলছে। পরীক্ষার আগের রাতটা বাঁচল।", "আলো ফিরল। পাশের রুমে আবার গান বাজছে।"],
  ["প্যান্ডেলের সব বাতি জ্বলল, গেটের মরিচবাতিও।", "সব বাতি জ্বলছে। বাবুর্চি এবার ডেকচি খুলুক।", "প্যান্ডেল ঝলমল করছে। ছবি তোলা শুরু হোক।"],
] as const;

/** The level-clear line: one picture from the level's world. */
export function clearLine(level: number) {
  if (level === 30) return "৩০টা বোর্ডের সব বাতি জ্বলল। এবার পাখাটা ছাড়ো।";
  const lines = CLEAR_LINES[worldOf(level)];
  return lines[(level - 1) % lines.length];
}

/** The near-miss line, with exact numbers. Empty at three stars. */
export function nearMiss(moves: number, par: number, hinted: boolean) {
  const earned = starsFor(moves, par, hinted), gap = shortBy(moves, par, hinted);
  if (earned === 3) return "";
  if (gap > 0) return `আর ${bn(gap)} চাল কম হলে ${bn(earned + 1)} তারা।`;
  const extra = moves - par;
  return extra > 0 ? `হিন্ট ছাড়া, আর ${bn(extra)} চাল কম হলে ৩ তারা।` : "হিন্ট ছাড়া পারলে ৩ তারা পাবে।";
}

/** The line on the card, seen by friends: first person, the number first. */
export function cardLine(moves: number, par: number, hinted: boolean) {
  const earned = starsFor(moves, par, hinted);
  if (earned === 3) return "একটা চালও বাড়তি লাগেনি।";
  if (earned === 2) return `সেরা ${bn(par)} চাল, আমার লাগল ${bn(moves)}। কারেন্ট যাওয়ার আগেই।`;
  return "চাল একটু বেশি লাগল, তবে সব বাতি জ্বলেছে।";
}

export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${WORLDS[worldOf(level)]}`;

/** "রাফি লেভেল ১২-এর সব বাতি ৬ চালে জ্বালিয়েছে" */
export function feat({ level, moves, hinted, name }: Shared) {
  const who = cleanName(name) || "এক বন্ধু";
  return `${who}${hinted ? " একটা হিন্ট নিয়ে" : ""} লেভেল ${bn(level)}-এর সব বাতি ${bn(moves.length)} চালে জ্বালিয়েছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
export const bannerNote = "চালগুলো মিলিয়ে দেখেছি, সংখ্যাটা সত্যি। একই বোর্ড, এবার তোমার পালা।";

/** After playing a friend's board: fewer presses is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${bn(theirs - mine)} চাল কম!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)} চালে পেরেছিল।`;
  if (mine - theirs <= 2) return `আর একটু হলেই! মাত্র ${bn(mine - theirs)} চাল বেশি।`;
  return `${who} এখনো ${bn(mine - theirs)} চাল এগিয়ে। আরেকবার?`;
}

export function caption({ level, moves, hinted }: Pick<Shared, "level" | "moves" | "hinted">) {
  const par = parOf(level);
  return starsFor(moves.length, par, hinted) === 3
    ? `সুইচবোর্ডের লেভেল ${bn(level)}, ${bn(moves.length)} চালেই সব বাতি জ্বালালাম। তুমি কয় চালে পারো?`
    : `সুইচবোর্ডের লেভেল ${bn(level)}-এ ${bn(moves.length)} চাল লাগল, সেরা ${bn(par)}। দেখি তুমি কয় চালে পারো।`;
}
