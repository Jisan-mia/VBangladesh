// The levels as data: three মাঠ (worlds) of four neighbours, every level adding one thing, each মাঠ ending with a named
// finale. Server-safe (no React): the link, the share preview and the card read names from here.
// tests/levels.test.ts plays every level with headless bots and asserts the target rates.
import { starsFor } from "../../../shared/game-core";

export const SLUG = "danguli";
export const HITS = 3;
/** The most one hit can count; links carry 0–60 per hit. */
export const MAX_HIT = 60;

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × the band's height. */ band: number;
  /** × the কাঠি's fall (lower is slower). */ fall: number;
  /** × how far fielders reach. */ reach: number;
  /** Easy tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "হলুদ দাগ চওড়া, কাঠি ধীরে নামে, ফিল্ডার ধরে কম। তারা বড়জোর ২টা।", band: 1.3, fall: 0.85, reach: 0.7, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল খেলা। তিন মারেই মাপমতো চাপতে হবে।", band: 1, fall: 1, reach: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "হলুদ দাগ সরু। তারার হিসাব একই।", band: 0.78, fall: 1, reach: 1, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; line: string };
export const WORLDS: readonly World[] = [
  { name: "পাড়ার মাঠ", line: "বিকেলের মাঠ, আমগাছ আর পুকুর।" },
  { name: "নদীর চর", line: "সন্ধ্যার চরে বাতাস, পায়ের নিচে বালু।" },
  { name: "বর্ষার মাঠ", line: "মেঘলা আকাশ, ভেজা ঘাস, ঝিরঝির বৃষ্টি।" },
];
export const PER_WORLD = 4;

export type Rival = {
  /** As read on its own, as the object of a sentence ("রনিকে"), and the short form for the HUD and calls. */
  name: string; obj: string; short: string; shirt: string;
};

export type Special = "captain" | "longarm" | "storm";

export type LevelDef = {
  world: number;
  rival: Rival;
  /** The one new thing, in one line. */
  teach: string;
  /** The neighbour's score in ডাং: beat it to win. */
  target: number;
  /** Totals for two and three stars. */
  stars: readonly [number, number];
  /** How high the কাঠি pops (× the field's own heights) and how fast it falls. */
  pop: number; fall: number;
  /** Half-height of the yellow band (ডাং). */
  band: number;
  /** Fielders on the field (0–3), and the fielder rules: catch reach, run speed, reaction. */
  fielders: number; reach: number; run: number; react: number;
  pond: boolean; sand: boolean; wet: boolean;
  /** Strongest wind (ডাং/s² up high; it's weaker near the ground), chance of a gust on each hit, and the gust's push. */
  wind: number; gusts: number; gust: number;
  /** Fielders pace back and forth this far (ডাং). */
  walk: number;
  special: Special | null;
  /** The finale's named move. */
  move: string;
};

const base: Omit<LevelDef, "world" | "rival" | "teach" | "target" | "stars"> = {
  pop: 1, fall: 1, band: 0.3,
  fielders: 0, reach: 0.5, run: 0.9, react: 0.45,
  pond: false, sand: false, wet: false,
  wind: 0, gusts: 0, gust: 0, walk: 0, special: null, move: "",
};
const level = (world: number, rival: Rival, teach: string, target: number, stars: readonly [number, number], more: Partial<LevelDef> = {}): LevelDef =>
  ({ ...base, world, rival, teach, target, stars, ...more });

export const LEVELS: readonly LevelDef[] = [
  // ---- পাড়ার মাঠ: the strike, fielders, the pond, and the captain who runs ----
  level(0, { name: "পাশের বাসার টুটুল", obj: "পাশের বাসার টুটুলকে", short: "টুটুল", shirt: "#2f6fb0" },
    "একবার চাপো, কাঠি লাফাবে। নামার সময় হলুদ দাগে আবার চাপো।", 10, [80, 100], { band: 0.36 }),
  level(0, { name: "দোকানের রনি", obj: "দোকানের রনিকে", short: "রনি", shirt: "#e0a419" },
    "উঁচু মার ফিল্ডার ধরে ফেলে। ফিল্ডারের দাগের কাছে পড়বে মনে হলে একটু দেরিতে মারো, নিচু দিয়ে যাবে।", 48, [72, 86], { fielders: 2, band: 0.34 }),
  level(0, { name: "ক্লাসের মিলি", obj: "ক্লাসের মিলিকে", short: "মিলি", shirt: "#d0533a" },
    "পুকুরে পড়লে গোনা হয় পাড় পর্যন্ত। নিচু মার গড়িয়ে পানিতে যায়, উঁচু মারে পুকুর পার করো।", 40, [52, 64], { fielders: 2, pond: true, band: 0.33 }),
  level(0, { name: "পাড়ার ক্যাপ্টেন সাকিব ভাই", obj: "পাড়ার ক্যাপ্টেন সাকিব ভাইকে", short: "সাকিব ভাই", shirt: "#7a4fa3" },
    "সাকিব ভাই দৌড়ে যায় তোমার আগের কাঠি যেখানে পড়েছে সেখানে। একই দিকে দুবার মেরো না।", 36, [46, 56],
    { fielders: 2, pond: true, band: 0.32, special: "captain", move: "সাকিব ভাইয়ের দৌড়" }),
  // ---- নদীর চর: wind, sand, gusts and the long arm ----
  level(1, { name: "মাঝির ছেলে রাজু", obj: "মাঝির ছেলে রাজুকে", short: "রাজু", shirt: "#1f8a7a" },
    "গামছা দেখো। বাতাস পিঠে থাকলে উঁচু মার অনেক দূর যায়, সামনে থেকে এলে থেমে আসে।", 62, [84, 95], { fielders: 2, wind: 5, band: 0.32 }),
  level(1, { name: "চরের শিউলি", obj: "চরের শিউলিকে", short: "শিউলি", shirt: "#e07a9a" },
    "বালুতে কাঠি গড়ায় না, থেমে যায়। উঁচু মারে বালু পার করো।", 48, [58, 64], { fielders: 2, wind: 4, sand: true, band: 0.31 }),
  level(1, { name: "ঘুড়ি-পাগল জনি", obj: "ঘুড়ি-পাগল জনিকে", short: "জনি", shirt: "#e0a020" },
    "দমকা হাওয়ার আগে কিনারায় তীর দেখা যায়। তখন উঁচু মার অনেক সরে যায়।", 50, [60, 72], { fielders: 2, wind: 4, sand: true, gusts: 0.5, gust: 9, band: 0.31 }),
  level(1, { name: "চরের সর্দার বাবলু ভাই", obj: "চরের সর্দার বাবলু ভাইকে", short: "বাবলু ভাই", shirt: "#33415c" },
    "বাবলু ভাইয়ের হাত লম্বা, অনেক দূর থেকে ধরে। তাঁর বড় দাগের ভেতরে উঁচু মেরো না।", 42, [46, 52],
    { fielders: 2, wind: 4, sand: true, gusts: 0.4, gust: 8, band: 0.3, special: "longarm", move: "বাবলু ভাইয়ের লম্বা হাত" }),
  // ---- বর্ষার মাঠ: wet grass, a wet কাঠি, walking fielders, the storm ----
  level(2, { name: "চায়ের দোকানের বাবু", obj: "চায়ের দোকানের বাবুকে", short: "বাবু", shirt: "#8f5a2e" },
    "ভেজা ঘাসে কাঠি পিছলে অনেক দূর যায়। নিচু মারের সময় এটাই।", 62, [86, 94], { fielders: 2, pond: true, wet: true, band: 0.3 }),
  level(2, { name: "কলেজপড়ুয়া রিয়া আপু", obj: "কলেজপড়ুয়া রিয়া আপুকে", short: "রিয়া আপু", shirt: "#c4577a" },
    "ভেজা কাঠি কম লাফায়, নামে তাড়াতাড়ি। হলুদ দাগ পার হয় চোখের পলকে।", 64, [86, 94], { fielders: 2, pond: true, wet: true, pop: 0.82, fall: 1.25, band: 0.3 }),
  level(2, { name: "ক্রিকেট ক্লাবের শুভ ভাই", obj: "ক্রিকেট ক্লাবের শুভ ভাইকে", short: "শুভ ভাই", shirt: "#f1f1ea" },
    "ফিল্ডাররা হাঁটে। ওরা যখন দূরে, তখন কাঠি তোলো।", 60, [84, 94], { fielders: 3, pond: true, wet: true, pop: 0.9, fall: 1.12, walk: 4, band: 0.3 }),
  level(2, { name: "ওস্তাদ রহিম চাচা", obj: "ওস্তাদ রহিম চাচাকে", short: "রহিম চাচা", shirt: "#4a6b3a" },
    "কালবৈশাখী: প্রতি মারে বাতাস ঘোরে, দমকাও আসে। গামছা আর তীর দুটোই দেখো।", 66, [86, 94],
    { fielders: 3, pond: true, wet: true, pop: 0.9, fall: 1.12, walk: 3, wind: 6, gusts: 1, gust: 8, band: 0.3, special: "storm", move: "কালবৈশাখী" }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value) || 1)) - 1];
export const isFinale = (def: LevelDef) => def.special !== null;

/** Stars for a total: none unless it beats the neighbour, then 1–3. Easy tops out at two. */
export function starsOf(total: number, value: number, mode: Mode = "n") {
  const def = levelDef(value);
  if (total <= def.target) return 0;
  return Math.min(MODE_INFO[mode].maxStars, starsFor(total, def.stars[1], def.stars[0]));
}
/** The next total that earns something (one past the neighbour, then two and three stars), or 0 when there's nothing left in this mode. */
export function nextMark(total: number, value: number, mode: Mode = "n") {
  const def = levelDef(value), earned = starsOf(total, value, mode);
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  return [def.target + 1, def.stars[0], def.stars[1]][earned];
}

/* ---------- the game before the rewrite: ten levels, one neighbour each ---------- */
export const OLD_COUNT = 10;
/** An old level as the new one at the same place on the ladder (1→1, 5→6, 10→12). Links and saved stars both use it. */
export const fromOld = (old: number) => Math.min(LEVEL_COUNT, Math.max(1, Math.round(old * LEVEL_COUNT / OLD_COUNT)));
