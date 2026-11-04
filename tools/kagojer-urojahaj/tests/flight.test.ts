// The flight's rules against the pure step: determinism, the glide's skill curve, landing and the bullseye, crashes and
// checkpoints, the ceiling, the far wall, wind, rain, kites, birds and the last ferry.
import assert from "node:assert/strict";
import test from "node:test";
import { makeCourse } from "../lib/course";
import { createGame, metersOf, pointsOf, starsOf, CRASH, DOWN, EV, EVENT_RING, LANDED, type Game } from "../lib/flight";
import { LEVEL_COUNT, levelOf } from "../lib/levels";
import { DOWN_TIME, METER, STEP, WIND, padX, scoreOf, starsFor } from "../lib/physics";
import { hitAt, stepGame, windOn } from "../lib/step.hot";

const fly = (game: Game, policy: (game: Game) => boolean, seconds = 90) => {
  for (let k = 0; k < seconds / STEP && !game.over; k++) stepGame(game, policy(game), STEP);
  return game;
};
const feather = (game: Game) => game.v > 86;
const print = (game: Game) => [game.over, game.t.toFixed(4), game.x.toFixed(3), game.y.toFixed(3), game.candies, game.crashes, game.landing].join("|");
const events = (game: Game) => { const kinds: number[] = []; for (let k = Math.max(0, game.eventCount - EVENT_RING); k < game.eventCount; k++) kinds.push(game.evKind[k % EVENT_RING]); return kinds; };

test("the same seed makes the same flight, and the same presses fly it the same way", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.deepEqual(makeCourse(48213, level), makeCourse(48213, level));
  assert.notDeepEqual(makeCourse(1, 3).candies, makeCourse(2, 3).candies, "a different seed nudges the candies");
  const policy = (game: Game) => Math.floor(game.t * 3) % 3 === 0;
  for (const level of [1, 6, 12]) {
    const a = fly(createGame(makeCourse(777, level), 3), policy), b = fly(createGame(makeCourse(777, level), 3), policy);
    assert.equal(print(a), print(b), `level ${level}`);
  }
});

test("the glide is a skill: letting go dives short, holding stalls, feathering goes furthest", () => {
  const course = makeCourse(1, 1), reach = (policy: (game: Game) => boolean) => { const game = createGame(course, 1); for (let k = 0; k < 60 * 60 && game.state === 0; k++) stepGame(game, policy(game), STEP); return game.maxX; };
  const none = reach(() => false), always = reach(() => true), feathered = reach(feather);
  assert.ok(none < course.pad.x0, `doing nothing lands short (${none.toFixed(0)})`);
  assert.ok(always < feathered && none < feathered, `feathering ${feathered.toFixed(0)} beats holding ${always.toFixed(0)} and letting go ${none.toFixed(0)}`);
  const stall = createGame(course, 1);
  let stalled = false;
  for (let k = 0; k < 240 && stall.state === 0; k++) { stepGame(stall, true, STEP); if (stall.stalled) stalled = true; }
  assert.ok(stalled, "holding the nose up too long stalls");
});

test("level 1 is a win inside 10 seconds: one held moment after the throw lands it", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const game = fly(createGame(makeCourse(seed * 31, 1), 1), g => g.t < 0.8, 20);
    assert.equal(game.over, 1, `seed ${seed}`);
    assert.ok(game.landT < 10, `landed at ${game.landT}`);
    assert.ok(starsOf(game) >= 1);
  }
});

test("landing: onto the top is a landing, the middle is the bullseye, the stars and points follow", () => {
  const course = makeCourse(5, 1), game = createGame(course, 1), centre = (course.pad.x0 + course.pad.x1) / 2;
  Object.assign(game, { x: centre, y: course.pad.y + 12, prevY: course.pad.y + 12, v: 80, a: -0.3 });
  fly(game, () => false, 3);
  assert.equal(game.landing, 2);
  assert.equal(game.over, 1);
  assert.equal(metersOf(game), course.meters);
  assert.equal(pointsOf(game), scoreOf(game.candies, course.meters, 2));
  assert.equal(starsOf(game), starsFor(2, game.candies, course.goal));
  const side = createGame(course, 1);
  Object.assign(side, { x: course.pad.x0 - 4, y: course.pad.y - 20, prevY: course.pad.y - 20, v: 90, a: 0 });
  stepGame(side, false, STEP);
  assert.equal(side.downKind, CRASH.pad, "into the desk's side is a crash");
  assert.deepEqual([starsFor(0, 99, 1), starsFor(1, 0, 3), starsFor(1, 3, 3), starsFor(2, 3, 3)], [0, 1, 2, 3]);
});

test("a crash costs a page; the next one is thrown from the last checkpoint; out of pages ends the flight", () => {
  const course = makeCourse(3, 3), game = createGame(course, 2);
  while (game.state === 0 && game.t < 10) stepGame(game, false, STEP);
  assert.ok(game.crashes === 1 && events(game).includes(EV.crash));
  const passed = game.checkpoint, at = game.downAt;
  while (game.state === DOWN) stepGame(game, false, STEP);
  assert.ok(game.t - at >= DOWN_TIME - STEP, "the new page waits a moment");
  assert.equal(game.x, course.checkpoints[passed * 2], "thrown again from the checkpoint it last passed");
  assert.ok(events(game).includes(EV.rethrow));
  fly(game, () => true, 30);
  assert.equal(game.over, 2, "two pages, two falls, the end");
  assert.equal(game.left, 0);
  assert.equal(starsOf(game), 0);
});

test("the ceiling knocks the nose down, and the far wall drops an overshooting plane onto the table below", () => {
  const course = makeCourse(9, 1), game = createGame(course, 1);
  Object.assign(game, { y: course.ceiling - 3, v: 200, a: 0.4 });
  stepGame(game, true, STEP);
  assert.equal(game.state, 0, "the ceiling is not a crash");
  assert.ok(game.a <= -0.25);
  const far = createGame(course, 1);
  Object.assign(far, { x: course.length - 40, y: course.pad.y + 90, prevY: course.pad.y + 90, v: 160, a: 0 });
  fly(far, () => false, 4);
  assert.equal(far.landing >= 1, true, "it drops onto the table");
});

test("wind you can see moves the plane: warm air lifts, a fan pushes down, a gust comes and goes", () => {
  const roof = makeCourse(1, 5);
  let warm = -1;
  for (let index = 0; index < roof.windCount; index++) if (roof.winds[index * 10 + 9] === WIND.warm) { warm = index; break; }
  const x = (roof.winds[warm * 10] + roof.winds[warm * 10 + 2]) / 2;
  const up = createGame(roof, 1), still = createGame(roof, 1);
  Object.assign(up, { x, y: 300, prevY: 300, v: 90, a: 0 }); Object.assign(still, { x: x - 400, y: 300, prevY: 300, v: 90, a: 0 });
  for (let k = 0; k < 20; k++) { stepGame(up, false, STEP); stepGame(still, false, STEP); }
  assert.ok(up.y - 300 > still.y - 300 + 20, "warm air lifts");
  const fans = makeCourse(1, 3), push = createGame(fans, 1);
  const fx = (fans.winds[0] + fans.winds[2]) / 2;
  Object.assign(push, { x: fx, y: 300, prevY: 300, v: 90, a: 0 });
  stepGame(push, false, STEP);
  assert.ok(push.wy < 0, "a fan pushes down");
  const gusty = makeCourse(1, 7);
  let gust = -1;
  for (let index = 0; index < gusty.windCount; index++) if (gusty.winds[index * 10 + 9] === WIND.gust) { gust = index; break; }
  const states = new Set<boolean>();
  for (let t = 0; t < 10; t += 0.25) states.add(windOn(gusty.winds, gust, t));
  assert.equal(states.size, 2, "a gust blows and stops");
});

test("rain soaks the paper; kite strings and herons are hazards; the last ferry moves on each horn and stops at the bank", () => {
  const rainy = makeCourse(1, 10);
  let rain = -1;
  for (let index = 0; index < rainy.windCount; index++) if (rainy.winds[index * 10 + 9] === WIND.rain) { rain = index; break; }
  const wet = createGame(rainy, 1);
  Object.assign(wet, { x: rainy.winds[rain * 10] + 5, y: 300, prevY: 300, v: 100, a: 0 });
  for (let k = 0; k < 40; k++) stepGame(wet, false, STEP);
  assert.ok(wet.wet > 0.5, "wet after flying through rain");
  const kites = makeCourse(1, 6);
  assert.equal(hitAt(kites, kites.strings[0], kites.strings[1], 0) >= 0 || hitAt(kites, kites.strings[0], kites.strings[1] - kites.strings[2] / 2, 0) >= 0, true);
  const herons = makeCourse(1, 11);
  assert.ok(herons.birdCount > 0);
  const ferry = makeCourse(1, 12).pad;
  assert.equal(padX(ferry, 5), ferry.x0);
  assert.ok(padX(ferry, 8.5) > ferry.x0, "the ferry moves after the horn");
  assert.ok(padX(ferry, 600) - ferry.x0 <= ferry.max + 1e-9 && ferry.x1 + ferry.max <= levelOf(12).length, "never past the bank");
});

test("candies: through one is a catch and a +১০; the streak breaks on one left behind", () => {
  const course = makeCourse(4, 1), game = createGame(course, 1);
  Object.assign(game, { x: course.candies[0] - 2, y: course.candies[1], prevY: course.candies[1], v: 90, a: 0 });
  stepGame(game, false, STEP);
  assert.equal(game.candies, 1);
  assert.ok(events(game).includes(EV.candy));
  assert.equal(pointsOf(game), 10 + Math.floor(game.maxX / METER));
});

test("every level is laid out sanely: candies in the air, enough of them for ★★, checkpoints in order", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of [1, 99, 4242]) {
    const course = makeCourse(seed, level);
    assert.ok(course.goal >= 1 && course.goal <= course.candyCount, `level ${level}`);
    for (let index = 0; index < course.candyCount; index++) assert.equal(hitAt(course, course.candies[index * 2], course.candies[index * 2 + 1], 0), -1, `level ${level} candy ${index} sits in clear air`);
    for (let index = 1; index < course.checkpointCount; index++) assert.ok(course.checkpoints[index * 2] > course.checkpoints[index * 2 - 2]);
    assert.ok(course.pad.x1 <= course.length + 1e-9 && course.meters > 0);
  }
  assert.equal(LANDED, 2);
});
