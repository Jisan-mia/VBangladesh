// The five levels, each round's items and choices, the hint after a slip, pacing and stars. Pure, no React.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { ALPHABET, entryOf, LOOK_ALIKE, MIRROR, MIRROR_CUE, MIRROR_TWIN, SOUND_TWINS, type Mirror } from "./letters";

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

/**
 * picture: see "M m", pick the mango. small: see "G", pick "g". first: see the picture and "_ango", pick the letter.
 * mirror: b d p q, half "which starts Boat?", half "find this one".
 */
export type Mode = "picture" | "small" | "first" | "mirror";
export type Level = { mode: Mode; title: string; letters: readonly string[] };

export const LEVELS: readonly Level[] = [
  { mode: "picture", title: "A থেকে M: ছবি মেলাও", letters: ALPHABET.slice(0, 13) },
  { mode: "picture", title: "N থেকে Z: ছবি মেলাও", letters: ALPHABET.slice(13) },
  { mode: "small", title: "বড় হাতের, ছোট হাতের", letters: ALPHABET },
  { mode: "first", title: "প্রথম অক্ষর কোনটা?", letters: ALPHABET.filter(letter => letter !== "X") },
  { mode: "mirror", title: "b d p q চিনি", letters: ["B", "D", "P", "Q"] },
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];

export const ROUND = 6;
/** `same`: a b d p q item that shows the letter itself, not a picture. */
export type Kind = Mode | "same";
export type Item = { kind: Kind; letter: string };

function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** Six items, no letter twice (b d p q has four letters, so two of its six show the letter instead of the picture). */
export function makeRound(level: number, seed: number): Item[] {
  const spec = levelOf(level), rng = makeRng(seed);
  if (spec.mode === "mirror") {
    const firsts = spec.letters.map(letter => ({ kind: "mirror" as const, letter }));
    const sames = shuffle(spec.letters, rng).slice(0, ROUND - firsts.length).map(letter => ({ kind: "same" as const, letter }));
    return shuffle([...firsts, ...sames], rng);
  }
  return shuffle(spec.letters, rng).slice(0, ROUND).map(letter => ({ kind: spec.mode, letter }));
}

/** What the right tap is: a picture's letter ("M"), a small letter ("g") or one of b d p q. */
export const answerOf = (item: Item) => item.kind === "small" || item.kind === "mirror" || item.kind === "same" ? item.letter.toLowerCase() : item.letter;

/**
 * The choices, shuffled: the answer plus the mix-ups children really make. Look-alike small letters,
 * no two letters that can make the same first sound, and b d p q against each other (eased: just the mirror twin).
 */
export function choicesFor(item: Item, level: number, count: number, seed: number): string[] {
  const rng = makeRng(seed), answer = answerOf(item);
  let foils: string[];
  if (item.kind === "mirror" || item.kind === "same") {
    const twin = MIRROR_TWIN[answer as Mirror];
    foils = [twin, ...MIRROR.filter(letter => letter !== answer && letter !== twin)];
    return shuffle([answer, ...foils.slice(0, count - 1)], rng);
  }
  if (item.kind === "small") {
    const near = LOOK_ALIKE[answer].filter(letter => !(answer === "i" && letter === "l"));
    const rest = shuffle(ALPHABET.map(letter => letter.toLowerCase()).filter(letter => letter !== answer && !near.includes(letter) && !(answer === "i" && letter === "l")), rng);
    foils = [...near, ...rest];
  } else {
    const pool = item.kind === "picture" ? levelOf(level).letters : ALPHABET;
    const clash = SOUND_TWINS[answer] ?? [];
    foils = shuffle(pool.filter(letter => letter !== answer && !clash.includes(letter) && !(SOUND_TWINS[letter] ?? []).includes(answer)), rng);
  }
  return shuffle([answer, ...foils.slice(0, count - 1)], rng);
}

/** The line the parent reads aloud. */
export function askOf(item: Item) {
  switch (item.kind) {
    case "picture": return item.letter === "X" ? "কোন ছবির নামে x আছে?" : `কোন ছবির নাম ${item.letter} দিয়ে শুরু?`;
    case "small": return `বড় হাতের ${item.letter}। ছোট হাতের কোনটা?`;
    case "first": case "mirror": return "প্রথম অক্ষরটা কী?";
    case "same": return "ঠিক এই অক্ষরটা খুঁজে বের করো।";
  }
}

/** One line on why a wrong tap is wrong: it names what was tapped, so the slip still teaches. */
export function slipLine(item: Item, chosen: string) {
  const answer = answerOf(item);
  if (item.kind === "mirror" || item.kind === "same") {
    return `${chosen}: ${MIRROR_CUE[chosen as Mirror]}। ${answer}: ${MIRROR_CUE[answer as Mirror]}।`;
  }
  if (item.kind === "small") return `ওটা ছোট হাতের ${chosen}, বড় হাতের ${chosen.toUpperCase()}-এর জোড়া।`;
  const picked = entryOf(chosen);
  return item.kind === "picture"
    ? `ওটা ${picked.word} (${picked.bn}), ${picked.letter === "X" ? "এর শেষে x" : `শুরু ${picked.letter} দিয়ে`}।`
    : `${chosen} দিয়ে শুরু ${picked.word} (${picked.bn})।`;
}

/**
 * Sweet-spot difficulty, never announced: three slips in a row ease the next item (2 choices, the answer glows);
 * five right in a row step it up (4 choices). `help`: -1 harder, 0, 1 easier.
 */
export type Pace = { right: number; wrong: number; help: -1 | 0 | 1 };
export const FRESH_PACE: Pace = { right: 0, wrong: 0, help: 0 };
export function nextPace(pace: Pace, correct: boolean): Pace {
  if (correct) { const right = pace.right + 1; return { right, wrong: 0, help: right >= 5 ? -1 : pace.help === 1 ? 0 : pace.help }; }
  const wrong = pace.wrong + 1;
  return { right: 0, wrong, help: wrong >= 3 ? 1 : pace.help === -1 ? 0 : pace.help };
}
/** b d p q always shows all four (it is the 6–7 level); eased, only the mirror twin. */
export const choiceCount = (pace: Pace, mode: Mode) => pace.help === 1 ? 2 : mode === "mirror" || pace.help === -1 ? 4 : 3;
/** The answer glows after two slips on one item, or from the start when eased. */
export const shouldGlow = (pace: Pace, tries: number) => pace.help === 1 || tries >= 2;

/** Stars are a record only: 3 with no slip, 2 with up to two, else 1. A finished round always earns one. */
export const starsOf = (mistakes: number) => starsFor(mistakes, 0, 2, true);

/** The end screen and the parent card: what was done, with no name. */
export function doneLine(level: number, count = ROUND) {
  switch (levelOf(level).mode) {
    case "picture": return `আজ ${bn(count)}টা অক্ষরের ছবি মেলালাম`;
    case "small": return `আজ ${bn(count)} জোড়া বড়-ছোট অক্ষর মেলালাম`;
    case "first": return `আজ ${bn(count)}টা শব্দের প্রথম অক্ষর ধরলাম`;
    case "mirror": return `আজ b d p q আলাদা করে চিনলাম`;
  }
}

/** One line of praise for the method, only when earned. */
export function methodLine(mistakes: number, level: number) {
  if (mistakes) return `${bn(mistakes)}বার আবার দেখেছ, তারপর মিলিয়েছ।`;
  return levelOf(level).mode === "mirror" ? "লাঠি আর পেট কোন দিকে, দেখে দেখে বেছেছ।" : "একবারও আটকাওনি।";
}
