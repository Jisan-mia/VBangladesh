// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the levels.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, isMode, levelDef, LEVEL_COUNT, OLD_COUNT, THEM, US, type Mode } from "./levels";
import { MAX_BEATS } from "./match";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/**
 * The fewest beats a win can take: on the old ladder a full pull every beat from the middle still took 8; on the new one a
 * বড় ঢোল right on the beat pulls double, so 7 (tests/match.test.ts proves neither can be beaten).
 */
export const MIN_BEATS = 8;
export const MIN_BEATS_V2 = 7;

/**
 * A solo win as the player reports it: the level, the seed (it decides every pull of the other team and every rest), how many
 * beats it took, how many of those you pulled on the beat, and the mode. `old` is a link from before the rewrite (no `v=2`),
 * which replays the old ten-team ladder. Taps are real-time, so it's their phone's word.
 */
export type Shared = { level: number; seed: number; beats: number; hits: number; name: string; mode: Mode; old: boolean };

/** `#s=<seed>&t=<beats>&l=<level>&h=<on-beat pulls>[&v=2][&d=e|h]&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_BEATS, extraKeys: ["l", "h", "v", "d"] });
  if (!read) return null;
  const { l = "", h = "", v, d } = read.extra;
  if (v !== undefined && v !== "2") return null;
  const old = v === undefined;
  if (!(old ? /^(10|[1-9])$/ : /^(1[0-2]|[1-9])$/).test(l) || !/^[1-9]\d?$/.test(h)) return null;
  // Old links never carried a mode; on new ones it is e or h, or left out for সাধারণ.
  if (d !== undefined && (old || (d !== "e" && d !== "h"))) return null;
  const level = Number(l), hits = Number(h), mode: Mode = d && isMode(d) ? d : "n";
  if (!isLevel(level, old) || read.target < (old ? MIN_BEATS : MIN_BEATS_V2) || hits > read.target) return null;
  return { level, seed: read.seed, beats: read.target, hits, name: read.name, mode, old };
}

/** Old links are written back exactly as they came; new ones carry `v=2` and a mode other than সাধারণ. */
export function sharedHash({ level, seed, beats, hits, name, mode, old }: Shared) {
  const extra: Record<string, string | number> = { l: level, h: hits };
  if (!old) { extra.v = 2; if (mode !== "n") extra.d = mode; }
  return challengeHash({ seed, target: beats, name, extra });
}

const who = (name: string) => cleanName(name) || "বন্ধু";
export const teamOf = (level: number, old = false) => levelDef(level, old);
export const levelLabel = (level: number, old = false) => `লেভেল ${bn(level)} · ${teamOf(level, old).team}`;
export const beatsText = (beats: number) => `${bn(beats)} টানে`;

/** "রাফি রশি টানাটানিতে ক্লাস ফাইভকে ১৪ টানে হারিয়েছে" */
export function feat({ level, beats, name, old }: Pick<Shared, "level" | "beats" | "name" | "old">) {
  return `${cleanName(name) || "এক বন্ধু"} রশি টানাটানিতে ${teamOf(level, old).obj} ${beatsText(beats)} হারিয়েছে`;
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

export const caption = ({ level, beats, old }: Pick<Shared, "level" | "beats" | "old">) => `রশি টানাটানিতে ${teamOf(level, old).obj} ${beatsText(beats)} হারালাম। তুমি কয় টানে পারবে?`;

const CLEAR_LINES = [
  "ক্লাস থ্রি দাগ পার। মাইকে আমাদের দলের নাম।",
  "ক্লাস ফোরের হাত থেকে রশি ফসকে গেল।",
  "বড় ঢোলের টানে সিক্সের দল ধুলায় বসে পড়েছে।",
  "ক্লাস টেনের হেঁইয়োও কাজে এল না। মাঠের ধারে হাততালি।",
  "পাশের স্কুলের দল ফাঁকা তালে চেপে ফসকেছে।",
  "কলেজের ভাইয়ারা হাতা গুটিয়েও দাগ পার হয়ে গেল।",
  "পাড়ার ক্লাব মাটি কামড়ে ছিল, তবু ফিতা এল আমাদের দিকে।",
  "অভিভাবকদের দলে আব্বুরা হাঁপাচ্ছেন, আম্মুরা হাসছেন।",
  "স্কাউট দল চুপ ঢোলে তাল হারাল।",
  "শিক্ষকদের দল শিশিরে পিছলে গেল। আজ হোমওয়ার্ক একটু কম, মনে হয়।",
  "প্রাক্তন ছাত্ররা বলছে, তাদের সময়ে ঢোল এত তাড়াতাড়ি বাজত না।",
  "হেডস্যারের দলও দাগ পার। পুরো মাঠ দাঁড়িয়ে হাততালি দিচ্ছে।",
] as const;
const OLD_CLEAR_LINES = [
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
export function clearLine(level: number, old = false) {
  const lines = old ? OLD_CLEAR_LINES : CLEAR_LINES;
  return lines[Math.min(lines.length, Math.max(1, level)) - 1];
}

/** After a lost solo match: one exact, kind fact, then what to try. */
export function lossLine({ slips, hits, missed, wrongRests, heaves, held, timeout }: { slips: number; hits: number; missed: number; wrongRests: number; heaves: number; held: number; timeout: boolean }) {
  if (heaves >= 2 && held * 2 < heaves) return `ওদের ${bn(heaves)}টা হেঁইয়োর ${bn(held)}টা ঠেকেছে। লাল রিংয়ের ঢোলে ঠিক তালে চাপলে ঠেকে।`;
  if (wrongRests >= 3 && wrongRests * 2 >= slips) return `${bn(wrongRests)}বার ফাঁকা তালে চেপেছ। দাগকাটা রিং এলে হাত থামাও।`;
  if (slips > hits) return `${bn(slips)}বার চাপ পড়েছে তালের বাইরে, তাতে রশি ফসকেছে। প্রতি ঢোলে একবার চাপো।`;
  if (missed > hits) return `${bn(missed)}টা ঢোলে টান পড়েনি। রিং ঢোলে মিশলেই চাপো।`;
  if (timeout) return "সময় শেষে ফিতা ওদের দিকে একটু বেশি ছিল।";
  return "শেষ দিকে ওদের টান বেশি ছিল। প্রথম থেকেই তাল ধরো।";
}

/** The card's own line for a solo win, seen by friends. */
export function humanLine(stars: number, last: boolean) {
  if (last) return "হেডস্যারের দলও চুনের দাগ পার হয়ে এল।";
  if (stars === 3) return "ঢোলের তালে তালে টান, ফিতা সোজা আমাদের দাগে।";
  if (stars === 2) return "মাঠের ধুলা উড়ল, ফিতা এল আমাদের দিকে।";
  return "শেষ টান পর্যন্ত দুই দলই মাটি কামড়ে ছিল।";
}
export const isLastLevel = (level: number, old: boolean) => level === (old ? OLD_COUNT : LEVEL_COUNT);

/** A two-player win on this phone. Not a challenge: the link just opens the game. */
export type DuoWin = { winner: 0 | 1; beats: number; name: string };
export const duoTeam = (side: 0 | 1) => side === 0 ? US : THEM;
export function duoTitle({ winner, name }: Pick<DuoWin, "winner" | "name">) {
  const clean = cleanName(name);
  return clean ? `${possessive(clean)} দল জিতল` : `${duoTeam(winner).name} জিতল`;
}
export const duoLine = (beats: number) => beats <= 20 ? "এক দল তাল ধরল, আরেক দল ধুলায়।" : beats <= 40 ? "দুই দলই তালে ছিল, শেষে এক হাত এগিয়ে গেল একজন।" : "শেষ ঢোল পর্যন্ত টানাটানি।";
export const duoCaption = (win: DuoWin) => `রশি টানাটানিতে ${duoTitle(win)}, ${beatsText(win.beats)}। তোমরা দুজনে কয় টানে পারো?`;
