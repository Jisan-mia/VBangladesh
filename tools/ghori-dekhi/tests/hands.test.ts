import assert from "node:assert/strict";
import test from "node:test";
import { down, drop, move, up, type Holder } from "../lib/drag";
import { CLICK_MS, PULL_DEG, ease, follow, hourAt, minuteAt, pickHand, pieMinutes, pulled, shortest, snapHourTotal, snapMinuteTotal, stepHand, wrapTotal } from "../lib/hands";
import { hands } from "../lib/time";

test("a hand follows the finger the short way round, so crossing 12 never jumps a turn", () => {
  assert.equal(shortest(350), -10); assert.equal(shortest(-350), 10); assert.equal(shortest(180), -180);
  let deg = 350;
  deg = follow(deg, 10);   // 350 → 10 is a 20° step forward
  assert.equal(deg, 370);
  deg = follow(deg, 350);  // and back again
  assert.equal(deg, 350);
  let turns = 0;
  for (let angle = 0; angle <= 720; angle += 30) turns = follow(turns, angle);
  assert.equal(turns, 720, "two full turns stay two full turns");
});

test("the long hand: minutes follow the degrees, and carry the short hand past 12", () => {
  const total0 = 3 * 60, deg0 = hands(total0).minute; // 3:00 → the long hand at 0°
  assert.equal(minuteAt(total0, deg0, deg0 + 90), total0 + 15);
  assert.equal(minuteAt(total0, deg0, deg0 + 360), total0 + 60, "one turn = one hour");
  assert.equal(minuteAt(total0, deg0, deg0 - 30), total0 - 5);
  assert.equal(snapMinuteTotal(total0 + 13, 15), total0 + 15);
  assert.equal(snapMinuteTotal(total0 + 12, 5), total0 + 10);
  assert.equal(snapMinuteTotal(total0 + 58, 5), total0 + 60);
});

test("the short hand: two minutes a degree, whole hours on release, the minutes stay", () => {
  const total0 = 4 * 60 + 30, deg0 = hands(total0).hour; // 4:30 → 135°
  assert.equal(hourAt(total0, deg0, deg0 + 30), total0 + 60);
  assert.equal(snapHourTotal(total0 + 35, total0), total0 + 60, "35 minutes round to the next hour");
  assert.equal(snapHourTotal(total0 + 20, total0), total0);
  assert.equal(snapHourTotal(total0 - 40, total0), total0 - 60);
  assert.equal(snapHourTotal(8 * 60 + 45, 45), 8 * 60 + 45);
});

test("the click spot pulls a hand in within a few degrees, and not beyond", () => {
  assert.equal(pulled(100.5, 100, "minute"), 100, "0.5 min × 6° = 3° ≤ 5°");
  assert.equal(pulled(101.2, 100, "minute"), 101.2, "7.2° is too far");
  assert.equal(pulled(105, 100, "hour"), 100, "5 min × 0.5° = 2.5°");
  assert.equal(pulled(115, 100, "hour"), 115);
  assert.ok(PULL_DEG > 0);
});

test("which hand a press picks up: the nearer one, the long one when both are close and the finger is far out, the short one when locked", () => {
  const total = 3 * 60; // short hand at 90°, long hand at 0°
  assert.equal(pickHand(total, 85, 60), "hour");
  assert.equal(pickHand(total, 5, 100), "minute");
  assert.equal(pickHand(total, 300, 100), "minute", "nearest to the long hand at 0°");
  assert.equal(pickHand(0, 3, 100), "minute", "both at 12 and the finger far out: the long one");
  assert.equal(pickHand(0, 3, 50), "hour", "…and near the middle: the short one");
  assert.equal(pickHand(total, 5, 100, true), "hour", "level ১ locks the long hand");
});

test("arrow keys: the long hand clicks by the level's step and carries the hour; the short hand takes a whole hour", () => {
  assert.equal(stepHand(60, "minute", 1, 15), 75);
  assert.equal(stepHand(60 + 55, "minute", 1, 5), 120);
  assert.equal(stepHand(60, "minute", -1, 5), 55);
  assert.equal(stepHand(90, "hour", 1, 15), 150);
  assert.equal(stepHand(0, "hour", -1, 15), -60);
  assert.equal(wrapTotal(-60), 660); assert.equal(wrapTotal(740), 20);
  assert.equal(pieMinutes(30), 30); assert.equal(pieMinutes(6 * 60), 0); assert.equal(pieMinutes(4 * 60 + 45), 45);
});

test("easing: starts at 0, ends at 1, never overshoots, and is quick", () => {
  assert.equal(ease(0), 0); assert.equal(ease(1), 1); assert.equal(ease(2), 1); assert.equal(ease(-1), 0);
  let last = 0;
  for (let p = 0; p <= 1; p += 0.05) { const e = ease(p); assert.ok(e >= last && e <= 1); last = e; }
  assert.ok(CLICK_MS <= 200, "a click into place is under 200 ms");
});

// ── bug 2 (InputReleasedWhenAway, HandMovesOnlyUnderAFinger): the hand followed the mouse after a window switch ──

const press = (id = 1, x = 100, y = 100) => ({ pointerId: id, isPrimary: true, button: 0, clientX: x, clientY: y });
const hold = (id: number, x: number, y: number, buttons = 1) => ({ pointerId: id, buttons, clientX: x, clientY: y });

test("bug 2: a press lost in another window ends the drag, and a hover then moves nothing", () => {
  const holder: Holder = { current: null };
  assert.ok(down(holder, press()));
  assert.equal(move(holder, hold(1, 140, 100)), "begin");
  assert.equal(move(holder, hold(1, 160, 100)), "drag");
  // The window loses focus (the component drops the gesture), the button comes up elsewhere, the mouse comes back over the clock.
  assert.ok(drop(holder)?.moved);
  assert.equal(move(holder, hold(1, 200, 120, 0)), "none", "a hover with no press: nothing turns");
  // A press that was never released (the up was lost) and then a hover with no button: the gesture is dropped, not followed.
  assert.ok(down(holder, press(2)));
  assert.equal(move(holder, hold(2, 150, 100)), "begin");
  assert.equal(move(holder, hold(2, 170, 110, 0)), "lost");
  assert.equal(holder.current, null);
  // And the next real touch works at once (before the fix, the stale gesture swallowed it).
  assert.ok(down(holder, press(3, 10, 10)));
});

test("a drag belongs to the first pointer and the main button; a tap is a press that barely moves; a new item starts clean", () => {
  const holder: Holder = { current: null };
  assert.ok(!down(holder, { ...press(), isPrimary: false }), "a palm or a second finger");
  assert.ok(!down(holder, { ...press(), button: 2 }), "a right click");
  assert.ok(down(holder, press(1)));
  assert.ok(!down(holder, press(2)), "a second finger while one is down");
  assert.equal(move(holder, hold(2, 300, 300)), "none", "another pointer's moves");
  assert.equal(move(holder, hold(1, 103, 102)), "none", "under the slop: still a tap");
  const tap = up(holder, 1);
  assert.ok(tap && !tap.moved);
  assert.equal(up(holder, 1), null);
  assert.ok(down(holder, press(4)));
  assert.equal(move(holder, hold(4, 150, 100)), "begin");
  assert.equal(drop(holder)?.moved, true, "the next item: the turn in flight is over");
  assert.equal(drop(holder), null);
});
