// A headless player for tuning and fairness tests. It sees what a person sees: the resting ball and the pots, then the
// ball in flight. It aims (the casual one takes the suggested aim, the skilled one picks the aim whose traced path hits a
// pot soonest), then moves the লাঠি towards where its eye says the ball will come down, a reaction time after every
// change of direction, with a hand of limited speed and a person's error.
import { makeRng } from "../../../shared/game-core";
import type { Mode, Run } from "../lib/levels";
import { breakable, MAX_ANGLE, potCentre, type Game } from "../lib/rules";
import { BALL_R, STICK_Y } from "../lib/rules";
import { landingX, moveStick, newGame, setAim, stepGame, throwBall, traceAim } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Seconds between seeing the ball change direction and the hand starting to follow. */
  react: number;
  /** Seconds of looking before a throw. */
  think: number;
  /** Aim error (radians, one standard deviation), where the hand ends up (units), and how far off the eye's guess of the
   *  landing is per second of flight still to come (it sharpens as the ball comes down). */
  aimError: number; handError: number; judge: number;
  /** How often a plan is badly misjudged (three times the error). */
  slip: number;
  /** The fastest the hand moves the লাঠি (units a second). */
  hand: number;
  /** Picks the aim by tracing paths (else the suggested aim), and tilts returns towards the pots left. */
  plans: boolean;
};
const DEG = Math.PI / 180;
export const CASUAL: Skill = { name: "casual", react: 0.3, think: 0.5, aimError: 4 * DEG, handError: 24, judge: 90, slip: 0.06, hand: 450, plans: false };
export const SKILLED: Skill = { name: "skilled", react: 0.22, think: 0.35, aimError: 1.5 * DEG, handError: 9, judge: 40, slip: 0.01, hand: 800, plans: true };

const DT = 1 / 60;

export const runOf = (seed: number, level: number, mode: Mode = "n"): Run => ({ seed, kind: "level", level, mode });

/** The aim whose traced path reaches a pot in the fewest dots. */
function bestAim(game: Game) {
  const suggested = game.aim;
  let best = suggested, bestN = Infinity;
  for (let aim = -MAX_ANGLE; aim <= MAX_ANGLE + 1e-6; aim += 3 * DEG) {
    setAim(game, aim);
    traceAim(game, false);
    if (game.target >= 0 && breakable(game, game.target) && game.traceN < bestN) { bestN = game.traceN; best = aim; }
  }
  game.aim = suggested;
  return best;
}

export type Outcome = { game: Game; cleared: boolean; seconds: number; /** Seconds from the moment five pots were left to the end (0 when it never got that far). */ tail: number };

/** Plays one stall to the end (or 4 minutes). */
export function play(run: Run, skill: Skill, slow = false): Outcome {
  const game = newGame(run), rng = makeRng((run.seed * 7919 + run.level * 31 + 17) >>> 0);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  let tailAt = -1;
  let waited = 0, sinceTurn = 0, goal = game.stick, error = 0, guess = 0, lastDx = 0, lastDy = 0, steps = 0;
  while (game.phase !== "over" && steps++ < 60 * 240) {
    if (game.phase === "aim") {
      waited += DT;
      if (waited >= skill.think) {
        const aim = skill.plans ? bestAim(game) : game.aim;
        setAim(game, aim + gauss() * skill.aimError);
        if (throwBall(game)) { waited = 0; sinceTurn = 0; lastDx = game.dx; lastDy = game.dy; error = gauss() * skill.handError; }
      }
    } else if (game.phase === "fly") {
      if (Math.sign(game.dx) !== Math.sign(lastDx) || Math.sign(game.dy) !== Math.sign(lastDy)) {
        sinceTurn = 0; lastDx = game.dx; lastDy = game.dy;
        const off = rng() < skill.slip ? 3 : 1;
        error = gauss() * skill.handError * off; guess = gauss() * off;
      }
      sinceTurn += DT;
      if (sinceTurn >= skill.react) {
        const land = landingX(game);
        if (Number.isNaN(land)) goal = game.x;
        else {
          const toLand = Math.max(0, (STICK_Y - BALL_R - game.y) / Math.max(1, game.dy * 300));
          goal = land + error + guess * skill.judge * toLand;
          if (skill.plans && !game.catching) {
            // Lean the return towards the pots still hanging: meet the ball off-centre on the far side.
            let sum = 0, count = 0;
            for (let i = 0; i < game.n; i++) if (game.hits[i] > 0 && breakable(game, i)) { sum += potCentre(game, i); count++; }
            if (count) goal -= Math.sign(sum / count - land) * Math.min(1, Math.abs(sum / count - land) / 120) * game.stickW * 0.3;
          }
        }
      }
      const move = Math.max(-skill.hand * DT, Math.min(skill.hand * DT, goal - game.stick));
      moveStick(game, game.stick + move);
    }
    stepGame(game, DT, slow);
    game.events = 0; game.hitN = 0;
    if (tailAt < 0 && game.total - game.broken <= 5) tailAt = game.time;
  }
  return { game, cleared: game.end === "clear", seconds: game.time, tail: tailAt < 0 ? 0 : game.time - tailAt };
}

export const percentile = (sorted: number[], p: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : null;
