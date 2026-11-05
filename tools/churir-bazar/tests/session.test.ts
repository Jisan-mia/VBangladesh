// The statechart's bug paths and rules (ai_docs/statecharts/churir-bazar/), replayed against the pure session and rules.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseShared } from "../lib/challenge";
import { botGame } from "../lib/hint";
import { LEVELS } from "../lib/ladder";
import { openAfter, readOpen, startLevel } from "../lib/save";
import * as S from "../lib/session";
import { newRun } from "../lib/rules";

const play = () => { const s = S.createSession(true); S.goTo(s, "play"); return s; };

test("bug 1 · InputReleasedWhenAway: a press in flight never lands after blur, hide or the menu", () => {
  const s = play();
  assert.ok(S.press(s, 1000));
  S.blur(s);
  assert.equal(s.pressing, false);
  S.focus(s, 1500);
  assert.equal(S.dragCounts(s, { buttons: 0, pointerType: "mouse" }), false, "back in the window with no button held: moving over the tray is not a drag");
  assert.equal(S.dragCounts(s, { buttons: 1, pointerType: "mouse" }), false, "and the old press is gone even if a button is down again");
  S.press(s, 2000);
  S.hide(s);
  assert.equal(s.pressing, false);
  S.show(s, 2500);
  S.press(s, 3000);
  S.pause(s);
  assert.equal(s.pressing, false, "the menu drops it too");
});

test("bug 1 · a mouse move with no button held is not a drag; a finger's move is", () => {
  const s = play();
  S.press(s, 1000);
  assert.equal(S.dragCounts(s, { buttons: 0, pointerType: "mouse" }), false);
  assert.equal(S.dragCounts(s, { buttons: 1, pointerType: "mouse" }), true);
  assert.equal(S.dragCounts(s, { buttons: 0, pointerType: "touch" }), true, "touch moves report no buttons");
  S.release(s);
  assert.equal(S.dragCounts(s, { buttons: 1, pointerType: "mouse" }), false, "nothing pressed, nothing dragged");
});

test("the click that brings focus back is not a move: presses in the first 250 ms are ignored", () => {
  const s = play();
  S.pause(s);
  S.resume(s, 5000);
  assert.equal(S.canMove(s, 5000 + S.RESUME_GUARD - 1), false);
  assert.ok(S.canMove(s, 5000 + S.RESUME_GUARD));
  S.blur(s);
  S.focus(s, 9000);
  assert.equal(S.press(s, 9100), false, "the same after a plain window focus");
  assert.ok(S.press(s, 9300));
});

test("PausedWhenHidden / PausedWhenBlurred / ChoiceFreezesPlay: away, under the menu or a choice, nothing takes a press", () => {
  const s = play();
  assert.ok(S.canMove(s, 1000));
  S.blur(s); assert.equal(S.canMove(s, 1100), false);
  S.focus(s); S.hide(s); assert.equal(S.canMove(s, 1200), false);
  S.show(s); S.pause(s); assert.equal(S.canMove(s, 1300), false, "the menu, সব লেভেল or the gift is open");
  const title = S.createSession(true);
  assert.equal(S.canMove(title, 1000), false, "not on the title");
});

test("ResultNeedsFreshPress: a key held through the last move never skips the end screen", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 2000);
  assert.equal(S.freshResultKey(s, { timeStamp: 2100, repeat: false }), false, "too soon");
  assert.equal(S.freshResultKey(s, { timeStamp: 3000, repeat: true }), false, "auto-repeat");
  assert.ok(S.freshResultKey(s, { timeStamp: 3000, repeat: false }));
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 3000, repeat: false }), false, "not under the menu");
});

test("bug 3 · RattleOnlyWhileShaking / RattleComesBack: the shake's rattle plays only while the tray shakes, and sound back on restores it", () => {
  const calls: string[] = [] as string[];
  const loops: S.Loops = { start: () => calls.push("start"), stop: () => calls.push("stop") };
  const s = play();
  S.syncLoops(s, loops);
  assert.deepEqual(calls, [], "not while the tray is still");
  s.shaking = true; S.syncLoops(s, loops);
  assert.deepEqual(calls, ["start"]);
  S.setSound(s, false); S.syncLoops(s, loops);
  assert.equal(s.rattle, false, "muted (the kit has already stopped every loop)");
  (calls as string[]).push("stop");
  S.setSound(s, true); S.syncLoops(s, loops);
  assert.equal(s.rattle, true, "sound back on, mid-shake: the rattle is back");
  assert.equal(calls.at(-1), "start");
  S.pause(s); S.syncLoops(s, loops);
  assert.equal(s.rattle, false, "paused");
  S.resume(s, 0); S.syncLoops(s, loops);
  assert.equal(s.rattle, true, "resumed mid-shake: it comes back");
  S.blur(s); S.syncLoops(s, loops); assert.equal(s.rattle, false);
  S.focus(s); S.syncLoops(s, loops); assert.equal(s.rattle, true);
  s.shaking = false; S.syncLoops(s, loops);
  assert.equal(s.rattle, false, "the shake ends: it stops (no fixed timer)");
  s.shaking = true; S.syncLoops(s, loops); S.goTo(s, "over"); S.syncLoops(s, loops);
  assert.equal(s.rattle, false, "the end");
  assert.equal(calls.filter(call => call === "start").length, calls.filter(call => call === "stop").length, "every start has its stop");
});

test("bug 2 · NoCheerAfterYouMoveOn: starting a level cuts the last result's notes and leaves nothing to come", () => {
  const s = play();
  let silenced = 0;
  S.cheer(s, 1000, 2000);
  assert.ok(S.cheering(s, 1500), "the stars and the call are scheduled");
  S.startRun(s, () => { silenced++; });
  assert.equal(silenced, 1, "silenceScheduled runs");
  assert.equal(S.cheering(s, 1500), false, "and nothing is left to play on the next level");
  assert.equal(s.shaking, false);
  // the component schedules every note on the audio clock and keeps no timer for the cheer: its only setTimeout is the idle hint
  const source = readFileSync(new URL("../components/churir-game.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/setTimeout\(/g) ?? []).length, 1, "one timer in the game: the idle hint");
  assert.ok(source.includes("S.startRun(session.current, silenceScheduled)"), "begin() cuts the old notes first");
  assert.ok(/clearTimeout\(hintTimer\.current\)/.test(source));
});

test("bug 4 · UnlockNeverShrinks / SavedUnlockIsEarned: a friend's far level opens nothing in between", () => {
  assert.equal(readOpen(null, { 1: 3, 2: 2, 5: 1 }), 6, "first visit: the old rule (one past the highest with stars)");
  assert.equal(readOpen("4", { 1: 3, 2: 2, 9: 1 }), 4, "after that, the saved open level");
  assert.equal(readOpen("junk", {}), 1);
  assert.equal(openAfter(4, 4), 5);
  assert.equal(openAfter(4, 2), 4, "an earlier level doesn't shrink it");
  assert.equal(openAfter(4, 12), 4, "a friend's far level opens nothing");
  assert.equal(openAfter(40, 40), 40);
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2, 3: 3 }, 3), 2);
  // the live replay: a link to level 3 on an empty phone, cleared; the phone still opens on level 1 and only 1 is open
  const spec = LEVELS[2], run = newRun(3), game = botGame(run, spec);
  assert.ok(game.won);
  assert.equal(openAfter(readOpen(null, {}), 3), 1);
  assert.equal(readOpen(null, {}), 1);
  assert.equal(parseShared("s=1&t=1")?.level, undefined);
});

test("finale gifts are help, never a trap: the greedy bot still clears every finale with each gift", () => {
  for (const level of [10, 20, 30, 40]) {
    for (const gift of [1, 2, 3]) {
      const run = { ...newRun(level), gift };
      const game = botGame(run, LEVELS[level - 1]);
      assert.ok(game.won, `finale ${level} with gift ${gift}`);
    }
  }
});
