// The rules of the screen game, in ডাং (one stick length) and seconds. Pure and seeded: the same seed gives the same field on every phone.
import { makeRng } from "../../../shared/game-core";
import { HITS, MAX_HIT } from "./result";

/** The batter's waist, where the ডাং meets the কাঠি best. */
export const SWEET_Y = 0.85;
/** The yellow band drawn around SWEET_Y. */
export const GOOD = 0.3;
/** How far above or below the waist the ডাং can still reach the কাঠি. */
export const CONTACT = 0.8;
/** Where the কাঠি hangs in front of the batter after the flick. */
export const BALL_X = 0.3;
/** A fielder catches at hand height, after a moment to react. */
export const HANDS = 0.9;
const REACH = 0.6, REACT = 0.4;
const POP_G = 8.5, FLY_G = 20, ROLL = 0.28;
export const ROLL_TIME = 0.6;
const SETTLE = 0.35;
/** The cow stops a rolling কাঠি this far either side of her middle. */
export const COW_HALF = 0.9;
/** Time scales in "ধীরে খেলো": the কাঠি floats and flies slower. */
const SLOW_POP = 0.6, SLOW_FLY = 0.75;
export const REST_TIME = 1.6;
/** Taps faster than this after the flick are a double tap, not a swing. */
const MIN_SWING = 0.12;
const MIN_SKIP = 0.4;

export type Fielder = { x: number; speed: number };
export type Field = { winds: number[]; pops: number[]; pond: { from: number; to: number }; cow: number; fielders: Fielder[] };

export function makeField(seed: number): Field {
  const rng = makeRng(seed);
  const range = (low: number, high: number) => low + rng() * (high - low);
  // The first hit is calm and floaty so the first ten seconds feel good; wind and pace rise after it.
  const winds = [range(-0.6, 0.8), range(-2, 2.5), range(-3, 3.5)];
  const pops = [range(1.95, 2.15), range(1.75, 2), range(1.55, 1.8)];
  const from = range(13, 19);
  const pond = { from, to: from + range(3, 4.5) };
  // The cow grazes past the pond, never in it.
  const cow = range(pond.to + 6, pond.to + 14);
  const fielders = [{ x: range(7, 10.5), speed: range(2, 2.8) }, { x: range(19, 24), speed: range(2.2, 2.8) }];
  return { winds, pops, pond, cow, fielders };
}

/** Height of the flicked কাঠি `t` seconds after the flick. */
export function popY(apex: number, t: number) {
  const up = Math.sqrt(2 * POP_G * apex);
  return up * t - (POP_G * t * t) / 2;
}
export const popTime = (apex: number) => (2 * Math.sqrt(2 * POP_G * apex)) / POP_G;

export type Kind = "clean" | "pond" | "cow" | "caught" | "ground" | "whiff";
export type Shot = {
  kind: Kind;
  /** Whole ডাং from the hole to where it stopped; 0 when caught or missed. */
  distance: number;
  quality: number;
  y0: number; vx: number; vy: number; wind: number;
  /** Seconds in the air (to the catch when caught). */
  flyTime: number;
  land: number;
  rest: number;
  catcher: number;
  /** Seconds from the swing until it lies still. */
  end: number;
};

const missed = (kind: Kind, y: number): Shot => ({ kind, distance: 0, quality: 0, y0: y, vx: 0, vy: 0, wind: 0, flyTime: 0, land: BALL_X, rest: BALL_X, catcher: -1, end: 0 });

/** What happens when the ডাং swings with the কাঠি at height `y`: waist height flies far, higher goes up (and gets caught), lower skims.
 *  A swing while it is still rising is too early and meets only air, so the skill is waiting for the fall. */
export function strike(field: Field, hit: number, y: number, rising = false): Shot {
  if (y <= 0) return missed("ground", 0);
  const off = y - SWEET_Y;
  if (rising || Math.abs(off) > CONTACT) return missed("whiff", y);
  const quality = 1 - (off / CONTACT) ** 2;
  const speed = 9 + 16 * quality;
  const angle = (Math.min(76, Math.max(6, 38 + (44 * off) / CONTACT)) * Math.PI) / 180;
  const vx = speed * Math.cos(angle), vy = speed * Math.sin(angle), wind = field.winds[hit];
  const xAt = (t: number) => BALL_X + vx * t + (wind * t * t) / 2;
  const base = { quality, y0: y, vx, vy, wind };
  // A lofted shot comes down through hand height; a fielder who can run there in time catches it.
  if (y + (vy * vy) / (2 * FLY_G) > HANDS) {
    const catchTime = (vy + Math.sqrt(vy * vy - 2 * FLY_G * (HANDS - y))) / FLY_G;
    const at = xAt(catchTime);
    const catcher = field.fielders.findIndex(fielder => Math.abs(at - fielder.x) <= REACH + fielder.speed * Math.max(0, catchTime - REACT));
    if (catcher >= 0) return { ...base, kind: "caught", distance: 0, flyTime: catchTime, land: at, rest: at, catcher, end: catchTime + SETTLE };
  }
  const flyTime = (vy + Math.sqrt(vy * vy + 2 * FLY_G * y)) / FLY_G;
  const land = xAt(flyTime);
  const landVx = vx + wind * flyTime, landVy = vy - FLY_G * flyTime;
  // Flat landings skid on; steep ones stop dead.
  let rest = land + Math.max(0, landVx) * ROLL * (landVx * landVx) / (landVx * landVx + landVy * landVy);
  let kind: Kind = "clean";
  const { pond, cow } = field;
  if (land >= pond.from && land <= pond.to) { kind = "pond"; rest = pond.from; }
  else if (land < pond.from && rest > pond.from) rest = pond.from;
  else if (Math.abs(land - cow) <= COW_HALF) { kind = "cow"; rest = land; }
  else if (land < cow - COW_HALF && rest > cow - COW_HALF) { kind = "cow"; rest = cow - COW_HALF; }
  const distance = Math.min(MAX_HIT, Math.max(0, Math.floor(rest)));
  return { ...base, kind, distance, flyTime, land, rest, catcher: -1, end: flyTime + (rest - land > 0.05 ? ROLL_TIME : 0) + SETTLE };
}

/** Where the struck কাঠি is `t` seconds after the swing (flight, then the roll). Writes into `out` so the draw loop allocates nothing. */
export function ballAt(shot: Shot, t: number, out: { x: number; y: number }) {
  // A missed swing leaves the কাঠি to finish its fall (vy holds its speed at the swing); a late one already lies there.
  if (shot.kind === "whiff") { out.x = BALL_X; out.y = Math.max(0.03, shot.y0 + shot.vy * t - (POP_G * t * t) / 2); return out; }
  if (shot.kind === "ground") { out.x = BALL_X; out.y = 0.03; return out; }
  if (t < shot.flyTime) {
    out.x = BALL_X + shot.vx * t + (shot.wind * t * t) / 2;
    out.y = Math.max(0, shot.y0 + shot.vy * t - (FLY_G * t * t) / 2);
    return out;
  }
  if (shot.kind === "caught") { out.x = shot.land; out.y = HANDS; return out; }
  // In the pond it sinks where it fell; the ডাং are still counted to the near bank.
  if (shot.kind === "pond") { out.x = shot.land; out.y = -0.2; return out; }
  const u = Math.min(1, (t - shot.flyTime) / ROLL_TIME);
  out.x = shot.land + (shot.rest - shot.land) * (1 - (1 - u) * (1 - u));
  out.y = 0;
  return out;
}

export type Phase = "aim" | "pop" | "fly" | "rest" | "over";
export type Game = { seed: number; field: Field; hit: number; phase: Phase; t: number; shots: Shot[] };

export const newGame = (seed: number): Game => ({ seed, field: makeField(seed), hit: 0, phase: "aim", t: 0, shots: [] });

function next(game: Game) {
  game.t = 0;
  if (game.hit + 1 >= HITS) { game.phase = "over"; return; }
  game.hit += 1;
  game.phase = "aim";
}

/** One tap: flick, swing, or skip the wait after a landing. Returns false when the tap does nothing. Mutates `game`. */
export function tap(game: Game) {
  if (game.phase === "aim") { game.phase = "pop"; game.t = 0; return true; }
  if (game.phase === "pop") {
    if (game.t < MIN_SWING) return false;
    const apex = game.field.pops[game.hit];
    const shot = strike(game.field, game.hit, popY(apex, game.t), game.t < popTime(apex) / 2);
    if (shot.kind === "whiff") shot.vy = Math.sqrt(2 * POP_G * apex) - POP_G * game.t;
    game.shots[game.hit] = shot;
    game.phase = shot.kind === "whiff" ? "rest" : "fly";
    game.t = 0;
    return true;
  }
  if (game.phase === "rest" && game.t >= MIN_SKIP) { next(game); return true; }
  return false;
}

/** Advances the game by `dt` real seconds. Mutates `game` (no allocation except when a hit ends). */
export function step(game: Game, dt: number, slow: boolean) {
  if (game.phase === "over" || game.phase === "aim") return;
  if (game.phase === "pop") {
    game.t += dt * (slow ? SLOW_POP : 1);
    if (game.t >= popTime(game.field.pops[game.hit])) { game.shots[game.hit] = strike(game.field, game.hit, 0); game.phase = "rest"; game.t = 0; }
    return;
  }
  if (game.phase === "fly") {
    game.t += dt * (slow ? SLOW_FLY : 1);
    if (game.t >= game.shots[game.hit].end) { game.phase = "rest"; game.t = 0; }
    return;
  }
  game.t += dt;
  if (game.t >= REST_TIME) next(game);
}

export const totalOf = (shots: readonly Shot[]) => shots.reduce((sum, shot) => sum + shot.distance, 0);
/** How a hit travels in a link: its ডাং, "c" for caught, "m" for a miss. */
export const tokenOf = (shot: Shot) => shot.kind === "caught" ? "c" : shot.kind === "ground" || shot.kind === "whiff" ? "m" : String(shot.distance);
