// The levels as data: four worlds (one set of picture words each), three levels per world: ভাঙি, জুড়ি, then a named finale
// that mixes both. Level ids 1–8 keep their old meaning (saved stars under ektukhani-levels-juktoborno stay valid); the four
// finales are the new ids 9–12. ORDER is the play order the list shows (১–১২).
import { SETS, conjunct, type Mode, type SetId, type Word } from "./words";

export type WorldId = 0 | 1 | 2 | 3;
export type World = { id: WorldId; set: SetId; name: string; place: string; skill: string; task: string };

export const WORLDS: readonly World[] = [
  { id: 0, set: "double", name: "জোড়া বর্ণ", place: "সকালের কারখানা", skill: "একই বর্ণের জোড়া", task: "এবার একটা বই খুলে এমন শব্দ খোঁজো, যাতে একই বর্ণ দুবার জোড়া লেগেছে।" },
  { id: 1, set: "common", name: "চেনা যুক্তবর্ণ", place: "পাড়ার পথ", skill: "চেনা যুক্তবর্ণ", task: "এবার সাইনবোর্ড বা বইয়ে একটা যুক্তবর্ণ খুঁজে ভেঙে বলো।" },
  { id: 2, set: "tricky", name: "কঠিন যুক্তবর্ণ", place: "বিজ্ঞানঘর", skill: "ক্ষ, জ্ঞ-র মতো কঠিন যুক্তবর্ণ", task: "এবার বইয়ে ক্ষ বা জ্ঞ আছে এমন একটা শব্দ খোঁজো।" },
  { id: 3, set: "phala", name: "ফলা আর রেফ", place: "সন্ধ্যার মেলা", skill: "রেফ আর ফলা", task: "এবার র-ফলা বা য-ফলা আছে এমন একটা শব্দ খোঁজো।" },
];

/** One level. `mode` is "mixed" for a finale (ভাঙি and জুড়ি take turns). A normal level plays six words, a finale all of its world's. */
export type Level = { id: number; world: WorldId; mode: Mode | "mixed"; title: string; finale: boolean; size: number; words: readonly Word[] };

const MODE_TITLE: Record<Mode, string> = { bhangi: "ভাঙি", juri: "জুড়ি" };
export const ROUND_SIZE = 6;

const BY_ID: readonly Level[] = [
  // 1–8: the old levels, ভাঙি then জুড়ি per set
  ...WORLDS.flatMap(world => (["bhangi", "juri"] as const).map((mode, at): Level => ({
    id: world.id * 2 + at + 1, world: world.id, mode, title: `${world.name} ${MODE_TITLE[mode]}`, finale: false, size: ROUND_SIZE, words: SETS[world.set].words,
  }))),
  // 9–12: a finale per world
  ...WORLDS.map((world): Level => ({
    id: 9 + world.id, world: world.id, mode: "mixed", title: `${world.name}: সব মিলিয়ে`, finale: true, size: SETS[world.set].words.length, words: SETS[world.set].words,
  })),
];

export const LEVEL_COUNT = BY_ID.length;
/** The play order, as the list numbers it ১–১২. */
export const ORDER: readonly number[] = [1, 2, 9, 3, 4, 10, 5, 6, 11, 7, 8, 12];
/** The last level in play order: the grand finale. */
export const GRAND_FINALE = 12;

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => BY_ID[(isLevel(id) ? id : 1) - 1];
/** 1-based place in the play order: the number the child sees. */
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[placeOf(id)] ?? 0;
/** The last level of a world is its finale. */
export const isWorldEnd = (id: number) => levelOf(id).finale;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);

/** The first level in play order with no stars yet; once every level has stars, the first one. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];

/** What a level is about, as written on its card: the first one or two যুক্তবর্ণ of its words (ল্ল, ষ্ট, ক্ষ, ট্র). */
export const emblemOf = (id: number): readonly string[] => {
  const level = levelOf(id), seen: string[] = [];
  for (const word of level.words) { const joint = conjunct(word.parts); if (!seen.includes(joint)) seen.push(joint); if (seen.length === 2) break; }
  return level.finale ? seen : seen.slice(0, 1);
};

/** Every যুক্তবর্ণ in the game, in order of first appearance: the pages of the খাতা. */
export const ALL_JOINTS: readonly string[] = [...new Set(WORLDS.flatMap(world => SETS[world.set].words.map(word => conjunct(word.parts))))];

/** `?print=4` → 4; a bare or odd `?print` gives the ten-word sheet "ভেঙে লেখো" (0). */
export function printLevel(value: string | null) {
  const level = Number(value);
  return value !== null && value !== "" && isLevel(level) ? level : 0;
}
