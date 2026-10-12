// The kitchens: each one a round of pots, a little faster than the last, some with a doorbell that rings mid-boil.
// The fastest pot never leaves less than about 0.15 s between 90% and the spill (the original game's hardest pot); later kitchens get harder with more fast pots and more bells instead.
// Server-safe (link.ts reads the pot counts to check a shared result). Kitchen 3 is the original five-pot game, so old links open there.

/** One pot's heat: seconds to the rim, how sharply the foam climbs near the top (>1), and how much it bubbles. */
export type Heat = { seconds: number; power: number; wobble: number };
export type Kitchen = { name: string; pots: readonly Heat[]; bells: number };

const heat = (seconds: number, power: number, wobble: number): Heat => ({ seconds, power, wobble });

export const CLASSIC = 3;
export const KITCHENS: readonly Kitchen[] = [
  { name: "আম্মুর রান্নাঘর", bells: 0, pots: [heat(5.6, 1.1, 0.008), heat(5.3, 1.15, 0.01), heat(5.0, 1.2, 0.012)] },
  { name: "সকালের চা", bells: 0, pots: [heat(5.4, 1.15, 0.01), heat(5.0, 1.22, 0.014), heat(4.7, 1.28, 0.017), heat(4.4, 1.34, 0.02)] },
  // The original game's five pots, unchanged.
  { name: "নানুবাড়ি", bells: 0, pots: [heat(5.2, 1.15, 0.01), heat(4.7, 1.25, 0.016), heat(4.3, 1.34, 0.02), heat(4.0, 1.42, 0.023), heat(3.7, 1.5, 0.026)] },
  { name: "কলিং বেল", bells: 2, pots: [heat(5.0, 1.2, 0.012), heat(4.6, 1.3, 0.016), heat(4.2, 1.38, 0.019), heat(3.9, 1.45, 0.021), heat(3.7, 1.5, 0.022)] },
  { name: "মেসের চুলা", bells: 1, pots: [heat(4.8, 1.25, 0.014), heat(4.4, 1.33, 0.017), heat(4.1, 1.4, 0.019), heat(3.9, 1.45, 0.021), heat(3.75, 1.48, 0.022), heat(3.65, 1.5, 0.022)] },
  { name: "ঈদের সকাল", bells: 2, pots: [heat(4.6, 1.3, 0.016), heat(4.2, 1.38, 0.018), heat(3.95, 1.43, 0.02), heat(3.8, 1.46, 0.021), heat(3.7, 1.49, 0.022), heat(3.6, 1.51, 0.022)] },
  { name: "বিয়েবাড়ি", bells: 2, pots: [heat(4.4, 1.32, 0.017), heat(4.05, 1.4, 0.019), heat(3.85, 1.44, 0.02), heat(3.72, 1.47, 0.021), heat(3.62, 1.5, 0.022), heat(3.55, 1.51, 0.022), heat(3.5, 1.52, 0.022)] },
  { name: "মেজবানের ডেকচি", bells: 3, pots: [heat(4.2, 1.36, 0.018), heat(3.9, 1.43, 0.02), heat(3.75, 1.46, 0.021), heat(3.65, 1.49, 0.022), heat(3.57, 1.51, 0.022), heat(3.5, 1.52, 0.022), heat(3.45, 1.53, 0.022)] },
];
export const KITCHEN_COUNT = KITCHENS.length;

export const kitchenOf = (kitchen: number) => KITCHENS[Math.max(1, Math.min(KITCHEN_COUNT, kitchen)) - 1];
export const potsIn = (kitchen: number) => kitchenOf(kitchen).pots.length;

/** Stars from the round's average: 3 at 90% or more, 2 at 75%, 1 at 50%; under 50% the kitchen isn't cleared yet. */
export const kitchenStars = (total: number) => total >= 90 ? 3 : total >= 75 ? 2 : total >= 50 ? 1 : 0;
export const STAR_MARKS = [50, 75, 90] as const;

const WORDS = ["", "একটা", "দুইটা", "তিনটা", "চারটা", "পাঁচটা", "ছয়টা", "সাতটা"];
const PLAIN = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত"];
/** "পাঁচটা" and "পাঁচ" for a pot count, as people say it. */
export const potsWord = (count: number) => WORDS[count] ?? `${count}টা`;
export const potsPlain = (count: number) => PLAIN[count] ?? String(count);
