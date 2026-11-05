// The sets, in school order: স্বরবর্ণ, then ব্যঞ্জনবর্ণ by বর্গ, then ০–৯. Each letter has the picture word it turns into.
// The picture words and drawings are reused read-only from অ-তে অজগর, so both games show the same অজগর and the same আম.
import { CONSONANTS, VOWELS } from "../../o-te-ojogor/lib/levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** Four worlds, in play order. Each is a school-notebook cover colour (see product.css) and ends with a named finale. */
export type WorldId = 0 | 1 | 2 | 3;
export const WORLDS: readonly { id: WorldId; name: string }[] = [
  { id: 0, name: "স্বরবর্ণ" },
  { id: 1, name: "ব্যঞ্জনবর্ণ" },
  { id: 2, name: "কঠিন গড়ন" },
  { id: 3, name: "সংখ্যা" },
];

export type Level = { id: number; title: string; letters: readonly string[]; world: WorldId; teaches: string; finale?: string };

// Ids 1–13 are the original sets (saved stars and ?print=N links keep their meaning). 14–17 are the new world finales:
// five of the world's trickiest letters, one after another. The list below is indexed by id − 1.
export const LEVELS: readonly Level[] = [
  { id: 1, title: "স্বরবর্ণ: অ থেকে ঊ", letters: ["অ", "আ", "ই", "ঈ", "উ", "ঊ"], world: 0, teaches: "১ নম্বর বিন্দু থেকে তীরের দিকে টানা; মাত্রা সবার শেষে" },
  { id: 2, title: "স্বরবর্ণ: ঋ থেকে ঔ", letters: ["ঋ", "এ", "ঐ", "ও", "ঔ"], world: 0, teaches: "মাত্রা ছাড়া বর্ণ: শেষ দাগটা বাঁক, মাত্রা নয়" },
  { id: 3, title: "ক-বর্গ", letters: ["ক", "খ", "গ", "ঘ", "ঙ"], world: 1, teaches: "বাঁকা দাগ আগে, খাড়া দাগ তারপর, মাত্রা শেষে" },
  { id: 4, title: "চ-বর্গ", letters: ["চ", "ছ", "জ", "ঝ", "ঞ"], world: 1, teaches: "খাড়া দাগে ওপর থেকে নিচে, ঘুরে আসা বাঁক" },
  { id: 5, title: "ট-বর্গ", letters: ["ট", "ঠ", "ড", "ঢ", "ণ"], world: 1, teaches: "গোল ভরাট বাঁক, একটানে বন্ধ করা" },
  { id: 6, title: "ত-বর্গ", letters: ["ত", "থ", "দ", "ধ", "ন"], world: 1, teaches: "ছোট ছোট বাঁকের পর লম্বা খাড়া দাগ" },
  { id: 7, title: "প-বর্গ", letters: ["প", "ফ", "ব", "ভ", "ম"], world: 1, teaches: "একই বর্ণে দুই-তিনটা বাঁক পরপর" },
  { id: 8, title: "য র ল", letters: ["য", "র", "ল"], world: 2, teaches: "ঢালু পথ, আর র-এর নিচের ফুটকি" },
  { id: 9, title: "শ ষ স হ", letters: ["শ", "ষ", "স", "হ"], world: 2, teaches: "প্যাঁচানো মাঝখান, তিন-চার দাগের বর্ণ" },
  { id: 10, title: "ড় ঢ় য় ৎ", letters: ["ড়", "ঢ়", "য়", "ৎ"], world: 2, teaches: "নিচে ফুটকি: ছোঁয়া দিলেই বসে যায়" },
  { id: 11, title: "ং ঃ ঁ", letters: ["ং", "ঃ", "ঁ"], world: 2, teaches: "বর্ণের গায়ে বসা চিহ্ন, একা বসে" },
  { id: 12, title: "সংখ্যা: ০ থেকে ৪", letters: ["০", "১", "২", "৩", "৪"], world: 3, teaches: "একটানে লেখা সংখ্যা, মাত্রা নেই" },
  { id: 13, title: "সংখ্যা: ৫ থেকে ৯", letters: ["৫", "৬", "৭", "৮", "৯"], world: 3, teaches: "দুই-তিন বাঁকের সংখ্যা" },
  { id: 14, title: "স্বরের আসর", letters: ["ই", "ঊ", "ঋ", "ঐ", "ঔ"], world: 0, teaches: "স্বরের সবচেয়ে প্যাঁচানো পাঁচটা, পরপর", finale: "স্বরের আসর" },
  { id: 15, title: "ব্যঞ্জনের হাট", letters: ["ঘ", "ছ", "ঝ", "ঠ", "ভ"], world: 1, teaches: "বর্গগুলোর কঠিন পাঁচটা, পরপর", finale: "ব্যঞ্জনের হাট" },
  { id: 16, title: "কঠিনের মেলা", letters: ["ষ", "হ", "ঢ়", "ৎ", "ঁ"], world: 2, teaches: "সবচেয়ে কঠিন গড়নের পাঁচটা", finale: "কঠিনের মেলা" },
  { id: 17, title: "সংখ্যার মালা", letters: ["৩", "৫", "৬", "৮", "৯"], world: 3, teaches: "বাঁকের সংখ্যা পরপর", finale: "সংখ্যার মালা" },
];
/** Play order: each world's sets, then its finale. */
export const ORDER: readonly number[] = [1, 2, 14, 3, 4, 5, 6, 7, 15, 8, 9, 10, 11, 16, 12, 13, 17];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => LEVELS[id - 1].world === world);
/** The first set in play order with no stars yet (everything done: the first). */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];
/** The set after this one in play order, or 0 at the very end. */
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(id) + 1] ?? 0;
export const isFinale = (id: number) => !!levelOf(id).finale;
/** The ?print value: a number from 1 to 17, anything else is set 1. */
export const printLevel = (value: string) => { const n = Math.round(Number(value)); return isLevel(n) ? n : 1; };

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
