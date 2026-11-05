// The crossing's per-step rules: hops, the current carrying you, splashes, mangoes, the ghat. No allocation here (createRun is in run.ts).
// Time only comes in through stepRun(run, dt); the component decides when it may pass (lib/session.ts).
import {
  dipOf, floaterAt, ferryMask, leftOf, mangoX, target, ARRIVED, BLOCKED, COLS, DANGER, EDGE, EDGY, FERRY_IN, HOPPED, HOP_T, MANGO, NEAR, PANA, RESPAWNED, SPLASHED, WATER,
} from "./river";
import type { Run } from "./run";

/** The current carries you to the edge in less than this many seconds: the edge starts to glow. */
export const DANGER_S = 1.6;

/** A tap or swipe. During a hop it waits for the landing (one is kept). Returns whether anything will happen. */
export function act(run: Run, action: number) {
  if (run.done || run.down > 0 || run.falling) return false;
  if (run.hop > 0) { run.queued = action; return true; }
  return hop(run, action);
}

function hop(run: Run, action: number) {
  const landing = target(run.river, run.row, run.x, action);
  if (!landing || (landing[0] === run.row && landing[1] === run.x)) { run.events |= BLOCKED; return false; }
  const row = landing[0], x = landing[1], lane = run.river.lanes[row];
  run.fromRow = run.row; run.fromX = run.x; run.row = row; run.x = x; run.hop = HOP_T;
  run.chain = run.t - run.lastHop < 0.75 ? run.chain + 1 : 1;
  if (run.chain > run.bestChain) run.bestChain = run.chain;
  run.lastHop = run.t;
  run.hops += 1;
  run.events |= HOPPED;
  if (lane.type !== WATER) { run.surface = 0; run.safeRow = row; run.safeX = x; return true; }
  const index = floaterAt(lane, x, run.t, run.grip);
  if (index < 0) { run.falling = true; return true; }
  const floater = lane.floaters[index];
  run.surface = floater.kind;
  if (floaterAt(lane, x, run.t, -0.05) < 0) {
    // Landed just past an end: the boy slides onto the floater instead of standing on water.
    const left = leftOf(lane, floater, run.t);
    run.x = Math.min(left + floater.len - 0.2, Math.max(left + 0.2, x));
    run.events |= EDGY;
  }
  return true;
}

function splash(run: Run, near: boolean) {
  run.splashes += 1; run.splashRow = run.row; run.splashX = run.x;
  run.falling = false; run.hop = 0; run.queued = 0; run.chain = 0;
  run.down = run.respawn; run.edge = 0; run.edgeSide = 0; run.sink = 0;
  run.events |= SPLASHED | (near ? NEAR : 0);
}

function collect(run: Run) {
  const mangoes = run.river.mangoes;
  for (let index = 0; index < mangoes.length; index++) {
    const mango = mangoes[index];
    if (run.taken & (1 << index) || mango.row !== run.row) continue;
    if (Math.abs(mangoX(run.river, mango, run.t) - run.x) < 0.7) { run.taken |= 1 << index; run.got += 1; run.events |= MANGO; }
  }
}

/** How close the current is to carrying the boy off the screen, and a sinking কচুরিপানা under him. Sets run.edge, run.edgeSide and run.sink; raises DANGER on the way in. */
function sense(run: Run) {
  const lane = run.river.lanes[run.row];
  let edge = 0, side = 0, sink = 0;
  if (lane.type === WATER && !run.falling && run.down <= 0 && lane.speed > 0) {
    const room = lane.dir < 0 ? run.x + EDGE : COLS + EDGE - run.x, seconds = room / lane.speed;
    if (seconds < DANGER_S) { edge = 1 - Math.max(0, seconds) / DANGER_S; side = lane.dir; }
    const index = floaterAt(lane, run.x, run.t, run.grip);
    if (index >= 0 && lane.floaters[index].kind === PANA) sink = dipOf(lane.floaters[index], run.t);
  }
  if (edge > 0 && run.edge === 0) run.events |= DANGER;
  run.edge = edge; run.edgeSide = side; run.sink = sink;
}

/** Moves the river and the boy on by dt seconds. */
export function stepRun(run: Run, dt: number) {
  if (run.done) return;
  const river = run.river, top = river.lanes.length - 1;
  run.t += dt;
  if (river.ferry) { const mask = ferryMask(river, run.t); if (mask & ~run.ferryOn) run.events |= FERRY_IN; run.ferryOn = mask; }
  if (run.down > 0) {
    run.down -= dt;
    if (run.down <= 0) { run.down = 0; run.row = run.fromRow = run.safeRow; run.x = run.fromX = run.safeX; run.surface = 0; run.events |= RESPAWNED; }
    return;
  }
  if (run.hop > 0) {
    run.hop -= dt;
    if (run.hop <= 0) {
      run.hop = 0;
      if (run.falling) {
        // A miss by a hair gets a kinder word.
        splash(run, floaterAt(river.lanes[run.row], run.x, run.t, run.grip + 0.35) >= 0);
        return;
      }
      if (run.row === top) { run.done = true; run.time = run.t; run.events |= ARRIVED; run.edge = 0; run.sink = 0; return; }
      collect(run); // on landing, even when the next hop is already waiting
      if (run.queued) { const next = run.queued; run.queued = 0; hop(run, next); if (run.falling) return; }
    }
  }
  if (run.falling) return;
  const lane = river.lanes[run.row];
  if (lane.type === WATER) {
    run.x += lane.dir * lane.speed * dt;
    if (run.x < -EDGE || run.x > COLS + EDGE || floaterAt(lane, run.x, run.t, run.grip) < 0) { splash(run, false); return; }
  }
  if (run.hop === 0) collect(run);
  sense(run);
}

/** Hands over what happened since the last call and clears it. */
export function drain(run: Run) { const events = run.events; run.events = 0; return events; }
