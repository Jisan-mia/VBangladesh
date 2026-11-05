// The statechart's bug paths and rules (ai_docs/statecharts/atir-aam/), replayed against the pure session and rules.
import assert from "node:assert/strict";
import test from "node:test";
import type { Dir } from "../lib/board";
import { readOpen, openAfter, startLevel } from "../lib/save";
import { createGame, move, pickOffer, takeBack, type Game, type Run } from "../lib/rules";
import * as S from "../lib/session";
import { lookAhead } from "./bot";

const level = (n: number): Run => ({ v: 2, kind: "level", level: n, seed: 0, mode: "n" });
const garden = (seed: number): Run => ({ v: 2, kind: "garden", level: 0, seed, mode: "n" });
const anyMove = (game: Game) => ([0, 1, 2, 3] as Dir[]).map(dir => move(game, dir)).find(Boolean) ?? null;

/** Plays a run with the look-ahead bot until a swipe raises the peak to `stage`; the board before and after that swipe. */
function growTo(run: Run, stage: number) {
  let game = createGame(run);
  for (let i = 0; i < 3000 && !game.over; i++) {
    if (game.offer) { game = pickOffer(game, 0)!; continue; }
    const dir = lookAhead(game);
    const next = dir === null ? null : move(game, dir);
    if (!next) break;
    if (next.peak >= stage && game.peak < stage) return { before: game, after: next };
    game = next;
  }
  return null;
}

test("bug 1 · CheerOncePerRun: grow a পাকা আম, take it back, grow it again: the confetti comes once", () => {
  // level 15 (goal: a ঝুড়ি) grows a পাকা আম on the way, with two take-backs in hand
  const found = growTo(level(15), 7);
  assert.ok(found && found.before.undos > 0 && !found.after.over, "a run that grows a পাকা আম with a take-back left");
  const { before, after } = found!;
  assert.equal(S.cheerOf(before, after, 0), 7, "the first time it cheers");
  const undone = takeBack(after)!;
  assert.ok(undone.top < 7, "the পাকা আম is gone from the board");
  assert.equal(undone.peak, 7, "but the run remembers it");
  const again = move(undone, after.moves[after.moves.length - 1])!;
  assert.equal(again.top, 7, "the same swipe grows it again");
  assert.equal(S.cheerOf(undone, again, 0), 0, "and it doesn't cheer twice");
  assert.equal(S.cheerOf(before, after, 7), 0, "nor for a stage this phone already reached");
});

test("bug 2 · CelebrationMatchesBoard: after ফেরত নাও, no new-stage line for a stage that isn't on the board", () => {
  const { after } = growTo(level(15), 7)!;
  assert.equal(S.newsOf(after), after.peak, "the swipe that grew it announces it");
  const undone = takeBack(after)!;
  assert.equal(S.newsOf(undone), 0, "taken back, the line goes with it");
  assert.equal(undone.last, null, "and the swipe's animation and sounds (the component settles the scene and silences scheduled notes)");
  const next = anyMove(undone)!;
  if (next.top < next.peak) assert.equal(S.newsOf(next), 0, "a later swipe that doesn't regrow it says nothing");
});

test("PausedWhenHidden / PausedWhenBlurred: away, the bed takes no swipe and a press in flight is dropped", () => {
  const s = S.createSession(true);
  S.goTo(s, "play");
  assert.ok(S.canSwipe(s, 1000));
  assert.ok(S.press(s, 1000));
  S.blur(s);
  assert.equal(s.pressing, false);
  assert.equal(S.canSwipe(s, 1100), false);
  S.focus(s);
  S.hide(s);
  assert.equal(S.canSwipe(s, 1200), false);
  S.show(s);
  S.pause(s);
  assert.equal(S.canSwipe(s, 1300), false, "the menu is open");
});

test("the click that brings focus back is not a move: swipes in the first 250 ms after চালিয়ে যাও are ignored", () => {
  const s = S.createSession(true);
  S.goTo(s, "play");
  S.pause(s);
  S.resume(s, 5000);
  assert.equal(S.canSwipe(s, 5000 + S.RESUME_GUARD - 1), false);
  assert.ok(S.canSwipe(s, 5000 + S.RESUME_GUARD));
});

test("ResultNeedsFreshPress: a key held through the last swipe never skips the end screen", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 2000);
  assert.equal(S.freshResultKey(s, { timeStamp: 2100, repeat: false }), false, "too soon");
  assert.equal(S.freshResultKey(s, { timeStamp: 3000, repeat: true }), false, "auto-repeat");
  assert.ok(S.freshResultKey(s, { timeStamp: 3000, repeat: false }));
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 3000, repeat: false }), false, "not under the menu");
});

test("WindOnlyWhenMeaningful / WindComesBack: the wind blows through a gust level only while it's played", () => {
  const calls: string[] = [] as string[];
  const loops: S.Loops = { start: () => calls.push("start"), stop: () => calls.push("stop") };
  const s = S.createSession(true), gusty = createGame(level(13)), calm = createGame(level(5));
  S.syncLoops(s, gusty, loops);
  assert.deepEqual(calls, [], "not on the title");
  S.goTo(s, "play"); S.syncLoops(s, calm, loops);
  assert.deepEqual(calls, [], "not on a calm level");
  S.syncLoops(s, gusty, loops);
  assert.deepEqual(calls, ["start"]);
  S.pause(s); S.syncLoops(s, gusty, loops);
  assert.deepEqual(calls, ["start", "stop"], "paused");
  S.resume(s, 0); S.syncLoops(s, gusty, loops);
  S.blur(s); S.syncLoops(s, gusty, loops);
  S.focus(s); S.syncLoops(s, gusty, loops);
  S.setSound(s, false); S.syncLoops(s, gusty, loops);
  assert.equal(s.wind, false, "muted (the kit's switch has already stopped every loop)");
  (calls as string[]).push("stop");
  S.setSound(s, true); S.syncLoops(s, gusty, loops);
  assert.equal(s.wind, true, "sound back on brings it back");
  S.syncLoops(s, { ...gusty, over: true }, loops);
  assert.equal(s.wind, false, "the end");
  S.goTo(s, "over"); S.syncLoops(s, gusty, loops);
  assert.equal(calls.filter(call => call === "start").length, calls.filter(call => call === "stop").length, "every start has its stop");
});

test("ChoiceFreezesPlay: while মালির থলে is open nothing moves", () => {
  let game = createGame(garden(9090));
  while (!game.offer && !game.over) game = anyMove(game)!;
  assert.ok(game.offer);
  for (const dir of [0, 1, 2, 3] as Dir[]) assert.equal(move(game, dir), null);
  const s = S.createSession(true);
  S.goTo(s, "play");
  assert.equal(S.wantWind(s, { ...game, spec: { ...game.spec, gust: 5 } }), false);
});

test("UnlockNeverShrinks: your own open level migrates once and a friend's far level opens nothing in between", () => {
  assert.equal(readOpen(null, { 1: 3, 2: 2, 5: 1 }), 6, "first visit: the old rule (one past the highest with stars)");
  assert.equal(readOpen("4", { 1: 3, 2: 2, 9: 1 }), 4, "after that, the saved open level");
  assert.equal(readOpen("junk", {}), 1);
  assert.equal(openAfter(4, 4), 5);
  assert.equal(openAfter(4, 2), 4, "an earlier level doesn't shrink it");
  assert.equal(openAfter(4, 12), 4, "a friend's far level opens nothing");
  assert.equal(openAfter(24, 24), 24);
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2, 3: 3 }, 3), 2);
});
