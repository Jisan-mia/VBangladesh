// The 30 levels as data: three worlds, each level's one lesson, the tools that have arrived by then, and the stitches
// নানি already put in on a new board size. Pictures, sizes and seeds live in pictures.ts and game.ts and never change,
// so an old link opens the same picture.
import { makeRng } from "../../../shared/game-core";
import { levelSeed, puzzleOf, LEVEL_COUNT } from "./game";

export type WorldInfo = { name: string; place: string; idea: string; from: number; to: number; finale: string };

export const WORLDS: readonly WorldInfo[] = [
  { name: "উঠান", place: "নানির উঠান", idea: "ফোঁড় দেওয়া, ভুল ধরা, খালি দাগ", from: 1, to: 10, finale: "কলসি" },
  { name: "পুকুরপাড়", place: "পুকুরের পাড়", idea: "বড় বোর্ড, সংখ্যা কাটা, কম সাহায্য", from: 11, to: 20, finale: "বিড়াল" },
  { name: "নদী আর শহর", place: "নদীর ঘাট থেকে শহর", idea: "বড় ছবি, নিজের হাতে", from: 21, to: 30, finale: "ইলিশ" },
];

export type LevelInfo = {
  /** The one thing this level teaches, as a short line. */
  teach: string;
  /** A short tag for what is new here (the title shows it as নতুন). */
  fresh?: string;
  finale?: true;
  /** How many stitches নানি already put in. */
  given: number;
};

const info = (teach: string, given = 0, fresh?: string, finale?: true): LevelInfo => ({ teach, given, ...(fresh ? { fresh } : {}), ...(finale ? { finale } : {}) });

export const LEVEL_INFO: readonly LevelInfo[] = [
  // উঠান: 5×5, then 6×6
  info("ওপরের সারির পাশে ৫। মানে পাঁচটা ঘরই ভরা। আঙুল টেনে পুরো সারি ভরো।", 0, "ফোঁড়"),
  info("৫ লেখা সারি আর কলাম আগে ভরো। ভুল টান হলে ফিরিয়ে আনো।", 0, "ফিরিয়ে আনো"),
  info("ভুল ঘরে সুতো ছেঁড়ে, ঘর ফাঁকাই থাকে। ২টা ভুল পর্যন্ত ২ তারা।", 0, "ভুল ঘর"),
  info("যে ঘর নিশ্চিত খালি, খালি দাগ বেছে সেখানে ✕ দাও।", 0, "খালি দাগ"),
  info("আটকে গেলে হিন্ট নাও। তবে হিন্ট নিলে বড়জোর ২ তারা।", 0, "হিন্ট"),
  info("ছয় ঘরের সারিতে ৬ লেখা থাকলে পুরোটা ভরা। আগে সেগুলো ধরো।", 6, "৬×৬"),
  info("একটা লাইন মিললে সংখ্যা ফিকে হয়, সুরও ওঠে। পরপর মেলাও, সুর চড়বে।", 3, "সুর"),
  info("ছয় ঘরের সারিতে ৪ থাকলে মাঝের দুই ঘর নিশ্চিত: ৩ আর ৪ নম্বর।", 0, "মাঝের ঘর"),
  info("‘১ ৪’ ছয় ঘরে ঠিক ঠিক বসে: ১, ফাঁক, ৪। বাড়তি জায়গা নেই।", 0, "ঠিক ঠিক"),
  info("শেষ ছবি: কলসি। এবার নানির ফোঁড় নেই, সব নিজের হাতে।", 0, undefined, true),
  // পুকুরপাড়: 7×7, then 8×8
  info("সংখ্যায় চাপলে কেটে যায়। যেটা সারা, কেটে রাখো।", 8, "সংখ্যা কাটো"),
  info("০ মানে পুরো লাইন ফাঁকা। প্রথম আর শেষ কলামে ✕ দাও।", 4, "০"),
  info("ছবিটা চার দিকে একই রকম। সারি ১ আর ৭ এক, কলাম ১ আর ৭-ও।", 0, "মিল"),
  info("‘১ ৩ ১’ সাত ঘরে ঠিক ঠিক বসে: ১, ফাঁক, ৩, ফাঁক, ১।", 0, "তিন সংখ্যা"),
  info("সাত ঘরে ৬ থাকলে মাঝের পাঁচ ঘর নিশ্চিত।", 0, "এক ঘর বাড়তি"),
  info("৮ লেখা সারি আর কলাম পুরো ভরা: ছয় নম্বর সারি, চার নম্বর কলাম।", 10, "৮×৮"),
  info("‘১ ৬’ আট ঘরে ঠিক ঠিক বসে। সারি ৫ আর ৬ পুরো ভরা।", 5),
  info("‘২ ২ ২’ আট ঘরে ঠিক ঠিক বসে। ফাঁকগুলোতে ✕ দিয়ে এগোও।", 0),
  info("একটা সারি মেলালে কলামের নতুন ঘর জানা যায়। সারি আর কলাম পালা করে দেখো।", 0, "পালা করে"),
  info("শেষ ছবি: বিড়াল। নানির ফোঁড় নেই। হিন্ট নিলে ২ তারার বেশি হবে না।", 0, undefined, true),
  // নদী আর শহর: 9×9, then 10×10
  info("৯ লেখা সারি আর কলাম পুরো ভরা: নিচের সারি, চার আর ছয় নম্বর কলাম।", 12, "৯×৯"),
  info("একবারে না মিললে ঘুরে এসো। এক লাইন মিললে অন্য লাইনের নতুন ঘর মেলে।", 6, "ঘুরে এসো"),
  info("নয় ঘরে ৮ থাকলে মাঝের সাত ঘর নিশ্চিত।", 0),
  info("‘৪ ৩’ নয় ঘরে ৮ ঘর নেয়, একটা বাড়তি। ৪-এর মাঝের তিন ঘর নিশ্চিত।", 0),
  info("প্রথম আর শেষ কলাম ফাঁকা (০)। ✕ দিয়ে ঢেকে ভেতরের সাত কলামে মন দাও।", 0),
  info("নিচের সারি পুরো ভরা। কলাম ২-এর ‘৭ ২’ দশ ঘরে ঠিক ঠিক বসে।", 15, "১০×১০"),
  info("দশ ঘরে ৮ থাকলে মাঝের ছয় ঘর নিশ্চিত। সারি ৩ আর ৫ পুরো ভরা।", 8),
  info("সারি ৩ আর ৪ পুরো ভরা। তারপর কলাম ধরে নিচে নামো।", 0),
  info("‘১ ১ ১ ১’ দেখে কিছু বোঝা যায় না। কলামের দিক থেকে ঢোকো।", 0, "কিছু বোঝা যায় না"),
  info("শেষ ছবি: ইলিশ। নানির ফোঁড় নেই। একশো ঘর, সব নিজের হাতে।", 0, undefined, true),
];

export const worldIndex = (level: number) => Math.min(WORLDS.length - 1, Math.max(0, Math.floor((level - 1) / 10)));
export const worldInfo = (level: number) => WORLDS[worldIndex(level)];
export const infoOf = (level: number): LevelInfo => LEVEL_INFO[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
export const isFinale = (level: number) => Boolean(infoOf(level).finale);
export const sizeText = (level: number) => `${puzzleOf(level).size}×${puzzleOf(level).size}`;

/** Which helpers a level shows. They arrive one at a time, so the first screens stay simple. A friend's link to a later level shows all it needs. */
export type Tools = { undo: boolean; cross: boolean; hint: boolean; strike: boolean };
export const toolsOf = (level: number): Tools => ({ undo: level >= 2, cross: level >= 4, hint: level >= 5, strike: level >= 11 });

/** The cells নানি already stitched: part of the picture, locked, the same on every phone. */
const givens = new Map<number, readonly number[]>();
export function givenOf(level: number): readonly number[] {
  let cells = givens.get(level);
  if (!cells) {
    const { solution } = puzzleOf(level), want = infoOf(level).given, rng = makeRng(levelSeed(level) + 4242);
    const pool = solution.flatMap((filled, index) => filled ? [index] : []);
    // A seeded shuffle, then the first few: the same cells on every phone.
    for (let index = pool.length - 1; index > 0; index--) {
      const other = Math.floor(rng() * (index + 1));
      [pool[index], pool[other]] = [pool[other], pool[index]];
    }
    cells = pool.slice(0, Math.min(want, pool.length)).sort((a, b) => a - b);
    givens.set(level, cells);
  }
  return cells;
}
