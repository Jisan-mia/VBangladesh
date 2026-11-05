// Every bug path from ai_docs/statecharts/juktoborno/README.md, replayed against the pure page logic (lib/session.ts) and
// the round (lib/round.ts), plus the shared patterns from the rewrite brief.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createRound, currentStep, isLast, nextStep, place, resultOf, type Round } from "../lib/round";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const game = readFileSync(join(root, "components/game.tsx"), "utf8");
const sourceOf = (dir: string) => readdirSync(join(root, dir)).filter(name => /\.tsx?$/.test(name)).map(name => readFileSync(join(root, dir, name), "utf8")).join("\n");

let clock = 1000;
/** Plays one word right, as the component's pick() does, and returns the round after it. */
function solveWord(s: S.Session, round: Round, over = false) {
  const word = currentStep(round).word, last = isLast(round);
  for (const part of word.parts) {
    assert.equal(S.tapLetter(s), "counts");
    round = place(round, part).round;
  }
  clock += 100;
  const record = S.solved(s, last, last ? over : false, clock);
  return { round, record };
}
/** Plays to the last word and solves it. */
function toLastSolved(s: S.Session, over = false) {
  let round = createRound(1, 9);
  for (;;) {
    const out = solveWord(s, round, over);
    round = out.round;
    if (isLast(round)) return out;
    clock += S.SETTLE_MS + 50;
    assert.equal(S.tapNext(s, clock, false), "ok");
    round = nextStep(round);
  }
}

test("bug 1, VoiceOnlyWithSound: there is no voice, so no word is ever read with sound off", () => {
  for (const dir of [".", "components", "lib"]) assert.doesNotMatch(sourceOf(dir), /\bspeak\s*\(|SpeakButton|speechSynthesis|useBanglaVoice/);
});

test("bug 2, RestOnlyAtBreak: the limit passing on the last word waits for the page; the rest screen never covers a word", () => {
  const s = S.createSession();
  assert.ok(S.begin(s, false));
  const { round, record } = toLastSolved(s, true);
  assert.ok(record);
  assert.equal(s.screen, "play");
  assert.equal(S.restShows(s), false, "never over a word");
  clock += S.SETTLE_MS + 50;
  assert.equal(S.tapNext(s, clock, true), "ok");
  assert.equal(s.screen, "end");
  assert.ok(S.restShows(s), "the rest screen waits for the end page");
  assert.equal(resultOf(round).words, 6);
  // Under the rest screen nothing answers a tap: no tile, no new round.
  assert.equal(S.tapLetter(s), "ignored");
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "end");
});

test("bug 2 (keyboard): a Tab past the rest screen can't reach a tile; the keys are ignored while it shows", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastSolved(s, true);
  clock += S.SETTLE_MS + 50;
  S.tapNext(s, clock, true);
  assert.ok(S.restShows(s));
  assert.equal(S.freshEndKey(s, clock + 500, false), true, "the session alone would take it…");
  // …so the component refuses every key while the rest screen shows.
  assert.match(game, /if \(kids\.resting && s\.screen !== 'play'\) return;/);
});

test("bug 3–4, the parent gate: kit-owned (a two-digit sum, one action, auto-repeat ignored); the game only shuts it on the next touch outside", () => {
  assert.match(game, /<ParentGate key=\{gateKey\} label="বড়দের জন্য">/);
  assert.match(game, /setGateKey\(key => key \+ 1\)/);
  assert.doesNotMatch(game, /function ParentGate|const ParentGate/);
});

test("bug 5, NoWayOutWithoutGate: the page uses the kids' frame; the only share is behind the gate, and it sends the address alone", () => {
  const page = readFileSync(join(root, "page.tsx"), "utf8");
  assert.match(page, /<GamePage site=\{site\} kids /);
  assert.doesNotMatch(page, /PageFrame/);
  assert.match(game, /<ParentGate[^>]*>\s*<ShareToolLink/);
  assert.doesNotMatch(game, /navigator\.share|<ShareBar|share-client/);
});

test("NoNewRoundPastLimit: past today's limit, খেলো, আবার খেলো and a level from the list show the rest screen, not a round", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.ok(S.restShows(s));
  assert.equal(S.tapLetter(s), "ignored");
  S.extend(s);
  assert.ok(S.begin(s, false), "a grown-up's ten minutes open the next round");
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/);
});

test("EveryFinishCounts: the last word's stars are saved at its own tap, whatever the hand does next", () => {
  for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.toTitle(s); S.openLevels(s); }, (s: S.Session) => { S.pause(s); S.toTitle(s); }, (s: S.Session) => S.openLevels(s)]) {
    const s = S.createSession();
    assert.ok(S.begin(s, false));
    const { round, record } = toLastSolved(s);
    assert.ok(record, "the round is recorded at the last tap");
    assert.equal(s.recorded, s.serial);
    assert.equal(resultOf(round).stars, 3);
    leave(s);
    assert.equal(s.recorded, s.serial);
  }
  // The component records in the same tap as the solve, never in the পরেরটা handler.
  assert.match(game, /if \(S\.solved\(s, last, last \? kids\.atBreak\(\) : false, performance\.now\(\)\)\) \{[\s\S]{0,160}levels\.record\(/);
  assert.doesNotMatch(game.slice(game.indexOf("function advance"), game.indexOf("// ---- screens")), /levels\.record/);
});

test("a double-tap never skips the word: পরেরটা ignores a tap in its first 0.4 s", () => {
  const s = S.createSession();
  S.begin(s, false);
  const { round } = solveWord(s, createRound(3, 1));
  assert.equal(S.tapNext(s, s.solvedAt + 40, false), "ignored");
  assert.equal(S.tapNext(s, s.solvedAt + S.SETTLE_MS - 1, false), "ignored");
  assert.ok(s.waiting);
  assert.equal(S.tapNext(s, s.solvedAt + S.SETTLE_MS, false), "ok");
  assert.equal(nextStep(round).index, 1);
});

test("the tap that brings focus back is not a move: after a blur it only wakes the game (a tile, or পরেরটা)", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapLetter(s), "woke");
  assert.equal(S.tapLetter(s), "counts");
  solveWord(s, createRound(3, 1));
  S.blur(s); S.focus(s);
  assert.equal(S.tapNext(s, s.solvedAt + 2000, false), "woke");
  assert.ok(s.waiting, "the word is still solved, not skipped");
  assert.equal(S.tapNext(s, s.solvedAt + 2100, false), "ok");
});

test("nothing moves under the pause menu: no tile, no পরেরটা; চালিয়ে যাও gives a fresh hand", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.pause(s);
  assert.equal(S.tapLetter(s), "ignored");
  S.resume(s);
  assert.equal(S.tapLetter(s), "counts");
  solveWord(s, createRound(3, 1));
  S.pause(s);
  assert.equal(S.tapNext(s, s.solvedAt + 5000, false), "ignored");
  assert.ok(s.waiting);
  S.resume(s);
  assert.equal(S.tapNext(s, s.solvedAt + 5000, false), "ok");
  // The game has no timers to freeze: nothing can move on its own.
  assert.doesNotMatch(sourceOf("components") + sourceOf("lib"), /setTimeout|setInterval/);
});

test("the chime can't land on the next word: the old clank() timer is gone, every sound is a scheduled tone", () => {
  assert.doesNotMatch(sourceOf("lib") + game, /setTimeout/);
  assert.doesNotMatch(game, /\bhiss\(|\btone\(/, "the component calls the sound module only");
});

test("result keys need a fresh press: a held Enter doesn't skip the page or start the next round", () => {
  const s = S.createSession();
  S.begin(s, false);
  const { round } = solveWord(s, createRound(3, 1));
  assert.equal(S.freshNextKey(s, s.solvedAt + 50, false), false, "a key that was already down");
  assert.equal(S.freshNextKey(s, s.solvedAt + 900, true), false, "an auto-repeat");
  assert.equal(S.freshNextKey(s, s.solvedAt + 900, false), true);
  assert.ok(round);
  const e = S.createSession();
  S.begin(e, false);
  toLastSolved(e);
  clock += S.SETTLE_MS + 50;
  S.tapNext(e, clock, true);
  assert.equal(e.screen, "end");
  assert.equal(S.freshEndKey(e, e.endAt - 5, false), false);
  assert.equal(S.freshEndKey(e, e.endAt + 500, true), false);
  assert.equal(S.freshEndKey(e, e.endAt + 500, false), true);
  assert.match(game, /S\.freshEndKey\(s, event\.timeStamp, event\.repeat\)/);
  assert.match(game, /S\.freshNextKey\(s, event\.timeStamp, event\.repeat\)/);
});

test("Enter and Space go to the game, not to the last focused button", () => {
  assert.match(game, /window\.addEventListener\('keydown', down\)/);
  assert.match(game, /event\.preventDefault\(\); if \(!event\.repeat\) begin\(level\)/);
  assert.match(sourceOf("components"), /event\.currentTarget\.blur\(\)/, "buttons blur after a click");
  assert.match(game, /event\.preventDefault\(\);[\s\S]{0,40}pick\(letter\)/, "a tile's pointerdown takes no focus");
});

test("the level list is a choice screen: it opens from a round too, closing brings the same round back, and only another level starts a new one", () => {
  const s = S.createSession();
  S.begin(s, false);
  const { round } = solveWord(s, createRound(3, 1));
  S.openLevels(s);
  assert.equal(s.screen, "levels");
  assert.equal(s.back, "play");
  assert.equal(S.tapLetter(s), "ignored", "nothing runs under the list");
  assert.equal(S.tapNext(s, s.solvedAt + 5000, false), "ignored");
  S.closeLevels(s);
  assert.equal(s.screen, "play");
  assert.ok(s.waiting, "the solved word is still waiting");
  assert.equal(S.tapNext(s, s.solvedAt + 5000, false), "ok");
  assert.ok(round);
  // From the title and the end page too.
  const t = S.createSession();
  S.openLevels(t); assert.equal(t.back, "title"); S.closeLevels(t); assert.equal(t.screen, "title");
  // The component resumes the same level without a new round, and the pause menu's সব লেভেল reaches the list.
  assert.match(game, /if \(s\.back === 'play' && id === roundRef\.current\.level\) \{ S\.closeLevels\(s\); sync\(\); return; \}/);
  assert.match(game, /onLevels: \(\) => \{ openLevels\(\); \}/);
});

test("a finished level's list opens from the end page, and a new round starts a fresh serial", () => {
  const s = S.createSession();
  S.begin(s, false);
  const first = s.serial;
  toLastSolved(s);
  clock += S.SETTLE_MS + 50;
  S.tapNext(s, clock, true);
  S.openLevels(s);
  assert.equal(s.back, "end");
  S.closeLevels(s);
  assert.equal(s.screen, "end");
  assert.ok(S.begin(s, false));
  assert.equal(s.serial, first + 1);
  assert.equal(s.waiting, false);
});

test("the pause menu's নতুন করে শুরু goes to the factory and clears the waiting word", () => {
  const s = S.createSession();
  S.begin(s, false);
  solveWord(s, createRound(3, 1));
  S.pause(s);
  S.toTitle(s);
  assert.equal(s.screen, "title");
  assert.equal(s.waiting, false);
  assert.equal(s.paused, false);
});
