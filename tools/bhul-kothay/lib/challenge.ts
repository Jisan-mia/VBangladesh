// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, MAX_SEED, readChallenge } from "../../../shared/game-core";
import { isLegacyLevel, legacyDiffCount, legacyPar, legacyPlace, legacySeed, legacyStars, legacyTemplate } from "./legacy";
import { HINT_SECONDS, PLACES, STAGE_COUNT, isStage, stageAt, type Kind, type TemplateId } from "./levels";
import { shortBy, starsOf } from "./round";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_SECONDS = 5999;
export const MAX_WRONG = 99;
export const MAX_HINTS = 20;
/**
 * A cleared level as the player reports it: time (hint seconds included) and wrong taps come from their own phone and
 * can't be re-checked. `legacy` marks an old link's level, replayed by the frozen old generator.
 */
export type Shared = { level: number; seed: number; seconds: number; wrong: number; hints: number; name: string; legacy: boolean };

/**
 * Old (before the rewrite): `#s=<the level's fixed seed>&t=<seconds>&l=<1–30>&w=<wrong taps>&h=1 if a hint was taken&n=<name>`.
 * New: the same keys plus `v=2`, any seed, and `h=<hint steps>`. Anything else is refused.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SECONDS, extraKeys: ["l", "w", "h", "v"] });
  if (!challenge || challenge.target < 1) return null;
  const { l = "", w = "", h, v } = challenge.extra;
  const level = /^[1-9]\d?$/.test(l) ? Number(l) : 0;
  if (!/^(0|[1-9]\d?)$/.test(w)) return null;
  const wrong = Number(w), seconds = challenge.target, name = challenge.name;
  if (v === undefined) {
    if (!isLegacyLevel(level) || challenge.seed !== legacySeed(level) || (h !== undefined && h !== "1")) return null;
    return { level, seed: challenge.seed, seconds, wrong, hints: h === "1" ? 1 : 0, name, legacy: true };
  }
  if (v !== "2" || !isStage(level) || !/^(0|[1-9]\d?)$/.test(h ?? "0")) return null;
  const hints = Number(h ?? "0");
  if (hints > MAX_HINTS || seconds < hints * HINT_SECONDS + 1 || challenge.seed > MAX_SEED) return null;
  return { level, seed: challenge.seed, seconds, wrong, hints, name, legacy: false };
}

export function sharedHash({ level, seed, seconds, wrong, hints, name, legacy }: Shared) {
  const target = Math.min(MAX_SECONDS, Math.max(1, Math.round(seconds))), w = Math.min(MAX_WRONG, Math.max(0, Math.round(wrong)));
  if (legacy) return challengeHash({ seed: legacySeed(level), target, name, extra: { l: level, w, ...(hints ? { h: 1 } : {}) } });
  return challengeHash({ seed, target: Math.max(target, hints * HINT_SECONDS + 1), name, extra: { l: level, w, h: Math.min(MAX_HINTS, hints), v: 2 } });
}

/** How many differences the shared level had. */
export const countOf = (shared: Pick<Shared, "level" | "legacy">) => shared.legacy ? legacyDiffCount(shared.level) : stageAt(shared.level).count;
/** The stars a shared result earned, by its own level's rules. */
export function sharedStars({ level, seconds, wrong, hints, legacy }: Pick<Shared, "level" | "seconds" | "wrong" | "hints" | "legacy">) {
  return legacy ? legacyStars(level, seconds, wrong, hints > 0) : starsOf(stageAt(level), seconds, wrong);
}

/** "২ মিনিট ১০ সেকেন্ড", "৪৫ সেকেন্ড", "৩ মিনিট" */
export function timeText(seconds: number) {
  const whole = Math.round(seconds), minutes = Math.floor(whole / 60), rest = whole % 60;
  if (!minutes) return `${bn(rest)} সেকেন্ড`;
  return rest ? `${bn(minutes)} মিনিট ${bn(rest)} সেকেন্ড` : `${bn(minutes)} মিনিট`;
}
/** "২ মিনিট ১০ সেকেন্ডে" */
export const timeIn = (seconds: number) => `${timeText(seconds)}ে`;
/** The ticking clock: "১:০৫" */
export const clockText = (seconds: number) => { const whole = Math.floor(seconds); return `${bn(Math.floor(whole / 60))}:${bn(whole % 60).padStart(2, "০")}`; };

export const placeOf = (level: number, legacy = false) => legacy ? legacyPlace(level) : PLACES[stageAt(level).template];
/** "লেভেল ৩ · সবজির বাজার", or for a finale "হাটবার" */
export const levelLabel = (level: number, legacy = false) => legacy ? `পুরোনো লেভেল ${bn(level)} · ${legacyPlace(level)}` : `লেভেল ${bn(level)} · ${stageAt(level).finale || PLACES[stageAt(level).template]}`;

/** The kind of a difference in one or two words, for the found list and the hint. */
export const KIND_WORDS: Readonly<Record<Kind, string>> = {
  missing: "নেই", color: "রং বদল", count: "কম", flip: "উল্টো", size: "ছোট", shift: "সরে গেছে", turn: "বাঁকা", text: "লেখা", shade: "হালকা রং", still: "স্থির",
};
/** What the first hint says about the circled area. */
export const HINT_LINES: Readonly<Record<Kind, string>> = {
  missing: "এই গোলের ভেতরে একটা জিনিস এক ছবিতে নেই।",
  color: "এই গোলের ভেতরে একটা জিনিসের রং আলাদা।",
  count: "এই গোলের ভেতরে গুনে দেখো: এক ছবিতে কম।",
  flip: "এই গোলের ভেতরে একটা জিনিস উল্টো দিকে ফিরে আছে।",
  size: "এই গোলের ভেতরে একটা জিনিস ছোট হয়ে গেছে।",
  shift: "এই গোলের ভেতরে একটা জিনিস একটু সরে গেছে।",
  turn: "এই গোলের ভেতরে একটা জিনিস হেলে আছে।",
  text: "এই গোলের ভেতরের লেখাটা দুই ছবিতে মিলিয়ে পড়ো।",
  shade: "এই গোলের ভেতরে একটা রং একটু হালকা বা গাঢ়।",
  still: "এই গোলের ভেতরে একটা জিনিস এক ছবিতে দোলে, অন্যটায় থেমে আছে।",
};
export const hintLine = (kind: Kind, step: 1 | 2, name: string) =>
  step === 1 ? `${HINT_LINES[kind]} ঘড়িতে +${bn(HINT_SECONDS)} সেকেন্ড।` : `এই যে, ${name}। ঘড়িতে আরও +${bn(HINT_SECONDS)} সেকেন্ড।`;

/** One concrete picture per place, two of each so a replay doesn't repeat the line. */
const CLEAR_LINES: Readonly<Record<TemplateId, readonly [string, string]>> = {
  fruit: ["ঝুড়ির আম পর্যন্ত গুনে মিলিয়েছ। দোকানি এখনো টের পায়নি।", "কলার ছড়ি থেকে কাঁঠাল, পুরো দোকান দেখা হলো।"],
  tea: ["চা ঠান্ডা হওয়ার আগেই সব অমিল ধরা পড়ল।", "বয়ামের বিস্কুটও গুনে ফেলেছ।"],
  veg: ["টমেটো থেকে আলু, পুরো বাজার মিলিয়ে নিলে।", "দাম জিজ্ঞেস করার আগেই সব অমিল ধরা পড়ল।"],
  yard: ["দড়ির গামছা থেকে উঠানের মুরগি, কিছুই চোখ এড়ায়নি।", "রোদে জামা শুকাচ্ছে, অমিলগুলো তোমার খাতায়।"],
  field: ["কাকতাড়ুয়া পাহারায় ছিল, তবু সব অমিল তোমার চোখে পড়ল।", "ঘুড়ি থেকে গরু, পুরো মাঠ দেখা হলো।"],
  ghat: ["খেয়া ছাড়ার আগেই সব অমিল পেলে।", "হাঁস গুনে মিলিয়েছ, একটাও বাদ পড়েনি।"],
  lane: ["রিকশার বেল বাজার আগেই সব ধরলে।", "তারের কাক থেকে ছাদের ট্যাংক, সব দেখা হলো।"],
};
export function clearLine(level: number, legacy = false, seed = 0) {
  const template = legacy ? legacyTemplate(level).id as TemplateId : stageAt(level).template;
  const line = CLEAR_LINES[template][(level + seed) % 2];
  if (!legacy && stageAt(level).dark) return `কারেন্ট এসেছে। ${line}`;
  return !legacy && level === STAGE_COUNT ? `${line} ৩০টা লেভেলের সব অমিল খুঁজে পেয়েছ।` : line;
}

/** The near-miss line, with exact numbers. Empty at three stars. */
export function nearMiss(level: number, seconds: number, wrong: number, legacy = false) {
  const stage = legacy ? { three: legacyPar(level), two: legacyPar(level) * 2 } : stageAt(level);
  const gap = shortBy(stage, seconds, wrong);
  if (!gap) return "";
  const stars = `${bn(gap.stars)} তারা`;
  if (gap.seconds && gap.wrong) return `আর ${timeText(gap.seconds)} আগে, ${bn(gap.wrong)}টা কম ভুল চাপে পারলে ${stars}।`;
  if (gap.seconds) return `আর ${timeText(gap.seconds)} আগে পারলে ${stars}।`;
  return `ভুল চাপ আর ${bn(gap.wrong)}টা কম হলে ${stars}।`;
}

/** The line under the card's headline (which already says how many): first person, time first. */
export function cardLine({ seconds, wrong }: Pick<Shared, "seconds" | "wrong">) {
  return wrong ? `${timeIn(seconds)}, ভুল চাপ ${bn(wrong)}টা।` : `${timeIn(seconds)}, একবারও ভুল জায়গায় চাপিনি।`;
}

/** "রাফি লেভেল ১২-এর ৬টা অমিল ১ মিনিট ১০ সেকেন্ডে খুঁজে পেয়েছে" */
export function feat(shared: Pick<Shared, "level" | "seconds" | "name" | "legacy">) {
  return `${cleanName(shared.name) || "এক বন্ধু"} লেভেল ${bn(shared.level)}-এর ${bn(countOf(shared))}টা অমিল ${timeIn(shared.seconds)} খুঁজে পেয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name, wrong }: Pick<Shared, "name" | "wrong">) {
  const who = cleanName(name) || "বন্ধু";
  return `${wrong ? `ভুল চাপ ${bn(wrong)}টা` : "একটাও ভুল চাপ নেই"}। সময়টা ${possessive(who)} নিজের ফোনের হিসাব। একই দুটো ছবি, এবার তোমার পালা।`;
}

/** After playing a friend's pictures: less time is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু", gap = Math.round(Math.abs(mine - theirs));
  if (gap === 0) return `একদম সমান। ${who}ও ${timeText(theirs)} নিয়েছিল।`;
  if (mine < theirs) return `${possessive(who)} চেয়ে ${timeText(gap)} আগে।`;
  if (gap <= 10) return `মাত্র ${timeText(gap)} পিছিয়ে। আরেকবার?`;
  return `${who} এখনো ${timeText(gap)} এগিয়ে।`;
}

export function caption(shared: Pick<Shared, "level" | "seconds" | "wrong" | "hints" | "legacy">) {
  const head = `ভুল কোথায়?-এর লেভেল ${bn(shared.level)}: দুই ছবির ${bn(countOf(shared))}টা অমিল ${timeIn(shared.seconds)} খুঁজে পেলাম`;
  return sharedStars(shared) === 3 ? `${head}, ${shared.wrong ? `ভুল চাপ মাত্র ${bn(shared.wrong)}টা` : "একবারও ভুল না চেপে"}। তুমি কত সময়ে পারো?` : `${head}। দেখি তুমি কত সময়ে পারো।`;
}
