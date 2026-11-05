// The rewrite: every statechart bug replayed against the pure session, the shared patterns pinned in the component,
// saved progress and its one-time migration, and the bot-tuned rates of the ladder.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { makeRng, recordLevel, unlockedLevel } from '../../../shared/game-core';
import { CUSTOMERS } from '../lib/legacy';
import { LEVEL_COUNT, PER_WORLD, RUSH_MS, isFinale, worldOf } from '../lib/levels';
import { changeOf, fewest } from '../lib/money';
import { give, makeDeal, starsOf, startRun, tap } from '../lib/play';
import { OPEN_KEY, RELAXED_KEY, openAfter, readOpen, startLevel } from '../lib/save';
import * as session from '../lib/session';
import { edgeAt, moodAt, patienceLeft, secondsLeft } from '../lib/tick.hot';
import { PLAYERS, playShift, type Skill } from './bot';

const component = readFileSync(new URL('../components/shop-game.tsx', import.meta.url), 'utf8');
const sounds = readFileSync(new URL('../components/sound.ts', import.meta.url), 'utf8');
const T = session.TIMING, LIMITS = Array.from({ length: CUSTOMERS }, () => 10_000);
/** Runs the session's clock forward to `at` with frames every 16 ms, as the rAF loop does. */
function runTo(s: session.Session, from: number, at: number, limits: readonly number[] = LIMITS) {
  for (let now = from; now <= at; now += 16) s = session.tick(s, now, limits, T);
  return session.tick(s, at, limits, T);
}
/** A shift started at 0 and run to the first customer waiting. */
function toCustomer() {
  const s = runTo(session.begin(session.ready(), 0, T), 0, T.open + 1);
  assert.equal(s.phase, 'serve');
  return { s, at: T.open + 1 };
}
const waited = (s: session.Session, at: number) => session.waitedMs(s, at);

// ---- bug 1: PausedWhenBlurred ----
test('bug 1 · PausedWhenBlurred: clicking into another window freezes the customer\'s patience', () => {
  let { s, at } = toCustomer();
  s = runTo(s, at, at + 480);                                // 0.48 s in, as in the live replay
  s = session.pause(s, at + 480, 'away');                    // blur
  s = runTo(s, at + 480, at + 18_000);                       // the old game reached "থাক, ভাংতিটা পরে নেব!" at 13 s
  assert.equal(s.phase, 'serve', 'still waiting, 18 s later');
  assert.equal(secondsLeft(session.elapsed(s, at + 18_000), s.dur), 10, 'the bar has not moved');
  assert.equal(session.canAct(s), false, 'and nothing you tap counts under the pause');
  assert.match(component, /window\.addEventListener\('blur', away\)/);
  assert.match(component, /onPause: \(\) => pauseFor\('away'\)/);
  assert.match(component, /const hide = \(\) => \{ if \(document\.hidden\) away\(\); \};/);
});

// ---- bug 2: NoProgressWhileAway ----
test('bug 2 · NoProgressWhileAway: hide → show → hide again → resume costs only the time on screen', () => {
  const straight = toCustomer();
  const quick = waited(straight.s, straight.at + 600);
  let { s, at } = toCustomer();
  s = session.pause(s, at + 300, 'away');                    // hide 0.3 s in
  s = session.pause(s, at + 7300, 'away');                   // show, wait 7 s without resuming, hide again
  s = session.resume(s, at + 8000, 'away', T.breath);        // চালিয়ে যাও
  assert.equal(waited(s, at + 8000 + T.breath + 300), quick, 'the same 0.6 s as answering straight away, after the breath');
  assert.equal(waited(session.pause(s, at + 9000, 'away'), at + 20_000), waited(session.pause(s, at + 9000, 'away'), at + 9000), 'nothing runs while paused');
});

// ---- bug 3: OffScreenMeansPaused ----
test('bug 3 · OffScreenMeansPaused: Enter with the counter scrolled away neither starts nor runs the shop', () => {
  // The keys and the bell only act while the stage is on screen, and scrolling away pauses what is running.
  assert.match(component, /if \(now\.current\.sheet \|\| !inView\) return;/, 'keys are ignored off screen');
  assert.match(component, /if \(s\.phase !== 'ready' \|\| !inView\) return;/, 'the bell needs the stage in view');
  assert.match(component, /useEffect\(\(\) => \{ if \(!inView\) pauseFor\('away'\); \}, \[inView\]\);/);
  let s = session.begin(session.ready(), 0, T);
  s = session.pause(s, 10, 'away');
  assert.equal(session.running(s), false);
  assert.equal(session.begin(s, 50, T), s, 'the bell rings once');
});

// ---- bug 4: NothingPendingWhilePaused ----
test('bug 4 · NothingPendingWhilePaused: the beat after a right answer is a phase on the pausable clock, so a pause holds it', () => {
  let { s, at } = toCustomer();
  s = session.served(s, at + 900, T);
  assert.equal(s.phase, 'right');
  s = session.pause(s, at + 930, 'away');                    // the HUD pause, 30 ms later
  s = runTo(s, at + 930, at + 1500 + 5000);                  // the old game's timer stepped the next customer up here
  assert.equal(s.phase, 'right', 'still the same beat');
  assert.equal(s.index, 0, 'the next customer has not stepped up');
  s = session.resume(s, at + 7000, 'away', T.breath);
  s = runTo(s, at + 7000, at + 7000 + T.breath + T.right + 20);
  assert.equal(s.phase, 'serve');
  assert.equal(s.index, 1);
  assert.ok(waited(s, at + 7000 + T.breath + T.right + 20) < 100, 'a fresh patience for the next customer');
  assert.doesNotMatch(component, /setTimeout|setInterval/, 'every timed thing runs on the pausable phase clock');
  // ...and a customer who walked off is the same phase kind: paused mid walk-off, nothing moves.
  let late = runTo(session.begin(session.ready(), 0, T), 0, T.open + 10_000 + 5);
  assert.equal(late.phase, 'late');
  late = session.pause(late, T.open + 10_030, 'away');
  assert.equal(runTo(late, T.open + 10_030, T.open + 20_000).phase, 'late');
});

// ---- bug 5: DayEndsOnlyWhilePlaying ----
test('bug 5 · DayEndsOnlyWhilePlaying: the shop never closes behind a pause, and the stars are saved at the decision', () => {
  let s: session.Session = { phase: 'serve', index: CUSTOMERS - 1, dur: 10_000, spent: 0, since: 0, why: null };
  s = session.served(s, 1500, T);                            // the tenth customer gets the right change
  assert.equal(session.decided(s, CUSTOMERS), true, 'the day is decided right here');
  s = session.pause(s, 1530, 'away');
  s = runTo(s, 1530, 1530 + 5000);                           // the old game closed the shop (and played the fanfare) here
  assert.equal(s.phase, 'right', 'no ledger while paused');
  s = session.resume(s, 7000, 'away', T.breath);
  s = runTo(s, 7000, 7000 + T.breath + T.right + 20);
  assert.equal(s.phase, 'over');
  assert.equal(session.running(s), false);
  assert.equal(session.tick(s, 99_000, LIMITS, T), s, 'it ends once');
  // The component records the result when the last customer is decided, not behind the beat that follows.
  assert.match(component, /if \(isOver\(handed\.run\)\) finalize\(handed\.run\);\n\s+commit\(session\.served\(s, at, now\.current\.timing\), s\);/);
  assert.match(component, /if \(isOver\(next\)\) finalize\(next\);/);
  assert.match(component, /if \(recorded\.current === play\.current\) return;\n\s+recorded\.current = play\.current;/);
  assert.match(component, /play\.current\+\+;/, 'each load is a new play');
  // A last customer who runs out the clock decides the day the same way.
  let last: session.Session = { phase: 'serve', index: CUSTOMERS - 1, dur: 3000, spent: 0, since: 0, why: null };
  last = runTo(last, 0, 3010, [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000]);
  assert.equal(last.phase, 'late');
  assert.equal(session.decided(last, CUSTOMERS), true);
});

// ---- the clock ----
test('phases: the bell, the patience, the beat, the next customer, the ledger; no clock means no timeout', () => {
  let s = session.begin(session.ready(), 0, T);
  assert.equal(s.phase, 'opening');
  s = runTo(s, 0, T.open + 5);
  assert.equal(s.phase, 'serve');
  assert.equal(session.canAct(s), true);
  assert.equal(session.begin(s, 9999, T), s, 'the bell rings once');
  s = runTo(s, T.open + 5, T.open + 10_005);
  assert.equal(s.phase, 'late', 'patience out');
  s = runTo(s, T.open + 10_005, T.open + 10_005 + T.late + 10);
  assert.equal(s.phase, 'serve');
  assert.equal(s.index, 1);
  // সময় নিয়ে: the limits are 0, so a customer waits for ever.
  let calm = runTo(session.begin(session.ready(), 0, T), 0, T.open + 5, LIMITS.map(() => 0));
  calm = runTo(calm, T.open + 5, T.open + 600_000, LIMITS.map(() => 0));
  assert.equal(calm.phase, 'serve');
  assert.equal(calm.index, 0);
  assert.equal(patienceLeft(5000, 0), 1, 'no clock: always full');
  assert.equal(session.served(session.ready(), 0, T).phase, 'ready', 'nothing is served before the bell');
});

test('rush: in a finale a wrong count costs the patience; elsewhere it costs nothing', () => {
  let { s, at } = toCustomer();
  const before = waited(s, at + 1000);
  s = session.hurt(s, RUSH_MS);
  assert.equal(waited(s, at + 1000), before + RUSH_MS);
  assert.equal(session.hurt(session.pause(s, at + 1100, 'away'), RUSH_MS).spent, session.pause(s, at + 1100, 'away').spent, 'nothing under a pause');
  s = runTo(s, at, at + 8100);                               // 8.1 s on the clock + 2 s taken = out of patience
  assert.equal(s.phase, 'late');
  assert.equal(session.hurt(s, RUSH_MS), s, 'the walk-off is not hurt again');
  assert.equal(session.hurt(session.begin(session.ready(), 0, T), RUSH_MS).spent, 0, 'not before the first customer');
  assert.equal(makeDeal(10, 1).rush && makeDeal(20, 1).rush && makeDeal(30, 1).rush, true);
  assert.equal(makeDeal(9, 1).rush, false);
  assert.match(component, /if \(rush\) commit\(session\.hurt\(s, RUSH_MS\), s\);/);
});

test('moods and the edge follow the patience left: calm, in a hurry, cross; amber, then red', () => {
  assert.deepEqual([1, 0.6, 0.5, 0.3, 0.2, 0.05].map(moodAt), [0, 0, 1, 1, 2, 2]);
  assert.deepEqual([1, 0.4, 0.3, 0.2, 0.15, 0.01].map(edgeAt), [0, 0, 1, 1, 2, 2]);
  assert.equal(patienceLeft(2500, 10_000), 0.75);
  assert.equal(secondsLeft(7500, 10_000), 3);
});

// ---- shared patterns ----
test('a pause covers the customer, so it buys no thinking time on screen; a click that wakes the window only resumes', () => {
  assert.match(component, /const covered = sess\.why !== null && session\.started\(sess\);/);
  assert.match(component, /const down = ready \|\| covered;/);
  assert.match(component, /const locked = !serving;/);
  assert.match(component, /const serving = sess\.phase === 'serve' && !covered;/);
  assert.match(component, /disabled=\{locked \|\| gone\}/, 'the chits are disabled under the pause, so a tap there is nothing');
  assert.match(component, /if \(event\.button !== 0 \|\| !event\.isPrimary \|\| !session\.canAct\(now\.current\.sess\)\) return;/);
  assert.match(component, /if \(covered\) resumeFrom\(sess\.why === 'sheet' \? 'sheet' : 'away'\); else start\(\);/);
});

test('the game\'s P opens the player\'s one pause menu; result keys need a fresh press after the ledger shows', () => {
  assert.match(component, /if \(player\.stage\.width > 0\) player\.requestPause\(\); else pauseFor\('away'\);/);
  assert.match(component, /fresh && event\.timeStamp > overAt\.current \+ 400/);
  assert.match(component, /const key = event\.key, enter = key === 'Enter' \|\| key === ' ', fresh = !event\.repeat/);
  assert.match(component, /if \(button instanceof HTMLButtonElement\) button\.blur\(\);/, 'a clicked button drops focus, so Enter goes to the game');
  assert.match(component, /onLevels: \(\) => openSheet\(\)/, 'সব দিন is in the player\'s menu');
  assert.doesNotMatch(component, /location\.hash\s*=|pushState|history\.push/, 'never set the hash or push history');
});

test('blur and hide drop a drag in flight; the tray is released with the pointer', () => {
  assert.match(component, /const away = \(\) => \{ pauseFor\('away'\); drag\.current = null; ghost\.current\?\.setAttribute\('hidden', ''\); \};/);
  assert.match(component, /onPointerCancel=\{chitUp\}/);
});

test('loading a day cuts scheduled notes and cancels the frame loop; no loops, so none can outlive a pause', () => {
  assert.match(component, /function load\(next: Deal\) \{\n\s+if \(raf\.current\) \{ cancelAnimationFrame\(raf\.current\); raf\.current = 0; \}\n\s+silenceScheduled\(\);/);
  assert.doesNotMatch(component + sounds, /\bloop\(/);
  assert.doesNotMatch(component + sounds, /new AudioContext|navigator\.vibrate|Math\.random/);
  assert.match(sounds, /tone\(note\(root, step\)[^\n]*delay \+ k \* 0\.09/, 'the clear ident is scheduled on the audio clock');
});

test('ধীরে খেলো calms the motion only: the clock, the bonus and the stars are the same', () => {
  assert.equal(session.SLOW_TIMING.open, T.open);
  assert.ok(session.SLOW_TIMING.right > T.right);
  assert.doesNotMatch(component, /limitsOf\([^)]*slow/, 'the patience is the level\'s own seconds in both modes');
  assert.match(component, /const limitsOf = \(deal: Deal, timed: boolean\) => deal\.seconds\.map\(seconds => timed \? Math\.round\(seconds \* 1000\) : 0\);/);
  assert.doesNotMatch(component, /starsOf\([^)]*slow/);
  assert.equal(RELAXED_KEY, 'bhangti-nai-relaxed', 'সময় নিয়ে keeps its old key');
});

test('a chit goes down on pointerdown, and a drag back onto the box takes it up again', () => {
  assert.match(component, /onPointerDown=\{event => chitDown\(event, value\)\}/);
  assert.match(component, /if \(d\.moved && event\.clientY >= \(boxRef\.current\?\.getBoundingClientRect\(\)\.top \?\? Infinity\)\) putBack\(d\.chit\);/);
  assert.match(component, /const chitClick = \(event: MouseEvent<HTMLButtonElement>, chit: Chit\) => \{ if \(event\.detail === 0\) pick\(chit\); \};/, 'a keyboard click still works, and a touch does not count twice');
});

// ---- saved progress ----
test('UnlockOnlyByClearing: a friend\'s far-ahead day records its stars but opens nothing in between', () => {
  let stars = {}, open = readOpen(null, stars);
  assert.equal(open, 1, 'a new phone has day 1');
  stars = recordLevel(stars, 30, 3);                          // a friend's day-30 link, cleared on a clean phone
  open = openAfter(open, 30);
  assert.equal(open, 1, 'days 2 to 30 stay closed for your own play');
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 30, 'the shared rule is untouched (migrations rely on it)');
  assert.equal(readOpen('1', stars), 1, 'a reload keeps your own unlock');
  assert.equal(openAfter(1, 1), 2, 'your own clear opens the next day');
  assert.equal(openAfter(30, 30), 30);
  assert.equal(OPEN_KEY, 'ektukhani-bhangti-nai-open');
});

test('old saved progress migrates once: the first visit opens what the old rule opened', () => {
  const old = { 1: 3, 2: 2, 3: 1, 7: 2 };
  assert.equal(readOpen(null, old), 8, 'one past the highest day with stars, as before');
  assert.equal(readOpen('8', recordLevel(old, 25, 1)), 8, 'after that, only your own key counts');
  for (const junk of ['', '0', '31', 'x', '2.5']) assert.equal(readOpen(junk, old), 8, junk);
  assert.equal(startLevel({ 1: 3, 2: 1 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 3 }, 3), 3, 'all three-starred: stay on the furthest');
  assert.equal(startLevel({ 1: 3, 2: 1, 3: 3 }, 3), 2);
  assert.match(component, /ektukhani-levels-bhangti-nai|useLevels\(TOOL, LEVEL_COUNT\)/);
});

// ---- difficulty, by bots ----
const N = 300;
function rates(level: number, skill: Skill) {
  let clear = 0, three = 0, clean = 0, quickFirst = 0;
  for (let i = 0; i < N; i++) {
    const seed = 1 + ((i * 2654435761) >>> 0) % 999_999_999, deal = makeDeal(level, seed), rng = makeRng(seed ^ 0x5bd1e995);
    const { run, firstSeconds } = playShift(deal, rng, skill);
    const stars = starsOf(run.clean, true);
    clear += stars >= 1 ? 1 : 0; three += stars >= 3 ? 1 : 0; clean += run.clean;
    // the first customer, answered right at once, from the bell: the bell's beat + the whole wait
    if (run.log[0].ok && T.open / 1000 + firstSeconds <= 10) quickFirst++;
  }
  return { clear: clear / N, three: three / N, clean: clean / N, quickFirst: quickFirst / N };
}

test('bots: a casual player wins level 1\'s first customer inside 10 s and clears level 1 at least 99% of the time', () => {
  const casual = rates(1, PLAYERS.casual);
  assert.ok(casual.quickFirst >= 0.95, `first customer right within 10 s: ${casual.quickFirst}`);
  assert.ok(casual.clear >= 0.99, `level 1 cleared ${casual.clear}`);
});

test('bots: the ladder\'s target rates hold on every level, and each finale is its shop\'s hardest', () => {
  const steadyClean: number[] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const casual = rates(level, PLAYERS.casual), steady = rates(level, PLAYERS.steady), strong = rates(level, PLAYERS.strong);
    steadyClean[level] = steady.clean;
    if (worldOf(level) === 0 && !isFinale(level)) assert.ok(casual.clear >= 0.8, `level ${level}: casual clears ${casual.clear}`);
    assert.ok(casual.clear >= 0.5, `level ${level}: casual clears ${casual.clear}`);
    if (isFinale(level)) {
      assert.ok(steady.clear >= 0.7, `finale ${level}: steady clears ${steady.clear}`);
      assert.ok(strong.three >= 0.35 && strong.three <= 0.85, `finale ${level}: strong ★★★ ${strong.three}`);
    } else {
      assert.ok(steady.clear >= 0.85, `level ${level}: steady clears ${steady.clear}`);
      assert.ok(strong.three >= 0.55, `level ${level}: strong ★★★ ${strong.three}`);
    }
    assert.ok(casual.three <= strong.three, `level ${level}: speed and care both matter`);
  }
  for (let w = 0; w < 3; w++) {
    const levels = Array.from({ length: PER_WORLD }, (_, i) => w * PER_WORLD + i + 1), finale = levels[PER_WORLD - 1];
    for (const level of levels.slice(0, -1)) assert.ok(steadyClean[finale] < steadyClean[level], `shop ${w + 1}: finale ${finale} (${steadyClean[finale]}) vs ${level} (${steadyClean[level]})`);
  }
});

test('the bot plays through the real rules: a clean shift scores like the rules say', () => {
  const deal = makeDeal(5, 123), run = startRun(deal);
  let played = run;
  for (const chit of fewest(changeOf(run.customers[0]))!) played = tap(played, chit);
  assert.equal(give(played, 0.5).points, 125);
  assert.equal(starsOf(CUSTOMERS, false), 2);
});
