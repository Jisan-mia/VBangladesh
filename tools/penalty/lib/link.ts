// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { finalScores, MAX_ROUNDS, starsOf, type KickResult, type Zone } from "./match";
import { isLevel, opponentOf, roundName, LEVEL_COUNT } from "./teams";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A won match as the player reports it. Kicks and dives are real-time, so the score is their phone's word. */
export type Shared = { level: number; seed: number; us: number; them: number; name: string };

let finals: Set<string> | null = null;
/** True for a score a shootout can really end on with us ahead (no 9–0, no 3–2 after five kicks each). */
export const realWin = (us: number, them: number) => us > them && (finals ??= finalScores()).has(`${us}-${them}`);

/** `#s=<seed>&t=<our goals>&a=<their goals>&l=<match>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_ROUNDS, extraKeys: ["a", "l"] });
  if (!read) return null;
  const l = read.extra.l ?? "", a = read.extra.a ?? "";
  if (!/^[1-9]$/.test(l) || !/^(0|[1-9]\d?)$/.test(a)) return null;
  const level = Number(l), them = Number(a);
  if (!isLevel(level) || !realWin(read.target, them)) return null;
  return { level, seed: read.seed, us: read.target, them, name: read.name };
}

export const sharedHash = ({ level, seed, us, them, name }: Shared) => challengeHash({ seed, target: us, name, extra: { a: them, l: level } });

export const score = (us: number, them: number) => `${bn(us)}–${bn(them)}`;
export const levelLabel = (level: number) => `ম্যাচ ${bn(level)} · ${roundName(level)}`;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** "রাফি টাইব্রেকারে হাটখোলা ক্লাবকে ৪–২ গোলে হারিয়েছে" */
export function feat({ level, us, them, name }: Pick<Shared, "level" | "us" | "them" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} টাইব্রেকারে ${opponentOf(level).name}কে ${score(us, them)} গোলে হারিয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের হিসাব। একই কিপার, একই শট, এবার তোমার পালা।`;

/** After a friend's match: a bigger margin is better. Kind either way. */
export function compareLine(mine: { us: number; them: number }, theirs: { us: number; them: number }, name: string) {
  const m = mine.us - mine.them, t = theirs.us - theirs.them, friend = who(name);
  if (m > t) return `${friend} জিতেছিল ${bn(t)} গোলে, তুমি ${bn(m)} গোলে!`;
  if (m === t) return `সমান সমান! ${friend}ও ${bn(t)} গোলে জিতেছিল।`;
  return `${friend} জিতেছিল ${bn(t)} গোলে। আর একটু হলেই!`;
}

export function caption({ level, us, them }: Pick<Shared, "level" | "us" | "them">) {
  return `পেনাল্টি কিকের ${roundName(level)}: টাইব্রেকারে ${opponentOf(level).name}কে ${score(us, them)} গোলে হারালাম। তুমি পারবে?`;
}

const CLEAR_LINES = [
  "পাড়ার প্রথম ম্যাচ জেতা হলো। চায়ের দোকানে খবর পৌঁছে গেছে।",
  "পাড়ার পর্ব শেষ। এবার থানার মাঠে।",
  "রেলগেটের দল ফিরছে, দূরে ট্রেনের হুইসেল।",
  "থানার কাপ এখন আমাদের পাড়ায়। এবার জেলা।",
  "জেলা স্কুলের মাঠে ভিড় জমেছে, মাইকে আমাদের নাম।",
  "জেলা চ্যাম্পিয়ন আমরা। এবার জাতীয় পর্ব।",
  "সেমিফাইনাল পার। পাড়ার সবাই রেডিওর পাশে।",
  "জাতীয় চ্যাম্পিয়ন আমরা। রিকশায় মাইক বেঁধে পাড়ায় খবর ঘুরছে।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** Under the stars of a win short of three: the exact margin still missing. */
export function nearMissLine(us: number, them: number) {
  const missing = 3 - (us - them);
  return missing > 0 ? `আর ${bn(missing)} গোলের ব্যবধানে জিতলে ৩ তারা।` : "";
}

/** After a lost match: the score, then one exact, kind fact. */
export function lossLine(us: number, them: number, sudden: boolean, frame: number) {
  const head = `${score(us, them)} গোলে হার।`;
  if (frame) return `${head} ${bn(frame)}টা শট বাঁশে লেগে ফিরেছে।`;
  if (sudden) return `${head} সাডেন ডেথে একটা শটের ফারাক।`;
  if (them - us === 1) return `${head} আর ১টা গোল হলেই সাডেন ডেথ।`;
  return `${head} কিপার যেদিকে ঝাঁপায়, তার উল্টো কোণে মেরে দেখো।`;
}

/** The card's own line, seen by friends. */
export function humanLine({ level, us, them }: Pick<Shared, "level" | "us" | "them">) {
  if (level === LEVEL_COUNT) return "পাড়ার দল এখন জাতীয় চ্যাম্পিয়ন।";
  // Only a sudden death can pass five goals; a 5–4 might be either, so it keeps the plain line.
  if (us > 5) return "সাডেন ডেথে ফয়সালা।";
  const stars = starsOf(us, them);
  if (stars === 3) return "কিপার এখনো মাটিতে বসে আছে।";
  if (stars === 2) return "দুই গোলের ব্যবধান, মাঠে হইচই।";
  return "শেষ শট পর্যন্ত সবার দম আটকে ছিল।";
}

/** One line after each kick, shown over the goal. Our kicks first, then theirs. */
export function kickLine(side: 0 | 1, result: KickResult, dive: Zone | null) {
  const { outcome, close } = result;
  if (side === 0) {
    if (outcome === "goal") return close ? "কিপারের আঙুল ছুঁয়ে গোল!" : "গোল!";
    if (outcome === "saved") return "কিপার ঠিক দিকেই ঝাঁপ দিয়েছিল।";
    if (outcome === "post") return "বাঁশের পোস্টে লেগে ফিরল।";
    if (outcome === "bar") return "ওপরের বাঁশে লেগে বাইরে।";
    if (outcome === "over") return close ? "বারের একটু ওপর দিয়ে গেল।" : "বারের ওপর দিয়ে স্কুলের দেয়ালে।";
    return close ? "পোস্টের পাশ ঘেঁষে বাইরে।" : "অনেক বাইরে দিয়ে গেল।";
  }
  if (outcome === "saved") return "ঠেকিয়ে দিলে!";
  if (outcome === "goal") {
    if (close) return "দিক ঠিক ছিল, বল একদম কোণে। গোল।";
    return dive === null ? "দাঁড়িয়েই রইলে, বল পাশ দিয়ে গোলে।" : "উল্টো দিকে ঝাঁপ। গোল।";
  }
  if (outcome === "post") return "পোস্টে লেগে ফিরল। বাঁচা গেল।";
  if (outcome === "over") return "বারের ওপর দিয়ে মেরেছে।";
  return "বাইরে মেরেছে।";
}
