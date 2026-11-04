// Each statechart path (ai_docs/statecharts/pati-buni/README.md) replayed against the pure session, hand and frame the component runs.
import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../lib/game";
import { empty, fastFall, letGo, makeHand, slideDir } from "../lib/hand";
import { afterClear, migratedUnlock, playable, readUnlock, recommended } from "../lib/progress";
import { again, away, back, cheerMayPlay, createSession, finish, moving, pause, pick, reset, resume, start, BREATH_MS, GUARD_MS } from "../lib/session";
import { move, tick } from "../lib/step.hot";

const FRAME = 1000 / 60;
const playing = (at = 0) => { const s = createSession(); start(s, false, at); return s; };
/** The component's step: the frame advances only while moving(), and a held arrow slides it. */
function steps(s: ReturnType<typeof createSession>, game: ReturnType<typeof createGame>, hand: ReturnType<typeof makeHand>, from: number, count: number) {
  for (let i = 0; i < count; i++) {
    if (!moving(s, from + i * FRAME)) continue;
    if (slideDir(hand)) move(game, slideDir(hand));
    tick(game, FRAME, fastFall(hand));
  }
}

test("bug 1 · PausedWhenBlurred: clicking into another window pauses the frame; nothing falls until you resume", () => {
  const s = playing(), game = createGame(7, 4, 1);
  away(s, "blur");
  assert.equal(s.phase, "paused");
  const y = game.y, strips = game.strips;
  steps(s, game, makeHand(), 1000, 600);
  assert.deepEqual([game.y, game.strips, game.t], [y, strips, 0], "ten seconds in the other window move nothing");
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back does not resume by itself");
  assert.ok(resume(s, 20_000));
  assert.ok(!moving(s, 20_000 + BREATH_MS - 1), "a breath before anything falls");
  assert.ok(moving(s, 20_000 + BREATH_MS));
  away(s, "hide");
  assert.equal(resume(s, 30_000), false, "can't resume onto a hidden tab");
});

test("bug 2 · InputReleasedWhenAway: a held ◀ or নামাও lets go on blur, and nothing slides or slams after you come back", () => {
  const s = playing(), game = createGame(7, 4, 1), hand = makeHand();
  hand.btnDir = -1; hand.softBtn = true; hand.keyDir = 1; hand.softKey = true; hand.softTouch = true; hand.touch = 3;
  // The component's blur handler: let go, then away.
  letGo(hand); away(s, "blur");
  assert.ok(empty(hand));
  back(s, "focus"); resume(s, 0);
  const x = game.x, strips = game.strips;
  steps(s, game, hand, BREATH_MS, 30);
  assert.equal(game.x, x, "no slide without a fresh press");
  assert.equal(game.strips, strips, "no fast fall without a fresh press");
  // The player's pause, the list, a hidden tab and the frame scrolled off all let go the same way.
  for (const leave of [() => pause(s), () => pick(s, true), () => away(s, "hide"), () => away(s, "scroll")]) {
    const held = makeHand(); held.keyDir = -1; held.softBtn = true;
    letGo(held); leave();
    assert.ok(empty(held));
    assert.ok(!moving(s, 1e9));
    Object.assign(s, createSession()); start(s, false, 0);
  }
});

test("bug 3 · PausedWhenScrolledAway: no run starts, resumes or plays again with the frame off screen", () => {
  const s = playing();
  away(s, "scroll");
  assert.equal(s.phase, "paused");
  assert.equal(resume(s, 1000), false, "চালিয়ে যাও on a button still on screen can't start the frame below the fold");
  back(s, "scroll");
  assert.ok(resume(s, 2000));
  assert.ok(finish(s, 3000));
  away(s, "scroll");
  assert.equal(again(s, 3000 + GUARD_MS + 10), false, "আবার খেলো with only a sliver of the frame showing waits");
  back(s, "scroll");
  assert.ok(again(s, 3000 + GUARD_MS + 20));
  const title = createSession();
  away(title, "scroll");
  assert.equal(start(title, false, 0), false);
});

test("HeldKeyNeverSkips: the end screen takes only a fresh key pressed after it appeared, after the guard", () => {
  const s = playing();
  finish(s, 1000);
  assert.equal(again(s, 1000 + GUARD_MS - 1), false);
  assert.equal(again(s, 1000 + GUARD_MS, { at: 900, repeat: false }), false, "a key from before the screen");
  assert.equal(again(s, 1000 + GUARD_MS, { at: 1500, repeat: true }), false, "a repeat");
  assert.ok(again(s, 1000 + GUARD_MS, { at: 1500, repeat: false }));
});

test("ChoiceFreezesPlay and the first tap back: সব পাটি pauses; closing it or a tap on the cover only resumes", () => {
  const s = playing();
  pick(s, true);
  assert.equal(s.phase, "paused");
  assert.equal(resume(s, 100), false, "nothing resumes under the open list");
  pick(s, false);
  assert.ok(resume(s, 200));
  pause(s);
  assert.ok(resume(s, 300));
  assert.equal(s.phase, "playing");
});

test("CelebrationOnItsOwnCard: a fanfare queued for one result never plays over the next run", () => {
  const s = playing();
  finish(s, 1000);
  const run = s.run;
  assert.ok(cheerMayPlay(s, run));
  assert.ok(again(s, 1000 + GUARD_MS));
  assert.equal(cheerMayPlay(s, run), false);
  finish(s, 9000);
  assert.equal(cheerMayPlay(s, run), false);
  reset(s);
  assert.equal(cheerMayPlay(s, s.run), false);
});

test("OpenLevelsAreEarned: a friend's far-ahead পাটি records its stars but opens nothing in between", () => {
  assert.equal(afterClear(2, 2), 3);
  assert.equal(afterClear(2, 1), 2);
  assert.equal(afterClear(2, 9), 2, "clearing a friend's পাটি 9 from unlock 2 opens nothing");
  assert.ok(playable(9, 2, {}, 9), "the friend's পাটি is playable on its link");
  assert.ok(!playable(9, 2, {}), "and not without it");
  assert.ok(playable(9, 2, { 9: 2 }), "once it has stars it stays playable");
  assert.ok(playable(0, 1, {}), "খোলা পাটি is always open");
  assert.equal(recommended(3, { 1: 3, 2: 1 }), 3);
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 3 }), 2);
});

test("old saved progress migrates once: the old best opens পাটি 2, or the whole first world from 150", () => {
  assert.equal(migratedUnlock(null), 1);
  assert.equal(migratedUnlock("0"), 1);
  assert.equal(migratedUnlock("junk"), 1);
  assert.equal(migratedUnlock("40"), 2);
  assert.equal(migratedUnlock("150"), 4);
  assert.deepEqual(readUnlock(null, {}, "215"), { unlock: 4, migrated: true });
  assert.deepEqual(readUnlock(null, { 6: 1 }, null), { unlock: 7, migrated: true }, "the shared rule, for the migration only");
  assert.deepEqual(readUnlock("2", { 9: 3 }, "500"), { unlock: 2, migrated: false }, "once saved, a friend's stars never raise it");
  assert.deepEqual(readUnlock("99", {}, null), { unlock: 12, migrated: false });
});
