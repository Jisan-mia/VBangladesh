// The levels as data: three places (worlds) of four courtyards, every level adding one thing, each place ending with a named
// finale. Server-safe (no React): the link, the share preview and the card read names from here.
// tests/levels.test.ts plays every level with headless bots and asserts the target rates.
import { starsFor } from "../../../shared/game-core";

export const SLUG = "latim";
/** The longest score a link may carry, in tenths of a second (99.9 s). */
export const MAX_SCORE = 999;

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × how fast the wobble builds. */ grow: number;
  /** How close to the lean's edge a touch counts as "ঠিক সময়ে" (|lean| at least this). */ good: number;
  /** Easy tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "সবুজ দাগ চওড়া, টলমল ধীরে বাড়ে। তারা বড়জোর ২টা।", grow: 0.85, good: 0.8, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। সবুজ মাথায় টোকা দিতে হবে।", grow: 1, good: 0.88, maxStars: 3 },
  h: { name: "কঠিন", line: "সবুজ দাগ সরু, টলমল তাড়াতাড়ি বাড়ে। তারার হিসাব একই।", grow: 1.08, good: 0.92, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; line: string; ground: string };
export const WORLDS: readonly World[] = [
  { name: "মাটির উঠান", line: "দুপুরের রোদ, আমগাছ আর মুরগির ছানা।", ground: "উঠান" },
  { name: "পাকা মেঝে", line: "বারান্দার লাল মেঝে, সন্ধ্যার আলো।", ground: "মেঝে" },
  { name: "টিনের চাল", line: "ভোরের চাল, ঘুড়ি আর হাওয়া।", ground: "চাল" },
];
export const PER_WORLD = 4;

/** What lands on the top. Side things slide in from an edge; floor things scroll down the floor towards the ring. */
export const K_LEAF = 0, K_PEBBLE = 1, K_HEN = 2, K_PUDDLE = 3, K_CRACK = 4, K_RIDGE = 5, K_BROOM = 6;
export const KINDS = 7;
export const KIND_NAME = ["পাতা", "নুড়ি", "মুরগি", "ভেজা দাগ", "ফাটল", "ঢেউ", "ঝাড়ু"] as const;
/** Slides in from the left or right edge (else scrolls down the floor). */
export const fromSide = (kind: number) => kind === K_LEAF || kind === K_PEBBLE || kind === K_HEN || kind === K_BROOM;

/** A scatter of one kind: `per10` of them every ten seconds on average, each knocking the wobble by `size`, some taking spin too. */
export type Source = { kind: number; per10: number; size: number; drag?: number };
/** A named finale's burst: `count` knocks `gap` seconds apart, every `every` seconds, from one side (alternating when `flip`). */
export type Wave = { kind: number; every: number; count: number; gap: number; size: number; flip: boolean };
export type Special = "hens" | "broom" | "storm";

export type LevelDef = {
  world: number;
  name: string;
  /** The one new thing, in one line. */
  teach: string;
  /** Spin lost a second; how fast the wobble builds. */
  friction: number; growth: number;
  /** Gusts that push the wobble (0 for none), and a slope that favours one side of the lean (0 for flat). */
  wind: number; slope: number;
  /** A tin ridge every this many seconds (0 for none). */
  ridge: number;
  sources: readonly Source[];
  wave: Wave | null;
  /** Seconds for 1 (clears), 2 and 3 stars. */
  stars: readonly [number, number, number];
  special: Special | null;
  /** The finale's named move. */
  move: string;
};

const base = { friction: 0.028, growth: 0.07, wind: 0, slope: 0, ridge: 0, sources: [] as readonly Source[], wave: null as Wave | null, special: null as Special | null, move: "" };
const level = (world: number, name: string, teach: string, stars: readonly [number, number, number], more: Partial<LevelDef> = {}): LevelDef =>
  ({ ...base, world, name, teach, stars, ...more });

export const LEVELS: readonly LevelDef[] = [
  // ---- মাটির উঠান: throw, steady, leaves, pebbles, the hens ----
  level(0, "উঠানের মাঝখান", "আঙুল নিচে টানো বা চেপে ধরে ছাড়ো। টলে গেলে সবুজ মাথায় টোকা দাও।", [4, 12, 20]),
  level(0, "শুকনো পাতা", "পাতা উড়ে আসছে। কিনারার তীর দেখো, লাগলে লাটিম একটু টলবে।", [6, 13, 21], { sources: [{ kind: K_LEAF, per10: 3, size: 0.06 }] }),
  level(0, "নুড়ি পাথর", "নুড়ি গড়িয়ে আসছে। লাগলে বেশি টলে, আগে একটা টোকা দিয়ে রাখো।", [8, 14, 21], { growth: 0.075, sources: [{ kind: K_PEBBLE, per10: 3, size: 0.11 }] }),
  level(0, "মুরগির দৌড়", "মুরগির সারি ছুটে আসে, এক সেকেন্ডে তিনটে ধাক্কা। আসার আগে টোকা দিয়ে নাও।", [9, 15, 21], {
    growth: 0.08, sources: [{ kind: K_PEBBLE, per10: 1.5, size: 0.08 }],
    wave: { kind: K_HEN, every: 6.5, count: 3, gap: 0.35, size: 0.08, flip: false }, special: "hens", move: "মুরগির দৌড়",
  }),
  // ---- পাকা মেঝে: slippery, wet patches, cracks, the broom ----
  level(1, "লাল মেঝে", "পিছলা মেঝে: ঘোরে বেশি, কিন্তু টলেও তাড়াতাড়ি। টোকা দিতে দেরি কোরো না।", [12, 17, 23], { friction: 0.021, growth: 0.115 }),
  level(1, "মোছা মেঝে", "ভেজা দাগের ওপর দিয়ে গেলে ঘোরা কমে যায়। দাগ আসছে দেখলে আগে টোকা দাও।", [12, 16, 20], { friction: 0.021, growth: 0.11, sources: [{ kind: K_PUDDLE, per10: 2.5, size: 0.04, drag: 0.05 }] }),
  level(1, "মেঝের ফাটল", "ফাটলে পড়লে জোরে ঝাঁকি লাগে। আসার আগে লাটিম সোজা রাখো।", [12, 18, 24], { friction: 0.021, growth: 0.105, sources: [{ kind: K_CRACK, per10: 3, size: 0.12 }] }),
  level(1, "ঝাড়ুর টান", "ঠাকুমার ঝাড়ু একবার এদিক, একবার ওদিক থেকে আসে। একটাই ধাক্কা, কিন্তু বড়।", [12, 18, 23], {
    friction: 0.021, growth: 0.105, sources: [{ kind: K_CRACK, per10: 1.5, size: 0.1 }],
    wave: { kind: K_BROOM, every: 6, count: 1, gap: 0, size: 0.3, flip: true }, special: "broom", move: "ঝাড়ুর টান",
  }),
  // ---- টিনের চাল: ridges, wind, a slope, the storm ----
  level(2, "ঢেউ-তোলা চাল", "ঢেউয়ে একটু পরপর ঝাঁকি। তালটা ধরে নাও।", [13, 18, 22], { friction: 0.025, growth: 0.095, ridge: 2.2 }),
  level(2, "চালে বাতাস", "হাওয়া ঠেলছে। কিনারার তীর যেদিকে, ঠেলাও সেদিকে।", [13, 18, 22], { friction: 0.025, growth: 0.09, ridge: 2.6, wind: 0.15 }),
  level(2, "ঢালু চাল", "চাল ঢালু, লাটিম একদিকে হেলে। সবুজ শুধু নিচের দিকে।", [13, 18, 22], { friction: 0.025, growth: 0.09, ridge: 2.8, wind: 0.1, slope: 0.3 }),
  level(2, "কালবৈশাখী", "ঢেউ, হাওয়া আর পাতার ঝাপটা, সব একসাথে।", [14, 18, 21], {
    friction: 0.025, growth: 0.095, ridge: 2.4, wind: 0.22, sources: [{ kind: K_LEAF, per10: 3, size: 0.05 }],
    wave: { kind: K_LEAF, every: 7.5, count: 4, gap: 0.25, size: 0.05, flip: true }, special: "storm", move: "কালবৈশাখী",
  }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value) || 1)) - 1];
export const isFinale = (def: LevelDef) => def.special !== null;

/** Stars for a score in tenths: none below the first mark, then 1–3. Easy tops out at two. */
export function starsOf(tenths: number, value: number, mode: Mode = "n") {
  const [one, two, three] = levelDef(value).stars;
  if (tenths < one * 10) return 0;
  return Math.min(MODE_INFO[mode].maxStars, starsFor(tenths, three * 10, two * 10));
}
/** The next mark in tenths (clear, 2 stars, 3 stars), or 0 when there's nothing left in this mode. */
export function nextMark(tenths: number, value: number, mode: Mode = "n") {
  const marks = levelDef(value).stars, earned = starsOf(tenths, value, mode);
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  return marks[earned] * 10;
}

/* ---------- the game before the rewrite: nine levels on three surfaces ---------- */
export const OLD_COUNT = 9;
/** An old level as the new one at the same place on the ladder (1→1, 2→3, 5→7, 9→12). Links and saved stars both use it. */
export const fromOld = (old: number) => Math.min(LEVEL_COUNT, Math.max(1, Math.round(old * LEVEL_COUNT / OLD_COUNT)));
