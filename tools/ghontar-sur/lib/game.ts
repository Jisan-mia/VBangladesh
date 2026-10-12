// The rules of ঘণ্টার সুর: a seeded tune over four clay pots that grows by one note each round. Pure and server-safe.
import { makeRng, pick, starsFor } from "../../../shared/game-core";

export const POTS = 4;
/** Notes per level: levels end at 5, 10, 15… notes. */
export const STAGE = 5;
export const LEVEL_COUNT = 10;
/** The longest tune; repeating all of it ends the game as a win. */
export const MAX_LEN = 99;
/** The third mistake ends the run; the first two replay the same round. */
export const MAX_MISTAKES = 3;
/** The fastest beat: at most 2.5 flashes a second (WCAG 2.3.1 allows 3). */
export const MIN_BEAT = 400;

/** The whole tune for a seed. Any prefix is the same on every phone, so a link replays the same tune. */
export function makeTune(seed: number, length = MAX_LEN) {
  const rng = makeRng(seed), tune: number[] = [];
  for (let index = 0; index < length; index++) {
    let pot = pick(rng, POTS);
    // Never the same pot three times running: three flashes of one pot are hard to count.
    if (index >= 2 && tune[index - 1] === pot && tune[index - 2] === pot) pot = (pot + 1 + pick(rng, POTS - 1)) % POTS;
    tune.push(pot);
  }
  return tune;
}

/** The level a round of `length` notes belongs to: 1–5 → 1, 6–10 → 2… (endless rounds past 50 stay at level 10's speed). */
export const levelOf = (length: number) => Math.max(1, Math.ceil(length / STAGE));
export const firstRound = (level: number) => (level - 1) * STAGE + 1;

/** How long each note lights and the dark gap after it, in ms. Faster by 40 ms a level; slow mode stretches both by half. */
export function beat(length: number, slow = false) {
  const total = Math.max(MIN_BEAT, 760 - 40 * (levelOf(length) - 1)) * (slow ? 1.5 : 1);
  const on = Math.round(total * 0.58);
  return { on, off: Math.round(total) - on };
}

/** Stars for a level cleared with this many mistakes so far in the run: none 3, one 2, two 1. */
export const starsForMistakes = (mistakes: number) => starsFor(mistakes, 0, 1, true);

export type Phase = "ready" | "listen" | "play" | "over";
export type Game = {
  seed: number;
  tune: number[];
  /** Notes in the current round. */
  round: number;
  /** How many notes of this round the player has tapped back. */
  at: number;
  mistakes: number;
  /** The longest round repeated correctly in this run. */
  score: number;
  /** The level this run started at (1 unless picked from the level grid). */
  from: number;
  phase: Phase;
};

export function newGame(seed: number, from = 1): Game {
  const level = Math.min(LEVEL_COUNT, Math.max(1, Math.floor(from)));
  return { seed, tune: makeTune(seed), round: firstRound(level), at: 0, mistakes: 0, score: 0, from: level, phase: "ready" };
}

/** Plays the round's tune (again): after the start, a mistake, a cleared round or a pause. Tapped notes start over. */
export const listen = (game: Game): Game => game.phase === "over" ? game : { ...game, at: 0, phase: "listen" };
/** The tune has finished playing: the player's turn. */
export const yourTurn = (game: Game): Game => game.phase === "listen" ? { ...game, at: 0, phase: "play" } : game;

export type Outcome =
  | { kind: "ignored" }
  | { kind: "note" }
  | { kind: "round" }
  | { kind: "level"; level: number; stars: number }
  | { kind: "miss"; expected: number }
  | { kind: "over"; expected: number }
  | { kind: "done"; level: number; stars: number };

/** One tap on a pot during the player's turn. */
export function tap(game: Game, pot: number): { game: Game; outcome: Outcome } {
  if (game.phase !== "play" || !Number.isInteger(pot) || pot < 0 || pot >= POTS) return { game, outcome: { kind: "ignored" } };
  const expected = game.tune[game.at];
  if (pot !== expected) {
    const mistakes = game.mistakes + 1;
    if (mistakes >= MAX_MISTAKES) return { game: { ...game, mistakes, phase: "over" }, outcome: { kind: "over", expected } };
    return { game: { ...game, mistakes, at: 0, phase: "listen" }, outcome: { kind: "miss", expected } };
  }
  const at = game.at + 1;
  if (at < game.round) return { game: { ...game, at }, outcome: { kind: "note" } };
  const score = game.round, stars = starsForMistakes(game.mistakes), level = score / STAGE;
  if (score >= MAX_LEN) return { game: { ...game, at, score, phase: "over" }, outcome: { kind: "done", level: LEVEL_COUNT, stars } };
  const next: Game = { ...game, at: 0, score, round: score + 1, phase: "listen" };
  return { game: next, outcome: Number.isInteger(level) && level <= LEVEL_COUNT ? { kind: "level", level, stars } : { kind: "round" } };
}

/** The highest level this score has cleared (0 under 5 notes). */
export const levelsCleared = (score: number) => Math.min(LEVEL_COUNT, Math.floor(score / STAGE));
