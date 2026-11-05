// Builds lib/levels.ts offline (a few minutes): node --import tsx tools/jam-chharao/scripts/make-levels.ts
// Random jams are explored whole. A jam's states each have a distance to freedom (a breadth-first search back from the
// cleared states), so a level can be any position of a jam at the par it needs, and its fewest moves is known exactly.
// A slot of the ladder (see SLOTS) asks for a par, a crowd and what the shortest solution must show (a bus moving, a wall
// in the way, a vehicle moving twice…); the first jam that really does is kept. Seeded and counted, not timed, so a
// re-run writes the same file.
import { writeFileSync } from "node:fs";
import { makeRng, pick } from "../../../shared/game-core";
import { analyse, type Features } from "../lib/analysis";
import { CELLS, COLS, MAX_CARS, ROWS, cellOf, eachSlide, laneLength, levelCode, occupancy, pack, parseLevel, posIn, wallCode, type Car, type Kind, type Layout } from "../lib/board";

const rng = makeRng(20261105);
const STATE_CAP = 25_000; // states a jam may have, so the in-page hint search stays quick on a cheap phone

type Range = readonly [number, number];
type Slot = {
  world: 1 | 2 | 3 | 4; par: number; cars: Range; walls?: Range; direct?: Range; extra?: Range;
  repeat?: boolean; vertical?: boolean; shared?: boolean; moved?: Kind[]; allMoved?: Kind[]; wallsMatter?: boolean;
};
const SLOTS: Slot[] = [
  // 1 গলির মুখ: রিকশা আর ভ্যান
  { world: 1, par: 2, cars: [2, 2], direct: [1, 1] },
  { world: 1, par: 3, cars: [3, 3], direct: [2, 2], extra: [0, 0] },
  { world: 1, par: 3, cars: [3, 4], direct: [1, 1], extra: [1, 1] },
  { world: 1, par: 4, cars: [4, 5], extra: [1, 2], vertical: true },
  { world: 1, par: 5, cars: [5, 6], repeat: true },
  { world: 1, par: 5, cars: [6, 7], extra: [2, 4] },
  { world: 1, par: 6, cars: [7, 8] },
  { world: 1, par: 7, cars: [8, 9] },
  // 2 বড় রাস্তা: বাস আর ট্রাক
  { world: 2, par: 3, cars: [3, 5], moved: ["bus"] },
  { world: 2, par: 4, cars: [4, 5], moved: ["truck"] },
  { world: 2, par: 5, cars: [5, 6], extra: [1, 4], moved: ["bus", "truck"] },
  { world: 2, par: 6, cars: [6, 7], allMoved: ["bus", "truck"] },
  { world: 2, par: 7, cars: [7, 8], repeat: true, moved: ["bus", "truck"] },
  { world: 2, par: 8, cars: [8, 9], moved: ["bus", "truck"] },
  { world: 2, par: 9, cars: [8, 9], moved: ["bus", "truck"] },
  { world: 2, par: 10, cars: [9, 10], moved: ["bus", "truck"] },
  // 3 রাস্তা খোঁড়া: ইটের স্তূপ আর বেড়া
  { world: 3, par: 3, cars: [3, 4], walls: [1, 1], wallsMatter: true },
  { world: 3, par: 4, cars: [4, 5], walls: [1, 2], wallsMatter: true },
  { world: 3, par: 5, cars: [5, 6], walls: [2, 2], wallsMatter: true },
  { world: 3, par: 6, cars: [6, 7], walls: [2, 3], wallsMatter: true },
  { world: 3, par: 7, cars: [6, 7], walls: [2, 3], wallsMatter: true },
  { world: 3, par: 8, cars: [7, 8], walls: [3, 3], wallsMatter: true },
  { world: 3, par: 10, cars: [8, 9], walls: [3, 4], wallsMatter: true },
  { world: 3, par: 12, cars: [8, 9], walls: [3, 4], wallsMatter: true },
  // 4 ঈদের আগের রাত: দুটো CNG
  { world: 4, par: 4, cars: [3, 4] },
  { world: 4, par: 5, cars: [4, 5] },
  { world: 4, par: 6, cars: [5, 6] },
  { world: 4, par: 7, cars: [6, 7], shared: true },
  { world: 4, par: 9, cars: [7, 8] },
  { world: 4, par: 10, cars: [7, 9], walls: [1, 2], wallsMatter: true },
  { world: 4, par: 12, cars: [8, 10], walls: [1, 2] },
  { world: 4, par: 14, cars: [9, 10], walls: [1, 2] },
];

const between = (n: number, [low, high]: Range) => n >= low && n <= high;

function place(cars: Car[], pos: number[], walls: number[], car: Car) {
  car.line = pick(rng, car.down ? COLS : ROWS);
  const at = pick(rng, laneLength(car) - car.len + 1);
  const grid = occupancy({ cars, walls, heroes: 0 }, pos);
  for (let k = 0; k < car.len; k++) if (grid[cellOf(car, at + k)] !== -1) return false;
  cars.push(car); pos.push(at);
  return true;
}

/** A random jam for this slot: heroes first (each in its own lane), then walls, then the other vehicles. */
function randomLayout(slot: Slot): Layout {
  const heroes = slot.world === 4 ? 2 : 1;
  const cars: Car[] = [], pos: number[] = [];
  const cols: number[] = [];
  while (cols.length < heroes) { const col = heroes === 1 ? 1 + pick(rng, 4) : pick(rng, COLS); if (!cols.includes(col) && cols.every(c => Math.abs(c - col) >= 2)) cols.push(col); }
  if (heroes === 2) cols.sort(() => rng() - 0.5);
  cols.forEach((col, i) => { cars.push({ kind: i ? "cng2" : "cng", len: 2, down: true, line: col }); pos.push(1 + pick(rng, 5)); });
  const walls: number[] = [];
  const [wallLow, wallHigh] = slot.walls ?? [0, 0];
  const wallCount = wallLow + pick(rng, wallHigh - wallLow + 1);
  const inHeroLane = (cell: number) => cars.some((car, i) => i < heroes && car.line === cell % COLS && Math.floor(cell / COLS) < pos[i] + 2);
  for (let tries = 0; walls.length < wallCount && tries < 200; tries++) {
    const cell = pick(rng, CELLS);
    if (walls.includes(cell) || inHeroLane(cell)) continue;
    walls.push(cell);
  }
  const want = slot.cars[0] + pick(rng, slot.cars[1] - slot.cars[0] + 1);
  for (let tries = 0; cars.length < want && tries < 400; tries++) {
    const long = slot.world >= 2 && rng() < 0.45;
    const kind: Kind = long ? (rng() < 0.5 ? "bus" : "truck") : rng() < 0.55 ? "rickshaw" : "van";
    const car: Car = { kind, len: long ? 3 : 2, down: rng() < 0.5, line: 0 };
    if (!place(cars, pos, walls, car)) continue;
    // A vehicle that goes up and down in a hero's lane could never leave it.
    if (car.down && cols.includes(car.line)) { cars.pop(); pos.pop(); }
  }
  return { cars, start: pos, walls, heroes };
}

const layoutKey = (lay: Layout) => lay.cars.map(c => `${c.kind[0]}${c.down ? "d" : "a"}${c.line}`).sort().join("") + "|" + wallCode(lay.walls);

/**
 * Explores a jam whole (every position reachable from its random start) and returns its best start at distance `par` from
 * freedom: the one with the heroes lowest in the street (the longest drive), none already out. Null if there is none.
 */
function explore(lay: Layout, par: number) {
  const heroMask = (1 << (3 * lay.heroes)) - 1;
  const start = pack(lay.start);
  const index = new Map<number, number>([[start, 0]]), keys = [start], out: number[][] = [];
  const pos = lay.start.slice(), grid = new Int8Array(CELLS);
  for (let i = 0; i < keys.length; i++) {
    if (keys.length > STATE_CAP) return null;
    const edges: number[] = [];
    eachSlide(lay, keys[i], pos, grid, next => {
      let to = index.get(next);
      if (to === undefined) { to = keys.length; index.set(next, to); keys.push(next); }
      edges.push(to);
    });
    out.push(edges);
  }
  const back: number[][] = keys.map(() => []);
  out.forEach((edges, from) => edges.forEach(to => back[to].push(from)));
  const dist = new Int16Array(keys.length).fill(-1);
  let frontier: number[] = [];
  keys.forEach((key, i) => { if ((key & heroMask) === 0) { dist[i] = 0; frontier.push(i); } });
  if (!frontier.length) return null;
  for (let d = 0; frontier.length && d < par; d++) {
    const next: number[] = [];
    for (const at of frontier) for (const from of back[at]) if (dist[from] < 0) { dist[from] = d + 1; next.push(from); }
    frontier = next;
  }
  let best: { key: number; depth: number } | null = null;
  keys.forEach((key, i) => {
    if (dist[i] !== par) return;
    let depth = 0, ok = true;
    for (let h = 0; h < lay.heroes; h++) { const at = posIn(key, h); if (at === 0) ok = false; depth += at; }
    if (ok && (!best || depth > best.depth)) best = { key, depth };
  });
  if (!best) return null;
  const { key, depth } = best as { key: number; depth: number };
  return { lay: { ...lay, start: lay.cars.map((_, i) => posIn(key, i)) } as Layout, par, depth };
}

function fits(slot: Slot, f: Features, lay: Layout) {
  if (slot.direct && !between(f.direct, slot.direct)) return false;
  if (slot.extra && !between(f.extra, slot.extra)) return false;
  if (slot.repeat && !f.repeat) return false;
  if (slot.vertical && !f.verticalMoved) return false;
  if (slot.moved && !slot.moved.some(kind => f.moved.has(kind))) return false;
  if (slot.allMoved && !slot.allMoved.every(kind => f.moved.has(kind))) return false;
  if (slot.wallsMatter && !f.wallsMatter) return false;
  if (slot.shared && !f.shared) return false;
  return slot.world !== 4 || lay.heroes === 2;
}

const ATTEMPTS = Number(process.env.ATTEMPTS ?? 12000), WANT = 6;
const chosen: { lay: Layout; par: number; depth: number }[] = [];
const used = new Set<string>();
const started = Date.now();
SLOTS.forEach((slot, index) => {
  const good: { lay: Layout; par: number; depth: number }[] = [];
  let tried = 0;
  for (; tried < ATTEMPTS && good.length < WANT; tried++) {
    const lay = randomLayout(slot);
    if (lay.cars.length < slot.cars[0] || used.has(layoutKey(lay))) continue;
    const found = explore(lay, slot.par);
    if (!found) continue;
    const f = analyse(found.lay);
    if (f && f.par === slot.par && fits(slot, f, found.lay)) good.push(found);
  }
  if (!good.length) throw new Error(`no jam for level ${index + 1} (${JSON.stringify(slot)}) in ${tried} tries`);
  // Prefer a long drive for the heroes, then a fuller street.
  good.sort((a, b) => b.depth - a.depth || b.lay.cars.length - a.lay.cars.length);
  used.add(layoutKey(good[0].lay));
  chosen.push(good[0]);
  console.error(`level ${index + 1}: par ${slot.par}, ${good.length} found in ${tried} tries, ${Math.round((Date.now() - started) / 1000)}s`);
});

const out = `// Generated by scripts/make-levels.ts: don't edit by hand. Each level: [vehicles, walls, fewest moves to clear the street].
// Two characters a vehicle (see parseLevel in board.ts), one a wall cell. The tests re-solve every level and check these numbers.
export const LEVELS: ReadonlyArray<readonly [string, string, number]> = [
${chosen.map(c => `  ["${levelCode(c.lay.cars, c.lay.start)}", "${wallCode(c.lay.walls)}", ${c.par}],`).join("\n")}
];
`;
writeFileSync(new URL("../lib/levels.ts", import.meta.url), out);
console.error("levels", chosen.map(c => `${c.par}/${c.lay.cars.length}${c.lay.walls.length ? "w" + c.lay.walls.length : ""}`).join(" "));
void parseLevel;
