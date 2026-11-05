// The races as data: three worlds of four, each race adding one thing and each world ending in a named finale, plus the
// twelve-race ladder that links without `v=2` were played on. Server-safe (no React): link.ts and share.ts read the names from here.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";

export const SLUG = "baicher-nouka";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × the tap windows (the real-time width, in milliseconds). */ window: number;
  /** × the rivals' free-run time (more is slower). */ rival: number;
  /** Easy tops out at two stars, so it is never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "চাপার সময় বেশি, ওদের নৌকা ধীরে চলে। তারা বড়জোর ২টা।", window: 1.3, rival: 1.08, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল বাইচ। ১ম হলে ৩ তারা, তার জন্য প্রায় প্রতি তালে চাপতে হবে।", window: 1, rival: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "চাপার সময় কম, ওদের নৌকা জোরে চলে। ১ম হওয়া কঠিন, তারা একই।", window: 0.8, rival: 0.96, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; line: string };
export const WORLDS: readonly World[] = [
  { name: "ভোরের নদী", line: "কুয়াশা কাটছে, ঘাটে ঘাটে ভিড়।" },
  { name: "ভরা বর্ষা", line: "দুকূল ভাসা নদী, স্রোত আর ঢেউ।" },
  { name: "রাতের বাইচ", line: "মশালের আলোয় শেষ বাইচ।" },
];

export type LevelDef = {
  /** The race's own name. */
  name: string;
  world: number;
  /** The one new thing, in one line, for the title and the race list. Empty on the old ladder. */
  teach: string;
  /** From the start rope to the finish rope, in game units. */
  course: number;
  /** The rivals' free-run time × this (× the course against 9000). Lower is faster; the old ladder's own numbers for old links. */
  k: number;
  /** Seconds a beat, and an optional change: [after this many beats, the new gap]. */
  gap: number;
  quicken: readonly [number, number] | null;
  /** Every 4th beat is a big stroke: right on it, the pull counts 1.6 times. */
  accent: boolean;
  /** 0: open water, 1: কচুরিপানা in one lane at a time, 2: sometimes two. */
  patches: 0 | 1 | 2;
  firstRow: number; clearEnd: number;
  /** Fast lanes (a current), closing banks, a crosswind, night. */
  current: boolean; narrow: boolean; gusts: boolean; dark: boolean;
  /** A named champion rival who blocks and has a last pull; empty on ordinary races. */
  boss: string;
  /** Rows of কচুরিপানা get this many more seconds of gap. */
  roomy: number;
};

const make = (def: Partial<LevelDef> & Pick<LevelDef, "name" | "world" | "teach" | "course" | "k" | "gap">): LevelDef =>
  ({ quicken: null, accent: false, patches: 2, firstRow: 820, clearEnd: 480, current: false, narrow: false, gusts: false, dark: false, boss: "", roomy: 0, ...def });

/**
 * The ladder new links (`v=2`) and this phone play. Each race adds one thing; each finale brings its world's things back.
 * `k` is tuned in tests/levels.test.ts against the headless rowers; the rates asserted there are the promise.
 */
export const LEVELS: readonly LevelDef[] = [
  make({ name: "প্রথম টান", world: 0, course: 1950, k: 1.025, gap: 1.5, patches: 0, teach: "ঢোলের রিং ঢোলে মিললেই চাপো। ঠিক তালে চাপলে নৌকা ছোটে।" }),
  make({ name: "পানার ঘাট", world: 0, course: 3000, k: 0.985, gap: 1.45, patches: 1, firstRow: 620, clearEnd: 380, roomy: 0.15, teach: "কচুরিপানা দেখলে বাঁয়ে বা ডানে সরো। ছুঁলে নৌকা আটকে যায়।" }),
  make({ name: "সারির টান", world: 0, course: 3400, k: 0.96, gap: 1.4, patches: 2, roomy: 0.1, firstRow: 700, clearEnd: 400, accent: true, teach: "প্রতি চতুর্থ ঢোল বড়। তাতে ঠিক তালে চাপলে টান দেড়গুণ।" }),
  make({ name: "পাকা মাঝির বাইচ", world: 0, course: 4200, k: 0.95, gap: 1.4, patches: 2, firstRow: 700, clearEnd: 420, accent: true, boss: "পাকা মাঝি", teach: "কালো নৌকার পাকা মাঝি পথ আটকায়, শেষে জোরে টানে। পাশ কাটিয়ে এগোও।" }),
  make({ name: "স্রোতের টান", world: 1, course: 4200, k: 0.925, gap: 1.3, accent: true, current: true, firstRow: 700, clearEnd: 420, teach: "সাদা দাগের লেনে স্রোত নৌকাকে ঠেলে। সেই লেনে ঢুকলে নৌকা জোরে ছোটে।" }),
  make({ name: "সরু খাল", world: 1, course: 4400, k: 0.935, gap: 1.3, accent: true, narrow: true, firstRow: 700, clearEnd: 420, teach: "মাঝপথে নদী সরু হয়ে আসে। দুই পাশের লেন বন্ধ, থাকে মাঝের তিন লেন।" }),
  make({ name: "দ্রুত ঢোল", world: 1, course: 4400, k: 0.91, gap: 1.35, quicken: [10, 1.05], accent: true, firstRow: 700, clearEnd: 420, teach: "মাঝপথে ঢোল দ্রুত হয়। কিনারায় লেখা দেখলেই তৈরি থাকো।" }),
  make({ name: "বর্ষার সর্দার", world: 1, course: 5200, k: 0.945, gap: 1.3, quicken: [14, 1.05], accent: true, current: true, firstRow: 700, clearEnd: 420, boss: "বর্ষার সর্দার", teach: "সর্দারের নৌকা, স্রোত আর দ্রুত ঢোল, সব একসাথে।" }),
  make({ name: "মশালের আলো", world: 2, course: 4600, k: 0.9, gap: 1.2, accent: true, dark: true, firstRow: 700, clearEnd: 420, teach: "রাত নেমেছে। পানা দেখা যায় শেষ মুহূর্তে। ওপরের কিনারার দাগ দেখে লেন বুঝে নাও।" }),
  make({ name: "ঝড়ো হাওয়া", world: 2, course: 4800, k: 0.89, gap: 1.2, accent: true, dark: true, gusts: true, firstRow: 700, clearEnd: 420, roomy: 0.3, teach: "দমকা হাওয়া নৌকাকে এক লেন ঠেলে দেয়। পাশের কিনারায় তীর দেখলেই তৈরি থাকো।" }),
  make({ name: "সব একসাথে", world: 2, course: 5200, k: 0.895, gap: 1.2, quicken: [14, 1], accent: true, dark: true, current: true, narrow: true, gusts: true, firstRow: 700, clearEnd: 420, roomy: 0.3, teach: "স্রোত, সরু খাল আর দমকা হাওয়া, রাতের নদীতে একসাথে।" }),
  make({ name: "গাঁয়ের ওস্তাদ", world: 2, course: 6000, k: 0.965, gap: 1.2, quicken: [16, 1], accent: true, dark: true, current: true, narrow: true, gusts: true, firstRow: 700, clearEnd: 420, roomy: 0.3, boss: "গাঁয়ের ওস্তাদ", teach: "ওস্তাদের নৌকা: রাতের নদীতে সব মিলিয়ে, আর ওস্তাদের লম্বা শেষ টান।" }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isFinale = (def: LevelDef) => def.boss !== "";

/** The twelve races links without `v=2` were played on: the same long course at the old pace, nothing else. */
export const OLD_K = [1.4, 1.3, 1.22, 1.15, 1.09, 1.04, 1, 0.98, 0.96, 0.945, 0.93, 0.92] as const;
export const OLD_COUNT = OLD_K.length;
/** A link with no race number is race 7, the pace from before races had numbers. */
export const LEGACY_LEVEL = 7;
export const OLD_COURSE = 9000;
export const OLD_LEVELS: readonly LevelDef[] = OLD_K.map((k, index) =>
  make({ name: `বাইচ ${index + 1}`, world: Math.min(2, Math.floor(index / 4)), teach: "", course: OLD_COURSE, k, gap: 1.8 }));

export const isLevel = (value: number, old = false) => Number.isInteger(value) && value >= 1 && value <= (old ? OLD_COUNT : LEVEL_COUNT);
export const levelDef = (value: number, old = false) => {
  const list = old ? OLD_LEVELS : LEVELS;
  return list[Math.min(list.length, Math.max(1, Math.round(value) || 1)) - 1];
};

/** Stars for a place: 3 for 1st, 2 for 2nd, 1 for 3rd. 4th earns none, and the next race stays shut until you place. Easy tops out at two. */
export const starsForRank = (rank: number, mode: Mode = "n") => rank >= 1 && rank <= 3 ? Math.min(MODE_INFO[mode].maxStars, 4 - rank) : 0;

/* ---------- progress on this phone ---------- */

/**
 * The highest race you may pick. Races placed from a friend's link beyond your own unlock sit in `ahead`: they keep their
 * stars but don't open the races in between. Once your own play reaches one, it counts as yours.
 * Saved progress from before (no `ahead`) opens exactly what `unlockedLevel` opened.
 */
export function openLevel(stars: LevelStars, ahead: readonly number[], count = LEVEL_COUNT) {
  const own: LevelStars = {};
  for (const key of Object.keys(stars)) if (!ahead.includes(Number(key))) own[Number(key)] = stars[Number(key)];
  let open = unlockedLevel(own, count);
  while (open < count && stars[open] && ahead.includes(open)) open++;
  return open;
}

/** After placing in `value`: is it beyond what you had opened (a friend's far race)? Returns the new `ahead` list. */
export function nextAhead(stars: LevelStars, ahead: readonly number[], value: number) {
  const open = openLevel(stars, ahead);
  const rest = ahead.filter(item => item !== value && item >= open);
  return value > open ? [...rest, value].sort((a, b) => a - b) : rest;
}

/** `ektukhani-ahead-baicher-nouka`: a JSON list of race numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

/** `ektukhani-times-baicher-nouka`: the best time in tenths of a second per "<race><mode>" (e.g. "4n"). Junk entries are dropped. */
export type Times = Record<string, number>;
export const timeKey = (value: number, mode: Mode) => `${value}${mode}`;
export function readTimes(raw: string | null): Times {
  const times: Times = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") for (const [key, value] of Object.entries(parsed)) {
      if (/^(?:[1-9]|1[0-2])[enh]$/.test(key) && Number.isInteger(value) && (value as number) >= 30 && (value as number) <= 1200) times[key] = value as number;
    }
  } catch { /* broken JSON: start fresh */ }
  return times;
}
