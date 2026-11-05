// The game's lines: shouts over the pile, what a screen reader hears, and the result's one line. Pure, no React.
import { bn, sacksLabel } from "./link";
import type { End, Verdict } from "./rules";

/** The shout over the pile when a sack lands. */
export function shout(verdict: Verdict, combo: number) {
  if (verdict === "perfect") return combo >= 2 ? `ঠিক মাঝে! ×${bn(combo)}` : "ঠিক মাঝে!";
  if (verdict === "good") return "বসে গেল";
  if (verdict === "wide") return "একটু সরে গেল";
  return verdict === "slip" ? "ফসকে গেল!" : "বেশি হেলে গেল!";
}

/** The sentence a screen reader hears after each drop. */
export function dropNews(verdict: Verdict, sacks: number, goal: number) {
  const load = goal ? `${bn(Math.min(sacks, goal))}/${bn(goal)}।` : `${sacksLabel(sacks)}।`;
  if (verdict === "perfect") return `ঠিক মাঝে! ${load}`;
  if (verdict === "good") return `বসে গেছে। ${load}`;
  if (verdict === "wide") return `একটু সরে বসেছে। ${load}`;
  return verdict === "slip" ? "বস্তা ফসকে নদীতে পড়ল।" : "পাহাড় বেশি হেলে গেল।";
}

/** Why a round ended, for the end screen's kicker. */
export function endLine(end: End | null, verdict: Verdict | null) {
  if (end === "clear") return "ট্রাক ভরে রওনা দিল।";
  if (end === "late") return "ভেঁপু বেজে গেল, লঞ্চ ছেড়ে দিল।";
  if (end === "topple") return "পাহাড় হেলে ভেঙে পড়ল।";
  return verdict === "lean" ? "পাহাড় ওলনের দাগ ছেড়ে বেশি হেলে গিয়েছিল।" : "বস্তাটা নিচেরটার ওপর অর্ধেকও পড়েনি।";
}

export type Band = "zero" | "start" | "good" | "great" | "master";
export function bandOf(sacks: number): Band {
  if (sacks <= 0) return "zero";
  if (sacks < 8) return "start";
  if (sacks < 18) return "good";
  if (sacks < 30) return "great";
  return "master";
}
const lines: Record<Band, string> = {
  zero: "প্রথম বস্তাটাই ফসকাল। দোলটা চিনে নাও, পরেরবার হবে।",
  start: "শুরুটা ভালো। আরেক দানে পাহাড় আরও উঁচু হবে।",
  good: "ভালোই সাজিয়েছ। ঘাটের সবাই তাকিয়ে আছে।",
  great: "পাকা হাত। সর্দার খাতায় তোমার নাম লিখে রাখল।",
  master: "এ তো ওভারলোড ট্রাক। চাকা বসে গেল বলে।",
};
/** The dry line under an endless or old result. */
export const humanLine = (sacks: number) => lines[bandOf(sacks)];

/** The line under a level result, by stars. */
export function levelLine(stars: number, perfect: number, goal: number) {
  if (stars === 0) return "ট্রাক এখনো ভরেনি। দোলটা আরেকবার দেখে নাও।";
  if (perfect === goal) return `${bn(goal)}টা বস্তার ${bn(goal)}টাই ঠিক মাঝে। সর্দার মাপার ফিতা পকেটে রাখল।`;
  if (stars === 3) return "সর্দার গুনে দেখল, একটাও বাঁকা না।";
  if (stars === 2) return "ট্রাক ভরা, পাহাড় সোজা। আরেকটু মাঝে পড়লেই ৩ তারা।";
  return "ট্রাক ভরেছে। এবার মাঝ বরাবর ফেলার পালা।";
}
