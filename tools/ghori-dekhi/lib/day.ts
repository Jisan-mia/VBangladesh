// A child's day on the clock: the routine, one ordinary day slot by slot. (Levels are levels.ts, rounds are round.ts.) Pure, no React.
import type { Time } from "./time";

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
