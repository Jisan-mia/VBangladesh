// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, needZaps, specOf, starsOf, LEVEL_COUNT, MAX_BITES } from "./night";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A night the player got through, as they report it. Taps are real-time, so the count is their phone's word. */
export type Shared = { level: number; seed: number; zaps: number; bites: number; name: string };

const MAX_COUNT = specOf(LEVEL_COUNT).count;

/** `#s=<seed>&t=<mosquitoes zapped>&l=<night>&b=<bites>&n=<name>`. Only a night that was won: fewer than 3 bites, and no more zaps than mosquitoes. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_COUNT, extraKeys: ["l", "b"] });
  if (!read) return null;
  const l = read.extra.l ?? "", b = read.extra.b ?? "";
  if (!/^[1-9]\d?$/.test(l) || !new RegExp(`^[0-${MAX_BITES - 1}]$`).test(b)) return null;
  const level = Number(l), bites = Number(b);
  if (!isLevel(level) || read.target + bites > specOf(level).count) return null;
  return { level, seed: read.seed, zaps: read.target, bites, name: read.name };
}

export const sharedHash = ({ level, seed, zaps, bites, name }: Shared) => challengeHash({ seed, target: zaps, name, extra: { l: level, b: bites } });

export const levelLabel = (level: number) => `রাত ${bn(level)}`;
export const guardLabel = (level: number) => specOf(level).guard === "net" ? "মশারি পাহারা" : "বালিশ পাহারা";
const who = (name: string) => cleanName(name) || "বন্ধু";

/** What's new tonight, on the start screen. Each matches a change in specOf(). */
const NEWS = [
  "মশা আসবে জানালা দিয়ে। মশার ওপর চাপো।",
  "আজ দরজা দিয়েও ঢুকবে।",
  "আজ ঘুলঘুলি দিয়েও ঢুকবে।",
  "আজ মশা আসবে জোড়ায় জোড়ায়। এক চাপে দুটো মারো।",
  "আজ খাটে মশারি। মশা খুঁজবে ফুটোটা।",
  "মশা আজ আরেকটু জোরে উড়বে।",
  "আজ তিনটা করে ঝাঁক আসবে।",
  "মশারিতে আজ দুটো ফুটো।",
  "আজ ২০টা মশা, আগের চেয়ে জোরে।",
  "আজ চারটা করে ঝাঁক।",
  "বাইরে বৃষ্টি, মশা বেশি।",
  "আজ আরও জোরে উড়বে।",
  "মশারির দুই ফুটো, সঙ্গে ঝাঁক।",
  "আজ ২৭টা মশা। চোখ খোলা রাখো।",
  "মশারির রাত, মশাও অনেক।",
  "আজ পাঁচটা করে ঝাঁক।",
  "গুমোট গরমের রাত, মশা খুব চটপটে।",
  "শেষ মশারির রাত।",
  "আজ ৩৭টা মশা।",
  "শেষ রাত। ৪০টা মশা, ভোর পর্যন্ত।",
] as const;
export const newsLine = (level: number) => NEWS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** One small morning scene per night, true however many bites it took. */
const CLEAR_LINES = [
  "জানালায় ভোরের আলো। প্রথম রাত পার।",
  "রাস্তায় দুধওয়ালার সাইকেলের বেল। ভোর হলো।",
  "কয়েলটা পুড়ে শেষ, তোমার ব্যাট এখনো চলছে।",
  "পাশের বাসায় মোরগ ডাকছে। রাত পার।",
  "সারা রাত মশারির ফুটোয় পাহারা ছিল।",
  "চায়ের কেতলি চুলায় উঠল। রাতটা পার হলো।",
  "ঝাঁক এসেছিল, ব্যাটও তৈরি ছিল।",
  "কাল দর্জির কাছে মশারিটা সেলাই করাতে হবে।",
  "জানালার কার্নিশে চড়ুই এসে বসেছে। ভোর।",
  "দশ রাত পার। ব্যাটটা এবার চার্জে দাও।",
  "বৃষ্টি থেমেছে, ভোরও হলো।",
  "টিনের চালে শেষ ফোঁটাটা টুপ করে পড়ল। ভোর।",
  "মশারির দুই ফুটোই সামলালে।",
  "আম্মু উঠে বাতি জ্বালালেন। রাত শেষ।",
  "মশারির রাত শেষ। এবার ফুটো দুটোয় তালি দাও।",
  "পাঁচটার ঝাঁক এসেছিল, ভোরও এসেছে।",
  "গুমোট রাত শেষ। ভোরে একটু ঠান্ডা বাতাস।",
  "শেষ মশারির রাতও পার।",
  "আর এক রাত বাকি।",
  "২০ রাত পাহারা শেষ। ব্যাটটা এবার তাকে তুলে রাখো।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** Under the stars of a night short of three: exactly what the missing stars need. Empty at three. */
export function nearMissLine(level: number, zaps: number, bites: number) {
  const short = needZaps(level) - zaps, parts: string[] = [];
  if (short > 0) parts.push(`আর ${bn(short)}টা মশা মারলে আরেকটা তারা।`);
  if (bites > 0) parts.push(parts.length ? "একটাও কামড় না খেলে আরেকটা।" : "একটাও কামড় না খেলে আরেকটা তারা।");
  return parts.join(" ");
}

/** After a lost night: the bites, how close dawn was, and one thing to try. */
export function lossLine(level: number, secondsLeft: number) {
  const tip = specOf(level).guard === "net" ? "ফুটোর দিকে নামতে থাকা মশাগুলো আগে মারো।" : "বালিশের দিকে নামতে থাকা মশাটা আগে মারো।";
  const dawn = secondsLeft > 0 ? `ভোর হতে আর ${bn(secondsLeft)} সেকেন্ড বাকি ছিল। ` : "";
  return `${dawn}${tip}`;
}

/** The card's own line, seen by friends. */
export function humanLine({ level, zaps, bites }: Pick<Shared, "level" | "zaps" | "bites">) {
  if (level === LEVEL_COUNT) return "২০ রাত পাহারা শেষ। এবার টানা ঘুম।";
  if (bites === 0) return specOf(level).guard === "net" ? "মশারির ভেতরে একটা মশাও ঢুকতে পারেনি।" : "ভোর পর্যন্ত বালিশে একটাও কামড় পড়েনি।";
  if (starsOf(level, zaps, bites) === 2) return "দু-একটা পিন-পিন কানে এসেছিল, ব্যাট থামেনি।";
  return "উঁহু-আহা করতে করতে ভোর হলো।";
}

export const tallyLine = ({ level, zaps, bites }: Pick<Shared, "level" | "zaps" | "bites">) =>
  `${bn(specOf(level).count)}টা মশার ${bn(zaps)}টা ব্যাটে · কামড় ${bn(bites)}টা`;

/** "রাফি রাত ৭-এ ১৫টা মশা মেরেছে" */
export const feat = ({ level, zaps, name }: Pick<Shared, "level" | "zaps" | "name">) =>
  `${cleanName(name) || "এক বন্ধু"} রাত ${bn(level)}-এ ${bn(zaps)}টা মশা মেরেছে`;
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের হিসাব। একই রাত, একই মশা, এবার তোমার পালা।`;

/** After a friend's night: more zaps is better, then fewer bites. Kind either way. */
export function compareLine(mine: { zaps: number; bites: number }, theirs: { zaps: number; bites: number }, name: string) {
  const friend = who(name), diff = mine.zaps - theirs.zaps;
  if (diff > 0) return `${possessive(friend)} চেয়ে ${bn(diff)}টা বেশি!`;
  if (diff === 0 && mine.bites < theirs.bites) return `${friend}ও ${bn(theirs.zaps)}টা মেরেছিল, তবে তোমার কামড় কম।`;
  if (diff === 0) return `একদম সমান! ${friend}ও ${bn(theirs.zaps)}টা মেরেছিল।`;
  if (-diff <= 2) return `আর একটু হলেই! ${friend} মাত্র ${bn(-diff)}টা বেশি মেরেছিল।`;
  return `${friend} এখনো ${bn(-diff)}টা এগিয়ে। আরেকবার?`;
}

export function caption({ level, zaps, bites }: Pick<Shared, "level" | "zaps" | "bites">) {
  const bit = bites ? `বালিশে কামড় ${bn(bites)}টা।` : "বালিশে একটাও কামড় পড়েনি।";
  return `মশার রাত, রাত ${bn(level)}: ${bn(specOf(level).count)}টা মশার ${bn(zaps)}টা আমার ব্যাটে। ${bit} তুমি কয়টা মারবে?`;
}

/** The pop over a swing that hit. One word for one, the count for a swarm, the streak once it's going. */
export function hitWord(hits: number, combo: number) {
  if (hits > 1) return `এক চাপে ${bn(hits)}টা!`;
  if (combo >= 3) return `টানা ${bn(combo)}`;
  return "চট!";
}
