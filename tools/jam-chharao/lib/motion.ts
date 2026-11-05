// Setup for the hot motion code (made once, mutated in place by motion.hot.ts and draw.hot.ts): where each vehicle is shown,
// the one finger on the street, and how heavy each kind of vehicle feels.
import { COLS, MAX_CARS, ROWS, type Kind, type Layout } from "./board";

export type Motion = {
  n: number;
  /** Where each vehicle is shown, in cells along its lane (the top row or left column). */
  x: Float32Array;
  v: Float32Array;
  /** Where it is heading. */
  t: Float32Array;
  /** Heavier follows the finger later and lands with a slower wobble. */
  mass: Float32Array;
  /** Seconds before it starts to move (the stagger of cars driving in). */
  wait: Float32Array;
  /** 0..1: held up off the road under a finger. */
  lift: Float32Array;
};

export type Drag = {
  /** The pointer's id, or -1 when nothing is held. */
  id: number;
  car: number;
  /** 1 when the car slides up and down. */
  down: number;
  x0: number; y0: number;
  /** Where the car was shown when the finger came down, and where the finger would put it (before the road stops it). */
  from: number; want: number;
  low: number; high: number;
  /** Farthest the finger has gone from where it came down, in CSS px. */
  moved: number;
  speed: number; lastWant: number; lastT: number;
  /** 1 once this push has already hit something (so the bump sounds once). */
  bumped: number;
};

export const makeMotion = (): Motion => ({
  n: 0,
  x: new Float32Array(MAX_CARS), v: new Float32Array(MAX_CARS), t: new Float32Array(MAX_CARS),
  mass: new Float32Array(MAX_CARS), wait: new Float32Array(MAX_CARS), lift: new Float32Array(MAX_CARS),
});
export const makeDrag = (): Drag => ({ id: -1, car: -1, down: 0, x0: 0, y0: 0, from: 0, want: 0, low: 0, high: 0, moved: 0, speed: 0, lastWant: 0, lastT: 0, bumped: 0 });

const MASS: Record<Kind, number> = { cng: 1, cng2: 1, rickshaw: 0.8, van: 1.1, bus: 1.8, truck: 2.3 };
export const massOf = (kind: Kind) => MASS[kind];

/** A jam's vehicles at rest in their places (nothing moving). */
export function settle(m: Motion, lay: Layout, pos: readonly number[]) {
  m.n = lay.cars.length;
  for (let i = 0; i < MAX_CARS; i++) {
    m.v[i] = 0; m.wait[i] = 0; m.lift[i] = 0;
    m.x[i] = m.t[i] = i < m.n ? pos[i] : 0;
    m.mass[i] = i < m.n ? massOf(lay.cars[i].kind) : 1;
  }
}

/** The jam builds up: every vehicle starts off the street, on the near edge of its lane, and drives in one after another. */
export function arrive(m: Motion, lay: Layout, pos: readonly number[]) {
  settle(m, lay, pos);
  for (let i = 0; i < m.n; i++) {
    const car = lay.cars[i], length = car.down ? ROWS : COLS;
    const fromStart = pos[i] + car.len / 2 < length / 2;
    m.x[i] = fromStart ? -car.len - 0.4 : length + 0.4;
    m.wait[i] = (i % 5) * 0.05 + Math.floor(i / 5) * 0.03;
  }
}
