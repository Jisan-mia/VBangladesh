// The shuttle's physics and the match rules, against the pure code.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, LEVEL_COUNT, starsOf, toNextStar, CLEAR, DROP, JUMP, SMASH } from "../lib/levels";
import { createMatch, press, release, ringShows, timeToContact, DOWN, FLY, FOG_RING, HIGH, PERFECT, SOFT, type Match } from "../lib/match";
import { fly, makeAir, makePath, strike, smash, BACK_R, DT, GROUND, HIGH_Y, LOW_Y, NET_TOP, NET_X, TERMINAL, windAt } from "../lib/physics";
import { advance } from "../lib/step.hot";
import { botMatch, CASUAL, SHARP } from "./bot";

const deg = Math.PI / 180;
const until = (m: Match, done: () => boolean, limit = 6000) => { for (let i = 0; i < limit && !done(); i++) { advance(m); m.evN = 0; } };
const incoming = (m: Match) => until(m, () => timeToContact(m) !== null && (timeToContact(m) ?? 1) <= DT / 2);

test("drag: a shuttle leaves fast, slows hard and falls near its terminal speed, almost straight down", () => {
  const p = makePath();
  fly(p, 0, 90, HIGH_Y, 900, -700, 0, null);
  // The last point is clipped at the ground, so read the speed one step before it.
  const last = p.landAt - 1, vx = (p.x[last] - p.x[last - 1]) / DT, vy = (p.y[last] - p.y[last - 1]) / DT;
  assert.ok(Math.abs(vy) > TERMINAL * 0.8 && Math.abs(vy) < TERMINAL * 1.05, `falls at ${vy}`);
  assert.ok(Math.abs(vx) < Math.abs(vy) * 0.6, "steep at the end");
  const early = (p.x[2] - p.x[1]) / DT;
  assert.ok(early > 3 * Math.abs(vx), "far faster off the racket than at the end");
});

test("the same seed and swings give the same match, a different seed a different one", () => {
  const a = botMatch(6, 31337, SHARP).m, b = botMatch(6, 31337, SHARP).m, c = botMatch(6, 31338, SHARP).m;
  assert.deepEqual([a.us, a.them, a.clock, a.stats], [b.us, b.them, b.clock, b.stats]);
  assert.notDeepEqual([a.clock, a.stats.hits], [c.clock, c.stats.hits]);
});

test("wind is air: it carries a high, slow shot far more than a smash, and the walls shelter the ground", () => {
  const air = makeAir(), p = makePath();
  const land = (wind: number, shot: (a: typeof air) => void) => { air.base = wind; shot(air); return p.landX; };
  const clear = (a: typeof air) => strike(p, 0, 90, HIGH_Y, 42 * deg, 318, 0, a), hard = (a: typeof air) => smash(p, 0, 90, HIGH_Y, 1350, 262, 0, a);
  const clearShift = land(30, clear) - land(0, clear), smashShift = land(30, hard) - land(0, hard);
  assert.ok(clearShift > 20, `a clear drifts ${clearShift}`);
  assert.ok(smashShift < clearShift / 2, `a smash drifts only ${smashShift}`);
  assert.ok(land(30, clear) > BACK_R, "with the wind behind, a full clear goes out");
  air.base = 0; air.gusts = 1; air.gustAt[0] = 1; air.gustLen[0] = 2; air.gustPow[0] = 40;
  assert.equal(windAt(air, 0.5), 0); assert.ok(windAt(air, 2) > 39); assert.equal(windAt(air, 3.5), 0);
});

test("geometry teaches the shots: a smash off a low ball goes into the net, off a high one it clears", () => {
  const p = makePath();
  smash(p, 0, 100, LOW_Y + 10, 1000, 196, 0, null);
  assert.ok(p.netAt >= 0, "a low smash nets");
  smash(p, 0, 100, HIGH_Y, 1350, 262, 0, null);
  assert.equal(p.netAt, -1);
  assert.ok(p.y[Math.round((NET_X - 100) / (p.x[3] - p.x[2]))] < NET_TOP + 40);
  assert.ok(p.landX > NET_X && p.landX <= BACK_R, `lands at ${p.landX}`);
});

test("every serve and every rival shot over many matches lands on the court or is a clear error, never under the net", () => {
  for (const level of [1, 5, 9, 12]) for (let seed = 1; seed <= 15; seed++) {
    const m = createMatch(seed, level);
    for (let i = 0; i < 60 * 120 && m.winner < 0; i++) {
      if (m.phase === FLY && m.i === 0 && m.path.from === 1) {
        const p = m.path;
        assert.ok(p.netAt >= 0 || p.out || p.contactAt >= 0, `level ${level}: a rival shot no one could reach`);
        if (p.contactAt >= 0) assert.ok(p.contactAt * DT >= 0.25, `level ${level}: ${p.contactAt * DT}s to react`);
      }
      if (timeToContact(m) !== null && (timeToContact(m) ?? 1) <= DT / 2 && press(m) === 1) release(m, HIGH);
      advance(m); m.evN = 0;
    }
  }
});

test("a touch is judged when it lands: gold on time, a miss far too early, and nothing for a practice swing", () => {
  const m = createMatch(7, 2);
  until(m, () => m.phase === FLY && m.path.from === 1);
  assert.equal(press(m), 0, "far too soon is a practice swing that doesn't count");
  incoming(m);
  assert.equal(press(m), 1);
  const i = m.i;
  advance(m); advance(m);
  assert.equal(m.i, i, "the shuttle hangs on the racket while the touch decides");
  release(m, DOWN);
  assert.equal(m.grade, PERFECT);
  assert.equal(m.kind, SMASH);
  assert.equal(m.path.from, 0);
});

test("a touch that never decides is played as a lift after 200 ms", () => {
  const m = createMatch(8, 1);
  incoming(m);
  assert.equal(press(m), 1);
  for (let k = 0; k < 12; k++) advance(m);
  assert.equal(m.pressAt, -1);
  assert.equal(m.path.from, 0);
});

test("a drop from the back lands short, just past the net", () => {
  const m = createMatch(9, 3);
  incoming(m);
  press(m); release(m, SOFT);
  assert.equal(m.kind, DROP);
  assert.ok(m.path.landX > NET_X && m.path.landX < NET_X + 70, `${m.path.landX}`);
});

test("fog hides the ring until the end", () => {
  const m = createMatch(3, 9);
  until(m, () => m.phase === FLY && m.path.from === 1 && m.i === 1);
  assert.equal(ringShows(m), false);
  until(m, () => (timeToContact(m) ?? 9) <= FOG_RING);
  assert.equal(ringShows(m), true);
});

test("finales play their named move when the bar fills", () => {
  const seen = new Set<number>();
  for (const level of [4, 8, 12]) for (let seed = 1; seed <= 6; seed++) {
    const { m } = botMatch(level, seed, SHARP);
    assert.ok(m.stats.specials >= 1, `level ${level} seed ${seed}: no named move`);
    assert.ok(m.stats.held <= m.stats.specials + 1);
    seen.add(level);
  }
  assert.equal(seen.size, 3);
  assert.equal(JUMP, 6);
});

test("stars by points given away, with easy capped at two", () => {
  assert.deepEqual([0, 1, 2].map(given => starsOf(given, 1)), [3, 2, 1]);
  assert.deepEqual([0, 1, 2, 3, 4].map(given => starsOf(given, 2)), [3, 3, 2, 2, 1]);
  assert.deepEqual([0, 2, 3, 4, 5, 6].map(given => starsOf(given, 4)), [3, 3, 2, 2, 1, 1]);
  assert.equal(starsOf(0, 2, "e"), 2);
  assert.equal(toNextStar(3, 2), 2);
  assert.equal(toNextStar(0, 2), 0);
  assert.equal(LEVELS.length, LEVEL_COUNT);
  for (const def of LEVELS) assert.ok(def.stars[0] < def.stars[1] && def.stars[1] < def.points);
});

test("ধীরে খেলো keeps the window the same in real time: 0.8× the game seconds at 0.8× speed", () => {
  const fast = createMatch(5, 3), slow = createMatch(5, 3, "n", true);
  assert.ok(Math.abs(slow.window / 0.8 - fast.window) < 1e-9);
  const a = botMatch(2, 5, CASUAL).m, b = botMatch(2, 5, CASUAL, "n", true).m;
  assert.ok(a.winner >= 0 && b.winner >= 0);
});

test("a whole headless match never leaves the court", () => {
  const { m } = botMatch(12, 77, CASUAL);
  assert.ok(m.us === m.def.points || m.them === m.def.points);
  for (let i = 0; i < m.path.n; i++) assert.ok(m.path.y[i] <= GROUND + 0.01);
  assert.equal(CLEAR, 0);
});
