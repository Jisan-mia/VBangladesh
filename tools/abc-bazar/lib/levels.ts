// The levels as data: four worlds, nine levels, each teaching one new idea, each world ending in a named finale.
// Level ids 1–5 keep their old meaning (saved stars stay true); the four finales and the easy b/d level are new ids 6–9.
// ORDER is the play order the list shows (১–৯). Pure data, no React.
import { ALPHABET } from "./letters";

export type Mode = "picture" | "small" | "capital" | "first" | "mirror" | "same";
/** What one item asks. `picture`: see "M m", pick the mango. `small`: see "G", pick "g". `capital`: see "g", pick "G".
 *  `first`: see the picture and "_ango", pick the letter. `mirror`: b d p q, "which letter starts Boat?". `same`: find this exact b d p q. */
export type Kind = Mode;
export type Item = { kind: Kind; letter: string };

export type WorldId = 0 | 1 | 2 | 3;
export type World = { id: WorldId; name: string; place: string };

export const WORLDS: readonly World[] = [
  { id: 0, name: "ছবির বাজার", place: "ভোরের বাজার" },
  { id: 1, name: "বড় আর ছোট", place: "দুপুরের হাট" },
  { id: 2, name: "প্রথম অক্ষর", place: "বিকেলের দোকান" },
  { id: 3, name: "উল্টো অক্ষর", place: "আয়নার মেলা" },
];

/**
 * One level. `kinds` is the kinds its items cycle through (a finale mixes several); `length` is how many items; `base` is how
 * many tiles it starts with (2–4); `letters` is the set its items come from.
 */
export type Level = { id: number; world: WorldId; title: string; finale?: string; kinds: readonly Kind[]; letters: readonly string[]; length: number; base: number };

const NO_X = ALPHABET.filter(letter => letter !== "X");

const BY_ID: readonly Level[] = [
  { id: 1, world: 0, title: "A থেকে M", kinds: ["picture"], letters: ALPHABET.slice(0, 13), length: 6, base: 2 },
  { id: 2, world: 0, title: "N থেকে Z", kinds: ["picture"], letters: ALPHABET.slice(13), length: 6, base: 3 },
  { id: 3, world: 1, title: "বড় থেকে ছোট", kinds: ["small"], letters: ALPHABET, length: 6, base: 3 },
  { id: 4, world: 2, title: "প্রথম অক্ষর", kinds: ["first"], letters: NO_X, length: 6, base: 3 },
  { id: 5, world: 3, title: "b d p q", finale: "আয়নার মেলা", kinds: ["mirror", "same"], letters: ["B", "D", "P", "Q"], length: 6, base: 4 },
  { id: 6, world: 0, title: "পুরো বাজার", finale: "পুরো বাজার", kinds: ["picture"], letters: ALPHABET, length: 8, base: 4 },
  { id: 7, world: 1, title: "বড়-ছোটর হাট", finale: "বড়-ছোটর হাট", kinds: ["small", "capital"], letters: ALPHABET, length: 8, base: 4 },
  { id: 8, world: 2, title: "মিশেল বাজার", finale: "মিশেল বাজার", kinds: ["picture", "small", "capital", "first"], letters: NO_X, length: 8, base: 4 },
  { id: 9, world: 3, title: "b আর d", kinds: ["mirror", "same"], letters: ["B", "D"], length: 6, base: 2 },
];

export const LEVEL_COUNT = BY_ID.length;
/** The play order, as the list numbers it ১–৯. */
export const ORDER: readonly number[] = [1, 2, 6, 3, 7, 4, 8, 9, 5];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => BY_ID[(isLevel(id) ? id : 1) - 1];
/** 1-based place in the play order: the number the child sees. */
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[placeOf(id)] ?? 0;
/** The last level of a world is its finale. */
export const isWorldEnd = (id: number) => { const at = placeOf(id); return at === ORDER.length || levelOf(ORDER[at]).world !== levelOf(id).world; };
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);

/** The first level in play order with no stars yet; once every level has stars, the first one. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];

/** True for the levels that show b d p q drawings instead of letters from the alphabet. */
export const isMirrorLevel = (id: number) => levelOf(id).kinds.includes("mirror");
