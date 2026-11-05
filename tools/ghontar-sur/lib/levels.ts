// The ladder: three worlds of eight melodies. Each world brings one twist (the order, the tal, the reverse); inside a
// world each level adds exactly one thing (its `lesson`, and the before → after chips from `changes`), and the eighth
// is the world's named finale tune, written by hand and played back to you when you clear it.
// Tuned with the headless bots in tests/bot.ts. Never reorder: links and saved stars carry the level number.
import { writtenTune, type Tune, type TuneSpec, type Written } from "./tune";

/**
 * bells in the rack, beat ms between notes in the call, phrases = rounds, size notes per phrase, rests (one silent beat
 * each), repeat: the same bell twice in a row, rhythm: your tal is graded against the call, reverse: answer backwards.
 */
export type Spec = TuneSpec & { beat: number; rhythm: boolean; reverse: boolean; hearts: number };
export type Level = Spec & { lesson: string; written?: Written };
export type World = { name: string; rule: string; ask: string; finale: string; place: string };

export const WORLDS: readonly World[] = [
  { name: "মেলার গেট", rule: "ঘণ্টা যে ক্রমে বাজে, সেই ক্রমে বাজাও।", ask: "এবার তুমি বাজাও", finale: "মেলার ঘণ্টা", place: "গেটের মাথায় বাঁশের আড়ায়" },
  { name: "বটতলার আসর", rule: "ফাঁকগুলোও গুনতে হবে। যে তালে বাজে, সে তালে বাজাও।", ask: "তালে তালে বাজাও", finale: "যাত্রাপালার ডাক", place: "বটতলার হ্যাজাকের নিচে" },
  { name: "রাতের মেলা", rule: "ঘণ্টা ডাকে, তুমি সাড়া দাও উল্টো ক্রমে: শেষটা আগে, প্রথমটা শেষে।", ask: "উল্টো ক্রমে সাড়া দাও", finale: "শেষ রাতের সাড়া", place: "ভাঙা মেলার আলোয়" },
];
export const PER_WORLD = 8;

/** The finales, written by hand: [bell, gap] pairs (gap 2 is a rest). */
const MELA: Written = [[[2, 1], [3, 1], [4, 1]], [[4, 1], [3, 1], [2, 1]], [[0, 1], [2, 1], [3, 1]], [[3, 1], [2, 1], [0, 1]]];
const YATRA: Written = [[[0, 1], [2, 2], [4, 1]], [[4, 1], [3, 2], [2, 1]], [[1, 1], [2, 1], [3, 1]], [[3, 1], [2, 1], [0, 1]]];
const RAAT: Written = [[[0, 1], [2, 1], [4, 1]], [[4, 1], [3, 1], [2, 1]], [[3, 1], [1, 1], [0, 1]]];

type Row = [bells: number, beat: number, phrases: number, size: number, rests: number, lesson: string, flags?: string, written?: Written];
const world = (rhythm: boolean, reverse: boolean, rows: readonly Row[]): Level[] => rows.map(([bells, beat, phrases, size, rests, lesson, flags = "", written]) => ({
  bells, beat, phrases, size, rests, repeat: flags.includes("r"), rhythm, reverse, hearts: 3, lesson, written,
}));

export const LEVELS: readonly Level[] = [
  // ১ মেলার গেট: only the order counts.
  ...world(false, false, [
    [3, 680, 1, 3, 0, "তিনটা ঘণ্টা। শোনো, তারপর একই ক্রমে বাজাও।"],
    [4, 680, 1, 3, 0, "চার নম্বর ঘণ্টা এসেছে।"],
    [4, 680, 2, 3, 0, "সুর এবার দুই ভাগে। প্রথম ভাগটাও মনে রেখো।"],
    [4, 560, 2, 3, 0, "এবার একটু দ্রুত বাজে।"],
    [5, 560, 2, 3, 0, "পাঁচ নম্বর ঘণ্টা এসেছে।"],
    [5, 560, 2, 3, 0, "একই ঘণ্টা পরপর দুবার বাজে।", "r"],
    [5, 560, 3, 3, 0, "সুর এবার তিন ভাগে।", "r"],
    [5, 560, 4, 3, 0, "মেলার গেটের নামকরা সুর, ১২টা ঘণ্টায়।", "r", MELA],
  ]),
  // ২ বটতলার আসর: the call's tal is graded too.
  ...world(true, false, [
    [4, 640, 1, 4, 0, "নতুন আসর: এবার তালও দেখা হয়। ঘণ্টা যত ফাঁকে বাজে, তুমিও তত ফাঁকে বাজাও।"],
    [4, 640, 2, 3, 0, "সুর দুই ভাগে।"],
    [4, 640, 2, 3, 1, "সুরের মাঝে একটা ফাঁক: এক তাল চুপ।"],
    [4, 520, 2, 3, 1, "আরও দ্রুত তাল।"],
    [5, 520, 2, 3, 1, "পাঁচ নম্বর ঘণ্টা এসেছে।"],
    [5, 520, 2, 3, 2, "ফাঁক এখন দুই জায়গায়।"],
    [5, 520, 3, 3, 2, "সুর এবার তিন ভাগে।"],
    [5, 520, 4, 3, 2, "ফাঁক আর সুরে মেশানো ১২টা ঘণ্টা।", "", YATRA],
  ]),
  // ৩ রাতের মেলা: the answer is the call backwards.
  ...world(false, true, [
    [3, 680, 1, 3, 0, "নতুন রাত: এবার উল্টো। শেষ ঘণ্টাটা আগে বাজাও।"],
    [4, 680, 1, 3, 0, "চার নম্বর ঘণ্টা এসেছে।"],
    [4, 680, 1, 4, 0, "সুর এক ঘণ্টা লম্বা।"],
    [5, 680, 1, 4, 0, "পাঁচ নম্বর ঘণ্টা এসেছে।"],
    [5, 560, 1, 4, 0, "এবার একটু দ্রুত বাজে।"],
    [5, 560, 2, 3, 0, "সুর দুই ভাগে। দুই ভাগ মিলিয়েই উল্টো।"],
    [5, 560, 2, 3, 0, "একই ঘণ্টা পরপর দুবার বাজে।", "r"],
    [5, 560, 3, 3, 0, "৯টা ঘণ্টা, পুরোটা উল্টো।", "r", RAAT],
  ]),
];

export const LEVEL_COUNT = LEVELS.length;
export const worldOf = (level: number) => Math.floor((level - 1) / PER_WORLD);
export const worldStart = (index: number) => index * PER_WORLD + 1;
export const isFinale = (level: number) => level % PER_WORLD === 0;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelAt = (level: number): Level => LEVELS[level - 1];
export const finaleName = (level: number) => isFinale(level) ? WORLDS[worldOf(level)].finale : "";
export const tuneLength = (level: number) => levelAt(level).phrases * levelAt(level).size;
export const writtenOf = (level: number): Tune | null => { const w = levelAt(level).written; return w ? writtenTune(w) : null; };

/** The most points a clean run of this level can earn: 10 a note (15 with tal) over every round, and 20 for each clean round. */
export function maxPoints(level: number) {
  const { phrases, size, rhythm } = levelAt(level);
  let total = 0;
  for (let round = 1; round <= phrases; round++) total += round * size * (rhythm ? 15 : 10) + 20;
  return total;
}
export const MOST_POINTS = Math.max(...LEVELS.map((_, at) => maxPoints(at + 1)));

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const n = (value: number) => digits.format(value);

/** What changed since the level before, in the player's words (the start card's before → after chips). */
export function changes(level: number): string[] {
  if (level === 1) return [];
  if ((level - 1) % PER_WORLD === 0) return ["নতুন আসর"];
  const now = levelAt(level), was = levelAt(level - 1), out: string[] = [];
  if (now.bells !== was.bells) out.push(`ঘণ্টা ${n(was.bells)} → ${n(now.bells)}`);
  if (now.phrases !== was.phrases) out.push(`ভাগ ${n(was.phrases)} → ${n(now.phrases)}`);
  else if (now.size !== was.size) out.push(`সুর ${n(was.phrases * was.size)} → ${n(now.phrases * now.size)}টা`);
  if (now.beat < was.beat) out.push("আরও দ্রুত");
  if (now.rests !== was.rests) out.push(`ফাঁক ${n(was.rests)} → ${n(now.rests)}`);
  if (now.repeat && !was.repeat) out.push("একই ঘণ্টা দুবার");
  return out;
}

/** The kinds of change since the level before (the tests keep it to one). */
export function changeKinds(level: number): string[] {
  const now = levelAt(level), was = levelAt(level - 1), out: string[] = [];
  if (now.rhythm !== was.rhythm || now.reverse !== was.reverse) out.push("twist");
  if (now.bells !== was.bells) out.push("bells");
  if (now.phrases !== was.phrases) out.push("phrases");
  else if (now.size !== was.size) out.push("size");
  if (now.beat !== was.beat) out.push("beat");
  if (now.rests !== was.rests) out.push("rests");
  if (now.repeat !== was.repeat) out.push("repeat");
  return out;
}
