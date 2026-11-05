// The garden's three seasons and their 24 levels, as data. Each level teaches one new thing (`teach`); the eighth of a
// season is its named finale. The plot seed and the look-ahead bot's par come from scripts/make-levels.ts (lib/level-seeds.ts).
import { SEEDS } from "./level-seeds";

export type Season = {
  name: string; short: string; finale: string;
  /** The season's three-note call on a level clear, in Hz. */
  call: readonly number[];
};
export const WORLDS: readonly Season[] = [
  { name: "ফাল্গুনের উঠোন", short: "উঠোন", finale: "শিলাবৃষ্টি", call: [523, 659, 784] },
  { name: "বৈশাখের পুকুরপাড়", short: "পুকুরপাড়", finale: "কালবৈশাখী", call: [494, 587, 740] },
  { name: "জ্যৈষ্ঠের আমবাগান", short: "আমবাগান", finale: "মধুমাস", call: [440, 554, 659] },
];
export const PER_WORLD = 8;

/**
 * One level. `target` is the stage to grow (`count` of them); events are every `rain`/`hail`/`gust`/`crow` moves (0: never);
 * `weeds` is the share of drops that are আগাছা; `undo` is false only on the first three, before ফেরত নাও is taught.
 */
export type LevelDef = {
  name: string; teach: string; size: number; stones: readonly number[]; target: number; count: number; tight: boolean;
  rain: number; hail: number; gust: number; crow: number; weeds: number; undo: boolean;
};
const def = (name: string, teach: string, size: number, stones: number[], target: number, more: Partial<LevelDef> = {}): LevelDef =>
  ({ name, teach, size, stones, target, count: 1, tight: false, rain: 0, hail: 0, gust: 0, crow: 0, weeds: 0, undo: true, ...more });

export const DEFS: readonly LevelDef[] = [
  // ১ ফাল্গুনের উঠোন: 4×4, one idea at a time
  def("প্রথম চারা", "আঙুল টানো। দুটো আঁটি ছুঁলেই চারা।", 4, [], 2, { undo: false }),
  def("চারা থেকে গাছ", "দুটো চারা মিলে গাছ। মাঝে মাঝে চারাও পড়ে।", 4, [], 3, { undo: false }),
  def("মুকুল", "এক টানে দুই জোড়া মেলালে বাড়তি পয়েন্ট।", 4, [], 4, { undo: false }),
  def("গুটি আম", "ভুল টান? ফেরত নাও, দুবার পারবে।", 4, [], 5),
  def("বৃষ্টি", "প্রতি ৮ চালে বৃষ্টি: সব আঁটি চারা হয়ে যায়।", 4, [], 5, { rain: 8 }),
  def("কাঁচা আম", "লক্ষ্য বড়: কাঁচা আম।", 4, [], 6, { rain: 8 }),
  def("চাল কম", "চাল কম। শেষ ৫ চালে কিনারা জ্বলে ওঠে।", 4, [], 6, { rain: 10, tight: true }),
  def("শিলাবৃষ্টি", "শিল পড়ার আগে ঘরে লাল দাগ পড়ে। সেখানে যা থাকে, এক ধাপ ছোট হয়।", 4, [], 7, { rain: 10, hail: 6 }),
  // ২ বৈশাখের পুকুরপাড়: stones, weeds, gusts
  def("পাথর", "পাথর নড়ে না। কিছু তার ওপর দিয়ে যায় না।", 4, [6], 5),
  def("দুই পাথর", "এবার দুটো পাথর।", 4, [5, 10], 6),
  def("আগাছা", "আগাছাও পড়ে। দুটো আগাছা ছুঁলে দুটোই উঠে যায়।", 4, [], 6, { weeds: 0.1 }),
  def("পাথর আর আগাছা", "পাথর আর আগাছা একসাথে।", 4, [12], 7, { weeds: 0.1 }),
  def("দমকা হাওয়া", "প্রতি ৮ চালে হাওয়া সব একদিকে ঠেলে দেয়। দুই চাল আগে কিনারায় তীর দেখাবে।", 4, [], 7, { gust: 8 }),
  def("চাল কম", "চাল কম, সাথে পাথর আর হাওয়া।", 4, [5], 7, { gust: 9, tight: true }),
  def("আমের ঝুড়ি", "লক্ষ্য বড়: এক ঝুড়ি আম।", 4, [3], 8),
  def("কালবৈশাখী", "হাওয়া এখন প্রতি ৫ চালে। পাথর আর আগাছাও আছে।", 4, [0, 15], 8, { weeds: 0.08, gust: 5 }),
  // ৩ জ্যৈষ্ঠের আমবাগান: the bigger 5×5 plot, crows, counts, everything at once
  def("বড় বাগান", "বাগান এবার বড়, ৫×৫।", 5, [12], 7),
  def("কাক", "কাক নামার আগে খালি ঘরে ছায়া পড়ে। ঘরটা ভরে দিলে কাক নামতে পারে না।", 5, [6, 18], 7, { crow: 9 }),
  def("দুটো পাকা আম", "একটা না, এবার দুটো পাকা আম বানাও।", 5, [2, 10, 14, 22], 7, { count: 2 }),
  def("আমের ঝুড়ি", "কাকের মাঝে এক ঝুড়ি আম।", 5, [12], 8, { crow: 9 }),
  def("শিল আর কাক", "শিল আর কাক একসাথে।", 5, [0, 4, 20, 24], 8, { hail: 10, crow: 11 }),
  def("চাল কম", "চাল কম, কাকও আছে।", 5, [12], 8, { crow: 10, tight: true }),
  def("আমের বাগান", "শেষ ধাপ: পুরো একটা আমের বাগান।", 5, [12], 9, { rain: 12 }),
  def("মধুমাস", "হাওয়া, শিল আর কাক একসাথে। আঁটি থেকে পুরো বাগান।", 5, [6, 18], 9, { gust: 9, hail: 11, crow: 13 }),
];

export type Level = LevelDef & { seed: number; bot: number };
export const LEVELS: readonly Level[] = DEFS.map((level, index) => ({ ...level, seed: SEEDS[index]?.[0] ?? (index + 1) * 1000 + 1, bot: SEEDS[index]?.[1] ?? 999 }));
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelAt = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];
export const worldOf = (level: number) => Math.floor((Math.max(1, Math.min(LEVEL_COUNT, level)) - 1) / PER_WORLD);
export const isFinale = (level: number) => isLevel(level) && level % PER_WORLD === 0;
export const finaleName = (level: number) => isFinale(level) ? WORLDS[worldOf(level)].finale : "";
export const worldStart = (world: number) => world * PER_WORLD + 1;

// ---- modes: the plot and its events stay; the take-backs and the move limit change ----
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const isMode = (value: unknown): value is Mode => value === "e" || value === "n" || value === "h";
export const MODE_INFO: Record<Mode, { name: string; line: string; maxStars: number }> = {
  e: { name: "সহজ", line: "ফেরত ৫ বার, চাল দেড় গুণ। তারা বড়জোর ২টা।", maxStars: 2 },
  n: { name: "স্বাভাবিক", line: "ফেরত ২ বার। আসল খেলা।", maxStars: 3 },
  h: { name: "কঠিন", line: "ফেরত নেই, চাল কম। খোলা বাগানে আগাছাও পড়ে।", maxStars: 3 },
};

/** The endless garden. */
export const GARDEN = { name: "খোলা বাগান", teach: "যতদূর পারো। মুকুল থেকে প্রতিটা নতুন ধাপে মালির থলে খোলে।" };
