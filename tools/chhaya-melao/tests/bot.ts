// A headless child for the level tests: looks at the shelf, knows the right toy with probability `knows`, otherwise tries one it
// hasn't tried on that shadow yet at random; once the ring shows (after two slips) it follows the ring. A think time per
// try gives seconds. The hold after a finished wall is 1.5 s.
import { makeRng } from "../../../shared/game-core";
import { boardDone, createRound, hintSlot, isDone, nextBoard, place, shelfToys, type Round } from "../lib/round";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.7, think: 2 };
export const LEARNER: Child = { knows: 0.9, think: 1.5 };
export const HOLD_S = 1.5;

export type Play = { round: Round; tries: number; seconds: number; firstMatchAt: number };

export function playRound(level: number, seed: number, child: Child): Play {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let round = createRound(level, seed), tries = 0, seconds = 0, firstMatchAt = -1;
  for (;;) {
    while (!boardDone(round)) {
      const hint = hintSlot(round);
      const open = round.placed.map((done, slot) => (done ? -1 : slot)).filter(slot => slot >= 0);
      const slot = hint >= 0 ? hint : open[Math.floor(rng() * open.length)];
      const right = round.board.shadows[slot].id, shelf = shelfToys(round);
      const fresh = shelf.filter(toy => toy !== right && !round.tried.includes(`${toy}@${slot}`));
      const toy = hint >= 0 || rng() < child.knows || !fresh.length ? right : fresh[Math.floor(rng() * fresh.length)];
      const { round: next, outcome } = place(round, toy, slot);
      if (outcome === "ignored") throw new Error(`bot played an ignored move: ${toy}@${slot}`);
      round = next; tries++; seconds += child.think;
      if (outcome === "match" && firstMatchAt < 0) firstMatchAt = seconds;
      if (tries > 400) throw new Error("bot stuck");
    }
    if (isDone(round)) return { round, tries, seconds, firstMatchAt };
    seconds += HOLD_S;
    round = nextBoard(round);
  }
}
