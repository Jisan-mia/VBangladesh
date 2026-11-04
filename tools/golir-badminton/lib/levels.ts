// The levels as data: three পাড়া (worlds) of four neighbours each, every level adding one thing, each world ending with a
// named finale. Server-safe (no React): the link, the share preview and the card read names from here.
// tests/levels.test.ts plays every level with headless bots and asserts the target rates.
import { starsFor } from "../../../shared/game-core";

export const SLUG = "golir-badminton";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × the timing window. */ window: number;
  /** Added to every return chance of the rival. */ guard: number;
  /** Easy tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "মারার সময় বেশি, ওরা ভুল করে বেশি। তারা বড়জোর ২টা।", window: 1.4, guard: -0.08, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। ৩ তারা পেতে প্রায় কোনো পয়েন্ট দেওয়া যাবে না।", window: 1, guard: 0, maxStars: 3 },
  h: { name: "কঠিন", line: "মারার সময় কম, ওরা ফেরায় বেশি। তারার হিসাব একই।", window: 0.8, guard: 0.05, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; line: string };
export const WORLDS: readonly World[] = [
  { name: "আমাদের গলি", line: "বাল্বের নিচে, দুই জানালায় বাঁধা জাল।" },
  { name: "ছাদের কোর্ট", line: "সন্ধ্যার ছাদে বাতাস, দড়িতে কাপড় ওড়ে।" },
  { name: "বাজারের গলি", line: "শীতের রাতে কুয়াশা, চায়ের দোকানের আলো।" },
];
export const PER_WORLD = 4;

/** Shot kinds, both sides. SERVE is the opening lift; JUMP, FLOAT and the finale's set are the named moves. */
export const CLEAR = 0, SMASH = 1, DROP = 2, DRIVE = 3, LIFT = 4, SERVE = 5, JUMP = 6, FLOAT = 7;
export const SHOT_KINDS = 8;

/** A finale's named move: fills a দম bar with every rival hit, then plays it on the next ball it can. */
export type Special = "jump" | "float" | "triple";

export type Rival = {
  /** As read on its own, as the object of a sentence ("ভাইয়াকে"), and the short form for the scoreboard and calls. */
  name: string; obj: string; short: string;
  shirt: string; cap: string;
  /** Their style in one line, for the title and the level list. */
  style: string;
};

export type LevelDef = {
  world: number;
  rival: Rival;
  /** The one new thing, in one line. */
  teach: string;
  /** First to this many points. */
  points: number;
  /** Half-width of your timing window, in game seconds. */
  window: number;
  /** Your first hits in a rally that the rival always gets back (so level 1 is never won by one smash). */
  steady: number;
  /** Chance to return your shot, by your shot kind, when it is struck right on time. A shot a little early or late is easier. */
  guard: Readonly<Record<"clear" | "smash" | "drop" | "lift", number>>;
  /** Lost from every return chance per hit in the rally past `steady`. */
  tire: number;
  /** Where they wait, how fast they run (units a second), how long before they set off, how far their racket reaches. */
  home: number; run: number; react: number; reach: number;
  /** Their shot mix off a high ball and off a low ball (weights), and their smash's speed. */
  high: Readonly<Record<"clear" | "drop" | "smash" | "drive", number>>;
  low: Readonly<Record<"lift" | "drop" | "drive", number>>;
  smashSpeed: number;
  /** Chance they smash any short, high ball you give them. */
  kill: number;
  /** Chance a shot of theirs is a pure error (into the net or long), on top of the rally's tiring. */
  slip: number;
  /** Wind: the steady push (units a second, + towards them), how often gusts come (0: none) and how strong, and after how many points it turns. */
  wind: number; gusts: number; gust: number; turn: number;
  /** Chance the rival reads the wind when aiming (otherwise it aims as in still air). */
  windSense: number;
  /** Fog hides the shuttle up high, and the ring comes only near the end. */
  fog: boolean;
  /** Chance a drop of theirs shows the pose of a clear. */
  feint: number;
  special: Special | null;
  /** The named move's name, and how much each rival hit fills the bar. */
  move: string; fill: number;
  /** Most points you may give away for three stars, and for two. */
  stars: readonly [number, number];
};

const base: Omit<LevelDef, "world" | "rival" | "teach"> = {
  points: 5, window: 0.13, steady: 0,
  guard: { clear: 0.95, smash: 0.6, drop: 0.7, lift: 0.95 }, tire: 0.03,
  home: 268, run: 300, react: 0.16, reach: 26,
  high: { clear: 4, drop: 1, smash: 1, drive: 0 }, low: { lift: 4, drop: 1, drive: 0 }, smashSpeed: 900, kill: 0.3, slip: 0.04,
  wind: 0, gusts: 0, gust: 0, turn: 0, windSense: 1, fog: false, feint: 0, special: null, move: "", fill: 0,
  stars: [1, 3],
};
const level = (world: number, rival: Rival, teach: string, more: Partial<LevelDef>): LevelDef => ({ ...base, world, rival, teach, ...more });

export const LEVELS: readonly LevelDef[] = [
  // ---- আমাদের গলি: the swing, the smash, the drop, and the captain's jump ----
  level(0, { name: "পাশের বাসার ভাইয়া", obj: "পাশের বাসার ভাইয়াকে", short: "ভাইয়া", shirt: "#4f86c6", cap: "#7a2e2a", style: "সব উঁচু করে ফেরায়, তিন-চারবার পর হাঁপিয়ে যায়।" },
    "রিং সোনালি হলেই চাপো।", {
      points: 3, window: 0.22, steady: 2, guard: { clear: 1, smash: 1, drop: 1, lift: 1 }, tire: 0.3, run: 260,
      high: { clear: 1, drop: 0, smash: 0, drive: 0 }, low: { lift: 1, drop: 0, drive: 0 }, kill: 0, slip: 0, stars: [0, 1],
    }),
  level(0, { name: "তিনতলার আপু", obj: "তিনতলার আপুকে", short: "আপু", shirt: "#c4577a", cap: "#3b3a6b", style: "উঁচু তুলে দেয়। জোরের মার কম ধরে।" },
    "উঁচু শাটলে আঙুল নিচে টানো: স্ম্যাশ।", {
      window: 0.21, steady: 1, guard: { clear: 0.97, smash: 0.3, drop: 0.85, lift: 0.97 }, tire: 0.06,
      high: { clear: 1, drop: 0, smash: 0, drive: 0 }, low: { lift: 1, drop: 0, drive: 0 }, kill: 0, slip: 0.02,
    }),
  level(0, { name: "মোড়ের দোকানের মামা", obj: "মোড়ের দোকানের মামাকে", short: "মামা", shirt: "#6b8f3a", cap: "#5a4632", style: "পেছনে দাঁড়ায়, দৌড়ায় ধীরে। স্ম্যাশ ঠেকায় ভালো।" },
    "মামা পেছনে থাকলে আঙুল জালের দিকে টানো: ড্রপ।", {
      window: 0.2, guard: { clear: 0.97, smash: 0.8, drop: 0.85, lift: 0.97 }, tire: 0.035, home: 300, run: 150, react: 0.22, reach: 22,
      high: { clear: 3, drop: 1, smash: 0, drive: 0 }, low: { lift: 3, drop: 1, drive: 0 }, kill: 0, slip: 0.03,
    }),
  level(0, { name: "গলির ক্যাপ্টেন রনি ভাই", obj: "গলির ক্যাপ্টেন রনি ভাইকে", short: "রনি ভাই", shirt: "#c23b2a", cap: "#1b1716", style: "ছোট উঁচু পেলেই স্ম্যাশ। দম ভরলে লাফিয়ে মারে।" },
    "দম ভরলে রনি ভাই লাফিয়ে স্ম্যাশ মারে। ঠিক সময়ে চেপে তুলে দাও।", {
      points: 7, window: 0.19, guard: { clear: 0.96, smash: 0.55, drop: 0.7, lift: 0.96 }, tire: 0.03, run: 280,
      high: { clear: 3, drop: 1, smash: 1, drive: 0 }, low: { lift: 3, drop: 1, drive: 0 }, smashSpeed: 900, kill: 0.5, slip: 0.04,
      special: "jump", move: "রনি ভাইয়ের ঝাঁপ", fill: 0.25, stars: [2, 4],
    }),
  // ---- ছাদের কোর্ট: the wind ----
  level(1, { name: "পাশের ছাদের টুটুল", obj: "পাশের ছাদের টুটুলকে", short: "টুটুল", shirt: "#2f9e8f", cap: "#d8a43a", style: "উঁচু খেলে। বাতাস বোঝে।" },
    "বাতাস দেখো। পিঠে বাতাস থাকলে উঁচু মারলে বাইরে যায়।", {
      window: 0.19, guard: { clear: 0.96, smash: 0.55, drop: 0.75, lift: 0.96 }, tire: 0.035,
      high: { clear: 4, drop: 1, smash: 0, drive: 0 }, low: { lift: 4, drop: 1, drive: 0 }, kill: 0.15, slip: 0.04,
      wind: 22, turn: 2, windSense: 0.85,
    }),
  level(1, { name: "চিলেকোঠার রুমা আপা", obj: "চিলেকোঠার রুমা আপাকে", short: "রুমা আপা", shirt: "#8a5cc2", cap: "#f3ede1", style: "ধীরে খেলে, দমকা হাওয়ার অপেক্ষায় থাকে।" },
    "দমকা হাওয়া আসে হঠাৎ। কিনারায় তীর দেখলেই সাবধান।", {
      window: 0.185, guard: { clear: 0.96, smash: 0.55, drop: 0.75, lift: 0.96 }, tire: 0.03,
      high: { clear: 3, drop: 1, smash: 1, drive: 0 }, low: { lift: 3, drop: 1, drive: 0 }, kill: 0.25, slip: 0.04,
      wind: 14, gusts: 0.16, gust: 45, turn: 3, windSense: 0.8,
    }),
  level(1, { name: "ঘুড়ি-পাগল সাজু", obj: "ঘুড়ি-পাগল সাজুকে", short: "সাজু", shirt: "#e0a020", cap: "#2f4f7a", style: "চ্যাপ্টা জোরে মারে, শাটল নিচু দিয়ে আসে।" },
    "নিচু শাটলে স্ম্যাশ জালে যায়। তুলে দাও, নয়তো ড্রপ।", {
      window: 0.18, guard: { clear: 0.95, smash: 0.55, drop: 0.7, lift: 0.95 }, tire: 0.03, run: 320,
      high: { clear: 2, drop: 1, smash: 1, drive: 3 }, low: { lift: 2, drop: 1, drive: 3 }, kill: 0.3, slip: 0.05,
      wind: 16, gusts: 0.1, gust: 35, turn: 3, windSense: 0.8,
    }),
  level(1, { name: "ছাদের রাজা মিঠু ভাই", obj: "ছাদের রাজা মিঠু ভাইকে", short: "মিঠু ভাই", shirt: "#1d6f5f", cap: "#c2571a", style: "দম ভরলে দমকায় ভাসিয়ে উঁচু মারে।" },
    "ঘূর্ণি লব: বাতাসে ভেসে আসে। ছায়া দাগের বাইরে গেলে ছেড়ে দাও।", {
      points: 7, window: 0.175, guard: { clear: 0.95, smash: 0.5, drop: 0.7, lift: 0.95 }, tire: 0.03, run: 310,
      high: { clear: 3, drop: 1, smash: 1, drive: 1 }, low: { lift: 3, drop: 1, drive: 1 }, kill: 0.35, slip: 0.04,
      wind: 16, gusts: 0.12, gust: 40, turn: 3, windSense: 0.85, special: "float", move: "মিঠু ভাইয়ের ঘূর্ণি", fill: 0.25, stars: [2, 4],
    }),
  // ---- বাজারের গলি: the fog, the feint, the runner, the champion ----
  level(2, { name: "চায়ের দোকানের বল্টু", obj: "চায়ের দোকানের বল্টুকে", short: "বল্টু", shirt: "#8f5a2e", cap: "#e9e2cf", style: "উঁচু মারে, কুয়াশায় হারিয়ে যায় শাটল।" },
    "কুয়াশায় শাটল ঢাকা পড়ে। মাটিতে ছায়া দেখো, রিং আসে শেষে।", {
      window: 0.19, guard: { clear: 0.96, smash: 0.55, drop: 0.72, lift: 0.96 }, tire: 0.03,
      high: { clear: 4, drop: 1, smash: 1, drive: 0 }, low: { lift: 4, drop: 1, drive: 0 }, kill: 0.3, slip: 0.04, fog: true,
    }),
  level(2, { name: "কলেজের বড় ভাই", obj: "কলেজের বড় ভাইকে", short: "বড় ভাই", shirt: "#33415c", cap: "#a33a2a", style: "ধোঁকা দেয়: ভঙ্গি উঁচুর, মার ছোট।" },
    "ভঙ্গি দেখে ভুলো না। শাটল আর রিং দেখো।", {
      window: 0.185, guard: { clear: 0.95, smash: 0.55, drop: 0.7, lift: 0.95 }, tire: 0.03,
      high: { clear: 3, drop: 2, smash: 1, drive: 0 }, low: { lift: 3, drop: 2, drive: 0 }, kill: 0.35, slip: 0.04, fog: true, feint: 0.5,
    }),
  level(2, { name: "ভোরের দৌড়বিদ রিয়াজ", obj: "ভোরের দৌড়বিদ রিয়াজকে", short: "রিয়াজ", shirt: "#d0d6de", cap: "#2e6b3f", style: "সব ধরে ফেলে, কিন্তু ফিরতে দেরি করে।" },
    "আগে পেছনে পাঠাও, তারপর ড্রপ। ছুটতে ছুটতে রিয়াজ হাঁপায়।", {
      window: 0.18, guard: { clear: 0.97, smash: 0.62, drop: 0.8, lift: 0.97 }, tire: 0.03, run: 420, react: 0.12, reach: 30,
      high: { clear: 3, drop: 1, smash: 1, drive: 1 }, low: { lift: 3, drop: 1, drive: 1 }, kill: 0.35, slip: 0.04, fog: true, feint: 0.3,
    }),
  level(2, { name: "পাড়ার চ্যাম্পিয়ন শাহীন আপা", obj: "পাড়ার চ্যাম্পিয়ন শাহীন আপাকে", short: "শাহীন আপা", shirt: "#c2571a", cap: "#1b2238", style: "সব পারে। দম ভরলে টানা তিন মার।" },
    "তিন মার: উঁচু, ধোঁকার ড্রপ, তারপর স্ম্যাশ। তিনটাই ঠেকাও।", {
      points: 7, window: 0.175, guard: { clear: 0.96, smash: 0.55, drop: 0.72, lift: 0.96 }, tire: 0.025, run: 330,
      high: { clear: 3, drop: 2, smash: 1, drive: 1 }, low: { lift: 3, drop: 2, drive: 1 }, smashSpeed: 950, kill: 0.4, slip: 0.035,
      fog: true, feint: 0.4, special: "triple", move: "শাহীন আপার তিন মার", fill: 0.2, stars: [2, 4],
    }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value) || 1)) - 1];
export const isFinale = (def: LevelDef) => def.special !== null;
export const worldOf = (value: number) => levelDef(value).world;

/** Stars for a won match by points given away. Easy tops out at two. */
export function starsOf(given: number, value: number, mode: Mode = "n") {
  const [three, two] = levelDef(value).stars;
  return Math.min(MODE_INFO[mode].maxStars, starsFor(given, three, two, true));
}
/** Points to save for the next star, or 0 when there is no next star in this mode. */
export function toNextStar(given: number, value: number, mode: Mode = "n") {
  const earned = starsOf(given, value, mode);
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  const [three, two] = levelDef(value).stars;
  return given - (earned === 2 ? three : two);
}

/* ---------- the game before the rewrite: fifteen levels (five neighbours × three nights), first to 5 ---------- */
export const OLD_COUNT = 15;
export const OLD_POINTS = 5;
/** An old level as the new one at the same place on the ladder (1→1 … 15→12). Links and saved stars both use it. */
export const fromOld = (old: number) => Math.min(LEVEL_COUNT, Math.max(1, Math.ceil(old * LEVEL_COUNT / OLD_COUNT)));
