// The game as data and rules: 34 picture words, each with one যুক্তবর্ণ, in four sets from easy doubles to রেফ and ফলা;
// eight levels (ভাঙি then জুড়ি per set), the letter tiles, the hint ladder, the quiet difficulty steps and the stars.
// Pure, so tests check every word and the page only draws what this decides.
// Spellings follow the Bangla Academy প্রমিত বানান (ঘণ্টা with ণ as তৎসম, ঠান্ডা with ন as দেশি, অঙ্ক, বাক্স).
import { makeRng, starsFor } from "../../../shared/game-core";

export const HASANTA = "্";

/** A picture word, the base letters of its one যুক্তবর্ণ in written order, and three wrong letters, the likeliest mix-up first. */
export type Word = { word: string; pic: string; parts: readonly string[]; decoys: readonly string[] };
const w = (word: string, pic: string, parts: string, decoys: string): Word => ({ word, pic, parts: [...parts], decoys: [...decoys] });

/** The যুক্তবর্ণ itself: base letters joined with হসন্ত (ক + ্ + ষ = ক্ষ), NFC. */
export const conjunct = (parts: readonly string[]) => parts.join(HASANTA).normalize("NFC");

export type SetId = "double" | "common" | "tricky" | "phala";
export const SETS: Record<SetId, { title: string; words: readonly Word[] }> = {
  double: {
    title: "জোড়া বর্ণ",
    words: [
      w("রসগোল্লা", "roshogolla", "লল", "নরব"), w("ছক্কা", "dice", "কক", "খগফ"), w("বাচ্চা", "chick", "চচ", "ছজস"),
      w("চৌদ্দ", "dots14", "দদ", "ধডত"), w("রান্না", "pot", "নন", "ণলম"), w("লাড্ডু", "laddu", "ডড", "টদঢ"),
      w("ভুট্টা", "corn", "টট", "ঠতড"), w("চপ্পল", "sandal", "পপ", "ফবস"),
    ],
  },
  common: {
    title: "চেনা যুক্তবর্ণ",
    words: [
      w("বৃষ্টি", "rain", "ষট", "সশঠ"), w("গল্প", "book", "লপ", "নফব"), w("স্কুল", "school", "সক", "শষখ"),
      w("রাস্তা", "road", "সত", "শথট"), w("বন্ধু", "friends", "নধ", "ণদব"), w("ঘণ্টা", "bell", "ণট", "নঠত"),
      w("জঙ্গল", "forest", "ঙগ", "ংনঘ"), w("খুন্তি", "khunti", "নত", "ণটথ"), w("ঠান্ডা", "ice", "নড", "ণটদ"),
      w("পদ্ম", "lotus", "দম", "ধনব"),
    ],
  },
  tricky: {
    title: "কঠিন যুক্তবর্ণ",
    words: [
      w("পক্ষী", "parrot", "কষ", "খসশ"), w("ক্ষীর", "kheer", "কষ", "খশস"), w("বিজ্ঞান", "science", "জঞ", "গনয"),
      w("ইঞ্জিন", "engine", "ঞজ", "নংয"), w("মুক্তা", "pearl", "কত", "খটথ"), w("অঙ্ক", "slate", "ঙক", "ংনখ"),
      w("পৃষ্ঠা", "page", "ষঠ", "সটথ"), w("বাক্স", "box", "কস", "খশষ"),
    ],
  },
  phala: {
    title: "ফলা আর রেফ",
    words: [
      w("ট্রেন", "train", "টর", "ঠলড"), w("প্রজাপতি", "butterfly", "পর", "ফবল"), w("চন্দ্র", "moon", "নদর", "ণধড"),
      w("ব্যাঙ", "frog", "বয", "রভল"), w("ব্যাগ", "bag", "বয", "ভরপ"), w("সূর্য", "sun", "রয", "বলজ"),
      w("শার্ট", "shirt", "রট", "ঠবড"), w("মার্বেল", "marbles", "রব", "ভলক"),
    ],
  },
};
export const ALL_WORDS: readonly Word[] = Object.values(SETS).flatMap(set => set.words);

export type Mode = "bhangi" | "juri";
export type Level = { set: SetId; mode: Mode; title: string };
const MODE_TITLE: Record<Mode, string> = { bhangi: "ভাঙি", juri: "জুড়ি" };
// ভাঙি first: seeing ক্ষ and naming its parts is easier than spelling it from the sound alone.
export const LEVELS: readonly Level[] = (["double", "common", "tricky", "phala"] as const).flatMap(set =>
  (["bhangi", "juri"] as const).map(mode => ({ set, mode, title: `${SETS[set].title} ${MODE_TITLE[mode]}` })));
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, Math.round(level) || 1)) - 1];
export const ROUND_SIZE = 6;

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
/**
 * A word's user-perceived letters (প | ক্ষী), from Intl.Segmenter. Older engines without the Unicode 15.1 conjunct rule
 * split after a হসন্ত (প | ক্ | ষী), so a piece ending in হসন্ত is joined to the next one.
 */
export function graphemes(text: string) {
  const out: string[] = [];
  for (const { segment } of segmenter.segment(text)) {
    if (out.length && out[out.length - 1].endsWith(HASANTA)) out[out.length - 1] += segment;
    else out.push(segment);
  }
  return out;
}

/** The word around its যুক্তবর্ণ: `cluster` is the whole akshara that holds it, with any কার (ষ্টি, ক্ষী). */
export function splitWord(item: Word) {
  const pieces = graphemes(item.word), joint = conjunct(item.parts);
  const at = pieces.findIndex(piece => piece.includes(joint));
  return { before: pieces.slice(0, at).join(""), cluster: pieces[at] ?? "", after: pieces.slice(at + 1).join("") };
}

/** What a joined letter turns into, for the one-line note after a রেফ or ফলা: র first rises as রেফ, র or য after sits as a ফলা. */
export function shapeNote(parts: readonly string[]) {
  if (parts[0] === "র") return "র আগে বসলে মাথায় ওঠে। এর নাম রেফ।";
  const last = parts[parts.length - 1];
  if (last === "র") return "র পরে বসলে নিচে নামে। এর নাম র-ফলা।";
  if (last === "য") return "য পরে বসলে পাশে ছোট হয়ে বসে। এর নাম য-ফলা।";
  return "";
}

/** "ক্ষ = ক + ষ" */
export const equation = (parts: readonly string[]) => `${conjunct(parts)} = ${parts.join(" + ")}`;

function shuffle<T>(items: readonly T[], rng: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** Wrong letters shown: 2 normally, 1 after three misses in a row, 3 after five right in a row. Never announced. */
export const DECOYS = { easy: 1, normal: 2, hard: 3 } as const;
export type Pace = keyof typeof DECOYS;

/** The letter tiles for one word: its distinct base letters plus `count` decoys, shuffled. Tiles are never used up (ক + ক). */
export function tilesFor(item: Word, pace: Pace, seed: number) {
  return shuffle([...new Set(item.parts), ...item.decoys.slice(0, DECOYS[pace])], makeRng(seed));
}

export type Round = {
  level: number; seed: number; items: readonly Word[]; index: number;
  filled: string[];         // letters in the machine's slots so far
  solved: boolean;          // the current word is done; waiting for "পরেরটা"
  misses: number;           // wrong tries this round (for the stars)
  tries: number;            // wrong tries on this word (for the hints)
  missRun: number; rightRun: number; pace: Pace;
  last: { outcome: Outcome; tried: string[] } | null;
};
export type Outcome = "fill" | "right" | "order" | "wrong" | "ignore";

export function newRound(level: number, seed: number): Round {
  const spec = levelOf(level), rng = makeRng(seed);
  return {
    level: LEVELS.indexOf(spec) + 1, seed, items: shuffle(SETS[spec.set].words, rng).slice(0, ROUND_SIZE), index: 0,
    filled: [], solved: false, misses: 0, tries: 0, missRun: 0, rightRun: 0, pace: "normal", last: null,
  };
}

export const current = (round: Round) => round.items[round.index];
export const done = (round: Round) => round.index >= round.items.length;
export const tiles = (round: Round) => tilesFor(current(round), round.pace, round.seed + round.index * 7919);

/** Puts a letter in the next empty slot; when the slots are full, checks them. A wrong try empties the slots. */
export function place(round: Round, letter: string): { round: Round; outcome: Outcome } {
  if (done(round) || round.solved) return { round, outcome: "ignore" };
  const item = current(round), filled = [...round.filled, letter];
  if (filled.length < item.parts.length) return { round: { ...round, filled, last: null }, outcome: "fill" };
  if (filled.every((part, i) => part === item.parts[i])) {
    const rightRun = round.rightRun + 1;
    // The pace changes only for the next word, never under the child's finger.
    const pace: Pace = rightRun >= 5 ? "hard" : round.pace === "easy" && rightRun >= 2 ? "normal" : round.pace;
    return { round: { ...round, filled, solved: true, rightRun, missRun: 0, pace, last: { outcome: "right", tried: filled } }, outcome: "right" };
  }
  const outcome: Outcome = [...filled].sort().join() === [...item.parts].sort().join() ? "order" : "wrong";
  const missRun = round.missRun + 1;
  return {
    round: { ...round, filled: [], misses: round.misses + 1, tries: round.tries + 1, missRun, rightRun: 0, pace: missRun >= 3 ? "easy" : round.pace === "hard" ? "normal" : round.pace, last: { outcome, tried: filled } },
    outcome,
  };
}

/** Takes the last letter back out of the machine. */
export const unplace = (round: Round): Round => round.solved || !round.filled.length ? round : { ...round, filled: round.filled.slice(0, -1), last: null };

export const next = (round: Round): Round => ({ ...round, index: round.index + 1, filled: [], solved: false, tries: 0, last: null });

/** 0 = nothing, 1 = a one-line reason, 2 = the right tiles glow (after two wrong tries on this word). */
export const hint = (round: Round) => Math.min(2, round.tries);

/** Why a try didn't fit, in one line, naming what was right. Never a buzzer, never "ভুল". */
export function whyLine(round: Round) {
  const last = round.last, item = current(round);
  if (!last || last.outcome === "right" || !item) return "";
  if (last.outcome === "order") return `বর্ণ ${item.parts.length === 3 ? "তিনটা" : "দুটো"} ঠিক, আগে-পরে উল্টো। যেটা আগে শোনো, সেটা আগে বসাও।`;
  const kept = last.tried.filter((part, i) => part === item.parts[i]);
  const stray = [...new Set(last.tried.filter(part => !item.parts.includes(part)))];
  const parts = [kept.length ? `${kept.join(", ")} ঠিক জায়গায়।` : "", stray.length ? `${stray.join(", ")} এই যুক্তবর্ণে নেই।` : ""].filter(Boolean);
  return parts.length ? parts.join(" ") : "আরেকবার ভাবো। শব্দটা ধীরে বলে দেখো।";
}

/** Stars record clean work: 0–1 wrong tries in a round = 3, up to 4 = 2, else 1. */
export const starsOf = (misses: number) => starsFor(misses, 1, 4, true);

/** "আজ ৬টা যুক্তবর্ণ ভাঙলাম" for the card; জুড়লাম after a জুড়ি round, both when the day had both. */
export function cardLine(count: number, modes: readonly Mode[]) {
  const verb = modes.includes("bhangi") && modes.includes("juri") ? "ভাঙলাম আর জুড়লাম" : modes.includes("juri") ? "জুড়লাম" : "ভাঙলাম";
  return `আজ ${bn(count)}টা যুক্তবর্ণ ${verb}`;
}

/** A praise line about the method, only when it was earned. */
export function methodLine(round: Round) {
  if (round.misses === 0) return "একবারও আগে-পরে গোলমাল হয়নি। ধীরে বলে বলে বসিয়েছ।";
  if (round.misses <= 4) return `${bn(round.misses)}বার আবার ভাবতে হয়েছে, তারপর সব মিলেছে।`;
  return "কঠিন ছিল, তবু শেষ পর্যন্ত সবগুলো মিলিয়েছ।";
}

/** The ten words on the ?print sheet "ভেঙে লেখো": easy to hard, one রেফ and one ফলা among them. */
export const PRINT_WORDS: readonly string[] = ["রসগোল্লা", "চৌদ্দ", "বৃষ্টি", "গল্প", "স্কুল", "বন্ধু", "পক্ষী", "বিজ্ঞান", "চন্দ্র", "সূর্য"];
export const printItems = () => PRINT_WORDS.map(word => ALL_WORDS.find(item => item.word === word)!);
