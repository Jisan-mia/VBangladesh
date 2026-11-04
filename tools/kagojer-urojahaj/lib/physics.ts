// The flight model, in world units (u): x runs forward, y up from the floor (or the street, or the river), 50 u to a মিটার.
// Pure and allocation-free to read: step.hot.ts runs it 60 times a second, the bots and the solver run the same numbers.
// The plane flies along its pitch `a` at airspeed `v`: holding pulls the nose up (it climbs and slows), letting go lets it
// dive (fast and steep). The longest glide is in between, feathered near 85 u/s; too slow and it stalls and drops.

/** Gravity along the path, parasitic drag (∝ v²), a constant paper drag, induced drag (∝ 1/v²). */
export const G = 110, DRAG = 0.00125, PAPER = 3, INDUCED = 60000;
/** Pitch the nose eases to while held, and while let go (radians). */
export const PITCH_UP = 0.42, PITCH_DOWN = -0.32;
/** How fast the nose turns (rad/s, slower when slow) and how softly it settles. */
export const TURN = 2.4, EASE = 7;
/** Below STALL the nose drops hard and the plane sinks; it flies again above RECOVER. */
export const STALL = 52, RECOVER = 74, STALL_PITCH = -0.75, STALL_SINK = 30;
export const MIN_SPEED = 20;
/** The throw, and a fresh page thrown again from a checkpoint. */
export const THROW_SPEED = 240, THROW_PITCH = 0.14, RETHROW_SPEED = 190, RETHROW_PITCH = 0.08;
/** The plane is a small circle for collisions (drawn 28 u long, so a graze never counts). */
export const PLANE_R = 5;
export const CANDY_R = 15;
/** The world is 600 u tall; above SKY_CAP the air pushes gently down (open sky has no ceiling). */
export const WORLD_H = 600, SKY_CAP = 560;
export const METER = 50;
/** A crash waits this long before the next page is thrown (it crumples, a hand folds a new one). */
export const DOWN_TIME = 1.1;
export const STEP = 1 / 60;

/** What lies under the plane: a classroom floor, the street between roofs, or the river. */
export const FLOOR = 0, STREET = 1, WATER = 2;

/** Rect art kinds (the rules treat them all as solid). */
export const A = { bench: 0, shelf: 1, roof: 2, tank: 3, hull: 4, chhoi: 5, ghat: 6, wall: 7, fan: 8, rod: 9 } as const;
/** Wind art kinds: how the streaks look. */
export const WIND = { fan: 0, warm: 1, gust: 2, rain: 3, bell: 4 } as const;

export const RECT = 5;       // x0 y0 x1 y1 art
export const WINDF = 10;     // x0 y0 x1 y1 wx wy period on phase art
export const STRING = 8;     // kiteX kiteY tailLength lean swayAmp swayFreq phase art (a cut kite, its string hanging below)
export const BIRD = 7;       // cx cy ampX ampY freq phase art
export const BIRD_R = 9, KITE_R = 11, STRING_R = 2.2;

export type Pad = {
  /** The landing place's top, its ends at the start, and the bullseye's half width round its centre. */
  x0: number; x1: number; y: number; bull: number;
  /** How deep its body is (a desk, a roof, a boat). The last ferry moves `step` forward on each horn (every `every` seconds), never past `max`. */
  depth: number; step: number; every: number; max: number; art: number;
};

export type Course = {
  seed: number; level: number; world: number;
  /** Where the room ends (a wall in the classroom), the ceiling (Infinity outdoors) and what the floor is. */
  length: number; ceiling: number; floor: number;
  startX: number; startY: number;
  rects: Float32Array; rectCount: number;
  winds: Float32Array; windCount: number;
  strings: Float32Array; stringCount: number;
  birds: Float32Array; birdCount: number;
  candies: Float32Array; candyCount: number;
  checkpoints: Float32Array; checkpointCount: number;
  /** Finale beats (bells, kite dives, the ferry's horn): times in seconds, telegraphed a second ahead. */
  beats: Float32Array;
  pad: Pad;
  /** Candies for the second star, and the whole flight in মিটার. */
  goal: number; meters: number;
};

export const clamp = (value: number, low: number, high: number) => (value < low ? low : value > high ? high : value);

/** The landing place's left end at time t: it only moves on the last ferry, easing forward for 2 s after each horn. */
export function padX(pad: Pad, t: number) {
  if (!pad.step || t < pad.every) return pad.x0;
  const horns = Math.floor(t / pad.every), since = t - horns * pad.every, ease = since >= 2 ? 1 : since / 2;
  const moved = pad.step * (horns - 1 + ease * ease * (3 - 2 * ease));
  return pad.x0 + (moved > pad.max ? pad.max : moved);
}

/** Points for a flight: 10 a candy, a মিটার a point, 50 for landing, 50 more on the bullseye. Links are checked by this. */
export const scoreOf = (candies: number, meters: number, landing: number) => 10 * candies + meters + (landing >= 1 ? 50 : 0) + (landing === 2 ? 50 : 0);
/** ★ for landing, ★ for enough candies, ★ for the bullseye; none without a landing. */
export const starsFor = (landing: number, candies: number, goal: number) => (landing ? 1 + (candies >= goal ? 1 : 0) + (landing === 2 ? 1 : 0) : 0);
