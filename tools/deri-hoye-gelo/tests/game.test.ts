// The run's rules against the pure simulation: the road, jumping and ducking, the stumble and the bell, the pickups, the
// finale's notches, the endless road kept exactly, and the edge pointers. The bots play in bot.ts.
import assert from "node:assert/strict";
import test from "node:test";
import {
  AHEAD, airAbove, BASKET, BIKE, BRANCH, COW, DUCK_H, DUCK_MIN, GATE_M, GRAVITY, HALF, HIT, isOver, JUMP_V, KID_H, KID_X, LINE, MUD, PAGE, planRoad, PUDDLE,
  SPEC, speedAt, START, TIFFIN, TIRE, TOP, UNIT, zoneOf, type Piece,
} from "../lib/course";
import {
  ARRIVED, createRun, CRASHED, E, END, grounded, LATE, OVER, pieceAt, pressDuck, pressJump, READY, releaseAll, releaseDuck, releaseJump, RUN,
  SAFE, STOP, touches, type Run,
} from "../lib/game";
import { LEVELS } from "../lib/levels";
import { enterIn, LEAD, stepRun } from "../lib/step.hot";
import { bumpLine } from "../lib/link";
import { CASUAL, play, SKILLED } from "./bot";

const DT = 1 / 60;
const APEX = JUMP_V / GRAVITY;

function events(run: Run) { return Array.from({ length: run.evCount }, (_, at) => run.ev[at]); }
/** Steps once and returns the events that step made. */
function stepOnce(run: Run, slow = false) { run.evCount = 0; stepRun(run, DT, slow); return events(run); }

/** Presses once so the run starts, as the first press does. */
function started(seed: number, level: number, mode: "e" | "n" | "h" = "n") {
  const run = createRun(seed, level, mode);
  pressJump(run); releaseJump(run); stepOnce(run);
  assert.equal(run.phase, RUN);
  stepOnce(run); // lays the road
  return run;
}

/** A steady player for the endless road: jumps so the apex is over each ground thing, ducks just before each hanging one. */
function nextThing(run: Run) {
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.kind !== TIFFIN && piece.state === AHEAD && piece.x + piece.w >= run.d + KID_X - HALF) return piece;
  }
  return null;
}
function steady(run: Run, late = 0, thumb = 0) {
  if (run.jumpHeld && run.t - run.jumpAt >= thumb) releaseJump(run);
  const piece = nextThing(run);
  if (!piece) return;
  const kid = run.d + KID_X;
  if (isOver(piece.kind)) {
    const arrive = (piece.x - (kid + HALF)) / run.speed;
    if (!run.duckHeld && arrive <= 0.1 - late) pressDuck(run);
    if (run.duckHeld && piece.x + piece.w < kid - HALF) releaseDuck(run);
  } else if (grounded(run) && !run.jumpHeld && (piece.x + piece.w / 2 - kid) / run.speed <= APEX - late) {
    pressJump(run);
    if (!thumb) releaseJump(run);
  }
}
function drive(run: Run, meters: number, player: (run: Run) => void, slow = false) {
  for (let steps = 0; run.phase !== OVER && run.d < meters * UNIT && steps < 400_000; steps++) { if (run.phase === RUN) player(run); stepOnce(run, slow); }
  return run;
}
function put(run: Run, piece: Partial<Piece>) {
  const slot = pieceAt(run, run.first);
  Object.assign(slot, { kind: PUDDLE, x: run.d + KID_X - 4, w: 20, h: 4, y: 0, state: AHEAD, hint: 0, vx: 0, boss: 0, seen: 0 }, piece);
  return slot;
}

test("the same seed, level and presses give the same run; another seed lays another road", () => {
  assert.deepEqual(planRoad(4821, 1500), planRoad(4821, 1500));
  assert.notDeepEqual(planRoad(4821, 1500), planRoad(4822, 1500));
  for (const level of [0, 3, 8, 12]) {
    const first = play(77, level, "n", SKILLED), second = play(77, level, "n", SKILLED);
    assert.deepEqual([first.won, first.time, first.stumbles, first.pages, first.run.d], [second.won, second.time, second.stumbles, second.pages, second.run.d]);
  }
});

test("ধীরে খেলো lays the same road and runs the same bell on the run's own clock (the screen just takes 1/0.7 as long)", () => {
  const level = 7, fast = play(31, level, "n", SKILLED), slow = play(31, level, "n", SKILLED, true);
  assert.equal(slow.won, fast.won);
  assert.ok(Math.abs(slow.time - fast.time) < 0.05, `the run's own clock is the same: ${slow.time} vs ${fast.time}`);
  assert.equal(slow.stumbles, fast.stumbles);
  assert.equal(slow.pages, fast.pages);
  assert.equal(slow.run.bell, fast.run.bell, "the bell is in run seconds, so it is the same bell");
});

test("the first press starts the run and the bell; it doesn't jump, and nothing moves before it", () => {
  const run = createRun(5, 1);
  for (let at = 0; at < 120; at++) stepOnce(run);
  assert.deepEqual([run.phase, run.t, run.d], [READY, 0, 0], "the ready screen waits");
  pressJump(run); releaseJump(run);
  assert.deepEqual(stepOnce(run), [E.START]);
  assert.equal(run.phase, RUN);
  assert.equal(run.y, 0, "the starting press is not a jump");
  stepOnce(run);
  assert.ok(run.t > 0 && run.d > 0);
});

test("speed starts gentle, climbs slowly and is capped; every level's speed climbs from its start to its top", () => {
  assert.equal(speedAt(0), START);
  assert.ok(speedAt(500) > speedAt(100) && speedAt(500) < speedAt(1000));
  assert.equal(speedAt(1_000_000), TOP);
  const run = started(1, 12);
  const first = run.nominal;
  drive(run, 200, steady);
  assert.ok(run.nominal > first);
  for (const def of LEVELS) assert.ok(def.top >= def.speed);
});

test("jumps: a tap jumps, holding goes higher, a jump pressed just before landing still happens, a quick duck takes a jump back", () => {
  const apex = (hold: boolean) => {
    const run = started(3, 1);
    pressJump(run);
    if (!hold) releaseJump(run);
    let top = 0;
    for (let index = 0; index < 120; index++) { stepOnce(run); top = Math.max(top, run.y); }
    return top;
  };
  const tap = apex(false), held = apex(true);
  assert.ok(Math.abs(tap - JUMP_V ** 2 / (2 * GRAVITY)) < 6, `tap apex ${tap}`);
  assert.ok(held > tap + 30, `held ${held} vs ${tap}`);

  const buffered = started(3, 1);
  pressJump(buffered); releaseJump(buffered);
  while (buffered.vy >= 0 || buffered.y > 8) stepOnce(buffered);
  pressJump(buffered); releaseJump(buffered);
  for (let index = 0; index < 10 && !grounded(buffered); index++) stepOnce(buffered);
  for (let index = 0; index < 3; index++) stepOnce(buffered);
  assert.ok(buffered.y > 0, "jumped again on landing");

  const rewind = started(3, 1);
  pressJump(rewind); stepOnce(rewind); stepOnce(rewind);
  assert.ok(rewind.y > 0);
  pressDuck(rewind);
  assert.equal(rewind.y, 0, "a swipe starts as a touch, and the touch's jump is taken back");
  stepOnce(rewind);
  assert.equal(rewind.ducking, true);
  releaseDuck(rewind);
  for (let at = 0; at < Math.round((DUCK_MIN - 0.1) / DT); at++) stepOnce(rewind);
  assert.equal(rewind.ducking, true, "a quick duck tap stays low");
  for (let at = 0; at < 20; at++) stepOnce(rewind);
  assert.equal(rewind.ducking, false);
});

test("a jump answers on the very next step (inside the 50 ms budget)", () => {
  const run = started(9, 1);
  pressJump(run);
  const made = stepOnce(run);
  assert.deepEqual(made, [E.JUMP]);
  assert.ok(run.y > 5, `the kid is already ${run.y.toFixed(1)} units up after one step (${(DT * 1000).toFixed(0)} ms)`);
  const duck = started(9, 1);
  pressDuck(duck);
  stepOnce(duck);
  assert.equal(duck.ducking, true);
  assert.ok(DT * 1000 < 50);
});

test("collisions: low feet bump ground things, high feet clear them; standing bumps hanging things, ducking clears them", () => {
  const run = started(1, 1), slot = put(run, { kind: COW, h: SPEC[COW].h });
  assert.equal(touches(run, slot), true);
  run.y = SPEC[COW].h - 0.1; assert.equal(touches(run, slot), true);
  run.y = SPEC[COW].h; assert.equal(touches(run, slot), false);
  run.y = 0;
  slot.kind = LINE; slot.h = SPEC[LINE].h;
  run.ducking = false; assert.equal(touches(run, slot), true, "standing under the গামছা");
  run.ducking = true; assert.equal(touches(run, slot), false, "ducked under it");
  run.y = 10; assert.equal(touches(run, slot), true, "jumping into it");
  assert.ok(DUCK_H < SPEC[LINE].h && KID_H > SPEC[LINE].h && DUCK_H < SPEC[BRANCH].h);
  slot.kind = TIFFIN; slot.y = 62; slot.h = 14; run.y = 0; run.ducking = false;
  assert.equal(touches(run, slot), false, "a high tiffin box needs a jump");
  run.y = 40; assert.equal(touches(run, slot), true);
});

test("a level's bump is a stumble, not the end: the kid stops 0.45 s, nothing hits for 1.1 s, and the bell loses about 0.7 s", () => {
  const run = started(1, 5), slot = put(run, { kind: BIKE, w: SPEC[BIKE].w, h: SPEC[BIKE].h });
  const before = run.d;
  assert.ok(stepOnce(run).includes(E.STUMBLE));
  assert.deepEqual([run.phase, run.stumbles, run.hitKind, slot.state], [RUN, 1, BIKE, HIT]);
  assert.match(bumpLine(BIKE), /সাইকেল/);
  const stuck = run.d;
  for (let at = 0; at < Math.round(STOP / DT) - 3; at++) stepOnce(run);
  assert.ok(Math.abs(run.d - stuck) < 1, "stopped while down");
  assert.ok(stuck >= before);
  // Inside the safe second a second bump does nothing; after it, it counts.
  Object.assign(slot, { state: AHEAD, x: run.d + KID_X - 4 });
  stepOnce(run);
  assert.equal(run.stumbles, 1);
  while (run.t < run.safeUntil + 0.05) stepOnce(run);
  Object.assign(slot, { state: AHEAD, x: run.d + KID_X - 4 });
  stepOnce(run);
  assert.equal(run.stumbles, 2);
  assert.ok(SAFE > STOP);
});

test("a stumbled kid can't jump or duck while down, and a press then does not wait in the buffer", () => {
  const run = started(1, 5);
  put(run, { kind: BIKE, w: SPEC[BIKE].w, h: SPEC[BIKE].h });
  stepOnce(run);
  pressJump(run); stepOnce(run);
  assert.equal(run.y, 0);
  for (let at = 0; at < 80; at++) stepOnce(run);
  assert.equal(run.y, 0, "the press made while down is not remembered");
});

test("reaching the gate before the bell ends the run as arrived; the bell ringing first ends it late", () => {
  const won = play(5, 1, "n", SKILLED);
  assert.equal(won.run.endKind, ARRIVED);
  assert.equal(won.meters, LEVELS[0].gate);
  const lost = play(5, 12, "n", { ...SKILLED, crash: 5 });
  assert.equal(lost.run.endKind, LATE);
  assert.ok(lost.meters < LEVELS[11].gate, "the gate was still ahead");
  assert.ok(lost.run.t >= lost.run.bell - 0.02);
  // The end plays out before the screen: END for a moment, then OVER, with ARRIVE or LATE seen once.
  const run = started(5, 1);
  let seen: number[] = [];
  for (let at = 0; run.phase !== OVER && at < 60 * 60; at++) { steady(run); seen = seen.concat(stepOnce(run)); }
  assert.equal(seen.filter(kind => kind === E.ARRIVE).length, 1);
  assert.equal(seen.filter(kind => kind === E.OVER).length, 1);
  assert.equal(seen.filter(kind => kind === E.LATE).length, 0);
});

test("running late is reported only when the gate can't be reached with 1.2 s to spare: never on a clean run, once the stumbles use up the bell's slack", () => {
  // A clean run is never late, on any level, in any mode, with the road's own speed-up counted.
  for (let level = 1; level <= LEVELS.length; level++) for (const mode of ["e", "n", "h"] as const) {
    assert.equal(play(3, level, mode, SKILLED).lateSeen, false, `level ${level} ${mode}: a clean run showed the orange edge`);
  }
  // Each mode's stumbles (the promise) are the last ones before the edge: the one after them lights it.
  const allowed = { e: 5, n: 2, h: 1 } as const;
  for (const mode of ["e", "n", "h"] as const) for (const level of [4, 12]) {
    const within = play(5, level, mode, { ...SKILLED, crash: allowed[mode] - 1 });
    assert.equal(within.lateSeen, false, `${mode} level ${level}: still fine one stumble before the limit`);
    const edge = play(5, level, mode, { ...SKILLED, crash: allowed[mode] + 1 });
    assert.equal(edge.lateSeen, true, `${mode} level ${level}: late edge shows by the stumble past the limit`);
    assert.ok(edge.lateAt <= allowed[mode] + 1);
  }
  // The clock ticks each second while late, until the bell.
  const run = started(8, 12);
  let ticks = 0, lateAt = -1;
  for (let at = 0; run.phase === RUN && at < 60 * 80; at++) {
    run.jumpHeld = false;
    const made = stepOnce(run);
    ticks += made.filter(kind => kind === E.TICK).length;
    if (run.late && lateAt < 0) lateAt = run.t;
  }
  assert.ok(lateAt >= 0 && lateAt < run.bell, "walking into everything: the orange edge shows before the bell");
  assert.ok(ticks >= 3, `${ticks} ticks while late`);
});

test("pickups: a page and a tiffin box are taken, not bumped; the page counts, once", () => {
  const page = started(2, 2);
  put(page, { kind: PAGE, w: 18, h: 16, y: 0 });
  assert.deepEqual(stepOnce(page), [E.PAGE]);
  assert.equal(page.pages, 1);
  assert.equal(page.stumbles, 0);
  const box = started(2, 2);
  put(box, { kind: TIFFIN, w: 16, h: 14, y: 6 });
  stepOnce(box);
  assert.equal(box.tiffin, true);
});

test("a finale's thing, bumped or cleared, takes a notch off the bar; the bar empties exactly once", () => {
  for (const level of [4, 8, 12]) {
    const def = LEVELS[level - 1];
    const run = play(7, level, "n", SKILLED).run;
    assert.equal(run.bossMax, def.finale!.count);
    assert.equal(run.bossLeft, 0, `level ${level}: the bar is empty at the gate`);
    const sloppy = play(7, level, "n", { ...SKILLED, crash: 1 }).run;
    assert.ok(sloppy.bossLeft >= 0 && sloppy.bossLeft <= sloppy.bossMax);
  }
  assert.equal(createRun(1, 2).bossMax, 0, "a plain level has no bar");
  assert.equal(createRun(1, 0).bossMax, 0);
});

test("edge pointers: a rolling tyre is announced before it is on screen, and each warning is made once", () => {
  const run = started(21, 7);
  let warned = 0, early = true;
  for (let at = 0; run.phase === RUN && at < 60 * 60; at++) {
    steady(run);
    for (let index = run.first; index < run.count; index++) {
      const piece = pieceAt(run, index);
      if (piece.kind === TIRE && piece.state === AHEAD && enterIn(run, index) < LEAD && piece.seen === 0 && piece.x - run.d > 360) early = false;
    }
    const made = stepOnce(run);
    warned += made.filter(kind => kind === E.WARN).length;
  }
  assert.ok(warned >= 1, "at least one tyre warned");
  assert.ok(early, "the pointer is on by the time a tyre is within its lead");
});

test("every level's road is fair: the shortest tap clears every ground thing, one duck tap passes every hanging thing", () => {
  for (let level = 1; level <= LEVELS.length; level++) {
    const def = LEVELS[level - 1];
    for (const seed of [1, 2, 3, 4242, 99991]) {
      const road = planRoad(seed, def.gate, def), things = road.filter(piece => piece.kind !== PAGE && piece.kind !== TIFFIN && piece.w > 0);
      for (const piece of things) {
        const speed = def.top + def.sprint;
        if (!isOver(piece.kind)) {
          if (piece.vx > 0) continue;
          const spare = airAbove(piece.h) - (piece.w + 2 * HALF) / (piece.kind === MUD ? speed : speed);
          // Wide mud and tall things need a hold; the shortest tap must clear everything else.
          if (piece.kind !== MUD && piece.w <= 60) assert.ok(spare >= 0.04, `level ${level} seed ${seed}: kind ${piece.kind} spare ${spare.toFixed(3)} s`);
        } else assert.ok((piece.w + 2 * HALF) / def.speed < DUCK_MIN + 0.3, `level ${level}: a hanging thing is passed with a duck`);
      }
      for (let index = 1; index < things.length; index++) {
        const before = things[index - 1], piece = things[index];
        if (piece.vx > 0 || before.vx > 0) continue;
        const gap = (piece.x - before.x - before.w) / (def.top + def.sprint);
        assert.ok(gap >= 0.38, `level ${level} seed ${seed}: ${gap.toFixed(2)} s between things`);
      }
    }
  }
});

/* ---------- যত দূর পারো: the original endless road, kept exactly ---------- */

test("যত দূর পারো: easy start, the first duck is taught, nothing at the gate, every jump clearable with the shortest tap", () => {
  for (let seed = 1; seed <= 300; seed++) {
    const road = planRoad(seed, 3000);
    const things = road.filter(piece => piece.kind !== TIFFIN);
    assert.equal(things[0].kind, PUDDLE, `seed ${seed}: a puddle comes first`);
    assert.equal(things[0].hint, 1);
    assert.ok(things[0].x >= 25 * UNIT);
    const firstDuck = things.find(piece => isOver(piece.kind))!;
    assert.equal(firstDuck.hint, 2, `seed ${seed}: the first hanging thing says "নিচু হও"`);
    assert.ok(firstDuck.x / UNIT >= 120 && firstDuck.x / UNIT < 300);
    for (const piece of things) {
      const meters = piece.x / UNIT;
      if (meters < 120) assert.ok(piece.kind === PUDDLE || piece.kind === BASKET, `seed ${seed}: only puddles and baskets early`);
      if (piece.kind === COW || piece.kind === BRANCH) assert.ok(meters >= 220);
      assert.ok(piece.x + piece.w <= (GATE_M - 15) * UNIT || piece.x >= (GATE_M + 15) * UNIT, `seed ${seed}: the gate is clear`);
      if (!isOver(piece.kind)) assert.ok(airAbove(piece.h) - (piece.w + 2 * HALF) / START >= 0.09, `seed ${seed}: kind ${piece.kind}`);
      else assert.ok((piece.w + 2 * HALF) / START < DUCK_MIN - 0.1, "one duck tap is long enough");
    }
    for (let index = 1; index < things.length; index++) {
      const before = things[index - 1], piece = things[index];
      assert.ok((piece.x - before.x - before.w) / speedAt(piece.x / UNIT) >= 0.7, `seed ${seed}: gap`);
    }
  }
});

test("যত দূর পারো: a steady player gets past the gate on every road, in slow mode too, a little early or late, with thumbs resting on the screen", () => {
  for (let seed = 1; seed <= 100; seed++) {
    for (const [slow, late, thumb] of [[false, 0, 0], [true, 0, 0], [false, 0.04, 0], [false, -0.04, 0], [false, 0, 0.1], [false, 0.03, 0.12], [true, 0, 0.1]] as const) {
      const run = drive(started(seed, 0), 2200, current => steady(current, late, thumb), slow);
      assert.notEqual(run.endKind, CRASHED, `seed ${seed} slow ${slow} late ${late} thumb ${thumb}: bumped into kind ${run.hitKind} at ${run.meters} m`);
      assert.ok(run.gate);
    }
  }
});

test("যত দূর পারো: one bump ends the run, a tiffin box saves exactly one, and a player who never presses stops at the first puddle", () => {
  const plain = started(3, 0), slot = put(plain, { kind: BIKE, w: SPEC[BIKE].w, h: SPEC[BIKE].h });
  stepOnce(plain);
  assert.deepEqual([plain.phase, plain.endKind, plain.hitKind, slot.state], [END, CRASHED, BIKE, HIT]);

  const saved = started(3, 0), box = put(saved, { kind: BASKET, w: SPEC[BASKET].w, h: SPEC[BASKET].h });
  saved.tiffin = true;
  assert.deepEqual(stepOnce(saved), [E.SAVED]);
  assert.deepEqual([saved.phase, saved.tiffin, saved.saves, box.state], [RUN, false, 1, HIT]);
  Object.assign(box, { state: AHEAD, x: saved.d + KID_X - 4 });
  stepOnce(saved);
  assert.equal(saved.phase, RUN, "still inside the forgiving second");
  saved.t += 2;
  Object.assign(box, { state: AHEAD, x: saved.d + KID_X - 4 });
  stepOnce(saved);
  assert.equal(saved.phase, END);

  const idle = drive(started(9, 0), 5000, () => {});
  assert.ok(idle.phase === END || idle.phase === OVER);
  assert.equal(idle.hitKind, PUDDLE);
  assert.ok(idle.meters >= 20 && idle.meters < 30, `${idle.meters}`);
});

test("যত দূর পারো: a random tapper ends sanely with a plausible score", () => {
  let state = 12345;
  const random = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let seed = 1; seed <= 30; seed++) {
    const run = drive(started(seed, 0), 5000, current => { const roll = random(); if (roll < 0.02) { pressJump(current); releaseJump(current); } else if (roll < 0.025) { pressDuck(current); releaseDuck(current); } });
    assert.equal(run.phase, OVER);
    assert.ok(run.meters >= 20 && run.meters < 1000, `seed ${seed}: ${run.meters}`);
    assert.ok(Number.isFinite(run.y) && run.y >= 0);
  }
});

test("the endless road's gate and milestones fire once; the village switches between lane and field every 400 m", () => {
  const run = createRun(2, 0);
  pressJump(run); releaseJump(run); stepOnce(run); stepOnce(run);
  let gate = 0, miles = 0;
  for (let at = 0; run.phase === RUN && run.d < 1010 * UNIT; at++) { steady(run); const made = stepOnce(run); gate += made.filter(kind => kind === E.GATE_M).length; miles += made.filter(kind => kind === E.MILESTONE).length; }
  assert.equal(gate, 1);
  assert.ok(miles >= 8);
  assert.deepEqual([zoneOf(0), zoneOf(399), zoneOf(400), zoneOf(800), zoneOf(1000)], [0, 0, 1, 0, 0]);
});

test("letting go clears a held jump or duck and any press waiting in the buffer", () => {
  const run = started(4, 1);
  pressJump(run); pressDuck(run);
  releaseAll(run);
  assert.deepEqual([run.jumpHeld, run.duckHeld, run.jumpAt < -1, run.duckUntil < -1], [false, false, true, true]);
  stepOnce(run);
  assert.equal(run.y, 0);
  assert.equal(run.ducking, false);
});
