// The four ছড়া. Only folk rhymes from the safe list in research/kids/b-bangladesh.md §4.1: no known author, so no copyright.
// One common Bangladeshi version each, and only the opening lines, which carry none of the old social content of later verses.
// Sources (all folk; these books show they were already old in the 1890s):
//   hattima — folk; recorded by Jogindranath Sarkar, খুকুমণির ছড়া (1899)
//   ata     — folk; recorded by Rabindranath Tagore, ছেলেভুলানো ছড়া (1894): "আতা গাছে তোতা পাখি, দালিম গাছে মউ"
//   chand   — folk; recorded by Rabindranath Tagore, ছেলেভুলানো ছড়া (1894)
//   agdum   — folk; recorded by Rabindranath Tagore, ছেলেভুলানো ছড়া (1894): "আগডুম বাগডুম ঘোড়াডুম সাজে"
// No Nazrul, no Jasimuddin, no modern author.

export type Spot = { line: number; word: number };
export type Rhyme = {
  id: string;
  name: string;
  source: string;
  lines: readonly string[];
  /** Where the missing word sits (ঢুলি comes twice, so both places go blank). */
  blanks: readonly Spot[];
  answer: string;
  /** The word it rhymes with, as written in the lines, and how both ends sound. */
  partner: string;
  tail: string;
  /** Pictures offered beside the answer: none of them rhyme with it. */
  others: readonly string[];
};

const TAGORE = "লোকছড়া; রবীন্দ্রনাথ ঠাকুর ১৮৯৪ সালে ‘ছেলেভুলানো ছড়া’-য় তুলে রেখেছিলেন";
const JOGINDRANATH = "লোকছড়া; যোগীন্দ্রনাথ সরকার ১৮৯৯ সালে ‘খুকুমণির ছড়া’-য় তুলে রেখেছিলেন";

export const RHYMES: readonly Rhyme[] = [
  {
    id: "hattima", name: "হাট্টিমা টিম টিম", source: JOGINDRANATH,
    lines: ["হাট্টিমা টিম টিম,", "তারা মাঠে পাড়ে ডিম,", "তাদের খাড়া দুটো শিং,", "তারা হাট্টিমা টিম টিম।"],
    blanks: [{ line: 1, word: 3 }], answer: "dim", partner: "টিম", tail: "im", others: ["am", "chhata", "nouka", "bol"],
  },
  {
    id: "ata", name: "আতা গাছে তোতা পাখি", source: TAGORE,
    lines: ["আতা গাছে তোতা পাখি,", "ডালিম গাছে মৌ,", "এত ডাকি তবু কথা", "কও না কেন বউ?"],
    blanks: [{ line: 3, word: 3 }], answer: "bou", partner: "মৌ", tail: "ou", others: ["chhata", "ful", "am", "bol"],
  },
  {
    id: "chand", name: "আয় আয় চাঁদ মামা", source: TAGORE,
    lines: ["আয় আয় চাঁদ মামা, টিপ দিয়ে যা,", "চাঁদের কপালে চাঁদ, টিপ দিয়ে যা।", "ধান ভানলে কুঁড়ো দেব,", "মাছ কাটলে মুড়ো দেব।"],
    blanks: [{ line: 3, word: 2 }], answer: "muro", partner: "কুঁড়ো", tail: "uro", others: ["am", "ful", "chhata", "nouka"],
  },
  {
    id: "agdum", name: "আগডুম বাগডুম", source: TAGORE,
    lines: ["আগডুম বাগডুম ঘোড়াডুম সাজে,", "ঢাক মৃদং ঝাঁঝর বাজে।", "বাজতে বাজতে চলল ঢুলি,", "ঢুলি গেল কমলাফুলি।"],
    blanks: [{ line: 2, word: 3 }, { line: 3, word: 0 }], answer: "dhuli", partner: "কমলাফুলি।", tail: "uli", others: ["nouka", "chhata", "am", "bol"],
  },
];

export const rhymeOf = (id: string) => RHYMES.find(rhyme => rhyme.id === id);

/** A line's words, split on spaces: punctuation stays on its word, and a word is never split into letters. */
export const wordsOf = (line: string) => line.split(/\s+/).filter(Boolean);

/** The word without its trailing punctuation (",", "।", "?"). */
export const bare = (word: string) => word.replace(/[,।?!]+$/u, "");

export const isBlank = (rhyme: Rhyme, line: number, word: number) => rhyme.blanks.some(spot => spot.line === line && spot.word === word);
