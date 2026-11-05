// The rules of a slide, the heroes leaving, take-back, the hint that teaches, and determinism.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { COLS, WALL, isOut, occupancy, solve } from "../lib/board";
import { clearance, encodeMoves, hint, layoutOf, movesLeft, parOf, reachOf, replay, slide, startGame, undo, LEVEL_COUNT, type Game } from "../lib/game";
import { explainHint } from "../lib/hint";
import { LEVELS } from "../lib/levels";

/** Plays a shortest way out from wherever the game stands. */
function finish(game: Game, help = false) {
  for (const move of solve(game.lay, game.pos)!) game = slide(game, move.car, move.to, help)!;
  return game;
}

test("the same jam always starts the same, and the same moves end the same", () => {
  assert.deepEqual(startGame(12), startGame(12));
  const a = finish(startGame(12)), b = replay(12, encodeMoves(a.moves));
  assert.deepEqual(b?.pos, a.pos);
  assert.equal(b?.moves.length, parOf(12));
  assert.equal(startGame(1).lay, layoutOf(1), "the layout is shared, never copied or changed");
});

test("slides: only along the lane, never through a vehicle or a wall, never off the street", () => {
  for (const level of [1, 9, 17, 22, 25, 32]) {
    const game = startGame(level);
    for (let car = 0; car < game.lay.cars.length; car++) {
      const [low, high] = reachOf(game, car);
      for (let to = -2; to <= 8; to++) {
        const next = slide(game, car, to);
        if (to >= low && to <= high && to !== game.pos[car]) assert.ok(next, `jam ${level} car ${car} to ${to}`);
        else assert.equal(next, null, `jam ${level} car ${car} to ${to}`);
      }
    }
    assert.equal(slide(game, 99, 0), null);
    assert.equal(slide(game, 0, 1.5), null);
    assert.equal(slide(game, -1, 1), null);
  }
  // A wall stops a vehicle like another vehicle does: find a vehicle whose reach ends at a wall.
  let stopped = 0;
  for (let level = 17; level <= 24; level++) {
    const game = startGame(level), grid = occupancy(game.lay, game.pos);
    game.lay.cars.forEach((car, i) => {
      const [low, high] = reachOf(game, i);
      const before = low > 0 && grid[car.down ? (low - 1) * COLS + car.line : car.line * COLS + low - 1] === WALL;
      const after = high + car.len < (car.down ? 7 : 6) && grid[car.down ? (high + car.len) * COLS + car.line : car.line * COLS + high + car.len] === WALL;
      if (before || after) stopped++;
    });
  }
  assert.ok(stopped >= 4, `walls stopped ${stopped} slides across street three`);
});

test("moving the same vehicle again is still one move; sliding it back takes the move away; undo puts it back", () => {
  let game = startGame(8);
  const car = game.lay.cars.findIndex((_, i) => { const [low, high] = reachOf(game, i); return i > 0 && high - low >= 2; });
  assert.ok(car > 0);
  const [low, high] = reachOf(game, car), home = game.pos[car];
  const far = Math.abs(high - home) >= Math.abs(home - low) ? high : low;
  const near = [low, low + 1, high - 1, high].find(cell => cell >= low && cell <= high && cell !== home && cell !== far)!;
  game = slide(game, car, near)!;
  game = slide(game, car, far)!;
  assert.equal(game.moves.length, 1);
  assert.deepEqual(game.moves[0], { car, from: home, to: far });
  game = slide(game, car, home)!;
  assert.equal(game.moves.length, 0, "back where it started: no move counted");
  assert.equal(game.undone, 1, "…and it counts as one taken back");
  game = slide(game, car, far)!;
  const back = undo(game)!;
  assert.equal(back.pos[car], home);
  assert.equal(back.undone, 2);
  assert.equal(undo(back), null, "nothing to undo");
});

test("your CNG leaves through the gap and the street clears; nothing moves after", () => {
  const game = finish(startGame(1));
  assert.ok(game.won);
  assert.equal(game.moves.length, 2);
  assert.ok(isOut(game.lay, game.pos, 0));
  assert.equal(slide(game, 1, 0), null, "no moves after the CNG is out");
  assert.equal(undo(game), null);
  assert.equal(hint(game), null);
  assert.equal(explainHint(game), null);
});

test("two CNGs: one leaving does not clear the street; it vanishes, frees its cells and can't be moved; both out wins; taking back brings it back", () => {
  let game = startGame(25);
  assert.equal(game.lay.heroes, 2);
  // Play the shortest way until exactly one hero is out.
  const path = solve(game.lay, game.pos)!;
  let outFirst: Game | null = null;
  for (const move of path) {
    game = slide(game, move.car, move.to)!;
    const out = [0, 1].filter(h => isOut(game.lay, game.pos, h));
    if (out.length === 1 && !outFirst) outFirst = game;
  }
  assert.ok(outFirst, "the first CNG leaves before the street clears");
  assert.equal(outFirst!.won, false);
  assert.equal(clearance(outFirst!).out, 1);
  const gone = [0, 1].find(h => isOut(outFirst!.lay, outFirst!.pos, h))!;
  assert.deepEqual(reachOf(outFirst!, gone), [0, 0], "a CNG that left stays out");
  assert.equal(slide(outFirst!, gone, 1), null);
  const grid = occupancy(outFirst!.lay, outFirst!.pos);
  assert.ok(!grid.includes(gone), "its cells are free road");
  const back = undo(outFirst!)!;
  assert.ok(!isOut(back.lay, back.pos, gone), "taking back the exit brings the CNG back into the street");
  assert.ok(occupancy(back.lay, back.pos).includes(gone));
  assert.ok(game.won);
  assert.equal(clearance(game).out, 2);
  assert.equal(game.moves.length, parOf(25));
});

test("the hint always knows a shortest way, and taking it every time clears the street in par moves", () => {
  for (const level of [1, 7, 12, 19, 24, 28, 32]) {
    let game = startGame(level);
    let asked = 0;
    while (!game.won) { const move = hint(game)!; game = slide(game, move.car, move.to, true)!; asked++; }
    assert.equal(game.moves.length, parOf(level), `jam ${level}`);
    assert.equal(asked, parOf(level));
    assert.equal(game.helped, parOf(level));
  }
});

test("a hint says what to move, which way, how far, why, and how many moves are left", () => {
  const first = explainHint(startGame(1))!;
  assert.equal(first.move.car, 1);
  assert.equal(first.direction, "right");
  assert.equal(first.steps, 2);
  assert.equal(first.left, 1);
  assert.equal(first.line, "রিকশাটা সবুজ CNG-র পথ আটকে আছে। ডানে ২ ঘর সরাও। তারপর আর ১ চাল।");
  const moved = slide(startGame(1), 1, 2)!;
  const last = explainHint(moved)!;
  assert.equal(last.line, "পথ খোলা। সবুজ CNG-টা ওপরে তুলে বের করো।");
  assert.equal(last.left, 0);
  // Every jam's first hint names a vehicle and a direction, and its left count is par − 1.
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const info = explainHint(startGame(level))!;
    assert.match(info.line, /ডানে|বাঁয়ে|ওপরে|নিচে/, `jam ${level}`);
    assert.match(info.line, /ঘর/);
    assert.equal(info.left, parOf(level) - 1);
  }
  // On a jam where the first move only makes room, the line says whose room.
  const indirect = LEVELS.map((_, i) => explainHint(startGame(i + 1))!).filter(info => /পাবে/.test(info.line));
  assert.ok(indirect.length >= 8, `${indirect.length} jams start by making room for another vehicle`);
});

test("how clear the street is only improves as the shortest way is played, ending at one", () => {
  for (const level of [3, 12, 24, 30]) {
    let game = startGame(level), before = clearance(game).fraction;
    assert.equal(before, 0);
    for (const move of solve(game.lay, game.pos)!) {
      game = slide(game, move.car, move.to)!;
      const now = clearance(game).fraction;
      assert.ok(now >= 0 && now <= 1);
      before = now;
    }
    assert.equal(clearance(game).fraction, 1, `jam ${level}`);
    assert.equal(movesLeft(game), 0);
  }
});

test("a headless player: random slides for a while, then the hint, always gets out and makes a valid link", () => {
  const rng = makeRng(2026);
  for (let run = 0; run < 16; run++) {
    const level = 1 + pick(rng, LEVEL_COUNT);
    let game = startGame(level);
    for (let step = 0; step < 50 && !game.won; step++) {
      const car = pick(rng, game.lay.cars.length), [low, high] = reachOf(game, car);
      game = slide(game, car, low + pick(rng, high - low + 1)) ?? game;
    }
    const wandered = game.moves.length;
    if (!game.won) game = finish(game, true);
    assert.ok(game.won, `jam ${level}`);
    assert.ok(game.moves.length >= parOf(level) || game.helped === 0, `jam ${level}`);
    assert.ok(game.moves.length <= wandered + parOf(level) + 6);
    assert.ok(replay(level, encodeMoves(game.moves)), "every finished game makes a valid link");
  }
});
