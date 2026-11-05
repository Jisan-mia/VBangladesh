// A headless player for tuning and fairness tests. It sees what a person sees, late: the shout from downstairs and how
// clear the picture is (the snow), each noticed `reaction` seconds after it changes. It never reads where the signal is.
import { makeRng } from "../../../shared/game-core";
import { createGame, signal, tenthsOf, type Game, type Hint, type Mode } from "../lib/antenna";
import { stepGame } from "../lib/step.hot";

export type Skill = { name: string; reaction: number; far: number; near: number; overshoot: number };
export const SKILLED: Skill = { name: "skilled", reaction: 0.22, far: 120, near: 30, overshoot: 0.04 };
export const CASUAL: Skill = { name: "casual", reaction: 0.35, far: 85, near: 22, overshoot: 0.14 };

const DT = 1 / 60;

/** Plays one evening; returns the score in tenths and the game, or null if it never finished in 5 minutes. */
export function play(seed: number, level: number, mode: Mode, skill: Skill, old = false): { tenths: number; game: Game } | null {
  const game = createGame(seed, level, mode, old), rng = makeRng(seed * 31 + level);
  let direction = rng() < 0.5 ? 1 : -1, steps = 0;
  let heard: Hint = game.hint, seen: Hint = game.hint, wait = 0;
  let clear = 0, clearSeen = 0, clearWait = 0, peak = 0, falling = 0, coast = 0, stopped = false, settle = 0, care = 1;
  // On a loose pole a person learns to go slowly near the picture and let the antenna settle before correcting.
  const loose = game.def.wobble;
  while (game.phase !== "over" && steps++ < 60 * 300) {
    const round = game.rounds[game.index];
    // What's on screen right now, and what the bot has noticed of it so far.
    clear = game.phase === "got" ? 1 : signal(round, game.angle);
    if (game.hint !== heard) { heard = game.hint; wait = skill.reaction; }
    if (wait > 0 && (wait -= DT) <= 0) {
      seen = heard;
      // Every slip makes a person go more carefully on this channel.
      if (/^slip/.test(seen)) { care = Math.max(0.25, care * 0.7); if (loose) settle = 0.5; }
    }
    if ((clearWait -= DT) <= 0) { clearWait = skill.reaction; clearSeen = clear; }
    if (game.phase === "got") { stepGame(game, 0, DT); peak = 0; falling = 0; stopped = false; care = 1; continue; }
    if (/right$/.test(seen)) direction = 1;
    if (/left$/.test(seen)) direction = -1;
    if (seen === "colder") { direction = -direction; seen = "fuzzy"; }
    if (seen === "next") { seen = "fuzzy"; peak = 0; }
    // Reading the snow: past a real peak (the picture got clearer than a ghost ever does), turn back.
    if (clearSeen > peak) { peak = clearSeen; falling = 0; }
    else if (clearSeen < peak - 0.08 && peak > 0.5 && clearSeen < 0.99) { if (++falling > 2) { direction = -direction; peak = clearSeen; falling = 0; } }
    const sharp = clearSeen >= 0.99 || seen === "hold";
    if (sharp && !stopped) { stopped = true; coast = skill.overshoot; }
    if (!sharp) stopped = false;
    let speed = clearSeen > 0.35 || /^(right|left|slip)/.test(seen) ? skill.near : skill.far;
    if (speed === skill.near) speed *= care * (loose ? 0.5 : 1);
    if (stopped) speed = (coast -= DT) > 0 ? speed : 0;
    if ((settle -= DT) > 0) speed = 0;
    stepGame(game, direction * speed * DT, DT);
  }
  return game.phase === "over" ? { tenths: tenthsOf(game.time), game } : null;
}

export const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
