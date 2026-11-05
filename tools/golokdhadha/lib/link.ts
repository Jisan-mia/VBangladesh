// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only shared/game-core,
// shared/bangla and lib/ (no React).
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { oldLinkOk } from "./legacy";
import { fastestTenths, isDailySeed, isMode, levelBoard, LEVEL_COUNT, levelDef, MODE_INFO, parOf, starsOf, toNextStar, type Mode, type Par, type Where } from "./levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const tenthsFormat = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** 124 → "১২.৪" */
export const seconds = (tenths: number) => tenthsFormat.format(tenths / 10);

export const MAX_TENTHS = 36000;

/**
 * A finished maze: `level` 1–30, or 0 for a daily maze whose seed is its Dhaka date. Time in tenths of a second, as the
 * player's phone measured it. `old`: a link from before `v=2`, which replays the old plain maze.
 */
export type Shared = { level: number; seed: number; tenths: number; stars: number; clean: boolean; name: string; mode: Mode; slow: boolean; old: boolean };
export const whereOf = ({ level, seed, old }: Pick<Shared, "level" | "seed" | "old">): Where => ({ level, seed, old });

/**
 * `#s=<seed>&t=<tenths>&l=<level, 0 = daily>&r=<stars>&v=2&d=<e|h>&w=1 (slow)&c=1 (never turned back)&n=<name>`.
 * The seed must be that level's board (or a real date), the time no faster than the shortest walk at that speed, and the
 * stars exactly what that time earns. Links without `v` were made before the rewrite: they keep the old checks and replay
 * the old maze. Anything that doesn't add up is refused.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["l", "r", "c", "v", "d", "w"] });
  if (!challenge) return null;
  const { seed, target: tenths, name, extra } = challenge;
  if (!/^(0|[1-9]\d?)$/.test(extra.l ?? "") || !/^[1-3]$/.test(extra.r ?? "") || (extra.c !== undefined && extra.c !== "1")) return null;
  const level = Number(extra.l), stars = Number(extra.r), clean = extra.c === "1";
  if (level > LEVEL_COUNT) return null;
  if (extra.v === undefined) {
    if (extra.d !== undefined || extra.w !== undefined) return null;
    return oldLinkOk(level, seed, tenths, stars, isDailySeed) ? { level, seed, tenths, stars, clean, name, mode: "n", slow: false, old: true } : null;
  }
  if (extra.v !== "2") return null;
  const mode = extra.d ?? "n";
  if (!isMode(mode) || mode === "n" && extra.d !== undefined || (extra.w !== undefined && extra.w !== "1")) return null;
  const slow = extra.w === "1", where: Where = { level, seed, old: false };
  if (level ? levelBoard(level).board.seed !== seed : !isDailySeed(seed)) return null;
  if (tenths < fastestTenths(where, slow)) return null;
  if (stars !== starsOf(tenths, parOf(where, mode, slow), mode)) return null;
  return { level, seed, tenths, stars, clean, name, mode, slow, old: false };
}

/** Old links write exactly the old format; new ones add `v=2` and, off the defaults, `d` and `w`. */
export function sharedHash({ level, seed, tenths, stars, clean, name, mode, slow, old }: Shared) {
  const extra: Record<string, string | number> = { l: level, r: stars };
  if (!old) { extra.v = 2; if (mode !== "n") extra.d = mode; if (slow) extra.w = 1; }
  if (clean) extra.c = 1;
  return challengeHash({ seed, target: tenths, name, extra });
}

const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
/** 20261012 → "১২ অক্টোবর" */
export const dayLabel = (seed: number) => `${bn(seed % 100)} ${MONTHS[Math.floor(seed / 100) % 100 - 1]}`;

/** "লেভেল ৭" or "১২ অক্টোবরের গোলকধাঁধা" */
export const mazeLabel = ({ level, seed }: Pick<Shared, "level" | "seed">) => level ? `লেভেল ${bn(level)}` : `${possessive(dayLabel(seed))} গোলকধাঁধা`;
/** "লেভেল ৬ · চকবাজারের জট", or the plain label for an old link and a daily. */
export const fullLabel = (shared: Pick<Shared, "level" | "seed" | "old">) => shared.level && !shared.old ? `${mazeLabel(shared)} · ${levelDef(shared.level).name}` : mazeLabel(shared);

/** "রাফি ১২.৪ সেকেন্ডে লেভেল ৭ পার করেছে" */
export function feat(shared: Pick<Shared, "level" | "seed" | "tenths" | "name">) {
  return `${cleanName(shared.name) || "এক বন্ধু"} ${seconds(shared.tenths)} সেকেন্ডে ${mazeLabel(shared)} পার করেছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
/** The friend's line under it: the mode and speed they played, and that the time is their phone's. */
export function friendClaim(shared: Shared) {
  const how = [shared.mode !== "n" ? MODE_INFO[shared.mode].name : "", shared.slow ? "ধীরে খেলোয়" : ""].filter(Boolean).join(", ");
  return `${how ? `${how} খেলেছিল। ` : ""}সময়টা ${shared.name ? possessive(shared.name) : "বন্ধুর"} নিজের ফোনের মাপা।`;
}

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

/** "আর ১.৩ সেকেন্ড কম লাগলে ৩ তারা।", with the exact gap to the next star; "" when there's none in this mode. */
export function nearLine(tenths: number, par: Par, mode: Mode) {
  const gap = toNextStar(tenths, par, mode), stars = starsOf(tenths, par, mode);
  if (gap > 0) return `আর ${seconds(gap)} সেকেন্ড কম লাগলে ${bn(stars + 1)} তারা।`;
  if (stars === MODE_INFO[mode].maxStars && stars < 3) return "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।";
  return "";
}

/** After playing a friend's maze: less time wins, and it stays kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${seconds(theirs - mine)} সেকেন্ড আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${seconds(theirs)} সেকেন্ডেই পৌঁছেছিল।`;
  if (mine - theirs <= 20) return `আর একটু হলেই! মাত্র ${seconds(mine - theirs)} সেকেন্ড পিছিয়ে।`;
  return `${who} এখনো ${seconds(mine - theirs)} সেকেন্ড এগিয়ে। আরেকবার?`;
}
