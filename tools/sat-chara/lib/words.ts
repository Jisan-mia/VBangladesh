// Every line of text the game says: the HUD, the line under the lane, the end screen, the friend banner and the card.
// Server-safe (share.ts reaches it through challenge.ts).
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { defOf, LEVEL_COUNT, WORLDS } from "./levels";
import { oldWorldOf } from "./old-levels";
import { HAND_NAME, type Hand } from "./save";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** "এক বলে", "২ বলে" */
export const ballsText = (balls: number) => balls === 1 ? "এক বলে" : `${bn(balls)} বলে`;

/** A round as the player sees it: "লেভেল ৩ · পিরামিড", or a friend's old pile. */
export const roundLabel = (kind: "level" | "old", level: number) =>
  kind === "old" ? `বন্ধুর পুরোনো সাজানো · ${WORLDS[oldWorldOf(level)].name}` : `লেভেল ${bn(level)} · ${defOf(level).name}`;

/** One small scene per level, said when it's cleared. A finale and the very last level get their own. */
const CLEAR_LINES = [
  "সাতটা চাড়াই গলির ধুলায়।",
  "গোড়ায় লাগল, তাই সবটা গেল।",
  "পিরামিডের নিচের সারি আর নেই।",
  "দুটো ঢিবিই মাটিতে। রিকশার বেল বাজিয়ে কেউ পাশ কাটাল।",
  "বল্টু ভাই চায়ের কাপ নামিয়ে তাকালেন।",
  "বারান্দার সিঁড়ি এখন ফাঁকা।",
  "কাদায় এক ফোঁটাও লাগেনি। সাদা জামা বেঁচে গেল।",
  "ইটের ওপর দিয়ে বলটা ঠিক জায়গায় পড়ল।",
  "কলসির কানাও আর দাঁড়িয়ে নেই।",
  "ঘণ্টা পড়ার আগেই সাফ। দপ্তরি চাচা হাসলেন।",
  "গামছাটা শুকনোই থাকল।",
  "টুনি সাজানোর আগেই সব শেষ।",
  "জলচৌকির দুই পাশে চাড়া ছড়ানো।",
  "মিঠু লাফ দিল, বল তার মাথার ওপর দিয়ে গেল।",
  "উঠানে খটাখট। রান্নাঘর থেকে নানু ডাকলেন, সেমাই হয়ে গেছে।",
];
export const clearLine = (kind: "level" | "old", level: number) =>
  kind === "old" ? "বন্ধুর সাজানো চাড়া সাতটাই মাটিতে।" : CLEAR_LINES[Math.min(LEVEL_COUNT, level) - 1];

/** After a ball that didn't finish the round. A miss names the far dog, so the joke never lives in the sound alone. */
export function throwLine(knocked: number, left: number, ballsLeft: number, caught: boolean) {
  const last = ballsLeft === 1 ? " শেষ বল।" : "";
  if (caught) return `মিঠু বলটা ধরে ফেলেছে।${last}`;
  if (!knocked) return `ফসকে গেছে। দূরে একটা কুকুর ডেকে উঠল।${last}`;
  if (left === 1) return `${bn(knocked)}টা পড়ল। আর মাত্র ১টা।${last}`;
  return `${bn(knocked)}টা পড়ল। আর ${bn(left)}টা বাকি।${last}`;
}

/** টুনি at work, under the lane. */
export const stackingLine = (back: number) => back === 1 ? "টুনি একটা চাড়া আবার সাজাল। তাড়াতাড়ি ছোড়ো।" : `টুনি ${bn(back)}টা চাড়া আবার সাজিয়েছে।`;

/** When the three balls are gone: exact and kind. */
export const missLine = (left: number) =>
  left === 7 ? "একটাও পড়েনি। এবার নিচু করে, গোড়া বরাবর ছুড়ে দেখো।" : left === 1 ? "আর মাত্র ১টা চাড়া বাকি ছিল।" : `আর ${bn(left)}টা চাড়া বাকি ছিল।`;

/** The near-miss line on a clear below three stars, from how many fell on the first ball. Empty at three stars. */
export function nearMissLine(balls: number, first: number) {
  if (balls === 1) return "";
  if (first >= 1 && first < 7) return `প্রথম বলে ${bn(first)}টা পড়েছিল। আর ${bn(7 - first)}টা পড়লে ৩ তারা হতো।`;
  return balls === 2 ? "এক বলে সাতটা ফেললে ৩ তারা।" : "দুই বলে সাতটা ফেললে ২ তারা, এক বলে ৩ তারা।";
}

/** A finale's line against the rival's record. */
export function recordLine(balls: number, cleared: boolean, level: number) {
  const finale = defOf(level).finale;
  if (!finale) return "";
  if (!cleared) return `${finale.whose} রেকর্ড ${ballsText(finale.record)}। আরেকবার?`;
  if (balls < finale.record) return `${finale.whose} রেকর্ড ভাঙল। ওদের লেগেছিল ${bn(finale.record)} বল, তোমার একটাই।`;
  if (balls === finale.record) return `${finale.whose} রেকর্ডের সমান। ভাঙতে হলে এক বলে।`;
  return `${finale.who} ${ballsText(finale.record)} পেরেছিল। এক বলে পারলে রেকর্ড তোমার।`;
}

/** The line on the card, seen by friends: first person, one image. */
export function humanLine(balls: number) {
  if (balls === 1) return "প্রথম বলেই খটাখট।";
  if (balls === 2) return "দ্বিতীয় বলে বাকিগুলোও গেল।";
  return "শেষ বলে শেষ চাড়া।";
}

export type Claim = { kind: "level" | "old"; level: number; balls: number; hand: Hand; name: string };

/** "রাফি লেভেল ১২-এর সাত চাড়া ২ বলে ফেলেছে" */
export function feat({ kind, level, balls, name }: Claim) {
  const who = cleanName(name) || "এক বন্ধু";
  return kind === "old" ? `${who} সাত চাড়া ${ballsText(balls)} ফেলেছে` : `${who} লেভেল ${bn(level)}-এর সাত চাড়া ${ballsText(balls)} ফেলেছে`;
}
export const previewTitle = (claim: Claim) => `${feat(claim)}। তুমি পারবে?`;

export function bannerNote({ name, hand, kind }: Pick<Claim, "name" | "hand" | "kind">) {
  const mode = kind === "level" && hand !== "n" ? ` ${HAND_NAME[hand]} মোডে।` : "";
  return `এটা ${possessive(cleanName(name) || "বন্ধু")} নিজের ফোনের হিসাব।${mode} একই সাজানো চাড়া, এবার তোমার পালা।`;
}

/** After a friend's pile: fewer balls is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${bn(theirs - mine)} বল কম লাগল।`;
  if (mine === theirs) return `সমান সমান। ${who}ও ${ballsText(theirs)} ফেলেছিল।`;
  return `${who} ${ballsText(theirs)} পেরেছিল। আর একটু হলেই।`;
}

export function caption({ kind, level, balls }: Pick<Claim, "kind" | "level" | "balls">) {
  const where = kind === "old" ? "সাত চাড়ায়" : `সাত চাড়ার লেভেল ${bn(level)}-এ`;
  return `${where} সাতটা চাড়া ফেললাম ${ballsText(balls)}। তুমি কয় বলে পারবে?`;
}
