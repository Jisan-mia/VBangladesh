// The course: three worlds, eleven levels, each with one new idea. Pure data, no React.
// Level ids 1–6 are the old levels (saved stars keep their meaning); 7–11 are new. The list shows play order, not ids.

export type Mode = "tour" | "sort" | "know" | "build" | "size" | "far" | "scale";
export type WorldId = 0 | 1 | 2;
export type Level = { id: number; world: WorldId; mode: Mode; count: 4 | 8; title: string; finale?: string };

export const WORLDS: readonly { id: WorldId; name: string; about: string }[] = [
  { id: 0, name: "সূর্যের পাড়া", about: "সূর্যের কাছের চার গ্রহ" },
  { id: 1, name: "দৈত্যদের পথ", about: "নেপচুন পর্যন্ত আট গ্রহ" },
  { id: 2, name: "কিনারার ওপারে", about: "সূর্য যদি একটা ফুটবল হয়" },
];

/** Indexed by id − 1. */
export const LEVELS: readonly Level[] = [
  { id: 1, world: 0, mode: "tour", count: 4, title: "সফর: সূর্য থেকে মঙ্গল" },
  { id: 2, world: 1, mode: "tour", count: 8, title: "সফর: সূর্য থেকে নেপচুন" },
  { id: 3, world: 0, mode: "sort", count: 4, title: "সাজাও: কাছের চার গ্রহ" },
  { id: 4, world: 1, mode: "sort", count: 8, title: "সাজাও: আট গ্রহ" },
  { id: 5, world: 2, mode: "size", count: 8, title: "ফুটবল সূর্য: কত বড়?" },
  { id: 6, world: 2, mode: "far", count: 8, title: "ফুটবল সূর্য: কত দূরে?" },
  { id: 7, world: 0, mode: "know", count: 4, title: "জানালা দিয়ে: কোন গ্রহ?" },
  { id: 8, world: 0, mode: "build", count: 4, title: "গ্রহ বসাও", finale: "সূর্যের পাড়া গড়ো" },
  { id: 9, world: 1, mode: "know", count: 8, title: "জানালা দিয়ে: আট গ্রহ" },
  { id: 10, world: 1, mode: "build", count: 8, title: "গ্রহ বসাও", finale: "আট গ্রহের মেলা" },
  { id: 11, world: 2, mode: "scale", count: 8, title: "বড় আর দূর", finale: "নেপচুনে পৌঁছাও" },
];
export const LEVEL_COUNT = LEVELS.length;
/** Play order, by id. */
export const ORDER: readonly number[] = [1, 3, 7, 8, 2, 4, 9, 10, 5, 6, 11];

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
export const planetCount = (id: number) => levelOf(id).count;
/** Does a mode stay on the orbit board (planets on their orbits, the rocket in the sky)? */
export const onBoard = (mode: Mode) => mode === "tour" || mode === "sort" || mode === "build";
/** Does an answer here show a reveal that waits for the ▶ button? The orbit board moves on at once. */
export const waitsForButton = (mode: Mode) => mode === "know" || mode === "size" || mode === "far" || mode === "scale";

/** ?print=… or anything: the cut-out sheet is one page, so only whether it is asked for matters. */
export const printAsked = (search: string) => new URLSearchParams(search).has("print");
