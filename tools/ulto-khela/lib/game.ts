// উল্টো খেলা's rules as pure functions: a day–night Stroop (tap the opposite picture), a bell that flips the rule to "same"
// and back, then the card sort with a rule switch (colour, then shape). A quiet ease after three misses in a row, a step up
// after five clean answers. No timer unless the optional চটপট pace is on.
import { makeRng, starsFor } from "../../../shared/game-core";

export type Pic = "sun" | "moon" | "cat" | "mouse" | "big" | "small" | "day" | "night" | "cold" | "hot";
/** The word under each picture, for the parent to read aloud. */
export const WORDS: Record<Pic, string> = {
  sun: "সূর্য", moon: "চাঁদ", cat: "বিড়াল", mouse: "ইঁদুর", big: "বড়", small: "ছোট", day: "দিন", night: "রাত", cold: "ঠান্ডা", hot: "গরম",
};
/** Silly, clear pairs; the first two are the day–night ones the youngest start with. */
export const PAIRS: [Pic, Pic][] = [["sun", "moon"], ["day", "night"], ["cat", "mouse"], ["big", "small"], ["cold", "hot"]];
export const opposite = (pic: Pic) => { const pair = PAIRS.find(each => each.includes(pic))!; return pair[0] === pic ? pair[1] : pair[0]; };

export type Color = "red" | "blue";
export type Shape = "flower" | "boat";
export type Card = { color: Color; shape: Shape };
export const COLOR_WORDS: Record<Color, string> = { red: "লাল", blue: "নীল" };
export const SHAPE_WORDS: Record<Shape, string> = { flower: "ফুল", boat: "নৌকা" };
/** The two baskets of the card sort. Every card matches one basket by colour and the other by shape. */
export const TARGETS: [Card, Card] = [{ color: "red", shape: "boat" }, { color: "blue", shape: "flower" }];
export const SORT_CARDS: Card[] = [{ color: "red", shape: "flower" }, { color: "blue", shape: "boat" }];

export type Rule = "ulto" | "same" | "color" | "shape";
export const RULES: Record<Rule, { name: string; say: string }> = {
  ulto: { name: "উল্টো", say: "উল্টোটায় চাপো" },
  same: { name: "একই", say: "একই ছবিতে চাপো" },
  color: { name: "রং মেলাও", say: "একই রঙের ঝুড়িতে দাও" },
  shape: { name: "আকার মেলাও", say: "একই আকারের ঝুড়িতে দাও" },
};
export const flip = (rule: Rule): Rule => ({ ulto: "same", same: "ulto", color: "shape", shape: "color" } as const)[rule];

/** `run` is how many pictures pass between bells (null: the rule never changes); `once` stops after the first bell. */
export type LevelSpec = { kind: "pair" | "sort"; label: string; items: number; pairs: number; first: Rule; run: [number, number] | null; once?: boolean };
export const LEVELS: LevelSpec[] = [
  { kind: "pair", label: "সূর্য এলে চাঁদ", items: 8, pairs: 2, first: "ulto", run: null },
  { kind: "pair", label: "সব উল্টো", items: 10, pairs: 5, first: "ulto", run: null },
  { kind: "pair", label: "ঘণ্টা বাজলে একই", items: 10, pairs: 3, first: "ulto", run: [4, 5] },
  { kind: "pair", label: "ঘণ্টা বারবার", items: 12, pairs: 5, first: "ulto", run: [2, 4] },
  { kind: "sort", label: "রং, তারপর আকার", items: 10, pairs: 0, first: "color", run: [5, 5], once: true },
  { kind: "sort", label: "রং না আকার?", items: 12, pairs: 0, first: "color", run: [2, 4] },
];
export const LEVEL_COUNT = LEVELS.length;
export const specOf = (level: number) => LEVELS[level - 1];

/** -1 eased, 0 as the level says, 1 brisk. Three misses in a row step down, five clean answers step up. Never announced. */
export type Pace = -1 | 0 | 1;
/** Pictures between bells at this pace: eased runs are longer, brisk ones shorter, never under two. */
export function runLength(spec: LevelSpec, pace: Pace, rng: () => number) {
  if (!spec.run) return Infinity;
  const [low, high] = spec.run, base = low + Math.floor(rng() * (high - low + 1));
  return Math.max(2, base + (pace === -1 ? 2 : pace === 1 ? -1 : 0));
}
/** Pairs in play: the ease keeps to the first three. */
export const pairsInPlay = (spec: LevelSpec, pace: Pace) => pace === -1 ? Math.min(spec.pairs, 3) : spec.pairs;
/** চটপট (7+, optional): seconds a picture waits before it quietly passes. */
export const paceSeconds = (pace: Pace) => pace === -1 ? 5 : pace === 1 ? 3 : 4;

export type Item = { kind: "pair"; show: Pic; choices: [Pic, Pic] } | { kind: "sort"; card: Card };

export function makeItem(spec: LevelSpec, pace: Pace, rng: () => number, previous?: Item): Item {
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

export type Round = {
  level: number; seed: number; index: number; item: Item; rule: Rule; stage: "pick" | "done";
  /** demo: the ghost finger shows the right tap (the first picture, and the first after every bell); it doesn't count. */
  demo: boolean; rang: boolean;
  since: number; run: number; pace: Pace;
  tries: number; clean: boolean; missRun: number; rightRun: number;
  scored: number; firstTry: number; done: number; bells: number;
};

const itemRng = (seed: number, index: number) => makeRng(seed + index * 7919);

export function newRound(level: number, pace: Pace = 0, seed = 1 + Math.floor(Math.random() * 1e9)): Round {
  const spec = specOf(level), rng = itemRng(seed, 0);
  return {
    level, seed, index: 0, item: makeItem(spec, pace, rng), rule: spec.first, stage: "pick", demo: true, rang: false,
    since: 0, run: runLength(spec, pace, rng), pace, tries: 0, clean: true, missRun: 0, rightRun: 0, scored: 0, firstTry: 0, done: 0, bells: 0,
  };
}

export const answerOf = (round: Round) => rightChoice(round.item, round.rule);
/** After two tries on a picture, the right button glows. */
export const glows = (round: Round) => round.tries >= 2;

/** A miss: a try is spent, and three in a row quietly ease the pace. Demo pictures never move the pace. */
function miss(round: Round): Round {
  if (round.demo) return { ...round, tries: round.tries + 1, clean: false };
  const missRun = round.missRun + 1, down = missRun >= 3;
  return { ...round, tries: round.tries + 1, clean: false, rightRun: 0, missRun: down ? 0 : missRun, pace: down ? Math.max(-1, round.pace - 1) as Pace : round.pace };
}

function finish(round: Round): Round {
  const scored = round.scored + (round.demo ? 0 : 1), firstTry = round.firstTry + (!round.demo && round.clean ? 1 : 0);
  let { rightRun, pace } = round;
  if (!round.demo) {
    rightRun = round.clean ? rightRun + 1 : 0;
    if (rightRun >= 5) { rightRun = 0; pace = Math.min(1, pace + 1) as Pace; }
  }
  return { ...round, stage: "done", scored, firstTry, rightRun, pace, missRun: round.clean ? 0 : round.missRun, done: round.done + 1 };
}

/** One tap on button 0 or 1. Nothing changes under the finger on a miss: the same picture waits. */
export function answer(round: Round, choice: number): { round: Round; outcome: "right" | "again" | "ignore" } {
  if (round.stage !== "pick" || (choice !== 0 && choice !== 1)) return { round, outcome: "ignore" };
  if (choice !== answerOf(round)) return { round: miss(round), outcome: "again" };
  return { round: finish(round), outcome: "right" };
}

/** চটপট only: the picture's time ran out. It passes quietly and counts as a miss, with no sound and nothing lost. */
export function pass(round: Round): Round {
  if (round.stage !== "pick" || round.demo) return round;
  return finish(miss(round));
}

/** The next picture, ringing the bell when the run is over (never on the last picture), or null when the round is over. */
export function nextItem(round: Round): Round | null {
  const spec = specOf(round.level);
  if (round.stage !== "done" || round.index + 1 >= spec.items) return null;
  const index = round.index + 1, rng = itemRng(round.seed, index), since = round.since + 1;
  const ring = since >= round.run && index < spec.items - 1 && !(spec.once && round.bells > 0);
  const item = makeItem(spec, round.pace, rng, round.item);
  return {
    ...round, index, item, stage: "pick", tries: 0, clean: true, demo: ring, rang: ring,
    rule: ring ? flip(round.rule) : round.rule, since: ring ? 0 : since, run: ring ? runLength(spec, round.pace, rng) : round.run, bells: round.bells + (ring ? 1 : 0),
  };
}

/** Stars only record the round: no miss or one → 3, up to three → 2, else 1. */
export const roundStars = (round: Round) => starsFor(round.scored - round.firstTry, 1, 3, true);

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export function endLine(round: Round) {
  const spec = specOf(round.level);
  if (spec.kind === "sort") return `${bn(round.done)}টা কার্ড সাজালে, ঘণ্টা বাজল ${bn(round.bells)} বার।`;
  if (round.bells) return `${bn(round.done)}টা ছবি, ঘণ্টা বাজল ${bn(round.bells)} বার।`;
  return `${bn(round.done)}টা ছবির উল্টোটা খুঁজে নিলে।`;
}

/** Praise the method, and only when it earned it (at most one miss). */
export function praiseLine(round: Round) {
  if (round.scored - round.firstTry > 1) return "";
  const spec = specOf(round.level);
  if (spec.kind === "sort") return "ঘণ্টা শুনেই রং ছেড়ে আকার দেখলে।";
  if (round.bells) return "ঘণ্টা শুনেই নিয়ম বদলে নিলে।";
  return "হাতটা একটু থামিয়ে চাপলে, তাই মিলল।";
}

export type Today = { pictures: number; cards: number; bells: number };
export function addToday(today: Today, round: Round): Today {
  const sort = specOf(round.level).kind === "sort";
  return { pictures: today.pictures + (sort ? 0 : round.done), cards: today.cards + (sort ? round.done : 0), bells: today.bells + round.bells };
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
