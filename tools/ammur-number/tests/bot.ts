// A headless child for the level tests. It looks at the keypad and taps: a digit that shows (a guide, or lit in the look) is copied right
// with probability `copy`; a digit that is hidden is remembered with probability `recall`. A wrong tap picks a random other key; once the
// right key glows (two misses) the child taps it. Stuck on a hidden digit, it may press the eye (`peeks`), and then copies the rest of that
// piece. A time per tap gives seconds, the look and the rests cost what the game's own timers cost.
import { makeRng } from "../../../shared/game-core";
import { levelOf } from "../lib/levels";
import { beats, dial, expected, glows, hiddenCount, LOOK_LEAD, LOOK_TAIL, look, newRound, nextPiece, opensWithLook, somethingHidden, target, type Round } from "../lib/play";

export type Child = { copy: number; recall: number; peeks: number; think: number };
export const GUESSER: Child = { copy: 0, recall: 0, peeks: 0, think: 1.2 };
export const FIVE: Child = { copy: 0.96, recall: 0.6, peeks: 0.5, think: 1.1 };
export const LEARNER: Child = { copy: 0.995, recall: 0.9, peeks: 0.3, think: 0.8 };

export type Play = { round: Round; taps: number; seconds: number; firstPieceAt: number; mostTaps: number };

/** A valid mobile number from a seed, never the parent's. */
export function numberFor(seed: number) {
  const rng = makeRng(seed ^ 0x9e3779b9);
  return "01" + String(3 + Math.floor(rng() * 7)) + Array.from({ length: 8 }, () => Math.floor(rng() * 10)).join("");
}

const lookSeconds = (length: number) => (LOOK_LEAD + beats(length)[length - 1] + LOOK_TAIL) / 1000;

export function playRound(level: number, seed: number, child: Child, carry?: Round): Play {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let round = newRound(level, numberFor(seed), carry?.eased, carry?.rightRun), taps = 0, seconds = 0, firstPieceAt = -1, mostTaps = 0, here = 0, seen = 0;
  if (opensWithLook(round)) { seconds += lookSeconds(target(round)); seen = 3; }
  for (;;) {
    if (round.stage === "piece") {
      if (firstPieceAt < 0) firstPieceAt = seconds;
      seconds += 1; round = nextPiece(round); seen = 0;
      if (opensWithLook(round)) { seconds += lookSeconds(target(round)); seen = 3; }
      continue;
    }
    if (round.stage === "end") { if (firstPieceAt < 0) firstPieceAt = seconds; return { round, taps, seconds: seconds + 1.6, firstPieceAt, mostTaps }; }
    // The eye, when stuck on a hidden digit.
    if (round.tries >= 1 && somethingHidden(round) && rng() < child.peeks) {
      const asked = look(round);
      if (asked.allowed) { round = asked.round; seconds += lookSeconds(target(round)); seen = 3; }
    }
    const visible = round.typed >= hiddenCount(round) || seen > 0;
    const knows = glows(round) || rng() < (visible ? child.copy : child.recall);
    const key = knows ? expected(round) : (expected(round) + 1 + Math.floor(rng() * 9)) % 10;
    const before = round.typed;
    round = dial(round, key).round;
    taps++; here++; seconds += child.think; if (seen > 0) seen--;
    if (round.typed !== before) { mostTaps = Math.max(mostTaps, here); here = 0; }
    if (taps > 3000) throw new Error("bot stuck");
  }
}
