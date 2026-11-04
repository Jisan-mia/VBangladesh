import assert from "node:assert/strict";
import test from "node:test";
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import { canMove, mass, slide, spawn, CROW, POINTS, STONE, TOP, WEED, WEED_POINTS, type Dir } from "../lib/board";
import { LEVELS, MODE_INFO } from "../lib/levels";
import {
  createGame, danger, gardenStars, levelStars, limitOf, move, offerEffect, pickOffer, playMoves, recommend, shortBy, specOf, starsOf, stopHere,
  takeBack, threeStar, twoStar, undosOf, CROW_STAY, E_GUST, E_HAIL, E_OFFER, E_PEAK, E_RAIN, MANURE_DROPS, POOL, type Game, type Run,
} from "../lib/rules";

const garden = (seed: number, mode: Run["mode"] = "n", v: 1 | 2 = 2): Run => ({ v, kind: "garden", level: 0, seed, mode });
const level = (n: number, mode: Run["mode"] = "n", v: 1 | 2 = 2): Run => ({ v, kind: "level", level: n, seed: 0, mode });

/** A cheap scripted player: down-left-down-right… falling back to any move that works; offers take the first card. */
export function scripted(start: Game, cap = 3000) {
  let game = start;
  const order: Dir[] = [1, 2, 1, 3];
  for (let i = 0; !game.over && game.moves.length < cap; i++) {
    if (game.offer) { game = pickOffer(game, 0)!; continue; }
    const next = [order[i % 4], 2, 3, 0, 1].map(dir => move(game, dir as Dir)).find(Boolean);
    if (!next) break;
    game = next;
  }
  return game;
}
/** A board in a game, for the events: the plot's cells replaced. */
const withCells = (game: Game, cells: number[], more: Partial<Game> = {}): Game => ({ ...game, cells, ...more });

test("slide: plates run to the edge, equal pairs grow once, stones and crows split a line", () => {
  const row = (values: number[]) => [...values, ...Array(12).fill(0)];
  assert.deepEqual(slide(row([1, 1, 1, 1]), 4, 2)!.cells.slice(0, 4), [2, 2, 0, 0]);
  assert.deepEqual(slide(row([1, 1, 2, 0]), 4, 2)!.cells.slice(0, 4), [2, 2, 0, 0], "a grown plate doesn't grow again in the same slide");
  assert.deepEqual(slide(row([2, 1, 1, 0]), 4, 3)!.cells.slice(0, 4), [0, 0, 2, 2]);
  assert.deepEqual(slide(row([0, 3, 0, 3]), 4, 2)!.cells.slice(0, 4), [4, 0, 0, 0]);
  assert.equal(slide(row([1, 2, 3, 4]), 4, 2), null, "nothing moves, nothing counts");
  assert.deepEqual(slide(row([9, 9, 0, 0]), 4, 3)!.cells.slice(0, 4), [0, 0, 9, 9], "the বাগান is the last stage");
  assert.deepEqual(slide(row([0, 1, STONE, 1]), 4, 2)!.cells.slice(0, 4), [1, 0, STONE, 1], "a stone holds the far plate back");
  assert.equal(slide(row([1, STONE, 1, 0]), 4, 2), null, "nothing merges across a stone");
  assert.equal(slide(row([1, CROW, 1, 0]), 4, 2), null, "a crow blocks like a stone");
  const down = slide([1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4, 1)!;
  assert.equal(down.cells[12], 2);
  assert.equal(down.points, POINTS[2]);
  assert.deepEqual(down.grown, [{ cell: 12, stage: 2 }]);
});

test("weeds slide, never grow, and a pair that meets is pulled out", () => {
  const row = (values: number[]) => [...values, ...Array(12).fill(0)];
  const pulled = slide(row([WEED, 0, WEED, 1]), 4, 2)!;
  assert.deepEqual(pulled.cells.slice(0, 4), [1, 0, 0, 0], "both weeds gone, the plate slides into the freed slot");
  assert.deepEqual(pulled.pulled, [0]);
  assert.equal(pulled.points, WEED_POINTS);
  assert.deepEqual(slide(row([WEED, 1, 1, 0]), 4, 2)!.cells.slice(0, 4), [WEED, 2, 0, 0], "a weed doesn't grow with a plate");
  assert.deepEqual(slide(row([1, WEED, 1, 0]), 4, 3)!.cells.slice(0, 4), [0, 1, WEED, 1], "a weed sits between two plates");
  assert.ok(canMove([WEED, WEED, 2, 1, 2, 1, 2, 3, 3, 2, 3, 2, 2, 3, 2, 3], 4), "two weeds side by side can still be pulled");
  assert.equal(mass([WEED, 1, 3, 0]), 5, "weeds carry no seed mass");
});

test("old links replay the old rules exactly (a fixture recorded from the pre-rewrite code)", async () => {
  const fixture = (await import("./legacy-fixture.json", { with: { type: "json" } })).default as {
    free: Array<{ seed: number; m: string; c: number; score: number; top: number; cells: string }>;
    levels: Array<{ level: number; won: boolean; m: string; c: number; score: number; top: number; cells: string }>;
  };
  const { decodeMoves } = await import("../lib/challenge");
  for (const run of fixture.free) {
    const game = playMoves(createGame(garden(run.seed, "n", 1)), decodeMoves(run.m, run.c)!)!;
    assert.ok(game, `garden ${run.seed}`);
    assert.equal(game.score, run.score); assert.equal(game.top, run.top); assert.equal(game.cells.join(","), run.cells);
    assert.ok(game.over, "the old garden ends only when the bed is full");
  }
  for (const run of fixture.levels) {
    const game = playMoves(createGame(level(run.level, "n", 1)), decodeMoves(run.m, run.c)!)!;
    assert.ok(game?.won, `old level ${run.level}`);
    assert.equal(game.score, run.score); assert.equal(game.cells.join(","), run.cells);
  }
});

test("the same seed gives the same game; the drops don't depend on the moves", () => {
  const a = scripted(createGame(garden(4242)), 300), b = scripted(createGame(garden(4242)), 300);
  assert.deepEqual(a.cells, b.cells);
  assert.equal(a.score, b.score);
  assert.equal(a.picks, b.picks);
  const empty = Array(16).fill(0), half = [...Array(8).fill(3), ...Array(8).fill(0)];
  for (let index = 0; index < 50; index++) assert.equal(spawn(empty, 77, index)!.stage, spawn(half, 77, index)!.stage);
  for (let seed = 1; seed < 100; seed++) assert.equal(mass(createGame(garden(seed)).cells), 2, "two আঁটি to start");
  // every level's plot and weather are the same on every phone
  for (let n = 1; n <= LEVELS.length; n++) assert.deepEqual(scripted(createGame(level(n)), 60).cells, scripted(createGame(level(n)), 60).cells);
});

test("ফেরত নাও can't fish for a better drop, is limited, and keeps the peak", () => {
  const start = createGame(level(4));
  for (const dir of [0, 1, 2, 3] as Dir[]) assert.deepEqual(move(start, dir)?.cells, move(start, dir)?.cells);
  assert.equal(start.undos, 2);
  assert.equal(createGame(level(1)).undos, 0, "taught on level 4");
  assert.equal(undosOf(specOf(level(4)), "e"), 5);
  assert.equal(undosOf(specOf(level(4)), "h"), 0);
  let game = move(start, 1)!;
  game = takeBack(game)!;
  assert.deepEqual(game.cells, start.cells);
  assert.equal(game.undos, 1);
  assert.equal(game.undosUsed, 1);
  assert.equal(takeBack(game), null, "one step back, not two");
  game = takeBack(move(game, 1)!)!;
  assert.equal(game.undos, 0);
  assert.equal(takeBack(move(game, 1)!), null, "none left");
});

test("rain turns every আঁটি into a চারা on its beat", () => {
  const spec = specOf(level(5));
  assert.equal(spec.rain, 8);
  let game = createGame(level(5));
  while (game.moves.length < 7) game = scripted(game, game.moves.length + 1);
  const seeds = game.cells.filter(cell => cell === 1).length;
  let next: Game | null = null;
  for (const dir of [0, 1, 2, 3] as Dir[]) { next = move(game, dir); if (next) break; }
  assert.ok(next && next.events & E_RAIN);
  assert.ok(next!.rained.length > 0 || seeds === 0);
  for (const cell of next!.rained) assert.ok(next!.cells[cell] === 2 || next!.cells[cell] > 2 || next!.spawned?.cell === cell);
});

test("hail is marked two moves ahead and shrinks what sits there", () => {
  let game = createGame(level(8));
  while (!game.hailAt && !game.over) game = scripted(game, game.moves.length + 1);
  assert.ok(game.hailAt > 0 && game.hailCell >= 0, "a hail ring shows");
  assert.equal(game.hailAt - game.moves.length, 2, "two moves ahead");
  // a পাকা আম in the corner, hail due on it, a swipe that leaves it there: it shrinks to a কাঁচা আম
  const board = Array(16).fill(0);
  board[0] = 7; board[15] = 1;
  const due = withCells(createGame(level(8)), board, { hailAt: 1, hailCell: 0 });
  const next = move(due, 2)!;
  assert.ok(next.events & E_HAIL);
  assert.equal(next.cells[0], 6);
  assert.deepEqual(next.hailHit, { cell: 0, from: 7, to: 6 });
  assert.equal(next.hailAt, 0);
  // an আঁটি under hail is gone
  const seed = Array(16).fill(0);
  seed[0] = 1; seed[15] = 2;
  assert.equal(move(withCells(createGame(level(8)), seed, { hailAt: 1, hailCell: 0 }), 2)!.cells[0] === 1, false);
});

test("a gust is warned two moves ahead and slides everything its way", () => {
  let game = createGame(level(13));
  while (!game.gustAt && !game.over) game = scripted(game, game.moves.length + 1);
  assert.equal(game.gustAt - game.moves.length, 2);
  assert.ok(game.gustDir >= 0 && game.gustDir <= 3);
  // swipe up, then the gust blows right: the plate ends in the top-right corner
  const board = Array(16).fill(0);
  board[0] = 3; board[12] = 1;
  const next = move(withCells(createGame(level(13)), board, { gustAt: 1, gustDir: 3 }), 0)!;
  assert.ok(next.events & E_GUST && next.gust);
  assert.equal(next.cells[3], 3);
  assert.equal(next.gustAt, 0);
});

test("a crow lands on its shadow unless the plate is filled, sits 4 moves, then flies", () => {
  let game = createGame(level(18));
  while (game.shadow < 0 && !game.over) game = scripted(game, game.moves.length + 1);
  assert.ok(game.shadow >= 0 && game.cells[game.shadow] === 0, "the shadow falls on an empty plate");
  // 5×5 with stones at 6 and 18; an আঁটি slides up column 0
  const board = Array(25).fill(0);
  board[6] = STONE; board[18] = STONE; board[20] = 1;
  let sit = move(withCells(createGame(level(18)), board, { shadow: 24 }), 0)!;
  assert.equal(sit.crowLanded, 24);
  assert.equal(sit.cells[24], CROW);
  assert.equal(sit.crowLeft, CROW_STAY);
  for (let k = 1; k <= CROW_STAY; k++) {
    const after = [0, 1, 2, 3].map(dir => move(sit, dir as Dir)).find(Boolean)!;
    sit = after;
    if (k < CROW_STAY) assert.equal(sit.cells[24] === CROW || sit.crowCell === 24, true, `still there after ${k}`);
  }
  assert.equal(sit.crowGone, 24, "flies off on the fourth move");
  assert.notEqual(sit.cells[24], CROW);
  // the shadow on the plate the swipe fills: it can't land
  const shooed = move(withCells(createGame(level(18)), board, { shadow: 0 }), 0)!;
  assert.equal(shooed.shooed, 0);
  assert.equal(shooed.cells[0], 1);
  assert.equal(shooed.crowCell, -1);
});

test("levels end at the goal, out of moves or out of room; count goals need every one", () => {
  const won = scripted(createGame(level(2)), 400);
  assert.ok(won.over);
  if (won.won) assert.ok(won.made >= 1 && won.moves.length <= limitOf(won.spec, "n"));
  assert.equal(move(won, 0), null, "nothing after the end");
  const spec19 = specOf(level(19));
  assert.equal(spec19.count, 2);
  // a level's goal is grown, not dropped: a চারা falling by itself doesn't clear level 1
  for (let n = 0; n < 20; n++) {
    const game = createGame(level(1));
    const next = [0, 1, 2, 3].map(dir => move(game, dir as Dir)).find(Boolean)!;
    if (next.spawned?.stage === 2 && !next.last!.grown.length) assert.equal(next.won, false);
  }
});

test("stars and limits: moves in a level, stages in the garden; modes change take-backs and limits only", () => {
  const spec = specOf(level(7));
  assert.equal(levelStars(spec, "n", threeStar(spec)), 3);
  assert.equal(levelStars(spec, "n", threeStar(spec) + 1), 2);
  assert.equal(levelStars(spec, "n", twoStar(spec)), 2);
  assert.equal(levelStars(spec, "n", twoStar(spec) + 1), 1);
  assert.equal(levelStars(spec, "e", 1), 2, "সহজ: two stars at most");
  assert.ok(limitOf(spec, "e") > limitOf(spec, "n") && limitOf(spec, "n") > limitOf(spec, "h"));
  assert.ok(limitOf(spec, "h") > twoStar(spec), "কঠিন can still earn ★★");
  assert.equal(MODE_INFO.e.maxStars, 2);
  assert.deepEqual([5, 6, 7, 8, 9].map(gardenStars), [0, 0, 1, 2, 3]);
  assert.deepEqual(specOf(level(7, "e")).stones, specOf(level(7, "h")).stones, "the plot doesn't change with the mode");
  assert.equal(specOf(garden(5, "h")).weeds > 0, true, "কঠিন garden drops weeds");
  assert.equal(specOf(garden(5, "n")).weeds, 0);
  const game = { ...createGame(level(7)), won: true, moves: Array(threeStar(spec) + 3).fill(0) } as Game;
  assert.equal(shortBy(game), 3);
  assert.equal(starsOf(game), 2);
});

test("মালির থলে: opens at মুকুল, freezes play, numbers three cards with a recommended one, and can't be taken back", () => {
  let game = createGame(garden(9090));
  while (!game.offer && !game.over) {
    const next = [1, 2, 1, 3, 0].map(dir => move(game, dir as Dir)).find(Boolean);
    if (!next) break;
    game = next;
  }
  assert.ok(game.offer, "an offer opened");
  assert.ok(game.events & E_OFFER && game.events & E_PEAK);
  assert.equal(game.peak, 4, "the first at মুকুল");
  assert.equal(game.offer!.length, 3);
  assert.ok(game.offer!.includes(recommend(game, game.offer!)));
  for (const dir of [0, 1, 2, 3] as Dir[]) assert.equal(move(game, dir), null, "no swipe while choosing");
  assert.equal(takeBack(game), null);
  assert.equal(stopHere(game), null);
  const index = game.offer!.indexOf("manure");
  if (index >= 0) {
    const { from, to } = offerEffect(game, "manure");
    assert.equal(to - from, MANURE_DROPS);
    const picked = pickOffer(game, index)!;
    assert.equal(picked.boost, MANURE_DROPS);
    assert.equal(picked.picks, String(POOL.indexOf("manure")));
    assert.equal(takeBack(picked), null, "a pick locks the board");
  }
  const any = pickOffer(game, 0)!;
  assert.equal(any.offer, null);
  assert.equal(any.offers, 1);
  // কঠিন has no take-backs, so no ফেরত card
  let hard = createGame(garden(9090, "h"));
  while (!hard.offer && !hard.over) { const next = [1, 2, 1, 3, 0].map(dir => move(hard, dir as Dir)).find(Boolean); if (!next) break; hard = next; }
  if (hard.offer) assert.ok(!hard.offer.includes("undo"));
  // a full bed waits for the pick: a কোদাল frees it
  const spade = { ...game, cells: [1, 2, 1, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 1, 4, 3], offer: ["spade", "rain", "manure"] as Game["offer"] };
  assert.equal(recommend(spade, spade.offer!), "spade");
  const freed = pickOffer(spade, 0)!;
  assert.equal(freed.cells.filter(cell => cell === 0).length, 3);
  assert.equal(freed.over, false);
});

test("a garden run ends when the bed is full or you stop; the old garden has no offers", () => {
  for (const seed of [1, 99, 123456]) {
    const game = scripted(createGame(garden(seed)));
    assert.ok(game.over && !canMove(game.cells, 4));
    assert.ok(game.top >= 4 && game.top <= TOP);
  }
  const old = scripted(createGame(garden(77, "n", 1)), 400);
  assert.equal(old.picks, "", "no মালির থলে on old links");
  const started = move(createGame(garden(5)), 1)!;
  const stopped = stopHere(started)!;
  assert.ok(stopped.over && stopped.end === "stop");
  assert.equal(stopHere(createGame(garden(5))), null, "nothing to stop before a move");
  assert.equal(stopHere(createGame(level(3))), null, "levels don't stop");
});

test("danger: the last five moves of a level, or a nearly full bed with few ways out", () => {
  const game = createGame(level(7));
  assert.equal(danger(game), false);
  const late = { ...game, moves: Array(limitOf(game.spec, "n") - 4).fill(0) } as Game;
  assert.equal(danger(late), true);
  const full = { ...createGame(garden(3)), cells: [1, 2, 1, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 1, 0, 0] };
  assert.equal(danger(full), true);
});

test("sound calls are safe with no AudioContext (server, old browsers)", () => {
  assert.doesNotThrow(() => { sfx.combo(0); sfx.combo(20); sfx.levelUp(); tone(330, 0.1); hiss(0.1); buzz(10); });
});
