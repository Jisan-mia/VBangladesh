// The 20 waves: four places, five waves each, a কালবৈশাখী on every fifth. Each wave adds one new thing.

export type Pattern = "single" | "pair" | "row" | "column" | "vee" | "diag" | "zig";
export type StormSpec = { hp: number; life: number; wide: boolean; every: number; warn: number; spit: boolean };
export type LevelSpec = {
  news: string;
  groups: number;
  /** Seconds between cloud groups. */
  gap: number;
  patterns: Pattern[];
  /** Share of dark (two-hit) clouds. */
  dark: number;
  /** Seconds between drops from one dark cloud; 0 means dark clouds don't drip yet. */
  rain: number;
  /** How fast clouds come down, in sky units a second (the sky is 100 wide, 125 tall). */
  speed: number;
  /** How far clouds sway left and right. */
  sway: number;
  storm?: StormSpec;
};

export const WORLDS = [
  { id: "math", name: "স্কুলের মাঠ", clear: "মাঠ পার, টিফিনের ঘণ্টা বাজল।" },
  { id: "khet", name: "ধানক্ষেত", clear: "ধানক্ষেত পার, আলের ওপর বক বসে আছে।" },
  { id: "nodi", name: "নদীর ঘাট", clear: "নদী পার, ঘাটে নৌকা ভিড়েছে।" },
  { id: "chhad", name: "শহরের ছাদ", clear: "ছাদ পার, কেউ দৌড়ে কাপড় তুলছে।" },
] as const;
export type WorldId = (typeof WORLDS)[number]["id"];
export const STORM_CLEAR = "কালবৈশাখী থামল, মেঘ সরে রোদ উঠেছে।";

const basic: Pattern[] = ["single", "pair"];
export const LEVELS: LevelSpec[] = [
  { news: "হালকা মেঘ, একটা কাগজের বলেই ফাটে।", groups: 7, gap: 2.6, patterns: basic, dark: 0, rain: 0, speed: 15, sway: 0 },
  { news: "মেঘ এবার সারি বেঁধে আসে।", groups: 9, gap: 2.6, patterns: [...basic, "row"], dark: 0, rain: 0, speed: 16, sway: 0 },
  { news: "কালো মেঘ এল। দুইবার লাগলে তবে ফাটে।", groups: 9, gap: 2.6, patterns: [...basic, "row", "column"], dark: 0.3, rain: 0, speed: 16, sway: 0 },
  { news: "কালো মেঘ থেকে ফোঁটা পড়ে। ফোঁটার নিচ থেকে সরে যাও।", groups: 10, gap: 2.6, patterns: [...basic, "row", "column"], dark: 0.35, rain: 2.2, speed: 17, sway: 0 },
  { news: "কালবৈশাখী! ছায়া পড়া দাগে বৃষ্টি নামে, ফাঁকে থাকো।", groups: 4, gap: 2.6, patterns: [...basic, "row"], dark: 0.3, rain: 2.4, speed: 17, sway: 0, storm: { hp: 40, life: 26, wide: false, every: 3.2, warn: 1.0, spit: false } },

  { news: "মেঘ এবার ডানে-বাঁয়ে দোলে।", groups: 10, gap: 2.5, patterns: [...basic, "row", "zig"], dark: 0.35, rain: 2.2, speed: 17, sway: 12 },
  { news: "পাখির ঝাঁকের মতো সাজানো মেঘ।", groups: 10, gap: 2.5, patterns: [...basic, "row", "zig", "vee"], dark: 0.35, rain: 2.1, speed: 18, sway: 12 },
  { news: "কালো মেঘ বেশি, ফোঁটাও ঘন ঘন।", groups: 10, gap: 2.5, patterns: [...basic, "row", "column", "zig", "vee"], dark: 0.5, rain: 1.9, speed: 18, sway: 12 },
  { news: "মেঘ নামছে আগের চেয়ে জোরে।", groups: 11, gap: 2.4, patterns: [...basic, "row", "column", "zig", "vee"], dark: 0.45, rain: 1.9, speed: 21, sway: 12 },
  { news: "কালবৈশাখী এবার ছোট মেঘও ছুড়ে দেয়।", groups: 4, gap: 2.5, patterns: [...basic, "row", "zig"], dark: 0.4, rain: 2.0, speed: 19, sway: 12, storm: { hp: 55, life: 27, wide: false, every: 3.0, warn: 0.95, spit: true } },

  { news: "সিঁড়ির মতো কোনাকুনি মেঘ।", groups: 11, gap: 2.4, patterns: [...basic, "row", "zig", "vee", "diag"], dark: 0.45, rain: 1.9, speed: 20, sway: 14 },
  { news: "কালো মেঘও এবার দুলতে দুলতে নামে।", groups: 11, gap: 2.4, patterns: [...basic, "row", "zig", "vee", "diag"], dark: 0.5, rain: 1.8, speed: 20, sway: 18 },
  { news: "মেঘ আসে আরও ঘন ঘন।", groups: 13, gap: 2.2, patterns: [...basic, "row", "column", "zig", "vee", "diag"], dark: 0.5, rain: 1.8, speed: 21, sway: 18 },
  { news: "বেশির ভাগ মেঘই কালো।", groups: 13, gap: 2.2, patterns: [...basic, "row", "column", "zig", "vee", "diag"], dark: 0.62, rain: 1.7, speed: 21, sway: 18 },
  { news: "কালবৈশাখী আরও চওড়া, ফাঁক ছোট।", groups: 4, gap: 2.4, patterns: [...basic, "row", "zig", "diag"], dark: 0.45, rain: 1.9, speed: 20, sway: 14, storm: { hp: 70, life: 28, wide: true, every: 2.8, warn: 0.9, spit: true } },

  { news: "সব রকম মেঘ একসঙ্গে।", groups: 13, gap: 2.2, patterns: [...basic, "row", "column", "zig", "vee", "diag"], dark: 0.5, rain: 1.7, speed: 22, sway: 18 },
  { news: "জোর বাতাস, মেঘ দোলে অনেকখানি।", groups: 13, gap: 2.2, patterns: [...basic, "row", "zig", "vee", "diag"], dark: 0.55, rain: 1.7, speed: 23, sway: 22 },
  { news: "আকাশ প্রায় কালো, ফোঁটা পড়ছে টপটপ।", groups: 13, gap: 2.1, patterns: [...basic, "row", "column", "zig", "vee", "diag"], dark: 0.65, rain: 1.5, speed: 23, sway: 20 },
  { news: "শেষ ঝড়ের আগে সবচেয়ে ঘন মেঘ।", groups: 15, gap: 2.0, patterns: [...basic, "row", "column", "zig", "vee", "diag"], dark: 0.6, rain: 1.5, speed: 25, sway: 20 },
  { news: "সবচেয়ে বড় কালবৈশাখী। ছায়া দেখে ফাঁকে থাকো।", groups: 5, gap: 2.2, patterns: [...basic, "row", "zig", "diag"], dark: 0.5, rain: 1.8, speed: 22, sway: 16, storm: { hp: 85, life: 30, wide: true, every: 2.5, warn: 0.85, spit: true } },
];

export const LEVEL_COUNT = LEVELS.length;
export const worldOf = (level: number) => WORLDS[Math.floor((level - 1) / 5)];
export const isStorm = (level: number) => !!LEVELS[level - 1].storm;
