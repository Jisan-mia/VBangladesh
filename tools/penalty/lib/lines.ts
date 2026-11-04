// Every line of result text: the call after each kick, the end screen, the card, the link preview. Server-safe (share.ts).
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { cupRound, levelOf, LEVEL_COUNT } from "./levels";
import { starsOf, Outcome, type KickResult, type Zone } from "./rules";
import type { Shared } from "./challenge";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
export const score = (us: number, them: number) => `${bn(us)}–${bn(them)}`;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** "৫ · কিপারের ঝোঁক" */
export const levelLabel = (level: number) => `${bn(level)} · ${levelOf(level).name}`;
/** Stars a shared result earned, by the rules it was played under (an old link: five kicks each). */
export const sharedStars = (shared: Shared) => shared.legacy ? starsOf(shared.level, shared.us, shared.them, 5, "shootout") : starsOf(shared.level, shared.us, shared.them);
const drill = (shared: Pick<Shared, "level" | "legacy">) => shared.legacy ? "shootout" : levelOf(shared.level).format;

/** "রাফি টাইব্রেকারে হাটখোলা ক্লাবকে ৪–২ গোলে হারিয়েছে", or a drill's own words. */
export function feat(shared: Pick<Shared, "level" | "us" | "them" | "name" | "legacy">) {
  const name = cleanName(shared.name) || "এক বন্ধু", team = levelOf(shared.level).team.name, kind = drill(shared);
  if (kind === "shots") return `${name} ${possessive(team)} কিপারকে ৩ শটে ${bn(shared.us)} গোল দিয়েছে`;
  if (kind === "saves") return `${name} ${possessive(team)} ৩ শটের ${bn(shared.us)}টা ঠেকিয়েছে`;
  return `${name} টাইব্রেকারে ${team}কে ${score(shared.us, shared.them)} গোলে হারিয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের হিসাব। একই কিপার, একই শট, এবার তোমার পালা।`;

/** After a friend's match: a bigger margin (or more made) is better. Kind either way. */
export function compareLine(level: number, mine: { us: number; them: number }, theirs: Shared) {
  const friend = who(theirs.name), shootout = drill(theirs) === "shootout" && levelOf(level).format === "shootout";
  const m = shootout ? mine.us - mine.them : mine.us, t = shootout ? theirs.us - theirs.them : theirs.us;
  const unit = shootout ? "গোলে" : "টায়";
  if (m > t) return `${friend} জিতেছিল ${bn(t)} ${unit}, তুমি ${bn(m)} ${unit}!`;
  if (m === t) return `সমান সমান! ${friend}ও ${bn(t)} ${unit} জিতেছিল।`;
  return `${friend} জিতেছিল ${bn(t)} ${unit}। আর একটু হলেই!`;
}

export function caption(shared: Pick<Shared, "level" | "us" | "them" | "legacy">) {
  const team = levelOf(shared.level).team.name, kind = drill(shared), round = cupRound(shared.level);
  if (kind === "shots") return `পেনাল্টি কিক, ${round}: ${possessive(team)} কিপারকে ৩ শটে ${bn(shared.us)} গোল দিলাম। তুমি পারবে?`;
  if (kind === "saves") return `পেনাল্টি কিক, ${round}: ${possessive(team)} ৩ শটের ${bn(shared.us)}টা ঠেকালাম। তুমি পারবে?`;
  return `পেনাল্টি কিক, ${round}: টাইব্রেকারে ${team}কে ${score(shared.us, shared.them)} গোলে হারালাম। তুমি পারবে?`;
}

const CLEAR_LINES = [
  "জাল কাঁপল। দেয়ালে বসা ছেলেরা হাততালি দিচ্ছে।",
  "গ্লাভসে বল। পাড়ার কিপারও এখন তুমি।",
  "পাড়ার কাপ আমাদের। চায়ের দোকানে খবর পৌঁছে গেছে।",
  "পাঁচ শটের খেলাও জিতলে। থানার মাঠে নাম ছড়াচ্ছে।",
  "কিপারের ঝোঁক ধরে ফেলেছ। হাটখোলায় সবাই চুপ।",
  "থানা কাপ এখন আমাদের পাড়ায়। দূরে ট্রেনের হুইসেল।",
  "ধোঁকায় পড়োনি। ইটভাটার দল মাথা চুলকাচ্ছে।",
  "বাতাসও তোমার দলে। নদীর ঘাটে খবর গেছে।",
  "জেলা চ্যাম্পিয়ন আমরা। লম্বা কিপার মাটিতে বসে আছে।",
  "ঘড়ি ফুরোনোর আগেই শট। রেফারিও হাসলেন।",
  "সেমিফাইনাল পার। পাড়ার সবাই রেডিওর পাশে।",
  "জাতীয় চ্যাম্পিয়ন আমরা। রিকশায় মাইক বেঁধে পাড়ায় খবর ঘুরছে।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** Under the stars of a win short of three: the exact thing still missing. Empty at three. */
export function nearMissLine(level: number, us: number, them: number) {
  const data = levelOf(level), stars = starsOf(level, us, them);
  if (stars >= 3 || stars === 0) return "";
  if (data.format === "shots") return `আর ${bn(3 - us)}টা গোল হলে ৩ তারা।`;
  if (data.format === "saves") return `আর ${bn(3 - us)}টা ঠেকালে ৩ তারা।`;
  if (data.kicks === 3) return them > 0 && us - them >= 2 ? "একটাও গোল না খেয়ে জিতলে ৩ তারা।" : "দুই গোলে, গোল না খেয়ে জিতলে ৩ তারা।";
  return `আর ${bn(3 - (us - them))} গোলের ব্যবধানে জিতলে ৩ তারা।`;
}

/** After a lost match: the score, then one exact, kind fact. */
export function lossLine(level: number, us: number, them: number, sudden: boolean, frame: number) {
  const data = levelOf(level);
  if (data.format === "shots") return frame ? `৩ শটে গোল হলো না, ${bn(frame)}টা বাঁশে লেগে ফিরেছে।` : "৩ শটে গোল হলো না। কিপার যেদিকে নেই, সেদিকে মারো।";
  if (data.format === "saves") return "৩টাই গোলে। শুটার যেদিকে ঝোঁকে, সেদিকে ঝাঁপ দাও।";
  const head = `${score(us, them)} গোলে হার।`;
  if (frame) return `${head} ${bn(frame)}টা শট বাঁশে লেগে ফিরেছে।`;
  if (sudden) return `${head} সাডেন ডেথে একটা শটের ফারাক।`;
  if (them - us === 1) return `${head} আর ১টা গোল হলেই সাডেন ডেথ।`;
  return `${head} ${data.teach.split("।")[0]}।`;
}

/** The card's own line, seen by friends. */
export function humanLine(shared: Pick<Shared, "level" | "us" | "them" | "legacy">) {
  const kind = drill(shared), stars = starsOf(shared.level, shared.us, shared.them, shared.legacy ? 5 : undefined, shared.legacy ? "shootout" : undefined);
  if (shared.level === LEVEL_COUNT) return "পাড়ার দল এখন জাতীয় চ্যাম্পিয়ন।";
  if (kind === "shots") return stars === 3 ? "তিন শটে তিন গোল, কিপার হাঁ করে দেখল।" : "প্রথম শটের হাত খুলে গেছে।";
  if (kind === "saves") return stars === 3 ? "তিনটা শট, তিনটাই গ্লাভসে।" : "কিপারের গ্লাভস এখন আমার হাতে।";
  if (shared.us > 5) return "সাডেন ডেথে ফয়সালা।";
  if (stars === 3) return "কিপার এখনো মাটিতে বসে আছে।";
  if (stars === 2) return "দুই গোলের ব্যবধান, মাঠে হইচই।";
  return "শেষ শট পর্যন্ত সবার দম আটকে ছিল।";
}

/** One line after each kick, under the field (never over the goal). Our kicks first, then theirs. */
export function kickLine(side: 0 | 1, result: KickResult, dive: Zone | null, scuffed: boolean, early: boolean, watched: boolean) {
  const { outcome, close } = result;
  if (side === 0) {
    if (scuffed && outcome !== Outcome.Goal) return "সময় শেষ, তাড়াহুড়োর শট।";
    if (outcome === Outcome.Goal) return close ? "কিপারের আঙুল ছুঁয়ে গোল!" : "গোল!";
    if (outcome === Outcome.Saved) return "কিপার ঠিক দিকেই ঝাঁপ দিয়েছিল।";
    if (outcome === Outcome.Post) return "বাঁশের পোস্টে লেগে ফিরল।";
    if (outcome === Outcome.Bar) return "ওপরের বাঁশে লেগে বাইরে।";
    if (outcome === Outcome.Over) return close ? "বারের একটু ওপর দিয়ে গেল।" : "বারের ওপর দিয়ে দেয়ালে।";
    return close ? "পোস্টের পাশ ঘেঁষে বাইরে।" : "অনেক বাইরে দিয়ে গেল।";
  }
  if (outcome === Outcome.Saved) return "ঠেকিয়ে দিলে!";
  if (outcome === Outcome.Goal) {
    if (early && watched) return "আগে নড়েছিলে, ও দেখে উল্টো দিকে মারল।";
    if (close) return "দিক ঠিক ছিল, বল একদম কোণে। গোল।";
    return dive === null ? "দাঁড়িয়েই রইলে, বল পাশ দিয়ে গোলে।" : "উল্টো দিকে ঝাঁপ। গোল।";
  }
  if (outcome === Outcome.Post) return "পোস্টে লেগে ফিরল। বাঁচা গেল।";
  if (outcome === Outcome.Over) return "বারের ওপর দিয়ে মেরেছে।";
  return "বাইরে মেরেছে।";
}
