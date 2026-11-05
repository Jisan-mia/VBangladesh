import assert from "node:assert/strict";
import test from "node:test";
import { dial, expected, look, newRound, nextPiece, opensWithLook, eyesLeft, type Round } from "../lib/play";
import * as S from "../lib/session";

const NUMBER = "01712345678";
const started = (level = 3) => { const round = newRound(level, NUMBER), s = S.createSession(); assert.equal(S.begin(s, false, opensWithLook(round)), true); return { s, round }; };
const dialDigit = (round: Round) => dial(round, expected(round));

test("bug 1, NoProgressWhileAway: the look, the rest and the ring only run while nobody is away; coming back starts the beat again", () => {
  const { s } = started(3);
  assert.equal(s.phase, "look");
  S.blur(s);
  assert.equal(S.lookDone(s), false, "the digits don't finish and hide while away");
  assert.equal(s.phase, "look");
  S.focus(s);
  assert.equal(s.phase, "look", "still the look: it plays again from its first digit");
  assert.equal(S.lookDone(s), true); assert.equal(s.phase, "dial");
  // The pause menu holds it the same way.
  const rest = started(3); rest.s.phase = "rest";
  S.pause(rest.s); assert.equal(S.restDone(rest.s, true), false);
  S.resume(rest.s); assert.equal(S.restDone(rest.s, true), true); assert.equal(rest.s.phase, "look");
  const ring = started(3); ring.s.phase = "ring";
  S.blur(ring.s); assert.equal(S.ringDone(ring.s, 5), false); assert.equal(ring.s.screen, "play");
  S.focus(ring.s); assert.equal(S.ringDone(ring.s, 6), true); assert.equal(ring.s.screen, "end");
});

test("bug 2, OneLookOneHelp: a second tap on the eye (or a held Enter) while a look is playing neither charges nor restarts it", () => {
  const { s, round } = started(4);
  assert.equal(s.phase, "dial");
  const first = look(round);
  assert.equal(first.charged, true);
  assert.equal(S.askLook(s), "counts"); assert.equal(s.phase, "look");
  // The game only charges when the session says counts, so these never reach look().
  assert.equal(S.askLook(s), "ignored"); assert.equal(S.askLook(s), "ignored");
  assert.equal(first.round.looks, 1);
  assert.equal(eyesLeft(first.round), 0, "level 4 has one eye");
  assert.equal(look(first.round).allowed, false, "and then the eye is asleep");
  assert.equal(look(first.round).round.looks, 1);
});

test("bug 3, EveryFinishCounts: the last digit records the round and checks the limit at that tap, whatever the hand does next", () => {
  let { s, round } = started(6);
  for (let at = 0; at < 10; at++) { const out = dialDigit(round); round = out.round; assert.equal(S.dialled(s, out.event as "right", false), false); }
  const out = dialDigit(round);
  assert.equal(out.event, "end");
  assert.equal(S.dialled(s, "end", true), true);
  assert.equal(s.recorded, s.serial);
  assert.equal(s.resting, true);
  assert.equal(S.restShows(s), false, "the limit passed on the last digit: the rest waits for the end screen, never over the ring");
  S.toTitle(s); // a quick tap on the restart during the ring
  assert.equal(s.recorded, 1, "still recorded");
  assert.equal(S.restShows(s), true);
});

test("gap 3: a tap while the digits play does not cut the look short", () => {
  const { s } = started(3);
  assert.equal(S.tapKey(s), "ignored");
  assert.equal(s.phase, "look");
  assert.equal(S.askLook(s), "ignored");
  assert.equal(S.lookDone(s), true);
  assert.equal(S.tapKey(s), "counts");
});

test("a finished piece rests, the next starts with its look or straight to dialling", () => {
  const { s } = started(3);
  S.lookDone(s);
  S.dialled(s, "piece", false);
  assert.equal(s.phase, "rest");
  assert.equal(S.tapKey(s), "ignored");
  assert.equal(S.restDone(s, true), true); assert.equal(s.phase, "look");
  const copy = started(1);
  S.dialled(copy.s, "piece", false);
  assert.equal(S.restDone(copy.s, false), true); assert.equal(copy.s.phase, "dial");
  assert.equal(opensWithLook(nextPiece(dialDigit(dialDigit(dialDigit(newRound(1, NUMBER)).round).round).round)), false, "copying levels have no look");
});

test("bug 4 (shared), NoNewRoundPastLimit: past the limit a round never starts, it rests", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true, false), false);
  assert.equal(s.screen, "title"); assert.equal(s.resting, true); assert.equal(s.serial, 0);
  assert.equal(S.tapKey(s), "ignored");
  S.extend(s);
  assert.equal(S.begin(s, false, false), true);
});

test("RestOnlyAtBreak: the rest screen shows on every screen but play", () => {
  const { s } = started(1); s.resting = true;
  assert.equal(S.restShows(s), false);
  s.screen = "title"; assert.equal(S.restShows(s), true);
  s.screen = "levels"; assert.equal(S.restShows(s), true);
});

test("pause freezes the game, and the first tap back is not a move", () => {
  const { s } = started(1);
  S.pause(s);
  assert.equal(S.tapKey(s), "ignored");
  S.resume(s);
  assert.equal(S.tapKey(s), "counts");
  S.blur(s);
  assert.equal(S.tapKey(s), "woke", "the tap that brings focus back only wakes the game");
  assert.equal(S.tapKey(s), "counts");
  S.blur(s); S.pause(s); S.resume(s);
  assert.equal(S.tapKey(s), "counts", "the pause menu took the tap");
  assert.equal(S.begin(S.createSession(), false, false), true);
  const paused = S.createSession(); S.pause(paused); assert.equal(S.begin(paused, false, false), false, "nothing starts under the menu");
});

test("the level list opens from the title, the end screen or the pause menu, and goes back where it came from", () => {
  const t = S.createSession(); S.openLevels(t); assert.equal(t.screen, "levels"); S.closeLevels(t); assert.equal(t.screen, "title");
  const e = started(6).s; e.phase = "ring"; S.ringDone(e, 1); assert.equal(e.screen, "end");
  S.openLevels(e); assert.equal(e.screen, "levels"); S.closeLevels(e); assert.equal(e.screen, "end");
  const p = started(1).s; S.openLevels(p); assert.equal(p.screen, "levels", "the pause menu's সব লেভেল works mid-round"); S.closeLevels(p); assert.equal(p.screen, "title", "and leaves the round: back goes to the title");
});

test("result keys need a fresh press after the end screen appears", () => {
  const { s } = started(6); s.phase = "ring";
  S.ringDone(s, 100);
  assert.equal(S.freshKey(s, 90, false), false, "a key held through the ring");
  assert.equal(S.freshKey(s, 150, true), false, "a repeat");
  assert.equal(S.freshKey(s, 150, false), true);
});
