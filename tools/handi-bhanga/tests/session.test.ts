// The statechart's bug paths, replayed against the pure session (ai_docs/statecharts/handi-bhanga/README.md): every rule the
// model proves is asserted here on the real code.
import assert from "node:assert/strict";
import test from "node:test";
import { createLevel } from "../lib/rules";
import * as S from "../lib/session";

const playing = (sound = true) => { const s = S.createSession(sound); S.goTo(s, "play"); s.resumeAt = -Infinity; return s; };
const down = (s: S.Session, id = 1, at = 1000, hand: "aim" | "move" = "move") => S.pointerDown(s, { pointerId: id, timeStamp: at }, hand);
const windy = () => createLevel(1, 9);

test("PausedWhenBlurred: clicking into another window stops the stall, coming back starts it", () => {
  const s = playing();
  assert.ok(S.ticking(s));
  S.blur(s);
  assert.equal(S.ticking(s), false);
  S.focus(s);
  assert.ok(S.ticking(s));
});

test("PausedWhenHidden: a hidden tab stops it and releases everything", () => {
  const s = playing();
  s.left = true; down(s);
  S.hide(s);
  assert.equal(S.ticking(s), false);
  assert.deepEqual([s.left, s.pointer, s.hand], [false, -1, ""]);
  S.show(s);
  assert.ok(S.ticking(s));
});

test("PausedWhenOffScreen: a stall scrolled away never steps, and a round that starts off screen waits", () => {
  const s = playing();
  S.setInView(s, false);
  assert.equal(S.ticking(s), false);
  assert.equal(S.canAct(s, 5000), false, "a tap on the pad does nothing while the stall is off screen");
  assert.equal(down(s), false);
  S.setInView(s, true);
  assert.ok(S.ticking(s));
});

test("NoProgressWhileAway: nothing steps while blurred, hidden, scrolled off, paused or with the list open", () => {
  for (const away of [S.blur, S.hide, (s: S.Session) => S.setInView(s, false), S.pause, S.openSheet] as const) {
    const s = playing();
    (away as (s: S.Session) => void)(s);
    assert.equal(S.ticking(s), false);
  }
});

test("InputReleasedWhenAway: after blur, hide, the menu or the list, no key or finger counts as held", () => {
  for (const away of [S.blur, S.hide, S.pause, S.openSheet] as const) {
    const s = playing();
    S.arrow(s, "left", true); S.arrow(s, "right", true); S.throwKeyDown(s, { repeat: false, timeStamp: 1000 }); down(s);
    (away as (s: S.Session) => void)(s);
    assert.deepEqual([s.left, s.right, s.throwHeld, s.pointer, s.hand], [false, false, false, -1, ""]);
    assert.equal(S.steer(s), 0);
  }
});

test("InputReleasedWhenAway (the drag): a mouse move with no button never moves the stall, and a lost pointerup lets go", () => {
  const s = playing();
  assert.ok(down(s, 1, 1000, "move"));
  assert.ok(S.pointerMove(s, { pointerId: 1, pointerType: "mouse", buttons: 1 }));
  assert.equal(S.pointerMove(s, { pointerId: 1, pointerType: "mouse", buttons: 0 }), false);
  assert.equal(s.pointer, -1, "the drag is over once the button is found up");
  assert.equal(S.pointerMove(s, { pointerId: 1, pointerType: "mouse", buttons: 1 }), false, "and a later move is no longer a drag");
  assert.equal(S.pointerUp(s, { pointerId: 1 }), "");
});

test("a drag only counts for the pointer that pressed; another finger is ignored", () => {
  const s = playing();
  assert.ok(down(s, 1));
  assert.equal(S.pointerMove(s, { pointerId: 2, pointerType: "touch", buttons: 1 }), false);
  assert.equal(S.pointerUp(s, { pointerId: 2 }), "");
  assert.equal(S.pointerUp(s, { pointerId: 1 }), "move");
});

test("an aim in progress is dropped when you leave, never thrown", () => {
  const s = playing();
  assert.ok(down(s, 1, 1000, "aim"));
  S.blur(s);
  assert.equal(S.pointerUp(s, { pointerId: 1 }), "", "the lift after coming back is not a throw");
  const t = playing();
  assert.ok(down(t, 1, 1000, "aim"));
  S.pause(t);
  assert.equal(S.pointerUp(t, { pointerId: 1 }), "");
});

test("ChoiceFreezesPlay: while the level list is open nothing steps, and a tap that closes it only wakes the game", () => {
  const s = playing();
  S.openSheet(s);
  assert.equal(S.ticking(s), false);
  assert.equal(S.throwKeyDown(s, { repeat: false, timeStamp: 3000 }), false);
  assert.equal(down(s), false);
  S.closeSheet(s, 4000);
  assert.ok(S.ticking(s));
  assert.equal(down(s, 1, 4100), false, "the first tap after the list closes only wakes the game");
  assert.ok(down(s, 1, 4000 + S.RESUME_GUARD));
});

test("the click that brings focus back is not a move: after the menu, the first tap and key only wake the game", () => {
  const s = playing();
  S.pause(s);
  S.resume(s, 2000);
  assert.equal(down(s, 1, 2100, "aim"), false);
  assert.equal(S.throwKeyDown(s, { repeat: false, timeStamp: 2100 }), false);
  S.throwKeyUp(s);
  assert.ok(S.throwKeyDown(s, { repeat: false, timeStamp: 2000 + S.RESUME_GUARD + 1 }));
});

test("a held throw key never throws twice, and auto-repeat is ignored", () => {
  const s = playing();
  assert.ok(S.throwKeyDown(s, { repeat: false, timeStamp: 1000 }));
  assert.equal(S.throwKeyDown(s, { repeat: true, timeStamp: 1030 }), false);
  assert.equal(S.throwKeyDown(s, { repeat: false, timeStamp: 1060 }), false, "no keyup came, so it is still held");
  S.throwKeyUp(s);
  assert.ok(S.throwKeyDown(s, { repeat: false, timeStamp: 1200 }));
});

test("arrows count only while the stall steps; they give a direction", () => {
  const s = playing();
  S.arrow(s, "left", true);
  assert.equal(S.steer(s), -1);
  S.arrow(s, "right", true);
  assert.equal(S.steer(s), 0);
  S.arrow(s, "left", false);
  assert.equal(S.steer(s), 1);
  S.blur(s);
  S.arrow(s, "right", true);
  assert.equal(S.steer(s), 0, "a key pressed while away never counts");
});

test("result keys need a fresh press: nothing from before the screen appeared, nothing held, nothing while paused", () => {
  const s = playing();
  S.goTo(s, "over", 10_000);
  assert.equal(S.freshResultKey(s, { timeStamp: 10_100, repeat: false }), false, "a throw pressed as the last pot fell");
  assert.equal(S.freshResultKey(s, { timeStamp: 10_000 + S.RESULT_GUARD + 1, repeat: true }), false);
  assert.ok(S.freshResultKey(s, { timeStamp: 10_000 + S.RESULT_GUARD + 1, repeat: false }));
  S.openSheet(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 20_000, repeat: false }), false);
  S.closeSheet(s, 20_000);
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 30_000, repeat: false }), false);
});

test("LoopOnlyWhenMeaningful and LoopComesBack: the wind loop plays on a windy stall with sound on, and only then", () => {
  const log: string[] = [];
  const loops: S.Loops = { start: kind => log.push(`+${kind}`), stop: kind => log.push(`-${kind}`) };
  const game = windy();
  const s = playing();
  S.syncLoops(s, game, loops); S.syncLoops(s, game, loops);
  assert.deepEqual(log, ["+wind"], "started once, not every step");
  S.pause(s); S.syncLoops(s, game, loops);
  S.resume(s, 1000); S.syncLoops(s, game, loops);
  S.blur(s); S.syncLoops(s, game, loops);
  S.focus(s); S.syncLoops(s, game, loops);
  S.hide(s); S.syncLoops(s, game, loops);
  S.show(s); S.syncLoops(s, game, loops);
  S.setSound(s, false); S.syncLoops(s, game, loops);
  S.setSound(s, true); S.syncLoops(s, game, loops);
  S.goTo(s, "over", 5); S.syncLoops(s, game, loops);
  // Turning the sound off needs no stop here: the kit has already stopped every loop, and the session only forgets it.
  assert.deepEqual(log, ["+wind", "-wind", "+wind", "-wind", "+wind", "-wind", "+wind", "+wind", "-wind"]);
  const calm = createLevel(1, 1), quiet = playing();
  S.syncLoops(quiet, calm, loops);
  assert.equal(log.length, 9, "a still stall has no wind loop");
});

test("a muted phone never starts the loop; the end of the stall stops it", () => {
  const log: string[] = [];
  const loops: S.Loops = { start: kind => log.push(`+${kind}`), stop: kind => log.push(`-${kind}`) };
  const muted = playing(false);
  S.syncLoops(muted, windy(), loops);
  assert.deepEqual(log, []);
  const game = windy(), s = playing();
  S.syncLoops(s, game, loops);
  game.phase = "end";
  S.syncLoops(s, game, loops);
  assert.deepEqual(log, ["+wind", "-wind"]);
});

test("the title, the story and the end screen never step the stall", () => {
  for (const screen of ["title", "intro", "over"] as const) {
    const s = S.createSession(true);
    S.goTo(s, screen, 0);
    assert.equal(S.ticking(s), false, screen);
  }
});
