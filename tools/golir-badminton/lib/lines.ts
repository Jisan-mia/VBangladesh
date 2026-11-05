// Every line of words the game says: calls under the court, result lines, the friend's banner, the card and the caption.
// Server-safe (share.ts reads the preview title through here).
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import type { Shared } from "./challenge";
import { levelDef, LEVEL_COUNT, OLD_POINTS, WORLDS, CLEAR, DRIVE, DROP, FLOAT, JUMP, LIFT, SMASH } from "./levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** First to how many points the friend's match was (an old link counted a first-to-5). */
export const pointsOf = (shared: Pick<Shared, "level" | "old">) => shared.old ? OLD_POINTS : levelDef(shared.level).points;
export const score = (us: number, them: number) => `${bn(us)}–${bn(them)}`;
export const levelLabel = (level: number) => `${WORLDS[levelDef(level).world].name} · লেভেল ${bn(level)}`;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** "রাফি মোড়ের দোকানের মামাকে ৫–২ পয়েন্টে হারিয়েছে" */
export function feat(shared: Pick<Shared, "level" | "them" | "name" | "old">) {
  return `${cleanName(shared.name) || "এক বন্ধু"} ${levelDef(shared.level).rival.obj} ${score(pointsOf(shared), shared.them)} পয়েন্টে হারিয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের স্কোর। একই প্রতিপক্ষ, একই শাটলের হিসাব, এবার তোমার পালা।`;

/** After a friend's match: fewer points given away is better, then the longer rally. Kind either way. */
export function compareLine(mine: { them: number; rally: number }, theirs: { them: number; rally: number }, name: string) {
  const friend = who(name);
  if (mine.them < theirs.them) return `${friend} ${bn(theirs.them)} পয়েন্ট দিয়েছিল, তুমি ${bn(mine.them)}।`;
  if (mine.them > theirs.them) return `${friend} দিয়েছিল ${bn(theirs.them)} পয়েন্ট। আর একটু হলেই।`;
  if (mine.rally > theirs.rally) return `পয়েন্ট সমান, তবে তোমার র‍্যালি ${possessive(friend)} চেয়ে লম্বা।`;
  return `সমান সমান। ${friend}ও ${bn(theirs.them)} পয়েন্ট দিয়েছিল।`;
}

export function caption(shared: Pick<Shared, "level" | "them" | "rally" | "old">) {
  return `গলির ব্যাডমিন্টনে ${levelDef(shared.level).rival.obj} ${score(pointsOf(shared), shared.them)} পয়েন্টে হারালাম। এক র‍্যালিতে ${bn(shared.rally)} বার মেরেছি। তুমি পারবে?`;
}

const CLEAR_LINES = [
  "ভাইয়া হাসতে হাসতে শাটল কুড়িয়ে আনছে।",
  "আপু সিঁড়ি বেয়ে তিনতলায় ফিরে গেল।",
  "মামা দোকানে ফিরে চুলায় চা চাপিয়েছে।",
  "রনি ভাই ক্যাপ্টেনের মাফলারটা তোমার গলায় দিল।",
  "টুটুল ঘুড়ির লাটাই গুটিয়ে নিচে নামল।",
  "দমকা হাওয়াও রুমা আপার পক্ষে গেল না।",
  "সাজুর চ্যাপ্টা মার এবার জালেই আটকাল।",
  "মিঠু ভাই ছাদের চাবিটা তোমার হাতে দিল।",
  "বল্টু তোমার জন্য এক কাপ চা ঢালল।",
  "বড় ভাইয়ের ধোঁকা ধরে ফেলেছ।",
  "রিয়াজ হাঁপাতে হাঁপাতে বেঞ্চে বসে পড়ল।",
  "পাড়ার নতুন চ্যাম্পিয়ন তুমি। জানালায় জানালায় হাততালি।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** The card's own line, seen by friends. */
export function humanLine(shared: Pick<Shared, "level" | "them" | "rally" | "old">) {
  if (shared.level === LEVEL_COUNT && !shared.old) return "পাড়ার নতুন চ্যাম্পিয়ন।";
  if (shared.rally >= 12) return `এক র‍্যালিতে ${bn(shared.rally)} বার। জানালায় লোক জমে গিয়েছিল।`;
  if (shared.them === 0) return "শাটল একবারও এই দিকে মাটি ছোঁয়নি।";
  if (shared.them <= 2) return "বাল্বের নিচে জমজমাট খেলা।";
  return "শেষ পয়েন্ট পর্যন্ত কেউ ঘরে যায়নি।";
}

// ---- calls under the court ----
// Fixed strings, so a frame never builds one: [kind] for your shot, then the point calls by reason.
const YOUR_SHOT: Record<number, string> = {
  [CLEAR]: "উঁচু করে পেছনে।", [LIFT]: "তুলে দিলে।", [SMASH]: "স্ম্যাশ!", [DROP]: "জালের গা ঘেঁষে ড্রপ।",
};
export const shotCall = (kind: number, perfect: boolean) => perfect ? (kind === SMASH ? "সোনালি স্ম্যাশ!" : kind === DROP ? "সোনালি ড্রপ।" : "সোনালি মার।") : YOUR_SHOT[kind] ?? "";

const THEIR_SHOT: Record<number, string> = {
  [CLEAR]: "উঁচু আসছে।", [LIFT]: "উঁচু আসছে।", [DROP]: "ছোট ড্রপ আসছে।", [DRIVE]: "চ্যাপ্টা জোরে আসছে।", [SMASH]: "স্ম্যাশ আসছে!", [JUMP]: "ঝাঁপ স্ম্যাশ!", [FLOAT]: "ঘূর্ণি লব! ছায়া দেখো।",
};
export const theirShotCall = (kind: number) => THEIR_SHOT[kind] ?? "";

/** When a point ends. `reason` is one of the R_ codes in match.ts (0 miss, 1 whiff, 2 your net, 3 your out, 4 out of reach, 5 beaten, 6 their net, 7 their out). */
export function pointCall(winner: number, reason: number, short: string, lastKind: number) {
  if (winner === 0) {
    if (reason === 4) return lastKind === DROP ? `ড্রপে ${short} পৌঁছাতে পারল না।` : `${short} ধরতে পারল না।`;
    if (reason === 5) return lastKind === SMASH ? `স্ম্যাশ! ${short} ফেরাতে পারল না।` : `${short} ফসকাল।`;
    if (reason === 6) return `${short} জালে মারল। পয়েন্ট তোমার।`;
    return `বাইরে গেল। ছেড়ে দিয়ে পয়েন্ট তোমার।`;
  }
  if (reason === 1) return "আহা, একটু আগে মেরেছ।";
  if (reason === 2) return "আহা, জালে লাগল।";
  if (reason === 3) return "আহা, দাগের বাইরে।";
  return "আহা, শাটল মাটিতে।";
}

/** Under the stars of a win short of the most: the exact points still to save. */
export const nearLine = (gap: number, next: number) => gap > 0 ? `আর ${bn(gap)} পয়েন্ট কম দিলে ${bn(next)} তারা।` : "";

/** After a lost match: the score, then one exact, kind tip from how most points were lost. */
export function lossLine(points: number, us: number, lost: { misses: number; nets: number; outs: number; whiffs: number }, wind: boolean, fog: boolean) {
  if (us === points - 1) return `আর ১ পয়েন্ট হলেই জিততে।`;
  const top = Math.max(lost.misses, lost.nets, lost.outs, lost.whiffs);
  if (top === lost.outs && lost.outs > 0) return wind ? "পিঠে বাতাস থাকলে উঁচু মেরো না। স্ম্যাশ বা ড্রপ খেলো।" : "উঁচু মার একটু আগে হলে বাইরে যায়। রিং সোনালি হলেই চাপো।";
  if (top === lost.nets && lost.nets > 0) return "নিচু শাটলে স্ম্যাশ জালে যায়। নিচু এলে তুলে দাও।";
  if (top === lost.whiffs && lost.whiffs > 0) return "অনেক আগে চাপলে র‍্যাকেট ফাঁকা ঘোরে। রিং ছোট হওয়া পর্যন্ত থামো।";
  return fog ? "কুয়াশায় ছায়াটা দেখো। রিং এলে সঙ্গে সঙ্গে চাপো।" : "রিং ছোট হয়ে সোনালি হলেই চাপো।";
}
