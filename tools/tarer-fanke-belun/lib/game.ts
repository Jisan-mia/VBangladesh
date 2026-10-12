// The balloon and the wires: pure rules, no drawing. Same seed + same taps = same run on every phone.
import { makeRng } from "../../../shared/game-core";

/** The play area in its own units; the canvas scales this to the phone. */
export const VW = 360, VH = 440;
/** Top of the pavement: falling onto the street pops the balloon too. */
export const GROUND = VH - 36;
/** The balloon's fixed spot across the screen; the street scrolls under it. */
export const BX = 92;
export const START_Y = 196;
/** Drawn radius, the smaller radius that counts as touching (a near miss should feel like a near miss), and the wider one that counts as a scrape. */
export const R = 15, HIT = 11.5, GRAZE = 19;
const GRAVITY = 560, PUFF = -215, MAX_FALL = 270;
/** "ধীরে খেলো" slows the whole clock, so every gap keeps the exact shape it has at full speed. */
export const SLOW = 0.7;
export const POP_SECONDS = 0.55;
const FIRST_X = 285;

/**
 * One crossing over the street. Above the gap a loop of slack cable hangs from the roofs; below it, wires are strung
 * between two poles. Both sag and tilt by the same slope, so the gap is a slanted channel, narrowest in the middle.
 */
export type Gate = {
  x: number; w: number; y: number; gap: number; k: number; sagTop: number; sagLow: number;
  /** Decoration only: crows on the pole wire (0-2), where they sit, a caught kite (-1 for none, else its colour). */
  crows: number; perch: number; kite: number;
};

/**
 * The levels: each is a short street of `gates` crossings under its own wind. Each adds one thing: more crossings, a tighter
 * narrowest gap (`floor`), a steady push (`base`, + pushes down, − lifts) or stronger gusts (`gust`, every `every` units of street).
 * Wind is an extra pull in units/s² on top of gravity. Level 0 is "যত দূর পারো": the original endless street, no wind.
 */
export type Stage = { name: string; gates: number; floor: number; base: number; gust: number; every: number };
export const STAGES: readonly Stage[] = [
  { name: "থমথমে বিকেল", gates: 6, floor: 150, base: 0, gust: 0, every: 0 },
  { name: "মৃদু হাওয়া", gates: 8, floor: 146, base: 0, gust: 110, every: 760 },
  { name: "নদীর হাওয়া", gates: 10, floor: 142, base: -80, gust: 120, every: 700 },
  { name: "দমকা হাওয়া", gates: 10, floor: 138, base: 0, gust: 190, every: 600 },
  { name: "মেঘ জমছে", gates: 12, floor: 134, base: 80, gust: 160, every: 600 },
  { name: "ধুলোর ঘূর্ণি", gates: 12, floor: 130, base: 0, gust: 230, every: 520 },
  { name: "বৃষ্টির আগে", gates: 14, floor: 126, base: 60, gust: 240, every: 500 },
  { name: "ঝোড়ো হাওয়া", gates: 16, floor: 122, base: 0, gust: 270, every: 460 },
  { name: "কালবৈশাখী", gates: 18, floor: 118, base: 40, gust: 290, every: 440 },
  { name: "সন্ধ্যার ঝড়", gates: 20, floor: 114, base: 0, gust: 310, every: 420 },
];
export const STAGE_COUNT = STAGES.length;
export const stageOf = (stage: number) => STAGES[Math.max(1, Math.min(STAGE_COUNT, stage)) - 1];

/** A gust over a stretch of street: it swells and fades (sin²) between `at` and `at + length`. */
export type Gust = { at: number; length: number; strength: number };

export type Phase = "ready" | "playing" | "pop" | "over";
export type Run = {
  seed: number; big: boolean; phase: Phase;
  /** 0 for the endless street, else the level (1..STAGE_COUNT), its crossings to clear (0 endless) and its gusts. */
  stage: number; goal: number; gusts: Gust[];
  /** How far the street has scrolled, the balloon's height and speed, and the run's own clock (seconds). */
  dist: number; y: number; vy: number; t: number;
  score: number; gates: Gate[]; next: number; rng: () => number;
  puffAt: number; popAt: number; popped: "wire" | "street" | null;
  /** The wind's pull right now; crossings scraped (a wire within GRAZE of the balloon's middle) and the last one scraped; clean crossings in a row. */
  wind: number; grazes: number; grazedAt: number; streak: number;
  /** True once a level's last crossing is behind the balloon. */
  cleared: boolean;
};

/** The gap's height: very wide for the first three, then a little tighter each time down to a floor. "বড় ফাঁক" adds a fixed margin. */
export function gapFor(index: number, big: boolean, floor = 108) {
  return Math.max(floor, 168 - Math.max(0, index - 2) * 2.5) + (big ? 34 : 0);
}

/** Street speed in units a second: rises gently with distance, capped. */
export const speedAt = (dist: number) => 104 + Math.min(34, dist / 260);

/** The lowest cable of the hanging loop above the gap, at u from -1 (left edge) to 1 (right edge). */
export const topWire = (gate: Gate, u: number) => gate.y - gate.gap / 2 + gate.k * u - gate.sagTop * u * u;
/** The top wire between the two poles below the gap. */
export const lowWire = (gate: Gate, u: number) => gate.y + gate.gap / 2 + gate.k * u - gate.sagLow * u * u;

/** Where the middle of the gap sits at u: what a player aims for. */
export const midline = (gate: Pick<Gate, "y" | "k" | "sagTop" | "sagLow">, u: number) => gate.y + gate.k * u - (gate.sagTop + gate.sagLow) / 2 * u * u;

/** How fast the next gap may sit higher or lower than the last one, in units a second: well under what steady tapping (up) or a free fall (down) manage. */
const CLIMB = 105, DROP = 165;

/** The next crossing. Always draws nine numbers, so "বড় ফাঁক" changes the gap sizes but never which wires come. */
export function makeGate(rng: () => number, index: number, prev: Gate | null, big: boolean, floor = 108): Gate {
  const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng(), r6 = rng(), r7 = rng(), r8 = rng(), r9 = rng();
  const early = index < 3;
  const gap = gapFor(index, big, floor);
  // Uneven spacing: the street never settles into a metronome.
  const x = prev ? prev.x + (early ? 235 : 180 + r1 * 70) : FIRST_X;
  const w = 46 + r2 * 20;
  const k = (r3 * 2 - 1) * (early ? 10 : Math.min(28, 10 + index));
  const sagTop = 14 + r5 * 14, sagLow = 4 + r6 * 8;
  const bend = (sagTop + sagLow) / 2;
  // The middle stays where both bundles show: under a strip of sky and above the shop signs.
  let lo = 34 + gap / 2 + Math.abs(k), hi = GROUND - 56 - gap / 2 - Math.abs(k);
  const from = prev ? prev.y : START_Y;
  // The first crossing sits near where the balloon starts, so a beginner who only keeps it steady still scores.
  const reach = index === 0 ? 20 : early ? 60 : 150;
  lo = Math.max(lo, from - reach); hi = Math.min(hi, from + reach);
  if (prev) {
    // Never an impossible climb: the time from the last gap's exit to this one's entry (plus half of each crossing, where the gaps are widest) bounds the change.
    const seconds = (x - prev.x - (prev.w + w) / 2) / speedAt(x - BX), exit = midline(prev, 1);
    lo = Math.max(lo, exit - CLIMB * seconds + k + bend);
    hi = Math.min(hi, exit + DROP * seconds + k + bend);
  }
  const y = hi < lo ? (lo + hi) / 2 : lo + r4 * (hi - lo);
  // sagLow stays below sagTop, so the narrowest point is always the middle and equals `gap`.
  return { x, w, y, gap, k, sagTop, sagLow, crows: r7 < 0.2 ? 2 : r7 < 0.6 ? 1 : 0, perch: r8, kite: r9 < 0.35 ? Math.floor(r9 * 30) % 3 : -1 };
}

/** Keeps crossings generated a screen ahead of the balloon. */
export function ensureGates(run: Run) {
  while (!run.gates.length || run.gates[run.gates.length - 1].x < run.dist + VW + 180) {
    run.gates.push(makeGate(run.rng, run.gates.length, run.gates[run.gates.length - 1] ?? null, run.big, run.stage ? stageOf(run.stage).floor : 108));
  }
}

/** A level's gusts over its whole street, from their own dice, so the crossings are the same with or without them. */
export function makeGusts(seed: number, stage: number): Gust[] {
  const { gust, every, gates } = stageOf(stage), gusts: Gust[] = [];
  if (!gust) return gusts;
  const rng = makeRng(seed * 31 + stage), end = FIRST_X + gates * 250;
  // The first gust comes after the first crossing, so every level opens calm.
  for (let at = FIRST_X + 60 + rng() * 120; at < end; at += every * (0.8 + rng() * 0.5)) {
    gusts.push({ at, length: 170 + rng() * 120, strength: (rng() < 0.5 ? -1 : 1) * gust * (0.6 + 0.4 * rng()) });
  }
  return gusts;
}

/** The wind's pull at a point of the street: the level's steady push plus any gust blowing there. */
export function windAt(run: Pick<Run, "stage" | "gusts">, dist: number) {
  if (!run.stage) return 0;
  let wind = stageOf(run.stage).base;
  for (const gust of run.gusts) {
    if (dist < gust.at) break;
    if (dist < gust.at + gust.length) wind += gust.strength * Math.sin(Math.PI * (dist - gust.at) / gust.length) ** 2;
  }
  return wind;
}

export function newRun(seed: number, big = false, stage = 0): Run {
  const run: Run = {
    seed, big, phase: "ready", stage, goal: stage ? stageOf(stage).gates : 0, gusts: stage ? makeGusts(seed, stage) : [],
    dist: 0, y: START_Y, vy: 0, t: 0, score: 0, gates: [], next: 0, rng: makeRng(seed), puffAt: -1, popAt: -1, popped: null,
    wind: 0, grazes: 0, grazedAt: -1, streak: 0, cleared: false,
  };
  ensureGates(run);
  return run;
}

/** How close the balloon's edge is to a wire at the crossing it is in or about to enter (Infinity when none is near): for the wires' hum. */
export function clearance(run: Run) {
  const bx = run.dist + BX;
  for (let i = Math.max(0, run.next - 1); i <= run.next; i++) {
    const gate = run.gates[i];
    if (bx < gate.x - gate.w - 30 || bx > gate.x + gate.w + 10) continue;
    const u = Math.max(-1, Math.min(1, (bx - gate.x) / gate.w));
    return Math.max(0, Math.min(run.y - topWire(gate, u), lowWire(gate, u) - run.y) - HIT);
  }
  return Infinity;
}

/** Stars for a cleared level: no scrape is three, a few (one per five crossings) is two, more is one. */
export const twoStarGrazes = (stage: number) => Math.ceil(stageOf(stage).gates / 5);
export const stageStars = (stage: number, grazes: number) => grazes === 0 ? 3 : grazes <= twoStarGrazes(stage) ? 2 : 1;

/** True when a circle at (bx, by) touches the gate: above the hanging loop or below the pole wire, anywhere across its width. */
export function touchesGate(gate: Gate, bx: number, by: number, radius: number) {
  const from = Math.max(bx - radius, gate.x - gate.w), to = Math.min(bx + radius, gate.x + gate.w);
  if (from > to) return false;
  for (let i = 0; i <= 8; i++) {
    const px = from + (to - from) * i / 8, dx = px - bx;
    const half = Math.sqrt(Math.max(0, radius * radius - dx * dx)), u = (px - gate.x) / gate.w;
    if (by - half < topWire(gate, u) || by + half > lowWire(gate, u)) return true;
  }
  return false;
}

/** One puff of air. The first one starts the run. Returns false when a tap means nothing (popped or over). */
export function puff(run: Run) {
  if (run.phase === "ready") run.phase = "playing";
  if (run.phase !== "playing") return false;
  run.vy = PUFF;
  run.puffAt = run.t;
  return true;
}

function pop(run: Run, why: "wire" | "street") {
  run.phase = "pop";
  run.popped = why;
  run.popAt = run.t;
}

/** Advances the run by dt seconds. Returns true when the score or the phase changed (the only times React needs to hear). */
export function stepRun(run: Run, dt: number, slow: boolean) {
  const time = dt * (slow ? SLOW : 1);
  run.t += time;
  if (run.phase === "ready") { run.y = START_Y + (slow ? 0 : Math.sin(run.t * 2.4) * 5); return false; }
  if (run.phase === "pop") {
    if (run.t - run.popAt < POP_SECONDS) return false;
    run.phase = "over";
    return true;
  }
  if (run.phase !== "playing") return false;
  run.wind = windAt(run, run.dist);
  run.vy = Math.min(MAX_FALL, run.vy + (GRAVITY + run.wind) * time);
  run.y += run.vy * time;
  // The sky is soft: the balloon bumps the top edge instead of escaping over the wires.
  if (run.y < HIT) { run.y = HIT; run.vy = Math.max(0, run.vy); }
  run.dist += speedAt(run.dist) * time;
  ensureGates(run);
  const bx = run.dist + BX;
  let changed = false;
  for (let i = Math.max(0, run.next - 1); i <= run.next; i++) {
    if (touchesGate(run.gates[i], bx, run.y, HIT)) { pop(run, "wire"); return true; }
    if (i > run.grazedAt && touchesGate(run.gates[i], bx, run.y, GRAZE)) { run.grazedAt = i; run.grazes++; run.streak = 0; changed = true; }
  }
  if (run.y + HIT > GROUND) { pop(run, "street"); return true; }
  while (run.gates[run.next].x <= bx) {
    run.streak = run.next === run.grazedAt ? 0 : run.streak + 1;
    run.next++; run.score++; changed = true;
    if (run.goal && run.score >= run.goal) { run.cleared = true; run.phase = "over"; return true; }
  }
  return changed;
}
