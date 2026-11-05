// One trip: fly to a country, flip its postcards, answer the stamp question, repeat. A passport-check level visits every
// country first and asks afterwards. Pure and deterministic (makeRng only), so tests and bots play exactly what the page
// plays. The page around it (screens, pause, the rest screen, keys) is session.ts.
import { makeRng, starsFor } from "../../../shared/game-core";
import { FLAGS } from "./art";
import { COUNTRIES, countryOf } from "./countries";
import { levelOf, type Ask, type Level } from "./levels";

export type Card = "hello" | "food" | "place" | "animal" | "like";
export const FULL_CARDS: readonly Card[] = ["hello", "food", "place", "animal", "like"];

/** The postcards at a stop: all five, or on a short level the greeting, what the stamp question asks about, and the "like" card. */
export function cardsFor(level: Level, stopIndex: number): Card[] {
  if (!level.short) return [...FULL_CARDS];
  const cards: Card[] = ["hello"];
  for (const ask of level.stops[stopIndex].asks) if ((ask === "food" || ask === "place" || ask === "animal") && !cards.includes(ask)) cards.push(ask);
  cards.push("like");
  return cards;
}

export const MIN_CHOICES = 2, MAX_CHOICES = 4;
/** Sweet-spot difficulty, never announced: three missed in a row take one picture away, five right in a row add one. Carries from trip to trip. */
export type Pace = { offset: number; right: number; missed: number };
export const START_PACE: Pace = { offset: 0, right: 0, missed: 0 };
export function nextPace(pace: Pace, firstTry: boolean): Pace {
  if (firstTry) return pace.right + 1 >= 5 ? { offset: Math.min(1, pace.offset + 1), right: 0, missed: 0 } : { ...pace, right: pace.right + 1, missed: 0 };
  return pace.missed + 1 >= 3 ? { offset: Math.max(-1, pace.offset - 1), right: 0, missed: 0 } : { ...pace, missed: pace.missed + 1, right: 0 };
}

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export const hasFlag = (id: string) => !!FLAGS[id];

/** How many pictures a question shows. Never fewer than 2 or more than 4. */
export const choiceCount = (level: Level, pace: Pace, asked: number) =>
  Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, asked === 0 && level.opening ? level.opening : level.base + pace.offset));

/** The right country plus `count − 1` others (country ids, in a seeded order). A flag question uses only countries whose flag we draw. `near` puts the level's other stops first. */
export function choicesFor(level: Level, stopIndex: number, ask: Ask, count: number, seed: number): string[] {
  const rng = makeRng(seed), target = level.stops[stopIndex].id;
  const fits = (id: string) => id !== target && (ask !== "flag" || hasFlag(id));
  const near = level.near ? shuffle(level.stops.map(stop => stop.id).filter(fits), rng) : [];
  const rest = shuffle(COUNTRIES.map(country => country.id).filter(id => fits(id) && !near.includes(id)), rng);
  return shuffle([target, ...[...near, ...rest].slice(0, Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, count)) - 1)], rng);
}

export type Phase = "map" | "fly" | "card" | "ask";
export type Q = { stop: number; ask: Ask };

export type Trip = {
  level: number; seed: number; phase: Phase;
  /** Stops the plane has landed at, in order; and the stop it is at (−1 on the first map). */
  visited: number[]; at: number; card: number;
  /** The questions of this stretch (a stop's, or after a passport check's last stop all of them) and the one on screen. */
  queue: Q[]; qi: number;
  /** Questions shown so far, for seeding and the opening size. */
  shown: number;
  tried: string[]; solved: boolean; choices: string[];
  /** Stops with all their questions answered. */
  stamped: number[];
  firstTry: number; misses: number; pace: Pace;
};

export function createTrip(levelId: number, seed: number, pace: Pace = START_PACE): Trip {
  return { level: levelOf(levelId).id, seed, phase: "map", visited: [], at: -1, card: 0, queue: [], qi: 0, shown: 0, tried: [], solved: false, choices: [], stamped: [], firstTry: 0, misses: 0, pace };
}

export const cardsHere = (trip: Trip) => cardsFor(levelOf(trip.level), trip.at);
export const questionNow = (trip: Trip): Q | null => (trip.phase === "ask" ? trip.queue[trip.qi] ?? null : null);
export const totalQuestions = (level: Level) => level.stops.reduce((sum, stop) => sum + stop.asks.length, 0);
export const allVisited = (trip: Trip) => trip.visited.length >= levelOf(trip.level).stops.length;
/** Pictures to tap now, or 0 off the ask screen. After two different wrong taps (one on a two-picture question) the right one glows. */
export const hintOn = (trip: Trip) => trip.phase === "ask" && !trip.solved && trip.tried.length >= Math.min(2, trip.choices.length - 1);

/** The last question of the whole trip: answering it right finishes the trip. */
export function isLast(trip: Trip) {
  if (trip.phase !== "ask" || trip.qi < trip.queue.length - 1) return false;
  return allVisited(trip);
}

function present(trip: Trip, queue: Q[], qi: number): Trip {
  const level = levelOf(trip.level), q = queue[qi];
  const choices = choicesFor(level, q.stop, q.ask, choiceCount(level, trip.pace, trip.shown), (trip.seed + trip.shown * 7919) >>> 0);
  return { ...trip, phase: "ask", queue, qi, shown: trip.shown + 1, tried: [], solved: false, choices };
}

/** A tap on a pin or a destination button: only from the map, only a stop not visited yet. */
export function fly(trip: Trip, stop: number): Trip {
  if (trip.phase !== "map" || trip.visited.includes(stop) || stop < 0 || stop >= levelOf(trip.level).stops.length) return trip;
  return { ...trip, phase: "fly", at: stop };
}

/** The plane lands: the first postcard. */
export function land(trip: Trip): Trip {
  if (trip.phase !== "fly") return trip;
  return { ...trip, phase: "card", card: 0, visited: [...trip.visited, trip.at] };
}

/** Passport-check questions after the last stop: every stop's questions, in a seeded order. */
function recallQueue(trip: Trip): Q[] {
  const level = levelOf(trip.level), all: Q[] = [];
  level.stops.forEach((stop, index) => stop.asks.forEach(ask => all.push({ stop: index, ask })));
  return shuffle(all, makeRng(trip.seed ^ 0x9e3779b1));
}

/** The next postcard, or when the last one is turned: the questions, or (a passport check before its last stop) back to the map. */
export function nextCard(trip: Trip): Trip {
  if (trip.phase !== "card") return trip;
  if (trip.card + 1 < cardsHere(trip).length) return { ...trip, card: trip.card + 1 };
  const level = levelOf(trip.level);
  if (!level.recall) return present(trip, level.stops[trip.at].asks.map(ask => ({ stop: trip.at, ask })), 0);
  if (!allVisited(trip)) return { ...trip, phase: "map" };
  return present(trip, recallQueue(trip), 0);
}

/** A tap on a picture. A right one counts as first-try only when no wrong one came before. Taps after solving, or on a picture not shown, change nothing. */
export function answer(trip: Trip, id: string): Trip {
  const q = questionNow(trip);
  if (!q || trip.solved || !trip.choices.includes(id)) return trip;
  if (id !== levelOf(trip.level).stops[q.stop].id) {
    if (trip.tried.includes(id)) return trip;
    return { ...trip, tried: [...trip.tried, id], misses: trip.misses + 1 };
  }
  const first = trip.tried.length === 0;
  const left = trip.queue.filter((item, at) => item.stop === q.stop && at > trip.qi).length;
  const stamped = left === 0 && !trip.stamped.includes(q.stop) ? [...trip.stamped, q.stop] : trip.stamped;
  return { ...trip, solved: true, firstTry: trip.firstTry + (first ? 1 : 0), pace: nextPace(trip.pace, first), stamped };
}

/** ➜ after a right answer: the next question, the map for the next stop, or (after the last) a finished trip (the caller shows the end). */
export function advance(trip: Trip): Trip {
  if (trip.phase !== "ask" || !trip.solved || isLast(trip)) return trip;
  if (trip.qi + 1 < trip.queue.length) return present(trip, trip.queue, trip.qi + 1);
  return { ...trip, phase: "map", tried: [], solved: false, choices: [] };
}

/** What a finished trip shows and records. */
export type Result = { level: number; stars: number; count: number; firstTry: number; misses: number; ids: string[]; clean: boolean };

/** Stars only record the trip: all first-try → 3 (all but one for six questions), two thirds → 2, any finished trip → 1. */
export const starsOf = (firstTry: number, total: number) => starsFor(firstTry, total >= 6 ? total - 1 : total, Math.ceil((total * 2) / 3));

export function resultOf(trip: Trip): Result {
  const level = levelOf(trip.level), count = totalQuestions(level);
  return { level: level.id, stars: starsOf(trip.firstTry, count), count, firstTry: trip.firstTry, misses: trip.misses, ids: level.stops.map(stop => stop.id), clean: trip.firstTry === count };
}

export const countryAt = (trip: Trip, stop: number) => countryOf(levelOf(trip.level).stops[stop].id)!;
