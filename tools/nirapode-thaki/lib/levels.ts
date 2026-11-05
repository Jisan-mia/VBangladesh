// The levels as data: three worlds, nine levels. Ids 1–6 are the six scenes in their old order (so saved stars and
// `#s=<scene>` links keep their meaning); the three finales are ids 7–9. ORDER is the play order the list shows (১–৯).
// Each scene's five questions come from sets.ts; a finale borrows three from each scene of its world and alternates.
import { SETS, type Question, type SafetySet, type SetId } from "./sets";

export type WorldId = 0 | 1 | 2;
export type World = { id: WorldId; name: string; place: string };

export const WORLDS: readonly World[] = [
  { id: 0, name: "পথে", place: "রাস্তা আর মেলা" },
  { id: 1, name: "ঘরে আর ছাদে", place: "রান্নাঘর আর ছাদ" },
  { id: 2, name: "পানি আর আকাশ", place: "পুকুরঘাট আর ঝড়ের মাঠ" },
];

/** One question of a level: the scene it happens in, and the question itself. */
export type Item = { set: SetId; scene: string; question: Question };
type Pick = readonly [SetId, string];

/**
 * `base` is how many pictures a question shows before the pace moves it. `opening` overrides it for the very first
 * question of the level, so a child's first tap on level ১ is a choice of two.
 */
export type Level = { id: number; world: WorldId; title: string; finale?: string; icons: readonly string[]; base: number; opening?: number; sets: readonly SetId[]; picks?: readonly Pick[] };

const BY_ID: readonly Level[] = [
  { id: 1, world: 0, title: "রাস্তা পার", icons: ["zebra"], base: 3, opening: 2, sets: ["rasta"] },
  { id: 2, world: 2, title: "পুকুরঘাট", icons: ["steps-down"], base: 3, sets: ["pukur"] },
  { id: 3, world: 1, title: "চুলা আর গরম জিনিস", icons: ["kettle"], base: 3, sets: ["chula"] },
  { id: 4, world: 1, title: "ঘুড়ি আর তার", icons: ["kite"], base: 3, sets: ["ghuri"] },
  { id: 5, world: 0, title: "মেলায় হারিয়ে গেলে", icons: ["balloon"], base: 3, sets: ["mela"] },
  { id: 6, world: 2, title: "ঝড়-বজ্রপাত", icons: ["house"], base: 3, sets: ["jhor"] },
  { id: 7, world: 0, title: "মেলার পথে", finale: "মেলার পথে", icons: ["zebra", "balloon"], base: 3, sets: ["rasta", "mela"],
    picks: [["rasta", "where"], ["mela", "crowd"], ["rasta", "ball"], ["mela", "lost"], ["rasta", "rickshaw"], ["mela", "ask"]] },
  { id: 8, world: 1, title: "ছুটির দুপুর", finale: "ছুটির দুপুর", icons: ["kettle", "kite"], base: 3, sets: ["chula", "ghuri"],
    picks: [["chula", "touch"], ["ghuri", "where"], ["chula", "cool"], ["ghuri", "stuck"], ["chula", "matches"], ["ghuri", "loose"]] },
  { id: 9, world: 2, title: "বর্ষার বিকেল", finale: "বর্ষার বিকেল", icons: ["steps-down", "house"], base: 3, sets: ["pukur", "jhor"],
    picks: [["pukur", "ball"], ["jhor", "field"], ["pukur", "shout"], ["jhor", "pond"], ["pukur", "reach"], ["jhor", "no-house"]] },
];

/** Every level id, 1–9. Stars are saved by id. */
export const LEVEL_COUNT = BY_ID.length;
/** The play order, as the list numbers it ১–৯. */
export const ORDER: readonly number[] = [1, 5, 7, 3, 4, 8, 2, 6, 9];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => BY_ID[(isLevel(id) ? id : 1) - 1];
const setById = (id: SetId): SafetySet => SETS.find(item => item.id === id) ?? SETS[0];
/** The scenes a level uses, in order. */
export const setsOf = (id: number): SafetySet[] => levelOf(id).sets.map(setById);

/** The questions of a level, in play order. A scene's own order is the order the child meets its rules. */
export function itemsOf(id: number): Item[] {
  const level = levelOf(id);
  if (!level.picks) { const set = setById(level.sets[0]); return set.questions.map(question => ({ set: set.id, scene: set.scene, question })); }
  return level.picks.map(([setId, questionId]) => {
    const set = setById(setId), question = set.questions.find(item => item.id === questionId);
    if (!question) throw new Error(`no question ${setId}/${questionId}`);
    return { set: set.id, scene: set.scene, question };
  });
}

/** 1-based place in the play order: the number the child sees. */
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[placeOf(id)] ?? 0;
/** The last level of a world is its finale. */
export const isWorldEnd = (id: number) => !!levelOf(id).finale;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);

/** The first level in play order with no stars yet; once every level has stars, the first one. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];

/** Old links: `#s=rasta` opened that scene. They still do, as the level to show first. Anything else is null. */
export function levelFromHash(hash: string) {
  const id = /^#s=([a-z]+)$/.exec(hash)?.[1];
  const at = SETS.findIndex(item => item.id === id);
  return at < 0 ? null : at + 1;
}
