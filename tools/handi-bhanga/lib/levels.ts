// The stalls as data: three মেলা of four, each stall adding one thing, plus the ten old stalls that links without `v=2`
// replay. Server-safe (no React, no DOM): link.ts and share.ts read names and counts from here.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
/** How much of the throw's path the aim shows. */
export type Guide = "full" | "first" | "short";
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × the লাঠি's width. */ stick: number;
  /** × the ball's speed. */ speed: number;
  /** Balls for a stall, counting the first. */ balls: number;
  guide: Guide;
  /** Easy is capped at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "বড় লাঠি, ধীরে বল, ৫টা বল। পুরো পথ দেখায়, তারা বড়জোর ২টা।", stick: 1.2, speed: 0.85, balls: 5, guide: "full", maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। ৩টা বল, প্রথম হাঁড়ি পর্যন্ত পথ দেখায়।", stick: 1, speed: 1, balls: 3, guide: "first", maxStars: 3 },
  h: { name: "কঠিন", line: "ছোট লাঠি, জোরে বল, ২টা বল। শুধু একটা ছোট তীর।", stick: 0.88, speed: 1.1, balls: 2, guide: "short", maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

/** `motif`: the pitch the world's opening notes and its bell are tuned to. */
export const WORLDS = [
  { name: "পাড়ার মেলা", motif: 1 },
  { name: "নদীঘাটের মেলা", motif: 9 / 8 },
  { name: "চড়কের রাত", motif: 4 / 3 },
] as const;

export type LevelDef = {
  name: string;
  /** The one new thing, in one line, for the title and the level list. */
  teach: string;
  world: number;
  /** A finale's named মটকা ("" for an ordinary stall). */
  finale: string;
  /**
   * The ropes, top to bottom, seven cells each: `o` a pot, `B` a bamboo knot that never breaks, `m` the মটকা
   * (a block three cells wide and two ropes tall; its top-left `m` anchors it), `.` an empty string.
   */
  rows: readonly string[];
  /** The awning's lower edge (the ceiling), in world units. Fewer ropes hang lower, closer to the লাঠি. */
  top: number;
  /** How many plain pots the seed makes thick (two hits), and how many firecracker pots. */
  tough: number;
  crackers: number;
  /** Added to the ball's base speed (units a second). */
  speed: number;
  /** Ropes sway this many units either way, at `swaySpeed` radians a second. */
  sway: number;
  swaySpeed: number;
  /** Sideways wind on the ball: turns of direction a second at its strongest. */
  wind: number;
  /** × the লাঠি's width. */
  stick: number;
  /** শেষ ডাক: once this many breakable pots are left, the লাঠি catches the ball. 99: it catches from the start. */
  catchAt: number;
  /** The মটকা's hits, and how far it slides along its rope either way (0: it stays). */
  boss: number;
  bossMove: number;
  /** Old stalls only: the score for one star, and the old scoring (10 a pot, 50 a ball at a full clear). */
  pass: number;
  old: boolean;
};

const stall = (def: Partial<LevelDef> & Pick<LevelDef, "name" | "teach" | "world" | "rows" | "top">): LevelDef => ({
  finale: "", tough: 0, crackers: 0, speed: 30, sway: 0, swaySpeed: 1.4, wind: 0, stick: 1, catchAt: 4, boss: 0, bossMove: 0, pass: 0, old: false, ...def,
});

/** Each stall teaches one thing; each মেলা ends in a named মটকা. Tuned by the bots in tests/levels.test.ts. */
export const LEVELS: readonly LevelDef[] = [
  stall({ world: 0, name: "প্রথম ছোড়া", teach: "আঙুল টেনে তাক করো, ছেড়ে দাও। বল ফিরলে লাঠি ধরে ফেলবে।", rows: [".ooooo."], top: 262, speed: 70, stick: 1.2, catchAt: 99 }),
  stall({ world: 0, name: "লাঠিতে ফেরাও", teach: "এবার বল লাঠিতে লেগে ফেরে। কিনারায় লাগলে কাত হয়ে ওঠে।", rows: [".ooooo.", "ooooooo"], top: 232, speed: 70, stick: 1.1, catchAt: 4 }),
  stall({ world: 0, name: "মোটা হাঁড়ি", teach: "গাঢ় মোটা হাঁড়ি দুবারে ভাঙে।", rows: ["ooooooo", ".ooooo.", "ooooooo"], top: 200, tough: 5, speed: 80, stick: 1.05 }),
  stall({ world: 0, name: "রহিম চাচার মটকা", finale: "রহিম চাচার মটকা", teach: "দোকানের মাঝে বিশাল মটকা, ৬ বার লাগলে ভাঙে।", rows: ["oommmoo", "o.mmm.o", "ooooooo", ".o.o.o."], top: 176, tough: 3, speed: 90, stick: 1.05, boss: 6 }),
  stall({ world: 1, name: "দোলা দড়ি", teach: "নদীর হাওয়ায় দড়ি দোলে, হাঁড়িও।", rows: ["ooooooo", ".ooooo.", "ooooooo"], top: 196, tough: 3, sway: 4, speed: 90 }),
  stall({ world: 1, name: "পটকা হাঁড়ি", teach: "পটকা হাঁড়ি ফাটলে পাশের সবগুলো ফাটায়।", rows: ["ooooooo", "ooooooo", ".ooooo.", "ooooooo"], top: 172, tough: 4, crackers: 3, sway: 3, speed: 100 }),
  stall({ world: 1, name: "বাঁশের গিঁট", teach: "বাঁশের গিঁট কখনো ভাঙে না। পাশ কাটিয়ে মারো।", rows: ["ooooooo", "oBoooBo", "ooooooo"], top: 190, tough: 3, crackers: 2, sway: 3, speed: 70 }),
  stall({ world: 1, name: "দোলনা মটকা", finale: "দোলনা মটকা", teach: "৮ বারের মটকা দড়ি ধরে এদিক-ওদিক সরে।", rows: ["..mmm..", "..mmm..", "oBoooBo", "ooooooo", ".o.o.o."], top: 152, tough: 5, crackers: 2, sway: 3, speed: 150, stick: 0.92, boss: 8, bossMove: 90 }),
  stall({ world: 2, name: "উত্তুরে হাওয়া", teach: "হাওয়ায় বল বাঁকে। পতাকা আর কিনারার তীর দেখো।", rows: ["ooooooo", "ooooooo", "ooooooo", ".ooooo."], top: 172, tough: 5, crackers: 2, sway: 3, wind: 0.16, speed: 110 }),
  stall({ world: 2, name: "জোরে বল", teach: "চড়কের রাতে বল ছোটে আরও জোরে।", rows: ["ooooooo", "oBoooBo", "ooooooo", "ooooooo"], top: 166, tough: 6, crackers: 2, sway: 3, wind: 0.16, speed: 130 }),
  stall({ world: 2, name: "ছোট লাঠি", teach: "লাঠি এবার ছোট। মাঝখান দিয়ে ধরো।", rows: ["ooooooo", "ooooooo", ".ooooo.", "ooooooo"], top: 166, tough: 5, crackers: 2, sway: 3, wind: 0.18, speed: 90, stick: 0.88 }),
  stall({ world: 2, name: "চড়কের রাজা মটকা", finale: "চড়কের রাজা মটকা", teach: "হাওয়ায় ১০ বারের মটকা সরে বেড়ায়। সব একসাথে।", rows: ["..mmm..", "..mmm..", "ooooooo", "oBoooBo", "ooooooo"], top: 142, tough: 6, crackers: 3, sway: 4, wind: 0.2, speed: 160, stick: 0.88, boss: 10, bossMove: 90 }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;

/**
 * The ten stalls links without `v=2` were played on: five full ropes, the seed's thick pots, the old speeds, sway and wind,
 * and the old pass marks. Kept so an old link opens the same stall and its score reads as before. The awning sits where
 * the old stall's gap to the লাঠি comes out the same.
 */
const OLD_ROWS = ["ooooooo", "ooooooo", "ooooooo", "ooooooo", "ooooooo"] as const;
const old = (name: string, tough: number, speed: number, sway: number, swaySpeed: number, wind: number, pass: number): LevelDef =>
  stall({ world: 0, name, teach: "পুরোনো দোকান: ৩৫টা হাঁড়ি, শেষ ডাক নেই।", rows: OLD_ROWS, top: 140, tough, speed, sway, swaySpeed, wind, pass, catchAt: 0, old: true });
export const OLD_STALLS: readonly LevelDef[] = [
  old("পাড়ার মেলা", 8, 0, 0, 0, 0, 80),
  old("স্কুলমাঠের মেলা", 11, 0, 0, 0, 0, 100),
  old("নদীর ঘাটের মেলা", 11, 0, 3, 1.4, 0, 130),
  old("বৈশাখী মেলা", 11, 15, 3, 1.4, 0, 140),
  old("রথের মেলা", 11, 15, 5, 1.7, 0, 150),
  old("পৌষমেলা", 11, 15, 5, 1.7, 0.12, 150),
  old("চৈত্রসংক্রান্তির মেলা", 15, 15, 5, 1.7, 0.12, 160),
  old("নৌকাবাইচের মেলা", 15, 15, 6, 2, 0.2, 160),
  old("চড়কের মেলা", 15, 30, 6, 2, 0.2, 170),
  old("জেলার বড় মেলা", 18, 30, 6, 2.3, 0.25, 170),
];
export const OLD_COUNT = OLD_STALLS.length;
export const OLD_POTS = 35, OLD_POT_POINTS = 10, OLD_BALL_POINTS = 50, OLD_BALLS = 3;
export const OLD_MAX = OLD_POTS * OLD_POT_POINTS + OLD_BALLS * OLD_BALL_POINTS;

/** What a run plays: a stall 1–12, or an old link's stall 1–10. */
export type Kind = "level" | "old";
export type Run = { seed: number; kind: Kind; level: number; mode: Mode };
export const defOf = (run: Pick<Run, "kind" | "level">) => run.kind === "old" ? OLD_STALLS[run.level - 1] : LEVELS[run.level - 1];

/** Breakable pots in a stall (the মটকা counts as one; bamboo knots don't count). */
export function potCount(def: Pick<LevelDef, "rows">) {
  let count = 0;
  for (const row of def.rows) for (const cell of row) if (cell === "o") count++;
  let boss = 0;
  for (let r = 0; r < def.rows.length; r++) for (let c = 0; c < 7; c++) {
    if (def.rows[r][c] === "m" && (r === 0 || def.rows[r - 1][c] !== "m") && (c === 0 || def.rows[r][c - 1] !== "m")) boss++;
  }
  return count + boss;
}

/* ---------- scoring and stars ---------- */

/** Points for the nth pot (1-based) broken in one flight: 10, 15, 20 … up to 50. */
export const potPoints = (nth: number) => Math.min(50, 5 + 5 * Math.max(1, nth));
export const BOSS_POINTS = 100;
export const BALL_POINTS = 50;

/** Stars for a stall: none unless it was cleared, then by balls lost (none: 3, one: 2, more: 1). Easy tops out at two. */
export function starsOf(cleared: boolean, lost: number, mode: Mode = "n") {
  if (!cleared) return 0;
  return Math.min(MODE_INFO[mode].maxStars, lost === 0 ? 3 : lost === 1 ? 2 : 1);
}

/** Old stalls: 0–340 short of a full clear, then 400, 450 or 500. Anything else is a forged link. */
export function validOldScore(score: number) {
  const all = OLD_POTS * OLD_POT_POINTS;
  if (!Number.isInteger(score) || score < 0 || score % OLD_POT_POINTS !== 0) return false;
  return score < all || (score > all && score <= OLD_MAX && (score - all) % OLD_BALL_POINTS === 0);
}
/** Old stalls' stars, exactly as the old game counted them: one at the pass mark, two for a clear, three with two balls left. */
export function oldStarsOf(score: number, stall: number) {
  const all = OLD_POTS * OLD_POT_POINTS, { pass } = OLD_STALLS[Math.min(OLD_COUNT, Math.max(1, stall)) - 1];
  return score < pass ? 0 : score >= all + 2 * OLD_BALL_POINTS ? 3 : score > all ? 2 : 1;
}
export const oldPotsFrom = (score: number) => Math.min(OLD_POTS, score / OLD_POT_POINTS);
export const oldBallsFrom = (score: number) => score > OLD_POTS * OLD_POT_POINTS ? (score - OLD_POTS * OLD_POT_POINTS) / OLD_BALL_POINTS : 0;

/** Before levels this phone kept one best score for the one stall there was (now stall 1). Its stars, or 0 when there is nothing to move. */
export function migrateBest(stars: LevelStars, oldBest: string | null) {
  const score = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || oldBest === "" || !validOldScore(score)) return 0;
  return oldStarsOf(score, 1);
}

/* ---------- progress on this phone ---------- */

/**
 * The highest stall you may pick. Stalls cleared from a friend's link beyond your own unlock sit in `ahead`: they keep
 * their stars but don't open the stalls in between. Once your own play reaches one, it counts as yours.
 * Saved progress from before (no `ahead`) opens exactly what `unlockedLevel` opened.
 */
export function openLevel(stars: LevelStars, ahead: readonly number[], count = LEVEL_COUNT) {
  const own: LevelStars = {};
  for (const key of Object.keys(stars)) if (!ahead.includes(Number(key))) own[Number(key)] = stars[Number(key)];
  let open = unlockedLevel(own, count);
  while (open < count && stars[open] && ahead.includes(open)) open++;
  return open;
}

/** After clearing `value`: is it beyond what you had opened (a friend's far stall)? Returns the new `ahead` list. */
export function nextAhead(stars: LevelStars, ahead: readonly number[], value: number) {
  const open = openLevel(stars, ahead);
  const rest = ahead.filter(item => item !== value && item >= open);
  return value > open ? [...rest, value].sort((a, b) => a - b) : rest;
}

/** `ektukhani-ahead-<slug>`: a JSON list of stall numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

/** `ektukhani-bests-<slug>`: { stall: best score }; junk reads as none. */
export function readBests(raw: string | null): Record<number, number> {
  const out: Record<number, number> = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") for (const [key, value] of Object.entries(parsed)) {
      const level = Number(key);
      if (isLevel(level) && typeof value === "number" && Number.isInteger(value) && value >= 0 && value < 100000) out[level] = value;
    }
  } catch { /* broken JSON: none */ }
  return out;
}
