// Every line of words the game says: calls under the stage, the end screen, the friend's banner, the card and the caption.
// Server-safe (share.ts reads the preview title through here).
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import type { Shared } from "./challenge";
import { F_DROP, F_SLOW, F_WOBBLE } from "./top";
import { K_BROOM, K_CRACK, K_HEN, K_LEAF, K_PEBBLE, K_PUDDLE, K_RIDGE, levelDef, nextMark, starsOf, WORLDS, type Mode } from "./levels";

const whole = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const tenth = new Intl.NumberFormat("bn-BD", { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const bn = (value: number) => whole.format(value);
/** Tenths of a second as "১২.৪". */
export const secs = (tenths: number) => tenth.format(Math.floor(tenths) / 10);
export const percent = (value: number) => `${bn(Math.round(value * 100))}%`;
const who = (name: string) => cleanName(name) || "বন্ধু";

const LOCATIVE = ["মাটির উঠানে", "পাকা মেঝেতে", "টিনের চালে"] as const;
export const levelLabel = (level: number) => `${WORLDS[levelDef(level).world].name} · লেভেল ${bn(level)}`;
export const stageLabel = (level: number) => `${WORLDS[levelDef(level).world].name} · ${levelDef(level).name}`;

// ---- the friend's link ----
export const feat = (shared: Pick<Shared, "score" | "name">) => `${possessive(cleanName(shared.name) || "এক বন্ধু")} লাটিম ${secs(shared.score)} সেকেন্ড ঘুরেছে`;
export const friendBanner = (shared: Pick<Shared, "score" | "name" | "level">) =>
  `${possessive(cleanName(shared.name) || "তোমার বন্ধু")} লাটিম ${secs(shared.score)} সেকেন্ড ঘুরেছে। একই ${WORLDS[levelDef(shared.level).world].ground}, এবার তোমার পালা।`;
export const friendNote = (shared: Pick<Shared, "name" | "level">) => `${possessive(who(shared.name))} নিজের ফোনের স্কোর · ${stageLabel(shared.level)}`;
export const previewTitle = (shared: Pick<Shared, "score" | "name">) => `${possessive(cleanName(shared.name) || "এক বন্ধু")} লাটিম ${secs(shared.score)} সেকেন্ড ঘুরেছে। তুমি পারবে?`;
export const caption = (shared: Pick<Shared, "score" | "level">) => `আমার লাটিম ${secs(shared.score)} সেকেন্ড ঘুরল, ${LOCATIVE[levelDef(shared.level).world]}। তোমারটা কতক্ষণ ঘুরবে?`;

/** After playing a friend's floor: more seconds is better. Kind either way. */
export function versusLine(mine: number, theirs: number, name: string) {
  const gap = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(who(name))} চেয়ে ${secs(gap)} সেকেন্ড বেশি!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${secs(mine)} সেকেন্ড।`;
  if (gap <= 20) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${secs(gap)} সেকেন্ড কম।`;
  return `${who(name)} এগিয়ে, ${secs(gap)} সেকেন্ড। আরেকবার ছোড়ো!`;
}

// ---- score bands, on the card ----
export type Band = "short" | "warm" | "good" | "great" | "master";
export function bandOf(tenths: number): Band {
  if (tenths < 60) return "short";
  if (tenths < 120) return "warm";
  if (tenths < 180) return "good";
  if (tenths < 250) return "great";
  return "master";
}
const BAND_LINES: Record<Band, string> = {
  short: "ঘুরল, তবে তাড়াতাড়ি শুয়ে পড়ল। এবার আরেকটু জোরে টানো।",
  warm: "ভালোই ঘুরল। টলতে দেখলেই টোকা দিও।",
  good: "এতক্ষণ ঘুরলে পাশের বাসার ছেলেটাও দাঁড়িয়ে দেখে।",
  great: "ঘোরা দেখতে উঠানে ছোটখাটো ভিড় জমে গেছে।",
  master: "আধা মিনিটের কাছাকাছি। এমন হাত পাড়ায় একজনেরই থাকে।",
};
export const humanLine = (tenths: number) => BAND_LINES[bandOf(tenths)];

// ---- the end of a spin ----
const CLEAR_LINES = [
  "উঠানের কাকটাও থমকে দাঁড়িয়ে দেখছে।",
  "পাতারা উড়ে গেল, লাটিম রইল।",
  "নুড়ি গড়িয়ে এল, লাটিম নড়ল না।",
  "মুরগির দল হাঁপিয়ে বসে পড়ল।",
  "মেঝে পিছলা, তবু লাটিম সোজা।",
  "ভেজা দাগ পেরিয়েও ঘুরছে।",
  "ফাটলে পড়েও পড়ল না।",
  "ঠাকুমা ঝাড়ু নামিয়ে হাসছেন।",
  "টিনের ঢেউয়ের তালে তালে ঘুরল।",
  "হাওয়া ঠেলে ঠেলে হার মানল।",
  "ঢালু চালেও লাটিম দাঁড়িয়ে।",
  "ঝড় থামল, লাটিম তখনো ঘুরছে।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(CLEAR_LINES.length, Math.max(1, level)) - 1];

/** Why it stopped, said plainly. */
export const fallLine = (fall: number, palm: boolean) =>
  palm ? "ঘুরন্ত লাটিম হাতের তালুতে উঠে এল!" : fall === F_DROP ? "হাতে তুলতে গিয়ে ফসকে গেল। টলমল কম থাকলে তুলো।"
    : fall === F_WOBBLE ? "টলতে টলতে কাত হয়ে পড়ল।" : fall === F_SLOW ? "ঘুরতে ঘুরতে থেমে গেল।" : "";

/** The near miss with the exact gap. `label` is what comes next ("২ তারা", "লেভেল পার"). */
export const nearLine = (gap: number, label: string) => `আর ${secs(gap)} সেকেন্ড হলেই ${label}।`;
export function nextLine(tenths: number, level: number, mode: Mode) {
  const mark = nextMark(tenths, level, mode);
  if (!mark) return "";
  const earned = starsOf(tenths, level, mode);
  return nearLine(mark - tenths, earned ? `${bn(earned + 1)} তারা` : "লেভেল পার");
}

export type Tally = { nudges: number; good: number; miss: number; faced: number; braced: number; fall: number; power: number; straight: number };
/** One exact tip, from what cost the most. */
export function lossTip(t: Tally) {
  if (t.fall === F_DROP) return "হাতে তুলতে গিয়ে ফসকে গেল। টলমল কম থাকলে তবেই তুলো।";
  if (t.power < 0.6 || t.straight < 0.6) return t.power < t.straight ? "ছোড়াটা আলতো ছিল। আরেকটু জোরে, এক টানে।" : "ছোড়াটা বাঁকা ছিল। সোজা নিচে টানো।";
  if (t.nudges === 0) return "একটাও টোকা দাওনি। টলে গেলে বিন্দু কিনারায় এলে টোকা দিও।";
  if (t.miss > t.good) return "বেশির ভাগ টোকা মাঝখানে পড়েছে, তাতে লাটিম আরও টলে। বিন্দু কিনারার সবুজে এলে দিও।";
  if (t.faced > 0 && t.braced * 2 < t.faced) return "ধাক্কা আসার একটু আগে টোকা দিয়ে রাখলে কম টলে।";
  return "টলতে শুরু করলেই টোকা দাও, দেরি কোরো না।";
}

/** The throw's verdict, shown once it leaves the hand. */
export const verdict = (power: number, straight: number) =>
  power >= 0.75 && straight >= 0.75 ? "জোরালো আর সোজা!" : power >= 0.75 ? "জোরালো, তবে একটু বাঁকা।" : straight >= 0.75 ? "সোজা, তবে আলতো।" : "আলতো আর বাঁকা।";

// ---- calls under the stage ----
// Fixed strings, so a frame never builds one.
export const CALL = {
  watch: "বিন্দু সবুজ মাথায় এলে টোকা দাও।",
  good: "ঠিক সময়ে!",
  ok: "চলবে।",
  miss: "মাঝখানে দিলে টলে। কিনারার সবুজে দাও।",
  liftOpen: "ঘোরা কমেছে। চাইলে হাতে তোলো, +৫ সেকেন্ড।",
  liftSafe: "এখন তুললে নিরাপদ।",
  liftRisky: "বেশি টলছে, এখন তুললে পড়বে।",
  short: "বোতামটা একটু চেপে ধরে রাখো, বার ভরলে ছাড়ো।",
  up: "ওপরে না, নিচের দিকে টানো।",
  pull: "আঙুল রেখে একটু লম্বা করে নিচে টানো।",
} as const;

const STREAK = ["", "", "টানা ২!", "টানা ৩!", "টানা ৪!", "টানা ৫!"] as const;
export const streakCall = (combo: number) => combo >= 6 ? `টানা ${bn(combo)}!` : STREAK[combo] || CALL.good;

/** What a knock did, as the call under the stage says it. */
export function bumpCall(kind: number, braced: boolean) {
  const name = kind === K_LEAF ? "পাতা" : kind === K_PEBBLE ? "নুড়ি" : kind === K_HEN ? "মুরগি" : kind === K_PUDDLE ? "ভেজা দাগ" : kind === K_CRACK ? "ফাটল" : kind === K_RIDGE ? "ঢেউ" : kind === K_BROOM ? "ঝাড়ু" : "ধাক্কা";
  return braced ? `${name} এল, সামলে নিলে!` : kind === K_PUDDLE ? "ভেজা দাগে ঘোরা কমল।" : `${name} লাগল, টলে গেল।`;
}
