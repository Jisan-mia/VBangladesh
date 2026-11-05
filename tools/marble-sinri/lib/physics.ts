// The marble's world: board units, the feel of a heavy glass marble, and the ledge shape every module shares.
// World coordinates: ledges never move; the camera rises at the stairs' speed (screen y = world y - cam).
// Pure and allocation-light: step.hot.ts reads these numbers 60 times a second.

/** The board: 360 wide, 600 tall. The awning strip is the top TOP units; falling below H loses a chance. */
export const W = 360, H = 600, R = 11, TOP = 20, GAP = 90, LEDGE = 12, FIRST_Y = 190;
/** Rolling: top speed, how hard a held side pushes on a ledge and in the air, grip when you let go, and the air's drag. */
export const VX = 190, ACCEL = 1150, AIR_ACCEL = 750, GRIP = 950, AIR_DRAG = 60, FAST = 260;
/** Grip on a mopped step and on smooth metal or round bamboo; the pull of a slope and of a pole's crown. */
export const WET_GRIP = 110, SLICK_GRIP = 60, POLE_GRIP = 20, SLOPE_PULL = 1050, CROWN_PUSH = 450;
/** Gravity and the fastest fall. */
export const G = 1500, VMAX = 620;
/** A landing scrubs off part of the sideways speed (the glass bites the ledge). */
export const LANDING_GRIP = 0.6;
/** A cactus pot's width; the marble is hurt within CLEAR of its centre. A landing spot needs SAFE of clear ledge. */
export const POT = 22, CLEAR = 18, SAFE = 34;
/** A gust's push in the air, a cracked step's second, and how much faster a surge makes the stairs rise. */
export const WIND = 420, CRACK = 1.0, SURGE = 1.25;
export const STEP = 1 / 60;
/** The camera keeps the marble no lower than this share of the board. */
export const FOLLOW = 0.45;
export const REFILL = 5, RESPAWN = 0.7;

/** What a ledge is made of: it picks the art and the grip. */
export const PARAPET = 0, CONCRETE = 1, PLANK = 2, RAIL = 3, POLE = 4, LANDING = 5, ALLEY = 6;

export type Ledge = {
  row: number; x0: number; x1: number;
  /** World y of the top surface at the ledge's centre. */
  y: number;
  kind: number;
  /** How fast the stairs rise once the marble is on this row (units a second). */
  speed: number;
  /** A cactus pot's centre, or -1. A small marble to pick up, or -1. */
  pot: number; pick: number; picked: boolean;
  /** Mopped (slides), the slope (y per x, positive = the right end is lower), a round pole (won't sit still). */
  wet: boolean; tilt: number; round: boolean;
  /** A cracked step: seconds until it falls once landed on (-1: not started), and when it fell. */
  crack: boolean; crackT: number; gone: boolean; goneAt: number;
  /** -1 or 1: the drop off this ledge drifts that way; 0 for still air. */
  gust: number;
  /** A gap in the plank: the marble drops through between h0 and h1 (NaN for none). */
  h0: number; h1: number;
  /** The floor's last landing: reaching it ends the floor. */
  floor: boolean;
};

export function makeLedge(row: number, x0: number, x1: number, y: number, kind: number, speed: number): Ledge {
  return {
    row, x0, x1, y, kind, speed, pot: -1, pick: -1, picked: false, wet: false, tilt: 0, round: false,
    crack: false, crackT: -1, gone: false, goneAt: 0, gust: 0, h0: NaN, h1: NaN, floor: false,
  };
}

/** The surface's height under x: a slope tilts about the ledge's centre. */
export const surfaceY = (ledge: Ledge, x: number) => ledge.y + ledge.tilt * (x - (ledge.x0 + ledge.x1) / 2);
export const inHole = (ledge: Ledge, x: number) => x > ledge.h0 && x < ledge.h1;
/** The marble stands on the ledge at x (over solid plank, not in a gap). */
export const over = (ledge: Ledge, x: number) => !ledge.gone && x >= ledge.x0 && x <= ledge.x1 && !inHole(ledge, x);
export const onPot = (ledge: Ledge, x: number) => ledge.pot >= 0 && Math.abs(x - ledge.pot) < CLEAR;

/** Grip when no side is held: mopped steps slide, rails and round poles barely hold. */
export const gripOf = (ledge: Ledge) => ledge.wet ? WET_GRIP : ledge.round ? POLE_GRIP : ledge.kind === RAIL ? SLICK_GRIP : GRIP;
/** The surface's own push on the marble: downhill on a slope, away from the crown on a round pole. */
export function surfacePush(ledge: Ledge, x: number) {
  if (ledge.round) { const half = (ledge.x1 - ledge.x0) / 2; return CROWN_PUSH * (x - (ledge.x0 + ledge.x1) / 2) / half; }
  return ledge.tilt * SLOPE_PULL;
}

/** The safe stretches of a ledge (clear of the pot and the gap), as [x0, x1] pairs written into `out`. Returns how many. */
export function pieces(ledge: Ledge, out: Float64Array) {
  let count = 0;
  const add = (a: number, b: number) => { if (b > a) { out[count * 2] = a; out[count * 2 + 1] = b; count++; } };
  if (ledge.pot >= 0) { add(ledge.x0, ledge.pot - CLEAR); add(ledge.pot + CLEAR, ledge.x1); }
  else if (!Number.isNaN(ledge.h0)) { add(ledge.x0, ledge.h0); add(ledge.h1, ledge.x1); }
  else add(ledge.x0, ledge.x1);
  return count;
}
const scratch = new Float64Array(8);
/** The centre of the widest safe stretch at least SAFE wide, or NaN. */
export function safeCentre(ledge: Ledge) {
  const count = pieces(ledge, scratch);
  let best = NaN, width = SAFE - 1e-9;
  for (let index = 0; index < count; index++) {
    const a = scratch[index * 2], b = scratch[index * 2 + 1];
    if (b - a > width) { width = b - a; best = (a + b) / 2; }
  }
  return best;
}
export const landable = (ledge: Ledge) => !Number.isNaN(safeCentre(ledge));

/** How the marble moves: the new floors have weight; an old link's endless stairs keep the old instant roll. */
export type Feel = { instant: boolean };
export const WEIGHTY: Feel = { instant: false };
export const INSTANT: Feel = { instant: true };
