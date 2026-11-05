// Headless players for tuning the ladder. Each one reads the orchard the way a person does: one deduction at a time (the
// solver's next step), with thinking time by how hard the step is, a tap time per bush, and now and then a careless tap on a
// covered bush beside the cleared ground. It plays through lib/play.ts, so the rules it meets are the game's own.
import { makeRng } from "../../../shared/game-core";
import { deduce, MANGO, type Step } from "../lib/orchard";
import { dig, enter, newRound, puzzleOf, starsEarned, takeHint, tie, COVERED, OPEN, STUNG, TIED, type Round } from "../lib/play";

export type Skill = {
  name: string;
  /** Seconds to see the first opening, and to spot each kind of step: [least, most]. */
  look: [number, number];
  single: [number, number];
  pair: [number, number];
  total: [number, number];
  /** Seconds per tap (a long press for a গামছা costs `tieExtra` more). */
  tap: [number, number];
  tieExtra: number;
  /** Chance a step goes wrong: a tap on a random covered bush next to the step's clue instead. */
  slip: number;
  /** Uses chords (one tap on a finished number) instead of tapping each freed bush. */
  chord: boolean;
};

export const CASUAL: Skill = { name: "casual", look: [1.2, 2.2], single: [0.7, 1.6], pair: [3, 7], total: [3, 6], tap: [0.35, 0.6], tieExtra: 0.45, slip: 0.03, chord: false };
export const STEADY: Skill = { name: "steady", look: [0.8, 1.4], single: [0.5, 1.1], pair: [2, 4.5], total: [2, 4], tap: [0.3, 0.5], tieExtra: 0.4, slip: 0.012, chord: true };
export const SHARP: Skill = { name: "sharp", look: [0.5, 0.9], single: [0.3, 0.7], pair: [1.2, 2.6], total: [1.2, 2.4], tap: [0.25, 0.4], tieExtra: 0.4, slip: 0, chord: true };

export type Run = { won: boolean; seconds: number; stings: number; hints: number; stars: number; firstWin: number };

const between = (rng: () => number, [low, high]: [number, number]) => low + rng() * (high - low);

/** What the bot trusts: its own cleared bushes as safe, its ties and stings as nests (it ties only what it proved). */
function knownOf(round: Round) {
  const known = new Uint8Array(round.cells.length);
  for (let cell = 0; cell < known.length; cell++) {
    const state = round.cells[cell];
    if (state === OPEN) known[cell] = 1; else if (state === TIED || state === STUNG) known[cell] = 2;
  }
  return known;
}

export function playOnce(level: number, seed: number, skill: Skill, botSeed = seed): Run {
  const rng = makeRng((botSeed ^ 0x5bd1e995) >>> 0 || 1), puzzle = puzzleOf(level, seed)!;
  let round = enter(newRound(puzzle))!.round, seconds = between(rng, skill.look), guard = 0;
  const finish = (): Run => ({ won: round.status === "won", seconds, stings: round.stings, hints: round.hints, stars: round.status === "won" ? starsEarned(Math.round(seconds), round.hints, round.stings, puzzle.par) : 0, firstWin: seconds });
  while (round.status === "playing" && guard++ < 2000) {
    const step: Step | null = deduce(puzzle.orchard, knownOf(round));
    if (!step) {
      const move = takeHint(round);
      if (!move) break;
      seconds += 4 + between(rng, skill.tap);
      round = move.round;
      continue;
    }
    seconds += between(rng, step.via === "single" ? skill.single : step.via === "pair" ? skill.pair : skill.total);
    if (rng() < skill.slip && step.clues.length) {
      // A careless tap: any covered bush the clue watches, safe or not.
      const o = puzzle.orchard, clue = step.clues[0], around: number[] = [];
      for (let cell = 0; cell < round.cells.length; cell++) if (round.cells[cell] === COVERED && Math.abs((cell % o.cols) - (clue % o.cols)) <= 1 && Math.abs(Math.floor(cell / o.cols) - Math.floor(clue / o.cols)) <= 1) around.push(cell);
      if (around.length) {
        seconds += between(rng, skill.tap);
        const move = dig(round, around[Math.floor(rng() * around.length)]);
        if (move) { round = move.round; continue; }
      }
    }
    if (!step.safe) {
      for (const cell of step.cells) { seconds += between(rng, skill.tap) + skill.tieExtra; round = tie(round, cell) ?? round; }
      continue;
    }
    const clue = step.clues.length === 1 ? step.clues[0] : -1;
    if (skill.chord && clue >= 0 && step.via === "single" && round.cells[clue] === OPEN && puzzle.orchard.kind[clue] !== MANGO && puzzle.orchard.count[clue] > 0) {
      const move = dig(round, clue);
      if (move) { seconds += between(rng, skill.tap); round = move.round; continue; }
    }
    for (const cell of step.cells) {
      if (round.cells[cell] !== COVERED || round.status !== "playing") continue;
      seconds += between(rng, skill.tap);
      const move = dig(round, cell);
      if (move) round = move.round;
    }
  }
  return finish();
}

/** Over `seeds` seeds: the share of runs won, won at ★★★, won at ★★ or better, and the median seconds of the wins. */
export function rates(level: number, skill: Skill, seeds = 120, from = 1) {
  let won = 0, three = 0, two = 0;
  const times: number[] = [];
  for (let k = 0; k < seeds; k++) {
    const run = playOnce(level, from + k * 7919, skill, 31 + k);
    if (!run.won) continue;
    won++; times.push(run.seconds);
    if (run.stars === 3) three++;
    if (run.stars >= 2) two++;
  }
  times.sort((a, b) => a - b);
  return { won: won / seeds, three: three / seeds, two: two / seeds, median: times.length ? times[Math.floor(times.length / 2)] : Infinity };
}
