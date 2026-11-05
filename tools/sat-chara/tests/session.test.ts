// The statechart's bug paths (ai_docs/statecharts/sat-chara/), replayed against the pure session, round and save code the
// component runs. Each test is named after the rule it proves.
import assert from "node:assert/strict";
import test from "node:test";
import { createRound, launch, type Round } from "../lib/game";
import { migrateStars, newLevelOf, openAfter, playable, readOpen, recommended } from "../lib/save";
import * as S from "../lib/session";
import { advance, E_SETTLE } from "../lib/step.hot";

function playing(sound = true) {
  const s = S.createSession(sound), started: string[] = [];
  const loops: S.Loops = { start: () => { started.push("start"); }, stop: () => { started.push("stop"); } };
  S.goTo(s, "play");
  return { s, loops, started };
}
/** What the component's step() does each frame: nothing unless the session ticks. */
function frames(s: S.Session, r: Round, count: number) { for (let k = 0; k < count; k++) if (S.ticking(s)) advance(r); }

test("statechart InputReleasedWhenAway + HumOnlyWhilePulling: pulling when another window takes focus drops the pull and the hum, and the late pointerup throws nothing", () => {
  const { s, loops, started } = playing();
  assert.ok(S.pullStart(s, 1000, true));
  S.pullMoved(s); S.syncHum(s, loops);
  assert.equal(s.hum, true, "the hum plays while you pull");
  S.blur(s); S.syncHum(s, loops);
  assert.equal(s.hold, "none"); assert.equal(s.hum, false); assert.deepEqual(started, ["start", "stop"]);
  assert.equal(S.pullEnd(s), "none", "the pointerup that comes later is not a throw");
  // The same for a hidden tab and for the player's menu.
  for (const away of [S.hide, S.pause]) {
    const p = playing();
    S.pullStart(p.s, 1000, true); S.pullMoved(p.s); S.syncHum(p.s, p.loops);
    away(p.s); S.syncHum(p.s, p.loops);
    assert.equal(p.s.hum, false); assert.equal(S.pullEnd(p.s), "none");
  }
});

test("statechart NoProgressWhileAway + PausedWhenBlurred: a ball in the air waits while you're away, the clock too", () => {
  const { s } = playing(), r = createRound("level", 14);
  launch(r, 0.3, 0.6);
  frames(s, r, 5);
  const clock = r.world.clock, x = r.world.bx;
  S.blur(s); frames(s, r, 300);
  assert.equal(r.world.clock, clock); assert.equal(r.world.bx, x); assert.equal(r.phase, "flying");
  S.focus(s); S.pause(s); frames(s, r, 300);
  assert.equal(r.world.clock, clock, "nor under the menu");
  S.resume(s, 5000); frames(s, r, 400);
  assert.notEqual(r.phase, "flying", "and it lands once you're back");
});

test("statechart HumComesBack: turning sound on mid-pull brings a fresh hum (never the muted stub)", () => {
  const { s, loops, started } = playing(false);
  S.pullStart(s, 1000, true); S.pullMoved(s); S.syncHum(s, loops);
  assert.equal(s.hum, false, "muted: no hum");
  S.setSound(s, true); S.syncHum(s, loops);
  assert.equal(s.hum, true); assert.deepEqual(started, ["start"], "a new loop is made when sound comes back");
  // Sound off: the kit has already stopped every loop, so the session just marks it gone.
  S.setSound(s, false); S.syncHum(s, loops);
  assert.equal(s.hum, false); assert.equal(S.humWanted(s), false);
});

test("statechart OnePressOneThrow: holding Enter throws once, never on the auto-repeat", () => {
  const { s } = playing();
  assert.equal(S.keyDown(s, { repeat: false, timeStamp: 1000 }), true, "the press acts");
  let acts = 0;
  for (let k = 1; k <= 60; k++) if (S.keyDown(s, { repeat: true, timeStamp: 1000 + k * 33 })) acts++;
  assert.equal(acts, 0, "no repeat acts");
  assert.equal(S.keyDown(s, { repeat: false, timeStamp: 4000 }), false, "a second keydown while the key is still down does nothing");
  S.keyUp(s);
  assert.equal(S.keyDown(s, { repeat: false, timeStamp: 4100 }), true, "a fresh press works again");
});

test("statechart NoKeyPastResult: Enter held through the end of a level never skips the stars or starts the next ball", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 5000);
  assert.equal(S.freshResultKey(s, { timeStamp: 5200, repeat: false }), false, "too soon after the stars appear");
  assert.equal(S.freshResultKey(s, { timeStamp: 6000, repeat: true }), false, "a held key's repeat");
  assert.equal(S.freshResultKey(s, { timeStamp: 6000, repeat: false }), true, "a fresh press later");
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 7000, repeat: false }), false, "nothing under the menu");
  // The next level starts on its title, so the very press that left the result can't throw: play needs a fresh press.
  const t = playing().s;
  assert.equal(S.keyDown(t, { repeat: true, timeStamp: 9000 }), false);
});

test("statechart FocusClickIsNotAThrow: the tap that brings you back only wakes the game", () => {
  const { s } = playing();
  S.pause(s); S.resume(s, 10_000);
  assert.equal(S.pullStart(s, 10_100, true), false, "a press 100 ms after চালিয়ে যাও does nothing");
  assert.equal(S.keyDown(s, { repeat: false, timeStamp: 10_120 }), false);
  S.keyUp(s);
  assert.equal(S.pullStart(s, 10_400, true), true, "a later press aims");
});

test("statechart ChoiceFreezesPlay: সব লেভেল pauses the round and drops the pull", () => {
  const { s, loops } = playing(), r = createRound("level", 12);
  launch(r, 0.2, 0.7);
  S.pullStart(s, 100, false);
  S.openSheet(s); S.syncHum(s, loops);
  const clock = r.world.clock;
  frames(s, r, 200);
  assert.equal(r.world.clock, clock); assert.equal(s.hold, "none");
  S.closeSheet(s, 5000);
  assert.equal(S.ticking(s), true);
});

test("statechart OpenLevelsAreEarned: a friend's far level, cleared on a fresh phone, records its stars and opens nothing between", () => {
  let open = readOpen(null, {}).open;
  assert.equal(open, 1);
  const visit = 9;
  assert.ok(playable(9, open, visit), "the friend's level is playable this visit");
  assert.ok(!playable(2, open, visit) && !playable(8, open, visit) && !playable(10, open, visit));
  open = openAfter(open, 9);
  assert.equal(open, 1, "clearing it opens nothing");
  assert.ok(!playable(9, open, 0), "next visit, without the link, it's closed again");
  // Your own clears open one at a time.
  open = openAfter(open, 1); open = openAfter(open, 2);
  assert.equal(open, 3);
  assert.equal(openAfter(open, 1), 3, "replaying an earlier level opens nothing more");
  // Saved progress from before the rewrite: the stars move to the new numbers once, the opening counts the unbroken run.
  const old = migrateStars(JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 3, 18: 3 }), false);
  assert.deepEqual(old.stars, { 1: 3, 2: 3, 9: 3 });
  assert.equal(readOpen(null, old.stars).open, 3, "level 9 from an old friend's link doesn't open 3–8");
  assert.deepEqual(migrateStars(JSON.stringify({ 1: 3, 9: 2 }), true).stars, { 1: 3, 9: 2 }, "and it runs once");
  assert.deepEqual([1, 2, 3, 10, 11, 20, 21, 29, 30].map(newLevelOf), [1, 1, 2, 5, 6, 10, 11, 15, 15]);
  assert.equal(recommended({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(recommended({ 1: 3, 2: 3, 3: 3 }, 3), 3);
});

test("a round settles once per ball and ends once", () => {
  const r = createRound("level", 1);
  let settles = 0;
  for (let ball = 0; ball < 4; ball++) {
    launch(r, 70 * Math.PI / 180, 0.1);
    for (let k = 0; k < 600; k++) if (advance(r) & E_SETTLE) { settles++; break; }
  }
  assert.equal(settles, 3); assert.equal(r.phase, "done");
  assert.equal(launch(r, 0, 1), false, "no fourth ball");
});
