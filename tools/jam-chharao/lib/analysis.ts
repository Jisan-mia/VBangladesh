// What a jam asks of the player, read off its shortest solution. The level maker picks jams by these, and the tests prove
// each level really teaches what its line says. Pure; nothing in the game itself needs it.
import { COLS, occupancy, solve, blockers, type Kind, type Layout } from "./board";

export type Features = {
  /** Fewest moves. */
  par: number;
  /** Vehicles standing right in a hero's way. */
  direct: number;
  /** Moves beyond "clear each blocker once, then drive out": the part that needs thinking ahead. */
  extra: number;
  /** Some vehicle has to move twice (not in a row). */
  repeat: boolean;
  /** A vehicle that goes up and down moves in the shortest solution. */
  verticalMoved: boolean;
  /** Which kinds of vehicle (other than the heroes) move in the shortest solution. */
  moved: Set<Kind>;
  /** With the walls taken away the jam is shorter: the walls really are in the way. */
  wallsMatter: boolean;
  /** One vehicle stands in the way of both heroes at once (two heroes only). */
  shared: boolean;
};

export function analyse(lay: Layout): Features | null {
  const path = solve(lay, lay.start);
  if (!path) return null;
  const par = path.length, direct = blockers(lay, lay.start).length;
  const times = new Map<number, number>();
  const moved = new Set<Kind>();
  let verticalMoved = false;
  for (const move of path) {
    times.set(move.car, (times.get(move.car) ?? 0) + 1);
    if (move.car >= lay.heroes) { moved.add(lay.cars[move.car].kind); if (lay.cars[move.car].down) verticalMoved = true; }
  }
  const grid = occupancy(lay, lay.start);
  const above = (hero: number) => new Set(Array.from({ length: lay.start[hero] }, (_, row) => grid[row * COLS + lay.cars[hero].line]).filter(at => at >= 0));
  const shared = lay.heroes === 2 && [...above(0)].some(at => above(1).has(at));
  const without = lay.walls.length ? solve({ ...lay, walls: [] }, lay.start)?.length ?? 0 : par;
  return {
    par, direct, extra: Math.max(0, par - direct - lay.heroes),
    repeat: [...times.entries()].some(([car, n]) => car >= lay.heroes && n >= 2),
    verticalMoved, moved, wallsMatter: lay.walls.length > 0 && without < par, shared,
  };
}
