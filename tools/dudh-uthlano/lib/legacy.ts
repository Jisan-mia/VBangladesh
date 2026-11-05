// The eight kitchens from before the rewrite, kept draw for draw so every link shared without `v=2` opens the same pots.
// Nothing here may change: tests/pots.test.ts fingerprints it. The numbers sit in kitchens.ts (server-safe, no DOM).
import { makeRng, pick } from "../../../shared/game-core";
import { kitchenOf } from "./kitchens";
import { calm, type Pot, type Stove, type Vessel } from "./pot";

export { CLASSIC, KITCHENS, KITCHEN_COUNT, kitchenOf, kitchenStars, potsIn, potsPlain, potsWord, STAR_MARKS as OLD_STAR_MARKS } from "./kitchens";

/** The old makePots, unchanged: pot 1 is calm and slow; each later pot climbs faster and bubbles more. */
export function oldPots(seed: number, kitchen: number): Pot[] {
  const rng = makeRng(seed), { pots, bells } = kitchenOf(kitchen);
  // The doorbell has its own generator, so the pots themselves match the original game's draws exactly.
  const ring = makeRng(seed ^ 0x5bd1e995), rings = new Set<number>();
  while (rings.size < bells) rings.add(1 + pick(ring, pots.length - 1));
  const at = pots.map(() => 0.5 + 0.3 * ring());
  return pots.map((level, index) => {
    // Always the same number of draws per pot, so pot 4 never depends on what pot 2 rolled.
    const kind = pick(rng, 10), time = rng(), curve = rng(), size = rng(), hz = rng(), phase = rng();
    const vessel: Vessel = index === 0 ? "dekchi" : kind < 3 ? "hari" : kind < 7 ? "dekchi" : "patil";
    const stove: Stove = vessel === "hari" ? "clay" : "gas";
    const pot = calm(vessel, stove, stove === "clay" ? 1 : 0, level.seconds * (0.92 + 0.16 * time), level.power + (curve - 0.5) * 0.14,
      // A wood fire flickers more than a gas ring.
      level.wobble * (0.8 + 0.4 * size) * (stove === "clay" ? 1.2 : 1));
    pot.hz = 0.7 + 0.5 * hz; pot.phase = phase * Math.PI * 2;
    pot.bell = rings.has(index) ? at[index] * level.seconds : -1;
    return pot;
  });
}
