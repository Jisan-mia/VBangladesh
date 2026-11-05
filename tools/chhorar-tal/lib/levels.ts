// Levels as data: 3 worlds, 8 ছড়া. Each level adds exactly one idea to the beat; the last level of a world is its named
// finale. Ids 1–4 are the four old ছড়া, so stars saved by the first version stay valid; 5–8 are new.
import { rhymeOf, type Rhyme } from "./poems";

export type Guide = "full" | "dim" | "none";

export type Level = {
  /** The saved-star id. */
  id: number;
  world: 1 | 2 | 3;
  rhyme: string;
  /** Short name on cards (the ছড়া's name is the rhyme's own). */
  title: string;
  /** The one new thing, in a parent's words. */
  idea: string;
  /** One word per beat, in ms. */
  beatMs: number;
  /** How far off a tap may land and still count, as a share of the beat. */
  window: number;
  /** How many times round the ছড়া goes. The first is the ঢুলি's, the rest are yours. */
  passes: number;
  /** A resting beat after each line (the hand opens, nobody taps). */
  rests: boolean;
  /** The first word of each breath is a bigger beat. */
  strong: boolean;
  /** The ঢুলি plays one line and you answer the next; the next pass swaps. */
  echo: boolean;
  /** How much of the beat stays on screen on the last pass. */
  guide: Guide;
  /** Per-line beat length factors (the parade speeds up). */
  scale?: readonly number[];
  /** Set on the last level of a world. */
  finale?: string;
};

export type World = { id: 1 | 2 | 3; name: string; line: string; ids: readonly number[] };

export const LEVELS: readonly Level[] = [
  { id: 1, world: 1, rhyme: "hattima", title: "হাট্টিমা", idea: "ঢোলের সাথে সাথে প্রতিটা শব্দে একটা তালি।", beatMs: 900, window: 0.3, passes: 2, rests: false, strong: false, echo: false, guide: "full" },
  { id: 5, world: 1, rhyme: "notun", title: "পায়রা", idea: "লাইনের শেষে একটা চুপ: হাত খোলা, তালি নেই।", beatMs: 860, window: 0.3, passes: 2, rests: true, strong: false, echo: false, guide: "full" },
  { id: 2, world: 1, rhyme: "ata", title: "তোতা পাখি", idea: "শেষবারে তালের বলটা আবছা। তুমি নিজে তাল ধরে রাখো।", beatMs: 860, window: 0.28, passes: 2, rests: true, strong: false, echo: false, guide: "dim", finale: "তোতা পাখির গান" },
  { id: 3, world: 2, rhyme: "chand", title: "চাঁদ মামা", idea: "প্রতি দমের প্রথম শব্দটা বড় তাল। সোনালি চাঁদে চাপো।", beatMs: 820, window: 0.28, passes: 2, rests: true, strong: true, echo: false, guide: "dim" },
  { id: 6, world: 2, rhyme: "brishti", title: "বৃষ্টি", idea: "ফোঁটা পড়ে তাড়াতাড়ি। তাল একটু দ্রুত।", beatMs: 620, window: 0.3, passes: 3, rests: true, strong: false, echo: false, guide: "dim" },
  { id: 7, world: 2, rhyme: "ghum", title: "ঘুমপাড়ানি", idea: "ঢুলি এক লাইন বাজায়, তুমি পরের লাইন। পরের বারে অদলবদল।", beatMs: 840, window: 0.28, passes: 2, rests: true, strong: false, echo: true, guide: "full", finale: "ঘুমের গান" },
  { id: 4, world: 3, rhyme: "agdum", title: "আগডুম", idea: "শোভাযাত্রা এগোয়, তাল প্রতি লাইনে একটু দ্রুত হয়।", beatMs: 780, window: 0.28, passes: 2, rests: true, strong: false, echo: false, guide: "dim", scale: [1, 1, 0.9, 0.8] },
  { id: 8, world: 3, rhyme: "mela", title: "মেলার ঢোল", idea: "ছয় লাইন, সব চেনা। শেষবারে বল নেই, ঢোল তোমার হাতে।", beatMs: 720, window: 0.26, passes: 2, rests: true, strong: true, echo: false, guide: "none", finale: "মেলার ঢোল" },
];

export const WORLDS: readonly World[] = [
  { id: 1, name: "উঠান", line: "ঢোলে সবার আগে হাত পাকাও", ids: [1, 5, 2] },
  { id: 2, name: "আকাশ", line: "চাঁদ, বৃষ্টি আর ঘুমের গান", ids: [3, 6, 7] },
  { id: 3, name: "মেলা", line: "ঢাক-ঢোলের শোভাযাত্রা", ids: [4, 8] },
];

export const LEVEL_COUNT = LEVELS.length;
export const LEVEL_IDS = LEVELS.map(level => level.id);
export const isLevel = (id: number) => LEVELS.some(level => level.id === id);
export const levelOf = (id: number): Level => LEVELS.find(level => level.id === id) ?? LEVELS[0];
export const rhymeForLevel = (id: number): Rhyme => rhymeOf(levelOf(id).rhyme)!;
export const worldOf = (id: number): World => WORLDS.find(world => world.id === levelOf(id).world)!;
/** The place in play order, 1..8. */
export const placeOf = (id: number) => LEVELS.findIndex(level => level.id === id) + 1;
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => LEVELS[placeOf(id)]?.id ?? 0;

/** The first level in play order with no stars yet, else the first. Where a returning child starts. */
export const nextToPlay = (stars: Record<number, number>) => (LEVELS.find(level => !stars[level.id]) ?? LEVELS[0]).id;
