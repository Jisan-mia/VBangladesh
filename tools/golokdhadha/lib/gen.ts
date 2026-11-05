// Seeded mazes with pieces. A level is a spec (lib/levels.ts); `generate` tries a fixed list of seeds, keeps the boards the
// solver accepts (solvable, no traps, every piece needed where the spec says so) and picks the one closest to the spec's
// number of turns. Same spec, same board, on every phone and on the server. Pure; runs once per level and is cached.
import { makeRng, pick } from "../../../shared/game-core";
import {
  closeWall, DIRS, emptyBoard, exits, makeOneWay, neighbour, OPPOSITE, openWall, passable, setGate, sideTo,
  type Board, type Dir,
} from "./board";
import { bestWalk, buildGraph, trapFree, type Graph } from "./solve";

export type Spec = {
  size: number;
  /** Base seed: candidate k uses seed + k. */
  seed: number;
  world: number;
  /** The decisions the best walk should need. */
  swipes: number;
  /** 0–1: how often the carver keeps going straight (long lanes for tapping). */
  straight?: number;
  /** 0–1: the share of dead ends knocked through into loops. */
  braid?: number;
  /** Gates and their keys. `detour`: the first key lies off the way. `chain`: the second key is behind the first gate. `shortcut`: the gate guards a short way, and a long way round needs no key. */
  keys?: { count: 1 | 2; detour?: boolean; chain?: boolean; shortcut?: boolean };
  /** One-way lanes: `along` the way, `against` it (forcing a way round), `shortcut` (a new one-way short cut) and `random` elsewhere. */
  current?: { along?: number; against?: number; shortcut?: number; random?: number };
  /** রিকশা rides you must take, one after another. */
  rides?: 1 | 2;
  /** The lantern's reach in cells, 0 for a lit maze. */
  dark?: number;
};

const CANDIDATES = 40;

/** A recursive backtracker that keeps its heading with chance `straight`, so lanes can run long or twist at every step. */
function carve(board: Board, rng: () => number, straight: number) {
  const { size } = board, count = size * size, seen = new Uint8Array(count), stack: number[] = [0], heading: Dir[] = [0 as unknown as Dir];
  seen[0] = 1;
  const options: Dir[] = [];
  while (stack.length) {
    const cell = stack[stack.length - 1], last = heading[heading.length - 1];
    options.length = 0;
    for (const dir of DIRS) { const next = neighbour(size, cell, dir); if (next >= 0 && !seen[next]) options.push(dir); }
    if (!options.length) { stack.pop(); heading.pop(); continue; }
    const dir = options.includes(last) && rng() < straight ? last : options[pick(rng, options.length)];
    const next = neighbour(size, cell, dir);
    openWall(board, cell, dir);
    seen[next] = 1;
    stack.push(next); heading.push(dir);
  }
}

/** The shortest cell route from home to the shop with `mask` keys, riding at stands; null if there's none. */
export function cellRoute(board: Board, mask: number, from = board.start): number[] | null {
  const count = board.open.length, previous = new Int32Array(count).fill(-1), queue = [from];
  previous[from] = from;
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    if (cell === board.exit) break;
    for (const dir of DIRS) {
      if (!passable(board, cell, dir, mask)) continue;
      let next = neighbour(board.size, cell, dir);
      if (previous[next] >= 0) continue;
      previous[next] = cell; queue.push(next);
      const stand = board.portal[next];
      if (stand >= 0 && previous[stand] < 0) { previous[stand] = next; queue.push(stand); next = stand; }
    }
  }
  if (previous[board.exit] < 0) return null;
  const route = [board.exit];
  while (route[route.length - 1] !== from) route.push(previous[route[route.length - 1]]);
  return route.reverse();
}

/** Cells reachable from home with `mask` keys (rides included). */
function reachable(board: Board, mask: number) {
  const seen = new Uint8Array(board.open.length), queue = [board.start];
  seen[board.start] = 1;
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    for (const dir of DIRS) {
      if (!passable(board, cell, dir, mask)) continue;
      const next = neighbour(board.size, cell, dir);
      if (!seen[next]) { seen[next] = 1; queue.push(next); }
      const stand = board.portal[next];
      if (stand >= 0 && !seen[stand]) { seen[stand] = 1; queue.push(stand); }
    }
  }
  return seen;
}

/** Steps of the route that are a real walk between neighbours (not a ride), as [from, dir]. */
function walkSteps(board: Board, route: number[]) {
  const steps: [number, Dir][] = [];
  for (let i = 0; i + 1 < route.length; i++) {
    const dir = sideTo(board.size, route[i], route[i + 1]);
    if (dir && board.portal[route[i + 1]] !== route[i]) steps.push([route[i], dir]);
  }
  return steps;
}

const special = (board: Board, cell: number) => cell === board.start || cell === board.exit || board.portal[cell] >= 0 || board.key[cell] > 0;
const isDeadEnd = (board: Board, cell: number) => exits(board, cell, 3) === 1;

/** Splits the maze at a step of the way and joins the halves with a pair of stands at dead ends, one on each side. */
function addRide(board: Board, rng: () => number, from: number, side: Uint8Array, ride: number) {
  const route = cellRoute(board, 3, from);
  if (!route) return false;
  const steps = walkSteps(board, route).filter(([cell]) => side[cell] === side[from]);
  if (steps.length < 4) return false;
  const [cut, dir] = steps[Math.floor(steps.length * (0.4 + rng() * 0.2))];
  closeWall(board, cut, dir);
  // The far half is everything the near side can no longer reach.
  const near = new Uint8Array(board.open.length), queue = [from];
  near[from] = 1;
  for (let head = 0; head < queue.length; head++) for (const d of DIRS) {
    const next = neighbour(board.size, queue[head], d);
    if (next >= 0 && board.open[queue[head]] & d && !near[next]) { near[next] = 1; queue.push(next); }
  }
  const nearEnds: number[] = [], farEnds: number[] = [];
  for (let cell = 0; cell < board.open.length; cell++) {
    if (side[cell] !== side[from] || special(board, cell) || !isDeadEnd(board, cell)) continue;
    if (near[cell] && cell !== from) nearEnds.push(cell);
    if (!near[cell] && !sideTo(board.size, cell, board.exit)) farEnds.push(cell);
  }
  if (!nearEnds.length || !farEnds.length) return false;
  const a = nearEnds[pick(rng, nearEnds.length)], b = farEnds[pick(rng, farEnds.length)];
  board.portal[a] = b; board.portal[b] = a;
  for (let cell = 0; cell < board.open.length; cell++) if (!near[cell] && side[cell] === side[from]) side[cell] = ride + 1;
  return b;
}

/** Knocks dead ends through into loops, never across a ride's cut (`side`) and never at a stand. */
function braid(board: Board, rng: () => number, share: number, side: Uint8Array) {
  for (let cell = 0; cell < board.open.length; cell++) {
    if (!isDeadEnd(board, cell) || board.portal[cell] >= 0 || rng() >= share) continue;
    const options = DIRS.filter(dir => { const next = neighbour(board.size, cell, dir); return next >= 0 && !(board.open[cell] & dir) && side[next] === side[cell] && board.portal[next] < 0; });
    if (options.length) openWall(board, cell, options[pick(rng, options.length)]);
  }
}

/** A gate on a step of the way that the shop can't be reached around; returns the step index, or -1. */
function gateOnWay(board: Board, rng: () => number, mask: number, colour: number, from: number, to: number) {
  const route = cellRoute(board, mask | colour);
  if (!route) return -1;
  const steps = walkSteps(board, route);
  for (let tries = 0; tries < 14; tries++) {
    const at = Math.floor(steps.length * (from + rng() * (to - from)));
    const [cell, dir] = steps[Math.min(steps.length - 1, at)];
    if (board.gate[cell * 4] + board.gate[cell * 4 + 1] + board.gate[cell * 4 + 2] + board.gate[cell * 4 + 3] || special(board, cell)) continue;
    setGate(board, cell, dir, colour);
    if (!cellRoute(board, mask)) return at;
    setGate(board, cell, dir, 0);
  }
  return -1;
}

/** Lays a key of `colour` where `mask` keys can reach: off the way down a side lane, or on the way before `before`. */
function placeKey(board: Board, rng: () => number, mask: number, colour: number, detour: boolean, behind: number, away = 2) {
  const can = reachable(board, mask), route = cellRoute(board, mask | colour) ?? [], onWay = new Set(route);
  const before = behind >= 0 ? reachable(board, behind) : null;
  const options: number[] = [];
  for (let cell = 0; cell < board.open.length; cell++) {
    if (!can[cell] || special(board, cell) || (before && before[cell])) continue;
    if (detour ? !onWay.has(cell) && isDeadEnd(board, cell) && near(board, cell, onWay) >= away : onWay.has(cell)) options.push(cell);
  }
  if (!options.length) return false;
  board.key[options[pick(rng, options.length)]] = colour;
  return true;
}

/** Steps from `cell` to the nearest cell of `set`, walking open sides (a detour's length). */
function near(board: Board, cell: number, set: Set<number>) {
  const dist = new Int16Array(board.open.length).fill(-1), queue = [cell];
  dist[cell] = 0;
  for (let head = 0; head < queue.length; head++) {
    const here = queue[head];
    if (set.has(here)) return dist[here];
    for (const dir of DIRS) { const next = neighbour(board.size, here, dir); if (next >= 0 && board.open[here] & dir && dist[next] < 0) { dist[next] = dist[here] + 1; queue.push(next); } }
  }
  return 99;
}

/** Opens a new passage between two cells of the way that sit side by side but far apart along it; returns [cell, dir] or null. */
function shortcutOnWay(board: Board, rng: () => number, mask: number, gap: number, longest = false): [number, Dir] | null {
  const route = cellRoute(board, mask);
  if (!route) return null;
  const options: [number, Dir][] = [];
  let most = 0;
  for (let i = 0; i < route.length; i++) for (let j = i + gap; j < route.length; j++) {
    const dir = sideTo(board.size, route[i], route[j]);
    if (!dir || board.open[route[i]] & dir) continue;
    if (longest && j - i > most) { most = j - i; options.length = 0; }
    if (!longest || j - i === most) options.push([route[i], dir]);
  }
  if (!options.length) return null;
  const chosen = options[pick(rng, options.length)];
  openWall(board, chosen[0], chosen[1]);
  return chosen;
}

function oneWays(board: Board, rng: () => number, spec: NonNullable<Spec["current"]>) {
  for (let i = 0; i < (spec.shortcut ?? 0); i++) {
    const made = shortcutOnWay(board, rng, 3, 6);
    if (!made) return false;
    makeOneWay(board, made[0], made[1]);
  }
  const route = cellRoute(board, 3);
  if (!route) return false;
  const steps = walkSteps(board, route).filter(([cell, dir]) => !board.gate[cell * 4 + DIRS.indexOf(dir)] && !special(board, cell));
  const along = spec.along ?? 0, against = spec.against ?? 0;
  for (let i = 0; i < along + against && steps.length; i++) {
    const [cell, dir] = steps.splice(pick(rng, steps.length), 1)[0];
    if (i < along) makeOneWay(board, cell, dir);
    else makeOneWay(board, neighbour(board.size, cell, dir), OPPOSITE[dir]);
  }
  const onWay = new Set(route);
  for (let i = 0, tries = 0; i < (spec.random ?? 0) && tries < 200; tries++) {
    const cell = pick(rng, board.open.length), dir = DIRS[pick(rng, 4)], next = neighbour(board.size, cell, dir);
    if (next < 0 || !(board.open[cell] & dir) || board.oneWay[cell] & dir || board.oneWay[next] & OPPOSITE[dir] || (onWay.has(cell) && onWay.has(next))) continue;
    makeOneWay(board, cell, dir);
    i++;
  }
  return true;
}

/** Builds candidate `k` of a spec, or null if this seed can't carry the spec's pieces. */
export function candidate(spec: Spec, k: number): { board: Board; graph: Graph } | null {
  const board = emptyBoard(spec.size, spec.seed + k, spec.world), rng = makeRng((spec.seed + k) * 2654435761);
  carve(board, rng, spec.straight ?? 0.35);
  const side = new Uint8Array(board.open.length);
  let from = board.start;
  for (let ride = 0; ride < (spec.rides ?? 0); ride++) {
    const landed = addRide(board, rng, from, side, ride);
    if (landed === false) return null;
    from = landed;
  }
  if (spec.braid) braid(board, rng, spec.braid, side);
  const keys = spec.keys;
  if (keys) {
    if (keys.shortcut) {
      const made = shortcutOnWay(board, rng, 0, 9, true);
      if (!made) return null;
      setGate(board, made[0], made[1], 1);
      if (!placeKey(board, rng, 0, 1, true, -1, 1)) return null;
    } else {
      if (gateOnWay(board, rng, 0, 1, keys.count === 2 ? 0.25 : 0.45, keys.count === 2 ? 0.45 : 0.75) < 0) return null;
      if (!placeKey(board, rng, 0, 1, !!keys.detour, -1)) return null;
      if (keys.count === 2) {
        if (gateOnWay(board, rng, 1, 2, 0.6, 0.85) < 0) return null;
        if (!placeKey(board, rng, keys.chain ? 1 : 0, 2, true, keys.chain ? 0 : -1)) return null;
      }
    }
  }
  if (spec.current && !oneWays(board, rng, spec.current)) return null;
  board.dark = spec.dark ?? 0;
  const graph = buildGraph(board);
  if (!graph.sound || !trapFree(graph)) return null;
  const best = bestWalk(graph, 14, 0.5);
  if (!best) return null;
  if (keys && best.keys < keys.count) return null;
  if (spec.rides && best.rides < spec.rides) return null;
  return { board, graph };
}

/** The spec's board: of the candidates that pass, the one whose best walk needs closest to `swipes` turns, then the longest walk. */
export function generate(spec: Spec): { board: Board; graph: Graph } {
  let chosen: { board: Board; graph: Graph } | null = null, chosenScore = Infinity;
  for (let k = 0; k < CANDIDATES; k++) {
    const made = candidate(spec, k);
    if (!made) continue;
    const best = bestWalk(made.graph, 14, 0.5)!;
    const score = Math.abs(best.swipes - spec.swipes) * 1000 - best.cells;
    if (score < chosenScore) { chosen = made; chosenScore = score; }
  }
  if (!chosen) throw new Error(`no board for spec ${spec.seed}`);
  return chosen;
}
