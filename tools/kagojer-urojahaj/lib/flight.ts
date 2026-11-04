// One flight's state, made once per run; step.hot.ts mutates it 60 times a second without allocating.
import { METER, THROW_PITCH, THROW_SPEED, scoreOf, starsFor, type Course } from "./physics";

/** What happened, for sound and juice: the component drains the ring after each step. */
export const EV = { candy: 1, crash: 2, land: 3, bump: 4, stall: 5, rethrow: 6, wind: 7, beat: 8, warn: 9, checkpoint: 10 } as const;
/** Why a page came down. */
export const CRASH = { floor: 0, street: 1, water: 2, solid: 3, string: 4, bird: 5, fan: 6, pad: 7 } as const;
export const FLYING = 0, DOWN = 1, LANDED = 2;
export const EVENT_RING = 16;

export type Game = {
  course: Course;
  /** Pages for this flight and how many are left (the one in the air counts). */
  pages: number; left: number;
  t: number; x: number; y: number; prevY: number; v: number; a: number; stalled: boolean; hold: boolean;
  state: number; downAt: number; downKind: number; downX: number; downY: number;
  /** 0 flying, 1 landed, 2 out of pages. */
  over: 0 | 1 | 2;
  /** Per candy: 0 waiting, 1 taken, 2 passed by. */
  taken: Uint8Array; candies: number; streak: number; bestStreak: number;
  maxX: number; crashes: number; landing: 0 | 1 | 2; landX: number; touchX: number; landT: number; slide: number;
  checkpoint: number; beatsHeard: number; warned: number;
  /** The air pushing the plane right now, and which kind of wind it is (-1 none): for streaks, sound and the edge. */
  wx: number; wy: number; windArt: number; wet: number;
  /** 0..1 and which edge: 0 none, 1 bottom, 2 ahead, 3 top. */
  danger: number; dangerEdge: number;
  airTime: number; highest: number; bumpAt: number;
  /** Probe the line ahead for the edge warning each step (the screen needs it; a headless pilot's trial copies don't). */
  probe: boolean;
  evKind: Uint8Array; evX: Float32Array; evY: Float32Array; evN: Int16Array; eventCount: number;
};

export function createGame(course: Course, pages: number): Game {
  return {
    course, pages, left: pages,
    t: 0, x: course.startX, y: course.startY, prevY: course.startY, v: THROW_SPEED, a: THROW_PITCH, stalled: false, hold: false,
    state: 0, downAt: 0, downKind: 0, downX: 0, downY: 0, over: 0,
    taken: new Uint8Array(course.candyCount), candies: 0, streak: 0, bestStreak: 0,
    maxX: 0, crashes: 0, landing: 0, landX: 0, touchX: 0, landT: 0, slide: 0,
    checkpoint: 0, beatsHeard: 0, warned: 0,
    wx: 0, wy: 0, windArt: -1, wet: 0, danger: 0, dangerEdge: 0,
    airTime: 0, highest: course.startY, bumpAt: -9, probe: true,
    evKind: new Uint8Array(EVENT_RING), evX: new Float32Array(EVENT_RING), evY: new Float32Array(EVENT_RING), evN: new Int16Array(EVENT_RING), eventCount: 0,
  };
}

/** মিটার flown: the whole flight once landed, else the furthest the plane got (never past the landing place's middle). */
export const metersOf = (game: Game) => (game.landing ? game.course.meters : Math.min(game.course.meters, Math.max(0, Math.floor(game.maxX / METER))));
export const pointsOf = (game: Game) => scoreOf(game.candies, metersOf(game), game.landing);
export const starsOf = (game: Game) => starsFor(game.landing, game.candies, game.course.goal);
/** How far along the flight is, 0..1, for the line along the top edge. */
export const progressOf = (game: Game) => Math.max(0, Math.min(1, game.maxX / Math.max(1, (game.course.pad.x0 + game.course.pad.x1) / 2)));
