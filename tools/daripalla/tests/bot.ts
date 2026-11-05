// A headless child for the level tests. It looks at the pans and follows the right move with probability `knows` (otherwise it puts a
// random piece on or taps a random number), lifts a piece off when the pan is too heavy with probability `fixes`, and takes `think`
// seconds over every press. The round's clock steps at 60 a second, as the page's loop does.
import { makeRng } from "../../../shared/game-core";
import { advance } from "../lib/clock.hot";
import { fewestPieces, PAN_MAX } from "../lib/puzzle";
import { choose, hint, lift, newRun, next, put, ST, totals, type Run } from "../lib/sim";

export type Child = { knows: number; fixes: number; think: number };
export const GUESSER: Child = { knows: 0, fixes: 0.5, think: 1.2 };
export const SEVEN: Child = { knows: 0.7, fixes: 0.8, think: 1.2 };
export const LEARNER: Child = { knows: 0.92, fixes: 1, think: 1 };
export const QUICK: Child = { knows: 1, fixes: 1, think: 0.8 };

export type Play = { run: Run; seconds: number; presses: number; firstWinAt: number };

export function playRound(level: number, seed: number, child: Child): Play {
  const rng = makeRng(seed ^ 0x9e3779b1), run = newRun(level, seed);
  let wait = 0, presses = 0, firstWinAt = 0;
  const tried = new Set<number>();
  for (let frame = 0; frame < 60 * 900; frame++) {
    advance(run, 1000 / 60);
    if (run.stage === ST.DONE && !firstWinAt) firstWinAt = (frame * 1000) / 60 / 1000;
    run.nev = 0;
    if (run.ended) return { run, seconds: frame / 60, presses, firstWinAt };
    wait -= 1000 / 60;
    if (wait > 0) continue;
    if (run.stage === ST.DONE) { if (run.ready && next(run)) { tried.clear(); wait = child.think * 1000; presses++; } continue; }
    if (run.stage === ST.ASK) {
      if (!run.askReady) continue;
      const answer = run.puzzle.answer, wrong = run.puzzle.choices.filter(value => value !== answer && !tried.has(value));
      const value = rng() < child.knows || !wrong.length ? answer : wrong[Math.floor(rng() * wrong.length)];
      tried.add(value);
      choose(run, value); presses++; wait = child.think * 1000;
      continue;
    }
    const { left, right } = totals(run);
    const room = PAN_MAX - run.puzzle.start.length - run.added.length;
    if (right > left) {
      if (rng() < child.fixes) lift(run); else put(run, Math.floor(rng() * run.puzzle.tray.length));
    } else if (fewestPieces(left - right, run.puzzle.tray.map(piece => piece.value)) > room) {
      // No room left for what is missing: a child sees the pan is crowded and takes something off.
      lift(run);
    } else {
      const step = hint(run), good = step && "tray" in step ? step.tray : Math.floor(rng() * run.puzzle.tray.length);
      // A full pan with something still missing: take the last piece off and think again.
      if (put(run, rng() < child.knows ? good : Math.floor(rng() * run.puzzle.tray.length)) === "full") lift(run);
    }
    presses++; wait = child.think * 1000;
  }
  throw new Error(`bot stuck: level ${level} seed ${seed} index ${run.index} stage ${run.stage} added ${run.added.length} ${JSON.stringify(totals(run))} tray ${run.puzzle.tray.map(piece => piece.value).join(",")}`);
}
