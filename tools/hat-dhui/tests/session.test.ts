// Every bug path from ai_docs/statecharts/hat-dhui/README.md, replayed against the pure page logic (lib/session.ts) and the
// routine's clock (lib/run.ts, run.hot.ts), plus the shared patterns from the rewrite brief.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createRun, halfShowing } from "../lib/run";
import { FINISHED, HALFWAY, advance } from "../lib/run.hot";
import { BRUSH_ZONES, WASH_STEPS } from "../lib/routines";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");
const game = read("components/game.tsx");

/** What the component's step does each frame: the clock moves only while clockMayRun(). Returns the shown seconds. */
function play(s: S.Session, run: ReturnType<typeof createRun>, frames: number, away?: (frame: number) => void) {
  for (let frame = 0; frame < frames; frame++) {
    away?.(frame);
    if (S.clockMayRun(s)) advance(run, 1 / 60);
  }
  return run.t;
}

test("bug 1, stale finish timer: a finish timer from an older round never ends the round now on screen", () => {
  const s = S.createSession();
  assert.ok(S.begin(s, false));
  const oldSerial = s.serial;
  assert.ok(S.finish(s, false, true), "the ring closed: recorded, timer armed");
  // The wash ended and the child went straight for another activity (or the player restarted): a new round begins within 1 s.
  assert.ok(S.begin(s, false));
  assert.equal(s.pending, "none", "begin() drops the old timer");
  assert.equal(S.timerFires(s, 5, oldSerial), false, "even if it fires, it belongs to an older round");
  assert.equal(s.screen, "play", "the new round was not turned into a done screen");
  assert.equal(s.finished, false, "and it is not counted as finished");
  assert.equal(s.recorded, oldSerial, "only the real finish was recorded");
  // Leaving to the title, too.
  S.begin(s, false); S.finish(s, false, true); S.toTitle(s);
  assert.equal(S.timerFires(s, 9, s.serial), false);
  assert.equal(s.screen, "title");
  // The component stamps each timer with its round and clears it on every start, restart and unmount.
  assert.match(game, /const armedFor = session\.current\.serial;/);
  assert.match(game, /S\.timerFires\(session\.current, performance\.now\(\), armedFor\)/);
  assert.match(game, /function begin\(id: ModeId\) \{\s*const s = session\.current;\s*clearAll\(\)/);
  assert.match(game, /useEffect\(\(\) => \(\) => \{ clearAll\(\); silenceScheduled\(\); \}, \[\]\)/);
});

test("bug 1 again, RestOnlyAtBreak: the limit passing at the finish rests only after the routine, never over it", () => {
  const s = S.createSession();
  S.begin(s, false);
  assert.ok(S.finish(s, true, true));
  assert.equal(S.restShows(s), false, "still on the play screen: no rest over a finished wash");
  assert.ok(S.timerFires(s, 3, s.serial));
  assert.equal(s.screen, "end");
  assert.ok(S.restShows(s), "rest comes with the end screen");
});

test("bug 2, PausedWhenBlurred and PausedWhenHidden: the ring does not move while away, and the clock only counts shown time", () => {
  const s = S.createSession();
  S.begin(s, false);
  const run = createRun(WASH_STEPS);
  // 3 s shown, then the window blurs for 4 s (240 frames), then it comes back.
  play(s, run, 180);
  assert.ok(Math.abs(run.t - 3) < 1e-9);
  S.blur(s);
  const frozen = play(s, run, 240);
  assert.ok(Math.abs(frozen - 3) < 1e-9, "the ring held still while blurred");
  S.focus(s);
  play(s, run, 60);
  assert.ok(Math.abs(run.t - 4) < 1e-9, "and carried on from where it was");
  // The player's menu holds it too.
  S.pause(s);
  assert.ok(Math.abs(play(s, run, 600) - 4) < 1e-9);
  S.resume(s);
  assert.ok(play(s, run, 60) > 4);
  // The component: the step moves the clock only through clockMayRun, and the component listens for blur, focus and hide.
  assert.match(read("components/routine-view.tsx"), /const may = clockMayRun\(session\);\s*let events = 0;\s*if \(may\) \{\s*events = advance\(sim, dt\);/);
  assert.match(game, /window\.addEventListener\("blur", onBlur\)/);
  assert.match(game, /document\.addEventListener\("visibilitychange", onVisibility\)/);
});

test("a routine takes exactly its length of shown time, whatever the blurs and pauses", () => {
  for (const [steps, seconds] of [[WASH_STEPS, 20], [BRUSH_ZONES, 120]] as const) {
    for (const seed of [1, 2, 3, 4, 5]) {
      const s = S.createSession(), run = createRun(steps);
      S.begin(s, false);
      let shown = 0, frames = 0, fired = 0;
      // A child's phone: blurs and menus at pseudo-random moments, each lasting a while.
      let state = seed * 7919;
      const rnd = () => (state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      let awayFor = 0, pausedFor = 0;
      while (!run.done && frames < 60 * 600) {
        frames++;
        if (awayFor === 0 && pausedFor === 0 && rnd() < 0.004) { if (rnd() < 0.5) { S.blur(s); awayFor = Math.floor(rnd() * 200); } else { S.pause(s); pausedFor = Math.floor(rnd() * 200); } }
        if (awayFor > 0 && --awayFor === 0) S.focus(s);
        if (pausedFor > 0 && --pausedFor === 0) S.resume(s);
        if (S.clockMayRun(s)) { fired += advance(run, 1 / 60) & FINISHED ? 1 : 0; shown += 1 / 60; }
      }
      assert.equal(fired, 1, "the finish fires once");
      assert.ok(run.done && run.t === seconds);
      assert.ok(Math.abs(shown - seconds) < 0.03, `${seconds} s routine took ${shown.toFixed(2)} s of shown time (seed ${seed})`);
    }
  }
});

test("the ring's middle: the halfway cheer fires once, and its badge shows for a short while of shown time", () => {
  for (const steps of [WASH_STEPS, BRUSH_ZONES]) {
    const run = createRun(steps);
    let halves = 0, shownFrames = 0;
    while (!run.done) { if (advance(run, 1 / 60) & HALFWAY) halves++; if (halfShowing(run)) shownFrames++; }
    assert.equal(halves, 1);
    assert.ok(shownFrames / 60 > 1.5 && shownFrames / 60 < 2.5, `badge ${shownFrames / 60} s`);
    assert.equal(halfShowing(run), false, "gone at the end");
  }
});

test("EveryFinishCounts: the stars are saved at the step the ring closes, whatever the hand does in the next second", () => {
  for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.pause(s); S.toTitle(s); }, (s: S.Session) => S.begin(s, false)]) {
    const s = S.createSession();
    S.begin(s, false);
    assert.ok(S.finish(s, false, true));
    assert.equal(s.recorded, s.serial);
    leave(s);
    S.timerFires(s, 4, 1);
    assert.equal(s.recorded >= 1, true);
  }
  // Recorded once: a second finish in the same round (a stray extra event) does nothing.
  const s = S.createSession();
  S.begin(s, false);
  assert.ok(S.finish(s, false, true));
  assert.equal(S.finish(s, false, true), false);
  // The component records and checks the limit in `won`, in the step itself, never inside the timer.
  assert.match(game, /function won\(next: Result, timed: boolean\) \{[\s\S]{0,200}S\.finish\(s, live\.current\.kids\.atBreak\(\), timed\)[\s\S]{0,400}levels\.record\(level, next\.stars\)/);
});

test("quiz: the last right card is recorded in that tap; the → button only moves on, and cannot skip an unsolved card", () => {
  const s = S.createSession();
  S.begin(s, false);
  assert.equal(S.goToEnd(s, 1), false, "→ before the round is won does nothing");
  assert.ok(S.finish(s, false, false));
  assert.equal(s.pending, "none", "no timer for the quiz");
  assert.ok(S.goToEnd(s, 2));
  assert.equal(s.screen, "end");
});

test("NoNewRoundPastLimit: past today's limit, খেলো and আবার খেলো show the rest screen, not a round", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.ok(S.restShows(s));
  assert.equal(S.tapGame(s), "ignored");
  S.extend(s);
  assert.ok(S.begin(s, false));
  S.finish(s, true, true); S.timerFires(s, 3, s.serial);
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "end");
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/);
});

test("pause freezes the finish timer; চালিয়ে যাও gives it back after a breath", () => {
  const s = S.createSession();
  S.begin(s, false); S.finish(s, false, true);
  S.pause(s);
  assert.ok(s.frozen);
  assert.equal(S.timerFires(s, 3, s.serial), false);
  assert.equal(s.screen, "play");
  S.resume(s);
  assert.equal(s.frozen, false);
  assert.ok(S.timerFires(s, 4, s.serial));
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); stopPending\(\); \}/);
  assert.match(game, /onResume: \(\) => \{ S\.resume\(session\.current\); if \(session\.current\.pending !== "none"\) armEnd\(BREATH_MS\); \}/);
});

test("the tap that brings focus back is not a move: it only wakes the game", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapGame(s), "woke");
  assert.equal(S.tapGame(s), "counts");
  S.pause(s);
  assert.equal(S.tapGame(s), "ignored", "nothing under the menu");
});

test("result keys need a fresh press: a key held through the ring closing never skips the end screen or starts the next round", () => {
  const s = S.createSession();
  S.begin(s, false); S.finish(s, false, true); S.timerFires(s, 100, s.serial);
  assert.equal(S.freshKey(s, 90, false), false, "a press that began before the screen appeared");
  assert.equal(S.freshKey(s, 150, true), false, "auto-repeat");
  assert.equal(S.freshKey(s, 150, false), true);
  assert.match(game, /if \(S\.freshKey\(s, event\.timeStamp, event\.repeat\)\) begin\(id\)/);
});

test("Enter and Space go to the game at window, and buttons let go of focus after a tap", () => {
  assert.match(game, /window\.addEventListener\("keydown", down\)/);
  assert.match(game, /event\.preventDefault\(\); if \(!event\.repeat\) begin\(id\)/);
  for (const file of ["components/title.tsx", "components/end-screen.tsx", "components/quiz-view.tsx"]) assert.match(read(file), /currentTarget\.blur\(\)/, file);
});

test("the address is updated with replaceState, never the hash or history pushes (they close the player's full screen)", () => {
  assert.doesNotMatch(game, /location\.hash\s*=|history\.pushState|location\.assign|location\.href\s*=/);
  assert.match(game, /history\.replaceState\(history\.state, "", `#m=\$\{id\}`\)/);
});

test("no voice anywhere: no speak(), SpeakButton or speechSynthesis in the game", () => {
  for (const file of ["components/game.tsx", "components/routine-view.tsx", "components/quiz-view.tsx", "components/title.tsx", "components/end-screen.tsx", "lib/sound.ts"]) {
    assert.doesNotMatch(read(file), /\bspeak\(|SpeakButton|speechSynthesis|useBanglaVoice/, file);
  }
});

test("the page uses the shared player with the kids frame, and every end button is a picture of at least 96 px", () => {
  const page = read("page.tsx");
  assert.match(page, /<GamePage site=\{site\} kids/);
  assert.match(game, /useGamePlayer\(\{[\s\S]{0,400}onLevels/);
  const css = read("product.css");
  assert.match(css, /\.hd-big\{[^}]*min-height:112px/);
  assert.match(css, /\.hd-next\{[^}]*width:96px;height:96px/);
  assert.match(css, /\.hd-choice\{[^}]*min-height:96px/);
  assert.match(css, /\.hd-chips button\{[^}]*min-height:112px/);
});
