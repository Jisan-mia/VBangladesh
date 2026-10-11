// Builds lib/levels.ts offline (about eight minutes): node --import tsx tools/jam-chharao/scripts/make-levels.ts
// Each candidate jam is explored whole, and every position's fewest moves to freedom comes from a breadth-first search back
// from the solved positions. A level is always the farthest position of its own jam, so no easier start hides inside it.
// Random jams fill the easy end; small random changes to the hardest jams found ("hill climbing") fill the hard end.
// Seeded and counted, not timed, so a re-run writes the same file.
import { writeFileSync } from "node:fs";
import { makeRng, pick } from "../../../shared/game-core";
import { COLS, EXIT_COL, MAX_CARS, ROWS, cellOf, eachSlide, laneLength, levelCode, occupancy, pack, parseLevel, posIn, type Car, type Kind } from "../lib/board";

const LEVEL_COUNT = 40, RANDOM_JAMS = 12_000, CLIMBS = 160, CLIMB_STEPS = 250;
const CAP = 25_000; // states a jam may have, so the in-page "সমাধান দেখাও" search stays quick on a cheap phone
const rng = makeRng(20261011);

/** Drops one random vehicle somewhere free. Returns false if it didn't fit. */
function addCar(cars: Car[], pos: number[]) {
  const long = rng() < 0.6;
  const kind: Kind = long ? (rng() < 0.5 ? "bus" : "truck") : rng() < 0.55 ? "rickshaw" : "van";
  const car: Car = { kind, len: long ? 3 : 2, down: rng() < 0.5, line: 0 };
  car.line = pick(rng, car.down ? COLS : ROWS);
  if (car.down && car.line === EXIT_COL) return false; // it could never leave your lane
  const at = pick(rng, laneLength(car) - car.len + 1);
  const grid = occupancy(cars, pos);
  for (let k = 0; k < car.len; k++) if (grid[cellOf(car, at + k)] >= 0) return false;
  cars.push(car); pos.push(at);
  return true;
}

function randomJam(count: number) {
  const cars: Car[] = [{ kind: "cng", len: 2, down: true, line: EXIT_COL }], pos = [2 + pick(rng, ROWS - 3)];
  for (let tries = 0; cars.length < count && tries < 300; tries++) addCar(cars, pos);
  return { cars, pos };
}

/** Swap, add or remove one vehicle (never your CNG). */
function mutate(from: { cars: Car[]; pos: number[] }) {
  const cars = from.cars.slice(), pos = from.pos.slice();
  const roll = rng();
  if (roll < 0.25 && cars.length < MAX_CARS) { for (let t = 0; t < 50 && !addCar(cars, pos); t++); return { cars, pos }; }
  const i = 1 + pick(rng, cars.length - 1);
  cars.splice(i, 1); pos.splice(i, 1);
  if (roll < 0.35 && cars.length >= 6) return { cars, pos };
  for (let t = 0; t < 50 && !addCar(cars, pos); t++);
  return { cars, pos };
}

/** The farthest position of this jam and its distance, or null if the jam is too big or has no way out. */
function farthest(cars: Car[], start: number[]) {
  const pos = start.slice(), grid = new Int8Array(COLS * ROWS);
  const seen = new Set([pack(start)]), all = [pack(start)];
  for (let i = 0; i < all.length; i++) {
    if (all.length > CAP) return null;
    eachSlide(cars, all[i], pos, grid, next => { if (!seen.has(next)) { seen.add(next); all.push(next); } });
  }
  let frontier = all.filter(key => posIn(key, 0) === 0), far = 0;
  if (!frontier.length) return null;
  const done = new Set(frontier);
  while (true) {
    const next: number[] = [];
    for (const key of frontier) eachSlide(cars, key, pos, grid, k => { if (!done.has(k)) { done.add(k); next.push(k); } });
    if (!next.length) break;
    frontier = next; far++;
  }
  // Of the farthest positions, take the one with your CNG lowest on the street.
  const at = frontier.map(key => cars.map((_, i) => posIn(key, i))).sort((a, b) => b[0] - a[0])[0];
  return { far, at };
}

type Candidate = { code: string; best: number; cars: number; heroRow: number };
const pool = new Map<number, Candidate[]>();
function keep(cars: Car[], pos: number[]) {
  const result = farthest(cars, pos);
  if (!result || result.far < 3) return result;
  const list = pool.get(result.far) ?? [];
  const code = levelCode(cars, result.at);
  if (list.length < 60 && !list.some(c => c.code === code)) list.push({ code, best: result.far, cars: cars.length, heroRow: result.at[0] });
  pool.set(result.far, list);
  return result;
}

for (let attempt = 0; attempt < RANDOM_JAMS; attempt++) {
  const { cars, pos } = randomJam(attempt % 4 ? MAX_CARS - pick(rng, 3) : 4 + pick(rng, 4));
  keep(cars, pos);
}
for (let climb = 0; climb < CLIMBS; climb++) {
  const seeds = [...pool].filter(([d]) => d >= 10).flatMap(([, list]) => list);
  const start = parseLevel(seeds[pick(rng, seeds.length)].code);
  let here = { cars: start.cars, pos: start.start }, depth = 0;
  for (let step = 0; step < CLIMB_STEPS; step++) {
    const next = mutate(here);
    const result = keep(next.cars, next.pos);
    if (result && result.far >= depth) { here = { cars: next.cars, pos: result.at }; depth = result.far; }
  }
}
const depths = [...pool.keys()].sort((a, b) => a - b);
const deepest = depths[depths.length - 1];
console.error("pool", depths.map(d => `${d}:${pool.get(d)!.length}`).join(" "));

// The ladder: 3 moves first, gently at the start, then steeper, up to the deepest jams found (at most 40 moves).
// Vehicles grow from four to ten over the first twenty levels.
const top = Math.min(deepest, 40);
const levels: Candidate[] = [];
for (let i = 0; i < LEVEL_COUNT; i++) {
  const want = 3 + Math.round((top - 3) * (i / (LEVEL_COUNT - 1)) ** 1.3);
  const crowd = Math.min(MAX_CARS, 4 + Math.round(i * 0.3));
  const floor = levels.length ? levels[levels.length - 1].best : 0;
  const choice = depths.filter(d => d <= want && d >= floor).reverse()
    .map(d => pool.get(d)!.filter(c => !levels.some(l => l.code === c.code)).sort((a, b) => Math.abs(a.cars - crowd) - Math.abs(b.cars - crowd) || b.heroRow - a.heroRow)[0])
    .find(Boolean);
  if (!choice) throw new Error(`no jam left for level ${i + 1}`);
  levels.push(choice);
}

const out = `// Generated by scripts/make-levels.ts: don't edit by hand. Each level: [vehicles, fewest moves to get the CNG out].
// Two characters a vehicle (see parseLevel in board.ts). The tests re-solve every level and check these numbers.
export const LEVELS: ReadonlyArray<readonly [string, number]> = [
${levels.map(l => `  ["${l.code}", ${l.best}],`).join("\n")}
];
`;
writeFileSync(new URL("../lib/levels.ts", import.meta.url), out);
console.error("levels", levels.map(l => `${l.best}/${l.cars}`).join(" "));
