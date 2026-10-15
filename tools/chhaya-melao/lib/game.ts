// The rules, with no React: five levels, which objects a round shows, how many pictures to offer, and the stars.
import { starsFor } from "../../../shared/game-core";
import { SHAPES, type Shape } from "./shapes";

/** How the shadow lies on the wall. Only the last level turns or flips it (mental rotation, for 6+). */
export type Turn = "none" | "r90" | "r180" | "r270" | "flip";
export type Level = { level: number; choices: number; kin: boolean; turned: boolean; age: string };

export const LEVELS: readonly Level[] = [
  { level: 1, choices: 2, kin: false, turned: false, age: "৩+" },
  { level: 2, choices: 3, kin: false, turned: false, age: "৩+" },
  { level: 3, choices: 4, kin: false, turned: false, age: "৪+" },
  // Same family: four-legged animals together, birds together, so the child must look at the outline, not the kind.
  { level: 4, choices: 3, kin: true, turned: false, age: "৫+" },
  { level: 5, choices: 3, kin: false, turned: true, age: "৬+" },
];
export const LEVEL_COUNT = LEVELS.length;
export const ROUND = 6;
export const levelOf = (level: number) => LEVELS[Math.max(0, Math.min(LEVEL_COUNT, Math.round(level) || 1) - 1)];

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Six different objects for one round. */
export const roundTargets = (rng: () => number, count = ROUND) => shuffle(SHAPES, rng).slice(0, count);

/**
 * Pictures to offer: the level's number; one fewer after three misses in a row (quietly easier, never under 2),
 * one more after five right in a row (never over 4). A "miss" is a shadow not matched on the first tap.
 */
export function choiceCount(base: number, missRun: number, rightRun: number) {
  const wanted = missRun >= 3 ? base - 1 : rightRun >= 5 ? base + 1 : base;
  return Math.max(2, Math.min(4, wanted));
}

/** The right object plus `count - 1` others: from the same family on the "look closely" level, from other families elsewhere. */
export function choicesFor(target: Shape, count: number, kin: boolean, rng: () => number) {
  const pool = SHAPES.filter(shape => shape.id !== target.id && (shape.family === target.family) === kin);
  return shuffle([target, ...shuffle(pool, rng).slice(0, count - 1)], rng);
}

const TURNS: readonly Turn[] = ["r90", "r180", "r270", "flip"];
export const turnFor = (turned: boolean, rng: () => number): Turn => turned ? TURNS[Math.floor(rng() * TURNS.length)] : "none";
export const turnCss: Record<Turn, string> = { none: "rotate(0deg)", r90: "rotate(90deg)", r180: "rotate(180deg)", r270: "rotate(-90deg)", flip: "scaleX(-1)" };

/** Stars are a record only: 3 for five or six matched on the first tap, 2 for three or four, 1 for finishing. */
export const starsOf = (firstTry: number) => starsFor(firstTry, ROUND - 1, Math.ceil(ROUND / 2));

export const cardTitle = (count: number, bn: (n: number) => string) => `আজ ${bn(count)}টা ছায়া মেলালাম`;

/** The fixed result behind `#og`, for the site's preview image only: it saves nothing and skips the daily limit. */
export const OG_DEMO = { level: 3, stars: 3, ids: ["hati", "riksha", "chhata", "has", "nouka", "jirafa"] };
export const isOgHash = (hash: string) => hash === "#og";
