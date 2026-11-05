// The statechart's bug paths (ai_docs/statecharts/golir-badminton/), replayed against the pure session and match.
// `page()` does what components/game.tsx does: the loop steps the match only when S.step says so, leaving lets a held finger
// go as the tap it was, coming back wakes the match with a breath, and the wind loop follows syncLoops.
import assert from "node:assert/strict";
import test from "node:test";
import { createMatch, press, release, timeToContact, HIGH, type Match } from "../lib/match";
import * as S from "../lib/session";
import { advance } from "../lib/step.hot";

function page(level = 5, { sound = true, focused = true } = {}) {
  const s = S.createSession(sound, focused), log: string[] = [];
  let wind = 0;
  const loops: S.Loops = { start: () => { wind++; log.push("start"); }, stop: () => { wind = Math.max(0, wind - 1); log.push("stop"); } };
  const p = {
    s, log, m: createMatch(4242, level) as Match, loopMounted: true,
    get wind() { return wind; },
    sync() { S.syncLoops(s, loops); },
    start() { p.m = createMatch(4242, level); S.goTo(s, "play", 0, p.m.def.wind !== 0); p.sync(); },
    /** `frames` frames of the loop (useGameLoop calls step once a frame while mounted). */
    frames(count: number) { for (let i = 0; i < count; i++) { if (p.loopMounted && S.step(s) && p.m.winner < 0) advance(p.m); p.sync(); } },
    letGo() { if (p.m.pressAt >= 0) release(p.m, HIGH); S.lift(s); },
    blur() { S.blur(s); p.letGo(); p.sync(); }, focus() { S.focus(s); S.wake(s); p.sync(); },
    hide() { S.hide(s); p.letGo(); p.sync(); }, show() { S.show(s); S.wake(s); p.sync(); },
    pause() { S.pause(s); p.letGo(); p.sync(); }, resume() { S.resume(s); S.wake(s); p.sync(); },
    /** Steps until a shuttle is coming at you and about to arrive. */
    untilIncoming() { for (let i = 0; i < 600 && !(timeToContact(p.m) !== null && (timeToContact(p.m) ?? 1) < 0.02); i++) p.frames(1); },
  };
  return p;
}

test("statechart LoopOnlyWhenMeaningful (bug 1): clicking into another window stops the rooftop wind at once", () => {
  const p = page(5);
  p.start();
  p.frames(90);
  assert.equal(p.wind, 1, "the wind blows during a rooftop match");
  p.blur();
  assert.equal(p.wind, 0, "and stops on blur");
  p.frames(150);
  assert.equal(p.wind, 0, "and stays stopped while away");
  p.focus();
  assert.equal(p.wind, 1, "a fresh one starts on return");
});

test("statechart PausedWhenBlurred (bug 2): away from the window nothing moves, and coming back gives a breath before the shuttle does", () => {
  const p = page(1);
  p.start();
  p.untilIncoming();
  const before = { clock: p.m.clock, i: p.m.i, them: p.m.them };
  p.blur();
  assert.equal(S.ticking(p.s), false);
  p.frames(150);
  assert.deepEqual({ clock: p.m.clock, i: p.m.i, them: p.m.them }, before, "frozen while away");
  p.focus();
  assert.equal(S.canSwing(p.s), false, "the click that brings the window back is not a swing");
  p.frames(S.BREATH);
  assert.equal(p.m.clock, before.clock, "the breath holds the shuttle where it was");
  assert.equal(p.m.them, before.them, "no point was lost while you found the window again");
  assert.equal(S.canSwing(p.s), true);
});

test("statechart NoProgressWhileAway (bug 3): a loop mounted while another window has focus never steps the match", () => {
  // The old useGameLoop started every mount with away = false; the session starts from document.hasFocus() instead.
  const p = page(1, { focused: false });
  p.start();
  p.loopMounted = false; p.frames(10); p.loopMounted = true;
  p.frames(180);
  assert.equal(p.m.clock, 0, "no step until the window has focus");
  // Blur, then the loop unmounts and remounts (the old scroll-away path): the session still knows the window is away.
  const q = page(1);
  q.start(); q.frames(60);
  const clock = q.m.clock;
  q.blur(); q.loopMounted = false; q.frames(5); q.loopMounted = true; q.frames(180);
  assert.equal(q.m.clock, clock);
});

test("statechart InputReleasedWhenAway (bug 4): a finger held on the shuttle is let go as a tap when you click away", () => {
  const p = page(1);
  p.start();
  p.untilIncoming();
  assert.equal(press(p.m), 1);
  S.press(p.s);
  assert.equal(p.s.held, true);
  p.blur();
  assert.equal(p.s.held, false, "nothing counts as held after the blur");
  assert.equal(p.m.pressAt, -1, "the match isn't holding the shuttle on the racket");
  assert.equal(p.m.path.from, 0, "the touch was played as the lift it was");
});

test("statechart NoTapPastResult (bug 5): a key that lands as the result appears doesn't throw it away", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 990, repeat: false }), false, "pressed before the screen appeared");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "a swing key still held through the end");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true, "a fresh press after it works");
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not under the menu");
});

test("statechart PauseOnlyMidMatch (bug 6): hiding the tab on the first screen leaves it ready, and one tap starts", () => {
  const p = page(1);
  p.hide(); p.show();
  assert.equal(p.s.stale, false);
  assert.equal(p.s.breath, 0);
  assert.equal(p.s.screen, "title");
  p.start();
  assert.equal(S.ticking(p.s), true, "one tap and the match runs");
  p.frames(60);
  assert.ok(p.m.clock > 0.9);
});

test("statechart LoopComesBack: start with sound off, turn it on mid-match, and a fresh wind starts (never a stub)", () => {
  const p = page(5, { sound: false });
  p.start(); p.frames(30);
  assert.equal(p.wind, 0);
  S.setSound(p.s, true); p.sync();
  assert.equal(p.wind, 1);
  S.setSound(p.s, false); p.sync();
  assert.equal(p.s.wind, false, "muting counts the kit's stopped loop as stopped");
});

test("statechart ChoiceFreezesPlay: the level list and the player's menu stop the match", () => {
  const p = page(1);
  p.start(); p.frames(40);
  const clock = p.m.clock;
  S.openSheet(p.s); p.letGo(); p.sync(); p.frames(120);
  assert.equal(p.m.clock, clock);
  S.closeSheet(p.s); S.wake(p.s); p.frames(S.BREATH);
  assert.equal(p.m.clock, clock, "a breath after the list too");
  p.pause(); p.frames(120);
  assert.ok(p.m.clock - clock < 0.02);
});

test("statechart NoDoubleResult: a match ends once, and nothing steps after it", () => {
  const p = page(1);
  p.start();
  for (let i = 0; i < 60 * 300 && p.m.winner < 0; i++) p.frames(1);
  assert.ok(p.m.winner >= 0);
  const clock = p.m.clock;
  S.goTo(p.s, "over", 5);
  p.frames(120);
  assert.equal(p.m.clock, clock);
});
