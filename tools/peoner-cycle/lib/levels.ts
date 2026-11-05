// The 12 routes: three worlds of four. Each route adds exactly one new thing (its `line`, shown on the title, in the list
// and under পরের লেভেল) and ends at a named place; each world ends with a named finale with a bar at the top.
// Server-safe (no DOM): the link and share code read names and counts from here. lib/course.ts lays each route out from
// this data and a seed; tests/levels.test.ts proves every route fair and tunes it with headless bots.

/** e: সহজ, n: স্বাভাবিক, h: কঠিন. The road never changes with the mode, only how many bumps the ride survives. */
export const MODES = [
  { id: "e", name: "সহজ", line: "৫টা ধাক্কা পর্যন্ত চলবে। ধীরে শেখো।", limit: 5 },
  { id: "n", name: "স্বাভাবিক", line: "তৃতীয় ধাক্কায় সাইকেল থামবে।", limit: 3 },
  { id: "h", name: "কঠিন", line: "একটা ধাক্কা খেলেই শেষ।", limit: 1 },
] as const;
export const DEFAULT_MODE = 1;

export const WORLDS = [
  { id: "dawn", name: "ভোরের গ্রাম", call: [659, 784, 988] },
  { id: "noon", name: "দুপুরের নদীপাড়", call: [587, 740, 880] },
  { id: "dusk", name: "বর্ষার সন্ধ্যা", call: [494, 587, 740] },
] as const;
export type Look = (typeof WORLDS)[number]["id"];
export const PER_WORLD = 4;

/** A finale's named stretch at the end of the route: its gates, its herd of cows or the storm's big gusts. */
export type Boss = { name: string; kind: "house" | "walker" | "gust"; count: number };

export type LevelSpec = {
  /** The one new thing, as a short name, and in one line. */
  name: string; line: string;
  world: number;
  /** Where the route ends (the old routes' names). */
  place: string;
  meters: number;
  /** Speed in units a second at the start and at the place (24 units a মিটার). */
  speed: readonly [number, number];
  /** Gates waiting for a letter, and the deliveries for ★★ (★★★ is every gate). */
  houses: number; goal: number;
  /** Seconds between two rows of things on the road, at the start and near the end. */
  gap: readonly [number, number];
  /** Chance that a row blocks two lanes. */
  pairs: number;
  /** Which things stand on the road: 0 puddles, 1 puddles and goats, 2 carts and cows too. */
  kinds: number;
  /** Chance of a letter lying in a gap. */
  letters: number;
  /** How many of each moving or special thing, spread along the route. */
  vans: number; mud: number; walkers: number; dogs: number; gusts: number;
  /** The light fades: only this many units of road ahead can be seen (0 is all of it). */
  sight: number;
  boss?: Boss;
};

const route = (spec: Partial<LevelSpec> & Pick<LevelSpec, "name" | "line" | "world" | "place" | "meters" | "speed" | "houses" | "goal" | "gap">): LevelSpec => ({
  pairs: 0, kinds: 1, letters: 0, vans: 0, mud: 0, walkers: 0, dogs: 0, gusts: 0, sight: 0, ...spec,
});

export const LEVELS: readonly LevelSpec[] = [
  // ---- ভোরের গ্রাম: lanes, gates, spare letters, two-lane rows, the হাট ----
  route({ world: 0, name: "প্রথম চিঠি", place: "বটতলা", line: "বাঁয়ে-ডানে চাপো। গেটের পাশের লেন দিয়ে গেলেই চিঠি পৌঁছায়।", meters: 72, speed: [225, 240], houses: 3, goal: 2, gap: [0.78, 0.66], kinds: 0 }),
  route({ world: 0, name: "পথে পড়া চিঠি", place: "হাটখোলা", line: "রাস্তায় পড়া চিঠি তুলে নাও। ধাক্কা খেলে ঝোলার একটা চিঠি উড়ে যায়।", meters: 150, speed: [242, 273], houses: 4, goal: 3, gap: [0.69, 0.57], letters: 0.55 }),
  route({ world: 0, name: "ঠেলাগাড়ির সারি", place: "স্কুলপাড়া", line: "এবার দুই লেন একসাথে বন্ধ। ফাঁকা লেনটা আগেই খোঁজো।", meters: 200, speed: [277, 330], houses: 5, goal: 4, gap: [0.66, 0.51], pairs: 0.6, kinds: 2, letters: 0.35 }),
  route({ world: 0, name: "হাটবার", place: "হাট", line: "শেষ লেভেল: হাটের দিন। দুই পাশে দোকান, পরপর চিঠি। এপাশ-ওপাশ করো।", meters: 315, speed: [310, 380], houses: 9, goal: 7, gap: [0.63, 0.51], pairs: 0.6, kinds: 2, letters: 0.35, boss: { name: "হাটবার", kind: "house", count: 6 } }),
  // ---- দুপুরের নদীপাড়: a van coming at you, mud, a goat that walks across, the herd ----
  route({ world: 1, name: "উল্টো দিকের ভ্যান", place: "খেয়াঘাট", line: "সামনে থেকে ভ্যান আসছে, জোরে। ওপরের কিনারায় লাল তীর দেখলেই সরো।", meters: 295, speed: [353, 418], houses: 5, goal: 4, gap: [0.66, 0.54], pairs: 0.45, kinds: 2, letters: 0.3, vans: 4 }),
  route({ world: 1, name: "কাদা রাস্তা", place: "মিয়াবাড়ি", line: "কাদায় লেন বদলাতে সময় লাগে। আগেভাগে সরো।", meters: 285, speed: [374, 443], houses: 5, goal: 4, gap: [0.63, 0.51], pairs: 0.5, kinds: 2, letters: 0.3, vans: 2, mud: 3 }),
  route({ world: 1, name: "ছাগল পার হয়", place: "কলেজ রোড", line: "ছাগল হঠাৎ পাশের লেনে হাঁটা দেয়। মাথার ওপরের তীর দেখো।", meters: 410, speed: [398, 475], houses: 6, goal: 5, gap: [0.63, 0.51], pairs: 0.5, kinds: 2, letters: 0.3, vans: 2, mud: 2, walkers: 5 }),
  route({ world: 1, name: "গরুর পাল", place: "বড় বাজার", line: "শেষ লেভেল: গরুর পাল রাস্তা পার হচ্ছে। একটা একটা করে ফাঁক বুঝে যাও।", meters: 485, speed: [463, 552], houses: 6, goal: 5, gap: [0.63, 0.51], pairs: 0.5, kinds: 2, letters: 0.3, vans: 2, mud: 2, walkers: 2, boss: { name: "গরুর পাল", kind: "walker", count: 6 } }),
  // ---- বর্ষার সন্ধ্যা: less light, a dog behind you, gusts, the storm ----
  route({ world: 2, name: "সন্ধ্যা নামল", place: "রেলস্টেশন", line: "আলো কমে এসেছে, সামনেটা কম দেখা যায়। গেটের হারিকেন দেখে চিঠি দাও।", meters: 320, speed: [350, 413], houses: 6, goal: 5, gap: [0.66, 0.54], pairs: 0.5, kinds: 2, letters: 0.3, vans: 2, walkers: 2, sight: 330 }),
  route({ world: 2, name: "পেছনে কুকুর", place: "থানা সদর", line: "পেছন থেকে কুকুর তাড়া করে। নিচের কিনারায় দাগ দেখলে লেন বদলাও।", meters: 540, speed: [370, 435], houses: 6, goal: 5, gap: [0.66, 0.54], pairs: 0.5, kinds: 2, letters: 0.3, vans: 1, mud: 1, walkers: 2, dogs: 4, sight: 300 }),
  route({ world: 2, name: "দমকা হাওয়া", place: "নদীর ঘাট", line: "দমকা হাওয়া সাইকেলকে এক লেন ঠেলে দেয়। পাশের কিনারায় তীর দেখো, তারপর সামলাও।", meters: 610, speed: [382, 458], houses: 6, goal: 5, gap: [0.66, 0.54], pairs: 0.5, kinds: 2, letters: 0.3, vans: 1, walkers: 2, dogs: 2, gusts: 5, sight: 300 }),
  route({ world: 2, name: "কালবৈশাখী", place: "উপজেলা সদর", line: "শেষ লেভেল: ঝড় উঠেছে। তিনটা জোর ঝাপটা সামলে শেষ চিঠিটা পৌঁছাও।", meters: 700, speed: [443, 528], houses: 7, goal: 6, gap: [0.66, 0.54], pairs: 0.5, kinds: 2, letters: 0.3, vans: 1, mud: 1, walkers: 2, dogs: 2, gusts: 2, sight: 270, boss: { name: "কালবৈশাখী", kind: "gust", count: 3 } }),
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level))) - 1];
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const isFinale = (level: number) => Boolean(levelOf(level).boss);
/** Keys for the level list: 1–9, 0, -, =. */
export const LIST_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="] as const;

export const STORY = [
  "ভোর পাঁচটা। ডাকঘরে চিঠির বস্তা খোলা হলো।",
  "ঝোলায় চিঠি, হ্যান্ডেলে বেল। পিয়ন রওনা দিল।",
  "বাঁয়ে-ডানে চাপো। গেটের পাশের লেন দিয়ে গেলেই চিঠি পৌঁছাবে।",
] as const;
