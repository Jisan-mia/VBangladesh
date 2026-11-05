import assert from "node:assert/strict";
import test from "node:test";
import * as S from "../lib/session";

const playing = (over = false) => { const s = S.createSession(); assert.ok(S.begin(s, over)); return s; };

test("bug 2, EveryFinishedRoundCounts: the round is recorded at the moment the last pan is level, whatever the hand does next", () => {
  const s = playing();
  assert.equal(S.won(s, true), true, "the caller records the stars and the limit is checked now");
  assert.equal(s.recorded, s.serial);
  assert.equal(s.resting, true);
  assert.equal(S.restShows(s), false, "the rest screen waits for the end page");
  S.toTitle(s);                          // নতুন করে শুরু a moment later
  assert.equal(s.recorded, s.serial, "still counted");
  assert.equal(S.won(s, true), false, "never recorded twice");
});

test("bug 2, the level list: picking a level 0.4 s after the last pan can not lose the round (a won round is not dirty, so it never asks)", () => {
  const s = playing();
  S.moved(s);
  S.won(s, false);
  assert.equal(s.dirty, false);
  S.openLevels(s);
  assert.equal(S.pick(s, 2), "start", "a won round is not asked about");
  assert.equal(s.recorded, s.serial, "and it was recorded");
});

test("bug 2, the end page: the rest screen shows only at a break", () => {
  const s = playing();
  S.won(s, true);
  assert.equal(S.restShows(s), false);
  S.cardShows(s, 100);
  assert.equal(S.restShows(s), true);
  assert.equal(S.touch(s), "ignored");
});

test("RestOnlyAtBreak and NoNewRoundPastLimit: past today's limit a round does not start (at the start of a round too)", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title"); assert.equal(s.resting, true); assert.equal(s.serial, 0);
  S.extend(s);
  assert.equal(S.begin(s, false), true);
  assert.equal(S.restShows(s), false);
});

test("bug 5, restarting from the list: a touched round asks first; a round not yet touched, the title and the end page do not", () => {
  const s = playing();
  S.openLevels(s);                       // the pause menu's সব লেভেল
  assert.equal(s.back, "play");
  assert.equal(S.pick(s, 3), "start", "nothing touched yet, nothing to lose");
  const t = playing();
  S.moved(t);
  S.openLevels(t);
  assert.equal(S.pick(t, 3), "ask");
  assert.equal(t.ask, 3);
  assert.equal(t.screen, "levels");
  S.stay(t);
  assert.equal(t.ask, 0);
  assert.equal(S.pick(t, 3), "ask");
  assert.equal(S.leave(t), 3);
  assert.equal(S.leave(t), 0, "asked once, answered once");
  S.closeLevels(t);                      // back from the list keeps the round
  assert.equal(t.screen, "play");
  assert.equal(t.dirty, true);
  const title = S.createSession();
  S.openLevels(title);
  assert.equal(S.pick(title, 4), "start");
  const end = playing(); S.won(end, false); S.cardShows(end, 10); S.openLevels(end);
  assert.equal(S.pick(end, 4), "start");
});

test("ChoiceFreezesPlay: nothing runs and nothing counts under the level list", () => {
  const s = playing();
  assert.equal(S.clockMayRun(s), true);
  S.openLevels(s);
  assert.equal(S.clockMayRun(s), false);
  assert.equal(S.touch(s), "ignored");
  S.closeLevels(s);
  assert.equal(S.touch(s), "woke", "the first tap back from the list only wakes the round");
  assert.equal(S.touch(s), "counts");
});

test("the tap that brings focus back is not a move", () => {
  const s = playing();
  S.blur(s); S.focus(s);
  assert.equal(S.touch(s), "woke");
  assert.equal(S.touch(s), "counts");
  S.blur(s);
  S.pause(s); S.resume(s);               // the menu took that tap
  assert.equal(S.touch(s), "counts");
});

test("bug 3, NothingMovesWhileAway: the clock only runs on the play screen with the menu closed", () => {
  const s = playing();
  assert.equal(S.clockMayRun(s), true);
  S.pause(s);
  assert.equal(S.clockMayRun(s), false);
  S.resume(s);
  assert.equal(S.clockMayRun(s), true);
  S.toTitle(s);
  assert.equal(S.clockMayRun(s), false);
});

test("result keys need a fresh press: a key held through the finish never starts the next round", () => {
  const s = playing();
  S.won(s, false); S.cardShows(s, 1000);
  assert.equal(S.freshKey(s, 900, false), false, "started before the page");
  assert.equal(S.freshKey(s, 1200, true), false, "auto-repeat");
  assert.equal(S.freshKey(s, 1200, false), true);
  const t = playing();
  assert.equal(S.freshKey(t, 1200, false), false, "not on the play screen");
});

test("the share link lives on the title, so starting a round shuts it", () => {
  const s = S.createSession();
  assert.equal(s.screen, "title");
  S.begin(s, false);
  assert.notEqual(s.screen, "title");
});
