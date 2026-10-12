// The বর্ণ পরিচয় as data: every sequence, its picture words and the pace of each level. Pure, so tests can check it.
// The picture words are the common primer pairs plus our own picks; no book's wording or drawings are copied.

/** One thing to catch: what falls on the fruit, the line shown when it's caught, and which drawing goes with it. */
export type Item = { text: string; label: string; pic: string; word?: string };

const pair = (text: string, word: string, pic: string): Item => ({ text, label: `${text}-তে ${word}`, pic });
/** For a letter no word starts with: "ব্যাঙের ঙ". */
const inside = (text: string, label: string, pic: string): Item => ({ text, label, pic });

export const VOWELS: Item[] = [
  pair("অ", "অজগর", "snake"), pair("আ", "আম", "mango"), pair("ই", "ইলিশ", "hilsa"), pair("ঈ", "ঈগল", "eagle"),
  pair("উ", "উট", "camel"), pair("ঊ", "ঊষা", "dawn"), pair("ঋ", "ঋতু", "seasons"), pair("এ", "একতারা", "ektara"),
  pair("ঐ", "ঐরাবত", "elephant"), pair("ও", "ওল", "yam"), pair("ঔ", "ঔষধ", "medicine"),
];

export const CONSONANTS: Item[] = [
  pair("ক", "কলা", "banana"), pair("খ", "খরগোশ", "rabbit"), pair("গ", "গরু", "cow"), pair("ঘ", "ঘড়ি", "clock"), inside("ঙ", "ব্যাঙের ঙ", "frog"),
  pair("চ", "চশমা", "glasses"), pair("ছ", "ছাতা", "umbrella"), pair("জ", "জাহাজ", "ship"), pair("ঝ", "ঝিনুক", "shell"), inside("ঞ", "ইঞ্চির ঞ", "ruler"),
  pair("ট", "টমেটো", "tomato"), pair("ঠ", "ঠেলাগাড়ি", "cart"), pair("ড", "ডাব", "coconut"), pair("ঢ", "ঢোল", "drum"), inside("ণ", "হরিণের ণ", "deer"),
  pair("ত", "তরমুজ", "watermelon"), pair("থ", "থালা", "plate"), pair("দ", "দোয়েল", "magpie"), pair("ধ", "ধান", "paddy"), pair("ন", "নৌকা", "boat"),
  pair("প", "পেঁপে", "papaya"), pair("ফ", "ফুল", "flower"), pair("ব", "বই", "book"), pair("ভ", "ভেড়া", "sheep"), pair("ম", "ময়ূর", "peacock"),
  pair("য", "যমজ", "twins"), pair("র", "রিকশা", "rickshaw"), pair("ল", "লাটিম", "top"), pair("শ", "শাপলা", "lily"), pair("ষ", "ষাঁড়", "bull"),
  pair("স", "সাইকেল", "cycle"), pair("হ", "হাঁস", "duck"),
  inside("ড়", "পাহাড়ের ড়", "hill"), inside("ঢ়", "আষাঢ়ের ঢ়", "rain"), inside("য়", "টিয়ার য়", "parrot"),
  inside("ৎ", "বিদ্যুতের ৎ", "bulb"), inside("ং", "রং-এর ং", "paint"), inside("ঃ", "ঃ-এর নাম বিসর্গ", "drops"), inside("ঁ", "চাঁদের ঁ", "moon"),
];

const NUMBER_WORDS = ["এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ"];
const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const NUMBERS: Item[] = NUMBER_WORDS.map((word, index) => ({ text: bnDigits.format(index + 1), label: `${bnDigits.format(index + 1)}: ${word}`, pic: `dots${index + 1}` }));

/** Short everyday words with no যুক্তবর্ণ, each with a drawing. */
export const WORDS: Record<string, string> = {
  "আম": "mango", "বই": "book", "ফুল": "flower", "মাছ": "hilsa", "দই": "curd", "পানি": "water", "হাঁস": "duck", "নৌকা": "boat",
  "কলা": "banana", "গরু": "cow", "ঘুড়ি": "kite", "বাঘ": "tiger", "টিয়া": "parrot", "লাটিম": "top", "শাপলা": "lily",
  "রিকশা": "rickshaw", "টমেটো": "tomato", "তরমুজ": "watermelon",
};

// A letter plus whatever sits on it: ঁ ং ঃ, the nukta, every কার sign, the হসন্ত and the ৌ length mark.
const MARK = /[ঁ-ঃ়া-্ৗ]/u;

/** "নৌকা" → ["নৌ", "কা"]: each letter with its কার, as a child spells it out. */
export function units(word: string) {
  const out: string[] = [];
  for (const char of word.normalize("NFC")) {
    if (MARK.test(char) && out.length) out[out.length - 1] += char;
    else out.push(char);
  }
  return out;
}

/** A word's units as items; the last one carries the word, so catching it shows the picture. */
const spell = (word: string): Item[] => units(word).map((text, index, all) => index === all.length - 1
  ? { text, label: word, pic: WORDS[word], word }
  : { text, label: "", pic: "" });

export type World = "vowel" | "consonant" | "word" | "number";
export type Level = {
  title: string; world: World; items: Item[];
  /** Fall speed in board units a second, fruits beside the right one, seconds it hangs before it drops, and the pause between rounds. */
  speed: number; decoys: number; ripen: number; gap: number;
  /** The end of the alphabet (or of a whole run): a bigger celebration. */
  milestone?: boolean;
};

const C = (from: string, to: string) => CONSONANTS.slice(CONSONANTS.findIndex(item => item.text === from), CONSONANTS.findIndex(item => item.text === to) + 1);
const words = (...list: string[]) => list.flatMap(spell);

export const LEVELS: Level[] = [
  { title: "স্বরবর্ণ: অ থেকে ঊ", world: "vowel", items: VOWELS.slice(0, 6), speed: 95, decoys: 1, ripen: 1, gap: 0.5 },
  { title: "স্বরবর্ণ: ঋ থেকে ঔ", world: "vowel", items: VOWELS.slice(6), speed: 100, decoys: 1, ripen: 0.9, gap: 0.45 },
  { title: "স্বরবর্ণ: অ থেকে ঔ", world: "vowel", items: VOWELS, speed: 112, decoys: 2, ripen: 0.8, gap: 0.4, milestone: true },
  { title: "ব্যঞ্জনবর্ণ: ক থেকে ঙ", world: "consonant", items: C("ক", "ঙ"), speed: 105, decoys: 1, ripen: 0.85, gap: 0.45 },
  { title: "ব্যঞ্জনবর্ণ: চ থেকে ঞ", world: "consonant", items: C("চ", "ঞ"), speed: 112, decoys: 2, ripen: 0.8, gap: 0.4 },
  { title: "ব্যঞ্জনবর্ণ: ট থেকে ণ", world: "consonant", items: C("ট", "ণ"), speed: 122, decoys: 2, ripen: 0.75, gap: 0.4 },
  { title: "ব্যঞ্জনবর্ণ: ত থেকে ন", world: "consonant", items: C("ত", "ন"), speed: 132, decoys: 2, ripen: 0.7, gap: 0.35 },
  { title: "ব্যঞ্জনবর্ণ: প থেকে ম", world: "consonant", items: C("প", "ম"), speed: 142, decoys: 2, ripen: 0.65, gap: 0.35 },
  { title: "ব্যঞ্জনবর্ণ: য থেকে হ", world: "consonant", items: C("য", "হ"), speed: 152, decoys: 3, ripen: 0.6, gap: 0.3 },
  { title: "ব্যঞ্জনবর্ণ: ড় থেকে ঁ", world: "consonant", items: C("ড়", "ঁ"), speed: 160, decoys: 3, ripen: 0.6, gap: 0.3, milestone: true },
  { title: "ব্যঞ্জনবর্ণ: ক থেকে ন, একটানা", world: "consonant", items: C("ক", "ন"), speed: 190, decoys: 3, ripen: 0.45, gap: 0.25 },
  { title: "ব্যঞ্জনবর্ণ: প থেকে ঁ, একটানা", world: "consonant", items: C("প", "ঁ"), speed: 220, decoys: 3, ripen: 0.4, gap: 0.2, milestone: true },
  { title: "শব্দ: আম, বই", world: "word", items: words("আম", "বই"), speed: 100, decoys: 1, ripen: 0.85, gap: 0.5 },
  { title: "শব্দ: ফুল, মাছ, দই", world: "word", items: words("ফুল", "মাছ", "দই"), speed: 115, decoys: 2, ripen: 0.75, gap: 0.45 },
  { title: "শব্দ: পানি, হাঁস, নৌকা", world: "word", items: words("পানি", "হাঁস", "নৌকা"), speed: 130, decoys: 2, ripen: 0.7, gap: 0.4 },
  { title: "শব্দ: কলা, গরু, ঘুড়ি, বাঘ", world: "word", items: words("কলা", "গরু", "ঘুড়ি", "বাঘ"), speed: 150, decoys: 2, ripen: 0.6, gap: 0.35 },
  { title: "শব্দ: টিয়া, লাটিম, শাপলা", world: "word", items: words("টিয়া", "লাটিম", "শাপলা"), speed: 175, decoys: 3, ripen: 0.5, gap: 0.3 },
  { title: "শব্দ: রিকশা, টমেটো, তরমুজ", world: "word", items: words("রিকশা", "টমেটো", "তরমুজ"), speed: 205, decoys: 3, ripen: 0.4, gap: 0.25 },
  { title: "সংখ্যা: ১ থেকে ১০", world: "number", items: NUMBERS.slice(0, 10), speed: 135, decoys: 2, ripen: 0.6, gap: 0.35 },
  { title: "সংখ্যা: ১১ থেকে ২০", world: "number", items: NUMBERS.slice(10), speed: 165, decoys: 3, ripen: 0.55, gap: 0.3 },
  { title: "জোড় সংখ্যা: ২ থেকে ২০", world: "number", items: NUMBERS.filter((_, index) => index % 2 === 1), speed: 195, decoys: 3, ripen: 0.4, gap: 0.25 },
  { title: "উল্টো গোনা: ২০ থেকে ১", world: "number", items: [...NUMBERS].reverse(), speed: 225, decoys: 3, ripen: 0.35, gap: 0.2, milestone: true },
];

export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];

const ALL_WORD_UNITS = [...new Set(Object.keys(WORDS).flatMap(units))];
/** What a wrong fruit may carry: the rest of the same world's set. */
export function decoyPool(world: World) {
  if (world === "vowel") return VOWELS.map(item => item.text);
  if (world === "consonant") return CONSONANTS.map(item => item.text);
  if (world === "number") return NUMBERS.map(item => item.text);
  return ALL_WORD_UNITS;
}

/** Fewest mistakes (a wrong fruit caught, or the right one dropped) for 3 and for 2 stars. Longer runs allow one more. */
export function starLimits(level: number): [three: number, two: number] {
  const n = levelOf(level).items.length;
  const three = n <= 8 ? 1 : 2;
  return [three, three + 3 + Math.floor(n / 6)];
}
