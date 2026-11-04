// The rules, one at a time: the clock waits, the tells, the catch, the throw, the second watcher, the dark, the finale, and the
// old ladder playing exactly as it did.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { atThrow } from "../lib/bot";
import {
  AWAY, BACK, BLIND, BY_WATCHER, COUGH, createGame, DARK, FLICK, LAST, LENS, LOOK, makeClass, PEEK, TELL, W_LOOK, W_TELL, WIPE, WRITE, benchesReached, type Game,
} from "../lib/class";
import { oldClass } from "../lib/legacy";
import { SCOLD, THROW_TIME } from "../lib/levels";
import { CLOSE, lookAround, stepGame } from "../lib/step.hot";

const DT = 1 / 60;
/** Lets time pass with the finger up until `done` holds (the clock starts on a first press that is let go at once). */
function until(g: Game, done: (g: Game) => boolean, limit = 60 * 120) {
  if (g.phase === "ready") stepGame(g, true, DT);
  for (let i = 0; i < limit && !done(g); i++) stepGame(g, false, DT);
  assert.ok(done(g), "the moment came");
  return g;
}
const game = (level: number, seed = 5) => createGame(makeClass(seed, level));
const kind = (g: Game) => g.klass.kinds[g.seg];

test("the same seed gives the same class; another seed gives another", () => {
  const a = makeClass(42, 6), b = makeClass(42, 6), c = makeClass(43, 6);
  assert.deepEqual(a, b);
  assert.notDeepEqual(Array.from(a.durs), Array.from(c.durs));
  assert.notDeepEqual(Array.from(makeClass(42, 6).durs), Array.from(makeClass(42, 7).durs));
});

test("every routine is fair: a calm start, a real warning before every look, and every look is answered by writing", () => {
  for (let level = 1; level <= 12; level++) for (const seed of [1, 99, 7919, 123457]) {
    const k = makeClass(seed, level);
    assert.equal(k.kinds[0], WRITE);
    assert.ok(k.durs[0] >= 2.5, `level ${level}: the first stretch of writing is calm`);
    for (let i = 0; i < k.kinds.length; i++) {
      assert.ok(k.durs[i] > 0.3, `no blink-and-miss segment (${level}/${seed}/${i} = ${k.durs[i]})`);
      if (k.kinds[i] !== LOOK) continue;
      const before = k.kinds[i - 1];
      assert.ok(before === TELL || before === LENS || before === BACK, `level ${level} seed ${seed}: look ${i} follows kind ${before}`);
      if (i + 1 < k.kinds.length && k.kinds[i + 1] !== BACK && k.kinds[i + 1] !== LENS) assert.equal(k.kinds[i + 1], WRITE);
    }
    assert.ok(k.durs.reduce((a, b) => a + b, 0) >= 700, "enough routine for a phone left open");
  }
});

test("the clock and the teacher wait for the first press; the chit moves only while held", () => {
  const g = game(1);
  for (let i = 0; i < 300; i++) stepGame(g, false, DT);
  assert.equal(g.phase, "ready");
  assert.equal(g.time, 0);
  assert.equal(g.seg, 0);
  assert.equal(g.segT, 0);
  stepGame(g, true, DT);
  assert.equal(g.phase, "playing");
  assert.ok(g.moving && g.pos > g.klass.from);
  const at = g.pos;
  stepGame(g, false, DT);
  assert.equal(g.pos, at);
  assert.equal(g.moving, false);
});

test("moving while they write, cough, peek or wipe their glasses is fine; moving while they look is caught", () => {
  // Level 3 has coughs and peeks, level 5 the glasses; hold at each safe moment and release before the next warning.
  for (const [level, wanted] of [[2, COUGH], [3, PEEK], [5, BLIND], [6, WIPE]] as const) {
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed++) {
      const g = game(level, seed);
      try { until(g, x => kind(x) === wanted && x.segT > 0.05, 60 * 100); } catch { continue; }
      if (g.klass.kinds[g.seg] !== wanted) continue;
      const before = g.catches;
      stepGame(g, true, DT);
      assert.equal(g.catches, before, `level ${level}: ${wanted} is not a look`);
      assert.ok(g.moving);
      assert.equal(g.watched, false);
      found = true;
    }
    assert.ok(found, `found a ${wanted} on level ${level}`);
  }
  const g = game(1);
  until(g, x => kind(x) === LOOK && x.segT >= x.klass.grace + DT);
  assert.equal(g.watched, true);
  stepGame(g, true, DT);
  assert.equal(g.catches, 1);
});

test("the turn itself is not yet a look: moving in the first moments of it (the grace) is safe", () => {
  const g = game(1);
  until(g, x => kind(x) === LOOK && x.segT < DT * 2);
  assert.ok(g.segT < g.klass.grace);
  stepGame(g, true, DT);
  assert.equal(g.catches, 0);
  assert.ok(g.dangerIn > 0 && g.dangerIn <= g.klass.grace);
});

test("a catch is gentle: a raised eyebrow, one bench back, a finger lift, then the teacher is writing again", () => {
  const g = game(1);
  // Carry the chit two benches on, then walk it into a look.
  while (g.pos < g.klass.from + 2.2) { if (kind(g) === WRITE) stepGame(g, true, DT); else stepGame(g, false, DT); }
  until(g, x => kind(x) === LOOK && x.segT > x.klass.grace + DT);
  const bench = Math.floor(g.pos);
  stepGame(g, true, DT);
  assert.equal(g.catches, 1);
  assert.equal(g.scold, SCOLD);
  assert.equal(g.backTo, bench - g.klass.back);
  assert.ok(g.needRelease);
  for (let i = 0; i < SCOLD * 60 + 5; i++) stepGame(g, true, DT);
  assert.equal(g.pos, g.backTo);
  assert.equal(kind(g), WRITE, "the teacher turned back to the board");
  assert.equal(g.segT < 0.2, true);
  const at = g.pos;
  stepGame(g, true, DT);
  assert.equal(g.pos, at, "still holding from before the catch: nothing moves until the finger lifts");
  stepGame(g, false, DT);
  stepGame(g, true, DT);
  assert.ok(g.pos > at);
});

test("the chit stops at the last bench and the class ends there", () => {
  const g = game(1);
  for (let i = 0; i < 60 * 300 && g.phase !== "over"; i++) stepGame(g, kind(g) === WRITE && !g.needRelease && g.scold === 0, DT);
  assert.equal(g.phase, "over");
  assert.ok(g.won);
  assert.equal(g.pos, LAST);
  assert.equal(benchesReached(g), 5);
  const time = g.time;
  stepGame(g, true, DT);
  assert.equal(g.time, time, "a finished class doesn't tick");
});

test("the walking speed is the level's, and a level's benches are its own", () => {
  assert.equal(makeClass(1, 1).from, 3);
  assert.equal(makeClass(1, 7).from, 0);
  const g = game(1);
  stepGame(g, true, 1);
  assert.ok(Math.abs(g.pos - (g.klass.from + 0.8)) < 1e-9);
});

test("a sleeping friend: the chit is thrown over, a throw can't be stopped, and one begun in a warning is caught", () => {
  const k = makeClass(1, 7);
  assert.ok(k.throwAt.some(Boolean));
  const g = createGame(k);
  // Walk, safely, until it waits at the throwing bench.
  for (let i = 0; i < 60 * 120 && !atThrow(g); i++) stepGame(g, kind(g) === WRITE && g.scold === 0 && !g.needRelease, DT);
  assert.ok(atThrow(g), "reached the sleeper");
  until(g, x => kind(x) === WRITE && x.segT < 0.3 && x.segT > 0.1);
  const from = Math.floor(g.pos);
  stepGame(g, true, DT);
  assert.ok(g.throwing);
  assert.equal(g.throwFrom, from);
  for (let i = 0; i < 5; i++) stepGame(g, false, DT);
  assert.ok(g.throwing || g.pos >= from + 2, "letting go doesn't stop a throw");
  for (let i = 0; i < 60; i++) stepGame(g, false, DT);
  assert.equal(g.throwing, false);
  assert.equal(g.pos, from + 2);
  assert.equal(g.throws, 1);
  assert.ok(Math.abs(THROW_TIME - 0.9) < 1e-9);

  const h = createGame(k);
  for (let i = 0; i < 60 * 120 && !atThrow(h); i++) stepGame(h, kind(h) === WRITE && h.scold === 0 && !h.needRelease, DT);
  until(h, x => kind(x) === TELL);
  stepGame(h, true, DT);
  assert.equal(h.catches, 0, "the warning isn't a look yet");
  for (let i = 0; i < 60 * 3 && h.catches === 0; i++) stepGame(h, true, DT);
  assert.equal(h.catches, 1, "a throw into the turn is caught, and slides back past the sleeper");
  assert.ok(!k.sleeper[h.backTo]);
});

test("a second pair of eyes: the captain straightens first, then looks; a catch by her says so", () => {
  const g = game(4);
  assert.equal(g.klass.watcher, "monitor");
  until(g, x => x.klass.wKinds[x.wSeg] === W_TELL && kind(x) === WRITE);
  lookAround(g);
  assert.ok(g.dangerIn > 0 && g.dangerIn < 1.2, "the straightening is the warning");
  until(g, x => x.klass.wKinds[x.wSeg] === W_LOOK && x.wT > x.klass.grace + DT && kind(x) === WRITE);
  assert.equal(g.watched, true, "the teacher writes, yet she sees");
  stepGame(g, true, DT);
  assert.equal(g.catches, 1);
  assert.equal(g.scoldBy, BY_WATCHER);
  for (let i = 0; i < SCOLD * 60 + 5; i++) stepGame(g, false, DT);
  assert.equal(g.klass.wKinds[g.wSeg], AWAY, "after a scolding she looks away too");
});

test("load-shedding: nobody sees in the dark, and the flicker warns that the light is back", () => {
  const g = game(9);
  until(g, x => x.klass.dKinds[x.dSeg] === DARK && kind(x) === LOOK, 60 * 700);
  assert.equal(g.watched, false, "a look in the dark sees nothing");
  stepGame(g, true, DT);
  assert.equal(g.catches, 0);
  assert.ok(g.braved >= 1, "moving through a look in the dark is brave");
  const h = game(9);
  until(h, x => x.klass.dKinds[x.dSeg] === FLICK && kind(x) === LOOK && x.segT > 0.5, 60 * 700);
  assert.ok(h.dangerIn >= 0, "the light comes back after the flicker");
  assert.equal(h.watched, false, "not yet");
});

test("a finale ends on the third catch; the chit goes to the teacher's table and the class does not count as won", () => {
  const g = game(4);
  for (let i = 0; i < 60 * 200 && g.phase !== "over"; i++) stepGame(g, g.klass.lives > 0 && !g.needRelease, DT);
  assert.equal(g.phase, "over");
  assert.equal(g.won, false);
  assert.equal(g.catches, 3);
  const plain = game(2);
  for (let i = 0; i < 60 * 60 && plain.phase !== "over"; i++) stepGame(plain, !plain.needRelease, DT);
  assert.ok(plain.catches > 3 || plain.won, "an ordinary level never ends early");
});

test("a stop just before a look is an \"অল্পের জন্য\", a stop far from one is not", () => {
  const g = game(1);
  until(g, x => kind(x) === WRITE && x.segT > 1);
  // Walk, then let go with the warning far away.
  stepGame(g, true, DT); stepGame(g, false, DT);
  assert.equal(g.close, 0);
  const h = game(1);
  until(h, x => kind(x) === TELL && x.segT >= h.klass.durs[h.seg] - 0.05);
  stepGame(h, true, DT);
  assert.ok(h.dangerIn <= h.klass.grace + 0.1);
  stepGame(h, false, DT);
  assert.equal(h.close, 1, `${CLOSE}`);
});

test("moving through a harmless cough or peek counts as brave once", () => {
  for (let seed = 1; seed < 40; seed++) {
    const g = game(3, seed);
    try { until(g, x => kind(x) === PEEK && x.segT > 0.05, 60 * 100); } catch { continue; }
    for (let i = 0; i < 20 && kind(g) === PEEK; i++) stepGame(g, true, DT);
    assert.equal(g.braved, 1);
    return;
  }
  assert.fail("no peek found");
});

test("the old ladder plays exactly as before: every old link replays the same class", () => {
  const strip = (seed: number) => { const { level, ...rest } = oldClass(seed); assert.equal(level, 5); return rest; };
  // Fingerprint of the original generator for four seeds, taken before the rewrite.
  assert.equal(createHash("sha256").update(JSON.stringify([48213, 1, 777, 999999999].map(strip))).digest("hex").slice(0, 16), "c704efe9b0233ff6");
  // The same input played through the old step and the new one gave these (measured side by side on the old code).
  const expected: Record<string, [number, number]> = { "48213/1": [243.95, 35], "777/1": [125.95, 18], "13/1": [137.88, 20] };
  for (const [key, [time, catches]] of Object.entries(expected)) {
    const [seed, level] = key.split("/").map(Number);
    const g = createGame(makeClass(seed, level, "n", true)), r = makeRng(seed + level * 31);
    let hold = false, steps = 0;
    while (g.phase !== "over" && steps++ < 60 * 300) { if (r() < 0.04) hold = !hold; stepGame(g, hold, DT); }
    assert.equal(g.time.toFixed(2), time.toFixed(2), key);
    assert.equal(g.catches, catches, key);
  }
  const old = makeClass(777, 5, "n", true);
  assert.equal(old.from, 0, "the old room had eight benches");
  assert.equal(old.speed, 0.75);
  assert.equal(old.lives, 0);
});
