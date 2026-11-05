import assert from "node:assert/strict";
import test from "node:test";
import { advance } from "../lib/step.hot";
import { LEVELS, LEVEL_COUNT, K_HEN, fromSide } from "../lib/levels";
import {
  beginWind, canLift, cancelWind, createTop, endWind, lean, lift, liftSafe, nudge, scoreOf, setSlow, swipeThrow, throwTop, windPower, windStraight,
  DT, E_BUMP, E_DONE, E_FALL, E_LAND, E_LIFTABLE, E_NUDGE, E_PALM, E_THROW, E_WIND, NUDGE_GOOD, NUDGE_MISS, NUDGE_OK, P_DONE, P_FALL, P_PALM, P_READY, P_SPIN, PICK_STEADY, SLOW, WIND_PERIOD, type Top,
} from "../lib/top";

type Plan = { power: number; straight: number; taps: "none" | "timed" | "spam" };
/** A headless spin: throw, then step the pure state with scripted touches until it stops. */
function spin(seed: number, level: number, plan: Plan, mode: "e" | "n" | "h" = "n") {
  const top = createTop(seed, level, mode);
  throwTop(top, plan.power, plan.straight);
  let next = 0.3;
  for (let steps = 0; top.phase === P_SPIN && steps < 60 * 200; steps++) {
    advance(top, DT); top.evN = 0;
    if (plan.taps === "timed" && top.wobble > 0.3 && Math.abs(lean(top)) > 0.93) nudge(top);
    if (plan.taps === "spam" && top.t > next) { nudge(top); next = top.t + 0.25; }
  }
  return top;
}
const fingerprint = (t: Top) => [t.phase, t.t, t.omega, t.wobble, t.nudges, t.goodN, t.bonus, t.fall, t.faced, t.braced].join("|");
const GOOD: Plan = { power: 0.95, straight: 0.92, taps: "timed" };

test("the same seed lays the same floor, and the same seed plus the same touches gives the same spin", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const a = createTop(48213, level), b = createTop(48213, level);
    assert.deepEqual([...a.at.slice(0, a.n)], [...b.at.slice(0, b.n)]);
    assert.deepEqual([...a.kind.slice(0, a.n)], [...b.kind.slice(0, b.n)]);
    assert.equal(a.n, b.n);
  }
  assert.notDeepEqual([...createTop(1, 3).at.slice(0, 6)], [...createTop(2, 3).at.slice(0, 6)]);
  assert.equal(fingerprint(spin(777, 6, GOOD)), fingerprint(spin(777, 6, GOOD)));
  assert.equal(fingerprint(spin(777, 12, { power: 0.7, straight: 0.6, taps: "spam" })), fingerprint(spin(777, 12, { power: 0.7, straight: 0.6, taps: "spam" })));
  assert.notEqual(fingerprint(spin(777, 12, GOOD)), fingerprint(spin(778, 12, GOOD)), "knocks and gusts differ by seed");
});

test("every floor gives a clean start: nothing lands in the first 2 seconds, level 1 and 5 are bare, and each place's thing is what the level teaches", () => {
  for (let seed = 1; seed < 200; seed++) for (let level = 1; level <= LEVEL_COUNT; level++) {
    const top = createTop(seed * 7919, level);
    for (let i = 0; i < top.n; i++) assert.ok(top.at[i] >= 2, `seed ${seed} level ${level} at ${top.at[i]}`);
    for (let i = 1; i < top.n; i++) assert.ok(top.at[i] >= top.at[i - 1], "sorted");
    if (level === 1 || level === 5) assert.equal(top.n, 0);
    assert.ok(top.n <= 96);
  }
  const hens = createTop(5, 4);
  assert.ok(hens.n > 0 && [...hens.kind.slice(0, hens.n)].includes(K_HEN));
  // the hens come three at a time from one side
  const first = [...hens.wave.slice(0, hens.n)].findIndex(w => w === 1);
  assert.equal(hens.side[first], hens.side[first + 1]);
  assert.equal(hens.side[first], hens.side[first + 2]);
  assert.ok(hens.at[first + 2] - hens.at[first] < 1);
});

test("each level adds one thing and each place ends with a named finale", () => {
  for (let place = 0; place < 3; place++) {
    const finale = LEVELS[place * 4 + 3];
    assert.ok(finale.special && finale.move && finale.wave, `place ${place}`);
    for (let i = 0; i < 3; i++) assert.equal(LEVELS[place * 4 + i].special, null);
  }
  assert.deepEqual(LEVELS.map(level => level.special), [null, null, null, "hens", null, null, null, "broom", null, null, null, "storm"]);
  assert.ok(LEVELS[0].sources.length === 0 && LEVELS[0].ridge === 0 && LEVELS[0].wind === 0);
  assert.ok(LEVELS[9].wind > 0 && LEVELS[8].wind === 0, "wind arrives at level 10");
  assert.ok(LEVELS[10].slope > 0 && LEVELS[9].slope === 0, "the slope arrives at level 11");
  assert.ok(LEVELS.every(level => level.stars[0] < level.stars[1] && level.stars[1] < level.stars[2]));
  assert.ok(LEVELS[0].stars[0] <= 10, "the first win comes inside ten seconds");
  assert.ok(fromSide(K_HEN));
});

test("a harder, straighter throw spins longer and steadier", () => {
  const weak = createTop(5), strong = createTop(5), crooked = createTop(5);
  throwTop(weak, 0.2, 0.9); throwTop(strong, 1, 0.9); throwTop(crooked, 1, 0.2);
  assert.ok(strong.omega > weak.omega);
  assert.ok(crooked.wobble > strong.wobble);
  assert.equal(throwTop(strong, 1, 1), false, "one throw per spin");
  assert.ok(spin(5, 1, { power: 1, straight: 0.9, taps: "none" }).t > spin(5, 1, { power: 0.2, straight: 0.9, taps: "none" }).t);
});

test("the pull: down and fast is strong, sideways is crooked, up or tiny is no throw", () => {
  const flick = swipeThrow(0, 0.6, 0.12, null)!;
  assert.ok(flick.power > 0.95 && flick.straight > 0.99);
  assert.ok(swipeThrow(0, 0.4, 0.8, null)!.power < 0.1);
  assert.ok(swipeThrow(0.3, 0.5, 0.12, null)!.straight < 0.6, "a slanted pull is less straight");
  assert.ok(swipeThrow(0, 0.5, 0.12, null, 0.2)!.straight < 0.8, "a wobbly path is less straight");
  assert.ok(swipeThrow(0, 0.5, 0.9, { dy: 0.3, seconds: 0.08 })!.power > 0.9, "a late flick after a slow start counts");
  assert.equal(swipeThrow(0, -0.5, 0.1, null), null);
  assert.equal(swipeThrow(0, 0.05, 0.1, null), null);
  assert.equal(swipeThrow(0.5, 0.3, 0.1, null), null, "mostly sideways");
  assert.equal(swipeThrow(Number.NaN, Number.NaN, 0.1, null), null);
});

test("winding: the bar fills and slips back, a turn of string ticks, and letting go at the top is the best throw", () => {
  assert.equal(windPower(0), 0);
  assert.ok(Math.abs(windPower(WIND_PERIOD) - 1) < 1e-9);
  assert.ok(Math.abs(windPower(1.2) - 0.5) < 1e-9);
  assert.ok(Math.abs(windPower(1.6)) < 1e-9);
  assert.ok(Math.abs(windStraight(1) - 1) < 1e-9 && windStraight(0) < windStraight(1));
  const top = createTop(3);
  assert.equal(beginWind(top), true);
  assert.equal(beginWind(top), false, "already winding");
  let ticks = 0;
  for (let i = 0; i < Math.round(WIND_PERIOD / DT); i++) { advance(top, DT); for (let e = 0; e < top.evN; e++) if (top.evType[e] === E_WIND) ticks++; top.evN = 0; }
  assert.equal(ticks, 5, "a tick every 0.16 s");
  assert.equal(endWind(top), 1);
  assert.equal(top.phase, P_SPIN);
  assert.ok(top.power > 0.97 && top.straight > 0.99);
  // too short is no throw
  const quick = createTop(3); beginWind(quick); advance(quick, DT);
  assert.equal(endWind(quick), 0); assert.equal(quick.phase, P_READY);
  assert.equal(endWind(quick), -1, "nothing held");
});

test("nudges: at the lean's edge steadies, mid-swing a little, at the centre knocks, and a hammered button counts once", () => {
  const top = createTop(9); throwTop(top, 0.9, 0.5);
  top.sway = Math.PI / 2; const before = top.wobble;
  assert.equal(nudge(top), NUDGE_GOOD);
  assert.ok(Math.abs(top.wobble - before * 0.5) < 1e-9 && top.goodN === 1 && top.combo === 1);
  assert.equal(nudge(top), -1, "the same instant counts once");
  top.t += 0.3; top.sway = Math.asin(0.7);
  const mid = top.wobble;
  assert.equal(nudge(top), NUDGE_OK);
  assert.ok(top.wobble < mid && top.combo === 1);
  top.t += 0.3; top.sway = 0;
  const calm = top.wobble;
  assert.equal(nudge(top), NUDGE_MISS);
  assert.ok(top.wobble > calm && (top.combo as number) === 0 && top.bestCombo === 1);
  assert.equal(nudge(createTop(1)), -1, "not while it is in the hand");
});

test("timed touches beat none, and hammering does worse than timing", () => {
  let timed = 0, none = 0, spam = 0;
  for (let seed = 1; seed <= 20; seed++) {
    timed += spin(seed * 31, 3, GOOD).t; none += spin(seed * 31, 3, { ...GOOD, taps: "none" }).t; spam += spin(seed * 31, 3, { ...GOOD, taps: "spam" }).t;
  }
  assert.ok(timed > none + 20 * 3, `timed ${timed} none ${none}`);
  assert.ok(timed > spam + 20 * 3, `timed ${timed} spam ${spam}`);
});

test("a touch just before a knock braces the top: the knock counts for a third", () => {
  const make = () => { const top = createTop(11, 3); throwTop(top, 0.9, 0.9); return top; };
  const plain = make(), braced = make();
  const at = plain.at[0];
  const run = (top: Top, tap: boolean) => {
    while (top.t < at - 0.12) { advance(top, DT); top.evN = 0; }
    top.wobble = 0.2; top.omega = 0.8;
    if (tap) { top.sway = Math.PI / 2; assert.equal(nudge(top), NUDGE_GOOD); top.wobble = 0.2; }
    const w = top.wobble;
    let kind = -1, was = -1;
    while (top.t < at + 0.02) {
      advance(top, DT);
      for (let e = 0; e < top.evN; e++) if (top.evType[e] === E_BUMP) { kind = top.kind[0]; was = top.evB[e]; }
      top.evN = 0;
    }
    return { rise: top.wobble - w, kind, braced: was };
  };
  const a = run(plain, false), b = run(braced, true);
  assert.equal(a.braced, 0); assert.equal(b.braced, 1);
  assert.ok(b.rise < a.rise * 0.6, `${b.rise} vs ${a.rise}`);
  assert.equal(braced.braced, 1); assert.equal(plain.braced, 0);
  assert.ok(plain.faced === 1);
});

test("the slope hides the green on the uphill side, and ধীরে খেলো keeps the window the same real length", () => {
  const top = createTop(2, 11);
  throwTop(top, 0.9, 0.9);
  let low = 1, high = -1;
  for (let i = 0; i < 600; i++) { top.sway += 0.02; low = Math.min(low, lean(top)); high = Math.max(high, lean(top)); }
  assert.ok(high >= 1 - 1e-9 && low > -0.75, `low ${low}`);
  assert.ok(Math.abs(low) < top.good, "the far end never reaches the green");
  // the window's length in real seconds: the same with or without slow mode
  const flat = createTop(2, 1), slow = createTop(2, 1, "n", true);
  const real = (t: Top, speed: number) => 2 * Math.acos(t.good) / (2.6 * speed);
  assert.ok(Math.abs(real(flat, 1) - real(slow, SLOW)) < 1e-9, "same real milliseconds");
  setSlow(flat, true); assert.ok(Math.abs(flat.good - slow.good) < 1e-12);
  assert.ok(flat.gap < 0.22 && flat.brace < 0.3);
  setSlow(flat, false); assert.equal(flat.gap, 0.22);
});

test("lifting: only late, only when steady, and it adds the bonus", () => {
  const top = createTop(5); throwTop(top, 1, 1);
  assert.equal(lift(top), -1, "not while it still spins fast");
  top.omega = 0.2; top.wobble = 0.3;
  assert.ok(canLift(top) && liftSafe(top));
  assert.equal(lift(top), 1);
  assert.equal(top.phase, P_PALM); assert.equal(top.bonus, 50);
  assert.equal(scoreOf(top), Math.floor(top.t * 10) + 50);
  assert.equal(lift(top), -1);
  const wobbly = createTop(5); throwTop(wobbly, 1, 1); wobbly.omega = 0.2; wobbly.wobble = PICK_STEADY + 0.05;
  assert.ok(canLift(wobbly) && !liftSafe(wobbly));
  assert.equal(lift(wobbly), 0);
  assert.equal(wobbly.phase, P_FALL); assert.equal(wobbly.bonus, 0);
});

test("the events come out once, in order, and the round ends in DONE", () => {
  const top = createTop(21, 4);
  throwTop(top, 0.9, 0.9);
  const seen: number[] = [];
  for (let i = 0; i < 60 * 120 && top.phase !== P_DONE; i++) {
    advance(top, DT);
    for (let e = 0; e < top.evN; e++) seen.push(top.evType[e]);
    top.evN = 0;
  }
  assert.equal(top.phase, P_DONE);
  assert.equal(seen[0], E_THROW);
  assert.equal(seen[1], E_LAND);
  assert.equal(seen.filter(e => e === E_DONE).length, 1);
  assert.equal(seen.filter(e => e === E_FALL).length, 1);
  assert.equal(seen.filter(e => e === E_LIFTABLE).length <= 1, true);
  assert.equal(seen.filter(e => e === E_PALM).length, 0);
  assert.ok(seen.filter(e => e === E_NUDGE).length === 0);
  assert.ok(seen.indexOf(E_FALL) < seen.indexOf(E_DONE));
  const after = fingerprint(top);
  advance(top, DT); advance(top, DT);
  assert.equal(fingerprint(top), after, "nothing moves once it is done");
  assert.equal(cancelWind(top), undefined);
});

test("headless runs end sanely: every spin stops, with a plausible time", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const taps of ["none", "timed", "spam"] as const) {
    const top = spin(level * 13, level, { power: 0.9, straight: 0.9, taps });
    assert.ok(top.phase === P_FALL && top.t > 1 && top.t < 60, `level ${level} ${taps} ${top.t}`);
  }
});
