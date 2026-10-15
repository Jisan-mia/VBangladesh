// The game as data and rules: ten কার signs, eleven levels of ten picture words, the choices a child sees, how the next
// word gets easier or harder, and the stars. Pure, so tests can check every word and the page only draws what this decides.
// Spellings follow the Bangla Academy প্রমিত বানান: non-তৎসম words take ি/ু (পাখি, বাড়ি, মুলা), তৎসম keep ী/ূ (নদী, সূর্য).
import { makeRng, starsFor } from "../../../shared/game-core";

export const KARS = ["া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ"] as const;
export type Kar = (typeof KARS)[number];

export const KAR_NAME: Record<Kar, string> = {
  "া": "আ-কার", "ি": "ই-কার", "ী": "ঈ-কার", "ু": "উ-কার", "ূ": "ঊ-কার",
  "ৃ": "ঋ-কার", "ে": "এ-কার", "ৈ": "ঐ-কার", "ো": "ও-কার", "ৌ": "ঔ-কার",
};

/** Where the sign shows around its letter, so the empty slot sits exactly there. ো and ৌ wrap both sides. */
export type Side = "left" | "right" | "below" | "both";
export const SIDE: Record<Kar, Side> = {
  "া": "right", "ি": "left", "ী": "right", "ু": "below", "ূ": "below",
  "ৃ": "below", "ে": "left", "ৈ": "left", "ো": "both", "ৌ": "both",
};

/** A lone sign on a dotted circle (◌া), the way primers print it. */
export const dotted = (kar: Kar) => `◌${kar}`;

/** The signs a child most often mixes up with each one, closest first. Wrong choices come from the front of this list. */
export const PARTNERS: Record<Kar, readonly Kar[]> = {
  "া": ["ী", "ো", "ি", "ু"],
  "ি": ["ী", "ে", "া", "ু"],
  "ী": ["ি", "া", "ূ", "ে"],
  "ু": ["ূ", "ৃ", "া", "ি"],
  "ূ": ["ু", "ৃ", "ী", "া"],
  "ৃ": ["ু", "ূ", "ি", "া"],
  "ে": ["ৈ", "ি", "ো", "া"],
  "ৈ": ["ে", "ৌ", "ি", "া"],
  "ো": ["ৌ", "া", "ে", "ু"],
  "ৌ": ["ো", "ৈ", "া", "ি"],
};

/** One picture word with one sign taken out: the `nth` (from 0) time `kar` appears. `not` drops a wrong choice that would spell a real variant. */
export type Item = { word: string; pic: string; kar: Kar; nth: number; not?: readonly Kar[] };
const w = (word: string, pic: string, kar: Kar, nth = 0, not?: Kar[]): Item => ({ word, pic, kar, nth, ...(not ? { not } : {}) });

export type Level = { kar: Kar | null; title: string; base: number; items: readonly Item[] };

// Focus words first, then a few from the level before, so ি sits next to ী and ে next to ৈ.
export const LEVELS: readonly Level[] = [
  { kar: "া", title: "আ-কার", base: 2, items: [
    w("মাছ", "hilsa", "া"), w("কলা", "banana", "া"), w("হাতি", "elephant", "া"), w("ছাতা", "umbrella", "া"), w("থালা", "plate", "া"),
    w("বাঘ", "tiger", "া"), w("ডাব", "coconut", "া"), w("জাহাজ", "ship", "া"), w("ধান", "paddy", "া"), w("পানি", "water", "া"),
  ] },
  { kar: "ি", title: "ই-কার", base: 2, items: [
    w("ঘুড়ি", "kite", "ি"), w("টিয়া", "parrot", "ি"), w("ঘড়ি", "clock", "ি"), w("ঝিনুক", "shell", "ি"), w("হরিণ", "deer", "ি"),
    w("রিকশা", "rickshaw", "ি"), w("হাতি", "elephant", "ি"), w("পানি", "water", "ি"), w("লাটিম", "top", "ি"), w("বিড়াল", "cat", "ি"),
  ] },
  { kar: "ী", title: "ঈ-কার", base: 3, items: [
    w("নদী", "river", "ী"), w("তীর", "arrow", "ী"), w("বীজ", "seeds", "ী"), w("পৃথিবী", "earth", "ী"),
    w("টিয়া", "parrot", "ি"), w("রিকশা", "rickshaw", "ি"), w("হরিণ", "deer", "ি"), w("ঘুড়ি", "kite", "ি"), w("লাটিম", "top", "ি"), w("বিড়াল", "cat", "ি"),
  ] },
  { kar: "ু", title: "উ-কার", base: 3, items: [
    w("ঘুড়ি", "kite", "ু"), w("গরু", "cow", "ু"), w("ফুল", "flower", "ু"), w("ঝিনুক", "shell", "ু"), w("তরমুজ", "watermelon", "ু"),
    w("মুলা", "radish", "ু", 0, ["ূ"]), w("কুকুর", "dog", "ু"), w("জুতা", "shoes", "ু"), w("লিচু", "litchi", "ু"), w("আলু", "potato", "ু"),
  ] },
  { kar: "ূ", title: "ঊ-কার", base: 3, items: [
    w("ময়ূর", "peacock", "ূ"), w("সূর্য", "sun", "ূ"), w("নূপুর", "anklet", "ূ"), w("ধূমকেতু", "comet", "ূ"),
    w("গরু", "cow", "ু"), w("ফুল", "flower", "ু"), w("তরমুজ", "watermelon", "ু"), w("মুলা", "radish", "ু", 0, ["ূ"]), w("কুকুর", "dog", "ু"), w("আলু", "potato", "ু"),
  ] },
  { kar: "ৃ", title: "ঋ-কার", base: 3, items: [
    w("বৃষ্টি", "rain", "ৃ"), w("পৃথিবী", "earth", "ৃ"), w("কৃষক", "farmer", "ৃ"), w("হৃদয়", "heart", "ৃ"), w("বৃত্ত", "circle", "ৃ"),
    w("ঘুড়ি", "kite", "ু"), w("ময়ূর", "peacock", "ূ"), w("সূর্য", "sun", "ূ"), w("জুতা", "shoes", "ু"), w("লিচু", "litchi", "ু"),
  ] },
  { kar: "ে", title: "এ-কার", base: 3, items: [
    w("পেঁপে", "papaya", "ে", 1), w("ভেড়া", "sheep", "ে"), w("সাইকেল", "cycle", "ে"), w("টমেটো", "tomato", "ে"), w("বেল", "woodapple", "ে"),
    w("বেলুন", "balloon", "ে"), w("মেঘ", "cloud", "ে"), w("ঢেউ", "wave", "ে"), w("বেগুন", "brinjal", "ে"), w("দোয়েল", "magpie", "ে"),
  ] },
  { kar: "ৈ", title: "ঐ-কার", base: 3, items: [
    w("বৈঠা", "oar", "ৈ"), w("সৈকত", "beach", "ৈ"), w("শৈবাল", "algae", "ৈ"),
    w("ভেড়া", "sheep", "ে"), w("বেল", "woodapple", "ে"), w("বেলুন", "balloon", "ে"), w("মেঘ", "cloud", "ে"), w("ঢেউ", "wave", "ে"), w("বেগুন", "brinjal", "ে"), w("সাইকেল", "cycle", "ে"),
  ] },
  { kar: "ো", title: "ও-কার", base: 3, items: [
    w("ঢোল", "drum", "ো"), w("দোয়েল", "magpie", "ো"), w("খরগোশ", "rabbit", "ো"), w("টমেটো", "tomato", "ো"), w("মোরগ", "rooster", "ো"),
    w("বোতল", "bottle", "ো"), w("ঘোড়া", "horse", "ো"), w("চোখ", "eye", "ো"), w("গোলাপ", "rose", "ো"), w("মোমবাতি", "candle", "ো"),
  ] },
  { kar: "ৌ", title: "ঔ-কার", base: 3, items: [
    w("নৌকা", "boat", "ৌ"), w("মৌমাছি", "bee", "ৌ"), w("মৌচাক", "hive", "ৌ"), w("কৌটা", "tin", "ৌ"), w("চৌকি", "cot", "ৌ"),
    w("ঢোল", "drum", "ো"), w("দোয়েল", "magpie", "ো"), w("খরগোশ", "rabbit", "ো"), w("মোরগ", "rooster", "ো"), w("ঘোড়া", "horse", "ো"),
  ] },
  { kar: null, title: "সব কার", base: 4, items: [
    w("শাপলা", "lily", "া"), w("মৌমাছি", "bee", "ি"), w("পৃথিবী", "earth", "ী"), w("ঝিনুক", "shell", "ু"), w("নূপুর", "anklet", "ূ"),
    w("কৃষক", "farmer", "ৃ"), w("সাইকেল", "cycle", "ে"), w("বৈঠা", "oar", "ৈ"), w("গোলাপ", "rose", "ো"), w("চৌকি", "cot", "ৌ"),
  ] },
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];
/** "লেভেল ৩ · ঈ-কার" */
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${levelOf(level).title}`;
/** `?print=4` → 4; a bare or odd `?print` gives the mixed sheet with every sign. */
export function printLevel(value: string | null) {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT ? level : LEVEL_COUNT;
}

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

/** The word around the missing sign: `base` is the letter (or conjunct) the sign belongs to. */
export type Parts = { before: string; base: string; after: string };
const NUKTA = "়", HASANTA = "্";

export function splitWord(item: Item): Parts {
  let at = -1;
  for (let i = 0, seen = 0; i < item.word.length; i++) if (item.word[i] === item.kar && seen++ === item.nth) { at = i; break; }
  if (at < 1) throw new Error(`${item.word}: no ${item.kar} #${item.nth}`);
  let start = at - 1;
  if (item.word[start] === NUKTA) start--;
  while (start >= 2 && item.word[start - 1] === HASANTA) start -= 2;
  return { before: item.word.slice(0, start), base: item.word.slice(start, at), after: item.word.slice(at + 1) };
}
/** The word as it reads with `kar` in the slot: মাছ, or মীছ for a wrong pick. */
export const spellWith = (item: Item, kar: Kar) => { const parts = splitWord(item); return parts.before + parts.base + kar + parts.after; };

export const MIN_CHOICES = 2, MAX_CHOICES = 4;

/** The right sign plus the closest look-alikes, `count` tiles in a seeded order. */
export function choicesFor(item: Item, count: number, seed: number): Kar[] {
  const wrong = PARTNERS[item.kar].filter(kar => !item.not?.includes(kar));
  const tiles: Kar[] = [item.kar, ...wrong.slice(0, Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, count)) - 1)];
  const rng = makeRng(seed);
  for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
  return tiles;
}

/**
 * Sweet-spot difficulty, never announced: three words in a row missed on the first try take one tile away from the next word,
 * five in a row right on the first try add one. `offset` stays within one tile of the level's own count.
 */
export type Pace = { offset: number; right: number; missed: number };
export const START_PACE: Pace = { offset: 0, right: 0, missed: 0 };
export function nextPace(pace: Pace, firstTry: boolean): Pace {
  if (firstTry) return pace.right + 1 >= 5 ? { offset: Math.min(1, pace.offset + 1), right: 0, missed: 0 } : { ...pace, right: pace.right + 1, missed: 0 };
  return pace.missed + 1 >= 3 ? { offset: Math.max(-1, pace.offset - 1), right: 0, missed: 0 } : { ...pace, missed: pace.missed + 1, right: 0 };
}
export const choiceCount = (level: number, pace: Pace) => Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, levelOf(level).base + pace.offset));

/** After this many wrong taps on one word, the right tile glows. */
export const HINT_AFTER = 2;
/** Stars only record the round: 8 or more of 10 right on the first try → 3, 5 or more → 2, any finished round → 1. */
export const starsOf = (firstTry: number) => starsFor(firstTry, 8, 5);

/** One round: the level's ten words in a seeded order, where we are, and how this word is going. */
export type Round = { level: number; seed: number; items: Item[]; index: number; tries: number; firstTry: number; solved: boolean; pace: Pace; choices: Kar[] };

const itemSeed = (round: Pick<Round, "seed" | "index">) => (round.seed + round.index * 7919) >>> 0;

export function newRound(level: number, seed: number, pace: Pace = START_PACE): Round {
  const items = [...levelOf(level).items], rng = makeRng(seed);
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  const round = { level, seed, items, index: 0, tries: 0, firstTry: 0, solved: false, pace, choices: [] as Kar[] };
  return { ...round, choices: choicesFor(items[0], choiceCount(level, pace), itemSeed(round)) };
}

/** A tap on a tile. A right one fills the slot and counts toward the stars only on the first try. */
export function answer(round: Round, kar: Kar): Round {
  if (round.solved) return round;
  const item = round.items[round.index];
  if (kar !== item.kar) return { ...round, tries: round.tries + 1 };
  const first = round.tries === 0;
  return { ...round, solved: true, firstTry: round.firstTry + (first ? 1 : 0), pace: nextPace(round.pace, first) };
}

export const isLast = (round: Round) => round.index >= round.items.length - 1;
export const isDone = (round: Round) => round.solved && isLast(round);

/** On to the next word, with its tiles sized by the pace so far. */
export function nextWord(round: Round): Round {
  if (!round.solved || isLast(round)) return round;
  const index = round.index + 1;
  return { ...round, index, tries: 0, solved: false, choices: choicesFor(round.items[index], choiceCount(round.level, round.pace), itemSeed({ seed: round.seed, index })) };
}
