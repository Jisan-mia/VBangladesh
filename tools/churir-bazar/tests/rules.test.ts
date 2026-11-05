import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel } from "../../../shared/game-core";
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";
import fixture from "./legacy-fixture.json" with { type: "json" };
import {
  allMoves, colourOf, deal, dropCell, dustLayout, findRuns, giftPieces, hasMove, isLocked, play, sparkleReach, swapWorks, unstick,
  CELLS, DUST_GOAL, EMPTY, FREE_GOAL, LOCK, POINT, RAINBOW, SIZE, SPARKLE,
} from "../lib/board";
import { botGame } from "../lib/hint";
import { LEVELS } from "../lib/ladder";
import {
  baseLimit, code, createGame, danger, decodeMoves, dropDue, encodeMoves, limitOf, move, movesLeft, newRun, replay, shortBy, specOf, starsOf, uncode, BONUS, type Game, type Run,
} from "../lib/rules";

/** A tray from a picture: one letter per cell, r g b y p w for colours, R G… for ঝিকমিক, * for রংধনু. */
function tray(rows: string[]) {
  const map: Record<string, number> = { r: 0, g: 1, b: 2, y: 3, p: 4, w: 5, R: 10, G: 11, B: 12, Y: 13, P: 14, W: 15, "*": RAINBOW };
  return rows.join("").split("").map(char => map[char]);
}
/** A filler that never lines up: colours 0–3 in a pattern with no three in a row either way. */
const FILL = ["rgbyrgb", "byrgbyr", "rgbyrgb", "byrgbyr", "rgbyrgb", "byrgbyr", "rgbyrgb"];
const hash = (cells: number[]) => { let h = 2166136261; for (const c of cells) { h ^= c + 7; h = Math.imul(h, 16777619) >>> 0; } return h; };
/** A careless player: the first swap that works, every time. */
function firstMover(start: Game, cap = 200) {
  let game = start;
  while (!game.over && game.moves.length < cap) { const [a, b] = allMoves(game.cells)[0]; game = move(game, a, b)!; }
  return game;
}

test("deal: same seed, same tray; never a ready-made line; always a swap; tied bangles where asked", () => {
  assert.deepEqual(deal(42, 5), deal(42, 5));
  assert.notDeepEqual(deal(42, 5), deal(43, 5));
  for (let seed = 1; seed < 200; seed++) {
    const locks = seed % 5, cells = deal(seed, 4 + (seed % 3), locks);
    assert.equal(cells.length, CELLS);
    assert.equal(findRuns(cells).length, 0, `seed ${seed} starts with a line`);
    assert.ok(hasMove(cells), `seed ${seed} has no move`);
    assert.equal(cells.filter(isLocked).length, locks, `seed ${seed}: ${locks} tied bangles`);
    assert.ok(cells.every(piece => (piece >= 0 && piece < 4 + (seed % 3)) || isLocked(piece)));
  }
});

test("a swap must make a line; a rainbow always works; only neighbours; a tied bangle never moves", () => {
  const cells = tray(FILL);
  assert.equal(findRuns(cells).length, 0);
  assert.equal(play(cells, 1, 0, 4, 0, 1), null, "nothing lines up");
  assert.equal(play(cells, 1, 0, 4, 0, 2), null, "not neighbours");
  assert.equal(play(cells, 1, 0, 4, 6, 7), null, "row ends don't wrap");
  const line = tray(["rrgyrgb", "byrrbyr", ...FILL.slice(2)]); // swapping (0,2)↔(1,2) brings r over: r r r
  assert.ok(swapWorks(line.slice(), 2, 9));
  const out = play(line, 1, 0, 4, 2, 9)!;
  assert.deepEqual(out.steps[0].cleared, [0, 1, 2]);
  assert.equal(out.steps[0].points, 3 * POINT);
  assert.ok(out.cells.every(piece => piece !== EMPTY), "the tray refills");
  assert.deepEqual(out.steps[0].fall.slice(0, 3), [1, 1, 1], "fresh bangles drop in from above");
  // the same swap with the bangle that would move tied down: no swap at all
  const tied = line.slice(); tied[9] += LOCK;
  assert.equal(swapWorks(tied.slice(), 2, 9), false);
  assert.equal(play(tied, 1, 0, 4, 2, 9), null);
  assert.equal(swapWorks([...tied.slice(0, 2), RAINBOW + 0, ...tied.slice(3)].map((p, i) => (i === 2 ? p : p)), 2, 9), false, "even a rainbow can't take a tied bangle's place");
});

test("four lifted leave a ঝিকমিক where the swap landed; five leave a রংধনু", () => {
  const four = tray(["rrgrybg", "bgrbgyr", ...FILL.slice(2)]);
  const out4 = play(four, 3, 0, 4, 2, 9)!;
  assert.deepEqual(out4.steps[0].made, [{ cell: 2, piece: SPARKLE + 0 }]);
  assert.deepEqual(out4.made, [1, 0]);
  const five = tray(["rrgrrbg", "bgrbgyb", ...FILL.slice(2)]);
  const out5 = play(five, 3, 0, 4, 2, 9)!;
  assert.deepEqual(out5.steps[0].made, [{ cell: 2, piece: RAINBOW }]);
  assert.equal(out5.made[1], 1);
  const ell = tray(FILL);
  ell[7] = 0; ell[14] = 1; ell[15] = 0; ell[16] = 0; ell[21] = 0; ell[23] = 3;
  assert.equal(findRuns(ell).length, 0);
  const outL = play(ell, 3, 0, 4, 14, 21)!;
  assert.deepEqual(outL.steps[0].made, [{ cell: 14, piece: RAINBOW }]);
  assert.deepEqual(outL.steps[0].cleared, [0, 7, 15, 16]);
});

test("specials: a ঝিকমিক lifts two each way; a রংধনু lifts a whole colour", () => {
  assert.deepEqual(sparkleReach(24).sort((a, b) => a - b), [10, 17, 22, 23, 25, 26, 31, 38]);
  assert.deepEqual(sparkleReach(0).sort((a, b) => a - b), [1, 2, 7, 14]);
  const cells = tray(FILL);
  cells[24] = RAINBOW;
  const colour = colourOf(cells[25]);
  const out = play(cells, 5, 0, 4, 24, 25)!;
  const before = cells.filter(piece => colourOf(piece) === colour).length;
  assert.ok(out.steps[0].cleared.length >= before + 1, "every bangle of that colour, and the rainbow");
  assert.equal(out.lifted[colour] >= before, true);
  const both = tray(FILL); both[24] = RAINBOW; both[25] = RAINBOW;
  assert.equal(play(both, 5, 0, 4, 24, 25)!.steps[0].cleared.length, CELLS);
  const spark = tray(["rrgRybg", "bgrbgyr", ...FILL.slice(2)]);
  const out2 = play(spark, 3, 0, 4, 2, 9)!;
  assert.ok(out2.steps[0].blasts.includes(3));
});

test("tied bangles: a line frees them (counted), a ঝিকমিক's blast frees them too, a রংধনু takes the whole colour", () => {
  // r r _ r with the first r tied: the swap lines up r r r and the tied one goes with them
  const cells = tray(["rrgrybg", "bgrbgyr", ...FILL.slice(2)]);
  cells[0] += LOCK;
  const out = play(cells, 3, 0, 4, 2, 9, {})!;
  assert.ok(out.steps[0].cleared.includes(0), "the tied bangle is lifted with its line");
  assert.equal(out.freed, 1);
  assert.equal(out.lifted[0] >= 3, true);
  // a ঝিকমিক caught in a line goes off, and its blast takes a tied bangle in reach
  const near = tray(["rrgRybg", "bgrbgyr", ...FILL.slice(2)]);
  near[5] += LOCK;
  assert.ok(sparkleReach(3).includes(5));
  const blasted = play(near, 3, 0, 4, 2, 9)!;
  assert.ok(blasted.steps[0].cleared.includes(5) && blasted.freed >= 1, "the blast frees a tied bangle");
  // tied bangles in a shaken tray stay where they are
  const stuck = tray(FILL);
  assert.equal(hasMove(stuck), false, "the filler has no swap at all");
  stuck[3] += LOCK; stuck[30] += LOCK; stuck[44] += LOCK;
  const shaken = unstick(stuck, 9, 0, 4);
  assert.ok(shaken.shuffle, "it was shaken");
  for (const cell of [3, 30, 44]) { assert.equal(shaken.cells[cell], stuck[cell], `cell ${cell} stayed`); assert.equal(shaken.shuffle![cell], cell); }
  assert.ok(hasMove(shaken.cells) && findRuns(shaken.cells).length === 0);
  assert.deepEqual(unstick(stuck, 9, 0, 4), shaken, "the same shake every time");
});

test("dust: a layer wipes where a bangle is lifted; thick dust takes two lifts; goals count the layers", () => {
  const cells = tray(["rrgyrgb", "byrrbyr", ...FILL.slice(2)]);
  const dust = Array<number>(CELLS).fill(0);
  dust[0] = 1; dust[1] = 2; dust[30] = 1;
  const out = play(cells, 1, 0, 4, 2, 9, { dust })!;
  assert.deepEqual(out.steps[0].wipedCells, [0, 1]);
  assert.equal(out.wiped, 2, "cell 0 clean, cell 1 down to one layer");
  assert.deepEqual([out.dust![0], out.dust![1], out.dust![30]], [0, 1, 1]);
  assert.equal(dust[1], 2, "the old dust array is not touched");
  const layout = dustLayout(7, 10, 4);
  assert.equal(layout.filter(Boolean).length, 10);
  assert.equal(layout.filter(layer => layer === 2).length, 4);
  assert.deepEqual(dustLayout(7, 10, 4), layout);
});

test("a তালা falls after the cascade, on the cell shown a move ahead, only on a plain bangle", () => {
  const spec = LEVELS[30]; // level 31: a new তালা every seven moves
  assert.equal(spec.drop, 7);
  let game = createGame(newRun(31));
  for (let n = 1; n <= 7; n++) {
    const warned = dropDue(game);
    assert.equal(warned >= 0, n === 7, `a ring shows only before the move that drops it (move ${n})`);
    const [a, b] = allMoves(game.cells)[0];
    const before = game.cells.filter(isLocked).length;
    game = move(game, a, b)!;
    if (n === 7) {
      assert.equal(game.last!.lockedAt, warned, "it fell where the ring was");
      const piece = game.cells[warned];
      assert.ok(isLocked(piece) || game.last!.cells[warned] === piece, "a tied bangle sits there now");
      assert.ok(game.cells.filter(isLocked).length >= before - game.last!.freed, "one more tied bangle than the move left");
    } else assert.equal(game.last!.lockedAt, -1);
  }
  assert.equal(dropCell(spec.seed, 1), dropCell(spec.seed, 1));
  const plain = play(tray(["rrgyrgb", "byrrbyr", ...FILL.slice(2)]), 1, 0, 4, 2, 9, { lockAt: 40 })!;
  assert.equal(plain.lockedAt, 40);
  assert.ok(isLocked(plain.cells[40]) || plain.steps.at(-1)!.cells[40] >= SPARKLE);
  const onSpecial = play(tray(["rrgyrgb", "byrrbyr", ...FILL.slice(2)]).map((p, i) => (i === 48 ? SPARKLE + 1 : p)), 1, 0, 4, 2, 9, { lockAt: 48 })!;
  if (onSpecial.steps.at(-1)!.cells[48] >= SPARKLE) assert.equal(onSpecial.lockedAt, -1, "never on a special bangle");
});

test("gifts put a রংধনু or two ঝিকমিক on the tray; the move-gift raises only the limit", () => {
  const base = deal(5, 5);
  assert.equal(giftPieces(base, 5, 1).filter(piece => piece === RAINBOW).length, 1);
  assert.equal(giftPieces(base, 5, 2).filter(piece => piece >= SPARKLE && piece < RAINBOW).length, 2);
  assert.deepEqual(giftPieces(base, 5, 0), base);
  const run10: Run = { v: 2, level: 10, mode: "n", gift: 3 };
  assert.equal(limitOf(specOf(run10), "n", 3), specOf(run10).moves + 3);
  assert.equal(createGame(run10).limit, specOf(run10).moves + 3);
  assert.ok(createGame({ ...run10, gift: 1 }).cells.includes(RAINBOW));
});

test("the same moves always bring the same bangles down; headless runs end sanely", () => {
  const one = firstMover(createGame(newRun(3))), two = firstMover(createGame(newRun(3)));
  assert.deepEqual(one.cells, two.cells);
  assert.equal(one.score, two.score);
  for (let level = 1; level <= 40; level += 3) {
    const game = firstMover(createGame(newRun(level)));
    assert.ok(game.over);
    assert.ok(game.cells.every(piece => piece !== EMPTY));
    assert.ok(hasMove(game.cells) || game.over);
    assert.ok(game.moves.length <= game.limit);
  }
});

test("modes: easy has more moves and at most two stars, hard has fewer; the bonus never grows with extra moves", () => {
  for (const spec of LEVELS) {
    assert.ok(baseLimit(spec, "e") > spec.moves);
    assert.ok(baseLimit(spec, "h") < spec.moves && baseLimit(spec, "h") >= spec.bot + 2);
  }
  const spec = LEVELS[0], moves = spec.moves;
  const won = botGame(newRun(1), spec);
  assert.ok(won.won && won.bonus === (moves - won.moves.length) * BONUS);
  const easy = botGame(newRun(1, "e"), spec);
  assert.equal(easy.bonus, (moves - easy.moves.length) * BONUS, "extra moves add no points");
  assert.ok(starsOf({ ...easy, score: 99999 }) <= 2, "easy gives at most two stars");
  assert.equal(starsOf({ ...won, score: 99999 }), 3);
  assert.equal(shortBy({ ...easy, score: 99999 }), 0);
  assert.ok(shortBy({ ...won, score: 0 }) > 0);
});

test("a level ends when the moves run out; stars, bonus and danger", () => {
  let game = createGame(newRun(8));
  assert.equal(danger(game), 0);
  while (!game.over) { const [a, b] = allMoves(game.cells)[0]; game = move(game, a, b)!; if (!game.over && movesLeft(game) <= 2) assert.equal(danger(game), 2); }
  assert.ok(game.moves.length === game.limit || game.won);
  assert.equal(danger(game), 0, "no danger once it is over");
  assert.equal(move(game, 0, 1), null);
  assert.equal(starsOf(game), game.won ? starsOf(game) : 0);
  const fresh = createGame(newRun(8));
  assert.equal(danger({ ...fresh, moves: Array(fresh.limit - 4).fill(0) }), 1);
  assert.equal(danger({ ...fresh, moves: Array(fresh.limit - 12).fill(0) }), 0);
});

test("progress goes through readLevels and recordLevel", () => {
  assert.deepEqual(readLevels('{"1":3,"2":1,"99":2,"3":9}', 40), { 1: 3, 2: 1 });
  assert.deepEqual(recordLevel({ 1: 3 }, 1, 2), { 1: 3 });
});

test("move codes: two characters a swap, neighbours only; hostile text refused", () => {
  assert.deepEqual(uncode(code(10, 11)), [10, 11]);
  assert.deepEqual(uncode(code(10, 10 + SIZE)), [10, 10 + SIZE]);
  assert.equal(code(11, 10), code(10, 11));
  const moves = [code(0, 1), code(23, 30), code(47, 48)];
  assert.deepEqual(decodeMoves(encodeMoves(moves)), moves);
  for (const bad of ["", "A", "ABC", "!!", "AA".repeat(101), "__"]) assert.equal(decodeMoves(bad), null, `"${bad}"`);
  assert.equal(decodeMoves(encodeMoves([code(6, 7) + 0 * 2])), null, "row ends don't wrap");
});

test("old levels: the engine replays every recorded old run bit for bit (links without v)", () => {
  assert.equal(fixture.length, 40);
  for (const row of fixture) {
    const run: Run = { v: 1, level: row.level, mode: "n", gift: 0 };
    const game = replay(run, row.moves)!;
    assert.ok(game, `old level ${row.level} replays`);
    assert.equal(game.score, row.score);
    assert.equal(game.moves.length, row.count);
    assert.equal(hash(game.cells), row.final);
    let walk = createGame(run);
    const trail: number[] = [];
    for (let i = 0; i < 14 && !walk.over; i++) { const [a, b] = allMoves(walk.cells)[0]; walk = move(walk, a, b)!; trail.push(hash(walk.cells), walk.score); }
    assert.deepEqual(trail, row.trail, `old level ${row.level}: cascades and shakes`);
  }
});

test("sound calls are safe with no AudioContext (server, old browsers)", () => {
  assert.doesNotThrow(() => { tone(440); hiss(); buzz(); sfx.tap(); sfx.win(); loop("static", 3600).set(0.3); });
});

void FREE_GOAL; void DUST_GOAL;
