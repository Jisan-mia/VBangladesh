// The ছড়া, as data. Only folk rhymes from the safe list in research/kids/b-bangladesh.md §4.1: no known author, so no
// copyright. One common Bangladeshi version each, and only the opening lines, which carry none of the old social content
// of later verses. Sources (folk; these books show they were already old in the 1890s):
//   hattima — recorded by Jogindranath Sarkar, খুকুমণির ছড়া (1899)
//   ata, chand, agdum, notun, brishti, ghum — recorded by Rabindranath Tagore, ছেলেভুলানো ছড়া (1894)
// No Nazrul, no Jasimuddin, no modern author.

export type Rhyme = {
  id: string;
  name: string;
  source: string;
  lines: readonly string[];
  /** Lines whose last words sound alike (they get one colour and a thread). Written by hand: the sound is not the spelling. */
  groups: readonly (readonly number[])[];
};

const TAGORE = "লোকছড়া; রবীন্দ্রনাথ ঠাকুর ১৮৯৪ সালে ‘ছেলেভুলানো ছড়া’-য় তুলে রেখেছিলেন";
const JOGINDRANATH = "লোকছড়া; যোগীন্দ্রনাথ সরকার ১৮৯৯ সালে ‘খুকুমণির ছড়া’-য় তুলে রেখেছিলেন";

export const RHYMES: readonly Rhyme[] = [
  { id: "hattima", name: "হাট্টিমা টিম টিম", source: JOGINDRANATH,
    lines: ["হাট্টিমা টিম টিম,", "তারা মাঠে পাড়ে ডিম,", "তাদের খাড়া দুটো শিং,", "তারা হাট্টিমা টিম টিম।"], groups: [[0, 1, 3]] },
  { id: "ata", name: "আতা গাছে তোতা পাখি", source: TAGORE,
    lines: ["আতা গাছে তোতা পাখি,", "ডালিম গাছে মৌ,", "এত ডাকি তবু কথা", "কও না কেন বউ?"], groups: [[1, 3]] },
  { id: "chand", name: "আয় আয় চাঁদ মামা", source: TAGORE,
    lines: ["আয় আয় চাঁদ মামা, টিপ দিয়ে যা,", "চাঁদের কপালে চাঁদ, টিপ দিয়ে যা।", "ধান ভানলে কুঁড়ো দেব,", "মাছ কাটলে মুড়ো দেব।"], groups: [[0, 1], [2, 3]] },
  { id: "agdum", name: "আগডুম বাগডুম", source: TAGORE,
    lines: ["আগডুম বাগডুম ঘোড়াডুম সাজে,", "ঢাক মৃদং ঝাঁঝর বাজে।", "বাজতে বাজতে চলল ঢুলি,", "ঢুলি গেল কমলাফুলি।"], groups: [[0, 1], [2, 3]] },
  { id: "notun", name: "নোটন নোটন পায়রাগুলি", source: TAGORE,
    lines: ["নোটন নোটন পায়রাগুলি,", "ঝোটন বেঁধেছে,", "ওপারেতে ছেলে-মেয়ে", "নাইতে নেমেছে।"], groups: [[1, 3]] },
  { id: "brishti", name: "বৃষ্টি পড়ে টাপুর টুপুর", source: TAGORE,
    lines: ["বৃষ্টি পড়ে টাপুর টুপুর,", "নদে এল বান।"], groups: [] },
  { id: "ghum", name: "ঘুমপাড়ানি মাসি-পিসি", source: TAGORE,
    lines: ["ঘুমপাড়ানি মাসি-পিসি,", "মোদের বাড়ি এসো।", "খাট নেই পালঙ্ক নেই,", "খোকার চোখে বসো।", "বাটা ভরা পান দেব,", "গাল ভরে খেয়ো।", "খোকার চোখে ঘুম নেই,", "ঘুম দিয়ে যেয়ো।"], groups: [[1, 3], [5, 7]] },
  { id: "mela", name: "মেলার ঢোল", source: `${JOGINDRANATH}; ${TAGORE}`,
    lines: ["হাট্টিমা টিম টিম,", "তারা মাঠে পাড়ে ডিম,", "আগডুম বাগডুম ঘোড়াডুম সাজে,", "ঢাক মৃদং ঝাঁঝর বাজে।", "আয় আয় চাঁদ মামা, টিপ দিয়ে যা,", "চাঁদের কপালে চাঁদ, টিপ দিয়ে যা।"], groups: [[0, 1], [2, 3], [4, 5]] },
];

export const rhymeOf = (id: string) => RHYMES.find(rhyme => rhyme.id === id);

/** A line's words, split on spaces: punctuation stays on its word, and a word is never split into letters. */
export const wordsOf = (line: string) => line.split(/\s+/).filter(Boolean);

/** The word without its trailing punctuation (",", "।", "?"). */
export const bare = (word: string) => word.replace(/[,।?!]+$/u, "");

/** The rhyme group a line belongs to (0, 1, 2), or -1 when its last word rhymes with none. */
export const groupOf = (rhyme: Rhyme, line: number) => rhyme.groups.findIndex(group => group.includes(line));

/** The most beats a line can show: its words and one rest. The beat ruler has this many dots at most. */
export const MAX_DOTS = Math.max(...RHYMES.flatMap(rhyme => rhyme.lines.map(line => wordsOf(line).length))) + 1;
