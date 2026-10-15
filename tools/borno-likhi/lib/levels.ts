// The sets, in school order: স্বরবর্ণ, then ব্যঞ্জনবর্ণ by বর্গ, then ০–৯. Each letter has the picture word it turns into.
// The picture words and drawings are reused read-only from অ-তে অজগর, so both games show the same অজগর and the same আম.
import { CONSONANTS, VOWELS } from "../../o-te-ojogor/lib/levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type Level = { title: string; letters: readonly string[] };

export const LEVELS: readonly Level[] = [
  { title: "স্বরবর্ণ: অ থেকে ঊ", letters: ["অ", "আ", "ই", "ঈ", "উ", "ঊ"] },
  { title: "স্বরবর্ণ: ঋ থেকে ঔ", letters: ["ঋ", "এ", "ঐ", "ও", "ঔ"] },
  { title: "ক-বর্গ", letters: ["ক", "খ", "গ", "ঘ", "ঙ"] },
  { title: "চ-বর্গ", letters: ["চ", "ছ", "জ", "ঝ", "ঞ"] },
  { title: "ট-বর্গ", letters: ["ট", "ঠ", "ড", "ঢ", "ণ"] },
  { title: "ত-বর্গ", letters: ["ত", "থ", "দ", "ধ", "ন"] },
  { title: "প-বর্গ", letters: ["প", "ফ", "ব", "ভ", "ম"] },
  { title: "য র ল", letters: ["য", "র", "ল"] },
  { title: "শ ষ স হ", letters: ["শ", "ষ", "স", "হ"] },
  { title: "ড় ঢ় য় ৎ", letters: ["ড়", "ঢ়", "য়", "ৎ"] },
  { title: "ং ঃ ঁ", letters: ["ং", "ঃ", "ঁ"] },
  { title: "সংখ্যা: ০ থেকে ৪", letters: ["০", "১", "২", "৩", "৪"] },
  { title: "সংখ্যা: ৫ থেকে ৯", letters: ["৫", "৬", "৭", "৮", "৯"] },
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];

const NUMBER_WORDS = ["শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়"];

/** What a finished letter turns into: the spoken line and the drawing (o-te-ojogor's art names; "dotsN" draws N dots). */
export type Picture = { label: string; pic: string };
const PICTURES: Record<string, Picture> = Object.fromEntries([
  ...[...VOWELS, ...CONSONANTS].map(item => [item.text, { label: item.label, pic: item.pic }] as const),
  ...NUMBER_WORDS.map((word, n) => [bn(n), { label: `${bn(n)}: ${word}`, pic: n ? `dots${n}` : "plate" }] as const),
]);
export const pictureOf = (char: string): Picture => PICTURES[char] ?? { label: char, pic: "plate" };

const isDigit = (char: string) => /^[০-৯]$/.test(char);
const kindOf = (letters: readonly string[]) => letters.every(isDigit) ? "সংখ্যা" : letters.some(isDigit) ? "বর্ণ আর সংখ্যা" : "বর্ণ";
export const cardLine = (letters: readonly string[]) => `আজ ${bn(letters.length)}টা ${kindOf(letters)} আঙুলে লিখলাম`;
export const endLine = (letters: readonly string[]) => `${bn(letters.length)}টা ${kindOf(letters)} লিখলে: ${letters.join(" ")}`;
