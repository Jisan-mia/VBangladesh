// What was done today, for the parent's card: counts only, kept in memory while the page is open. No name, no photo, never stored.
import { levelOf } from "./course";
import { bn } from "./words";
import type { Result } from "./round";

export type Today = { pictures: number; cards: number; bells: number };
export const EMPTY_TODAY: Today = { pictures: 0, cards: 0, bells: 0 };
export function addToday(today: Today, result: Result): Today {
  const sort = levelOf(result.level).kind === "sort";
  return { pictures: today.pictures + (sort ? 0 : result.count), cards: today.cards + (sort ? result.count : 0), bells: today.bells + result.bells };
}

/** The card's lines for the parent: what was done today, first person, no name. */
export function cardLines(today: Today) {
  const lines = [
    today.pictures ? `${bn(today.pictures)}টা ছবিতে উল্টো খেললাম` : "",
    today.cards ? `${bn(today.cards)}টা কার্ড রং আর আকারে সাজালাম` : "",
    today.bells ? `ঘণ্টা বাজল ${bn(today.bells)} বার, নিয়ম বদলে নিলাম` : "",
  ].filter(Boolean);
  if (lines.length) lines[0] = `আজ ${lines[0]}`;
  return lines;
}

/** The fixed finished-round result the #og preview draws: never read from or written to the phone. */
export const OG_TODAY: Today = { pictures: 20, cards: 10, bells: 3 };
