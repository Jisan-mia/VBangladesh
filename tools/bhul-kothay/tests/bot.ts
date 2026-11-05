// A headless player for tuning and asserting each level's star times. It searches the way a person does: one place at a
// time, so each find takes about the average effort of what's left (big, bold, still things in daylight are quicker, and the
// easy ones tend to go first). It taps with a reaction delay and aim error, and sometimes taps where nothing differs.
import { makeRng } from "../../../shared/game-core";
import { makePuzzle, type Puzzle } from "../lib/puzzle";
import { isDone, newRound, tapRound, timeOf } from "../lib/round";

export type Skill = { name: string; speed: number; reaction: number; aim: number; falseTap: number; scan: number };
/** Someone who plays now and then: slower eye, a loose thumb, a false tap after every fourth find or so. */
export const CASUAL: Skill = { name: "casual", speed: 1, reaction: 0.35, aim: 6, falseTap: 0.22, scan: 1.2 };
/** A sharp eye and a steady thumb. */
export const SHARP: Skill = { name: "sharp", speed: 0.62, reaction: 0.25, aim: 3, falseTap: 0.06, scan: 0.7 };

function gauss(rng: () => number) {
  const u = Math.max(1e-9, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Plays one level to the end; returns the time that earns stars (clock + hint seconds) and the wrong taps. */
export function play(puzzle: Puzzle, skill: Skill, seed: number) {
  const rng = makeRng(seed);
  let round = newRound(puzzle.stage.dark), clock = 0, taps = 0;
  while (!isDone(round, puzzle) && taps++ < 200) {
    const left = puzzle.diffs.map((diff, index) => ({ diff, index })).filter(({ index }) => !round.found.includes(index));
    // The next find takes about the average effort of what's left (a person scans one place at a time), with a gamma(2) spread;
    // which one it is goes by how easy each is.
    const rates = left.map(({ diff }) => 1 / (diff.effort * skill.speed)), total = rates.reduce((sum, rate) => sum + rate, 0);
    const mean = left.reduce((sum, { diff }) => sum + diff.effort * skill.speed, 0) / left.length;
    clock += (-Math.log(Math.max(1e-9, rng())) - Math.log(Math.max(1e-9, rng()))) * mean / 2 + skill.reaction;
    let roll = rng() * total, chosen = left[0];
    for (let at = 0; at < left.length; at++) { roll -= rates[at]; if (roll <= 0) { chosen = left[at]; break; } }
    const { region } = chosen.diff, cx = region.x + region.w / 2, cy = region.y + region.h / 2;
    if (round.lamp && Math.hypot(cx - round.lamp.x, cy - round.lamp.y) > 40) {
      clock += skill.scan;
      round = tapRound(round, puzzle, cx, cy, clock).round;
    }
    if (rng() < skill.falseTap) { round = { ...round, wrong: round.wrong + 1, streak: 0 }; clock += skill.reaction; }
    for (let tries = 0; tries < 4 && !round.found.includes(chosen.index); tries++) {
      const x = cx + gauss(rng) * skill.aim, y = cy + gauss(rng) * skill.aim;
      round = tapRound(round, puzzle, x, y, clock).round;
      clock += 0.15;
    }
  }
  return { time: timeOf(round, clock), clock, wrong: round.wrong, done: isDone(round, puzzle) };
}

/** Plays a level over many seeds (fresh pictures each time, as replays are); returns every result. */
export function sample(level: number, skill: Skill, runs: number, from = 1) {
  const out: ReturnType<typeof play>[] = [];
  for (let run = 0; run < runs; run++) {
    const seed = from + run * 104_729;
    out.push(play(makePuzzle(level, seed), skill, seed ^ 0x5bd1e995));
  }
  return out;
}
