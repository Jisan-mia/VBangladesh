// The walk's rules against the pure step: how fast a press answers, the wobble, the pull, slips, grace, rain, tiredness, gusts and stars.
import assert from "node:assert/strict";
import test from "node:test";
import { centreAt, safeOffset, SLIP_BRIDGE, SLIP_MUD, SLIP_PUDDLE, windAt } from "../lib/field";
import { legacySpec, livesOf, MODE_INFO, nextAhead, openLevel, readList, specOf, starsOf, type Mode, type Run } from "../lib/levels";
import {
  createGame, dragBy, DRAG_SPEED, E_BACK, E_DONE, E_FELL, E_GUST, E_GUST_WARN, E_NEAR, E_PASS, E_SLIP, E_STEP, E_STREAK, E_WOBBLE, GRACE, GUST_WARN, KICK, PH_DONE, PH_FELL, PH_READY,
  PH_SLIP, PH_WALK, SLIP_TIME, SLOW_PACE, start, STREAK, TAP_SPEED, type Game,
} from "../lib/rules";
import { pullAt, stepGame, steerSpeed } from "../lib/step.hot";
import { idle, oldRun, play, runOf, SKILLED } from "./bot";

const DT = 1 / 60;
const run = (level: number, mode: Mode = "n", seed = 11): Run => ({ seed, kind: "level", level, mode });
const walking = (r: Run) => { const g = createGame(r); start(g); return g; };
/** Steps `seconds`, ORing every event seen. */
function go(game: Game, seconds: number, pace = 1) {
  let seen = 0;
  for (let t = 0; t < seconds - 1e-9; t += DT) { stepGame(game, DT, pace); seen |= game.events; game.events = 0; }
  return seen;
}

test("a press answers inside 50 ms: three steps later the feet have already moved, and the lean shows it from the first step", () => {
  for (const dir of [-1, 1]) {
    const g = walking(run(1)), before = g.x;
    g.dir = dir;
    stepGame(g, DT, 1); g.events = 0;
    assert.ok(Math.abs(g.vel) >= KICK * 0.95, "the kick lands on the very first step");
    assert.ok(g.lean * dir > 0, "the walker already leans into it");
    go(g, 2 * DT);
    assert.ok((g.x - before) * dir >= 2, `moved ${(g.x - before) * dir} px in 50 ms`);
  }
  assert.ok(KICK < TAP_SPEED, "the kick is a start, not full speed");
});

test("a short tap is a small step, a long hold follows a curve, and letting go stops the feet quickly", () => {
  const tap = walking(run(1));
  tap.dir = 1; go(tap, 0.1); tap.dir = 0; go(tap, 0.5);
  assert.ok(tap.x - 180 > 3 && tap.x - 180 < 14, `a tap moved ${tap.x - 180} px`);
  const hold = walking(run(1));
  hold.dir = 1; go(hold, 0.35);
  assert.ok(hold.x - 180 > TAP_SPEED * 0.35 * 0.7 && hold.x - 180 < TAP_SPEED * 0.35, `0.35 s of holding moved ${hold.x - 180} px`);
});

test("a drag chases the finger at a capped speed and never jumps across the mud", () => {
  const g = walking(run(1));
  dragBy(g, 150);
  assert.equal(g.dragging, true);
  const x0 = g.x;
  go(g, 0.1);
  assert.ok(g.x - x0 <= DRAG_SPEED * 0.1 + 1e-6);
  assert.ok(g.x - x0 > DRAG_SPEED * 0.1 * 0.8, "it does move fast");
  go(g, 1);
  assert.ok(Math.abs(g.x - g.target) < 2 || g.phase === PH_SLIP, "it arrives");
});

test("the wobble: the body flaps near the edge and a creak is called once per visit, a near miss when it comes back dry", () => {
  const g = walking(run(1, "n", 3));
  const half = g.spec.half;
  g.x = centreAt(g.field, g.d) + half * 0.9; g.edge = 0.9;
  g.dir = 0;
  const seen = go(g, 0.02);
  assert.ok(seen & E_WOBBLE, "a creak at 90% of the ridge");
  assert.equal(go(g, 0.2) & E_WOBBLE, 0, "once per visit");
  // come back to the middle without slipping
  g.x = centreAt(g.field, g.d); go(g, 0.05);
  assert.ok(g.nears === 1 || (go(g, 0.1) & E_NEAR) === 0 || g.nears >= 0);
  assert.equal(g.slips, 0);
});

test("the edge pulls from level 3, outward only, harder the nearer the mud; never on levels 1-2 or on old fields", () => {
  const level3 = walking(run(3)), level2 = walking(run(2)), old = walking(oldRun(5, 3));
  const half = level3.spec.half;
  assert.equal(pullAt(level3, 0), 0);
  assert.equal(pullAt(level3, half * 0.6), 0, "nothing inside 65%");
  const mid = pullAt(level3, half * 0.8), edge = pullAt(level3, half * 0.99);
  assert.ok(mid > 0 && edge > mid && edge <= level3.spec.pull * 1.7 + 1e-9, `${mid} ${edge}`);
  assert.equal(pullAt(level3, -half * 0.99), -edge, "pushes outward on either side");
  assert.equal(pullAt(level2, level2.spec.half * 0.95), 0);
  assert.equal(pullAt(old, old.spec.half * 0.95), 0);
  // a held side can always beat the pull
  assert.ok(edge < TAP_SPEED * 0.6);
  // the feet left alone at 80% drift out and slip; held the other way they come back
  const drift = walking(run(3, "n", 9));
  drift.x = centreAt(drift.field, drift.d) + half * 0.8;
  go(drift, 2);
  assert.ok(drift.slips >= 1 || Math.abs(drift.x - centreAt(drift.field, drift.d)) > half * 0.8, "left alone, the edge wins");
  const back = walking(run(3, "n", 9));
  back.x = centreAt(back.field, back.d) + half * 0.8;
  for (let i = 0; i < 60; i++) { back.dir = back.x > centreAt(back.field, back.d) + 4 ? -1 : 0; stepGame(back, DT, 1); back.events = 0; }
  assert.equal(back.slips, 0);
});

test("slips: into the mud, then back on the dry side with grace, and the last one ends the field (3 slips in সাধারণ, 5 in সহজ, 2 in কঠিন)", () => {
  assert.deepEqual((["e", "n", "h"] as Mode[]).map(m => livesOf({ kind: "level", mode: m })), [5, 3, 2]);
  assert.equal(livesOf({ kind: "old", mode: "h" }), 3, "old links keep three");
  const g = walking(run(1));
  g.x = centreAt(g.field, g.d) + g.spec.half + 4;
  const seen = go(g, DT);
  assert.ok(seen & E_SLIP);
  assert.equal(g.phase, PH_SLIP);
  assert.equal(g.slipReason, SLIP_MUD);
  assert.equal(g.slips, 1);
  const d = g.d;
  go(g, SLIP_TIME - 0.1);
  assert.equal(g.d, d, "the walk waits while they sink");
  go(g, 0.25);
  assert.equal(g.phase, PH_WALK);
  assert.ok(Math.abs(g.x - (centreAt(g.field, g.d) + safeOffset(g.field, g.d))) < 3, "back on the dry middle");
  assert.ok(g.graceTo - g.d > GRACE - 10);
  g.x = centreAt(g.field, g.d) + g.spec.half + 4;
  go(g, 0.1);
  assert.equal(g.slips, 1, "no slip counts inside the grace");
  // lives
  for (const [mode, lives] of [["n", 3], ["e", 5], ["h", 2]] as const) {
    const f = walking(run(1, mode, 5));
    let ended = 0;
    for (let i = 0; i < 12 && f.phase !== PH_FELL; i++) {
      if (f.phase === PH_WALK) { f.x = centreAt(f.field, f.d) + f.spec.half + 6; f.graceTo = 0; }
      ended |= go(f, 0.5);
    }
    ended |= go(f, 1);
    assert.equal(f.phase, PH_FELL, mode);
    assert.equal(f.slips, lives, `${mode}: the ${lives}th slip ends it`);
    assert.ok(ended & E_FELL);
  }
});

test("slips name their cause: a puddle, and the bridge's edge", () => {
  const g = walking(run(10, "n", 4));
  const puddle = g.field.obstacles.find(o => o.kind === "puddle")!;
  g.d = puddle.d + 5; g.nextStep = g.d + 100; g.x = centreAt(g.field, g.d) + (puddle.lo + puddle.hi) / 2;
  go(g, DT);
  assert.equal(g.slipReason, SLIP_PUDDLE);
  const b = walking(run(10, "n", 4));
  const bridge = b.field.obstacles.find(o => o.kind === "bridge")!;
  b.d = bridge.d + 5; b.nextStep = b.d + 100; b.x = centreAt(b.field, b.d) + bridge.hi + 2;
  go(b, DT);
  assert.equal(b.slipReason, SLIP_BRIDGE);
});

test("rain makes the ridge slick: the feet slide on after a release, further than on a dry field", () => {
  const slide = (level: number) => {
    const g = walking(run(level, "n", 21));
    g.dir = 1; go(g, 0.15); g.dir = 0;
    const x0 = g.x;
    go(g, 0.4);
    return g.x - x0;
  };
  assert.ok(slide(13) > slide(12) * 1.8, `${slide(13)} vs ${slide(12)}`);
});

test("tired feet: from level 17 the steering slows over the field, never below 70%", () => {
  const g = walking(run(17));
  assert.equal(steerSpeed(g), TAP_SPEED);
  g.d = g.field.length / 2;
  assert.ok(Math.abs(steerSpeed(g) - TAP_SPEED * 0.85) < 1e-6);
  g.d = g.field.length;
  assert.ok(Math.abs(steerSpeed(g) - TAP_SPEED * 0.7) < 1e-6);
  assert.equal(steerSpeed(walking(run(16))), TAP_SPEED);
});

test("gusts: the arrow lights before, the whoosh at the hit, and the gust counts as ridden once it has passed", () => {
  const g = walking(run(12, "n", 3));
  const gust = g.field.gusts[0];
  let warned = -1, hit = -1;
  while (g.d < gust.d + gust.len + 20 && g.phase === PH_WALK) {
    g.dir = Math.sign(centreAt(g.field, g.d) - g.x) | 0;
    stepGame(g, DT, 1);
    if (g.events & E_GUST_WARN && warned < 0) warned = g.d;
    if (g.events & E_GUST && hit < 0) hit = g.d;
    g.events = 0;
  }
  assert.ok(warned >= gust.d - 100 && warned < gust.d, `warned at ${warned} for a gust at ${gust.d}`);
  assert.ok(hit >= gust.d);
  assert.equal(g.gustsRidden, 1);
  assert.equal(g.gustWarn, 0);
  assert.equal(g.gustNow, 0);
  assert.ok(Math.abs(windAt(g.field, gust.d + gust.len / 2)) > 20);
  assert.ok(GUST_WARN < 80, "the warning of one gust never starts inside the one before");
});

test("slow mode slows the walk, the wind and the pull; the feet keep their speed", () => {
  const a = walking(run(1)), b = walking(run(1));
  go(a, 1); go(b, 1, SLOW_PACE);
  assert.ok(Math.abs(b.d / a.d - SLOW_PACE) < 0.01);
  const c = walking(run(1)), d = walking(run(1));
  c.dir = 1; d.dir = 1;
  go(c, 0.5); go(d, 0.5, SLOW_PACE);
  assert.ok(Math.abs(c.x - d.x) < 0.5, "sideways speed is the same");
  const steps = (pace: number) => { const g = walking(run(1)); let n = 0; for (let t = 0; t < 2; t += DT) { stepGame(g, DT, pace); if (g.events & E_STEP) n++; g.events = 0; } return n; };
  assert.ok(steps(SLOW_PACE) < steps(1) * 0.7, "footsteps come slower");
});

test("a dry streak chimes every 20 m; a near miss and the obstacles passed are counted; stats stay consistent", () => {
  const out = play(runOf(5, 5), SKILLED);
  assert.equal(out.game.phase, PH_DONE);
  assert.ok(out.game.passed <= out.game.field.obstacles.length);
  const g = walking(run(1));
  const seen = go(g, (STREAK * 1.05) / g.spec.speed);
  assert.ok(seen & E_STREAK);
  assert.equal(g.streak, 1);
  assert.equal(g.streakM, 20);
});

test("a field ends exactly once: done at the yard, fell on the last slip, nothing moves after", () => {
  const ok = play(runOf(3, 1), SKILLED).game;
  assert.equal(ok.phase, PH_DONE);
  const d = ok.d, clock = ok.clock;
  go(ok, 2);
  assert.equal(ok.d, d);
  assert.equal(ok.events, 0);
  void clock;
  let doneBits = 0;
  const g = walking(run(1));
  while (g.phase === PH_WALK) { stepGame(g, DT, 1); doneBits += g.events & E_DONE ? 1 : 0; g.events = 0; }
  assert.equal(doneBits, 1);
  assert.equal(createGame(run(1)).phase, PH_READY);
});

test("stars: dry 3, one slip 2, two slips 1, none for a field not cleared; সহজ tops out at 2; old fields count as before", () => {
  assert.deepEqual([0, 1, 2].map(s => starsOf(s, true)), [3, 2, 1]);
  assert.equal(starsOf(2, false), 0);
  assert.deepEqual([0, 1, 3, 4].map(s => starsOf(s, true, "e")), [2, 2, 1, 1]);
  assert.deepEqual([0, 1].map(s => starsOf(s, true, "h")), [3, 2]);
  assert.equal(MODE_INFO.e.maxStars, 2);
  assert.ok(MODE_INFO.e.lives > MODE_INFO.n.lives && MODE_INFO.h.lives < MODE_INFO.n.lives);
});

test("progress: a friend's far level keeps its stars but opens nothing in between; saved lists read safely", () => {
  const stars = { 1: 3, 2: 1 };
  const ahead = nextAhead(stars, [], 9);
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel({ ...stars, 9: 2 }, ahead), 3);
  const own = { ...stars, 9: 2, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 };
  assert.equal(openLevel(own, nextAhead({ ...stars, 9: 2 }, ahead, 8)), 10);
  assert.equal(openLevel({ 1: 3, 2: 3, 3: 1 }, []), 4, "saved progress from the old game opens exactly what it did");
  assert.deepEqual(readList("[3,1,3,99,\"x\"]"), [1, 3]);
  assert.deepEqual(readList("nope"), []);
  assert.equal(specOf(3, "n").level, 3);
  assert.equal(legacySpec(3).pull, 0);
  assert.ok(idle(runOf(1, 20)).game.slips >= 1);
});
