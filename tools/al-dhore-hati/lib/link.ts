// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, levelSpec, sceneOf, LEVEL_COUNT, SCENE_NAME } from "./levels";
import { MAX_SLIPS, type SlipReason } from "./walk";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A cleared field as the player reports it. Steering is real-time, so the slips are their phone's word. */
export type Shared = { level: number; seed: number; slips: number; dry: number; name: string };

/** `#s=<seed>&t=<slips>&m=<longest dry stretch, metres>&l=<level>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SLIPS - 1, extraKeys: ["m", "l"] });
  // readChallenge reads a missing `t` as 0; a link without the slips is refused.
  if (!read || !/(^|[#&])t=\d/.test(hash)) return null;
  const l = read.extra.l ?? "", m = read.extra.m ?? "";
  if (!/^[1-9]\d?$/.test(l) || !/^[1-9]\d{0,2}$/.test(m)) return null;
  const level = Number(l), dry = Number(m);
  if (!isLevel(level) || dry > levelSpec(level).metres) return null;
  // A dry walk is the whole field.
  if (read.target === 0 && dry !== levelSpec(level).metres) return null;
  return { level, seed: read.seed, slips: read.target, dry, name: read.name };
}

export const sharedHash = ({ level, seed, slips, dry, name }: Shared) => challengeHash({ seed, target: slips, name, extra: { m: dry, l: level } });

export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${SCENE_NAME[sceneOf(level)]}`;
export const slipText = (slips: number) => slips === 0 ? "একবারও না পিছলে" : `${slips === 1 ? "একবার" : "দুবার"} পিছলে`;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** "রাফি লেভেল ৭-এর ৬০ মিটার আল একবারও না পিছলে পার হয়েছে" */
export function feat({ level, slips, name }: Pick<Shared, "level" | "slips" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এর ${bn(levelSpec(level).metres)} মিটার আল ${slipText(slips)} পার হয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের হিসাব। একই খেত, একই আল, এবার তোমার পালা।`;

/** After a friend's field: fewer slips is better, then the longer dry stretch. Kind either way. */
export function compareLine(mine: Pick<Shared, "slips" | "dry">, theirs: Pick<Shared, "slips" | "dry">, name: string) {
  const friend = who(name), times = (n: number) => n === 0 ? "একবারও না" : `${bn(n)} বার`;
  if (mine.slips < theirs.slips) return `${friend} পিছলেছিল ${times(theirs.slips)}, তুমি ${times(mine.slips)}!`;
  if (mine.slips > theirs.slips) return `${friend} পিছলেছিল ${times(theirs.slips)}। আর একটু হলেই!`;
  if (mine.dry > theirs.dry) return `পিছলানো সমান, তবে তোমার টানা শুকনো হাঁটা ${possessive(friend)} চেয়ে লম্বা!`;
  return mine.slips === 0 ? `সমান সমান! ${friend}ও একবারও পিছলায়নি।` : `সমান সমান! ${friend}ও ${bn(theirs.slips)} বার পিছলেছিল।`;
}

export function caption({ level, slips }: Pick<Shared, "level" | "slips">) {
  return `আল ধরে হাঁটিতে লেভেল ${bn(level)}-এর ${bn(levelSpec(level).metres)} মিটার আল ${slipText(slips)} পার হলাম। তুমি পারবে?`;
}

const CLEAR_LINES = [
  "প্রথম খেত পার। সামনে উঠান, খড়ের গাদা।",
  "শিশিরে ভেজা ঘাস, তবু পা আলেই ছিল।",
  "ধানের চারা হাঁটু সমান। তুমি ওপারে।",
  "জমা পানির পাশ দিয়ে ঠিক বেরিয়ে এলে।",
  "সকালের খেত শেষ। মাঠে এখন রোদ।",
  "পুকুরপাড়ে হাঁসগুলো মুখ তুলে দেখল।",
  "ছাগলটা একবার তাকাল, তারপর আবার ঘাসে মুখ।",
  "দুপুরের রোদে আল শুকিয়ে শক্ত।",
  "ঘাটে কেউ কলসি ভরছে, তুমি আল ধরে ওপারে।",
  "পুকুরপাড়ের শেষ আল পার। বিকাল নামছে।",
  "বাতাসে ধান দুলছে, তোমার পা দোলেনি।",
  "গামছা উড়ে যেতে চাইছিল, তুমি ধরে রাখলে।",
  "মাথার ওপর দিয়ে বকের সারি উড়ে গেল।",
  "দূরে কারও ঘুড়ি কাটল। তুমি আলেই।",
  "বিকালের খেত শেষ। আকাশ কমলা হচ্ছে।",
  "পাকা ধানের গন্ধ। কাস্তে হাতে কেউ ফিরছে।",
  "ধানের শিষ নুয়ে আছে আলের ওপর, তুমি পাশ কাটালে।",
  "জোনাকি জ্বলতে শুরু করেছে। আর একটু পথ।",
  "ছাগলগুলো ঘরে ফিরছে, তুমি ওদের আগে।",
  "শেষ আলও পার। উঠানে হারিকেন জ্বলছে, ভাত বাড়া।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];

/** Under the stars of a clear short of three: exactly what was missing. */
export function nearMissLine(slips: number) {
  if (slips === 1) return "একবারও না পিছলালে ৩ তারা।";
  if (slips === 2) return "আর একবার কম পিছলালে ২ তারা।";
  return "";
}

/** After the third slip: how far was left, then one kind tip from how the last slip went. */
export function fellLine(left: number, reason: SlipReason | null) {
  const rest = left <= 3 ? `আর মাত্র ${bn(Math.max(1, left))} মিটার বাকি ছিল।` : `আর ${bn(left)} মিটার বাকি ছিল।`;
  if (reason === "puddle") return `${rest} পানি যেদিকে, তার উল্টো পাশ দিয়ে হাঁটো।`;
  if (reason === "goat") return `${rest} ছাগল যেদিকে দাঁড়িয়ে, অন্য পাশ দিয়ে যাও।`;
  return `${rest} আল বাঁকার আগেই সেদিকে টানো।`;
}

/** One short call when the feet slip. */
export function slipLine(reason: SlipReason) {
  if (reason === "puddle") return "ছপাৎ! পানিতে পা।";
  if (reason === "goat") return "ব্যা! ছাগলের গায়ে লেগে পা কাদায়।";
  return "ছপাৎ! পা কাদায়।";
}

export const streakLine = (metres: number) => `টানা ${bn(metres)} মিটার, পা শুকনো।`;
export const NEAR_LINE = "উফ, অল্পের জন্য।";
export const BLEAT_LINE = "ব্যা-অ্যা! সামনে ছাগল।";

/** The card's own line, seen by friends. */
export function humanLine({ level, slips }: Pick<Shared, "level" | "slips">) {
  if (level === LEVEL_COUNT) return slips === 0 ? "শেষ খেতও পার, পা শুকনো। উঠানে হারিকেন জ্বলছে।" : "শেষ খেতও পার। উঠানে হারিকেন জ্বলছে।";
  if (slips === 0) return "পা দুটো এখনো শুকনো।";
  if (slips === 1) return "একবার কাদায় পা, তারপর আর না।";
  return "দুবার ছপাৎ, তবু খেত পার।";
}
