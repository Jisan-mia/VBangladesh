// The পাটি as data: three worlds of four, each adding exactly one thing, each world ending in a named নকশা, plus খোলা পাটি
// (the original endless game, level 0). game.ts turns a row plus a seed into a frame; tests/levels.test.ts proves each one
// clearable by a headless thumb at its target rate.
import { CLASSIC_BUNDLE, CLASSIC_OPENING, type Kind } from "./pieces";

export type Level = {
  name: string;
  /** The one new thing, as the title and the list say it. */
  line: string;
  world: number;
  /** Rows to weave; 0 means endless. */
  goal: number;
  /** Strips dealt per bundle (shuffled by the seed), and the fixed first strips before the bundles. */
  bundle: readonly Kind[];
  opening: readonly Kind[];
  /** Fixed rows at the bottom of the frame, bottom first: "." empty, 1–4 a colour. */
  rows: readonly string[];
  /** Old torn rows under everything, each with `holes` gaps, from the seed. */
  old: number; holes: number;
  /** Milliseconds a strip takes to fall one row, at the start and once the goal is woven. */
  fall: readonly [number, number];
  /** Strips between rising old rows, between সুই; 0 for none. */
  rise: number; sui: number;
  /** Chance per strip that it comes wet (won't turn) or golden (its rows pay double). */
  wet: number; gold: number;
  /** Points for ★★ and ★★★ (★ is reaching the goal). */
  two: number; three: number;
  /** পাটি 1 and 2: the button you need next glows. */
  guide: boolean;
};

export type Look = "day" | "dusk" | "night";
export type Motif = "borfi" | "lota" | "shapla";
export type World = { name: string; look: Look; motif: Motif; finale: string; call: readonly [number, number, number] };

export const WORLDS: readonly World[] = [
  { name: "উঠানের পাটি", look: "day", motif: "borfi", finale: "বরফি নকশা", call: [392, 494, 587] },
  { name: "পুরোনো পাটি", look: "dusk", motif: "lota", finale: "লতাপাতা", call: [349, 440, 523] },
  { name: "চাঁদনি রাত", look: "night", motif: "shapla", finale: "শাপলা নকশা", call: [330, 415, 494] },
];
export const PER_WORLD = 4;

const ALL6: readonly Kind[] = CLASSIC_BUNDLE;
const base = { rows: [] as readonly string[], opening: [] as readonly Kind[], old: 0, holes: 1, rise: 0, sui: 0, wet: 0, gold: 0, guide: false };

export const LEVELS: readonly Level[] = [
  { ...base, name: "প্রথম সারি", line: "ফালি সরাও, ফাঁকে বসাও। সারি ভরলেই বোনা।", world: 0, goal: 3,
    bundle: ["dui", "tin", "tin", "dui"], opening: ["dui", "tin", "tin"], rows: ["141..141", "414...14", "141...41"], fall: [800, 800], two: 30, three: 30, guide: true },
  { ...base, name: "ঘোরাও", line: "ফালি ঘোরাও। খাড়া ফাঁকে খাড়া ফালি বসে।", world: 0, goal: 5,
    bundle: ["dui", "tin", "tin", "kona", "kona"], opening: ["tin", "kona"], rows: ["14141.14", "41414.41"], fall: [780, 720], two: 60, three: 75, guide: true },
  { ...base, name: "লম্বা ফালি", line: "চার ঘরের লম্বা ফালি। একসাথে কয়েক সারি ভরালে বেশি পয়েন্ট।", world: 0, goal: 8,
    bundle: ["dui", "tin", "kona", "kona", "lomba", "lomba"], opening: ["lomba"], rows: ["1414141.", "4141414.", "1414141."], fall: [740, 640], two: 100, three: 115 },
  { ...base, name: "বরফি নকশা", line: "শেষ পাটি: ছয় রকম ফালি, পাটি বাড়লে গতিও বাড়ে। বোনা সারিতে ফোটে বরফি।", world: 0, goal: 12,
    bundle: ALL6, fall: [650, 420], two: 140, three: 160 },

  { ...base, name: "পুরোনো সারি", line: "ফ্রেমের নিচে পুরোনো ছেঁড়া পাটি। ফাঁকগুলো ভরে সারি বোনো।", world: 1, goal: 6,
    bundle: ALL6, old: 5, fall: [640, 560], two: 70, three: 85 },
  { ...base, name: "ঠেলে ওঠা সারি", line: "প্রতি ৮টা ফালির পর নিচ থেকে একটা পুরোনো সারি ঠেলে ওঠে।", world: 1, goal: 10,
    bundle: ALL6, old: 2, rise: 9, fall: [640, 540], two: 115, three: 130 },
  { ...base, name: "ভেজা বেত", line: "ভেজা ফালি ঘোরে না। যেভাবে আসে, সেভাবেই বসাও।", world: 1, goal: 10,
    bundle: ALL6, old: 2, wet: 0.2, fall: [660, 560], two: 120, three: 135 },
  { ...base, name: "লতাপাতা", line: "শেষ পাটি: পুরোনো সারি, ঠেলে ওঠা সারি আর ভেজা বেত একসাথে। ফোটে লতাপাতা।", world: 1, goal: 14,
    bundle: ALL6, old: 2, rise: 11, wet: 0.18, fall: [620, 500], two: 165, three: 185 },

  { ...base, name: "সোনালি বেত", line: "সোনালি ফালি যে সারি ভরায়, সেই সারির পয়েন্ট দ্বিগুণ।", world: 2, goal: 10,
    bundle: ALL6, old: 2, gold: 0.18, fall: [540, 440], two: 185, three: 220 },
  { ...base, name: "সুই", line: "প্রতি ৯টা ফালির পর আসে সুই। বুনটের ফাঁক গলে কলামের সবচেয়ে নিচের গর্তে বসে।", world: 2, goal: 12,
    bundle: ALL6, old: 5, holes: 2, sui: 9, fall: [520, 420], two: 140, three: 160 },
  { ...base, name: "ডালা ফালি", line: "পাঁচ ঘরের ডালা ফালি। মাঝের খোপটা পরে ভরাও।", world: 2, goal: 12,
    bundle: [...ALL6, "dala"], old: 2, fall: [520, 400], two: 145, three: 165 },
  { ...base, name: "শাপলা নকশা", line: "শেষ পাটি: সব একসাথে, রাতের গতিতে। ফোটে শাপলা।", world: 2, goal: 16,
    bundle: [...ALL6, "dala"], old: 2, rise: 11, sui: 10, wet: 0.18, gold: 0.12, fall: [560, 420], two: 230, three: 275 },
];
export const LEVEL_COUNT = LEVELS.length;

/** খোলা পাটি: the original game, kept exactly (its fall is the old curve in step.hot.ts). */
export const CLASSIC: Level = {
  ...base, name: "খোলা পাটি", line: "যত সারি পারো। প্রতি ১০ সারিতে গতি একটু বাড়ে।", world: 0, goal: 0,
  bundle: CLASSIC_BUNDLE, opening: CLASSIC_OPENING, rows: ["141..141", "414...14"], fall: [700, 70], two: 0, three: 0,
};

export const levelOf = (level: number) => level >= 1 && level <= LEVEL_COUNT ? LEVELS[level - 1] : CLASSIC;
export const isFinale = (level: number) => level >= 1 && level <= LEVEL_COUNT && level % PER_WORLD === 0;
export const worldOf = (level: number) => WORLDS[levelOf(level).world];

/** গোটানো per difficulty: how often a full frame rolls its bottom four rows away. The strips never change. */
export const MODES = [
  { name: "সহজ", rolls: 3, line: "৩ বার গোটানো যাবে। ফ্রেম ভরলেও খেলা চলে।" },
  { name: "স্বাভাবিক", rolls: 1, line: "১ বার গোটানো যাবে। দ্বিতীয়বার ভরলে শেষ।" },
  { name: "কঠিন", rolls: 0, line: "গোটানো নেই। ফ্রেম ভরলেই শেষ।" },
] as const;
export const DEFAULT_MODE = 1;
export const ROLL_ROWS = 4;

/** The first-run story, three lines over the frame. */
export const STORY = [
  "বিকেলের উঠান। নানু মুর্তা বেত চিরে ফালি করেছেন।",
  "আজ ফ্রেমটা তোমার হাতে।",
  "ফালি ফাঁকে বসাও। সারি ভরলেই বোনা।",
] as const;

/** Rows shown against a goal: a run may weave a few past it, but "১৩/১২" is never printed. */
export const rowsToward = (rows: number, goal: number) => goal ? Math.min(rows, goal) : rows;

/** Stars for a finished পাটি: none unless the goal was woven. */
export const starsFor = (level: number, rows: number, score: number) => {
  const row = levelOf(level);
  if (!row.goal || rows < row.goal) return 0;
  return score >= row.three ? 3 : score >= row.two ? 2 : 1;
};
