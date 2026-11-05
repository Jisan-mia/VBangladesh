// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core, bangla and levels.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { SLIP_BRIDGE, SLIP_GOAT, SLIP_PUDDLE } from "./field";
import { defOfLevel, isLevel, isMode, legacySpec, LEVEL_COUNT, MODE_INFO, SCENE_NAME, sceneOf, type Kind, type Mode, type Run } from "./levels";

export const SLUG = "al-dhore-hati";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** What a link carries: the seed (the same ridge), what was played, slips, the longest dry stretch in metres, and a name. Steering is real-time, so it is the friend's word. */
export type Card = { seed: number; level: number; slips: number; dry: number; name: string; kind: Kind; mode: Mode };

const metresOf = (card: Pick<Card, "kind" | "level">) => card.kind === "old" ? legacySpec(card.level).metres : defOfLevel(card.level).metres;

/**
 * `#s=<seed>&t=<slips>&m=<longest dry stretch, metres>&l=<level>&n=<name>`, plus `v=2` and `d=e|h` for the new fields.
 * - no `v`: a link from before the rewrite. `l` is the old field; it replays the old ridge, three slips, the old stars.
 * - `v=2`: `l` is a level 1–20 and `d` the mode (none is সাধারণ); `t` is below the mode's slips.
 */
export function parseCard(hash: string): Card | null {
  const read = readChallenge(hash, { maxTarget: MODE_INFO.e.lives - 1, extraKeys: ["m", "l", "v", "d"] });
  // readChallenge reads a missing `t` as 0; a link without the slips is refused.
  if (!read || !/(^|[#&])t=\d/.test(hash)) return null;
  const { l = "", m = "", v, d } = read.extra;
  if (!/^[1-9]\d?$/.test(l) || !/^[1-9]\d{0,2}$/.test(m)) return null;
  const level = Number(l), dry = Number(m);
  if (!isLevel(level)) return null;
  let kind: Kind = "old", mode: Mode = "n";
  if (v !== undefined) {
    if (v !== "2") return null;
    kind = "level";
    if (d !== undefined) { if (!isMode(d) || d === "n") return null; mode = d; }
  } else if (d !== undefined) return null;
  if (read.target > MODE_INFO[mode].lives - 1) return null;
  const card: Card = { seed: read.seed, level, slips: read.target, dry, name: read.name, kind, mode };
  if (dry > metresOf(card)) return null;
  // A dry walk is the whole field.
  if (card.slips === 0 && dry !== metresOf(card)) return null;
  return card;
}

/** Old links write exactly the old format; new ones add `v=2` and `d` off সাধারণ. */
export function cardHash({ seed, level, slips, dry, name, kind, mode }: Card) {
  const extra = kind === "old" ? { m: dry, l: level } : { m: dry, l: level, v: 2, ...(mode === "n" ? {} : { d: mode }) };
  return challengeHash({ seed, target: slips, name, extra });
}

/** Is this run the very field a friend's link carries? Then a retry keeps the friend's seed, so the comparison still means something. */
export const rivalFits = (friend: Pick<Card, "seed" | "kind" | "level" | "mode"> | null, run: Run) =>
  friend !== null && friend.seed === run.seed && friend.kind === run.kind && friend.level === run.level && friend.mode === run.mode;

/** The seed for another go at `run`: the friend's field again while it is the friend's, a fresh one otherwise. Both end cards use this. */
export const retrySeed = (friend: Pick<Card, "seed" | "kind" | "level" | "mode"> | null, run: Run, fresh: number) => rivalFits(friend, run) ? run.seed : fresh;

/** "লেভেল ৪ · জমা পানি", or an old link's "লেভেল ৪ · সকালের সবুজ খেত". */
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${defOfLevel(level).name}`;
export const playLabel = (card: Pick<Card, "kind" | "level">) => card.kind === "old" ? `লেভেল ${bn(card.level)} · ${SCENE_NAME[sceneOf(card.level)]}` : levelLabel(card.level);
export const slipText = (slips: number) => slips === 0 ? "একবারও না পিছলে" : `${slips === 1 ? "একবার" : slips === 2 ? "দুবার" : `${bn(slips)} বার`} পিছলে`;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** "রাফি লেভেল ৭-এর ৬০ মিটার আল একবারও না পিছলে পার হয়েছে" */
export function feat(card: Pick<Card, "kind" | "level" | "slips" | "name">) {
  return `${cleanName(card.name) || "এক বন্ধু"} লেভেল ${bn(card.level)}-এর ${bn(metresOf(card))} মিটার আল ${slipText(card.slips)} পার হয়েছে`;
}
export const previewTitle = (card: Card) => `${feat(card)}। তুমি পারবে?`;
export const friendClaim = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের হিসাব। একই খেত, একই আল, এবার তোমার পালা।`;

/** After a friend's field: fewer slips is better, then the longer dry stretch. Kind either way. */
export function compareLine(mine: Pick<Card, "slips" | "dry">, theirs: Pick<Card, "slips" | "dry">, name: string) {
  const friend = who(name), times = (n: number) => n === 0 ? "একবারও না" : `${bn(n)} বার`;
  if (mine.slips < theirs.slips) return `${friend} পিছলেছিল ${times(theirs.slips)}, তুমি ${times(mine.slips)}!`;
  if (mine.slips > theirs.slips) return `${friend} পিছলেছিল ${times(theirs.slips)}। আর একটু হলেই!`;
  if (mine.dry > theirs.dry) return `পিছলানো সমান, তবে তোমার টানা শুকনো হাঁটা ${possessive(friend)} চেয়ে লম্বা!`;
  return mine.slips === 0 ? `সমান সমান! ${friend}ও একবারও পিছলায়নি।` : `সমান সমান! ${friend}ও ${bn(theirs.slips)} বার পিছলেছিল।`;
}

export function caption(card: Pick<Card, "kind" | "level" | "slips">) {
  return `আল ধরে হাঁটিতে লেভেল ${bn(card.level)}-এর ${bn(metresOf(card))} মিটার আল ${slipText(card.slips)} পার হলাম। তুমি পারবে?`;
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
  "সাঁকোর বাঁশ একটু নড়ল, তুমি নড়োনি।",
  "পুকুরপাড়ের শেষ আল পার। বিকাল নামছে।",
  "বাতাসে ধান দুলছে, তোমার পা দোলেনি।",
  "গামছা উড়ে যেতে চাইছিল, তুমি ধরে রাখলে।",
  "ঝিরিঝিরি বৃষ্টিতে ভিজলে, তবু পা আলেই।",
  "দূরে কারও ঘুড়ি কাটল। তুমি আলেই।",
  "বিকালের ঝড় থামল। আকাশ কমলা হচ্ছে।",
  "পাকা ধানের গন্ধ। কাস্তে হাতে কেউ ফিরছে।",
  "ধানের শিষ নুয়ে আছে আলের ওপর, তুমি পাশ কাটালে।",
  "জোনাকি জ্বলছে। আর একটু পথ।",
  "ছাগলগুলো ঘরে ফিরছে, তুমি ওদের আগে।",
  "শেষ আলও পার। উঠানে হারিকেন জ্বলছে, ভাত বাড়া।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];

/** Under the stars of a clear short of three: exactly what was missing. */
export function nearMissLine(slips: number, mode: Mode = "n") {
  if (mode === "e") return slips === 0 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।" : slips >= 1 ? "একবারও না পিছলালে ২ তারা।" : "";
  if (slips === 1) return "একবারও না পিছলালে ৩ তারা।";
  if (slips === 2) return "আর একবার কম পিছলালে ২ তারা।";
  return "";
}

/** After the last slip: how far was left, then one kind tip from how the last slip went. */
export function fellLine(left: number, reason: number) {
  const rest = left <= 3 ? `আর মাত্র ${bn(Math.max(1, left))} মিটার বাকি ছিল।` : `আর ${bn(left)} মিটার বাকি ছিল।`;
  if (reason === SLIP_PUDDLE) return `${rest} পানি যেদিকে, তার উল্টো পাশ দিয়ে হাঁটো।`;
  if (reason === SLIP_GOAT) return `${rest} ছাগল যেদিকে দাঁড়িয়ে, অন্য পাশ দিয়ে যাও।`;
  if (reason === SLIP_BRIDGE) return `${rest} সাঁকোতে একদম মাঝখান ধরে হাঁটো।`;
  return `${rest} কিনারে টললেই মাঝে ফেরো, আর বাঁকের আগেই সরো।`;
}

/** What a screen reader hears when the feet slip. */
export function slipLine(reason: number) {
  if (reason === SLIP_PUDDLE) return "ছপাৎ! পানিতে পা।";
  if (reason === SLIP_GOAT) return "ব্যা! ছাগলের গায়ে লেগে পা কাদায়।";
  if (reason === SLIP_BRIDGE) return "সাঁকো থেকে পা কাদায়।";
  return "ছপাৎ! পা কাদায়।";
}
export const streakLine = (metres: number) => `টানা ${bn(metres)} মিটার, পা শুকনো।`;

/** The card's own line, seen by friends. */
export function humanLine({ level, slips }: Pick<Card, "level" | "slips">) {
  if (level === LEVEL_COUNT) return slips === 0 ? "শেষ খেতও পার, পা শুকনো। উঠানে হারিকেন জ্বলছে।" : "শেষ খেতও পার। উঠানে হারিকেন জ্বলছে।";
  if (slips === 0) return "পা দুটো এখনো শুকনো।";
  if (slips === 1) return "একবার কাদায় পা, তারপর আর না।";
  return "কয়েকবার ছপাৎ, তবু খেত পার।";
}
