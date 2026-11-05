// The per-step rules: runs 60 times a second on a cheap phone, so it mutates the round in place and allocates nothing.
// The flick rises and falls; a struck কাঠি walks its precomputed path (pegs tick, it lands, a fielder may catch it); the rest
// after a hit runs out into the next flick or the end.
import { HITS } from "./levels";
import {
  emit, nextHit, popApexTime, popY, settle,
  AIM, DONE, DT, E_CATCH, E_FALL, E_GUST, E_LAND, E_PEG, FLY, K_CAUGHT, K_FALL, K_WHIFF, POP, REST, REST_TIME,
  type Round,
} from "./round";

/** One round step (DT seconds). */
export function advance(r: Round) {
  if (r.phase === DONE) return;
  r.clock += DT;
  if (r.phase === AIM) return;
  if (r.phase === POP) {
    r.t += DT;
    if (r.t > popApexTime(r) && popY(r, r.t) <= 0.04) {
      emit(r, E_FALL, r.swung ? 1 : 0);
      settle(r, r.swung ? K_WHIFF : K_FALL);
    }
    return;
  }
  if (r.phase === FLY) {
    // Hit-stop: the কাঠি sits on the ডাং for a few steps at contact.
    if (r.hold > 0) { r.hold--; return; }
    r.t += DT;
    r.pi++;
    const gust = r.gustAt[r.hit];
    if (gust >= 0 && r.t >= gust && r.t - DT < gust) emit(r, E_GUST, r.gustPow[r.hit] > 0 ? 1 : -1);
    const peg = Math.floor(r.px[r.pi] / 5);
    if (peg > r.peg && r.py[r.pi] >= 0) { r.peg = peg; emit(r, E_PEG, peg * 5); }
    if (r.pi === r.landAt) emit(r, E_LAND, r.landZone, r.px[r.pi]);
    if (r.pi === r.catchAt) emit(r, E_CATCH, r.catcher);
    if (r.pi >= r.pn - 1) settle(r, r.catchAt >= 0 ? K_CAUGHT : r.kind);
    return;
  }
  if (r.phase === REST) {
    r.t += DT;
    if (r.t >= REST_TIME) nextHit(r);
  }
}

/** Hits whose result is known (the one resting counts). */
export const shown = (r: Round) => r.phase === REST || r.phase === DONE ? Math.min(HITS, r.hit + 1) : r.hit;
