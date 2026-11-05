// Every line of result text. Server-safe (share.ts reaches it): only Bangla helpers and the level data.
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { countOf, isFinale, isNet, levelOf, needZaps, FAST, GHOST, LEVEL_COUNT, MODES, WORLDS } from "./levels";
import type { Shared } from "./challenge";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const levelLabel = (level: number) => `রাত ${bn(level)}`;
export const levelTitle = (level: number) => `রাত ${bn(level)} · ${levelOf(level).name}`;
export const worldName = (level: number) => WORLDS[levelOf(level).world].name;
export const bossName = (level: number) => WORLDS[levelOf(level).world].boss;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** One small morning scene per night, true however many bites it took. */
const CLEAR_LINES = [
  "জানালায় ভোরের আলো। প্রথম রাত পার।",
  "রাস্তায় দুধওয়ালার সাইকেলের বেল। ভোর হলো।",
  "ঘুলঘুলিতে চড়ুই ডাকছে। রাত শেষ।",
  "বিদ্যুৎ এল, ফ্যান ঘুরছে। ভোর হলো।",
  "পালোয়ান কাত। পাশের বাসায় মোরগ ডাকছে।",
  "টিনের চালে বৃষ্টি থেমেছে। ভোর।",
  "সারা রাত মশারির ফুটোয় পাহারা ছিল।",
  "কাল দর্জির কাছে মশারিটা সেলাই করাতে হবে।",
  "কাদা রাস্তায় রিকশার টুংটাং। ভোর হলো।",
  "বিজলিও থেমেছে, বৃষ্টিও। রাত পার।",
  "জানালায় চাঁদ ডুবল, আকাশ ফরসা হচ্ছে।",
  "গুমোট কেটে ভোরে একটু ঠান্ডা বাতাস।",
  "মশারির দুই ফুটোই সামলালে।",
  "লম্বা রাত শেষ। আম্মু উঠে চুলায় কেতলি দিলেন।",
  "ভূতুড়ে মশা আর নেই। জানালায় ভোরের আলো।",
  "কুয়াশার ভেতর দিয়ে রোদ আসছে।",
  "কুয়াশা সরছে। মশারির ভেতরে ভাইটা এখনো ঘুমে।",
  "চার রকম মশাই এসেছিল, ব্যাট থামেনি।",
  "শীতের প্রথম ভোর। কাঁথাটা টেনে দাও।",
  "রাজা কাত, ২০ রাত পাহারা শেষ। ব্যাটটা এবার চার্জে দাও।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** The end screen's heading. */
export function heading({ level, won, firstClear, hearts }: { level: number; won: boolean; firstClear: boolean; hearts: number }) {
  if (!won) return hearts === 1 ? "এক কামড়েই ঘুম ভেঙে গেল" : `${bn(hearts)}টা কামড়, ঘুম ভেঙে গেল`;
  if (isFinale(level)) return firstClear ? `${bossName(level)} কাত!` : `${bossName(level)} কাত, ভোরও হলো`;
  return `${levelLabel(level)} পার`;
}

/** Under the stars of a night short of three: exactly what the missing stars need. Empty at three. */
export function nearMissLine(level: number, zaps: number, bites: number) {
  const short = needZaps(level) - zaps, parts: string[] = [];
  if (short > 0) parts.push(`আর ${bn(short)}টা মশা মারলে আরেকটা তারা।`);
  if (bites > 0) parts.push(parts.length ? "একটাও কামড় না খেলে আরেকটা।" : "একটাও কামড় না খেলে আরেকটা তারা।");
  return parts.join(" ");
}

/** After a lost night: how close dawn was, and one thing to try. */
export function lossLine(level: number, secondsLeft: number, slaps: number, bossLeft: boolean) {
  const row = levelOf(level);
  const tip = slaps > 0 ? "ঘুমন্ত মুখে চড়ও কামড়ের মতো। মুখের ওপর মশা থাকলে তবেই চাপো।"
    : isNet(level) ? "ফুটোর দিকে নামতে থাকা মশাগুলো আগে মারো।"
    : row.swarms > 0 ? "ঝাঁকের মাঝখানে চাপো, এক চাপে কয়েকটা পড়ে।"
    : row.ghost > 0 || row.bossKind === GHOST ? "ঝাপসা মশা নামার সময় পুরো দেখা যায়। তখন চাপো।"
    : row.fast > 0 || row.bossKind === FAST ? "চটপটে মশা থামলেই চাপো। লাল ঝিলিক দিলে নামবে।"
    : "বালিশের দিকে নামতে থাকা মশাটা আগে মারো।";
  const dawn = bossLeft ? `ভোর হয়-হয়, শুধু ${bossName(level)} বাকি ছিল। ` : secondsLeft > 0 ? `ভোর হতে আর ${bn(secondsLeft)} সেকেন্ড বাকি ছিল। ` : "";
  return `${dawn}${tip}`;
}

/** The card's own line, seen by friends. */
export function humanLine({ level, zaps, bites }: Pick<Shared, "level" | "zaps" | "bites">) {
  if (level === LEVEL_COUNT) return "২০ রাত পাহারা শেষ। এবার টানা ঘুম।";
  if (bites === 0) return isNet(level) ? "মশারির ভেতরে একটা মশাও ঢুকতে পারেনি।" : "ভোর পর্যন্ত বালিশে একটাও কামড় পড়েনি।";
  if (isFinale(level)) return `${bossName(level)} কাত, ভোরও হলো।`;
  if (zaps >= needZaps(level)) return "দু-একটা পিন-পিন কানে এসেছিল, ব্যাট থামেনি।";
  return "উঁহু-আহা করতে করতে ভোর হলো।";
}

export const tallyLine = ({ level, zaps, bites }: Pick<Shared, "level" | "zaps" | "bites">) =>
  `${bn(countOf(level))}টা মশার ${bn(zaps)}টা ব্যাটে · কামড় ${bn(bites)}টা`;

/** "রাফি রাত ৭-এ ১৫টা মশা মেরেছে" */
export const feat = ({ level, zaps, name }: Pick<Shared, "level" | "zaps" | "name">) => `${cleanName(name) || "এক বন্ধু"} রাত ${bn(level)}-এ ${bn(zaps)}টা মশা মেরেছে`;
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote(shared: Pick<Shared, "name" | "old" | "mode">) {
  if (shared.old) return `এটা আগের সংস্করণে ${possessive(who(shared.name))} নিজের ফোনের হিসাব। একই রাত নম্বর, এবার নতুন মশা।`;
  return `এটা ${possessive(who(shared.name))} নিজের ফোনের হিসাব, ${MODES[shared.mode].name} খেলায়। একই রাত, একই মশা, এবার তোমার পালা।`;
}

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
  return `মশার রাত, ${levelTitle(level)}: ${bn(countOf(level))}টা মশার ${bn(zaps)}টা আমার ব্যাটে। ${bit} তুমি কয়টা মারবে?`;
}

/** The pop over a swing that hit. One word for one, the count for a ঝাঁক, the streak once it's going. */
export function hitWord(hits: number, combo: number) {
  if (hits > 1) return `এক চাপে ${bn(hits)}টা!`;
  if (combo >= 3) return `টানা ${bn(combo)}`;
  return "চট!";
}
