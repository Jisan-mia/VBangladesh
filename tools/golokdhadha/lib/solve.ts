// The solver: every place the walker can stop (a cell and the keys in hand), every swipe from it, and the best way to the shop.
// Built once per board (setup, not per frame). Par times, the easy-mode hint, the progress line, the bots and the
// level tests all read it, so they agree with the walker exactly: they use the same `onward` rule step.hot.ts walks by.
import { DIRS, neighbour, onward, passable, type Board, type Dir } from "./board";

/** Seconds a ride takes: the walker steps on the stand, the রিকশা carries them, they step off. */
export const RIDE = 0.35;

export type Swipe = { cell: number; mask: number; cells: number; rides: number; done: boolean; picked: number };

/**
 * One swipe from a stop: walks through `dir`, then follows the lane round its bends the way the walker does. It stops at
 * a junction, a dead end, home, a key not yet in hand (picked up) and the far stand of a ride; the shop ends the run.
 * Returns false when the side is shut, or when the lane would circle for ever (gen.ts never ships such a board).
 */
export function swipe(board: Board, from: number, dir: Dir, mask: number, out: Swipe) {
  out.cells = 0; out.rides = 0; out.done = false; out.picked = 0;
  if (!passable(board, from, dir, mask)) return false;
  let cell = from, heading: Dir = dir;
  for (let guard = board.open.length * 2; guard > 0; guard--) {
    cell = neighbour(board.size, cell, heading);
    out.cells++;
    if (cell === board.exit) { out.done = true; break; }
    const key = board.key[cell];
    if (key && !(mask & key)) { mask |= key; out.picked = key; break; }
    const stand = board.portal[cell];
    if (stand >= 0) { cell = stand; out.rides++; break; }
    const next = onward(board, cell, heading, mask);
    if (!next) break;
    heading = next;
    if (guard === 1) return false;
  }
  out.cell = cell; out.mask = mask;
  return true;
}

/**
 * The stop graph. A stop is `cell * 4 + mask`; `GOAL` stands for the shop. For each stop and side, `to` is where the swipe
 * ends (-1 if shut), with the cells walked and rides taken. `reach` marks stops you can get to from home.
 */
export type Graph = {
  board: Board; stops: number; goal: number;
  to: Int32Array; cells: Int16Array; rides: Int8Array; picked: Int8Array;
  reach: Uint8Array;
  /** Cells to the shop from each stop, walking the best way: the progress line and the easy-mode hint. */
  togo: Float64Array;
  /** False if some swipe circles for ever. */
  sound: boolean;
};

export function buildGraph(board: Board): Graph {
  const stops = board.open.length * 4, goal = stops;
  const to = new Int32Array(stops * 4).fill(-1), cells = new Int16Array(stops * 4), rides = new Int8Array(stops * 4), picked = new Int8Array(stops * 4);
  const out: Swipe = { cell: 0, mask: 0, cells: 0, rides: 0, done: false, picked: 0 };
  let sound = true;
  for (let stop = 0; stop < stops; stop++) {
    const cell = stop >> 2, mask = stop & 3;
    for (let side = 0; side < 4; side++) {
      const dir = DIRS[side];
      if (!(board.open[cell] & dir)) continue;
      if (!swipe(board, cell, dir, mask, out)) { if (passable(board, cell, dir, mask)) sound = false; continue; }
      const edge = stop * 4 + side;
      to[edge] = out.done ? goal : out.cell * 4 + out.mask;
      cells[edge] = out.cells; rides[edge] = out.rides; picked[edge] = out.picked;
    }
  }
  const reach = new Uint8Array(stops + 1), queue = new Int32Array(stops + 1);
  let head = 0, tail = 0;
  queue[tail++] = board.start * 4; reach[board.start * 4] = 1;
  while (head < tail) {
    const stop = queue[head++];
    if (stop === goal) continue;
    for (let side = 0; side < 4; side++) {
      const next = to[stop * 4 + side];
      if (next >= 0 && !reach[next]) { reach[next] = 1; queue[tail++] = next; }
    }
  }
  const graph: Graph = { board, stops, goal, to, cells, rides, picked, reach, togo: new Float64Array(stops + 1), sound };
  graph.togo = costToGo(graph, 1, 0, 0);
  return graph;
}

/**
 * The cheapest way from every stop to the shop, where a swipe costs `perCell` for each cell walked, `perSwipe` for the
 * decision and `perRide` for each ride. Backward relaxation over a few hundred stops: plain Bellman–Ford is plenty.
 */
export function costToGo(graph: Graph, perCell: number, perSwipe: number, perRide: number) {
  const { stops, goal, to, cells, rides } = graph, cost = new Float64Array(stops + 1).fill(Infinity);
  cost[goal] = 0;
  for (let changed = true, rounds = 0; changed && rounds < stops; rounds++) {
    changed = false;
    for (let stop = 0; stop < stops; stop++) {
      let best = cost[stop];
      for (let side = 0; side < 4; side++) {
        const edge = stop * 4 + side, next = to[edge];
        if (next < 0 || cost[next] === Infinity) continue;
        const through = cost[next] + cells[edge] * perCell + perSwipe + rides[edge] * perRide;
        if (through < best - 1e-9) best = through;
      }
      if (best < cost[stop]) { cost[stop] = best; changed = true; }
    }
  }
  return cost;
}

/** The best side to swipe from a stop under a cost-to-go table, or -1 if there's no way on. */
export function bestSide(graph: Graph, stop: number, cost: Float64Array, perCell: number, perSwipe: number, perRide: number) {
  let best = -1, bestCost = Infinity;
  for (let side = 0; side < 4; side++) {
    const edge = stop * 4 + side, next = graph.to[edge];
    if (next < 0 || cost[next] === Infinity) continue;
    const through = cost[next] + graph.cells[edge] * perCell + perSwipe + graph.rides[edge] * perRide;
    if (through < bestCost - 1e-9) { bestCost = through; best = side; }
  }
  return best;
}

export type Best = { seconds: number; cells: number; swipes: number; rides: number; keys: number; stops: number[] };

/** The quickest walk from home at `speed` cells a second, allowing `think` seconds a decision: what par is built from. */
export function bestWalk(graph: Graph, speed: number, think: number): Best | null {
  const cost = costToGo(graph, 1 / speed, think, RIDE);
  let stop = graph.board.start * 4;
  if (cost[stop] === Infinity) return null;
  const best: Best = { seconds: cost[stop], cells: 0, swipes: 0, rides: 0, keys: 0, stops: [stop] };
  while (stop !== graph.goal && best.swipes < 1000) {
    const side = bestSide(graph, stop, cost, 1 / speed, think, RIDE), edge = stop * 4 + side;
    best.cells += graph.cells[edge]; best.rides += graph.rides[edge]; best.swipes++;
    if (graph.picked[edge]) best.keys++;
    stop = graph.to[edge];
    best.stops.push(stop);
  }
  return best;
}

/** Every stop you can reach can still reach the shop: no lane leads somewhere you can never leave. */
export function trapFree(graph: Graph) {
  for (let stop = 0; stop < graph.stops; stop++) if (graph.reach[stop] && graph.togo[stop] === Infinity) return false;
  return graph.togo[graph.board.start * 4] !== Infinity;
}

/**
 * The side to walk from anywhere (also mid-lane, after a tap walk or a turn back), for the easy hint: tries each side
 * with `swipe` and adds the cost to go from where it ends. -1 if nothing leads on.
 */
export function hintSide(graph: Graph, cell: number, mask: number, out: Swipe) {
  let best = -1, bestCost = Infinity;
  for (let side = 0; side < 4; side++) {
    if (!swipe(graph.board, cell, DIRS[side], mask, out)) continue;
    const rest = out.done ? 0 : graph.togo[out.cell * 4 + out.mask];
    if (rest + out.cells < bestCost) { bestCost = rest + out.cells; best = side; }
  }
  return best;
}

/** Cells left to the shop from a stop, for the progress line (capped so a wrong turn never shows as negative progress). */
export const cellsToGo = (graph: Graph, cell: number, mask: number) => graph.togo[cell * 4 + mask];
