// The end screen's three numbered choices, decided once: the marked button and Enter both run choice ১ (the old game's
// Enter replayed today's maze while its gold button said লেভেলে ফেরো). Pure, so tests/session.test.ts replays it.
import type { LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, openingLevel, type Where } from "./levels";
import { bn } from "./link";

export type EndChoice = { label: string; kind: "level" | "daily" | "again" | "list"; level: number };

export function endChoices(where: Where, open: number, stars: LevelStars, ahead: readonly number[]): EndChoice[] {
  const back = openingLevel(stars, ahead);
  let first: EndChoice;
  if (where.old) {
    const level = where.level && where.level <= open ? where.level : back;
    first = { label: `লেভেল ${bn(level)} খেলো`, kind: "level", level };
  } else if (where.level && where.level < LEVEL_COUNT && where.level + 1 <= open) {
    first = { label: "পরের লেভেল", kind: "level", level: where.level + 1 };
  } else if (where.level === LEVEL_COUNT) {
    first = { label: "আজকের ধাঁধা", kind: "daily", level: 0 };
  } else {
    first = { label: where.level ? `লেভেল ${bn(back)} খেলো` : "লেভেলে ফেরো", kind: "level", level: back };
  }
  return [first, { label: "আবার খেলো", kind: "again", level: where.level }, { label: "সব লেভেল", kind: "list", level: 0 }];
}

/** Which choice a key on the end screen picks: ১/Enter/Space the first, ২/R the second, ৩ the third; -1 for anything else. */
export const choiceForKey = (key: string) => key === "Enter" || key === " " || key === "1" ? 0 : key === "2" || key === "r" || key === "R" ? 1 : key === "3" ? 2 : -1;
