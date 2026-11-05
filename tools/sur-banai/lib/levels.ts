// The sixteen levels in four worlds, as data. Ids 1–10 are the old copy-a-tune levels (their stars stay valid); 11–16 are new.
// Play order differs from id order, so the list numbers levels by place (১–১৬), not by id. Pure: no React, no browser.
import { parseTune, type Tune } from "./music";
import type { IconId } from "./art";

export type Kind = "copy" | "gap" | "make";
export type RuleId = "rising" | "hill" | "own";
export type WorldId = 0 | 1 | 2 | 3;

export type World = {
  id: WorldId;
  name: string;
  /** The one idea of the world, in a few words, for the level list. */
  idea: string;
  kind: Kind;
  /** Instrument index (see SOUNDS), or -1 when the child picks. */
  sound: number;
  /** Beat length in ms. */
  ms: number;
};

export const WORLDS: readonly World[] = [
  { id: 0, name: "বাঁশির বন", idea: "শুনে মেলাও", kind: "copy", sound: 0, ms: 520 },
  { id: 1, name: "ঢোলের মাঠ", idea: "একসাথে দুটো", kind: "copy", sound: 1, ms: 480 },
  { id: 2, name: "ঘণ্টার ঘর", idea: "ফাঁক ভরো", kind: "gap", sound: 2, ms: 450 },
  { id: 3, name: "গানের নৌকা", idea: "নিজে বানাও", kind: "make", sound: -1, ms: 450 },
];

export type Level = {
  id: number;
  world: WorldId;
  kind: Kind;
  title: string;
  icon: IconId;
  finale?: boolean;
  /** copy and gap: the tune to copy, "0 2 . 13" (one digit per note row). */
  tune?: string;
  /** gap: the beats that are left out. */
  gaps?: readonly number[];
  /** make: the rule the tune must follow. */
  rule?: RuleId;
};

/** In play order. */
export const LEVELS: readonly Level[] = [
  { id: 1, world: 0, kind: "copy", title: "ওপরে ওঠা", icon: "stairs", tune: "0 1 2 3 . ." },
  { id: 2, world: 0, kind: "copy", title: "নিচে নামা", icon: "down", tune: "4 3 2 1 . ." },
  { id: 4, world: 0, kind: "copy", title: "দুই দুই", icon: "twice", tune: "2 2 4 4 2 ." },
  { id: 3, world: 0, kind: "copy", title: "পাহাড়", icon: "hill", tune: "0 2 4 2 0 ." },
  { id: 6, world: 0, kind: "copy", title: "বনের গান", icon: "notes", finale: true, tune: "4 2 3 1 2 0" },
  { id: 7, world: 1, kind: "copy", title: "জোড়ায় জোড়ায়", icon: "pair", tune: "02 . 13 . 24 0" },
  { id: 8, world: 1, kind: "copy", title: "জোড়া আর একা", icon: "pair", tune: "4 3 24 1 02 ." },
  { id: 9, world: 1, kind: "copy", title: "দুই মুড়ো", icon: "ends", tune: "04 1 3 2 2 04" },
  { id: 10, world: 1, kind: "copy", title: "ঢেউ", icon: "wave", finale: true, tune: "0 13 2 4 13 0" },
  { id: 5, world: 2, kind: "gap", title: "একই তিন, দুবার", icon: "gap", tune: "0 1 2 0 1 2", gaps: [5] },
  { id: 11, world: 2, kind: "gap", title: "দুটো ফাঁক", icon: "gap", tune: "1 2 3 1 2 3", gaps: [4, 5] },
  { id: 12, world: 2, kind: "gap", title: "আয়নার সুর", icon: "mirror", tune: "0 1 2 3 2 1", gaps: [4] },
  { id: 13, world: 2, kind: "gap", title: "ফাঁকের গান", icon: "gap", finale: true, tune: "0 2 4 0 2 4", gaps: [2, 4] },
  { id: 14, world: 3, kind: "make", title: "সিঁড়ি বানাও", icon: "stairs", rule: "rising" },
  { id: 15, world: 3, kind: "make", title: "পাহাড় বানাও", icon: "hill", rule: "hill" },
  { id: 16, world: 3, kind: "make", title: "নিজের গান", icon: "notes", finale: true, rule: "own" },
];

export const LEVEL_COUNT = LEVELS.length;
export const ORDER: readonly number[] = LEVELS.map(level => level.id);
export const isLevel = (id: number) => LEVELS.some(level => level.id === id);
export const levelOf = (id: number): Level => LEVELS.find(level => level.id === id) ?? LEVELS[0];
export const worldOf = (id: number): World => WORLDS[levelOf(id).world];
/** 1-based place in play order: what the card says. */
export const placeOf = (id: number) => Math.max(0, ORDER.indexOf(id)) + 1;
export const levelsOfWorld = (world: WorldId) => LEVELS.filter(level => level.world === world).map(level => level.id);
export const isWorldEnd = (id: number) => !!levelOf(id).finale;

/** The first level in play order that has no stars yet (the one to play next); the last when all are done. */
export function nextToPlay(stars: Record<number, number>) {
  return ORDER.find(id => !stars[id]) ?? ORDER[ORDER.length - 1];
}
/** The level after `id` in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(id) + 1] ?? 0;

/** The tune to copy (a copy or gap level), or null for a make level. */
export const targetOf = (id: number): Tune | null => { const tune = levelOf(id).tune; return tune ? parseTune(tune) : null; };
/** What is already on the grid: nothing for a copy or make level; for a gap level, the tune with the gap beats left empty. */
export function givenOf(id: number): Tune | null {
  const level = levelOf(id), target = targetOf(id);
  if (!target) return null;
  if (level.kind !== "gap") return target.map(() => 0);
  return target.map((mask, step) => (level.gaps?.includes(step) ? 0 : mask));
}
