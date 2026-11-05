// The statechart's bug paths (ai_docs/statecharts/penalty/README.md), replayed against the pure match, session and progress code.
import assert from "node:assert/strict";
import test from "node:test";
import { recordLevel, unlockedLevel } from "../../../shared/game-core";
import { crowdWanted, keepCrowd, type Loop } from "../lib/crowd";
import { createGame, dive, next, shoot, Ev, Stage, AFTER } from "../lib/game";
import { afterClear, loadProgress, migrateStars, playable, recommended } from "../lib/progress";
import { again, away, back, cheerMayPlay, createSession, finish, moving, pause, pick, press, reset, resume, start, storyDone, GUARD_MS } from "../lib/session";
import { stepGame } from "../lib/step.hot";
import { LEVEL_COUNT } from "../lib/levels";
import { decided } from "../lib/rules";

/** Plays a whole match to its deciding landing: the game sits in "After" with the result in, the end one step away. */
function toTheLastKick(level: number, seed: number) {
  const g = createGame(level, seed);
  for (let guard = 0; guard < 1e6; guard++) {
    if (g.stage === Stage.Aim) shoot(g, { x: 0.8, y: 0.2, power: 0.8, curve: 0 });
    if (g.stage === Stage.Run && g.dive < 0) dive(g, 1);
    stepGame(g, 1 / 60);
    g.events = 0;
    if (g.stage === Stage.After && decided(g.data.format, g.data.kicks, g.tally)) return g;
  }
  throw new Error("no last kick");
}

test("bug 1, NoDoubleResult: a slow frame that runs several steps past the end finishes the match once", () => {
  for (const level of [1, 2, 3, 6]) {
    const g = toTheLastKick(level, 4242);
    let overs = 0;
    // One long frame: the loop catches up with a dozen steps at once, all before React draws the card.
    for (let i = 0; i < 120; i++) { stepGame(g, 1 / 60); if (g.events & Ev.Over) overs++; g.events = 0; }
    assert.equal(g.stage, Stage.Over);
    assert.equal(overs, 1, `level ${level}: the match ended ${overs} times`);
    const kicks = g.count;
    next(g); stepGame(g, AFTER * 3);
    assert.equal(g.count, kicks, "nothing more is recorded after the end");
    const s = createSession();
    start(s, false);
    assert.ok(finish(s, 1000));
    assert.equal(finish(s, 1016), false, "the session finishes once too");
  }
});

test("bug 2, CardNeedsAFreshPress: Space held through the last kick never skips the card or starts the next match", () => {
  const s = createSession();
  start(s, false);
  finish(s, 5000);
  assert.equal(again(s, 5100, { at: 5100, repeat: false }), false, "inside the 0.7 s guard");
  assert.equal(again(s, 6000, { at: 6000, repeat: true }), false, "auto-repeat of a held Space");
  assert.equal(again(s, 6000, { at: 4990, repeat: false }), false, "a press from before the card");
  assert.equal(s.phase, "over");
  assert.ok(again(s, 6000, { at: 6000, repeat: false }), "a fresh press after the card");
  assert.ok(GUARD_MS >= 500);
});

test("bug 3, MurmurComesBack: turn sound off and on during their run-up and the crowd plays again", () => {
  const s = createSession();
  start(s, false);
  let made = 0, stopped = 0, loop: Loop | null = null;
  const make = (): Loop => { made++; return { swell: () => {}, stop: () => { stopped++; } }; };
  loop = keepCrowd(loop, crowdWanted(s, true), make);
  assert.ok(loop); assert.equal(made, 1);
  loop = keepCrowd(loop, crowdWanted(s, false), make);
  assert.equal(loop, null, "sound off drops the loop");
  assert.equal(stopped, 1);
  loop = keepCrowd(loop, crowdWanted(s, true), make);
  assert.ok(loop); assert.equal(made as number, 2, "sound on makes a fresh, real loop (never the stub kept by ??=)");
  // Muted from the start: nothing is made until sound comes on, so no silent stub is ever kept.
  let quiet: Loop | null = null, made2 = 0;
  const make2 = (): Loop => { made2++; return { swell: () => {}, stop: () => {} }; };
  quiet = keepCrowd(quiet, crowdWanted(s, false), make2);
  assert.equal(made2, 0);
  quiet = keepCrowd(quiet, crowdWanted(s, true), make2);
  assert.equal(made2, 1);
});

test("bug 4, PausedWhenBlurred: click into another window during their run-up and it stops; the click back picks no side", () => {
  const s = createSession();
  start(s, false);
  const g = createGame(2, 99);
  for (let i = 0; i < 50; i++) stepGame(g, 1 / 60);
  assert.equal(g.stage, Stage.Run);
  away(s, "blur");
  assert.equal(s.phase, "paused");
  assert.equal(moving(s), false, "the component steps the match only while moving");
  assert.equal(crowdWanted(s, true), false, "the crowd stops with it");
  assert.equal(resume(s), false, "nothing resumes while another window has focus");
  back(s, "focus");
  assert.equal(s.phase, "paused", "coming back alone doesn't restart the run-up");
  assert.equal(press(s), false, "a tap under the menu is not a dive");
  // Not engaged with the player yet, so no menu opened: the game resumes on its own, and the first tap back is still spent.
  assert.ok(resume(s));
  const s2 = createSession();
  start(s2, false);
  away(s2, "blur");
  back(s2, "focus");
  s2.phase = "playing";
  assert.equal(press(s2), false, "the click that brings the window back is not a move");
  assert.equal(press(s2), true, "the next one is");
  away(s, "hide");
  assert.equal(moving(s), false);
});

test("bug 5, InputReleasedWhenAway: a finger kept across a blur or hide never shoots", () => {
  for (const what of ["blur", "hide"] as const) {
    const s = createSession();
    start(s, false);
    assert.ok(press(s));
    s.finger = true;
    away(s, what);
    assert.equal(s.finger, false);
  }
  const s = createSession();
  start(s, false);
  s.finger = true;
  pause(s);
  assert.equal(s.finger, false, "the player's pause lets go too");
});

test("bug 6, LevelPickerFreezesPlay: the match list opens only on the title or the card, and nothing starts under it", () => {
  const s = createSession();
  start(s, false);
  assert.equal(pick(s, true), false, "not mid-match");
  finish(s, 100);
  assert.ok(pick(s, true));
  assert.equal(moving(s), false);
  assert.equal(again(s, 5000), false, "the card's keys wait under the list");
  reset(s);
  assert.equal(s.picking, false);
  pick(s, true);
  assert.equal(start(s, false), false);
  pick(s, false);
  assert.ok(start(s, true));
  assert.equal(s.phase, "story");
  assert.equal(moving(s), false, "the story doesn't run the match");
  assert.ok(storyDone(s));
  assert.ok(moving(s));
});

test("CelebrationOnItsOwnCard: a fanfare queued at the end never plays after পরের ম্যাচ or a restart", () => {
  for (const moveOn of [(s: ReturnType<typeof createSession>) => again(s, 1000 + GUARD_MS + 10), (s: ReturnType<typeof createSession>) => { reset(s); return true; }]) {
    const s = createSession();
    start(s, false);
    finish(s, 1000);
    const run = s.run;
    assert.ok(cheerMayPlay(s, run));
    assert.ok(moveOn(s));
    assert.equal(cheerMayPlay(s, run), false);
  }
});

test("friend links: clearing a friend's far-ahead final records its stars but opens nothing in between", () => {
  let unlock = 2, stars = recordLevel({}, 1, 2);
  stars = recordLevel(stars, 9, 3);
  unlock = afterClear(unlock, 9);
  assert.equal(unlock, 2, "the friend's level 9 opens nothing");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 10, "(the shared rule would have opened 2–9)");
  assert.ok(playable(9, unlock, stars), "but it can be replayed: it has stars");
  assert.equal(playable(5, unlock, stars), false);
  assert.ok(playable(5, unlock, stars, 5), "a friend's match is playable on its link");
  unlock = afterClear(unlock, 2);
  assert.equal(unlock, 3);
  assert.equal(recommended(3, stars), 2, "the first open match short of 3 stars");
});

test("UnlockNeverShrinks and StarsNeverDrop: in any order, the unlock and the stars only grow", () => {
  let unlock = 1, stars = {} as Record<number, number>;
  for (const [level, earned] of [[1, 1], [3, 3], [1, 3], [2, 1], [2, 0], [12, 2], [3, 1]] as const) {
    const before = unlock, had = stars[level] ?? 0;
    if (earned) { stars = recordLevel(stars, level, earned); unlock = afterClear(unlock, level); }
    assert.ok(unlock >= before);
    assert.ok((stars[level] ?? 0) >= had);
  }
});

test("old progress moves once to the new twelve matches, same team, same stars", () => {
  assert.deepEqual(migrateStars(JSON.stringify({ 1: 2, 2: 3, 3: 1, 8: 1, 9: 3, x: 1 })), { 3: 2, 4: 3, 6: 1, 12: 1 });
  const first = loadProgress(JSON.stringify({ 1: 2, 2: 1 }), null);
  assert.deepEqual(first.stars, { 3: 2, 4: 1 });
  assert.equal(first.unlock, 5, "nobody loses a match they could play: everything up to the furthest old one");
  assert.ok(first.write);
  // Second load: the new numbers are read as they are, never moved again.
  const again2 = loadProgress(first.write!.levels, first.write!.unlock);
  assert.deepEqual(again2.stars, { 3: 2, 4: 1 });
  assert.equal(again2.unlock, 5);
  assert.equal(again2.write, null);
  const fresh = loadProgress(null, null);
  assert.deepEqual(fresh.stars, {});
  assert.equal(fresh.unlock, 1);
  assert.equal(loadProgress(null, "99").unlock, LEVEL_COUNT);
});
