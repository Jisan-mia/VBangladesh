// One run of a level: the beat clock, the taps and what they earn. Pure and deterministic; the component feeds it time
// (`advance`) and taps (`tap`) and draws what it says. It has no timers and reads no random numbers or clock.
import { starsFor } from "../../../shared/game-core";
import { levelOf } from "./levels";
import { buildPlan, COUNT_IN, lineStartOf, nextLineStart, type Plan } from "./plan";

export type Run = {
  level: number;
  plan: Plan;
  /** 0 while two beats are counted in, 1 while the ছড়া plays, 2 when it is over. */
  phase: 0 | 1 | 2;
  /** ms since the count-in began, and how many count beats have sounded (0–2). */
  countAt: number;
  counted: number;
  /** ms into the plan, and the beat that has started most recently (-1 before the first). */
  clock: number;
  index: number;
  /** The beat the child is waiting for or on: what the screen shows. */
  focus: number;
  /** 1 on every beat a tap landed on. */
  hit: Uint8Array;
  /** Taps in a row off the beat or on it: they widen and narrow the window quietly. */
  missRun: number;
  hitRun: number;
  taps: number;
  /** Taps on a beat (scored or not) and the longest run of them. */
  clapped: number;
  best: number;
  /** The beat the last tap was judged against (-1 before any). */
  judged: number;
  /** The beat length used for the count-in and the base window. */
  beatMs: number;
};

export function createRun(level: number): Run {
  const plan = buildPlan(level), spec = levelOf(level);
  return { level, plan, phase: 0, countAt: 0, counted: 0, clock: 0, index: -1, focus: 0, hit: new Uint8Array(plan.beats.length), missRun: 0, hitRun: 0, taps: 0, clapped: 0, best: 0, judged: -1, beatMs: spec.beatMs };
}

/** Three off-beat taps in a row quietly widen the window by half; five on the beat in a row narrow it a little. Never announced. */
export function windowFor(base: number, missRun: number, hitRun: number) {
  if (missRun >= 3) return Math.round(base * 1.5);
  if (hitRun >= 5) return Math.round(base * 0.85);
  return base;
}

export const TAP_FREE = 1;   // during the count-in: a drum thump and nothing else
export const TAP_ON = 2;     // landed on a beat
export const TAP_MINE = 4;   // ... and it is a beat you are scored on
export const TAP_BIG = 8;    // ... and it is a bigger beat
export const TAP_REST = 16;  // landed on a rest: nothing to hit, nothing lost
export const TAP_OFF = 32;   // between beats: a softer thump
export const TAP_OVER = 64;  // the ছড়া is over

/** A tap now. Never a penalty: the worst is a softer sound. Returns TAP_* flags; `run.focus` is the beat it was judged on. */
export function tap(run: Run): number {
  if (run.phase === 2) return TAP_OVER;
  run.taps++;
  if (run.phase === 0) return TAP_FREE;
  const { plan } = run, now = run.clock;
  let beat = run.index;
  const after = beat + 1 < plan.beats.length ? plan.at[beat + 1] - now : Infinity;
  if (beat < 0 || after < now - plan.at[beat]) beat = Math.min(plan.beats.length - 1, beat + 1);
  run.judged = beat;
  const off = Math.abs(now - plan.at[beat]);
  const window = windowFor(Math.round(plan.len[beat] * levelOf(run.level).window), run.missRun, run.hitRun);
  if (off > window) { run.missRun++; run.hitRun = 0; return TAP_OFF; }
  const spec = plan.beats[beat];
  if (spec.word < 0) return TAP_REST;
  run.missRun = 0; run.hitRun++; run.clapped++;
  run.best = Math.max(run.best, run.hitRun);
  let flags = TAP_ON;
  if (spec.mine) { run.hit[beat] = 1; flags |= TAP_MINE; }
  if (spec.big) flags |= TAP_BIG;
  return flags;
}

/** The beats you were scored on and how many a tap landed on. */
export function tally(run: Run) {
  const { beats } = run.plan;
  let hits = 0;
  for (let index = 0; index < beats.length; index++) if (run.hit[index] && beats[index].mine && beats[index].word >= 0) hits++;
  return { hits, words: run.plan.words, clapped: run.clapped, best: run.best };
}

/** Stars are a record only: one for finishing; two for a quarter of your words on the beat; three for over half. */
export function starsOf(hits: number, words: number) {
  return words ? starsFor(hits / words, 0.55, 0.25) : 1;
}

/**
 * Coming back after a pause or a blur: the child lost the beat, so two beats are counted in again, from the start of the
 * line they were in (the next line when they were on its rest). Hits already earned stay.
 */
export function rewind(run: Run) {
  if (run.phase === 2) return;
  const { plan } = run, current = Math.max(0, run.index);
  let target = lineStartOf(plan, current);
  if (run.phase === 1 && plan.beats[current].word < 0) {
    const next = nextLineStart(plan, current);
    target = next < 0 ? current : next;
  }
  run.phase = 0; run.countAt = 0; run.counted = 0;
  run.clock = plan.at[target]; run.index = target - 1; run.focus = target;
}

export const COUNT_BEATS = COUNT_IN;
