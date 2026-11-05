// The statechart's bug paths and rules, replayed against the pure session (and the race it gates). Each test names the rule.
import assert from "node:assert/strict";
import test from "node:test";
import { recordLevel, readLevels, unlockedLevel } from "../../../shared/game-core";
import { CALIB_BEATS, CALIB_END, createCalib, lagFrom } from "../lib/calib";
import { LEVEL_COUNT, nextAhead, openLevel, readAhead, readTimes, starsForRank } from "../lib/levels";
import { createRace } from "../lib/rowing";
import * as S from "../lib/session";
import { stepRace } from "../lib/step.hot";

const DT = 1 / 60;
/** A session on the play screen with a race on the water. */
function racing(sound = true) {
  const s = S.createSession(sound);
  S.goTo(s, "play");
  S.setRacing(s, true);
  return s;
}
/** The page's step: the race moves only while the session ticks and the breath is over. Returns seconds of race time that passed. */
function frames(s: S.Session, race: ReturnType<typeof createRace>, seconds: number) {
  const before = race.t;
  for (let n = 0; n < Math.round(seconds / DT); n++) if (S.ticking(s) && !S.breathing(s, DT)) stepRace(race, DT);
  return race.t - before;
}
function loops() {
  const log: string[] = [];
  return { log, start: () => log.push("start"), stop: () => log.push("stop") };
}

test("PausedWhenBlurred (bug 1): clicking into another window freezes the race and the taps, and the click that returns is not a move", () => {
  const s = racing(), race = createRace(7, 2);
  assert.ok(frames(s, race, 1) > 0.9);
  S.blur(s);
  assert.equal(frames(s, race, 3), 0, "no time passes while away");
  assert.equal(S.canTap(s), false, "a tap before focus is back does nothing");
  S.focus(s);
  assert.equal(S.ticking(s), true);
  assert.equal(S.canTap(s), true);
  // The player's pause (menu) and resume: a breath before anything moves or counts.
  S.pause(s);
  assert.equal(S.canTap(s), false);
  S.resume(s);
  assert.equal(S.canTap(s), false, "the click that closes the menu is the menu's");
  assert.equal(frames(s, race, 0.5), 0, "the water waits through the breath");
  frames(s, race, 0.6);
  assert.equal(S.canTap(s), true);
  // A hidden tab behaves the same.
  S.hide(s);
  assert.equal(frames(s, race, 2), 0);
  S.show(s);
  assert.ok(frames(s, race, 0.2) > 0);
});

test("PausedWhenScrolledAway (bug 2): the page has no way to run the race while the player's menu is open, whichever button resumes", () => {
  const s = racing(), race = createRace(7, 2);
  S.pause(s);
  for (const name of ["canTap", "ticking"] as const) assert.equal(S[name](s), false);
  assert.equal(frames(s, race, 2), 0);
  // The menu's resume is the only way back, and it goes through the breath.
  S.resume(s);
  assert.equal(S.ticking(s), true);
  assert.equal(S.canTap(s), false);
  // The race list is a choice screen: nothing runs behind it, and it leaves a breath too.
  S.openSheet(s);
  assert.equal(frames(s, race, 1), 0);
  S.closeSheet(s);
  assert.equal(S.canTap(s), false);
});

test("CalibWaitsWhileAway (bug 3): leaving the window during তাল মেলাও voids the pulses, once, and they do not run on their own", () => {
  for (const leave of [S.blur, S.hide, S.pause, S.openSheet]) {
    const s = S.createSession(true);
    S.goTo(s, "calib");
    assert.equal(S.ticking(s), true);
    leave(s);
    assert.equal(S.ticking(s), false);
    assert.equal(S.takeCalibLost(s), true, leave.name);
    assert.equal(S.takeCalibLost(s), false, "read once");
  }
  // Away while it is not running (the title) loses nothing.
  const title = S.createSession(true);
  S.blur(title);
  assert.equal(S.takeCalibLost(title), false);
  // Finishing: eight pulses and eight on-time taps measure the lag; the measure ends a beat after the last pulse.
  assert.ok(CALIB_END > CALIB_BEATS[7]);
  const calib = createCalib();
  calib.taps = CALIB_BEATS.map(at => at + 0.08);
  assert.equal(lagFrom(calib.taps), 0.08);
  // Going back to the title clears the flag.
  const s = S.createSession(true);
  S.goTo(s, "calib"); S.blur(s);
  S.goTo(s, "title");
  assert.equal(S.takeCalibLost(s), false);
});

test("ResultStaysABeat (bug 4): a key held through the finish never skips the result; only a fresh press after it appears counts", () => {
  const s = racing();
  S.goTo(s, "over", 5000);
  assert.equal(S.freshResultKey(s, { timeStamp: 4800, repeat: false }), false, "pressed before the screen came up");
  assert.equal(S.freshResultKey(s, { timeStamp: 5100, repeat: false }), false, "a drummer's next tap, a beat later, is inside the guard");
  assert.equal(S.freshResultKey(s, { timeStamp: 5000 + 1500 + 100, repeat: false }), false, "even one slow beat later");
  assert.ok(S.RESULT_GUARD > 1500 + 100, "longer than a beat of any new race");
  assert.equal(S.freshResultKey(s, { timeStamp: 8000, repeat: true }), false, "auto-repeat of a held key");
  assert.equal(S.freshResultKey(s, { timeStamp: 8000, repeat: false }), true, "a press after the guard");
  S.pause(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 8000, repeat: false }), false, "not under the menu");
  S.resume(s);
  S.openSheet(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 8000, repeat: false }), false, "not under the race list");
  const play = racing();
  assert.equal(S.freshResultKey(play, { timeStamp: 9e9, repeat: false }), false, "only on the result screen");
});

test("ReplayIsExact (bug 5): a link that arrives mid-race or mid-তাল মেলাও owes the next start their river, once", () => {
  const mid = racing();
  assert.equal(S.linkArrives(mid), false, "mid-race it only remembers");
  assert.equal(mid.owed, true);
  S.goTo(mid, "over", 1);
  assert.equal(S.takeOwed(mid), true, "the next start is their river");
  assert.equal(S.takeOwed(mid), false, "and only that one");
  const calib = S.createSession(true);
  S.goTo(calib, "calib");
  assert.equal(S.linkArrives(calib), false);
  assert.equal(S.takeOwed(calib), true);
  for (const screen of ["title", "over", "intro"] as const) {
    const idle = S.createSession(true);
    S.goTo(idle, screen);
    assert.equal(S.linkArrives(idle), true, `${screen}: shown at once`);
    assert.equal(S.takeOwed(idle), false);
  }
  // Their river is the same river: the same seed, race and mode give the same course, rivals and drum.
  const mine = createRace(48213, 5, "h"), theirs = createRace(48213, 5, "h");
  assert.deepEqual(mine.patches, theirs.patches);
  assert.deepEqual(mine.currents, theirs.currents);
  assert.deepEqual(mine.beats, theirs.beats);
  assert.deepEqual(mine.boats.map(boat => boat.base), theirs.boats.map(boat => boat.base));
});

test("LoopOnlyWhenMeaningful and LoopComesBack: the river rush plays only in a race, on a showing page, with sound on, and returns", () => {
  const s = racing(), kit = loops();
  S.syncLoops(s, kit);
  assert.deepEqual(kit.log, ["start"]);
  S.syncLoops(s, kit);
  assert.deepEqual(kit.log, ["start"], "no second loop");
  S.blur(s); S.syncLoops(s, kit);
  assert.equal(kit.log.at(-1), "stop", "away: silent");
  S.focus(s); S.syncLoops(s, kit);
  assert.equal(kit.log.at(-1), "start", "back: the rush returns");
  S.pause(s); S.syncLoops(s, kit);
  assert.equal(kit.log.at(-1), "stop", "menu: silent");
  S.resume(s); S.syncLoops(s, kit);
  assert.equal(kit.log.at(-1), "start");
  // The site-wide switch: off has already stopped every loop in the kit; on starts a fresh one, never a silent stub.
  S.setSound(s, false);
  assert.equal(s.rush, false);
  S.syncLoops(s, kit);
  assert.equal(kit.log.at(-1), "start", "muted: nothing to stop, and nothing new starts");
  const count = kit.log.length;
  S.setSound(s, true);
  S.syncLoops(s, kit);
  assert.equal(kit.log.length, count + 1);
  assert.equal(kit.log.at(-1), "start");
  S.setRacing(s, false); S.syncLoops(s, kit);
  assert.equal(kit.log.at(-1), "stop", "the finish ends it");
  for (const screen of ["title", "intro", "over", "calib"] as const) {
    const idle = S.createSession(true);
    S.goTo(idle, screen);
    assert.equal(S.wantRush(idle), false, screen);
  }
});

test("a sound-off race never starts a loop, and the screen change stops everything", () => {
  const s = racing(false), kit = loops();
  S.syncLoops(s, kit);
  assert.deepEqual(kit.log, []);
  const loud = racing(), loud2 = loops();
  S.syncLoops(loud, loud2);
  S.goTo(loud, "over", 1);
  S.syncLoops(loud, loud2);
  assert.deepEqual(loud2.log, ["start", "stop"]);
});

test("progress on this phone: a friend's far race keeps its stars but opens nothing between; stars and unlocks never drop; junk reads as none", () => {
  let stars = recordLevel({}, 1, 3);
  assert.equal(openLevel(stars, []), 2);
  // A friend's race 9 placed first: stars kept, the open race stays where it was.
  const ahead = nextAhead(stars, [], 9);
  stars = recordLevel(stars, 9, 3);
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel(stars, ahead), 2, "the races between stay shut");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 10, "the shared unlock rule is untouched");
  // Reaching it on your own makes it yours.
  stars = recordLevel(stars, 2, 1);
  assert.equal(openLevel(stars, nextAhead(stars, ahead, 2)), 3);
  assert.equal(recordLevel({ 4: 3 }, 4, 1)[4], 3, "stars only go up");
  assert.deepEqual(readAhead("not json"), []);
  assert.deepEqual(readAhead("[1,99,\"x\",3,3]"), [1, 3]);
  assert.deepEqual(readTimes('{"4n":153,"13n":10,"2x":50,"1e":"7","3h":99999}'), { "4n": 153 });
  // Saved stars from before the rewrite still read, race by race.
  assert.deepEqual(readLevels('{"1":3,"2":2,"12":1}', LEVEL_COUNT), { 1: 3, 2: 2, 12: 1 });
  assert.deepEqual([1, 2, 3, 4].map(rank => starsForRank(rank)), [3, 2, 1, 0]);
});
