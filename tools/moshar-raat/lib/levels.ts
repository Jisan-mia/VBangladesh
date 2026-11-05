// The nights as data: four worlds of five, each রাত adding one thing, each world adding one kind of mosquito and ending
// with a named boss. game.ts turns a row plus a seed into a night; tests/levels.test.ts proves each one bot-clearable.

/** Mosquito kinds. A swarm member flies with its ঝাঁক; a boss flies one of the first three patterns. */
export const PLAIN = 0, FAST = 1, GHOST = 2, SWARM = 3, BOSS = 4;

export type Level = {
  name: string;
  /** The one new thing, as the start card and সব রাত say it. */
  line: string;
  world: number;
  /** Seconds until dawn. A boss holds the dawn back until it falls. */
  length: number;
  plain: number; fast: number; ghost: number;
  /** ঝাঁক units and how many mosquitoes fly in each. */
  swarms: number; swarm: number;
  /** 1 the window, 2 and the door, 3 and the ঘুলঘুলি. */
  entries: number;
  /** Dive speed (units a second) at the night's start and at its end, and the range of hover times before the tell. */
  speed: readonly [number, number];
  loiter: readonly [number, number];
  /** The মশারি's holes (x on its top edge); empty on a pillow night. */
  net: readonly number[];
  /** A bat that lands on the sleeping face and hits nothing is a slap, and counts as a bite. */
  face: boolean;
  /** The boss's hits to fall (0: no boss), the pattern it flies, and when in the night it comes. */
  boss: number; bossKind: number; bossAt: number;
};

export type Look = "loadshed" | "rain" | "humid" | "fog";
export type World = { name: string; look: Look; kind: string; boss: string; call: readonly [number, number, number] };

export const WORLDS: readonly World[] = [
  { name: "লোডশেডিংয়ের রাত", look: "loadshed", kind: "মশা", boss: "পালোয়ান মশা", call: [392, 494, 587] },
  { name: "বৃষ্টির রাত", look: "rain", kind: "চটপটে মশা", boss: "বিজলি মশা", call: [349, 440, 523] },
  { name: "গুমোট রাত", look: "humid", kind: "ঝাপসা মশা", boss: "ভূতুড়ে মশা", call: [330, 392, 466] },
  { name: "কুয়াশার রাত", look: "fog", kind: "ঝাঁক", boss: "মশার রাজা", call: [294, 370, 440] },
];
export const PER_WORLD = 5;

const base = { fast: 0, ghost: 0, swarms: 0, swarm: 0, entries: 3, net: [] as readonly number[], face: true, boss: 0, bossKind: PLAIN, bossAt: 0.3 };
const NET1 = [180] as const, NET2 = [110, 250] as const;

export const LEVELS: readonly Level[] = [
  { ...base, world: 0, name: "প্রথম মশা", line: "মশা আসে জানালা দিয়ে। মশার ওপর চাপো, ব্যাটে চট।", length: 10, plain: 5, entries: 1, speed: [115, 120], loiter: [1.3, 1.5], face: false },
  { ...base, world: 0, name: "দরজা খোলা", line: "আজ দরজা দিয়েও মশা ঢোকে।", length: 16, plain: 9, entries: 2, speed: [100, 105], loiter: [1.3, 1.5], face: false },
  { ...base, world: 0, name: "ঘুলঘুলি", line: "ঘুলঘুলি দিয়েও আসে। একসঙ্গে দুটো উড়বে।", length: 20, plain: 12, speed: [105, 110], loiter: [1.2, 1.4], face: false },
  { ...base, world: 0, name: "মুখে চড় না", line: "ঘুমন্ত মুখে ব্যাট নামালে, মশা না থাকলে, চড় লাগে। সেটাও এক কামড়।", length: 22, plain: 15, speed: [110, 115], loiter: [1.1, 1.3] },
  { ...base, world: 0, name: "পালোয়ান মশা", line: "মোটা এক মশা আসবে, তিন চাপে কাত। ও না পড়লে ভোর হবে না।", length: 24, plain: 16, speed: [112, 120], loiter: [1.0, 1.2], boss: 3, bossAt: 0.3 },

  { ...base, world: 1, name: "চটপটে মশা", line: "চটপটে মশা থেমে থেমে ছোটে। থামলেই চাপো। লাল ঝিলিক দিলে নামবে।", length: 22, plain: 9, fast: 4, speed: [112, 120], loiter: [1.1, 1.3] },
  { ...base, world: 1, name: "মশারি", line: "আজ খাটে মশারি। মশা খোঁজে মশারির ফুটোটা।", length: 24, plain: 10, fast: 5, speed: [115, 122], loiter: [1.0, 1.2], net: NET1, face: false },
  { ...base, world: 1, name: "দুই ফুটো", line: "মশারিতে দুটো ফুটো, দুই দিকে।", length: 26, plain: 10, fast: 6, speed: [118, 125], loiter: [1.0, 1.2], net: NET2, face: false },
  { ...base, world: 1, name: "ঝমঝম বৃষ্টি", line: "বৃষ্টিতে চটপটে মশা বেশি, নামেও তাড়াতাড়ি।", length: 26, plain: 9, fast: 8, speed: [115, 122], loiter: [1.1, 1.3] },
  { ...base, world: 1, name: "বিজলি মশা", line: "বিজলির মতো ছোটে, তিন চাপে কাত। থামলেই চাপো।", length: 28, plain: 10, fast: 7, speed: [124, 132], loiter: [0.9, 1.1], boss: 3, bossKind: FAST, bossAt: 0.3 },

  { ...base, world: 2, name: "ঝাপসা মশা", line: "ঝাপসা মশা আঁধারে মিশে থাকে, মাঝে মাঝে ঝিলিক দেয়। পিন-পিন শোনো।", length: 24, plain: 9, ghost: 7, speed: [118, 125], loiter: [1.0, 1.2] },
  { ...base, world: 2, name: "ঝাপসা আর চটপটে", line: "আজ দুই রকমই আসবে।", length: 26, plain: 8, fast: 4, ghost: 6, speed: [122, 130], loiter: [0.95, 1.15] },
  { ...base, world: 2, name: "ফুটোয় ঝাপসা", line: "মশারির দুই ফুটোয় ঝাপসা মশা।", length: 28, plain: 7, fast: 4, ghost: 9, speed: [122, 130], loiter: [0.95, 1.15], net: NET2, face: false },
  { ...base, world: 2, name: "লম্বা রাত", line: "আজ রাতটা লম্বা, ৩৪ সেকেন্ড।", length: 34, plain: 9, fast: 6, ghost: 6, speed: [122, 132], loiter: [0.9, 1.1] },
  { ...base, world: 2, name: "ভূতুড়ে মশা", line: "ঝিলিক দিয়েই মিলিয়ে যায়, তিন চাপে কাত।", length: 30, plain: 9, fast: 5, ghost: 5, speed: [128, 138], loiter: [0.9, 1.1], boss: 3, bossKind: GHOST, bossAt: 0.3 },

  { ...base, world: 3, name: "ঝাঁক", line: "মশা আসে ঝাঁক বেঁধে। ঝাঁকের মাঝখানে চাপো, এক চাপে কয়েকটা।", length: 26, plain: 10, swarms: 5, swarm: 3, speed: [120, 128], loiter: [1.0, 1.2] },
  { ...base, world: 3, name: "মশারিতে ঝাঁক", line: "মশারির ফুটোয় ঝাঁক নামে। পুরো ঝাঁক নামলে এক কামড়।", length: 28, plain: 7, fast: 4, swarms: 5, swarm: 4, speed: [125, 132], loiter: [0.95, 1.15], net: NET2, face: false },
  { ...base, world: 3, name: "সব রকম", line: "সাধারণ, চটপটে, ঝাপসা আর ঝাঁক, সব এক রাতে।", length: 32, plain: 8, fast: 5, ghost: 5, swarms: 3, swarm: 3, speed: [128, 136], loiter: [0.9, 1.1] },
  { ...base, world: 3, name: "ভোরের আগে", line: "ভোরের আগে মশা খুব জোরে নামে, ঝাঁকও বড়।", length: 34, plain: 8, fast: 5, ghost: 5, swarms: 4, swarm: 4, speed: [128, 138], loiter: [0.85, 1.05] },
  { ...base, world: 3, name: "মশার রাজা", line: "রাজা আসে ঝাঁক নিয়ে, চার চাপে কাত।", length: 36, plain: 6, fast: 5, ghost: 5, swarms: 5, swarm: 4, speed: [130, 140], loiter: [0.85, 1.05], boss: 4, bossAt: 0.25 },
];
export const LEVEL_COUNT = LEVELS.length;

export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, Math.round(level) || 1)) - 1];
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const worldOf = (level: number) => levelOf(level).world;
export const isFinale = (level: number) => isLevel(level) && levelOf(level).boss > 0;
export const isNet = (level: number) => levelOf(level).net.length > 0;
/** Every mosquito of the night, the boss counted as one. */
export const countOf = (level: number) => { const row = levelOf(level); return row.plain + row.fast + row.ghost + row.swarms * row.swarm + (row.boss ? 1 : 0); };
/** Zaps for the second star: three in four of the night's mosquitoes. */
export const needZaps = (level: number) => Math.ceil(countOf(level) * 0.75);

/** Bites before the sleeper wakes, per difficulty. The night never changes, so a friend's link is the same night on every mode. */
export const MODES = [
  { name: "সহজ", hearts: 5, line: "৫টা কামড়ে ঘুম ভাঙে। শিখতে শিখতে খেলো।" },
  { name: "স্বাভাবিক", hearts: 3, line: "৩টা কামড়ে ঘুম ভাঙে।" },
  { name: "কঠিন", hearts: 1, line: "একটা কামড়েই ঘুম ভাঙে।" },
] as const;
export const DEFAULT_MODE = 1;
export const heartsOf = (mode: number) => MODES[Math.max(0, Math.min(MODES.length - 1, mode))].hearts;

/** The first-run story, three panels over the dark room. */
export const STORY = [
  "লোডশেডিং। ফ্যান থেমে গেছে, ঘর অন্ধকার।",
  "ছোট ভাইটা ঘুমিয়ে পড়েছে। কানের কাছে পিন-পিন।",
  "ব্যাট হাতে পাহারা দাও। মশার ওপর চাপো, ভোর পর্যন্ত।",
] as const;
