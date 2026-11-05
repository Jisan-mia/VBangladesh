// The people and food of সমান ভাগ: who sits at the table, what is on the plates, and the words for ১/২, ১/৩, ১/৪.
// Pure data: no React, no randomness. The pictures are in shapes.ts.
const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type Food = "pitha" | "aam" | "moa" | "jilapi" | "ruti";
export const FOOD_NAME: Record<Food, string> = { pitha: "পিঠা", aam: "আম", moa: "মোয়া", jilapi: "জিলাপি", ruti: "রুটি" };
export const SHARE_FOODS: Food[] = ["pitha", "aam", "moa", "jilapi"];

/** A guest at the table. `look` picks hair or scarf, `skin` a tone; `small` is the youngest, drawn smaller. */
export type Guest = { name: string; look: number; skin: number; glasses?: boolean; small?: boolean };
export const GUESTS: Guest[] = [
  { name: "রাফি", look: 0, skin: 1 },
  { name: "নুসরাত", look: 2, skin: 0, glasses: true },
  { name: "জয়", look: 3, skin: 2 },
  { name: "অর্পিতা", look: 1, skin: 1 },
];
export const LITTLE: Guest[] = [{ name: "মং", look: 4, skin: 0, small: true }, { name: "প্রিয়াংকা", look: 1, skin: 2, small: true }];
export const PEOPLE: Record<number, string> = { 2: "দুজন", 3: "তিনজন", 4: "চারজন" };

/** n guests: grown-ish ones in turn, and one little one whose seat moves around the table. */
export function guestsFor(n: number, index: number): Guest[] {
  const big = Array.from({ length: n - 1 }, (_, seat) => GUESTS[(index + seat) % GUESTS.length]);
  big.splice(index % n, 0, LITTLE[index % LITTLE.length]);
  return big;
}

/** ১/২, ১/৩, ১/৪ in the words a Bangladeshi child hears at home, and the textbook's word. */
export const FRACTIONS: Record<number, { word: string; school: string }> = {
  2: { word: "অর্ধেক", school: "এক-দ্বিতীয়াংশ" },
  3: { word: "তিন ভাগের এক ভাগ", school: "এক-তৃতীয়াংশ" },
  4: { word: "চার ভাগের এক ভাগ", school: "এক-চতুর্থাংশ" },
};

export type Mood = "wait" | "smile" | "happy" | "sad" | "oh";
export const MOOD_NAME: Record<Mood, string> = { wait: "অপেক্ষা করছে", smile: "হাসছে", happy: "খুব খুশি", sad: "মন খারাপ", oh: "অবাক" };
