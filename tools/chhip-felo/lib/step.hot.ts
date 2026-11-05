// The per-step rules: runs 60 times a second on a cheap phone, so it mutates the trip in place and allocates nothing.
// Input is one flag (finger or Space held) plus `pressed` for a press that came and went inside one step.
import {
  E, emit, endCast, FALL, FLIGHT, HIT_SCALE, JUMP_GIFT, JUMP_KICK, JUMP_SAFE, land, MISS, next, P, press, release, RISE,
  RUSH_DROP, RUSH_SLIP, RUSH_TIME, scheduleTrick, SHOW_CATCH, SHOW_MISS, SURGE_ADD, SURGE_TIME, swing, TRICK, trickGap, type Trip,
} from "./trip";

function waitStep(trip: Trip, before: number) {
  const now = trip.t;
  for (let index = 0; index < trip.fakeCount; index++) if (before < trip.fakes[index] && now >= trip.fakes[index]) emit(trip, E.NIBBLE);
  if (before < trip.biteAt && now >= trip.biteAt) emit(trip, E.DIP);
  if (now > trip.biteAt + trip.window) endCast(trip, MISS.LATE);
}

/** The fish's trick: warned first, then it fires, then the next one is scheduled. */
function trickStep(trip: Trip) {
  if (trip.trick === TRICK.NONE) return true;
  if (!trip.warned && trip.t >= trip.trickAt - trip.warnFor) { trip.warned = true; emit(trip, E.TELL, trip.trick); }
  if (trip.t < trip.trickAt) return true;
  const kind = trip.trick;
  if (kind === TRICK.SURGE) { trip.surgeEnd = trip.t + SURGE_TIME; trip.riding = TRICK.SURGE; emit(trip, E.SURGE); }
  else if (kind === TRICK.RUSH) { trip.rushEnd = trip.t + RUSH_TIME; trip.riding = TRICK.RUSH; emit(trip, E.RUSH); }
  else {
    // A leap on a tight line snaps it; on a slack one it only jerks the line and tires the fish a little.
    if (trip.tension > JUMP_SAFE) { endCast(trip, MISS.LEAP); return false; }
    trip.tension = Math.min(1, trip.tension + JUMP_KICK);
    trip.progress = Math.min(0.999, trip.progress + JUMP_GIFT);
    trip.jumps++;
    emit(trip, E.JUMP);
  }
  scheduleTrick(trip, trickGap(trip) + (kind === TRICK.JUMP ? 0 : kind === TRICK.SURGE ? SURGE_TIME : RUSH_TIME));
  return true;
}

function reelStep(trip: Trip, dt: number) {
  if (!trickStep(trip)) return;
  const surging = trip.t < trip.surgeEnd, rushing = trip.t < trip.rushEnd;
  // A surge or a rush that ends with the fish still on is one ridden out.
  if (trip.riding === TRICK.SURGE && !surging) { trip.riding = TRICK.NONE; trip.surges++; emit(trip, E.RIDDEN, TRICK.SURGE); }
  else if (trip.riding === TRICK.RUSH && !rushing) { trip.riding = TRICK.NONE; trip.rushes++; emit(trip, E.RIDDEN, TRICK.RUSH); }
  const strength = trip.isBoss && trip.boss ? trip.boss.strength : 1;
  let pull = (trip.holding ? RISE : -FALL) + trip.def.current + trip.wobble * Math.sin(trip.t * 2.3 + trip.cast);
  if (surging) pull += SURGE_ADD * strength * trip.def.pull * ((trip.surgeEnd - trip.t) / SURGE_TIME);
  if (rushing) pull -= RUSH_DROP * strength;
  trip.tension = Math.max(0, Math.min(1, trip.tension + pull * dt));
  const floor = trip.isBoss && trip.boss ? (trip.boss.notches - trip.bossLeft) / trip.boss.notches : 0;
  if (trip.tension >= trip.lo && trip.tension <= trip.hi) trip.progress += dt / trip.need;
  else if (trip.tension > trip.hi) trip.progress += (0.35 * dt) / trip.need;
  else trip.progress = Math.max(floor, trip.progress - (0.35 * dt) / trip.need);
  trip.slack = trip.tension < trip.lo ? trip.slack + (rushing ? RUSH_SLIP : 1) * dt : 0;
  trip.strain = trip.tension >= trip.red ? trip.strain + dt : 0;
  // Level 1 teaches: the red and the slack edges light up, but the line holds.
  if (!trip.def.forgiving) {
    if (trip.strain > trip.snapAfter) { endCast(trip, trip.red < 0.9 ? MISS.TEAR : MISS.SNAP); return; }
    if (trip.slack > trip.slipAfter) { endCast(trip, MISS.SLIP); return; }
  }
  // A boss: each notch of দম that breaks makes it run at once, after its tell.
  if (trip.isBoss && trip.boss && trip.bossLeft > 1 && trip.progress >= (trip.boss.notches - trip.bossLeft + 1) / trip.boss.notches) {
    trip.bossLeft--;
    emit(trip, E.NOTCH, trip.bossLeft);
    if (trip.trick === TRICK.NONE || trip.trickAt - trip.t > trip.warnFor + 0.1) scheduleTrick(trip, trip.warnFor + 0.05);
  }
  if (trip.progress >= 1) {
    trip.progress = 1;
    if (trip.t < trip.fastest) trip.fastest = trip.t;
    endCast(trip, 0);
  }
}

/** One fixed step of game time. `held` is the finger or Space now; `pressed` is a press since the last step. */
export function stepTrip(trip: Trip, held: boolean, pressed: boolean, dt: number) {
  trip.evCount = 0;
  if (trip.phase === P.OVER) return;
  let d = dt;
  if (trip.stop > 0) { trip.stop -= dt; d = dt * HIT_SCALE; }
  if (pressed || (held && !trip.wasHeld)) press(trip);
  if (!held && (trip.wasHeld || pressed)) release(trip);
  trip.wasHeld = held;
  if (trip.phase === P.REEL) trip.holding = held;
  const before = trip.t;
  trip.t += d;
  trip.time += d;
  switch (trip.phase) {
    case P.AIM:
      if (trip.charging) { trip.charge += d; trip.power = swing(trip.charge); }
      return;
    case P.FLY:
      if (trip.t >= FLIGHT) land(trip);
      return;
    case P.WAIT: waitStep(trip, before); return;
    case P.REEL: reelStep(trip, d); return;
    case P.CATCH: if (trip.t >= SHOW_CATCH) next(trip); return;
    case P.MISS: if (trip.t >= SHOW_MISS) next(trip); return;
    default: return;
  }
}
