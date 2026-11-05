// A headless player for the difficulty tests. It listens to a round, and then plays it back whole with a chance that
// falls as the tune it must hold grows (more new notes, reversed, faster, more bells, a tal to keep). A slip happens at a
// random note; the call plays again and each extra hearing makes the next try likelier. Its tal wobbles like a hand's.
// Seeded, so the rates are exact. The clock is the reducer's own: it drives lib/run.ts with simulated ms.
import { makeRng, pick } from "../../../shared/game-core";
import { answerBell, beatMs, roundLen, type Deal } from "../lib/deal";
import { TIMING, begin, ready, tap, tick, type Run } from "../lib/run";
import { starsOf } from "../lib/score";

/** `span` notes held with an even chance, `width` how fast the chance falls off, `wobble` the share of a gap its tal drifts by, `start` ms from the call's end to the first tap. */
export type Skill = { span: number; width: number; wobble: number; start: number };
export const PLAYERS = {
  casual: { span: 5.2, width: 1.3, wobble: 0.15, start: 900 },
  steady: { span: 7.6, width: 1.5, wobble: 0.1, start: 650 },
  strong: { span: 10.6, width: 1.8, wobble: 0.06, start: 450 },
} as const satisfies Record<string, Skill>;

/** How hard a round is to hold in mind: new notes count in full, the notes already known for 0.4; a written finale is a tune with a shape, which is easier to hold. */
export function load(deal: Deal, round: number) {
  const len = roundLen(deal, round), known = round > 0 ? roundLen(deal, round - 1) : 0, { spec } = deal;
  if (deal.mode === "endless") return len * 0.9;
  const beat = spec.beat;
  return (len - known + known * 0.4) * (deal.finale ? 0.9 : 1) * (spec.reverse ? 1.4 : 1) * (beat < 600 ? 1.12 : 1) * (spec.bells >= 5 ? 1.1 : spec.bells <= 3 ? 0.9 : 1)
    * (spec.rhythm ? 1.15 : 1) * (spec.repeat ? 1.05 : 1);
}
const recall = (skill: Skill, effective: number) => 1 / (1 + Math.exp((effective - skill.span) / skill.width));
const gauss = (rng: () => number) => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

export type Played = { run: Run; stars: number; ms: number; calls: number };

/** Plays one deal start to finish and returns where it ended. */
export function play(deal: Deal, skill: Skill, seed: number): Played {
  const rng = makeRng(seed), T = TIMING;
  let t = 0, run = begin(ready(), deal, 0, T), base = -1, tries = 0, guard = 0;
  while (run.phase !== "over" && guard++ < 5000) {
    for (let inner = 0; run.phase !== "answer" && run.phase !== "over"; inner++) {
      if (inner > 50) throw new Error(`stuck in ${run.phase} ${JSON.stringify(run)}`);
      if (run.phase === "encore") { run = { ...run, phase: "over" }; break; }
      t = run.since + run.dur + 0.01;
      run = tick(run, deal, t, T);
    }
    if (run.phase === "over") break;
    if (run.round !== base) { base = run.round; tries = 0; }
    tries++;
    const len = roundLen(deal, run.round), p = 1 - (1 - recall(skill, load(deal, run.round))) ** tries;
    const failAt = rng() < p ? -1 : pick(rng, len), beat = beatMs(deal, run.round, T.scale);
    t += skill.start;
    for (let index = 0; index < len; index++) {
      let bell = answerBell(deal, run.round, index);
      if (index === failAt) bell = (bell + 1 + pick(rng, deal.spec.bells - 1)) % deal.spec.bells;
      if (index > 0) {
        const gap = deal.spec.reverse ? 1 : deal.tune.notes[index - 1].gap;
        t += gap * beat * (1 + gauss(rng) * skill.wobble * (gap > 1 ? 1.4 : 1));
      }
      const result = tap(run, deal, bell, t, T);
      run = result.run;
      if (result.kind !== "right") break;
    }
  }
  return { run, stars: starsOf(deal, run), ms: t, calls: run.heard };
}
