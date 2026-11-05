// The ladder, as data: three worlds of four levels, each level teaching one new thing in one line, the last of each world a
// named finale. Lessons (1, 2, 3, 7) are fixed positions proved a win against every reply (tests/levels.test.ts runs a full
// solver). Levels 5 and 8 are exactly the old সহজ and কঠিন bots on the old 4×4 cloth, so a link's `l=1` / `l=2` is the very
// same game it always was. Bot strengths are tuned by headless players; the rates are asserted in the tests.
import { legacySetup, type Bot, type Setup } from "./quilt";

export type World = { name: string; time: string; motif: string };
export const WORLDS: readonly World[] = [
  { name: "উঠোন", time: "সকাল", motif: "ফুল" },
  { name: "পুকুরঘাট", time: "দুপুর", motif: "মাছ আর নৌকা" },
  { name: "হারিকেনের রাত", time: "রাত", motif: "চাঁদ আর তারা" },
];
export const PER_WORLD = 4;
export const LEVEL_COUNT = WORLDS.length * PER_WORLD;

export type Level = {
  name: string;
  /** The one new thing, in the player's words. */
  line: string;
  /** The named finale of a world. */
  finale?: string;
  /** Who sews against you, by name. */
  rival: string;
  setup: Setup;
  /** Flowers for ★★ and ★★★ (★ is any win). A lesson's ★★★ is the solver's best against any reply. */
  two: number;
  three: number;
  /** A lesson: its fixed seed and the stitches the hint walks you through (the first one not yet sewn pulses). */
  lesson?: { seed: number; keys?: readonly number[] };
};

const tuned = (take: number, safe: number, smallest: number, deal: number, gold = false): Bot => ({ kind: "tuned", take, safe, smallest, deal, gold });
/** A lesson's bot takes every box it can and never gives one away while it can help it. */
const GREEDY = tuned(1, 1, 1, 0);
const every = (count: number, but: readonly number[]) => Array.from({ length: count }, (_, edge) => edge).filter(edge => !but.includes(edge));

const LADDER: readonly Level[] = [
  // ১ উঠোন: small cloths, the rules.
  { name: "প্রথম ফুল", rival: "টুনি", line: "চার পাশ সেলাই হলে ঘরটা তোমার। ফুল ফোটে, আরেকটা ফোঁড়ও পাও।",
    setup: { cols: 2, rows: 2, opening: [0, 1, 2, 3, 4, 7, 9, 10, 11], bot: GREEDY }, two: 3, three: 4, lesson: { seed: 101 } },
  { name: "তিন নম্বর ফোঁড়", rival: "টুনি", line: "কোনো ঘরে তিন নম্বর সেলাই দিলে ঘরটা পরের জন নেয়। লাল আভা দেখলে থামো।",
    setup: { cols: 3, rows: 2, opening: [1, 3, 7, 8, 13, 14, 16], bot: GREEDY }, two: 5, three: 6, lesson: { seed: 102 } },
  { name: "ছোট সারি আগে", rival: "টুনি", line: "নিরাপদ ফোঁড় শেষ? ছোট সারিটা ছেড়ে দাও, বড়টা পরে তোমার।",
    setup: { cols: 3, rows: 2, opening: [2, 3, 4, 6, 8, 10, 11, 13, 16], bot: GREEDY }, two: 4, three: 4, lesson: { seed: 103 } },
  { name: "লেভেল ৪", finale: "প্রথম কাঁথা", rival: "টুনি", line: "পুরো কাঁথা, টুনির সাথে। ৯টা ঘরের ৫টা পেলেই জয়। টুনিও শিখছে।",
    setup: { cols: 3, rows: 3, opening: 2, bot: tuned(0.4, 0.4, 0, 0) }, two: 6, three: 7 },
  // ২ পুকুরঘাট: the full 4×4 cloth, where chains decide.
  { name: "চার-চার ঘর", rival: "রুনা আপা", line: "এবার ১৬ ঘরের কাঁথা। রুনা আপা তিন নম্বর ফোঁড় দেন না, শেষে এলোমেলো।",
    setup: legacySetup(1), two: 10, three: 12 },
  { name: "সারি গোনা", rival: "রুনা আপা", line: "রুনা আপা এবার শেষে বেশির ভাগ সময় সবচেয়ে ছোট সারিটা খোলেন। সারি গুনে খেলো।",
    setup: { cols: 4, rows: 4, opening: 2, bot: tuned(1, 1, 0.7, 0) }, two: 10, three: 12 },
  { name: "দুটো ছেড়ে দাও", rival: "রুনা আপা", line: "সারির শেষ দুটো ঘর রুনা আপাকে দাও। তখন বড় সারিটা খুলতে হবে তাঁকেই।",
    setup: {
      cols: 4, rows: 4, bot: GREEDY,
      opening: every(40, [2, 5, 6, 13, 14, 15, 16, 21, 30, 39]),
      owned: [[8, 0], [12, 0], [13, 0], [3, 1], [9, 1], [10, 1], [14, 1]],
    }, two: 10, three: 10, lesson: { seed: 107, keys: [5, 2] } },
  { name: "লেভেল ৮", finale: "মিনু খালা", rival: "মিনু খালা", line: "মিনু খালা শেষে দুটো ঘর ছেড়ে দিয়ে বড় সারিটা নিজের করে নেন।",
    setup: legacySetup(2), two: 10, three: 12 },
  // ৩ হারিকেনের রাত: জরির ঘর, worth two flowers.
  { name: "জরির ঘর", rival: "মিনু খালা", line: "সোনালি জরির ঘরে দুটো ফুল। ওই ঘরে তিন নম্বর ফোঁড়টা দিয়ো না।",
    setup: { cols: 4, rows: 4, gold: [5, 10], opening: 2, bot: tuned(1, 1, 1, 0.5, true) }, two: 11, three: 13 },
  { name: "পাঁচ-পাঁচ ঘর", rival: "মিনু খালা", line: "২৫ ঘরের বড় কাঁথা। সারি লম্বা হয়, ভুলের দামও বাড়ে।",
    setup: { cols: 5, rows: 5, gold: [6, 18], opening: 3, bot: tuned(1, 1, 1, 0.7, true) }, two: 16, three: 18 },
  { name: "খালা আগে", rival: "মিনু খালা", line: "এবার মিনু খালা আগে সেলাই দেন। শেষে কে সারি খুলবে, সেই হিসাব উল্টে যায়।",
    setup: { cols: 5, rows: 5, gold: [6, 18], opening: 3, first: 1, bot: tuned(1, 1, 1, 0.8, true) }, two: 16, three: 18 },
  { name: "লেভেল ১২", finale: "নানুর নকশিকাঁথা", rival: "নানু", line: "নানু জরির ঘর চেনেন, কোনো সারি ছাড়েন না। তিনটা জরি, ২৫ ঘর।",
    setup: { cols: 5, rows: 5, gold: [6, 12, 18], opening: 3, bot: tuned(1, 1, 1, 1, true) }, two: 17, three: 19 },
];

export const LADDER_LEVELS = LADDER;
export const levelOf = (level: number): Level | undefined => LADDER[level - 1];
export const worldOf = (level: number) => Math.min(WORLDS.length, Math.max(1, Math.ceil(level / PER_WORLD)));
export const isFinale = (level: number) => level >= 1 && level <= LEVEL_COUNT && level % PER_WORLD === 0;
export const isLesson = (level: number) => Boolean(levelOf(level)?.lesson);
/** The old link's bot level (`l=1` সহজ, `l=2` কঠিন) as its ladder level, and back. */
export const LEGACY_LEVELS: Record<1 | 2, number> = { 1: 5, 2: 8 };
export const legacyOf = (level: number): 1 | 2 | null => level === 5 ? 1 : level === 8 ? 2 : null;

/** Stars for a finished game on a level: none for a loss or a draw, then by the level's flower counts. */
export function starsFor(level: number, score: readonly [number, number]) {
  const info = levelOf(level);
  if (!info || score[0] <= score[1]) return 0;
  return score[0] >= info.three ? 3 : score[0] >= info.two ? 2 : 1;
}

/** The two-people cloths: ৩×৩, the old ৪×৪ (a link without `z`) and ৫×৫. */
export const PAIR_SIZES = [3, 4, 5] as const;
export type PairSize = (typeof PAIR_SIZES)[number];
export const pairSetup = (size: PairSize): Setup => size === 4 ? legacySetup(0) : { cols: size, rows: size, opening: 2, bot: null };
