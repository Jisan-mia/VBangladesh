// Challenge links, the daily tune and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { MAX_LEN, STAGE } from "./legacy";
import { LEVEL_COUNT, WORLDS, finaleName, isLevel, worldOf } from "./levels";
import { possiblePoints, type Next } from "./score";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** Today's date in Dhaka (UTC+6) as a number like 20261012: the daily tune's seed. */
export function dhakaDate(now = Date.now()) {
  const date = new Date(now + 6 * 3600_000);
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

/** A real calendar date from 2026 to 2099 written as YYYYMMDD. */
export function isDailySeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 20260101 || seed > 20991231) return false;
  const year = Math.floor(seed / 10000), month = Math.floor(seed / 100) % 100, day = seed % 100;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
/** "১২ অক্টোবর" for a daily seed. */
export const dayLabel = (seed: number) => `${bn(seed % 100)} ${MONTHS[(Math.floor(seed / 100) % 100) - 1]}`;

/**
 * A run as a friend sees it. `level` 0 is an endless run (every link made before the rewrite): `score` is the notes
 * repeated. A level of the ladder (`level` 1+, `v` 2) carries its points. Either way the score is the friend's own phone's word.
 */
export type Shared = { seed: number; score: number; name: string; level: number };

/** `#s=<seed>&t=<score>&n=<name>` for endless; `#s=&t=&l=<level>&v=2&n=` for a level. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: Math.max(MAX_LEN, 2000), extraKeys: ["l", "v"] });
  if (!read) return null;
  const { l, v } = read.extra;
  if (l === undefined && v === undefined) return read.target <= MAX_LEN ? { seed: read.seed, score: read.target, name: read.name, level: 0 } : null;
  if (v !== "2" || l === undefined || !/^[1-9]\d?$/.test(l) || !isLevel(Number(l)) || read.target > possiblePoints(Number(l))) return null;
  return { seed: read.seed, score: read.target, name: read.name, level: Number(l) };
}

export const sharedHash = ({ seed, score, name, level }: Shared) =>
  challengeHash({ seed, target: score, name, extra: level ? { l: level, v: 2 } : {} });

/** "রাফি ১৪টা সুর মনে রেখে বাজিয়েছে" / "রাফি লেভেল ৩-এ ২৪০ পেয়েছে" */
export function feat({ score, name, level }: Pick<Shared, "score" | "name" | "level">) {
  const who = cleanName(name) || "এক বন্ধু";
  return level ? `${who} লেভেল ${bn(level)}-এ ${bn(score)} পেয়েছে` : `${who} ${bn(score)}টা সুর মনে রেখে বাজিয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ seed, name, level }: Pick<Shared, "seed" | "name" | "level">) {
  const who = cleanName(name) || "বন্ধু";
  if (level) return `এটা ${possessive(who)} নিজের ফোনের স্কোর। একই সুর, এবার তোমার পালা।`;
  const tune = isDailySeed(seed) ? `${possessive(dayLabel(seed))} রোজের সুর` : "একই সুর";
  return `এটা ${possessive(who)} নিজের ফোনের স্কোর। ${tune}, এবার তোমার পালা।`;
}

/** After playing a friend's tune: more is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string, level: number) {
  const who = cleanName(name) || "বন্ধু", unit = level ? "" : "টা সুর";
  if (mine > theirs) return `${possessive(who)} চেয়ে ${bn(mine - theirs)}${unit} বেশি!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)}${unit} পেয়েছিল।`;
  const near = level ? 30 : 2;
  if (theirs - mine <= near) return `আর একটু হলেই! মাত্র ${bn(theirs - mine)}${unit} কম।`;
  return `${who} এখনো ${bn(theirs - mine)}${unit} এগিয়ে। আরেকবার?`;
}

// ---- the places and lines ----
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${WORLDS[worldOf(level)].name}`;

/** The line on a cleared level's end screen. */
export function clearLine(level: number, mistakes: number) {
  const finale = finaleName(level);
  if (finale) return mistakes ? `${finale} শেষ পর্যন্ত বাজালে।` : `${finale}: একটাও ভুল ছাড়া।`;
  return mistakes ? "সুরটা মনে ছিল, দু-একটা ভুল ছাড়া।" : "একটাও ভুল ছাড়া।";
}

/** The card line, first person, one picture. */
export function cardLine(level: number, score: number, stars: number) {
  if (!level) {
    if (score >= MAX_LEN) return "পুরো ৯৯ সুরের গান শেষ পর্যন্ত বাজালাম।";
    return score >= 10 ? `${bn(score)}টা সুর পর্যন্ত ঘণ্টাগুলো মনে ছিল।` : "ঘণ্টাগুলো চিনে নিলাম। সুর ধরব পরেরবার।";
  }
  const finale = finaleName(level);
  if (finale) return stars ? `‘${finale}’ পুরোটা বাজালাম।` : `‘${finale}’ আর একটু হলেই হতো।`;
  return stars ? `${WORLDS[worldOf(level)].name}-এর সুর মনে ছিল।` : `${WORLDS[worldOf(level)].name}-এর সুরটা আরেকটু শুনতে হবে।`;
}

/** The near-miss line after a run, with exact numbers. Empty when nothing was close. */
export function nearLine(next: Next, mistakes: number) {
  if (!next) return "";
  if (next.kind === "slip") return mistakes === 1 ? `একটাও ভুল না হলে ${bn(next.to)} তারা।` : `আর একটা ভুল কম হলে ${bn(next.to)} তারা।`;
  return `আর ${bn(next.need)}টা ঘণ্টা তালে পড়লে ৩ তারা।`;
}

/** Endless: the notes line after a run. */
export function endlessNear(score: number, best: number | null) {
  if (score >= MAX_LEN) return "";
  if (best !== null && best > score && best - score <= 2) return `তোমার সেরা ${bn(best)}। আর ${bn(best - score)}টা হলেই সেরাটা ছুঁতে।`;
  const toStage = STAGE - (score % STAGE);
  return toStage <= 2 ? `আর ${bn(toStage)}টা সুর হলেই ${bn(score + toStage)}-এ পৌঁছাতে।` : "";
}

/** Under the rack after a slip: which note it was, and the bell it needed. */
export const missLine = (at: number, expected: number, reverse: boolean) =>
  `${reverse ? "উল্টো ক্রমে " : ""}${bn(at + 1)} নম্বর সুরে ${bn(expected + 1)} নম্বর ঘণ্টা ছিল। আবার শোনো।`;

export const caption = ({ seed, score, level }: Pick<Shared, "seed" | "score" | "level">) => {
  if (level) return `‘ঘণ্টার সুর’ খেলার লেভেল ${bn(level)}-এ ${bn(score)} পেলাম। একই সুর তুমি কেমন বাজাও?`;
  const tune = isDailySeed(seed) ? `${possessive(dayLabel(seed))} রোজের সুরে` : "ঘণ্টার সুরে";
  return `${tune} ${bn(score)}টা সুর মনে রেখে বাজালাম। একই সুর তুমি কয়টা পর্যন্ত পারো?`;
};

export { LEVEL_COUNT };
