// A careful player that proves a river can be crossed (used by the tests, not during play).
// It decides once per hop length, stands well inside every floater, keeps clear of the screen's edges
// and of a কচুরিপানা about to go under, so whatever it can do, a real thumb can too.
import { holds, mangoX, target, COLS, DOWN, HOP_T, LEFT, RIGHT, UP, WATER, type River } from "./river";

const MARGIN = -0.2, SLACK = 0.2, SIDE = 0.4;
const ACTIONS = [0, UP, LEFT, RIGHT, DOWN];

export type Spot = { row: number; x: number; t: number };

/** Can you be at x in this row at time t (strictly)? */
function safe(river: River, row: number, x: number, t: number) {
  const lane = river.lanes[row];
  if (lane.type !== WATER) return true;
  return x >= SIDE && x <= COLS - SIDE && holds(lane, x, t, MARGIN, SLACK);
}

/**
 * The earliest time a careful player standing at `from` reaches a spot that `goal` accepts, by breadth-first search
 * over hop-length steps (positions bucketed to a quarter cell). Returns the spot, or null within `limit` seconds.
 */
export function reach(river: River, from: Spot, goal: (row: number, x: number, t: number) => boolean, limit = 120): Spot | null {
  let layer = new Map<number, [number, number]>([[0, [from.row, from.x]]]);
  for (let t = from.t; t <= from.t + limit; t += HOP_T) {
    const next = new Map<number, [number, number]>();
    for (const [row, x] of layer.values()) {
      if (goal(row, x, t)) return { row, x, t };
      for (const action of ACTIONS) {
        let landRow = row, landX = x;
        if (action) {
          const landing = target(river, row, x, action);
          if (!landing) continue;
          [landRow, landX] = landing;
          if (!safe(river, landRow, landX, t)) continue;
        }
        const lane = river.lanes[landRow];
        const after = lane.type === WATER ? landX + lane.dir * lane.speed * HOP_T : landX;
        if (!safe(river, landRow, (landX + after) / 2, t + HOP_T / 2) || !safe(river, landRow, after, t + HOP_T)) continue;
        const key = landRow * 1000 + Math.round(after * 4);
        if (!next.has(key)) next.set(key, [landRow, after]);
      }
    }
    if (!next.size) return null;
    layer = next;
  }
  return null;
}

/** Seconds to the far ghat from `from`, or null. */
export function crossTime(river: River, from: Spot = { row: 0, x: 4.5, t: 0 }) {
  const top = river.lanes.length - 1;
  const end = reach(river, from, row => row === top);
  return end ? end.t - from.t : null;
}

/** A route that picks up every mango (in row order, each as early as possible) and then crosses: its total seconds, or null. */
export function allMangoTime(river: River) {
  let at: Spot | null = { row: 0, x: 4.5, t: 0 };
  for (const mango of river.mangoes) {
    at = reach(river, at, (row, x, t) => row === mango.row && Math.abs(mangoX(river, mango, t) - x) < 0.5);
    if (!at) return null;
  }
  const top = river.lanes.length - 1;
  const end = reach(river, at, row => row === top);
  return end ? end.t : null;
}
