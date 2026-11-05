// সমান ভাগ's rules as pure functions: a round is a list of servings, one per slot of the level. Nothing here moves on its
// own: a finished serving waits for the child's ➜ (session.ts). A quiet ease after three misses in a row, lifted by five
// first-try answers. Randomness only through makeRng, so a seed always plays the same round.
import { makeRng, starsFor } from "../../../shared/game-core";
import { levelOf, lengthOf, type Slot } from "./levels";
import { FOOD_NAME, FRACTIONS, SHARE_FOODS, bn, guestsFor, type Food, type Guest, type Mood } from "./people";

type Rng = () => number;
const between = (rng: Rng, low: number, high: number) => low + Math.floor(rng() * (high - low + 1));

export type Item =
  | { kind: "share"; food: Food; guests: Guest[]; total: number; extra: 0 | 1; cut: boolean; left: boolean }
  | { kind: "name"; parts: number; shaded: number; choices: number[] }
  | { kind: "fair"; parts: number; fairSide: number; choices: number[] };

export type Stage = "share" | "left" | "cut" | "give" | "pick" | "done";
/** Who got the last one: a plate, broken and shared by all, the youngest, or kept for আম্মু. Never scored. */
export type Leftover = number | "share" | "small" | "keep";
export type Hand = null | "basket" | number;
/** What the last miss was, so the picture hint can show it: a plate over its share, a cut of the wrong size, a wrong answer. */
export type Miss = null | { kind: "over"; plate: number } | { kind: "cut"; parts: number } | { kind: "pick"; value: number };

/** The ease the next round starts with: carried between rounds, never announced. */
export type Pace = { eased: boolean; rightRun: number };
export const START_PACE: Pace = { eased: false, rightRun: 0 };

export type Round = {
  level: number; seed: number; index: number; length: number; item: Item; stage: Stage;
  basket: number; plates: number[]; hand: Hand;
  /** The cutting serving: what the leftover রুটি was cut into, and which plates have their piece. */
  cutInto: number; pieces: boolean[];
  choice: Leftover | null; miss: Miss;
  tries: number; clean: boolean; firstTry: number; missRun: number; rightRun: number; eased: boolean;
  /** This round: guests served, রুটি cut (by pieces), pieces named, and the food of each finished serving. */
  served: number; cuts: number[]; named: number; foods: Food[];
  /** The last table served, for today's card. */
  table: Today["table"];
};
export type Event = "ignore" | "pick" | "cancel" | "drop" | "over" | "again" | "right";
export type Step = { round: Round; event: Event };

/** Plates for each cutting serving: halves, thirds and quarters all come; the ease keeps to halves and quarters. */
const cutPlates = (slot: Slot, rng: Rng, eased: boolean) => slot.n ? slot.n : eased ? 2 + 2 * between(rng, 0, 1) : between(rng, 2, 4);

export function makeItem(level: number, rng: Rng, eased: boolean, index: number): Item {
  const slot = levelOf(level).slots[index];
  if (slot.kind === "share" || slot.kind === "left" || slot.kind === "cut") {
    const cut = slot.kind === "cut", left = slot.kind === "left";
    const plates = cut ? cutPlates(slot, rng, eased) : slot.n ?? 2;
    const [low, high] = slot.per ?? [1, 2], per = between(rng, low, eased ? Math.min(high, 2) : high), extra = cut || left ? 1 : 0;
    return { kind: "share", food: cut ? "ruti" : SHARE_FOODS[(index + level - 1) % SHARE_FOODS.length], guests: guestsFor(plates, index + level), total: plates * per + extra, extra, cut, left };
  }
  // Naming: the "fair" card asks which রুটি is cut fairly, because a fraction means equal parts.
  if (slot.kind === "fair") return { kind: "fair", parts: eased || rng() < 0.5 ? 2 : 4, fairSide: rng() < 0.5 ? 0 : 1, choices: [0, 1] };
  const parts = [2, 3, 4][(index + between(rng, 0, 2)) % 3];
  const choices = eased ? [parts, parts === 4 ? 3 : parts + 1].sort((a, b) => a - b) : [2, 3, 4];
  return { kind: "name", parts, shaded: between(rng, 0, parts - 1), choices };
}

const fresh = (item: Item) => ({
  item, stage: (item.kind === "share" ? "share" : "pick") as Stage, basket: item.kind === "share" ? item.total : 0,
  plates: item.kind === "share" ? item.guests.map(() => 0) : [], hand: null as Hand, cutInto: 0,
  pieces: item.kind === "share" ? item.guests.map(() => false) : [], choice: null as Leftover | null, miss: null as Miss, tries: 0, clean: true,
});

export function createRound(level: number, seed: number, pace: Pace = START_PACE): Round {
  return { level, seed, index: 0, length: lengthOf(level), ...fresh(makeItem(level, makeRng(seed), pace.eased, 0)), firstTry: 0, missRun: 0, rightRun: pace.rightRun, eased: pace.eased, served: 0, cuts: [], named: 0, foods: [], table: null };
}
export const paceOf = (round: Round): Pace => ({ eased: round.eased, rightRun: round.rightRun });

/** Each guest's fair share of whole pieces. */
export const target = (round: Round) => round.item.kind === "share" ? Math.floor(round.item.total / round.item.guests.length) : 0;
export const isLast = (round: Round) => round.index + 1 >= round.length;
export const isDone = (round: Round) => round.stage === "done";

function miss(round: Round, what: Miss): Round {
  const missRun = round.missRun + 1;
  return { ...round, miss: what, tries: round.tries + 1, clean: false, missRun, rightRun: 0, eased: round.eased || missRun >= 3 };
}

function complete(round: Round, extra: Partial<Round> = {}): Round {
  const rightRun = round.clean ? round.rightRun + 1 : 0, item = round.item;
  const food: Food = item.kind === "share" ? item.food : "ruti";
  return {
    ...round, ...extra, stage: "done", hand: null, miss: null, missRun: 0, rightRun, firstTry: round.firstTry + (round.clean ? 1 : 0), eased: round.eased && rightRun < 5,
    served: round.served + (item.kind === "share" ? item.guests.length : 0), named: round.named + (item.kind === "share" ? 0 : 1), foods: [...round.foods, food],
    table: item.kind === "share" ? { plates: item.guests.length, per: target(round), food: item.food } : round.table,
  };
}

/** After a drop: a plate past its fair share is a miss; everyone equal moves on to the leftover, the cut, or done. */
function settle(round: Round, plate: number): Step {
  if (round.item.kind !== "share") return { round, event: "ignore" };
  const fair = target(round);
  if (round.plates[plate] > fair) return { round: miss(round, { kind: "over", plate }), event: "over" };
  if (round.basket !== round.item.extra || round.plates.some(count => count !== fair)) return { round: { ...round, miss: null }, event: "drop" };
  if (!round.item.extra) return { round: complete(round), event: "right" };
  return { round: { ...round, miss: null, stage: round.item.cut ? "cut" : "left" }, event: "right" };
}

/** The basket: pick one up, put a held one back. */
export function tapBasket(round: Round): Step {
  if (round.stage !== "share" && round.stage !== "left") return { round, event: "ignore" };
  if (round.hand === "basket") return { round: { ...round, hand: null }, event: "cancel" };
  if (typeof round.hand === "number") {
    const plates = round.plates.map((count, index) => index === round.hand ? count - 1 : count);
    return { round: { ...round, plates, basket: round.basket + 1, hand: null, miss: null }, event: "drop" };
  }
  return round.basket > 0 ? { round: { ...round, hand: "basket" }, event: "pick" } : { round, event: "ignore" };
}

/** A plate: drop what's held, pick one up from it, give the leftover, or take a piece of the cut রুটি. */
export function tapPlate(round: Round, plate: number): Step {
  if (round.item.kind !== "share" || plate < 0 || plate >= round.plates.length) return { round, event: "ignore" };
  if (round.stage === "left") return decide(round, plate);
  if (round.stage === "give") {
    if (round.pieces[plate]) return { round, event: "ignore" };
    const pieces = round.pieces.map((has, index) => has || index === plate);
    return pieces.every(Boolean) ? { round: complete({ ...round, pieces }), event: "right" } : { round: { ...round, pieces }, event: "drop" };
  }
  if (round.stage !== "share") return { round, event: "ignore" };
  if (round.hand === plate) return { round: { ...round, hand: null }, event: "cancel" };
  if (round.hand === null) return round.plates[plate] > 0 ? { round: { ...round, hand: plate }, event: "pick" } : { round, event: "ignore" };
  const from = round.hand;
  const plates = round.plates.map((count, index) => count + (index === plate ? 1 : 0) - (index === from ? 1 : 0));
  return settle({ ...round, plates, basket: round.basket - (from === "basket" ? 1 : 0), hand: null }, plate);
}

/** The piece goes back where it came from: a drag let go in the air, the window blurred, the menu opened. */
export function release(round: Round): Round { return round.hand === null ? round : { ...round, hand: null }; }

/** The last one, after everyone has the same. Any choice is fine; only the faces change. */
export function decide(round: Round, choice: Leftover): Step {
  if (round.stage !== "left" || round.item.kind !== "share") return { round, event: "ignore" };
  if (typeof choice === "number" && (choice < 0 || choice >= round.plates.length)) return { round, event: "ignore" };
  return { round: complete({ ...round, hand: null }, { choice, basket: 0 }), event: "right" };
}

/** Cut the leftover রুটি into `parts`: right when there's one piece per guest. */
export function cut(round: Round, parts: number): Step {
  if (round.stage !== "cut" || round.item.kind !== "share") return { round, event: "ignore" };
  if (parts !== round.item.guests.length) return { round: miss(round, { kind: "cut", parts }), event: "again" };
  return { round: { ...round, stage: "give", cutInto: parts, basket: 0, cuts: [...round.cuts, parts], tries: 0, miss: null }, event: "right" };
}

export const answerOf = (round: Round) => {
  const item = round.item;
  return item.kind === "name" ? item.parts : item.kind === "fair" ? item.fairSide : item.guests.length;
};

/** Name the shaded piece (2, 3 or 4), or pick the fairly cut রুটি (0 left, 1 right). */
export function pick(round: Round, value: number): Step {
  if (round.stage !== "pick") return { round, event: "ignore" };
  if (value !== answerOf(round)) return { round: miss(round, { kind: "pick", value }), event: "again" };
  return { round: complete(round), event: "right" };
}

/** After two tries on a question, the answer glows. */
export const glows = (round: Round) => round.tries >= 2;

/** The next serving after the ➜, or null after the last: the round then ends. */
export function nextItem(round: Round): Round | null {
  if (round.stage !== "done" || isLast(round)) return null;
  const index = round.index + 1;
  return { ...round, index, ...fresh(makeItem(round.level, makeRng(round.seed + index * 7919), round.eased, index)) };
}

/** Where a ghost finger should point next. */
export type Target = { basket: true } | { plate: number } | { cut: number } | { pick: number } | null;
export function hintTarget(round: Round): Target {
  if (round.stage === "pick") return { pick: answerOf(round) };
  if (round.stage === "cut") return { cut: answerOf(round) };
  if (round.stage === "give") return { plate: round.pieces.indexOf(false) };
  if (round.stage === "left") return { plate: round.item.kind === "share" ? round.item.guests.findIndex(guest => guest.small) : 0 };
  if (round.stage !== "share") return null;
  const fair = target(round), over = round.plates.findIndex(count => count > fair);
  if (round.hand === null) return over >= 0 ? { plate: over } : { basket: true };
  const open = round.plates.map((count, index) => ({ count, index })).filter(({ index }) => index !== round.hand);
  return { plate: open.reduce((low, each) => each.count < low.count ? each : low).index };
}

/** Every guest's face. While sharing: less than someone else is sad, past the fair share is surprised. */
export function moods(round: Round): Mood[] {
  const item = round.item;
  if (item.kind !== "share") return [];
  const all = (mood: Mood) => item.guests.map(() => mood);
  const { choice } = round;
  if (choice !== null) {
    if (choice === "share") return all("happy");
    if (choice === "keep") return all("smile");
    if (choice === "small") return item.guests.map(guest => guest.small ? "happy" : "smile");
    return item.guests.map((_, index) => index === choice ? "happy" : "sad");
  }
  if (round.stage === "done") return all("happy");
  if (round.stage === "give") return round.pieces.map(has => has ? "happy" : "wait");
  if (round.stage === "left") return all("happy");
  if (round.stage !== "share") return all("smile");
  const fair = target(round), most = Math.max(...round.plates);
  return round.plates.map(count => count > fair ? "oh" : count < most ? "sad" : count === 0 ? "wait" : "smile");
}

/** Stars only record the round: all but one first try → 3, half or more → 2, else 1. Slow mode never changes them. */
export const starsOf = (firstTry: number, length: number) => starsFor(firstTry, length, Math.ceil(length / 2));

export type Result = { level: number; stars: number; served: number; firstTry: number; count: number; foods: Food[]; cuts: number[]; named: number; last: Item["kind"]; table: Today["table"] };
export function resultOf(round: Round): Result {
  return { level: round.level, stars: starsOf(round.firstTry, round.length), served: round.served, firstTry: round.firstTry, count: round.length, foods: round.foods, cuts: round.cuts, named: round.named, last: round.item.kind, table: round.table };
}

// ---- the words, for the parent: every cue also has a picture ----

export function question(round: Round) {
  const item = round.item;
  if (item.kind === "name") return "রং করা টুকরোটা পুরো রুটির কত ভাগ?";
  if (item.kind === "fair") return `কোন রুটিটা সমান ${item.parts === 2 ? "দুই" : "চার"} ভাগে কাটা?`;
  const food = FOOD_NAME[item.food];
  if (round.stage === "left") return `শেষ ${food}টা কে পাবে?`;
  if (round.stage === "cut") return "একটা রুটি রয়ে গেল। কয় টুকরো করবে?";
  if (round.stage === "give") return "সবাইকে এক টুকরো করে দাও।";
  return `${bn(item.total)}টা ${food}, ${bn(item.guests.length)} জন মেহমান। সবাইকে সমান দাও।`;
}

/** What the table looks like now that the serving is done. Describes the faces; never says which choice was right. */
export function doneLine(round: Round) {
  const item = round.item;
  if (item.kind === "name") return `এক টুকরো = ${FRACTIONS[item.parts].word}।`;
  if (item.kind === "fair") return `দুই পাশের টুকরো সমান হলে তবেই ${item.parts === 2 ? "অর্ধেক" : "চার ভাগের এক ভাগ"}।`;
  const fair = target(round), food = FOOD_NAME[item.food], { choice } = round;
  if (item.cut) return `প্রত্যেকে পেল ${bn(fair)}টা রুটি আর ${FRACTIONS[round.cutInto].word}।`;
  if (choice === null) return `প্রত্যেকে পেল ${bn(fair)}টা করে ${food}।`;
  if (choice === "share") return "ভেঙে সবাইকে এক টুকরো করে দিলে। সবার মুখে হাসি।";
  if (choice === "keep") return `শেষ ${food}টা আম্মুর জন্য তোলা রইল।`;
  if (choice === "small") return `ছোট্ট ${item.guests.find(guest => guest.small)!.name} খুব খুশি। বড়রা হাসছে।`;
  return `${item.guests[choice].name} খুব খুশি। বাকিদের একটু মন খারাপ।`;
}

/** A one-line reason after a miss, never a buzzer. The picture beside it says the same. */
export function slipLine(round: Round) {
  const item = round.item, what = round.miss;
  if (!what) return "";
  if (what.kind === "over") return "একজনের প্লেটে বেশি হয়ে গেল। ওই প্লেট থেকে একটা তুলে নাও।";
  if (item.kind === "share") return `টুকরো হতো ${bn(what.kind === "cut" ? what.parts : 0)}টা, মেহমান ${bn(item.guests.length)} জন।`;
  if (item.kind === "fair") return "ওই রুটির টুকরোগুলো ছোট-বড়।";
  return "রুটিটা কয় টুকরো, গুনে দেখো।";
}

/** What the end screen says the child can do now, and something to do off the screen. */
export const newsOf = (level: number) => ({
  1: "এখন তুমি দুজনকে সমান ভাগ করে দিতে পারো।", 2: "এখন তুমি তিনজনকে সমান ভাগ করে দিতে পারো।", 3: "এখন তুমি চারজনকে সমান ভাগ করে দিতে পারো।",
  4: "এখন তুমি রুটি কেটে সবাইকে সমান টুকরো দিতে পারো।", 5: "এখন তুমি টুকরো গুনে ভাগের নাম বলতে পারো।",
  6: "এখন তুমি একটা রুটি দুজনকে অর্ধেক করে দিতে পারো।", 7: "এখন তুমি একটা রুটি তিনজনকে সমান ভাগ করে দিতে পারো।", 8: "এখন তুমি একটা রুটি চারজনকে সমান ভাগ করে দিতে পারো।",
  9: "এখন তুমি জানো, শেষ টুকরোটা নিয়ে সবার মনে আলাদা কিছু হয়।", 10: "এখন তুমি জানো, ভাগ সমান হলে তবেই সেটা ভগ্নাংশ।",
} as Record<number, string>)[level] ?? "";

export const taskOf = (level: number) => ({
  1: "এবার ঘরে চারটা বিস্কুট দুজনকে সমান ভাগ করে দাও।", 2: "এবার ছয়টা বিস্কুট তিনজনকে সমান ভাগ করে দাও।", 3: "এবার আটটা মুড়ির মোয়া বা বিস্কুট চারজনকে সমান ভাগ করে দাও।",
  4: "এবার একটা রুটি ভাঁজ করে অর্ধেক করো।", 5: "এবার একটা কাগজ ভাঁজ করে চার ভাগ করো, একটা ভাগে রং দাও।",
  6: "এবার একটা বিস্কুট ভেঙে দুই বন্ধুকে অর্ধেক করে দাও।", 7: "এবার একটা কলা বা রুটি তিন ভাগ করে তিনজনকে দাও।", 8: "এবার একটা রুটি চার টুকরো করে বাসার চারজনকে দাও।",
  9: "এবার বাসায় শেষ বিস্কুটটা কাকে দেবে, ওকে জিজ্ঞেস করো।", 10: "এবার দুই টুকরো রুটি দেখাও: কোনটা সমান ভাগ?",
} as Record<number, string>)[level] ?? "";

// ---- today's card: what was done, no name, no stars ----
export type Today = { guests: number; cuts: number[]; named: number; table: { plates: number; per: number; food: Food } | null };
export const EMPTY_TODAY: Today = { guests: 0, cuts: [], named: 0, table: null };

export function addToday(today: Today, result: Result): Today {
  return { guests: today.guests + result.served, cuts: [...today.cuts, ...result.cuts], named: today.named + result.named, table: result.table ?? today.table };
}

/** The last table as a sum a parent recognises: "৬ ÷ ৩ = ২টা করে পিঠা". */
export const divisionLine = ({ plates, per, food }: NonNullable<Today["table"]>) => `${bn(plates * per)} ÷ ${bn(plates)} = ${bn(per)}টা করে ${FOOD_NAME[food]}`;

const joinWords = (words: string[]) => words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} আর ${words[words.length - 1]}`;

/** The card's lines for the parent: what was done today, first person, no name. */
export function cardLines(today: Today) {
  const kinds = [...new Set(today.cuts)].sort((a, b) => a - b).map(parts => FRACTIONS[parts].word);
  const lines = [
    today.guests ? `${bn(today.guests)} জন মেহমানকে সমান ভাগ দিলাম` : "",
    today.cuts.length ? `${bn(today.cuts.length)}টা রুটি কেটে ${joinWords(kinds)} বানালাম` : "",
    today.named ? `${bn(today.named)}টা ভাগের নাম বললাম` : "",
  ].filter(Boolean);
  if (lines.length) lines[0] = `আজ ${lines[0]}`;
  return lines;
}
