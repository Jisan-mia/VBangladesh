// The 12 flights: three worlds of four. Each flight adds exactly one new thing (its `line`, shown before it and on
// পরের লেভেল), and each world ends with a named finale with its own beat and a named bar at the top.
// Layouts are data: course.ts lays them out and the seed only nudges them (and moves the candies a little), so a
// friend's link is the same flight. tests/levels.test.ts proves every flight on many seeds with the headless bots.
import { FLOOR, STREET, WATER } from "./physics";

/**
 * One piece of a flight, as a short tuple (x in u from the throw, 50 u a মিটার):
 * bench x h · shelf x h · fan x · roof x0 x1 h · tank x h · warm x y0 width strength · kite x y length sway (a cut kite drifting, its string hanging `length` below) ·
 * gust x0 x1 wx period on phase · boat x width · ghat x0 x1 h · rain x0 x1 · bird cx cy ax ay freq phase ·
 * candy x y n dx arch · cp x y (a checkpoint a new page is thrown from) · bell x0 x1 strength period phase (a fan
 * that blows harder on the bell).
 */
export type Piece =
  | readonly ["bench", number, number?]
  | readonly ["shelf", number, number]
  | readonly ["fan", number]
  | readonly ["bell", number, number, number, number, number]
  | readonly ["roof", number, number, number]
  | readonly ["tank", number, number]
  | readonly ["warm", number, number, number, number]
  | readonly ["kite", number, number, number, number]
  | readonly ["gust", number, number, number, number, number, number]
  | readonly ["boat", number, number]
  | readonly ["ghat", number, number, number]
  | readonly ["rain", number, number]
  | readonly ["bird", number, number, number, number, number, number]
  | readonly ["candy", number, number, number, number, number]
  | readonly ["cp", number, number];

export type PadSpec = { x0: number; x1: number; y: number; bull: number; depth: number; step?: number; every?: number };

export type LevelSpec = {
  name: string;
  /** The one new thing, in a line (shown on the start card, the list and পরের লেভেল). */
  line: string;
  world: number;
  /** Where the flight ends (the far wall indoors), and where the plane is thrown from. */
  length: number; startY: number;
  pad: PadSpec;
  pieces: readonly Piece[];
  /** Candies for ★★ (out of all of them). */
  goal: number;
  /** Finale beats in seconds (bells, kite dives, the ferry's horn), telegraphed a second ahead. */
  beats?: readonly number[];
  /** A finale's name on its bar. */
  bar?: string;
};

export const WORLDS = [
  {
    id: "class", name: "ক্লাসঘর", look: "class", floor: FLOOR, ceiling: 560,
    clear: "স্যারের টেবিলে নামল। স্যার এখনো বোর্ডে লিখছেন।",
    call: [523, 659, 784],
  },
  {
    id: "roof", name: "ছাদের ওপর", look: "roof", floor: STREET, ceiling: Infinity,
    clear: "বন্ধুর ছাদে নামল। চাটাইয়ে শুকাচ্ছে আমের আচার।",
    call: [587, 740, 880],
  },
  {
    id: "river", name: "নদীর ঘাট", look: "river", floor: WATER, ceiling: Infinity,
    clear: "নৌকার ছইয়ের ওপর নামল। মাঝি হাত নাড়ছে।",
    call: [440, 554, 659],
  },
] as const;
export type Look = (typeof WORLDS)[number]["look"];
export const PER_WORLD = 4;

export const LEVELS: readonly LevelSpec[] = [
  // ---- ক্লাসঘর: chalk dust, a green board, wooden benches. No updrafts yet: every flight is one good throw. ----
  {
    name: "প্রথম ছোড়া", world: 0, length: 980, startY: 230, goal: 3,
    line: "চেপে ধরলে প্লেনের নাক ওঠে, ছাড়লে নামে। স্যারের টেবিলে নামাও।",
    pad: { x0: 620, x1: 980, y: 60, bull: 55, depth: 60 },
    pieces: [["candy", 140, 240, 5, 60, 18]],
  },
  {
    name: "বেঞ্চের সারি", world: 0, length: 1200, startY: 250, goal: 5,
    line: "সারি সারি বেঞ্চ আর উঁচু আলমারি। ওপর দিয়ে পার হও।",
    pad: { x0: 900, x1: 1200, y: 60, bull: 46, depth: 60 },
    pieces: [
      ["bench", 300], ["bench", 420], ["shelf", 650, 145], ["bench", 820],
      ["candy", 170, 270, 3, 60, 10], ["candy", 400, 165, 3, 60, 16], ["candy", 600, 215, 3, 50, 14],
    ],
  },
  {
    name: "ফ্যানের নিচে", world: 0, length: 1320, startY: 260, goal: 5,
    line: "ঘুরন্ত ফ্যানের হাওয়া প্লেনকে নিচে ঠেলে দেয়। পাখার কাছে যেয়ো না।",
    pad: { x0: 1030, x1: 1320, y: 60, bull: 40, depth: 60 },
    pieces: [
      ["fan", 380], ["bench", 560], ["fan", 760], ["bench", 900],
      ["candy", 170, 285, 3, 55, 8], ["candy", 520, 180, 3, 50, 18], ["candy", 840, 170, 3, 50, 14],
      ["cp", 560, 240],
    ],
  },
  {
    name: "টিফিনের ঘণ্টা", world: 0, length: 1400, startY: 270, goal: 5, bar: "টিফিনের ঘণ্টা",
    line: "শেষ লেভেল: ঘণ্টা পড়লেই ফ্যান জোরে ঘোরে। ঘণ্টার ফাঁকে ফ্যানের নিচ দিয়ে যাও।",
    beats: [3.2, 7.2, 11.2, 15.2, 19.2],
    pad: { x0: 1130, x1: 1400, y: 60, bull: 34, depth: 60 },
    pieces: [
      ["bench", 300], ["fan", 470], ["bell", 415, 525, 36, 4, 0.8], ["shelf", 660, 120], ["fan", 860], ["bell", 805, 915, 36, 4, 0.8], ["bench", 1000],
      ["candy", 160, 295, 3, 55, 8], ["candy", 420, 205, 3, 45, 12], ["candy", 620, 240, 3, 50, 16], ["candy", 880, 215, 3, 50, 12],
      ["cp", 600, 260], ["cp", 980, 225],
    ],
  },


  // ---- ছাদের ওপর: afternoon over the city's roofs, kites in the sky, warm air off the tin roofs. ----
  {
    name: "গরম হাওয়া", world: 1, length: 2200, startY: 270, goal: 8,
    line: "টিনের চালের ওপর গরম হাওয়া ওঠে। ঢেউ খেলানো দাগে ঢুকলে প্লেন ওপরে ওঠে।",
    pad: { x0: 1880, x1: 2200, y: 160, bull: 36, depth: 160 },
    pieces: [
      ["roof", -120, 120, 200], ["roof", 330, 560, 150], ["warm", 445, 150, 120, 125], ["roof", 820, 1040, 170], ["roof", 1260, 1500, 140], ["warm", 1380, 140, 120, 125],
      ["roof", 1880, 2200, 160],
      ["candy", 220, 300, 3, 55, 10], ["candy", 445, 330, 3, 0.1, 0], ["candy", 700, 290, 4, 55, 14], ["candy", 1380, 320, 3, 0.1, 0], ["candy", 1600, 300, 3, 55, 12],
      ["cp", 445, 300], ["cp", 1380, 300],
    ],
  },
  {
    name: "কাটা ঘুড়ি", world: 1, length: 2300, startY: 270, goal: 8,
    line: "কাটা ঘুড়ি সুতো ঝুলিয়ে ভেসে যায়। সুতোয় লাগলে প্লেন আটকায়, ঘুড়ির ওপর বা সুতোর নিচ দিয়ে যাও।",
    pad: { x0: 1980, x1: 2300, y: 150, bull: 34, depth: 150 },
    pieces: [
      ["roof", -120, 120, 200], ["roof", 340, 600, 160], ["warm", 500, 160, 120, 125], ["kite", 720, 330, 140, 14],
      ["roof", 860, 1100, 150], ["warm", 980, 150, 120, 120], ["kite", 1220, 300, 110, 16], ["roof", 1320, 1560, 170], ["warm", 1440, 170, 120, 120], ["kite", 1720, 330, 120, 14],
      ["candy", 220, 300, 3, 55, 10], ["candy", 500, 300, 3, 0.1, 0], ["candy", 720, 400, 2, 40, 0], ["candy", 980, 300, 3, 0.1, 0], ["candy", 1440, 320, 3, 0.1, 0], ["candy", 1700, 420, 2, 50, 0],
      ["cp", 500, 290], ["cp", 980, 290], ["cp", 1440, 300],
    ],
  },

  {
    name: "দমকা হাওয়া", world: 1, length: 2400, startY: 270, goal: 9,
    line: "দমকা হাওয়া আসে আর যায়। উল্টো হাওয়ায় প্লেন কম এগোয়, পিঠের হাওয়ায় বেশি।",
    pad: { x0: 2080, x1: 2400, y: 150, bull: 32, depth: 150 },
    pieces: [
      ["roof", -120, 120, 200], ["roof", 330, 560, 150], ["warm", 445, 150, 120, 125], ["gust", 620, 900, -26, 4, 0.5, 0],
      ["roof", 960, 1180, 160], ["warm", 1070, 160, 120, 125], ["gust", 1220, 1560, 30, 4.4, 0.55, 1.5], ["kite", 1400, 290, 110, 12],
      ["roof", 1640, 1860, 140], ["warm", 1750, 140, 120, 120], ["gust", 1880, 2060, -24, 3.6, 0.5, 0.6],
      ["candy", 220, 300, 3, 55, 10], ["candy", 445, 330, 2, 0.1, 0], ["candy", 760, 300, 3, 60, 10], ["candy", 1070, 330, 2, 0.1, 0], ["candy", 1340, 370, 3, 60, 10], ["candy", 1750, 310, 3, 0.1, 0],
      ["cp", 445, 300], ["cp", 1070, 300], ["cp", 1750, 290],
    ],
  },

  {
    name: "ঘুড়ি কাটাকাটি", world: 1, length: 2600, startY: 280, goal: 7, bar: "ঘুড়ি কাটাকাটি",
    line: "শেষ লেভেল: সাকরাইনের ঘুড়ি উৎসব। ঘুড়ি দোলে অনেক, ‘ভোকাট্টা’ শুনলেই দমকা হাওয়া।",
    beats: [5, 10, 15, 20, 25],
    pad: { x0: 2300, x1: 2600, y: 160, bull: 30, depth: 160 },
    pieces: [
      ["roof", -120, 120, 210], ["roof", 330, 560, 160], ["warm", 445, 160, 120, 125], ["kite", 700, 360, 150, 36],
      ["roof", 820, 1040, 150], ["tank", 900, 150], ["warm", 990, 150, 120, 120], ["kite", 1160, 300, 120, 40], ["gust", 1080, 1360, -24, 5, 0.4, 0],
      ["roof", 1400, 1640, 170], ["warm", 1520, 170, 120, 125], ["kite", 1740, 320, 120, 36], ["gust", 1660, 1880, 28, 5, 0.4, 0],
      ["roof", 1880, 2060, 140], ["warm", 1970, 140, 120, 120], ["kite", 2160, 340, 130, 34],
      ["candy", 220, 310, 3, 55, 10], ["candy", 445, 340, 2, 0.1, 0], ["candy", 700, 440, 2, 40, 0], ["candy", 990, 320, 2, 0.1, 0], ["candy", 1160, 135, 2, 40, 0], ["candy", 1520, 330, 2, 0.1, 0], ["candy", 1970, 300, 2, 0.1, 0], ["candy", 2160, 420, 2, 40, 0],
      ["cp", 445, 310], ["cp", 990, 300], ["cp", 1520, 310], ["cp", 1970, 290],
    ],
  },


  // ---- নদীর ঘাট: a monsoon river at dusk, boats with bamboo ছই, herons, the last ferry. ----
  {
    name: "নদীর ওপর", world: 2, length: 2300, startY: 260, goal: 8,
    line: "নিচে নদী, পানিতে পড়লে প্লেন ভিজে যায়। নৌকার চুলার ধোঁয়ায় ওপরে ওঠো।",
    pad: { x0: 2010, x1: 2300, y: 70, bull: 34, depth: 70 },
    pieces: [
      ["ghat", -120, 110, 170], ["boat", 420, 200], ["warm", 520, 70, 120, 130], ["boat", 900, 180], ["boat", 1300, 220], ["warm", 1410, 70, 120, 130],
      ["boat", 1700, 160],
      ["candy", 200, 280, 3, 55, 10], ["candy", 520, 300, 3, 0.1, 0], ["candy", 800, 230, 3, 55, 12], ["candy", 1410, 300, 3, 0.1, 0], ["candy", 1640, 240, 3, 55, 12],
      ["cp", 520, 280], ["cp", 1410, 280],
    ],
  },
  {
    name: "ঝুম বৃষ্টি", world: 2, length: 2400, startY: 260, goal: 8,
    line: "বৃষ্টির পর্দায় ঢুকলে কাগজ ভারী হয়ে নিচে নামে। ছোট্ট ফাঁক খুঁজে নাও।",
    pad: { x0: 2110, x1: 2400, y: 70, bull: 32, depth: 70 },
    pieces: [
      ["ghat", -120, 110, 170], ["boat", 400, 200], ["warm", 500, 70, 120, 130], ["rain", 680, 860], ["boat", 980, 180], ["warm", 1070, 70, 120, 135],
      ["rain", 1260, 1390], ["boat", 1500, 200], ["warm", 1600, 70, 120, 130], ["rain", 1790, 1890],
      ["candy", 200, 280, 3, 55, 10], ["candy", 500, 300, 3, 0.1, 0], ["candy", 900, 230, 2, 50, 0], ["candy", 1070, 310, 3, 0.1, 0], ["candy", 1600, 300, 3, 0.1, 0],
      ["cp", 500, 280], ["cp", 1070, 290], ["cp", 1600, 280],
    ],
  },
  {
    name: "বকের ঝাঁক", world: 2, length: 2500, startY: 260, goal: 9,
    line: "বক নদীর ওপর পাক খেয়ে ওড়ে। ওদের পথ দেখে ফাঁক বুঝে যাও।",
    pad: { x0: 2210, x1: 2500, y: 70, bull: 30, depth: 70 },
    pieces: [
      ["ghat", -120, 110, 170], ["boat", 400, 200], ["warm", 500, 70, 120, 130], ["bird", 760, 250, 50, 60, 1.3, 0], ["boat", 980, 180], ["warm", 1070, 70, 120, 135],
      ["bird", 1320, 230, 40, 70, 1.4, 1.5], ["rain", 1420, 1560], ["boat", 1600, 200], ["warm", 1700, 70, 120, 130], ["bird", 1950, 210, 60, 50, 1.2, 3],
      ["candy", 200, 280, 3, 55, 10], ["candy", 500, 300, 3, 0.1, 0], ["candy", 1070, 310, 3, 0.1, 0], ["candy", 1700, 300, 3, 0.1, 0], ["candy", 2060, 220, 2, 50, 0],
      ["cp", 500, 280], ["cp", 1070, 290], ["cp", 1700, 280],
    ],
  },
  {
    name: "শেষ খেয়া", world: 2, length: 2700, startY: 270, goal: 9, bar: "শেষ খেয়া",
    line: "শেষ লেভেল: সন্ধ্যার শেষ খেয়া ঘাট ছাড়ছে। ভেঁপু বাজলেই নৌকা সরে যায়।",
    beats: [6, 12, 18],
    pad: { x0: 2180, x1: 2420, y: 70, bull: 30, depth: 70, step: 70, every: 6 },
    pieces: [
      ["ghat", -120, 110, 180], ["boat", 400, 200], ["warm", 500, 70, 120, 130], ["bird", 760, 260, 50, 60, 1.3, 0], ["rain", 860, 1000],
      ["boat", 1080, 180], ["warm", 1170, 70, 120, 135], ["gust", 1260, 1560, -24, 4, 0.5, 1], ["bird", 1420, 220, 50, 60, 1.4, 2],
      ["boat", 1660, 200], ["warm", 1760, 70, 120, 130], ["rain", 1880, 2020], ["bird", 2120, 230, 60, 50, 1.2, 3.5],
      ["candy", 200, 290, 3, 55, 10], ["candy", 500, 310, 3, 0.1, 0], ["candy", 1170, 320, 3, 0.1, 0], ["candy", 1420, 330, 2, 50, 0], ["candy", 1760, 310, 3, 0.1, 0], ["candy", 2120, 340, 2, 50, 0],
      ["cp", 500, 290], ["cp", 1170, 300], ["cp", 1760, 290],
    ],
  },
];

export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.max(0, Math.min(LEVEL_COUNT - 1, level - 1))];
export const isFinale = (level: number) => level % PER_WORLD === 0;
export const worldOf = (level: number) => WORLDS[levelOf(level).world];

/** পাতা: how many pages you may fold for one flight. The flight never changes, so a friend's link stays the same flight. */
export const MODES = [
  { name: "সহজ", pages: 5, line: "৫টা পাতা। পড়ে গেলে পাশের বন্ধু নতুন প্লেন ছোড়ে।" },
  { name: "স্বাভাবিক", pages: 3, line: "৩টা পাতা। তিনবার পড়লে এই উড়ান শেষ।" },
  { name: "কঠিন", pages: 1, line: "১টা পাতা। একবার পড়লেই শেষ।" },
] as const;
export const DEFAULT_MODE = 1;

/** The first-run story: three panels over the live classroom (tap for the next, hold to skip). */
export const STORY = [
  "শেষ পিরিয়ড, অঙ্ক ক্লাস। স্যার বোর্ডে লিখছেন।",
  "খাতার শেষ পাতাটা ছিঁড়ে চুপচাপ ভাঁজ দিলে।",
  "চেপে ধরলে নাক ওঠে, ছাড়লে নামে। স্যারের টেবিলে নামাও!",
] as const;

/** Keys for the level list, in order. */
export const LIST_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="] as const;
