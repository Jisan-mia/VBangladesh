// One round of a level: the grid, listening, checking, the glow after two misses, the stars. Pure and immutable, so the
// statechart's paths replay in node tests and a bot can play it. Spec: ai_docs/statecharts/sur-banai/SurBanai.tla.
import { bn, checkLine, compare, noteCount, starsOf, toggle, type Tune } from "./music";
import { givenOf, levelOf, targetOf, type Kind } from "./levels";
import { EXAMPLE, NEED, judge } from "./rules";

export type Round = {
  level: number;
  kind: Kind;
  target: Tune | null;
  /** Locked notes: only a gap level has any. */
  given: Tune;
  guess: Tune;
  gaps: readonly number[];
  listens: number;
  heard: boolean;
  tries: number;
  solved: boolean;
  stars: number;
  /** The cells that shouldn't be there after the last check (they wobble). */
  wobble: Tune | null;
  line: string;
};

export function createRound(level: number): Round {
  const spec = levelOf(level), target = targetOf(level), given = givenOf(level) ?? Array(6).fill(0);
  return { level: spec.id, kind: spec.kind, target, given, guess: [...given], gaps: spec.gaps ?? [], listens: 0, heard: spec.kind === "make", tries: 0, solved: false, stars: 0, wobble: null, line: "" };
}

/** May a finger change this column? A gap level only opens its gaps; nothing changes once solved. */
export const canTap = (round: Round, step: number) => !round.solved && (round.kind !== "gap" || round.gaps.includes(step));

export function tap(round: Round, step: number, row: number): Round {
  if (!canTap(round, step)) return round;
  return { ...round, guess: toggle(round.guess, step, row), wobble: null, line: "" };
}

/** মুছো: back to the given notes (an empty grid on copy and make levels). */
export const clear = (round: Round): Round => (round.solved ? round : { ...round, guess: [...round.given], wobble: null, line: "" });

/** The tune to copy played to its end. Listening is free: it costs nothing and counts only for the end screen. */
export const listened = (round: Round): Round => ({ ...round, listens: round.listens + 1, heard: true });

/** ✓ is open once the child has heard the tune (a make level has nothing to hear) and put a note on the grid. */
export function canCheck(round: Round) {
  if (round.solved) return false;
  const placed = noteCount(round.guess) > noteCount(round.given);
  return round.kind === "make" ? placed : round.heard && placed;
}

const only = (tune: Tune, gaps: readonly number[]) => tune.map((mask, step) => (gaps.includes(step) ? mask : 0));

export function gapLine(target: Tune, guess: Tune, gaps: readonly number[]) {
  const { right, extra, missing } = compare(only(target, gaps), only(guess, gaps));
  const total = noteCount(only(target, gaps));
  if (!right && !extra && !missing) return "";
  const parts = [`${bn(total)}টা ফাঁকের ${bn(right)}টা মিলেছে।`];
  if (extra) parts.push(`${bn(extra)}টা ঘর বাড়তি, ${extra === 1 ? "ওটা" : "ওগুলো"} দুলছে।`);
  else if (missing) parts.push("আরও ফাঁক বাকি। আবার শোনো।");
  return parts.join(" ");
}

const MAKE_LINES = {
  empty: "আগে ঘরে চাপো, তারপর মিলিয়ে দেখো।",
  chord: "এক তালে একটা নোট বসাও।",
  shape: { rising: "প্রতিবার আগের চেয়ে ওপরের ঘরে চাপো।", hill: "ওপরে উঠে তারপর নিচে নামো।", own: "" },
  same: "অন্তত তিনটা আলাদা নোট বসাও।",
} as const;

/** ✓. Returns the next round; `line` says what to change after a miss, never a penalty. */
export function check(round: Round): Round {
  if (round.solved) return round;
  const tries = round.tries + 1;
  if (round.kind === "make") {
    const rule = levelOf(round.level).rule ?? "own", verdict = judge(rule, round.guess);
    if (verdict.ok) return { ...round, tries, solved: true, stars: starsOf(tries), wobble: null, line: "" };
    const line = verdict.why === "empty" ? MAKE_LINES.empty : verdict.why === "few" ? `আরও ${bn(Math.max(1, NEED[rule] - verdict.notes))}টা নোট লাগবে।`
      : verdict.why === "chord" ? MAKE_LINES.chord : verdict.why === "same" ? MAKE_LINES.same : MAKE_LINES.shape[rule];
    return { ...round, tries, wobble: null, line };
  }
  const target = round.target as Tune;
  if (compare(target, round.guess).done) return { ...round, tries, solved: true, stars: starsOf(tries), wobble: null, line: "" };
  const wobble = round.guess.map((mask, step) => mask & ~target[step]);
  const line = round.kind === "gap" ? gapLine(target, round.guess, round.gaps) || "আগে ফাঁকে চাপো, তারপর মিলিয়ে দেখো।" : checkLine(target, round.guess);
  return { ...round, tries, wobble: wobble.some(Boolean) ? wobble : null, line };
}

/** After two misses the answer glows: the missing notes, or an example tune for a make level. */
export const hintOn = (round: Round) => !round.solved && round.tries >= 2;
export function hintTune(round: Round): Tune | null {
  if (!hintOn(round)) return null;
  if (round.kind === "make") return EXAMPLE[levelOf(round.level).rule ?? "own"];
  const target = round.target as Tune;
  return target.map((mask, step) => mask & ~round.guess[step]);
}

export type Result = { level: number; stars: number; tries: number; notes: number; listens: number; tune: Tune };
export const resultOf = (round: Round): Result => ({ level: round.level, stars: round.stars, tries: round.tries, notes: noteCount(round.guess), listens: round.listens, tune: [...round.guess] });
