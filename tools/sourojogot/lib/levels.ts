// Levels, layout, scoring and the gentle difficulty steps. Pure functions, no React.
import { possessive } from "../../../shared/bangla";
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import {
  bn, footballScale, metreLabel, mmLabel, nearestThing, orderOf, PLANETS, THINGS, ZONES, zoneOf,
  type Planet, type PlanetId, type Thing, type Zone,
} from "./planets";

export type Mode = "tour" | "sort" | "size" | "far";
export type Level = { mode: Mode; count: 4 | 8; title: string };

export const LEVELS: readonly Level[] = [
  { mode: "tour", count: 4, title: "সফর: সূর্য থেকে মঙ্গল" },
  { mode: "tour", count: 8, title: "সফর: সূর্য থেকে নেপচুন" },
  { mode: "sort", count: 4, title: "সাজাও: কাছের চার গ্রহ" },
  { mode: "sort", count: 8, title: "সাজাও: আট গ্রহ" },
  { mode: "size", count: 8, title: "ফুটবল সূর্য: কত বড়?" },
  { mode: "far", count: 8, title: "ফুটবল সূর্য: কত দূরে?" },
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];
export const planetsOf = (level: number) => PLANETS.slice(0, levelOf(level).count);

/** Stars are a record only: 3 with no slip, 2 with up to two, else 1. A finished round always earns one. */
export const starsOf = (mistakes: number) => starsFor(mistakes, 0, 2, true);

/** The board is a 360×470 box with the Sun in the top-left corner; each planet sits on its own orbit. */
export const BOARD = { width: 360, height: 470, sunR: 78 } as const;
const ANGLES: Record<4 | 8, number[]> = { 4: [21, 75, 26, 66], 8: [66, 20, 54, 75, 31, 66, 40, 54] };
export function orbitRadius(index: number, count: 4 | 8) {
  return 118 + index * (440 - 118) / (count - 1);
}
/** Where orbit `index` (0 = nearest the Sun) puts its planet, in board units. */
export function spot(index: number, count: 4 | 8) {
  const r = orbitRadius(index, count), angle = ANGLES[count][index] * Math.PI / 180;
  return { x: Math.round(r * Math.cos(angle)), y: Math.round(r * Math.sin(angle)) };
}

/** The sort round's starting places: every planet away from its own orbit (a derangement), from a seed. */
export function shuffledSlots(count: number, seed: number): number[] {
  const rng = makeRng(seed);
  for (;;) {
    const slots = Array.from({ length: count }, (_, index) => index);
    for (let i = count - 1; i > 0; i--) { const j = pick(rng, i + 1); [slots[i], slots[j]] = [slots[j], slots[i]]; }
    if (slots.every((planet, slot) => planet !== slot)) return slots;
  }
}
/** Puts `planet` on orbit `target` by swapping it with whatever sits there. `slots[orbit] = planet index`. */
export function placeOn(slots: readonly number[], planet: number, target: number) {
  const next = [...slots], from = next.indexOf(planet);
  [next[from], next[target]] = [next[target], next[from]];
  return next;
}

/**
 * Sweet-spot difficulty, never announced: three slips in a row ease the next item (the answer glows from the start and the
 * guess rounds offer 2 choices); five right in a row step it up (4 choices). `help` is -1 (harder), 0 or 1 (easier).
 */
export type Pace = { right: number; wrong: number; help: -1 | 0 | 1 };
export const FRESH_PACE: Pace = { right: 0, wrong: 0, help: 0 };
export function nextPace(pace: Pace, correct: boolean): Pace {
  if (correct) { const right = pace.right + 1; return { right, wrong: 0, help: right >= 5 ? -1 : pace.help === 1 ? 0 : pace.help }; }
  const wrong = pace.wrong + 1;
  return { right: 0, wrong, help: wrong >= 3 ? 1 : pace.help === -1 ? 0 : pace.help };
}
export const choiceCount = (pace: Pace) => pace.help === 1 ? 2 : pace.help === -1 ? 4 : 3;
/** The right answer glows after two tries on one item, or from the start when eased. */
export const shouldGlow = (pace: Pace, tries: number) => pace.help === 1 || tries >= 2;

/** Size round: the right thing plus neighbours by size, in size order, so the choice is about scale and never a trick. */
export function sizeChoices(planet: Planet, count: number, seed: number): Thing[] {
  const right = nearestThing(footballScale(planet).sizeMm), rng = makeRng(seed);
  const others = THINGS.filter(thing => thing.id !== right.id);
  const picked = new Set<string>([right.id]);
  while (picked.size < Math.min(count, THINGS.length)) picked.add(others[pick(rng, others.length)].id);
  return THINGS.filter(thing => picked.has(thing.id));
}
/** Far round: always the three places, near to far. */
export const farChoices = (): readonly Zone[] => ZONES;

export const rightThing = (planet: Planet) => nearestThing(footballScale(planet).sizeMm);
export const rightZone = (planet: Planet) => zoneOf(footballScale(planet).distanceM);

/** One-line "why" after a slip: never "ভুল", only which way to think. */
export function tourHint(tapped: PlanetId, next: Planet) {
  return orderOf(tapped) > orderOf(next.id) ? `${next.name} সূর্যের আরও কাছে, ওটা আগে।` : `আগে ${next.name}।`;
}
export function sizeHint(chosen: Thing, planet: Planet) {
  return chosen.sizeMm > rightThing(planet).sizeMm ? "আরও ছোট ভাবো।" : "আরও বড় ভাবো।";
}
export function farHint(chosen: Zone, planet: Planet) {
  return ZONES.indexOf(chosen) > ZONES.indexOf(rightZone(planet)) ? "আরও কাছে ভাবো।" : "আরও দূরে ভাবো।";
}

/** What the child finds out after each right answer. */
export function sizeReveal(planet: Planet) {
  return `${planet.name} হতো ${mmLabel(footballScale(planet).sizeMm)}, একটা ${possessive(rightThing(planet).name)} মতো।`;
}
export function farReveal(planet: Planet) {
  return `${planet.name} থাকত ${metreLabel(footballScale(planet).distanceM)} দূরে, ${rightZone(planet).name}।`;
}

/** The end screen and the parent card: what was done, with no name. */
export function doneLine(level: number) {
  const { mode, count } = levelOf(level), last = PLANETS[count - 1].name;
  if (mode === "tour") return `আজ সূর্য থেকে ${last} পর্যন্ত ঘুরে এলাম`;
  if (mode === "sort") return `আজ ${bn(count)}টা গ্রহ ঠিক ক্রমে সাজালাম`;
  if (mode === "size") return `আজ ${bn(count)}টা গ্রহের মাপ মেলালাম`;
  return `আজ ${bn(count)}টা গ্রহের দূরত্ব মাপলাম`;
}
/** The card's second line: one true number from the round. */
export function cardFact(level: number) {
  const { mode } = levelOf(level);
  const earth = PLANETS[2], neptune = PLANETS[7];
  if (mode === "size") return `সূর্য ফুটবল হলে পৃথিবী ${mmLabel(footballScale(earth).sizeMm)}, একটা সরিষার দানা`;
  if (mode === "far") return `সূর্য ফুটবল হলে নেপচুন ${metreLabel(footballScale(neptune).distanceM)} দূরে`;
  return levelOf(level).count === 4 ? "সূর্যের কাছের এই চার গ্রহের ওপরটা শক্ত মাটির" : "বৃহস্পতির ভেতরে প্রায় ১০০০টা পৃথিবী ধরে যায়";
}
