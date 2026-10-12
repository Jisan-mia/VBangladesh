// The rally rules, pure and steppable without a screen: the shuttle's flight, the timing window, the bot's returns and the score.
// Side view of the গলি: you on the left, the opponent on the right, the net in the middle. Board units, y grows downwards.
import { makeRng, starsFor } from "../../../shared/game-core";
import { nightOf, opponentIndex, opponentOf, type Night, type Opponent } from "./levels";

export const W = 360, H = 400;
export const GROUND = 356;
export const NET_X = 180, NET_TOP = 222, NET_BOTTOM = 292;
/** Racket height at contact, both sides. */
export const HIT_Y = 228;
export const PLAYER_HOME = 80, BOT_HOME = 282;
/** First to five points wins the game. */
export const POINTS = 5;
/** Seconds between a point and the next serve. */
export const GAP = 1.1;
/** Inside this share of the timing window, a hit is a full-strength smash. */
export const PERFECT = 0.3;
/** Beyond this share of the window on the late side, the shuttle goes into the net. */
export const NET_EDGE = 0.8;
/** On fog nights the ring shows only for the last part of the flight. */
export const FOG_RING = 0.6;
/** No incoming shot is ever faster than this many game seconds. */
export const MIN_FLIGHT = 0.62;

export type Side = 0 | 1;
export type ShotKind = "serve" | "clear" | "drive" | "smash" | "lob" | "net";
export type Flight = {
  x0: number; y0: number; x1: number; y1: number;
  /** Arc height above the straight line from start to end. */
  h: number;
  /** Seconds from start to end. */
  T: number;
  /** Sideways push of the wind, largest mid-flight; zero at both ends. */
  bend: number;
  /** Which way it flies: 0 = towards you, 1 = towards the opponent. */
  toward: Side;
  kind: ShotKind;
  /** No one can hit it any more; it is falling to the ground or into the net. */
  dead: boolean;
  /** For a dead shot into the net: the time it reaches the net, then it drops. */
  netAt: number;
};
export type LandReason = "early" | "late" | "missed" | "net" | "botMissed" | "botNet";
export type GameEvent =
  | { type: "serve"; who: Side }
  | { type: "hit"; who: Side; kind: ShotKind }
  | { type: "whiff" }
  | { type: "net"; who: Side }
  | { type: "land"; winner: Side; reason: LandReason }
  | { type: "done" };
export type Phase = "gap" | "flight" | "done";

export type Game = {
  level: number; seed: number; night: Night; opp: Opponent;
  rng: () => number;
  phase: Phase;
  /** Seconds since the phase or the current flight began. */
  t: number;
  /** Game seconds since the match began (drives idle animation). */
  clock: number;
  flight: Flight;
  us: number; them: number;
  server: Side;
  /** Your hits in the current rally, and the longest rally of the match. */
  rally: number; longest: number;
  /** Smashes in a row, across rallies. */
  streak: number; bestStreak: number;
  /** You already swung at this shuttle. */
  swung: boolean;
  /** Decided when your shot leaves the racket: will the opponent get it back? */
  botReturns: boolean; botFail: "missed" | "net";
  playerX: number; playerTarget: number; botX: number; botTarget: number;
  /** Clock time of the last swing on each side, for the racket animation. */
  playerSwingAt: number; botSwingAt: number;
  /** Where the shuttle came down at the end of the last point. */
  landX: number;
  last: { kind: ShotKind; offset: number } | null;
  events: GameEvent[];
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

// ---------- the flight ----------

export function posX(f: Flight, t: number) {
  const p = t / f.T;
  return f.x0 + (f.x1 - f.x0) * p + (p < 1 ? f.bend * Math.sin(Math.PI * p) : 0);
}
export function posY(f: Flight, t: number) {
  const p = t / f.T;
  return (1 - p) * f.y0 + p * f.y1 - 4 * f.h * p * (1 - p);
}
/** Direction of travel (radians), for drawing the cork first. */
export function heading(f: Flight, t: number) {
  const p = t / f.T;
  const dx = f.x1 - f.x0 + (p < 1 ? f.bend * Math.PI * Math.cos(Math.PI * p) : 0);
  const dy = f.y1 - f.y0 - 4 * f.h * (1 - 2 * p);
  return Math.atan2(dy, dx);
}
/** The time this flight reaches the ground if nobody hits it. */
export function groundTime(f: Flight) {
  const a = 4 * f.h, b = f.y1 - f.y0 - 4 * f.h, c = f.y0 - GROUND;
  const p = a > 1e-9 ? (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a) : -c / b;
  return p * f.T;
}
/** Height of the shuttle (smaller y = higher) as it crosses the net. */
export function yAtNet(f: Flight) {
  return posY(f, ((NET_X - f.x0) / (f.x1 - f.x0)) * f.T);
}

function flight(x0: number, y0: number, x1: number, y1: number, h: number, T: number, toward: Side, kind: ShotKind, bend = 0): Flight {
  return { x0, y0, x1, y1, h, T, bend, toward, kind, dead: false, netAt: 0 };
}

// ---------- your shot ----------

/** Where the swing fell in the window: −1 is the earliest that still hits, 0 perfect, 1 the latest. */
export const timingOffset = (t: number, T: number, window: number) => (t - T) / window;

/** What a swing at that offset does: early is a high lob, on time a smash, late a low drive, very late the net. */
export function shotFor(offset: number): { kind: ShotKind; quality: number } | null {
  const away = Math.abs(offset);
  if (away > 1) return null;
  if (away <= PERFECT) return { kind: "smash", quality: 1 };
  if (offset < 0) return { kind: "lob", quality: 0.35 + 0.3 * (1 - (away - PERFECT) / (1 - PERFECT)) };
  if (offset <= NET_EDGE) return { kind: "drive", quality: 0.6 };
  return { kind: "net", quality: 0 };
}

/** The return's path from where you met it to the opponent's side. The arc shows the timing. */
export function returnFlight(kind: ShotKind, fromX: number, fromY: number): Flight {
  if (kind === "smash") return flight(fromX, fromY, BOT_HOME - 12, HIT_Y, 30, 0.6, 1, kind);
  if (kind === "drive") return flight(fromX, fromY, BOT_HOME - 4, HIT_Y, 20, 0.72, 1, kind);
  if (kind === "net") {
    const f = flight(fromX, fromY, NET_X + 40, NET_BOTTOM - 10, 4, 0.55, 1, kind);
    f.dead = true; f.netAt = ((NET_X - 4 - fromX) / (f.x1 - fromX)) * f.T;
    return f;
  }
  if (kind === "serve") return flight(fromX, fromY, BOT_HOME + 8, HIT_Y, 112, 1.1, 1, kind);
  return flight(fromX, fromY, BOT_HOME + 18, HIT_Y, 128, 1.15, 1, kind);
}

/** The opponent's chance to get your shot back: weak shots come back almost always; long rallies tire everyone. */
export function returnChance(opp: Opponent, quality: number, rally: number) {
  return clamp(opp.skill + (1 - quality) * (0.96 - opp.skill) - Math.min(0.12, rally * 0.006), 0.05, 0.96);
}

// ---------- the opponent's shot ----------

/** Wind strength by opponent, in board units of sideways push. */
export const windOf = (level: number) => 14 + 5 * opponentIndex(level);

/** The opponent's next shot to you. Every random choice comes from the match's seeded generator. */
export function botShot(game: Pick<Game, "level" | "night" | "opp" | "rng" | "rally">, fromX: number, fromY: number, serve: boolean): Flight {
  const { opp, rng } = game;
  const speedUp = Math.max(0.8, 1 - 0.02 * game.rally);
  const target = PLAYER_HOME + opp.spread * (rng() * 2 - 1);
  const drive = !serve && rng() < opp.drive;
  let h = serve ? 118 : drive ? 38 : 96 + rng() * 38;
  let T = serve ? opp.pace * 1.12 : (drive ? opp.pace * 0.8 : opp.pace) * speedUp;
  let bend = 0;
  if (game.night === "wind") {
    bend = (rng() * 2 - 1) * windOf(game.level);
    T *= 1 + (rng() * 2 - 1) * 0.1;
    h += 10;
  }
  T = Math.max(MIN_FLIGHT, T);
  return flight(fromX, fromY, target, HIT_Y, h, T, 0, serve ? "serve" : drive ? "drive" : "clear", bend);
}

// ---------- the match ----------

export function newGame(level: number, seed: number): Game {
  const night = nightOf(level), opp = opponentOf(level);
  const game: Game = {
    level, seed, night, opp, rng: makeRng(seed ^ (level * 0x9e3779b1)),
    phase: "gap", t: GAP * 0.4, clock: 0,
    flight: flight(BOT_HOME, HIT_Y, BOT_HOME, HIT_Y, 0, 1, 0, "serve"),
    us: 0, them: 0, server: 1, rally: 0, longest: 0, streak: 0, bestStreak: 0,
    swung: false, botReturns: true, botFail: "missed",
    playerX: PLAYER_HOME, playerTarget: PLAYER_HOME, botX: BOT_HOME, botTarget: BOT_HOME,
    playerSwingAt: -9, botSwingAt: -9, landX: PLAYER_HOME, last: null, events: [],
  };
  return game;
}

function launch(game: Game, f: Flight) {
  game.flight = f; game.phase = "flight"; game.t = 0; game.swung = false;
  if (f.toward === 0) game.playerTarget = f.x1 - 14;
  else game.botTarget = f.x1 + 14;
}

function decideBot(game: Game, quality: number, serve: boolean) {
  const roll = game.rng(), fail = game.rng();
  game.botReturns = serve || roll < returnChance(game.opp, quality, game.rally);
  game.botFail = fail < 0.5 ? "missed" : "net";
}

function serve(game: Game) {
  game.rally = 0;
  game.events.push({ type: "serve", who: game.server });
  if (game.server === 1) {
    game.botSwingAt = game.clock;
    launch(game, botShot(game, BOT_HOME - 6, HIT_Y + 4, true));
  } else {
    game.playerSwingAt = game.clock;
    decideBot(game, 0.5, true);
    launch(game, returnFlight("serve", PLAYER_HOME + 6, HIT_Y + 4));
  }
}

function point(game: Game, winner: Side, reason: LandReason) {
  game.landX = posX(game.flight, game.t);
  if (winner === 0) game.us++; else game.them++;
  game.longest = Math.max(game.longest, game.rally);
  if (winner === 1) game.streak = 0;
  game.server = winner;
  game.events.push({ type: "land", winner, reason });
  game.playerTarget = PLAYER_HOME; game.botTarget = BOT_HOME;
  if (game.us >= POINTS || game.them >= POINTS) { game.phase = "done"; game.events.push({ type: "done" }); }
  else { game.phase = "gap"; game.t = 0; }
}

/** A swing from you. Ignored unless a shuttle is on its way to you and close; one swing per shuttle. */
export function swing(game: Game) {
  game.playerSwingAt = game.clock;
  const f = game.flight;
  if (game.phase !== "flight" || f.toward !== 0 || f.dead || game.swung) return;
  const window = game.opp.window, offset = timingOffset(game.t, f.T, window);
  if (offset < -2) return; // far too soon: a practice swing that doesn't count
  game.swung = true;
  const shot = shotFor(offset);
  if (!shot) { game.events.push({ type: "whiff" }); game.last = { kind: "net", offset }; return; }
  game.last = { kind: shot.kind, offset };
  const x = posX(f, game.t), y = posY(f, game.t);
  if (shot.kind === "smash") { game.streak++; game.bestStreak = Math.max(game.bestStreak, game.streak); }
  else game.streak = 0;
  if (shot.kind !== "net") { game.rally++; decideBot(game, shot.quality, false); }
  game.events.push({ type: "hit", who: 0, kind: shot.kind });
  launch(game, returnFlight(shot.kind, x, y));
}

/** Advances the match by dt game seconds. */
export function step(game: Game, dt: number) {
  game.clock += dt;
  game.playerX += (game.playerTarget - game.playerX) * Math.min(1, dt * 7);
  game.botX += (game.botTarget - game.botX) * Math.min(1, dt * 7);
  if (game.phase === "done") return;
  game.t += dt;
  if (game.phase === "gap") { if (game.t >= GAP) serve(game); return; }
  const f = game.flight;
  if (f.dead && f.netAt > 0) {
    if (game.t < f.netAt) return;
    // It hit the net: drop straight down from there.
    const y = posY(f, f.netAt), side: Side = f.toward === 1 ? 0 : 1;
    game.events.push({ type: "net", who: side });
    const drop = flight(f.toward === 1 ? NET_X - 6 : NET_X + 6, y, f.toward === 1 ? NET_X - 12 : NET_X + 12, GROUND, 0, 0.45, f.toward, "net");
    drop.dead = true;
    game.flight = drop; game.t = 0;
    return;
  }
  if (f.dead) {
    if (game.t >= groundTime(f)) {
      // Into the net: whoever hit it loses the point. Otherwise it lands on the side it was flying to.
      if (f.kind === "net") point(game, f.toward === 1 ? 1 : 0, f.toward === 1 ? "net" : "botNet");
      else if (f.toward === 1) point(game, 0, "botMissed");
      else point(game, 1, !game.swung ? "missed" : game.last && game.last.offset > 0 ? "late" : "early");
    }
    return;
  }
  if (f.toward === 0) {
    // Past the latest moment you could hit it (or a steep clear is nearly on the ground): it falls.
    if (game.t > Math.min(f.T + game.opp.window, groundTime(f) - 0.03)) { f.dead = true; }
    return;
  }
  if (game.t < f.T) return;
  // At the opponent's racket.
  game.botSwingAt = game.clock;
  if (game.botReturns) {
    game.events.push({ type: "hit", who: 1, kind: "clear" });
    launch(game, botShot(game, posX(f, game.t), posY(f, game.t), false));
  } else if (game.botFail === "net") {
    const x = posX(f, game.t), y = posY(f, game.t);
    const into = flight(x, y, NET_X - 40, NET_BOTTOM - 10, 4, 0.5, 0, "net");
    into.dead = true; into.netAt = ((NET_X + 4 - x) / (into.x1 - x)) * into.T;
    game.flight = into; game.t = 0;
  } else {
    f.dead = true; // swung and missed: it carries on to the ground
  }
}

// ---------- cues and results ----------

/** Seconds until the perfect moment for a shuttle on its way to you, or null when there's nothing to hit. */
export function timeToHit(game: Game) {
  const f = game.flight;
  if (game.phase !== "flight" || f.toward !== 0 || f.dead || game.swung) return null;
  return f.T - game.t;
}

/** Whether the timing ring shows now: always on clear nights, only near the end in fog. */
export function ringShows(game: Game) {
  const left = timeToHit(game);
  return left !== null && left > -game.opp.window && (game.night !== "fog" || left <= FOG_RING);
}

/** Ring radius: wide while the shuttle is far, tight at the perfect moment. */
export const ringRadius = (left: number) => 9 + Math.max(0, Math.min(1, left / 0.9)) * 38;

/** Stars for a won game by points lost: 0–1 → 3, 2–3 → 2, 4 → 1. */
export const starsOf = (us: number, them: number) => us >= POINTS && them < POINTS ? starsFor(them, 1, 3, true) : 0;

/** Plays a whole match headlessly: `swingAt(game)` returns the delay after the perfect moment to swing (null: don't swing). */
export function simulate(level: number, seed: number, swingAt: (game: Game) => number | null, dt = 1 / 60) {
  const game = newGame(level, seed);
  let planned: number | null | undefined, flightRef: Flight | null = null, shortest = Infinity;
  for (let i = 0; i < 60 * 60 * 20 && game.phase !== "done"; i++) {
    const f = game.flight;
    if (game.phase === "flight" && f.toward === 0 && !f.dead && !game.swung) {
      if (f !== flightRef) { flightRef = f; planned = swingAt(game); shortest = Math.min(shortest, f.T); }
      if (planned !== null && planned !== undefined && game.t >= f.T + planned) swing(game);
    }
    step(game, dt);
    game.events.length = 0;
  }
  return { game, shortest };
}
