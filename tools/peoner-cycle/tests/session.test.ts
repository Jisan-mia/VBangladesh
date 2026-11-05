// Each statechart path (ai_docs/statecharts/peoner-cycle/README.md) replayed against the pure session and the ride the
// component runs. The component steps the ride only while moving(session), and steers only while steerable(session).
import assert from "node:assert/strict";
import test from "node:test";
import { makeCourse } from "../lib/course";
import { createGame } from "../lib/game";
import { levelOfShared, parseShared, versusLine } from "../lib/link";
import { afterClear } from "../lib/progress";
import {
  again, away, back, canPlay, cheerMayPlay, choiceReady, createSession, finish, friendMayLoad, loopStep, moving, pause, pick, reset, resume, start, steerable, storyDone,
  BREATH_MS, GUARD_MS, START_MS,
} from "../lib/session";
import { stepGame } from "../lib/step.hot";

const riding = (at = 0) => { const s = createSession(); start(s, false, at); return s; };
/** What one frame of the component does with the session. */
const frame = (s: ReturnType<typeof createSession>, game: ReturnType<typeof createGame>, at: number) => { if (moving(s, at)) stepGame(game, 1 / 60); };

test("bug 1 · PausedWhenBlurred / NoProgressWhileAway: clicking into another window pauses, the road does not roll, coming back waits for চালিয়ে যাও", () => {
  const s = riding(), game = createGame(makeCourse(1, 1), 1);
  for (let k = 0; k < 30; k++) frame(s, game, 1000 + k * 16);
  const d = game.d;
  away(s, "blur");
  assert.equal(s.phase, "paused");
  for (let k = 0; k < 150; k++) frame(s, game, 2000 + k * 16);
  assert.equal(game.d, d, "the road does not roll while you are in another window");
  back(s, "focus");
  assert.equal(s.phase, "paused", "focus alone does not resume");
  assert.ok(resume(s, 5000));
  assert.ok(!moving(s, 5000 + BREATH_MS - 1) && moving(s, 5000 + BREATH_MS), "a breath before it moves");
  away(s, "hide");
  assert.equal(resume(s, 6000), false, "never resumes onto a hidden tab");
});

test("bug 2 · PausedWhenOffScreen: with the road scrolled away you cannot start, steer or resume; scrolling back is not a resume", () => {
  const s = createSession();
  away(s, "scroll");
  assert.equal(start(s, false, 100), false, "রওনা দাও does nothing while the road is off screen");
  assert.equal(s.phase, "title");
  back(s, "scroll");
  assert.ok(start(s, false, 200));
  away(s, "scroll");
  assert.equal(s.phase, "paused", "scrolling away mid-ride pauses it");
  assert.equal(steerable(s), false, "a lane button below the road cannot steer a ride you cannot see");
  assert.equal(resume(s, 300), false);
  back(s, "scroll");
  assert.equal(s.phase, "paused");
  assert.ok(resume(s, 400));
  // And আবার খেলো under the bump: it does not start off screen either.
  const over = riding(); finish(over, 0); away(over, "scroll");
  assert.equal(again(over, GUARD_MS + 10), false);
});

test("bug 3 · ChoiceFreezesPlay: opening সব লেভেল pauses a ride in progress; closing resumes after a breath; the road never rolls with the list open", () => {
  const s = riding(), game = createGame(makeCourse(1, 1), 1);
  pick(s, true);
  assert.equal(s.phase, "paused");
  assert.equal(s.picking, true);
  const d = game.d;
  for (let k = 0; k < 120; k++) frame(s, game, 1000 + k * 16);
  assert.equal(game.d, d, "nothing rolls while the list is open");
  assert.equal(resume(s, 3000), false, "a stray resume cannot start the road under the list");
  assert.equal(steerable(s), false);
  pick(s, false);
  assert.ok(resume(s, 3100));
  assert.ok(moving(s, 3100 + BREATH_MS));
});

test("bug 4 · NoFanfareAfterMovingOn: every celebration timer is tied to its run; পরের লেভেল, আরেকবার and a friend's link all make it stale", () => {
  const s = riding(0);
  finish(s, 1000);
  const run = s.run;
  assert.ok(cheerMayPlay(s, run), "on its own end screen the cheer plays");
  reset(s); // পরের লেভেল / a friend's link / a level picked: back to a title
  assert.equal(cheerMayPlay(s, run), false, "the chimes queued for the old end screen stay silent on the new title");
  const next = riding(5000);
  assert.equal(cheerMayPlay(next, run), false);
  finish(next, 6000);
  const sameRun = next.run;
  pick(next, true);
  assert.equal(cheerMayPlay(next, sameRun), false, "not under an open list either");
});

test("bug 5 · RouteMatchesRide: a friend's link that arrives mid-ride, mid-pause or mid-story is kept for after; it never changes the route being ridden", () => {
  for (const make of [() => riding(), () => { const s = riding(); pause(s); return s; }, () => { const s = createSession(); start(s, true, 0); return s; }]) {
    const s = make();
    assert.equal(friendMayLoad(s), false, `phase ${s.phase}`);
  }
  const title = createSession();
  assert.equal(friendMayLoad(title), true);
  const done = riding(); finish(done, 100);
  assert.equal(friendMayLoad(done), true);
  // And the star a far-ahead friend route earns opens nothing in between.
  assert.equal(afterClear(3, 9), 3);
  assert.equal(afterClear(3, 3), 4);
  assert.equal(afterClear(3, 1), 3);
  const link = parseShared("s=12345&t=300&m=300&c=0&l=2&n=Rafi");
  assert.ok(link && link.kind === "old");
  assert.equal(levelOfShared(link!), 3);
});

test("bug 6 · CompareOnlySameRoad: the card compares you with a friend only when you rode the friend's road", () => {
  const friend = parseShared("s=4242&t=125&v=2&l=1&m=70&d=3&c=0&b=0&n=Rafi");
  assert.ok(friend && friend.kind === "ride");
  const mine = { seed: 4242, level: 1, score: 100 };
  assert.match(versusLine(mine, friend), /২৫|২৫/, "same road: the gap is said exactly");
  assert.equal(versusLine({ ...mine, seed: 77341388 }, friend), "", "another seed, another road");
  assert.equal(versusLine({ ...mine, level: 2 }, friend), "", "another route");
  assert.equal(versusLine(mine, parseShared("s=12345&t=300&m=300&c=0&l=1&n=Rafi")), "", "an old link's road no longer exists");
  assert.equal(versusLine(mine, null), "");
});

test("the tap that brings you back only resumes: it is not a lane change", () => {
  const s = riding();
  pause(s);
  assert.equal(steerable(s), false, "paused: a tap on a side steers nothing");
  assert.ok(resume(s, 1000));
  assert.ok(steerable(s), "after the resume a quick thumb still counts");
});

test("result keys need a fresh press: a key held through the bump, or repeating, never skips the end screen", () => {
  const s = riding(0);
  finish(s, 1000);
  assert.equal(again(s, 1000 + GUARD_MS - 1), false, "not before the guard");
  assert.equal(again(s, 3000, { at: 900, repeat: false }), false, "a key pressed before the screen appeared");
  assert.equal(again(s, 3000, { at: 2900, repeat: true }), false, "an auto-repeat");
  assert.equal(choiceReady(s, 3000, { at: 2900, repeat: true }), false);
  assert.ok(choiceReady(s, 3000, { at: 2500, repeat: false }));
  assert.ok(again(s, 3000, { at: 2900, repeat: false }));
  assert.equal(s.phase, "riding");
  assert.ok(!moving(s, 3000 + START_MS - 1));
});

test("the road loop: starts when it rolls with sound on, stops on pause, blur and hide, comes back with sound as a fresh loop (never a stub)", () => {
  const s = riding();
  assert.equal(loopStep(false, moving(s, 1000), true), "start");
  away(s, "blur");
  assert.equal(loopStep(true, moving(s, 1000), true), "stop");
  back(s, "focus"); resume(s, 2000);
  assert.equal(loopStep(false, moving(s, 2000 + BREATH_MS), true), "start");
  assert.equal(loopStep(true, true, false), "stop", "sound off stops it");
  assert.equal(loopStep(false, true, false), "keep", "no stub is made while muted");
  assert.equal(loopStep(false, true, true), "start", "sound back: a fresh loop");
  assert.equal(loopStep(true, true, true), "keep");
});

test("the story only plays on a first run, can be left, and the ride starts after it; pause freezes it", () => {
  const s = createSession();
  assert.ok(start(s, true, 0));
  assert.equal(s.phase, "story");
  assert.equal(moving(s, 1000), false, "no ride time passes in the story");
  pause(s);
  assert.equal(s.phase, "paused");
  assert.ok(resume(s, 500));
  assert.equal(s.phase, "story", "back to the story, not into the ride");
  assert.ok(storyDone(s, 600));
  assert.equal(s.phase, "riding");
  assert.equal(canPlay(s), true);
});

test("a ride ends once: finish() a second time, or from a title, does nothing", () => {
  const s = riding();
  assert.ok(finish(s, 100));
  assert.equal(finish(s, 200), false);
  assert.equal(finish(createSession(), 0), false);
});
