// A headless thumb for tuning: it acts every `actMs` (turn, then step, then hold নামাও), sometimes picks a worse spot and
// sometimes lands one column off. It plays the real tick(), so a rate asserted here is the rate a person of that skill would get.
import { makeRng } from "../../../shared/game-core";
import { createGame, type Game } from "../lib/game";
import { starsFor } from "../lib/levels";
import { COLS, ROWS, SUI, TURNS } from "../lib/pieces";
import { deepest, fits, hardDrop, move, rotate, tick } from "../lib/step.hot";

/** `well`: keep the right-hand column open and weave several rows at once (a player chasing ★★★). */
export type Skill = { actMs: number; worse: number; off: number; hard: boolean; well?: boolean };
/** A careful thumb: quick, always the best spot. */
export const CAREFUL: Skill = { actMs: 200, worse: 0, off: 0, hard: true };
/** A casual thumb: a third of a second per action, a worse spot 30% of the time, one column off 10% of the time, no straight drops. */
export const CASUAL: Skill = { actMs: 340, worse: 0.3, off: 0.1, hard: false };
/** A player who plans: keeps a well open for the long strip and weaves several rows at once. */
export const PLANNER: Skill = { actMs: 220, worse: 0, off: 0, hard: true, well: true };
export const FRAME = 1000 / 60;

type Spot = { turn: number; x: number; value: number };

/** Every reachable resting place for the current strip, scored by height, holes, bumpiness and rows woven. */
export function spots(game: Game, well = false) {
  const found: Spot[] = [], kind = game.kind;
  const turns = kind === SUI || game.wet ? 1 : 4;
  for (let turn = 0; turn < turns; turn++) {
    const real = kind === SUI || game.wet ? game.turn : turn;
    for (let x = -3; x < COLS; x++) {
      if (!fits(game.board, kind, real, x, game.y)) continue;
      const board = game.board.slice();
      if (kind === SUI) board[deepest(board, x) * COLS + x] = 1;
      else {
        let y = game.y;
        while (fits(game.board, kind, real, x, y + 1)) y++;
        const cells = TURNS[kind][real];
        for (let i = 0; i < cells.length; i += 2) board[(y + cells[i + 1]) * COLS + x + cells[i]] = 1;
      }
      let lines = 0, holes = 0, total = 0, bump = 0, last = -1, wellFill = 0, maxH = 0;
      for (let row = 0; row < ROWS; row++) if (board.subarray(row * COLS, row * COLS + COLS).every(Boolean)) lines++;
      for (let col = 0; col < COLS; col++) {
        let top = ROWS;
        for (let row = 0; row < ROWS; row++) if (board[row * COLS + col]) { top = row; break; }
        for (let row = top + 1; row < ROWS; row++) if (!board[row * COLS + col]) holes++;
        const height = ROWS - top;
        total += height;
        if (height > maxH) maxH = height;
        if (col === COLS - 1) wellFill = height;
        else { if (last >= 0) bump += Math.abs(height - last); last = height; }
      }
      const value = !well ? lines * 0.76 - total * 0.51 - holes * 0.36 - bump * 0.18
        // Planner: rows woven several at a time pay off, singles barely count while the stack is low, the well stays open.
        : (lines >= 2 ? lines * lines * 2 : maxH > 9 ? lines * 2 : lines * -1.5) - total * 0.12 - holes * 1.6 - bump * 0.3 - (lines ? 0 : wellFill * 2.5) - (maxH > 10 ? (maxH - 10) * 4 : 0);
      found.push({ turn: real, x, value });
    }
  }
  return found.sort((a, b) => b.value - a.value);
}

/** Plays one run to its end (or `limitMs`). */
export function playBot(game: Game, skill: Skill, seed: number, limitMs = 20 * 60_000) {
  const rng = makeRng(seed * 31 + 7);
  let seen = -1, target: Spot | null = null, wait = 0, soft = false;
  for (let time = 0; time < limitMs && !game.over; time += FRAME) {
    if (game.live && game.strips !== seen) {
      seen = game.strips;
      const all = spots(game, skill.well);
      target = all.length ? all[rng() < skill.worse ? Math.min(all.length - 1, 1 + Math.floor(rng() * 3)) : 0] : null;
      if (target && rng() < skill.off) target = { ...target, x: target.x + (rng() < 0.5 ? -1 : 1) };
      soft = false;
      wait = skill.actMs;
    }
    wait -= FRAME;
    if (game.live && target && wait <= 0) {
      wait = skill.actMs;
      if (game.turn !== target.turn && !game.wet && game.kind !== SUI) rotate(game);
      else if (game.x !== target.x && move(game, game.x < target.x ? 1 : -1)) { /* stepped */ }
      else if (skill.hard) hardDrop(game);
      else soft = true;
    }
    tick(game, FRAME, soft);
  }
  return game;
}

/** Plays `seeds` runs of one পাটি; returns the share cleared and the average stars. */
export function rate(level: number, skill: Skill, seeds: number, rolls = 1, from = 1) {
  let cleared = 0, stars = 0;
  for (let seed = from; seed < from + seeds; seed++) {
    const game = playBot(createGame(seed * 7919, level, rolls), skill, seed);
    const earned = starsFor(level, game.rows, game.score);
    if (earned) cleared++;
    stars += earned;
  }
  return { cleared: cleared / seeds, stars: stars / seeds };
}
