// One round: a level's items in a seeded order, the tiles for each, what a wrong tap shows, how the next item gets easier or
// harder, and the stars. Pure and deterministic (makeRng only), so tests and bots play exactly what the page plays.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { ALPHABET, entryOf, LOOK_ALIKE, MIRROR, MIRROR_CUE, MIRROR_TWIN, SOUND_TWINS, type Mirror } from "./letters";
import { isMirrorLevel, levelOf, type Item, type Kind, type Level } from "./levels";

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

export const MIN_CHOICES = 2, MAX_CHOICES = 4;

function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/**
 * The items of a round. Letters never repeat, except on the b d p q levels, which have only two or four letters:
 * there every letter comes once as "which letter starts it?" and the rest are "find this exact one".
 */
export function makeItems(id: number, seed: number): Item[] {
  const level = levelOf(id), rng = makeRng(seed);
  if (isMirrorLevel(id)) {
    const firsts: Item[] = level.letters.map(letter => ({ kind: "mirror", letter }));
    const order = shuffle(level.letters, rng);
    const sames: Item[] = Array.from({ length: level.length - firsts.length }, (_, at) => ({ kind: "same", letter: order[at % order.length] }));
    return shuffle([...firsts, ...sames], rng);
  }
  const letters = shuffle(level.letters, rng).slice(0, level.length);
  const kinds = shuffle(Array.from({ length: level.length }, (_, at) => level.kinds[at % level.kinds.length]), rng);
  return letters.map((letter, at) => ({ kind: kinds[at], letter }));
}

/** What the right tap is: a picture's letter ("M"), a small letter ("g"), a capital ("G") or one of b d p q. */
export const answerOf = (item: Item) => item.kind === "small" || item.kind === "mirror" || item.kind === "same" ? item.letter.toLowerCase() : item.letter.toUpperCase();

/** The most tiles a level may show: the two-letter b/d level never brings in p and q. */
export const maxTiles = (level: Level) => isMirrorLevel(level.id) ? Math.min(MAX_CHOICES, level.letters.length) : MAX_CHOICES;

/**
 * The tiles, shuffled: the answer plus the mix-ups children really make. Look-alike letters, no two letters that can make
 * the same first sound, and b d p q against their mirror twin first. `pool` is the letters a picture item may use as foils.
 */
export function choicesFor(item: Item, count: number, seed: number, pool: readonly string[] = ALPHABET): string[] {
  const rng = makeRng(seed), answer = answerOf(item), size = Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, count));
  let foils: string[];
  if (item.kind === "mirror" || item.kind === "same") {
    const twin = MIRROR_TWIN[answer as Mirror];
    foils = [twin, ...MIRROR.filter(letter => letter !== answer && letter !== twin)];
    return shuffle([answer, ...foils.slice(0, size - 1)], rng);
  }
  if (item.kind === "small" || item.kind === "capital") {
    // Capital I and small l are the same stick in most fonts: they are never offered against the sign that shows one of them.
    const lower = item.letter.toLowerCase(), toSmall = item.kind === "small";
    const near = LOOK_ALIKE[lower].filter(letter => !(lower === "i" && letter === "l"));
    const rest = shuffle(ALPHABET.map(letter => letter.toLowerCase()).filter(letter => letter !== lower && !near.includes(letter)), rng);
    // For a small answer the sign is the capital; for a capital answer the sign is the small letter.
    const make = (letter: string) => toSmall ? letter : letter.toUpperCase();
    const banned = (letter: string) => (!toSmall && lower === "l" && letter === "i") || (toSmall && lower === "i" && letter === "l");
    foils = [...near, ...rest].filter(letter => !banned(letter)).map(make);
    return shuffle([answer, ...foils.slice(0, size - 1)], rng);
  }
  const letterPool = item.kind === "picture" ? pool : ALPHABET;
  const clash = SOUND_TWINS[answer] ?? [];
  foils = shuffle(letterPool.filter(letter => letter !== answer && !clash.includes(letter) && !(SOUND_TWINS[letter] ?? []).includes(answer)), rng);
  return shuffle([answer, ...foils.slice(0, size - 1)], rng);
}

/** The line a parent reads aloud, small under the sign. A pre-reader reads the sign and the arrow instead. */
export function askOf(item: Item) {
  switch (item.kind) {
    case "picture": return item.letter === "X" ? "কোন ছবির নামে x আছে?" : `কোন ছবির নাম ${item.letter} দিয়ে শুরু?`;
    case "small": return `বড় হাতের ${item.letter}। ছোট হাতের কোনটা?`;
    case "capital": return `ছোট হাতের ${item.letter.toLowerCase()}। বড় হাতের কোনটা?`;
    case "first": case "mirror": return "প্রথম অক্ষরটা কী?";
    case "same": return "ঠিক এই অক্ষরটা খুঁজে বের করো।";
  }
}

/**
 * What a wrong tap shows on the tapped tile, so the slip teaches without a word:
 * `letter`: the tapped picture's own letter, or the tapped letter's partner (small ↔ capital); `picture`: the tapped letter's own
 * picture; `order`: b d p q drawn with 1, 2 for which part comes first when read from the left.
 */
export type Why = { chip: "letter" | "picture" | "order"; value: string };
export function whyOf(item: Item, chosen: string): Why {
  switch (item.kind) {
    case "picture": { const entry = entryOf(chosen); return { chip: "letter", value: entry.letter === "X" ? "x" : entry.letter }; }
    case "small": return { chip: "letter", value: chosen.toUpperCase() };
    case "capital": return { chip: "letter", value: chosen.toLowerCase() };
    case "first": return { chip: "picture", value: chosen };
    case "mirror": case "same": return { chip: "order", value: chosen };
  }
}

/** One line on why a wrong tap is wrong, for a parent or a 6–7 year old: it names what was tapped. */
export function slipLine(item: Item, chosen: string) {
  const answer = answerOf(item);
  if (item.kind === "mirror" || item.kind === "same") return `${chosen}: ${MIRROR_CUE[chosen as Mirror]}। ${answer}: ${MIRROR_CUE[answer as Mirror]}।`;
  if (item.kind === "small") return `ওটা ছোট হাতের ${chosen}, বড় হাতের ${chosen.toUpperCase()}-এর জোড়া।`;
  if (item.kind === "capital") return `ওটা বড় হাতের ${chosen}, ছোট হাতের ${chosen.toLowerCase()}-এর জোড়া।`;
  const picked = entryOf(chosen);
  return item.kind === "picture"
    ? `ওটা ${picked.word} (${picked.bn}), ${picked.letter === "X" ? "এর শেষে x" : `শুরু ${picked.letter} দিয়ে`}।`
    : `${chosen} দিয়ে শুরু ${picked.word} (${picked.bn})।`;
}

/**
 * Sweet-spot difficulty, never announced: three items in a row missed on the first try take one tile away from the next item,
 * five in a row right on the first try add one. `offset` stays within one tile of the level's own count.
 */
export type Pace = { offset: number; right: number; missed: number };
export const START_PACE: Pace = { offset: 0, right: 0, missed: 0 };
export function nextPace(pace: Pace, firstTry: boolean): Pace {
  if (firstTry) return pace.right + 1 >= 5 ? { offset: Math.min(1, pace.offset + 1), right: 0, missed: 0 } : { ...pace, right: pace.right + 1, missed: 0 };
  return pace.missed + 1 >= 3 ? { offset: Math.max(-1, pace.offset - 1), right: 0, missed: 0 } : { ...pace, missed: pace.missed + 1, right: 0 };
}
export const choiceCount = (level: Level, pace: Pace) => Math.max(MIN_CHOICES, Math.min(maxTiles(level), level.base + pace.offset));

/** After this many wrong taps on one item, the right tile glows. So no item ever takes more than three taps. */
export const HINT_AFTER = 2;
/** Stars only record the round: all but one right on the first try → 3, half or more → 2, any finished round → 1. */
export const starsOf = (firstTry: number, length: number) => starsFor(firstTry, length - 1, Math.ceil(length / 2));

export type Round = {
  level: number; seed: number; items: Item[]; index: number;
  /** Wrong taps on this item, and which tiles they were (a wrong tile stays dim). */
  tries: number; wrong: string[];
  /** Items right on the first try so far. */
  firstTry: number;
  /** Wrong taps in the whole round. */
  misses: number;
  solved: boolean; pace: Pace; choices: string[];
};

const itemSeed = (seed: number, index: number) => (seed + index * 7919) >>> 0;
const tilesFor = (level: Level, item: Item, pace: Pace, seed: number, index: number) => choicesFor(item, choiceCount(level, pace), itemSeed(seed, index), level.letters);

export function createRound(id: number, seed: number, pace: Pace = START_PACE): Round {
  const level = levelOf(id), items = makeItems(id, seed);
  return { level: level.id, seed, items, index: 0, tries: 0, wrong: [], firstTry: 0, misses: 0, solved: false, pace, choices: tilesFor(level, items[0], pace, seed, 0) };
}

export const currentItem = (round: Round) => round.items[round.index];
export const isLast = (round: Round) => round.index >= round.items.length - 1;
export const isDone = (round: Round) => round.solved && isLast(round);
export const hintOn = (round: Round) => !round.solved && round.tries >= HINT_AFTER;

/** A tap on a tile. A right one counts toward the stars only on the first try. A tile already tried, and taps after solving, are ignored. */
export function answer(round: Round, value: string): Round {
  if (round.solved || !round.choices.includes(value) || round.wrong.includes(value)) return round;
  const item = currentItem(round);
  if (value !== answerOf(item)) return { ...round, tries: round.tries + 1, misses: round.misses + 1, wrong: [...round.wrong, value] };
  const first = round.tries === 0;
  return { ...round, solved: true, firstTry: round.firstTry + (first ? 1 : 0), pace: nextPace(round.pace, first) };
}

/** On to the next item, with its tiles sized by the pace so far. */
export function nextItem(round: Round): Round {
  if (!round.solved || isLast(round)) return round;
  const index = round.index + 1;
  return { ...round, index, tries: 0, wrong: [], solved: false, choices: tilesFor(levelOf(round.level), round.items[index], round.pace, round.seed, index) };
}

/** What a finished round shows and records. */
export type Result = { level: number; stars: number; count: number; firstTry: number; misses: number; items: Item[] };
export const resultOf = (round: Round): Result =>
  ({ level: round.level, stars: starsOf(round.firstTry, round.items.length), count: round.items.length, firstTry: round.firstTry, misses: round.misses, items: round.items });

/** The end screen and the parent card: what was done, with no name. */
export function doneLine(id: number, count = levelOf(id).length) {
  if (id === 9) return "আজ b আর d আলাদা করে চিনলাম";
  if (id === 8) return `আজ ${bn(count)}টা অক্ষর মিলিয়ে নিলাম`;
  const kind: Kind = levelOf(id).kinds[0];
  switch (kind) {
    case "picture": return `আজ ${bn(count)}টা অক্ষরের ছবি মেলালাম`;
    case "small": case "capital": return `আজ ${bn(count)} জোড়া বড়-ছোট অক্ষর মেলালাম`;
    case "first": return `আজ ${bn(count)}টা শব্দের প্রথম অক্ষর ধরলাম`;
    case "mirror": case "same": return "আজ b d p q আলাদা করে চিনলাম";
  }
}

/** The informational reward: what the child can do now. */
export const newsOf = (id: number) => ({
  1: "এখন তুমি A থেকে M-এর ছবি চেনো।",
  2: "এখন তুমি N থেকে Z-এর ছবি চেনো।",
  6: "এখন তুমি A থেকে Z, পুরো বাজারের ছবি চেনো।",
  3: "এখন তুমি বড় হাতের অক্ষরের ছোট জোড়া চেনো।",
  7: "এখন তুমি বড় থেকে ছোট, ছোট থেকে বড়, দুই দিকেই জোড়া মেলাতে পারো।",
  4: "এখন তুমি ছবি দেখে প্রথম অক্ষর ধরতে পারো।",
  8: "এখন তুমি ছবি, বড় অক্ষর আর ছোট অক্ষর, সবই মেলাতে পারো।",
  9: "এখন তুমি b আর d আলাদা করতে পারো।",
  5: "এখন তুমি b d p q চারটাই আলাদা করতে পারো।",
} as Record<number, string>)[id] ?? "";

/** A task off the screen, for after the round. */
export const taskOf = (id: number) => id === 3 || id === 7 ? "এবার কোনো বইয়ে বড় হাতের একটা অক্ষর খোঁজো, তারপর তার ছোট জোড়াটা।"
  : id === 4 || id === 8 ? "এবার একটা জিনিসের নাম বলো, আর প্রথম অক্ষরটা আঙুলে লিখে দেখাও।"
  : id === 9 || id === 5 ? "এবার বাতাসে আঙুল দিয়ে b আর d লেখো: আগে লাঠি, না আগে পেট?"
  : "এবার ঘরের একটা জিনিস আম্মুকে দেখাও, আর বলো তার নাম কোন অক্ষর দিয়ে শুরু।";

/** One line of praise for the method, only when earned. */
export function methodLine(misses: number, id: number) {
  if (misses) return `${bn(misses)}বার আবার দেখেছ, তারপর মিলিয়েছ।`;
  return isMirrorLevel(id) ? "লাঠি আর পেট কোন দিকে, দেখে দেখে বেছেছ।" : "একবারও আটকাওনি।";
}
