// The levels as data: three kitchens (worlds) of four, each level adding one thing, the modes, the star rules and this phone's
// progress. Server-safe (no React, no DOM): challenge.ts and share.ts read the names from here.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";

export const SLUG = "dudh-uthlano";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `m=e|h`; no `m` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × the pot's clock: how fast the foam climbs. */ rate: number;
  /** × the foam's ripples. */ ripple: number;
  /** Easy tops out at two stars, so it is never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "ফেনা ধীরে ওঠে। তারা বড়জোর ২টা।", rate: 0.8, ripple: 1, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল রান্নাঘর। ৩ তারা পেতে কিনারার খুব কাছে নামাতে হবে।", rate: 1, ripple: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "ফেনা তাড়াতাড়ি ওঠে, ঢেউও বেশি।", rate: 1.15, ripple: 1.2, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

/** `scene` picks the kitchen's art; `stove` the fire under the pot. */
export type World = { name: string; time: string; line: string; scene: 0 | 1 | 2; stove: "gas" | "clay" };
export const WORLDS: readonly World[] = [
  { name: "আম্মুর রান্নাঘর", time: "সকালের গ্যাস", line: "আম্মু পাশের ঘরে। দুধ তোমার ভরসায়।", scene: 0, stove: "gas" },
  { name: "নানুবাড়ি", time: "বিকেলের মাটির চুলা", line: "কাঠের আঁচ, মাটির হাঁড়ি।", scene: 1, stove: "clay" },
  { name: "মেজবানের রাত", time: "লোডশেডিং", line: "বড় ডেকচি, ছোট শিখা, অন্ধকার।", scene: 2, stove: "gas" },
];

export type LevelDef = {
  world: number;
  name: string;
  /** The one new thing, in one line, for the title and the level list. */
  teach: string;
  pots: number;
  /** Seconds to the rim, the climb's sharpness and the ripple: first pot → last pot. */
  secs: readonly [number, number]; power: readonly [number, number]; wobble: readonly [number, number];
  /** Pots where the doorbell rings (never the first). */
  bells: number;
  /** The fire's breathing, as a share of the pot's speed; 0 for a steady flame. */
  fire: number;
  /** From this pot on, a lid hides the foam; -1 for none. */
  lidFrom: number;
  /** Pots where the flame leaps and the foam surges. */
  flares: number;
  /** The lights are out. */
  dark: boolean;
  /** Pots where big bubbles burst and drop the foam. */
  pops: number;
  /** Small, fast pots. */
  quick: number;
  /** A finale: the last pot is the boss pot and counts double. `second`: its foam peaks, collapses and climbs again. */
  boss: { name: string; second: boolean } | null;
};

const level = (def: Partial<LevelDef> & Pick<LevelDef, "world" | "name" | "teach" | "pots" | "secs" | "power" | "wobble">): LevelDef =>
  ({ bells: 0, fire: 0, lidFrom: -1, flares: 0, dark: false, pops: 0, quick: 0, boss: null, ...def });

/** The ladder this phone and new links (`v=2`) play. tests/levels.test.ts asserts each is fair and the bots' rates. */
export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, name: "প্রথম পাতিল", teach: "চেপে ধরো। ফেনা কিনারায় ওঠার ঠিক আগে ছেড়ে দাও।", pots: 2, secs: [3.6, 3.4], power: [1.1, 1.15], wobble: [0.008, 0.01] }),
  level({ world: 0, name: "ফেনার ঢেউ", teach: "ফেনা ওঠানামা করে। ছাড়ার মুহূর্তে কোথায়, সেটা দেখো।", pots: 3, secs: [4.0, 3.7], power: [1.15, 1.25], wobble: [0.03, 0.04] }),
  level({ world: 0, name: "কলিং বেল", teach: "বেল বাজবে, দুধ কিন্তু চুলায়। পাতিলে চোখ রাখো।", pots: 4, secs: [4.0, 3.6], power: [1.15, 1.3], wobble: [0.03, 0.04], bells: 2 }),
  level({ world: 0, name: "আম্মুর বড় ডেকচি", teach: "ফেনা একবার উঠে বসে যায়, তারপর আরও জোরে ওঠে। প্রথম চূড়ায় ছেড়ো না।", pots: 4, secs: [4.0, 3.7], power: [1.15, 1.3], wobble: [0.03, 0.04], bells: 2,
    boss: { name: "আম্মুর বড় ডেকচি", second: true } }),
  level({ world: 1, name: "কাঠের আঁচ", teach: "আঁচ কমলে ফেনা ধীরে ওঠে, বাড়লে জোরে। শিখার উচ্চতা দেখো।", pots: 3, secs: [4.4, 3.9], power: [1.15, 1.3], wobble: [0.02, 0.03], fire: 0.28 }),
  level({ world: 1, name: "ঢাকনা", teach: "ঢাকনার নিচে ফেনা দেখা যায় না। ঢাকনা যত কাঁপে, তত কাছে।", pots: 4, secs: [4.3, 3.8], power: [1.15, 1.3], wobble: [0.02, 0.03], fire: 0.28, lidFrom: 1 }),
  level({ world: 1, name: "দমকা আঁচ", teach: "শিখা লাফিয়ে উঠলে ফেনা হঠাৎ ছোটে। হিস শুনলেই তৈরি।", pots: 4, secs: [4.4, 3.9], power: [1.15, 1.25], wobble: [0.02, 0.03], fire: 0.22, lidFrom: 1, flares: 2 }),
  level({ world: 1, name: "নানির মাটির হাঁড়ি", teach: "ঢাকনা, কাঠের আঁচ আর দমকা আঁচ, সব একসঙ্গে। শেষ হাঁড়ি দুইবার গোনা হয়।", pots: 5, secs: [4.2, 3.5], power: [1.2, 1.35], wobble: [0.025, 0.035], fire: 0.22, lidFrom: 1, flares: 2,
    boss: { name: "নানির মাটির হাঁড়ি", second: false } }),
  level({ world: 2, name: "লোডশেডিং", teach: "বাতি গেলে চুলার আলোই ভরসা। মাপটা জ্বলজ্বল করছে।", pots: 3, secs: [3.9, 3.5], power: [1.25, 1.4], wobble: [0.025, 0.035], dark: true }),
  level({ world: 2, name: "বুদবুদ ফাটা", teach: "বড় বুদবুদ ফুলে ফাটে, ফেনা নেমে যায়। ওটা চূড়া না।", pots: 4, secs: [3.8, 3.3], power: [1.25, 1.4], wobble: [0.025, 0.035], dark: true, pops: 2 }),
  level({ world: 2, name: "ছোট পাতিল", teach: "ছোট পাতিলে দুধ কম, তাই ফেনা তাড়াতাড়ি ওঠে। শিখা উঁচু থাকে।", pots: 4, secs: [3.8, 3.3], power: [1.25, 1.4], wobble: [0.025, 0.035], dark: true, pops: 1, quick: 2 }),
  level({ world: 2, name: "মেজবানের ডেকচি", teach: "আঁধারে বড় ডেকচি: ফেনা বসে গিয়ে আবার ওঠে, বুদবুদও ফাটে।", pots: 5, secs: [3.8, 3.3], power: [1.3, 1.45], wobble: [0.025, 0.035], dark: true, pops: 2, quick: 1,
    boss: { name: "মেজবানের ডেকচি", second: true } }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value) || 1)) - 1];
export const worldOf = (value: number) => WORLDS[levelDef(value).world];

/** The boss pot counts double. */
export const BOSS_WEIGHT = 2;
export const potWeight = (value: number, index: number) => levelDef(value).boss && index === levelDef(value).pots - 1 ? BOSS_WEIGHT : 1;

/** The level's average over its pots (a spill is 0), the boss pot counted twice. */
export function averageOf(value: number, scores: readonly number[]) {
  let sum = 0, weight = 0;
  for (let index = 0; index < scores.length; index++) { const w = potWeight(value, index); sum += scores[index] * w; weight += w; }
  return Math.round(sum / (weight || 1));
}

/** ★ at 60%, ★★ at 80%, ★★★ at 92%; under 60% is not a clear. Easy and ধীরে খেলো stop at two. */
export const STAR_MARKS = [60, 80, 92] as const;
export const rawStars = (average: number) => average >= 92 ? 3 : average >= 80 ? 2 : average >= 60 ? 1 : 0;
export const starsOf = (average: number, mode: Mode, slow = false) => Math.min(rawStars(average), slow ? 2 : MODE_INFO[mode].maxStars);

/* ---------- progress on this phone ---------- */

/**
 * The highest level you may pick. Levels cleared from a friend's link beyond your own unlock sit in `ahead`: they keep
 * their stars but don't open the levels in between. Once your own play reaches one, it counts as yours.
 */
export function openLevel(stars: LevelStars, ahead: readonly number[], count = LEVEL_COUNT) {
  const own: LevelStars = {};
  for (const key of Object.keys(stars)) if (!ahead.includes(Number(key))) own[Number(key)] = stars[Number(key)];
  let open = unlockedLevel(own, count);
  while (open < count && stars[open] && ahead.includes(open)) open++;
  return open;
}

/** After clearing `value`: is it beyond what you had opened (a friend's far level)? Returns the new `ahead` list. */
export function nextAhead(stars: LevelStars, ahead: readonly number[], value: number) {
  const open = openLevel(stars, ahead);
  const rest = ahead.filter(item => item !== value && item >= open);
  return value > open ? [...rest, value].sort((a, b) => a - b) : rest;
}

/** `ektukhani-ahead-dudh-uthlano`: a JSON list of level numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

/** `ektukhani-bests-dudh-uthlano`: the best average per "<level><mode>" (e.g. "4n"). Junk entries are dropped. */
export type Bests = Record<string, number>;
export const bestKey = (value: number, mode: Mode) => `${value}${mode}`;
export function readBests(raw: string | null): Bests {
  const bests: Bests = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") for (const [key, value] of Object.entries(parsed)) {
      if (/^(?:[1-9]|1[0-2])[enh]$/.test(key) && Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 99) bests[key] = value as number;
    }
  } catch { /* broken JSON: start fresh */ }
  return bests;
}

/**
 * Saved progress from before the rewrite. Run once, before the level store is first read.
 * - A phone that kept only the original best average (no level store) gets that as kitchen 3's stars, as it did before.
 * - Then every old kitchen up to the furthest cleared becomes one star on the new ladder (the old kitchens are not these levels).
 * Returns what to write (`levels` is null when there is nothing to move, but the marker is still set so a new phone's stars are never
 * read as old ones), or null when the marker is already there.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null, markerRaw: string | null): { levels: string | null; marker: string } | null {
  if (markerRaw !== null) return null;
  let old = readLevels(levelsRaw, 8);
  if (levelsRaw === null && bestRaw !== null) {
    const best = Number(bestRaw);
    if (Number.isFinite(best) && best >= 50) old = { 3: best >= 90 ? 3 : best >= 75 ? 2 : 1 };
  }
  const furthest = Math.max(0, ...Object.keys(old).map(Number));
  if (furthest === 0) return { levels: null, marker: "2" };
  const next: LevelStars = {};
  for (let value = 1; value <= furthest; value++) next[value] = 1;
  return { levels: JSON.stringify(next), marker: "2" };
}
