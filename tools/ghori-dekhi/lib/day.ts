// A child's day on the clock: the routine, the five levels, each round's items, the choices, pacing and stars. Pure, no React.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { bn, mod, sayTime, type Time } from "./time";

export type ActivityId =
  | "wake" | "breakfast" | "brush" | "moktob" | "school" | "tiffin" | "chuti" | "lunch" | "draw" | "bath" | "play" | "study" | "dinner" | "sleep";
export type Activity = { id: ActivityId; name: string };

/**
 * One ordinary day, in order. Each slot owns its own hours (24-hour clock), so times always rise through a round.
 * Some slots offer a choice of activity, picked per round: every child's morning is different, and none is required.
 */
export const SLOTS: readonly { hours: readonly number[]; options: readonly Activity[] }[] = [
  { hours: [6], options: [{ id: "wake", name: "ঘুম থেকে ওঠা" }] },
  { hours: [7], options: [{ id: "breakfast", name: "নাশতা খাওয়া" }, { id: "brush", name: "দাঁত মাজা" }, { id: "moktob", name: "মক্তবে যাওয়া" }] },
  { hours: [8, 9], options: [{ id: "school", name: "স্কুলে যাওয়া" }] },
  { hours: [10, 11], options: [{ id: "tiffin", name: "টিফিন খাওয়া" }] },
  { hours: [12, 13], options: [{ id: "chuti", name: "স্কুল ছুটি" }, { id: "lunch", name: "দুপুরের খাওয়া" }] },
  { hours: [14, 15], options: [{ id: "draw", name: "ছবি আঁকা" }, { id: "bath", name: "গোসল করা" }] },
  { hours: [16, 17], options: [{ id: "play", name: "মাঠে খেলা" }] },
  { hours: [18, 19], options: [{ id: "study", name: "পড়তে বসা" }] },
  { hours: [20], options: [{ id: "dinner", name: "রাতের খাওয়া" }] },
  { hours: [21], options: [{ id: "sleep", name: "ঘুমাতে যাওয়া" }] },
];
export const ACTIVITIES: readonly Activity[] = SLOTS.flatMap(slot => slot.options);

export type Level = { title: string; minutes: readonly number[]; ask: readonly number[]; step: 5 | 15; part: boolean };
const ALL = Array.from({ length: 12 }, (_, i) => i * 5);
/** `ask`: the minutes a round's times are drawn from (repeats weight them). `minutes`: every minute word the level may show. */
export const LEVELS: readonly Level[] = [
  { title: "ঠিক ঘণ্টা: ৭টা, ৮টা", minutes: [0], ask: [0], step: 15, part: false },
  { title: "সাড়ে: আধা ঘণ্টা", minutes: [0, 30], ask: [30, 30, 0], step: 15, part: false },
  { title: "সোয়া আর পৌনে", minutes: [0, 15, 30, 45], ask: [15, 45, 15, 45, 30], step: 15, part: false },
  { title: "৫ মিনিট করে", minutes: ALL, ask: [5, 10, 20, 25, 35, 40, 50, 55], step: 5, part: false },
  { title: "সকাল না সন্ধ্যা?", minutes: ALL, ask: ALL, step: 5, part: true },
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];

export const ROUND = 6;
export type Mode = "set" | "read";
export type Item = { activity: Activity; time: Time; mode: Mode };

/** A round: wake-up, four of the middle slots and bedtime, in order; "set the clock" first (the ghost finger shows it), then turns. */
export function makeRound(level: number, seed: number): Item[] {
  const spec = levelOf(level), rng = makeRng(seed);
  const middle = SLOTS.slice(1, -1).map((_, i) => i + 1);
  while (middle.length > ROUND - 2) middle.splice(pick(rng, middle.length), 1);
  return [0, ...middle, SLOTS.length - 1].map((slotIndex, index) => {
    const slot = SLOTS[slotIndex];
    return {
      activity: slot.options[pick(rng, slot.options.length)],
      time: { h: slot.hours[pick(rng, slot.hours.length)], m: spec.ask[pick(rng, spec.ask.length)] },
      mode: index % 2 === 0 ? "set" : "read",
    };
  });
}

/** How this level says a time: from level 5 with সকাল/দুপুর/… in front. */
export const say = (time: Time, level: number) => sayTime(time, { part: levelOf(level).part });
const key = (time: Time) => mod(time.h * 60 + time.m, 1440);

/**
 * "কয়টা বাজে?" choices: the answer plus the mix-ups children really make, using only words this level has taught:
 * the hour one off (পৌনে ৫ read as পৌনে ৬), the big hand read wrong, and from level 5 the same time at the other end of the day.
 */
export function readChoices(target: Time, level: number, count: number, seed: number): Time[] {
  const spec = levelOf(level), rng = makeRng(seed);
  const wrap = (h: number, m: number): Time => ({ h: mod(h, 24), m });
  const near: Time[] = [
    ...(spec.part ? [wrap(target.h + 12, target.m)] : []),
    wrap(target.h + 1, target.m), wrap(target.h - 1, target.m),
    ...spec.minutes.filter(m => m !== target.m).flatMap(m => [wrap(target.h, m), wrap(target.h + 1, m)]),
    wrap(target.h + 2, target.m), wrap(target.h - 2, target.m),
  ];
  const seen = new Set([say(target, level)]), pool: Time[] = [];
  for (const time of near) { const said = say(time, level); if (!seen.has(said)) { seen.add(said); pool.push(time); } }
  // Keep the first (most telling) mix-up, then fill from the rest at random.
  const picked = pool.splice(0, 1);
  while (picked.length < count - 1 && pool.length) picked.push(pool.splice(pick(rng, Math.min(pool.length, 6)), 1)[0]);
  return [target, ...picked].sort((a, b) => key(a) - key(b));
}


/**
 * Sweet-spot difficulty, never announced: three slips in a row ease the next item (the answer glows from the start and
 * "কয়টা বাজে?" offers 2 choices); five right in a row step it up (4 choices). `help`: -1 harder, 0, 1 easier.
 */
export type Pace = { right: number; wrong: number; help: -1 | 0 | 1 };
export const FRESH_PACE: Pace = { right: 0, wrong: 0, help: 0 };
export function nextPace(pace: Pace, correct: boolean): Pace {
  if (correct) { const right = pace.right + 1; return { right, wrong: 0, help: right >= 5 ? -1 : pace.help === 1 ? 0 : pace.help }; }
  const wrong = pace.wrong + 1;
  return { right: 0, wrong, help: wrong >= 3 ? 1 : pace.help === -1 ? 0 : pace.help };
}
export const choiceCount = (pace: Pace) => pace.help === 1 ? 2 : pace.help === -1 ? 4 : 3;
/** The answer glows after two tries on one item, or from the start when eased. */
export const shouldGlow = (pace: Pace, tries: number) => pace.help === 1 || tries >= 2;

/** Which hand the ghost finger shows first, and where it should end: the big hand unless it already sits on 12. */
export function firstMove(target: Time) {
  return target.m === 0 ? { hand: "hour" as const, angle: mod(target.h, 12) * 30 } : { hand: "minute" as const, angle: target.m * 6 };
}

/** Stars are a record only: 3 with no slip, 2 with up to two, else 1. A finished round always earns one. */
export const starsOf = (mistakes: number) => starsFor(mistakes, 0, 2, true);

/** The end screen and the parent card: what was done, with no name. */
export const doneLine = (count = ROUND) => `আজ ঘড়িতে ${bn(count)}টা সময় মেলালাম`;

/** One line of praise for the method, only when it's earned. */
export function methodLine(mistakes: number, level: number) {
  if (mistakes) return `${bn(mistakes)}বার আবার দেখেছ, তারপর মিলিয়েছ।`;
  return levelOf(level).minutes.length > 1 ? "আগে বড় কাঁটা দেখেছ, তাই একবারও আটকাওনি।" : "ছোট কাঁটা দেখে দেখে মিলিয়েছ, একবারও আটকাওনি।";
}


/** The ?print sheet: six blank clocks through one day, every kind of time once, for drawing the hands on. */
export const PRINT_DAY: readonly { time: Time; activity: ActivityId }[] = [
  { time: { h: 7, m: 0 }, activity: "wake" },
  { time: { h: 8, m: 30 }, activity: "school" },
  { time: { h: 11, m: 15 }, activity: "tiffin" },
  { time: { h: 13, m: 30 }, activity: "lunch" },
  { time: { h: 16, m: 45 }, activity: "play" },
  { time: { h: 19, m: 20 }, activity: "study" },
];
export const activityOf = (id: ActivityId) => ACTIVITIES.find(activity => activity.id === id)!;
