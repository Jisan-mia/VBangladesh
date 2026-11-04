// Challenge links, saved-progress migration and the lines around a result.
// Server-safe: share.ts (and so /api/share) imports this, so it reaches only pure modules, never React.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge, readLevels } from "../../../shared/game-core";
import { ENDLESS_CROSSINGS, freeScrapes, isMode, LEVEL_COUNT, levelDef, MODE_INFO, starsOf, type Mode } from "./levels";

export const SLUG = "tarer-fanke-belun";
/** Before the rewrite: a best of up to 999 gaps on the endless street, and ten levels of these many crossings. */
export const OLD_MAX = 999;
export const OLD_GATES: readonly number[] = [6, 8, 10, 10, 12, 12, 14, 16, 18, 20];
export const MAX_TENTHS = 36000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** 423 → "৪২.৩" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

/**
 * A friend's run. `old`: a link from before the rewrite (no `v`); it opens the same seed (the endless street, or that
 * level number; বড় ফাঁক as সহজ) and its count shows as the friend's claim from the old game, never compared.
 */
export type Shared = {
  seed: number; score: number; name: string; level: number; mode: Mode; slow: boolean;
  /** v=2 only: balloons lost, scrapes, tenths of a second of flying, and whether the level was cleared. */
  lost: number; grazes: number; tenths: number; won: boolean;
  old: boolean;
};

/**
 * New: `#s=<seed>&t=<crossings>&l=<level, 0 = যত দূর পারো>&v=2&m=<e|h>&k=<lost>&g=<scrapes>&c=<tenths>&d=1&n=<name>`.
 * Old: `#s=&t=&b=1&d=1&l=<1-10>&n=`. Anything impossible for the level and mode rejects the link.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: OLD_MAX, extraKeys: ["b", "d", "l", "v", "m", "k", "g", "c"] });
  if (!challenge) return null;
  const { b, d, l, v, m, k, g, c } = challenge.extra;
  if (d !== undefined && d !== "1") return null;
  const slow = d === "1";
  if (v === undefined) {
    if ((b !== undefined && b !== "1") || m !== undefined || k !== undefined) return null;
    const level = l === undefined ? 0 : /^[1-9]\d?$/.test(l) ? Number(l) : -1;
    if (level < 0 || level > OLD_GATES.length || (level && challenge.target > OLD_GATES[level - 1])) return null;
    return { seed: challenge.seed, score: challenge.target, name: challenge.name, level, mode: b === "1" ? "e" : "n", slow, lost: 0, grazes: 0, tenths: 0, won: false, old: true };
  }
  if (v !== "2" || b !== undefined || !/^(?:0|[1-9]\d?)$/.test(l ?? "") || !/^\d$/.test(k ?? "") || !/^\d{1,3}$/.test(g ?? "") || !/^[1-9]\d{0,4}$/.test(c ?? "")) return null;
  const level = Number(l), mode = m ?? "n", lost = Number(k), grazes = Number(g), tenths = Number(c);
  if (level > LEVEL_COUNT || !isMode(mode) || tenths > MAX_TENTHS) return null;
  const goal = level ? levelDef(level).crossings : ENDLESS_CROSSINGS, balloons = MODE_INFO[mode].balloons;
  if (challenge.target > goal || lost > balloons || grazes > challenge.target + balloons) return null;
  const won = challenge.target === goal && lost < balloons;
  // A run ends either with every crossing passed or with every balloon gone.
  if (!won && lost !== balloons) return null;
  return { seed: challenge.seed, score: challenge.target, name: challenge.name, level, mode, slow, lost, grazes, tenths, won, old: false };
}

/** Old links write exactly the old format; new ones add v=2 with the level, the mode (off normal), losses, scrapes and time. */
export function sharedHash({ seed, score, name, level, mode, slow, lost, grazes, tenths, old }: Omit<Shared, "won">) {
  if (old) {
    const extra: Record<string, number> = {};
    if (level) extra.l = level;
    if (mode === "e") extra.b = 1;
    if (slow) extra.d = 1;
    return challengeHash({ seed, target: Math.min(OLD_MAX, score), name, extra });
  }
  const extra: Record<string, string | number> = { l: level, v: 2 };
  if (mode !== "n") extra.m = mode;
  extra.k = lost; extra.g = grazes; extra.c = tenths;
  if (slow) extra.d = 1;
  return challengeHash({ seed, target: score, name, extra });
}

export const starsOfShared = (shared: Shared) => shared.old ? 0 : starsOf(shared.won, shared.lost, shared.grazes, shared.level, shared.mode);

/* ---------- saved progress ---------- */

/**
 * Old phones kept only a best score on the endless street. Run once, before the level store is first read: every old
 * level no longer than that best counts as cleared with 1 star, up to half of them. Returns the new store, or null.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isFinite(best)) return null;
  const cleared = Math.min(Math.floor(OLD_GATES.length / 2), OLD_GATES.filter(gates => gates <= best).length);
  if (!cleared) return null;
  return JSON.stringify(readLevels(JSON.stringify(Object.fromEntries(Array.from({ length: cleared }, (_, index) => [index + 1, 1]))), LEVEL_COUNT));
}

/* ---------- words ---------- */

const who = (name: string) => name || "বন্ধু";

/** The kind line for the endless street, by score band. */
export function endlessLine(score: number) {
  if (score === 0) return "প্রথম তারেই ফটাস! এ তো সবে শুরু।";
  if (score < 5) return "বেলুনওয়ালা মামা বলছে, আরেকটা নিয়ে যাও।";
  if (score < 15) return "তারের জটে ভালোই পথ খুঁজে নিচ্ছ।";
  if (score < 30) return "তারে বসা কাকগুলোও অবাক হয়ে দেখছে।";
  if (score < 60) return "এই হাতে বেলুন সহজে ফাটে না।";
  return "ঢাকার সব তারের জট তোমার চেনা!";
}

/** One dry line for a result, by how it went. */
export function humanLine({ level, won, lost, grazes, score }: { level: number; won: boolean; lost: number; grazes: number; score: number }) {
  if (!level) return endlessLine(score);
  if (!won) return score ? `${bn(score)}টা ফাঁক পার, তারপর ফটাস। আরেকবার?` : "প্রথম তারেই ফটাস! এ তো সবে শুরু।";
  if (lost) return lost === 1 ? "একটা বেলুন ফাটল, পরেরটা ঠিকই পার হলো।" : `${bn(lost)}টা বেলুন ফাটল, শেষেরটা ঠিকই পার হলো।`;
  if (!grazes) return "বেলুন আস্ত, তারে একবারও লাগেনি।";
  return grazes <= freeScrapes(level) ? `বেলুন আস্ত। তারে ঘষা লেগেছে মাত্র ${bn(grazes)} বার।` : `বেলুন আস্ত, তবে তারে ${bn(grazes)} বার ঘষা খেয়েছে।`;
}

/** What one more try would change, with the exact number; "" when nothing is close. */
export function nearMiss({ level, won, lost, grazes, score, best, mode }: { level: number; won: boolean; lost: number; grazes: number; score: number; best: number | null; mode: Mode }) {
  if (!level) return best !== null && score < best && best - score <= Math.max(5, Math.ceil(best * 0.2)) ? `আর ${bn(best - score)}টা ফাঁক হলেই নতুন সেরা।` : "";
  const def = levelDef(level);
  if (!won) return `আর ${bn(def.crossings - score)}টা ফাঁক হলেই ${def.name} পার।`;
  if (MODE_INFO[mode].maxStars < 3) return lost ? "একটাও বেলুন না ফাটালে ২ তারা।" : "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।";
  if (lost) return "একটাও বেলুন না ফাটালে ২ তারা, তারে কম ঘষলে ৩।";
  const extra = grazes - freeScrapes(level);
  return extra > 0 ? `আর ${bn(extra)}টা ঘষা কম হলেই ৩ তারা।` : "";
}

const placeOf = (shared: Pick<Shared, "level">) => shared.level ? `লেভেল ${bn(shared.level)}-এ` : "যত দূর পারো-তে";

/** The friend's claim, said honestly: their own phone's play (or the old game's count). */
export function friendLine(shared: Shared) {
  const name = who(shared.name);
  if (shared.old) return `${name} আগের খেলায় ${placeOf(shared)} ${bn(shared.score)}টা ফাঁক পার করেছিল।`;
  const def = levelDef(shared.level);
  if (shared.won) return `${name} ${def.of} সব ফাঁক পার করেছে ${seconds(shared.tenths)} সেকেন্ডে${shared.lost === 0 ? ", একটাও বেলুন না ফাটিয়ে" : ""}।`;
  return `${name} ${def.at} ${bn(shared.score)}টা ফাঁক পার করেছে।`;
}
export const friendClaim = (shared: Shared) => shared.old
  ? `একই তারের জট। আগের খেলার স্কোর, ${possessive(who(shared.name))} নিজের ফোনে খেলা।`
  : `একই তার, একই কাক, একই হাওয়া। ${possessive(who(shared.name))} নিজের ফোনের স্কোর${shared.slow ? ", ধীরে খেলায়" : ""}।`;

/** Your run against the friend's on the same street: who cleared, then fewer balloons lost, fewer scrapes, then the time. */
export function compareLine(you: { won: boolean; lost: number; grazes: number; tenths: number; score: number }, friend: Shared) {
  const name = who(friend.name);
  if (friend.old) return "";
  if (!friend.level || (!you.won && !friend.won)) {
    const diff = Math.abs(you.score - friend.score);
    if (you.score > friend.score) return `${possessive(name)} চেয়ে ${bn(diff)}টা ফাঁক বেশি!`;
    if (you.score === friend.score) return `সমান সমান! দুজনেই ${bn(you.score)}টা ফাঁক।`;
    return diff <= 3 ? `আর একটু হলেই! ${possessive(name)} চেয়ে মাত্র ${bn(diff)}টা কম।` : `এবার ${name} এগিয়ে। একই তার, আরেকবার চেষ্টা করো।`;
  }
  if (you.won && !friend.won) return `${name} পার হতে পারেনি, তুমি পারলে।`;
  if (!you.won && friend.won) return `${name} পার হয়েছে। আরেকবার?`;
  if (you.lost !== friend.lost) return you.lost < friend.lost ? `${possessive(name)} চেয়ে ${bn(friend.lost - you.lost)}টা বেলুন কম ফাটিয়েছ।` : `${name} ${bn(you.lost - friend.lost)}টা বেলুন কম ফাটিয়েছে।`;
  if (you.grazes !== friend.grazes) return you.grazes < friend.grazes ? `${possessive(name)} চেয়ে ${bn(friend.grazes - you.grazes)} বার কম ঘষা।` : `${name} তারে ${bn(you.grazes - friend.grazes)} বার কম ঘষেছে।`;
  const gap = friend.tenths - you.tenths;
  if (gap > 0) return `${possessive(name)} চেয়ে ${seconds(gap)} সেকেন্ড আগে!`;
  if (gap === 0) return `একদম সমান সময়, ${seconds(you.tenths)} সেকেন্ড।`;
  return -gap <= 30 ? `আর একটু হলেই! মাত্র ${seconds(-gap)} সেকেন্ড পিছিয়ে।` : `${name} এখনো ${seconds(-gap)} সেকেন্ড এগিয়ে।`;
}

export function previewTitle(shared: Shared) {
  const name = shared.name || "এক বন্ধু";
  if (shared.old) return `${name} ${shared.level ? `বেলুনের লেভেল ${bn(shared.level)}-এ` : "তারের জটে"} ${bn(shared.score)}টা ফাঁক পার করেছে। তুমি পারবে?`;
  if (!shared.level) return `${name} তারের জটে ${bn(shared.score)}টা ফাঁক পার করেছে। তুমি পারবে?`;
  const def = levelDef(shared.level);
  return shared.won ? `${name} ${def.of} সব ফাঁক পার করেছে, ${seconds(shared.tenths)} সেকেন্ডে। তুমি পারবে?` : `${name} ${def.at} ${bn(shared.score)}টা ফাঁক পার করেছে। তুমি পারবে?`;
}

export function caption(shared: Pick<Shared, "score" | "level" | "won">) {
  if (shared.level && shared.won) return `তারের ফাঁকে বেলুন: ${levelDef(shared.level).name} পার, ফটাস হয়নি! একই তারের জটে তুমি পারবে?`;
  if (shared.score) return `তারের ফাঁকে বেলুন নিয়ে ${bn(shared.score)}টা ফাঁক পার করলাম, তারপর ফটাস! একই তারের জটে তুমি কয়টা পারবে?`;
  return "তারের ফাঁকে বেলুন: প্রথম তারেই ফটাস! একই তারের জটে তুমি কয়টা পারবে?";
}

export const scoreLine = (score: number, name = "") => name ? `${name} ${bn(score)}টা ফাঁক পার করল` : `${bn(score)}টা ফাঁক পার করলাম`;
