// The levels as data: three worlds of four rival teams, each adding one thing, plus the old ten-team ladder that links
// without `v=2` replay. Server-safe (no React): link.ts and share.ts read the names from here.
import { starsFor, unlockedLevel, type LevelStars } from "../../../shared/game-core";

export const SLUG = "roshi-tana";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × every tap window. */ window: number;
  /** × the rival's pull. */ rival: number;
  /** Easy tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "চাপার সময় বেশি, ওদের টান হালকা। তারা বড়জোর ২টা।", window: 1.35, rival: 0.8, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। ৩ তারা পেতে প্রায় প্রতি ঢোলে তালে চাপতে হবে।", window: 1, rival: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "চাপার সময় কম, ওদের টান ভারী। তারার জন্য কয়েক টান বেশি পাও।", window: 0.8, rival: 1.1, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; line: string };
export const WORLDS: readonly World[] = [
  { name: "সকালের মাঠ", line: "বার্ষিক ক্রীড়ার সকাল, ছোটদের রাউন্ড।" },
  { name: "বিকেলের টুর্নামেন্ট", line: "বিকেলের ধুলায় পাড়ার দলগুলো।" },
  { name: "বাতির আলোয় ফাইনাল", line: "সন্ধ্যায় বাতি জ্বলেছে, শেষ খেলা।" },
];

/** A finale's heave: their দম bar fills, then they heave for `beats` beats at `power` × their pull; first after `first` beats, then every `every`. */
export type Surge = { first: number; every: number; beats: number; power: number };

export type LevelDef = {
  /** As it reads on its own ("ক্লাস ফাইভ") and as the object of a sentence ("ক্লাস ফাইভকে"). */
  team: string; obj: string;
  shirt: string;
  world: number;
  /** The one new thing, in one line, for the title and the level list. Empty on the old ladder. */
  teach: string;
  /** Drum beats a minute at the start. */
  bpm: number;
  /** Chance per beat that the team pulls right on the beat, and that it pulls a little off it. */
  perfect: number; good: number;
  /** × their pull, and × how far one of your pulls moves the ribbon (a light team gives way more). */
  weight: number; give: number;
  /** How far a tap off the beat slips the rope, as a share of a full pull. */
  slip: number;
  /** Taps on the beat in a row pull harder. */
  combo: boolean;
  /** Every 4th beat is a বড় ঢোল: right on it, your pull counts double. */
  accent: boolean;
  /** Some beats are rests: no stroke, and a tap on one slips. */
  rests: boolean;
  /** 4 beats in every 12 go quiet: no stroke and a faint ring. */
  silent: boolean;
  /** Dew: a slip costs double and a missed beat slips a little. */
  slick: boolean;
  /** Near our line they pull up to (1 + digIn) × heavier. */
  digIn: number;
  /** Tempo changes: [beats after the count-in, new bpm]. */
  tempo: readonly (readonly [number, number])[];
  surge: Surge | null;
  /** A win in at most this many beats earns 3 stars, then 2: normal (and easy, capped at 2) and hard. */
  stars: readonly [number, number];
  hard: readonly [number, number];
};

/** A two-star win still has to come before the 60-beat whistle. */
const MAX_TWO = 60;
const level = (def: Partial<LevelDef> & Pick<LevelDef, "team" | "obj" | "shirt" | "world" | "teach" | "bpm" | "perfect" | "good" | "weight" | "stars">): LevelDef =>
  ({ give: 1, slip: 0.3, combo: true, accent: false, rests: false, silent: false, slick: false, digIn: 0, tempo: [], surge: null, hard: [def.stars[0] + 3, Math.min(MAX_TWO, def.stars[1] + 6)], ...def });

/**
 * The ladder new links (`v=2`) and this phone play. Each level adds one thing; each finale brings its world's things back.
 * Star counts: the steady bot's median win for three (a sharp player beats it), its 85th percentile + a margin for two.
 * tests/levels.test.ts asserts the rates.
 */
export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, team: "ক্লাস থ্রি", obj: "ক্লাস থ্রিকে", shirt: "#3b82c4", teach: "ঢোলের রিং কিনারায় মিশলেই চাপো।",
    bpm: 100, perfect: 0.03, good: 0.08, weight: 0.4, give: 1.3, combo: false, stars: [10, 16] }),
  level({ world: 0, team: "ক্লাস ফোর", obj: "ক্লাস ফোরকে", shirt: "#7b4fb0", teach: "টানা তালে চাপলে টান বাড়ে, রশি টানটান।",
    bpm: 92, perfect: 0.2, good: 0.22, weight: 0.8, stars: [13, 20] }),
  level({ world: 0, team: "ক্লাস সিক্স", obj: "ক্লাস সিক্সকে", shirt: "#1d9a8f", teach: "প্রতি চতুর্থ ঢোল বড়। ঠিক তালে চাপলে টান দ্বিগুণ।",
    bpm: 94, perfect: 0.32, good: 0.24, weight: 0.92, accent: true, stars: [11, 19] }),
  level({ world: 0, team: "ক্লাস টেনের দল", obj: "ক্লাস টেনের দলকে", shirt: "#2f6fa0", teach: "ওদের দম ভরলে ২ ঢোল জোরে টানে। ঠিক তালে চেপে ঠেকাও।",
    bpm: 94, perfect: 0.38, good: 0.24, weight: 0.98, accent: true, surge: { first: 6, every: 9, beats: 2, power: 1.6 }, stars: [12, 27] }),
  level({ world: 1, team: "পাশের স্কুল", obj: "পাশের স্কুলকে", shirt: "#8a3a52", teach: "কিছু ঢোল ফাঁকা: দাগকাটা রিং, শব্দ নেই। তখন চেপো না।",
    bpm: 96, perfect: 0.4, good: 0.25, weight: 0.98, accent: true, rests: true, stars: [13, 23] }),
  level({ world: 1, team: "কলেজের ভাইয়ারা", obj: "কলেজের ভাইয়াদের", shirt: "#e9e6dc", teach: "মাঝপথে ঢোলি তাল বাড়ায়। কিনারায় লেখা দেখলেই তৈরি থাকো।",
    bpm: 96, perfect: 0.42, good: 0.25, weight: 1, accent: true, rests: true, tempo: [[10, 112]], stars: [15, 27] }),
  level({ world: 1, team: "পাড়ার ক্লাব", obj: "পাড়ার ক্লাবকে", shirt: "#4a5a70", teach: "আমাদের দাগের কাছে ওরা মাটি কামড়ে ধরে। শেষে টানা রাখো।",
    bpm: 100, perfect: 0.44, good: 0.25, weight: 1, accent: true, rests: true, digIn: 0.8, stars: [17, 46] }),
  level({ world: 1, team: "অভিভাবক দল", obj: "অভিভাবক দলকে", shirt: "#a0522d", teach: "আব্বুদের হেঁইয়ো, ফাঁকা তাল আর দ্রুত ঢোল একসাথে।",
    bpm: 98, perfect: 0.45, good: 0.25, weight: 1.02, accent: true, rests: true, digIn: 0.4, tempo: [[12, 110]], surge: { first: 6, every: 9, beats: 2, power: 1.7 }, stars: [17, 52] }),
  level({ world: 2, team: "স্কাউট দল", obj: "স্কাউট দলকে", shirt: "#5f7a3a", teach: "মাঝে মাঝে ঢোল চুপ, রিং আবছা। মনে মনে গুনে চাপো।",
    bpm: 102, perfect: 0.46, good: 0.25, weight: 1.02, accent: true, rests: true, silent: true, stars: [17, 41] }),
  level({ world: 2, team: "শিক্ষকদের দল", obj: "শিক্ষকদের দলকে", shirt: "#33415c", teach: "শিশিরে মাঠ পিছল। ভুল চাপে দ্বিগুণ ফসকায়, না চাপলেও একটু।",
    bpm: 104, perfect: 0.48, good: 0.25, weight: 1.04, accent: true, rests: true, silent: true, slick: true, stars: [17, 48] }),
  level({ world: 2, team: "প্রাক্তন ছাত্ররা", obj: "প্রাক্তন ছাত্রদের", shirt: "#c08a1e", teach: "ঢোলি একবার তাল কমায়, তারপর আরও বাড়ায়।",
    bpm: 104, perfect: 0.48, good: 0.25, weight: 1.04, accent: true, rests: true, silent: true, slick: true, tempo: [[8, 92], [18, 118]], stars: [17, 56] }),
  level({ world: 2, team: "হেডস্যারের দল", obj: "হেডস্যারের দলকে", shirt: "#5b2a86", teach: "সব একসাথে, আর হেডস্যারের লম্বা হেঁইয়ো।",
    bpm: 104, perfect: 0.5, good: 0.24, weight: 1.06, accent: true, rests: true, silent: true, slick: true, digIn: 0.4, tempo: [[14, 114]], surge: { first: 5, every: 9, beats: 3, power: 1.6 }, stars: [19, 58] }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isFinale = (def: LevelDef) => def.surge !== null;

/** The ten-team ladder links without `v=2` were played on: tempo, the team's aim and weight, stars. Nothing else. */
const OLD = [
  ["ক্লাস থ্রি", "ক্লাস থ্রিকে", "#3b82c4", 80, 0.05, 0.15, 0.6, 13, 20], ["ক্লাস ফোর", "ক্লাস ফোরকে", "#7b4fb0", 82, 0.14, 0.22, 0.75, 14, 22],
  ["ক্লাস ফাইভ", "ক্লাস ফাইভকে", "#1d9a8f", 85, 0.22, 0.24, 0.82, 16, 25], ["ক্লাস সিক্স", "ক্লাস সিক্সকে", "#8a3a52", 88, 0.28, 0.26, 0.88, 17, 28],
  ["ক্লাস এইট", "ক্লাস এইটকে", "#4a5a70", 92, 0.33, 0.26, 0.9, 18, 31], ["ক্লাস টেন", "ক্লাস টেনকে", "#2f6fa0", 96, 0.38, 0.26, 0.92, 19, 34],
  ["কলেজের ভাইয়ারা", "কলেজের ভাইয়াদের", "#e9e6dc", 100, 0.42, 0.25, 0.94, 21, 38], ["অভিভাবক দল", "অভিভাবক দলকে", "#a0522d", 104, 0.46, 0.25, 0.96, 23, 42],
  ["শিক্ষকদের দল", "শিক্ষকদের দলকে", "#33415c", 108, 0.5, 0.24, 0.98, 25, 48], ["হেডস্যারের দল", "হেডস্যারের দলকে", "#5b2a86", 112, 0.55, 0.22, 1.0, 28, 55],
] as const;
export const OLD_LEVELS: readonly LevelDef[] = OLD.map(([team, obj, shirt, bpm, perfect, good, weight, three, two], index) =>
  level({ world: Math.min(2, Math.floor(index / 4)), team, obj, shirt, teach: "", bpm, perfect, good, weight, slip: 0.2, stars: [three, two], hard: [three, two] }));
export const OLD_COUNT = OLD_LEVELS.length;

export const isLevel = (value: number, old = false) => Number.isInteger(value) && value >= 1 && value <= (old ? OLD_COUNT : LEVEL_COUNT);
export const levelDef = (value: number, old = false) => {
  const list = old ? OLD_LEVELS : LEVELS;
  return list[Math.min(list.length, Math.max(1, Math.round(value) || 1)) - 1];
};

/** The friendly tempo for two players on one phone (no bot). */
export const DUO_BPM = 88;
/** Our team in solo, and the bottom player with two; the top player with two. */
export const US = { name: "হলুদ দল", shirt: "#f2b705" } as const;
export const THEM = { name: "নীল দল", shirt: "#2f6fd0" } as const;

const thresholds = (value: number, mode: Mode, old: boolean) => { const def = levelDef(value, old); return mode === "h" ? def.hard : def.stars; };
/** Stars for a win in `beats` beats. Easy tops out at two. */
export function starsOf(beats: number, value: number, mode: Mode = "n", old = false) {
  const [three, two] = thresholds(value, mode, old);
  return Math.min(MODE_INFO[mode].maxStars, starsFor(beats, three, two, true));
}
/** Beats to cut for the next star, or 0 when there is no next star in this mode. */
export function toNextStar(beats: number, value: number, mode: Mode = "n", old = false) {
  const earned = starsOf(beats, value, mode, old);
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  const [three, two] = thresholds(value, mode, old);
  return beats - (earned === 2 ? three : two);
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

/** `ektukhani-ahead-roshi-tana`: a JSON list of level numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

/** `ektukhani-beats-roshi-tana`: the fewest beats per "<level><mode>" (e.g. "4n"). Junk entries are dropped. */
export type Bests = Record<string, number>;
export const bestKey = (value: number, mode: Mode) => `${value}${mode}`;
export function readBests(raw: string | null): Bests {
  const bests: Bests = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") for (const [key, value] of Object.entries(parsed)) {
      if (/^(?:[1-9]|1[0-2])[enh]$/.test(key) && Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 60) bests[key] = value as number;
    }
  } catch { /* broken JSON: start fresh */ }
  return bests;
}
