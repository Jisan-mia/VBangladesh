// One fixed step of a round. No allocation: the round's arrays are made once in newRound. Returns bit flags for what happened,
// which the component turns into sound and shake; the rules themselves stay here.
import { FLARE_TELL, collapsed, potLevel, type Pot } from "./pot";
import { RESULT_SECONDS, type Round } from "./round";

export const EV_SPILL = 1, EV_NEXT = 2, EV_OVER = 4, EV_BELL = 8, EV_FLARE = 16, EV_POP = 32, EV_COLLAPSE = 64;

/**
 * Advances the round by `dt` real seconds. `rate` scales the pot's clock (the mode and ধীরে খেলো), `ripple` its ripples.
 * Mutates in place and returns the events of this step.
 */
export function stepRound(round: Round, dt: number, rate: number, ripple: number) {
  if (round.phase === "rising") {
    const pot: Pot = round.pots[round.index], before = round.t;
    round.t += dt * rate;
    const t = round.t;
    let events = 0;
    if (pot.bell >= 0 && before < pot.bell && t >= pot.bell) events |= EV_BELL;
    if (pot.flareAt >= 0 && before < pot.flareAt - FLARE_TELL && t >= pot.flareAt - FLARE_TELL) events |= EV_FLARE;
    if ((pot.popAt1 >= 0 && before < pot.popAt1 && t >= pot.popAt1) || (pot.popAt2 >= 0 && before < pot.popAt2 && t >= pot.popAt2)) events |= EV_POP;
    if (pot.peak > 0 && !collapsed(pot, before) && collapsed(pot, t)) events |= EV_COLLAPSE;
    round.foam = potLevel(pot, t, ripple);
    if (round.foam >= 1) {
      round.foam = 1;
      round.scores[round.index] = 0;
      round.spills[round.index] = true;
      round.scored = round.index + 1;
      round.lastLift = 0;
      round.phase = "result"; round.wait = 0;
      events |= EV_SPILL;
    }
    return events;
  }
  if (round.phase === "result") {
    round.wait += dt;
    if (round.wait < RESULT_SECONDS) return 0;
    if (round.index === round.pots.length - 1) { round.phase = "over"; return EV_OVER; }
    round.index++; round.phase = "waiting"; round.t = 0; round.foam = 0;
    return EV_NEXT;
  }
  return 0;
}
