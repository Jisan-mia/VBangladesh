// The statechart's bug paths (ai_docs/statecharts/carrom/README.md), replayed against the pure session, save and game code.
import assert from "node:assert/strict";
import test from "node:test";
import * as S from "../lib/session";
import { openAfter, playable, readOpen, recommended } from "../lib/save";
import { fire, newLevel, settle } from "../lib/game";
import { BIG_STRIKER_R, STRIKER } from "../lib/table";
import { roll } from "./bot";

const playing = () => { const s = S.createSession(); S.start(s); return s; };

test("bug 1 KeysOnlyWhileBoardShows: a Space held while the board scrolls away is let go, and its late keyup strikes nothing", () => {
  const s = playing();
  assert.ok(S.hold(s, "key", " "));
  S.away(s, "scroll");
  assert.equal(s.hold, "none", "scrolling away lets go");
  assert.equal(S.release(s, "key", " "), false, "the keyup that follows strikes nothing");
  S.back(s, "scroll");
  assert.ok(S.resume(s, "away"));
  assert.ok(S.hold(s, "pull"), "the board takes a finger again: nothing is stuck");
  // And a held key always ends on its own keyup, wherever focus went: only the key that started it counts.
  const k = playing();
  S.hold(k, "key", "Enter");
  assert.equal(S.release(k, "key", " "), false);
  assert.equal(S.release(k, "key", "Enter"), true);
});

test("bug 2 LoopOnlyWhenMeaningful: the pull's hum stops when the board scrolls away mid-pull, and on pause and the end", () => {
  const s = playing();
  S.hold(s, "button");
  assert.ok(S.humWanted(s, true, 0.4));
  S.away(s, "scroll");
  assert.equal(S.humWanted(s, true, 0.4), false);
  const p = playing();
  S.hold(p, "pull");
  S.pause(p, "away");
  assert.equal(S.humWanted(p, true, 0.4), false, "paused: quiet");
  const o = playing();
  S.hold(o, "pull");
  S.finish(o, 1000);
  assert.equal(S.humWanted(o, true, 0.4), false, "the end: quiet");
  assert.equal(S.humWanted(playing(), true, 0.4), false, "nothing held: quiet");
});

test("bug 3 PausedWhenBlurred: clicking into another window mid-roll pauses, and the discs don't roll until চালিয়ে যাও", () => {
  const s = playing();
  assert.ok(S.live(s));
  S.away(s, "blur");
  assert.equal(s.phase, "paused");
  assert.equal(S.live(s), false, "the loop steps the discs only while live");
  assert.equal(S.resume(s, "away"), false, "still away: no resume");
  S.back(s, "focus");
  // The click that brings focus back is not a move: nothing may be held while paused.
  assert.equal(S.hold(s, "pull"), false);
  assert.ok(S.resume(s, "away"));
  assert.ok(S.live(s));
  // A hidden tab too.
  const h = playing();
  S.away(h, "hide");
  assert.equal(h.phase, "paused");
});

test("bug 4 ShotFixedOnceFired: the striker's size belongs to the game, so nothing changes it mid-strike", () => {
  const g = newLevel(5, "e");
  assert.equal(g.world.r[STRIKER], BIG_STRIKER_R);
  assert.equal(fire(g, -0.3, 0.7), "ok");
  assert.equal(fire(g, 0, 0.5), "busy", "a second strike can't start while one rolls");
  roll(g);
  settle(g);
  assert.equal(g.world.r[STRIKER], BIG_STRIKER_R, "the same size after the strike");
  // The difficulty (and so the size) is chosen only on the start card: once play starts, the title is gone.
  const s = playing();
  assert.notEqual(s.phase, "title");
});

test("bug 5 UnlockOnlyByClearing: a friend's far-ahead board opens nothing between, and old stars migrate as an unbroken run", () => {
  assert.equal(openAfter(1, 10), 1, "clearing a friend's board 10 opens nothing");
  assert.equal(openAfter(3, 2), 3, "replaying an earlier board opens nothing");
  assert.equal(openAfter(3, 3), 4, "clearing the frontier opens the next");
  assert.equal(openAfter(15, 15), 15);
  assert.ok(playable(10, 1, 10), "the friend's board itself, this visit");
  assert.equal(playable(9, 1, 10), false, "but not the ones between");
  assert.deepEqual(readOpen(null, { 10: 2 }), { open: 1, migrated: true }, "an old friend-link clear doesn't open the run");
  assert.deepEqual(readOpen(null, { 1: 3, 2: 1, 4: 2 }), { open: 3, migrated: true });
  assert.deepEqual(readOpen("5", {}), { open: 5, migrated: false });
  assert.deepEqual(readOpen("junk", {}), { open: 1, migrated: true });
  assert.equal(recommended({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(recommended({ 1: 3, 2: 2, 3: 3 }, 3), 2);
});

test("HeldKeyNeverSkips: a key held through the end, or pressed before the slip appeared, never skips it", () => {
  const s = playing();
  S.finish(s, 1000);
  assert.equal(S.again(s, 1200), false, "the guard");
  assert.equal(S.again(s, 1700, { at: 900, repeat: false }), false, "pressed before the slip");
  assert.equal(S.again(s, 1700, { at: 1650, repeat: true }), false, "a repeat");
  assert.ok(S.again(s, 1700, { at: 1650, repeat: false }));
  assert.ok(S.again(s, 1700), "a tap after the guard");
});

test("ChoiceFreezesPlay: সব বোর্ড pauses, and coming back from another window doesn't close it", () => {
  const s = playing();
  S.openSheet(s);
  assert.equal(s.phase, "paused");
  assert.equal(S.live(s), false);
  S.away(s, "blur");
  S.back(s, "focus");
  assert.equal(S.resume(s, "away"), false, "the sheet is still open");
  S.closeSheet(s);
  assert.ok(S.live(s));
});

test("CheerOnlyOnItsResult: a fanfare queued for one board never plays over the next", () => {
  const s = playing();
  S.finish(s, 0);
  const run = s.run;
  assert.ok(S.cheerMayPlay(s, run));
  S.reset(s);
  assert.equal(S.cheerMayPlay(s, run), false);
  S.replay(s);
  assert.equal(S.cheerMayPlay(s, run), false);
});

test("LoopComesBack: turning sound off mid-pull silences the hum, and turning it on brings a real hum back", async () => {
  const { setSoundOn } = await import("../../../shared/game-sound");
  const { makeHum } = await import("../components/sound");
  const hum = makeHum();
  setSoundOn(true);
  hum.update(true, 0.4);
  assert.equal(hum.on, true);
  setSoundOn(false);
  hum.update(true, 0.5);
  assert.equal(hum.on, false, "muted: a silent stub");
  setSoundOn(true);
  hum.update(true, 0.5);
  assert.equal(hum.on, true, "sound back: a real hum again, not the stub");
  hum.update(false, 0);
  assert.equal(hum.on, false, "let go: quiet");
});
