// One round of নাম শিখি with no React and no browser: the cards that fill the page, the stickers each card offers, what a tap
// does, the quiet easing, the hints, and the stars. Seeded (makeRng only), so a round replays exactly in tests.
import { makeRng, starsFor } from "../../../shared/game-core";
import { VIEWS, type View } from "./art";
import { levelOf, type Kind, type Level } from "./levels";
import { HABITATS, packOf, type Choice, type Item, type Pack } from "./packs";

/** How far from a part (in figure units) a tap still counts as that part. */
const NEAR = 18;

export type Card = { kind: Kind; target: Item };
export type Round = {
  level: number; seed: number; rng: () => number;
  cards: Card[];
  index: number;
  /** The stickers on offer for the card on screen (empty on the শরীর levels: you tap the figure). */
  choices: Choice[];
  /** Stickers (or parts) already tried wrong on this card. */
  wrong: string[];
  solved: boolean;
  /** Cards right on the first tap. */
  firstTry: number;
  /** Cards in a row not right first time / right first time (the quiet easing). */
  missRun: number; rightRun: number;
  /** Every counted tap this round (bots and the end screen). */
  taps: number;
  /** The last card is placed: the page is full. */
  full: boolean;
};

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Items a kind can ask about. */
export function askable(pack: Pack, kind: Kind, view: Level["view"] = "any"): Item[] {
  if (pack.id === "shorir") return pack.items.filter(item => view === "any" || item.view === view);
  if (kind === "home") return pack.items.filter(item => item.home);
  if (kind === "role") return pack.items.filter(item => item.role);
  if (kind === "paint" || kind === "splat") return pack.items.filter(item => item.thing);
  return pack.items;
}

/** The figure is tapped, not stickers, on every শরীর level. */
export const onFigure = (level: Level) => level.world === "shorir";

/** The round's cards, in order. Homes are spread out; a finale cycles its kinds; মাথা থেকে পা runs head to foot. */
export function planCards(level: Level, rng: () => number): Card[] {
  const pack = packOf(level.world);
  const kinds = level.kinds.length === 1
    ? Array.from({ length: level.cards }, () => level.kinds[0])
    : shuffle(Array.from({ length: level.cards }, (_, index) => level.kinds[index % level.kinds.length]), rng);
  const used = new Set<string>();
  const cards: Card[] = [];
  const homes = shuffle(HABITATS.map(home => home.id), rng);
  for (const kind of kinds) {
    let pool = shuffle(askable(pack, kind, level.view), rng).filter(item => !used.has(item.id));
    if (kind === "home") {
      // One animal per home first, so the page isn't six village animals.
      const seen = new Set(cards.filter(card => card.kind === "home").map(card => card.target.home));
      const fresh = homes.find(home => !seen.has(home) && pool.some(item => item.home === home));
      if (fresh) pool = [...pool.filter(item => item.home === fresh), ...pool.filter(item => item.home !== fresh)];
    }
    const target = pool[0] ?? shuffle(askable(pack, level.kinds[0], level.view), rng).find(item => !used.has(item.id))!;
    used.add(target.id);
    cards.push({ kind: pool[0] ? kind : level.kinds[0], target });
  }
  if (level.world === "shorir" && level.finale) cards.sort((a, b) => topOf(a.target) - topOf(b.target));
  return cards;
}
const topOf = (item: Item) => Math.min(...(item.spots ?? [[0, 0]]).map(([, y]) => y));

/**
 * How many stickers to offer: the level's own count, one fewer after three cards in a row missed (quietly easier),
 * one more after five right in a row. Always 2–4, and never more than one away from the level's count.
 */
export function choiceCount(missRun: number, rightRun: number, base: number) {
  const low = Math.max(2, base - 1), high = Math.min(4, base + 1);
  const count = missRun >= 3 ? base - 1 : rightRun >= 5 ? base + 1 : base;
  return Math.max(low, Math.min(high, count));
}

/** On রঙের জিনিস the sticker is the thing of that colour (a colour's own sticker is its splat: its art id is the colour id). */
const thingOf = (item: Item): Choice => ({ id: item.id, bn: item.thing!.bn, en: item.thing!.en, art: item.thing!.art });

/** The stickers for a card: the right one and `count - 1` others, shuffled. A home never offers an animal that also lives there. */
export function choicesFor(level: Level, card: Card, count: number, rng: () => number): Choice[] {
  if (onFigure(level)) return [];
  const pack = packOf(level.world), { kind, target } = card;
  let others: Item[];
  let as = (item: Item): Choice => item;
  if (kind === "home") others = pack.items.filter(item => item.home && item.home !== target.home && !item.also?.includes(target.home!));
  else if (kind === "splat") { others = pack.items.filter(item => item.thing && item.id !== target.id); as = thingOf; }
  else others = pack.items.filter(item => item.id !== target.id);
  return shuffle([as(target), ...shuffle(others, rng).slice(0, Math.max(1, count - 1)).map(as)], rng);
}

/** The right sticker's id (a colour id on রং, an animal on কে কোথায় থাকে, a part on শরীর). */
export const answerOf = (card: Card) => card.target.id;

/** Stickers carry their names on the name levels, so a pre-reader can match the word's shape. */
export const namedKind = (kind: Kind) => kind === "bn" || kind === "en";

export function createRound(levelId: number, seed: number): Round {
  const level = levelOf(levelId), rng = makeRng(seed), cards = planCards(level, rng);
  const round: Round = { level: level.id, seed, rng, cards, index: 0, choices: [], wrong: [], solved: false, firstTry: 0, missRun: 0, rightRun: 0, taps: 0, full: false };
  round.choices = choicesFor(level, cards[0], choiceCount(0, 0, level.base), rng);
  return round;
}

export const cardOf = (round: Round) => round.cards[round.index];
export const isLast = (round: Round) => round.index + 1 >= round.cards.length;

export type Tap = "right" | "wrong" | "again" | "ignored";
/** A sticker (or a part of the figure) is tapped. "again": a sticker already tried; nothing more happens. */
export function choose(round: Round, id: string): Tap {
  if (round.solved || round.full) return "ignored";
  const level = levelOf(round.level);
  if (!onFigure(level) && !round.choices.some(choice => choice.id === id)) return "ignored";
  if (round.wrong.includes(id)) return "again";
  round.taps++;
  if (id !== answerOf(cardOf(round))) { round.wrong.push(id); return "wrong"; }
  const first = round.wrong.length === 0;
  round.solved = true;
  if (first) { round.firstTry++; round.rightRun++; round.missRun = 0; } else { round.missRun++; round.rightRun = 0; }
  if (isLast(round)) round.full = true;
  return "right";
}

/** → after a placed sticker: the next card (true), or nothing when the page is full. */
export function advance(round: Round): boolean {
  if (!round.solved || round.full) return false;
  const level = levelOf(round.level);
  round.index++;
  round.wrong = []; round.solved = false;
  round.choices = choicesFor(level, cardOf(round), choiceCount(round.missRun, round.rightRun, level.base), round.rng);
  return true;
}

/** Two wrong tries: the right sticker glows. */
export const hinting = (round: Round) => !round.solved && round.wrong.length >= 2;
/** One wrong try on a শরীর name card: the lens picture comes to help. */
export const lensHelps = (round: Round) => round.wrong.length >= 1 || round.solved;

/** Stars are a record only: 3 for all but one right first time, 2 for at least half, 1 for finishing. */
export const starsOf = (firstTry: number, total: number) => starsFor(firstTry, total - 1, Math.ceil(total / 2));

/** What the child now knows, shown as the sticker's name tag: "উট থাকে মরুভূমিতে", "টমেটো লাল", or "বিড়াল · Cat". */
export function learnedLine(card: Card) {
  const { kind, target } = card;
  if (kind === "home") return { main: `${target.bn} থাকে ${HABITATS.find(home => home.id === target.home)!.at}`, sub: target.en, fact: target.fact ?? "" };
  if (kind === "paint" || kind === "splat") return { main: `${target.thing!.bn} ${target.bn}`, sub: target.en, fact: "" };
  if (kind === "role") return { main: `${target.role} ${target.bn}`, sub: target.en, fact: "" };
  return { main: target.bn, sub: target.en, fact: "" };
}

/** One sticker of the finished page (and the parent's card): its picture, or a spot on the figure, and two lines. */
export function pageCell(card: Card) {
  const { kind, target } = card;
  if (kind === "home") return { art: target.art, spot: null, top: target.bn, bottom: HABITATS.find(home => home.id === target.home)!.bn };
  if (target.thing && (kind === "paint" || kind === "splat")) return { art: target.thing.art, spot: null, top: `${target.thing.bn} ${target.bn}`, bottom: target.en };
  return { art: target.art, spot: target.spots?.[0] ?? null, top: target.bn, bottom: target.en };
}

/** The page's headline on the end screen and the card. */
export function pageTitle(levelId: number, count: number, bn: (n: number) => string) {
  const level = levelOf(levelId), pack = packOf(level.world), n = `${bn(count)}টা`, english = level.kinds.length === 1 && level.kinds[0] === "en" ? "ইংরেজি " : "";
  if (level.kinds.length === 1 && level.kinds[0] === "home") return `আজ জানলাম ${n} প্রাণী কোথায় থাকে`;
  if (pack.id === "rong") return `আজ ${n} রং চিনলাম`;
  if (pack.id === "protik") return `আজ ${n} জাতীয় প্রতীক চিনলাম`;
  if (pack.id === "shorir") return `আজ শরীরের ${n} অঙ্গের ${english}নাম শিখলাম`;
  return `আজ ${n} ${pack.noun} ${english}নাম শিখলাম`;
}

/** The part of the figure nearest to a tap, among the parts in this view; null when no part is near (an arm, the shirt). */
export function spotAt(view: View, x: number, y: number) {
  const [left, top, width, height] = VIEWS[view].split(" ").map(Number);
  if (x < left || y < top || x > left + width || y > top + height) return null;
  let best: Item | null = null, bestDistance = Infinity;
  for (const item of packOf("shorir").items) {
    if (item.view !== view) continue;
    for (const [sx, sy] of item.spots ?? []) {
      const distance = Math.hypot(sx - x, sy - y);
      if (distance < bestDistance) { best = item; bestDistance = distance; }
    }
  }
  return bestDistance <= NEAR ? best : null;
}

/** Where a point of the figure sits inside its view, as CSS percentages (the ghost finger, the part buttons). */
export function spotPercent(view: View, [x, y]: [number, number]) {
  const [left, top, width, height] = VIEWS[view].split(" ").map(Number);
  return { left: `${((x - left) / width) * 100}%`, top: `${((y - top) / height) * 100}%` };
}
