import assert from "node:assert/strict";
import test from "node:test";
import * as S from "../lib/session";

const playing = (over = false) => { const s = S.createSession(); assert.ok(S.begin(s, over)); return s; };

test("bug 2, EveryFinishedRaceCounts: the race is recorded at the moment the boat arrives, whatever the hand does next", () => {
  const s = playing();
  assert.equal(S.arrived(s, true), true, "the caller records the stars and the limit is checked now");
  assert.equal(s.recorded, s.serial);
  assert.equal(s.resting, true);
  assert.equal(S.restShows(s), false, "the rest screen waits for the end page");
  S.toTitle(s);                         // নতুন করে শুরু a moment later
  assert.equal(s.recorded, s.serial, "still counted");
  assert.equal(S.arrived(s, true), false, "never recorded twice");
});

test("bug 2, the end page: the rest screen shows only at a break", () => {
  const s = playing();
  S.arrived(s, true);
  assert.equal(S.restShows(s), false);
  S.cardShows(s, 100);
  assert.equal(S.restShows(s), true);
  assert.equal(S.touch(s), "ignored");
});

test("RestOnlyAtBreak and NoNewRoundPastLimit: past today's limit a race does not start", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title"); assert.equal(s.resting, true); assert.equal(s.serial, 0);
  S.extend(s);
  assert.equal(S.begin(s, false), true);
  assert.equal(S.restShows(s), false);
});

test("bug 5, the mode: a tap on the mode already on, or one made anywhere but the title, changes nothing", () => {
  const s = S.createSession();
  assert.equal(S.chooseMode(s, false), false, "already on");
  assert.equal(S.chooseMode(s, true), true);
  assert.equal(s.duo, true);
  S.begin(s, false);
  assert.equal(S.chooseMode(s, false), false, "no mode chip in a race");
  assert.equal(s.duo, true);
  assert.equal(s.serial, 1, "the race was not restarted");
});

test("bug 4, the share link: it lives on the title, so starting a race shuts it", () => {
  const s = S.createSession();
  assert.equal(s.screen, "title");          // the gate is rendered on the title only
  S.begin(s, false);
  assert.notEqual(s.screen, "title");
});

test("the tap that brings focus back is not a move", () => {
  const s = playing();
  S.blur(s); S.focus(s);
  assert.equal(S.touch(s), "woke");
  assert.equal(S.touch(s), "counts");
  S.blur(s);
  S.pause(s); S.resume(s);                  // the menu took that tap
  assert.equal(S.touch(s), "counts");
});

test("pause: taps are refused and the clock may not run under the menu", () => {
  const s = playing();
  assert.equal(S.clockMayRun(s), true);
  S.pause(s);
  assert.equal(S.touch(s), "ignored"); assert.equal(S.clockMayRun(s), false);
  S.resume(s);
  assert.equal(S.clockMayRun(s), true);
});

test("the level list is a choice screen: it opens from the title or the end page only", () => {
  const s = playing();
  S.openLevels(s); assert.equal(s.screen, "play");
  S.cardShows(s, 10); S.openLevels(s); assert.equal(s.screen, "levels"); S.closeLevels(s); assert.equal(s.screen, "end");
  S.toTitle(s); S.openLevels(s); S.closeLevels(s); assert.equal(s.screen, "title");
});

test("result keys need a fresh press after the page appeared, never a repeat", () => {
  const s = playing();
  S.arrived(s, false); S.cardShows(s, 500);
  assert.equal(S.freshKey(s, 400, false), false, "pressed before the page");
  assert.equal(S.freshKey(s, 600, true), false, "auto-repeat");
  assert.equal(S.freshKey(s, 600, false), true);
});

test("a race that ends under pause waits: the end page only shows from the play screen", () => {
  const s = S.createSession();
  S.cardShows(s, 5);
  assert.equal(s.screen, "title");
});

test("bug 3, NothingMovesWhileAway: a focus that comes back under an open menu does not start the clock", () => {
  const s = playing();
  S.blur(s); S.pause(s);                // the window blurs and the player opens its menu
  S.focus(s);                           // the window is back, the menu is still open (the loop restarts on focus)
  assert.equal(S.clockMayRun(s), false, "advance() is skipped while the menu is open");
  S.resume(s);
  assert.equal(S.clockMayRun(s), true);
  S.toTitle(s);
  assert.equal(S.clockMayRun(s), false, "no race, no clock");
});
