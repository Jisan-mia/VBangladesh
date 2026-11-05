// The race clock, run every fixed step (60 a second) while the page is playing. Allocation-free: it only moves numbers on
// the Race and pushes event codes for the page to read. Anything that does not move (a tap, a spin press) lives in sim.ts.
import { AUTO_GAP_MS, EV, IDLE_MS, RIVAL_GAP_MS, hop, landSpin, push, rivalHop, rivalLand, type Race } from "./sim";

/** Move the race forward by `ms`. A paused, blurred or hidden page simply stops calling this, so no boat moves. */
export function advance(race: Race, ms: number) {
  if (!race.over) race.time += ms;
  if (race.spinT > 0) { race.spinT -= ms; if (race.spinT <= 0) landSpin(race); }
  if (race.auto) {
    race.autoT -= ms;
    while (race.auto && race.autoT <= 0) { race.autoT += AUTO_GAP_MS; hop(race); }
  }
  if (race.rSpinT > 0) { race.rSpinT -= ms; if (race.rSpinT <= 0) rivalLand(race); }
  if (race.rOwed > 0) {
    race.rT -= ms;
    while (race.rOwed > 0 && race.rT <= 0) { race.rT += RIVAL_GAP_MS; rivalHop(race); }
  }
  if (!race.over && race.spinT <= 0 && !race.auto) {
    const before = race.idleT;
    race.idleT += ms;
    if (before < IDLE_MS && race.idleT >= IDLE_MS) push(race, EV.IDLE);
  }
  if (race.over && !race.ended) {
    race.endT -= ms;
    if (race.endT <= 0) { race.ended = true; push(race, EV.CARD); }
  }
}
