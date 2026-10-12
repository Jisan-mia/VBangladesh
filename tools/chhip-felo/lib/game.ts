// One fishing trip as a pure state machine: aim and cast, watch the float, strike on the real dip, reel with the line in the green.
// Every random choice comes from the trip's seed, one generator per cast, so a friend's link replays the same water.
import { makeRng } from "../../../shared/game-core";
import { fight, rollFish, rollGrams } from "./fish";

/** [place, casts, fish needed to clear, most fake nibbles, seconds the float stays under, how hard fish pull] — one new thing per level. */
export const LEVELS: ReadonlyArray<readonly [place: number, casts: number, need: number, fakes: number, window: number, pull: number]> = [
  [0, 3, 1, 0, 1.2, 0.25], [0, 3, 2, 1, 1.1, 0.3], [0, 4, 2, 1, 1.0, 0.35], [0, 4, 3, 2, 0.95, 0.4], [0, 5, 3, 2, 0.9, 0.45],
  [1, 4, 2, 1, 0.95, 0.5], [1, 4, 3, 2, 0.9, 0.55], [1, 5, 3, 2, 0.85, 0.6], [1, 5, 3, 3, 0.8, 0.65], [1, 5, 4, 3, 0.75, 0.7],
  [2, 4, 2, 2, 0.85, 0.75], [2, 5, 3, 2, 0.8, 0.8], [2, 5, 3, 3, 0.75, 0.85], [2, 5, 4, 3, 0.7, 0.9], [2, 6, 4, 3, 0.65, 1],
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;

export function specOf(level: number) {
  const [place, casts, need, fakes, window, pull] = LEVELS[level - 1];
  return { level, place, casts, need, fakes, window, pull };
}
export type Spec = ReturnType<typeof specOf>;
export const placeOf = (level: number) => LEVELS[level - 1][0];
/** The last level of the last open place, so a place's levels wait for the album. */
export const lastLevelOf = (place: number) => LEVELS.reduce((last, row, index) => row[0] <= place ? index + 1 : last, 1);

/** Three stars for every fish, two for all but one, one for the level's need, none below it (not cleared). */
export function starsOf(catches: number, spec: Pick<Spec, "casts" | "need">) {
  if (catches >= spec.casts) return 3;
  if (catches >= spec.need) return catches >= spec.casts - 1 ? 2 : 1;
  return 0;
}
/** Fish short of the next star (or of clearing), or 0 at three stars. */
export function fishToNext(catches: number, spec: Pick<Spec, "casts" | "need">) {
  const stars = starsOf(catches, spec);
  if (stars === 3) return 0;
  const goal = stars === 0 ? spec.need : stars === 1 ? spec.casts - 1 : spec.casts;
  return { goal: stars === 0 ? 1 : starsOf(goal, spec), fish: goal - catches };
}

export type Phase = "aim" | "fly" | "wait" | "reel" | "caught" | "lost" | "done";
export type Miss = "early" | "nibble" | "late" | "snap" | "slip";
export type Event = "" | "charge" | "cast" | "land" | "nibble" | "dip" | "hush" | "hook" | "surge" | "caught" | Miss | "next" | "done";
export type Catch = { fish: number; grams: number };

export type Trip = {
  spec: Spec; seed: number; cast: number; phase: Phase; t: number; slow: boolean;
  /** aim: how long the finger has been down, and the power it gives (0..1) */
  charging: boolean; charge: number; power: number;
  /** where the bubbles are (distance 0 near .. 1 far, side −1..1), where the float landed, and how close (0..1) */
  spot: number; side: number; landed: number; accuracy: number;
  biteAt: number; window: number; fakes: number[];
  fish: number; grams: number;
  tension: number; progress: number; slack: number; strain: number; holding: boolean; surgeAt: number; surgeEnd: number;
  catches: Catch[]; results: Array<Miss | "caught">; streak: number; miss: Miss | null;
  rng: () => number;
};

/** Seconds for a full swing of the power meter (0 → 1 → 0), the cast's flight, and how long a catch or a miss stays on screen. */
export const SWING = 1.6, FLIGHT = 0.55, SHOW_CATCH = 2.1, SHOW_MISS = 1.5, NIBBLE = 0.3;
/** Slow mode stretches every clock the player must react to. */
export const SLOW = 1.6;
/** The green band: centre and half-width for the lightest fish (big fish narrow it). */
export const GREEN_MID = 0.5;

const castRng = (seed: number, cast: number) => makeRng((seed ^ Math.imul(cast + 1, 0x9e3779b1)) >>> 0);

function beginCast(trip: Trip) {
  trip.rng = castRng(trip.seed, trip.cast);
  trip.phase = "aim"; trip.t = 0; trip.charging = false; trip.charge = 0; trip.power = 0;
  // The bubbles stay in reach: never at the bank's edge, never past the far third.
  trip.spot = 0.25 + trip.rng() * 0.6;
  // Mostly to the right, so the bubbles don't hide behind the rod on the left.
  trip.side = -0.25 + trip.rng() * 0.95;
  trip.landed = 0; trip.accuracy = 0; trip.fakes = []; trip.miss = null; trip.holding = false;
}

export function newTrip(level: number, seed: number, slow = false): Trip {
  const trip: Trip = {
    spec: specOf(level), seed, cast: 0, phase: "aim", t: 0, slow, charging: false, charge: 0, power: 0,
    spot: 0, side: 0, landed: 0, accuracy: 0, biteAt: 0, window: 0, fakes: [], fish: 0, grams: 0,
    tension: 0, progress: 0, slack: 0, strain: 0, holding: false, surgeAt: 0, surgeEnd: 0,
    catches: [], results: [], streak: 0, miss: null, rng: castRng(seed, 0),
  };
  beginCast(trip);
  return trip;
}

/** Triangle wave: the meter climbs to full and comes back down, so holding too long is never the best cast. */
export const swing = (seconds: number, slow: boolean) => {
  const phase = (seconds / (slow ? SWING * SLOW : SWING)) % 1;
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
};

/** How close a cast landed to the bubbles: 1 on top of them, 0 at a quarter of the pond away or more. */
export const accuracyOf = (landed: number, spot: number) => Math.max(0, 1 - Math.abs(landed - spot) / 0.25);

function cast(trip: Trip, power: number): Event {
  trip.power = trip.landed = Math.max(0, Math.min(1, power));
  trip.charging = false;
  trip.phase = "fly"; trip.t = 0;
  return "cast";
}

/** The float lands: the cast's whole story is rolled now, in a fixed order, so a friend's same casts give the same fish. */
function land(trip: Trip) {
  const { spec, rng } = trip, a = accuracyOf(trip.landed, trip.spot);
  trip.accuracy = a;
  // A cast on the bubbles gets a bite sooner. Nibbles come first, each with room to tell it from the real dip.
  const base = 1.3 + rng() * 1.6 - a * 0.6, fakes = spec.fakes ? Math.floor(rng() * (spec.fakes + 1)) : 0;
  trip.fakes = [];
  let at = 0.6 + rng() * 0.4;
  for (let index = 0; index < fakes; index++) { trip.fakes.push(at); at += 0.8 + rng() * 0.5; }
  trip.biteAt = fakes ? Math.max(base, at + 0.2) : base;
  trip.fish = rollFish(spec.place, a, rng);
  trip.grams = rollGrams(trip.fish, a, rng);
  trip.window = spec.window * (1 - 0.15 * fight(trip.grams));
  trip.phase = "wait"; trip.t = 0;
}

const stretch = (trip: Trip) => trip.slow ? SLOW : 1;

function startReel(trip: Trip) {
  trip.phase = "reel"; trip.t = 0;
  // The striking finger is still down, so the reel starts held.
  trip.tension = 0.42; trip.progress = 0; trip.slack = 0; trip.strain = 0; trip.holding = true;
  trip.surgeAt = 0.6 + trip.rng() * 0.6; trip.surgeEnd = 0;
}

/** The green band for the fish on the line. */
export function greenBand(trip: Pick<Trip, "grams" | "slow">) {
  const half = 0.2 - 0.06 * fight(trip.grams) + (trip.slow ? 0.04 : 0);
  return { lo: GREEN_MID - half, hi: GREEN_MID + half };
}
/** Above this the line is in the red; held there too long, it snaps. */
export const RED = 0.92;
export const SNAP_AFTER = 0.5, SLIP_AFTER = 2.5;

function endCast(trip: Trip, result: Miss | "caught") {
  trip.results.push(result);
  trip.holding = false;
  if (result === "caught") { trip.catches.push({ fish: trip.fish, grams: trip.grams }); trip.streak++; trip.phase = "caught"; }
  else { trip.miss = result; trip.streak = 0; trip.phase = "lost"; }
  trip.t = 0;
}

function next(trip: Trip): Event {
  trip.cast++;
  if (trip.cast >= trip.spec.casts) { trip.phase = "done"; trip.t = 0; return "done"; }
  beginCast(trip);
  return "next";
}

/** Finger (or Space) down. */
export function press(trip: Trip): Event {
  switch (trip.phase) {
    case "aim": trip.charging = true; trip.charge = 0; trip.power = 0; return "charge";
    case "wait": {
      // Timing runs on the stretched clock in slow mode: everything waits longer and stays under longer.
      const now = trip.t / stretch(trip);
      if (now >= trip.biteAt && now <= trip.biteAt + trip.window) { startReel(trip); return "hook"; }
      // Level 1 teaches: an early tap only gets a word, never loses the fish.
      if (trip.spec.level === 1 && now < trip.biteAt) return "hush";
      const nibbling = trip.fakes.some(at => now >= at && now <= at + NIBBLE + 0.15);
      endCast(trip, nibbling ? "nibble" : now < trip.biteAt ? "early" : "late");
      return trip.miss!;
    }
    case "reel": trip.holding = true; return "";
    case "caught": case "lost": return trip.t > 0.35 ? next(trip) : "";
    default: return "";
  }
}

/** Finger (or Space) up. */
export function release(trip: Trip): Event {
  if (trip.phase === "aim" && trip.charging) return cast(trip, trip.power);
  if (trip.phase === "reel") trip.holding = false;
  return "";
}

/** A quick upward flick casts straight away; its speed sets the distance. */
export function flick(trip: Trip, power: number): Event {
  return trip.phase === "aim" ? cast(trip, power) : "";
}

/** One fixed step of game time. Returns what happened, for sound and words. */
export function step(trip: Trip, dt: number): Event {
  trip.t += dt;
  const slow = stretch(trip);
  switch (trip.phase) {
    case "aim":
      if (trip.charging) { trip.charge += dt; trip.power = swing(trip.charge, trip.slow); }
      return "";
    case "fly":
      if (trip.t >= FLIGHT * (trip.slow ? 1.3 : 1)) { land(trip); return "land"; }
      return "";
    case "wait": {
      const before = (trip.t - dt) / slow, now = trip.t / slow;
      for (const at of trip.fakes) if (before < at && now >= at) return "nibble";
      if (before < trip.biteAt && now >= trip.biteAt) return "dip";
      if (now > trip.biteAt + trip.window) { endCast(trip, "late"); return "late"; }
      return "";
    }
    case "reel": {
      const pull = trip.spec.pull * (0.5 + 0.8 * fight(trip.grams));
      let event: Event = "";
      if (trip.t >= trip.surgeAt) {
        trip.surgeEnd = trip.t + 0.45;
        trip.surgeAt = trip.t + (0.9 + trip.rng() * 1.1) * slow;
        event = "surge";
      }
      const surging = trip.t < trip.surgeEnd;
      trip.tension += ((trip.holding ? 0.6 : -0.5) + (surging ? pull * 0.8 : 0)) * dt / slow;
      trip.tension = Math.max(0, Math.min(1, trip.tension));
      const { lo, hi } = greenBand(trip), need = (1.6 + 1.6 * fight(trip.grams)) * slow;
      if (trip.tension >= lo && trip.tension <= hi) trip.progress += dt / need;
      else if (trip.tension > hi) trip.progress += 0.3 * dt / need;
      else trip.progress = Math.max(0, trip.progress - 0.4 * dt / need);
      trip.slack = trip.tension < lo ? trip.slack + dt : 0;
      trip.strain = trip.tension >= RED ? trip.strain + dt : 0;
      if (trip.strain > SNAP_AFTER * slow) { endCast(trip, "snap"); return "snap"; }
      if (trip.slack > SLIP_AFTER * slow) { endCast(trip, "slip"); return "slip"; }
      if (trip.progress >= 1) { trip.progress = 1; endCast(trip, "caught"); return "caught"; }
      return event;
    }
    case "caught": return trip.t >= SHOW_CATCH ? next(trip) : "";
    case "lost": return trip.t >= SHOW_MISS ? next(trip) : "";
    default: return "";
  }
}

/** What the float is doing right now, for drawing: 0 resting, up to 1 for a nibble's twitch, "under" during the real dip. */
export function floatState(trip: Trip): number | "under" {
  if (trip.phase === "reel") return "under";
  if (trip.phase !== "wait") return 0;
  const now = trip.t / stretch(trip);
  if (now >= trip.biteAt) return "under";
  for (const at of trip.fakes) if (now >= at && now <= at + NIBBLE) return Math.sin((now - at) / NIBBLE * Math.PI);
  return 0;
}

export const basket = (trip: Pick<Trip, "catches">) => trip.catches.reduce((sum, item) => sum + item.grams, 0);
export function biggest(trip: Pick<Trip, "catches">) {
  let best: Catch | null = null;
  for (const item of trip.catches) if (!best || item.grams > best.grams) best = item;
  return best;
}
