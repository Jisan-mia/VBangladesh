// Headless players for মনের রং: they play a round through the same pure functions the component calls.
import { makeRng } from "../../../shared/game-core";
import { ORDER } from "../lib/faces";
import { advance, chooseKind, createRound, fitting, glows, nameFeeling, sceneOf, type Round } from "../lib/round";

export type Played = { round: Round; taps: number; misses: number; worst: number; eased: boolean };

/**
 * `knows`: the chance a child names a fitting face at once; otherwise a random face on offer. After two misses the glowing face
 * is followed (a child does follow a glow). Every picture's kind thing is a coin flip.
 */
export function playRound(levelId: number, seed: number, knows: number, rng = makeRng(seed ^ 0x9e37)): Played {
  const round = createRound(levelId, seed);
  let taps = 0, misses = 0, worst = 0, eased = false;
  for (;;) {
    let here = 0;
    while (round.step === "name") {
      const sure = glows(round) || rng() < knows;
      const face = sure ? fitting(round)[Math.floor(rng() * fitting(round).length)] : round.faces[Math.floor(rng() * round.faces.length)];
      here += 1; taps += 1;
      if (nameFeeling(round, face) === "again") misses += 1;
      if (here > 12) throw new Error("a picture never finished");
    }
    worst = Math.max(worst, here);
    eased ||= round.eased;
    chooseKind(round, rng() < 0.5 ? 0 : 1);
    if (!advance(round)) break;
  }
  return { round, taps, misses, worst, eased };
}

/** Plays every picture with a wrong face first (when one is on offer), then the right one. */
export function playAllWrongFirst(levelId: number, seed: number) {
  const round = createRound(levelId, seed);
  const offered: number[] = [];
  for (;;) {
    offered.push(round.faces.length);
    const wrong = round.faces.find(face => !sceneOf(round).feels.includes(face));
    if (wrong) nameFeeling(round, wrong);
    nameFeeling(round, fitting(round)[0]);
    chooseKind(round, 0);
    if (!advance(round)) break;
  }
  return { round, offered };
}

export const allFeelings = ORDER;
