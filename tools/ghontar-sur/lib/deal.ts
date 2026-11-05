// What a level (or an endless run) is made of: the spec, the tune, and the timings of every note. Pure.
import { MAX_LEN, legacyBeat } from "./legacy";
import { LEVEL_COUNT, WORLDS, levelAt, worldOf, type Spec } from "./levels";
import { beatsOf, endlessTune, makeTune, writtenTune, type Tune } from "./tune";

export type Mode = "ladder" | "endless";
/** v 1: an endless run (every link before the rewrite); v 2: a level of the ladder. */
export type Deal = { mode: Mode; level: number; seed: number; spec: Spec; tune: Tune; beats: readonly number[]; finale: boolean; v: 1 | 2 };

/** The endless run: four bells, the tune grows by a note a round, the third mistake ends it. */
export const ENDLESS_SPEC: Spec = { bells: 4, beat: 0, phrases: MAX_LEN, size: 1, rests: 0, repeat: false, rhythm: false, reverse: false, hearts: 3 };

/** A level of the ladder for a seed. A finale's tune is written, so only its seed (the link) differs. */
export function makeDeal(level: number, seed: number): Deal {
  const spec = levelAt(level), tune = spec.written ? writtenTune(spec.written) : makeTune(spec, (Math.imul(seed, 31) + level) >>> 0);
  return { mode: "ladder", level, seed, spec, tune, beats: beatsOf(tune.notes), finale: spec.written !== undefined, v: 2 };
}

export function makeEndless(seed: number): Deal {
  const tune = endlessTune(seed, MAX_LEN);
  return { mode: "endless", level: 0, seed, spec: ENDLESS_SPEC, tune, beats: beatsOf(tune.notes), finale: false, v: 1 };
}

export const roundCount = (deal: Deal) => deal.tune.ends.length;
export const roundLen = (deal: Deal, round: number) => deal.tune.ends[Math.min(round, deal.tune.ends.length - 1)];
export const isFinaleDeal = (deal: Deal) => deal.finale;
export const worldOfDeal = (deal: Deal) => deal.mode === "ladder" ? worldOf(deal.level) : 0;
export const finaleOf = (deal: Deal) => isFinaleDeal(deal) ? WORLDS[worldOf(deal.level)].finale : "";

/** ms between beats in a round's call. `scale` stretches it (ধীরে খেলো). */
export function beatMs(deal: Deal, round: number, scale: number) {
  return (deal.mode === "endless" ? legacyBeat(roundLen(deal, round)) : deal.spec.beat) * scale;
}
/** How long a note's light lasts. */
export const onMs = (beat: number) => Math.round(beat * 0.58);
/** The quiet after the last note of a call before your turn. */
export const TAIL = 320;

/** How long a call of `len` notes takes. */
export function callMs(deal: Deal, len: number, beat: number) {
  return deal.beats[len - 1] * beat + onMs(beat) + TAIL;
}

/** The bell you must play as your `index`-th tap of a round (the call backwards on reverse levels). */
export function answerBell(deal: Deal, round: number, index: number) {
  const len = roundLen(deal, round);
  return deal.tune.notes[deal.spec.reverse ? len - 1 - index : index].bell;
}

/** The ladder's final level of a world and every level: how many levels there are, for links. */
export { LEVEL_COUNT };
