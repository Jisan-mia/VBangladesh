// The statechart's bug paths (ai_docs/statecharts/dudh-uthlano), replayed against the pure session and round.
import assert from "node:assert/strict";
import test from "node:test";
import { liftPot, newRound, startPot, type Round } from "../lib/round";
import * as S from "../lib/session";
import { createSlot, type Clock } from "../lib/slot";
import { stepRound } from "../lib/step.hot";

const DT = 1 / 60;
const playing = () => { const s = S.createSession(true); S.goTo(s, "play"); return s; };

/** What the component's step does each frame: nothing unless the session ticks, a breath first after coming back. */
function advance(s: S.Session, round: Round, seconds: number) {
  for (let t = 0; t < seconds; t += DT) {
    if (!S.ticking(s)) continue;
    if (s.breath > 0) { s.breath = Math.max(0, s.breath - DT); continue; }
    stepRound(round, DT, 1, 1);
    s.rising = round.phase === "rising";
  }
}
function light(s: S.Session, round: Round, at = 0) {
  assert.ok(S.press(s, at)); startPot(round); s.rising = true;
}

test("PausedWhenBlurred: you hold, click another window for three seconds, and the milk has not moved", () => {
  const s = playing(), round = newRound(5, 3);
  light(s, round);
  advance(s, round, 0.4);
  const before = round.foam, clock = round.t;
  assert.ok(before > 0 && before < 0.2);
  S.blur(s);
  advance(s, round, 3);
  assert.equal(round.foam, before);
  assert.equal(round.t, clock);
  assert.equal(round.phase, "rising", "it did not boil over while you were away");
  assert.equal(round.spills[0], false);
  // Hiding the tab and the player's menu are the same.
  S.focus(s); S.hide(s); advance(s, round, 3); assert.equal(round.foam, before);
  S.show(s); S.pause(s); advance(s, round, 3); assert.equal(round.foam, before);
  S.resume(s); S.openSheet(s); advance(s, round, 3); assert.equal(round.foam, before);
});

test("InputReleasedWhenAway: after you come back, a press lifts the pot at once (it is not ignored while a stale hold waits for a keyup)", () => {
  const s = playing(), round = newRound(5, 3);
  light(s, round);
  advance(s, round, 0.6);
  S.blur(s);
  assert.equal(s.held, false, "blur lets go of the button, so the lost keyup can't leave it held");
  S.focus(s);
  assert.ok(S.wake(s));
  assert.equal(S.press(s, 1000), false, "the click that brings focus back is not a move");
  advance(s, round, S.BREATH + DT * 2);
  assert.equal(s.breath, 0);
  const level = round.foam;
  assert.equal(S.press(s, 2000), true, "now a press counts");
  assert.ok(liftPot(round), "and it lifts the pot at the height it was");
  assert.equal(round.scores[0], Math.floor(level * 100 + 1e-6));
  // The press that came with the lift ends cleanly.
  assert.equal(S.release(s, 2050), "tap");
  assert.equal(S.release(s, 2060), "");
});

test("the hold or the tap: let go after 260 ms lifts, a quick tap keeps the milk heating", () => {
  const s = playing();
  assert.ok(S.press(s, 100));
  assert.equal(S.release(s, 100 + S.HOLD_MS - 1), "tap");
  assert.ok(S.press(s, 500));
  assert.equal(S.release(s, 500 + S.HOLD_MS), "hold");
  assert.equal(S.press(s, 900), true);
  assert.equal(S.press(s, 901), false, "a second finger or a repeat never double-presses");
  assert.ok(S.HOLD_MS > 150 && S.HOLD_MS < 400);
});

test("input is ignored on the title, the story, the end and with the menu or the list open", () => {
  for (const screen of ["title", "intro", "over"] as const) { const s = S.createSession(true); S.goTo(s, screen); assert.equal(S.press(s, 0), false, screen); }
  const s = playing();
  S.pause(s); assert.equal(S.press(s, 0), false); S.resume(s);
  S.openSheet(s); assert.equal(S.press(s, 0), false); S.closeSheet(s);
  assert.equal(S.press(s, 0), true);
});

test("HumComesBack and HumOnlyWhileHeating: the stove hums only while milk rises, and sound back on restores it", () => {
  const s = playing();
  let starts = 0, stops = 0, live = 0;
  const loops: S.Loops = { start: () => { starts++; live++; }, stop: () => { stops++; live = Math.max(0, live - 1); } };
  S.syncHum(s, loops);
  assert.equal(live, 0, "no hum on a waiting pot");
  s.rising = true; S.syncHum(s, loops);
  assert.equal(live, 1, "milk is rising: it hums");
  // Sound off: the kit has already stopped every loop; the session knows it is gone.
  S.setSound(s, false); live = 0;
  S.syncHum(s, loops);
  assert.equal(live, 0);
  S.setSound(s, true); S.syncHum(s, loops);
  assert.equal(live, 1, "turned back on while the milk is still rising: a fresh hum");
  assert.equal(starts, 2);
  // Every way the milk stops stops the hum.
  for (const away of [S.blur, S.hide, S.pause, S.openSheet]) {
    const t = playing(); t.rising = true; let on = 0;
    const l: S.Loops = { start: () => { on++; }, stop: () => { on--; } };
    S.syncHum(t, l); assert.equal(on, 1);
    away(t); S.syncHum(t, l); assert.equal(on, 0);
  }
  const over = playing(); over.rising = true; S.syncHum(over, loops); S.goTo(over, "over", 5); S.syncHum(over, loops);
  assert.equal(S.wantHum(over), false, "no hum on the end screen");
  const result = playing(); result.rising = false;
  assert.equal(S.wantHum(result), false, "no hum while a pot's score shows");
  assert.ok(stops >= 1);
});

test("coming back from every kind of away takes one breath, and not coming back from a calm screen takes none", () => {
  for (const [name, away, back] of [["blur", S.blur, S.focus], ["hide", S.hide, S.show], ["menu", S.pause, S.resume], ["list", S.openSheet, S.closeSheet]] as const) {
    const s = playing();
    away(s); back(s);
    assert.ok(S.wake(s), name);
    assert.equal(s.breath, S.BREATH, name);
  }
  const calm = S.createSession(true);
  S.blur(calm); S.focus(calm);
  assert.equal(S.wake(calm), false, "no breath on the title");
});

test("CelebrationOnItsOwnCard: the confetti queued for a card never fires after you start the next round", () => {
  const timers = new Map<number, () => void>();
  let next = 1;
  const clock: Clock = { set: run => { timers.set(next, run); return next++; }, clear: id => { timers.delete(id); } };
  const fireAll = () => { for (const [id, run] of [...timers]) { timers.delete(id); run(); } };
  const party = createSlot(clock);
  let fired = 0;
  // The round ends, the card shows, the celebration is queued; the player presses পরের লেভেল before it fires.
  party.schedule(() => { fired++; }, 700);
  assert.ok(party.pending());
  party.cancel();
  fireAll();
  assert.equal(fired, 0);
  assert.equal(party.pending(), false);
  // Without a new round it does fire, once.
  party.schedule(() => { fired++; }, 700);
  fireAll();
  assert.equal(fired, 1);
  assert.equal(party.pending(), false);
  // A second schedule replaces the first.
  party.schedule(() => { fired += 10; }, 1); party.schedule(() => { fired += 100; }, 1);
  fireAll();
  assert.equal(fired, 101);
});

test("result keys need a fresh press: a key held through the end never skips the card or starts the next round", () => {
  const s = playing();
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 900, repeat: false }), false, "pressed before the card appeared");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "auto-repeat of a held key");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true);
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not with the menu open");
  S.resume(s); S.openSheet(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not with the list open");
  assert.equal(S.freshResultKey(playing(), { timeStamp: 5000, repeat: false }), false, "only on the end screen");
});

test("a pot that boils over while a finger is down releases it, so the next press starts the next pot", () => {
  const s = playing(), round = newRound(5, 3);
  light(s, round);
  let spilled = false;
  for (let i = 0; i < 60 * 10 && !spilled; i++) { stepRound(round, DT, 1, 1); spilled = round.phase === "result"; }
  assert.ok(spilled);
  s.held = false; s.rising = false;
  assert.equal(S.release(s, 9999), "", "the late keyup does nothing");
  for (let i = 0; i < 90; i++) stepRound(round, DT, 1, 1);
  assert.equal(round.phase, "waiting");
  assert.equal(S.press(s, 20000), true);
});
