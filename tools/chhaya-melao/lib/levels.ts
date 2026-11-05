// The levels as data: four worlds, eleven levels, each teaching one new idea, each world ending in a named finale.
// Level ids 1–5 keep their old meaning (saved stars stay true): 1 two toys, 2 three, 3 four, 4 look-alikes, 5 turned.
// Ids 6–11 are new. ORDER is the play order the list shows (১–১১). Pure data, no React.
import type { Family } from "./shapes";

export type WorldId = 0 | 1 | 2 | 3;
export type World = { id: WorldId; name: string; place: string; idea: string };
/** Each world is one wall lit by the lamp: the wall colour and the shadow's own dark (the game's palette, one per world). */
export const WORLDS: readonly World[] = [
  { id: 0, name: "ঘরের বাতি", place: "সন্ধ্যার ঘর", idea: "একটা ছায়া, কোনটার ছায়া?" },
  { id: 1, name: "অনেক ছায়া", place: "জোছনার উঠোন", idea: "একসাথে অনেক ছায়া" },
  { id: 2, name: "একই রকম", place: "ইটের দেয়াল", idea: "দেখতে প্রায় এক রকম" },
  { id: 3, name: "ঘোরানো ছায়া", place: "রাতের ঘর", idea: "ছায়াটা কাত বা উল্টো" },
];
export const WALLS: readonly { wall: string; shadow: string }[] = [
  { wall: "#f1d9a8", shadow: "#4a3150" },
  { wall: "#bfe0da", shadow: "#1f4a50" },
  { wall: "#f0b79d", shadow: "#552b2b" },
  { wall: "#c9cff2", shadow: "#262853" },
];

/** How a shadow lies on the wall: a lean, a quarter or half turn, or a mirror flip. */
export type Turn = { deg: number; flip: boolean };
export type TurnKind = "none" | "lean" | "turns";

/**
 * One level. `shadows` is how many shadows the wall shows at once, `toys` how many toys the shelf starts with (the extra ones are
 * spares), `boards` how many walls make a round, `kin` puts every toy from one family, `families` limits which.
 * `sample` is the picture on the level card: the toys that show a tiny wall of this level.
 */
export type Level = {
  id: number; world: WorldId; title: string; finale?: string; age: string;
  shadows: number; toys: number; boards: number; kin: boolean; families?: readonly Family[]; turn: TurnKind; sample: readonly string[];
};

const BY_ID: readonly Level[] = [
  { id: 1, world: 0, title: "দুইটা ছবি", age: "৩+", shadows: 1, toys: 2, boards: 6, kin: false, turn: "none", sample: ["hati", "riksha"] },
  { id: 2, world: 0, title: "তিনটা ছবি", age: "৩+", shadows: 1, toys: 3, boards: 6, kin: false, turn: "none", sample: ["nouka", "chhata", "has"] },
  { id: 3, world: 0, title: "চারটা ছবি", finale: "বাতির ঘর", age: "৪+", shadows: 1, toys: 4, boards: 8, kin: false, turn: "none", sample: ["ghuri", "ketli", "ut", "shapla"] },
  { id: 4, world: 2, title: "একই দলের", age: "৫+", shadows: 1, toys: 3, boards: 6, kin: true, turn: "none", sample: ["hati", "ut", "chhagol"] },
  { id: 5, world: 3, title: "উল্টো-পাল্টা", age: "৬+", shadows: 1, toys: 3, boards: 6, kin: false, turn: "turns", sample: ["jirafa", "riksha", "has"] },
  { id: 6, world: 1, title: "দুই ছায়া", age: "৪+", shadows: 2, toys: 2, boards: 3, kin: false, turn: "none", sample: ["biral", "saikel"] },
  { id: 7, world: 1, title: "তিন ছায়া", age: "৪+", shadows: 3, toys: 3, boards: 2, kin: false, turn: "none", sample: ["hati", "nouka", "chhata"] },
  { id: 8, world: 1, title: "তিন ছায়া, চারটা ছবি", finale: "ছায়ার মেলা", age: "৫+", shadows: 3, toys: 4, boards: 3, kin: false, turn: "none", sample: ["anaros", "rocket", "morog", "cup"] },
  { id: 9, world: 2, title: "পশুপাখি", finale: "চিড়িয়াখানা", age: "৫+", shadows: 2, toys: 3, boards: 4, kin: true, families: ["animal", "wing"], turn: "none", sample: ["khorgosh", "biral", "doyel"] },
  { id: 10, world: 3, title: "একটু কাত", age: "৫+", shadows: 1, toys: 3, boards: 6, kin: false, turn: "lean", sample: ["hati", "choshma", "talgach"] },
  { id: 11, world: 3, title: "দুই ঘোরানো ছায়া", finale: "ঘুরন্ত বাতি", age: "৬+", shadows: 2, toys: 3, boards: 4, kin: false, turn: "turns", sample: ["urojahaj", "penguin", "chabi"] },
];

export const LEVEL_COUNT = BY_ID.length;
/** The play order, as the list numbers it ১–১১. */
export const ORDER: readonly number[] = [1, 2, 3, 6, 7, 8, 4, 9, 10, 5, 11];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => BY_ID[(isLevel(id) ? id : 1) - 1];
/** 1-based place in the play order: the number the child sees. */
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
/** How many shadows are matched in a round (the seats the HUD shows). */
export const matchesOf = (id: number) => { const level = levelOf(id); return level.shadows * level.boards; };
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[placeOf(id)] ?? 0;
/** The last level of a world is its finale. */
export const isWorldEnd = (id: number) => { const at = placeOf(id); return at === ORDER.length || levelOf(ORDER[at]).world !== levelOf(id).world; };
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);
/** The first level in play order with no stars yet; once every level has stars, the first one. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];
