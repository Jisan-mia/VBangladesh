// The levels: three rounds of the eight packs, সহজ first, then কঠিন, then কঠিন against a quicker clock. Pure and server-safe.
// A level fixes the pack, how hard, and the star times; the grid itself is a fresh seed each play, so a replay is never a memory test.
// Level 1's first play is the teaching grid (ফুল, seed 303, শাপলা struck). Never reorder: links carry the level number.
import { starsFor } from "../../../shared/game-core";
import { type Level } from "./grid";
import { PACKS, type PackId } from "./packs";

export type Stage = { pack: PackId; level: Level; three: number; two: number };

const ROUNDS: ReadonlyArray<{ level: Level; three: number; two: number }> = [
  { level: 0, three: 60, two: 120 },
  { level: 1, three: 90, two: 180 },
  { level: 1, three: 70, two: 140 },
];

export const STAGES: readonly Stage[] = ROUNDS.flatMap(round => PACKS.map(pack => ({ pack: pack.id, ...round })));
export const STAGE_COUNT = STAGES.length;
export const TUTORIAL_SEED = 303;

export const stageAt = (stage: number): Stage | null => STAGES[stage - 1] ?? null;

/** Seconds on the clock (hints included) to stars; finishing always earns one. */
export const stageStars = (stage: number, time: number) => {
  const at = stageAt(stage);
  return at ? starsFor(time, at.three, at.two, true) : 0;
};

/** How many seconds faster would have earned the next star, or 0 at three stars. */
export function secondsShort(stage: number, time: number) {
  const at = stageAt(stage), stars = stageStars(stage, time);
  if (!at || stars === 3) return 0;
  return time - (stars === 2 ? at.three : at.two);
}
