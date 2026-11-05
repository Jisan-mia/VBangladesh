// The ladder: three shops as three worlds, ten levels each. Each world brings one twist; inside a world each level adds
// exactly one thing (its `lesson`, and the before → after chips from `changes`), and the tenth is the world's named
// finale, where মামা takes two at once. Tuned with the headless bots in tests/bot.ts; the tests assert the rates.
// Never reorder: links and saved stars carry the level number.

/** gap: the place stays empty · move: the shelf closes up and two things swap places · swap: a new thing takes the place */
export type Twist = "gap" | "move" | "swap";
/**
 * count things on the shelf, view seconds to look, choices pictures to pick from, unseen pictures that were never on the
 * shelf; alike: the wrong pictures look like the gone one; plain: no name tags on the shelf; two: মামা takes two.
 */
export type Spec = { count: number; view: number; choices: number; unseen: number; twist: Twist; alike: boolean; plain: boolean; two: boolean };
export type Level = Spec & { lesson: string };

export type World = { name: string; twist: Twist; rule: string; ask: string; finale: string };
export const WORLDS: readonly World[] = [
  { name: "পাড়ার দোকান", twist: "gap", rule: "মামা যেটা সরায়, সেই জায়গাটা ফাঁকা থাকে।", ask: "কোনটা নেই?", finale: "ঈদের আগের রাত" },
  { name: "বাজারের দোকান", twist: "move", rule: "একটা সরানোর পর বাকিগুলো সরে বসে, দুটোর জায়গাও বদলায়।", ask: "বাকিগুলোও সরেছে। কোনটা নেই?", finale: "মাসের প্রথম বাজার" },
  { name: "হাটের দোকান", twist: "swap", rule: "সরানো জিনিসের জায়গায় নতুন একটা এসে বসে।", ask: "নতুনটা নয়, কোনটা নেই?", finale: "হাটবার" },
];
export const PER_WORLD = 10;

const MORE = "তাকে আরেকটা জিনিস।";
const LESS = "দেখার সময় এক সেকেন্ড কম।";
const SIX = "বাছাই এবার ৬টা ছবি থেকে।";
const ALIKE = "এবার কাছাকাছি দেখতে জিনিস, যেমন সাদার পাশে সাদা।";
const PLAIN = "তাকে নাম লেখা নেই, শুধু ছবি।";

type Row = [count: number, view: number, choices: number, unseen: number, lesson: string, flags?: string];
const world = (twist: Twist, rows: readonly Row[]): Level[] => rows.map(([count, view, choices, unseen, lesson, flags = ""]) => ({
  count, view, choices, unseen, twist, lesson, alike: flags.includes("a"), plain: flags.includes("p"), two: flags.includes("2"),
}));

export const LEVELS: readonly Level[] = [
  // ১ পাড়ার দোকান: the gap stays, so the empty place points at the answer.
  ...world("gap", [
    [4, 4, 3, 0, "তাকটা দেখে রাখো। চোখ খুললে একটা জায়গা ফাঁকা।"],
    [4, 4, 3, 1, "একটা ছবি তাকে ছিলই না। ওটা বেছো না।"],
    [5, 5, 3, 1, MORE],
    [5, 5, 4, 1, "বাছাই এবার ৪টা ছবি থেকে।"],
    [5, 4, 4, 1, LESS],
    [6, 5, 4, 1, MORE],
    [6, 5, 4, 1, ALIKE, "a"],
    [7, 5, 4, 1, MORE, "a"],
    [7, 4, 4, 1, LESS, "a"],
    [7, 6, 6, 1, "ঈদের আগের রাতে ভিড়। মামা একসঙ্গে দুটো সরাবে, দুটোই বাছো।", "a2"],
  ]),
  // ২ বাজারের দোকান: the shelf closes up, so only the things themselves tell.
  ...world("move", [
    [5, 5, 4, 1, "নতুন দোকান: একটা সরানোর পর বাকিগুলোও জায়গা বদলায়। জায়গা নয়, জিনিস মনে রাখো।"],
    [6, 5, 4, 1, MORE],
    [6, 5, 4, 1, PLAIN, "p"],
    [6, 4, 4, 1, LESS, "p"],
    [7, 5, 4, 1, MORE, "p"],
    [7, 5, 6, 1, SIX, "p"],
    [7, 5, 6, 1, ALIKE, "pa"],
    [8, 6, 6, 1, MORE, "pa"],
    [8, 5, 6, 1, LESS, "pa"],
    [8, 7, 6, 1, "মাসের প্রথম দিন, সবাই বাজার করছে। মামা দুটো সরাবে, বাকিগুলোও সরবে।", "pa2"],
  ]),
  // ৩ হাটের দোকান: a newcomer sits in the gap, a lure that is on the shelf now.
  ...world("swap", [
    [6, 5, 4, 1, "নতুন দোকান: সরানো জিনিসের জায়গায় নতুন একটা বসে। নতুনটা নয়, যেটা নেই সেটা বলো।"],
    [7, 5, 4, 1, MORE],
    [7, 5, 6, 1, SIX],
    [7, 5, 6, 1, ALIKE, "a"],
    [8, 6, 6, 1, MORE, "a"],
    [8, 6, 6, 1, PLAIN, "ap"],
    [9, 7, 6, 1, "তিন তাক ভরা: ৯টা জিনিস।", "ap"],
    [10, 7, 6, 1, MORE, "ap"],
    [10, 6, 6, 1, LESS, "ap"],
    [10, 8, 6, 1, "হাটবারে সবচেয়ে ভিড়। দুটো যাবে, তার জায়গায় দুটো নতুন আসবে।", "ap2"],
  ]),
];

export const LEVEL_COUNT = LEVELS.length;
export const worldOf = (level: number) => Math.floor((level - 1) / PER_WORLD);
export const worldStart = (index: number) => index * PER_WORLD + 1;
export const isFinale = (level: number) => level % PER_WORLD === 0;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelAt = (level: number): Level => LEVELS[level - 1];
export const finaleName = (level: number) => isFinale(level) ? WORLDS[worldOf(level)].finale : "";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const n = (value: number) => digits.format(value);

/** What changed since the level before, in the player's words (the start card's before → after chips). */
export function changes(level: number): string[] {
  const now = levelAt(level);
  if ((level - 1) % PER_WORLD === 0) return level === 1 ? [] : ["নতুন দোকান"];
  const was = levelAt(level - 1), out: string[] = [];
  if (now.two && !was.two) out.push("নেই ১ → ২");
  if (now.count !== was.count) out.push(`জিনিস ${n(was.count)} → ${n(now.count)}`);
  if (now.view !== was.view && (now.count === was.count || now.view < was.view)) out.push(`সময় ${n(was.view)} → ${n(now.view)} সে.`);
  if (now.choices !== was.choices) out.push(`ছবি ${n(was.choices)} → ${n(now.choices)}`);
  if (now.unseen !== was.unseen) out.push(`বাইরের ছবি ${n(was.unseen)} → ${n(now.unseen)}`);
  if (now.alike && !was.alike) out.push("কাছাকাছি দেখতে");
  if (now.plain && !was.plain) out.push("নাম → শুধু ছবি");
  return out;
}

/** The kinds of change since the level before: "more things" (with the time that comes with them) counts as one. */
export function changeKinds(level: number): string[] {
  const now = levelAt(level), was = levelAt(level - 1), out: string[] = [];
  if (now.twist !== was.twist) out.push("twist");
  if (now.two !== was.two) out.push("two");
  if (now.count !== was.count) out.push("count");
  else if (now.view !== was.view) out.push("view");
  if (now.choices !== was.choices) out.push("choices");
  if (now.unseen !== was.unseen) out.push("unseen");
  if (now.alike !== was.alike) out.push("alike");
  if (now.plain !== was.plain) out.push("plain");
  return out;
}
