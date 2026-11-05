// A headless child for the level tests. It listens, then places notes: each note it remembers goes in the right cell,
// each one it doesn't goes in a random cell of the same beat (a copy) or anywhere (a make level). After a miss it listens
// again and fixes what it can; once the glow shows (after two misses) it places exactly the glowing cells. Seconds are a
// rough clock: listening takes the tune's length, each tap 0.9 s, each ✓ 1.2 s.
import { makeRng } from "../../../shared/game-core";
import { levelOf, worldOf } from "../lib/levels";
import { has, ROWS, rowsAt, type Tune } from "../lib/music";
import { playLength } from "../lib/play";
import { EXAMPLE } from "../lib/rules";
import { canCheck, canTap, check, createRound, hintOn, hintTune, listened, tap, type Round } from "../lib/round";

export type Child = { knows: number };
export const GUESSER: Child = { knows: 0 };
export const FIVE: Child = { knows: 0.8 };
export const LEARNER: Child = { knows: 0.95 };

export type Play = { round: Round; tries: number; taps: number; seconds: number; firstChecksAt: number };

const TAP_S = 0.9, CHECK_S = 1.2;

export function playLevel(id: number, seed: number, child: Child): Play {
  const rng = makeRng(seed ^ 0x9e3779b1);
  const spec = levelOf(id), ms = worldOf(id).ms;
  let round = createRound(id), taps = 0, seconds = 0, firstChecksAt = -1;
  const press = (step: number, row: number) => { const next = tap(round, step, row); if (next !== round) taps++; seconds += TAP_S; round = next; };
  const listen = () => { round = listened(round); seconds += ((spec.kind === "gap" ? round.given.length : playLength(round.target as Tune)) * ms) / 1000; };
  if (spec.kind !== "make") listen();
  while (!round.solved) {
    if (round.tries > 60) throw new Error("bot stuck");
    if (hintOn(round)) {
      // The glow: place exactly the glowing cells (a make level: one example tune).
      if (spec.kind === "make") { round = { ...round, guess: round.guess.map(() => 0) }; EXAMPLE[spec.rule!].forEach((mask, step) => rowsAt(mask).forEach(row => press(step, row))); }
      else {
        // The wobbling extras come off, then the glowing cells go on.
        const target = round.target as Tune;
        round.guess.forEach((mask, step) => rowsAt(mask).forEach(row => { if (!has(target, step, row) && canTap(round, step)) press(step, row); }));
        hintTune(round)!.forEach((mask, step) => rowsAt(mask).forEach(row => { if (!has(round.guess, step, row)) press(step, row); }));
      }
    } else if (spec.kind === "make") {
      const p = 1 - (1 - child.knows) ** (round.tries + 1);
      round = { ...round, guess: round.guess.map(() => 0) };
      const good = rng() < p;
      const rows: [number, number][] = spec.rule === "rising" ? (good ? [[0, 0], [1, 1], [2, 2], [3, 3]] : [[0, 2], [1, 2], [2, 1], [3, 0]])
        : spec.rule === "hill" ? (good ? [[0, 0], [1, 2], [2, 4], [3, 2], [4, 0]] : [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]])
          : (good ? [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 2]] : [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]);
      rows.forEach(([step, row]) => press(step, row));
    } else {
      const target = round.target as Tune;
      for (let step = 0; step < target.length; step++) {
        if (!canTap(round, step)) continue;
        // wrong extras it can see wobble: it removes them with the child's memory
        for (const row of rowsAt(round.guess[step])) if (!has(target, step, row) && rng() < child.knows) press(step, row);
        for (const row of rowsAt(target[step])) {
          if (has(round.guess, step, row)) continue;
          if (rng() < child.knows) press(step, row);
          else { const wrong = (row + 1 + Math.floor(rng() * (ROWS - 1))) % ROWS; if (!has(round.guess, step, wrong)) press(step, wrong); }
        }
      }
    }
    if (!canCheck(round)) { round = tap(round, 0, 0); taps++; }
    seconds += CHECK_S;
    if (firstChecksAt < 0) firstChecksAt = seconds;
    round = check(round);
    if (!round.solved && spec.kind !== "make") listen();
  }
  return { round, tries: round.tries, taps, seconds, firstChecksAt };
}
