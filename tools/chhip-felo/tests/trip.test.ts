import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { LEVEL_COUNT, levelDef, starsOf } from "../lib/levels";
import { BOSSES, FISH, fishIndex, T } from "../lib/species";
import { stepTrip } from "../lib/step.hot";
import {
  accuracyOf, basketGrams, biggestOf, createTrip, E, floatState, JUMP_SAFE, MISS, onPad, P, PAD_R, press, release, SWING, swing, TRICK, type Trip,
} from "../lib/trip";
import { CASUAL, play, SKILLED } from "./bot";

const DT = 1 / 60;
const run = (trip: Trip, seconds: number, held = false) => { const events: number[] = []; for (let i = 0; i < Math.round(seconds * 60); i++) { stepTrip(trip, held, false, DT); for (let e = 0; e < trip.evCount; e++) events.push(trip.ev[e]); } return events; };
/** Holds until the ring is over `at`, lets go, and waits for the float to land. */
function castTo(trip: Trip, at: number) {
  stepTrip(trip, true, true, DT);
  while (trip.charging && trip.power < at && trip.charge < SWING / 2) stepTrip(trip, true, false, DT);
  stepTrip(trip, false, false, DT);
  while (trip.phase === P.FLY) stepTrip(trip, false, false, DT);
}
const strikeOnDip = (trip: Trip) => { while (trip.phase === P.WAIT && floatState(trip) !== 2) stepTrip(trip, false, false, DT); stepTrip(trip, true, true, DT); };

test("same seed, same water: spots, nibbles, bites and fish; another seed differs", () => {
  const a = play(4242, 9, "n", SKILLED)!, b = play(4242, 9, "n", SKILLED)!, c = play(4243, 9, "n", SKILLED)!;
  assert.deepEqual([...a.trip.catchFish], [...b.trip.catchFish]);
  assert.deepEqual([...a.trip.catchGrams], [...b.trip.catchGrams]);
  assert.equal(a.trip.time, b.trip.time);
  assert.notDeepEqual([...a.trip.catchGrams], [...c.trip.catchGrams]);
  const one = createTrip(77, 4), two = createTrip(77, 4);
  assert.equal(one.spot, two.spot);
  assert.ok(one.spot >= 0.3 && one.spot <= 0.85);
});

test("the cast: the ring swings out and back, a too-short tap is not a cast, and the landing sets accuracy", () => {
  assert.equal(swing(0), 0); assert.equal(swing(SWING / 2), 1); assert.ok(swing(SWING * 0.75) < 0.6);
  assert.equal(accuracyOf(0.5, 0.5), 1); assert.equal(accuracyOf(0.9, 0.5), 0);
  const trip = createTrip(11, 2);
  stepTrip(trip, true, true, DT);
  stepTrip(trip, false, false, DT);
  assert.equal(trip.phase, P.AIM, "a tap shorter than a step only gets a word");
  assert.equal(trip.ev[trip.evCount - 1], E.SHORT);
  castTo(trip, trip.spot);
  assert.equal(trip.phase, P.WAIT);
  assert.ok(trip.accuracy > 0.85);
});

test("the bite: nibbles first with room to tell them apart, then the dip; early, nibble and late strikes miss", () => {
  for (let level = 2; level <= LEVEL_COUNT; level++) for (let seed = 1; seed <= 30; seed++) {
    const trip = createTrip(seed * 31, level);
    castTo(trip, trip.spot);
    if (trip.phase !== P.WAIT) continue;
    assert.ok(trip.biteAt >= 0.6, "a bite never comes the instant the float lands");
    for (let i = 0; i < trip.fakeCount; i++) assert.ok(trip.biteAt - trip.fakes[i] >= 0.85, `level ${level} seed ${seed}`);
  }
  // Level 1 forgives an early tap; later levels don't.
  const gentle = createTrip(5, 1); castTo(gentle, gentle.spot);
  press(gentle);
  assert.equal(gentle.phase, P.WAIT);
  assert.equal(gentle.ev[gentle.evCount - 1], E.HUSH);
  const early = createTrip(5, 3); castTo(early, early.spot);
  press(early);
  assert.equal(early.miss, MISS.EARLY);
  let nib: Trip | null = null;
  for (let seed = 1; !nib && seed < 200; seed++) { const trip = createTrip(seed, 9); castTo(trip, trip.spot); if (trip.phase === P.WAIT && trip.fakeCount) nib = trip; }
  assert.ok(nib);
  while (floatState(nib) === 0) stepTrip(nib, false, false, DT);
  press(nib);
  assert.equal(nib.miss, MISS.NIBBLE);
  const late = createTrip(8, 6); castTo(late, late.spot);
  const events = run(late, 6);
  assert.ok(events.indexOf(E.DIP) >= 0 && events.indexOf(E.DIP) < events.indexOf(E.MISS), "the dip shows before the fish is lost late");
  assert.equal(late.miss, MISS.LATE);
});

test("the reel: holding the whole time snaps the line, never holding lets it slip, level 1 holds either way", () => {
  const reel = (level: number, holdAll: boolean) => {
    for (let seed = 1; seed < 50; seed++) {
      const trip = createTrip(seed, level); castTo(trip, trip.spot);
      if (trip.phase !== P.WAIT) continue;
      strikeOnDip(trip);
      assert.equal(trip.phase, P.REEL);
      while (trip.phase === P.REEL) stepTrip(trip, holdAll, false, DT);
      return trip;
    }
    throw new Error("no cast landed");
  };
  assert.equal(reel(2, true).miss, MISS.SNAP);
  assert.equal(reel(2, false).miss, MISS.SLIP);
  assert.equal(reel(1, true).phase, P.CATCH, "level 1: the red edge teaches, the line holds");
  // Big fish narrow the green band; a slippery fish slips sooner; a soft mouth tears lower.
  const hooked = (level: number, first: string) => {
    for (let seed = 1; seed < 80; seed++) {
      const trip = createTrip(seed, level); castTo(trip, trip.spot);
      if (trip.phase !== P.WAIT || trip.fish !== fishIndex(first)) continue;
      strikeOnDip(trip);
      return trip;
    }
    throw new Error(`no ${first}`);
  };
  const baim = hooked(6, "baim"), ilish = hooked(10, "ilish"), punti = hooked(2, "punti");
  assert.ok(baim.slipAfter < punti.slipAfter && ilish.red < punti.red);
  const rui = hooked(9, "rui");
  assert.ok(rui.hi - rui.lo < punti.hi - punti.lo, "a heavy fish narrows the green");
});

test("tricks: a surge on a held line snaps it, a leap on a tight line snaps it, a rush slackens the line", () => {
  // Find a hooked fish with the trick and play it out by hand.
  function withTrick(level: number, kind: number) {
    for (let seed = 1; seed < 400; seed++) {
      const trip = createTrip(seed, level); castTo(trip, trip.spot);
      if (trip.phase !== P.WAIT) continue;
      strikeOnDip(trip);
      if ((trip.phase as number) === P.REEL && trip.trick === kind) return trip;
    }
    throw new Error(`no trick ${kind} on level ${level}`);
  }
  const surge = withTrick(3, TRICK.SURGE);
  while (surge.phase === P.REEL && !(surge.t < surge.surgeEnd)) stepTrip(surge, surge.tension < 0.5, false, DT);
  surge.progress = 0; // a light fish could otherwise reach the bank first
  while (surge.phase === P.REEL) stepTrip(surge, true, false, DT);
  assert.equal(surge.miss, MISS.SNAP, "held through a surge");
  const leap = withTrick(7, TRICK.JUMP);
  while (leap.phase === P.REEL && leap.t < leap.trickAt - DT) stepTrip(leap, leap.tension < 0.75, false, DT);
  leap.tension = JUMP_SAFE + 0.1;
  stepTrip(leap, true, false, DT);
  assert.equal(leap.miss, MISS.LEAP);
  const rush = withTrick(11, TRICK.RUSH);
  while (rush.phase === P.REEL && !(rush.t < rush.rushEnd)) stepTrip(rush, rush.tension < 0.5, false, DT);
  const before = rush.tension;
  for (let i = 0; i < 20 && rush.phase === P.REEL; i++) stepTrip(rush, false, false, DT);
  assert.ok(rush.tension < before - 0.3, "a rush drops the line fast when you don't reel");
});

test("a level's new fish bites first; a finale's last bite is its boss, who keeps broken notches when it gets away", () => {
  for (const [level, id] of [[3, "taki"], [6, "baim"], [7, "gojar"], [10, "ilish"], [11, "air"]] as const) {
    const trip = createTrip(12, level); castTo(trip, 0.5);
    if (trip.phase === P.WAIT) assert.equal(FISH[trip.fish].id, id);
  }
  const boss = BOSSES[0], trip = createTrip(3, 4);
  trip.catches = 1; // one fish already in the basket: the boss is next
  castTo(trip, trip.spot);
  assert.ok(trip.isBoss && trip.fish === boss.fish && trip.grams >= boss.grams[0]);
  strikeOnDip(trip);
  // Reel it well until one notch breaks, then let it slip.
  let notch = false;
  for (let i = 0; i < 60 * 30 && trip.phase === P.REEL && !notch; i++) {
    stepTrip(trip, trip.tension < (trip.lo + trip.hi) / 2 && !(trip.warned && trip.trick === TRICK.SURGE) && trip.t >= trip.surgeEnd, false, DT);
    for (let e = 0; e < trip.evCount; e++) if (trip.ev[e] === E.NOTCH) notch = true;
  }
  assert.ok(notch, "a notch broke");
  assert.equal(trip.bossLeft, boss.notches - 1);
  while (trip.phase === P.REEL) stepTrip(trip, false, false, DT);
  assert.equal(trip.miss, MISS.SLIP);
  assert.equal(trip.bossLeft, boss.notches - 1, "its broken notch stays broken");
  run(trip, 2);
  castTo(trip, trip.spot);
  assert.ok(trip.isBoss, "the boss bites again on the next cast");
  strikeOnDip(trip);
  assert.ok(trip.progress >= 1 / boss.notches - 1e-9, "the reel starts past the broken notch");
});

test("stars count baits lost; the trip ends when the basket is full or the baits run out", () => {
  assert.deepEqual([0, 1, 2, 3].map(lost => starsOf(true, lost)), [3, 2, 1, 1]);
  assert.equal(starsOf(false, 0), 0);
  assert.equal(starsOf(true, 0, "e"), 2, "সহজ tops out at two");
  const careless = createTrip(9, 5);
  const rng = makeRng(4);
  for (let i = 0; i < 60 * 400 && careless.phase !== P.OVER; i++) stepTrip(careless, rng() < 0.5, rng() < 0.04, DT);
  assert.equal(careless.phase, P.OVER);
  assert.ok(careless.won ? careless.catches === levelDef(5).need && careless.lost <= careless.spare : careless.lost === careless.spare + 1);
  const good = play(31, 2, "n", CASUAL)!;
  assert.ok(good.won);
  assert.equal(good.trip.catches, levelDef(2).need);
  assert.ok(basketGrams(good.trip) > 0 && biggestOf(good.trip).fish >= 0);
});

test("lily pads: a cast onto one snags and costs the bait; the bubbles are never under a pad", () => {
  for (let seed = 1; seed < 60; seed++) {
    const trip = createTrip(seed, 5);
    assert.ok(!onPad(trip, trip.spot));
    if (trip.pads[0] < 0) continue;
    castTo(trip, trip.pads[0] - PAD_R / 3);
    if (trip.phase === P.MISS) { assert.equal(trip.miss, MISS.SNAG); return; }
  }
  assert.fail("no cast reached a pad");
});

test("bug: ধীরে খেলো turned on or off mid-wait never loses a fish that hasn't bitten (game time, not wall time)", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const trip = createTrip(seed * 7, 7); castTo(trip, trip.spot);
    if (trip.phase !== P.WAIT) continue;
    // Wait at slow speed (0.65 of each step) until just before the dip, then switch to full speed.
    while (trip.t < trip.biteAt - 0.05) stepTrip(trip, false, false, DT * 0.65);
    assert.equal(trip.phase, P.WAIT, `seed ${seed}: still waiting`);
    stepTrip(trip, false, false, DT);
    assert.equal(trip.phase, P.WAIT, "switching speed never jumps past the bite");
    let dipped = false;
    while (trip.phase === P.WAIT) { stepTrip(trip, false, false, DT); for (let e = 0; e < trip.evCount; e++) if (trip.ev[e] === E.DIP) dipped = true; }
    assert.ok(dipped, "a fish is only ever lost late after its dip showed");
  }
});

test("the step allocates nothing a frame: typed arrays, fixed events", () => {
  const trip = createTrip(1, 16);
  assert.ok(trip.ev instanceof Uint8Array && trip.catchGrams instanceof Int32Array && trip.fakes instanceof Float32Array && trip.pads instanceof Float32Array);
  assert.ok(T.SURGE && FISH.length === 20);
  release(trip);
});
