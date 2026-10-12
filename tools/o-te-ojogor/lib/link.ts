// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the level data.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, levelOf, starLimits, LEVEL_COUNT, type World } from "./levels";
import { starsOf } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A finished level as the player reports it. Catching is real-time, so the mistake count is their phone's word. */
export type Shared = { level: number; seed: number; errors: number; name: string };

export const MAX_ERRORS = 99;

/** `#s=<seed>&t=<mistakes>&l=<level>&n=<name>` */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_ERRORS, extraKeys: ["l"] });
  if (!read) return null;
  const l = read.extra.l ?? "";
  if (!/^[1-9]\d?$/.test(l) || !isLevel(Number(l))) return null;
  return { level: Number(l), seed: read.seed, errors: read.target, name: read.name };
}

export const sharedHash = ({ level, seed, errors, name }: Shared) => challengeHash({ seed, target: errors, name, extra: { l: level } });

export const levelLabel = (level: number) => `লেভেল ${bn(level)}`;
/** "অ থেকে ঔ", "আম, বই", "২০ থেকে ১": the part of the title after the colon. */
export const shortTitle = (level: number) => levelOf(level).title.split(": ")[1].replace(", একটানা", "");
const NOUN: Record<World, string> = { vowel: "বর্ণ", consonant: "বর্ণ", word: "অক্ষর", number: "সংখ্যা" };
export const nounOf = (level: number) => NOUN[levelOf(level).world];
const who = (name: string) => cleanName(name) || "বন্ধু";

/** What's new on this level, on the start screen. Each one is true to the level data. */
const NEWS = [
  "বর্ণ পাকলে টুপ করে পড়ে। ঝুড়ি সরিয়ে অ ধরো, তারপর আ।",
  "ঋ থেকে ঔ। ভুল বর্ণ ধরলে ঝুড়ি দুলে উঠবে।",
  "এগারোটা স্বরবর্ণ একটানা। এবার একসাথে তিনটা পড়বে।",
  "এবার ব্যঞ্জনবর্ণ: ক, খ, গ, ঘ, ঙ।",
  "চ থেকে ঞ। একসাথে তিনটা পড়বে।",
  "ট থেকে ণ। একটু জোরে পড়বে।",
  "ত থেকে ন। আরেকটু জোরে।",
  "প থেকে ম। ফুল, বই, ময়ূর আসছে।",
  "য থেকে হ। এবার একসাথে চারটা পড়বে।",
  "বর্ণমালার শেষ সাতটা: ড় থেকে ঁ।",
  "ক থেকে ন, ২০টা বর্ণ একটানা। বেশ জোরে পড়বে।",
  "প থেকে ঁ, ১৯টা বর্ণ। আরও জোরে।",
  "এবার শব্দ। আ আর ম ধরলে হবে আম।",
  "ফুল, মাছ, দই। ফু মানে ফ আর উ-কার, একসাথে।",
  "পানি, হাঁস, নৌকা। হাঁ-এর মাথায় চন্দ্রবিন্দু।",
  "কলা, গরু, ঘুড়ি, বাঘ। চারটা শব্দ।",
  "টিয়া, লাটিম, শাপলা। এবার একসাথে চারটা পড়বে।",
  "রিকশা, টমেটো, তরমুজ। শব্দের শেষ লেভেল, বেশ জোরে।",
  "এবার সংখ্যা: ১ থেকে ১০।",
  "১১ থেকে ২০। এবার একসাথে চারটা পড়বে।",
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

/** Under the stars short of three: exactly how many fewer mistakes the next star needs. Empty at three. */
export function nearMissLine(level: number, errors: number) {
  const [three, two] = starLimits(level), stars = starsOf(level, errors);
  if (stars === 3) return "";
  const need = errors - (stars === 2 ? three : two);
  return `আর ${bn(need)}টা ভুল কম হলে ${bn(stars + 1)} তারা।`;
}

/** The card's own line, seen by friends. */
export function humanLine({ level, errors }: Pick<Shared, "level" | "errors">) {
  if (errors === 0) return `একটাও ভুল ${nounOf(level)} ঝুড়িতে ওঠেনি, একটাও মাটিতে পড়েনি।`;
  const stars = starsOf(level, errors);
  if (stars === 3) return "এক-আধটা ভুল, বাকি সব ঠিক ঠিক ঝুড়িতে।";
  if (stars === 2) return "ঝুড়ি কয়েকবার দুলেছে, তবু পাতা শেষ।";
  return "ঝুড়ি অনেকবার দুলেছে। তবু শেষ পর্যন্ত ধরা হয়েছে।";
}

export const tallyLine = ({ level, errors }: Pick<Shared, "level" | "errors">) =>
  `${bn(levelOf(level).items.length)}টা ${nounOf(level)} · ভুল ${bn(errors)}টা`;

/** "রাফি ঝুড়িতে ধরেছে অ থেকে ঔ, ভুল ২টা" */
export const feat = ({ level, errors, name }: Pick<Shared, "level" | "errors" | "name">) =>
  `${cleanName(name) || "এক বন্ধু"} ঝুড়িতে ধরেছে ${shortTitle(level)}, ${errors ? `ভুল ${bn(errors)}টা` : "একটাও ভুল ছাড়া"}`;
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের হিসাব। একই গাছ, একই ক্রমে পড়বে। এবার তোমার পালা।`;

/** After a friend's level: fewer mistakes is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const friend = who(name), diff = theirs - mine;
  if (diff > 0) return `${possessive(friend)} চেয়ে ${bn(diff)}টা ভুল কম!`;
  if (diff === 0) return mine === 0 ? "একদম সমান! দুজনেরই একটাও ভুল নেই।" : `একদম সমান! ${friend}ও ${bn(theirs)}টা ভুল করেছিল।`;
  if (-diff <= 2) return `আর একটু হলেই! ${friend} মাত্র ${bn(-diff)}টা ভুল কম করেছিল।`;
  return `${possessive(friend)} ভুল ছিল ${bn(theirs)}টা, তোমার ${bn(mine)}টা। আরেকবার?`;
}

export function caption({ level, errors }: Pick<Shared, "level" | "errors">) {
  return `অ-তে অজগর, ${levelLabel(level)}: ${shortTitle(level)} ঝুড়িতে ধরলাম, ${errors ? `ভুল ${bn(errors)}টা` : "একটাও ভুল ছাড়া"}। তুমি পারবে?`;
}

/** The line under the picture after a wrong catch or a dropped fruit. */
export const wrongLine = (caught: string, want: string) => `ওটা ${caught}। এবার ${want} খোঁজো।`;
export const missLine = (want: string, near: boolean) => near ? `একটুর জন্য! ${want} আবার আসছে।` : `${want} মাটিতে পড়ল। আবার আসছে।`;
export const lookLine = (want: string) => `${want} খোঁজো`;
