// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { dailyMaze, fastestTenths, isDailySeed, levelMaze, parFor, starsForTime, LEVEL_COUNT, SLOW_SPEED, SPEED, type Par } from "./levels";
import type { Maze } from "./maze";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const tenthsFormat = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** 124 → "১২.৪" */
export const seconds = (tenths: number) => tenthsFormat.format(tenths / 10);

/** A finished maze: `level` 1–30, or 0 for a daily maze whose seed is its Dhaka date. Time in tenths of a second, as the player's phone measured it. */
export type Shared = { level: number; seed: number; tenths: number; stars: number; clean: boolean; name: string };

export const MAX_TENTHS = 36000;
export const mazeOf = ({ level, seed }: Pick<Shared, "level" | "seed">): Maze => level ? levelMaze(level) : dailyMaze(seed);

/**
 * `#s=<seed>&t=<tenths>&l=<level, 0 = daily>&r=<stars>&c=1 (never turned back)&n=<name>`.
 * The seed must be that level's maze (or a real date), the time no faster than the shortest way at full speed,
 * and the stars what that time earns. Anything that doesn't add up is refused.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["l", "r", "c"] });
  if (!challenge) return null;
  const { seed, target: tenths, name, extra } = challenge;
  if (!/^(0|[1-9]\d?)$/.test(extra.l ?? "") || !/^[1-3]$/.test(extra.r ?? "") || (extra.c !== undefined && extra.c !== "1")) return null;
  const level = Number(extra.l), stars = Number(extra.r);
  if (level > LEVEL_COUNT) return null;
  if (level ? levelMaze(level).seed !== seed : !isDailySeed(seed)) return null;
  const maze = mazeOf({ level, seed });
  if (tenths < fastestTenths(maze)) return null;
  // ধীরে খেলো gives more time, so the stars may sit anywhere between what normal and slow play would earn.
  if (stars < starsForTime(tenths, parFor(maze, SPEED)) || stars > starsForTime(tenths, parFor(maze, SLOW_SPEED))) return null;
  return { level, seed, tenths, stars, clean: extra.c === "1", name };
}

export function sharedHash({ level, seed, tenths, stars, clean, name }: Shared) {
  return challengeHash({ seed, target: tenths, name, extra: { l: level, r: stars, ...(clean ? { c: 1 } : {}) } });
}

const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
/** 20261012 → "১২ অক্টোবর" */
export const dayLabel = (seed: number) => `${bn(seed % 100)} ${MONTHS[Math.floor(seed / 100) % 100 - 1]}`;

/** "লেভেল ৭" or "১২ অক্টোবরের গোলকধাঁধা" */
export const mazeLabel = ({ level, seed }: Pick<Shared, "level" | "seed">) => level ? `লেভেল ${bn(level)}` : `${possessive(dayLabel(seed))} গোলকধাঁধা`;

/** "রাফি ১২.৪ সেকেন্ডে লেভেল ৭ পার করেছে" */
export function feat(shared: Pick<Shared, "level" | "seed" | "tenths" | "name">) {
  return `${cleanName(shared.name) || "এক বন্ধু"} ${seconds(shared.tenths)} সেকেন্ডে ${mazeLabel(shared)} পার করেছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function caption(shared: Pick<Shared, "level" | "seed" | "tenths">) {
  const what = shared.level ? `গোলকধাঁধার লেভেল ${bn(shared.level)}` : mazeLabel(shared);
  return `${what} পার করলাম ${seconds(shared.tenths)} সেকেন্ডে। তুমি কত সেকেন্ডে পারবে?`;
}

/** The card's line: the stars, and whether the pencil line ever turned back. */
export function humanLine(stars: number, clean: boolean) {
  if (stars >= 3) return clean ? "একবারও কানাগলিতে ঢোকা হয়নি। জিলাপি এখনো গরম।" : "দোকানে পৌঁছে দেখি জিলাপি এখনো গরম।";
  if (stars === 2) return clean ? "পথ ভুল হয়নি, শুধু হাঁটা একটু ধীরে।" : "একটু ঘুরপথ হলো, তবে জিলাপি পাওয়া গেছে।";
  return clean ? "ধীরে-সুস্থে হেঁটে দোকানে। জিলাপি পাওয়া গেছে।" : "কয়েকটা কানাগলি ঘুরে তারপর দোকান। জিলাপি পাওয়া গেছে।";
}

/** "আর ১.৩ সেকেন্ড কম লাগলে ৩ তারা।", with the exact gap to the next star; null at three stars. */
export function nearMiss(tenths: number, par: Par) {
  if (tenths <= par.three) return null;
  return tenths <= par.two
    ? `আর ${seconds(tenths - par.three)} সেকেন্ড কম লাগলে ৩ তারা।`
    : `আর ${seconds(tenths - par.two)} সেকেন্ড কম লাগলে ২ তারা।`;
}

/** After playing a friend's maze: less time wins, and it stays kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${seconds(theirs - mine)} সেকেন্ড আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${seconds(theirs)} সেকেন্ডেই পৌঁছেছিল।`;
  if (mine - theirs <= 20) return `আর একটু হলেই! মাত্র ${seconds(mine - theirs)} সেকেন্ড পিছিয়ে।`;
  return `${who} এখনো ${seconds(mine - theirs)} সেকেন্ড এগিয়ে। আরেকবার?`;
}
