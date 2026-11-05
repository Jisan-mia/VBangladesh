// The ladder: eight packs as eight worlds, four pages each. Every page teaches one new thing (its `lesson`), and the
// fourth page of a world is its named finale. Star times (seconds on the clock, hints included) were tuned with the
// headless bots in tests/bot.ts; the tests re-run them and assert the rates. Never reorder: links carry the level number (g).
import { CLASSIC, type Dir, type Level, type Spec } from "./grid";
import { type PackId } from "./packs";

const FWD3: readonly Dir[] = ["R", "D", "DR"];
const FWD4: readonly Dir[] = ["R", "D", "DR", "UR"];
const ALL: readonly Dir[] = ["R", "D", "DR", "UR", "L", "U", "UL", "DL"];
const HALANT = "্";
const conjunct = (letters: readonly string[]) => letters.some(cell => cell.includes(HALANT));
const reph = (letters: readonly string[]) => letters.some(cell => cell.startsWith("র্"));
const repeats = (letters: readonly string[]) => new Set(letters).size < letters.length;

export type Stage = Spec & { pack: PackId; three: number; two: number; lesson: string };

/** Each world: its pack, the name of its page in the booklet, and its finale's name. */
export const WORLDS: ReadonlyArray<{ pack: PackId; page: string; finale: string }> = [
  { pack: "phul", page: "ফুলের বাগান", finale: "মালি চাচার বাগান" },
  { pack: "mach", page: "মাছের হাট", finale: "জেলে ভাইয়ের জাল" },
  { pack: "pitha", page: "পৌষের পিঠা", finale: "নানুর পিঠার থালা" },
  { pack: "phol", page: "ফলের ঝুড়ি", finale: "মধুমাসের ঝুড়ি" },
  { pack: "pakhi", page: "পাখির ডাক", finale: "দাদুর বারান্দা" },
  { pack: "khela", page: "স্কুল মাঠ", finale: "টিফিনের ঘণ্টা" },
  { pack: "ritu", page: "বারো মাস", finale: "চৈত্র সংক্রান্তি" },
  { pack: "nodi", page: "নদীর দেশ", finale: "মাঝির শেষ খেয়া" },
];
export const PER_WORLD = 4;

const at = (world: number, spec: Omit<Stage, "pack">): Stage => ({ pack: WORLDS[world].pack, ...spec });

export const STAGES: readonly Stage[] = [
  // ১ ফুল: the stroke, then one direction at a time.
  at(0, { size: 4, words: 3, dirs: ["R"], three: 15, two: 25, lesson: "প্রথম অক্ষর থেকে শেষ অক্ষর পর্যন্ত আঙুল টানো। সব শব্দ বাঁ থেকে ডানে।" }),
  at(0, { size: 5, words: 3, dirs: ["R", "D"], three: 25, two: 35, lesson: "এবার ওপর থেকে নিচেও লুকানো।" }),
  at(0, { size: 6, words: 4, dirs: FWD3, three: 35, two: 55, lesson: "কোনাকুনিও আছে: ওপর-বাঁ থেকে নিচে-ডানে।" }),
  at(0, { size: 6, words: 5, dirs: FWD3, cross: 1, three: 40, two: 70, lesson: "পাঁচটা ফুল, একটা ঘর দুই শব্দের ভাগে। মালি চাচা ৪০ সেকেন্ডে পুরো বাগান ঘুরে আসেন।" }),
  // ২ মাছ: the up diagonal, a bigger page, then backwards.
  at(1, { size: 6, words: 4, dirs: FWD4, three: 30, two: 55, lesson: "নিচ থেকে ওপরে কোনাকুনিও পড়া যায়।" }),
  at(1, { size: 7, words: 5, dirs: FWD4, three: 45, two: 90, lesson: "পাতা বড় হলো: সাত ঘর চওড়া।" }),
  at(1, { size: 7, words: 5, dirs: [...FWD4, "L"], backwards: 1, three: 45, two: 85, lesson: "উল্টো দিকেও লুকায়: ডান থেকে বাঁয়ে।" }),
  at(1, { size: 7, words: 6, dirs: [...FWD4, "L"], backwards: 1, three: 35, two: 75, lesson: "ছয়টা মাছ, পাঁচ দিকে। জেলে ভাই ৩৫ সেকেন্ডে জাল তোলেন।" }),
  // ৩ পিঠা: up the column, all eight ways, then false starts.
  at(2, { size: 7, words: 5, dirs: [...FWD4, "L", "U"], backwards: 1, three: 40, two: 95, lesson: "নিচ থেকে ওপরেও পড়া যায়।" }),
  at(2, { size: 7, words: 5, dirs: ALL, backwards: 2, three: 50, two: 125, lesson: "এবার আট দিকেই, উল্টো কোনাকুনিও।" }),
  at(2, { size: 7, words: 6, dirs: ALL, traps: 1, three: 55, two: 120, lesson: "ফাঁদ: একটা শব্দের শুরুটা আরেক জায়গাতেও আছে। শেষ পর্যন্ত মিলিয়ে দেখো।" }),
  at(2, { size: 7, words: 6, dirs: ALL, traps: 2, three: 45, two: 100, lesson: "ছয়টা পিঠা, দুটো ফাঁদ। নানু ৪৫ সেকেন্ডে থালা সাজান।" }),
  // ৪ ফল: the biggest page, a clue list, a crowded page.
  at(3, { size: 8, words: 6, dirs: ALL, three: 65, two: 150, lesson: "সবচেয়ে বড় পাতা: আট ঘর চওড়া।" }),
  at(3, { size: 7, words: 6, dirs: ALL, clue: true, three: 65, two: 160, lesson: "তালিকায় শুধু প্রথম অক্ষর, ফোঁটায় বাকি ঘর। আ··· মানে চার ঘরের ফল।" }),
  at(3, { size: 6, words: 6, dirs: ALL, cross: 2, three: 40, two: 90, lesson: "ছোট পাতায় ছয়টা ফল। একটা শব্দ আরেকটার গা ঘেঁষে।" }),
  at(3, { size: 8, words: 7, dirs: ALL, clue: true, traps: 1, three: 75, two: 180, lesson: "সাতটা ফল, শুধু প্রথম অক্ষর, একটা ফাঁদ। ঝুড়ি ভরার সময় ১ মিনিট ১৫ সেকেন্ড।" }),
  // ৫ পাখি: reading backwards cell by cell, repeated letters, a tighter clock.
  at(4, { size: 7, words: 6, dirs: ALL, backwards: 3, three: 55, two: 125, lesson: "উল্টো শব্দে ঘরের ভেতরটা উল্টায় না: ক·লি·শা পড়লে শালিক।" }),
  at(4, { size: 7, words: 6, dirs: ALL, must: { test: repeats, count: 2 }, three: 55, two: 120, lesson: "ঘুঘু, টুনটুনি: একই অক্ষর দুবার। কোন ঘর থেকে শুরু, মিলিয়ে দেখো।" }),
  at(4, { size: 7, words: 6, dirs: ALL, traps: 1, three: 45, two: 105, lesson: "তিন তারার সময় এবার কম। লম্বা শব্দ আগে ধরো, ওরা চোখে পড়ে বেশি।" }),
  at(4, { size: 8, words: 7, dirs: ALL, clue: true, traps: 2, three: 75, two: 190, lesson: "সাতটা পাখি, প্রথম অক্ষরে, দুটো ফাঁদ। দাদু ১ মিনিট ১৫ সেকেন্ডে সবকটা চেনেন।" }),
  // ৬ খেলা: conjuncts in one cell, rare letters, a backwards clue.
  at(5, { size: 7, words: 6, dirs: ALL, must: { test: conjunct, count: 2 }, three: 50, two: 100, lesson: "এক ঘরে পুরো যুক্তাক্ষর: গো·ল্লা·ছু·ট। ভেঙে দুই ঘরে যায় না।" }),
  at(5, { size: 8, words: 7, dirs: ALL, traps: 2, three: 65, two: 145, lesson: "যে অক্ষর পাতায় একবারই আছে, আগে সেটা খোঁজো: ঘু, ক্রি, ডাং।" }),
  at(5, { size: 7, words: 6, dirs: ALL, clue: true, backwards: 3, three: 60, two: 135, lesson: "উল্টো শব্দের প্রথম অক্ষর থাকে লাইনের শেষ মাথায়।" }),
  at(5, { size: 8, words: 7, dirs: ALL, clue: true, traps: 2, three: 70, two: 155, lesson: "সাতটা খেলা, প্রথম অক্ষরে, দুটো ফাঁদ। টিফিন ১ মিনিট ১০ সেকেন্ড, তারপর ঘণ্টা।" }),
  // ৭ ঋতু: reph, dense conjuncts, eight words.
  at(6, { size: 7, words: 6, dirs: ALL, must: { test: reph, count: 2 }, three: 50, two: 110, lesson: "রেফ ঘরের ভেতরেই বসে: ব·র্ষা, কা·র্তি·ক।" }),
  at(6, { size: 8, words: 7, dirs: ALL, must: { test: conjunct, count: 5 }, traps: 2, three: 70, two: 150, lesson: "মাসের নামে যুক্তাক্ষর বেশি: শ্রা, ল্গু, ত্র, প্রতিটা এক ঘরে।" }),
  at(6, { size: 8, words: 8, dirs: ALL, clue: true, three: 90, two: 225, lesson: "এবার আটটা শব্দ।" }),
  at(6, { size: 8, words: 8, dirs: ALL, clue: true, traps: 2, three: 80, two: 175, lesson: "আটটা নাম, প্রথম অক্ষরে, দুটো ফাঁদ। বছর ফুরাতে বাকি ১ মিনিট ২০ সেকেন্ড।" }),
  // ৮ নদী: long names, then all of it at once.
  at(7, { size: 8, words: 7, dirs: ALL, traps: 2, three: 75, two: 165, lesson: "নদীর নাম লম্বা। লম্বাগুলো আগে, ছোটগুলো পরে চোখে পড়বে।" }),
  at(7, { size: 8, words: 7, dirs: ALL, clue: true, traps: 2, backwards: 3, three: 95, two: 250, lesson: "প্রথম অক্ষর, উল্টো পড়া আর ফাঁদ, সব একসাথে।" }),
  at(7, { size: 8, words: 8, dirs: ALL, clue: true, traps: 3, three: 100, two: 245, lesson: "আটটা নদী, তিনটা ফাঁদ।" }),
  at(7, { size: 8, words: 8, dirs: ALL, clue: true, traps: 3, backwards: 3, three: 85, two: 200, lesson: "আটটা নদী, তিনটা ফাঁদ, উল্টো পড়াও। শেষ খেয়া ছাড়ে ১ মিনিট ২৫ সেকেন্ডে।" }),
];
export const STAGE_COUNT = STAGES.length;

/** Level 1's first play: a fixed grid, so the demo stroke shows on a word that reads well. */
export const TEACH_SEED = 501;

export const stageAt = (stage: number): Stage | null => (Number.isInteger(stage) && STAGES[stage - 1]) || null;
export const worldOf = (stage: number) => Math.floor((stage - 1) / PER_WORLD);
export const isFinale = (stage: number) => stage >= 1 && stage <= STAGE_COUNT && stage % PER_WORLD === 0;
export const finaleName = (stage: number) => isFinale(stage) ? WORLDS[worldOf(stage)].finale : "";
export const worldStart = (world: number) => world * PER_WORLD + 1;

/** The classic grids of free play, as stages without a number (no stars, best time per pack and difficulty). */
export const freeStage = (pack: PackId, level: Level): Spec & { pack: PackId } => ({ ...CLASSIC[level], pack });
