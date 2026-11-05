// Headless players for tuning: they tap the way a child or a grown-up would, with a late or early hand, a missed beat now and
// then, and some taps that are not on any beat. Deterministic (makeRng), so a rate asserted in a test is the same everywhere.
import { makeRng } from "../../../shared/game-core";
import { createRun, starsOf, tally, tap, TAP_MINE, TAP_ON, type Run } from "../lib/run";
import { advance, EV_END } from "../lib/tick.hot";

export type Player = {
  /** Share of beats the player tries to tap. */
  attend: number;
  /** Where the tap lands against the beat: mean (ms, positive is late) and spread. */
  late: number;
  spread: number;
  /** Extra taps between beats, per beat. */
  extra: number;
};

export const RANDOM: Player = { attend: 0, late: 0, spread: 0, extra: 2.2 };
export const TODDLER: Player = { attend: 0.62, late: 60, spread: 170, extra: 0.25 };
export const CHILD: Player = { attend: 0.85, late: 40, spread: 110, extra: 0.1 };
export const STEADY: Player = { attend: 0.97, late: 20, spread: 70, extra: 0.03 };

export type Played = { run: Run; hits: number; words: number; stars: number; ms: number; onBeat: number; firstOnBeatMs: number };

const gauss = (rng: () => number) => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

/** Plays a whole level at 60 steps a second and returns what it earned. */
export function playLevel(level: number, player: Player, seed: number): Played {
  const rng = makeRng(seed), run = createRun(level), { plan } = run;
  const times: number[] = [];
  plan.beats.forEach((_, index) => { if (rng() < player.attend) times.push(plan.at[index] + player.late + gauss(rng) * player.spread); });
  const extras = Math.round(player.extra * plan.beats.length);
  for (let n = 0; n < extras; n++) times.push(rng() * plan.total);
  times.sort((a, b) => a - b);
  let next = 0, steps = 0, onBeat = 0, firstOnBeat = -1;
  while (run.phase !== 2 && steps < 60 * 200) {
    steps++;
    const events = advance(run, 1000 / 60);
    if (run.phase === 1) while (next < times.length && times[next] <= run.clock) { if (tap(run) & TAP_ON) { onBeat++; if (firstOnBeat < 0) firstOnBeat = steps * 1000 / 60; } next++; }
    if (events & EV_END) break;
  }
  const result = tally(run);
  return { run, hits: result.hits, words: result.words, stars: starsOf(result.hits, result.words), ms: steps * 1000 / 60, onBeat, firstOnBeatMs: firstOnBeat };
}

/** The share of seeds on which a player reaches at least `stars`. */
export function rate(level: number, player: Player, stars: number, seeds = 120) {
  let reached = 0;
  for (let seed = 1; seed <= seeds; seed++) if (playLevel(level, player, seed).stars >= stars) reached++;
  return reached / seeds;
}

export { TAP_MINE };
