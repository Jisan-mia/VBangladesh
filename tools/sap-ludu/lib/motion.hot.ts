// The move timeline, run every frame while a piece moves: the die tumbles, the piece hops square by square, holds on a
// ladder's foot or a snake's head, travels the jump, then settles. Numbers in, numbers out: every object here is made
// once at setup and mutated in place (npm run lint:games checks it). The tests use the same durations to time a race.
import type { Board } from "./board";

// ---- durations (ms) ----
/** The die tumbles before it shows its face. */
export const DICE_MS = 420;
/** One square of the walk. */
export const HOP_MS = 130;
/** The piece waits on a ladder's foot or a snake's head before it moves. */
export const HOLD_MS = 260;
/** The last little squash on landing. */
export const SETTLE_MS = 100;
/** A computer seat looks at the board this long before it rolls, and before it picks a piece. */
export const BOT_MS = 620;
export const BOT_PICK_MS = 520;
/** ধীরে খেলো: the face shows at once, the piece steps without an arc, and each landing holds longer. */
export const SLOW_DICE_MS = 120;
export const SLOW_HOP_MS = 240;
export const SLOW_HOLD_MS = 700;
/** After চালিয়ে যাও, a short breath before anything moves or a tap counts. */
export const BREATH_MS = 280;

// ---- events a step can report (a bit mask) ----
export const EV_DIE = 1;
export const EV_HOP = 2;
export const EV_JUMP = 4;
export const EV_JUMPED = 8;
export const EV_DONE = 16;

/** One move in flight. `active` 0 means nothing moves. */
export type Motion = {
  active: number; seat: number; slot: number;
  from: number; to: number; end: number; jump: number; ladder: number;
  t: number; dice: number; walk: number; hop: number; hold: number; travel: number; settle: number; total: number;
  /** Hops already reported, and which of EV_DIE / EV_JUMP / EV_JUMPED / EV_DONE have fired. */
  hops: number; fired: number;
  slow: number;
};

// lint-games-allow: setup, called once per component
export const makeMotion = (): Motion => ({ active: 0, seat: 0, slot: 0, from: 0, to: 0, end: 0, jump: -1, ladder: 0, t: 0, dice: 0, walk: 0, hop: HOP_MS, hold: 0, travel: 0, settle: 0, total: 0, hops: 0, fired: 0, slow: 0 });

/** A board's square centre, in cell units from the board's top-left (square 0 is not on the board). */
export function squareX(board: Board, square: number) {
  const index = square - 1, line = Math.floor(index / board.cols), along = index % board.cols;
  return (line % 2 === 0 ? along : board.cols - 1 - along) + 0.5;
}
export function squareY(board: Board, square: number) {
  return board.rows - 1 - Math.floor((square - 1) / board.cols) + 0.5;
}

/** How long a jump's travel takes: ladders climb briskly, snakes slide slower, for the drama. */
export function travelMs(board: Board, jump: number) {
  const a = board.jumps[jump], dx = squareX(board, a.to) - squareX(board, a.from), dy = squareY(board, a.to) - squareY(board, a.from);
  const length = Math.sqrt(dx * dx + dy * dy);
  return jump < board.ladders ? 240 + 90 * length : 320 + 120 * length;
}

/** Fill `m` for a move. `rolled`: the die was just thrown (bots and people), so it tumbles first. */
export function planMove(m: Motion, board: Board, seat: number, slot: number, from: number, to: number, end: number, jump: number, rolled: boolean, slow: boolean) {
  m.active = 1; m.seat = seat; m.slot = slot; m.from = from; m.to = to; m.end = end; m.jump = jump;
  m.ladder = jump >= 0 && jump < board.ladders ? 1 : 0;
  m.slow = slow ? 1 : 0;
  m.t = 0; m.hops = 0; m.fired = 0;
  m.dice = rolled ? (slow ? SLOW_DICE_MS : DICE_MS) : 0;
  m.hop = slow ? SLOW_HOP_MS : HOP_MS;
  m.walk = (to - from) * m.hop;
  m.hold = jump >= 0 ? (slow ? SLOW_HOLD_MS : HOLD_MS) : 0;
  m.travel = jump >= 0 && !slow ? travelMs(board, jump) : 0;
  m.settle = SETTLE_MS;
  m.total = m.dice + m.walk + m.hold + m.travel + m.settle;
}

/** A roll that moves nothing (stuck, or a voided third six): only the die tumbles. */
export function planStill(m: Motion, seat: number, slow: boolean) {
  m.active = 1; m.seat = seat; m.slot = -1; m.from = 0; m.to = 0; m.end = 0; m.jump = -1; m.ladder = 0; m.slow = slow ? 1 : 0;
  m.t = 0; m.hops = 0; m.fired = 0;
  m.dice = slow ? SLOW_DICE_MS : DICE_MS; m.hop = HOP_MS; m.walk = 0; m.hold = 0; m.travel = 0; m.settle = 240;
  m.total = m.dice + m.settle;
}

/** Advance by `dt` ms and report what happened (EV_* bits). The hop count is in m.hops. */
export function stepMotion(m: Motion, dt: number) {
  if (!m.active) return 0;
  m.t += dt;
  let events = 0;
  const t = m.t;
  if (!(m.fired & EV_DIE) && t >= m.dice) { m.fired |= EV_DIE; events |= EV_DIE; }
  if (t >= m.dice && m.walk > 0) {
    // Hop k lands at dice + k·hop; each landing is reported once.
    const all = m.to - m.from;
    let landed = Math.floor((t - m.dice) / m.hop);
    if (landed > all) landed = all;
    if (landed > m.hops) { m.hops = landed; events |= EV_HOP; }
  }
  const jumpAt = m.dice + m.walk + m.hold;
  if (m.jump >= 0 && !(m.fired & EV_JUMP) && t >= jumpAt) { m.fired |= EV_JUMP; events |= EV_JUMP; }
  if (m.jump >= 0 && !(m.fired & EV_JUMPED) && t >= jumpAt + m.travel) { m.fired |= EV_JUMPED; events |= EV_JUMPED; }
  if (t >= m.total) { m.active = 0; m.fired |= EV_DONE; events |= EV_DONE; }
  return events;
}

/** Jump straight to the end (a tap during the walk): reports only EV_DONE, so the skipped sounds stay quiet. */
export function finishMotion(m: Motion) {
  if (!m.active) return 0;
  m.t = m.total; m.active = 0; m.hops = m.to - m.from; m.fired = EV_DIE | EV_JUMP | EV_JUMPED | EV_DONE;
  return EV_DONE;
}

/** Where the moving piece is: x, y in cell units, `lift` (cells above the square) and `squash` (1 = round). */
export type Place = { x: number; y: number; lift: number; squash: number; along: number };
// lint-games-allow: setup, called once per component
export const makePlace = (): Place => ({ x: 0, y: 0, lift: 0, squash: 1, along: 0 });

/** The start strip's spot for piece `slot` of `count`, in cell units. */
export function startX(board: Board, slot: number, count: number) {
  const step = Math.min(0.8, (board.cols - 1.5) / Math.max(1, count));
  return 1.35 + slot * step;
}
export const startY = (board: Board) => board.rows + 0.48;

function centre(board: Board, square: number, slot: number, count: number, out: Place) {
  if (square <= 0) { out.x = startX(board, slot, count); out.y = startY(board); return; }
  out.x = squareX(board, square); out.y = squareY(board, square);
}

// A snake's S-curve in cell units: a cubic from head to tail that bends to one side and back.
const curve = new Float64Array(8);
export function snakeCurve(board: Board, jump: number) {
  const a = board.jumps[jump], hx = squareX(board, a.from), hy = squareY(board, a.from), tx = squareX(board, a.to), ty = squareY(board, a.to);
  const dx = tx - hx, dy = ty - hy, length = Math.sqrt(dx * dx + dy * dy) || 1;
  const bend = ((jump - board.ladders) % 2 === 0 ? 1 : -1) * Math.min(0.9, 0.35 + length * 0.12);
  const px = -dy / length * bend, py = dx / length * bend;
  curve[0] = hx; curve[1] = hy; curve[6] = tx; curve[7] = ty;
  curve[2] = hx + dx * 0.3 + px; curve[3] = hy + dy * 0.3 + py;
  curve[4] = hx + dx * 0.7 - px; curve[5] = hy + dy * 0.7 - py;
  return curve;
}
export function bezierX(c: Float64Array, t: number) {
  const u = 1 - t;
  return u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
}
export function bezierY(c: Float64Array, t: number) {
  const u = 1 - t;
  return u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
}

const easeInOut = (u: number) => u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
const scratch = makePlace();

/** Place the moving piece at its time. `count` is how many pieces wait on the start strip (for square 0). */
export function placeMotion(m: Motion, board: Board, count: number, out: Place) {
  out.lift = 0; out.squash = 1; out.along = 0;
  const t = m.t;
  if (t < m.dice) { centre(board, m.from, m.slot, count, out); return out; }
  const walked = t - m.dice;
  if (walked < m.walk) {
    const hop = Math.floor(walked / m.hop), u = (walked - hop * m.hop) / m.hop;
    centre(board, m.from + hop, m.slot, count, scratch);
    centre(board, m.from + hop + 1, m.slot, count, out);
    if (m.slow) { out.x = u < 0.5 ? scratch.x : out.x; out.y = u < 0.5 ? scratch.y : out.y; return out; }
    out.x = scratch.x + (out.x - scratch.x) * u;
    out.y = scratch.y + (out.y - scratch.y) * u;
    out.lift = Math.sin(Math.PI * u) * 0.3;
    // Squash a little at take-off and landing.
    out.squash = u < 0.15 ? 1 - (0.15 - u) * 1.2 : u > 0.85 ? 1 - (u - 0.85) * 1.2 : 1 + out.lift * 0.25;
    return out;
  }
  const holdEnd = m.dice + m.walk + m.hold;
  if (m.jump < 0 || t < holdEnd) {
    centre(board, m.jump >= 0 ? m.to : m.end, m.slot, count, out);
    const into = t - m.dice - m.walk;
    // The landing squash, and a shiver while it waits on a snake's head.
    out.squash = into < 90 ? 0.82 + into / 90 * 0.18 : 1;
    if (m.jump >= 0 && !m.ladder && !m.slow) out.x += Math.sin(into * 0.09) * 0.03;
    return out;
  }
  const travelled = t - holdEnd;
  if (m.travel > 0 && travelled < m.travel) {
    const u = easeInOut(travelled / m.travel);
    out.along = u;
    if (m.ladder) {
      centre(board, m.to, m.slot, count, scratch);
      centre(board, m.end, m.slot, count, out);
      out.x = scratch.x + (out.x - scratch.x) * u;
      out.y = scratch.y + (out.y - scratch.y) * u;
      // Rung by rung: a small bob as it climbs.
      out.lift = Math.abs(Math.sin(u * Math.PI * 6)) * 0.08;
      return out;
    }
    const c = snakeCurve(board, m.jump);
    out.x = bezierX(c, u); out.y = bezierY(c, u);
    out.squash = 0.86;
    return out;
  }
  centre(board, m.end, m.slot, count, out);
  const into = travelled - m.travel;
  out.squash = m.travel > 0 && into < 100 ? 0.8 + into / 100 * 0.2 : 1;
  return out;
}

/** The end screen's count-up: ease out (cubic) over 0..1, and the value it shows at t. */
export function easeOut(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - (1 - c) * (1 - c) * (1 - c);
}
export const countAt = (to: number, t: number) => Math.round(to * easeOut(t));

// ---- the loop's pacing: the breath after a resume and a computer seat's turn ----
export const PACE_NONE = 0, PACE_ROLL = 1, PACE_PICK = 2;
/** What the loop owes the game, kept between steps. It only changes inside paceStep, so it freezes whenever the loop stops. */
export type Pacer = { breath: number; bot: number };
// lint-games-allow: setup, called once per component
export const makePacer = (): Pacer => ({ breath: 0, bot: 0 });

/**
 * One loop step of `ms` when no piece is moving. `botTurn`: a computer seat is to act; `choosing`: it has two pieces to
 * pick from. Returns PACE_ROLL or PACE_PICK when the computer acts now, else PACE_NONE.
 */
export function paceStep(p: Pacer, ms: number, botTurn: boolean, choosing: boolean) {
  if (p.breath > 0) { p.breath -= ms; return PACE_NONE; }
  if (!botTurn) { p.bot = 0; return PACE_NONE; }
  p.bot += ms;
  if (p.bot < (choosing ? BOT_PICK_MS : BOT_MS)) return PACE_NONE;
  p.bot = 0;
  return choosing ? PACE_PICK : PACE_ROLL;
}

/** The result screen takes Space or Enter only as a fresh press that began after it appeared. */
export const freshPress = (timeStamp: number, shownAt: number, repeat: boolean) => !repeat && timeStamp > shownAt;
