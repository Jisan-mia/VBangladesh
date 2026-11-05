// The per-step rules: run 60 times a second on a cheap phone, so they mutate the run in place and allocate nothing.
import {
  ACTIVATE, AHEAD, BUFFER, FAST_FALL, GRAVITY, HALF, HIT, HOLD_GRAVITY, HOLD_MAX, HOLD_START, isPickup, JUMP_V, KID_X, PAGE, PASSED,
  SHIELD_TIME, speedAt, speedOf, TAKEN, TIFFIN, TOP, UNIT, W,
} from "./course";
import {
  ARRIVED, CRASHED, E, emit, END, END_TIME, grounded, LATE, LATE_MARGIN, layRoad, OVER, pieceAt, READY, RISE, RUN, SAFE, SLOW, STOP, touches,
  type Run,
} from "./game";

/** Seconds of warning an edge pointer gives before a thing enters the view. */
export const LEAD = 0.7;
/** Pointers show for everything from this speed up (units a second), and always for a tyre. */
export const POINTER_SPEED = 228;

/** How long until `piece` enters the view at the right edge (negative once it's on screen). */
export function enterIn(run: Run, index: number) {
  const piece = pieceAt(run, index), rel = piece.x - run.d - W;
  const closing = run.nominal + (piece.vx > 0 && piece.x - run.d < ACTIVATE ? piece.vx : 0);
  return rel / (closing > 1 ? closing : 1);
}

function takeOff(run: Run) {
  run.vy = JUMP_V; run.air = 0; run.hold = 0; run.jumpAt = -9; run.jumps++;
  emit(run, E.JUMP, run.d);
}

function end(run: Run, kind: number, event: number, x: number) {
  run.phase = END; run.endKind = kind; run.endAt = run.t;
  emit(run, event, x);
}

/** One fixed step of `dt` seconds (slow mode runs the whole clock at SLOW). */
export function stepRun(run: Run, dt: number, slow: boolean) {
  const t = slow ? dt * SLOW : dt;
  if (run.phase === OVER) return;
  if (run.phase === READY) {
    // The first press starts the run (and the bell); it doesn't jump.
    if (run.jumpAt < -1 && run.duckUntil < -1 && !run.duckHeld) return;
    run.phase = RUN; run.jumpAt = -9; run.duckUntil = -9; run.duckHeld = false;
    emit(run, E.START, run.d);
    return;
  }
  run.t += t;
  if (run.phase === END) {
    // Through the gate the kid slows to a walk; late or bumped, she stands where she is.
    if (run.endKind === ARRIVED) {
      const left = 1 - (run.t - run.endAt) / END_TIME;
      run.speed = run.nominal * (left > 0.25 ? left : 0.25);
      run.d += run.speed * t;
    } else run.speed = 0;
    if (run.y > 0) { run.vy -= GRAVITY * t; run.y += run.vy * t; if (run.y <= 0) { run.y = 0; run.vy = 0; run.air = -1; } }
    if (run.t - run.endAt >= END_TIME) { run.phase = OVER; emit(run, E.OVER, run.d); }
    return;
  }

  const since = run.t - run.stumbleAt, stopped = since < STOP;
  const factor = stopped ? 0 : since < STOP + RISE ? (since - STOP) / RISE : 1;
  run.nominal = run.endless ? (speedAt(run.d / UNIT) < TOP ? speedAt(run.d / UNIT) : TOP) : speedOf(run.def, run.d / UNIT);
  run.speed = run.nominal * factor;
  run.d += run.speed * t;
  // Keep the road laid out a little past the right edge.
  layRoad(run, W + 260);

  // Tyres roll in once they are just off the right edge.
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.vx > 0 && piece.x - run.d < ACTIVATE) piece.x -= piece.vx * t;
  }

  // A stumbled kid is down for a moment: no jump, no duck.
  if (stopped) { run.jumpAt = -9; run.ducking = false; }
  else run.ducking = run.duckHeld || run.t < run.duckUntil;
  if (!stopped && grounded(run) && run.t - run.jumpAt <= BUFFER) takeOff(run);
  if (!grounded(run)) {
    let gravity = GRAVITY;
    if (run.vy > 0 && run.jumpHeld && run.air >= HOLD_START && run.hold < HOLD_MAX) { gravity *= HOLD_GRAVITY; run.hold += t; }
    if (run.ducking) gravity *= FAST_FALL;
    run.vy -= gravity * t;
    run.y += run.vy * t;
    run.air += t;
    if (run.y <= 0) {
      run.y = 0; run.vy = 0; run.air = -1;
      emit(run, E.LAND, run.d);
      if (!stopped && run.t - run.jumpAt <= BUFFER) takeOff(run);
    }
  }

  const left = run.d + KID_X - HALF, right = run.d + KID_X + HALF;
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.x > right) break;
    if (piece.state !== AHEAD) continue;
    if (piece.x + piece.w < left) {
      piece.state = PASSED;
      if (!isPickup(piece.kind) && piece.w > 0) {
        run.cleared++; run.streak++;
        if (run.streak > run.bestStreak) run.bestStreak = run.streak;
        if (piece.boss && run.bossLeft > 0) { run.bossLeft--; emit(run, E.BOSS, piece.x); }
      }
      continue;
    }
    if (!touches(run, piece)) continue;
    if (piece.kind === TIFFIN) { piece.state = TAKEN; run.tiffin = true; emit(run, E.TIFFIN, piece.x); continue; }
    if (piece.kind === PAGE) { piece.state = TAKEN; run.pages++; emit(run, E.PAGE, piece.x); continue; }
    if (run.t < run.safeUntil) continue;
    piece.state = HIT; run.hitKind = piece.kind; run.streak = 0;
    if (run.endless) {
      if (run.tiffin) { run.tiffin = false; run.saves++; run.safeUntil = run.t + SHIELD_TIME; emit(run, E.SAVED, piece.x); continue; }
      end(run, CRASHED, E.CRASH, piece.x);
      return;
    }
    // On a level a bump is a stumble: the kid trips and loses a little time to the bell.
    run.stumbles++; run.stumbleAt = run.t; run.safeUntil = run.t + SAFE; run.jumpAt = -9; run.duckUntil = -9;
    if (piece.boss && run.bossLeft > 0) { run.bossLeft--; emit(run, E.BOSS, piece.x); }
    emit(run, E.STUMBLE, piece.x);
    break;
  }
  // Forget pieces that have scrolled off the left edge.
  while (run.first < run.count && pieceAt(run, run.first).x + pieceAt(run, run.first).w < run.d - 60) run.first++;

  // Edge pointers: a tyre's warning gets its own sound once.
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.x - run.d > W + 400) break;
    if (piece.seen || piece.state !== AHEAD || piece.w <= 0 || isPickup(piece.kind)) continue;
    if (piece.vx <= 0 && run.nominal < POINTER_SPEED) continue;
    const soon = enterIn(run, index);
    if (soon < LEAD) { piece.seen = 1; if (piece.vx > 0) emit(run, E.WARN, piece.x); }
  }

  const meters = Math.floor(run.d / UNIT);
  if (meters !== run.meters) {
    if (run.endless) {
      if (!run.gate && meters >= run.gateM) { run.gate = true; emit(run, E.GATE_M, run.d); }
      else if (Math.floor(meters / 100) > Math.floor(run.meters / 100)) emit(run, E.MILESTONE, run.d);
      run.meters = meters;
    } else if (meters >= run.gateM) {
      run.meters = run.gateM;
      end(run, ARRIVED, E.ARRIVE, run.d);
      return;
    } else run.meters = meters;
  }
  if (run.endless) return;
  if (run.t >= run.bell) { end(run, LATE, E.LATE, run.d); return; }
  // Running late: at full speed from here the kid wouldn't beat the bell by LATE_MARGIN. The clock ticks each second then.
  const at = meters < run.gateM ? meters : run.gateM;
  const need = run.remain[at] - (run.d / UNIT - at) * UNIT / (run.nominal > 1 ? run.nominal : 1) + (stopped ? STOP - since + RISE / 2 : 0);
  run.late = need > run.bell - run.t - LATE_MARGIN;
  const second = Math.floor(run.bell - run.t);
  if (second !== run.tickAt) { if (run.late && run.tickAt >= 0) emit(run, E.TICK, second); run.tickAt = second; }
}

