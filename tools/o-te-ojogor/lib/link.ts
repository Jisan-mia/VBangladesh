// Old links and every line of text. Server-safe: share.ts loads this, so it reaches only game-core and the level data.
// A kids' page: no link made here carries anything about the child. Old links still open their level and seed; a name on
// one is ignored, and cleanHash() drops it from the address bar.
import { readChallenge } from "../../../shared/game-core";
import { finaleName, isLevel, levelOf, LEVEL_COUNT, type World } from "./levels";
import type { Mode } from "./tree";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** What an old link opens: one level and the seed that grows the same tree. */
export type Shared = { level: number; seed: number };

export const MAX_ERRORS = 99;

/** `#s=<seed>&t=<mistakes>&l=<level>(&n=<name>)`, the format the old share bar made. Only the level and seed are used. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_ERRORS, extraKeys: ["l"] });
  if (!read) return null;
  const l = read.extra.l ?? "";
  if (!/^[1-9]\d?$/.test(l) || !isLevel(Number(l))) return null;
  return { level: Number(l), seed: read.seed };
}

/** The same hash without the name (and anything else a child might have put there): `s`, `t` and `l` only. */
export function cleanHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, "")), keep = new URLSearchParams();
  for (const key of ["s", "t", "l"]) { const value = params.get(key); if (value !== null) keep.set(key, value); }
  return keep.toString();
}

export const levelLabel = (level: number) => `লেভেল ${bn(level)}`;
/** "অ থেকে ঔ", "আম, বই", "২০ থেকে ১": the part of the title after the colon. */
export const shortTitle = (level: number) => levelOf(level).title.split(": ")[1].replace(", একটানা", "");
/** The badge: the finale's name on a world's last level, else the short title. */
export const badgeTitle = (level: number) => finaleName(level) || shortTitle(level);
const NOUN: Record<World, string> = { vowel: "বর্ণ", consonant: "বর্ণ", word: "অক্ষর", number: "সংখ্যা" };
export const nounOf = (level: number) => NOUN[levelOf(level).world];

/** The two ways to play, as chips on the title: the name and what it changes. */
export const MODES: Record<Mode, { name: string; line: string }> = {
  calm: { name: "গাছতলা", line: "বর্ণ ঝুলে থাকে। যত সময় লাগে নাও, ঠিকটায় ছোঁয়াও।" },
  wind: { name: "ঝড়ো হাওয়া", line: "বাতাসে বর্ণ নিজেই পড়ে, ঝুড়ি সরিয়ে ধরো। ৭ বছর থেকে।" },
};

/** What's new on this level, on the title. Each one is true to the level data. */
const NEWS = [
  "ঠিক বর্ণটা ঝুড়িতে তোলো: অ, তারপর আ।",
  "ঋ থেকে ঔ। ভুলটা ধরলে ঝুড়ি দুলে উঠবে।",
  "এগারোটা স্বরবর্ণ একটানা। এবার একসাথে তিনটা ফল।",
  "এবার ব্যঞ্জনবর্ণ: ক, খ, গ, ঘ, ঙ।",
  "চ থেকে ঞ। এবার একসাথে তিনটা ফল।",
  "ট থেকে ণ। ঢোল আর হরিণ আসছে।",
  "ত থেকে ন। তরমুজ, থালা, দোয়েল।",
  "প থেকে ম। ফুল, বই, ময়ূর আসছে।",
  "য থেকে হ। এবার একসাথে চারটা ফল।",
  "বর্ণমালার শেষ সাতটা: ড় থেকে ঁ।",
  "ক থেকে ন, ২০টা বর্ণ একটানা।",
  "প থেকে ঁ, ১৯টা বর্ণ। বর্ণমালার শেষ পাতা।",
  "এবার শব্দ। আ আর ম ধরলে হবে আম।",
  "ফুল, মাছ, দই। ফু মানে ফ আর উ-কার, একসাথে।",
  "পানি, হাঁস, নৌকা। হাঁ-এর মাথায় চন্দ্রবিন্দু।",
  "কলা, গরু, ঘুড়ি, বাঘ। চারটা শব্দ।",
  "টিয়া, লাটিম, শাপলা। এবার একসাথে চারটা ফল।",
  "রিকশা, টমেটো, তরমুজ। বাজারের ঝুড়ি ভরো।",
  "এবার সংখ্যা: ১ থেকে ১০।",
  "১১ থেকে ২০। এবার একসাথে চারটা ফল।",
  "শুধু জোড় সংখ্যা: ২, ৪, ৬ করে ২০ পর্যন্ত।",
  "শেষ লেভেল। ২০ থেকে উল্টো গোনো, ১ পর্যন্ত।",
] as const;
export const newsLine = (level: number) => NEWS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** One small picture per cleared level. */
const CLEAR_LINES = [
  "অ থেকে ঊ ঝুড়িতে। অজগর লেজ দোলাচ্ছে।",
  "স্বরবর্ণের বাকি পাঁচটাও ঝুড়িতে।",
  "এগারোটা স্বরবর্ণ, বইয়ের পুরো প্রথম পাতা।",
  "কলা, খরগোশ, গরু, ঘড়ি, ব্যাঙ। পাঁচটাই ঝুড়িতে।",
  "চশমা, ছাতা, জাহাজ, ঝিনুক আর এক ইঞ্চি।",
  "ঢোল বাজল, হরিণটা এক দৌড়ে পার।",
  "ধানখেতের পাশ দিয়ে নৌকা চলে গেল।",
  "পেঁপে, ফুল, বই, ভেড়া, ময়ূর। ঝুড়ি ভারী হচ্ছে।",
  "রিকশা থেকে হাঁস, সাতটাই ধরা।",
  "চাঁদের ঁ দিয়ে বর্ণমালা শেষ।",
  "ক থেকে ন পার। বাকি থাকল প থেকে ঁ।",
  "প থেকে ঁ। পুরো বর্ণমালা এখন তোমার ঝুড়িতে।",
  "আম আর বই, প্রথম দুটো শব্দ।",
  "ফুল, মাছ, দই। দুপুরের খাওয়া প্রায় তৈরি।",
  "পানিতে হাঁস, ঘাটে নৌকা।",
  "মাঠে গরু, আকাশে ঘুড়ি। বাঘটা বনেই থাক।",
  "টিয়া উড়ল, লাটিম ঘুরল, পুকুরে শাপলা।",
  "রিকশায় চড়ে বাজার থেকে টমেটো আর তরমুজ।",
  "এক থেকে দশ, আঙুলে গোনা শেষ।",
  "১১ থেকে ২০, দুই অঙ্কের সংখ্যাও ঝুড়িতে।",
  "জোড়ায় জোড়ায় ২০ পর্যন্ত।",
  "২০ থেকে ১, উল্টো গুনেও পার। পুরো বই শেষ।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** The end screen's counts and the card's tally: what went into the basket, and how many on the first try. */
export const caughtLine = (level: number) => `${bn(levelOf(level).items.length)}টা ${nounOf(level)} ঝুড়িতে`;
export const firstLine = (count: number) => `${bn(count)}টা প্রথমবারেই`;
export const tallyLine = ({ level, slips }: { level: number; slips: number }) =>
  `${bn(levelOf(level).items.length)}টা ${nounOf(level)} · ${firstLine(levelOf(level).items.length - slips)}`;

/** The card's own line for a grown-up: a plain fact, never a comparison. */
export function humanLine({ level, slips }: { level: number; slips: number }) {
  if (slips === 0) return `সবগুলো ${nounOf(level)} প্রথমবারেই ঠিক।`;
  if (slips <= 2) return "এক-আধটায় ঝুড়ি দুলেছে, বাকি সব প্রথমবারেই।";
  return "ঝুড়ি কয়েকবার দুলেছে। তবু পুরো পাতা ঝুড়িতে।";
}

/** The line beside the picture after a wrong pick, after two (the right fruit glows), or a dropped fruit (ঝড়ো হাওয়া). */
export const wrongLine = (caught: string, want: string) => `ওটা ${caught}। এবার ${want} খোঁজো।`;
export const hintLine = (want: string) => `ঝলমলে ফলটায় ${want}।`;
export const missLine = (want: string, near: boolean) => near ? `একটুর জন্য! ${want} আবার আসছে।` : `${want} মাটিতে পড়ল। আবার আসছে।`;
export const lookLine = (want: string) => `${want} খোঁজো`;
