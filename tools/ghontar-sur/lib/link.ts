// Challenge links, the daily tune and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { levelOf, levelsCleared, LEVEL_COUNT, MAX_LEN, STAGE } from "./game";

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

/** A run's result as a friend sees it: the tune's seed, the notes repeated (the player's own phone's count) and an optional name. */
export type Shared = { seed: number; score: number; name: string };

/** `#s=<seed>&t=<notes repeated>&n=<name>`. The score can't be re-checked, so the page calls it the friend's own phone's score. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_LEN });
  return challenge ? { seed: challenge.seed, score: challenge.target, name: challenge.name } : null;
}

export const sharedHash = ({ seed, score, name }: Shared) => challengeHash({ seed, target: score, name });

/** Each level is a stop at the fair (মেলা), so a longer tune walks you deeper in. */
export const PLACES = ["মেলার গেট", "বাঁশির দোকান", "নাগরদোলা", "পুতুলনাচ", "কুমোরের দোকান", "বায়োস্কোপ", "কদমা-বাতাসা", "বটতলার আসর", "হ্যাজাকের আলো", "মেলার শেষ মাথা"] as const;

export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${PLACES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1]}`;

const CLEAR_LINES = [
  "মেলার গেট পেরিয়ে ভেতরে ঢুকলে।",
  "বাঁশিওয়ালা বাঁশি থামিয়ে শুনছে।",
  "নাগরদোলা এবার তোমাকে নিয়ে ঘুরবে।",
  "পুতুলনাচের পর্দা উঠল।",
  "কুমোর চাচা চাক থামিয়ে তাকিয়ে আছেন।",
  "বায়োস্কোপের বাক্সে চোখ রাখো।",
  "কদমা-বাতাসার দোকানে ভিড় জমেছে।",
  "বটতলার আসরে ঢোলও থেমে গেছে।",
  "হ্যাজাক জ্বলল, মেলা এখনো জমজমাট।",
  "মেলার শেষ মাথায় পৌঁছে গেলে।",
] as const;

/** The level-clear line: the number, then one picture from the fair. */
export const clearLine = (level: number) => `${bn(level * STAGE)}টা সুর। ${CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1]}`;

/** The line on the card, seen by friends: first person, one picture. */
export function cardLine(score: number) {
  if (score >= MAX_LEN) return "পুরো ৯৯ সুরের গান শেষ পর্যন্ত বাজালাম।";
  if (score >= LEVEL_COUNT * STAGE) return "মেলার শেষ মাথা পর্যন্ত সুর মনে ছিল।";
  const cleared = levelsCleared(score);
  if (!cleared) return score ? "শুরুটা হলো। মেলার গেট আর কয়েক সুর দূরে।" : "কলসিগুলো চিনে নিলাম। সুর ধরব পরেরবার।";
  return `${PLACES[cleared - 1]} পর্যন্ত সুর মনে ছিল।`;
}

/** The near-miss line after a run, with exact numbers. Empty when nothing was close. */
export function nearMiss(score: number, best: number | null) {
  if (score >= MAX_LEN) return "";
  if (best !== null && best > score && best - score <= 2) return `তোমার সেরা ${bn(best)}। আর ${bn(best - score)}টা হলেই সেরাটা ছুঁতে।`;
  const toLevel = STAGE - (score % STAGE);
  if (toLevel <= 2) return `আর ${bn(toLevel)}টা সুর হলেই লেভেল ${bn(levelOf(score + 1))} পার।`;
  return "";
}

/** "রাফি ১৪টা সুর মনে রেখে বাজিয়েছে" */
export function feat({ score, name }: Pick<Shared, "score" | "name">) {
  const who = cleanName(name) || "এক বন্ধু";
  return `${who} ${bn(score)}টা সুর মনে রেখে বাজিয়েছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ seed, name }: Pick<Shared, "seed" | "name">) {
  const who = cleanName(name) || "বন্ধু";
  const tune = isDailySeed(seed) ? `${possessive(dayLabel(seed))} রোজের সুর` : "একই সুর";
  return `এটা ${possessive(who)} নিজের ফোনের স্কোর। ${tune}, এবার তোমার পালা।`;
}

/** After playing a friend's tune: more notes is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine > theirs) return `${possessive(who)} চেয়ে ${bn(mine - theirs)}টা সুর বেশি!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)}টা পেরেছিল।`;
  if (theirs - mine <= 2) return `আর একটু হলেই! মাত্র ${bn(theirs - mine)}টা সুর কম।`;
  return `${who} এখনো ${bn(theirs - mine)}টা সুর এগিয়ে। আরেকবার?`;
}

export function caption({ seed, score }: Pick<Shared, "seed" | "score">) {
  const tune = isDailySeed(seed) ? `${possessive(dayLabel(seed))} রোজের সুরে` : "ঘণ্টার সুরে";
  return `${tune} ${bn(score)}টা সুর মনে রেখে বাজালাম। একই সুর তুমি কয়টা পর্যন্ত পারো?`;
}
