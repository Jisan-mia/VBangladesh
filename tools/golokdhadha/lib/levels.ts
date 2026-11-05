// The levels as data: five worlds of six, each level adding one thing, the daily maze, par times and this phone's unlock.
// Pure and server-safe: link.ts and share.ts check a friend's link against these boards.
import { starsFor, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { boardFromMaze, type Board } from "./board";
import { generate, type Spec } from "./gen";
import { oldDailyMaze, oldDailyWorld, oldLevelMaze, oldWorldOf } from "./legacy";
import { bestWalk, buildGraph, costToGo, RIDE, type Graph } from "./solve";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, { name: string; line: string; maxStars: number }> = {
  e: { name: "সহজ", line: "মোড়ে থামলে ঠিক দিকটা জ্বলে ওঠে। তারা বড়জোর ২টা।", maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। ৩ তারা পেতে মোড়ে বেশি থামা চলবে না।", maxStars: 3 },
  h: { name: "কঠিন", line: "সব ধাঁধা লোডশেডিংয়ে, হাতে শুধু হারিকেন। তারার সময় একটু বেশি।", maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);
/** The lantern's reach on a lit level in কঠিন. */
export const HARD_DARK = 2.6;

export type World = { name: string; clear: string; piece: string };
export const WORLDS: readonly World[] = [
  { name: "পুরান ঢাকার গলি", clear: "গলি পার, জিলাপির দোকান সামনে।", piece: "গলি" },
  { name: "গ্রামের মেঠোপথ", clear: "আল পেরিয়ে মেলায় এলে। জিলাপি ভাজা হচ্ছে।", piece: "ঝাঁপ" },
  { name: "সুন্দরবনের খাল", clear: "খাল পেরিয়ে নৌকা ঘাটে ভিড়ল। দোকানে গরম জিলাপি।", piece: "স্রোত" },
  { name: "লোডশেডিংয়ের রাত", clear: "অন্ধকার পেরিয়ে দোকানের হারিকেনের কাছে এলে।", piece: "হারিকেন" },
  { name: "চাঁদরাতের বাজার", clear: "চাঁদরাতের ভিড় ঠেলে দোকানে। ঈদের জিলাপি তৈরি।", piece: "রিকশা" },
];

export type LevelDef = { name: string; teach: string; world: number; finale: boolean; spec: Spec };
const level = (world: number, name: string, teach: string, spec: Omit<Spec, "world" | "seed">, finale = false) => ({ name, teach, world, finale, spec: { ...spec, world, seed: 0 } });

const TABLE = [
  level(0, "প্রথম মোড়", "আঙুল টানো। মোড় পর্যন্ত নিজেই হাঁটবে।", { size: 5, swipes: 2, straight: 0.6 }),
  level(0, "কানাগলি", "ভুল গলিতে ঢুকলে উল্টো দিকে টানো, দাগ মুছে যাবে।", { size: 6, swipes: 4 }),
  level(0, "সোজা গলি", "সোজা গলির যেকোনো ঘরে চাপলেও সেখানে হেঁটে যায়।", { size: 7, swipes: 4, straight: 0.85 }),
  level(0, "দুই রাস্তা", "দোকানে যাওয়ার পথ দুটো। ছোটটা ধরলে তারা বেশি।", { size: 7, swipes: 5, braid: 0.5 }),
  level(0, "আগেই টানো", "মোড় আসার আগেই দিক টেনে রাখো, তাহলে থামবে না।", { size: 9, swipes: 8, straight: 0.1 }),
  level(0, "চকবাজারের জট", "শেষ ধাপ। গলির জট, কানাগলি আর দুই রাস্তা একসাথে।", { size: 10, swipes: 9, braid: 0.3 }, true),

  level(1, "চাবি আর ঝাঁপ", "বাঁশের ঝাঁপে তালা। পথেই চাবি পড়ে আছে।", { size: 8, swipes: 5, keys: { count: 1 } }),
  level(1, "ঘুরপথে চাবি", "চাবিটা পাশের গলিতে। আগে চাবি, তারপর ঝাঁপ।", { size: 8, swipes: 6, keys: { count: 1, detour: true } }),
  level(1, "দুই চাবি", "দুটো ঝাঁপ, দুটো চাবি। রং আর আকার মিলিয়ে খোলে।", { size: 9, swipes: 7, keys: { count: 2 } }),
  level(1, "ঝাঁপের ওপারে চাবি", "দ্বিতীয় চাবিটা প্রথম ঝাঁপের ওপারে।", { size: 9, swipes: 8, keys: { count: 2, chain: true }, braid: 0.15 }),
  level(1, "চাবির শর্টকাট", "চাবি নিলে ছোট পথ খোলে। না নিলে ঘুরপথ।", { size: 10, swipes: 8, keys: { count: 1, shortcut: true }, straight: 0.15 }),
  level(1, "জমিদারবাড়ির তালা", "শেষ ধাপ। দুই ঝাঁপ, দুই চাবি, আর ঘুরপথ।", { size: 11, swipes: 10, keys: { count: 2, chain: true, detour: true }, braid: 0.2 }, true),

  level(2, "স্রোত", "খালে স্রোত। নৌকা শুধু তীরের দিকে যায়।", { size: 9, swipes: 6, current: { along: 3 } }),
  level(2, "উল্টো স্রোত", "চেনা পথে উল্টো স্রোত। ঘুরে যেতে হবে।", { size: 10, swipes: 7, current: { against: 1, along: 1 }, braid: 0.35 }),
  level(2, "স্রোতের শর্টকাট", "স্রোত ধরলে ছোট পথ, কিন্তু ফেরা যায় না।", { size: 10, swipes: 7, current: { shortcut: 1, random: 2 }, braid: 0.15 }),
  level(2, "স্রোত আর চাবি", "স্রোতের খালে ঝাঁপ আর তার চাবি।", { size: 11, swipes: 8, current: { along: 2, random: 2 }, keys: { count: 1, detour: true } }),
  level(2, "ভাটার টান", "চারদিকে স্রোত, দুই দিকেই। তীর দেখে চলো।", { size: 11, swipes: 9, current: { along: 2, against: 1, random: 5 }, braid: 0.3 }),
  level(2, "মোহনার জট", "শেষ ধাপ। স্রোত, ঝাঁপ আর ঘুরপথ মোহনায়।", { size: 12, swipes: 10, current: { along: 2, random: 3 }, keys: { count: 1, detour: true }, braid: 0.3 }, true),

  level(3, "লোডশেডিং", "বিদ্যুৎ নেই। হারিকেনের আলোয় যতটুকু দেখা যায়।", { size: 8, swipes: 5, dark: 2.8 }),
  level(3, "মনে রাখো", "আলো আরও ছোট। দেখা গলিগুলো আবছা মনে থাকে।", { size: 9, swipes: 6, dark: 2.1 }),
  level(3, "অন্ধকারে দুই রাস্তা", "অন্ধকারেও দুটো পথ। ছোটটা খোঁজো।", { size: 9, swipes: 6, dark: 2.3, braid: 0.4 }),
  level(3, "অন্ধকারে চাবি", "অন্ধকারে চাবি ঝিকমিক করে। খুঁজে নাও।", { size: 10, swipes: 7, dark: 2.3, keys: { count: 1, detour: true } }),
  level(3, "অন্ধকারে স্রোত", "অন্ধকারে একমুখী গলি। তীর চোখে রাখো।", { size: 10, swipes: 7, dark: 2.3, current: { along: 2, random: 3 } }),
  level(3, "নিভু নিভু হারিকেন", "শেষ ধাপ। সবচেয়ে ছোট আলো, ঝাঁপ আর একমুখী গলি।", { size: 11, swipes: 8, dark: 1.8, keys: { count: 1, detour: true }, current: { along: 1, random: 2 } }, true),

  level(4, "রিকশা", "রিকশার স্ট্যান্ডে পা দিলেই ওপারের স্ট্যান্ডে নিয়ে যায়।", { size: 10, swipes: 6, rides: 1 }),
  level(4, "দুই রিকশা", "পরপর দুটো রিকশা লাগবে।", { size: 11, swipes: 8, rides: 2 }),
  level(4, "রিকশা আর চাবি", "রিকশায় চড়ার আগে বা পরে, চাবি কোথায়?", { size: 11, swipes: 8, rides: 1, keys: { count: 1, detour: true }, braid: 0.15 }),
  level(4, "একমুখী রাস্তা", "রিকশা আর একমুখী রাস্তা। সাইন দেখে চলো।", { size: 12, swipes: 9, rides: 1, current: { along: 2, random: 4 }, braid: 0.2 }),
  level(4, "বাজারে লোডশেডিং", "চাঁদরাতের বাজারে হঠাৎ বিদ্যুৎ গেল।", { size: 12, swipes: 8, rides: 1, dark: 2.6, braid: 0.2 }),
  level(4, "ঈদের আগের রাত", "শেষ ধাপ। রিকশা, ঝাঁপ, একমুখী রাস্তা, সব একসাথে।", { size: 13, swipes: 11, rides: 2, keys: { count: 1, detour: true }, current: { along: 1, random: 3 }, braid: 0.2 }, true),
];

export const LEVELS: readonly LevelDef[] = TABLE.map((def, index) => ({ ...def, spec: { ...def.spec, seed: 4000 + (index + 1) * 97 } } as LevelDef));
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[value - 1];
export const worldOf = (value: number) => LEVELS[value - 1].world;

/* ---------- boards ---------- */

const boards = new Map<string, { board: Board; graph: Graph }>();
const cached = (key: string, make: () => { board: Board; graph: Graph }) => {
  let made = boards.get(key);
  if (!made) { made = make(); boards.set(key, made); }
  return made;
};
export const levelBoard = (value: number) => cached(`l${value}`, () => generate(LEVELS[value - 1].spec));

/** Today's date in Dhaka (UTC+6) as a number like 20261012: the daily maze's seed. */
export function dhakaDate(now = Date.now()) {
  const date = new Date(now + 6 * 3600_000);
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}
/** A real calendar date from 2026 to 2099 written as YYYYMMDD. */
export function isDailySeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 20260101 || seed > 20991231) return false;
  const year = Math.floor(seed / 10000), month = Math.floor(seed / 100) % 100, day = seed % 100;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export const DAILY_SIZE = 12;
/** The daily takes one world's piece by date. */
export const dailyWorld = (seed: number) => seed % 5;
const DAILY: readonly Omit<Spec, "seed" | "world" | "size">[] = [
  { swipes: 10, braid: 0.3 },
  { swipes: 9, keys: { count: 1, detour: true }, braid: 0.15 },
  { swipes: 9, current: { along: 2, against: 1, random: 3 }, braid: 0.3 },
  { swipes: 8, dark: 2.4, braid: 0.25 },
  { swipes: 9, rides: 1, braid: 0.2 },
];
export const dailyBoard = (seed: number) => cached(`d${seed}`, () => generate({ ...DAILY[dailyWorld(seed)], size: DAILY_SIZE, world: dailyWorld(seed), seed }));

/** What a run plays: a level, today's maze, or (for a link from before `v=2`) the old plain maze. */
export type Where = { level: number; seed: number; old: boolean };
export function boardOf({ level: value, seed, old }: Where) {
  if (!old) return value ? levelBoard(value) : dailyBoard(seed);
  return cached(`o${value}-${seed}`, () => {
    const board = boardFromMaze(value ? oldLevelMaze(value) : oldDailyMaze(seed), value ? [0, 2, 2][oldWorldOf(value)] : [0, 1, 2][oldDailyWorld(seed)]);
    return { board, graph: buildGraph(board) };
  });
}
export const worldOfRun = (where: Where) => boardOf(where).board.world;
/** The lantern for this run: the level's own, or the hard mode's on a lit level. */
export const darkFor = (board: Board, mode: Mode) => board.dark || (mode === "h" ? HARD_DARK : 0);

/* ---------- par and stars ---------- */

/** Cells a second; ধীরে খেলো halves it. The speed is fixed when a run starts. */
export const SPEED = 14, SLOW_SPEED = 7;

/** Seconds a decision may take for three stars and for two, and the first look, lit and dark. */
const THREE = { think: 0.6, look: 1.5 }, TWO = { think: 1.6, look: 4 };
const DARK_THREE = { think: 1.1, look: 2 }, DARK_TWO = { think: 3.2, look: 7 };
/** Two stars also forgive some wandering: this share of the maze's cells walked again (more in the dark). */
const WANDER = 0.5, DARK_WANDER = 0.8;

export type Par = { three: number; two: number };
/** Star times in tenths, from the solver's best walk at this run's speed. Dark runs (a dark level, or কঠিন) allow more thinking. */
export function parOf(where: Where, mode: Mode, slow: boolean): Par {
  const { board, graph } = boardOf(where), speed = slow ? SLOW_SPEED : SPEED, dark = darkFor(board, mode) > 0;
  const three = dark ? DARK_THREE : THREE, two = dark ? DARK_TWO : TWO;
  const fast = bestWalk(graph, speed, three.think)!, easy = bestWalk(graph, speed, two.think)!;
  return {
    three: Math.ceil((fast.seconds + three.look) * 10),
    two: Math.ceil((easy.seconds + two.look + board.open.length * (dark ? DARK_WANDER : WANDER) / speed) * 10),
  };
}
export function starsOf(tenths: number, par: Par, mode: Mode) {
  return Math.min(MODE_INFO[mode].maxStars, starsFor(tenths, par.three, par.two, true));
}
/** Tenths to shave off for the next star, or 0 when there is none in this mode. */
export function toNextStar(tenths: number, par: Par, mode: Mode) {
  const earned = starsOf(tenths, par, mode);
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  return tenths - (earned === 2 ? par.three : par.two);
}
/** The quickest time anyone could post on this board: the shortest walk at full speed, no thinking, rides included. */
export function fastestTenths(where: Where, slow: boolean) {
  const { board, graph } = boardOf(where);
  return Math.floor(costToGo(graph, 1 / (slow ? SLOW_SPEED : SPEED), 0, RIDE)[board.start * 4] * 10);
}
/** The best walk's cells, turns, keys and rides at full speed, for the end screen's "shortest". */
export const bestOf = (where: Where) => bestWalk(boardOf(where).graph, SPEED, THREE.think)!;

/* ---------- progress on this phone ---------- */

/**
 * The highest level you may pick. Levels cleared from a friend's link beyond your own unlock sit in `ahead`: they keep
 * their stars but don't open the levels in between. Saved progress from before (no `ahead`) opens exactly what
 * `unlockedLevel` opened.
 */
export function openLevel(stars: LevelStars, ahead: readonly number[], count = LEVEL_COUNT) {
  const own: LevelStars = {};
  for (const key of Object.keys(stars)) if (!ahead.includes(Number(key))) own[Number(key)] = stars[Number(key)];
  let open = unlockedLevel(own, count);
  while (open < count && stars[open] && ahead.includes(open)) open++;
  return open;
}
/** After clearing `value`: is it beyond what you had opened? Returns the new `ahead` list. */
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
/** Where a returning player starts: the furthest open level not yet at three stars. */
export function openingLevel(stars: LevelStars, ahead: readonly number[] = []) {
  const top = openLevel(stars, ahead);
  for (let value = top; value >= 1; value--) if ((stars[value] ?? 0) < 3) return value;
  return top;
}
/** The next level to suggest in the list: the first open one without stars, else the furthest open. */
export function suggestedLevel(stars: LevelStars, open: number) {
  for (let value = 1; value <= open; value++) if (!stars[value]) return value;
  return open;
}
