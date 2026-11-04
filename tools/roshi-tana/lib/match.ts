// The tug-of-war rules: a beat clock, tap judging and the rope's slide. Pure (no DOM): the page and the tests step the same code.
// Time is in ms on the match clock. Beat k falls at beatTime(m, k), which follows the level's tempo changes. Taps are judged by
// their own timestamp against that clock, never by which frame they landed in, so a slow phone that drops frames judges fairly.
// The clock only moves when step.hot.ts advances it, and the page advances it only while the game is on screen and focused.
// With every new feature off (the old ladder), these rules are the old lib/rope.ts exactly, so old links replay the same.
import { makeRng } from "../../../shared/game-core";
import { DUO_BPM, levelDef, MODE_INFO, type LevelDef, type Mode } from "./levels";

/** Beats of "৩ ২ ১" before pulls count (at the start and after every pause). */
export const COUNT_IN = 3;
/** A match ends after this many pulling beats; then the side the ribbon leans to wins. */
export const MAX_BEATS = 60;
/** ধীরে খেলো: the drum at 80% speed. The windows stay the same in ms, so stars are no easier. */
export const SLOW_TEMPO = 0.8;
/**
 * The tap windows around a beat, in ms. Late is wider on purpose: on cheap phones the drum reaches the ear 50–150 ms late,
 * so people tap a little after the visual beat.
 */
export const WINDOW = { early: 150, late: 200, perfectEarly: 80, perfectLate: 110 } as const;
/** Pull strength by grade. A tap off the beat (or a second tap on the same beat) slips the rope back a little: `slip` on the old ladder, the level's own `slip` on the new one. */
export const PULL = { perfect: 1, good: 0.6, slip: -0.2 } as const;
/** A বড় ঢোল multiplies your pull by this (right on it) or by the second (a little off). */
export const ACCENT = { perfect: 2, good: 1.3 } as const;
/** How far one full pull slides the ribbon, as a share of the distance from the middle to a line. */
export const STEP = 0.1;
/** Per second: a pull's slide settles in about half a second. */
export const DAMP = 7;
const COMBO_BONUS = 0.06, COMBO_CAP = 5;

/** What a beat is: the count-in, a plain beat, a বড় ঢোল, a rest. Flags on top: the drum is quiet, a heave beat, a heave warning. */
export const COUNT = 0, BEAT = 1, BIG = 2, REST = 3;
export const KIND = 3, QUIET = 4, HEAVE = 8, WARN = 16;

export type Side = 0 | 1;
/** `early`: during the count-in, ignored. `off`: outside the window. `extra`: the beat was already pulled. `rest`: a tap on a rest. */
export type Grade = "perfect" | "good" | "off" | "extra" | "rest" | "early" | "none";

export type Puller = {
  combo: number; best: number;
  /** The last beat this side pulled on, and the last it pulled right on. */
  claimed: number; nailed: number;
  perfect: number; good: number; slips: number; missed: number; bigs: number;
  /** Rests left alone, and taps on a rest. */
  rested: number; wrongRests: number;
  /** 1 right after a pull, easing back to 0: the team leaning back on the rope. */
  lean: number;
  /** The last tap's grade, its beat's kind and when it came (match ms), for the feedback on the drum. */
  grade: Grade; gradeKind: number; gradeAt: number;
};

export type Window = { early: number; late: number; perfectEarly: number; perfectLate: number };

export type Match = {
  level: number; old: boolean; mode: Mode; def: LevelDef; seed: number;
  slow: boolean; bot: boolean;
  rng: () => number;
  win: Window; rival: number;
  /** Tempo segments: segment i starts at beat segAt[i], at time segT[i], with beats segP[i] ms apart. */
  segAt: Float64Array; segT: Float64Array; segP: Float64Array; segs: number;
  /** Where the ribbon is: 0 is the middle, 1 is side 0's line (bottom, us), -1 is side 1's line. */
  x: number; v: number;
  sides: [Puller, Puller];
  /** The first beat whose pulls count (moves on after a pause). */
  playFrom: number;
  /** The next beat the bot pulls on, and the next beat whose window is still to close. */
  botNext: number; closeNext: number;
  /** Pulling beats so far: the score is how many it took to win. */
  beats: number;
  now: number;
  winner: Side | -1 | null;
  /** Heave beats faced and held, and 1 right after a heave pull or a held one, easing to 0 (for the rope and the crowd). */
  heaves: number; held: number; heave: number; hold: number;
  /** The heave beat whose extra pull is on the rope and can still be held back by a tap right on it, and that pull. */
  heaveBeat: number; heaveAmt: number;
};

const puller = (): Puller => ({ combo: 0, best: 0, claimed: -1, nailed: -1, perfect: 0, good: 0, slips: 0, missed: 0, rested: 0, wrongRests: 0, bigs: 0, lean: 0, grade: "none", gradeKind: BEAT, gradeAt: -1e9 });

export const DUO: LevelDef = { ...levelDef(1, true), team: "নীল দল", obj: "নীল দলকে", bpm: DUO_BPM, perfect: 0, good: 0, weight: 0 };

export const windowOf = (mode: Mode): Window => {
  const k = MODE_INFO[mode].window;
  return { early: WINDOW.early * k, late: WINDOW.late * k, perfectEarly: WINDOW.perfectEarly * k, perfectLate: WINDOW.perfectLate * k };
};

/**
 * A fresh match. Level 0 is two players on one phone (no bot). The seed decides every bot pull and every rest, so a link replays
 * the same team. `old` plays the old ten-team ladder.
 */
export function createMatch(seed: number, level: number, mode: Mode = "n", old = false, slow = false): Match {
  const def = level === 0 ? DUO : levelDef(level, old), tempo = slow ? SLOW_TEMPO : 1;
  const segAt = new Float64Array(4), segT = new Float64Array(4), segP = new Float64Array(4);
  segP[0] = 60000 / (def.bpm * tempo);
  let segs = 1;
  for (const [after, bpm] of def.tempo) {
    const at = COUNT_IN + after;
    segAt[segs] = at; segT[segs] = segT[segs - 1] + (at - segAt[segs - 1]) * segP[segs - 1]; segP[segs] = 60000 / (bpm * tempo);
    segs++;
  }
  const played = old ? "n" : mode, win = windowOf(played);
  // A wide (সহজ) window on a fast drum would leave no gap between beats: shrink it so a tap off the beat still slips.
  let shortest = segP[0];
  for (let i = 1; i < segs; i++) shortest = Math.min(shortest, segP[i]);
  const room = (0.8 * shortest) / (win.early + win.late);
  if (room < 1) { win.early *= room; win.late *= room; win.perfectEarly *= room; win.perfectLate *= room; }
  return {
    level, old, mode: played, def, seed, slow, bot: level > 0, rng: makeRng(seed),
    win, rival: MODE_INFO[played].rival,
    segAt, segT, segP, segs,
    x: 0, v: 0, sides: [puller(), puller()], playFrom: COUNT_IN, botNext: COUNT_IN, closeNext: 0, beats: 0, now: -1, winner: null,
    heaves: 0, held: 0, heave: 0, hold: 0, heaveBeat: -1, heaveAmt: 0,
  };
}

/** The segment beat k falls in. */
function segOf(m: Match, k: number) {
  let i = m.segs - 1;
  while (i > 0 && k < m.segAt[i]) i--;
  return i;
}
export function beatTime(m: Match, k: number) {
  const i = segOf(m, k);
  return m.segT[i] + (k - m.segAt[i]) * m.segP[i];
}
/** The beat length from beat k to the next. */
export const periodAt = (m: Match, k: number) => m.segP[segOf(m, k)];
/** The last beat at or before time t (negative before the first). */
export function beatFloor(m: Match, t: number) {
  let i = m.segs - 1;
  while (i > 0 && t < m.segT[i]) i--;
  return m.segAt[i] + Math.floor((t - m.segT[i]) / m.segP[i]);
}

/** The beat a tap at `t` belongs to. The window leans late, so the split does too. */
export function nearestBeat(m: Match, t: number) {
  const u = t - (m.win.late - m.win.early) / 2;
  let i = m.segs - 1;
  while (i > 0 && u < m.segT[i]) i--;
  const k = m.segAt[i] + Math.round((u - m.segT[i]) / m.segP[i]);
  return i + 1 < m.segs && k > m.segAt[i + 1] ? m.segAt[i + 1] : k;
}

export function judge(offset: number, w: Window = WINDOW): "perfect" | "good" | "off" {
  if (offset >= -w.perfectEarly && offset <= w.perfectLate) return "perfect";
  if (offset >= -w.early && offset <= w.late) return "good";
  return "off";
}

/** A small integer hash in [0, 1) for a beat, so rests are placed by the seed without touching the bot's rolls. */
export function beatHash(seed: number, k: number) {
  let h = (seed ^ Math.imul(k + 0x9e37, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** What beat k is (a bit set: KIND, then QUIET, HEAVE, WARN). Pure in the level, the seed and k; the count-in wins. */
export function kindOf(m: Match, k: number) {
  if (k < m.playFrom) return COUNT;
  const def = m.def, n = k - COUNT_IN;
  let flags = 0;
  if (def.surge) {
    const { first, every, beats } = def.surge;
    if (n < first) { if (n >= first - 2) flags |= WARN; }
    else {
      const at = (n - first) % every;
      if (at < beats) flags |= HEAVE;
      else if (at >= every - 2) flags |= WARN;
    }
  }
  if (def.silent && n % 12 >= 8) flags |= QUIET;
  if (def.rests && !(flags & HEAVE) && n >= 6 && n % 4 === 3 && beatHash(m.seed, k) < 0.6) return REST | flags;
  if (def.accent && n % 4 === 0) return BIG | flags;
  return BEAT | flags;
}

/** "৩", "২", "১" during a count-in (as 3, 2, 1), else 0. */
export function countIn(m: Match, t: number) {
  if (t < 0) return COUNT_IN;
  const beat = beatFloor(m, t);
  return beat < m.playFrom ? m.playFrom - beat : 0;
}

/** Where the beat is: 0 right on it, rising to 1 just before the next one. */
export function beatPhase(m: Match, t: number) {
  const k = beatFloor(m, t), p = periodAt(m, k);
  return Math.min(1, Math.max(0, (t - beatTime(m, k)) / p));
}

/** The rival's weight now: heavier near our line on a dig-in level. */
export const rivalWeight = (m: Match) => m.def.weight * m.rival * (1 + m.def.digIn * Math.min(1, Math.max(0, (m.x - 0.5) / 0.5)));

export function pull(m: Match, side: Side, grade: "perfect" | "good", weight = 1) {
  const p = m.sides[side];
  const strength = PULL[grade] * weight * (side === 0 && m.bot ? m.def.give : 1) * (m.def.combo ? 1 + COMBO_BONUS * Math.min(p.combo, COMBO_CAP) : 1);
  p.combo++; p.best = Math.max(p.best, p.combo);
  if (grade === "perfect") p.perfect++; else p.good++;
  p.lean = 1;
  m.v += (side === 0 ? 1 : -1) * strength * STEP * DAMP;
}

export function slip(m: Match, side: Side, scale = 1) {
  const p = m.sides[side];
  p.combo = 0; p.slips++;
  m.v -= (side === 0 ? 1 : -1) * m.def.slip * STEP * DAMP * scale * (m.def.slick ? 2 : 1);
}

/** A player's tap at match time `t`. One pull per beat: the first tap in a beat's window pulls, anything else slips. */
export function tap(m: Match, side: Side, t: number): Grade {
  if (m.winner !== null) return "none";
  const p = m.sides[side];
  const beat = nearestBeat(m, t), kind = kindOf(m, beat), offset = t - beatTime(m, beat);
  let grade: Grade;
  if (beat < m.playFrom) grade = "early";
  else {
    const verdict = judge(offset, m.win);
    if (verdict === "off") { grade = "off"; slip(m, side); }
    else if ((kind & KIND) === REST) { grade = "rest"; p.wrongRests++; slip(m, side); }
    else if (p.claimed >= beat) { grade = "extra"; slip(m, side); }
    else {
      grade = verdict; p.claimed = beat;
      const big = (kind & KIND) === BIG;
      if (big) p.bigs++;
      if (verdict === "perfect") {
        p.nailed = beat;
        // Right on a heave beat they already heaved on: the team holds it, and the rope comes back.
        if (side === 0 && m.heaveBeat === beat) { m.v += m.heaveAmt; m.heaveBeat = -1; m.held++; m.hold = 1; }
      }
      pull(m, side, verdict, big ? ACCENT[verdict] : 1);
    }
  }
  p.grade = grade; p.gradeKind = kind; p.gradeAt = t;
  return grade;
}

/** After a pause the clock carries on from `t`, but with a fresh "৩ ২ ১" so nobody has to find the beat cold. */
export function resume(m: Match, t: number) {
  const floor = beatFloor(m, t), next = beatTime(m, floor) < t ? floor + 1 : floor;
  m.playFrom = Math.max(m.playFrom, next + COUNT_IN);
  m.botNext = Math.max(m.botNext, m.playFrom);
  m.closeNext = Math.max(m.closeNext, next);
  m.now = t;
  for (const p of m.sides) { p.combo = 0; p.claimed = Math.max(p.claimed, next - 1); }
}

/** On-beat pulls for a side (both perfect and a little off). */
export const hitsOf = (p: Puller) => p.perfect + p.good;
/** How full the finale team's দম bar is (0..1), and whether they are heaving now. */
export function breath(m: Match, t: number) {
  const s = m.def.surge;
  if (!s) return 0;
  const k = beatFloor(m, t), n = k - COUNT_IN;
  if (k < m.playFrom || n < 0) return 0;
  const phase = beatPhase(m, t);
  if (n < s.first) return Math.min(1, (n + phase) / s.first);
  const at = (n - s.first) % s.every;
  return at < s.beats ? 1 : Math.min(1, (at - s.beats + phase) / (s.every - s.beats));
}
