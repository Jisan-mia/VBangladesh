// One round of মনের রং, pure and deterministic (makeRng only): the pictures of a level in order, the faces offered for each,
// naming a feeling, choosing a kind thing, and the quiet ease. Mutates the round in place so the component and the tests
// run the same code. No score: a face that fits is never "right", only "fits"; a miss costs nothing.
import { makeRng } from "../../../shared/game-core";
import { sceneById, type Scene } from "./scenes";
import { levelOf, type Level } from "./levels";
import type { Feeling } from "./faces";

export type Step = "name" | "kind" | "after";

export type Round = {
  level: number; seed: number;
  scenes: Scene[];
  index: number; faces: Feeling[];
  step: Step; picked: Feeling | null; tries: number; kind: number | null;
  /** The quiet ease: three misses in a row offer fewer faces from the next picture; five first-try fits in a row lift it. */
  missRun: number; rightRun: number; eased: boolean;
  /** The feeling found in each finished picture, in order (the swatches on the end screen and the card). */
  found: Feeling[];
  /** The last picture's kind thing is chosen: the round is won (its stars are saved at that very tap). */
  full: boolean;
};

const shuffled = <T>(items: readonly T[], rng: () => number): T[] => {
  const out = [...items];
  for (let at = out.length - 1; at > 0; at--) { const to = Math.floor(rng() * (at + 1)); [out[at], out[to]] = [out[to], out[at]]; }
  return out;
};

/** The pictures of a round: a finale draws `take` of its world's pictures by seed; other levels play theirs in order. */
export function scenesFor(level: Level, seed: number): Scene[] {
  const ids = level.finale ? shuffled(level.scenes, makeRng(seed)).slice(0, level.take) : level.scenes.slice(0, level.take);
  return ids.map(sceneById);
}

/**
 * The faces offered for a picture, in a seeded order: every face of the pool that fits, then others up to the level's base.
 * Eased: the true faces plus one other.
 */
export function facesFor(scene: Scene, level: Level, eased: boolean, seed: number, index: number): Feeling[] {
  const fits = level.pool.filter(feeling => scene.feels.includes(feeling));
  const rng = makeRng(seed * 31 + index * 7919 + 17);
  const others = shuffled(level.pool.filter(feeling => !scene.feels.includes(feeling)), rng);
  const floor = Math.min(level.pool.length, Math.max(2, fits.length + 1));
  const count = eased ? floor : Math.min(level.pool.length, Math.max(level.base, floor));
  return shuffled([...fits, ...others].slice(0, count), rng);
}

export function createRound(levelId: number, seed: number, eased = false, rightRun = 0): Round {
  const level = levelOf(levelId), scenes = scenesFor(level, seed);
  return {
    level: level.id, seed, scenes, index: 0, faces: facesFor(scenes[0], level, eased, seed, 0), step: "name", picked: null, tries: 0, kind: null,
    missRun: 0, rightRun, eased, found: [], full: false,
  };
}

export const sceneOf = (round: Round) => round.scenes[round.index];
export const isLast = (round: Round) => round.index === round.scenes.length - 1;
/** After two tries the faces that fit glow. */
export const glows = (round: Round) => round.step === "name" && round.tries >= 2;

export type Named = "fits" | "again" | "ignore";
export function nameFeeling(round: Round, feeling: Feeling): Named {
  if (round.step !== "name" || !round.faces.includes(feeling)) return "ignore";
  if (!sceneOf(round).feels.includes(feeling)) {
    round.tries += 1; round.missRun += 1; round.rightRun = 0;
    if (round.missRun >= 3) round.eased = true;
    return "again";
  }
  round.rightRun = round.tries === 0 ? round.rightRun + 1 : 0;
  round.missRun = 0;
  round.step = "kind"; round.picked = feeling;
  round.found.push(feeling);
  return "fits";
}

export type Chosen = "ok" | "ignore";
/** A kind thing. On the last picture this wins the round (`full`). */
export function chooseKind(round: Round, choice: number): Chosen {
  if (round.step !== "kind" || (choice !== 0 && choice !== 1)) return "ignore";
  round.step = "after"; round.kind = choice;
  if (isLast(round)) round.full = true;
  return "ok";
}

/** → : the next picture. False on the last, which is won already and goes to the end screen instead. The ease changes only here. */
export function advance(round: Round): boolean {
  if (round.step !== "after" || isLast(round)) return false;
  const level = levelOf(round.level);
  if (round.eased && round.rightRun >= 5) { round.eased = false; round.rightRun = 0; }
  round.index += 1;
  round.faces = facesFor(sceneOf(round), level, round.eased, round.seed, round.index);
  round.step = "name"; round.picked = null; round.tries = 0; round.kind = null;
  return true;
}

/** Faces that fit the current picture and are on offer (they glow after two misses). */
export const fitting = (round: Round) => round.faces.filter(feeling => sceneOf(round).feels.includes(feeling));
