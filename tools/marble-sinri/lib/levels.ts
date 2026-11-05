// The floors as data: three worlds of four, each floor adding exactly one thing, each world ending in a named finale.
// gen.ts turns a row of this table plus a seed into ledges; tests/levels.test.ts proves every ledge fair and the bots' rates.

export type Level = {
  name: string;
  /** The one new thing, as the title and the floor list say it. */
  line: string;
  world: number;
  /** Steps down to the landing, and the stairs' rise speed (units a second). */
  steps: number; speed: number;
  width: readonly [number, number];
  /** Chances per row of: a marble to pick, a cactus pot, a mopped step, a slope, a cracked step, a round pole, a gust, a gap. */
  picks: number; pots: number; wet: number; tilt: number; crack: number; round: number; gust: number; holes: number;
  /** Stretches where the stairs rise faster (a chance per row to start one). */
  surge: number;
  /** The lights are out: only the lantern glow around the marble. */
  dark: boolean;
};

export type World = { name: string; look: "roof" | "stairs" | "scaffold"; finale: string; call: readonly [number, number, number] };

export const WORLDS: readonly World[] = [
  { name: "ছাদ", look: "roof", finale: "দমকা হাওয়া", call: [659, 784, 988] },
  { name: "সিঁড়িঘর", look: "stairs", finale: "লোডশেডিং", call: [587, 698, 880] },
  { name: "বাঁশের ভারা", look: "scaffold", finale: "গলির গর্ত", call: [523, 659, 784] },
];
export const PER_WORLD = 4;

const none = { picks: 0, pots: 0, wet: 0, tilt: 0, crack: 0, round: 0, gust: 0, holes: 0, surge: 0, dark: false };

export const LEVELS: readonly Level[] = [
  { ...none, name: "কার্নিশ", line: "পাশ চেপে ধরো, মার্বেল গড়াবে। কিনারা দিয়ে নিচের তাকে নামো।", world: 0, steps: 6, speed: 44, width: [120, 150] },
  { ...none, name: "কুড়ানো মার্বেল", line: "তাকে ছোট মার্বেল। ৫টা কুড়ালে হারানো একটা সুযোগ ফেরত।", world: 0, steps: 10, speed: 50, width: [112, 146], picks: 0.55 },
  { ...none, name: "ক্যাকটাসের টব", line: "ক্যাকটাসের টব ছুঁলেই একটা সুযোগ যায়। পাশ কাটিয়ে নামো।", world: 0, steps: 12, speed: 54, width: [104, 138], picks: 0.4, pots: 0.4 },
  { ...none, name: "দমকা হাওয়া", line: "শেষ তলা: দড়ির কাপড় যেদিকে ওড়ে, নামার সময় হাওয়া সেদিকে ঠেলে।", world: 0, steps: 16, speed: 58, width: [100, 132], picks: 0.4, pots: 0.25, gust: 0.5 },
  { ...none, name: "মোছা সিঁড়ি", line: "সদ্য মোছা ধাপ পিছলা। ছেড়ে দিলেও মার্বেল খানিক গড়িয়ে যায়।", world: 1, steps: 14, speed: 64, width: [96, 128], picks: 0.4, pots: 0.2, wet: 0.5 },
  { ...none, name: "রেলিং", line: "ঢালু রেলিংয়ে মার্বেল নিজেই নিচের দিকে গড়ায়।", world: 1, steps: 14, speed: 68, width: [94, 124], picks: 0.4, pots: 0.2, wet: 0.15, tilt: 0.5 },
  { ...none, name: "ভাঙা ধাপ", line: "ফাটা ধাপে নামলে এক সেকেন্ড পর সেটা ভেঙে পড়ে।", world: 1, steps: 16, speed: 72, width: [90, 120], picks: 0.4, pots: 0.2, wet: 0.12, tilt: 0.15, crack: 0.45 },
  { ...none, name: "লোডশেডিং", line: "শেষ তলা: বাতি নেই। হারিকেনের আলোয় শুধু কাছের তাক দেখা যায়।", world: 1, steps: 20, speed: 76, width: [88, 116], picks: 0.4, pots: 0.28, wet: 0.18, tilt: 0.2, crack: 0.2, dark: true },
  { ...none, name: "গোল বাঁশ", line: "গোল বাঁশের মাথায় মার্বেল থামে না, একদিকে গড়িয়ে যায়।", world: 2, steps: 16, speed: 74, width: [88, 116], picks: 0.4, pots: 0.3, round: 0.5 },
  { ...none, name: "বাঁশের ফাঁক", line: "তক্তার মাঝে ফাঁক। ফাঁক দিয়ে টুপ করে নিচে নামা যায়।", world: 2, steps: 18, speed: 74, width: [98, 116], picks: 0.4, pots: 0.28, round: 0.15, holes: 0.45 },
  { ...none, name: "তাড়া", line: "মাঝে মাঝে সিঁড়ি জোরে ওঠে। সামিয়ানা হলুদ ঝলকালে বুঝবে।", world: 2, steps: 20, speed: 74, width: [86, 114], picks: 0.4, pots: 0.3, round: 0.15, holes: 0.2, surge: 0.22 },
  { ...none, name: "গলির গর্ত", line: "শেষ তলা: ভারার সব বাধা পেরিয়ে গলিতে নামো। বন্ধুদের গর্তটা ওখানেই।", world: 2, steps: 26, speed: 76, width: [84, 110], picks: 0.4, pots: 0.38, round: 0.25, holes: 0.25, surge: 0.25, gust: 0.25, crack: 0.15 },
];
export const LEVEL_COUNT = LEVELS.length;

export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];
export const isFinale = (level: number) => level >= 1 && level <= LEVEL_COUNT && level % PER_WORLD === 0;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;

/** Chances per mode. The floor itself never changes, so a friend's link is the same stairs on every mode. */
export const MODES = [
  { name: "সহজ", chances: 5, line: "৫টা সুযোগ। কয়েকবার পড়লেও তলা পার হওয়া যায়।" },
  { name: "স্বাভাবিক", chances: 3, line: "৩টা সুযোগ। তিনবার পড়লে আবার শুরু।" },
  { name: "কঠিন", chances: 1, line: "১টা সুযোগ। একবার পড়লেই শেষ।" },
] as const;
export const DEFAULT_MODE = 1;

/** The first-run story, three lines over the live roof. */
export const STORY = [
  "ছুটির দুপুর। ছাদের কার্নিশে একটা কাচের মার্বেল।",
  "নিচে গলিতে বন্ধুরা মার্বেল খেলছে, গর্ত খোঁড়া হয়ে গেছে।",
  "ছাদ থেকে গলি পর্যন্ত গড়িয়ে নামাও। ওপরের সামিয়ানায় ঠেকো না।",
] as const;

/** Nine glass marbles. Colour i opens on the first clear of floor COLOUR_AT[i] (0 = yours from the start). */
export const MARBLES = [
  { name: "সবুজ কাচ", glass: "#2e9e6a", eye: "#f4d35e" },
  { name: "আকাশি", glass: "#3a9bd8", eye: "#ffffff" },
  { name: "লাল সুতো", glass: "#d64545", eye: "#ffe3a3" },
  { name: "হলুদ রোদ", glass: "#e8b923", eye: "#d6452b" },
  { name: "জামরঙা", glass: "#5b3a8c", eye: "#9ee0c8" },
  { name: "কমলা", glass: "#ee7b30", eye: "#2b5d8a" },
  { name: "দুধসাদা", glass: "#e9e4d8", eye: "#3a9bd8" },
  { name: "কাজল", glass: "#33363d", eye: "#ee7b30" },
  { name: "সোনালি", glass: "#c9a227", eye: "#7a2e1d" },
] as const;
/** ⌊1.5 i⌋: an old stage i cleared migrates to new floors 1..⌊1.5 K⌋, so every colour it had stays open. */
export const COLOUR_AT = [0, 1, 3, 4, 6, 7, 9, 10, 12] as const;
export const openColours = (stars: Record<number, number>) => MARBLES.map((_, index) => index === 0 || (stars[COLOUR_AT[index]] ?? 0) >= 1);
/** The colour a floor's first clear opens, or -1. */
export const colourFor = (level: number) => COLOUR_AT.indexOf(level as typeof COLOUR_AT[number]);
