// Rules for ভো-কাট্টা: your kite and one rival at a time over Old Dhaka rooftops, three 30-second rounds.
// A string is a quadratic curve from a hand on a roof up to the kite. When two strings cross they hook (প্যাঁচ),
// and a tug decides who gets cut: tension in the green band saws, too slack or too tight barely does.
// Everything random is drawn from the seed up front (wind, rival homes, rhythms, looks), so a link replays the same sky.
import { makeRng, pick } from "../../../shared/game-core";
import { LEVEL_COUNT, LEVELS as PARAS, LOOKS, RIVALS_PER_ROUND, ROUNDS } from "./link";

/** The sky is always 360 × 500 world units, scaled to the screen. */
export const W = 360;
export const H = 500;
/** Where kites may fly: above the roofs, inside the edges. */
export const SKY = { left: 24, right: 336, top: 64, bottom: 330 } as const;
/** Your hand on the near roof, and where a fresh kite of yours settles. */
export const HAND = { x: 172, y: 432 } as const;
export const HOME = { x: 150, y: 205 } as const;
/** One rival roof per round; the hands sit just above each parapet. Homes are where that roof's kites like to hover. */
export const ROOFS = [
  { x: 300, y: 402, name: "পাশের ছাদ", note: "পিচ্চিরা সবে প্যাঁচ শিখছে", home: { x: [232, 300], y: [120, 215] } },
  { x: 50, y: 394, name: "লাল বাড়ির ছাদ", note: "এরা নিজেই প্যাঁচ লাগাতে আসবে", home: { x: [62, 140], y: [110, 205] } },
  { x: 250, y: 380, name: "ওস্তাদের ছাদ", note: "টান দিতে জানে, সাবধান!", home: { x: [196, 300], y: [92, 190] } },
] as const;

export const ROUND_TIME = 30;
/** A প্যাঁচ still going when the clock runs out gets this long to finish. */
export const OVERTIME = 3;
export const BREAK_TIME = 1.8;
export const FALL_TIME = 1.5;
export const RISE_TIME = 1.1;

/** The green band of the tension meter. */
export const LO = 0.45;
export const HI = 0.8;
const MID = (LO + HI) / 2;
/** টান fills the meter in a second; letting go empties it a little slower. */
export const PULL = 1;
export const EASE = 0.85;
const SLACK_EDGE = 0.3;
const OVER_EDGE = 0.3;
/** Moving your kite while hooked and taut rubs the strings: up to this much extra edge. */
const SAW_MAX = 0.35;
const SAW_SPEED = 260;
export const TUG_RATE = 0.9;
/** While hooked, both kites stay this close to the hook (or as far as they already were when it caught). */
export const REACH = 120;
export const KITE_SPEED = 250;
const FOLLOW = 8;
/** Wind slowly pushes your aim sideways. */
const DRIFT = 0.5;
const HOOK_DRIFT = 0.25;
const ATTACK_TIME = 2.4;
const ATTACK_BOOST = 1.6;
/** Slow mode runs the same game at this speed, with calmer wind. */
export const SLOW = 0.7;
const CALM = 0.4;
export const SEGMENTS = 10;
const TAU = Math.PI * 2;

/** Rivals get a little smarter each round: a steadier pull, quicker kites, and from round 2 they come to hook you. Later পাড়া scale these. */
export const ROUND_RIVALS = [
  { speed: 40, amp: 0.6, period: 2.4, strength: 0.7, attackEvery: 0, firstAttack: 0, wanderX: 44, wanderY: 24, comeback: false },
  { speed: 56, amp: 0.48, period: 2.0, strength: 0.85, attackEvery: 5, firstAttack: 2.5, wanderX: 38, wanderY: 24, comeback: false },
  { speed: 70, amp: 0.36, period: 1.7, strength: 0.95, attackEvery: 3.5, firstAttack: 1.5, wanderX: 34, wanderY: 22, comeback: true },
] as const;

export type Point = { x: number; y: number };
export type Rival = { speed: number; amp: number; period: number; strength: number; attackEvery: number; firstAttack: number; wanderX: number; wanderY: number; comeback: boolean };

/** One পাড়া's three roofs: the round table scaled by the level. Level 1's factors are all 1 (or 0 to add), so it plays the original evening. */
export function rivalsFor(level: number): Rival[] {
  const para = PARAS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
  return ROUND_RIVALS.map((round, index) => ({
    ...round,
    speed: round.speed * para.speed,
    amp: round.amp * para.steady,
    strength: round.strength + para.strength,
    attackEvery: index === 0 ? para.attack0 : round.attackEvery * para.attack,
    firstAttack: index === 0 && para.attack0 ? 3 : round.firstAttack,
  }));
}
export type KiteState = "fly" | "rise" | "fall" | "gone";
export type Kite = Point & {
  vx: number; vy: number;
  tension: number;
  state: KiteState;
  /** Seconds left of a rise or a fall. */
  timer: number;
  /** The hand on the roof holding the string. */
  hx: number; hy: number;
  spin: number;
};
export type Plan = { hx: number; hy: number; phase: number; w1: number; w2: number; look: number };
export type Phase = "fly" | "break" | "over";

export type Game = {
  level: number;
  /** This পাড়া's rival tuning per round, and how gusty its wind is. */
  rivals: Rival[];
  windScale: number;
  plans: Plan[][];
  windBase: number; wind1: number; wind2: number; wind: number;
  phase: Phase;
  round: number;
  /** Seconds into this round, and seconds of play overall (the wind's clock). */
  clock: number; total: number;
  breakLeft: number;
  you: Kite;
  /** Where your kite is heading. */
  aim: Point;
  pulling: boolean;
  rival: Kite;
  rivalIndex: number; rivalAge: number;
  nextAttack: number; attackLeft: number; attack: Point;
  comebackLeft: number; comebackUsed: boolean;
  hooked: boolean;
  hook: Point;
  reach: number;
  /** −1 means you are cut, +1 means the rival is. */
  tug: number;
  cuts: number; lost: number;
  youLine: Float32Array; rivalLine: Float32Array;
  at: Float32Array;
};

export type GameEvent = "hook" | "cut" | "lost" | "rise" | "round-end" | "round" | "over";
export type Listener = (event: GameEvent, x: number, y: number) => void;
const quiet: Listener = () => {};

const clamp = (value: number, low: number, high: number) => value < low ? low : value > high ? high : value;
const between = (rng: () => number, [low, high]: readonly [number, number]) => low + rng() * (high - low);

function kite(x: number, y: number, hand: Point, state: KiteState): Kite {
  return { x, y, vx: 0, vy: 0, tension: 0.3, state, timer: 0, hx: hand.x, hy: hand.y, spin: 0 };
}

export function createGame(seed: number, level = 1): Game {
  const rng = makeRng(seed);
  const windBase = (rng() * 2 - 1) * 12, wind1 = rng() * TAU, wind2 = rng() * TAU;
  const plans = ROOFS.map(roof => Array.from({ length: RIVALS_PER_ROUND }, () => ({
    hx: between(rng, roof.home.x), hy: between(rng, roof.home.y), phase: rng() * TAU, w1: rng() * TAU, w2: rng() * TAU, look: pick(rng, LOOKS.length),
  })));
  const first = plans[0][0], rivals = rivalsFor(level);
  const game: Game = {
    level, rivals, windScale: PARAS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1].wind,
    plans, windBase, wind1, wind2, wind: 0,
    phase: "fly", round: 0, clock: 0, total: 0, breakLeft: 0,
    you: kite(HOME.x, HOME.y, HAND, "fly"), aim: { x: HOME.x, y: HOME.y }, pulling: false,
    rival: kite(first.hx, first.hy, ROOFS[0], "fly"),
    rivalIndex: 0, rivalAge: 0, nextAttack: rivals[0].firstAttack, attackLeft: 0, attack: { x: 0, y: 0 },
    comebackLeft: 0, comebackUsed: false,
    hooked: false, hook: { x: 0, y: 0 }, reach: REACH, tug: 0,
    cuts: 0, lost: 0,
    youLine: new Float32Array((SEGMENTS + 1) * 2), rivalLine: new Float32Array((SEGMENTS + 1) * 2), at: new Float32Array(2),
  };
  game.wind = windAt(game, 0, false);
  curve(game.you, game.wind, game.youLine);
  curve(game.rival, game.wind, game.rivalLine);
  return game;
}

export const plan = (game: Game) => game.plans[game.round][Math.min(game.rivalIndex, RIVALS_PER_ROUND - 1)];

/** Sideways wind in units a second: a seeded lean plus two slow gusts. Calmer in slow mode. */
export const windAt = (game: Pick<Game, "windBase" | "wind1" | "wind2"> & { windScale?: number }, total: number, slow: boolean) =>
  (game.windBase + 7 * Math.sin(total * 0.29 + game.wind1) + 4 * Math.sin(total * 0.71 + game.wind2)) * (slow ? CALM : 1) * (game.windScale ?? 1);

/** How hard a string saws at this tension: full in the green band, a little when slack, barely when too tight. */
export const edge = (tension: number) => tension < LO ? SLACK_EDGE * tension / LO : tension <= HI ? 1 : OVER_EDGE;
export const zone = (tension: number) => tension < LO ? "slack" : tension <= HI ? "good" : "tight";

/** The string's bend: a slack string sags and leans downwind, a taut one runs nearly straight. */
export const sagOf = (k: Kite) => 4 + 0.2 * Math.hypot(k.x - k.hx, k.y - k.hy) * (1 - k.tension);
export const controlX = (k: Kite, wind: number) => (k.hx + k.x) / 2 + wind * 0.9 * (1 - k.tension);
export const controlY = (k: Kite) => (k.hy + k.y) / 2 + sagOf(k);

/** Samples the string from the hand to the kite into SEGMENTS straight pieces (x0, y0, x1, y1, …). */
export function curve(k: Kite, wind: number, out: Float32Array) {
  const cx = controlX(k, wind), cy = controlY(k);
  for (let i = 0; i <= SEGMENTS; i++) {
    const u = i / SEGMENTS, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    out[i * 2] = a * k.hx + b * cx + c * k.x;
    out[i * 2 + 1] = a * k.hy + b * cy + c * k.y;
  }
}

/** Where along segment A (0–1) it crosses segment B, or −1. Touching ends count; parallel lines never cross. */
export function segmentsCross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
  const denominator = rx * sy - ry * sx;
  if (denominator === 0) return -1;
  const qx = cx - ax, qy = cy - ay;
  const t = (qx * sy - qy * sx) / denominator, u = (qx * ry - qy * rx) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : -1;
}

/** True when two sampled strings cross; the first crossing goes into `at`. */
export function linesCross(a: Float32Array, b: Float32Array, at: Float32Array) {
  for (let i = 0; i < SEGMENTS; i++) {
    const ax = a[i * 2], ay = a[i * 2 + 1], bx = a[i * 2 + 2], by = a[i * 2 + 3];
    for (let j = 0; j < SEGMENTS; j++) {
      const t = segmentsCross(ax, ay, bx, by, b[j * 2], b[j * 2 + 1], b[j * 2 + 2], b[j * 2 + 3]);
      if (t < 0) continue;
      at[0] = ax + (bx - ax) * t;
      at[1] = ay + (by - ay) * t;
      return true;
    }
  }
  return false;
}

function inSky(p: Point) {
  p.x = clamp(p.x, SKY.left, SKY.right);
  p.y = clamp(p.y, SKY.top, SKY.bottom);
}

/** Keeps a point within REACH of the hook. */
function leash(game: Game, p: Point) {
  const dx = p.x - game.hook.x, dy = p.y - game.hook.y, d = Math.hypot(dx, dy);
  if (d <= game.reach) return;
  p.x = game.hook.x + (dx * game.reach) / d;
  p.y = game.hook.y + (dy * game.reach) / d;
}

/** Moves a flying kite toward a point: quick when far, gentle when close, never faster than `speed`. */
function fly(game: Game, k: Kite, gx: number, gy: number, speed: number, dt: number) {
  const dx = gx - k.x, dy = gy - k.y, d = Math.hypot(dx, dy);
  const move = Math.min(d, d * FOLLOW * dt, speed * dt);
  const px = k.x, py = k.y;
  if (d > 0) { k.x += (dx / d) * move; k.y += (dy / d) * move; }
  inSky(k);
  if (game.hooked) leash(game, k);
  k.vx = (k.x - px) / dt;
  k.vy = (k.y - py) / dt;
}

function fall(k: Kite, dt: number, wind: number) {
  k.vx += (wind * 1.4 - k.vx) * 0.8 * dt;
  k.vy = Math.min(k.vy + 36 * dt, 46);
  k.x += k.vx * dt;
  k.y += k.vy * dt;
  k.spin += 2.4 * dt;
  k.timer -= dt;
}

/** A fresh kite climbs from the hand to its home with an ease-out. True once it is up and flying. */
function rise(k: Kite, tx: number, ty: number, dt: number) {
  k.timer -= dt;
  const p = 1 - Math.max(0, k.timer) / RISE_TIME, e = 1 - (1 - p) * (1 - p);
  k.x = k.hx + (tx - k.hx) * e;
  k.y = k.hy + (ty - k.hy) * e;
  if (k.timer > 0) return false;
  k.state = "fly"; k.vx = k.vy = 0;
  return true;
}

function launch(k: Kite, hand: Point) {
  k.state = "rise"; k.timer = RISE_TIME; k.hx = hand.x; k.hy = hand.y; k.x = hand.x; k.y = hand.y; k.tension = 0.3; k.spin = 0;
}

export function steerTo(game: Game, x: number, y: number) {
  game.aim.x = x; game.aim.y = y;
  inSky(game.aim);
  if (game.hooked) leash(game, game.aim);
}
export const steerBy = (game: Game, dx: number, dy: number) => steerTo(game, game.aim.x + dx, game.aim.y + dy);

function moveYou(game: Game, dt: number, on: Listener) {
  const you = game.you;
  if (you.state === "fly") {
    you.tension = clamp(you.tension + (game.pulling ? PULL : -EASE) * dt, 0, 1);
    steerBy(game, game.wind * DRIFT * dt, 0);
    fly(game, you, game.aim.x, game.aim.y, KITE_SPEED, dt);
  } else if (you.state === "fall") {
    fall(you, dt, game.wind);
    if (you.timer <= 0) { launch(you, HAND); steerTo(game, HOME.x, HOME.y); on("rise", you.x, you.y); }
  } else if (you.state === "rise") rise(you, HOME.x, HOME.y, dt);
}

/** Aims an attack across your string, a little past it, so the rival's own string hooks yours. */
function aimAttack(game: Game) {
  const you = game.you, r = game.rival;
  const px = you.hx + (you.x - you.hx) * 0.6, py = you.hy + (you.y - you.hy) * 0.6;
  const lx = you.x - you.hx, ly = you.y - you.hy, length = Math.hypot(lx, ly) || 1;
  const side = Math.sign(lx * (r.y - you.hy) - ly * (r.x - you.hx)) || 1;
  game.attack.x = px - (side * -ly / length) * 45;
  game.attack.y = py - (side * lx / length) * 45;
  inSky(game.attack);
}

function moveRival(game: Game, dt: number, on: Listener) {
  const r = game.rival, level = game.rivals[game.round], p = plan(game);
  if (r.state === "fly") {
    game.rivalAge += dt;
    let tension = MID + level.amp * Math.sin((TAU * game.rivalAge) / level.period + p.phase);
    if (game.comebackLeft > 0) { game.comebackLeft -= dt; tension = MID; }
    r.tension = clamp(tension, 0, 1);
    let gx = p.hx + level.wanderX * Math.sin(game.rivalAge * 0.55 + p.w1) + game.wind * 1.5;
    let gy = p.hy + level.wanderY * Math.sin(game.rivalAge * 0.8 + p.w2);
    let speed: number = level.speed;
    if (!game.hooked && game.attackLeft > 0) {
      game.attackLeft -= dt;
      gx = game.attack.x; gy = game.attack.y; speed *= ATTACK_BOOST;
    } else if (!game.hooked && level.attackEvery && game.phase === "fly" && game.you.state === "fly" && game.rivalAge >= game.nextAttack) {
      aimAttack(game);
      game.attackLeft = ATTACK_TIME;
      game.nextAttack = game.rivalAge + level.attackEvery;
    }
    fly(game, r, gx, gy, speed, dt);
  } else if (r.state === "fall") {
    fall(r, dt, game.wind);
    if (r.timer > 0) return;
    game.rivalIndex++;
    if (game.rivalIndex >= RIVALS_PER_ROUND) { r.state = "gone"; return; }
    launch(r, ROOFS[game.round]);
    on("rise", r.x, r.y);
  } else if (r.state === "rise") {
    if (rise(r, p.hx, p.hy, dt)) { game.rivalAge = 0; game.nextAttack = level.firstAttack; game.attackLeft = 0; }
  }
}

function unhook(game: Game) {
  game.hooked = false;
  game.tug = 0;
  game.comebackLeft = 0;
  game.comebackUsed = false;
}

function cutLoose(k: Kite, from: number, wind: number) {
  k.state = "fall"; k.timer = FALL_TIME; k.spin = 0;
  k.vx = wind * 1.2 + (k.x >= from ? 26 : -26);
  k.vy = -14;
}

function tug(game: Game, dt: number, on: Listener) {
  const you = game.you, r = game.rival, level = game.rivals[game.round];
  const saw = you.tension >= LO ? Math.min(SAW_MAX, Math.hypot(you.vx, you.vy) / SAW_SPEED) : 0;
  game.tug += (edge(you.tension) + saw - edge(r.tension) * level.strength) * TUG_RATE * dt;
  // The ওস্তাদ pulls steady for a moment when losing, once per প্যাঁচ.
  if (level.comeback && !game.comebackUsed && game.tug > 0.55) { game.comebackUsed = true; game.comebackLeft = 0.8; }
  game.hook.x = clamp(game.hook.x + game.wind * HOOK_DRIFT * dt, SKY.left, SKY.right);
  if (game.tug >= 1) {
    game.cuts++;
    cutLoose(r, game.hook.x, game.wind);
    unhook(game);
    on("cut", game.hook.x, game.hook.y);
  } else if (game.tug <= -1) {
    game.lost++;
    cutLoose(you, game.hook.x, game.wind);
    unhook(game);
    // The winner backs off for a moment before coming again.
    game.attackLeft = 0;
    game.nextAttack = game.rivalAge + 2;
    on("lost", game.hook.x, game.hook.y);
  }
}

function endRound(game: Game, on: Listener) {
  unhook(game);
  game.attackLeft = 0;
  if (game.round >= ROUNDS - 1) { game.phase = "over"; on("over", 0, 0); return; }
  game.phase = "break";
  game.breakLeft = BREAK_TIME;
  on("round-end", 0, 0);
}

function startRound(game: Game, round: number, on: Listener) {
  game.phase = "fly";
  game.round = round;
  game.clock = 0;
  game.rivalIndex = 0;
  launch(game.rival, ROOFS[round]);
  on("round", game.rival.x, game.rival.y);
}

/** Advances the game by dt seconds (slow mode plays the same game at SLOW speed). Input goes in through steerTo/steerBy and game.pulling. */
export function step(game: Game, dt: number, slow: boolean, on: Listener = quiet) {
  if (game.phase === "over") return;
  if (slow) dt *= SLOW;
  game.total += dt;
  game.wind = windAt(game, game.total, slow);
  moveYou(game, dt, on);
  moveRival(game, dt, on);
  curve(game.you, game.wind, game.youLine);
  curve(game.rival, game.wind, game.rivalLine);
  if (game.phase === "break") {
    game.breakLeft -= dt;
    if (game.breakLeft <= 0) startRound(game, game.round + 1, on);
    return;
  }
  game.clock += dt;
  if (game.hooked) tug(game, dt, on);
  else if (game.you.state === "fly" && game.rival.state === "fly" && linesCross(game.youLine, game.rivalLine, game.at)) {
    game.hooked = true;
    game.hook.x = game.at[0];
    game.hook.y = game.at[1];
    game.reach = Math.max(REACH, Math.hypot(game.you.x - game.hook.x, game.you.y - game.hook.y), Math.hypot(game.rival.x - game.hook.x, game.rival.y - game.hook.y));
    game.tug = 0;
    on("hook", game.hook.x, game.hook.y);
  }
  if ((game.clock >= ROUND_TIME && !game.hooked) || game.clock >= ROUND_TIME + OVERTIME) endRound(game, on);
}

/** Seconds left in this round, never below zero (overtime shows as 0). */
export const timeLeft = (game: Game) => Math.max(0, ROUND_TIME - game.clock);
