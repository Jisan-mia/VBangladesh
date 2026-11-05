// A headless angler for tuning and fairness tests. It plays the way a thumb does: it lets go of the cast when the ring
// looks right (with an aim error), strikes a reaction time after the float goes under, sometimes falls for a nibble,
// reads the meter only every `reaction` seconds with a fuzzy eye, and sometimes misses a tell.
import { makeRng } from "../../../shared/game-core";
import type { Mode } from "../lib/levels";
import { stepTrip } from "../lib/step.hot";
import { createTrip, floatState, P, SWING, TRICK, type Trip } from "../lib/trip";

export type Skill = {
  name: string;
  /** Seconds between looks (a person's reaction time). */
  reaction: number;
  /** ± error on where the cast lands. */
  aim: number;
  /** Where in the green it tries to keep the needle (0 = the band's bottom, 1 = its top), and how unsure it is of it. */
  low: number; high: number; noise: number;
  /** Chance of missing a tell, and of striking at a nibble. */
  miss: number; fooled: number;
};
export const SKILLED: Skill = { name: "skilled", reaction: 0.22, aim: 0.03, low: 0.3, high: 0.6, noise: 0.03, miss: 0.04, fooled: 0 };
export const CASUAL: Skill = { name: "casual", reaction: 0.33, aim: 0.08, low: 0.15, high: 0.85, noise: 0.08, miss: 0.35, fooled: 0.05 };
/** Strikes well but holds the whole reel. */
export const HOLDER: Skill = { name: "holder", reaction: 0.3, aim: 0.05, low: 9, high: 10, noise: 0, miss: 1, fooled: 0 };

const DT = 1 / 60;
/** Slow mode feeds the trip 0.65 of each step (the component does the same). */
export const SLOW_SPEED = 0.65;

/** `landed`: game seconds until the last fish needed was in the basket (the win itself, before its celebration). */
export type Outcome = { won: boolean; time: number; landed: number; lost: number; catches: number; trip: Trip };

/** Plays one level (or `idle`: never touches); null if it hasn't ended in 5 minutes. */
export function play(seed: number, level: number, mode: Mode, skill: Skill | "idle", slow = false, log?: (kind: number, arg: number, trip: Trip) => void): Outcome | null {
  const trip = createTrip(seed, level, mode);
  trip.calm = slow;
  const rng = makeRng(seed * 13 + level * 977 + 5);
  const scale = slow ? SLOW_SPEED : 1;
  let held = false, look = 0, target = 0, strikeAt = -1, castSeen = -1, ignore = false, warnSeen = 0, steps = 0, nibbleSeen = -1, landed = -1;
  while (trip.phase !== P.OVER && steps++ < 60 * 300) {
    let pressed = false;
    if (skill !== "idle") {
      const s = skill;
      if (trip.phase === P.AIM) {
        if (!trip.charging && castSeen !== trip.cast) {
          // A short look at the water first, then the thumb goes down.
          if ((look -= DT) <= 0) {
            castSeen = trip.cast;
            target = Math.max(0.08, Math.min(0.98, trip.spot + (rng() * 2 - 1) * s.aim));
            held = true; pressed = true;
          }
        } else if (trip.charging && trip.charge < SWING / 2 && trip.power >= target) held = false;
        else if (trip.charging && trip.charge >= SWING / 2) held = false;
        strikeAt = -1; nibbleSeen = -1;
      } else if (trip.phase === P.WAIT) {
        held = false;
        const twitch = floatState(trip), under = twitch === 2;
        if (under && strikeAt < 0) strikeAt = trip.t + s.reaction * scale * (0.8 + 0.4 * rng());
        else if (!under && twitch > 0.5 && strikeAt < 0) {
          // Each nibble fools it once at most.
          let at = -1;
          for (let i = 0; i < trip.fakeCount; i++) if (trip.t >= trip.fakes[i]) at = i;
          if (at !== nibbleSeen) { nibbleSeen = at; if (rng() < s.fooled) strikeAt = trip.t + s.reaction * scale * 0.6; }
        }
        if (strikeAt >= 0 && trip.t >= strikeAt) { held = true; pressed = true; strikeAt = -1; look = 0; }
      } else if (trip.phase === P.REEL) {
        if ((look -= DT) <= 0) {
          look = s.reaction * (0.8 + 0.4 * rng());
          if (trip.warned && trip.trickAt !== warnSeen) { warnSeen = trip.trickAt; ignore = rng() < s.miss; }
          const warning = trip.warned && trip.trick !== TRICK.NONE && !ignore ? trip.trick : TRICK.NONE;
          const riding = trip.t < trip.surgeEnd ? TRICK.SURGE : trip.t < trip.rushEnd ? TRICK.RUSH : TRICK.NONE;
          const feel = (trip.tension - trip.lo) / Math.max(0.05, trip.hi - trip.lo) + (rng() * 2 - 1) * s.noise * 4;
          // A missed tell still leaves the trick itself to see: the rod bends hard or the line falls slack.
          if (warning === TRICK.SURGE || warning === TRICK.JUMP || (riding === TRICK.SURGE && feel > s.low)) held = false;
          else if (riding === TRICK.RUSH) held = true;
          else if (feel < s.low) held = true;
          else if (feel > s.high) held = false;
        }
      } else {
        held = false;
        look = s.reaction * (1 + rng());
      }
    }
    stepTrip(trip, held, pressed, DT * scale);
    if (landed < 0 && trip.catches >= trip.def.need) landed = trip.time;
    if (log) for (let i = 0; i < trip.evCount; i++) log(trip.ev[i], trip.evArg[i], trip);
  }
  if (trip.phase !== P.OVER) return null;
  return { won: trip.won, time: trip.time, landed, lost: trip.lost, catches: trip.catches, trip };
}

export const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
