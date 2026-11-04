// The frame's rules against the pure simulation, and খোলা পাটি pinned to the original game.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import * as legacy from "./legacy-weave";
import { CLEAR, EVENT_RING, RISE, ROLL, STUCK, SUI_IN } from "../lib/events";
import { createGame, headroom, wovenList, type Game } from "../lib/game";
import { levelOf, LEVELS, MODES } from "../lib/levels";
import { MAT_ROWS, ROW_POINTS } from "../lib/link";
import { ACROSS, CELLS, COLS, GOLD, KINDS, KIND_INDEX, OLD, PIECES, ROWS, SUI, TURNS, colourOf } from "../lib/pieces";
import { deepest, dropMs, fits, hardDrop, move, rotate, rowPattern, tick } from "../lib/step.hot";

const FRAME = 1000 / 60;
const K = KIND_INDEX;

function blank(level = 4, rolls = 0) {
  const game = createGame(1, level, rolls);
  game.board.fill(0);
  return game;
}
function place(game: Game, kind: keyof typeof K, turn: number, x: number, y: number, flags: { wet?: boolean; gold?: boolean } = {}) {
  Object.assign(game, { live: true, kind: K[kind], turn, x, y, wet: Boolean(flags.wet), gold: Boolean(flags.gold), fall: 0, lock: 0, resets: 0 });
}
function fillRow(board: Uint8Array, y: number, gaps: number[] = [], colour = 1) {
  for (let x = 0; x < COLS; x++) board[y * COLS + x] = gaps.includes(x) ? 0 : colour;
}
function events(game: Game, type: number) {
  let count = 0;
  for (let i = Math.max(0, game.eventCount - EVENT_RING); i < game.eventCount; i++) if (game.events[(i % EVENT_RING) * 4] === type) count++;
  return count;
}

test("strips are 1 to 5 cells, edge-connected, turn back to the start, and are not the classic set of seven", () => {
  assert.deepEqual(KINDS.map(kind => PIECES[kind].cells.length).sort(), [1, 2, 3, 3, 4, 4, 4, 5]);
  for (const kind of KINDS) {
    const cells = PIECES[kind].cells.map(([x, y]) => `${x},${y}`);
    for (const [x, y] of PIECES[kind].cells) if (cells.length > 1) assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cells.includes(`${x + dx},${y + dy}`)), `${kind} is connected`);
    assert.deepEqual(TURNS[K[kind]][0], [...PIECES[kind].cells.flat()]);
    for (const turn of TURNS[K[kind]]) for (const value of turn) assert.ok(value >= 0 && value < PIECES[kind].box);
  }
});

test("খোলা পাটি replays the original game step for step: same strips, same board, same points", () => {
  for (const seed of [1, 48213, 999_999_999, 777, 31337]) {
    const old = legacy.createGame(seed), now = createGame(seed, 0, MODES[0].rolls), rng = makeRng(seed);
    assert.equal(now.rolls, 0, "খোলা পাটি has no গোটানো on any mode");
    let steps = 0;
    for (; steps < 30_000 && !old.over; steps++) {
      const r = rng(), soft = rng() < 0.3;
      if (r < 0.2) { legacy.move(old, -1); move(now, -1); }
      else if (r < 0.4) { legacy.move(old, 1); move(now, 1); }
      else if (r < 0.5) { legacy.rotate(old); rotate(now); }
      else if (r < 0.52) { legacy.hardDrop(old); hardDrop(now); }
      legacy.tick(old, FRAME, soft); tick(now, FRAME, soft);
      if (!old.over) {
        assert.equal(KINDS[now.kind], old.piece?.kind ?? KINDS[now.kind], `seed ${seed} step ${steps}`);
        if (old.piece && now.live) assert.deepEqual([now.x, now.y, now.turn], [old.piece.x, old.piece.y, old.piece.turn]);
      }
      assert.equal(now.score, old.score);
      assert.equal(now.rows, old.rows);
    }
    assert.ok(steps > 300, `seed ${seed} ran ${steps} steps`);
    assert.equal(now.over, 2);
    assert.deepEqual([...now.board], [...old.board]);
    assert.deepEqual(wovenList(now), old.woven);
  }
  // The old speed curve, both ways.
  const game = createGame(1, 0, 0);
  for (const [rows, fast, slow] of [[0, 700, 1000], [9, 700, 1000], [10, 609, 920], [200, 70, 520]] as const) {
    game.rows = rows; game.slow = false; assert.equal(dropMs(game), Math.max(70, Math.round(700 * 0.87 ** Math.floor(rows / 10))));
    assert.equal(dropMs(game), Math.max(fast, dropMs(game)));
    game.slow = true; assert.equal(dropMs(game), Math.max(520, Math.round(1000 * 0.92 ** Math.floor(rows / 10))));
    assert.ok(dropMs(game) >= slow - 1);
  }
});

test("the same seed deals the same strips whatever the player does; another seed deals others", () => {
  const order = (seed: number, level: number, drop: boolean) => {
    const game = createGame(seed, level, 3), kinds: number[] = [];
    for (let i = 0; i < 40 && !game.over; i++) {
      kinds.push(game.kind);
      if (drop) hardDrop(game); else { move(game, 1); rotate(game); hardDrop(game); }
      for (let f = 0; f < 200 && !game.live && !game.over; f++) tick(game, FRAME, false);
    }
    return kinds;
  };
  for (const level of [4, 8, 12]) {
    const a = order(5, level, true), b = order(5, level, false), n = Math.min(a.length, b.length, 20);
    assert.ok(n >= 10);
    assert.deepEqual(a.slice(0, n), b.slice(0, n));
    assert.notDeepEqual(order(6, level, true).slice(0, 12), a.slice(0, 12));
    assert.deepEqual(createGame(77, level, 1).board, createGame(77, level, 1).board, "old rows come from the seed");
  }
});

test("পাটি 1 is won with three strips in under ten seconds: drop, step and drop, step and drop", () => {
  const game = createGame(42, 1, 1);
  assert.equal(KINDS[game.kind], "dui");
  assert.ok(hardDrop(game));
  assert.equal(game.rows, 1);
  tick(game, 1000, false);
  assert.equal(KINDS[game.kind], "tin");
  assert.ok(move(game, 1)); assert.ok(hardDrop(game)); tick(game, 1000, false);
  assert.ok(move(game, 1)); assert.ok(hardDrop(game)); tick(game, 1000, false);
  assert.equal(game.rows, 3);
  assert.equal(game.over, 1);
  assert.ok(game.t < 10_000);
  // পাটি 2's upright gap takes the three standing up, two rows at once; পাটি 3's takes the long strip, three at once.
  const two = createGame(3, 2, 1);
  assert.ok(rotate(two)); assert.ok(move(two, 1)); assert.ok(move(two, 1)); hardDrop(two);
  assert.equal(two.clearCount, 2);
  const three = createGame(3, 3, 1);
  assert.ok(rotate(three)); for (let i = 0; i < 3; i++) assert.ok(move(three, 1)); hardDrop(three);
  assert.equal(three.clearCount, 3);
  assert.equal(three.score, ROW_POINTS[3]);
});

test("turning kicks off walls, moves stop at the stack, and a wet strip never turns", () => {
  const game = blank();
  place(game, "lomba", 1, 5, 4);
  assert.ok(rotate(game));
  assert.ok(fits(game.board, K.lomba, game.turn, game.x, game.y) && game.x < 5);
  place(game, "dui", 0, 0, 3);
  assert.equal(move(game, -1), false);
  for (let i = 0; i < 6; i++) assert.ok(move(game, 1));
  assert.equal(move(game, 1), false);
  place(game, "tin", 0, 2, 4, { wet: true });
  const before = game.eventCount;
  assert.equal(rotate(game), false);
  assert.equal(game.turn, 0);
  assert.equal(game.eventCount, before + 1);
  assert.equal(events(game, STUCK), 1, "the refusal is an event: a damp thud and a wiggle");
  assert.ok(move(game, 1), "a wet strip still slides");
});

test("rows weave lowest first, pay 10/25/45/70, a gold strip doubles them, and the woven pattern keeps 14 rows", () => {
  for (const [count, points] of [[1, 10], [2, 25], [3, 45], [4, 70]] as const) {
    const game = blank();
    for (let y = ROWS - count; y < ROWS; y++) fillRow(game.board, y, [0]);
    place(game, "lomba", 1, -2, 0);
    hardDrop(game);
    assert.equal(game.score, points);
    const gold = blank();
    for (let y = ROWS - count; y < ROWS; y++) fillRow(gold.board, y, [0]);
    place(gold, "lomba", 1, -2, 0, { gold: true });
    hardDrop(gold);
    assert.equal(gold.score, points * 2, `gold ${count}`);
    assert.equal(gold.goldRows, count);
    assert.equal(colourOf(gold.board[(ROWS - 1) * COLS]), GOLD);
  }
  const game = blank();
  for (let i = 0; i < 20; i++) {
    game.board.fill(0); game.clearCount = 0;
    fillRow(game.board, 13, [7], (i % 4) + 1);
    place(game, "dui", 1, 6, 0);
    hardDrop(game);
  }
  assert.equal(game.rows, 20);
  const list = wovenList(game);
  assert.equal(list.length, MAT_ROWS);
  for (let x = 0; x < 7; x++) assert.equal(((list[MAT_ROWS - 1] >> (x * 2)) & 3) + 1, 4);
  // A gold cell counts as হলুদ in the shared pattern.
  const board = new Uint8Array(CELLS); fillRow(board, 0, [], GOLD);
  assert.equal(rowPattern(board, 0), 0x5555);
});

test("a resting strip waits, may slide, then locks; the wait can't be stretched forever", () => {
  const game = blank();
  place(game, "tin", 0, 0, ROWS - 2);
  tick(game, 400, false);
  assert.ok(move(game, 1));
  tick(game, 400, false);
  assert.ok(game.live, "the slide restarted the wait");
  tick(game, 100, false);
  assert.equal(game.strips, 1);
  const stall = blank();
  place(stall, "dui", 0, 0, ROWS - 1);
  for (let i = 0; i < 40 && stall.strips === 0; i++) { move(stall, i % 2 ? -1 : 1); tick(stall, 200, false); }
  assert.equal(stall.strips, 1);
});

test("a full frame rolls its bottom four rows away while গোটানো lasts, then ends the run", () => {
  const game = createGame(9, 4, 1);
  for (let y = 1; y < ROWS; y++) fillRow(game.board, y, [y % COLS]);
  fillRow(game.board, 0, [0, 1, 2, 3, 4, 5]);
  place(game, "dui", 0, 0, 0);
  hardDrop(game);
  assert.equal(game.over, 0, "the first fill rolls up");
  assert.equal(game.rolls, 0);
  assert.equal(events(game, ROLL), 1);
  assert.ok(game.live);
  assert.equal(headroom(game.board), 4, "four rows of room came back");
  for (let y = 0; y < ROWS; y++) fillRow(game.board, y, [y % COLS, (y + 3) % COLS]);
  fillRow(game.board, 0, [0, 1, 5]);
  place(game, "dui", 0, 0, 0);
  hardDrop(game);
  assert.equal(game.over, 2);
  assert.equal(game.live, false);
  tick(game, 1000, false);
  assert.equal(move(game, 1), false);
  assert.equal(hardDrop(game), false);
});

test("old rows tear in one drifting line, rising rows come every N strips, and a সুই slips into the deepest hole", () => {
  for (let seed = 1; seed < 30; seed++) {
    const game = createGame(seed, 5, 1);
    let last = -1;
    for (let y = ROWS - 1; y >= ROWS - levelOf(5).old; y--) {
      const holes = [...Array(COLS).keys()].filter(x => !game.board[y * COLS + x]);
      assert.equal(holes.length, 1);
      if (last >= 0) assert.ok(Math.abs(holes[0] - last) <= 1, "the tear drifts at most a column a row");
      last = holes[0];
      for (let x = 0; x < COLS; x++) if (game.board[y * COLS + x]) assert.ok(game.board[y * COLS + x] & OLD, "old cells carry the flag");
    }
  }
  const rising = createGame(3, 6, 1), every = levelOf(6).rise;
  for (let i = 0; i < every && !rising.over; i++) { hardDrop(rising); tick(rising, 2000, false); }
  assert.equal(rising.rises, 1, "one rise after every strips");
  assert.ok(events(rising, RISE) >= 1, "the rise is an event");
  const bottom = [...Array(COLS).keys()].filter(x => !rising.board[(ROWS - 1) * COLS + x]);
  assert.equal(bottom.length, 1, "the risen row has one hole");

  const needle = blank(10);
  fillRow(needle.board, 13, [2]); fillRow(needle.board, 12, []); fillRow(needle.board, 11, [5]);
  assert.equal(deepest(needle.board, 2), 13);
  place(needle, "sui", 0, 2, 0);
  assert.ok(fits(needle.board, SUI, 0, 2, 5), "a সুই passes through the weave");
  hardDrop(needle);
  assert.equal(events(needle, SUI_IN), 1, "the সুই landed in the hole");
  assert.equal(events(needle, CLEAR), 1, "the buried row wove");
  // সুই come every `sui` strips in পাটি 10.
  const tenth = createGame(4, 10, 3);
  tenth.board.fill(0);
  const seen: number[] = [];
  for (let i = 0; i < 40 && !tenth.over; i++) {
    seen.push(tenth.kind);
    move(tenth, (i % 5) - 2); move(tenth, (i % 5) - 2);
    hardDrop(tenth);
    for (let f = 0; f < 200 && !tenth.live && !tenth.over; f++) tick(tenth, FRAME, false);
    if (headroom(tenth.board) < 6) tenth.board.fill(0);
  }
  const at = seen.flatMap((kind, index) => kind === SUI ? [index] : []);
  assert.ok(at.length >= 3, `সুই in ${seen.join(",")}`);
  for (let i = 1; i < at.length; i++) assert.equal(at[i] - at[i - 1], levelOf(10).sui, "one সুই every 9 strips");
});

test("every পাটি is data that makes sense", () => {
  for (const [index, row] of LEVELS.entries()) {
    assert.ok(row.goal > 0 && row.two > 0 && row.three >= row.two && row.two >= row.goal * 10, row.name);
    assert.ok(row.fall[0] >= row.fall[1] && row.fall[1] >= 300, row.name);
    assert.ok(row.old + row.rows.length <= 6, `${row.name}: room to play`);
    for (const text of row.rows) assert.match(text, /^[.1-4]{8}$/);
    assert.ok(row.bundle.length >= 4);
    assert.ok(index === 0 || row.line.length <= 90, `${row.name} line`);
  }
  // One new thing per পাটি: each adds at least one feature the one before it lacks, within its world.
  const features = (r: typeof LEVELS[number]) => new Set([...r.bundle, r.old ? "old" : "", r.rise ? "rise" : "", r.wet ? "wet" : "", r.gold ? "gold" : "", r.sui ? "sui" : ""].filter(Boolean));
  for (let i = 1; i < LEVELS.length; i++) {
    const before = features(LEVELS[i - 1]), now = features(LEVELS[i]);
    if (LEVELS[i].world === LEVELS[i - 1].world && i % 4 !== 3) assert.ok([...now].some(f => !before.has(f)), LEVELS[i].name);
  }
});
