// The marble's physics and rules, against the pure step the component runs.
import assert from "node:assert/strict";
import test from "node:test";
import { makeFloor } from "../lib/gen";
import { createGame, fallStars, starsOf, stepsOf, BONUS, CACTUS, CRACKED, HURT, LAND, OVER, PICK, TOP_HIT, WIN, type Game } from "../lib/game";
import { makeLedge, CONCRETE, CRACK, POLE, RAIL, FIRST_Y, GAP, H, R, REFILL, STEP, TOP, VX, W, type Ledge } from "../lib/physics";
import { stepGame } from "../lib/step.hot";
import { PERFECT, playBot } from "./bot";

/** A board of plain ledges for one rule: each row 90 below the last. */
function board(...rows: Array<Partial<Ledge> & { x0: number; x1: number }>): Game {
  const ledges = rows.map((row, index) => Object.assign(makeLedge(index, row.x0, row.x1, FIRST_Y + index * GAP, CONCRETE, 50), row));
  return createGame(1, ledges, ledges.length - 1, 3);
}
const run = (game: Game, dir: number, seconds: number) => { let seen = 0; for (let i = 0; i < seconds * 60 && !game.over; i++) { stepGame(game, STEP, dir); seen |= game.events; } return seen; };

test("same seed and floor, same stairs and the same run; another seed, other stairs", () => {
  assert.deepEqual(makeFloor(4242, 7), makeFloor(4242, 7));
  assert.notDeepEqual(makeFloor(4242, 7).map(l => l.x0), makeFloor(4243, 7).map(l => l.x0));
  const a = makeFloor(99, 9), b = makeFloor(99, 9);
  const ga = playBot(createGame(99, a, a.length - 1, 3), PERFECT, 5), gb = playBot(createGame(99, b, b.length - 1, 3), PERFECT, 5);
  assert.deepEqual([ga.x, ga.t, ga.falls, ga.picks], [gb.x, gb.t, gb.falls, gb.picks]);
});

test("weight: a held side builds speed, letting go slides a little, a landing scrubs some speed", () => {
  const game = board({ x0: 0, x1: W });
  stepGame(game, STEP, 1);
  assert.ok(game.vx > 0 && game.vx < VX / 4, `the first step only starts the roll: ${game.vx}`);
  run(game, 1, 0.3);
  assert.equal(game.vx, VX, "it reaches full speed");
  const before = game.x;
  run(game, 0, 0.5);
  assert.equal(game.vx, 0);
  assert.ok(game.x - before > 10 && game.x - before < 30, `it rolls on a little: ${game.x - before}`);
  // Mopped: the same letting go slides much further.
  const wet = board({ x0: 0, x1: W, wet: true });
  run(wet, 1, 0.3); const from = wet.x; run(wet, 0, 0.5);
  assert.ok(wet.x - from > 3 * (game.x - before), "a mopped step slides on");
  // A landing keeps only part of the sideways speed.
  const drop = board({ x0: 100, x1: 160 }, { x0: 0, x1: W });
  drop.x = 158; run(drop, 1, 0.05);
  let landed = false;
  for (let i = 0; i < 60 && !landed; i++) { const v = drop.vx; stepGame(drop, STEP, 1); if (drop.events & LAND) { landed = true; assert.ok(drop.vx < v * 0.7 + 1); assert.ok(drop.squash > 0 && drop.impact > 200); } }
  assert.ok(landed);
});

test("slopes roll the marble downhill and a round pole won't let it sit; flat concrete holds it", () => {
  const rail = board({ x0: 20, x1: 340, tilt: 0.18, kind: RAIL });
  rail.x = 100; run(rail, 0, 0.6);
  assert.ok(rail.x > 120, `downhill to the right: ${rail.x}`);
  const pole = board({ x0: 100, x1: 220, round: true, kind: POLE });
  pole.x = 165; run(pole, 0, 1);
  assert.ok(pole.x > 175 || pole.on < 0, `off the crown: ${pole.x}`);
  const flat = board({ x0: 100, x1: 220 });
  flat.x = 172; run(flat, 0, 0.6);
  assert.equal(flat.x, 172);
});

test("a cracked step falls a second after you land on it; a gap drops you through", () => {
  const cracked = board({ x0: 0, x1: 120 }, { x0: 80, x1: 200, crack: true }, { x0: 0, x1: W });
  cracked.x = 110; let seen = 0;
  for (let i = 0; i < 60 * 3 && !(seen & CRACKED); i++) { stepGame(cracked, STEP, i < 10 ? 1 : 0); seen |= cracked.events; }
  assert.ok(seen & CRACKED);
  assert.ok(cracked.rows[1].gone && Math.abs(cracked.rows[1].goneAt - (cracked.t)) < 0.02);
  run(cracked, 0, 1);
  assert.equal(cracked.on, 2, "it fell onto the row below");
  assert.ok(CRACK >= 0.9);
  const gap = board({ x0: 40, x1: 320, h0: 150, h1: 182 }, { x0: 0, x1: W });
  gap.x = 120; run(gap, 1, 0.6);
  assert.equal(gap.on, 1, "through the gap onto the next row");
});

test("a gust drifts the drop the way the laundry flaps", () => {
  const still = board({ x0: 100, x1: 160 }, { x0: 0, x1: W }), windy = board({ x0: 100, x1: 160, gust: -1 }, { x0: 0, x1: W });
  for (const game of [still, windy]) { game.x = 158; run(game, 1, 0.1); run(game, 0, 0.6); }
  assert.ok(windy.x < still.x - 8, `blown left: ${windy.x} vs ${still.x}`);
});

test("chances: the awning and a cactus pot cost one, five marbles give one back, the last one ends the floor", () => {
  const top = board({ x0: 0, x1: W });
  top.y = top.cam + TOP + R - 1; top.on = -1;
  stepGame(top, STEP, 0);
  assert.ok(top.events & HURT); assert.equal(top.hurt, TOP_HIT); assert.equal(top.chances, 2); assert.ok(top.wait > 0 && top.on >= 0);
  const pot = board({ x0: 0, x1: 200, pot: 200 - 16 });
  pot.x = 140; run(pot, 1, 1);
  assert.equal(pot.hurt, CACTUS); assert.equal(pot.falls, 1);
  const picks = board({ x0: 0, x1: W, pick: W / 2 });
  picks.chances = 2; picks.picks = REFILL - 1;
  stepGame(picks, STEP, 0);
  assert.ok(picks.events & PICK && picks.events & BONUS); assert.equal(picks.chances, 3);
  const last = board({ x0: 0, x1: W });
  last.chances = 1; last.on = -1; last.y = last.cam + TOP;
  stepGame(last, STEP, 0);
  assert.equal(last.over, 2); assert.ok(last.events & OVER);
  stepGame(last, STEP, 1);
  assert.equal(last.events, 0, "nothing moves after the end");
});

test("the floor ends on its landing, the stars count the falls, and the camera follows a quick way down", () => {
  const rows = makeFloor(7, 1), game = createGame(7, rows, rows.length - 1, 3);
  assert.ok(rows[rows.length - 1].floor && rows[rows.length - 1].x0 === 0 && rows[rows.length - 1].x1 === W);
  let seen = 0;
  playBot(game, PERFECT, 1);
  seen = game.events;
  assert.equal(game.over, 1); assert.ok(seen & WIN); assert.equal(stepsOf(game), game.steps); assert.equal(starsOf(game), 3);
  assert.ok(game.y - game.cam <= 0.46 * H + R, "the marble never sinks below the follow line");
  assert.deepEqual([0, 1, 2, 5].map(fallStars), [3, 2, 1, 1]);
  assert.equal(starsOf({ ...game, over: 2 }), 0);
});

test("the first floor is won inside ten seconds and starts gently", () => {
  const rows = makeFloor(1, 1);
  assert.ok(rows.every(row => row.pot < 0 && !row.wet && !row.crack && row.tilt === 0 && !row.round && row.gust === 0 && Number.isNaN(row.h0)));
  for (let seed = 1; seed <= 20; seed++) {
    const floor = makeFloor(seed * 31, 1), game = playBot(createGame(seed, floor, floor.length - 1, 3), PERFECT, seed);
    assert.ok(game.over === 1 && game.t < 10, `seed ${seed}: ${game.t.toFixed(1)} s`);
  }
});
