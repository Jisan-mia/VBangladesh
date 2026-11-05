// Headless players. A bot sees the foam late (its reaction time), guesses where it will be from the last 0.15 s, and lets go when
// the guess reaches its aim. Under a lid it sees the foam only roughly. Some aims are cautious, some bold.
import { makeRng } from "../../../shared/game-core";
import { averageOf, starsOf, type Mode } from "../lib/levels";
import { newRound, liftPot, startPot, SLOW, type Round } from "../lib/round";
import { stepRound } from "../lib/step.hot";
import { MODE_INFO } from "../lib/levels";

export type Skill = {
  name: string;
  /** Seconds between the foam and the bot seeing it. */
  delay: number;
  /** Where it means to let go (share of the rim), and the spread of that from pot to pot. */
  aim: number; aimSd: number;
  /** How well it reads the foam under a lid. */
  blind: number;
  /** Seconds before it presses on a waiting pot. */
  start: number;
};
export const CASUAL: Skill = { name: "casual", delay: 0.35, aim: 0.82, aimSd: 0.065, blind: 0.08, start: 0.55 };
export const SKILLED: Skill = { name: "skilled", delay: 0.25, aim: 0.9, aimSd: 0.03, blind: 0.045, start: 0.4 };
export const RANDOM_TAP: Skill = { name: "random", delay: 0.3, aim: 0.5, aimSd: 0.4, blind: 0.2, start: 0.5 };

const DT = 1 / 60;

export type Played = { round: Round; seconds: number; average: number; spills: number; stars: number };

export function play(seed: number, level: number, skill: Skill, options: { mode?: Mode; slow?: boolean; botSeed?: number; old?: boolean } = {}): Played {
  const mode = options.mode ?? "n", slow = options.slow ?? false, rng = makeRng((options.botSeed ?? seed) * 2 + 1);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const round = newRound(seed, level, mode, options.old ?? false);
  const rate = MODE_INFO[mode].rate * (slow ? SLOW : 1), ripple = MODE_INFO[mode].ripple * (slow ? 0.5 : 1);
  const history: number[] = [];
  const lag = Math.round(skill.delay / DT), back = Math.round(0.15 / DT);
  let aim = 0, idle = 0, steps = 0, noise = 0;
  while (round.phase !== "over" && steps < 60 * 200) {
    steps++;
    if (round.phase === "waiting") {
      idle += DT;
      if (idle >= skill.start) { startPot(round); idle = 0; history.length = 0; aim = Math.max(0.5, Math.min(0.97, skill.aim + skill.aimSd * gauss())); }
    }
    stepRound(round, DT, rate, ripple);
    if (round.phase === "rising") {
      history.push(round.foam);
      if (round.pots[round.index].lid && history.length % 12 === 0) noise = skill.blind * gauss();
      const now = history.length - 1, seen = history[Math.max(0, now - lag)], earlier = history[Math.max(0, now - lag - back)];
      const guess = (round.pots[round.index].lid ? seen + noise : seen) + (seen - earlier) / 0.15 * skill.delay * 0.8;
      if (now >= lag && guess >= aim) liftPot(round);
    }
  }
  const average = round.old ? Math.round(round.scores.reduce((sum, score) => sum + score, 0) / round.scores.length) : averageOf(level, round.scores);
  return { round, seconds: steps * DT, average, spills: round.spills.filter(Boolean).length, stars: starsOf(average, mode, slow) };
}

export function rates(level: number, skill: Skill, options: { mode?: Mode; slow?: boolean; seeds?: number } = {}) {
  const seeds = options.seeds ?? 120, seconds: number[] = [];
  let clear = 0, three = 0, twoUp = 0, spills = 0, pots = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const result = play(seed * 7919 + level, level, skill, options);
    seconds.push(result.seconds);
    if (result.stars >= 1) clear++;
    if (result.stars >= 2) twoUp++;
    if (result.stars >= 3) three++;
    spills += result.spills; pots += result.round.pots.length;
  }
  seconds.sort((a, b) => a - b);
  return { clear: clear / seeds, twoUp: twoUp / seeds, three: three / seeds, spill: spills / pots, median: seconds[Math.floor(seconds.length / 2)] };
}
