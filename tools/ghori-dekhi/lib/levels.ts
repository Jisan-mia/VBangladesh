// The eleven levels in four worlds, as data. Ids 1–5 keep their old meaning (saved stars on this phone); 6–11 are new.
// Each level teaches one new thing; a world ends in a named finale. Pure, no React.
import type { Time } from "./time";

export type WorldId = 0 | 1 | 2 | 3;
export type World = { id: WorldId; name: string };
export const WORLDS: readonly World[] = [
  { id: 0, name: "ঘণ্টা" }, { id: 1, name: "সাড়ে" }, { id: 2, name: "সোয়া আর পৌনে" }, { id: 3, name: "মিনিট" },
];

export type Aid = "always" | "slip";
export type Level = {
  id: number; world: WorldId; title: string;
  /** A named finale ends its world. */
  finale?: string;
  /** The minutes a round's times are drawn from; repeats weight them. The level's own words are its distinct values. */
  ask: readonly number[];
  /** Minute-hand clicks: 15 for quarters, 5 for the minutes between. */
  step: 5 | 15;
  /** Level ১: the long hand rests at 12 and can't be moved, so a 5-year-old turns one hand. */
  lockMinute: boolean;
  /** The first finale starts with the long hand away from 12; it has to come home. */
  startAway: boolean;
  /** Items in a round. */
  items: 6 | 8;
  /** The words carry সকাল/দুপুর/…, and the sky is part of the question. */
  part: boolean;
  /** The pie from 12 to the long hand, with its minutes. */
  pie: boolean;
  /** When the small picture clock shows for a "set" item and for the cards of a "read" item. */
  targetClock: Aid; pickClock: Aid;
  /** দেড়টা and আড়াইটা: the afternoon slots are fixed at 1:30 and 2:30. */
  halves: boolean;
  /** A typical time, drawn on the level's card. */
  example: Time;
  /** What the child can do now, and a task off the screen. */
  news: string; off: string;
};

const FIVES = Array.from({ length: 12 }, (_, i) => i * 5);
const base = { startAway: false, lockMinute: false, step: 15 as const, items: 6 as const, part: false, pie: true, targetClock: "always" as Aid, pickClock: "always" as Aid, halves: false };

export const LEVELS: readonly Level[] = [
  { ...base, id: 1, world: 0, title: "ঠিক ঘণ্টা", ask: [0], lockMinute: true, pie: false, example: { h: 7, m: 0 },
    news: "এখন তুমি ঠিক ঘণ্টা বলতে পারো।", off: "এবার ঘরের ঘড়িতে ছোট কাঁটা কোথায়, দেখো তো।" },
  { ...base, id: 6, world: 0, title: "স্কুলের ঘণ্টা", finale: "স্কুলের ঘণ্টা", ask: [0], items: 8, pie: false, startAway: true, example: { h: 9, m: 0 },
    news: "ঠিক ঘণ্টায় বড় কাঁটা সবসময় ১২-তে।", off: "এবার আম্মুকে জিজ্ঞেস করো, স্কুলের ঘণ্টা কয়টায় বাজে।" },
  { ...base, id: 2, world: 1, title: "সাড়ে", ask: [30, 30, 30, 0], example: { h: 8, m: 30 },
    news: "এখন তুমি সাড়ে বলতে পারো: বড় কাঁটা ৬-এ।", off: "এবার ঘরের ঘড়িতে সাড়ে কয়টা বাজে, খুঁজে দেখো।" },
  { ...base, id: 7, world: 1, title: "দেড়টা, আড়াইটা", ask: [30], halves: true, example: { h: 13, m: 30 },
    news: "এখন তুমি দেড়টা আর আড়াইটা চেনো।", off: "এবার আব্বুকে জিজ্ঞেস করো, দেড়টায় কী হয়।" },
  { ...base, id: 8, world: 1, title: "দুপুরের ছুটি", finale: "দুপুরের ছুটি", ask: [0, 30], items: 8, example: { h: 12, m: 30 },
    news: "ঠিক ঘণ্টা আর সাড়ে, দুটোই তোমার চেনা।", off: "এবার খাওয়ার সময় বলো, কয়টা বাজে।" },
  { ...base, id: 3, world: 2, title: "সোয়া", ask: [15, 15, 15, 0, 30], example: { h: 4, m: 15 },
    news: "এখন তুমি সোয়া বলতে পারো: বড় কাঁটা ৩-এ।", off: "এবার ঘরের ঘড়িতে সোয়া কয়টা, খুঁজে দেখো।" },
  { ...base, id: 9, world: 2, title: "পৌনে", ask: [45, 45, 45, 0, 15], example: { h: 4, m: 45 },
    news: "এখন তুমি পৌনে বলতে পারো: বড় কাঁটা ৯-এ।", off: "এবার আম্মুকে বলো, পৌনে কয়টায় কী হয়।" },
  { ...base, id: 10, world: 2, title: "বিকেলের মাঠ", finale: "বিকেলের মাঠ", ask: [0, 15, 30, 45], items: 8, example: { h: 5, m: 45 },
    news: "ঘণ্টা, সোয়া, সাড়ে, পৌনে, সবই তোমার চেনা।", off: "এবার ঘরের ঘড়ি দেখে বলো, কয়টা বাজে।" },
  { ...base, id: 4, world: 3, title: "৫ মিনিট করে", ask: [5, 10, 20, 25, 35, 40, 50, 55], step: 5, example: { h: 4, m: 10 },
    news: "এখন তুমি ৫ করে গুনে মিনিট বলতে পারো।", off: "এবার ঘড়ির ১ থেকে ১২ পর্যন্ত ৫ করে গুনে দেখো।" },
  { ...base, id: 5, world: 3, title: "সকাল না সন্ধ্যা?", ask: FIVES, step: 5, part: true, pie: false, targetClock: "slip", pickClock: "slip", example: { h: 19, m: 20 },
    news: "এখন তুমি আকাশ দেখে সকাল আর সন্ধ্যা আলাদা করতে পারো।", off: "এবার জানালা দিয়ে আকাশ দেখে বলো, এখন কোন সময়।" },
  { ...base, id: 11, world: 3, title: "সারা দিনের ঘড়ি", finale: "সারা দিনের ঘড়ি", ask: FIVES, step: 5, items: 8, part: true, pie: false, targetClock: "slip", pickClock: "slip", example: { h: 16, m: 55 },
    news: "এখন তুমি পুরো দিনের যেকোনো সময় পড়তে পারো।", off: "এবার আজকের দিনের তিনটা সময় বলো।" },
];

/** The play order of the ids (the list shows it numbered ১–১১). */
export const ORDER: readonly number[] = [1, 6, 2, 7, 8, 3, 9, 10, 4, 5, 11];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (id: number) => Number.isInteger(id) && LEVELS.some(level => level.id === id);
export const levelOf = (id: number): Level => LEVELS.find(level => level.id === id) ?? LEVELS[0];
export const placeOf = (id: number) => ORDER.indexOf(id) + 1;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);
export const isWorldEnd = (id: number) => Boolean(levelOf(id).finale);
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(id) + 1] ?? 0;
/** The words a level uses: its distinct minutes. */
export const minutesOf = (level: Level) => [...new Set(level.ask)];

/** Where to open: the first level in play order without stars, else the first. Every level is open to a child. */
export const nextToPlay = (stars: Readonly<Record<number, number>>) => ORDER.find(id => !stars[id]) ?? ORDER[0];
