// The toy in the hand, as numbers: five springs (across, down, lean, size, flip), allocated once per toy at setup.
// The per-frame step lives in components/body.hot.ts and only mutates these arrays.
export const X = 0, Y = 1, ROT = 2, SCALE = 3, FLIP = 4, CHANNELS = 5;
/** What the toy is doing: nothing, following the finger, springing into its shadow, springing home, or flying to a tapped shadow. */
export const REST = 0, FOLLOW = 1, LAND = 2, HOME = 3, FLY = 4;

export type Body = {
  pos: Float64Array; vel: Float64Array; goal: Float64Array; stiff: Float64Array; damp: Float64Array;
  mode: number;
  /** Set to 1 by the step when a FLY toy has arrived near its goal; the caller reads it and clears it. */
  arrived: number;
};

export function makeBody(): Body {
  const body: Body = { pos: new Float64Array(CHANNELS), vel: new Float64Array(CHANNELS), goal: new Float64Array(CHANNELS), stiff: new Float64Array(CHANNELS), damp: new Float64Array(CHANNELS), mode: REST, arrived: 0 };
  body.pos[SCALE] = 1; body.goal[SCALE] = 1;
  setMode(body, REST, false);
  return body;
}

// Spring tunings as [stiffness, damping ratio]. Under 1 the toy overshoots a little and settles: weight. `calm` (ধীরে খেলো) uses
// the critical damping of 1, so it glides in and stops.
const TUNING: readonly (readonly [number, number])[] = [[420, 0.8], [520, 0.78], [360, 0.5], [420, 0.62], [300, 0.85]];

/** Switch the springs to a mode's feel. Position and speed carry over, so a switch mid-flight never jumps. */
export function setMode(body: Body, mode: number, calm: boolean) {
  const [stiff, ratio] = TUNING[mode] ?? TUNING[REST];
  const k = calm ? Math.max(stiff, 460) : stiff, zeta = calm ? 1 : ratio;
  for (let channel = 0; channel < CHANNELS; channel++) { body.stiff[channel] = k; body.damp[channel] = 2 * zeta * Math.sqrt(k); }
  body.mode = mode; body.arrived = 0;
}

/** Put the toy at a place with no motion (a new wall, or a resize). */
export function jump(body: Body, x: number, y: number, rot: number, scale: number, flip: number) {
  body.pos[X] = body.goal[X] = x; body.pos[Y] = body.goal[Y] = y; body.pos[ROT] = body.goal[ROT] = rot; body.pos[SCALE] = body.goal[SCALE] = scale; body.pos[FLIP] = body.goal[FLIP] = flip;
  body.vel.fill(0);
}
