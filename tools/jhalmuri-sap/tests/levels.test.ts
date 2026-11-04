import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { chilliesIn, levelInterval, levelOf, levelStars, rectCells, wallCells, worldOf, LEVEL_COUNT, LEVELS, LEVELS_PER_WORLD, WORLDS } from "../lib/levels";
import { banner, caption, parseShared, previewTitle, sharedHash, sharedStars } from "../lib/link";
import {
  bodyCells, cellOf, createGame, deadAhead, gateWarning, headCell, levelLine, moveMs, nearMiss, setBody, speedStep, step, turn,
  BONUS_LIFE, CELLS, COLS, DX, DY, HOT_MOVES, MIN_LENGTH, ROWS, START, type Dir,
} from "../lib/snake";
import { playCasual, playStrong, rate } from "./bot";

const xy = (cell: number) => [cell % COLS, Math.floor(cell / COLS)] as const;
const neighbours = (cell: number) => {
  const [x, y] = xy(cell);
  return ([0, 1, 2, 3] as const).map(dir => [x + DX[dir], y + DY[dir]] as const).filter(([nx, ny]) => nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS).map(([nx, ny]) => cellOf(nx, ny));
};
function distances(from: number, wall: Set<number>) {
  const seen = new Map([[from, 0]]), queue = [from];
  while (queue.length) {
    const cell = queue.shift()!;
    for (const next of neighbours(cell)) if (!wall.has(next) && !seen.has(next)) { seen.set(next, seen.get(cell)! + 1); queue.push(next); }
  }
  return seen;
}
const SEEDS = Array.from({ length: 40 }, (_, index) => 1 + index * 7919);

test("three worlds of four levels, each ending in a named finale, with the old goals kept for old links", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.equal(WORLDS.length * LEVELS_PER_WORLD, LEVEL_COUNT);
  assert.deepEqual(LEVELS.map(level => level.goal), [5, 9, 10, 10, 12, 12, 13, 14, 15, 16, 18, 20], "the goals old level links are checked against");
  assert.deepEqual(LEVELS.map((level, index) => level.finale ? index + 1 : 0).filter(Boolean), [4, 8, 12]);
  assert.deepEqual([worldOf(0), worldOf(1), worldOf(4), worldOf(5), worldOf(12)], [0, 0, 0, 1, 2]);
  for (const level of LEVELS) {
    assert.ok(level.name.length <= 16 && level.teach.length <= 52, level.name);
    assert.equal(level.teach.normalize("NFC"), level.teach);
  }
});

test("each level brings exactly one new thing", () => {
  const features = (index: number) => {
    const level = LEVELS[index];
    return new Set([level.walls.length && "walls", level.crows?.length === 1 && "crow", (level.crows?.length ?? 0) > 1 && "crows", level.pipes && "pipes", level.gate && "gate", level.hot && "hot", level.sour && "sour", level.dark && "dark"].filter(Boolean));
  };
  // Levels 2 and 5 teach without a new object (the chilli's ring, narrow lanes); the finale of the last world combines what came before.
  for (const index of [2, 3, 5, 6, 7, 8, 9, 10]) {
    const before = features(index - 1), now = features(index);
    const added = [...now].filter(feature => !before.has(feature));
    assert.ok(added.length <= 1, `level ${index + 1} adds ${added.join(", ")}`);
  }
  assert.ok(features(11).size >= 4, "the last finale brings everything together");
});

test("every level is fair: walls on the board, open ground connected, a clear start lane, crows, pipes and the gate in open ground", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const data = levelOf(level), wall = new Set(wallCells(level));
    for (const [x, y, w, h] of data.walls) assert.ok(x >= 0 && y >= 0 && x + w <= COLS && y + h <= ROWS, `level ${level}: wall inside the fence`);
    for (const cell of START) assert.ok(!wall.has(cell), `level ${level}: the snake doesn't start in a wall`);
    for (let y = 7; y <= 10; y++) assert.ok(!wall.has(cellOf(5, y)), `level ${level}: four free moves before the first turn`);
    const reach = distances(START[0], wall);
    assert.equal(reach.size, CELLS - wall.size, `level ${level}: no sealed-off pocket`);
    let farthest = 0;
    for (let cell = 0; cell < CELLS; cell++) if (!wall.has(cell)) for (const d of distances(cell, wall).values()) farthest = Math.max(farthest, d);
    assert.ok(farthest < BONUS_LIFE - 10, `level ${level}: farthest walk ${farthest} moves`);
    for (const [x0, y0, x1, y1] of data.crows ?? []) {
      assert.ok(x0 === x1 || y0 === y1, `level ${level}: a crow walks a straight line`);
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
        assert.ok(!wall.has(cellOf(x, y)), `level ${level}: the crow's line is open ground`);
        assert.ok(x !== 5 || y < 7, `level ${level}: no crow in the start lane`);
      }
    }
    if (data.pipes) for (const cell of [cellOf(data.pipes[0], data.pipes[1]), cellOf(data.pipes[2], data.pipes[3])]) assert.ok(!wall.has(cell) && !START.includes(cell), `level ${level}: pipe mouth in open ground`);
    if (data.gate) for (const cell of rectCells([data.gate.cells])) assert.ok(!wall.has(cell), `level ${level}: the gate stands in open ground`);
    if (level > 1) {
      assert.ok(data.goal >= levelOf(level - 1).goal && data.ms <= levelOf(level - 1).ms, `level ${level}: one small step harder`);
      assert.ok(chilliesIn(level) >= 2, `level ${level}: room for 2 stars`);
    }
  }
  assert.equal(levelOf(1).walls.length + levelOf(2).walls.length, 0, "the first two levels have no walls");
});

test("the strong bot clears every level on at least 90% of seeds; food never lands on tin, a pipe or the gate", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    let cleared = 0;
    for (const seed of SEEDS) {
      const { game } = playStrong(seed, level);
      assert.ok(game.food < 0 || (!game.wall[game.food] && !game.gateCell[game.food] && game.food !== game.pipeA && game.food !== game.pipeB));
      if (!game.won) continue;
      cleared++;
      assert.equal(game.eaten, levelOf(level).goal);
      assert.ok(game.golden <= chilliesIn(level));
      assert.equal(game.score, game.eaten * 10 + game.golden * 30);
    }
    assert.ok(cleared / SEEDS.length >= 0.9, `level ${level}: strong bot ${cleared}/${SEEDS.length}`);
  }
});

test("the casual bot: level 1 almost always, world 1 nearly always, and each later finale is a real test", () => {
  const casual = (level: number) => rate(level, SEEDS, playCasual);
  assert.ok(casual(1) >= 0.95, `level 1: ${casual(1)}`);
  for (const level of [2, 3, 4]) assert.ok(casual(level) >= 0.85, `level ${level}: ${casual(level)}`);
  for (const level of [8, 12]) {
    const r = casual(level);
    assert.ok(r >= 0.4 && r <= 0.9, `finale ${level}: casual ${r}`);
  }
  for (let level = 5; level <= LEVEL_COUNT; level++) assert.ok(casual(level) >= 0.5, `level ${level}: ${casual(level)}`);
  assert.ok(casual(12) < casual(1));
});

test("level 1 is won within 10 seconds: the food lands near the head", () => {
  const times = SEEDS.map(seed => { const run = playStrong(seed, 1); assert.ok(run.game.won); return run.moves * levelOf(1).ms; }).sort((a, b) => a - b);
  assert.ok(times[Math.floor(times.length / 2)] <= 10_000, `median ${times[Math.floor(times.length / 2)]} ms`);
  assert.ok(times[Math.floor(times.length * 0.9)] <= 12_000, `90th percentile ${times[Math.floor(times.length * 0.9)]} ms`);
  for (const seed of SEEDS.slice(0, 10)) {
    const game = createGame(seed, 1), [hx, hy] = xy(headCell(game)), [fx, fy] = xy(game.food);
    assert.ok(Math.abs(hx - fx) <= 3 && Math.abs(hy - fy) <= 3, `seed ${seed}: first food within 3 cells`);
  }
});

test("a level ends on the goal's last bite, and a wall ends it like the fence", () => {
  const game = createGame(5, 1);
  for (let bite = 1; bite <= levelOf(1).goal; bite++) {
    setBody(game, bodyCells(game).slice(0, 3));
    game.food = headCell(game) - COLS; game.bonus = -1; game.dir = 0;
    assert.equal(step(game), bite === levelOf(1).goal ? "win" : "eat");
  }
  assert.deepEqual([game.over, game.won, game.eaten], [true, true, 5]);

  const walled = createGame(5, 6);
  walled.food = -1; walled.bonus = -1;
  // Level 6 has a wall across row 5: straight up from row 11 is five moves, then the tin.
  for (let i = 0; i < 5; i++) assert.equal(step(walled), "move");
  assert.ok(deadAhead(walled), "the edge glows one move before the tin");
  assert.equal(step(walled), "crash");
  assert.equal(walled.crash, "tin");
});

test("a crow walks its line, turns at the ends and in front of the snake, and running into it ends the run", () => {
  const game = createGame(7, 4);
  game.food = -1; game.bonus = -1;
  assert.equal(game.crows, 1);
  const seen = new Set<number>();
  for (let i = 0; i < 40; i++) {
    setBody(game, [cellOf(5, 14), cellOf(4, 14), cellOf(3, 14)]); game.dir = 1; game.over = false;
    step(game); seen.add(game.crowAt[0]);
  }
  for (const cell of seen) assert.equal(xy(cell)[1], 3, "the crow stays on row 3");
  assert.ok(seen.has(cellOf(1, 3)) && seen.has(cellOf(10, 3)), "it reaches both ends");

  const hit = createGame(7, 4);
  hit.food = -1; hit.bonus = -1; hit.crowAt[0] = cellOf(5, 9);
  hit.crowFrom[0] = cellOf(5, 9); hit.crowTo[0] = cellOf(5, 9);
  assert.equal(step(hit), "move");
  assert.ok(deadAhead(hit));
  assert.equal(step(hit), "crash");
  assert.equal(hit.crash, "crow");

  // The crow never steps into the cell right in front of the head: a crash always comes from driving into a crow you could see.
  const front = createGame(7, 4);
  front.food = -1; front.bonus = -1;
  // The line runs from (10, 3) to (1, 3); way +1 walks left, towards (5, 3), the cell in front of the head after this move.
  front.crowAt[0] = cellOf(6, 3); front.crowWay[0] = 1; front.moves = 1;
  setBody(front, [cellOf(5, 5), cellOf(5, 6), cellOf(5, 7)]);
  assert.equal(step(front), "move");
  assert.equal(front.crowAt[0], cellOf(6, 3), "it stays put");
  assert.equal(front.crowWay[0], -1, "and turns round");
});

test("pipes: in one mouth, out the other, heading the same way", () => {
  const game = createGame(3, 6);
  game.food = -1; game.bonus = -1;
  setBody(game, [cellOf(1, 2), cellOf(1, 3), cellOf(1, 4)]); game.dir = 0;
  assert.equal(step(game), "pipe");
  assert.deepEqual(xy(headCell(game)), [10, 14]);
  assert.equal(step(game), "move");
  assert.deepEqual(xy(headCell(game)), [10, 13]);
});

test("the rail gate blinks first, shuts for 8 moves in 24, never shuts on the snake, and a shut gate ends the run", () => {
  const game = createGame(2, 8);
  game.food = -1; game.bonus = -1;
  const park = () => { setBody(game, [cellOf(6, 13), cellOf(5, 13), cellOf(4, 13)]); game.dir = 1; game.over = false; };
  const states: string[] = [];
  for (let i = 0; i < 24; i++) { park(); game.moves = i; step(game); states.push(game.gateShut ? "shut" : gateWarning(game) ? "warn" : "open"); }
  assert.equal(states.filter(state => state === "shut").length, 8);
  assert.ok(states.indexOf("warn") >= 0 && states.indexOf("warn") < states.indexOf("shut"), "the lamp blinks before it shuts");

  const crossing = createGame(2, 8);
  crossing.food = -1; crossing.bonus = -1;
  setBody(crossing, [cellOf(5, 6), cellOf(5, 7), cellOf(5, 8)]); crossing.dir = 1;
  crossing.moves = 15;
  setBody(crossing, [cellOf(4, 6), cellOf(5, 6), cellOf(6, 6)]); crossing.dir = 3;
  step(crossing);
  assert.equal(crossing.gateShut, false, "the snake lies across the gate: it waits");

  const shut = createGame(2, 8);
  shut.food = -1; shut.bonus = -1;
  setBody(shut, [cellOf(5, 7), cellOf(5, 8), cellOf(5, 9)]); shut.dir = 0; shut.gateShut = true;
  assert.equal(step(shut), "crash");
  assert.equal(shut.crash, "gate");
});

test("a green chilli gives a 10-move burst, milder in ধীরে খেলো; tamarind cuts the tail by 2 but never below 3", () => {
  const game = createGame(4, 7);
  game.bonus = -1; game.kind = "morich"; game.food = headCell(game) - COLS;
  const base = moveMs(game, false);
  step(game);
  assert.equal(game.hot, HOT_MOVES);
  assert.ok(moveMs(game, false) < base * 0.7);
  assert.ok(moveMs(game, true) >= 192 && moveMs(game, true) < levelInterval(7, true));
  for (let i = 0; i < HOT_MOVES; i++) { game.food = -1; game.over = false; setBody(game, [cellOf(5, 11), cellOf(5, 12), cellOf(5, 13), cellOf(5, 14)]); game.dir = 0; step(game); }
  assert.equal(game.hot, 0);

  const sour = createGame(4, 9);
  setBody(sour, [cellOf(5, 9), cellOf(5, 10), cellOf(5, 11), cellOf(5, 12), cellOf(5, 13), cellOf(5, 14)]);
  sour.bonus = -1; sour.kind = "tetul"; sour.food = cellOf(5, 8);
  step(sour);
  assert.equal(sour.length, 5, "6 cells + 1 for the bite − 2");
  assert.equal(sour.occ.reduce((sum, cell) => sum + cell, 0), sour.length);
  const short = createGame(4, 9);
  short.bonus = -1; short.kind = "tetul"; short.food = headCell(short) - COLS;
  step(short);
  assert.equal(short.length, MIN_LENGTH);
  // The classic game and levels without the flag ignore both.
  const plain = createGame(4, 2);
  plain.bonus = -1; plain.kind = "morich"; plain.food = headCell(plain) - COLS;
  step(plain);
  assert.equal(plain.hot, 0);
});

test("classic games are untouched: same food from the same seed, no walls, no goal", () => {
  const classic = createGame(48213), zero = createGame(48213, 0), level = createGame(48213, 3);
  assert.deepEqual([classic.food, classic.kind], [zero.food, zero.kind]);
  assert.equal(classic.goal, 0);
  assert.equal(classic.wall.reduce((sum, cell) => sum + cell, 0), 0);
  assert.equal(level.wall.reduce((sum, cell) => sum + cell, 0), wallCells(3).length);
  assert.deepEqual([speedStep(0), speedStep(4), speedStep(5), speedStep(200)], [1, 1, 2, 11]);
  // The first food of seed 48213 sits where it always did (cell 99, চানাচুর): old classic links replay the same ঠোঙা.
  assert.deepEqual([classic.food, classic.kind], [createGame(48213).food, createGame(48213).kind]);
});

test("stars come from golden chillies, and ধীরে খেলো slows every level without touching the chilli's ring (counted in moves)", () => {
  assert.equal(chilliesIn(1), 1);
  assert.deepEqual([levelStars(1, 0), levelStars(1, 1)], [1, 3]);
  assert.equal(chilliesIn(12), 4);
  assert.deepEqual([0, 1, 2, 3, 4].map(golden => levelStars(12, golden)), [1, 1, 2, 2, 3]);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(levelInterval(level, true) >= 240);
    assert.equal(levelInterval(level, false), LEVELS[level - 1].ms);
  }
  const fast = createGame(9, 5), slow = createGame(9, 5);
  assert.equal(fast.bonusLife, slow.bonusLife, "the same ring in moves either way");
});

test("near-miss lines give the exact number", () => {
  assert.equal(nearMiss({ level: 4, won: false, eaten: 7, golden: 0, score: 70, best: null }), "আর ৩টা খেলেই লেভেল ৪ পার।");
  assert.equal(nearMiss({ level: 12, won: true, eaten: 20, golden: 1, score: 230, best: null }), "আর ১টা সোনালি মরিচ পেলেই ২ তারা।");
  assert.equal(nearMiss({ level: 12, won: true, eaten: 20, golden: 3, score: 290, best: null }), "আর ১টা সোনালি মরিচ পেলেই ৩ তারা।");
  assert.equal(nearMiss({ level: 1, won: true, eaten: 5, golden: 0, score: 50, best: null }), "আর ১টা সোনালি মরিচ পেলেই ৩ তারা।");
  assert.equal(nearMiss({ level: 12, won: true, eaten: 20, golden: 4, score: 320, best: null }), "");
  assert.equal(nearMiss({ level: 0, won: false, eaten: 30, golden: 2, score: 360, best: 400 }), "আর ৪০ পয়েন্ট হলেই নতুন সেরা।");
  assert.equal(nearMiss({ level: 0, won: false, eaten: 3, golden: 0, score: 30, best: 900 }), "");
  assert.equal(levelLine(3, 0, 6), "লেভেল ৩: ১০টার মধ্যে ৬টা খাওয়া হলো।");
});

test("old classic links still open as classic; level links round-trip and forged ones are refused", () => {
  const old = parseShared("#s=48213&t=1240&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(old, { seed: 48213, score: 1240, name: "রাফি" });
  assert.equal(share.normalize("s=48213&t=1240"), "s=48213&t=1240");

  const cleared = { seed: 777, score: 12 * 10 + 2 * 30, name: "রিমা", level: 5, golden: 2 };
  const hash = sharedHash(cleared);
  assert.equal(hash, "s=777&t=180&l=5&g=2&n=" + encodeURIComponent("রিমা"));
  assert.deepEqual(parseShared(hash), cleared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(sharedStars(cleared), 3);
  assert.equal(sharedStars({ ...cleared, score: 60, golden: 0 }), 0, "6 of 12 bites is not a clear");
  assert.equal(banner(cleared), "রিমা লেভেল ৫-এ ১৮০ করেছে। একই ঠোঙা, তোমার পালা।");
  assert.equal(previewTitle({ ...cleared, name: "" }), "ঝালমুড়ি সাপে লেভেল ৫-এ ১৮০! তুমি পারবে?");
  assert.match(caption(cleared), /লেভেল ৫-এ আমার স্কোর ১৮০, ৩ তারা/);
  assert.doesNotMatch(caption({ score: 60, level: 5, golden: 0 }), /তারা/);

  for (const bad of ["s=777&t=180&l=0&g=2", "s=777&t=180&l=13&g=0", "s=777&t=180&l=5&g=3", "s=777&t=190&l=5&g=0", "s=777&t=60&l=5&g=1", "s=777&t=180&l=5.5&g=2", "s=777&t=180&l=5&g=x"]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  assert.ok(parseShared("s=777&t=50&l=1&g=0"), "a crash after 5 bites... is the level-1 clear");
  assert.equal(parseShared("s=777&t=90&l=2&g=0")?.level, 2);
  // Every old cleared-level link (goal bites, any golden count it could offer) still parses and keeps its stars.
  for (let level = 1; level <= LEVEL_COUNT; level++) for (let golden = 0; golden <= chilliesIn(level); golden++) {
    const link = { seed: 9, score: levelOf(level).goal * 10 + golden * 30, name: "", level, golden };
    assert.equal(sharedStars(parseShared(sharedHash(link))!), levelStars(level, golden));
  }
});

test("the same seed and turns give the same level run, crows and gate included", () => {
  for (const level of [4, 8, 12]) {
    const one = playStrong(4242, level), two = playStrong(4242, level);
    assert.deepEqual(bodyCells(one.game), bodyCells(two.game));
    assert.deepEqual([one.game.score, one.game.moves, Array.from(one.game.crowAt)], [two.game.score, two.game.moves, Array.from(two.game.crowAt)]);
  }
  const turns: Dir[] = [1, 0, 3, 0, 1];
  const a = createGame(55, 10), b = createGame(55, 10);
  for (const game of [a, b]) for (let i = 0; i < 30 && !game.over; i++) { if (i % 6 === 0) turn(game, turns[(i / 6) % turns.length]); step(game); }
  assert.deepEqual([a.moves, a.crash, Array.from(a.crowAt)], [b.moves, b.crash, Array.from(b.crowAt)]);
});
