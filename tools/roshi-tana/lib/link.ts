// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { MAX_BEATS, starsOf, type Side } from "./rope";
import { isLevel, teamOf, LEVEL_COUNT, THEM, US } from "./teams";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A full pull every beat from the middle, with no one pulling back, still takes 8 beats to reach a line. */
export const MIN_BEATS = 8;

/**
 * A solo win as the player reports it: the level, the seed (it decides every pull of the other team),
 * how many beats it took, and how many of those you pulled on the beat. Taps are real-time, so it's their phone's word.
 */
export type Shared = { level: number; seed: number; beats: number; hits: number; name: string };

/** `#s=<seed>&t=<beats>&l=<level>&h=<on-beat pulls>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_BEATS, extraKeys: ["l", "h"] });
  if (!read) return null;
  const l = read.extra.l ?? "", h = read.extra.h ?? "";
  if (!/^(10|[1-9])$/.test(l) || !/^[1-9]\d?$/.test(h)) return null;
  const level = Number(l), hits = Number(h);
  if (!isLevel(level) || read.target < MIN_BEATS || hits > read.target) return null;
  return { level, seed: read.seed, beats: read.target, hits, name: read.name };
}

export const sharedHash = ({ level, seed, beats, hits, name }: Shared) => challengeHash({ seed, target: beats, name, extra: { l: level, h: hits } });

const who = (name: string) => cleanName(name) || "বন্ধু";
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${teamOf(level).name}`;
export const beatsText = (beats: number) => `${bn(beats)} টানে`;

/** "রাফি ক্লাস ফাইভকে ১৪ টানে হারিয়েছে" */
export function feat({ level, beats, name }: Pick<Shared, "level" | "beats" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} রশি টানাটানিতে ${teamOf(level).obj} ${beatsText(beats)} হারিয়েছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের হিসাব। একই দল, একই ঢোল, এবার তোমার পালা।`;

/** After a friend's match: fewer beats is better. Kind either way, with the exact gap. */
export function compareLine(mine: number, theirs: number, name: string) {
  const friend = possessive(who(name));
  if (mine < theirs) return `${friend} লেগেছিল ${bn(theirs)} টান, তোমার ${bn(mine)}।`;
  if (mine === theirs) return `সমান সমান। ${friend}ও লেগেছিল ${bn(theirs)} টান।`;
  return `${friend} লেগেছিল ${bn(theirs)} টান, তোমার ${bn(mine)}। আর ${bn(mine - theirs)} টান কম হলেই সমান।`;
}

export const caption = ({ level, beats }: Pick<Shared, "level" | "beats">) => `রশি টানাটানিতে ${teamOf(level).obj} ${beatsText(beats)} হারালাম। তুমি কয় টানে পারবে?`;

const CLEAR_LINES = [
  "ক্লাস থ্রি দাগ পার। মাইকে আমাদের দলের নাম।",
  "ক্লাস ফোরের হাত থেকে রশি ফসকে গেল।",
  "ক্লাস ফাইভ ধুলায় বসে পড়েছে। মাঠের ধারে হাততালি।",
  "সিক্সের দল পানির বোতল খুঁজছে।",
  "এইটের দল বলছে, পরের বছর দেখা হবে।",
  "টেনের দলও পারল না। স্যার বাঁশি বাজালেন।",
  "কলেজের ভাইয়ারা হাতা গুটিয়েও দাগ পার হয়ে গেল।",
  "অভিভাবকদের দলে আব্বুরা হাঁপাচ্ছেন, আম্মুরা হাসছেন।",
  "শিক্ষকদের দল হার মানল। আজ হোমওয়ার্ক একটু কম, মনে হয়।",
  "হেডস্যারের দলও দাগ পার। পুরো মাঠ দাঁড়িয়ে হাততালি দিচ্ছে।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** Under the stars of a win short of three: the exact number of beats still to cut. */
export function nearMissLine(level: number, beats: number) {
  const extra = beats - teamOf(level).three;
  return extra > 0 ? `আর ${bn(extra)} টান কম লাগলে ৩ তারা।` : "";
}

/** After a lost solo match: one exact, kind fact, then what to try. */
export function lossLine({ slips, hits, missed, timeout }: { slips: number; hits: number; missed: number; timeout: boolean }) {
  if (slips > hits) return `${bn(slips)}বার চাপ পড়েছে তালের বাইরে, তাতে রশি ফসকেছে। প্রতি ঢোলে একবার চাপো।`;
  if (missed > hits) return `${bn(missed)}টা ঢোলে টান পড়েনি। রিং ঢোলে মিশলেই চাপো।`;
  if (timeout) return "সময় শেষে ফিতা ওদের দিকে একটু বেশি ছিল।";
  return "শেষ দিকে ওদের টান বেশি ছিল। প্রথম থেকেই তাল ধরো।";
}

/** The card's own line for a solo win, seen by friends. */
export function humanLine({ level, beats }: Pick<Shared, "level" | "beats">) {
  if (level === LEVEL_COUNT) return "হেডস্যারের দলও চুনের দাগ পার হয়ে এল।";
  const stars = starsOf(level, beats);
  if (stars === 3) return "ঢোলের তালে তালে টান, ফিতা সোজা আমাদের দাগে।";
  if (stars === 2) return "মাঠের ধুলা উড়ল, ফিতা এল আমাদের দিকে।";
  return "শেষ টান পর্যন্ত দুই দলই মাটি কামড়ে ছিল।";
}

/** A two-player win on this phone. Not a challenge: the link just opens the game. */
export type DuoWin = { winner: Side; beats: number; name: string };
export const duoTeam = (side: Side) => side === 0 ? US : THEM;
export function duoTitle({ winner, name }: Pick<DuoWin, "winner" | "name">) {
  const clean = cleanName(name);
  return clean ? `${possessive(clean)} দল জিতল` : `${duoTeam(winner).name} জিতল`;
}
export const duoLine = (beats: number) => beats <= 20 ? "এক দল তাল ধরল, আরেক দল ধুলায়।" : beats <= 40 ? "দুই দলই তালে ছিল, শেষে এক হাত এগিয়ে গেল একজন।" : "শেষ ঢোল পর্যন্ত টানাটানি।";
export const duoCaption = (win: DuoWin) => `রশি টানাটানিতে ${duoTitle(win)}, ${beatsText(win.beats)}। তোমরা দুজনে কয় টানে পারো?`;
