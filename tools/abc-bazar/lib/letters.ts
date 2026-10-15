// The 26 English letters, each with one picture word: Bangladeshi things first (Boat, Mango, Rickshaw, Jackfruit), then world ones.
// The English word is the lesson; the Bangla gloss sits under it. Pure data, no React.

export type Entry = {
  /** The capital letter, which is also the id. */
  letter: string;
  word: string;
  /** What a Bangladeshi child calls it. */
  bn: string;
  /** Where the letter sits in the word: 0 for all but X, which is the end of Box. */
  at: number;
};

export const LETTERS: readonly Entry[] = [
  { letter: "A", word: "Apple", bn: "আপেল", at: 0 },
  { letter: "B", word: "Boat", bn: "নৌকা", at: 0 },
  { letter: "C", word: "Cat", bn: "বিড়াল", at: 0 },
  { letter: "D", word: "Duck", bn: "হাঁস", at: 0 },
  { letter: "E", word: "Egg", bn: "ডিম", at: 0 },
  { letter: "F", word: "Fish", bn: "মাছ", at: 0 },
  { letter: "G", word: "Guava", bn: "পেয়ারা", at: 0 },
  { letter: "H", word: "House", bn: "বাড়ি", at: 0 },
  { letter: "I", word: "Ice cream", bn: "আইসক্রিম", at: 0 },
  { letter: "J", word: "Jackfruit", bn: "কাঁঠাল", at: 0 },
  { letter: "K", word: "Kite", bn: "ঘুড়ি", at: 0 },
  { letter: "L", word: "Lemon", bn: "লেবু", at: 0 },
  { letter: "M", word: "Mango", bn: "আম", at: 0 },
  { letter: "N", word: "Nest", bn: "পাখির বাসা", at: 0 },
  { letter: "O", word: "Owl", bn: "পেঁচা", at: 0 },
  { letter: "P", word: "Papaya", bn: "পেঁপে", at: 0 },
  { letter: "Q", word: "Queen", bn: "রানি", at: 0 },
  { letter: "R", word: "Rickshaw", bn: "রিকশা", at: 0 },
  { letter: "S", word: "Sun", bn: "সূর্য", at: 0 },
  { letter: "T", word: "Tiger", bn: "বাঘ", at: 0 },
  { letter: "U", word: "Umbrella", bn: "ছাতা", at: 0 },
  { letter: "V", word: "Van", bn: "ভ্যান গাড়ি", at: 0 },
  { letter: "W", word: "Water", bn: "পানি", at: 0 },
  { letter: "X", word: "Box", bn: "বাক্স", at: 2 },
  { letter: "Y", word: "Yak", bn: "চমরী গাই", at: 0 },
  { letter: "Z", word: "Zebra", bn: "জেব্রা", at: 0 },
];

const BY_LETTER = new Map(LETTERS.map(entry => [entry.letter, entry]));
export const entryOf = (letter: string) => {
  const entry = BY_LETTER.get(letter.toUpperCase());
  if (!entry) throw new Error(`no letter ${letter}`);
  return entry;
};
export const ALPHABET = LETTERS.map(entry => entry.letter);

/** The word split around its letter, so the page can colour it: ["", "M", "ango"], ["Bo", "x", ""]. */
export function splitWord(entry: Entry) {
  const { word, at } = entry;
  return [word.slice(0, at), word[at], word.slice(at + 1)] as const;
}

/** The word with its first letter left blank, for "which letter starts it?": "_ango". */
export const blankWord = (entry: Entry) => `_${entry.word.slice(1)}`;

/** X has almost no everyday first-letter words, and the ones it has (xylophone) start with a "z" sound. Box ends in it. */
export const X_NOTE = "X দিয়ে শুরু হওয়া চেনা শব্দ খুব কম। তাই Box: শেষের x বলে ‘ক্স’, ঠিক বাক্সের মতো।";

/**
 * Small letters children mix up with each one: mirror twins first (b d p q), then shapes that look alike.
 * Never offers l against capital I: in most fonts they are the same stick.
 */
export const LOOK_ALIKE: Readonly<Record<string, readonly string[]>> = {
  a: ["o", "e", "d"], b: ["d", "p", "h"], c: ["e", "o", "a"], d: ["b", "q", "p"], e: ["c", "a", "o"], f: ["t", "l", "j"],
  g: ["q", "y", "j"], h: ["n", "b", "k"], i: ["j", "t", "f"], j: ["i", "g", "y"], k: ["h", "x", "y"], l: ["i", "t", "f"],
  m: ["n", "w", "u"], n: ["m", "h", "u"], o: ["c", "a", "e"], p: ["q", "b", "d"], q: ["p", "g", "d"], r: ["n", "v", "f"],
  s: ["z", "c", "e"], t: ["f", "l", "i"], u: ["n", "v", "w"], v: ["u", "w", "y"], w: ["m", "v", "u"], x: ["k", "y", "z"],
  y: ["g", "v", "j"], z: ["s", "x", "n"],
};

/** Letters that can make the same first sound (Cat and Kite both start with "k"; c can also say "s"): never offered against each other. */
export const SOUND_TWINS: Readonly<Record<string, readonly string[]>> = {
  C: ["K", "Q", "S"], K: ["C", "Q"], Q: ["C", "K"], S: ["C"],
};

/** b d p q: the stick and the round belly, and which way each faces. */
export const MIRROR = ["b", "d", "p", "q"] as const;
export type Mirror = typeof MIRROR[number];
export const MIRROR_TWIN: Record<Mirror, Mirror> = { b: "d", d: "b", p: "q", q: "p" };
/** Read from the left: what comes first, and which way the stick goes. */
export const MIRROR_CUE: Record<Mirror, string> = {
  b: "আগে লাঠি, তারপর পেট, লাঠি ওপরে",
  d: "আগে পেট, তারপর লাঠি, লাঠি ওপরে",
  p: "আগে লাঠি, তারপর পেট, লাঠি নিচে",
  q: "আগে পেট, তারপর লাঠি, লাঠি নিচে",
};
/** Drawing of each: stick x and its top/bottom, belly centre x. Belly centre y is 62, radius 18, line at 80. */
export const MIRROR_SHAPE: Record<Mirror, { stick: number; from: number; to: number; belly: number }> = {
  b: { stick: 16, from: 8, to: 80, belly: 34 },
  d: { stick: 48, from: 8, to: 80, belly: 30 },
  p: { stick: 16, from: 44, to: 96, belly: 34 },
  q: { stick: 48, from: 44, to: 96, belly: 30 },
};
