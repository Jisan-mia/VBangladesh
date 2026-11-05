// Headless players for the level tests. Both walk the solver's stop graph with the walker's own rules (lib/solve.ts), so a
// bot's time is a time the real walker could post. The skilled bot has looked at the maze and knows the way; the casual
// bot takes the right turn most of the time, wanders otherwise, and needs longer to decide (longer still in the dark).
import { makeRng, pick } from "../../../shared/game-core";
import { boardOf, darkFor, SLOW_SPEED, SPEED, type Mode, type Where } from "../lib/levels";
import { bestSide, costToGo, RIDE } from "../lib/solve";

export type Bot = "skilled" | "casual";
export type BotRun = { tenths: number; swipes: number; cells: number; finished: boolean };

export function playBot(where: Where, mode: Mode, bot: Bot, seed: number, slow = false): BotRun {
  const { board, graph } = boardOf(where), rng = makeRng(seed), dark = darkFor(board, mode) > 0, speed = slow ? SLOW_SPEED : SPEED;
  const cost = costToGo(graph, 1 / SPEED, 0.5, RIDE);
  const right = bot === "skilled" ? 0.97 : dark ? 0.6 : 0.75;
  let stop = board.start * 4, seconds = bot === "skilled" ? 0.6 + rng() * 0.5 : 1.2 + rng() * 1.5 + (dark ? 1 : 0), swipes = 0, cells = 0;
  while (stop !== graph.goal && swipes < 400) {
    const best = bestSide(graph, stop, cost, 1 / SPEED, 0.5, RIDE), others: number[] = [];
    for (let side = 0; side < 4; side++) if (side !== best && graph.to[stop * 4 + side] >= 0) others.push(side);
    const side = rng() < right || !others.length ? best : others[pick(rng, others.length)];
    const edge = stop * 4 + side;
    seconds += (bot === "skilled" ? 0.25 + rng() * 0.15 : 0.5 + rng() * 0.4 + (dark ? 0.3 : 0)) + graph.cells[edge] / speed + graph.rides[edge] * RIDE;
    cells += graph.cells[edge]; swipes++;
    stop = graph.to[edge];
  }
  return { tenths: Math.round(seconds * 10), swipes, cells, finished: stop === graph.goal };
}
