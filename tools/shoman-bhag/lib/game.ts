// সমান ভাগ's rules as pure functions. Five steps: share among 2 plates → 3 → 4, then cut the leftover রুটি,
// then name the piece. Four servings a round; a quiet ease after three misses in a row, lifted by five first-try answers.
import { makeRng, starsFor } from "../../../shared/game-core";

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

/** ১/২, ১/৩, ১/৪ in the words a Bangladeshi child hears at home and the textbook's word. */
export const FRACTIONS: Record<number, { word: string; school: string }> = {
  2: { word: "অর্ধেক", school: "এক-দ্বিতীয়াংশ" },
  3: { word: "তিন ভাগের এক ভাগ", school: "এক-তৃতীয়াংশ" },
  4: { word: "চার ভাগের এক ভাগ", school: "এক-চতুর্থাংশ" },
};
export const fractionText = (parts: number) => `${bn(1)}/${bn(parts)}`;

export type Kind = "share" | "cut" | "name";
export type LevelSpec = { step: number; kind: Kind; label: string; plates?: number; per?: [number, number] };
export const LEVELS: LevelSpec[] = [
  { step: 1, kind: "share", label: "দুজন", plates: 2, per: [2, 4] },
  { step: 2, kind: "share", label: "তিনজন", plates: 3, per: [1, 3] },
  { step: 3, kind: "share", label: "চারজন", plates: 4, per: [1, 3] },
  { step: 4, kind: "cut", label: "রুটি কাটা" },
  { step: 5, kind: "name", label: "ভাগের নাম" },
];
export const LEVEL_COUNT = LEVELS.length;
export const ITEMS = 4;
/** In the sharing steps, the third serving has one too many: "শেষ পিঠাটা কে পাবে?" */
export const LEFTOVER_AT = 2;
export const specOf = (level: number) => LEVELS[level - 1];

export type Item =
  | { kind: "share"; food: Food; guests: Guest[]; total: number; extra: 0 | 1; cut: boolean }
  | { kind: "name"; parts: number; shaded: number; choices: number[] }
  | { kind: "fair"; parts: number; fairSide: number; choices: number[] };

type Rng = () => number;
const between = (rng: Rng, low: number, high: number) => low + Math.floor(rng() * (high - low + 1));

/** n guests: grown-ish ones in turn, and one little one whose seat moves around the table. */
export function guestsFor(n: number, index: number): Guest[] {
  const big = Array.from({ length: n - 1 }, (_, seat) => GUESTS[(index + seat) % GUESTS.length]);
  big.splice(index % n, 0, LITTLE[index % LITTLE.length]);
  return big;
}

/** The serving count per plate for this step; the quiet ease keeps it to one or two. */
export function perRange(level: number, eased: boolean): [number, number] {
  const spec = specOf(level);
  if (spec.kind === "cut") return eased ? [1, 1] : [1, 2];
  return spec.per ? (eased ? [1, 2] : spec.per) : [0, 0];
}

/** Plates for each serving of the cutting step: halves, thirds and quarters all come; the ease keeps to halves and quarters. */
export const cutPlates = (index: number, eased: boolean, rng: Rng) => eased ? [2, 4, 2, 4][index] : [2, 4, 3, between(rng, 2, 4)][index];

export function makeItem(level: number, rng: Rng, eased: boolean, index = 0): Item {
  const spec = specOf(level), [low, high] = perRange(level, eased);
  if (spec.kind === "share") {
    const plates = spec.plates!, extra = index === LEFTOVER_AT ? 1 : 0;
    return { kind: "share", food: SHARE_FOODS[(index + level - 1) % SHARE_FOODS.length], guests: guestsFor(plates, index + level), total: plates * between(rng, low, high) + extra, extra, cut: false };
  }
  if (spec.kind === "cut") {
    const plates = cutPlates(index, eased, rng);
    return { kind: "share", food: "ruti", guests: guestsFor(plates, index), total: plates * between(rng, low, high) + 1, extra: 1, cut: true };
  }
  // Naming: the third card asks which রুটি is cut fairly, because a fraction means equal parts.
  if (index === LEFTOVER_AT) return { kind: "fair", parts: eased || rng() < 0.5 ? 2 : 4, fairSide: rng() < 0.5 ? 0 : 1, choices: [0, 1] };
  const parts = [2, 3, 4][(index + between(rng, 0, 2)) % 3];
  const choices = eased ? [parts, parts === 4 ? 3 : parts + 1].sort((a, b) => a - b) : [2, 3, 4];
  return { kind: "name", parts, shaded: between(rng, 0, parts - 1), choices };
}

export type Stage = "share" | "left" | "cut" | "give" | "pick" | "done";
/** Who got the last one: a plate, broken and shared by all, the youngest, or kept for আম্মু. Never scored. */
export type Leftover = number | "share" | "small" | "keep";
export type Hand = null | "basket" | number;
export type Round = {
  level: number; seed: number; index: number; item: Item; stage: Stage;
  basket: number; plates: number[]; hand: Hand;
  /** The cutting step: what the leftover রুটি was cut into, and which plates have their piece. */
  cutInto: number; pieces: boolean[];
  choice: Leftover | null;
  tries: number; clean: boolean; firstTry: number; missRun: number; rightRun: number; eased: boolean;
  /** This round: guests served, রুটি cut (by pieces), pieces named. */
  served: number; cuts: number[]; named: number;
};
export type Event = "ignore" | "pick" | "cancel" | "drop" | "over" | "again" | "right";
export type Step = { round: Round; event: Event };

const firstStage = (item: Item): Stage => item.kind === "share" ? "share" : "pick";
const fresh = (item: Item) => ({
  item, stage: firstStage(item), basket: item.kind === "share" ? item.total : 0, plates: item.kind === "share" ? item.guests.map(() => 0) : [],
  hand: null, cutInto: 0, pieces: item.kind === "share" ? item.guests.map(() => false) : [], choice: null, tries: 0, clean: true,
});

export function newRound(level: number, eased = false, rightRun = 0, seed = 1 + Math.floor(Math.random() * 1e9)): Round {
  return { level, seed, index: 0, ...fresh(makeItem(level, makeRng(seed), eased, 0)), firstTry: 0, missRun: 0, rightRun, eased, served: 0, cuts: [], named: 0 };
}

/** Each guest's fair share of whole pieces. */
export const target = (round: Round) => round.item.kind === "share" ? Math.floor(round.item.total / round.item.guests.length) : 0;

function miss(round: Round): Round {
  const missRun = round.missRun + 1;
  return { ...round, tries: round.tries + 1, clean: false, missRun, rightRun: 0, eased: round.eased || missRun >= 3 };
}

function complete(round: Round, extra: Partial<Round> = {}): Round {
  const rightRun = round.clean ? round.rightRun + 1 : 0, item = round.item;
  return {
    ...round, ...extra, stage: "done", hand: null, missRun: 0, rightRun, firstTry: round.firstTry + (round.clean ? 1 : 0), eased: round.eased && rightRun < 5,
    served: round.served + (item.kind === "share" ? item.guests.length : 0), named: round.named + (item.kind === "share" ? 0 : 1),
  };
}

/** After a drop: a plate past its fair share is a miss; everyone equal moves on to the leftover, the cut, or done. */
function settle(round: Round, plate: number): Step {
  if (round.item.kind !== "share") return { round, event: "ignore" };
  const fair = target(round);
  if (round.plates[plate] > fair) return { round: miss(round), event: "over" };
  if (round.basket !== round.item.extra || round.plates.some(count => count !== fair)) return { round, event: "drop" };
  if (!round.item.extra) return { round: complete(round), event: "right" };
  return { round: { ...round, stage: round.item.cut ? "cut" : "left" }, event: "right" };
}

/** The basket: pick one up, put a held one back. */
export function tapBasket(round: Round): Step {
  if (round.stage !== "share" && round.stage !== "left") return { round, event: "ignore" };
  if (round.hand === "basket") return { round: { ...round, hand: null }, event: "cancel" };
  if (typeof round.hand === "number") {
    const plates = round.plates.map((count, index) => index === round.hand ? count - 1 : count);
    return { round: { ...round, plates, basket: round.basket + 1, hand: null }, event: "drop" };
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

/** The last one, after everyone has the same. Any choice is fine; only the faces change. */
export function decide(round: Round, choice: Leftover): Step {
  if (round.stage !== "left" || round.item.kind !== "share") return { round, event: "ignore" };
  if (typeof choice === "number" && (choice < 0 || choice >= round.plates.length)) return { round, event: "ignore" };
  return { round: complete(round, { choice, basket: 0 }), event: "right" };
}

/** Cut the leftover রুটি into `parts`: right when there's one piece per guest. */
export function cut(round: Round, parts: number): Step {
  if (round.stage !== "cut" || round.item.kind !== "share") return { round, event: "ignore" };
  if (parts !== round.item.guests.length) return { round: miss(round), event: "again" };
  return { round: { ...round, stage: "give", cutInto: parts, basket: 0, cuts: [...round.cuts, parts], tries: 0 }, event: "right" };
}

export const answerOf = (round: Round) => {
  const item = round.item;
  return item.kind === "name" ? item.parts : item.kind === "fair" ? item.fairSide : item.guests.length;
};

/** Name the shaded piece (2, 3 or 4), or pick the fairly cut রুটি (0 left, 1 right). */
export function pick(round: Round, value: number): Step {
  if (round.stage !== "pick") return { round, event: "ignore" };
  if (value !== answerOf(round)) return { round: miss(round), event: "again" };
  return { round: complete(round), event: "right" };
}

/** After two tries on a question, the answer glows. */
export const glows = (round: Round) => round.tries >= 2;

/** The next serving, or null after the fourth: the round then ends and waits for the child. */
export function nextItem(round: Round): Round | null {
  if (round.stage !== "done" || round.index + 1 >= ITEMS) return null;
  const index = round.index + 1;
  return { ...round, index, ...fresh(makeItem(round.level, makeRng(round.seed + index * 7919), round.eased, index)) };
}

/** Where a ghost finger should point next. */
export type Target = { basket: true } | { plate: number } | { cut: number } | { pick: number } | null;
export function hintTarget(round: Round): Target {
  if (round.stage === "pick") return { pick: answerOf(round) };
  if (round.stage === "cut") return { cut: answerOf(round) };
  if (round.stage === "give") return { plate: round.pieces.indexOf(false) };
  if (round.stage !== "share") return null;
  const fair = target(round), over = round.plates.findIndex(count => count > fair);
  if (round.hand === null) return over >= 0 ? { plate: over } : { basket: true };
  const open = round.plates.map((count, index) => ({ count, index })).filter(({ index }) => index !== round.hand);
  return { plate: open.reduce((low, each) => each.count < low.count ? each : low).index };
}

export type Mood = "wait" | "smile" | "happy" | "sad" | "oh";
export const MOOD_NAME: Record<Mood, string> = { wait: "অপেক্ষা করছে", smile: "হাসছে", happy: "খুব খুশি", sad: "মন খারাপ", oh: "অবাক" };

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
  if (round.stage !== "share") return all("smile");
  const fair = target(round), most = Math.max(...round.plates);
  return round.plates.map(count => count > fair ? "oh" : count < most ? "sad" : count === 0 ? "wait" : "smile");
}

export function question(round: Round) {
  const item = round.item;
  if (item.kind === "name") return "রং করা টুকরোটা পুরো রুটির কত ভাগ?";
  if (item.kind === "fair") return `কোন রুটিটা সমান ${item.parts === 2 ? "দুই" : "চার"} ভাগে কাটা?`;
  const food = FOOD_NAME[item.food];
  if (round.stage === "left") return `শেষ ${food}টা কে পাবে?`;
  if (round.stage === "cut") return "একটা রুটি রয়ে গেল। কয় টুকরো করবে?";
  if (round.stage === "give") return "সবাইকে এক টুকরো করে দাও।";
  return `${bn(item.total)}টা ${food}, ${PEOPLE[item.guests.length]} মেহমান। সবাইকে সমান দাও।`;
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

/** A one-line reason after a miss, never a buzzer. */
export function hintLine(round: Round, event: Event, value?: number) {
  const item = round.item;
  if (event === "over") return "একজনের প্লেটে বেশি হয়ে গেল। ওই প্লেট থেকে একটা তুলে নাও।";
  if (event !== "again") return "";
  if (item.kind === "share") return `টুকরো হতো ${bn(value ?? 0)}টা, মেহমান ${bn(item.guests.length)} জন।`;
  if (item.kind === "fair") return "ওই রুটির টুকরোগুলো ছোট-বড়।";
  return "রুটিটা কয় টুকরো, গুনে দেখো।";
}

/** Stars only record the round: 3 for four first-try servings, 2 for two or three, else 1. */
export const roundStars = (firstTry: number) => starsFor(firstTry, 4, 2);

export function endLine(round: Round) {
  const kind = specOf(round.level).kind;
  if (kind === "name") return `${bn(round.named)}টা ভাগের নাম বললে।`;
  if (kind === "cut") return `${bn(round.cuts.length)}টা রুটি কেটে ${bn(round.served)} জনকে সমান দিলে।`;
  return `${bn(round.served)} জন মেহমান সমান ভাগ পেল।`;
}

/** Praise the method, and only when it earned it. */
export function praiseLine(round: Round) {
  if (round.firstTry < ITEMS) return "";
  const kind = specOf(round.level).kind;
  if (kind === "name") return "টুকরো গুনে নাম বললে, তাই মিলে গেল।";
  if (kind === "cut") return "মেহমান যতজন, টুকরো ততটা। তাই কারও কম পড়েনি।";
  return "একটা একটা করে সবাইকে দিলে, তাই কারও প্লেটে বেশি হয়নি।";
}

export type Today = { guests: number; cuts: number[]; named: number; table: { plates: number; per: number; food: Food } | null };
export const EMPTY_TODAY: Today = { guests: 0, cuts: [], named: 0, table: null };

export function addToday(today: Today, round: Round): Today {
  const item = round.item;
  return {
    guests: today.guests + round.served, cuts: [...today.cuts, ...round.cuts], named: today.named + round.named,
    table: item.kind === "share" ? { plates: item.guests.length, per: target(round), food: item.food } : today.table,
  };
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
