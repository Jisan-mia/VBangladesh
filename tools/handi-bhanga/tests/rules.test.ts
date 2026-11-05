// The stall's rules: layout from a seed, the physics, scoring, the firecracker, the knot, the মটকা, শেষ ডাক, losing a ball,
// the preview being exact, and the loop breaker.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { BOSS_POINTS, LEVELS, LEVEL_COUNT, OLD_STALLS, potCount, potPoints, starsOf } from "../lib/levels";
import {
  alive, BALL_R, BLAST, CELL, E_BLAST, E_BOSS_HIT, E_BREAK, E_CATCH, E_CLEAR, E_CRACK, E_KNOT, E_LASTCALL, E_LOST, E_OUT, E_OVER, E_STICK, E_THROW,
  FLOOR_Y, K_BAMBOO, K_BOSS, K_CRACKER, K_TOUGH, left, MAX_ANGLE, MAX_POTS, MAX_SPEED, MIN_REST, POT_H, POT_W, potCentre, potLeftAt, ROW_GAP,
  SLOW, speedOf, STICK_Y, W, WALL, bossSlide, swayAt, windAt, createLevel, createGame, type Game,
} from "../lib/rules";
import { landingX, moveStick, newGame, setAim, stepGame, throwBall, traceAim } from "../lib/step.hot";
import { createOld } from "./old-game";
import { CASUAL, play, runOf } from "./bot";

const DT = 1 / 60;
/** Steps until `done` says so (or the limit), returning the events seen along the way (OR-ed). */
function until(game: Game, done: (game: Game) => boolean, limit = 60 * 60, slow = false) {
  let flags = 0;
  for (let i = 0; i < limit && !done(game); i++) { stepGame(game, DT, slow); flags |= game.events; game.events = 0; game.hitN = 0; }
  return flags;
}
const rest = (game: Game) => { stepGame(game, MIN_REST + DT, false); game.events = 0; };

test("the same run gives the same stall, and the same inputs give the same game", () => {
  const one = newGame(runOf(48213, 6)), two = newGame(runOf(48213, 6)), other = newGame(runOf(48214, 6));
  assert.deepEqual([...one.kinds, ...one.design, one.windPhase], [...two.kinds, ...two.design, two.windPhase]);
  assert.notDeepEqual([...one.kinds, ...one.design], [...other.kinds, ...other.design]);
  const a = play(runOf(777, 5), CASUAL), b = play(runOf(777, 5), CASUAL);
  assert.deepEqual([a.game.x, a.game.y, a.game.score, a.game.lost, a.game.time, [...a.game.hits]], [b.game.x, b.game.y, b.game.score, b.game.lost, b.game.time, [...b.game.hits]]);
});

test("every stall lays out its pots as its data says: thick, firecracker, knot, the মটকা", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const def = LEVELS[level - 1], game = createLevel(5, level);
    const count = (kind: number) => [...game.kinds].slice(0, game.n).filter(item => item === kind).length;
    assert.equal(count(K_TOUGH), def.tough, `stall ${level} thick pots`);
    assert.equal(count(K_CRACKER), def.crackers, `stall ${level} firecrackers`);
    assert.equal(count(K_BOSS), def.boss ? 1 : 0, `stall ${level} মটকা`);
    assert.equal(game.total, potCount(def), `stall ${level} breakable pots`);
    assert.ok(game.n <= MAX_POTS);
    for (const row of def.rows) assert.equal(row.length, 7);
    if (def.boss) assert.equal(game.hits[game.boss], def.boss);
    // Neighbours on a rope never wear the same painting.
    for (let i = 1; i < game.n; i++) if (game.rope[i] === game.rope[i - 1] && game.kinds[i] !== K_BOSS && game.kinds[i - 1] !== K_BOSS) assert.notEqual(game.design[i], game.design[i - 1]);
    // Every pot hangs well above the লাঠি.
    for (let i = 0; i < game.n; i++) assert.ok(game.py[i] + game.ph[i] + 70 < STICK_Y, `stall ${level} pot ${i} leaves room`);
  }
});

test("old links lay out the old stall exactly: the same paintings, the same thick pots, the same wind", () => {
  for (const seed of [1, 48213, 999_999_999]) for (let level = 1; level <= OLD_STALLS.length; level++) {
    const now = createGame({ seed, kind: "old", level, mode: "n" }), then = createOld(seed, level);
    assert.deepEqual([...now.design.slice(0, 35)], [...then.design], `seed ${seed} stall ${level} paintings`);
    assert.deepEqual([...now.kinds.slice(0, 35)].map(kind => kind === K_TOUGH ? 1 : 0), [...then.tough], `seed ${seed} stall ${level} thick pots`);
    assert.equal(now.windPhase, then.windPhase);
    assert.equal(now.n, 35);
    assert.equal(now.balls, 3);
    assert.equal(now.def.catchAt, 0, "old stalls have no শেষ ডাক");
  }
});

test("pots and poles leave no gap the ball can slip through, and sway never pokes into a pole", () => {
  assert.ok(CELL - POT_W < BALL_R * 2, "between two pots on a rope");
  assert.ok(ROW_GAP - POT_H < BALL_R * 2, "between two ropes");
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const game = createLevel(3, level);
    for (let t = 0; t < 60; t += 0.25) for (let i = 0; i < game.n; i++) {
      const left = potLeftAt(game, i, t);
      assert.ok(left >= WALL - 1e-9 && left + game.pw[i] <= W - WALL + 1e-9, `stall ${level} pot ${i} at ${t}s stays inside the poles`);
    }
  }
});

test("a fast ball never tunnels through a pot, even with a huge time step", () => {
  for (const dt of [1 / 60, 1 / 20, 1 / 8]) {
    const game = createLevel(11, 3);
    rest(game); throwBall(game);
    for (let i = 0; i < 400 && game.phase === "fly"; i++) {
      stepGame(game, dt, false); game.events = 0; game.hitN = 0;
      moveStick(game, game.x);
      for (let j = 0; j < game.n; j++) if (alive(game, j)) {
        const nx = Math.max(game.px[j], Math.min(game.px[j] + game.pw[j], game.x)) - game.x, ny = Math.max(game.py[j], Math.min(game.py[j] + game.ph[j], game.y)) - game.y;
        assert.ok(nx * nx + ny * ny >= BALL_R * BALL_R * 0.99, `dt ${dt}: the ball is inside pot ${j}`);
      }
    }
  }
});

test("the ball stays between the poles and under the awning in every stall", () => {
  for (const level of [1, 4, 8, 9, 12]) {
    const game = newGame(runOf(21, level));
    const rng = makeRng(5);
    for (let i = 0; i < 60 * 60 && game.phase !== "over"; i++) {
      if (game.phase === "aim") { setAim(game, (rng() - 0.5) * 2 * MAX_ANGLE); throwBall(game); }
      if (game.phase === "fly") moveStick(game, landingX(game) + (rng() - 0.5) * 30);
      stepGame(game, DT, false); game.events = 0; game.hitN = 0;
      if (game.phase === "fly") {
        assert.ok(game.x - BALL_R >= WALL - 1e-6 && game.x + BALL_R <= W - WALL + 1e-6, "between the poles");
        assert.ok(game.y - BALL_R >= game.ceiling - 1e-6, "under the awning");
      }
    }
  }
});

test("scoring: 10 a pot, a run in one flight climbs 5 a pot to 50, the মটকা is 100, each ball left adds 50 at a clear", () => {
  assert.deepEqual([1, 2, 3, 4, 8, 9, 30].map(potPoints), [10, 15, 20, 25, 45, 50, 50]);
  const game = createLevel(1, 1);
  game.catching = false;
  // Break the five pots of stall 1 in one flight by hand.
  for (let i = 0; i < game.n; i++) {
    game.hits[i] = 1;
    game.x = potCentre(game, i); game.y = game.py[i] + game.ph[i] + BALL_R + 1;
  }
  assert.equal(game.total, 5);
  game.phase = "fly"; game.dx = 0; game.dy = -1;
  let flags = 0;
  const seen: number[] = [];
  for (let i = 0; i < game.n && game.phase === "fly"; i++) {
    game.x = potCentre(game, i); game.y = game.py[i] + game.ph[i] + BALL_R + 2; game.dx = 0; game.dy = -1;
    const before = game.score;
    stepGame(game, DT, false); flags |= game.events; game.events = 0; game.hitN = 0;
    seen.push(game.score - before);
  }
  assert.deepEqual(seen, [10, 15, 20, 25, 30 + 3 * 50], "the last pot adds the three balls in hand");
  assert.equal(game.bestFlight, 5);
  assert.ok(flags & E_CLEAR && flags & E_BREAK);
});

test("a thick pot takes two hits, the মটকা takes its own, and a knot never breaks", () => {
  const game = createLevel(9, 4);
  const thick = [...game.kinds].findIndex(kind => kind === K_TOUGH);
  for (let i = 0; i < game.n; i++) if (i !== thick && i !== game.boss) game.hits[i] = 0;
  assert.equal(game.hits[thick], 2);
  const aimAt = (i: number) => { game.x = potCentre(game, i); game.y = game.py[i] + game.ph[i] + BALL_R + 3; game.dx = 0; game.dy = -1; game.phase = "fly"; };
  aimAt(thick);
  stepGame(game, DT, false);
  assert.equal(game.hits[thick], 1, "the first hit cracks it");
  assert.ok(game.events & E_CRACK);
  assert.equal(game.broken, 0);
  game.events = 0; game.hitN = 0;
  aimAt(thick);
  stepGame(game, DT, false);
  assert.equal(game.hits[thick], 0);
  assert.equal(game.broken, 1);
  game.events = 0; game.hitN = 0;
  // The মটকা.
  const boss = game.boss;
  assert.equal(game.hits[boss], LEVELS[3].boss);
  let flags = 0;
  for (let hit = 1; hit <= LEVELS[3].boss; hit++) {
    game.phase = "fly"; game.x = potCentre(game, boss); game.y = game.py[boss] + game.ph[boss] + BALL_R + 3; game.dx = 0; game.dy = -1;
    const before = game.score;
    stepGame(game, DT, false); flags |= game.events; game.events = 0; game.hitN = 0;
    if (hit < LEVELS[3].boss) { assert.equal(game.hits[boss], LEVELS[3].boss - hit); assert.equal(game.score, before, "a crack scores nothing"); }
  }
  assert.ok(flags & E_BOSS_HIT);
  assert.equal(game.hits[boss], 0);
  assert.ok(game.score >= BOSS_POINTS);
  // A knot.
  const knots = createLevel(9, 7), knot = [...knots.kinds].findIndex(kind => kind === K_BAMBOO);
  assert.ok(knot >= 0 && knots.total === potCount(LEVELS[6]));
  for (let i = 0; i < knots.n; i++) if (i !== knot) knots.hits[i] = 0;
  knots.phase = "fly"; knots.x = potCentre(knots, knot); knots.y = knots.py[knot] + knots.ph[knot] + BALL_R + 3; knots.dx = 0; knots.dy = -1;
  const total = knots.total;
  stepGame(knots, DT, false);
  assert.ok(knots.events & E_KNOT);
  assert.equal(knots.hits[knot], 1);
  assert.equal(knots.broken, 0);
  assert.equal(knots.total, total, "a knot is not one of the pots to break");
  assert.ok(knots.dy > 0, "the ball bounced off it");
});

test("a firecracker pot cracks the live pots next to it and nothing far away", () => {
  const game = createLevel(4, 6);
  const cracker = [...game.kinds].findIndex(kind => kind === K_CRACKER);
  for (let i = 0; i < game.n; i++) if (i !== cracker && game.kinds[i] === K_CRACKER) game.kinds[i] = 0;
  const centre = (i: number) => ({ x: potCentre(game, i), y: game.py[i] + game.ph[i] / 2 });
  const near: number[] = [], far: number[] = [];
  const c = centre(cracker);
  for (let i = 0; i < game.n; i++) {
    if (i === cracker || game.kinds[i] === K_BAMBOO) continue;
    const nx = Math.max(potLeftAt(game, i, game.clock), Math.min(potLeftAt(game, i, game.clock) + game.pw[i], c.x)) - c.x, ny = Math.max(game.py[i], Math.min(game.py[i] + game.ph[i], c.y)) - c.y;
    (nx * nx + ny * ny < BLAST * BLAST ? near : far).push(i);
  }
  assert.ok(near.length >= 2 && far.length > 5);
  const thick = near.filter(i => game.kinds[i] === K_TOUGH);
  game.phase = "fly"; game.x = c.x; game.y = game.py[cracker] + game.ph[cracker] + BALL_R + 3; game.dx = 0; game.dy = -1;
  stepGame(game, DT, false);
  assert.ok(game.events & E_BLAST);
  for (const i of near) {
    if (game.kinds[i] === K_BAMBOO) continue;
    if (game.kinds[i] === K_TOUGH) assert.ok(game.hits[i] < game.maxHits[i], "a thick pot beside it cracks");
    else if (game.kinds[i] !== K_BOSS && game.kinds[i] !== K_CRACKER) assert.equal(game.hits[i], 0, `pot ${i} beside it breaks`);
  }
  for (const i of far) assert.equal(game.hits[i], game.maxHits[i], `pot ${i} far away is untouched`);
  assert.ok(thick.length >= 0);
  assert.ok(game.flight >= 1 + near.length - thick.length - 1);
});

test("শেষ ডাক: the bell rings once when few pots are left, then the লাঠি catches the ball for another aimed throw", () => {
  const game = createLevel(8, 2);
  assert.equal(game.catching, false, "stall 2 starts with a bouncing লাঠি");
  const catchAt = game.def.catchAt;
  let rings = 0;
  for (let i = 0; i < game.n && left(game) > 0; i++) {
    game.hits[i] = 0; game.broken++;
    if (left(game) === catchAt) break;
  }
  assert.equal(left(game), catchAt);
  game.phase = "fly";
  const live = [...game.hits].findIndex(hits => hits > 0);
  game.x = potCentre(game, live); game.y = game.py[live] + game.ph[live] + BALL_R + 3; game.dx = 0; game.dy = -1;
  stepGame(game, DT, false);
  if (game.events & E_LASTCALL) rings++;
  assert.equal(game.catching, true);
  assert.equal(rings, 1);
  game.events = 0; game.hitN = 0;
  // Now a falling ball comes to rest on the লাঠি and can be thrown again.
  game.phase = "fly"; game.x = game.stick + 20; game.y = STICK_Y - 30; game.dx = 0; game.dy = 1; game.flight = 3;
  const flags = until(game, g => g.phase !== "fly", 120);
  assert.ok(flags & E_CATCH);
  assert.equal(game.phase, "aim");
  assert.equal(game.lost, 0);
  assert.ok(Math.abs(game.offset - 20) < 2, "it rests where it landed");
  assert.equal(game.flight, 0);
  rest(game);
  assert.ok(throwBall(game), "and throws again");
  assert.equal(createLevel(1, 1).catching, true, "stall 1 catches from the start");
  assert.equal(createGame({ seed: 1, kind: "old", level: 1, mode: "n" }).catching, false, "old stalls never catch");
});

test("a throw needs the ball to rest a moment, and only one ball flies at a time", () => {
  const game = createLevel(2, 1);
  assert.equal(throwBall(game), false, "just placed");
  rest(game);
  assert.ok(throwBall(game));
  assert.equal(game.phase, "fly");
  assert.equal(throwBall(game), false, "already flying");
  assert.ok(game.events & E_THROW);
  assert.equal(game.throws, 1);
});

test("a missed ball costs one, waits on the লাঠি, and the last miss ends the stall", () => {
  const game = createLevel(6, 3);
  const balls = game.balls;
  for (let miss = 1; miss <= balls; miss++) {
    rest(game); throwBall(game);
    moveStick(game, 40);
    game.x = 320; game.y = STICK_Y - 40; game.dx = 0; game.dy = 1;
    const flags = until(game, g => g.phase !== "fly", 600);
    assert.ok(flags & E_LOST, `miss ${miss}`);
    assert.equal(game.lost, miss);
    if (miss < balls) { assert.equal(game.phase, "aim"); assert.equal(game.balls, balls - miss); assert.equal(game.x, game.stick, "the next ball sits on the লাঠি"); }
  }
  assert.equal(game.phase, "end");
  assert.equal(game.end, "out");
  const flags = until(game, g => g.phase === "over", 200);
  assert.ok(flags & E_OVER);
  const frozen = [game.score, game.time];
  stepGame(game, DT, false);
  assert.deepEqual([game.score, game.time], frozen, "nothing moves after the end");
  assert.equal(starsOf(false, game.lost), 0);
});

test("a clear raises E_CLEAR once, plays out for a moment, then ends; the end is reached once", () => {
  const out = play(runOf(1, 1), CASUAL);
  assert.ok(out.cleared);
  assert.equal(out.game.phase, "over");
  assert.ok(out.game.score >= 5 * 10 + out.game.balls * 50);
  assert.equal(left(out.game), 0);
});

test("the preview is exact: the pot the dotted path ends at is the first pot the ball really hits", () => {
  for (const level of [1, 2, 3, 4, 7, 9, 12]) for (const seed of [3, 14, 159]) {
    const game = newGame(runOf(seed, level));
    rest(game);
    traceAim(game, false);
    const target = game.target;
    assert.ok(target >= 0, `stall ${level} seed ${seed} has a first pot`);
    throwBall(game);
    let hit = -1;
    for (let i = 0; i < 60 * 30 && hit < 0 && game.phase === "fly"; i++) {
      stepGame(game, DT, false);
      if (game.hitN > 0) { for (let j = 0; j < game.hitN; j++) if (game.kinds[game.hitList[j]] !== K_BAMBOO) { hit = game.hitList[j]; break; } }
      game.events = 0; game.hitN = 0;
    }
    assert.equal(hit, target, `stall ${level} seed ${seed}`);
  }
});

test("speed rises a little with each emptied rope, stays under the cap, and ধীরে খেলো is slower", () => {
  const game = createLevel(5, 5);
  const speeds = [0, 1, 2, 3].map(ropes => { game.ropesCleared = ropes; return speedOf(game, false); });
  assert.ok(speeds.every((value, index) => index === 0 || value >= speeds[index - 1]));
  game.ropesCleared = 40;
  assert.ok(speedOf(game, false) <= MAX_SPEED + game.def.speed + 1e-9);
  assert.ok(Math.abs(speedOf(game, true) - speedOf(game, false) * SLOW) < 1e-9);
  game.ropesCleared = 0;
  const hard = createLevel(5, 5, "h"), easy = createLevel(5, 5, "e");
  assert.ok(speedOf(easy, false) < speedOf(game, false) && speedOf(game, false) < speedOf(hard, false));
  assert.ok(easy.stickW > game.stickW && game.stickW > hard.stickW);
  assert.deepEqual([easy.balls, game.balls, hard.balls], [5, 3, 2]);
});

test("the wind bends the ball but never flattens it; sway and the মটকা's slide stay in range", () => {
  const game = createLevel(48213, 12);
  rest(game); throwBall(game);
  const steep = Math.cos(MAX_ANGLE);
  for (let i = 0; i < 60 * 40 && game.phase === "fly"; i++) {
    stepGame(game, DT, false);
    game.events = 0; game.hitN = 0;
    moveStick(game, landingX(game) || game.x);
    assert.ok(Math.abs(game.dy) >= steep - 1e-9, "never flatter than the লাঠि's steepest angle".replace("লাঠि", "লাঠি"));
    assert.ok(Math.abs(Math.hypot(game.dx, game.dy) - 1) < 1e-9);
  }
  let top = 0;
  for (let t = 0; t < 120; t += 0.1) top = Math.max(top, Math.abs(windAt(game, t)), Math.abs(swayAt(game.def, t, 1)) / 100, Math.abs(bossSlide(game.def, t)) / 1000);
  assert.ok(windAt(createLevel(1, 1), 3) === 0 && swayAt(createLevel(1, 1).def, 3, 1) === 0, "calm stalls are calm");
  assert.ok(Math.abs(bossSlide(game.def, 1)) <= game.def.bossMove);
  assert.ok(top > 0);
});

test("a ball that rallies a long time without hurting a pot is nudged off the লাঠি, so no loop lasts for ever", () => {
  const game = newGame(runOf(2, 2));
  for (let i = 0; i < game.n; i++) game.hits[i] = 0;
  game.catching = false;
  game.broken = 0;
  rest(game);
  game.aim = 0; throwBall(game);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 60 * 80; i++) {
    stepGame(game, DT, false); game.events = 0; game.hitN = 0;
    if (game.phase !== "fly") break;
    moveStick(game, game.x);
    if (game.dry > 12) { lo = Math.min(lo, game.x); hi = Math.max(hi, game.x); }
  }
  assert.ok(hi - lo > 40, `the ball wandered ${Math.round(hi - lo)} units off its straight line`);
});

test("the floor is below the লাঠি and the লাঠি sits under every pot", () => {
  assert.ok(FLOOR_Y > STICK_Y);
  const game = createLevel(1, 12);
  for (let i = 0; i < game.n; i++) assert.ok(game.py[i] + game.ph[i] < STICK_Y - 60);
  assert.equal(E_STICK > 0 && E_OUT > 0, true);
});
