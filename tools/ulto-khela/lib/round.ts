// One round of উল্টো খেলা as pure functions: a picture comes, you tap its opposite (or the same, after a bell), the bell
// flips the rule, then the card sort with its own rule switch (colour, then shape). A quiet ease after three misses in a row,
// a step up after five clean answers. Nothing is timed unless the optional চটপট pace is on, and then only `pass()` is.
// Spec: ai_docs/statecharts/ulto-khela/UltoKhela.tla.
import { makeRng, starsFor } from "../../../shared/game-core";
import { levelOf, type Level } from "./course";
import { flip, opposite, PAIRS, pairIndex, SORT_CARDS, TARGETS, type Card, type Pic, type Rule } from "./pairs";

/** -1 eased, 0 as the level says, 1 brisk. Three misses in a row step down, five clean answers step up. Never announced. */
export type Pace = -1 | 0 | 1;
export const START_PACE: Pace = 0;

/** Pictures between bells at this pace: eased runs are longer, brisk ones shorter, never under two. */
export function runLength(spec: Level, pace: Pace, rng: () => number) {
  if (!spec.run) return Infinity;
  const [low, high] = spec.run, base = low + Math.floor(rng() * (high - low + 1));
  return Math.max(2, base + (pace === -1 ? 2 : pace === 1 ? -1 : 0));
}
/** Pairs in play: the ease keeps to the first three. */
export const pairsInPlay = (spec: Level, pace: Pace) => pace === -1 ? Math.min(spec.pairs, 3) : spec.pairs;
/** চটপট (7+, optional): seconds a picture waits before it quietly passes. */
export const paceSeconds = (pace: Pace) => pace === -1 ? 5 : pace === 1 ? 3 : 4;

export type Item = { kind: "pair"; show: Pic; choices: readonly [Pic, Pic] } | { kind: "sort"; card: Card };

export function makeItem(spec: Level, pace: Pace, rng: () => number, previous?: Item): Item {
  if (spec.kind === "sort") {
    // Alternate mostly, so the habit from the last card is what has to be stopped.
    const last = previous?.kind === "sort" ? SORT_CARDS.findIndex(card => card.color === previous.card.color) : -1;
    const index = last >= 0 && rng() < 0.7 ? 1 - last : Math.floor(rng() * 2);
    return { kind: "sort", card: SORT_CARDS[index] };
  }
  const pool = PAIRS.slice(0, pairsInPlay(spec, pace)).flat().filter(pic => previous?.kind !== "pair" || pic !== previous.show);
  const show = pool[Math.floor(rng() * pool.length)];
  const other = opposite(show);
  return { kind: "pair", show, choices: rng() < 0.5 ? [show, other] : [other, show] };
}

/** The index (0 or 1) of the right button under a rule. */
export function rightChoice(item: Item, rule: Rule) {
  if (item.kind === "pair") return item.choices.indexOf(rule === "same" ? item.show : opposite(item.show));
  return TARGETS.findIndex(target => rule === "shape" ? target.shape === item.card.shape : target.color === item.card.color);
}

export type Last = "none" | "right" | "wrong" | "pass";
export type Round = {
  level: number; seed: number; index: number; item: Item; rule: Rule; stage: "pick" | "done";
  /** demo: the ghost finger shows the right tap (the first picture, and the first after every bell); it doesn't count. */
  demo: boolean; rang: boolean;
  since: number; run: number; pace: Pace;
  tries: number; clean: boolean; missRun: number; rightRun: number;
  scored: number; firstTry: number; done: number; bells: number; passes: number;
  /** Which pairs have come up (a bit per pair), for the end screen's strip. */
  seen: number;
  /** What the last tap did, and the button it hit when that was wrong. */
  last: Last; wrongChoice: -1 | 0 | 1;
};

const itemRng = (seed: number, index: number) => makeRng(seed + index * 7919);
const seenOf = (item: Item) => item.kind === "pair" ? 1 << pairIndex(item.show) : 0;

export function createRound(level: number, seed: number, pace: Pace = START_PACE): Round {
  const spec = levelOf(level), rng = itemRng(seed, 0), item = makeItem(spec, pace, rng);
  return {
    level, seed, index: 0, item, rule: spec.first, stage: "pick", demo: true, rang: false,
    since: 0, run: runLength(spec, pace, rng), pace, tries: 0, clean: true, missRun: 0, rightRun: 0,
    scored: 0, firstTry: 0, done: 0, bells: 0, passes: 0, seen: seenOf(item), last: "none", wrongChoice: -1,
  };
}

export const answerOf = (round: Round) => rightChoice(round.item, round.rule);
/** After two tries on a picture, the right button glows. */
export const glows = (round: Round) => round.tries >= 2;
export const isLast = (round: Round) => round.index + 1 >= levelOf(round.level).items;
export const isDone = (round: Round) => round.stage === "done" && isLast(round);

/** A miss: a try is spent, and three in a row quietly ease the pace. Demo pictures never move the pace. */
function miss(round: Round): Round {
  if (round.demo) return { ...round, tries: round.tries + 1, clean: false };
  const missRun = round.missRun + 1, down = missRun >= 3;
  return { ...round, tries: round.tries + 1, clean: false, rightRun: 0, missRun: down ? 0 : missRun, pace: down ? Math.max(-1, round.pace - 1) as Pace : round.pace };
}

function finish(round: Round, last: Last): Round {
  const scored = round.scored + (round.demo ? 0 : 1), firstTry = round.firstTry + (!round.demo && round.clean ? 1 : 0);
  let { rightRun, pace } = round;
  if (!round.demo) {
    rightRun = round.clean ? rightRun + 1 : 0;
    if (rightRun >= 5) { rightRun = 0; pace = Math.min(1, pace + 1) as Pace; }
  }
  return { ...round, stage: "done", scored, firstTry, rightRun, pace, missRun: round.demo || !round.clean ? round.missRun : 0, done: round.done + 1, passes: round.passes + (last === "pass" ? 1 : 0), last, wrongChoice: -1 };
}

/** One tap on button 0 or 1. Nothing changes under the finger on a miss: the same picture waits. */
export function answer(round: Round, choice: number): { round: Round; outcome: "right" | "again" | "ignore" } {
  if (round.stage !== "pick" || (choice !== 0 && choice !== 1)) return { round, outcome: "ignore" };
  if (choice !== answerOf(round)) return { round: { ...miss(round), last: "wrong", wrongChoice: choice }, outcome: "again" };
  return { round: finish(round, "right"), outcome: "right" };
}

/** চটপট only: the picture's time ran out. It passes quietly and counts as a miss, with no sound and nothing lost. */
export function pass(round: Round): Round {
  if (round.stage !== "pick" || round.demo) return round;
  return finish(miss(round), "pass");
}

/** The next picture, ringing the bell when the run is over (never on the last picture), or null when the round is over. */
export function nextItem(round: Round): Round | null {
  const spec = levelOf(round.level);
  if (round.stage !== "done" || round.index + 1 >= spec.items) return null;
  const index = round.index + 1, rng = itemRng(round.seed, index), since = round.since + 1;
  const ring = since >= round.run && index < spec.items - 1 && !(spec.once && round.bells > 0);
  const item = makeItem(spec, round.pace, rng, round.item);
  return {
    ...round, index, item, stage: "pick", tries: 0, clean: true, demo: ring, rang: ring, last: "none", wrongChoice: -1,
    rule: ring ? flip(round.rule) : round.rule, since: ring ? 0 : since, run: ring ? runLength(spec, round.pace, rng) : round.run,
    bells: round.bells + (ring ? 1 : 0), seen: round.seen | seenOf(item),
  };
}

export type Result = { level: number; count: number; firstTry: number; mistakes: number; bells: number; passes: number; stars: number; seen: number[] };
/** Stars only record the round: no miss or one → 3, up to three → 2, else 1. Slow mode never changes them. */
export function resultOf(round: Round): Result {
  const mistakes = round.scored - round.firstTry;
  return {
    level: round.level, count: round.done, firstTry: round.done - mistakes, mistakes, bells: round.bells, passes: round.passes,
    stars: starsFor(mistakes, 1, 3, true), seen: PAIRS.map((_, index) => index).filter(index => round.seen & (1 << index)),
  };
}

/** Which pair a picture belongs to (its note's step), or -1 for a card. */
export const pairIndexOf = (item: Item) => item.kind === "pair" ? pairIndex(item.show) : -1;
