// The old rules (lib/rope.ts before the rewrite), kept only so tests prove the old ladder replays exactly.
// The tug-of-war rules: a beat clock, tap judging and the rope's slide. Pure (no DOM): the page and the tests step the same code.
// Time is in ms on the match clock, where beat k falls at k × period. Taps are judged by their own timestamp against that
// clock, never by which frame they landed in, so a slow phone that drops frames still judges a tap fairly.
import { makeRng, starsFor } from "../../../../shared/game-core";
import { teamOf, DUO_BPM } from "./teams";

/** Beats of "৩ ২ ১" before pulls count (at the start and after a pause). */
export const COUNT_IN = 3;
/** A match ends after this many pulling beats; then the side the ribbon leans to wins. */
export const MAX_BEATS = 60;
/** Slow mode: the drum at 80% speed and wider windows. */
export const SLOW_TEMPO = 0.8;
export const SLOW_WINDOW = 1.25;
/**
 * The tap windows around a beat, in ms. Late is wider on purpose: on cheap phones the drum reaches the ear 50–150 ms late,
 * so people tap a little after the visual beat.
 */
export const WINDOW = { early: 150, late: 200, perfectEarly: 80, perfectLate: 110 } as const;
/** Pull strength by grade. A tap off the beat (or a second tap on the same beat) slips the rope back a little. */
export const PULL = { perfect: 1, good: 0.6, slip: -0.2 } as const;
/** How far one full pull slides the ribbon, as a share of the distance from the middle to a line. */
export const STEP = 0.1;
/** Per second: a pull's slide settles in about half a second. */
const DAMP = 7;
const COMBO_BONUS = 0.06, COMBO_CAP = 5;

export type Side = 0 | 1;
/** `early`: during the count-in, ignored. `off`: outside the window. `extra`: the beat was already pulled. */
export type Grade = "perfect" | "good" | "off" | "extra" | "early" | "none";

export type Puller = {
  combo: number; best: number;
  /** The last beat this side pulled on. */
  claimed: number;
  perfect: number; good: number; slips: number; missed: number;
  /** 1 right after a pull, easing back to 0: the team leaning back on the rope. */
  lean: number;
  /** The last tap's grade and when it came (match ms), for the feedback word. */
  grade: Grade; gradeAt: number;
};

export type Match = {
  level: number; period: number; slow: boolean; bot: boolean;
  rng: () => number;
  /** Where the ribbon is: 0 is the middle, 1 is side 0's line (bottom, us), -1 is side 1's line. */
  x: number; v: number;
  sides: [Puller, Puller];
  /** The first beat whose pulls count. */
  playFrom: number;
  /** The next beat the bot pulls on, and the next beat whose window is still to close. */
  botNext: number; closeNext: number;
  /** Pulling beats so far: the score is how many it took to win. */
  beats: number;
  now: number;
  winner: Side | -1 | null;
};

const puller = (): Puller => ({ combo: 0, best: 0, claimed: -1, perfect: 0, good: 0, slips: 0, missed: 0, lean: 0, grade: "none", gradeAt: -1e9 });

/** Beat length in ms for a level (or the two-player tempo when `level` is 0). */
export function periodOf(level: number, slow: boolean) {
  const bpm = level === 0 ? DUO_BPM : teamOf(level).bpm;
  return 60000 / (bpm * (slow ? SLOW_TEMPO : 1));
}

export const windowOf = (slow: boolean) => {
  const k = slow ? SLOW_WINDOW : 1;
  return { early: WINDOW.early * k, late: WINDOW.late * k, perfectEarly: WINDOW.perfectEarly * k, perfectLate: WINDOW.perfectLate * k };
};

/** A fresh match. Level 0 is two players on one phone (no bot). The seed decides every bot pull, so a link replays the same team. */
export function makeMatch(level: number, seed: number, slow = false): Match {
  return {
    level, period: periodOf(level, slow), slow, bot: level > 0, rng: makeRng(seed),
    x: 0, v: 0, sides: [puller(), puller()], playFrom: COUNT_IN, botNext: COUNT_IN, closeNext: 0, beats: 0, now: -1, winner: null,
  };
}

/** The beat a tap at `t` belongs to, and how far off it is (negative = early). The window leans late, so the split does too. */
export function nearestBeat(t: number, period: number, slow = false) {
  const w = windowOf(slow), lag = (w.late - w.early) / 2;
  const beat = Math.round((t - lag) / period);
  return { beat, offset: t - beat * period };
}

export function judge(offset: number, slow = false): "perfect" | "good" | "off" {
  const w = windowOf(slow);
  if (offset >= -w.perfectEarly && offset <= w.perfectLate) return "perfect";
  if (offset >= -w.early && offset <= w.late) return "good";
  return "off";
}

function pull(match: Match, side: Side, grade: "perfect" | "good", weight = 1) {
  const p = match.sides[side];
  const strength = PULL[grade] * weight * (1 + COMBO_BONUS * Math.min(p.combo, COMBO_CAP));
  p.combo++; p.best = Math.max(p.best, p.combo);
  if (grade === "perfect") p.perfect++; else p.good++;
  p.lean = 1;
  match.v += (side === 0 ? 1 : -1) * strength * STEP * DAMP;
}

function slip(match: Match, side: Side) {
  const p = match.sides[side];
  p.combo = 0; p.slips++;
  match.v -= (side === 0 ? 1 : -1) * -PULL.slip * STEP * DAMP;
}

/** A player's tap at match time `t`. One pull per beat: the first tap in a beat's window pulls, anything else slips. */
export function tap(match: Match, side: Side, t: number): Grade {
  if (match.winner !== null) return "none";
  const p = match.sides[side];
  const { beat, offset } = nearestBeat(t, match.period, match.slow);
  let grade: Grade;
  if (beat < match.playFrom) grade = "early";
  else {
    const verdict = judge(offset, match.slow);
    if (verdict === "off") { grade = "off"; slip(match, side); }
    else if (p.claimed >= beat) { grade = "extra"; slip(match, side); }
    else { grade = verdict; p.claimed = beat; pull(match, side, verdict); }
  }
  p.grade = grade; p.gradeAt = t;
  return grade;
}

/** Moves the match clock to `t`: the bot pulls on its beats, unpulled beats break combos, the rope slides, and the match may end. */
export function update(match: Match, t: number) {
  if (match.winner !== null) return;
  const { period } = match, late = windowOf(match.slow).late;
  if (match.now < 0 && t >= 0) match.now = 0;
  // The slide is integrated exactly, so a long frame on a slow phone moves the rope just as far as many short ones.
  const dt = Math.max(0, (t - match.now) / 1000);
  match.now = t;

  while (match.bot && match.botNext * period <= t) {
    const team = teamOf(match.level), roll = match.rng();
    // The team pulls a beat it hits; a beat it misses breaks its combo.
    if (roll < team.perfect) pull(match, 1, "perfect", team.weight);
    else if (roll < team.perfect + team.good) pull(match, 1, "good", team.weight);
    else match.sides[1].combo = 0;
    match.botNext++;
  }
  while (match.closeNext * period + late < t) {
    const beat = match.closeNext;
    if (beat >= match.playFrom) {
      match.beats++;
      for (let side = 0; side < (match.bot ? 1 : 2); side++) {
        const p = match.sides[side];
        if (p.claimed < beat) { p.combo = 0; p.missed++; }
      }
    }
    match.closeNext++;
  }

  const decay = Math.exp(-DAMP * dt);
  match.x += match.v * (1 - decay) / DAMP;
  match.v *= decay;
  for (const p of match.sides) p.lean *= Math.exp(-5 * dt);

  if (match.x >= 1) { match.x = 1; match.winner = 0; }
  else if (match.x <= -1) { match.x = -1; match.winner = 1; }
  else if (match.beats >= MAX_BEATS) match.winner = match.x > 0.02 ? 0 : match.x < -0.02 ? 1 : -1;
  // Beats already struck whose windows are still open count too (the win usually lands on one).
  if (match.winner !== null && Math.abs(match.x) >= 1) for (let beat = Math.max(match.closeNext, match.playFrom); beat * period <= t; beat++) match.beats++;
}

/** After a pause the clock carries on from `t`, but with a fresh "৩ ২ ১" so nobody has to find the beat cold. */
export function resume(match: Match, t: number) {
  const next = Math.ceil(t / match.period);
  match.playFrom = Math.max(match.playFrom, next + COUNT_IN);
  match.botNext = Math.max(match.botNext, match.playFrom);
  match.closeNext = Math.max(match.closeNext, next);
  match.now = t;
  for (const p of match.sides) { p.combo = 0; p.claimed = Math.max(p.claimed, next - 1); }
}

/** "৩", "২", "১" during a count-in (as 3, 2, 1), else 0. */
export function countIn(match: Match, t: number) {
  const beat = Math.floor(t / match.period);
  if (t < 0) return COUNT_IN;
  return beat < match.playFrom ? match.playFrom - beat : 0;
}

/** Where the beat is: 0 right on it, rising to 1 just before the next one. */
export const beatPhase = (t: number, period: number) => ((t % period) + period) % period / period;

/** Stars for a solo win in `beats` beats on a level. */
export const starsOf = (level: number, beats: number) => starsFor(beats, teamOf(level).three, teamOf(level).two, true);

/** On-beat pulls for a side (both perfect and a little off). */
export const hitsOf = (p: Puller) => p.perfect + p.good;
