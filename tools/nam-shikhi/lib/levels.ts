// The levels of নাম শিখি as data: six worlds (one page of the name book each), and per level the kind of clue the big card
// shows, how many stickers to offer and how many cards fill the page. Each level adds one new kind of clue; the last one in a
// world is its finale and mixes them all. Level ids are global and fixed (1–31), so saved stars keep their meaning.
import type { Mode, PackId } from "./packs";

/**
 * What the big card shows, and so what the child matches:
 * - match: the sticker's own place, printed faint (grey) as in a sticker book;
 * - peek: the picture behind a bush, only its top showing;
 * - home: a place (river, desert…); find who lives there;
 * - bn / en: the name; every sticker carries its own name, so a pre-reader matches the word's shape;
 * - role: "জাতীয় ফুল" and so on (for readers);
 * - lens: a round close-up of one part of the figure; tap it on the figure;
 * - paint: a thing drawn grey; tap its colour and it colours in;
 * - splat: a paint splat; find the thing of that colour.
 */
export type Kind = "match" | "peek" | "home" | "bn" | "en" | "role" | "lens" | "paint" | "splat";

export type Level = {
  id: number; world: PackId;
  /** Kinds, in turn, for the cards of the round (one for an ordinary level, several for a finale). */
  kinds: Kind[];
  /** Stickers per card before the quiet easing (2–4). */
  base: number;
  /** Cards on the page. */
  cards: number;
  /** শরীর: which view the parts come from; "any" mixes both. */
  view?: "face" | "body" | "any";
  /** The finale's name, for the badge and the list. */
  finale?: string;
};

export type World = { id: PackId; first: number; last: number; palette: { paper: string; edge: string; deep: string; glow: string }; root: number };

const L = (id: number, world: PackId, kinds: Kind[], base: number, extra: Partial<Level> = {}): Level => ({ id, world, kinds, base, cards: 6, ...extra });

export const LEVELS: Level[] = [
  L(1, "pashu", ["match"], 2), L(2, "pashu", ["peek"], 3), L(3, "pashu", ["home"], 3), L(4, "pashu", ["bn"], 3), L(5, "pashu", ["en"], 3),
  L(6, "pashu", ["match", "peek", "home", "bn"], 4, { finale: "চিড়িয়াখানা" }),
  L(7, "fol", ["match"], 2), L(8, "fol", ["peek"], 3), L(9, "fol", ["bn"], 3), L(10, "fol", ["en"], 3),
  L(11, "fol", ["match", "peek", "bn", "en"], 4, { finale: "মধুমাসের ঝুড়ি" }),
  L(12, "sobji", ["match"], 2), L(13, "sobji", ["peek"], 3), L(14, "sobji", ["bn"], 3), L(15, "sobji", ["en"], 3),
  L(16, "sobji", ["match", "peek", "bn", "en"], 4, { finale: "কাঁচাবাজার" }),
  L(17, "shorir", ["lens"], 0, { view: "face" }), L(18, "shorir", ["lens"], 0, { view: "body", cards: 5 }),
  L(19, "shorir", ["bn"], 0, { view: "any" }), L(20, "shorir", ["en"], 0, { view: "any" }),
  L(21, "shorir", ["lens"], 0, { view: "any", finale: "মাথা থেকে পা" }),
  L(22, "rong", ["paint"], 2), L(23, "rong", ["splat"], 3), L(24, "rong", ["bn"], 3), L(25, "rong", ["en"], 3),
  L(26, "rong", ["paint", "splat", "bn"], 4, { finale: "রঙের বাক্স" }),
  L(27, "protik", ["match"], 2), L(28, "protik", ["bn"], 3), L(29, "protik", ["role"], 3), L(30, "protik", ["en"], 3),
  L(31, "protik", ["match", "bn", "role"], 4, { finale: "লাল-সবুজ" }),
];

export const LEVEL_COUNT = LEVELS.length;

/** Each world's palette (paper, edge, deep ink, glow) and the root note of its chime. */
export const WORLDS: World[] = [
  { id: "pashu", first: 1, last: 6, palette: { paper: "#fff6e0", edge: "#ecd9a6", deep: "#3f6b2a", glow: "#f2a900" }, root: 523 },
  { id: "fol", first: 7, last: 11, palette: { paper: "#fff3cf", edge: "#f3cf73", deep: "#9a5a00", glow: "#e8860c" }, root: 587 },
  { id: "sobji", first: 12, last: 16, palette: { paper: "#f1f6e4", edge: "#c8d9a2", deep: "#3d6b1f", glow: "#e8a20c" }, root: 494 },
  { id: "shorir", first: 17, last: 21, palette: { paper: "#eaf5fc", edge: "#b9dcf0", deep: "#1f5f8a", glow: "#f59e0b" }, root: 659 },
  { id: "rong", first: 22, last: 26, palette: { paper: "#fffaf3", edge: "#ead7c0", deep: "#7a3a8a", glow: "#f2a900" }, root: 698 },
  { id: "protik", first: 27, last: 31, palette: { paper: "#eef7ef", edge: "#b9dcbf", deep: "#00634a", glow: "#e24b3b" }, root: 440 },
];

export const levelOf = (id: number) => LEVELS[Math.min(LEVELS.length, Math.max(1, Math.round(id) || 1)) - 1];
export const worldOf = (id: PackId) => WORLDS.find(world => world.id === id) ?? WORLDS[0];
export const worldLevels = (id: PackId) => LEVELS.filter(level => level.world === id);
/** The level's number inside its world (১ for the first page of পশুপাখি and of ফল alike). */
export const placeInWorld = (id: number) => id - worldOf(levelOf(id).world).first + 1;
export const isFinale = (id: number) => Boolean(levelOf(id).finale);

/** What each kind is called in the list, and its one line for the parent. */
export const KIND_TEXT: Record<Kind, { name: string; line: string; ask: string }> = {
  match: { name: "মিলিয়ে বসাও", line: "খাতায় হালকা করে ছাপা ছবি। ঠিক স্টিকারটা খোঁজো।", ask: "কোনটা বসবে?" },
  peek: { name: "উঁকি", line: "ঝোপের আড়াল থেকে একটুখানি দেখা যায়। কে লুকিয়ে?", ask: "ঝোপে কে?" },
  home: { name: "কে কোথায় থাকে", line: "একটা জায়গা দেখায়। সেখানে কে থাকে, খোঁজো।", ask: "এখানে কে থাকে?" },
  bn: { name: "বাংলা নাম", line: "বড় করে লেখা নাম। স্টিকারের নিচের নামের সাথে মেলাও।", ask: "কোনটা?" },
  en: { name: "ইংরেজি নাম", line: "ইংরেজি নামটা মিলিয়ে ঠিক ছবিটা খোঁজো।", ask: "কোনটা?" },
  role: { name: "জাতীয় কী", line: "জাতীয় ফুল, পাখি, মাছ: কোনটা কী, খোঁজো।", ask: "কোনটা?" },
  lens: { name: "গোল কাচে দেখো", line: "গোল কাচে শরীরের একটা অংশ। ছবির শিশুর গায়ে সেটা খোঁজো।", ask: "এটা কোথায়?" },
  paint: { name: "রং করো", line: "ছবিটা ধূসর। ঠিক রংটায় চাপো, ছবি রঙিন হবে।", ask: "কোন রং?" },
  splat: { name: "রঙের জিনিস", line: "এক ফোঁটা রং। এই রঙের জিনিসটা খোঁজো।", ask: "কোনটা এই রঙের?" },
};

/** The level's own name in the list and the badge. */
export function levelName(id: number) {
  const level = levelOf(id);
  if (level.finale) return level.finale;
  if (level.world === "shorir" && level.kinds[0] === "lens") return level.view === "face" ? "মুখে খোঁজো" : "গায়ে খোঁজো";
  return KIND_TEXT[level.kinds[0]].name;
}

/** The level's one line in the list and under the title's level chip. */
export function levelLine(id: number) {
  const level = levelOf(id);
  if (level.finale) return level.world === "shorir" ? "মাথা থেকে পা পর্যন্ত, সব অঙ্গ পরপর।" : "সব রকম খেলা মিশিয়ে, চারটা স্টিকার থেকে।";
  if (level.world === "shorir" && (level.kinds[0] === "bn" || level.kinds[0] === "en")) return `${level.kinds[0] === "bn" ? "বাংলা" : "ইংরেজি"} নাম দেখে ছবির শিশুর গায়ে চাপো। ভুল হলে গোল কাচে ছবি আসে।`;
  return KIND_TEXT[level.kinds[0]].line;
}

/** Old saved progress: the old per-pack level modes, mapped to the new level ids (once, by lib/progress.ts). */
export const OLD_LEVELS: Record<PackId, Mode[]> = {
  pashu: ["bn", "en", "home", "read"], fol: ["bn", "en", "read"], sobji: ["bn", "en", "read"],
  shorir: ["bn", "en", "read"], rong: ["bn", "en", "thing"], protik: ["bn", "en", "role"],
};

/** Where an old (pack, mode) lands among the new levels. "read" (picture → name) lands on the Bangla name level. */
export function newLevelFor(pack: PackId, mode: Mode): number | null {
  const kind: Kind = mode === "thing" ? "paint" : mode === "read" ? "bn" : mode;
  return worldLevels(pack).find(level => !level.finale && level.kinds[0] === kind)?.id ?? null;
}
