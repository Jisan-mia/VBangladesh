// আম্মুর নম্বর: the rules. A parent's 11-digit mobile number is rebuilt on a dial pad in growing chunks (০১৭ → ০১৭১২ → ০১৭১২৩৪৫ → all),
// and each step hides a little more of it. Pure functions only. The number itself is never stored by this file or anything it feeds.
import { starsFor } from "../../../shared/game-core";

const BN = "০১২৩৪৫৬৭৮৯";
export const WORDS = ["শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়"];

/** Clearly fake, for trying the game, screenshots and the preview card. */
export const DEMO = "01700000000";

export const bn = (value: number | string) => String(value).replace(/\d/g, digit => BN[Number(digit)]);

/** A Bangladeshi mobile number typed in Bangla or English digits, with spaces, dashes or +88, as 11 ASCII digits; otherwise null. */
export function parseNumber(input: string) {
  const digits = input.replace(/[০-৯]/g, digit => String(BN.indexOf(digit))).replace(/[\s\-–.()]/g, "").replace(/^\+?88(?=01)/, "");
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
}

/** How the number is said out loud in Bangladesh: ০১৭১২-৩৪৫-৬৭৮. Each step adds the next piece. */
export const PIECES = [3, 5, 8, 11];
const BREAKS = [3, 5, 8];
export const grouped = (digits: string) => bn(digits.replace(/^(\d{5})(\d{3})(\d+)$/, "$1-$2-$3"));

/** The chant for the parent to say along: "শূন্য-এক-সাত, এক-দুই, …" for the first `length` digits. */
export function rhyme(digits: string, length = digits.length) {
  const parts: string[][] = [[]];
  for (let index = 0; index < length; index++) {
    if (BREAKS.includes(index)) parts.push([]);
    parts.at(-1)!.push(WORDS[Number(digits[index])]);
  }
  return parts.map(part => part.join("-")).join(", ");
}

/** When each digit lights up and sounds in the playback (ms), with a little rest between pieces, like a rhyme. */
export function beats(length: number, slow = false) {
  const step = slow ? 520 : 380, rest = slow ? 340 : 240;
  return Array.from({ length }, (_, index) => index * step + BREAKS.filter(at => at <= index).length * rest);
}

export type Hide = "none" | "old" | "all";
export type Level = { step: number; label: string; hide: Hide; pieces: number[]; showFirst: boolean };
export const LEVELS: Level[] = [
  { step: 1, label: "দেখে দেখে", hide: "none", pieces: PIECES, showFirst: true },
  { step: 2, label: "আগেরটুকু মনে রেখে", hide: "old", pieces: PIECES, showFirst: true },
  { step: 3, label: "দেখে, তারপর লুকিয়ে", hide: "all", pieces: PIECES, showFirst: true },
  { step: 4, label: "পুরোটা মনে থেকে", hide: "all", pieces: [11], showFirst: false },
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (step: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, step)) - 1];

export type Round = {
  level: number; number: string;
  piece: number; typed: number;
  /** Misses on the digit being asked, total misses and peeks this round, and the runs that quietly ease or lift it. */
  tries: number; misses: number; helps: number; wrongRun: number; rightRun: number;
  eased: boolean; easeNext: boolean;
  stage: "play" | "piece" | "end";
};

export function newRound(level: number, number: string, eased = false, rightRun = 0): Round {
  return { level: levelOf(level).step, number, piece: 0, typed: 0, tries: 0, misses: 0, helps: 0, wrongRun: 0, rightRun, eased, easeNext: false, stage: "play" };
}

/** How many digits this step asks for. */
export const target = (round: Round) => levelOf(round.level).pieces[round.piece];
const easier: Record<Hide, Hide> = { all: "old", old: "none", none: "none" };
/** The leading digits shown as an empty box (to remember), the rest show faintly (to copy). Eased steps hide one notch less. */
export function hiddenCount(round: Round) {
  const level = levelOf(round.level), hide = round.eased ? easier[level.hide] : level.hide;
  if (hide === "none") return 0;
  if (hide === "all") return target(round);
  return round.piece > 0 ? level.pieces[round.piece - 1] : level.pieces.length === 1 ? 8 : 0;
}
/** Two misses on one digit: its key glows and its box shows it. */
export const glows = (round: Round) => round.stage === "play" && round.tries >= 2;
export const expected = (round: Round) => Number(round.number[round.typed]);

export type Slot = "typed" | "hint" | "guide" | "hidden" | "later";
export function slots(round: Round, showing: boolean): Slot[] {
  const length = target(round), hidden = hiddenCount(round);
  return Array.from({ length: 11 }, (_, index) => {
    if (index >= length) return "later";
    if (index < round.typed) return "typed";
    if (index === round.typed && glows(round)) return "hint";
    return showing || index >= hidden ? "guide" : "hidden";
  });
}

export type Event = "right" | "miss" | "piece" | "end" | "ignore";
export function dial(round: Round, digit: number): { round: Round; event: Event } {
  if (round.stage !== "play") return { round, event: "ignore" };
  if (digit !== expected(round)) {
    const wrongRun = round.wrongRun + 1;
    return { round: { ...round, tries: round.tries + 1, misses: round.misses + 1, wrongRun, rightRun: 0, easeNext: round.easeNext || wrongRun >= 3 }, event: "miss" };
  }
  const rightRun = round.rightRun + 1;
  const next: Round = { ...round, typed: round.typed + 1, tries: 0, wrongRun: 0, rightRun, eased: round.eased && rightRun < 5 };
  if (next.typed < target(round)) return { round: next, event: "right" };
  const last = round.piece === levelOf(round.level).pieces.length - 1;
  return { round: { ...next, stage: last ? "end" : "piece" }, event: last ? "end" : "piece" };
}

/** The next, longer piece: typed again from the start, which is the practice. Three misses in a row ease it. */
export function nextPiece(round: Round): Round {
  return { ...round, piece: round.piece + 1, typed: 0, tries: 0, stage: "play", eased: round.eased || round.easeNext, easeNext: false };
}

/** A look at the hidden digits counts as help, but only when something was hidden. */
export const peek = (round: Round): Round => hiddenCount(round) > round.typed && round.stage === "play" ? { ...round, helps: round.helps + 1 } : round;

/** Stars only record the round: a slip or a look is fine. */
export const roundStars = (round: Round) => starsFor(round.misses + round.helps, 1, 4, true);

export type Who = "ammu" | "abbu";
export const WHO_NAME: Record<Who, string> = { ammu: "আম্মু", abbu: "আব্বু" };
export const whose = (who: Who) => (who === "abbu" ? "আব্বুর" : "আম্মুর");

export function pieceLine(round: Round) {
  return `${bn(round.number.slice(0, target(round)))} হলো।`;
}
export function promptLine(round: Round, who: Who, playing: boolean) {
  if (round.stage === "end") return `${whose(who)} পুরো নম্বর হয়ে গেল।`;
  if (round.stage === "piece") return pieceLine(round);
  if (playing) return "শোনো আর দেখো…";
  const hidden = hiddenCount(round);
  if (hidden >= target(round)) return target(round) === 11 ? "পুরো নম্বরটা মনে থেকে চাপো।" : `লুকানো ${bn(target(round))}টা অঙ্ক মনে থেকে চাপো।`;
  if (hidden > 0) return "আগের অঙ্কগুলো মনে আছে? তারপর বাকিটা দেখে চাপো।";
  return "দেখে দেখে একই অঙ্ক চাপো।";
}
export function missLine(round: Round) {
  return glows(round) ? `এখানে ${WORDS[expected(round)]}, জ্বলছে যে বোতামটা।` : "উঁহু, আরেকবার ভাবো।";
}
/** Praise the method, rarely: only for a clean round. */
export function endLine(round: Round, who: Who) {
  if (round.level === LEVEL_COUNT && round.misses + round.helps === 0) return `${whose(who)} নম্বর এখন তোমার মনে আছে।`;
  if (round.misses + round.helps === 0) return "টুকরো টুকরো করে মনে রাখলে, তাই একবারও ভুল হয়নি।";
  return `${whose(who)} পুরো নম্বর চাপা হলো।`;
}
export const sayLine = (who: Who) => `এবার ${WHO_NAME[who]}কে নম্বরটা মুখে বলে শোনাও।`;
export const cardLine = (who: Who) => `আজ ${whose(who)} নম্বর মুখস্থ করলাম`;
