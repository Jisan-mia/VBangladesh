// The levels as data: four worlds of five fields, each field adding one thing, each world ending in a named finale.
// Also the modes, the stars, and the old field links replay. Server-safe (no React): link.ts and share.ts read names from here.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";

export type Scene = "morning" | "noon" | "afternoon" | "evening";

export const LEVEL_COUNT = 20;
export const SCENES: readonly Scene[] = ["morning", "noon", "afternoon", "evening"];
export const SCENE_NAME: Record<Scene, string> = {
  morning: "সকালের সবুজ খেত",
  noon: "পুকুরপাড়ের খেত",
  afternoon: "বাতাসের বিকাল",
  evening: "সন্ধ্যার পাকা ধান",
};

/** Everything the walk needs to build and run one field. Numbers are board px (a board is 360 wide) unless said. */
export type LevelSpec = {
  level: number;
  scene: Scene;
  /** Field length in metres (20 px each). */
  metres: number;
  /** Walking speed, px per second. */
  speed: number;
  /** Half the ridge's width: the feet slip once their centre is further than this from the middle. */
  half: number;
  /** The steepest the ridge may turn (sideways px per px walked). */
  bend: number;
  puddles: number;
  goats: number;
  /** Bamboo bridges: a stretch where only the middle half of the ridge holds. */
  bridges: number;
  /** Steady wind, strongest sideways push in px per second. */
  wind: number;
  /** Sudden gusts, each a short hard push, warned a second ahead. */
  gusts: number;
  /** The edge's pull, px per second at the very edge (from 65% of the half-width out). */
  pull: number;
  /** Rain: the ridge is slick, so the feet slide on after you let go. */
  rain: boolean;
  /** Steering slows by up to this fraction by the end of the field. */
  tired: number;
  /** The hurricane lamp's lit radius in px, or 0 for daylight. */
  dark: number;
  /** Fireflies hover over the dry lane before each obstacle. */
  flies: boolean;
};

export type LevelDef = LevelSpec & {
  name: string;
  /** The one new thing, in one line, for the title, the intro card and the level list. */
  teach: string;
  /** A finale's name, shown in the HUD bar; "" for the other fields. */
  finale: string;
  world: number;
};

/* ---------- modes ---------- */

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × walking speed. */ pace: number;
  /** × ridge width. */ ridge: number;
  /** × the edge's pull. */ pull: number;
  /** Slips that end a field. */ lives: number;
  /** সহজ tops out at two stars, so it is never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "আল চওড়া, হাঁটা ধীর, কিনারের টান কম। ৫ বার পিছলানো চলে, তারা বড়জোর ২টা।", pace: 0.85, ridge: 1.15, pull: 0.5, lives: 5, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। ৩ বার পিছলালে খেত শেষ।", pace: 1, ridge: 1, pull: 1, lives: 3, maxStars: 3 },
  h: { name: "কঠিন", line: "আল সরু, হাঁটা জোরে, ২ বার পিছলালেই শেষ।", pace: 1.1, ridge: 0.9, pull: 1, lives: 2, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

/* ---------- the twenty fields ---------- */

export const WORLDS = [
  { name: "সকালের সবুজ খেত", scene: "morning" as Scene, motif: 1 },
  { name: "পুকুরপাড়ের খেত", scene: "noon" as Scene, motif: 9 / 8 },
  { name: "বাতাসের বিকাল", scene: "afternoon" as Scene, motif: 5 / 4 },
  { name: "সন্ধ্যার পাকা ধান", scene: "evening" as Scene, motif: 4 / 3 },
] as const;

type Tweak = Partial<Omit<LevelDef, "level" | "scene" | "world" | "name" | "teach">>;
const field = (level: number, name: string, teach: string, tweak: Tweak): LevelDef => {
  const world = Math.floor((level - 1) / 5);
  return {
    level, scene: SCENES[world], world, name, teach, finale: "",
    metres: 30, speed: 62, half: 30, bend: 0.2, puddles: 0, goats: 0, bridges: 0, wind: 0, gusts: 0, pull: 0, rain: false, tired: 0, dark: 0, flies: false,
    ...tweak,
  };
};

/**
 * Each field teaches one thing; each world ends in a named finale. The numbers are tuned by the bots in tests/levels.test.ts.
 * Fields stay long enough to leave `MIN_GAP` of ridge between two obstacles (tests/field.test.ts checks).
 */
export const LEVELS: readonly LevelDef[] = [
  field(1, "প্রথম আল", "আঙুল টেনে বা খেতের এক পাশ চেপে ধরে পা রাখো আলের মাঝখানে।", { metres: 24, speed: 62, half: 32, bend: 0.1 }),
  field(2, "আঁকাবাঁকা আল", "আল এবার বাঁকে। বাঁকের আগেই সেদিকে সরো।", { metres: 32, speed: 64, half: 31, bend: 0.38 }),
  field(3, "কিনারের টান", "কিনারে গেলে পা টলে, আর কাদার দিকে টানে। টললেই মাঝে ফিরে এসো।", { metres: 36, speed: 66, half: 30, bend: 0.4, pull: 24 }),
  field(4, "জমা পানি", "আলে পানি জমেছে। পানি যেদিকে, তার উল্টো পাশ দিয়ে হাঁটো।", { metres: 42, speed: 68, half: 29, bend: 0.38, pull: 24, puddles: 2 }),
  field(5, "ভোরের কাদাপথ", "শেষ ধাপ। লম্বা আলে চার জায়গায় পানি।", { metres: 60, speed: 70, half: 28, bend: 0.38, pull: 26, puddles: 4, finale: "ভোরের কাদাপথ" }),
  field(6, "সরু আল", "পুকুরপাড়ে আল সরু। পা রাখার জায়গা কম।", { metres: 46, speed: 70, half: 23, bend: 0.34, pull: 26, puddles: 1 }),
  field(7, "পথের ছাগল", "আলের ওপর ছাগল দাঁড়িয়ে। ‘ব্যা’ শুনলেই পাশ কাটাও।", { metres: 52, speed: 72, half: 23, bend: 0.28, pull: 26, puddles: 1, goats: 1 }),
  field(8, "দুপুরের তাড়া", "বেলা গড়াচ্ছে। হাঁটার তাল আরও দ্রুত।", { metres: 56, speed: 86, half: 24, bend: 0.28, pull: 26, puddles: 1, goats: 1 }),
  field(9, "বাঁশের সাঁকো", "খালের ওপর বাঁশের সাঁকো। এখানে মাঝখান ছাড়া পা পড়লেই ছপাৎ।", { metres: 58, speed: 82, half: 24, bend: 0.28, pull: 26, puddles: 1, goats: 1, bridges: 1 }),
  field(10, "ছাগলের পাল", "শেষ ধাপ। তিন ছাগল, পানি আর সাঁকো একসাথে।", { metres: 82, speed: 82, half: 23, bend: 0.32, pull: 28, puddles: 2, goats: 3, bridges: 1, finale: "ছাগলের পাল" }),
  field(11, "বাতাস", "বাতাস সারাক্ষণ ঠেলে। দাগ যেদিকে যায়, উল্টো দিকে টানো।", { metres: 56, speed: 78, half: 25, bend: 0.28, pull: 26, puddles: 1, goats: 1, wind: 14 }),
  field(12, "দমকা হাওয়া", "হঠাৎ দমকা আসে। কিনারে তীর জ্বললে সামলাও।", { metres: 64, speed: 78, half: 25, bend: 0.28, pull: 26, puddles: 1, goats: 1, wind: 10, gusts: 3 }),
  field(13, "ঝিরিঝিরি বৃষ্টি", "বৃষ্টিতে আল পিছল। সরা থামালেও পা খানিক গড়ায়।", { metres: 62, speed: 78, half: 26, bend: 0.28, pull: 26, puddles: 1, goats: 1, wind: 8, gusts: 1, rain: true }),
  field(14, "সাপের মতো আল", "আল এখন সাপের মতো বাঁকে। আগে আগে সরো।", { metres: 66, speed: 78, half: 26, bend: 0.42, pull: 26, puddles: 1, goats: 1, wind: 8, gusts: 1, rain: true }),
  field(15, "ঝোড়ো বিকাল", "শেষ ধাপ। বৃষ্টি, দমকা, ছাগল আর পানি একসাথে।", { metres: 88, speed: 80, half: 25, bend: 0.34, pull: 26, puddles: 3, goats: 1, wind: 8, gusts: 2, rain: true, finale: "ঝোড়ো বিকাল" }),
  field(16, "সন্ধ্যা নামছে", "আঁধার ঘনায়। হারিকেনের আলোয় শুধু সামনের খানিকটা দেখা যায়।", { metres: 62, speed: 78, half: 24, bend: 0.3, pull: 26, puddles: 2, goats: 1, dark: 150 }),
  field(17, "ক্লান্ত পা", "পথ যত ফুরোয়, পা তত ভারী হয়। সরতে দেরি হবে, তাই আগে আগে সরো।", { metres: 66, speed: 76, half: 24, bend: 0.28, pull: 26, puddles: 2, goats: 1, tired: 0.3, dark: 150 }),
  field(18, "জোনাকির পথ", "জোনাকি জ্বলছে শুকনো পাশে। ওদের পিছু নাও।", { metres: 70, speed: 78, half: 23, bend: 0.3, pull: 26, puddles: 2, goats: 2, bridges: 1, dark: 130, flies: true }),
  field(19, "সন্ধ্যার তাড়া", "সন্ধ্যা ঘনাচ্ছে, উঠানে পৌঁছাতে হবে। সবচেয়ে দ্রুত তাল।", { metres: 74, speed: 90, half: 24, bend: 0.28, pull: 26, puddles: 2, goats: 2, bridges: 1, dark: 150, flies: true }),
  field(20, "শেষ আল", "শেষ ধাপ। আঁধার, ক্লান্ত পা, সাঁকো, ছাগল আর দমকা, উঠান পর্যন্ত।", { metres: 100, speed: 80, half: 23, bend: 0.3, pull: 28, puddles: 2, goats: 2, bridges: 1, wind: 8, gusts: 2, tired: 0.25, dark: 140, finale: "শেষ আল" }),
];

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const clampLevel = (level: number) => Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1));
export const sceneOf = (level: number): Scene => SCENES[Math.floor((clampLevel(level) - 1) / 5)];
export const defOfLevel = (level: number) => LEVELS[clampLevel(level) - 1];

/** The level with a mode applied: a wider or narrower ridge, a slower or quicker pace, a lighter or full pull. */
export function specOf(level: number, mode: Mode = "n"): LevelSpec {
  const def = defOfLevel(level), info = MODE_INFO[mode];
  return { ...def, speed: Math.round(def.speed * info.pace), half: Math.round(def.half * info.ridge), pull: Math.round(def.pull * info.pull) };
}

/* ---------- old links ---------- */

/**
 * The fields links without `v=2` were played on: twenty in four scenes, with puddles from 4, goats from 7 and wind from 11.
 * The numbers are exactly the old game's, so an old link opens the same ridge, puddles, goats and wind.
 */
export function levelSpec(level: number): LevelSpec {
  const n = clampLevel(level), p = (n - 1) / (LEVEL_COUNT - 1);
  return {
    level: n,
    scene: sceneOf(n),
    metres: 30 + 5 * (n - 1),
    speed: Math.round(62 + 22 * p),
    half: Math.round(30 - 11 * p),
    bend: Math.round((0.14 + 0.36 * p ** 0.7) * 100) / 100,
    puddles: n < 4 ? 0 : Math.min(5, 1 + Math.floor((n - 4) / 3)),
    goats: n < 7 ? 0 : Math.min(3, 1 + Math.floor((n - 7) / 4)),
    wind: n < 11 ? 0 : 10 + (n - 11),
    bridges: 0, gusts: 0, pull: 0, rain: false, tired: 0, dark: 0, flies: false,
  };
}
export const legacySpec = levelSpec;

/** What a run plays: a level 1–20, or an old link's field (the old numbers, three slips, the old stars). */
export type Kind = "level" | "old";
export type Run = { seed: number; kind: Kind; level: number; mode: Mode };
export const specOfRun = (run: Run): LevelSpec => run.kind === "old" ? legacySpec(run.level) : specOf(run.level, run.mode);
export const nameOfRun = (run: Pick<Run, "kind" | "level">) => run.kind === "old" ? `${SCENE_NAME[sceneOf(run.level)]}` : defOfLevel(run.level).name;
/** Slips that end the field. */
export const livesOf = (run: Pick<Run, "kind" | "mode">) => run.kind === "old" ? 3 : MODE_INFO[run.mode].lives;

/** The old news line for the ready screen, kept for old callers. */
export function newThing(level: number) {
  return defOfLevel(level).teach;
}

/** The ready card shows for a level whose intro hasn't been seen on this phone, when it is reached without passing the title. */
export const showsIntro = (level: number, seen: readonly number[]) => isLevel(level) && !seen.includes(level);

/* ---------- stars ---------- */

/** 3 stars for a dry walk, 2 for one slip, 1 for two (or more in সহজ); none if the last slip ended the field. সহজ tops out at 2. */
export function starsOf(slips: number, cleared: boolean, mode: Mode = "n") {
  if (!cleared) return 0;
  return Math.min(MODE_INFO[mode].maxStars, Math.max(1, Math.min(3, 3 - slips)));
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

/** A JSON list of level numbers (`ektukhani-ahead-…`, `ektukhani-seen-…`); junk reads as none. */
export function readList(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}
export const readAhead = readList;
