// Every bug path from ai_docs/statecharts/sourojogot/README.md, replayed against the pure page logic (lib/session.ts), plus
// the shared patterns from the rewrite brief. The component's own wiring is checked against its source.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { advance, answer, createRound, isLast, resultOf, rightKey } from "../lib/round";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const game = readFileSync(join(root, "components/game.tsx"), "utf8");

/** Plays level 1 to its last planet and taps it right: what the component's pick() does, in order. */
function toLastRight(s: S.Session, over = false, button = false) {
  let round = createRound(1, 9);
  while (!isLast(round)) {
    assert.equal(S.tapAnswer(s), "counts");
    round = answer(round, rightKey(round));
    assert.equal(S.solved(s, false, false, false), false);
    round = advance(round);
  }
  assert.equal(S.tapAnswer(s), "counts");
  round = answer(round, rightKey(round));
  return { round, record: S.solved(s, true, over, button) };
}

test("bug 1, NoRoundAfterTimeIsUp: time is up, then আবার খেলো or a level from the list shows the rest screen, not a round", () => {
  const s = S.createSession();
  assert.ok(S.begin(s, false));
  toLastRight(s, false);
  S.timerFires(s, 10);
  assert.equal(s.screen, "end");
  // The limit passes while the end screen is up: আবার খেলো asks atBreak() first.
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "end", "no new round");
  assert.ok(S.restShows(s));
  assert.equal(S.tapAnswer(s), "ignored");
  // The same from the title and from the level list.
  const t = S.createSession();
  assert.equal(S.begin(t, true), false); assert.equal(t.screen, "title"); assert.ok(S.restShows(t));
  S.extend(t);
  assert.ok(S.begin(t, false), "a grown-up's ten minutes open the next round");
  // The component asks atBreak() when a round opens, not only when it ends.
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/);
  assert.match(game, /pickLevel[\s\S]{0,160}begin\(id\)/, "a level from the list goes through begin()");
});

test("bug 2, ShareNeverLeftOpenForTheChild: the share gate lives on the title only and shuts when a round starts or on any other touch", () => {
  assert.equal((game.match(/<ParentGate/g) ?? []).length, 1, "one gate in the game");
  assert.match(game, /screen === 'title' && <Title[\s\S]*<ParentGate key=\{gateKey\}/, "inside the title, so it unmounts with it");
  assert.match(game, /function begin[\s\S]{0,700}setGateKey\(key => key \+ 1\)/, "and its key is bumped when a round begins");
  assert.match(game, /\.sj-grown \.kk-gate-open[\s\S]{0,300}setGateKey[\s\S]{0,200}'pointerdown'/, "an outside touch shuts it");
  const s = S.createSession();
  S.begin(s, false);
  assert.equal(s.screen, "play", "no screen but the title shows the gate");
});

test("bug 3, NoFreeTextForKids / NothingLoadsAfterStart: the kids' frame carries no search and no adult links", () => {
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage site=\{site\} kids/, "GamePage's kids mode drops the header search and the grown-ups' grid");
  assert.doesNotMatch(page, /PageFrame|HeaderSearch|<input/);
});

test("EveryFinishCounts: the last right answer saves the stars and checks the limit in that same tap, whatever the hand does next", () => {
  for (const button of [false, true]) for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.toTitle(s); S.openLevels(s); }, (s: S.Session) => { S.pause(s); S.toTitle(s); }, (s: S.Session) => S.openLevels(s)]) {
    const s = S.createSession();
    assert.ok(S.begin(s, false));
    const { round, record } = toLastRight(s, false, button);
    assert.ok(record, "the round is recorded at the last tap");
    assert.equal(s.recorded, s.serial);
    assert.equal(resultOf(round).stars, 3);
    leave(s);
    S.timerFires(s, 5);
    assert.notEqual(s.screen, "end", "the dead timer never brings the end screen back");
    assert.equal(s.recorded, s.serial);
  }
  assert.match(game, /if \(S\.solved\(s, last, last \? kids\.atBreak\(\) : false, button\)\) \{[\s\S]{0,120}levels\.record\(/);
});

test("RestOnlyAtBreak: the limit passing on the last answer waits for the end screen, both ways of getting there", () => {
  for (const button of [false, true]) {
    const s = S.createSession();
    S.begin(s, false);
    toLastRight(s, true, button);
    assert.equal(s.screen, "play");
    assert.equal(S.restShows(s), false, "never over a question");
    if (button) assert.ok(S.goEnd(s, 3)); else S.timerFires(s, 3);
    assert.ok(S.restShows(s));
  }
});

test("the ▶ button only ends a round that waits for it, and never under the menu or the rest screen", () => {
  const s = S.createSession();
  S.begin(s, false);
  assert.equal(S.goEnd(s, 1), false, "nothing waits yet");
  toLastRight(s, false, true);
  assert.equal(s.pending, "wait");
  assert.equal(S.tapAnswer(s), "ignored", "no more answers after the last");
  S.pause(s);
  assert.equal(S.goEnd(s, 2), false);
  S.resume(s);
  assert.ok(S.goEnd(s, 3));
  assert.equal(s.screen, "end"); assert.equal(s.endAt, 3);
  assert.equal(S.goEnd(s, 4), false);
});

test("pause freezes the end timer; চালিয়ে যাও gives it back", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  assert.equal(s.pending, "end");
  S.pause(s);
  assert.equal(S.timerMayRun(s), false);
  S.timerFires(s, 1);
  assert.equal(s.pending, "end", "nothing moves under the menu");
  S.resume(s);
  assert.ok(S.timerMayRun(s));
  S.timerFires(s, 2);
  assert.equal(s.screen, "end");
  // The component stops its timer on pause and re-arms it after a breath.
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); stopPending\(\); \}/);
  assert.match(game, /onResume: \(\) => \{ S\.resume\(session\.current\); if \(session\.current\.pending === 'end'\) armPending\(BREATH_MS\)/);
});

test("the tap that brings focus back is not a move", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s);
  assert.equal(S.tapAnswer(s), "woke");
  assert.equal(S.tapAnswer(s), "counts");
  // The player's menu takes the first tap instead: resuming clears the swallow.
  S.blur(s); S.pause(s); S.resume(s);
  assert.equal(S.tapAnswer(s), "counts");
  // Blur on the title or the end screen arms nothing.
  const t = S.createSession(); S.blur(t);
  assert.equal(t.swallow, false);
});

test("result keys need a fresh press, and Enter goes to the game, not the last focused button", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  S.timerFires(s, 100);
  assert.equal(S.freshKey(s, 90, false), false, "a key pressed before the screen appeared");
  assert.equal(S.freshKey(s, 150, true), false, "a held key's repeat");
  assert.equal(S.freshKey(s, 150, false), true);
  assert.match(game, /window\.addEventListener\('keydown', down\)/);
  assert.match(game, /S\.freshKey\(s, event\.timeStamp, event\.repeat\)/);
  assert.match(game, /event\.preventDefault\(\);\s*if \(event\.repeat\) return;/, "Enter on the board is handled by the game");
});

test("opening a level list pauses play: nothing waits under it, and it opens from the title, the end screen or the player's menu", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  S.openLevels(s);
  assert.equal(s.screen, "levels"); assert.equal(s.pending, "none"); assert.equal(s.back, "title");
  S.closeLevels(s);
  assert.equal(s.screen, "title");
  const e = S.createSession();
  S.begin(e, false); toLastRight(e); S.timerFires(e, 5);
  S.openLevels(e); assert.equal(e.back, "end"); S.closeLevels(e); assert.equal(e.screen, "end");
  const t = S.createSession(); S.openLevels(t); assert.equal(t.screen, "levels");
  assert.match(game, /onLevels: \(\) => \{[^}]*S\.openLevels/);
});

test("the daily limit: the rest screen blocks every answer and never shows over play", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.ok(S.restShows(s));
  assert.equal(S.tapAnswer(s), "ignored");
  S.extend(s);
  assert.equal(S.restShows(s), false);
  assert.match(game, /restUp = kids\.resting && screen !== 'play'/);
  assert.match(game, /kids\.resting && s\.screen !== 'play'\) return;/, "keys are dead under it");
});

test("Silent, no voice: the game has no speech call", () => {
  assert.doesNotMatch(game, /speak|Speak|speechSynthesis/);
});

test("clean up: the timer, the sounds and the sky loop stop on unmount", () => {
  assert.match(game, /useEffect\(\(\) => \(\) => \{ clearAll\(\); silenceScheduled\(\); \}, \[\]\)/);
  const board = readFileSync(join(root, "components/board.tsx"), "utf8");
  assert.match(board, /cancelAnimationFrame\(run\.current\.raf\)/);
  assert.match(board, /paused\) \{ cancelAnimationFrame/, "the loop stops under the pause menu");
});
