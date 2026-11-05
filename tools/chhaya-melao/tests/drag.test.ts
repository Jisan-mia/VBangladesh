// The finger on a toy (lib/drag.ts) and the toy's springs (lib/body.ts + components/body.hot.ts).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { stepBody } from "../components/body.hot";
import { FLIP, FLY, FOLLOW, HOME, LAND, REST, ROT, SCALE, X, Y, jump, makeBody, setMode } from "../lib/body";
import * as G from "../lib/drag";

const ev = (over: Partial<G.DownEvent> = {}): G.DownEvent => ({ pointerId: 1, isPrimary: true, button: 0, clientX: 10, clientY: 10, ...over });

test("a press starts a gesture only for the first pointer and the main button, and only one at a time", () => {
  const holder: G.Holder = { current: null };
  assert.equal(G.down(holder, ev({ isPrimary: false }), 0), false, "a second finger is ignored");
  assert.equal(G.down(holder, ev({ button: 2 }), 0), false, "not the right mouse button");
  assert.ok(G.down(holder, ev(), 0));
  assert.equal(G.down(holder, ev({ pointerId: 2 }), 1), false, "a palm after the finger is ignored");
});

test("a press that barely moves is a tap; a real move begins a drag; a press lost in another window ends it", () => {
  const holder: G.Holder = { current: null };
  G.down(holder, ev(), 1);
  assert.equal(G.move(holder, { pointerId: 1, buttons: 1, clientX: 14, clientY: 12 }), "none");
  assert.equal(G.move(holder, { pointerId: 1, buttons: 1, clientX: 40, clientY: 12 }), "begin");
  assert.equal(G.move(holder, { pointerId: 1, buttons: 1, clientX: 60, clientY: 12 }), "drag");
  assert.equal(G.move(holder, { pointerId: 2, buttons: 1, clientX: 90, clientY: 12 }), "none", "another pointer's move is not ours");
  assert.equal(G.move(holder, { pointerId: 1, buttons: 0, clientX: 70, clientY: 12 }), "lost", "the button came up elsewhere");
  assert.equal(holder.current, null);
  G.down(holder, ev(), 1);
  const tap = G.up(holder, 1);
  assert.ok(tap && !tap.moved && tap.toy === 1);
  assert.equal(G.up(holder, 1), null);
  G.down(holder, ev(), 0);
  assert.ok(G.drop(holder)); assert.equal(G.drop(holder), null);
});

test("snap: a toy dropped within reach of an open shadow is on it; the nearest wins; a filled shadow and the far wall are not", () => {
  const centers = [100, 100, 300, 100];
  assert.equal(G.nearest(110, 95, centers, [true, true], 100), 0);
  assert.equal(G.nearest(260, 120, centers, [true, true], 100), 1);
  assert.equal(G.nearest(110, 95, centers, [false, true], 100), -1, "a matched shadow is done");
  assert.equal(G.nearest(200, 400, centers, [true, true], 100), -1);
  assert.equal(G.reach(40), 56, "never under 56 px");
  assert.equal(G.reach(200), 150, "0.75 of the shadow");
  assert.equal(G.nearest(100 + 74, 100, centers, [true, true], 100), 0, "just inside 0.75 of 100");
});

test("keys: the arrow moves the aim over the open shadows and wraps", () => {
  assert.equal(G.aimNext([true, true, true], 0, 1), 1);
  assert.equal(G.aimNext([true, true, true], 2, 1), 0);
  assert.equal(G.aimNext([true, false, true], 0, 1), 2);
  assert.equal(G.aimNext([true, false, true], 0, -1), 2);
  assert.equal(G.aimNext([false, false], 0, 1), -1);
});

function run(mode: number, goal: number[], calm: boolean, seconds = 2) {
  const body = makeBody();
  setMode(body, mode, calm);
  body.goal[X] = goal[0]; body.goal[Y] = goal[1]; body.goal[ROT] = goal[2]; body.goal[SCALE] = goal[3]; body.goal[FLIP] = goal[4];
  let peak = 0, t = 0;
  for (; t < seconds * 60; t++) { const moving = stepBody(body, 1 / 60, calm); peak = Math.max(peak, body.pos[X]); if (!moving && mode !== FOLLOW) break; }
  return { body, peak, frames: t };
}

test("weight: a landing toy overshoots a little and settles on its shadow; calm (ধীরে খেলো) glides in without overshoot", () => {
  const live = run(LAND, [200, -150, 90, 2.4, -1], false);
  assert.ok(live.peak > 200 && live.peak < 200 * 1.35, `overshoots by a fraction: ${live.peak}`);
  assert.deepEqual([...live.body.pos], [200, -150, 90, 2.4, -1], "and ends exactly on the goal");
  assert.ok(live.frames < 60, `settles inside a second: ${live.frames} frames`);
  const calm = run(LAND, [200, -150, 90, 2.4, -1], true);
  assert.ok(calm.peak <= 200 + 0.01, "no overshoot when calm");
  assert.deepEqual([...calm.body.pos], [200, -150, 90, 2.4, -1]);
});

test("a toy going home returns exactly to its shelf spot, and following a finger never settles on its own", () => {
  const home = makeBody();
  jump(home, 120, -80, 12, 1.4, 1);
  setMode(home, HOME, false);
  home.goal.set([0, 0, 0, 1, 1]);
  let frames = 0;
  while (stepBody(home, 1 / 60, false) && frames++ < 200);
  assert.deepEqual([...home.pos], [0, 0, 0, 1, 1]); assert.ok(frames < 90);
  const hand = makeBody();
  setMode(hand, FOLLOW, false);
  hand.goal[X] = 100;
  for (let i = 0; i < 100; i++) assert.equal(stepBody(hand, 1 / 60, false), true);
  assert.ok(Math.abs(hand.pos[X] - 100) < 0.5);
  assert.ok(Math.abs(hand.pos[ROT]) < 1, "leans only while it is moving");
});

test("lean: moving fast sideways tips the toy a little (never over 14 degrees), and calm never tips it", () => {
  const body = makeBody();
  setMode(body, FOLLOW, false);
  let lean = 0;
  for (let i = 0; i < 20; i++) { body.goal[X] = i * 40; stepBody(body, 1 / 60, false); lean = Math.max(lean, Math.abs(body.pos[ROT])); }
  assert.ok(lean > 2 && lean <= 15, `leans ${lean}`);
  const calm = makeBody();
  setMode(calm, FOLLOW, true);
  for (let i = 0; i < 20; i++) { calm.goal[X] = i * 40; stepBody(calm, 1 / 60, true); }
  assert.equal(calm.pos[ROT], 0);
});

test("a tapped toy flies to its shadow and says it has arrived; a long frame never blows the spring up", () => {
  const body = makeBody();
  setMode(body, FLY, false);
  body.goal[X] = 150; body.goal[Y] = -200;
  let arrivedAt = -1;
  for (let frame = 0; frame < 120 && arrivedAt < 0; frame++) { stepBody(body, 1 / 60, false); if (body.arrived) arrivedAt = frame; }
  assert.ok(arrivedAt > 0 && arrivedAt < 30, `arrived at frame ${arrivedAt}`);
  const slowPhone = makeBody();
  setMode(slowPhone, LAND, false);
  slowPhone.goal[X] = 300;
  for (let i = 0; i < 40; i++) stepBody(slowPhone, 0.5, false);
  assert.ok(Number.isFinite(slowPhone.pos[X]) && Math.abs(slowPhone.pos[X] - 300) < 1, "a half-second frame is cut to 1/30 and stays stable");
  setMode(slowPhone, REST, false);
});

test("the hot file allocates nothing per frame", () => {
  const text = readFileSync(join(import.meta.dirname, "../components/body.hot.ts"), "utf8");
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code, /=> |\bnew \w|\.map\(|\.filter\(|\.\.\.|`/);
});
