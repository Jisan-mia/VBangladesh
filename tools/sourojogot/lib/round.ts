// One round of any level, as pure data: the questions in a seeded order, what the child tapped, the silent pace (fewer
// choices after slips, more after a run of right ones), the hints and the stars. No React, no clock; makeRng only.
import { possessive } from "../../../shared/bangla";
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { levelOf, type Mode } from "./course";
import { CLUE } from "./clues";
import {
  bn, footballScale, metreLabel, mmLabel, nearestThing, orderOf, PLANETS, THINGS, ZONES, zoneOf,
  type Planet, type Thing, type Zone,
} from "./planets";

export type Kind = "tour" | "know" | "place" | "size" | "far";
export type Item = { planet: number; kind: Kind };
export type Last = "none" | "right" | "wrong" | "again";

/**
 * Sweet-spot difficulty, never announced: three questions in a row that needed a second try ease the next one (the answer
 * glows from the start and the guessing rounds offer 2 choices); five in a row right first time step it up (4 choices).
 * `help` is -1 (harder), 0 or 1 (easier). It moves only when a question is answered right.
 */
export type Pace = { right: number; wrong: number; help: -1 | 0 | 1 };
export const START_PACE: Pace = { right: 0, wrong: 0, help: 0 };
export function nextPace(pace: Pace, firstTry: boolean): Pace {
  if (firstTry) { const right = pace.right + 1; return { right, wrong: 0, help: right >= 5 ? -1 : pace.help === 1 ? 0 : pace.help }; }
  const wrong = pace.wrong + 1;
  return { right: 0, wrong, help: wrong >= 3 ? 1 : pace.help === -1 ? 0 : pace.help };
}
export const choiceCount = (pace: Pace) => pace.help === 1 ? 2 : pace.help === -1 ? 4 : 3;
/** The right answer glows after two tries on one question, or from the start when eased. */
export const shouldGlow = (pace: Pace, tries: number) => pace.help === 1 || tries >= 2;

export type Round = {
  level: number;
  seed: number;
  items: readonly Item[];
  index: number;
  /** Sort: `slots[orbit]` = the planet now on that orbit. Build: the planet placed there, or -1. */
  slots: readonly number[];
  pace: Pace;
  /** Wrong tries on this question, and over the whole round. */
  tries: number;
  mistakes: number;
  firstTry: number;
  /** Keys tried wrong on this question. */
  wrong: readonly string[];
  /** The question is answered; the reveal waits (or the round is over, on the last). */
  solved: boolean;
  last: Last;
  lastKey: string;
  /** Counts every action, so the screen can restart a wobble on the same key. */
  bump: number;
  /** The keys on offer for a know, size or far question; empty for a tap on the board. */
  choices: readonly string[];
};

function shuffled<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** The sort round's starting places: every planet away from its own orbit (a derangement), from a seed. */
export function shuffledSlots(count: number, seed: number): number[] {
  const rng = makeRng(seed);
  for (;;) {
    const slots = shuffled(Array.from({ length: count }, (_, index) => index), rng);
    if (slots.every((planet, slot) => planet !== slot)) return slots;
  }
}
/** Puts `planet` on orbit `target` by swapping it with whatever sits there. */
export function placeOn(slots: readonly number[], planet: number, target: number) {
  const next = [...slots], from = next.indexOf(planet);
  [next[from], next[target]] = [next[target], next[from]];
  return next;
}

export const rightThing = (planet: Planet) => nearestThing(footballScale(planet).sizeMm);
export const rightZone = (planet: Planet) => zoneOf(footballScale(planet).distanceM);

/** Size question: the right thing plus neighbours by size, in size order, so the choice is about scale and never a trick. */
export function sizeChoices(planet: Planet, count: number, seed: number): Thing[] {
  const right = rightThing(planet), rng = makeRng(seed);
  const others = THINGS.filter(thing => thing.id !== right.id);
  const picked = new Set<string>([right.id]);
  while (picked.size < Math.min(count, THINGS.length)) picked.add(others[pick(rng, others.length)].id);
  return THINGS.filter(thing => picked.has(thing.id));
}

function choicesOf(level: number, item: Item, pace: Pace, seed: number, index: number): string[] {
  const planet = PLANETS[item.planet];
  const mix = (seed * 2654435761 + index * 40503 + 7) >>> 0;
  if (item.kind === "know") {
    const pool = levelOf(level).count, rng = makeRng(mix), n = Math.min(choiceCount(pace), pool);
    const others = shuffled(Array.from({ length: pool }, (_, i) => i).filter(i => i !== item.planet), rng).slice(0, n - 1);
    return shuffled([item.planet, ...others], rng).map(i => PLANETS[i].id);
  }
  if (item.kind === "size") return sizeChoices(planet, choiceCount(pace), mix).map(thing => thing.id);
  if (item.kind === "far") return ZONES.map(zone => zone.id);
  return [];
}

export function createRound(level: number, seed: number, pace: Pace = START_PACE): Round {
  const spec = levelOf(level), rng = makeRng(seed), order = Array.from({ length: spec.count }, (_, i) => i);
  const kinds: Record<Mode, (planet: number, at: number) => Kind> = {
    tour: () => "tour", sort: () => "tour", know: () => "know", build: () => "place", size: () => "size", far: () => "far",
    scale: (_planet, at) => at % 2 ? "far" : "size",
  };
  const inLine = spec.mode === "tour" || spec.mode === "sort";
  const items = (inLine ? order : shuffled(order, rng)).map((planet, at) => ({ planet, kind: kinds[spec.mode](planet, at) }));
  const slots = spec.mode === "sort" ? shuffledSlots(spec.count, seed) : spec.mode === "build" ? order.map(() => -1) : order;
  return { level, seed, items, index: 0, slots, pace, tries: 0, mistakes: 0, firstTry: 0, wrong: [], solved: false, last: "none", lastKey: "", bump: 0, choices: choicesOf(level, items[0], pace, seed, 0) };
}

export const itemOf = (round: Round) => round.items[round.index];
export const planetOf = (round: Round) => PLANETS[itemOf(round).planet];
export const isLast = (round: Round) => round.index === round.items.length - 1;
export const isDone = (round: Round) => round.solved && isLast(round);
export const glowOn = (round: Round) => shouldGlow(round.pace, round.tries);

/** The one right key: a planet's id, an orbit number as text, a thing's id or a zone's id. */
export function rightKey(round: Round): string {
  const item = itemOf(round), planet = PLANETS[item.planet];
  if (item.kind === "place") return String(item.planet);
  if (item.kind === "size") return rightThing(planet).id;
  if (item.kind === "far") return rightZone(planet).id;
  return planet.id;
}

/** A tap or a pick. Right → solved; wrong → noted with a slip; an already-done planet or filled orbit → only "again". */
export function answer(round: Round, key: string): Round {
  if (round.solved) return round;
  const item = itemOf(round), bump = round.bump + 1;
  if (item.kind === "tour") {
    const tapped = PLANETS.findIndex(planet => planet.id === key);
    if (tapped < 0) return round;
    if (tapped < round.index) return { ...round, last: "again", lastKey: key, bump };
  } else if (item.kind === "place") {
    const orbit = Number(key);
    if (!Number.isInteger(orbit) || orbit < 0 || orbit >= round.slots.length) return round;
    if (round.slots[orbit] >= 0) return { ...round, last: "again", lastKey: key, bump };
  } else if (!round.choices.includes(key)) return round;
  if (key === rightKey(round)) {
    const mode = levelOf(round.level).mode;
    const slots = mode === "sort" ? placeOn(round.slots, item.planet, item.planet)
      : item.kind === "place" ? round.slots.map((planet, orbit) => orbit === item.planet ? item.planet : planet) : round.slots;
    return { ...round, slots, solved: true, last: "right", lastKey: key, bump, firstTry: round.firstTry + (round.tries === 0 ? 1 : 0), pace: nextPace(round.pace, round.tries === 0) };
  }
  if (round.wrong.includes(key)) return { ...round, last: "wrong", lastKey: key, bump };
  return { ...round, wrong: [...round.wrong, key], tries: round.tries + 1, mistakes: round.mistakes + 1, last: "wrong", lastKey: key, bump };
}

/** On to the next question. The last one stays put. */
export function advance(round: Round): Round {
  if (isLast(round)) return round;
  const index = round.index + 1;
  return { ...round, index, solved: false, tries: 0, wrong: [], last: "none", lastKey: "", bump: round.bump + 1, choices: choicesOf(round.level, round.items[index], round.pace, round.seed, index) };
}

/** One kind line after a slip: never "ভুল", only which way to think. */
export function hintOf(round: Round, key: string): string {
  const item = itemOf(round), planet = PLANETS[item.planet];
  if (item.kind === "tour") {
    const tapped = PLANETS.find(other => other.id === key);
    return tapped ? tourHint(tapped.id, planet) : "";
  }
  if (item.kind === "know") {
    const chosen = PLANETS.find(other => other.id === key);
    return chosen ? `ওটা ${chosen.name}: ${CLUE[chosen.id]}। আরেকবার দেখো।` : "";
  }
  if (item.kind === "place") return Number(key) > item.planet ? `${planet.name} আরও কাছে বসবে।` : `${planet.name} আরও দূরে বসবে।`;
  if (item.kind === "size") return sizeHint(THINGS.find(thing => thing.id === key)!, planet);
  return farHint(ZONES.find(zone => zone.id === key)!, planet);
}
export function tourHint(tappedId: Planet["id"], next: Planet) {
  return orderOf(tappedId) > orderOf(next.id) ? `${next.name} সূর্যের আরও কাছে, ওটা আগে।` : `আগে ${next.name}।`;
}
export function sizeHint(chosen: Thing, planet: Planet) {
  return chosen.sizeMm > rightThing(planet).sizeMm ? "আরও ছোট ভাবো।" : "আরও বড় ভাবো।";
}
export function farHint(chosen: Zone, planet: Planet) {
  return ZONES.indexOf(chosen) > ZONES.indexOf(rightZone(planet)) ? "আরও কাছে ভাবো।" : "আরও দূরে ভাবো।";
}

/** What the child finds out after each right answer. */
export function revealOf(round: Round): string {
  const item = itemOf(round), planet = PLANETS[item.planet];
  if (item.kind === "tour") return planet.fact;
  if (item.kind === "know") return planet.fact;
  if (item.kind === "place") return `সূর্যের ${ordinal(item.planet + 1)} গ্রহ। ${planet.fact}`;
  return item.kind === "size" ? sizeReveal(planet) : farReveal(planet);
}
export const sizeReveal = (planet: Planet) => `${planet.name} হতো ${mmLabel(footballScale(planet).sizeMm)}, একটা ${possessive(rightThing(planet).name)} মতো।`;
export const farReveal = (planet: Planet) => `${planet.name} থাকত ${metreLabel(footballScale(planet).distanceM)} দূরে, ${rightZone(planet).name}।`;
const ORDINALS = ["", "প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ", "সপ্তম", "অষ্টম"];
export const ordinal = (n: number) => ORDINALS[n] ?? bn(n);

/**
 * Stars are a record only, never spent or compared: 3 when at least three in four questions were right first time, 2 for at
 * least half, else 1. A finished round always earns one. Nothing here is timed, so ধীরে খেলো changes nothing.
 */
export const starsOf = (firstTry: number, count: number) => firstTry * 4 >= count * 3 ? 3 : firstTry * 2 >= count ? 2 : 1;

export type Result = { level: number; stars: number; count: number; firstTry: number; mistakes: number; planets: readonly number[] };
export function resultOf(round: Round): Result {
  const planets = round.items.map(item => item.planet).sort((a, b) => a - b);
  return { level: round.level, stars: starsOf(round.firstTry, round.items.length), count: round.items.length, firstTry: round.firstTry, mistakes: round.mistakes, planets };
}
