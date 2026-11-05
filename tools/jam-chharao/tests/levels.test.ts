// The ladder: 4 streets × 8 jams. Every jam is solvable in exactly its recorded moves, every teach line is true of its jam, and
// the bots (lib-free players in bot.ts) find the difficulty where the design says it is.
import assert from "node:assert/strict";
import test from "node:test";
import { analyse, type Features } from "../lib/analysis";
import { COLS, CELLS, MAX_CARS, ROWS, isHero, levelCode, occupancy, parseLevel, solve, wallCode, type Kind } from "../lib/board";
import { layoutOf, parOf, starsOf, twoStarMoves, LEVEL_COUNT } from "../lib/game";
import { LEVELS } from "../lib/levels";
import { LEVEL_INFO, WORLDS, inWorld, isFinale, worldIndex } from "../lib/worlds";
import { CASUAL, FIRST_TIMER, SHARP, playAs } from "./bot";

test("the ladder is 32 different jams in four streets of eight, each street ending on a named finale", () => {
  assert.equal(LEVEL_COUNT, 32);
  assert.equal(LEVELS.length, 32);
  assert.equal(LEVEL_INFO.length, 32);
  assert.equal(new Set(LEVELS.map(([code, walls]) => code + "|" + walls)).size, 32);
  assert.deepEqual(WORLDS.map(world => [world.from, world.to]), [[1, 8], [9, 16], [17, 24], [25, 32]]);
  assert.deepEqual(LEVEL_INFO.flatMap((info, i) => info.finale ? [i + 1] : []), [8, 16, 24, 32]);
  assert.deepEqual(LEVEL_INFO.filter(info => info.finale).map(info => info.name), ["গলির মুখের জ্যাম", "অফিস ছুটির মোড়", "ওয়াসার খোঁড়া রাস্তা", "ঈদের আগের রাত"]);
  assert.ok(LEVEL_INFO.every(info => info.name.length > 0 && info.teach.length > 8 && !/আপনি|করুন|দেখুন/.test(info.teach)));
  for (let level = 1; level <= 32; level++) assert.equal(isFinale(level), level % 8 === 0);
  assert.equal(inWorld(9), 1);
  assert.equal(inWorld(32), 8);
});

test("every jam is a fair street: nothing overlapping, at most 10 vehicles, heroes first, no wall in a hero's way", () => {
  LEVELS.forEach(([code, walls], index) => {
    const level = index + 1, lay = layoutOf(level), world = worldIndex(level);
    const label = `jam ${level} ${code}`;
    assert.ok(lay.cars.length >= 2 && lay.cars.length <= MAX_CARS, label);
    assert.equal(lay.heroes, world === 3 ? 2 : 1, label);
    assert.deepEqual(lay.cars[0], { kind: "cng", len: 2, down: true, line: lay.cars[0].line }, label);
    if (lay.heroes === 2) assert.equal(lay.cars[1].kind, "cng2", label);
    lay.cars.forEach((car, i) => assert.equal(isHero(car.kind), i < lay.heroes, `${label}: only the first vehicles are heroes`));
    assert.equal(levelCode(lay.cars, lay.start), code, label);
    assert.equal(wallCode(lay.walls), walls, label);
    const grid = occupancy(lay, lay.start);
    const cells = lay.cars.reduce((sum, car) => sum + car.len, 0) + lay.walls.length;
    assert.equal(grid.filter(cell => cell !== -1).length, cells, `overlap in ${label}`);
    lay.cars.forEach((car, i) => assert.ok(lay.start[i] >= 0 && lay.start[i] + car.len <= (car.down ? ROWS : COLS), label));
    lay.walls.forEach(cell => assert.ok(cell >= 0 && cell < CELLS, label));
    // never already out, and no vehicle that goes up and down sits in a hero's lane (it could never leave it)
    for (let h = 0; h < lay.heroes; h++) assert.ok(lay.start[h] > 0, `${label}: hero ${h} starts in the street`);
    lay.cars.forEach((car, i) => { if (i >= lay.heroes && car.down) for (let h = 0; h < lay.heroes; h++) assert.notEqual(car.line, lay.cars[h].line, label); });
    // the two heroes use different lanes
    if (lay.heroes === 2) assert.notEqual(lay.cars[0].line, lay.cars[1].line, label);
  });
});

test("each street adds exactly its own thing: vehicles by street, walls only after the first two", () => {
  const kinds = (level: number) => new Set(layoutOf(level).cars.filter(car => !isHero(car.kind)).map(car => car.kind));
  const longs = (level: number) => [...kinds(level)].filter(kind => kind === "bus" || kind === "truck");
  for (let level = 1; level <= 8; level++) { assert.deepEqual(longs(level), [], `jam ${level}`); assert.equal(layoutOf(level).walls.length, 0); assert.equal(layoutOf(level).heroes, 1); }
  for (let level = 9; level <= 16; level++) assert.equal(layoutOf(level).walls.length, 0, `jam ${level}`);
  assert.ok(longs(9).includes("bus") && longs(10).includes("truck"));
  for (let level = 17; level <= 24; level++) { assert.ok(layoutOf(level).walls.length >= 1, `jam ${level}`); assert.equal(layoutOf(level).heroes, 1); }
  for (let level = 25; level <= 32; level++) assert.equal(layoutOf(level).heroes, 2, `jam ${level}`);
  const first = new Set<Kind>();
  for (let level = 1; level <= 8; level++) for (const kind of kinds(level)) first.add(kind);
  assert.deepEqual([...first].sort(), ["rickshaw", "van"], "street one: small vehicles only");
});

test("every jam is solvable in exactly its recorded moves, and the moves never fall within a street", () => {
  LEVELS.forEach(([, , par], index) => {
    const lay = layoutOf(index + 1);
    assert.equal(solve(lay, lay.start)?.length, par, `jam ${index + 1}`);
  });
  for (const world of WORLDS) for (let level = world.from + 1; level <= world.to; level++) assert.ok(parOf(level) >= parOf(level - 1), `jam ${level} is not easier than the one before`);
  assert.equal(parOf(1), 2, "the first jam is two moves, a win inside ten seconds");
  assert.ok(parOf(32) >= 14);
  assert.ok(parOf(24) > parOf(17) && parOf(16) > parOf(9) && parOf(8) > parOf(1));
});

/** What each jam must show, so its teach line is true (the same table the level maker used). */
type Need = { cars?: readonly [number, number]; walls?: readonly [number, number]; direct?: readonly [number, number]; extra?: readonly [number, number]; repeat?: boolean; vertical?: boolean; moved?: Kind[]; allMoved?: Kind[]; wallsMatter?: boolean; shared?: boolean };
const NEEDS: Record<number, Need> = {
  1: { cars: [2, 2], direct: [1, 1] }, 2: { cars: [3, 3], direct: [2, 2], extra: [0, 0] }, 3: { cars: [3, 4], direct: [1, 1], extra: [1, 1] },
  4: { cars: [4, 5], extra: [1, 2], vertical: true }, 5: { cars: [5, 6], repeat: true }, 6: { cars: [6, 7], extra: [2, 4] },
  9: { moved: ["bus"] }, 10: { moved: ["truck"] }, 11: { extra: [1, 4], moved: ["bus", "truck"] }, 12: { allMoved: ["bus", "truck"] }, 13: { repeat: true, moved: ["bus", "truck"] },
  17: { walls: [1, 1], wallsMatter: true }, 18: { walls: [1, 2], wallsMatter: true }, 19: { walls: [2, 2], wallsMatter: true }, 20: { walls: [2, 3], wallsMatter: true },
  21: { walls: [2, 3], wallsMatter: true }, 22: { walls: [3, 3], wallsMatter: true }, 23: { walls: [3, 4], wallsMatter: true }, 24: { walls: [3, 4], wallsMatter: true },
  28: { shared: true }, 30: { walls: [1, 2], wallsMatter: true },
};
test("every teach line is true of its jam (the new thing really is needed)", () => {
  for (const [key, need] of Object.entries(NEEDS)) {
    const level = Number(key), lay = layoutOf(level), f = analyse(lay) as Features;
    const label = `jam ${level} (${LEVEL_INFO[level - 1].name})`;
    const within = (value: number, range?: readonly [number, number]) => !range || (value >= range[0] && value <= range[1]);
    assert.ok(within(lay.cars.length, need.cars), `${label}: ${lay.cars.length} vehicles`);
    assert.ok(within(lay.walls.length, need.walls), `${label}: ${lay.walls.length} walls`);
    assert.ok(within(f.direct, need.direct), `${label}: ${f.direct} direct blockers`);
    assert.ok(within(f.extra, need.extra), `${label}: ${f.extra} moves of thinking ahead`);
    if (need.repeat) assert.ok(f.repeat, `${label}: a vehicle moves twice`);
    if (need.vertical) assert.ok(f.verticalMoved, `${label}: an up-and-down vehicle moves`);
    if (need.moved) assert.ok(need.moved.some(kind => f.moved.has(kind)), `${label}: ${need.moved.join("/")} moves`);
    if (need.allMoved) for (const kind of need.allMoved) assert.ok(f.moved.has(kind), `${label}: a ${kind} moves`);
    if (need.wallsMatter) assert.ok(f.wallsMatter, `${label}: the walls cost moves`);
    if (need.shared) assert.ok(f.shared, `${label}: one vehicle blocks both heroes`);
  }
  // Street 3's first jam shows its wall alone; street 4's first jam adds the blue CNG and nothing else.
  assert.equal(layoutOf(17).walls.length, 1);
  assert.equal(layoutOf(25).walls.length, 0);
  // Level 2 is two blockers and nothing to think ahead; level 1 is one blocker.
  assert.equal(analyse(layoutOf(1))!.direct, 1);
});

test("stars: three at par, two within a little slack, one otherwise; every jam can reach three", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const par = parOf(level), two = twoStarMoves(par);
    assert.ok(two >= par + 2 && two <= par + Math.ceil(par / 4) + 2, `jam ${level}: ${two}`);
    assert.equal(starsOf(par, par), 3);
    assert.equal(starsOf(par + 1, par), 2);
    assert.equal(starsOf(two, par), 2);
    assert.equal(starsOf(two + 1, par), 1);
    assert.equal(starsOf(par, par, 1), 2, "the first hint caps the jam at two stars");
    assert.equal(starsOf(par, par, 2), 1, "the second at one");
    assert.equal(playAs(level, SHARP, 1).game.moves.length, par, `a sharp player gets three stars on jam ${level}`);
  }
});

const SEEDS = 60;
function rates(level: number, style: typeof CASUAL) {
  let won = 0, three = 0, two = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { game } = playAs(level, style, seed * 7919 + level);
    if (!game.won) continue;
    won++;
    const stars = starsOf(game.moves.length, parOf(level));
    if (stars === 3) three++;
    if (stars >= 2) two++;
  }
  return { won: won / SEEDS, three: three / SEEDS, two: two / SEEDS };
}

test("bot targets: a first-timer clears jam 1 inside ten turns, a casual player gets three stars there, and finishes every jam", () => {
  let quick = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const { game, turns } = playAs(1, FIRST_TIMER, seed * 131);
    if (game.won && turns <= 10) quick++;
  }
  assert.ok(quick / 200 >= 0.95, `first-timer inside 10 turns: ${quick / 200}`);
  assert.ok(rates(1, CASUAL).three >= 0.85, "casual ★★★ on jam 1");
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const casual = rates(level, CASUAL), first = rates(level, FIRST_TIMER);
    assert.equal(casual.won, 1, `jam ${level}: a casual player always gets out`);
    assert.ok(casual.two >= 0.7, `jam ${level}: casual ★★ ${casual.two}`);
    assert.ok(first.won >= 0.85, `jam ${level}: a first-timer, patient, gets out ${first.won}`);
  }
});

test("bot targets: three stars take thought on each finale, and the finale is the hardest of its street for a casual player", () => {
  for (const finale of [8, 16, 24, 32]) {
    const here = rates(finale, CASUAL);
    assert.ok(here.three <= 0.5, `finale ${finale}: casual ★★★ ${here.three}`);
    const street = WORLDS[worldIndex(finale)];
    const easier = Array.from({ length: 4 }, (_, i) => street.from + i).map(level => rates(level, CASUAL).three);
    assert.ok(here.three < Math.max(...easier), `finale ${finale} is harder than the street's first jams`);
  }
});
