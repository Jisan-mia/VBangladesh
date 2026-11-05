import assert from "node:assert/strict";
import test from "node:test";
import * as S from "../lib/session";

const playing = () => { const s = S.createSession(); assert.equal(S.begin(s, false), true); return s; };

test("bug 2, SceneTileKeepsRound: nothing in play can restart or switch the scene; the level list opens only from the title or the end screen", () => {
  const s = playing();
  S.openLevels(s);
  assert.equal(s.screen, "play", "the list can't open over a question");
  assert.equal(S.tapTile(s), "counts");
  S.solved(s, false, false, 10);
  S.openLevels(s);
  assert.equal(s.screen, "play");
  const t = S.createSession(); S.openLevels(t); assert.equal(t.screen, "levels");
  S.closeLevels(t); assert.equal(t.screen, "title");
  const e = playing(); S.solved(e, true, false, 5); S.advance(e, true, 6); assert.equal(e.screen, "end");
  S.openLevels(e); assert.equal(e.screen, "levels"); S.closeLevels(e); assert.equal(e.screen, "end", "back goes where it came from");
});

test("a right answer waits for ➜: nothing moves the round on by itself, and a second tap on a picture does nothing", () => {
  const s = playing();
  assert.equal(S.solved(s, false, false, 100), false);
  assert.equal(S.tapTile(s), "ignored");
  assert.equal(S.advance(s, false, 200), "next");
  assert.equal(s.answered, false);
  assert.equal(S.tapTile(s), "counts");
  assert.equal(S.advance(s, false, 300), "ignored", "➜ with no answer showing does nothing");
});

test("every finish counts (EveryFinishCounts): the last right tap saves the round and checks the limit, whatever the hand does next", () => {
  const s = playing();
  assert.equal(S.solved(s, true, false, 10), true);
  assert.equal(s.recorded, s.serial);
  S.toTitle(s); // leaves before ➜
  assert.equal(s.recorded, 1, "still recorded");
  const t = playing();
  S.solved(t, true, true, 10);
  assert.equal(t.resting, true);
  assert.equal(S.restShows(t), false, "the limit passed on the last answer: the rest waits for the end screen, never over a question");
  S.advance(t, true, 20);
  assert.equal(S.restShows(t), true);
});

test("bug 4 (shared), NoNewRoundPastLimit: past the limit a round never starts, it rests", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title"); assert.equal(s.resting, true); assert.equal(s.serial, 0);
  assert.equal(S.tapTile(s), "ignored");
  S.extend(s);
  assert.equal(S.begin(s, false), true);
  const e = playing(); S.solved(e, true, false, 1); S.advance(e, true, 2);
  assert.equal(S.begin(e, true), false, "আবার খেলো past the limit rests too");
  assert.equal(e.screen, "end");
});

test("RestOnlyAtBreak: the rest screen shows on every screen but play", () => {
  const s = playing(); s.resting = true;
  assert.equal(S.restShows(s), false);
  s.screen = "title"; assert.equal(S.restShows(s), true);
  s.screen = "levels"; assert.equal(S.restShows(s), true);
});

test("pause freezes the game: no tap or ➜ under the menu, and the first tap back is not a move", () => {
  const s = playing();
  S.pause(s);
  assert.equal(S.tapTile(s), "ignored");
  S.solved(s, false, false, 5);
  assert.equal(S.advance(s, false, 6), "ignored");
  S.resume(s);
  assert.equal(S.advance(s, false, 7), "next");
  S.blur(s);
  assert.equal(S.tapTile(s), "woke", "the tap that brings focus back only wakes the game");
  assert.equal(S.tapTile(s), "counts");
  S.blur(s); S.pause(s); S.resume(s);
  assert.equal(S.tapTile(s), "counts", "the pause menu took the tap");
  const a = playing(); S.solved(a, false, false, 1); S.blur(a);
  assert.equal(a.swallow, false, "nothing to swallow while the reason shows");
});

test("a round can't start under the pause menu", () => {
  const s = S.createSession(); S.pause(s);
  assert.equal(S.begin(s, false), false);
});

test("result keys need a fresh press: a key held through the answer or the end screen never moves on", () => {
  const s = playing();
  S.solved(s, false, false, 1000);
  assert.equal(S.freshNext(s, 1000, false), false, "the keydown that arrived with the answer");
  assert.equal(S.freshNext(s, 1500, true), false, "auto-repeat");
  assert.equal(S.freshNext(s, 1500, false), true);
  const e = playing(); S.solved(e, true, false, 10); S.advance(e, true, 2000);
  assert.equal(S.freshKey(e, 1900, false), false);
  assert.equal(S.freshKey(e, 2500, true), false);
  assert.equal(S.freshKey(e, 2500, false), true);
  assert.equal(S.freshKey(playing(), 9e9, false), false, "not on the play screen");
});

test("নতুন করে শুরু and শেষ go back to the title and clear a waiting answer", () => {
  const s = playing(); S.solved(s, false, false, 1); S.pause(s);
  S.toTitle(s);
  assert.deepEqual([s.screen, s.answered, s.paused], ["title", false, false]);
});
