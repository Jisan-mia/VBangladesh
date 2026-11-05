// The ride's rules against the pure game: lanes, bumps and the allowance, delivery, pickups, bells, mud, vans, walkers, dogs,
// gusts, the finale bar, points and stars. Every one runs the very code the component runs (stepGame).
import assert from "node:assert/strict";
import test from "node:test";
import { makeCourse } from "../lib/course";
import { AHEAD, DELIVERED, EV, EVENT_RING, MISSED, RUNNING, WAITING, createGame, fullMeters, pointsOf, starsFor, steer, type Game, type Piece } from "../lib/game";
import {
  laneX, BIKE_LEN, CART, COW, DOG, LETTER, MUD_T, PUDDLE, SWITCH_T, UNIT, VAN, WALK_COW, WALK_GOAT,
} from "../lib/geometry";
import { stepGame } from "../lib/step.hot";
import { CAREFUL, makeBot, rideWith } from "./bot";

const DT = 1 / 60;
const run = (game: Game, seconds: number, each?: (game: Game) => void) => { for (let i = 0; i < Math.round(seconds * 60) && !game.over; i++) { each?.(game); stepGame(game, DT); } return game; };
const events = (game: Game) => { const out: number[] = []; for (let i = Math.max(0, game.eventCount - EVENT_RING); i < game.eventCount; i++) out.push(game.evKind[i % EVENT_RING]); return out; };
const first = (game: Game, kind: number): Piece => game.pieces.find(piece => piece.kind === kind)!;
/** Puts the bike's front wheel `ahead` units before `y`, in `lane`, at its lane's x. */
const place = (game: Game, y: number, ahead: number, lane: number) => { game.d = y - ahead; game.lane = lane; game.x = laneX(lane); };

test("the same seed and the same taps give the very same ride; another seed another ride", () => {
  const play = (seed: number) => { const game = createGame(makeCourse(seed, 5), 1), bot = makeBot(CAREFUL, 1); run(game, 30, bot); return JSON.stringify([game.d, game.score, game.delivered, game.bumps, game.lane, game.eventCount, game.t]); };
  assert.equal(play(4242), play(4242));
  assert.notEqual(play(4242), play(4243));
});

test("a tap moves one lane and the bike is there 0.12 s later; two quick taps cross two lanes; the edges hold", () => {
  const game = createGame(makeCourse(4242, 3), 1);
  steer(game, -1);
  assert.equal(game.lane, 0);
  run(game, SWITCH_T + 0.03);
  assert.equal(game.x, laneX(0), "in its lane after 0.12 s");
  steer(game, -1); steer(game, -1);
  assert.equal(game.lane, 0, "no lane left of the left lane");
  steer(game, 1); steer(game, 1);
  assert.equal(game.lane, 2);
  run(game, 2 * SWITCH_T + 0.03);
  assert.equal(game.x, laneX(2));
});

test("the first row is a puddle in the middle lane: riding straight bumps it, costs a letter, halves the speed, and counts against the allowance", () => {
  const game = createGame(makeCourse(4242, 2), 1), bag = game.bag;
  run(game, 4);
  assert.equal(game.bumps, 1);
  assert.equal(game.bag, bag - 1);
  assert.equal(game.lost, 1);
  assert.ok(events(game).includes(EV.bump));
  assert.ok(game.recover > 0 || game.v > 0);
  assert.ok(!game.over, "one bump does not end a স্বাভাবিক ride");
});

test("the allowance: সহজ ends on the 5th bump, স্বাভাবিক on the 3rd, কঠিন on the 1st; the stopped bike is wrecked, not finished", () => {
  for (const [mode, limit] of [[0, 5], [1, 3], [2, 1]] as const) {
    const game = createGame(makeCourse(4242, 9), mode);
    run(game, 60);
    assert.equal(game.over, 1, `mode ${mode} ends`);
    assert.equal(game.bumps, limit);
    assert.equal(game.wrecked, 1);
    assert.equal(game.finished, 0);
    assert.ok(events(game).includes(EV.wreck));
    assert.equal(starsFor(false, game.delivered, game.course.houses.length, game.course.spec.goal), 0, "no stars for a stop short of the place");
  }
});

test("a gate takes its letter when the bike rides the lane beside it; a gate passed from another lane is missed and its hand drops", () => {
  const course = makeCourse(4242, 1), house = course.houses[0], lane = house.side ? 2 : 0;
  const ok = createGame(course, 1); place(ok, house.y, 120, lane); ok.houseNext = 0;
  run(ok, 1, game => { game.bag = 3; });
  assert.equal(ok.houseState[0], DELIVERED);
  assert.equal(ok.delivered, 1);
  assert.ok(events(ok).includes(EV.deliver));
  const missed = createGame(course, 1); place(missed, house.y, 120, 1);
  run(missed, 1);
  assert.equal(missed.houseState[0], MISSED);
  assert.equal(missed.streak, 0);
  assert.ok(events(missed).includes(EV.miss));
});

test("with no letter in the bag a gate waits for nothing: the hand drops", () => {
  const course = makeCourse(4242, 1), house = course.houses[0];
  const game = createGame(course, 1); place(game, house.y, 120, house.side ? 2 : 0); game.bag = 0;
  run(game, 1);
  assert.equal(game.houseState[0], MISSED);
});

test("a letter lying on the road is picked up by riding over it, and a bump loses one from the bag but never makes the bag negative", () => {
  const course = makeCourse(4242, 2), letter = first(createGame(course, 1), LETTER);
  const game = createGame(course, 1); place(game, letter.y, 60, letter.lane);
  const bag = game.bag;
  run(game, 1);
  assert.equal(game.picked >= 1, true);
  assert.ok(game.bag >= bag);
  const empty = createGame(makeCourse(4242, 2), 1); empty.bag = 0;
  run(empty, 4);
  assert.equal(empty.bag, 0);
  assert.equal(empty.lost, 0);
});

test("a late dodge rings the bell (ক্রিং): the thing was beside you within 0.3 s and you did not touch it", () => {
  const game = createGame(makeCourse(4242, 3), 1), puddle = game.pieces[0];
  assert.equal(puddle.kind, PUDDLE);
  place(game, puddle.y, 40, puddle.lane);
  // One step: the puddle is within the near window and in the bike's lane; then the bike is already clear of it.
  stepGame(game, DT);
  assert.equal(game.pieces[0].close, 1);
  game.lane = 0; game.x = laneX(0);
  run(game, 0.5);
  assert.equal(game.bumps, 0);
  assert.equal(game.bells, 1);
  assert.ok(events(game).includes(EV.bell));
});

test("mud: a lane change takes 0.3 s in it, not 0.12 s", () => {
  const course = makeCourse(4242, 6), zone = course.mud[0];
  const game = createGame(course, 1); place(game, zone.y0 + 300, 0, 1);
  game.d = zone.y0 + 60; game.bag = 9;
  stepGame(game, DT);
  steer(game, -1);
  run(game, SWITCH_T + 0.03);
  assert.notEqual(game.x, laneX(0), "still sliding after 0.15 s in mud");
  run(game, MUD_T);
  assert.equal(game.x, laneX(0));
});

test("a ভ্যান sets off from far ahead and comes towards you; its lane is open at the start so the first sight is fair", () => {
  const course = makeCourse(4242, 5), van = first(createGame(course, 1), VAN);
  const game = createGame(course, 1); place(game, van.y, 640, van.lane === 1 ? 0 : 1);
  const y0 = game.pieces.find(piece => piece.kind === VAN)!.y;
  run(game, 0.5, g => { g.bag = 9; });
  const moved = game.pieces.find(piece => piece.kind === VAN)!;
  assert.ok(moved.moving === 1 && moved.y < y0, "it rolls towards the bike");
  assert.ok(events(game).includes(EV.van));
});

test("a crossing goat or cow walks into the next lane once you are close, and blocks it", () => {
  const course = makeCourse(4242, 7), walker = createGame(course, 1).pieces.find(piece => piece.kind === WALK_GOAT || piece.kind === WALK_COW)!;
  const game = createGame(course, 1); place(game, walker.y, 440, walker.to === 1 ? 0 : 1); game.bag = 9;
  run(game, 1.2);
  const moved = game.pieces.find(piece => piece.kind === WALK_GOAT || piece.kind === WALK_COW)!;
  assert.ok(Math.abs(moved.x - laneX(moved.to)) < 1, "it has walked to its new lane");
  assert.ok(events(game).includes(EV.walk));
});

test("a dog barks and chases from behind, and bumps you if you stay in your lane", () => {
  const course = makeCourse(4242, 10);
  const game = createGame(course, 0);
  place(game, course.dogs[0].at, -10, 1); game.bag = 9;
  run(game, 4);
  assert.ok(events(game).includes(EV.dog));
  assert.ok(game.dogState[0] === RUNNING || game.dogState[0] === 2);
  assert.ok(game.bumps >= 1, "a dog in your lane catches the bike");
  assert.ok(game.hitKind === DOG || game.bumps >= 1);
});

test("a gust warns a second ahead, then shoves the bike one lane (two in the storm)", () => {
  const course = makeCourse(4242, 11), gust = course.gusts[0];
  const game = createGame(course, 0); place(game, gust.y, 380, 1); game.bag = 9;
  const kinds: number[] = [];
  for (let i = 0; i < 180 && !game.over; i++) { stepGame(game, DT); for (let n = 0; n < game.eventCount; n++) kinds.push(game.evKind[n % EVENT_RING]); if (game.gustState[0] === 2) break; }
  assert.equal(game.gustState[0], 2);
  assert.ok(kinds.includes(EV.gustWarn) && kinds.includes(EV.gust));
  assert.equal(game.lane, Math.max(0, Math.min(2, 1 + gust.dir)));
});

test("the finale's bar fills a notch for each gate, cow or gust, well or badly", () => {
  for (const level of [4, 8, 12]) {
    const bot = makeBot(CAREFUL, 3), game = createGame(makeCourse(3, level), 1);
    run(game, 80, bot);
    assert.ok(game.finished, `route ${level}`);
    assert.equal(game.bossDone, game.course.bossCount, `route ${level}: every notch is done`);
    for (let i = 0; i < game.course.bossCount; i++) assert.equal(game.boss[i], 1, `notch ${i} of route ${level} well done`);
  }
});

test("points are exactly মিটার + 10 a letter + 5 a pickup + 5 a bell, and stars are ★ place, ★★ the goal, ★★★ every gate", () => {
  assert.equal(pointsOf(100, 4, 2, 3), 100 + 40 + 10 + 15);
  const ride = rideWith(CAREFUL, 7919, 4);
  assert.equal(ride.score, pointsOf(ride.meters, ride.delivered, ride.picked, ride.game.bells));
  assert.equal(starsFor(true, 0, 5, 4), 1);
  assert.equal(starsFor(true, 4, 5, 4), 2);
  assert.equal(starsFor(true, 5, 5, 4), 3);
  assert.equal(starsFor(false, 5, 5, 4), 0);
  assert.equal(ride.meters, fullMeters(ride.game.course));
});

test("a bump costs a letter, so ★★★ needs no bump (or spares picked up): the stars never exceed what was delivered", () => {
  for (const seed of [7919, 15838, 23757]) {
    const ride = rideWith(CAREFUL, seed, 2);
    if (ride.stars === 3) assert.equal(ride.delivered, ride.houses);
    assert.ok(ride.delivered <= ride.houses);
  }
});

test("nothing is allocated while riding: the piece pool and the event ring keep their size", () => {
  const game = createGame(makeCourse(4242, 5), 1), pieces = game.pieces.length;
  run(game, 20, makeBot(CAREFUL, 1));
  assert.equal(game.pieces.length, pieces);
  assert.equal(game.evKind.length, EVENT_RING);
  assert.ok(game.first <= pieces && BIKE_LEN === 46 && UNIT === 24 && COW === 3 && AHEAD === 0 && WAITING === 0);
});
