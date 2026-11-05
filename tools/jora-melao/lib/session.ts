// A board's timers as a pure reducer: the component passes performance.now() in, so the tests replay every statechart path.
// There is one pausable clock: the peek (all cards up) or a missed pair waiting to turn back. Play time counts only while
// the board is in play and nothing pauses it, so nothing can happen behind a hidden tab, a blur, the menu or a sheet.
import { begin, endPeek, flip, settle, type Game } from "./play";
import { clockMs } from "./tick.hot";

/** Why play is paused: you went away (blur, a hidden tab, the player's menu), or a sheet is open (সব লেভেল). */
export type Why = "away" | "sheet";
export type Timer = "peek" | "miss" | null;
/** `dur` ms the timer lasts, `spent` ms banked on it, `since` when it last started running. `playSpent`/`playSince`: time in play. */
export type Run = { game: Game; why: Why | null; timer: Timer; dur: number; spent: number; since: number; playSpent: number; playSince: number };
export type Timing = { miss: number; breath: number };

export const TIMING: Timing = { miss: 1000, breath: 350 };
/** ধীরে খেলো: a missed pair stays up longer. The peek is unchanged, so stars are earned the same way. */
export const SLOW_TIMING: Timing = { miss: 1800, breath: 700 };

export const ready = (game: Game): Run => ({ game, why: null, timer: null, dur: 0, spent: 0, since: 0, playSpent: 0, playSince: -1 });

/** The board has been started and not finished. */
export const started = (run: Run) => run.game.phase === "peek" || run.game.phase === "play";
/** The clocks run: a started board and nothing pausing it. */
export const running = (run: Run) => run.why === null && started(run);
export const elapsed = (run: Run, now: number) => clockMs(run.spent, run.since, running(run) && run.timer !== null, now);
/** ms of real play so far (peek and pauses are not counted). */
export const playMs = (run: Run, now: number) => run.playSince < 0 ? run.playSpent : run.playSpent + Math.max(0, now - run.playSince);

const withTimer = (run: Run, game: Game, timer: Timer, dur: number, now: number): Run => ({ ...run, game, timer, dur, spent: 0, since: now });
const counting = (_run: Run, next: Run, now: number): Run => next.game.phase === "play" && next.playSince < 0 ? { ...next, playSince: now } : next;
const stopCount = (run: Run, now: number): Run => run.playSince < 0 ? run : { ...run, playSpent: playMs(run, now), playSince: -1 };

/** The start card's sign: the peek begins (world ২), or play. */
export function start(run: Run, now: number): Run {
  if (run.game.phase !== "ready") return run;
  const game = begin(run.game);
  return counting(run, game.phase === "peek" ? withTimer(run, game, "peek", game.spec.peek * 1000, now) : { ...run, game }, now);
}

/** The timers move the board on when their time is up, carrying any overshoot so nothing drifts. */
export function tick(run: Run, now: number): Run {
  if (!running(run) || run.timer === null) return run;
  const el = elapsed(run, now);
  if (el < run.dur) return run;
  const at = now - (el - run.dur);
  if (run.timer === "peek") return counting(run, { ...run, game: endPeek(run.game), timer: null, dur: 0, spent: 0, since: at }, at);
  return { ...run, game: settle(run.game), timer: null, dur: 0, spent: 0, since: at };
}

/** A tap on the card in place `index`. Does nothing while paused. A new miss starts the missed pair's timer. */
export function tap(run: Run, now: number, index: number, timing: Timing): Run {
  if (!running(run) || run.game.phase !== "play") return run;
  const game = flip(run.game, index);
  if (game === run.game) return run;
  const next = game.open.length === 2 ? withTimer(run, game, "miss", timing.miss, now) : { ...run, game, timer: null, dur: 0, spent: 0, since: now };
  return game.phase === "over" ? stopCount(next, now) : counting(run, next, now);
}

/**
 * Stops every clock. A missed pair still showing turns back right now (the birds fly if they were due), so nothing is
 * left face up under a pause. A sheet outranks an away pause: coming back from another window doesn't close the sheet.
 */
export function pause(run: Run, now: number, why: Why): Run {
  if (running(run)) {
    const stopped = stopCount(run, now);
    const game = stopped.game.open.length === 2 ? settle(stopped.game) : stopped.game;
    const timer = run.timer === "miss" ? null : run.timer;
    return { ...stopped, game, timer, spent: timer ? elapsed(run, now) : 0, why };
  }
  if (run.why !== null && why === "sheet" && run.why !== "sheet") return { ...run, why };
  return run;
}

/** Starts the clocks again after a short breath, but only from the pause this action ends. */
export function resume(run: Run, now: number, why: Why, breath: number): Run {
  if (run.why === null || run.why !== why) return run;
  const at = now + breath;
  return { ...run, why: null, since: at, playSince: run.game.phase === "play" ? at : -1 };
}

/** The peek's seconds left, rounded up (0 outside the peek). */
export function peekLeft(run: Run, now: number) {
  return run.timer === "peek" ? Math.max(0, Math.ceil((run.dur - elapsed(run, now)) / 1000)) : 0;
}
