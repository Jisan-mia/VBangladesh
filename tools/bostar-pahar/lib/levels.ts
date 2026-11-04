// The levels as data: three worlds of four, each level adding one thing, plus খোলা ঘাট (endless) and the old ghats that
// links without `v=2` replay. Server-safe (no React): link.ts and share.ts read names and goals from here.
import { starsFor, unlockedLevel, type LevelStars } from "../../../shared/game-core";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × swing speed. */ speed: number;
  /** × the pile's sway kick and gusts. */ sway: number;
  /** Spare sacks: a slip costs one. */ spares: number;
  /** × the lean limit. */ limit: number;
  /** Easy is capped at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "ধীরে দোলে, পাহাড় কম দোলে আর কম হেলে পড়ে। ৫টা বাড়তি বস্তা, তারা বড়জোর ২টা।", speed: 0.82, sway: 0.55, spares: 5, limit: 1.15, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। ৩টা বাড়তি বস্তা।", speed: 1, sway: 1, spares: 3, limit: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "জোরে দোলে, পাহাড় বেশি দোলে, বাড়তি বস্তা ২টা।", speed: 1.12, sway: 1.25, spares: 2, limit: 1, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; horn: number };
/** `horn`: the pitch of the world's launch horn at a clear. */
export const WORLDS: readonly World[] = [
  { name: "সদরঘাটের বিকেল", horn: 1 },
  { name: "মেঘনার হাওয়া", horn: 9 / 8 },
  { name: "রাতের ফেরিঘাট", horn: 4 / 3 },
];

export type LevelDef = {
  name: string;
  /** The one new thing, in one line, for the title and the level list. */
  teach: string;
  world: number;
  /** Sacks that fill the truck; 0 is endless (খোলা ঘাট and old links). */
  goal: number;
  /** Seconds for one swing, at the first sack and at the goal. */
  period: readonly [number, number];
  /** How far either side of the pulley the sack swings, in sack widths. */
  amp: number;
  /** × the pile's sway (0: a stiff pile, the old game). */
  sway: number;
  /** The trolley stops up to this fraction of `amp` off the top sack. */
  shift: number;
  /** The trolley keeps rolling: ± sack widths. */
  roll: number;
  /** Jute sacks in the mix land heavy. */
  heavy: boolean;
  /** Gust strength (0: none); `storm` makes each sack stronger than the last. */
  gusts: number;
  storm: boolean;
  /** The lights go out now and then. */
  dark: boolean;
  /** The pontoon rolls the truck: ± sack widths. */
  pontoon: number;
  /** How far the top may lean from the plumb line before the pile topples, in sack widths. */
  limit: number;
  /** A finale's named bar: seconds before the horn (0: no clock), and its name. */
  clock: number;
  finale: string;
  /** ঠিক মাঝে drops for two and three stars. */
  stars: readonly [number, number];
};

const level = (def: Partial<LevelDef> & Pick<LevelDef, "name" | "teach" | "world" | "goal" | "stars">): LevelDef => ({
  period: [2.5, 2.1], amp: 1.05, sway: 1, shift: 0, roll: 0, heavy: false, gusts: 0, storm: false, dark: false, pontoon: 0, limit: 1, clock: 0, finale: "", ...def,
});

/**
 * Each level teaches one thing; each world ends in a named finale that adds its own pressure.
 * Star counts and clocks are tuned by the bots in tests/levels.test.ts.
 */
export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, name: "প্রথম ট্রাক", teach: "দোল দেখে চাপো। নিচের বস্তার ঠিক ওপরে এলেই।", goal: 4, period: [2.6, 2.4], sway: 0.35, stars: [2, 3] }),
  level({ world: 0, name: "দুলুনি", teach: "পাহাড় এবার দোলে। দোল থামলে ফেলো, নয়তো ঠিক মাঝে মারো।", goal: 6, period: [2.4, 2.0], stars: [3, 4] }),
  level({ world: 0, name: "সরে থামা ট্রলি", teach: "ট্রলি একটু সরে থামে। দোলের মাঝখান আর পাহাড় এক জায়গায় নয়।", goal: 7, period: [2.3, 1.9], shift: 0.4, stars: [3, 5] }),
  level({ world: 0, name: "সন্ধ্যার লঞ্চ", teach: "ভেঁপু বাজার আগে ৮টা বস্তা তোলো। লঞ্চ কারও জন্য দাঁড়ায় না।", goal: 8, period: [2.2, 1.8], shift: 0.4, clock: 20, finale: "সন্ধ্যার লঞ্চ", stars: [3, 5] }),
  level({ world: 1, name: "পাটের বস্তা", teach: "পাটের বস্তা ভারী। বসলে পাহাড় বেশি দোলে।", goal: 8, period: [2.2, 1.8], shift: 0.3, heavy: true, stars: [3, 5] }),
  level({ world: 1, name: "দমকা হাওয়া", teach: "দমকা হাওয়া পাহাড় ঠেলে দেয়। কিনারায় তীর দেখলেই সামলাও।", goal: 9, period: [2.1, 1.75], shift: 0.3, heavy: true, gusts: 0.7, stars: [4, 6] }),
  level({ world: 1, name: "চলন্ত ট্রলি", teach: "ট্রলি এবার থামে না, দুলতে দুলতে সরে।", goal: 9, period: [2.1, 1.75], heavy: true, gusts: 0.7, roll: 0.45, stars: [4, 6] }),
  level({ world: 1, name: "কালবৈশাখী", teach: "ঝড় আসছে। প্রতিটা বস্তার পর হাওয়া আরও জোরে।", goal: 10, period: [2.0, 1.7], heavy: true, gusts: 0.6, storm: true, roll: 0.45, finale: "কালবৈশাখী", stars: [4, 6] }),
  level({ world: 2, name: "লোডশেডিং", teach: "মাঝে মাঝে বাতি নিভে যায়। দোলের তাল মনে রাখো।", goal: 9, period: [2.1, 1.75], shift: 0.35, heavy: true, dark: true, stars: [4, 6] }),
  level({ world: 2, name: "পন্টুন", teach: "ট্রাক দাঁড়িয়ে পন্টুনে। ঢেউয়ে পুরো পাহাড় দোলে।", goal: 10, period: [2.1, 1.75], shift: 0.3, heavy: true, pontoon: 0.28, stars: [4, 6] }),
  level({ world: 2, name: "ছোট ট্রাক", teach: "ছোট ট্রাক। হেলার সীমা এবার কাছে।", goal: 10, period: [2.0, 1.7], shift: 0.3, heavy: true, pontoon: 0.28, limit: 0.8, stars: [5, 7] }),
  level({ world: 2, name: "শেষ খেপ", teach: "মাঝরাতের শেষ ফেরি, ছোট ট্রাকে। ঢেউ, হাওয়া আর লোডশেডিং একসাথে, ভেঁপুর আগে।", goal: 12, period: [2.0, 1.7], shift: 0.3, heavy: true, pontoon: 0.28, limit: 0.8, gusts: 0.6, dark: true, clock: 30, finale: "শেষ খেপ", stars: [5, 7] }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;

/** খোলা ঘাট: endless, the old game's rising swing (see game.ts swingInto) with the new sway. */
export const ENDLESS: LevelDef = level({ world: 0, name: "খোলা ঘাট", teach: "যত উঁচু পারো। দোল বাড়ে, পাহাড়ও দোলে।", goal: 0, stars: [0, 0] });

/**
 * The ghats links without `v=2` were played on: endless, a stiff pile, the swings starting `offset` sacks along,
 * and the old height marks (goal, 2 and 3 stars), kept so an old link replays and reads exactly as before.
 */
export const OLD_GHATS = [
  { name: "সদরঘাট", offset: 0, goal: 5, stars: [12, 20] },
  { name: "বাদামতলী", offset: 1, goal: 7, stars: [13, 22] },
  { name: "নারায়ণগঞ্জ", offset: 2, goal: 8, stars: [14, 24] },
  { name: "চাঁদপুর", offset: 4, goal: 9, stars: [16, 26] },
  { name: "মাওয়া", offset: 5, goal: 10, stars: [16, 26] },
  { name: "আরিচা", offset: 6, goal: 10, stars: [17, 26] },
  { name: "ভৈরব", offset: 8, goal: 10, stars: [16, 25] },
  { name: "বরিশাল", offset: 9, goal: 10, stars: [16, 24] },
  { name: "খুলনা", offset: 10, goal: 10, stars: [16, 23] },
  { name: "চিলমারী", offset: 12, goal: 10, stars: [15, 22] },
] as const satisfies ReadonlyArray<{ name: string; offset: number; goal: number; stars: readonly [number, number] }>;
export const OLD_COUNT = OLD_GHATS.length;
export const OLD_RULES: LevelDef = level({ world: 0, name: "পুরোনো দোল", teach: "", goal: 0, sway: 0, stars: [0, 0] });

/** What a run plays: a level 1–12, খোলা ঘাট, or an old link's ghat (1–10). */
export type Kind = "level" | "endless" | "old";
export type Run = { seed: number; kind: Kind; level: number; mode: Mode };
export const defOf = (run: Pick<Run, "kind" | "level">) => run.kind === "level" ? LEVELS[run.level - 1] : run.kind === "endless" ? ENDLESS : OLD_RULES;

/** Stars for a level run: none unless the truck filled, then by ঠিক মাঝে drops. Easy tops out at two. */
export function starsOf(level: number, filled: boolean, perfect: number, mode: Mode = "n") {
  if (!filled) return 0;
  const [two, three] = LEVELS[level - 1].stars;
  return Math.min(MODE_INFO[mode].maxStars, starsFor(perfect, three, two));
}
/** ঠিক মাঝে drops still needed for the next star, or 0 when there is no next star in this mode. */
export function toNextStar(level: number, perfect: number, mode: Mode = "n") {
  const earned = starsOf(level, true, perfect, mode), [two, three] = LEVELS[level - 1].stars;
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  return (earned === 2 ? three : two) - perfect;
}
/** Old links: their stars by height, exactly as the old game counted them (none below the goal). */
export function oldStarsOf(ghat: number, sacks: number) {
  const def = OLD_GHATS[ghat - 1];
  return sacks < def.goal ? 0 : starsFor(sacks, def.stars[1], def.stars[0]);
}
/** Before ghats, this phone kept only a best count for the one game there was (now level 1). Its stars, or 0 when there is nothing to move. */
export function migrateBest(stars: LevelStars, oldBest: string | null) {
  const sacks = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || !Number.isInteger(sacks) || sacks < 0) return 0;
  return oldStarsOf(1, sacks);
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
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}
