// আম্মুর নম্বর: one round, as pure functions. A parent's 11-digit mobile number is rebuilt on a dial pad in growing pieces
// (০১৭ → ০১৭১২ → ০১৭১২৩৪৫ → all). Which digits hide and how many looks a round allows come from lib/levels.ts.
// Nothing here stores, sends or draws the number: it only lives in the Round the component holds.
import { starsFor } from "../../../shared/game-core";
import { levelOf, NUMBER_LENGTH, type Hide } from "./levels";

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

/** Where the number is said with a breath, in Bangladesh: ০১৭১২-৩৪৫-৬৭৮. */
const BREAKS = [3, 5, 8];

/** When each digit lights up and sounds in the look (ms), with a little rest between pieces, like a rhyme. */
export function beats(length: number, slow = false) {
  const step = slow ? 520 : 340, rest = slow ? 340 : 220;
  return Array.from({ length }, (_, index) => index * step + BREAKS.filter(at => at <= index).length * rest);
}
/** The look starts this long after it is asked for, and the boxes stay lit this long after the last digit. */
export const LOOK_LEAD = 220;
export const LOOK_TAIL = 700;
export const lookLength = (length: number, slow = false) => LOOK_LEAD + beats(length, slow)[length - 1] + LOOK_TAIL;

export type Round = {
  level: number; number: string;
  piece: number; typed: number;
  /** Misses on the digit being asked, and in total; looks that were charged (something hid); digits right, and right at the first try. */
  tries: number; misses: number; looks: number; dialled: number; clean: number;
  /** The runs that quietly ease or lift the next piece. */
  wrongRun: number; rightRun: number; eased: boolean; easeNext: boolean;
  stage: "play" | "piece" | "end";
};

export function newRound(level: number, number: string, eased = false, rightRun = 0): Round {
  return { level: levelOf(level).id, number, piece: 0, typed: 0, tries: 0, misses: 0, looks: 0, dialled: 0, clean: 0, wrongRun: 0, rightRun, eased, easeNext: false, stage: "play" };
}

/** How many digits this piece asks for. */
export const target = (round: Round) => levelOf(round.level).pieces[round.piece];
export const lastPiece = (round: Round) => round.piece === levelOf(round.level).pieces.length - 1;
const easier: Record<Hide, Hide> = { all: "old", old: "none", none: "none" };
/** The leading digits shown as an empty box (to remember); the rest show faintly (to copy). An eased piece hides one notch less. */
export function hiddenCount(round: Round) {
  const level = levelOf(round.level), hide = round.eased ? easier[level.hide] : level.hide;
  if (hide === "none") return 0;
  if (hide === "all") return target(round);
  return round.piece > 0 ? level.pieces[round.piece - 1] : level.pieces.length === 1 ? 8 : 0;
}
/** Two misses on one digit: its key glows and its box shows it. */
export const glows = (round: Round) => round.stage === "play" && round.tries >= 2;
export const expected = (round: Round) => Number(round.number[round.typed]);
/** Does this piece open with the look (the digits play and light once, then hide)? */
export const opensWithLook = (round: Round) => levelOf(round.level).show && hiddenCount(round) > 0;
/** Something is hidden that a look would reveal. */
export const somethingHidden = (round: Round) => round.stage === "play" && hiddenCount(round) > round.typed;
/** Looks the round still allows (null: no limit). */
export function eyesLeft(round: Round) {
  const limit = levelOf(round.level).eyes;
  return limit === null ? null : Math.max(0, limit - round.looks);
}

export type Slot = "typed" | "hint" | "guide" | "hidden" | "later";
export function slots(round: Round, showing: boolean): Slot[] {
  const length = target(round), hidden = hiddenCount(round);
  return Array.from({ length: NUMBER_LENGTH }, (_, index) => {
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
  const next: Round = { ...round, typed: round.typed + 1, dialled: round.dialled + 1, clean: round.clean + (round.tries === 0 ? 1 : 0), tries: 0, wrongRun: 0, rightRun, eased: round.eased && rightRun < 5 };
  if (next.typed < target(round)) return { round: next, event: "right" };
  const last = lastPiece(round);
  return { round: { ...next, stage: last ? "end" : "piece" }, event: last ? "end" : "piece" };
}

/** The next, longer piece: typed again from the start, which is the practice. Three misses in a row ease it. */
export function nextPiece(round: Round): Round {
  return { ...round, piece: round.piece + 1, typed: 0, tries: 0, stage: "play", eased: round.eased || round.easeNext, easeNext: false };
}

export type Look = { round: Round; allowed: boolean; charged: boolean };
/**
 * The eye key. Nothing hidden: it plays the tune again, free. Something hidden: it costs one look, and only while the round
 * has one left. The tune that opens a piece is never a look.
 */
export function look(round: Round): Look {
  if (round.stage !== "play") return { round, allowed: false, charged: false };
  if (!somethingHidden(round)) return { round, allowed: true, charged: false };
  if (eyesLeft(round) === 0) return { round, allowed: false, charged: false };
  return { round: { ...round, looks: round.looks + 1 }, allowed: true, charged: true };
}

/** Stars only record the round: a slip or a look is fine. */
export const roundStars = (round: Round) => starsFor(round.misses + round.looks, 1, 4, true);

export type Who = "ammu" | "abbu";
export const WHO_NAME: Record<Who, string> = { ammu: "আম্মু", abbu: "আব্বু" };
export const whose = (who: Who) => (who === "abbu" ? "আব্বুর" : "আম্মুর");

export type Mode = "look" | "dial" | "rest" | "ring";
/** One short line for a parent or an older child; the pictures on the screen say the same. */
export function sayLine(round: Round, who: Who, mode: Mode) {
  if (mode === "ring") return `${whose(who)} ফোন বাজছে।`;
  if (mode === "rest") return `${bn(round.number.slice(0, target(round)))} হলো।`;
  if (mode === "look") return "দেখো আর শোনো।";
  const hidden = hiddenCount(round);
  if (hidden >= target(round)) return target(round) === NUMBER_LENGTH ? "পুরো নম্বরটা মনে থেকে চাপো।" : `লুকানো ${bn(target(round))}টা অঙ্ক মনে থেকে চাপো।`;
  if (hidden > 0) return "আগের অঙ্কগুলো মনে আছে? তারপর বাকিটা দেখে চাপো।";
  return "দেখে দেখে একই অঙ্ক চাপো।";
}
export function missLine(round: Round) {
  return glows(round) ? `এখানে ${WORDS[expected(round)]}, জ্বলছে যে বোতামটা।` : "উঁহু, আরেকবার ভাবো।";
}
/** Praise the method, rarely: only for a clean round. */
export function endLine(round: Round, who: Who) {
  const clean = round.misses + round.looks === 0;
  const spec = levelOf(round.level);
  if (clean && spec.pieces.length === 1 && spec.hide === "all") return `${whose(who)} নম্বর এখন তোমার মনে আছে।`;
  if (clean) return "টুকরো টুকরো করে মনে রাখলে, তাই একবারও ভুল হয়নি।";
  return `${whose(who)} পুরো নম্বর চাপা হলো।`;
}
export const askLine = (who: Who) => `এবার ${WHO_NAME[who]}কে নম্বরটা মুখে বলে শোনাও।`;
export const cardLine = (who: Who) => `আজ ${whose(who)} নম্বর মুখস্থ করলাম`;

/** What the end screen counts up: digits dialled, and how many went in at the first try. */
export const resultOf = (round: Round) => ({ level: round.level, stars: roundStars(round), dialled: round.dialled, clean: round.clean, looks: round.looks, misses: round.misses });
export type Result = ReturnType<typeof resultOf>;
