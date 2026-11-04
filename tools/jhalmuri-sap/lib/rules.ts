// The rules' constants and small types, shared by the set-up (game.ts), the per-move step (step.hot.ts), links and tests.
import { COLS } from "./levels";

/** 0 up, 1 right, 2 down, 3 left: clockwise, so +1 is a right turn and +2 is a U-turn. */
export type Dir = 0 | 1 | 2 | 3;
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

export type Kind = "muri" | "chanachur" | "peyaj" | "morich" | "tetul";
export const FOODS: readonly Kind[] = ["muri", "chanachur", "peyaj", "morich", "tetul"];

export const POINTS = 10;
export const BONUS_POINTS = 30;
/** A golden chilli turns up after every 4th food and stays for 45 moves. */
export const BONUS_EVERY = 4;
export const BONUS_LIFE = 45;
/** The classic game speeds up every 5 bites. */
export const LEVEL_EVERY = 5;
/** Bites closer together than this (in moves) keep the combo going. */
export const COMBO_MOVES = 16;
/** A green chilli's burst, in moves; tamarind's cut, in cells; the shortest a snake gets. */
export const HOT_MOVES = 10;
export const SOUR_CUT = 2;
export const MIN_LENGTH = 3;
export const QUEUE = 3;
export const MAX_CROWS = 2;

export const cellOf = (x: number, y: number) => y * COLS + x;
export const START: readonly number[] = [cellOf(5, 11), cellOf(5, 12), cellOf(5, 13)];

export type StepEvent = "move" | "eat" | "bonus" | "pipe" | "crash" | "win" | "none";
/** What the snake ran into, for the card line and the sound. */
export type Crash = "" | "fence" | "tin" | "tail" | "crow" | "gate";

