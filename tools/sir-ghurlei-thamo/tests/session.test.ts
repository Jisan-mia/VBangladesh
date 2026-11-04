// The statechart's bug paths (ai_docs/statecharts/sir-ghurlei-thamo/), replayed against the pure session and the rules.
// `page()` does what components/class-game.tsx does: step only while ticking, spend the breath after coming back, let go
// after a catch in one-tap mode, and start or stop the hum as syncHum asks.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createGame, makeClass, type Game } from "../lib/class";
import { parseShared } from "../lib/challenge";
import * as S from "../lib/session";
import { stepGame } from "../lib/step.hot";

const DT = 1 / 60;

function page(tapMode = false, level = 1, sound = true) {
  const s = S.createSession(sound, tapMode), g: Game = createGame(makeClass(5, level));
  const log: string[] = [];
  let humming = 0;
  const loops: S.Loops = { start: () => { humming++; log.push("start"); }, stop: () => { humming = Math.max(0, humming - 1); log.push("stop"); } };
  const p = {
    s, g, log, at: 1000,
    get hum() { return humming; },
    sync() { S.syncHum(s, loops); },
    start() { S.goTo(s, "play", p.at); p.sync(); },
    /** One frame, as the component's step does it. */
    frame() {
      p.at += DT * 1000;
      if (!S.ticking(s) || g.phase === "over") return;
      if (s.breath > 0) { s.breath = Math.max(0, s.breath - DT); return; }
      const before = g.catches;
      stepGame(g, s.held, DT);
      if (g.catches !== before) S.caught(s);
      p.sync();
    },
    wait(seconds: number) { for (let i = 0; i < seconds * 60; i++) p.frame(); },
    press() { const ok = S.press(s); p.sync(); return ok; },
    release() { S.release(s); },
    wake() { S.wake(s); p.sync(); },
    blur() { S.blur(s); p.sync(); }, focus() { S.focus(s); p.wake(); },
    hide() { S.hide(s); p.sync(); }, show() { S.show(s); p.wake(); },
    pause() { S.pause(s); p.sync(); }, resume() { S.resume(s); p.wake(); },
    /** The site-wide switch: turning it off makes the kit stop every loop itself. */
    sound(on: boolean) { S.setSound(s, on); if (!on) humming = 0; p.sync(); },
  };
  return p;
}
test("statechart PausedWhenBlurred: five seconds in another window, and the clock, the teacher and the chit all stand still", () => {
  const p = page();
  p.start();
  p.press();
  p.wait(0.6);
  assert.ok(p.g.time > 0.5 && p.g.moving);
  const before = { time: p.g.time, seg: p.g.seg, segT: p.g.segT, pos: p.g.pos };
  p.blur();
  assert.equal(S.ticking(p.s), false);
  assert.equal(p.s.held, false, "let go on the way out");
  p.wait(5);
  assert.deepEqual({ time: p.g.time, seg: p.g.seg, segT: p.g.segT, pos: p.g.pos }, before, "the bug: 3 s away and the teacher had moved on to the tell");
  p.focus();
  assert.equal(p.s.breath, S.BREATH, "a breath before anything moves");
  p.wait(0.4);
  assert.equal(p.g.time, before.time, "still inside the breath");
  p.wait(0.2);
  assert.ok(p.g.time > before.time, "then the class goes on from where it stopped");
  assert.ok(p.g.time - before.time < 0.3);
});

test("statechart InputReleasedWhenAway: in one-tap mode the chit stops when you leave, and waits for a fresh tap", () => {
  const p = page(true);
  p.start();
  p.press();
  assert.equal(p.s.held, true);
  p.wait(0.3);
  const at = p.g.pos;
  p.blur();
  assert.equal(p.s.held, false, "the bug: it kept walking into the teacher's look");
  p.wait(8);
  assert.equal(p.g.pos, at);
  assert.equal(p.g.catches, 0);
  p.focus();
  p.wait(1);
  assert.equal(p.g.pos, at, "back in the window the chit still waits");
  p.press();
  p.wait(0.2);
  assert.ok(p.g.pos > at);
});

test("hide, the player's menu and the level list stop the class the same way, and 'চালিয়ে যাও' resumes it with a breath", () => {
  const p = page();
  p.start();
  p.press(); p.wait(0.3);
  p.hide();
  assert.ok(!S.ticking(p.s) && !p.s.held);
  p.show();
  assert.ok(S.ticking(p.s) && p.s.breath > 0);
  p.wait(0.6);
  p.pause();
  assert.ok(!S.ticking(p.s));
  const t = p.g.time;
  p.wait(3);
  assert.equal(p.g.time, t);
  p.resume();
  assert.ok(S.ticking(p.s));
  S.openSheet(p.s); p.sync();
  assert.ok(!S.ticking(p.s), "opening the level list pauses play");
  S.closeSheet(p.s); p.wake();
  assert.ok(S.ticking(p.s) && p.s.breath > 0);
  // Blur while paused: the focus coming back must not start the class under the menu.
  p.pause(); p.blur(); p.focus();
  assert.ok(!S.ticking(p.s), "the menu is still open");
});

test("the click that brings focus back is not a move", () => {
  const p = page();
  p.start();
  p.press(); p.wait(0.4);
  p.blur();
  p.focus();
  const at = p.g.pos;
  assert.equal(p.press(), false, "the pointerdown that came with the focus is ignored");
  p.wait(1);
  assert.equal(p.g.pos, at);
  assert.equal(p.press(), true, "a press after the breath counts");
  p.wait(0.2);
  assert.ok(p.g.pos > at);
});

test("statechart LoopOnlyWhenMeaningful / LoopComesBack: the hum plays only in a running class with sound on, and returns when sound does", () => {
  const p = page();
  assert.equal(p.hum, 0, "not on the title screen");
  p.start();
  assert.equal(p.hum, 1, "a running class has the hum ready (silent unless the chit moves)");
  p.sound(false);
  assert.equal(p.hum, 0);
  p.press(); p.wait(0.5);
  p.sound(true);
  assert.equal(p.hum, 1, "the bug: sound back on and the chit moved in silence");
  assert.equal(p.log.filter(x => x === "start").length, 2, "a fresh hum, not the muted stub");
  p.blur();
  assert.equal(p.hum, 0);
  p.focus();
  assert.equal(p.hum, 1, "and it comes back with the class");
  p.pause();
  assert.equal(p.hum, 0);
  p.resume();
  assert.equal(p.hum, 1);
  S.goTo(p.s, "over"); p.sync();
  assert.equal(p.hum, 0, "stops at the end");
  // Muted, then the page unmounts: nothing left running.
  const q = page(false, 1, false);
  q.start();
  assert.equal(q.hum, 0, "sound off: no loop at all");
});

test("a catch in one-tap mode lets go; in hold mode a held finger waits for a lift", () => {
  const p = page(true);
  p.start();
  p.press();
  for (let i = 0; i < 60 * 40 && p.g.catches === 0; i++) p.frame();
  assert.equal(p.g.catches, 1);
  assert.equal(p.s.held, false, "the tap is let go with the catch");
  const q = page();
  q.start();
  q.press();
  for (let i = 0; i < 60 * 40 && q.g.catches === 0; i++) q.frame();
  assert.equal(q.g.catches, 1);
  assert.equal(q.s.held, true);
  assert.equal(q.g.needRelease, true);
});

test("statechart ResultStaysUntilYouChoose: a held Enter doesn't skip the result, a fresh press does", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 5000);
  assert.equal(S.freshResultKey(s, { timeStamp: 5200, repeat: true }), false, "the bug: the first auto-repeat of a held Enter left the result");
  assert.equal(S.freshResultKey(s, { timeStamp: 4990, repeat: false }), false, "a key pressed before the screen appeared");
  assert.equal(S.freshResultKey(s, { timeStamp: 5300, repeat: false }), true);
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 5300, repeat: false }), false, "the menu has the keys");
  S.resume(s);
  S.openSheet(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 5300, repeat: false }), false, "the level list has the keys");
  const play = S.createSession(true);
  assert.equal(S.freshResultKey(play, { timeStamp: 9e9, repeat: false }), false, "only on the result");
});

test("statechart FriendLinkOpensTheirClass: a link arriving by hashchange parses; in-page anchors and junk don't", () => {
  assert.equal(parseShared("#s=777&t=300&c=0&n=rafi")?.name, "rafi");
  assert.equal(parseShared("#s=777&t=300&c=0&l=9&v=2&n=rafi")?.level, 9);
  for (const junk of ["#result", "#tool", "", "#s=1", "#guide"]) assert.equal(parseShared(junk), null, junk);
});

test("statechart CelebrationOnlyOnResult: nothing in the component waits on a timer that can outlive its class", () => {
  // The old game kept no id for the timeout that played the win sound and the confetti, so they landed on the next class.
  // Now the result calls the sounds straight away (scheduled notes, cut by silenceScheduled on every new class and on unmount).
  const source = readFileSync(new URL("../components/class-game.tsx", import.meta.url), "utf8");
  const timers = source.match(/setTimeout\(/g) ?? [];
  assert.equal(timers.length, 1, "the one timer is the keyboard-activation release");
  assert.ok(/pulse\.current = window\.setTimeout/.test(source) && /window\.clearTimeout\(pulse\.current\); loops\.stop\(\)/.test(source), "kept, and cleared on unmount");
  assert.ok(/function begin[\s\S]*silenceScheduled\(\)/.test(source), "a new class cuts queued notes");
  assert.ok(/loops\.stop\(\); silenceScheduled\(\)/.test(source), "unmount cuts them too");
});

test("pressing is ignored on the title, the story and the result", () => {
  const p = page();
  assert.equal(p.press(), false);
  p.start();
  assert.equal(p.press(), true);
  S.goTo(p.s, "over");
  assert.equal(S.press(p.s), false);
});
