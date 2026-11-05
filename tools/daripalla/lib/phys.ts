// The balance's moving parts as plain numbers, made once per game (the hot file scale.hot.ts only mutates them).
export type Phys = {
  /** Beam angle (degrees, positive lowers the right pan) and its speed. */
  a: number; v: number;
  /** Pan sway angles (degrees) and speeds: [left, right]. */
  sway: Float64Array; swayV: Float64Array;
  /** Pan dip (px, positive is down) and speeds: [left, right]. */
  dip: Float64Array; dipV: Float64Array;
  /** A landing still in the air: ms to go, which pan, how hard. */
  landT: number; landSide: number; landForce: number;
  /** True once everything has stopped, so the page can skip drawing. */
  rest: boolean;
};

export const newPhys = (): Phys => ({
  a: 0, v: 0, sway: new Float64Array(2), swayV: new Float64Array(2), dip: new Float64Array(2), dipV: new Float64Array(2),
  landT: 0, landSide: 1, landForce: 0, rest: true,
});

