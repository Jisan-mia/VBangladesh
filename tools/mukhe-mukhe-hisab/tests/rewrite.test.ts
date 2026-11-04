// The rewrite: every statechart bug replayed against the pure session, the shared patterns pinned in the component,
// old links and saved progress, the card's honest marks, and the bot-tuned rates of the ladder.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { recordLevel, unlockedLevel } from "../../../shared/game-core";
import { answerRun, freshRun, makeDeck, makeQuestions, penaltyMs, starsOf, sumAt, QUESTIONS, ROUND_SECONDS } from "../lib/game";
import { LEVEL_COUNT, LEVELS, PER_WORLD, isFinale, worldOf, bn } from "../lib/levels";
import { parseShared, sharedHash, CARD_SUMS } from "../lib/link";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import * as session from "../lib/session";
import { dangerAt, secondsLeft } from "../lib/tick.hot";
import { PLAYERS, playRound, rate } from "./bot";

const component = readFileSync(new URL("../components/hisab-play.tsx", import.meta.url), "utf8");
const T = session.TIMING, ROUND = ROUND_SECONDS * 1000;
/** Runs the clocks forward to `at` with frames every 16 ms, as the rAF loop does. */
function runTo(s: session.Session, from: number, at: number) {
  for (let now = from; now <= at; now += 16) s = session.tick(s, now);
  return session.tick(s, at);
}
/** A round started at 0 and run until its first sum is up. */
function playing() {
  let s = session.begin(session.ready(ROUND), 0, T);
  s = runTo(s, 0, T.drawer + 1);
  assert.equal(s.phase, "play");
  return { s, at: T.drawer }; // the drawer's overshoot is carried: the clock started at exactly T.drawer
}

// ---- bug 1: ClockStillWhileAway ----
test("bug 1 · ClockStillWhileAway: clicking into another window freezes the 60 seconds", () => {
  let { s, at } = playing();
  s = runTo(s, at, at + 1200);
  assert.equal(secondsLeft(session.leftMs(s, at + 1200)), 59);
  s = session.pause(s, at + 1200, "away");                   // blur
  s = runTo(s, at + 1200, at + 6200);                        // the old game read ৫৪ here
  assert.equal(secondsLeft(session.leftMs(s, at + 6200)), 59, "still ৫৯ five seconds later");
  assert.equal(session.canAnswer(s), false, "no answer counts under the pause");
  assert.match(component, /window\.addEventListener\("blur", away\)/);
  assert.match(component, /onPause: \(\) => pauseFor\("away"\)/);
});

// ---- bug 2: PauseKeepsYourTime ----
test("bug 2 · PauseKeepsYourTime: hide → show → wait → hide again → resume keeps every second", () => {
  for (const wait of [8000, 62000]) {
    let { s, at } = playing();
    s = runTo(s, at, at + 2200);
    const had = session.leftMs(s, at + 2200);
    s = session.pause(s, at + 2200, "away");                 // hide
    s = session.pause(s, at + 2200 + wait, "away");          // show, wait, hide again while paused
    s = session.resume(s, at + 2400 + wait, "away", T.breath); // চালিয়ে যাও
    const back = at + 2400 + wait + T.breath;
    assert.equal(session.leftMs(s, back), had, `after a ${wait / 1000} s wait: nothing lost`);
    s = runTo(s, back, back + 1000);
    assert.equal(s.phase, "play", "the round goes on (the old game ended it at ০সে.)");
    assert.equal(session.leftMs(s, back + 1000), had - 1000);
  }
});

// ---- bug 3: SumsOutlastTheClock ----
test("bug 3 · SumsOutlastTheClock: answering every frame for a whole minute never runs out of sums", () => {
  for (const level of [1, 10, 14, 30]) {
    const deck = makeDeck(level, 4242);
    let { s, at } = playing(), run = freshRun();
    for (let now = at + 16; s.phase === "play"; now += 16) {
      s = session.tick(s, now);
      if (s.phase !== "play") break;
      const q = sumAt(deck, run.index);
      assert.ok(q && Number.isInteger(q.answer), `level ${level}: sum ${run.index} exists`);
      run = answerRun(run, true);
      s = session.right(s, now);
    }
    assert.equal(s.phase, "over");
    assert.ok(run.right > 3 * QUESTIONS, `level ${level}: ${run.right} sums, far past the old ${QUESTIONS}`);
    assert.equal(deck.list.length, run.index, "dealt only as far as the round got");
  }
  assert.match(component, /sumAt\(deck\.current, tally\.index\)/);
  assert.doesNotMatch(component, /questions\[/);
});

test("old links replay the same sums: the first 120 of every level are the pre-rewrite ones (pinned checksum)", () => {
  let h = 2166136261;
  const mix = (text: string) => { for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of [4242, 777, 999999937]) for (const q of makeQuestions(level, seed)) mix(`${q.lines.join("|")}=${q.answer};${q.ask};${q.choices?.join(",") ?? "-"}`);
  assert.equal(h, 3254626193);
  const deck = makeDeck(7, 31337);
  sumAt(deck, 499);
  assert.deepEqual(deck.list.slice(0, 300), makeQuestions(7, 31337, 300), "dealing lazily gives the same list");
  const legacy = parseShared("#s=4242&t=100&l=12&r=9&n=%E0%A6%AE%E0%A6%BF%E0%A6%A4%E0%A7%81");
  assert.deepEqual(legacy, { seed: 4242, level: 12, right: 9, score: 100, name: "মিতু", marks: null });
});

// ---- bug 4: LinkOpensOnlyItsLevel / SavedUnlockIsEarned ----
test("bug 4 · LinkOpensOnlyItsLevel + SavedUnlockIsEarned: a friend's level 3 cleared opens nothing in between", () => {
  let stars = {};
  let open = readOpen(null, stars);
  assert.equal(open, 1, "a new phone opens level 1");
  stars = recordLevel(stars, 3, 3);                          // the friend's level, cleared with three stars
  open = openAfter(open, 3);
  assert.equal(open, 1, "your own open level stays 1");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 4, "the old rule would have opened 1–4 (kept for migration only)");
  assert.equal(readOpen(String(open), stars), 1, "after a reload, still 1");
  assert.equal(startLevel(stars, open), 1);
  open = openAfter(open, 1);
  assert.equal(open, 2, "clearing level 1 opens level 2");
  assert.equal(readOpen(null, { 1: 2, 2: 1, 5: 3 }), 6, "first visit after the update: everything the old rule opened stays open");
  assert.equal(readOpen("junk", { 1: 1 }), 2);
  assert.equal(OPEN_KEY, "ektukhani-mukhe-mukhe-hisab-open");
  assert.match(component, /readOpen\(read\(OPEN_KEY\), levels\.stars\)/);
  assert.match(component, /if \(read\(OPEN_KEY\) === null\) write\(OPEN_KEY, String\(mine\)\)/);
  assert.match(component, /to <= now\.current\.open \|\| to === visit/);
});

// ---- the shared patterns ----
test("LevelPickerFreezesPlay: the sheet holds the clock, and coming back from another window doesn't let it run", () => {
  let { s, at } = playing();
  s = session.pause(s, at + 1000, "sheet");
  s = session.pause(s, at + 2000, "away");                   // blur with the sheet open
  s = session.resume(s, at + 3000, "away", T.breath);        // the player's চালিয়ে যাও
  assert.equal(s.why, "sheet");
  s = runTo(s, at + 3000, at + 9000);
  assert.equal(session.leftMs(s, at + 9000), ROUND - 1000);
  s = session.resume(s, at + 9000, "sheet", T.breath);
  assert.equal(session.running(s), true);
  // The player's menu সব লেভেল: resume, then the sheet at once; the breath means no time ran in between.
  let m = session.pause(playing().s, 5000, "away");
  m = session.pause(session.resume(m, 9000, "away", T.breath), 9000, "sheet");
  assert.equal(m.why, "sheet");
  assert.equal(session.leftMs(m, 20000), ROUND - (5000 - T.drawer));
  assert.match(component, /onLevels: \(\) => openSheet\(\)/);
});

test("a miss: the right answer and how, the clock held while it shows, and 3, 6, then 9 seconds off", () => {
  assert.deepEqual([1, 2, 3, 4, 9].map(penaltyMs), [3000, 6000, 9000, 9000, 9000]);
  let { s, at } = playing();
  s = session.wrong(s, at + 1000, T);
  assert.equal(s.phase, "lesson");
  assert.equal(session.leftMs(s, at + 1000), ROUND - 1000 - 3000);
  s = runTo(s, at + 1000, at + 1000 + T.lesson - 20);
  assert.equal(s.phase, "lesson");
  assert.equal(session.leftMs(s, at + 1000 + T.lesson - 20), ROUND - 4000, "the clock holds while the how-line shows");
  s = runTo(s, at + 1000 + T.lesson - 20, at + 1000 + T.lesson + 20);
  assert.equal(s.phase, "play");
  const b = at + 1000 + T.lesson + 20;
  s = session.wrong(s, b + 500, T);
  assert.equal(session.leftMs(s, b + 500), ROUND - 1520 - 3000 - 6000, "a second miss in a row costs 6 (the clock ran 1000 + 20 + 500 ms)");
  s = runTo(s, b + 500, b + 500 + T.lesson + 20);
  s = session.right(s, b + 1000 + T.lesson);
  assert.equal(s.slips, 0, "a right answer resets the run of misses");
  assert.equal(session.pause(session.wrong(playing().s, T.drawer + 100, T), T.drawer + 200, "away").why, "away", "a pause during the how-line holds it too");
  assert.equal(session.TIMING.lesson * 2, session.SLOW_TIMING.lesson, "ধীরে খেলো shows it twice as long, the clock still held");
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const q of makeQuestions(level, 99, 40)) assert.ok(q.how.includes(bn(q.answer)), `level ${level}: "${q.how}" names the answer ${q.answer}`);
});

test("misses can end the round at once; the clock never goes below zero", () => {
  let { s, at } = playing();
  s = runTo(s, at, at + 55000);
  s = session.wrong(s, at + 55000, T);
  assert.equal(s.phase, "lesson");
  s = runTo(s, at + 55000, at + 55000 + T.lesson + 20);
  s = session.wrong(s, at + 56500, T);
  assert.equal(s.phase, "over");
  assert.equal(session.leftMs(s, at + 60000), 0);
});

test("danger shows at the edge: amber for the last 10 s, red for the last 5", () => {
  assert.deepEqual([60000, 10001, 10000, 5001, 5000, 1, 0].map(dangerAt), [0, 0, 1, 1, 2, 2, 0]);
  assert.match(component, /data-danger=\{danger \|\| undefined\}/);
});

test("P pauses through the player's menu; Enter needs a fresh press on the result; clicked buttons drop focus", () => {
  assert.match(component, /if \(player\.stage\.width > 0\) player\.requestPause\(\); else pauseFor\("away"\)/);
  assert.match(component, /fresh && event\.timeStamp > overAt\.current \+ 400/);
  assert.match(component, /const fresh = !event\.repeat|fresh = !event\.repeat/);
  assert.match(component, /button\.blur\(\)/);
  assert.match(component, /onPointerDown=\{onDown\(\(\) => answer\(value\)\)\}/, "answers land on pointerdown");
  assert.doesNotMatch(component, /location\.hash\s*=|history\.pushState/);
  assert.doesNotMatch(component, /setTimeout|setInterval/, "no timers to leak past a round");
});

// ---- the card tells the truth ----
test("the card marks each of the first six sums as it really went; old links draw no marks", () => {
  const shared = { seed: 4242, level: 3, right: 4, score: 40, name: "", marks: "101101" };
  assert.deepEqual(parseShared(`#${sharedHash(shared)}`), shared);
  assert.equal(parseShared("#s=4242&t=40&l=3&r=4&k=111111")?.marks, null, "six ticks can't come from four right answers");
  assert.equal(parseShared("#s=4242&t=40&l=3&r=4&k=10x")?.marks, null);
  assert.equal(parseShared("#s=4242&t=40&l=3&r=4&k=1011011")?.marks, null, "at most six");
  assert.equal(parseShared("#s=4242&t=20&l=3&r=2&k=10")?.marks, "10", "a short round, two sums reached");
  assert.equal(CARD_SUMS, 6);
  assert.match(component, /marks: all\.slice\(0, CARD_SUMS\)\.map\(a => a\.ok \? "1" : "0"\)\.join\(""\)/);
  const card = readFileSync(new URL("../lib/draw-card.ts", import.meta.url), "utf8");
  assert.match(card, /if \(mark === "1"\) tick\(/);
  assert.match(card, /else if \(mark === "0"\) cross\(/);
  assert.equal(parseShared(`#s=9&t=${10 * 1493 + 10 * 1488 + 10 * 1483 + 10 * 1478}&l=1&r=1493`)?.right, 1493, "a bot's 1,493 sums still make a link");
});

// ---- the ladder ----
test("30 levels in three worlds of ten, each with a lesson; finales are named; thresholds rise within a level", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.equal(PER_WORLD, 10);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = LEVELS[level - 1];
    assert.ok(spec.lesson.length > 10, `level ${level} says what it teaches`);
    assert.ok(spec.stars[0] < spec.stars[1] && spec.stars[1] < spec.stars[2], `level ${level}`);
    assert.equal(spec.choices, worldOf(level) === 0);
    if (level > 1 && !isFinale(level) && (level - 1) % PER_WORLD !== 0) assert.ok(spec.chip.length > 0, `level ${level} has a before → after chip`);
  }
  assert.deepEqual([10, 20, 30].map(isFinale), [true, true, true]);
});

const SEEDS = 300;
test("bots · level 1: a casual player's first star lands within 10 s; world 1 is a child's, worlds 2–3 an adult's", () => {
  assert.ok(rate(1, PLAYERS.casual, 400, p => p.firstStarAt >= 0 && p.firstStarAt <= 10) >= 0.9, "first star within 10 s");
  for (let level = 1; level <= 10; level++) {
    assert.ok(rate(level, PLAYERS.child, SEEDS, p => p.stars >= 1) >= 0.9, `level ${level}: a child clears it`);
    assert.ok(rate(level, PLAYERS.casual, SEEDS, p => p.stars >= 1) >= 0.9, `level ${level}: casual clears it`);
  }
  for (let level = 11; level <= LEVEL_COUNT; level++) {
    assert.ok(rate(level, PLAYERS.casual, SEEDS, p => p.stars >= 1) >= 0.6, `level ${level}: casual clears it`);
    assert.ok(rate(level, PLAYERS.steady, SEEDS, p => p.stars >= 1) >= 0.9, `level ${level}: steady clears it`);
    if (!isFinale(level)) assert.ok(rate(level, PLAYERS.strong, SEEDS, p => p.stars === 3) >= 0.5, `level ${level}: strong gets ★★★`);
  }
});

test("bots · each finale is its world's hardest for ★★★", () => {
  for (const world of [0, 1, 2]) {
    const who = world === 0 ? PLAYERS.child : PLAYERS.strong, finale = world * PER_WORLD + PER_WORLD;
    const three = (level: number) => rate(level, who, SEEDS, p => p.stars === 3);
    const at = three(finale);
    for (let level = world * PER_WORLD + 1; level < finale; level++) assert.ok(three(level) > at, `world ${world + 1}: level ${level} is easier than the finale (${three(level)} vs ${at})`);
  }
});

test("bots · random tapping no longer earns stars (the old game gave a masher ★★★ on every four-answer level)", () => {
  for (let level = 1; level <= 10; level++) {
    assert.ok(rate(level, "masher", SEEDS, p => p.stars >= 1) <= 0.35, `level ${level}: masher rarely clears`);
    assert.ok(rate(level, "masher", SEEDS, p => p.stars >= 2) <= 0.03, `level ${level}: masher almost never gets ★★`);
  }
});

test("bots are deterministic: the same seed plays the same round", () => {
  assert.deepEqual(playRound(14, 4242, PLAYERS.steady), playRound(14, 4242, PLAYERS.steady));
  assert.equal(starsOf(1, 24), 3);
});
