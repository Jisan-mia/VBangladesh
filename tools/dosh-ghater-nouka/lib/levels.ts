// The levels of দশ ঘাটের নৌকা as data: three worlds (dawn, noon, dusk) and ten levels, each adding one thing.
// Ids 1–5 keep their old meaning (saved stars stay valid); 6–10 are new. ORDER is the play order shown as ১–১০.
import { starsFor } from "../../../shared/game-core";

export const WORDS = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ"];

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type WorldId = 0 | 1 | 2;
export type Dir = 1 | -1;
export type Level = {
  id: number; world: WorldId; title: string;
  /** Ghats on the river. Going up the boats sail from the jetty to ghat n; going back (dir -1) from ghat n to ghat 1. */
  n: number; dir: Dir;
  /** Does আব্বু's boat race beside you? */
  rival: boolean;
  /** The next ghat glows from the first spin. Without it a dashed ring comes after one wrong tap and the glow after two. */
  glow: boolean;
  /** step: tap each ghat the boat passes. predict: tap the ghat where it will stop, then watch it count there. */
  predict: boolean;
  /** Faces on the চরকি: 2 (১, ২) or 3 (১, ২, ৩). */
  faces: 2 | 3;
  /** Chance of each face. */
  odds: readonly number[];
  finale?: boolean;
  line: string; news: string; task: string;
};

export const WORLDS: readonly { id: WorldId; name: string }[] = [
  { id: 0, name: "ভোরের ঘাট" },
  { id: 1, name: "দুপুরের নদী" },
  { id: 2, name: "সন্ধ্যার ঘাট" },
];

const LEVELS: Record<number, Level> = {
  6: { id: 6, world: 0, title: "পাঁচ ঘাট", n: 5, dir: 1, rival: false, glow: true, predict: false, faces: 2, odds: [0.4, 0.6],
    line: "চরকি ঘোরাও, ঘাটে ঘাটে চাপো।", news: "এখন তুমি ১ থেকে ৫ গুনতে পারো।", task: "এবার ঘরের পাঁচটা জিনিস গুনে দেখো।" },
  1: { id: 1, world: 0, title: "আব্বুর নৌকা", n: 10, dir: 1, rival: true, glow: true, predict: false, faces: 2, odds: [0.5, 0.5],
    line: "আব্বুর নৌকাও সাথে চলে।", news: "এখন তুমি ১ থেকে ১০ গুনতে পারো।", task: "এবার সিঁড়িতে উঠতে উঠতে জোরে গুনে দেখো।" },
  2: { id: 2, world: 0, title: "নিজে গুনে", n: 10, dir: 1, rival: true, glow: false, predict: false, faces: 2, odds: [0.5, 0.5],
    line: "আলো থাকে না, নিজে গোনো।", news: "এখন তুমি আলো ছাড়াই ১০ পর্যন্ত গুনতে পারো।", task: "এবার আঙুলে গুনে আম্মুকে দেখাও।" },
  7: { id: 7, world: 0, title: "ভোরের বাইচ", n: 10, dir: 1, rival: true, glow: false, predict: false, faces: 3, odds: [1 / 3, 1 / 3, 1 / 3], finale: true,
    line: "চরকিতে তিন ফোঁটাও আসে।", news: "চরকিতে তিন ফোঁটা এলেও তুমি ঠিক গুনলে।", task: "আম্মুকে একটা সংখ্যা বলতে বলো। তুমি তার তিন ঘর পরেরটা বলো।" },
  3: { id: 3, world: 1, title: "আগে ভাবো", n: 10, dir: 1, rival: true, glow: false, predict: true, faces: 2, odds: [0.5, 0.5],
    line: "আগে ভাবো, কোন ঘাটে থামবে।", news: "এখন তুমি আগে ভেবে বলতে পারো, নৌকা কোথায় থামবে।", task: "এবার সিঁড়ির দুই ধাপ ওপরে কোন সংখ্যা, আগে ভেবে বলো।" },
  4: { id: 4, world: 1, title: "বিশ ঘাট", n: 20, dir: 1, rival: true, glow: false, predict: false, faces: 2, odds: [0.5, 0.5],
    line: "নদী এখন বিশ ঘাটের।", news: "এখন তুমি ১ থেকে ২০ গুনতে পারো।", task: "এবার বারান্দার টাইলস গুনে দেখো, কয়টা হলো।" },
  5: { id: 5, world: 1, title: "মেলার ঘাট", n: 20, dir: 1, rival: true, glow: false, predict: true, faces: 3, odds: [1 / 3, 1 / 3, 1 / 3], finale: true,
    line: "বিশ ঘাট, আগে ভেবে, তিন ফোঁটা।", news: "বিশ ঘাট তুমি আগে ভেবে গুনলে।", task: "আম্মুকে একটা সংখ্যা বলতে বলো। দুই ঘর পরেরটা আগে ভেবে বলো।" },
  8: { id: 8, world: 2, title: "ফিরতি পথ", n: 10, dir: -1, rival: true, glow: true, predict: false, faces: 2, odds: [0.5, 0.5],
    line: "দশ থেকে উল্টো গুনে ঘরে ফেরা।", news: "এখন তুমি ১০ থেকে ১ পর্যন্ত উল্টো গুনতে পারো।", task: "এবার সিঁড়ি দিয়ে নামতে নামতে উল্টো গুনে দেখো।" },
  9: { id: 9, world: 2, title: "বিশ থেকে ফেরা", n: 20, dir: -1, rival: true, glow: false, predict: false, faces: 2, odds: [0.5, 0.5],
    line: "বিশ থেকে উল্টো গুনে ফেরা।", news: "এখন তুমি ২০ থেকে ১ পর্যন্ত উল্টো গুনতে পারো।", task: "এবার ২০ থেকে উল্টো গুনে আম্মুকে শোনাও।" },
  10: { id: 10, world: 2, title: "সন্ধ্যার বাইচ", n: 20, dir: -1, rival: true, glow: false, predict: true, faces: 3, odds: [1 / 3, 1 / 3, 1 / 3], finale: true,
    line: "বিশ থেকে উল্টো, আগে ভেবে।", news: "বিশ থেকে উল্টো, আগে ভেবে। ঘাটে ঘাটে ঠিক।", task: "এবার ১০ থেকে উল্টো গুনে আব্বু-আম্মুকে শোনাও।" },
};

export const ORDER: readonly number[] = [6, 1, 2, 7, 3, 4, 5, 8, 9, 10];
export const LEVEL_COUNT = ORDER.length;
export const isLevel = (id: number) => Number.isInteger(id) && id in LEVELS;
export const levelOf = (id: number): Level => LEVELS[isLevel(id) ? id : 6];
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => LEVELS[id].world === world);
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
export const isWorldEnd = (id: number) => Boolean(levelOf(id).finale);
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(levelOf(id).id) + 1] ?? 0;
/** The first level in play order with no stars yet; the last level once every one has some. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[ORDER.length - 1];

/** The ghat number that a boat's progress `k` (0 = the jetty) stands on. Going back it counts down from n. */
export const ghatAt = (level: Level, k: number) => (level.dir > 0 ? k : level.n + 1 - k);
/** The progress that ghat number `ghat` stands for (the inverse of ghatAt). */
export const progressOf = (level: Level, ghat: number) => (level.dir > 0 ? ghat : level.n + 1 - ghat);

/** Stars are a record only: how cleanly the child counted, never who won. ধীরে খেলো does not change them. */
export const starsOf = (misses: number, n = 10) => (n > 10 ? starsFor(misses, 2, 7, true) : starsFor(misses, 1, 4, true));

export const ghatLabel = (ghat: number) => `${bn(ghat)} নম্বর ঘাট, ${WORDS[ghat]}`;
