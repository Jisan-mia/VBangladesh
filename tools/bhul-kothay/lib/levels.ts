// The ladder as data: six worlds of five levels. Each level teaches exactly one new thing (`fresh`, said on its start card),
// and each world ends on a named finale. Pure and server-safe. The star times are tuned by the bots in tests/levels.test.ts.
import type { World } from "./scenes";

/** What can differ between the two pictures. The first five are the old game's; the rest arrive one world at a time. */
export type Kind = "missing" | "color" | "count" | "flip" | "size" | "shift" | "turn" | "text" | "shade" | "still";
export type TemplateId = "fruit" | "tea" | "veg" | "yard" | "field" | "ghat" | "lane";
/** The one new thing on a level: a kind of difference, or a change to the hunt itself. */
export type Fresh = Kind | "more" | "small" | "moving" | "dark" | "finale";

export type Stage = {
  level: number;
  world: number;
  template: TemplateId;
  sky: World;
  /** How many differences. */
  count: number;
  /** How often each kind is tried (missing kinds are never used). */
  kinds: Partial<Record<Kind, number>>;
  /** Kinds that must appear at least once: the one this level teaches. */
  must: readonly Kind[];
  fresh: Fresh;
  lesson: string;
  /** +1 picks big things first, −1 small things first. */
  big: number;
  /** Things sway, bob and drift (the river world on). `onMovers` is the share of differences put on moving things. */
  movers: boolean;
  onMovers: number;
  /** লোডশেডিং: the pictures are dark except where the হারিকেন shines. */
  dark: boolean;
  /** How bold a colour change is at least (0–441), and how close a shade may come. */
  bold: number;
  /** Seconds for ★★★ and ★★ (hint seconds count). */
  three: number;
  two: number;
  finale: string;
};

export type WorldInfo = {
  name: string;
  /** "বাজারের", for lines like "বাজারের পাঁচ ছবি শেষ". */
  of: string;
  twist: string;
  finale: string;
  /** UI colours: the world's ink, a deep shade, the paper behind the pictures, and the frame. */
  ink: string; deep: string; paper: string; frame: string;
};

export const WORLDS: readonly WorldInfo[] = [
  { name: "সকালের বাজার", of: "বাজারের", twist: "যা নেই, যার রং বদলেছে, যা কম", finale: "হাটবার", ink: "#c2412d", deep: "#8a2a1c", paper: "#fbf3e2", frame: "#3b2a20" },
  { name: "গ্রামের দুপুর", of: "গ্রামের", twist: "উল্টো, ছোট, সরে যাওয়া", finale: "নানাবাড়ির উঠান", ink: "#2f7d4a", deep: "#1d5431", paper: "#f2f5e4", frame: "#2a3a22" },
  { name: "নদীর ঘাট", of: "নদীর", twist: "সব দোলে, ভাসে, ওড়ে", finale: "খেয়াঘাট", ink: "#1f6f9c", deep: "#134a69", paper: "#eaf4f7", frame: "#1d3340" },
  { name: "শহরের বিকেল", of: "শহরের", twist: "হেলে পড়া জিনিস, বদলে যাওয়া লেখা", finale: "রিকশার জ্যাম", ink: "#c26a1a", deep: "#86460c", paper: "#fbf0e1", frame: "#3a2614" },
  { name: "গোধূলি", of: "গোধূলির", twist: "রং শুধু একটু হালকা বা গাঢ়", finale: "সন্ধ্যার হাট", ink: "#7a3f98", deep: "#532a69", paper: "#f5eef7", frame: "#2e2038" },
  { name: "লোডশেডিং", of: "লোডশেডিংয়ের", twist: "কারেন্ট নেই, হাতে শুধু হারিকেন", finale: "পুরো পাড়া অন্ধকার", ink: "#d99a1e", deep: "#8a5f0a", paper: "#f7f0dc", frame: "#14182c" },
];
export const PER_WORLD = 5;

const BASIC = { missing: 3, color: 3, count: 2 } as const;
const VILLAGE = { missing: 2, color: 2, count: 1.5, flip: 2, size: 1.5, shift: 1.5 } as const;
const TOWN = { missing: 1.5, color: 1.5, count: 1.5, flip: 1.5, size: 1, shift: 1.5, turn: 2, text: 2 } as const;
const DUSK = { ...TOWN, color: 1, shade: 3 } as const;

type Row = Omit<Stage, "level" | "world" | "movers" | "onMovers" | "dark" | "finale" | "must"> & Partial<Pick<Stage, "movers" | "onMovers" | "dark" | "must">>;
const W1: Row[] = [
  { template: "fruit", sky: 0, count: 3, kinds: { missing: 1 }, fresh: "missing", big: 1, bold: 150, three: 15, two: 30,
    lesson: "এক ছবিতে আছে, আরেকটায় নেই। যেটা নেই, তার জায়গায় চাপো।" },
  { template: "tea", sky: 0, count: 4, kinds: { missing: 2, color: 3 }, must: ["color"], fresh: "color", big: 0.8, bold: 140, three: 20, two: 40,
    lesson: "রংও বদলায়। একই জিনিস, অন্য ছবিতে অন্য রং।" },
  { template: "veg", sky: 0, count: 4, kinds: { missing: 1.5, color: 2, count: 3 }, must: ["count"], fresh: "count", big: 0.6, bold: 130, three: 35, two: 75,
    lesson: "গুনে দেখো: এক ছবিতে কয়েকটা কম।" },
  { template: "fruit", sky: 0, count: 5, kinds: { ...BASIC, count: 3 }, fresh: "more", big: -0.1, bold: 125, three: 25, two: 70,
    lesson: "এবার পাঁচটা অমিল: নেই, রং আর কম, তিন রকমই।" },
  { template: "veg", sky: 0, count: 6, kinds: BASIC, fresh: "finale", big: 0.2, bold: 120, three: 35, two: 90,
    lesson: "হাটের দিন, দোকান ভরা। ছয়টা অমিল লুকিয়ে আছে।" },
];
const W2: Row[] = [
  { template: "yard", sky: 1, count: 5, kinds: { ...BASIC, flip: 3 }, must: ["flip"], fresh: "flip", big: 0.4, bold: 125, three: 30, two: 65,
    lesson: "একটা জিনিস অন্য দিকে মুখ ফিরিয়েছে।" },
  { template: "field", sky: 1, count: 5, kinds: { ...BASIC, flip: 1.5, size: 3 }, must: ["size"], fresh: "size", big: -0.1, bold: 120, three: 25, two: 55,
    lesson: "একটা জিনিস অন্য ছবিতে ছোট হয়ে গেছে।" },
  { template: "yard", sky: 1, count: 5, kinds: { ...VILLAGE, shift: 3 }, must: ["shift"], fresh: "shift", big: 0.2, bold: 115, three: 40, two: 80,
    lesson: "একটা জিনিস একটু জায়গা বদলেছে।" },
  { template: "field", sky: 1, count: 6, kinds: VILLAGE, fresh: "more", big: 0.1, bold: 110, three: 30, two: 65,
    lesson: "ছয়টা অমিল, এ পর্যন্ত শেখা সব রকম।" },
  { template: "yard", sky: 1, count: 7, kinds: VILLAGE, fresh: "finale", big: 0, bold: 105, three: 40, two: 95,
    lesson: "দুপুরের উঠান, রোদে জামা শুকায়। সাতটা অমিল।" },
];
const W3: Row[] = [
  { template: "ghat", sky: 1, count: 5, kinds: VILLAGE, fresh: "moving", big: 0.3, bold: 115, three: 35, two: 85, movers: true, onMovers: 0.2,
    lesson: "নৌকা দোলে, হাঁস ভাসে। নড়লেও অমিলটা একই জায়গায় থাকে।" },
  { template: "field", sky: 1, count: 5, kinds: VILLAGE, fresh: "more", big: 0.2, bold: 110, three: 30, two: 70, movers: true, onMovers: 0.6,
    lesson: "যা নড়ছে, অমিল এবার বেশির ভাগ তার মধ্যেই।" },
  { template: "ghat", sky: 1, count: 5, kinds: { ...VILLAGE, still: 3 }, must: ["still"], fresh: "still", big: 0.2, bold: 110, three: 35, two: 85, movers: true, onMovers: 0.4,
    lesson: "এক ছবিতে দোলে, অন্য ছবিতে সেটা থেমে আছে।" },
  { template: "yard", sky: 1, count: 6, kinds: { ...VILLAGE, still: 1.5 }, fresh: "small", big: -0.4, bold: 105, three: 50, two: 105, movers: true, onMovers: 0.4,
    lesson: "দড়ির জামা দোলে। এবার ছোট ছোট জিনিসে চোখ রাখো।" },
  { template: "ghat", sky: 1, count: 7, kinds: { ...VILLAGE, still: 1.5 }, fresh: "finale", big: 0, bold: 100, three: 60, two: 125, movers: true, onMovers: 0.45,
    lesson: "খেয়া ছাড়বে ছাড়বে। ঘাট জুড়ে সব নড়ছে, সাতটা অমিল।" },
];
const W4: Row[] = [
  { template: "lane", sky: 2, count: 5, kinds: { ...VILLAGE, turn: 3 }, must: ["turn"], fresh: "turn", big: 0.2, bold: 110, three: 35, two: 75,
    lesson: "একটা জিনিস একটু হেলে আছে।" },
  { template: "tea", sky: 2, count: 5, kinds: { ...VILLAGE, turn: 1.5, text: 3 }, must: ["text"], fresh: "text", big: 0.2, bold: 105, three: 35, two: 80,
    lesson: "সাইনবোর্ডের লেখাও বদলায়। দুই ছবিতে মিলিয়ে পড়ো।" },
  { template: "fruit", sky: 2, count: 6, kinds: TOWN, fresh: "more", big: 0, bold: 100, three: 40, two: 90,
    lesson: "ছয়টা অমিল: বাঁকা, লেখা, উল্টো, সব মিলিয়ে।" },
  { template: "lane", sky: 2, count: 6, kinds: TOWN, fresh: "small", big: -0.6, bold: 100, three: 50, two: 100,
    lesson: "বড় জিনিসে এবার কম। ছোট জিনিসগুলো ভালো করে দেখো।" },
  { template: "lane", sky: 2, count: 7, kinds: TOWN, fresh: "finale", big: -0.2, bold: 95, three: 50, two: 100,
    lesson: "বিকেলের গলি, রিকশা আর দোকান। সাতটা অমিল।" },
];
const W5: Row[] = [
  { template: "fruit", sky: 3, count: 5, kinds: { ...DUSK, shade: 4 }, must: ["shade"], fresh: "shade", big: 0, bold: 95, three: 40, two: 85,
    lesson: "রংটা পুরো বদলায়নি, একটু হালকা বা গাঢ় হয়েছে।" },
  { template: "ghat", sky: 3, count: 6, kinds: { ...DUSK, still: 1 }, fresh: "moving", big: 0.1, bold: 95, three: 70, two: 140, movers: true, onMovers: 0.4,
    lesson: "আবার নৌকা দোলে। দুলতে থাকা জিনিসের রংও বদলাতে পারে।" },
  { template: "yard", sky: 3, count: 6, kinds: DUSK, fresh: "small", big: -0.5, bold: 90, three: 55, two: 100,
    lesson: "ছোট জিনিসের হালকা রং। চোখ কাছে আনো।" },
  { template: "tea", sky: 3, count: 7, kinds: DUSK, fresh: "more", big: -0.1, bold: 90, three: 65, two: 135,
    lesson: "সাতটা অমিল, গোধূলির আলোয়।" },
  { template: "veg", sky: 3, count: 7, kinds: { ...DUSK, shade: 4 }, fresh: "finale", big: -0.3, bold: 85, three: 65, two: 140,
    lesson: "সন্ধ্যার হাট, হারিকেন জ্বলছে। সাতটা অমিল, বেশির ভাগ রঙে।" },
];
const W6: Row[] = [
  { template: "tea", sky: 3, count: 5, kinds: VILLAGE, fresh: "dark", big: 0.3, bold: 110, three: 50, two: 105, dark: true,
    lesson: "কারেন্ট নেই! আলোর বাইরে চাপলে হারিকেন সেখানে সরে। আলোর ভেতরে অমিল খোঁজো।" },
  { template: "lane", sky: 3, count: 5, kinds: TOWN, fresh: "text", big: 0.2, bold: 105, three: 70, two: 150, dark: true, must: ["text"],
    lesson: "অন্ধকারে সাইনবোর্ড পড়ো। হারিকেন ধরে দেখো।" },
  { template: "veg", sky: 3, count: 6, kinds: DUSK, fresh: "shade", big: 0, bold: 95, three: 90, two: 165, dark: true, must: ["shade"],
    lesson: "হারিকেনের আলোয় হালকা রং। আলো সরিয়ে সরিয়ে দেখো।" },
  { template: "ghat", sky: 3, count: 6, kinds: { ...TOWN, still: 1.5 }, fresh: "moving", big: 0, bold: 100, three: 100, two: 180, dark: true, movers: true, onMovers: 0.4,
    lesson: "রাতের ঘাট। অন্ধকারেও নৌকা দোলে।" },
  { template: "yard", sky: 3, count: 7, kinds: { ...DUSK, still: 1 }, fresh: "finale", big: -0.2, bold: 90, three: 110, two: 215, dark: true, movers: true, onMovers: 0.35,
    lesson: "পুরো পাড়া অন্ধকার। সাতটা অমিল পেলে কারেন্ট আসবে।" },
];

export const STAGES: readonly Stage[] = [W1, W2, W3, W4, W5, W6].flatMap((rows, world) => rows.map((row, index): Stage => ({
  movers: false, onMovers: 0, dark: false, must: [], ...row,
  level: world * PER_WORLD + index + 1, world, finale: index === PER_WORLD - 1 ? WORLDS[world].finale : "",
})));
export const STAGE_COUNT = STAGES.length;

export const isStage = (level: number) => Number.isInteger(level) && level >= 1 && level <= STAGE_COUNT;
export const stageAt = (level: number) => STAGES[Math.min(STAGE_COUNT, Math.max(1, Math.round(level))) - 1];
export const worldOf = (level: number) => stageAt(level).world;
export const worldStart = (world: number) => world * PER_WORLD + 1;
export const isFinale = (level: number) => Boolean(stageAt(level).finale);
/** Seconds a hint step adds to the clock. */
export const HINT_SECONDS = 10;
/** Wrong taps that still allow ★★★, and ★★. */
export const WRONG_FOR = { three: 2, two: 5 } as const;
/** Level 1's first play: a fixed seed whose three missing things are big and plain. */
export const TEACH_SEED = 20_261_104;

/** The template names, as the HUD says them. */
export const PLACES: Readonly<Record<TemplateId, string>> = {
  fruit: "ফলের দোকান", tea: "চায়ের দোকান", veg: "সবজির বাজার", yard: "গ্রামের উঠান", field: "ধানখেত", ghat: "নদীর ঘাট", lane: "রিকশার গলি",
};
