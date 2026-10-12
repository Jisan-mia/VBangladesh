// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the game rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { diffCount, isLevel, levelSeed, placeOf, shortBy, starsFor, templateOf, LEVEL_COUNT } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_SECONDS = 5999;
export const MAX_WRONG = 99;
/** A cleared level as the player reports it: time and wrong taps come from their own phone and can't be re-checked. */
export type Shared = { level: number; seconds: number; wrong: number; hinted: boolean; name: string };

/** `#s=<level's seed>&t=<seconds>&l=<level>&w=<wrong taps>&h=1 if a hint was taken&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SECONDS, extraKeys: ["l", "w", "h"] });
  if (!challenge || challenge.target < 1) return null;
  const { l = "", w = "", h } = challenge.extra;
  const level = /^[1-9]\d?$/.test(l) ? Number(l) : 0;
  if (!isLevel(level) || challenge.seed !== levelSeed(level) || (h !== undefined && h !== "1") || !/^(0|[1-9]\d?)$/.test(w)) return null;
  return { level, seconds: challenge.target, wrong: Number(w), hinted: h === "1", name: challenge.name };
}

export function sharedHash({ level, seconds, wrong, hinted, name }: Shared) {
  return challengeHash({
    seed: levelSeed(level), target: Math.min(MAX_SECONDS, Math.max(1, Math.round(seconds))), name,
    extra: { l: level, w: Math.min(MAX_WRONG, Math.max(0, Math.round(wrong))), ...(hinted ? { h: 1 } : {}) },
  });
}

/** "২ মিনিট ১০ সেকেন্ড", "৪৫ সেকেন্ড", "৩ মিনিট" */
export function timeText(seconds: number) {
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  if (!minutes) return `${bn(rest)} সেকেন্ড`;
  return rest ? `${bn(minutes)} মিনিট ${bn(rest)} সেকেন্ড` : `${bn(minutes)} মিনিট`;
}
/** The ticking clock: "১:০৫" */
export const clockText = (seconds: number) => `${bn(Math.floor(seconds / 60))}:${bn(seconds % 60).padStart(2, "০")}`;

export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${placeOf(level)}`;

/** One concrete picture per place, two of each so a replay doesn't repeat the line. */
const CLEAR_LINES: Record<string, readonly [string, string]> = {
  fruit: ["ঝুড়ির আম পর্যন্ত গুনে মিলিয়েছ। দোকানি এখনো টের পায়নি।", "কলার ছড়ি থেকে কাঁঠাল, পুরো দোকান দেখা হলো।"],
  tea: ["চা ঠান্ডা হওয়ার আগেই সব অমিল ধরা পড়ল।", "বয়ামের বিস্কুটও গুনে ফেলেছ।"],
  veg: ["টমেটো থেকে আলু, পুরো বাজার মিলিয়ে নিলে।", "দাম জিজ্ঞেস করার আগেই সব অমিল ধরা পড়ল।"],
  yard: ["দড়ির গামছা থেকে উঠানের মুরগি, কিছুই চোখ এড়ায়নি।", "রোদে জামা শুকাচ্ছে, অমিলগুলো তোমার খাতায়।"],
  field: ["কাকতাড়ুয়া পাহারায় ছিল, তবু সব অমিল তোমার চোখে পড়ল।", "ঘুড়ি থেকে গরু, পুরো মাঠ দেখা হলো।"],
  ghat: ["খেয়া ছাড়ার আগেই সব অমিল পেলে।", "হাঁস গুনে মিলিয়েছ, একটাও বাদ পড়েনি।"],
  lane: ["রিকশার বেল বাজার আগেই সব ধরলে।", "তারের কাক থেকে ছাদের ট্যাংক, সব দেখা হলো।"],
};
export function clearLine(level: number) {
  const line = CLEAR_LINES[templateOf(level).id][level % 2];
  return level === LEVEL_COUNT ? `${line} ৩০টা লেভেলের সব অমিল খুঁজে পেয়েছ।` : line;
}

/** The near-miss line, with exact numbers. Empty at three stars. */
export function nearMiss(level: number, seconds: number, wrong: number, hinted: boolean) {
  const gap = shortBy(level, seconds, wrong, hinted);
  if (!gap) return "";
  if (gap.hint) return "হিন্ট ছাড়া পারলে ৩ তারা।";
  const stars = `${bn(gap.stars)} তারা`;
  if (gap.seconds && gap.wrong) return `আর ${timeText(gap.seconds)} আগে, ${bn(gap.wrong)}টা কম ভুল চাপে পারলে ${stars}।`;
  if (gap.seconds) return `আর ${timeText(gap.seconds)} আগে পারলে ${stars}।`;
  return `ভুল চাপ আর ${bn(gap.wrong)}টা কম হলে ${stars}।`;
}

/** The line under the card's headline (which already says how many): first person, time first. */
export function cardLine({ seconds, wrong }: Pick<Shared, "seconds" | "wrong">) {
  return wrong ? `${timeText(seconds)}ে, ভুল চাপ ${bn(wrong)}টা।` : `${timeText(seconds)}ে, একবারও ভুল জায়গায় চাপিনি।`;
}

/** "রাফি লেভেল ১২-এর ৬টা অমিল ১ মিনিট ১০ সেকেন্ডে খুঁজে পেয়েছে" */
export function feat({ level, seconds, name }: Pick<Shared, "level" | "seconds" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এর ${bn(diffCount(level))}টা অমিল ${timeText(seconds)}ে খুঁজে পেয়েছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name, wrong }: Pick<Shared, "name" | "wrong">) {
  const who = cleanName(name) || "বন্ধু";
  return `${wrong ? `ভুল চাপ ${bn(wrong)}টা` : "একটাও ভুল চাপ নেই"}। সময়টা ${possessive(who)} নিজের ফোনের হিসাব। একই দুটো ছবি, এবার তোমার পালা।`;
}

/** After playing a friend's level: less time is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${timeText(theirs - mine)} আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${timeText(theirs)} নিয়েছিল।`;
  if (mine - theirs <= 10) return `আর একটু হলেই! মাত্র ${timeText(mine - theirs)} পিছিয়ে।`;
  return `${who} এখনো ${timeText(mine - theirs)} এগিয়ে। আরেকবার?`;
}

export function caption({ level, seconds, wrong, hinted }: Pick<Shared, "level" | "seconds" | "wrong" | "hinted">) {
  const head = `ভুল কোথায়?-এর লেভেল ${bn(level)}: দুই ছবির ${bn(diffCount(level))}টা অমিল ${timeText(seconds)}ে খুঁজে পেলাম`;
  return starsFor(level, seconds, wrong, hinted) === 3 ? `${head}, ${wrong ? `ভুল চাপ মাত্র ${bn(wrong)}টা` : "একবারও ভুল না চেপে"}। তুমি কত সময়ে পারো?` : `${head}। দেখি তুমি কত সময়ে পারো।`;
}
