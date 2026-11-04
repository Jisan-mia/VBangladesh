// One run's state, made once per storm. step.hot.ts mutates it 60 times a second without allocating.
import { W, type Drop } from "./physics";
import type { Storm } from "./gen";

export const EVENT_RING = 8;
export const PILE_MAX = 256;

export type GameEvent = {
  kind: number; x: number; t: number;
  /** A mango caught, or a hazard that hit the ডালা. */
  caught: boolean;
  streak: number;
  /** The kind of mango hail knocked out of the ডালা, or -1. */
  lost: number;
};

export type Game = {
  storm: Storm; drops: Drop[];
  t: number; basket: number; score: number; caught: number; ripe: number; gold: number; lives: number; hearts: number;
  /** Mangoes caught in a row (a missed mango or a hit breaks it), and the longest run this storm. */
  streak: number; bestStreak: number;
  missed: number; hits: number; knocked: number;
  /** 0 playing, 1 the storm passed, 2 out of জান. */
  over: 0 | 1 | 2;
  /** The next drop to settle, the caught mangoes in order (the top is the last), and a ring of recent events for sound and juice. */
  next: number; pile: Uint8Array; pileCount: number;
  events: GameEvent[]; eventCount: number;
};

export function createGame(storm: Storm, hearts: number): Game {
  // Drops carry their state, so each run gets its own copy and the storm itself stays as made.
  const drops = storm.drops.map(drop => ({ ...drop }));
  return {
    storm, drops, t: 0, basket: W / 2, score: 0, caught: 0, ripe: 0, gold: 0, lives: hearts, hearts,
    streak: 0, bestStreak: 0, missed: 0, hits: 0, knocked: 0, over: 0, next: 0,
    pile: new Uint8Array(PILE_MAX), pileCount: 0,
    events: Array.from({ length: EVENT_RING }, () => ({ kind: 0, x: 0, t: 0, caught: false, streak: 0, lost: -1 })), eventCount: 0,
  };
}

/** Stars for a finished run: none when the জান ran out or the mangoes fell short of the pass mark. */
export function starsOf(game: Game) {
  const { storm } = game;
  if (game.over !== 1 || game.caught < storm.pass) return 0;
  return game.caught >= storm.three ? 3 : game.caught >= storm.two ? 2 : 1;
}
