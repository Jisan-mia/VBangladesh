// The rewrite: every statechart bug replayed against the pure session, the shared patterns pinned in the component,
// saved progress and its one-time migration, and the bot-tuned rates of the ladder.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { makeRng, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { LEVEL_COUNT, PER_WORLD, isFinale, worldOf } from "../lib/levels";
import * as session from "../lib/session";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import { ROUNDS, makeDeal } from "../lib/shelf";
import { resultOf, starsOf } from "../lib/score";
import { lidAt, pastMiddle, secondsLeft } from "../lib/tick.hot";
import { PLAYERS, playRound, type Skill } from "./bot";

const component = readFileSync(new URL("../components/shop-game.tsx", import.meta.url), "utf8");
const T = session.TIMING, LOOK = 4000;
/** Runs the session's clock forward to `at` with frames every 16 ms, as the rAF loop does. */
function runTo(s: session.Session, from: number, at: number, last = false) {
  for (let now = from; now <= at; now += 16) s = session.tick(s, now, LOOK, T, last);
  return session.tick(s, at, LOOK, T, last);
}
/** A level started at 0 and run to the question of shelf 1. */
function toQuestion() {
  let s = session.begin(session.ready(), 0, T);
  s = runTo(s, 0, T.shutter + LOOK + T.close + 1);
  assert.equal(s.phase, "ask");
  return { s, at: T.shutter + LOOK + T.close + 1 };
}

// ---- bug 1: PausedWhenHidden ----
test("bug 1 · PausedWhenHidden: the blink after পরের তাক never opens the next shelf behind a hidden tab", () => {
  let { s, at } = toQuestion();
  s = session.decided(s, at + 900, 0);                       // a wrong answer: the reveal waits for পরের তাক
  s = session.next(s, at + 2000, T, false);                  // পরের তাক
  assert.equal(s.phase, "blink");
  s = session.pause(s, at + 2050, "away");                   // the tab hides 50 ms later
  s = runTo(s, at + 2050, at + 8500);                        // the old game ran the whole look here, hum and all
  assert.equal(s.phase, "blink", "still in the blink, 6.5 s later");
  assert.equal(session.looking(s), false, "no look, so no hum");
  s = session.resume(s, at + 9000, "away", T.breath);        // you come back and press চালিয়ে যাও
  s = runTo(s, at + 9000, at + 9000 + T.breath + T.blink + 20);
  assert.equal(s.phase, "look");
  assert.equal(s.shelf, 1);
  assert.ok(LOOK - session.elapsed(s, at + 9000 + T.breath + T.blink + 20) >= LOOK - 100, "the whole look time is still yours (the blink had 50 ms behind it)");
  assert.match(component, /const hide = \(\) => \{ if \(document\.hidden\) away\(\); \};/);
  assert.match(component, /onPause: \(\) => pauseFor\("away"\)/);
});

// ---- bug 2: PausedWhenBlurred ----
test("bug 2 · PausedWhenBlurred: clicking into another window freezes the look time", () => {
  let s = session.begin(session.ready(), 0, T);
  s = runTo(s, 0, T.shutter + 1000);
  assert.equal(s.phase, "look");
  assert.equal(secondsLeft(session.elapsed(s, T.shutter + 1000), s.dur), 3);
  s = session.pause(s, T.shutter + 1000, "away");            // blur
  s = runTo(s, T.shutter + 1000, T.shutter + 7000);          // the old game reached the question here
  assert.equal(s.phase, "look");
  assert.equal(secondsLeft(session.elapsed(s, T.shutter + 7000), s.dur), 3, "still ৩ six seconds later");
  assert.match(component, /window\.addEventListener\("blur", away\)/);
});

// ---- bug 3: AwayTimeNeverCharged ----
test("bug 3 · AwayTimeNeverCharged: hide → show → hide again → resume → answer costs only the time on screen", () => {
  const straight = toQuestion();
  const quick = session.askMs(straight.s, straight.at + 600);
  let { s, at } = toQuestion();
  s = session.pause(s, at + 500, "away");                    // hide 0.5 s into the question
  s = session.pause(s, at + 7500, "away");                   // show, wait 7 s without resuming, hide again
  s = session.resume(s, at + 8000, "away", T.breath);        // চালিয়ে যাও
  const ms = session.askMs(s, at + 8000 + T.breath + 100);   // answer at once, after the breath
  assert.equal(ms, quick, "the same ms as answering straight away");
  assert.equal(session.canPick(session.pause(s, at + 9000, "away")), false, "no pick counts under the pause");
});

// ---- bug 4: HumOnlyWhileLooking ----
test("bug 4 · HumOnlyWhileLooking: the hum's one state is a running look; sound on during the blink brings nothing back", () => {
  let s = session.begin(session.ready(), 0, T);
  assert.equal(session.looking(s), false, "not while the shutter rolls up");
  s = runTo(s, 0, T.shutter + 10);
  assert.equal(session.looking(s), true);
  s = runTo(s, T.shutter + 10, T.shutter + LOOK + 50);       // the look time ends: the eyes close
  assert.equal(s.phase, "closing");
  assert.equal(session.looking(s), false, "the old game's onChange saw phase 'look' here and restarted the hum");
  s = runTo(s, T.shutter + LOOK + 50, T.shutter + LOOK + T.close + 10);
  assert.equal(s.phase, "ask");
  assert.equal(session.looking(s), false);
  // The component starts the hum only from session.looking with sound on, and re-checks on every change and switch.
  assert.match(component, /const want = session\.looking\(s\) && soundOn\(\);/);
  assert.match(component, /if \(!soundIsOn\) \{ hum\.current\?\.stop\(\); hum\.current = null; \}\n\s+else syncHum\(now\.current\.run\);/);
  assert.match(component, /if \(next\.phase !== before\.phase \|\| next\.shelf !== before\.shelf\) entered\(next\);\n\s+syncHum\(next\);/);
  assert.doesNotMatch(component, /hum\.current \?\?=/, "a hum made while muted is a silent stub: never keep it with ??=");
});

// ---- bug 5: LevelPickerFreezesPlay ----
test("bug 5 · LevelPickerFreezesPlay: সব লেভেল pauses the look; coming back from another window doesn't close it", () => {
  let s = session.begin(session.ready(), 0, T);
  s = runTo(s, 0, T.shutter + 1000);
  s = session.pause(s, T.shutter + 1000, "sheet");           // open সব লেভেল
  s = session.pause(s, T.shutter + 2000, "away");            // the window blurs too
  s = session.resume(s, T.shutter + 3000, "away", T.breath); // চালিয়ে যাও in the player's menu
  assert.equal(s.why, "sheet", "the sheet still holds the pause");
  s = runTo(s, T.shutter + 3000, T.shutter + 9000);
  assert.equal(s.phase, "look");
  assert.equal(secondsLeft(session.elapsed(s, T.shutter + 9000), s.dur), 3);
  s = session.resume(s, T.shutter + 9000, "sheet", T.breath); // close the sheet
  assert.equal(session.running(s), true);
  assert.match(component, /function openSheet\(\) \{\n\s+pauseFor\("sheet"\);/);
  assert.match(component, /function closeSheet\(\) \{ now\.current\.sheet = false; setSheet\(false\); resumeFrom\("sheet"\); \}/);
});

// ---- shared patterns ----
test("a pause covers the shelf and the pictures, so it buys no looking or thinking on screen", () => {
  assert.match(component, /const covered = run\.why !== null && session\.started\(run\);/);
  assert.match(component, /const down = run\.phase === "ready" \|\| covered;/);
  assert.match(component, /\) : asking && !covered \? \(/, "the pictures hide under the pause");
});

test("the game's P opens the player's one pause menu; result keys need a fresh press after the memo shows", () => {
  assert.match(component, /if \(player\.stage\.width > 0\) player\.requestPause\(\); else pauseFor\("away"\);/);
  assert.match(component, /fresh && event\.timeStamp > overAt\.current \+ 400/);
  assert.match(component, /const key = event\.key, enter = key === "Enter" \|\| key === " ", fresh = !event\.repeat/);
  assert.match(component, /if \(button instanceof HTMLButtonElement\) button\.blur\(\);/, "a clicked button drops focus, so Enter goes to the game");
});

test("NoDoubleResult: the stars are recorded once, at the last decision, not behind the reveal's pause", () => {
  assert.match(component, /if \(last\) finalize\(all\);\n\s+commit\(session\.decided\(s, at, ok \? now\.current\.timing\.auto : 0\), s\);/);
  assert.match(component, /if \(recorded\.current === play\.current\) return;\n\s+recorded\.current = play\.current;/);
  assert.match(component, /play\.current\+\+;/, "each load is a new play");
  // and the session reaches "over" exactly once per play: after the last reveal, never from another phase
  let { s, at } = toQuestion();
  s = { ...s, shelf: ROUNDS - 1 };
  s = session.decided(s, at + 500, T.auto);
  s = runTo(s, at + 500, at + 500 + T.auto + 20, true);
  assert.equal(s.phase, "over");
  assert.equal(session.next(s, at + 9000, T, true), s, "পরের তাক on the memo does nothing");
});

test("loading a level stops the hum, cuts scheduled notes and cancels the frame loop", () => {
  assert.match(component, /function load\(next: Deal\) \{\n\s+if \(raf\.current\) \{ cancelAnimationFrame\(raf\.current\); raf\.current = 0; \}\n\s+hum\.current\?\.stop\(\); hum\.current = null;\n\s+silenceScheduled\(\);/);
  assert.doesNotMatch(component, /setTimeout|setInterval/, "every timed thing runs on the pausable phase clock");
});

test("the eyelids: shut by the middle of a blink, open by the end; the shelf changes while they are shut", () => {
  assert.equal(lidAt(0, 760), 0);
  assert.equal(lidAt(380, 760), 1);
  assert.ok(lidAt(740, 760) < 0.05);
  assert.equal(pastMiddle(379, 760), false);
  assert.equal(pastMiddle(380, 760), true);
});

test("ধীরে খেলো keeps the look time and the stars; it only calms the changes", () => {
  assert.equal(session.SLOW_TIMING.shutter, T.shutter);
  assert.ok(session.SLOW_TIMING.auto > T.auto);
  assert.match(component, /session\.tick\(before, at, now\.current\.deal\.spec\.view \* 1000,/, "the look is the level's own seconds in both modes");
});

// ---- saved progress ----
test("UnlockOnlyByClearing: a friend's far-ahead level records its stars but opens nothing in between", () => {
  let stars = {}, open = readOpen(null, stars);
  assert.equal(open, 1, "a new phone has level 1");
  stars = recordLevel(stars, 20, 3);                          // a friend's level-20 link, cleared on a clean phone
  open = openAfter(open, 20);
  assert.equal(open, 1, "levels 2 to 20 stay closed for your own play");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 21, "the shared rule is untouched (migrations rely on it)");
  assert.equal(readOpen("1", stars), 1, "a reload keeps your own unlock");
  assert.equal(openAfter(1, 1), 2, "your own clear opens the next level");
  assert.equal(openAfter(30, 30), 30);
  assert.equal(OPEN_KEY, "ektukhani-konta-nei-open");
});

test("old saved progress migrates once: the first visit opens what the old rule opened", () => {
  const old = { 1: 3, 2: 2, 3: 1, 7: 2 };
  assert.equal(readOpen(null, old), 8, "one past the highest level with stars, as before");
  assert.equal(readOpen("8", recordLevel(old, 25, 1)), 8, "after that, only your own key counts");
  for (const junk of ["", "0", "31", "x", "2.5"]) assert.equal(readOpen(junk, old), 8, junk);
  assert.equal(startLevel({ 1: 3, 2: 1 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 3 }, 3), 3, "all three-starred: stay on the furthest");
  assert.equal(startLevel({ 1: 3, 2: 1, 3: 3 }, 3), 2);
});

// ---- difficulty, by bots ----
const N = 400;
function rates(level: number, skill: Skill) {
  let clear = 0, two = 0, three = 0, quickFirst = 0;
  for (let i = 0; i < N; i++) {
    const seed = 1 + ((i * 2654435761) >>> 0) % 999_999_999, deal = makeDeal(level, seed), rng = makeRng(seed ^ 0x5bd1e995);
    const answers = deal.rounds.map(round => playRound(deal.spec, round, rng, skill));
    const { right, score } = resultOf(deal.spec, deal.rounds, answers), stars = starsOf(right, score);
    clear += stars >= 1 ? 1 : 0; two += stars >= 2 ? 1 : 0; three += stars >= 3 ? 1 : 0;
    // the first shelf, answered right, from the shutter tap: shutter + the whole look + the eyes + the answer
    const firstRight = answers[0].picks.every(id => deal.rounds[0].gone.includes(id));
    if (firstRight && T.shutter + deal.spec.view * 1000 + T.close + answers[0].ms <= 10_000) quickFirst++;
  }
  return { clear: clear / N, two: two / N, three: three / N, quickFirst: quickFirst / N };
}

test("bots: a casual player wins level 1's first shelf inside 10 s and clears level 1 at least 99% of the time", () => {
  const casual = rates(1, PLAYERS.casual);
  assert.ok(casual.quickFirst >= 0.95, `first shelf right within 10 s: ${casual.quickFirst}`);
  assert.ok(casual.clear >= 0.99, `level 1 cleared ${casual.clear}`);
});

test("bots: the ladder's target rates hold on every level, and each finale is its world's hardest", () => {
  const steadyClear: number[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const casual = rates(level, PLAYERS.casual), steady = rates(level, PLAYERS.steady), strong = rates(level, PLAYERS.strong);
    steadyClear[level] = steady.clear;
    if (worldOf(level) === 0 && !isFinale(level)) assert.ok(casual.clear >= 0.8, `level ${level}: casual clears ${casual.clear}`);
    assert.ok(casual.clear >= 0.5, `level ${level}: casual clears ${casual.clear}`);
    if (isFinale(level)) {
      assert.ok(steady.clear >= 0.7, `finale ${level}: steady clears ${steady.clear}`);
      assert.ok(strong.three >= 0.4 && strong.three <= 0.85, `finale ${level}: strong ★★★ ${strong.three}`);
    } else {
      assert.ok(steady.clear >= 0.85, `level ${level}: steady clears ${steady.clear}`);
      assert.ok(strong.three >= 0.55, `level ${level}: strong ★★★ ${strong.three}`);
    }
    assert.ok(casual.three <= strong.three, `level ${level}: speed and memory both matter`);
  }
  for (let w = 0; w < 3; w++) {
    const levels = Array.from({ length: PER_WORLD }, (_, i) => w * PER_WORLD + i + 1);
    const finale = levels[PER_WORLD - 1];
    for (const level of levels.slice(0, -1)) assert.ok(steadyClear[finale] < steadyClear[level], `world ${w + 1}: finale ${finale} (${steadyClear[finale]}) vs ${level} (${steadyClear[level]})`);
  }
});
