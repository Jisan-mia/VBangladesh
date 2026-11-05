// One round: a child's day in order (wake-up … bed), each item either "set" (turn the hands to a time) or "read" (pick the clock
// that matches), the choices, how the next item gets easier or harder, and the stars. Pure and deterministic (makeRng only),
// so tests and the bots play exactly what the page plays.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { SLOTS, type Activity } from "./day";
import { type Hand } from "./hands";
import { levelOf, minutesOf, type Level } from "./levels";
import { hands, hour12, mod, onFace, same, sayTime, type Time } from "./time";

export type Mode = "set" | "read";
export type Item = { activity: Activity; time: Time; mode: Mode; /** Where the hands start (minutes since 12:00), for a "set" item. */ start: number };

/** How a level says a time: from world 4's second level with সকাল/দুপুর/… in front. */
export const say = (time: Time, level: Level) => sayTime(time, { part: level.part });
const key = (time: Time) => mod(time.h * 60 + time.m, 1440);

/** The hands start at 12:00; when the target is on the 12, at 6:00 instead, so no item starts solved. Level ২'s finale starts the long hand away. */
function startOf(level: Level, time: Time, rng: () => number) {
  const m = level.startAway ? [15, 30, 45][pick(rng, 3)] : 0;
  return (hour12(time.h) === 12 ? 6 : 0) * 60 + m;
}

/** The modes of a round: "set" first (the ghost finger shows it), no three alike in a row, about half and half. */
export function modesOf(count: number, rng: () => number): Mode[] {
  for (let attempt = 0; attempt < 40; attempt++) {
    const modes: Mode[] = ["set"];
    while (modes.length < count) {
      const n = modes.length, last = modes[n - 1];
      modes.push(n >= 2 && modes[n - 2] === last ? (last === "set" ? "read" : "set") : rng() < 0.5 ? "set" : "read");
    }
    const sets = modes.filter(mode => mode === "set").length;
    if (sets >= Math.floor(count / 2) && sets <= Math.ceil(count / 2) + 1) return modes;
  }
  return Array.from({ length: count }, (_, at) => (at % 2 === 0 ? "set" : "read"));
}

/** A round's items: wake-up, some of the middle slots, bedtime, in order. */
export function makeItems(id: number, seed: number): Item[] {
  const level = levelOf(id), rng = makeRng(seed), count = level.items;
  const middle = SLOTS.slice(1, -1).map((_, i) => i + 1);
  // দেড়টা and আড়াইটা always appear in their level: the 12–13 and 14–15 slots, fixed at 13:30 and 14:30.
  const keep = level.halves ? [4, 5] : [];
  const pool = middle.filter(slot => !keep.includes(slot));
  while (pool.length + keep.length > count - 2) pool.splice(pick(rng, pool.length), 1);
  const slots = [0, ...[...keep, ...pool].sort((a, b) => a - b), SLOTS.length - 1];
  const modes = modesOf(count, rng);
  return slots.map((slotIndex, index) => {
    const slot = SLOTS[slotIndex];
    const activity = slot.options[pick(rng, slot.options.length)];
    const hour = level.halves && slotIndex === 4 ? 13 : level.halves && slotIndex === 5 ? 14 : slot.hours[pick(rng, slot.hours.length)];
    const time = { h: hour, m: level.ask[pick(rng, level.ask.length)] };
    return { activity, time, mode: modes[index], start: startOf(level, time, rng) };
  });
}

/**
 * "কয়টা বাজে?" cards: the answer plus the mix-ups children really make, using only words this level has taught: the hour one off
 * (পৌনে ৫ read as পৌনে ৬), the long hand read wrong, and where the sky decides, the same time at the other end of the day.
 * No two cards read alike, and no two draw the same picture unless the level separates them by the part of the day.
 */
export function readChoices(target: Time, level: Level, count: number, seed: number): Time[] {
  const rng = makeRng(seed), wrap = (h: number, m: number): Time => ({ h: mod(h, 24), m });
  const near: Time[] = [
    ...(level.part ? [wrap(target.h + 12, target.m)] : []),
    wrap(target.h + 1, target.m), wrap(target.h - 1, target.m),
    ...minutesOf(level).filter(m => m !== target.m).flatMap(m => [wrap(target.h, m), wrap(target.h + 1, m)]),
    wrap(target.h + 2, target.m), wrap(target.h - 2, target.m),
  ];
  const faces = new Set([key(target) % 720]), said = new Set([say(target, level)]), pool: Time[] = [];
  for (const time of near) {
    const text = say(time, level), face = key(time) % 720;
    if (said.has(text) || (!level.part && faces.has(face))) continue;
    said.add(text); faces.add(face); pool.push(time);
  }
  // Keep the first (most telling) mix-up, then fill from the rest at random.
  const picked = pool.splice(0, 1);
  while (picked.length < count - 1 && pool.length) picked.push(pool.splice(pick(rng, Math.min(pool.length, 6)), 1)[0]);
  return [target, ...picked].sort((a, b) => key(a) - key(b));
}

/**
 * Sweet-spot difficulty, never announced: three slips in a row ease the next item (the answer shows from the start and "read" offers
 * 2 cards); five right in a row step it up (4 cards). `help`: −1 harder, 0, 1 easier.
 */
export type Pace = { right: number; wrong: number; help: -1 | 0 | 1 };
export const START_PACE: Pace = { right: 0, wrong: 0, help: 0 };
export function nextPace(pace: Pace, firstTry: boolean): Pace {
  if (firstTry) { const right = pace.right + 1; return { right, wrong: 0, help: right >= 5 ? -1 : pace.help === 1 ? 0 : pace.help }; }
  const wrong = pace.wrong + 1;
  return { right: 0, wrong, help: wrong >= 3 ? 1 : pace.help === -1 ? 0 : pace.help };
}
export const choiceCount = (pace: Pace) => (pace.help === 1 ? 2 : pace.help === -1 ? 4 : 3);
/** After this many slips on one item, the answer shows. So no item takes more than three tries. */
export const GLOW_AFTER = 2;

/** Stars only record the round: all but one item right first time → 3, at least half → 2, any finished round → 1. */
export const starsOf = (firstTry: number, items: number) => starsFor(firstTry, items - 1, Math.ceil(items / 2));

export type Round = {
  level: number; seed: number; items: Item[]; index: number;
  /** The hands, minutes since 12:00 (a "set" item). */
  total: number;
  /** Slips on this item, and in the whole round. */
  tries: number; misses: number;
  /** Items right on the first try so far. */
  firstTry: number;
  solved: boolean; pace: Pace;
  /** The "read" cards, and the ones already tried. */
  choices: Time[]; tried: string[];
  /** The hand to fix after a slip on a "set" item. */
  wrongHand: Hand | null;
};

const itemSeed = (seed: number, index: number) => (seed + index * 7919) >>> 0;
const faceKey = (time: Time) => `${time.h}:${time.m}`;
/** Never more than 3 cards in the minutes worlds: their words are long (সন্ধ্যা ৭টা বেজে ২০ মিনিট) and four would not fit a phone. */
const cardCount = (level: Level, pace: Pace) => Math.min(choiceCount(pace), level.step === 5 ? 3 : 4);
const cardsFor = (level: Level, item: Item, pace: Pace, seed: number, index: number) =>
  item.mode === "read" ? readChoices(item.time, level, cardCount(level, pace), itemSeed(seed, index)) : [];

export function createRound(id: number, seed: number, pace: Pace = START_PACE): Round {
  const level = levelOf(id), items = makeItems(level.id, seed);
  return { level: level.id, seed, items, index: 0, total: items[0].start, tries: 0, misses: 0, firstTry: 0, solved: false, pace, choices: cardsFor(level, items[0], pace, seed, 0), tried: [], wrongHand: null };
}

export const currentItem = (round: Round) => round.items[round.index];
export const isLast = (round: Round) => round.index >= round.items.length - 1;
export const isDone = (round: Round) => round.solved && isLast(round);
/** The answer shows (ghost hands, or a ringed card) after two slips, or from the start when the pace is eased. */
export const glowOn = (round: Round) => !round.solved && (round.pace.help === 1 || round.tries >= GLOW_AFTER);

/** The hands were turned (a drag ended, a tap, a key). Ignored once the item is solved. */
export function turn(round: Round, total: number): Round {
  const item = currentItem(round);
  if (round.solved || item.mode !== "set" || total === round.total) return round;
  return { ...round, total, wrongHand: null };
}

/** ✓ on a "set" item: right if the hands read the target; otherwise a slip, naming the hand to fix (the long one first, since it decides the words). */
export function check(round: Round): Round {
  const item = currentItem(round);
  if (round.solved || item.mode !== "set") return round;
  const first = round.tries === 0;
  if (same(round.total, item.time)) return { ...round, solved: true, wrongHand: null, firstTry: round.firstTry + (first ? 1 : 0), pace: nextPace(round.pace, first) };
  const wrongHand: Hand = onFace(round.total).m !== item.time.m ? "minute" : "hour";
  return { ...round, tries: round.tries + 1, misses: round.misses + 1, wrongHand, pace: nextPace(round.pace, false) };
}

/** A card on a "read" item. A wrong one is remembered, so it can show its own picture. */
export function choose(round: Round, time: Time): Round {
  const item = currentItem(round);
  if (round.solved || item.mode !== "read" || !round.choices.some(card => faceKey(card) === faceKey(time)) || round.tried.includes(faceKey(time))) return round;
  if (faceKey(time) === faceKey(item.time)) {
    const first = round.tries === 0;
    return { ...round, solved: true, firstTry: round.firstTry + (first ? 1 : 0), pace: nextPace(round.pace, first) };
  }
  return { ...round, tries: round.tries + 1, misses: round.misses + 1, tried: [...round.tried, faceKey(time)], pace: nextPace(round.pace, false) };
}

/** On to the next item, with its cards sized by the pace so far. */
export function nextItem(round: Round): Round {
  if (!round.solved || isLast(round)) return round;
  const index = round.index + 1, item = round.items[index], level = levelOf(round.level);
  return { ...round, index, total: item.start, tries: 0, solved: false, wrongHand: null, tried: [], choices: cardsFor(level, item, round.pace, round.seed, index) };
}

export const cardKey = faceKey;

/** What a finished round shows and records. */
export type Result = { level: number; stars: number; count: number; firstTry: number; misses: number; items: Item[] };
export const resultOf = (round: Round): Result =>
  ({ level: round.level, stars: starsOf(round.firstTry, round.items.length), count: round.items.length, firstTry: round.firstTry, misses: round.misses, items: round.items });

/** The ghost finger's first move on an item: the long hand to its place if it isn't there, else the short hand to its hour. Angles clockwise from 12. */
export function demoOf(item: Item): { hand: Hand; from: number; to: number } {
  const start = hands(item.start), target = hands(item.time.h * 60 + item.time.m);
  return mod(item.start, 60) !== item.time.m
    ? { hand: "minute", from: mod(start.minute, 360), to: mod(target.minute, 360) }
    : { hand: "hour", from: mod(start.hour, 360), to: mod(target.hour, 360) };
}
