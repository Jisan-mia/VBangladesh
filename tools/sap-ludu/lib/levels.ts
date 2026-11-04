// The একা ladder as data: three worlds of boards, each level adding exactly one thing (its `lesson`), and a named boss
// snake at the end of every world. tests/levels.test.ts plays thousands of seeded races per level with headless players
// and checks the target rates written in ai_docs/game-dev/rewrites/sap-ludu.md.
import { CLASSIC, makeBoard, type Board, type Jump } from "./board";

/** `exact`: land exactly on the last square. `six`: a six rolls again. `triple`: a third six in a row loses the turn. */
export type Rules = { exact: boolean; six: boolean; triple: boolean };

export type Level = {
  /** 1-based. */
  id: number;
  world: number;
  name: string;
  /** The one new thing, in one line, for the start card. */
  lesson: string;
  board: Board;
  rules: Rules;
  pieces: 1 | 2;
  /** Computer rivals (seats 1..rivals). */
  rivals: number;
  /** The third star: home first within this many rolls. */
  par: number;
  /** A finale's boss snake (its jump id on the board) and the line on its start card. */
  boss?: { jump: number; line: string };
};

export type World = { name: string; place: string; from: number; to: number };

export const WORLDS: readonly World[] = [
  { name: "উঠান", place: "উঠানের মাটিতে চকে আঁকা ঘর", from: 1, to: 4 },
  { name: "ছাদ", place: "বিকেলের ছাদ, আকাশে ঘুড়ি", from: 5, to: 8 },
  { name: "লুডু বোর্ড", place: "লুডু বোর্ডের উল্টো পিঠ", from: 9, to: 12 },
];

/** The computer rivals, seat 1..3. They differ only in how they pick between two pieces. */
export const RIVALS = [
  { name: "মিনু আপা", style: "careful" as const, line: "সবসময় নিরাপদ চালটা দেয়" },
  { name: "ছোট মামা", style: "rear" as const, line: "পেছনের গুটিটা আগে টানে" },
  { name: "নানু", style: "ladder" as const, line: "সিঁড়ি দেখলে ছাড়ে না" },
];
export type RivalStyle = (typeof RIVALS)[number]["style"];

const yard = (snakes: Jump[]) => makeBoard(5, 5, [{ from: 3, to: 14, caption: "আম কুড়ানো" }], snakes);
const MUD: Jump = { from: 19, to: 8, caption: "উঠানে কাদা" };
const YARD_1 = yard([]), YARD_2 = yard([MUD]), YARD_BOSS = yard([MUD, { from: 24, to: 4, caption: "উঠানের দাঁড়াশ" }]);

const ROOF_LADDERS: Jump[] = [
  { from: 4, to: 17, caption: "ঘুড়ি উড়ল" },
  { from: 13, to: 29, caption: "বিকেলের বাতাস" },
  { from: 24, to: 38, caption: "নাটাই ভরা সুতো" },
  { from: 33, to: 45, caption: "আচারের বয়াম রোদে" },
];
const ROOF_SNAKES: Jump[] = [
  { from: 21, to: 6, caption: "বৃষ্টি নামল" },
  { from: 31, to: 14, caption: "আম্মুর ডাক" },
  { from: 43, to: 26, caption: "সুতোয় প্যাঁচ লাগল" },
];
const ROOF = makeBoard(7, 7, ROOF_LADDERS, ROOF_SNAKES);
const ROOF_BOSS = makeBoard(7, 7, ROOF_LADDERS, [...ROOF_SNAKES, { from: 47, to: 11, caption: "কাটা ঘুড়ি" }]);

const LOOSE: Rules = { exact: false, six: true, triple: false };
const EXACT: Rules = { exact: true, six: true, triple: false };
const HOUSE: Rules = { exact: true, six: true, triple: true };
/** The classic board's ৯৩ snake, the last world's boss. */
const LOADSHEDDING = CLASSIC.at[93];

export const LEVELS: readonly Level[] = [
  { id: 1, world: 0, name: "প্রথম চাল", lesson: "ছক্কা চাপো, গুটি নিজেই হাঁটবে। সিঁড়ির গোড়ায় পড়লে ওপরে।", board: YARD_1, rules: LOOSE, pieces: 1, rivals: 0, par: 7 },
  { id: 2, world: 0, name: "প্রথম সাপ", lesson: "সাপের মুখে পড়লে লেজ পর্যন্ত নেমে যাবে।", board: YARD_2, rules: LOOSE, pieces: 1, rivals: 0, par: 7 },
  { id: 3, world: 0, name: "মিনু আপা", lesson: "এবার মিনু আপাও খেলবে। তার চাল সে নিজেই দেবে।", board: YARD_2, rules: LOOSE, pieces: 1, rivals: 1, par: 8 },
  {
    id: 4, world: 0, name: "উঠানের দাঁড়াশ", lesson: "ঘরের ঠিক আগে ২৪-এ শুয়ে আছে দাঁড়াশ। পড়লে সোজা ৪-এ।", board: YARD_BOSS, rules: LOOSE, pieces: 1, rivals: 1, par: 7,
    boss: { jump: 2, line: "উঠানের দাঁড়াশ ঘুমায় ২৪ নম্বরে, ঘরের ঠিক আগে।" },
  },
  { id: 5, world: 1, name: "ঠিক দান", lesson: "ছাদের ঘর ৪৯-এ উঠতে ঠিক দান লাগবে। বেশি পড়লে গুটি নড়বে না।", board: ROOF, rules: EXACT, pieces: 1, rivals: 1, par: 14 },
  { id: 6, world: 1, name: "দুই গুটি", lesson: "এবার দুটো গুটি। ছক্কা পড়লে কোনটা চালবে, তুমি বেছে নাও।", board: ROOF, rules: EXACT, pieces: 2, rivals: 1, par: 13 },
  { id: 7, world: 1, name: "ছোট মামাও খেলবে", lesson: "দুজন সঙ্গী। ছোট মামা পেছনের গুটিটা আগে টানে।", board: ROOF, rules: EXACT, pieces: 2, rivals: 2, par: 13 },
  {
    id: 8, world: 1, name: "কাটা ঘুড়ি", lesson: "৪৭-এ কাটা ঘুড়ির সাপ। পড়লে নেমে যাবে ১১-তে।", board: ROOF_BOSS, rules: EXACT, pieces: 2, rivals: 2, par: 13,
    boss: { jump: ROOF_LADDERS.length + ROOF_SNAKES.length, line: "ঘরের দুই ঘর আগে, ৪৭-এ, কাটা ঘুড়ির সাপ।" },
  },
  { id: 9, world: 2, name: "বড় বোর্ড", lesson: "আসল লুডু বোর্ডের উল্টো পিঠ: ১০০ ঘর, ৯টা সিঁড়ি, ৮টা সাপ।", board: CLASSIC, rules: EXACT, pieces: 2, rivals: 1, par: 20 },
  { id: 10, world: 2, name: "নানুও বসল", lesson: "তিনজন সঙ্গী। নানু সিঁড়ি দেখলে ছাড়ে না।", board: CLASSIC, rules: EXACT, pieces: 2, rivals: 3, par: 20 },
  { id: 11, world: 2, name: "তিন ছক্কা", lesson: "বাসার নিয়ম: পরপর তিনবার ছক্কা পড়লে সেই চাল বাতিল।", board: CLASSIC, rules: HOUSE, pieces: 2, rivals: 3, par: 20 },
  {
    id: 12, world: 2, name: "লোডশেডিং", lesson: "৯৩-এ লোডশেডিং, বোর্ডের সবচেয়ে লম্বা সাপ। ৫৩ পর্যন্ত নামায়।", board: CLASSIC, rules: HOUSE, pieces: 2, rivals: 3, par: 18,
    boss: { jump: LOADSHEDDING, line: "৯৩-এ লোডশেডিং। ঘরের এত কাছে, তবু ৪০ ঘর নিচে।" },
  },
];

export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (id: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(id))) - 1];
export const isFinale = (id: number) => Boolean(LEVELS[id - 1]?.boss);
export const worldOf = (id: number) => WORLDS[levelOf(id).world];

/** The classic board on one phone ("সবাই মিলে") and the old solo race: the rules every old link was played with. */
export const CLASSIC_RULES = EXACT;
