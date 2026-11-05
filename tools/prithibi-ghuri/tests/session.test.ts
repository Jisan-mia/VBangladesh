import assert from "node:assert/strict";
import test from "node:test";
import * as S from "../lib/session";
import { advance, answer, createTrip, fly, isLast, land, nextCard, type Trip } from "../lib/trip";

const playing = () => { const s = S.createSession(); assert.equal(S.begin(s, false, 0), true); return s; };
/** A trip at the first postcard of its first stop. */
const atFirstCard = (level = 2) => land(fly(createTrip(level, 4), 0));

test("bug 1, PostcardsAreNotSkipped: a held Enter never turns a second postcard; a key counts only from a fresh press after the card appeared", () => {
  const s = playing();
  S.shown(s, 1000); // postcard 1 appeared at t = 1000
  assert.equal(S.freshKey(s, 1500, false), true, "a fresh press turns it");
  S.shown(s, 1500); // postcard 2 appeared
  for (const at of [1533, 1566, 1600, 1633]) assert.equal(S.freshKey(s, at, true), false, "auto-repeat is ignored");
  assert.equal(S.freshKey(s, 1400, false), false, "a press that began before the card appeared is ignored");
  assert.equal(S.freshKey(s, 1700, false), true);
  // a finger: a double tap within a moment of the card appearing is one tap
  assert.equal(S.freshTap(s, 1500 + S.DOUBLE_TAP_MS - 1), false);
  assert.equal(S.freshTap(s, 1500 + S.DOUBLE_TAP_MS), true);
  // the pure trip also turns one card per call
  let trip = atFirstCard();
  const cards: number[] = [];
  while (trip.phase === "card") { cards.push(trip.card); trip = nextCard(trip); }
  assert.deepEqual(cards, [0, 1, 2, 3, 4]);
});

test("a held key through the end screen never starts the next trip (result keys need a fresh press)", () => {
  const s = playing();
  S.solved(s, true, false, 10);
  assert.equal(S.advance(s, true, 500), "end");
  S.shown(s, 500);
  assert.equal(S.freshKey(s, 480, false), false, "Enter pressed before the end screen appeared");
  assert.equal(S.freshKey(s, 900, true), false, "…and its repeats");
  assert.equal(S.freshKey(s, 900, false), true);
});

test("bug 2 (shared), NoNewRoundPastLimit: past the limit a trip never starts, it rests — at the title, আবার খেলো and a level from the list", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true, 0), false);
  assert.equal(s.screen, "title"); assert.equal(s.resting, true); assert.equal(s.serial, 0);
  assert.equal(S.tap(s), "ignored");
  assert.equal(S.restShows(s), true);
  S.extend(s);
  assert.equal(S.begin(s, false, 0), true); assert.equal(s.serial, 1);
  // a limit that ran out on the map, mid-trip: only the next trip's start rests, never the trip in play
  S.solved(s, false, false, 5);
  assert.equal(S.restShows(s), false);
  S.toTitle(s);
  assert.equal(S.begin(s, true, 0), false);
});

test("every finish counts (EveryFinishCounts): the last right tap saves the trip and checks the limit, whatever the hand does next", () => {
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

test("a right answer waits for ➜; ➜ with no answer, or under the menu, does nothing", () => {
  const s = playing();
  assert.equal(S.advance(s, false, 5), "ignored");
  S.solved(s, false, false, 100);
  S.pause(s);
  assert.equal(S.advance(s, false, 200), "ignored", "NothingMovesUnderTheMenu");
  S.resume(s);
  assert.equal(S.advance(s, false, 300), "next");
  assert.equal(S.advance(s, false, 400), "ignored");
});

test("gap 3: a stray tap never drops a trip — the list opens over a trip only from the pause menu, freezes it, and ফিরে যাও gives it back", () => {
  const s = playing();
  S.openChoice(s, "levels");
  assert.equal(s.screen, "play", "a tap on the play screen can't open the list");
  S.openChoice(s, "passport", true);
  assert.equal(s.screen, "play", "the passport is not reachable over a trip");
  S.openChoice(s, "levels", true);
  assert.equal(s.screen, "levels"); assert.equal(s.back, "play"); assert.equal(s.listOverTrip, true);
  assert.equal(S.frozen(s), true, "ChoiceFreezesPlay: the plane holds");
  assert.equal(S.tap(s), "ignored");
  S.closeChoice(s);
  assert.equal(s.screen, "play"); assert.equal(S.frozen(s), false);
  assert.equal(S.tap(s), "woke", "the tap that closes the list is not a move");
  assert.equal(S.tap(s), "counts");
  // from the title and the end screen it opens with a plain tap and goes back where it came from
  const t = S.createSession(); S.openChoice(t, "passport"); assert.equal(t.screen, "passport"); S.closeChoice(t); assert.equal(t.screen, "title");
  const e = playing(); S.solved(e, true, false, 5); S.advance(e, true, 6);
  S.openChoice(e, "levels"); assert.equal(e.screen, "levels"); S.closeChoice(e); assert.equal(e.screen, "end");
});

test("pause freezes the game and the first tap back only wakes it; blur and hide freeze the plane too", () => {
  const s = playing();
  S.pause(s);
  assert.equal(S.frozen(s), true); assert.equal(S.tap(s), "ignored");
  S.resume(s);
  assert.equal(S.frozen(s), false); assert.equal(S.tap(s), "counts");
  S.blur(s);
  assert.equal(S.frozen(s), true, "PausedWhenBlurred: the plane holds");
  S.focus(s);
  assert.equal(S.frozen(s), false);
  assert.equal(S.tap(s), "woke", "the click that brings focus back is not a move");
  assert.equal(S.tap(s), "counts");
  // coming back through the menu clears it
  S.blur(s); S.pause(s); S.focus(s); S.resume(s);
  assert.equal(S.tap(s), "counts");
});

test("nothing taps on the title, the end screen or under the rest screen", () => {
  const s = S.createSession();
  assert.equal(S.tap(s), "ignored");
  const e = playing(); S.solved(e, true, true, 3); S.advance(e, true, 4);
  assert.equal(S.tap(e), "ignored");
  assert.equal(S.restShows(e), true);
});

test("bug 4 (shared), DoubleResult: a trip is recorded once even when the child taps the next trip during the finish", () => {
  const s = playing();
  assert.equal(S.solved(s, true, false, 10), true);
  assert.equal(s.recorded, 1);
  // আবার খেলো straight away starts trip 2; trip 1 stays recorded, trip 2 is not
  assert.equal(S.begin(s, false, 12), true);
  assert.equal(s.serial, 2); assert.equal(s.recorded, 1);
});

test("the plane lands once, only from the air: a land after a restart or on the map changes nothing", () => {
  let trip = createTrip(2, 2);
  assert.equal(land(trip), trip);
  trip = fly(trip, 1);
  const landed = land(trip);
  assert.equal(landed.phase, "card");
  assert.equal(land(landed), landed);
  assert.equal(advance(landed), landed);
  const solvedTrip = (() => { let t = nextCard(nextCard(nextCard(nextCard(nextCard(landed))))); t = answer(t, "my"); return t; })();
  assert.ok(solvedTrip.solved && !isLast(solvedTrip));
});
