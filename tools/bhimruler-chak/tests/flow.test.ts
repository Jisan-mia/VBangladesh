// The statechart's paths (ai_docs/statecharts/bhimruler-chak), replayed against the pure flow, rules and save logic.
import assert from "node:assert/strict";
import test from "node:test";
import * as F from "../lib/flow";
import { dig, enter, newRound, puzzleOf, tie, COVERED, TIED } from "../lib/play";
import { openAfter, readOpen } from "../lib/save";

const playing = (at = 0) => F.start(F.titleFlow(), at);

test("bug 1 · ClockStillWhileAway: clicking into another window stops the star clock and holds play, and coming back doesn't restart it on its own", () => {
  // (0) waiting → (1) you clear a bush at 1 s → (2) you click into another window, 5 s pass.
  let f = playing(0);
  assert.equal(Math.floor(F.elapsed(f, 1000)), 1);
  f = F.away(f, true, 1000);
  assert.ok(!F.running(f), "away holds play");
  assert.equal(Math.floor(F.elapsed(f, 6000)), 1, "the clock read ০০:০১ before and still does");
  assert.ok(!F.takesPress(f, 6000), "no bush acts while you're away");
  // The player's menu opens with it; focus comes back, the menu is still up: the clock stays put.
  f = F.menu(f, true, 1000);
  f = F.away(f, false, 6000);
  assert.equal(Math.floor(F.elapsed(f, 9000)), 1);
  f = F.menu(f, false, 9000);
  assert.equal(Math.floor(F.elapsed(f, 10_000)), 2, "চালিয়ে যাও: it runs on from where it was");
  // A hidden tab is the same hold.
  const hidden = F.away(playing(0), true, 2000);
  assert.equal(Math.floor(F.elapsed(hidden, 60_000)), 2);
});

test("bug 2 · InputReleasedWhenAway: a finger held on a bush through a blur is let go, and its long press never ties a গামছা", () => {
  const round = enter(newRound(puzzleOf(5, 31)!))!.round;
  const bush = [...round.cells.keys()].find(cell => round.cells[cell] === COVERED)!;
  // (0) playing → (1) you press and hold a bush → (2) another window takes focus → the 400 ms timer fires.
  let f = F.pressDown(playing(0), bush, 1000);
  assert.equal(f.hold, bush);
  f = F.away(f, true, 1100);
  assert.equal(f.hold, -1, "away lets go of the finger");
  assert.equal(F.holdTies(f, bush, 1400), -1, "so the long press ties nothing");
  // The same with the player's menu, and with the sheet.
  assert.equal(F.menu(F.pressDown(playing(0), bush, 1000), true, 1100).hold, -1);
  assert.equal(F.sheet(F.pressDown(playing(0), bush, 1000), true, 1100).hold, -1);
  // Without leaving, the long press does tie, and only the bush still held.
  const held = F.pressDown(playing(0), bush, 1000);
  assert.equal(F.holdTies(held, bush, 1400), bush);
  assert.equal(F.holdTies(held, bush + 1, 1400), -1);
  assert.equal(F.holdTies(F.pressUp(held), bush, 1400), -1, "a lifted finger ties nothing");
  assert.equal(tie(round, F.holdTies(held, bush, 1400))!.cells[bush], TIED);
  // A finger can't even go down while play is held, or in the moment you come back.
  assert.equal(F.pressDown(F.away(playing(0), true, 10), bush, 20).hold, -1);
  assert.equal(F.pressDown(F.away(F.away(playing(0), true, 10), false, 500), bush, 600).hold, -1);
});

test("bug 3 · LinkOpensOnlyItsLevel and SavedUnlockIsEarned: a friend's link to level 3 opens only level 3, and clearing it opens nothing in between", () => {
  // (0) no link, nothing cleared → (1) a friend's link to level 3 → (2) you clear level 3 before level 1.
  let open = readOpen(null, {});
  assert.equal(open, 1);
  open = openAfter(open, 3);
  assert.equal(open, 1, "levels 2 and 3 stay closed for your own play");
  // Reloading without the hash: the saved open level wins, so the stars {3: 1} don't open levels 2–4.
  assert.equal(readOpen(String(open), { 3: 1 }), 1);
  // Clearing level 1 then opens level 2, as it should.
  assert.equal(openAfter(open, 1), 2);
  // The old ladder's progress is still honoured once, by the migration.
  assert.equal(readOpen(null, { 1: 3, 2: 1 }), 3);
});

test("ComeBackIsNotAMove: the tap that brings the window back, or closes the menu, never clears a bush", () => {
  let f = F.away(playing(0), true, 1000);
  f = F.away(f, false, 5000);
  assert.ok(!F.takesPress(f, 5000 + 10));
  assert.ok(F.takesPress(f, 5000 + F.BACK_GUARD_MS));
  const m = F.menu(F.menu(playing(0), true, 1000), false, 2000);
  assert.ok(!F.takesPress(m, 2100));
  assert.ok(F.takesPress(m, 2000 + F.BACK_GUARD_MS + 1));
});

test("ChoiceFreezesPlay: সব লেভেল holds the clock; closing it runs on", () => {
  let f = F.sheet(playing(0), true, 3000);
  assert.ok(!F.running(f) && !F.takesPress(f, 9000));
  assert.equal(Math.floor(F.elapsed(f, 9000)), 3);
  f = F.sheet(f, false, 9000);
  assert.equal(Math.floor(F.elapsed(f, 10_000)), 4);
});

test("NoDoubleResult and fresh result keys: the end comes once, and a key held through the last bush can't skip it", () => {
  const over = F.finish(playing(0), 20_000);
  assert.equal(over.screen, "over");
  assert.equal(F.finish(over, 30_000), over, "finishing twice changes nothing");
  assert.equal(Math.floor(F.elapsed(over, 99_000)), 20, "the clock stops for good");
  assert.ok(!F.takesResultKey(over, 20_100, false), "too soon");
  assert.ok(!F.takesResultKey(over, 21_000, true), "an auto-repeat never counts");
  assert.ok(F.takesResultKey(over, 21_000, false));
  assert.ok(!F.takesResultKey(F.menu(over, true, 21_000), 22_000, false), "not under the menu");
});

test("HumOnlyWhenMeaningful and HumComesBack: the hornets' hum plays only after a sting, on a live orchard, with sound on", () => {
  const f = playing(0);
  assert.ok(!F.wantsHum(true, f, 0), "no sting, no hum");
  assert.ok(F.wantsHum(true, f, 1));
  assert.ok(!F.wantsHum(false, f, 1), "sound off");
  assert.ok(!F.wantsHum(true, F.menu(f, true, 10), 1), "paused");
  assert.ok(!F.wantsHum(true, F.away(f, true, 10), 1), "away");
  assert.ok(!F.wantsHum(true, F.finish(f, 10), 1), "the end");
  assert.ok(F.wantsHum(true, F.menu(F.menu(f, true, 10), false, 20), 1), "it comes back on resume");
  // A sting on a live round is what makes it wanted.
  const round = enter(newRound(puzzleOf(3, 8)!))!.round, o = round.puzzle.orchard;
  const nest = [...o.nest.keys()].find(cell => o.nest[cell])!;
  assert.ok(F.wantsHum(true, f, dig(round, nest)!.round.stings));
});

test("restart and a new level return to the start card with a fresh clock, keeping any hold", () => {
  const f = F.toTitle(F.menu(playing(0), true, 5000));
  assert.equal(f.screen, "title");
  assert.ok(f.menu, "নতুন করে শুরু closes the menu itself, not toTitle");
  assert.equal(F.elapsed(f, 9000), 0);
  assert.equal(F.start(F.toTitle(playing(0)), 100).since, 100);
});
