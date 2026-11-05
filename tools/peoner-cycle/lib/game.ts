// One ride's state, made once per ride from a course (not hot): every piece copied into a mutable pool, typed arrays
// for the gates, dogs, gusts and the finale bar, and a ring of events for the scene and the sounds. lib/step.hot.ts
// moves it 60 times a second without allocating. Also the rules that read a finished ride: points, stars, the near miss.
import { laneX, LANES, UNIT } from "./geometry";
import { MODES } from "./levels";
import type { Course, Thing } from "./course";

/** Piece states. */
export const AHEAD = 0, PASSED = 1, HIT = 2, TAKEN = 3;
/** Gate states. */
export const WAITING = 0, DELIVERED = 1, MISSED = 2;
/** Dog states. */
export const DORMANT = 0, RUNNING = 1, GONE = 2;

/** What happened, for the scene's juice and the sounds. `n` carries a detail (the kind bumped, the gate, the streak). */
export const EV = {
  deliver: 1, miss: 2, pick: 3, bell: 4, bump: 5, wreck: 6, finish: 7, van: 8, walk: 9, dog: 10, gustWarn: 11, gust: 12, mud: 13, notch: 14,
} as const;
export const EVENT_RING = 32;

export type Piece = Thing & {
  /** Where it stood at the start (the scan order), whether it has set off, and the bell flag for a late dodge. */
  y0: number; moving: number; state: number; close: number;
  /** Its place on the finale bar, or -1. */
  bossAt: number;
};

export type Game = {
  course: Course;
  /** Bumps this mode survives: the ride ends on the bump that reaches it. */
  limit: number;
  pieces: Piece[]; first: number;
  houseState: Uint8Array; houseBoss: Int8Array; houseNext: number;
  dogY: Float32Array; dogX: Float32Array; dogState: Uint8Array;
  gustState: Uint8Array; gustBoss: Int8Array;
  mudNext: number; inMud: number;
  /** Distance ridden (the front wheel's world position), game seconds, current speed, the slow-down left after a bump. */
  d: number; t: number; v: number; recover: number;
  /** The bike's x and the lane it heads for; `push` is a gust's shove still under way (seconds). */
  x: number; lane: number; push: number;
  /** Letters in the ঝোলা, delivered, picked off the road, lost in bumps. */
  bag: number; delivered: number; picked: number; lost: number;
  bells: number; bumps: number; streak: number; bestStreak: number;
  meters: number; score: number;
  finished: number; wrecked: number; over: number; hitKind: number;
  /** The finale bar: 0 to come, 1 done well, 2 missed or hit. */
  boss: Uint8Array; bossDone: number;
  evKind: Uint8Array; evX: Float32Array; evY: Float32Array; evN: Int16Array; eventCount: number;
};

export function createGame(course: Course, mode = 1): Game {
  let bossAt = 0;
  const houseBoss = new Int8Array(course.houses.length).fill(-1);
  course.houses.forEach((house, index) => { if (house.boss) houseBoss[index] = bossAt++; });
  const pieces: Piece[] = course.things.map(thing => ({ ...thing, y0: thing.y, moving: 0, state: AHEAD, close: 0, bossAt: thing.boss ? bossAt++ : -1 }));
  const gustBoss = new Int8Array(course.gusts.length).fill(-1);
  course.gusts.forEach((gust, index) => { if (gust.boss) gustBoss[index] = bossAt++; });
  return {
    course, limit: MODES[Math.max(0, Math.min(MODES.length - 1, mode))].limit,
    pieces, first: 0,
    houseState: new Uint8Array(course.houses.length), houseBoss, houseNext: 0,
    dogY: new Float32Array(course.dogs.length), dogX: new Float32Array(course.dogs.length), dogState: new Uint8Array(course.dogs.length),
    gustState: new Uint8Array(course.gusts.length), gustBoss,
    mudNext: 0, inMud: 0,
    d: 0, t: 0, v: course.spec.speed[0], recover: 0,
    x: laneX(1), lane: 1, push: 0,
    bag: course.houses.length, delivered: 0, picked: 0, lost: 0,
    bells: 0, bumps: 0, streak: 0, bestStreak: 0, meters: 0, score: 0,
    finished: 0, wrecked: 0, over: 0, hitKind: -1,
    boss: new Uint8Array(Math.max(1, bossAt)), bossDone: 0,
    evKind: new Uint8Array(EVENT_RING), evX: new Float32Array(EVENT_RING), evY: new Float32Array(EVENT_RING), evN: new Int16Array(EVENT_RING), eventCount: 0,
  };
}

/** A tap on the left (-1) or right (+1): head one lane over. Two quick taps cross two lanes. */
export function steer(game: Game, towards: number) {
  if (!game.over) game.lane = Math.max(0, Math.min(LANES - 1, game.lane + towards));
}

export const LETTER_POINTS = 10, PICK_POINTS = 5, BELL_POINTS = 5;
export const pointsOf = (meters: number, delivered: number, picked: number, bells: number) =>
  meters + LETTER_POINTS * delivered + PICK_POINTS * picked + BELL_POINTS * bells;
export const fullMeters = (course: Course) => Math.floor(course.end / UNIT);

/** Reached the place ★; the goal's deliveries ★★; every gate ★★★. Nothing if the bike stopped short. */
export function starsFor(finished: boolean, delivered: number, houses: number, goal: number) {
  if (!finished) return 0;
  return delivered >= houses ? 3 : delivered >= goal ? 2 : 1;
}
export const starsOf = (game: Game) => starsFor(Boolean(game.finished), game.delivered, game.course.houses.length, game.course.spec.goal);
