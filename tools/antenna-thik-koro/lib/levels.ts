// The levels as data: three worlds of four, each level adding one thing, plus the old table that links without `v=2` replay.
// Server-safe (no React): link.ts and share.ts read the names and channel counts from here.
import { starsFor, unlockedLevel, type LevelStars } from "../../../shared/game-core";

export const PICTURES = ["cricket", "natok", "gaan", "nodi", "kartun", "ranna"] as const;
export type PictureId = (typeof PICTURES)[number];

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × the sweet spot's half-width. */ half: number;
  /** Seconds to hold still before a picture locks. */ dwell: number;
  /** × a finale's hold meter. */ hold: number;
  /** Seconds on one channel before downstairs points the way, however far off you are. */ assist: number;
  /** × wind sway and gust shove. */ wind: number;
  /** Easy is capped at two stars, so it's never the short way to three. */
  maxStars: number;
}> = {
  e: { name: "সহজ", line: "ছবির জায়গা চওড়া, নিচ থেকে আগেই বলে দেয়। তারা বড়জোর ২টা।", half: 1.35, dwell: 0.35, hold: 0.75, assist: 8, wind: 0.6, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। ৩ তারা পেতে তাড়াতাড়ি করতে হবে।", half: 1, dwell: 0.45, hold: 1, assist: 15, wind: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "সরু জায়গা, বেশিক্ষণ স্থির রাখতে হয়। তারার সময় বেশি পাও।", half: 0.8, dwell: 0.6, hold: 1.1, assist: 25, wind: 1.15, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; time: string };
export const WORLDS: readonly World[] = [
  { name: "বিকেলের ছাদ", time: "বিকেল" },
  { name: "সন্ধ্যার হাওয়া", time: "সন্ধ্যা" },
  { name: "কালবৈশাখীর রাত", time: "রাত" },
];

export type LevelDef = {
  name: string;
  /** The one new thing, in one line, for the title and the level list. */
  teach: string;
  world: number;
  channels: number;
  /** × the channel half-widths (14, 11, 9, 7, 6°). */
  scale: number;
  /** The first channel (0-based) with a ghost signal. */
  ghostFrom: number;
  ghosts: 1 | 2;
  /** ± degrees the signal sways. */
  wind: number;
  gusts: boolean;
  /** Nobody downstairs shouts directions (until the assist). */
  quiet: boolean;
  /** The antenna lags behind the dial on a loose pole. */
  wobble: boolean;
  /** The world's last level: its last channel is a named programme with a hold meter. */
  finale: { picture: PictureId; hold: number } | null;
  /** Total tenths of a second at or under which you get 3 and 2 stars: normal (and easy, capped at 2) and hard. */
  stars: readonly [number, number];
  hard: readonly [number, number];
};

const level = (def: Partial<LevelDef> & Pick<LevelDef, "name" | "teach" | "world" | "stars">): LevelDef =>
  ({ channels: 5, scale: 1, ghostFrom: 9, ghosts: 1, wind: 0, gusts: false, quiet: false, wobble: false, finale: null, hard: def.stars, ...def });

/**
 * The levels new links (`v=2`) and this phone play. Star times: the casual bot's 75th percentile × 1.5 for three and its 90th × 2.5
 * for two (people overshoot where the bot stops dead), a little more for the quiet level and the loose pole, which bots read better
 * than people. tests/levels.test.ts asserts the rates.
 */
export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, name: "প্রথম চ্যানেল", teach: "ঘোরাও, ছবি এলে থামো।", channels: 3, scale: 1.15, stars: [170, 310], hard: [180, 330] }),
  level({ world: 0, name: "সরু ছবি", teach: "ছবির জায়গা সরু। নিচের কথা শোনো।", channels: 4, scale: 0.9, stars: [230, 410], hard: [240, 420] }),
  level({ world: 0, name: "ভূতুড়ে ছবি", teach: "আবছা ছবি আসে, পরিষ্কার হয় না। ওটা ভূত, আরও ঘোরাও।", ghostFrom: 2, stars: [270, 490], hard: [300, 530] }),
  level({ world: 0, name: "ছুটির দিনের কার্টুন", teach: "শেষ চ্যানেলে কার্টুন। ছবি পুরো বসা পর্যন্ত ধরে রাখো।", ghostFrom: 1, finale: { picture: "kartun", hold: 1.4 }, stars: [290, 520], hard: [310, 550] }),
  level({ world: 1, name: "হাওয়া", teach: "হাওয়ায় সিগন্যাল দোলে। পিছু পিছু ঘোরাও।", ghostFrom: 2, wind: 7, stars: [280, 500], hard: [310, 550] }),
  level({ world: 1, name: "নিচতলা চুপ", teach: "নিচে কেউ কিছু বলছে না। ঝিরঝির দেখেই বোঝো।", ghostFrom: 2, quiet: true, stars: [340, 590], hard: [360, 620] }),
  level({ world: 1, name: "দমকা হাওয়া", teach: "দমকা হাওয়া অ্যান্টেনা ঠেলে দেয়। কিনারায় তীর দেখলেই তৈরি থাকো।", ghostFrom: 2, scale: 0.9, gusts: true, stars: [330, 590], hard: [370, 680] }),
  level({ world: 1, name: "ঈদের নাটক", teach: "হাওয়া আর দমকার মধ্যে শেষ চ্যানেলের নাটকটা পুরো বসাও।", ghostFrom: 1, wind: 8, gusts: true, finale: { picture: "natok", hold: 1.8 }, stars: [360, 660], hard: [430, 790] }),
  level({ world: 2, name: "নড়বড়ে খুঁটি", teach: "বাঁশ নড়বড়ে। অ্যান্টেনা একটু পরে থামে, আগেই হাত সরাও।", ghostFrom: 2, scale: 0.9, wobble: true, stars: [330, 600], hard: [360, 640] }),
  level({ world: 2, name: "দুই ভূত", teach: "এবার দুটো ভূতুড়ে ছবি।", ghostFrom: 1, ghosts: 2, scale: 0.85, stars: [280, 510], hard: [310, 550] }),
  level({ world: 2, name: "ঝড়", teach: "জোর হাওয়া, দমকা আর সরু ছবি একসাথে।", ghostFrom: 1, scale: 0.8, wind: 12, gusts: true, stars: [380, 690], hard: [510, 1090] }),
  level({ world: 2, name: "শেষ ওভার", teach: "ঝড়ের রাতে খেলার শেষ ওভার। সব একসাথে, তারপর পুরো ছবি বসাও।", ghostFrom: 1, ghosts: 2, scale: 0.8, wind: 12, gusts: true, finale: { picture: "cricket", hold: 2.2 }, stars: [400, 740], hard: [580, 1250] }),
];
export const LEVEL_COUNT = LEVELS.length;

/** The table links without `v=2` were played on (scale, first ghost, wind, stars), so they replay exactly. Level 1 is the original one-level game. */
const OLD = [
  [1, 2, 0, 310, 550], [0.9, 2, 0, 330, 580], [0.9, 1, 0, 340, 590], [0.8, 1, 0, 340, 590], [1, 2, 6, 340, 600], [0.9, 1, 8, 350, 610],
  [0.8, 1, 10, 360, 620], [0.8, 0, 10, 360, 630], [0.7, 0, 12, 370, 650], [0.7, 0, 15, 380, 670], [0.65, 0, 16, 400, 690], [0.6, 0, 18, 420, 730],
] as const;
export const OLD_LEVELS: readonly LevelDef[] = OLD.map(([scale, ghostFrom, wind, three, two], index) =>
  level({ world: Math.floor(index / 4), name: `লেভেল ${index + 1}`, teach: "", scale, ghostFrom, wind, stars: [three, two] }));

export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number, old = false) => (old ? OLD_LEVELS : LEVELS)[value - 1];

/** Stars for a total time on a level and mode. Easy tops out at two. */
const thresholds = (value: number, mode: Mode, old: boolean) => { const def = levelDef(value, old); return mode === "h" ? def.hard : def.stars; };
export function starsOf(tenths: number, value: number, mode: Mode = "n", old = false) {
  const [three, two] = thresholds(value, mode, old);
  return Math.min(MODE_INFO[mode].maxStars, starsFor(tenths, three, two, true));
}
/** Tenths to shave off for the next star, or 0 when there is no next star in this mode. */
export function toNextStar(tenths: number, value: number, mode: Mode = "n", old = false) {
  const earned = starsOf(tenths, value, mode, old);
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  const [three, two] = thresholds(value, mode, old);
  return tenths - (earned === 2 ? three : two);
}

/* ---------- progress on this phone ---------- */

/**
 * The highest level you may pick. Levels cleared from a friend's link beyond your own unlock sit in `ahead`: they keep
 * their stars but don't open the levels in between. Once your own play reaches one, it counts as yours.
 * Saved progress from before (no `ahead`) opens exactly what `unlockedLevel` opened.
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

/** `ektukhani-ahead-<slug>`: a JSON list of level numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => isLevel(Number(item)) && typeof item === "number"))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

/** `ektukhani-times-<slug>`: best tenths per "<level><mode>" (e.g. "4n"). Junk entries are dropped. */
export type Times = Record<string, number>;
export const timeKey = (value: number, mode: Mode) => `${value}${mode}`;
export function readTimes(raw: string | null): Times {
  const times: Times = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") for (const [key, value] of Object.entries(parsed)) {
      if (/^(?:[1-9]|1[0-2])[enh]$/.test(key) && Number.isInteger(value) && (value as number) > 0 && (value as number) <= 6000) times[key] = value as number;
    }
  } catch { /* broken JSON: start fresh */ }
  return times;
}
