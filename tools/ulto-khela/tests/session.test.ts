// Every bug path from ai_docs/statecharts/ulto-khela/README.md, replayed against the pure page logic (lib/session.ts), plus the
// shared patterns from the rewrite brief. The component's own wiring is checked against its source.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { answer, answerOf, createRound, isLast, nextItem, pass, paceSeconds, resultOf } from "../lib/round";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const game = readFileSync(join(root, "components/game.tsx"), "utf8");
const css = readFileSync(join(root, "product.css"), "utf8");

/** Plays to the last picture and taps it right: what the component's pick() does, in order. Returns what solved() asks. */
function toLastRight(s: S.Session, over = false, level = 1) {
  let round = createRound(level, 9);
  for (;;) {
    assert.equal(S.tapAnswer(s), "counts");
    round = answer(round, answerOf(round)).round;
    const last = isLast(round), record = S.solved(s, last, last ? over : false);
    if (last) return { round, record };
    assert.equal(record, false);
    assert.equal(S.timerFires(s, 1), "next");
    round = nextItem(round)!;
  }
}

/** A second-by-second stand-in for the component's চটপট clock: a picture passes after `paceSeconds` of live time only. */
function clock(s: S.Session, seconds: number, awayFrom = Infinity, awayTo = Infinity) {
  let round = createRound(1, 3), elapsed = 0, passes = 0;
  round = nextItem(answer(round, answerOf(round)).round)!;   // the demo is done; a normal picture waits
  for (let t = 0; t < seconds; t++) {
    if (t === awayFrom) S.blur(s);
    if (t === awayTo) { S.focus(s); elapsed = 0; }          // coming back restarts the picture's full time
    if (!S.quickMayRun(s, round.stage === "pick" && !round.demo)) continue;
    if (++elapsed >= paceSeconds(round.pace)) { round = pass(round); passes++; elapsed = 0; if (round.index + 1 < 8) round = nextItem(round)!; }
  }
  return { passes, round };
}

test("bug 1, NoProgressWhileAway: with চটপট on, 37 s away passes no picture and saves nothing", () => {
  const s = S.createSession();
  S.setQuick(s, true);
  assert.ok(S.begin(s, false));
  // Before the fix: 4 s a picture, 37 s away → the round finished itself with 1★. Now: nothing passes while away.
  const away = clock(s, 40, 1, 38);
  assert.equal(S.quickMayRun(s, true), true, "back, the clock may run again");
  assert.equal(away.passes, 0, `no picture passed (${away.passes})`);
  assert.equal(away.round.stage, "pick");
  // And the same under the player's menu.
  const t = S.createSession();
  S.setQuick(t, true); S.begin(t, false);
  assert.equal(S.quickMayRun(t, true), true);
  S.pause(t);
  assert.equal(S.quickMayRun(t, true), false);
  S.resume(t);
  assert.equal(S.quickMayRun(t, true), true);
  // The same clock with nobody away does pass pictures (so the test above is not vacuous).
  const u = S.createSession(); S.setQuick(u, true); S.begin(u, false);
  assert.ok(clock(u, 40).passes >= 3);
  // The component stops its timers on blur and hides, and asks the session before every clock.
  assert.match(game, /addEventListener\('blur', away\)/);
  assert.match(game, /document\.hidden\) away\(\)/);
  assert.match(game, /S\.quickMayRun\(session\.current/);
  assert.match(game, /const away = \(\) => \{ S\.blur\(session\.current\); stopPending\(\)/);
});

test("bug 1b: the rest after a picture does not fire while away, and comes back with a breath", () => {
  const s = S.createSession();
  S.begin(s, false);
  let round = createRound(1, 3);
  round = answer(round, answerOf(round)).round;
  S.solved(s, false, false);
  S.blur(s);
  assert.equal(S.timerFires(s, 5), "none", "nothing moves while away");
  assert.equal(s.pending, "next");
  S.focus(s);
  assert.equal(S.timerFires(s, 6), "next");
  assert.match(game, /BREATH_MS/);
});

test("bug 2, ChoiceFreezesPlay: the level list is a screen of its own; opening it stops the clocks and nothing waits under it", () => {
  const s = S.createSession();
  S.setQuick(s, true);
  S.begin(s, false);
  let round = createRound(1, 4);
  round = nextItem(answer(round, answerOf(round)).round)!;
  assert.equal(S.quickMayRun(s, true), true);
  S.openLevels(s);
  assert.equal(s.screen, "levels");
  assert.equal(S.quickMayRun(s, true), false, "চটপট's clock stops with the list open");
  assert.equal(S.tapAnswer(s), "ignored");
  S.closeLevels(s);
  assert.equal(s.screen, "title", "back to the title, where a round starts only with খেলো");
  // From a finished picture: the rest after it is dropped, never fires under the list.
  const t = S.createSession(); S.begin(t, false);
  S.solved(t, false, false); S.openLevels(t);
  assert.equal(t.pending, "none"); assert.equal(S.timerFires(t, 9), "none");
  const source = readFileSync(join(root, "components/level-list.tsx"), "utf8") + game;
  assert.doesNotMatch(source, /<details/, "no level drawer under the game");
  assert.match(game, /onLevels: \(\) => \{ stopPending\(\)/, "the player's সব লেভেল opens our list");
});

test("bug 3, NoShareForKids / GateClosesBehindParent: the share gate lives on the title only and shuts when a round starts or on any other touch", () => {
  assert.equal((game.match(/<ParentGate/g) ?? []).length, 1, "one gate in the game");
  assert.match(game, /screen === 'title' && <Title[\s\S]*<ParentGate key=\{gateKey\}/, "inside the title, so it unmounts with it");
  assert.match(game, /function begin[\s\S]{0,700}setGateKey\(key => key \+ 1\)/, "and its key is bumped when a round begins");
  assert.match(game, /\.uk-grown \.kk-gate-open[\s\S]{0,300}setGateKey[\s\S]{0,200}'pointerdown'/, "an outside touch shuts it");
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage site=\{site\} kids/, "GamePage's kids mode drops the header search and the grown-ups' links");
  assert.doesNotMatch(page, /PageFrame|HeaderSearch|<input|ShareBar/);
});

test("bug 4, NoReadingNeeded: the end buttons are pictures of at least 96 px, equal in size; there is no wordy পরের ধাপ", () => {
  const end = readFileSync(join(root, "components/end-screen.tsx"), "utf8");
  assert.match(end, /<svg[\s\S]{0,40}viewBox="0 0 48 48"[\s\S]*আবার খেলো[\s\S]*<svg[\s\S]{0,40}viewBox="0 0 48 48"[\s\S]*শেষ/, "আবার খেলো and শেষ are picture buttons, in that order");
  assert.doesNotMatch(end, /পরের ধাপ/);
  assert.match(css, /\.uk-big\{[^}]*min-height:112px/);
  assert.match(css, /\.uk-choice\{[^}]*min-height:150px/);
  assert.match(css, /@media \(max-height:700px\)\{\.uk-choice\{min-height:120px\}/, "even a short stage keeps the cards above 96 px");
  assert.match(css, /\.uk-paces button\{[^}]*min-height:64px/);
  for (const match of css.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)) assert.ok(Number(match[1]) >= 16, match[0]);
});

test("no voice anywhere: the game never speaks and never touches speech synthesis", () => {
  for (const file of ["components/game.tsx", "components/title.tsx", "components/end-screen.tsx", "lib/words.ts", "lib/sound.ts"]) {
    assert.doesNotMatch(readFileSync(join(root, file), "utf8"), /speak\(|SpeakButton|speechSynthesis|useBanglaVoice/, file);
  }
});

test("EveryFinishCounts: the last right answer saves the stars and checks the limit in that same tap, whatever the hand does next", () => {
  for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.toTitle(s); S.openLevels(s); }, (s: S.Session) => { S.pause(s); S.toTitle(s); }, (s: S.Session) => S.openLevels(s)]) {
    const s = S.createSession();
    assert.ok(S.begin(s, false));
    const { round, record } = toLastRight(s, false);
    assert.ok(record, "the round is recorded at the last tap");
    assert.equal(s.recorded, s.serial);
    assert.equal(resultOf(round).stars, 3);
    leave(s);
    assert.equal(S.timerFires(s, 5), "none", "the dead timer never brings the end screen back");
    assert.notEqual(s.screen, "end");
    assert.equal(s.recorded, s.serial);
  }
  assert.match(game, /function finished[\s\S]{0,260}S\.solved\(s, last, last \? kids\.atBreak\(\) : false\)\) \{[\s\S]{0,120}levels\.record\(/, "stars are saved in the tap, not in a timer");
  assert.match(game, /function quickPass[\s\S]{0,400}finished\(next\)/, "a last picture that passes is recorded the same way");
});

test("RestOnlyAtBreak and NoRoundAfterTimeIsUp: begin() asks atBreak() first, and the limit passing on the last answer waits for the end screen", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false); assert.equal(s.screen, "title"); assert.ok(S.restShows(s));
  S.extend(s);
  assert.ok(S.begin(s, false));
  toLastRight(s, true);
  assert.equal(s.screen, "play"); assert.equal(S.restShows(s), false, "never over a picture");
  assert.equal(S.timerFires(s, 3), "end");
  assert.ok(S.restShows(s));
  assert.equal(S.begin(s, true), false, "আবার খেলো past the limit shows the rest screen, not a round");
  assert.equal(S.tapAnswer(s), "ignored");
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/);
  assert.match(game, /pickLevel[\s\S]{0,160}begin\(id\)/, "a level from the list goes through begin()");
});

test("pause freezes both timers; চালিয়ে যাও gives them back after a breath; a pause with nothing pending changes nothing", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  assert.equal(s.pending, "end");
  S.pause(s);
  assert.equal(S.timerMayRun(s), false);
  assert.equal(S.timerFires(s, 1), "none");
  assert.equal(s.pending, "end", "nothing moves under the menu");
  S.resume(s);
  assert.ok(S.timerMayRun(s));
  assert.equal(S.timerFires(s, 2), "end");
  assert.equal(s.screen, "end");
  assert.match(game, /onResume: \(\) => \{[^}]*armPending\(BREATH_MS\)/);
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); stopPending\(\)/);
});

test("the tap that brings focus back is not a move: after blur the first tap only wakes the game", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapAnswer(s), "woke");
  assert.equal(S.tapAnswer(s), "counts");
  S.blur(s); S.focus(s); S.pause(s);
  assert.equal(S.tapAnswer(s), "ignored", "under the menu nothing counts");
  S.resume(s);
  assert.equal(S.tapAnswer(s), "counts", "চালিয়ে যাও clears the swallow");
});

test("result keys need a fresh press: a key held through the last answer never starts the next round", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  S.timerFires(s, 100);
  assert.equal(S.freshKey(s, 90, false), false, "a press that began before the screen");
  assert.equal(S.freshKey(s, 150, true), false, "auto-repeat");
  assert.equal(S.freshKey(s, 150, false), true);
  assert.match(game, /S\.freshKey\(s, event\.timeStamp, event\.repeat\)/);
  assert.match(game, /window\.addEventListener\('keydown', down\)/, "keys at the window so Enter never presses a stale button");
});

test("চটপট is chosen on the title only, and the pace of a round carries to the next", () => {
  const s = S.createSession();
  S.setQuick(s, true); assert.equal(s.quick, true);
  S.begin(s, false);
  S.setQuick(s, false); assert.equal(s.quick, true, "never mid-round");
  assert.equal(S.quickMayRun(s, false), false, "a demo picture never passes");
  const t = S.createSession();
  S.begin(t, false);
  assert.equal(S.quickMayRun(t, true), false, "off by default");
  assert.match(game, /pace\.current = next\.pace/);
});

test("celebrations and timers are cleared on restart, next level and unmount; the end screen's chimes are scheduled tones", () => {
  assert.match(game, /useEffect\(\(\) => \(\) => \{ stopPending\(\); silenceScheduled\(\); \}, \[\]\)/);
  assert.match(game, /onRestart: \(\) => \{ stopPending\(\); silenceScheduled\(\)/);
  assert.doesNotMatch(game, /setInterval/);
  const sound = readFileSync(join(root, "lib/sound.ts"), "utf8");
  assert.doesNotMatch(sound, /setTimeout|loop\(/);
  assert.doesNotMatch(game, /location\.hash\s*=[^=]|pushState/, "never touches the history stack");
});
