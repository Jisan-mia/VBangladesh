import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { chilliesIn, levelInterval, levelOf, levelStars, wallCells, LEVEL_COUNT, LEVELS } from "../lib/levels";
import { banner, caption, parseShared, previewTitle, sharedHash, sharedStars } from "../lib/link";
import { cellOf, createGame, levelLine, nearMiss, speedStep, step, turn, BONUS_LIFE, CELLS, COLS, DX, DY, ROWS, START, type Dir, type Game } from "../lib/snake";

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

/** Shortest path (cells after the head) from the head to any goal, avoiding walls and `blocked`; null when there is none. */
function path(head: number, dir: Dir, wall: Uint8Array, blocked: Set<number>, goals: Set<number>, order: Dir[]) {
  const from = new Map<number, number>([[head, -1]]), queue = [head];
  while (queue.length) {
    const cell = queue.shift()!;
    const [x, y] = xy(cell);
    for (const d of order) {
      if (cell === head && (d + 2) % 4 === dir) continue;
      const nx = x + DX[d], ny = y + DY[d], next = cellOf(nx, ny);
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || wall[next] || blocked.has(next) || from.has(next)) continue;
      from.set(next, cell);
      if (goals.has(next)) {
        const cells = [next];
        while (from.get(cells[0]) !== head) cells.unshift(from.get(cells[0])!);
        return cells;
      }
      queue.push(next);
    }
  }
  return null;
}
const dirTo = (from: number, to: number): Dir => (to === from - COLS ? 0 : to === from + 1 ? 1 : to === from + COLS ? 2 : 3);

/** The usual safe snake bot: go for the food only if, once there, the head can still reach its own tail; otherwise follow the tail. */
function botMove(game: Game, order: Dir[]): Dir | null {
  const body = game.body, head = body[0];
  const goals = new Set([game.food, game.bonus].filter(cell => cell >= 0));
  const toFood = path(head, game.dir, game.wall, new Set(body.slice(0, -1)), goals, order);
  if (toFood) {
    const after = [...toFood].reverse().concat(body).slice(0, body.length + 1);
    const lastDir = dirTo(toFood.length > 1 ? toFood[toFood.length - 2] : head, toFood[toFood.length - 1]);
    if (path(after[0], lastDir, game.wall, new Set(after.slice(1, -1)), new Set([after[after.length - 1]]), order)) return dirTo(head, toFood[0]);
  }
  const toTail = path(head, game.dir, game.wall, new Set(body.slice(1, -1)), new Set([body[body.length - 1]]), order);
  if (toTail && toTail[0] !== body[body.length - 1]) return dirTo(head, toTail[0]);
  for (const d of order) {
    const [x, y] = xy(head), nx = x + DX[d], ny = y + DY[d], next = cellOf(nx, ny);
    if ((d + 2) % 4 !== game.dir && nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !game.wall[next] && !body.slice(0, -1).includes(next)) return d;
  }
  return toFood ? dirTo(head, toFood[0]) : null;
}

test("every level is fair: walls on the board, all open ground connected, a clear start lane, any chilli reachable in time", () => {
  assert.equal(LEVEL_COUNT, 12);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const walls = wallCells(level), wall = new Set(walls);
    for (const [x, y, w, h] of levelOf(level).walls) assert.ok(x >= 0 && y >= 0 && x + w <= COLS && y + h <= ROWS, `level ${level}: wall inside the fence`);
    for (const cell of START) assert.ok(!wall.has(cell), `level ${level}: the snake doesn't start in a wall`);
    for (let y = 7; y <= 10; y++) assert.ok(!wall.has(cellOf(5, y)), `level ${level}: four free moves before the first turn`);
    const open = CELLS - wall.size, reach = distances(START[0], wall);
    assert.equal(reach.size, open, `level ${level}: no sealed-off pocket`);
    let farthest = 0;
    for (let cell = 0; cell < CELLS; cell++) if (!wall.has(cell)) for (const d of distances(cell, wall).values()) farthest = Math.max(farthest, d);
    assert.ok(farthest < BONUS_LIFE - 10, `level ${level}: farthest walk ${farthest} moves`);
    if (level > 1) {
      assert.ok(levelOf(level).goal >= levelOf(level - 1).goal && levelOf(level).ms <= levelOf(level - 1).ms, `level ${level}: one small step harder`);
      assert.ok(chilliesIn(level) >= 2, `level ${level}: room for 2 stars`);
    }
  }
  assert.equal(levelOf(1).walls.length + levelOf(2).walls.length, 0, "the first two levels have no walls");
});

test("a simple bot clears every level on several seeds, and food never lands on a wall", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const seed of [1, 777, 48213, 999_999_999]) {
      // A greedy bot can coil into itself; the level counts as clearable when one of four steering habits gets through.
      let game = createGame(seed, level);
      for (const order of [[0, 1, 2, 3], [1, 3, 0, 2], [3, 2, 1, 0], [2, 0, 3, 1]] as Dir[][]) {
        game = createGame(seed, level);
        for (let moves = 0; moves < 3000 && !game.over; moves++) {
          assert.ok(!game.wall[game.food] && (game.bonus < 0 || !game.wall[game.bonus]));
          const dir = botMove(game, order);
          if (dir !== null) turn(game, dir);
          step(game);
        }
        if (game.won) break;
      }
      assert.equal(game.won, true, `level ${level}, seed ${seed}: cleared`);
      assert.equal(game.eaten, levelOf(level).goal);
      assert.ok(game.golden <= chilliesIn(level));
      assert.equal(game.score, game.eaten * 10 + game.golden * 30);
    }
  }
});

test("a level ends on the goal's last bite, and a wall ends it like the fence", () => {
  const game = createGame(5, 1);
  for (let bite = 1; bite <= levelOf(1).goal; bite++) {
    game.food = game.body[0] - COLS; game.bonus = -1; game.dir = 0; game.body = game.body.slice(0, 3);
    assert.equal(step(game), bite === levelOf(1).goal ? "win" : "eat");
  }
  assert.deepEqual([game.over, game.won, game.eaten], [true, true, 5]);

  const walled = createGame(5, 6);
  walled.food = -1; walled.bonus = -1;
  // Level 6 has a wall across row 5: straight up from row 11 is six moves, then the tin.
  for (let i = 0; i < 5; i++) assert.equal(step(walled), "move");
  assert.equal(step(walled), "crash");
});

test("classic games are untouched: same food from the same seed, no walls, no goal", () => {
  const classic = createGame(48213), zero = createGame(48213, 0), level = createGame(48213, 3);
  assert.deepEqual([classic.food, classic.kind], [zero.food, zero.kind]);
  assert.equal(classic.goal, 0);
  assert.equal(classic.wall.reduce((sum, cell) => sum + cell, 0), 0);
  assert.equal(level.wall.reduce((sum, cell) => sum + cell, 0), wallCells(3).length);
  assert.deepEqual([speedStep(0), speedStep(4), speedStep(5), speedStep(200)], [1, 1, 2, 11]);
});

test("stars come from golden chillies, and slow mode caps every level's speed", () => {
  assert.equal(chilliesIn(1), 1);
  assert.deepEqual([levelStars(1, 0), levelStars(1, 1)], [1, 3]);
  assert.equal(chilliesIn(12), 4);
  assert.deepEqual([0, 1, 2, 3, 4].map(golden => levelStars(12, golden)), [1, 1, 2, 2, 3]);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(levelInterval(level, true) >= 240);
    assert.equal(levelInterval(level, false), LEVELS[level - 1].ms);
  }
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
});
