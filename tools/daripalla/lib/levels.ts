// The levels of দাঁড়িপাল্লা as data: three shop worlds and eleven levels, each adding one thing, the last of every world a named finale.
// Ids 1–7 keep their old meaning (saved stars stay valid); 8–11 are new. ORDER is the play order shown as ১–১১.
import { starsFor } from "../../../shared/game-core";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type Kind = "fill" | "find" | "guess";
export type WorldId = 0 | 1 | 2;
export type Level = {
  id: number; world: WorldId; title: string; kind: Kind;
  /** Pans in one round. */
  puzzles: number;
  finale?: boolean;
  /** What the child can do now, said on the end page. */
  news: string;
  /** One thing to do off the screen. */
  task: string;
};

export const WORLDS: readonly { id: WorldId; name: string }[] = [
  { id: 0, name: "মুদির দোকান" },
  { id: 1, name: "ফলের বাজার" },
  { id: 2, name: "ঠোঙার হাট" },
];

const LEVELS: Record<number, Level> = {
  1: { id: 1, world: 0, title: "১০-এর মধ্যে", kind: "fill", puzzles: 5,
    news: "১০-এর মধ্যে তুমি পাল্লা সমান করতে পারো।", task: "আম্মুকে একটা সংখ্যা বলতে বলো। ১০ হতে আর কত লাগে, আগে ভেবে বলো।" },
  2: { id: 2, world: 0, title: "২০-এর মধ্যে", kind: "fill", puzzles: 5,
    news: "২০-এর মধ্যেও তুমি পাল্লা সমান করলে।", task: "হাতে ১২টা জিনিস নাও। ২০ হতে আর কয়টা লাগে, বলো।" },
  3: { id: 3, world: 0, title: "ফল দিয়ে মেলাও", kind: "fill", puzzles: 5,
    news: "এখন ফল দিয়েও পাল্লা সমান করতে পারো।", task: "রান্নাঘরে একটা আম আর দুটো লিচু পাশাপাশি রাখো। কোনটা ভারী, হাতে ধরে বলো।" },
  8: { id: 8, world: 0, title: "মুদির বড় অর্ডার", kind: "fill", puzzles: 5, finale: true,
    news: "বাম পাল্লায় দুটো বাটখারা থাকলেও তুমি ঠিক মেলালে।", task: "আম্মুকে বলো: ৮ আর ৫ মিলে কত, আর ১৩ থেকে ৮ গেলে কত?" },
  4: { id: 4, world: 1, title: "কলাটার ওজন কত?", kind: "find", puzzles: 5,
    news: "অজানা ফলের ওজন তুমি পাল্লা দিয়ে বের করতে পারো।", task: "বাজারে গেলে দোকানির পাল্লায় কী কী ওঠে, একসাথে দেখো।" },
  5: { id: 5, world: 1, title: "ফল আর বাটখারা", kind: "find", puzzles: 5,
    news: "ফল আর বাটখারা একসাথে থাকলেও ফলের ওজন বের করলে।", task: "আম্মুকে বলো: ৫ = ? + ২ হলে ? কত?" },
  6: { id: 6, world: 1, title: "দুটো একই ফল", kind: "find", puzzles: 5,
    news: "দুটো একই ফল থাকলে একটার ওজন অর্ধেক। সেটা তুমি বের করলে।", task: "৮টা লিচু দুজনে সমান ভাগ করলে কয়টা করে, বলো।" },
  9: { id: 9, world: 1, title: "ফলওয়ালার ঝুড়ি", kind: "find", puzzles: 5, finale: true,
    news: "দুটো ফল আর একটা বাটখারা, তবু ফলের ওজন ঠিক বের করলে।", task: "৭ থেকে ৩ বাদ দাও। বাকিটা দুই ভাগ করলে একভাগ কত, বলো।" },
  10: { id: 10, world: 2, title: "একটা ★", kind: "guess", puzzles: 5,
    news: "★ মানে একটা না-জানা সংখ্যা। সেটা তুমি বের করলে।", task: "আম্মুকে বলো: ★ + ৩ = ৮ হলে ★ কত?" },
  7: { id: 7, world: 2, title: "ছবির অঙ্ক", kind: "guess", puzzles: 5,
    news: "দুটো ★ থাকলেও ঠিক সংখ্যা বসালে।", task: "★ + ★ = ১০ হলে ★ কত, আম্মুকে বলো।" },
  11: { id: 11, world: 2, title: "তিন ঠোঙার হিসাব", kind: "guess", puzzles: 5, finale: true,
    news: "তিনটা ★ থাকলেও তুমি পাল্লা সমান করলে।", task: "★ + ★ + ★ = ১২ হলে ★ কত, বলো।" },
};

export const ORDER: readonly number[] = [1, 2, 3, 8, 4, 5, 6, 9, 10, 7, 11];
export const LEVEL_COUNT = Math.max(...ORDER);
export const isLevel = (id: number) => Number.isInteger(id) && id in LEVELS;
export const levelOf = (id: number): Level => LEVELS[isLevel(id) ? id : 1];
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => LEVELS[id].world === world);
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(levelOf(id).id) + 1] ?? 0;
/** The first level in play order with no stars yet; the last level once every one has some. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[ORDER.length - 1];

/** Stars only record the round: no miss or one → 3, up to three → 2, else 1. ধীরে খেলো does not change them. */
export const starsOf = (misses: number) => starsFor(misses, 1, 3, true);
