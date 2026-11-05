// The words around the game, kept short: a parent reads them, the child sees pictures. Bangla digits, তুমি voice, no praise for taps.
import type { Item } from "./items";
import type { Round } from "./round";

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

/** What was done today, for the card: how many experiments, and the last round's findings. No name, no score. */
export type Today = { count: number; items: readonly Item[] };
export const emptyToday: Today = { count: 0, items: [] };
export const addToday = (today: Today, round: Round): Today => ({ count: today.count + round.items.length, items: round.items });

export const matchLine = (matched: boolean) => matched ? "যা ভেবেছিলে, তা-ই হলো।" : "ভাবনাটা মেলেনি। এবার জানলে।";
export const endLine = (right: number, total: number) => `${bn(total)}টা পরীক্ষা দেখলে। ${bn(right)}টা আন্দাজ মিলল।`;

/** One thing to do away from the screen, said to the grown-up. Praise the method, never the child. */
export const awayLine = (right: number, total: number) => right >= total
  ? "আগে ভাবলে, তারপর দেখলে। বিজ্ঞানীরাও এভাবে কাজ করে।"
  : "যেগুলো মেলেনি, ওগুলো থেকেই নতুন কিছু জানলে।";

/** The card's headline: what was done today, with no name and no score. */
export const cardLine = (count: number) => `আজ ${bn(count)}টা পরীক্ষায় আগে ভাবলাম, তারপর দেখলাম`;
