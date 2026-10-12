// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, nightOf, opponentOf, LEVEL_COUNT, NIGHT_NAME } from "./levels";
import { starsOf, POINTS, type LandReason, type ShotKind } from "./rally";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_RALLY = 300;

/** A won game as the player reports it. Timing is real-time, so the score is their phone's word. */
export type Shared = { level: number; seed: number; them: number; rally: number; name: string };

/** `#s=<seed>&t=<points the opponent got>&r=<longest rally>&l=<level>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: POINTS - 1, extraKeys: ["r", "l"] });
  // readChallenge reads a missing `t` as 0; a link without the score is refused.
  if (!read || !/(^|[#&])t=\d/.test(hash)) return null;
  const l = read.extra.l ?? "", r = read.extra.r ?? "";
  if (!/^[1-9]\d?$/.test(l) || !/^[1-9]\d{0,2}$/.test(r)) return null;
  const level = Number(l), rally = Number(r);
  if (!isLevel(level) || rally > MAX_RALLY) return null;
  return { level, seed: read.seed, them: read.target, rally, name: read.name };
}

export const sharedHash = ({ level, seed, them, rally, name }: Shared) => challengeHash({ seed, target: them, name, extra: { r: rally, l: level } });

export const score = (them: number) => `${bn(POINTS)}–${bn(them)}`;
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${NIGHT_NAME[nightOf(level)]}`;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** "রাফি তিনতলার আপুকে ৫–২ পয়েন্টে হারিয়েছে" */
export function feat({ level, them, name }: Pick<Shared, "level" | "them" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} ${opponentOf(level).object} ${score(them)} পয়েন্টে হারিয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের স্কোর। একই রাত, একই খেলোয়াড়, এবার তোমার পালা।`;

/** After a friend's game: fewer points given away is better, then the longer rally. Kind either way. */
export function compareLine(mine: { them: number; rally: number }, theirs: { them: number; rally: number }, name: string) {
  const friend = who(name);
  if (mine.them < theirs.them) return `${friend} ${bn(theirs.them)} পয়েন্ট দিয়েছিল, তুমি ${bn(mine.them)}!`;
  if (mine.them > theirs.them) return `${friend} ${bn(theirs.them)} পয়েন্ট দিয়েছিল। আর একটু হলেই!`;
  if (mine.rally > theirs.rally) return `পয়েন্ট সমান, তবে তোমার র‍্যালি ${possessive(friend)} চেয়ে লম্বা!`;
  return `সমান সমান! ${friend}ও ${bn(theirs.them)} পয়েন্ট দিয়েছিল।`;
}

export function caption({ level, them, rally }: Pick<Shared, "level" | "them" | "rally">) {
  return `গলির ব্যাডমিন্টনে ${opponentOf(level).object} ${score(them)} পয়েন্টে হারালাম। এক র‍্যালিতে ${bn(rally)} বার মেরেছি। তুমি পারবে?`;
}

const CLEAR_LINES = [
  "ভাইয়া হাসতে হাসতে শাটল কুড়িয়ে আনছে।",
  "বাতাসের রাতেও ভাইয়া হার মানল।",
  "কুয়াশায় শাটল দেখা যায়নি, ছায়া দেখেই মেরেছ।",
  "আপু সিঁড়ি বেয়ে তিনতলায় ফিরে যাচ্ছে।",
  "দড়ির কাপড় উড়ছে, তোমার শাটল ঠিক জায়গায় পড়ছে।",
  "কুয়াশায় আপুর চশমা ঘোলা, পয়েন্ট তোমার।",
  "মামা দোকানে ফিরে চুলায় চা চাপিয়েছে।",
  "উল্টো বাতাসেও পয়েন্ট তোমার।",
  "কুয়াশায় বাল্বটা ঝাপসা, তোমার মার তবু পরিষ্কার।",
  "বড় ভাই খাতা খুলে আবার পড়তে বসেছে।",
  "বাতাসের রাতে বড় ভাইয়ের মার জালে আটকাল।",
  "বড় ভাই মাফলার খুলে হাঁপাচ্ছে।",
  "চ্যাম্পিয়ন হাত মিলিয়ে বলল, কাল আবার।",
  "জানালায় জানালায় হাততালি। বাতাসেও চ্যাম্পিয়ন পারল না।",
  "পাড়ার নতুন চ্যাম্পিয়ন তুমি। বাল্বের নিচে সবাই দাঁড়িয়ে।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** Under the stars of a win short of three: the exact points still to save. */
export function nearMissLine(them: number) {
  return them > 1 ? `আর ${bn(them - 1)} পয়েন্ট কম দিলে ৩ তারা।` : "";
}

/** After a lost game: the score, then one exact, kind tip from how the last point went. */
export function lossLine(us: number, reason: LandReason | null) {
  if (us === POINTS - 1) return `৪–৫। আর ১ পয়েন্ট হলেই জিততে।`;
  if (reason === "early") return "একটু আগে মেরেছ। রিং সোনালি হলে চাপো।";
  if (reason === "late") return "একটু দেরি হয়েছে। রিং সোনালি হওয়ামাত্র চাপো।";
  if (reason === "net") return "দেরিতে মারলে শাটল নিচু হয়ে জালে যায়।";
  return "শাটলের ছায়া দেখো। রিং ছোট হয়ে সোনালি হলেই চাপো।";
}

/** The card's own line, seen by friends. */
export function humanLine({ level, them, rally }: Pick<Shared, "level" | "them" | "rally">) {
  if (level === LEVEL_COUNT) return "পাড়ার নতুন চ্যাম্পিয়ন।";
  if (rally >= 15) return `এক র‍্যালিতে ${bn(rally)} বার। জানালায় লোক জমে গিয়েছিল।`;
  const stars = starsOf(POINTS, them);
  if (stars === 3) return "শাটল প্রায় মাটিই ছোঁয়নি।";
  if (stars === 2) return "বাল্বের নিচে জমজমাট খেলা।";
  return "শেষ পয়েন্ট পর্যন্ত কেউ ঘরে যায়নি।";
}

/** One short call after your hit, shown over the court. */
export function hitLine(kind: ShotKind) {
  if (kind === "smash") return "জোরালো মার!";
  if (kind === "lob") return "উঁচু হয়ে গেল, সহজ বল।";
  if (kind === "drive") return "নিচু মার।";
  if (kind === "net") return "জালে লাগল।";
  return "";
}

/** One short call when a point ends. */
export function pointLine(winner: 0 | 1, reason: LandReason, level: number) {
  const short = opponentOf(level).short;
  if (winner === 0) return reason === "botNet" ? `${short} জালে মারল। পয়েন্ট তোমার।` : `${short} ধরতে পারল না। পয়েন্ট তোমার।`;
  if (reason === "early") return "আহা! একটু আগে মেরেছ।";
  if (reason === "late") return "আহা! একটু দেরি হলো।";
  if (reason === "net") return "আহা! জালে লাগল।";
  return "আহা! শাটল মাটিতে।";
}
