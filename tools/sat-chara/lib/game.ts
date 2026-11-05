// One round of সাত চাড়া: a level's pile (or a friend's old pile), three balls, and what happened. Pure; step.hot.ts steps it.
import { defOf, isFinale, layoutOf } from "./levels";
import { oldLayoutOf, oldWorldOf } from "./old-levels";
import { throwBall } from "./physics.hot";
import { createWorld, HAAT, type World } from "./world";

export const BALLS = 3;

/** "level": one of the 15. "old": a friend's pile from the game before the rewrite (no stars recorded). */
export type Kind = "level" | "old";
export type Phase = "aim" | "flying" | "done";

export type Round = {
  kind: Kind;
  level: number;
  world: World;
  phase: Phase;
  /** Balls thrown and settled. */
  balls: number;
  /** Pieces down after the first ball. */
  first: number;
  cleared: boolean;
};

export function createRound(kind: Kind, level: number): Round {
  return { kind, level, world: createWorld(kind === "old" ? oldLayoutOf(level) : layoutOf(level)), phase: "aim", balls: 0, first: 0, cleared: false };
}

/** Let go of the ball. Only while aiming. */
export function launch(r: Round, angle: number, power: number) {
  if (r.phase !== "aim" || !throwBall(r.world, angle, power)) return false;
  r.phase = "flying";
  return true;
}

/** All seven down with one ball is ★★★, with two ★★, with the last ★. */
export const starsOf = (balls: number) => balls <= 1 ? 3 : balls === 2 ? 2 : 1;
/** Which of the three places the round is in (an old pile keeps its old place). */
export const placeOf = (r: Pick<Round, "kind" | "level">) => r.kind === "old" ? oldWorldOf(r.level) : defOf(r.level).world;
export const finaleRound = (r: Pick<Round, "kind" | "level">) => r.kind === "level" && isFinale(r.level);
/** The furthest a piece flew, in হাত. */
export const flewHaat = (w: World) => Math.round(w.maxFly / HAAT);
