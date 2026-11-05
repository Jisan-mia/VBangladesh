// The storms as data: three worlds of four, each storm adding exactly one thing, each world ending in a named storm.
// gen.ts turns a row plus a seed into a storm; tests/levels.test.ts proves each one fair and bot-clearable at its target.

export type Level = {
  name: string;
  /** The one new thing, as the start card and the storm list say it. */
  line: string;
  world: number;
  duration: number;
  /** Fall time and the gap between drops, from the storm's start to its end (seconds). */
  fall: [number, number]; gap: [number, number];
  /** How far from the middle a mango may fall (logical units, at most 130). */
  spread: number;
  ripe: number; gold: number;
  /** Twigs start after `twigFrom` seconds, with a chance per drop going from twig[0] to twig[1]. */
  twigFrom: number; twig: [number, number];
  /** Gusts: [base gap, random extra] seconds and [base, random extra] strength; null for none. */
  gusts: [number, number] | null; gust: [number, number];
  swing: boolean; steady: number;
  /** Hail volleys, hail sweeps across the yard, tree shakes (a shower of five) and big branches. */
  hail: number; sweeps: number; shakes: number; big: number;
  dark: boolean;
};

export type World = { name: string; look: "afternoon" | "dusk" | "night"; finale: string; call: readonly [number, number, number] };

export const WORLDS: readonly World[] = [
  { name: "বিকেলের উঠান", look: "afternoon", finale: "কালবৈশাখী", call: [392, 466, 523] },
  { name: "মেঘলা সন্ধ্যা", look: "dusk", finale: "শিলাবৃষ্টি", call: [349, 440, 523] },
  { name: "রাতের ঝড়", look: "night", finale: "বোশেখের শেষ ঝড়", call: [330, 392, 494] },
];
export const PER_WORLD = 4;

const base = { ripe: 0.32, gold: 0, twigFrom: Infinity, twig: [0, 0] as [number, number], gusts: null, gust: [0, 0] as [number, number], swing: false, steady: 0, hail: 0, sweeps: 0, shakes: 0, big: 0, dark: false };

export const LEVELS: readonly Level[] = [
  { ...base, name: "প্রথম ঝাপটা", line: "ডালা সরাও, আম ধরো। শুধু আম পড়ে, ধীরে।", world: 0, duration: 10, fall: [2.5, 2.3], gap: [0.95, 0.85], spread: 95 },
  { ...base, name: "দমকা হাওয়া", line: "দমকা হাওয়ায় আম একপাশে সরে যায়। গাছ হেলে পড়লেই বুঝবে।", world: 0, duration: 20, fall: [2.6, 2.2], gap: [0.95, 0.72], spread: 125, gusts: [5, 2], gust: [0.4, 0.3] },
  { ...base, name: "শুকনো ডাল", line: "শুকনো ডাল পড়ে। ডালায় পড়লে একটা জান যায়।", world: 0, duration: 25, fall: [2.5, 2.05], gap: [0.92, 0.62], spread: 130, twigFrom: 4, twig: [0.1, 0.18], gusts: [6, 3], gust: [0.42, 0.3] },
  { ...base, name: "কালবৈশাখী", line: "শেষ ঝড়: তিনবার পুরো গাছ ঝাঁকুনি দেয়, একসঙ্গে পাঁচটা আম পড়ে।", world: 0, duration: 35, fall: [2.45, 1.9], gap: [0.9, 0.55], spread: 130, twigFrom: 4, twig: [0.1, 0.2], gusts: [6, 3], gust: [0.48, 0.35], shakes: 3 },
  { ...base, name: "সোনালি আম", line: "মাঝে মাঝে সোনালি আম, ২৫ পয়েন্ট। পড়ে খুব জোরে।", world: 1, duration: 30, fall: [2.35, 1.85], gap: [0.88, 0.55], spread: 130, gold: 0.08, twigFrom: 4, twig: [0.1, 0.18], gusts: [6, 3], gust: [0.45, 0.35] },
  { ...base, name: "শিল", line: "শিল পড়ে ঝাঁকে ঝাঁকে। ডালায় শিল লাগলে ওপরের আমটা ছিটকে পড়ে।", world: 1, duration: 30, fall: [2.35, 1.85], gap: [0.88, 0.58], spread: 130, gold: 0.05, twigFrom: 5, twig: [0.06, 0.12], gusts: [6, 3], gust: [0.45, 0.35], hail: 6 },
  { ...base, name: "পাল্টা হাওয়া", line: "হাওয়া মাঝপথে উল্টো দিকে ঘুরে যায়।", world: 1, duration: 35, fall: [2.3, 1.75], gap: [0.86, 0.52], spread: 130, gold: 0.05, twigFrom: 4, twig: [0.1, 0.2], gusts: [5, 2.5], gust: [0.5, 0.35], swing: true, hail: 3 },
  { ...base, name: "শিলাবৃষ্টি", line: "শেষ ঝড়: শিলের সারি এপাশ থেকে ওপাশে ঝেঁটিয়ে যায়। ফাঁকটা খোঁজো।", world: 1, duration: 45, fall: [2.25, 1.7], gap: [0.86, 0.5], spread: 130, gold: 0.05, twigFrom: 4, twig: [0.1, 0.2], gusts: [5.5, 3], gust: [0.5, 0.35], swing: true, hail: 3, sweeps: 4 },
  { ...base, name: "আঁধার", line: "আঁধারে খসার আগে আম কাঁপে না। পড়তে শুরু করলে তবে দেখবে।", world: 2, duration: 35, fall: [2.35, 1.85], gap: [0.88, 0.55], spread: 130, gold: 0.05, twigFrom: 4, twig: [0.1, 0.18], gusts: [6, 3], gust: [0.45, 0.35], hail: 2, dark: true },
  { ...base, name: "ভাঙা ডাল", line: "বড় ভাঙা ডাল, দুই ডালার সমান চওড়া। আগে মটমট শব্দ, মাটিতে লম্বা ছায়া।", world: 2, duration: 40, fall: [2.3, 1.75], gap: [0.86, 0.52], spread: 130, gold: 0.05, twigFrom: 4, twig: [0.08, 0.16], gusts: [6, 3], gust: [0.45, 0.35], hail: 2, big: 4 },
  { ...base, name: "টানা হাওয়া", line: "পুরো ঝড়ে একদিক থেকে টানা হাওয়া, তার ওপর দমকা।", world: 2, duration: 40, fall: [2.25, 1.7], gap: [0.86, 0.5], spread: 130, gold: 0.05, twigFrom: 4, twig: [0.1, 0.2], gusts: [6, 3], gust: [0.35, 0.3], steady: 0.32, hail: 2, big: 2 },
  { ...base, name: "বোশেখের শেষ ঝড়", line: "শেষ ঝড়: ঝাঁকুনি, শিলের সারি আর ভাঙা ডাল, সব একসঙ্গে।", world: 2, duration: 50, fall: [2.2, 1.65], gap: [0.84, 0.48], spread: 130, gold: 0.05, twigFrom: 4, twig: [0.1, 0.2], gusts: [5.5, 3], gust: [0.5, 0.35], swing: true, steady: 0.12, hail: 2, sweeps: 2, shakes: 2, big: 3 },
];
export const LEVEL_COUNT = LEVELS.length;

export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];
export const worldOf = (level: number) => levelOf(level).world;
export const isFinale = (level: number) => level >= 1 && level <= LEVEL_COUNT && level % PER_WORLD === 0;

/** Stars: survive with this share of the storm's mangoes for 1, 2 and 3. */
export const STAR_SHARE = [0.4, 0.6, 0.8] as const;

/** জান (hearts) per difficulty. The storm itself never changes, so a friend's link is the same storm on every mode. */
export const MODES = [
  { name: "সহজ", hearts: 5, line: "৫টা জান। ডাল লাগলেও ঝড় পার হওয়া যায়।" },
  { name: "স্বাভাবিক", hearts: 3, line: "৩টা জান। তিনটা ডালে ঝড় শেষ।" },
  { name: "কঠিন", hearts: 1, line: "১টা জান। একটা ডালেই শেষ।" },
] as const;
export const DEFAULT_MODE = 1;

/** The first-run story, three lines over the live yard. */
export const STORY = [
  "বোশেখের বিকেল। আকাশ হঠাৎ কালো।",
  "নানির উঠানে বুড়ো আমগাছটা দুলছে।",
  "ডালা নিয়ে দৌড়াও! আম ধরো, শুকনো ডাল না।",
] as const;
