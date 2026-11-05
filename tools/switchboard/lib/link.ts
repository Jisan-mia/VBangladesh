// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and lib/.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLegacyLevel, levelSeed } from "./legacy";
import { PER_WORLD, WORLDS, finaleOf, isFinale, isLevel, levelOf, worldOf } from "./levels";
import { isSolved, puzzleOf, replay, shortBy, starsFor, MAX_MOVES, type Hint } from "./play";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A cleared board: the presses (proven by replaying them), whether a hint was taken (the player's own word), an optional name. */
export type Shared = { level: number; legacy: boolean; moves: number[]; hinted: boolean; name: string };

/** One character per switch: 0–9 then a–z. The first 25 are the old links' alphabet, so both read the same way. */
const MOVE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
export const encodeMoves = (moves: readonly number[]) => moves.map(id => MOVE_CHARS[id]).join("");
export function decodeMoves(text: string) {
  if (text.length < 1 || text.length > MAX_MOVES) return null;
  const moves = [...text].map(char => MOVE_CHARS.indexOf(char));
  return moves.every(id => id >= 0) ? moves : null;
}

/**
 * `#s=<level's seed>&t=<presses>&l=<level>&m=<presses, one character each>&h=1 if a hint was taken&v=2&n=<name>`.
 * Without `v` it is a link from before the rewrite and names one of the 30 old boards. The presses are replayed from the board's
 * start and must light every bulb in exactly `t` presses. Anything else is refused.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_MOVES, extraKeys: ["l", "m", "h", "v"] });
  if (!challenge) return null;
  const { l = "", m = "", h, v } = challenge.extra;
  if ((h !== undefined && h !== "1") || (v !== undefined && v !== "2")) return null;
  const legacy = v === undefined, level = /^[1-9]\d?$/.test(l) ? Number(l) : 0;
  if (!(legacy ? isLegacyLevel(level) : isLevel(level)) || challenge.seed !== levelSeed(level)) return null;
  const moves = decodeMoves(m), puzzle = puzzleOf(level, legacy);
  if (!moves || !puzzle || moves.length !== challenge.target) return null;
  const game = replay(puzzle, moves);
  if (!game || !isSolved(game)) return null;
  return { level, legacy, moves, hinted: h === "1", name: challenge.name };
}

export function sharedHash({ level, legacy, moves, hinted, name }: Shared) {
  return challengeHash({ seed: levelSeed(level), target: moves.length, name, extra: { l: level, m: encodeMoves(moves), ...(hinted ? { h: 1 } : {}), ...(legacy ? {} : { v: 2 }) } });
}

export const parOf = (level: number, legacy: boolean) => puzzleOf(level, legacy)?.par ?? 1;
export const starsOf = ({ level, legacy, moves, hinted }: Pick<Shared, "level" | "legacy" | "moves" | "hinted">) => starsFor(moves.length, parOf(level, legacy), hinted);

// ---- names ----

export const levelName = (level: number) => levelOf(level).finale ?? levelOf(level).name;
export const levelLabel = (level: number, legacy = false) => legacy ? `পুরোনো লেভেল ${bn(level)}` : `লেভেল ${bn(level)} · ${WORLDS[worldOf(level) - 1].name}`;
/** The HUD badge: the level and its house, or "বন্ধুর বোর্ড" on an old link's board. */
export const badge = (level: number, legacy: boolean) => legacy
  ? { main: "বন্ধুর বোর্ড", sub: `পুরোনো লেভেল ${bn(level)}` }
  : { main: isFinale(level) ? levelOf(level).finale! : `লেভেল ${bn(level)}`, sub: WORLDS[worldOf(level) - 1].name };

// ---- the result ----

const CLEAR_LINES = [
  ["সব বাতি জ্বলছে। হারিকেনটা আজ তোলাই থাক।", "বারান্দা আলো। পড়ার টেবিলে ফেরা যায়।", "সব বাতি জ্বলল। মশারি টানানোর আগে আরেকটা বোর্ড?"],
  ["মেসের সব বাতি জ্বলল। কেউ আর অন্ধকারে চা ঢালবে না।", "সব বাতি জ্বলছে। পরীক্ষার আগের রাতটা বাঁচল।", "আলো ফিরল। পাশের রুমে আবার গান বাজছে।"],
  ["প্যান্ডেলের সব বাতি জ্বলল, গেটের মরিচবাতিও।", "সব বাতি জ্বলছে। বাবুর্চি এবার ডেকচি খুলুক।", "প্যান্ডেল ঝলমল করছে। ছবি তোলা শুরু হোক।"],
] as const;
const FINALE_LINES = [
  "নানার বোর্ড মিলল। নানা হলে বলতেন, এবার পাখাটা ছাড়ো।",
  "মেসের সব বাতি জ্বলছে। কাল পরীক্ষা, আজ অন্তত আলো আছে।",
  "বরযাত্রী ঢুকল, গেট থেকে মঞ্চ পর্যন্ত সব বাতি জ্বলছে।",
] as const;

/** The level-clear line: one picture from the level's house. */
export function clearLine(level: number, legacy = false) {
  if (legacy) return "বন্ধুর বোর্ডের সব বাতি জ্বলল।";
  const world = worldOf(level) - 1;
  if (isFinale(level)) return FINALE_LINES[world];
  const lines = CLEAR_LINES[world];
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

/** The end screen's title. */
export function finishTitle(level: number, legacy: boolean, moves: number, firstFinale: boolean) {
  if (!legacy && isFinale(level) && firstFinale) return `${levelOf(level).finale} পার!`;
  return `${bn(moves)} চালে সব বাতি জ্বলল`;
}

/** On a house's finale: the house's stars. On the last one: the whole ladder's. */
export function houseLine(level: number, stars: Record<number, number>) {
  if (!isFinale(level)) return "";
  const world = worldOf(level), from = (world - 1) * PER_WORLD + 1;
  let got = 0;
  for (let at = from; at < from + PER_WORLD; at++) got += stars[at] ?? 0;
  const house = `${WORLDS[world - 1].of} ১০টা বোর্ড: ★ ${bn(got)}/${bn(PER_WORLD * 3)}।`;
  if (world < WORLDS.length) return house;
  const all = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return `${house} তিন বাড়ির ৩০টা বোর্ড: ★ ${bn(all)}/৯০।`;
}

/** The line on the card, seen by friends: first person, the number first. */
export function cardLine(moves: number, par: number, hinted: boolean) {
  const earned = starsFor(moves, par, hinted);
  if (earned === 3) return "একটা চালও বাড়তি লাগেনি।";
  if (earned === 2) return `সেরা ${bn(par)} চাল, আমার লাগল ${bn(moves)}। কারেন্ট যাওয়ার আগেই।`;
  return "চাল একটু বেশি লাগল, তবে সব বাতি জ্বলেছে।";
}

/** "রাফি লেভেল ১২-এর সব বাতি ৬ চালে জ্বালিয়েছে" */
export function feat({ level, legacy, moves, hinted, name }: Shared) {
  const who = cleanName(name) || "এক বন্ধু";
  const where = legacy ? `পুরোনো লেভেল ${bn(level)}` : isFinale(level) ? levelOf(level).finale! : `লেভেল ${bn(level)}`;
  return `${who}${hinted ? " একটা হিন্ট নিয়ে" : ""} ${where}-এর সব বাতি ${bn(moves.length)} চালে জ্বালিয়েছে`;
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

export function caption({ level, legacy, moves, hinted }: Pick<Shared, "level" | "legacy" | "moves" | "hinted">) {
  const par = parOf(level, legacy), where = legacy ? `পুরোনো লেভেল ${bn(level)}` : `লেভেল ${bn(level)}`;
  return starsFor(moves.length, par, hinted) === 3
    ? `সুইচবোর্ডের ${where}, ${bn(moves.length)} চালেই সব বাতি জ্বালালাম। তুমি কয় চালে পারো?`
    : `সুইচবোর্ডের ${where}-এ ${bn(moves.length)} চাল লাগল, সেরা ${bn(par)}। দেখি তুমি কয় চালে পারো।`;
}

// ---- the hint, in words ----

/** What the hinted switch does, why this one, and how many presses are left after it. */
export function hintLine(hint: Hint) {
  const parts = [hint.on ? `${bn(bitsOf(hint.on))}টা জ্বলবে` : "", hint.off ? `${bn(bitsOf(hint.off))}টা নিভবে` : ""].filter(Boolean).join(", ");
  const head = hint.why === "line" ? `লম্বা সুইচটা পুরো ${hint.line === "row" ? "সারি" : "কলাম"} উল্টাবে: ${parts}।`
    : hint.why === "only" ? `দাগ দেওয়া নেভা বাতিতে পৌঁছায় শুধু এই সুইচ। ${parts}।`
    : hint.why === "dip" ? `এখন ${bn(bitsOf(hint.off))}টা নিভবে, তবু পথ এদিকেই।`
    : `এটা চাপলে ${parts}।`;
  return `${head} ${hint.rest ? `তারপর আর ${bn(hint.rest)} চাল।` : "এটাই শেষ চাল।"}`;
}
const bitsOf = (mask: number) => { let n = 0; for (let rest = mask >>> 0; rest; rest &= rest - 1) n++; return n; };

/** The status line under the board while playing. */
export function statusLine(lit: number, cells: number, moves: number, level: number, legacy: boolean) {
  if (!moves && !legacy) return levelOf(level).line;
  return `${bn(lit)}/${bn(cells)}টা বাতি জ্বলছে`;
}

export { finaleOf };
