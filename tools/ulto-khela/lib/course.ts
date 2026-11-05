// The course: three worlds, eleven levels, each with one new thing. Pure data, no React.
// Level ids 1–6 are the old levels (saved stars keep their meaning); 7–11 are new. The list shows play order, not ids.
import type { Rule } from "./pairs";

export type Kind = "pair" | "sort";
export type WorldId = 0 | 1 | 2;
/** `run` is how many pictures pass between bells (null: the rule never changes); `once` stops after the first bell. */
export type Level = {
  id: number; world: WorldId; kind: Kind; title: string; finale?: string;
  items: number; pairs: number; first: Rule; run: readonly [number, number] | null; once?: boolean;
  /** The one new thing, in the child's words ("এখন তুমি … পারো"). */
  learned: string;
};

export const WORLDS: readonly { id: WorldId; name: string; about: string }[] = [
  { id: 0, name: "উল্টো পাড়া", about: "ছবির উল্টোটায় চাপো" },
  { id: 1, name: "ঘণ্টার গ্রাম", about: "ঘণ্টা বাজলে নিয়ম বদলায়" },
  { id: 2, name: "রং আর আকার", about: "ঝুড়িতে কার্ড সাজাও" },
];

/** Indexed by id − 1. */
export const LEVELS: readonly Level[] = [
  { id: 1, world: 0, kind: "pair", title: "সূর্য এলে চাঁদ", items: 8, pairs: 2, first: "ulto", run: null, learned: "সূর্যের উল্টো চাঁদ আর দিনের উল্টো রাত চিনতে" },
  { id: 2, world: 0, kind: "pair", title: "সব উল্টো", items: 10, pairs: 7, first: "ulto", run: null, learned: "সাত জোড়া ছবির উল্টোটা চিনতে" },
  { id: 3, world: 1, kind: "pair", title: "ঘণ্টা বাজলে একই", items: 10, pairs: 3, first: "ulto", run: [4, 5], learned: "ঘণ্টা শুনে নিয়ম বদলে নিতে" },
  { id: 4, world: 1, kind: "pair", title: "ঘণ্টা বারবার", items: 12, pairs: 5, first: "ulto", run: [2, 4], learned: "ঘণ্টা বারবার বাজলেও নিয়ম ধরে রাখতে" },
  { id: 5, world: 2, kind: "sort", title: "রং, তারপর আকার", items: 10, pairs: 0, first: "color", run: [5, 5], once: true, learned: "রং ছেড়ে আকার দেখে মেলাতে" },
  { id: 6, world: 2, kind: "sort", title: "রং না আকার?", items: 12, pairs: 0, first: "color", run: [2, 4], learned: "রং আর আকার, দুটোর মধ্যে চট করে বদলাতে" },
  { id: 7, world: 0, kind: "pair", title: "বিড়াল আর ইঁদুর", items: 8, pairs: 4, first: "ulto", run: null, learned: "বড়-ছোট আর বিড়াল-ইঁদুরের জোড়া চিনতে" },
  { id: 8, world: 0, kind: "pair", title: "উল্টো মেলা", finale: "উল্টো মেলা", items: 12, pairs: 7, first: "ulto", run: null, learned: "মেলার সব জোড়া একটানা মেলাতে" },
  { id: 9, world: 1, kind: "pair", title: "ঘণ্টাঘর", finale: "ঘণ্টাঘর", items: 14, pairs: 7, first: "ulto", run: [2, 3], learned: "ঘণ্টাঘরের ঘনঘন ঘণ্টাতেও ঠিক থাকতে" },
  { id: 10, world: 1, kind: "pair", title: "ঘণ্টা একবার", items: 10, pairs: 3, first: "ulto", run: [4, 4], once: true, learned: "প্রথম ঘণ্টাটা চিনতে" },
  { id: 11, world: 2, kind: "sort", title: "ঝুড়ির মেলা", finale: "ঝুড়ির মেলা", items: 16, pairs: 0, first: "color", run: [2, 3], learned: "মেলার সব কার্ড রং আর আকারে সাজাতে" },
];
export const LEVEL_COUNT = LEVELS.length;
/** Play order, by id. */
export const ORDER: readonly number[] = [1, 7, 2, 8, 10, 3, 4, 9, 5, 6, 11];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => LEVELS[(isLevel(id) ? id : 1) - 1];
/** 1-based place in play order. */
export const placeOf = (id: number) => ORDER.indexOf(isLevel(id) ? id : 1) + 1;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);
/** The level after this one in play order (0 after the last). */
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(id) + 1] ?? 0;
/** The first level in play order without stars; the first level when everything has some. */
export const nextToPlay = (stars: Readonly<Record<number, number>>) => ORDER.find(id => !stars[id]) ?? ORDER[0];
/** A world's last level is its finale. */
export const isWorldEnd = (id: number) => levelsOfWorld(levelOf(id).world).at(-1) === id;
