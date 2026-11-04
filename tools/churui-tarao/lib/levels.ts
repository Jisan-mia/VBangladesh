// The fields as data: three worlds of four, each ক্ষেত adding one thing, each world adding one bird and ending with a named
// boss bird. afternoon.ts turns a row plus a seed into an afternoon; tests/levels.test.ts proves each one bot-clearable.

/** Bird kinds. A boss is one big bird of its world's look. */
export const SPARROW = 0, SHALIK = 1, MUNIA = 2, BOSS = 3;

export type Level = {
  name: string;
  /** The one new thing, as the start card and সব ক্ষেত say it. */
  line: string;
  world: number;
  /** Seconds until dusk. A boss holds the dusk back until it is chased off. */
  length: number;
  /** Seconds between arrivals at the start of the afternoon and at its end (a group or flock waits longer). */
  gap: readonly [number, number];
  /** The most sparrows and শালিক landing together, reached late in the afternoon (1 singles only, 2 pairs, 3 threes). */
  group: number;
  /** 1: they fly in from the left only; 2: from both sides. */
  sides: number;
  /** The share of lone birds that are শালিক (two claps). */
  shalik: number;
  /** The share of arrivals that are a মুনিয়া flock, how many fly in one, and how far apart they sit. */
  munia: number; flock: number; spread: number;
  /** Mist hides birds in flight; only the shadow on the paddy shows. */
  fog: boolean;
  /** Seconds a bird takes to fly in, and a sparrow's seconds between pecks. */
  fly: number; every: number;
  /** The boss's claps to chase off (0: no boss), and when in the afternoon it comes (a share of the length). */
  boss: number; bossAt: number;
  /** Grain (%) left at dusk for ★, ★★ and ★★★. */
  pass: number; two: number; three: number;
};

export type Look = "amon" | "kuasha" | "morol";
export type World = { name: string; look: Look; bird: string; boss: string; call: readonly [number, number, number] };

export const WORLDS: readonly World[] = [
  { name: "আমনের বিকেল", look: "amon", bird: "চড়ুই", boss: "পালের গোদা", call: [523, 659, 784] },
  { name: "কুয়াশার সকাল", look: "kuasha", bird: "শালিক", boss: "ঝুঁটি শালিক", call: [440, 554, 659] },
  { name: "মোড়লের ক্ষেত", look: "morol", bird: "মুনিয়া", boss: "ডাকাত টিয়া", call: [392, 494, 587] },
];
export const PER_WORLD = 4;

const base = { group: 1, sides: 2, shalik: 0, munia: 0, flock: 3, spread: 20, fog: false, fly: 0.85, every: 1.1, boss: 0, bossAt: 0.45 };

export const LEVELS: readonly Level[] = [
  { ...base, world: 0, name: "প্রথম চড়ুই", line: "চড়ুই নামছে বাঁ দিক থেকে। চড়ুইয়ের ওপর চাপো, হুশ!", length: 10, gap: [1.6, 1.6], sides: 1, pass: 60, two: 80, three: 94 },
  { ...base, world: 0, name: "দুই দিক থেকে", line: "আজ দুই দিক থেকেই আসে। কিনারের তীর দেখো।", length: 18, gap: [1.55, 1.3], pass: 55, two: 78, three: 92 },
  { ...base, world: 0, name: "জোড়ায় জোড়ায়", line: "চড়ুই নামে জোড়ায় জোড়ায়, দুই জায়গায়।", length: 24, gap: [1.5, 1.25], group: 2, pass: 50, two: 70, three: 82 },
  { ...base, world: 0, name: "পালের গোদা", line: "মোটা এক চড়ুই আসবে, তিন তালিতে পালাবে। ও না গেলে সন্ধ্যা নামবে না।", length: 28, gap: [1.7, 1.5], group: 2, boss: 3, bossAt: 0.4, pass: 55, two: 66, three: 78 },

  { ...base, world: 1, name: "সাহসী শালিক", line: "শালিক এক তালিতে যায় না, পাশে লাফ দেয়। আরেকবার চাপো।", length: 24, gap: [1.25, 1.1], shalik: 0.5, pass: 50, two: 72, three: 86 },
  { ...base, world: 1, name: "কুয়াশা", line: "কুয়াশায় উড়ন্ত পাখি দেখা যায় না। ধানের ওপর ছায়াটা দেখো।", length: 26, gap: [1.2, 1.0], shalik: 0.4, fog: true, pass: 50, two: 70, three: 85 },
  { ...base, world: 1, name: "দল বেঁধে", line: "তিনটা করে নামে, চড়ুই আর শালিক মিলে।", length: 30, gap: [1.75, 1.5], group: 3, shalik: 0.25, pass: 45, two: 66, three: 82 },
  { ...base, world: 1, name: "ঝুঁটি শালিক", line: "ঝুঁটিওয়ালা শালিক, চার তালিতে যায়। প্রতি তালির পর কাকতাড়ুয়ার মাথায় বসে জিরোয়।", length: 32, gap: [1.8, 1.6], group: 1, shalik: 0.25, boss: 4, bossAt: 0.3, pass: 42, two: 62, three: 78 },

  { ...base, world: 2, name: "মুনিয়ার ঝাঁক", line: "মুনিয়া নামে তিনটা গা ঘেঁষে। মাঝখানে এক তালিতেই সব পালায়।", length: 26, gap: [1.0, 0.85], munia: 0.6, flock: 3, spread: 24, pass: 50, two: 75, three: 90 },
  { ...base, world: 2, name: "বড় ঝাঁক", line: "পাঁচটার ঝাঁক, একটু ছড়িয়ে বসে। দুই তালি লাগবে।", length: 28, gap: [1.4, 1.15], munia: 0.5, flock: 5, spread: 40, pass: 45, two: 76, three: 90 },
  { ...base, world: 2, name: "সব রকম", line: "চড়ুই, শালিক, মুনিয়া, সব এক বিকেলে।", length: 32, gap: [1.5, 1.25], group: 2, shalik: 0.35, munia: 0.3, flock: 4, spread: 26, pass: 42, two: 70, three: 88 },
  { ...base, world: 2, name: "ডাকাত টিয়া", line: "সবুজ টিয়া, তিন তালিতে যায়। প্রতিবার উল্টো দিক থেকে ছোঁ মেরে নামে, খায়ও দ্বিগুণ।", length: 34, gap: [1.85, 1.65], group: 2, shalik: 0.25, munia: 0.3, flock: 3, spread: 20, boss: 3, bossAt: 0.35, pass: 40, two: 62, three: 82 },
];
export const LEVEL_COUNT = LEVELS.length;
/** The game had ten fields before the rewrite; links and stars from then name one of these numbers. */
export const OLD_LEVEL_COUNT = 10;

export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, Math.round(level) || 1)) - 1];
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const worldOf = (level: number) => levelOf(level).world;
export const isFinale = (level: number) => isLevel(level) && levelOf(level).boss > 0;

/** Seconds between pecks for each kind, as a share of the ক্ষেত's sparrow pace: a মুনিয়া is small, a boss greedy. */
export const PACE = [1, 0.9, 1.25, 0.55] as const;
/** Each boss brings its পাল: every time it lands, these birds land with it, apart from it (a মুনিয়া escort is one flock). */
export const ESCORTS = [{ kind: SPARROW, count: 1 }, { kind: SHALIK, count: 1 }, { kind: MUNIA, count: 3 }] as const;
/** Claps each kind takes. A boss takes its ক্ষেত's number. */
export const HP = [1, 2, 1, 0] as const;

/** How much each peck takes, per difficulty. Who lands where and when never changes, so a friend's link is the same afternoon on every mode. */
export const MODES = [
  { name: "সহজ", bite: 1, line: "এক ঠোকরে ১% ধান যায়। শিখতে শিখতে খেলো।" },
  { name: "স্বাভাবিক", bite: 2, line: "এক ঠোকরে ২% ধান যায়।" },
  { name: "কঠিন", bite: 3, line: "এক ঠোকরে ৩% ধান যায়।" },
] as const;
export const DEFAULT_MODE = 1;
export const biteOf = (mode: number) => MODES[Math.max(0, Math.min(MODES.length - 1, Math.round(mode) || 0))].bite;

/** The first-run story, three panels over the field. */
export const STORY = [
  "হেমন্তের বিকেল। ক্ষেতে পাকা ধান।",
  "নানা গেছেন হাটে। পাহারায় কাকতাড়ুয়া, আর তুমি।",
  "চড়ুই নামলেই চাপো, হুশ! সন্ধ্যা পর্যন্ত।",
] as const;
