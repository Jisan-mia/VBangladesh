// The stalls as links from before the rewrite laid them out (the old lib/game.ts createGame, kept word for word), so a test
// can prove an old link opens the same painted pots, the same thick ones and the same wind.
import { makeRng, pick } from "../../../shared/game-core";

const POTS = 35, COLS = 7, DESIGNS = 6;
/** Thick pots by old stall number (1–10), from the old LEVELS table. */
export const OLD_TOUGH = [8, 11, 11, 11, 11, 11, 15, 15, 15, 18] as const;

export function createOld(seed: number, level = 1) {
  const rng = makeRng(seed);
  const toughCount = OLD_TOUGH[Math.min(10, Math.max(1, level)) - 1];
  const design = new Uint8Array(POTS);
  for (let i = 0; i < POTS; i++) {
    let d = pick(rng, DESIGNS);
    while (i % COLS > 0 && d === design[i - 1]) d = pick(rng, DESIGNS);
    design[i] = d;
  }
  const order = Array.from({ length: POTS }, (_, i) => i);
  for (let i = POTS - 1; i > 0; i--) { const j = pick(rng, i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  const tough = new Uint8Array(POTS);
  for (let k = 0; k < toughCount; k++) tough[order[k]] = 1;
  const windPhase = rng() * Math.PI * 2;
  return { design, tough, windPhase };
}
