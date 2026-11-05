// The levels of মনের রং as data: three worlds, nine levels. Each level adds one new idea (a new face, or a new kind of picture);
// the last in a world is its finale and mixes what the world taught, drawn from the world's pictures by seed. Ids are fixed (1–9).
import { ORDER, type Feeling } from "./faces";

export type WorldId = "rod" | "jhor" | "mela";

export type Level = {
  id: number; world: WorldId;
  name: string;
  /** One line for the parent: what this level adds. */
  line: string;
  /** The faces this level may offer. */
  pool: readonly Feeling[];
  /** The pictures it draws from (scene ids). A finale takes `take` of them. */
  scenes: readonly string[];
  take: number;
  /** Faces on offer per picture before the quiet ease (2–6). */
  base: number;
  /** The face the level introduces, for its picture in the list and the mirror prompt. */
  feeling: Feeling;
  finale?: boolean;
};

export type World = { id: WorldId; name: string; first: number; last: number; palette: { paper: string; edge: string; deep: string; glow: string }; root: number; prop: "ghuri" | "baj" | "nagordola" };

const THREE: readonly Feeling[] = ["khushi", "mon-kharap", "rag"];
const FIVE: readonly Feeling[] = ["khushi", "mon-kharap", "bhoy", "obak", "lojja"];
const S = (id: number, world: WorldId, name: string, line: string, pool: readonly Feeling[], scenes: readonly string[], base: number, feeling: Feeling, extra: Partial<Level> = {}): Level =>
  ({ id, world, name, line, pool, scenes, take: scenes.length, base, feeling, ...extra });

const SUN = ["eid", "brishti", "tiffin", "ghuri", "khata", "nanu"];
const STORM = ["andhar", "kukur", "bondhu", "cycle", "class", "chhora"];
const FAIR = ["baj", "eka", "carrom", "sangrai", "bon", "nagordola", "chacha", "cake"];

export const LEVELS: readonly Level[] = [
  S(1, "rod", "খুশি আর মন খারাপ", "দুটো মুখ। ছবি দেখে বেছে নাও কার কেমন লাগছে।", ["khushi", "mon-kharap"], ["eid", "brishti", "tiffin"], 2, "khushi"),
  S(2, "rod", "রাগ", "তিনটা মুখ। রাগও একটা স্বাভাবিক মন।", THREE, ["ghuri", "khata", "nanu"], 3, "rag"),
  S(3, "rod", "রোদ-বৃষ্টি", "এই পাতার ছবিগুলো মিশিয়ে, চারটা ছবি।", THREE, SUN, 3, "mon-kharap", { take: 4, finale: true }),
  S(4, "jhor", "ভয়", "চার নম্বর মুখ: ভয়।", ["khushi", "mon-kharap", "rag", "bhoy"], ["andhar", "kukur", "bondhu"], 4, "bhoy"),
  S(5, "jhor", "অবাক আর লজ্জা", "অবাক আর লজ্জা। কোনো ছবিতে দুটো মুখই মেলে।", ["khushi", "bhoy", "obak", "lojja"], ["cycle", "class", "chhora"], 4, "obak"),
  S(6, "jhor", "ঝড়ের রাত", "এই পাতার ছবিগুলো মিশিয়ে, চারটা ছবি।", FIVE, STORM, 4, "bhoy", { take: 4, finale: true }),
  S(7, "mela", "ছয়টা মুখ", "ছয়টা মুখ একসাথে। একটু বড়দের জন্য।", ORDER, ["baj", "eka", "carrom", "sangrai"], 6, "lojja"),
  S(8, "mela", "একসাথে দুটো মন", "মন একসাথে দুরকম হতে পারে। যেকোনো ঠিক মুখ চলে।", ORDER, ["bon", "nagordola", "chacha", "cake"], 4, "mon-kharap"),
  S(9, "mela", "মনের রংধনু", "সব মুখ, সব রং। পাঁচটা ছবি মিশিয়ে।", ORDER, FAIR, 6, "obak", { take: 5, finale: true }),
];

export const LEVEL_COUNT = LEVELS.length;

export const WORLDS: readonly World[] = [
  { id: "rod", name: "রোদের রং", first: 1, last: 3, palette: { paper: "#fff6e0", edge: "#ecd9a6", deep: "#8a5a00", glow: "#f2a900" }, root: 523, prop: "ghuri" },
  { id: "jhor", name: "ঝড়ের রং", first: 4, last: 6, palette: { paper: "#eef0fb", edge: "#c7cdee", deep: "#4a3f8f", glow: "#f2a900" }, root: 440, prop: "baj" },
  { id: "mela", name: "মেলার রং", first: 7, last: 9, palette: { paper: "#fff0f4", edge: "#f1c9d6", deep: "#9a2f5c", glow: "#f2a900" }, root: 587, prop: "nagordola" },
];

export const levelOf = (id: number): Level => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(id) || 1)) - 1];
export const worldOf = (id: WorldId): World => WORLDS.find(world => world.id === id) ?? WORLDS[0];
export const worldLevels = (id: WorldId) => LEVELS.filter(level => level.world === id);
/** The level's number inside its world. */
export const placeInWorld = (id: number) => id - worldOf(levelOf(id).world).first + 1;

/** The suggested level in a world: the first without stars, else the first below three, else its finale. */
export function recommended(world: WorldId, stars: Record<number, number>) {
  const levels = worldLevels(world);
  return (levels.find(level => !stars[level.id]) ?? levels.find(level => (stars[level.id] ?? 0) < 3) ?? levels[levels.length - 1]).id;
}

/** After a round, শেষ leaves the next level of the same world ready (the finale stays on the finale). */
export function nextUp(id: number) {
  const levels = worldLevels(levelOf(id).world), at = levels.findIndex(level => level.id === id);
  return levels[Math.min(levels.length - 1, at + 1)].id;
}

/** Old saved progress: the six sets of the first version, by their old id. */
export const OLD_SET_TO_LEVEL: Readonly<Record<number, number>> = { 1: 1, 2: 2, 3: 4, 4: 5, 5: 7, 6: 8 };
