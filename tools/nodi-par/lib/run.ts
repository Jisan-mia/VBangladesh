// One crossing as plain data: where the boy is, the clock, what he has picked up and how it has gone. step.hot.ts moves it.
import { START_X, ferryMask, type River } from "./river";
import { modeOf, DEFAULT_MODE } from "./levels";

export type Run = {
  river: River; t: number; row: number; x: number;
  /** The hop being drawn: from where, and how long is left. */
  fromRow: number; fromX: number; hop: number; queued: number; falling: boolean;
  /** Time left in the water before the boy is back on `safeRow`. */
  down: number; safeRow: number; safeX: number;
  splashes: number; taken: number; got: number;
  /** Quick hops in a row (each under 0.75 s after the last), for the rising hop sound; the best streak and every hop made. */
  chain: number; lastHop: number; surface: number; bestChain: number; hops: number;
  done: boolean; time: number; events: number;
  splashRow: number; splashX: number; ferryOn: number;
  /** The foot (see MODES): how far past an end still holds you, and seconds in the water. */
  grip: number; respawn: number; mode: number;
  /** Danger, 0..1: the screen edge the current is carrying you to (side −1 left, 1 right), and a sinking কচুরিপানা under your feet. */
  edge: number; edgeSide: number; sink: number;
};

export function createRun(river: River, mode = DEFAULT_MODE): Run {
  const foot = modeOf(mode);
  return {
    river, t: 0, row: 0, x: START_X, fromRow: 0, fromX: START_X, hop: 0, queued: 0, falling: false, down: 0, safeRow: 0, safeX: START_X,
    splashes: 0, taken: 0, got: 0, chain: 0, lastHop: -9, surface: 0, bestChain: 0, hops: 0, done: false, time: 0, events: 0,
    splashRow: 0, splashX: START_X, ferryOn: ferryMask(river, 0), grip: foot.grip, respawn: foot.respawn, mode: Math.round(mode),
    edge: 0, edgeSide: 0, sink: 0,
  };
}
