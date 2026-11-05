// One round of গুনে দেখি: five ponds, each asked and then right. Pure functions on an immutable Round: a miss costs a try
// (two make the answer glow, three in a row quietly ease the next pond, five first-try answers lift the ease), nothing is
// ever lost. Stars only record the round. The page around it (screens, timers, pause) is session.ts.
import { makeRng, starsFor } from "../../../shared/game-core";
import { makeItem, type Item } from "./items";
import { levelOf } from "./levels";

export const ITEMS = 5;
const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type Stage = "count" | "pick" | "koto" | "done";
export type Round = {
  level: number; seed: number; index: number; item: Item; stage: Stage;
  /** guni: the fish tapped, in counting order. */
  counted: number[];
  /** wrong tries on the question on screen, and whether this pond has had any miss. */
  tries: number; clean: boolean;
  firstTry: number; missRun: number; rightRun: number; eased: boolean;
  /** fish counted (guni), patterns seen (nojor) or pond pairs compared or merged (beshi, merge) this round. */
  done: number;
  /** wrong answers in all this round, for the end screen. */
  misses: number;
};

const firstStage = (item: Item): Stage => item.kind === "guni" ? "count" : "pick";

export function createRound(level: number, seed: number, eased = false, rightRun = 0): Round {
  const item = makeItem(level, makeRng(seed), eased, 0);
  return { level, seed, index: 0, item, stage: firstStage(item), counted: [], tries: 0, clean: true, firstTry: 0, missRun: 0, rightRun, eased, done: 0, misses: 0 };
}

/** Counts a fish once. Returns null for a fish already counted or outside the counting stage. */
export function tapFish(round: Round, fish: number): Round | null {
  if (round.item.kind !== "guni" || round.stage !== "count" || round.counted.includes(fish) || fish < 0 || fish >= round.item.n) return null;
  const counted = [...round.counted, fish];
  return { ...round, counted, stage: counted.length === round.item.n ? "pick" : "count" };
}

/** The right answer to the question on screen: a number, or a pond (0 left, 1 right). */
export const answerOf = (round: Round) => {
  const item = round.item;
  if (item.kind === "beshi") return round.stage === "koto" || (round.stage === "done" && item.koto) ? Math.abs(item.counts[0] - item.counts[1]) : item.counts[0] > item.counts[1] ? 0 : 1;
  return item.n;
};

/** One answer: a number tile, or a pond (0 left, 1 right). */
export function answer(round: Round, value: number): { round: Round; outcome: "right" | "again" | "ignore" } {
  if (round.stage !== "pick" && round.stage !== "koto") return { round, outcome: "ignore" };
  if (value !== answerOf(round)) {
    const missRun = round.missRun + 1;
    return { round: { ...round, tries: round.tries + 1, clean: false, missRun, rightRun: 0, eased: round.eased || missRun >= 3, misses: round.misses + 1 }, outcome: "again" };
  }
  const item = round.item;
  if (item.kind === "beshi" && item.koto && round.stage === "pick") return { round: { ...round, stage: "koto", tries: 0, missRun: 0 }, outcome: "right" };
  const rightRun = round.clean ? round.rightRun + 1 : 0;
  const done = round.done + (item.kind === "guni" ? item.n : 1);
  return { round: { ...round, stage: "done", missRun: 0, rightRun, firstTry: round.firstTry + (round.clean ? 1 : 0), eased: round.eased && rightRun < 5, done }, outcome: "right" };
}

/** After two tries on a question, the answer glows. */
export const glows = (round: Round) => round.tries >= 2;
/** The last pond of the round is the one on screen. */
export const isLast = (round: Round) => round.index + 1 >= ITEMS;

/** The next pond of the round, or null after the fifth: the round then ends and waits for the child. */
export function nextItem(round: Round): Round | null {
  if (round.stage !== "done" || isLast(round)) return null;
  const index = round.index + 1, item = makeItem(round.level, makeRng(round.seed + index * 7919), round.eased, index);
  return { ...round, index, item, stage: firstStage(item), counted: [], tries: 0, clean: true };
}

/** Stars only record the round: 3 for four or five first-try answers out of five, 2 for two or three, else 1. */
export const roundStars = (firstTry: number) => starsFor(firstTry, 4, 2);

export type Result = { level: number; stars: number; firstTry: number; done: number; fish: number; seen: number; ponds: number };
/** What the round gave, for the stars, the end screen and today's card. */
export function resultOf(round: Round): Result {
  const kind = levelOf(round.level).kind;
  return {
    level: round.level, stars: roundStars(round.firstTry), firstTry: round.firstTry, done: round.done,
    fish: kind === "guni" ? round.done : 0, seen: kind === "nojor" ? round.done : 0, ponds: kind === "beshi" || kind === "merge" ? round.done : 0,
  };
}

/** What the end screen says the round did (the number counts up beside it). */
export function endLine(result: Result) {
  const kind = levelOf(result.level).kind;
  if (kind === "guni") return `${bn(ITEMS)}টা পুকুরে মোট ${bn(result.done)}টা মাছ গুনলে।`;
  if (kind === "nojor") return `${bn(result.done)}টা নকশা এক নজরে দেখলে।`;
  if (kind === "merge") return `${bn(result.done)}বার দুই পুকুর এক করে গুনলে।`;
  return `${bn(result.done)} জোড়া পুকুর মেলালে।`;
}

/** Praise the method, and only when it earned it. */
export function praiseLine(result: Result) {
  if (result.firstTry < 4) return "";
  const kind = levelOf(result.level).kind;
  if (kind === "guni") return "একটা একটা করে ছুঁয়ে গুনলে, তাই মিলে গেল।";
  if (kind === "nojor") return "না গুনেই চোখে ধরে ফেললে।";
  if (kind === "merge") return "দুই দলের মাছ মিলিয়ে গুনলে, তাই মিলল।";
  return "পাশাপাশি মিলিয়ে দেখলে, তাই ধরতে পারলে।";
}

export type Today = { fish: number; seen: number; ponds: number };
export const noToday: Today = { fish: 0, seen: 0, ponds: 0 };
export const addToday = (today: Today, result: Result): Today => ({ fish: today.fish + result.fish, seen: today.seen + result.seen, ponds: today.ponds + result.ponds });

/** The card's lines for the parent: what was done today, first person, no name. */
export function cardLines(today: Today) {
  return [
    today.fish ? `আজ ${bn(today.fish)}টা মাছ গুনলাম` : "",
    today.seen ? `${today.fish ? "" : "আজ "}${bn(today.seen)}টা নকশা এক নজরে চিনলাম` : "",
    today.ponds ? `${today.fish || today.seen ? "" : "আজ "}${bn(today.ponds)} জোড়া পুকুর মেলালাম` : "",
  ].filter(Boolean);
}
