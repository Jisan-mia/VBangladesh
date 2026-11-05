// The two ladders, as data: one for বাঘ হয়ে, one for ছাগল হয়ে. Each has three worlds of four levels, and each level teaches one
// new thing in one line. World 1 (পাঠশালা) is small positions on the real board: each is a proven forced win (tests/levels.test.ts
// runs a solver over every reply). Worlds 2 and 3 are the full game against the bot's eight levels (BOT_LEVELS in game.ts), so a
// level in a link (`l`, the bot's level) still means the very same bot. The last level of every world is a named finale.
import { fullStart, GOAT, POINTS, TIGER, type Side, type Start } from "./game";

export type World = { name: string; time: string };
export const WORLDS: readonly World[] = [
  { name: "পাঠশালা", time: "সকাল" },
  { name: "উঠোন", time: "দুপুর" },
  { name: "সাঁঝের উঠোন", time: "সন্ধ্যা" },
];
export const PER_WORLD = 4;
export const LESSONS = PER_WORLD;
export const LEVEL_COUNT = WORLDS.length * PER_WORLD;
/** Ladder level 5 is the bot's level 1: the full board starts after the lessons. */
export const BOT_OFFSET = LESSONS;

export type Level = {
  /** The level's own name on the start card and the HUD badge. */
  name: string;
  /** The one new thing, in the player's words. */
  line: string;
  /** The named finale of a world. */
  finale?: string;
  start: Start;
  /** A lesson's fixed seed, so its bot replies the same way every time. Full games take a fresh seed. */
  seed?: number;
};

const board = (spec: Record<number, number>) => { const goats = Array<number>(POINTS).fill(0); for (const [at, count] of Object.entries(spec)) goats[Number(at)] = count; return goats; };
const ones = (list: number[]) => board(Object.fromEntries(list.map(at => [at, 1])));
const lesson = (goats: number[], tigers: number[], turn: Side, goal: number, cap: number, hold: boolean, bot: number, par: number): Start => ({ goats, tigers, turn, goal, cap, hold, bot, par });

// The goats' first finale and the tigers' are both shorter than a full game: four to take in 30 moves from the real opening.
const FIRST_HUNT: Start = { ...fullStart(2), goal: 4, cap: 30, par: 6 };

const TIGER_LADDER: readonly Level[] = [
  { name: "প্রথম লাফ", line: "পাশের ছাগলের পেছনে ফাঁকা থাকলে লাফ দাও। ছাগলটা ধরা।", start: lesson(ones([12, 7, 17]), [11], TIGER, 1, 3, true, 1, 1), seed: 101 },
  { name: "কোনাকুনি দাগ", line: "কিছু বিন্দু থেকে কোনাকুনি দাগও যায়। সোজা পথ বন্ধ, কোনাকুনি লাফ দাও।", start: lesson(ones([7, 2, 11, 10, 13, 14, 17, 22, 6]), [12], TIGER, 1, 3, true, 1, 1), seed: 102 },
  { name: "গাদা", line: "গাদার ওপর দিয়ে লাফালে যায় শুধু ওপরেরটা। দুই বাঘে দুই দিক থেকে ধরো।", start: lesson(board({ 13: 3, 0: 1, 20: 1, 24: 1 }), [12, 8], TIGER, 2, 5, true, 1, 2), seed: 103 },
  { name: "লেভেল ৪", finale: "প্রথম শিকার", line: "ছাগলেরা এবার নিজেরা চালে। ৩০ চালের মধ্যে ৪টা ধরো।", start: FIRST_HUNT },
  // The full game: the goats get one notch sharper each level (BOT_LEVELS: safe, noise, careful).
  { name: "লেভেল ৫", line: "এবার পুরো খেলা: ১২০ চালে ৮টা ধরো। ছাগলেরা এলোমেলো চলে।", start: fullStart(1) },
  { name: "লেভেল ৬", line: "ছাগলেরা এবার পেছনটা মাঝে মাঝে দেখে।", start: fullStart(2) },
  { name: "লেভেল ৭", line: "ছাগলেরা আরেকটু সাবধান, ভুল কম।", start: fullStart(3) },
  { name: "লেভেল ৮", finale: "চালাক রাখাল", line: "রাখাল পাল সামলায়: এলোমেলো চাল আরও কম।", start: fullStart(4) },
  { name: "লেভেল ৯", line: "সহজ লাফ কমে আসে। ফাঁদ পেতে ধরতে হবে।", start: fullStart(5) },
  { name: "লেভেল ১০", line: "ছাগল প্রায় কখনো পেছন ফাঁকা রাখে না।", start: fullStart(6) },
  { name: "লেভেল ১১", line: "পেছন ফাঁকা রাখে না, মাঝে মাঝে এক চাল আগেও ভাবে।", start: fullStart(7) },
  { name: "লেভেল ১২", finale: "বুড়ো রাখাল", line: "প্রতিবার এক চাল আগে ভাবে: দুই দিকের ফাঁদও চিনে ফেলে।", start: fullStart(8) },
];

const GOAT_LADDER: readonly Level[] = [
  { name: "বাঘ বন্দি", line: "বাঘের যাওয়ার সব পথ বন্ধ করো। ঠিক একটা ছাগল সরালেই বাঘ বন্দি।", start: lesson(ones([1, 2, 5, 10, 12, 11]), [0], GOAT, 1, 3, false, 7, 1), seed: 201 },
  { name: "পেছন ঢাকো", line: "লাল দাগের ছাগলের পেছন ফাঁকা, বাঘ লাফ দেবে। আগে পেছনটা ঢাকো।", start: lesson(ones([1, 2, 6, 7, 10, 15, 17]), [0], GOAT, 1, 7, false, 7, 2), seed: 202 },
  { name: "দুই বাঘ", line: "দুটো বাঘকেই আটকাতে হবে। এক চালে দুটো লাফের পথ বন্ধ করা যায়।", start: lesson(ones([1, 2, 3, 5, 6, 7, 8, 10, 14, 17, 19]), [0, 4], GOAT, 1, 7, false, 7, 2), seed: 203 },
  { name: "লেভেল ৪", finale: "শেষ ঘেরাও", line: "বাঘ এবার ভেবে চালে। একটা ছাগলও না হারিয়ে দুটোকেই আটকাও।", start: lesson(ones([0, 2, 3, 7, 8, 10, 11, 12, 16, 18, 20]), [1, 5], GOAT, 1, 9, false, 7, 3), seed: 204 },
  // The full game: the tiger gets one notch sharper each level (BOT_LEVELS: miss, room, threat).
  { name: "লেভেল ৫", line: "এবার পুরো খেলা: বাঘ আটকাও, নয়তো ১২০ চাল টিকে থাকো। বাঘ লাফের সুযোগ খোঁজে না।", start: fullStart(1) },
  { name: "লেভেল ৬", line: "বাঘ মাঝে মাঝে সুযোগ বুঝে লাফ দেয়।", start: fullStart(2) },
  { name: "লেভেল ৭", line: "বাঘ খোলা জায়গার দিকে যায়, লাফও দেয় বেশি।", start: fullStart(3) },
  { name: "লেভেল ৮", finale: "ডোরাকাটা", line: "অর্ধেক সুযোগেই লাফ দেয়, ফাঁকা দিকে সরে যায়।", start: fullStart(4) },
  { name: "লেভেল ৯", line: "বেশির ভাগ সুযোগেই লাফ দেয়।", start: fullStart(5) },
  { name: "লেভেল ১০", line: "প্রায় কোনো সুযোগ ছাড়ে না।", start: fullStart(6) },
  { name: "লেভেল ১১", line: "সুযোগ পেলেই লাফ।", start: fullStart(7) },
  { name: "লেভেল ১২", finale: "বাঘ মামা", line: "লাফের সুযোগ বানিয়ে নেয়: এমন জায়গায় যায়, যেখান থেকে পরের চালে লাফ।", start: fullStart(8) },
];

export const LADDERS: Record<Side, readonly Level[]> = { [GOAT]: GOAT_LADDER, [TIGER]: TIGER_LADDER } as Record<Side, readonly Level[]>;
export const levelOf = (side: Side, level: number): Level | undefined => LADDERS[side][level - 1];
export const worldOf = (level: number) => Math.min(WORLDS.length, Math.max(1, Math.ceil(level / PER_WORLD)));
export const isLesson = (level: number) => level >= 1 && level <= LESSONS;
export const isFinale = (level: number) => level >= 1 && level <= LEVEL_COUNT && level % PER_WORLD === 0;
/** The full-board ladder level for a bot level (1..8), as a friend's link carries it. */
export const ladderLevel = (bot: number) => bot + BOT_OFFSET;
/** The bot level of a full-board ladder level, or 0 for a lesson. */
export const botLevel = (level: number) => level > BOT_OFFSET && level <= LEVEL_COUNT ? level - BOT_OFFSET : 0;
