// The statechart's bug paths (ai_docs/statecharts/roshi-tana/), replayed against the pure session, clock and rules.
// `page()` does what components/game.tsx does: step only while ticking, wake (re-base and count in) on the way back, and
// start or stop the crowd as syncLoops says.
import assert from "node:assert/strict";
import test from "node:test";
import { beatFloor, beatTime, createMatch, resume, tap, type Match } from "../lib/match";
import * as S from "../lib/session";
import { advance } from "../lib/step.hot";

const LEAD = 450;

function page(sound = true, level = 1) {
  const s = S.createSession(sound), log: string[] = [];
  let playing = 0;
  const loops: S.Loops = { start: () => { playing++; log.push("start"); }, stop: () => { playing = Math.max(0, playing - 1); log.push("stop"); } };
  const p = {
    s, log, real: 1000, m: createMatch(4242, level) as Match, clock: S.createClock(1000, LEAD),
    get crowd() { return playing; },
    sync() { S.syncLoops(s, loops); },
    start() { p.m = createMatch(4242, level); p.clock = S.createClock(p.real, LEAD); S.goTo(s, "play", p.real); p.sync(); },
    /** Real time passes; the page steps each frame it would get (none while not ticking). */
    wait(ms: number, taps: number[] = []) {
      const end = p.real + ms;
      let next = 0;
      for (; p.real < end; p.real += 1000 / 60) {
        while (next < taps.length && taps[next] <= p.real) { p.tapAt(taps[next]); next++; }
        if (!S.ticking(s) || p.m.winner !== null) continue;
        advance(p.m, S.tick(p.clock, p.real));
        p.sync();
      }
    },
    tapAt(real: number) { return S.canTap(s) ? tap(p.m, 0, S.tapTime(p.clock, real)) : "ignored"; },
    wake() {
      if (S.wake(s, p.clock, p.real) && p.m.winner === null && p.clock.now >= 0) resume(p.m, p.clock.now);
      p.sync();
    },
    blur() { S.blur(s); p.sync(); }, focus() { S.focus(s); p.wake(); },
    hide() { S.hide(s); p.sync(); }, show() { S.show(s); p.wake(); },
    pause() { S.pause(s); p.sync(); }, resume() { S.resume(s); p.wake(); },
    beatAt(k: number) { return p.clock.origin + beatTime(p.m, k); },
  };
  return p;
}
/** Real-time taps right on beats from..to of the page's current match. */
const onBeats = (p: ReturnType<typeof page>, from: number, to: number) => Array.from({ length: to - from }, (_, i) => p.beatAt(from + i) + 15);

test("statechart PausedWhenBlurred / NoProgressWhileAway: six seconds in another window, and not one beat goes by", () => {
  const p = page();
  p.start();
  p.wait(3980, onBeats(p, 3, 6));
  const before = { beats: p.m.beats, x: p.m.x, bot: p.m.sides[1].perfect + p.m.sides[1].good, now: p.clock.now };
  assert.ok(before.beats >= 1, "the match is under way");
  p.blur();
  assert.equal(S.ticking(p.s), false);
  p.wait(6000);
  assert.equal(p.m.beats, before.beats, "frozen while away");
  assert.equal(p.clock.now, before.now, "the clock didn't move");
  p.focus();
  p.wait(150);
  // The bug: beats 3 → 11, the other team pulled 4 at once, the rope jumped. Now: at most the 150 ms back.
  assert.ok(p.m.beats - before.beats <= 1, `beats ${before.beats} → ${p.m.beats}`);
  assert.equal(p.m.sides[1].perfect + p.m.sides[1].good, before.bot, "the other team waits out the fresh count-in");
  assert.ok(Math.abs(p.m.x - before.x) < 0.05, `rope ${before.x} → ${p.m.x}`);
  assert.ok(p.clock.now - before.now < 200, "the clock carries on from where it stopped");
});

test("statechart NoProgressWhileAway: a hidden tab and the player's menu freeze the match the same way", () => {
  for (const away of ["hide", "pause"] as const) {
    const p = page();
    p.start();
    p.wait(3000, onBeats(p, 3, 5));
    const beats = p.m.beats, bot = p.m.sides[1].perfect + p.m.sides[1].good;
    if (away === "hide") p.hide(); else { p.blur(); p.pause(); }
    p.wait(45_000);
    assert.equal(p.m.winner, null, `${away}: nothing is decided while you're gone`);
    if (away === "hide") p.show(); else { p.focus(); p.resume(); }
    p.wait(100);
    assert.ok(p.m.beats - beats <= 1 && p.m.sides[1].perfect + p.m.sides[1].good === bot, away);
  }
});

test("statechart NoProgressWhileAway: even with no blur at all (a frozen tab), one step never plays more than 100 ms", () => {
  const p = page();
  p.start();
  p.wait(2000);
  const now = p.clock.now;
  p.real += 8000;
  advance(p.m, S.tick(p.clock, p.real));
  assert.ok(p.clock.now - now <= S.MAX_GAP);
  assert.ok(p.m.beats <= 1);
});

test("statechart: the click that brings focus back is not a move, and a tap while away is ignored", () => {
  const p = page();
  p.start();
  p.wait(3000, onBeats(p, 3, 5));
  p.blur();
  assert.equal(p.tapAt(p.real), "ignored");
  p.focus();
  const slipsBefore = p.m.sides[0].slips, pullsBefore = p.m.sides[0].perfect + p.m.sides[0].good;
  assert.equal(p.tapAt(p.real + 5), "early", "the first tap back lands in the fresh ৩-২-১");
  assert.equal(p.m.sides[0].slips, slipsBefore);
  assert.equal(p.m.sides[0].perfect + p.m.sides[0].good, pullsBefore);
  const next = beatFloor(p.m, p.clock.now) + 1;
  assert.ok(p.m.playFrom >= next + 3, "three count beats before pulls count again");
});

test("statechart LoopOnlyWhenMeaningful: the crowd stops while away, in the menu, on the level list and on the card", () => {
  const p = page();
  p.start();
  assert.equal(p.crowd, 1, "the crowd plays during the match");
  p.blur(); assert.equal(p.crowd, 0, "blur stops it");
  p.focus(); assert.equal(p.crowd, 1);
  p.hide(); assert.equal(p.crowd, 0, "hide stops it");
  p.show(); assert.equal(p.crowd, 1);
  p.pause(); assert.equal(p.crowd, 0, "the menu stops it");
  p.resume(); assert.equal(p.crowd, 1);
  S.openSheet(p.s); p.sync(); assert.equal(p.crowd, 0, "the level list stops it");
  S.closeSheet(p.s); p.wake(); assert.equal(p.crowd, 1);
  S.goTo(p.s, "over", p.real); p.sync(); assert.equal(p.crowd, 0, "the card is quiet");
  assert.equal(p.log.filter(entry => entry === "start").length, p.log.filter(entry => entry === "stop").length, "every start has its stop");
});

test("statechart LoopComesBack: start with sound off, turn it on mid-match, and a fresh crowd starts", () => {
  const p = page(false);
  p.start();
  assert.equal(p.crowd, 0, "nothing started while muted (no silent stub kept)");
  p.wait(1000);
  S.setSound(p.s, true); p.sync();
  assert.equal(p.crowd, 1, "the crowd comes back at once");
  // Off again (the kit stops every loop itself), then on: a new one, not the stopped one.
  S.setSound(p.s, false); p.sync();
  assert.equal(p.s.crowd, false);
  S.setSound(p.s, true); p.sync();
  assert.deepEqual(p.log, ["start", "start"], "two fresh starts; the kit's own stop covers the one in between");
  // Turning sound on in the menu starts nothing until চালিয়ে যাও.
  p.pause(); S.setSound(p.s, false); S.setSound(p.s, true); p.sync();
  assert.equal(S.wantCrowd(p.s), false);
  p.resume();
  assert.equal(S.wantCrowd(p.s), true);
});

test("statechart ChoiceFreezesPlay: the level list freezes the clock and comes back with a count-in", () => {
  const p = page();
  p.start();
  p.wait(3000, onBeats(p, 3, 5));
  const now = p.clock.now;
  S.openSheet(p.s); p.sync();
  p.wait(5000);
  assert.equal(p.clock.now, now);
  S.closeSheet(p.s); p.wake();
  assert.ok(p.m.playFrom > beatFloor(p.m, now) + 1);
});

test("statechart NoDoubleResult: a match ends once, and nothing steps after the card shows", () => {
  const p = page();
  p.start();
  p.wait(30_000, onBeats(p, 3, 40));
  assert.equal(p.m.winner, 0);
  const beats = p.m.beats, x = p.m.x;
  S.goTo(p.s, "over", p.real); p.sync();
  assert.equal(S.ticking(p.s), false);
  p.wait(5000);
  assert.equal(p.m.beats, beats); assert.equal(p.m.x, x);
});

test("result keys need a fresh press: a Space held through the win doesn't skip the card", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 5000);
  assert.equal(S.freshResultKey(s, { timeStamp: 4990, repeat: false }), false, "pressed before the card");
  assert.equal(S.freshResultKey(s, { timeStamp: 5200, repeat: true }), false, "auto-repeat of a held key");
  assert.equal(S.freshResultKey(s, { timeStamp: 5200, repeat: false }), true);
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 5300, repeat: false }), false, "not under the menu");
});

test("the clock re-bases on return: a tap right on the next pulling beat after the count-in is judged right on", () => {
  const p = page();
  p.start();
  p.wait(2500, onBeats(p, 3, 4));
  p.blur(); p.wait(4000); p.focus();
  const k = p.m.playFrom;
  p.wait(beatTime(p.m, k) - p.clock.now - 30);
  assert.equal(p.tapAt(p.beatAt(k) + 10), "perfect");
});
