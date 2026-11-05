// The ladder: 40 levels in four মেলা, authored by hand. Each level brings exactly one new thing (its `teach` line says it).
// The seed, the move limit and the star scores for each come from scripts/make-levels.ts (lib/ladder-seeds.ts).
// Goal targets: a colour 0..5 (lift that many), SPARKLE / RAINBOW (make that many), DUST_GOAL (wipe layers), FREE_GOAL (free tied bangles).
import { DUST_GOAL as D, FREE_GOAL as F, RAINBOW as R, SPARKLE as S } from "./board";
import { SEEDS } from "./ladder-seeds";

export type Goal = readonly [target: number, count: number];
export type Def = {
  name: string; teach: string; colours: number; goals: readonly Goal[];
  /** Tied bangles at the start, dust cells (the first `thick` two layers deep), a new তালা every `drop` moves, and whether the moves are tight. */
  locks: number; dust: number; thick: number; drop: number; tight: boolean;
};
export type Seeded = { seed: number; moves: number; three: number; two: number; bot: number; botScore: number };
/** What the rules need to play a level, new or old. */
export type Spec = Omit<Def, "name" | "teach"> & Seeded;

const L = (name: string, teach: string, colours: number, goals: Goal[], more: Partial<Pick<Def, "locks" | "dust" | "thick" | "drop" | "tight">> = {}): Def =>
  ({ name, teach, colours, goals, locks: 0, dust: 0, thick: 0, drop: 0, tight: false, ...more });

export const DEFS: readonly Def[] = [
  // ১ গ্রামের মেলা
  L("প্রথম গোছা", "পাশাপাশি দুটো চুড়ি বদলাও। এক রঙের তিনটা এক লাইনে এলেই উঠে যায়।", 4, [[0, 8]]),
  L("পাঁচ রং", "এবার পাঁচ রঙের চুড়ি। লক্ষ্য শুধু সবুজ।", 5, [[1, 12]]),
  L("পরপর", "চুড়ি উঠলে ওপর থেকে নতুন নামে। নিজে নিজে মিললে পয়েন্ট দ্বিগুণ, তিনগুণ।", 5, [[2, 16]]),
  L("দুই লক্ষ্য", "দুটো লক্ষ্য একসঙ্গে। দুটোই হলে লেভেল পার।", 5, [[0, 12], [3, 12]]),
  L("ঝিকমিক", "এক রঙের চারটা তুললে সোনালি পাড়ের ঝিকমিক চুড়ি হয়। একটা বানাও।", 5, [[S, 1]]),
  L("ঝিকমিকের ঝলক", "ঝিকমিক তুললে ওর সারি আর কলামে দুই ঘর করে উঠে যায়।", 5, [[4, 20]]),
  L("চাল কম", "এবার চাল কম। যে চালে বেশি ওঠে, সেটা বেছে নাও।", 5, [[0, 16], [2, 16]], { tight: true }),
  L("বড় গোছা", "লক্ষ্য বড়। ঝিকমিক বানিয়ে কাজে লাগাও।", 5, [[3, 30]]),
  L("তিন লক্ষ্য", "তিনটা লক্ষ্য একসঙ্গে। কোনটায় কত বাকি, ওপরে দেখো।", 5, [[0, 12], [1, 12], [4, 12]]),
  L("বড় বায়না", "পাশের গাঁয়ের বিয়ের বায়না। দুই রঙের চুড়ি আর দুটো ঝিকমিক।", 5, [[0, 22], [2, 22], [S, 2]]),
  // ২ বৈশাখী মেলা
  L("রংধনু", "এক লাইনে পাঁচটা তুললে রংধনু চুড়ি। ওটা যে রঙের সঙ্গে বদলাবে, সেই রঙের সব উঠে যায়।", 5, [[R, 1]]),
  L("রংধনুর টান", "রংধনু দিয়ে এক রঙের অনেকগুলো একবারে তোলো।", 5, [[3, 32]]),
  L("তালা", "তালা-বাঁধা চুড়ি নড়ে না। পাশে একই রঙের দুটো এনে মেলাও।", 5, [[F, 3]], { locks: 3 }),
  L("তালা আর রং", "তালা খুলতে খুলতে লাল চুড়িও তোলো।", 5, [[F, 3], [0, 18]], { locks: 4 }),
  L("ঝিকমিকে তালা", "ঝিকমিকের ঝলক তালা-বাঁধা চুড়িও তুলে নেয়।", 5, [[S, 2], [F, 5]], { locks: 5 }),
  L("ছয় তালা", "এবার ছয়টা তালা। কোনটা কোথায়, আগে দেখে নাও।", 5, [[F, 6]], { locks: 6 }),
  L("তালায় চাল কম", "চাল কম, তালা বেশি। এক চালে দুটো কাজ সারো।", 5, [[F, 5], [2, 16]], { locks: 5, tight: true }),
  L("রংধনু দিয়ে তালা", "রংধনু একই রঙের তালা-বাঁধা চুড়িও তোলে।", 5, [[R, 1], [F, 5]], { locks: 5 }),
  L("তিন লক্ষ্য, তালা", "তিন লক্ষ্যের একটা তালা খোলা।", 5, [[1, 16], [3, 16], [F, 4]], { locks: 6 }),
  L("নববর্ষের ভিড", "দোকানে ভিড়। আটটা তালা, একটা রংধনু আর বড় লক্ষ্য।", 5, [[F, 8], [0, 20], [R, 1]], { locks: 8 }),
  // ৩ চুড়িপট্টি
  L("সাদা চুড়ি", "এবার ছয় রঙের চুড়ি। নতুন রং সাদা, গায়ে রঙিন পাথর।", 6, [[5, 14]]),
  L("সাদা আর লাল", "সাদা আর লাল, দুটোই তোলো।", 6, [[0, 18], [5, 18]]),
  L("ধুলো", "মখমলে ধুলো পড়েছে। ওর ওপরের চুড়ি তুললে ধুলো মোছে।", 6, [[D, 8]], { dust: 10 }),
  L("ধুলো আর রং", "ধুলো মোছার সঙ্গে নীল চুড়িও তোলো।", 6, [[D, 10], [2, 16]], { dust: 12 }),
  L("ঘন ধুলো", "ঘন ধুলো দুবার তুলতে হয়।", 6, [[D, 13]], { dust: 12, thick: 4 }),
  L("ধুলো আর তালা", "ধুলোর সঙ্গে তালাও আছে।", 6, [[D, 10], [F, 3]], { dust: 12, locks: 3 }),
  L("রংধনুর ঝাড়ন", "রংধনু এক রঙের সব ঘর ঝেড়ে দেয়।", 6, [[D, 16], [R, 1]], { dust: 16, thick: 4 }),
  L("ধুলোয় চাল কম", "চাল কম। যেখানে ধুলো বেশি, সেখান থেকে শুরু করো।", 6, [[D, 12], [4, 14]], { dust: 14, tight: true }),
  L("ধুলো, তালা, রং", "তিন কাজ একসঙ্গে: ধুলো মোছা, তালা খোলা, সবুজ তোলা।", 6, [[D, 12], [F, 3], [1, 12]], { dust: 12, thick: 4, locks: 3 }),
  L("বিয়ের বায়না", "চুড়িপট্টির শেষ দোকান। ঘন ধুলো, তালা আর দুটো ঝিকমিক।", 6, [[D, 22], [F, 4], [S, 2]], { dust: 18, thick: 8, locks: 4 }),
  // ৪ রাতের মেলা
  L("তালা পড়ে", "প্রতি সাত চালে একটা চুড়িতে তালা পড়ে। কোথায়, আগের চালে লাল বৃত্তে দেখা যায়।", 6, [[1, 18]], { drop: 7 }),
  L("পড়া তালা খোলো", "তালা পড়তে থাকে, তুমি খুলতে থাকো।", 6, [[F, 2], [3, 10]], { drop: 7 }),
  L("তাড়াতাড়ি তালা", "এবার পাঁচ চালে একটা তালা পড়ে।", 6, [[0, 20]], { drop: 5 }),
  L("রাতের ধুলো", "তালা পড়ার ফাঁকে ধুলো মোছো।", 6, [[D, 10], [2, 16]], { drop: 6, dust: 12 }),
  L("রাতের ঝিকমিক", "ঝিকমিকের ঝলকে একসঙ্গে অনেক তালা সাফ।", 6, [[S, 3], [4, 18]], { drop: 6 }),
  L("শুরুতেই তালা", "শুরু থেকেই চারটা তালা, তার ওপর নতুন তালা পড়ে।", 6, [[F, 4], [5, 12]], { drop: 6, locks: 4 }),
  L("রাতে চাল কম", "চাল কম, তালা পড়ে পাঁচ চালে।", 6, [[1, 16], [5, 16]], { drop: 5, tight: true }),
  L("রাতের রংধনু", "রংধনু বানিয়ে লাল চুড়ি তোলো, আরও তালা পড়ার আগে।", 6, [[R, 1], [0, 16]], { drop: 5 }),
  L("সব একসঙ্গে", "ধুলো, তালা আর পড়া তালা, তিনটাই আছে।", 6, [[D, 10], [F, 5]], { drop: 6, dust: 12, locks: 3 }),
  L("মেলা ভাঙার আগে", "শেষ রাতের শেষ দোকান। ধুলো, তালা, পড়া তালা, সব একসঙ্গে।", 6, [[D, 15], [F, 6], [R, 1]], { drop: 5, dust: 14, thick: 4, locks: 3 }),
];

export const LEVEL_COUNT = DEFS.length;
export const PER_WORLD = 10;
export const WORLDS = [
  { name: "গ্রামের মেলা", finale: "বড় বায়না", call: [784, 988, 1175] },
  { name: "বৈশাখী মেলা", finale: "নববর্ষের ভিড", call: [659, 880, 1175] },
  { name: "চুড়িপট্টি", finale: "বিয়ের বায়না", call: [587, 740, 988] },
  { name: "রাতের মেলা", finale: "মেলা ভাঙার আগে", call: [523, 659, 784] },
] as const;

export const LEVELS: readonly (Def & Seeded)[] = DEFS.map((def, index) => ({ ...def, ...(SEEDS[index] ?? { seed: index + 1, moves: 30, three: 0, two: 0, bot: 0, botScore: 0 }) }));
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const worldOf = (level: number) => Math.max(0, Math.min(WORLDS.length - 1, Math.floor((level - 1) / PER_WORLD)));
export const worldStart = (world: number) => world * PER_WORLD + 1;
export const isFinale = (level: number) => level % PER_WORLD === 0 && isLevel(level);
export const finaleName = (level: number) => (isFinale(level) ? WORLDS[worldOf(level)].finale : "");

export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const isMode = (value: unknown): value is Mode => value === "e" || value === "n" || value === "h";
export const MODE_INFO: Record<Mode, { name: string; line: string; maxStars: number }> = {
  e: { name: "সহজ", line: "চাল দেড় গুণ, ইশারা তাড়াতাড়ি আসে। তারা বড়জোর ২টা।", maxStars: 2 },
  n: { name: "স্বাভাবিক", line: "আসল খেলা। ৩ তারা পেতে কম চালে, বেশি পয়েন্টে।", maxStars: 3 },
  h: { name: "কঠিন", line: "চাল কম, ইশারা নেই। বাকি চালের পয়েন্টও কম, তাই ৩ তারা আরও শক্ত।", maxStars: 3 },
};

/** The gifts at a finale: what each does, before → after. */
export const GIFTS = [
  { name: "একটা রংধনু", line: "ছকে এক রংধনু চুড়ি বসে থাকে" },
  { name: "দুটো ঝিকমিক", line: "ছকের দুটো চুড়ি শুরুতেই ঝিকমিক" },
  { name: "আরও ৩ চাল", line: "চালের সীমা তিন বাড়ে, বাকি চালের পয়েন্ট বাড়ে না" },
] as const;
