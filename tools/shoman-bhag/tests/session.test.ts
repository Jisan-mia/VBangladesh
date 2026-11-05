// The statechart's bug paths and rules, replayed against the pure session (tools/shoman-bhag/lib/session.ts) and the round.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { isDone, createRound, moods, nextItem, resultOf, tapBasket, tapPlate, target, type Round } from "../lib/round";
import * as S from "../lib/session";
import { PERFECT, playRound } from "./bot";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
/** What the component does at a finished serving: tell the session, and record the round if it was the last. */
const finish = (s: S.Session, last: boolean, over = false) => S.servedDone(s, last, over);

test("bug 2, NoProgressWhileAway: a served table waits for you while you are away, and only the ➜ moves on", () => {
  const s = S.createSession();
  S.begin(s, false);
  const served = playRound(1, 3, PERFECT).round;
  // the serving finishes; the child looks away; there is no timer, so nothing changes, and the faces stay happy
  finish(s, false);
  S.blur(s);
  assert.equal(s.solved, true);
  assert.ok(isDone(served));
  assert.ok(moods(createRound(1, 3)).length >= 0);
  assert.equal(s.screen, "play");
  S.focus(s);
  // the first tap back only wakes the game; the ➜ after it moves on
  assert.equal(S.tapNext(s, 10), "woke");
  assert.equal(s.solved, true, "still waiting");
  assert.equal(S.tapNext(s, 11), "next");
  assert.equal(s.solved, false);
});

test("the round never advances by itself: no module in the game schedules the next guests", () => {
  for (const file of ["components/game.tsx", "lib/round.ts", "lib/session.ts"]) {
    const text = read(file);
    assert.doesNotMatch(text, /setTimeout\([^)]*(nextItem|setRound|goNext)/, file);
    assert.doesNotMatch(text.replace(/\/\/.*$/gm, ""), /setInterval/, file);
  }
  // the only timer in the game component is the idle finger nudge
  assert.equal((read("components/game.tsx").match(/setTimeout/g) ?? []).length, 1);
});

test("bug 3, RestOnlyAtBreak: the rest screen waits for the end screen, and a round does not start past the limit", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false, "past the limit a round does not start");
  assert.equal(s.screen, "title");
  assert.equal(S.restShows(s), true);
  S.extend(s);
  assert.equal(S.begin(s, false), true);
  // the limit passes on the last serving's last touch: stars are saved now, the rest screen comes with the end screen
  assert.equal(finish(s, true, true), true);
  assert.equal(s.recorded, s.serial);
  assert.equal(s.resting, true);
  assert.equal(S.restShows(s), false, "never over a serving");
  assert.equal(S.tapNext(s, 5), "end");
  assert.equal(S.restShows(s), true);
  // under the rest screen nothing counts
  assert.equal(S.tapBoard(s), "ignored");
  assert.equal(S.tapNext(s, 6), "ignored");
});

test("every finish counts: the last piece of the last serving records the round at that touch, not at the ➜", () => {
  const s = S.createSession();
  S.begin(s, false);
  assert.equal(finish(s, false), false, "a middle serving records nothing");
  S.tapNext(s, 1);
  assert.equal(finish(s, true), true, "the last one does");
  assert.equal(s.recorded, s.serial);
  S.toTitle(s); // a quick hand leaves before the ➜: the stars were already saved
  assert.equal(s.recorded, s.serial);
  const game = read("components/game.tsx");
  assert.match(game, /if \(isDone\(next\)\) \{\s+const last = isLast\(next\);\s+if \(S\.servedDone\(s, last, last \? kids\.atBreak\(\) : false\)\) \{\s+const done = resultOf\(next\);\s+levels\.record\(done\.level, done\.stars\);/);
  assert.match(game, /if \(!S\.begin\(s, kids\.atBreak\(\)\)\)/, "atBreak() when a round starts");
});

test("pause: nothing moves under the menu, and the first tap after coming back is not a move", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.pause(s);
  assert.equal(S.tapBoard(s), "ignored", "a touch under the menu does nothing");
  S.resume(s);
  S.blur(s);
  assert.equal(S.tapBoard(s), "woke", "the touch that brings focus back is not a move");
  assert.equal(S.tapBoard(s), "counts");
  // a finished serving takes no more touches on the board
  finish(s, false);
  assert.equal(S.tapBoard(s), "ignored");
});

test("the level list and the title never hide a running serving", () => {
  const s = S.createSession();
  S.openLevels(s);
  assert.equal(s.screen, "levels");
  S.closeLevels(s);
  assert.equal(s.screen, "title");
  S.begin(s, false);
  S.openLevels(s);
  assert.equal(s.screen, "play", "opened only from the title or the end screen");
  S.toTitle(s); S.openLevels(s);
  assert.equal(s.screen, "levels");
});

test("result keys need a fresh press: a held Enter through the last piece does not skip the end screen or start the next round", () => {
  const s = S.createSession();
  S.begin(s, false); finish(s, true); S.tapNext(s, 100);
  assert.equal(S.freshKey(s, 100, false), false, "a key that was already down");
  assert.equal(S.freshKey(s, 150, true), false, "auto-repeat");
  assert.equal(S.freshKey(s, 150, false), true);
  const game = read("components/game.tsx");
  assert.match(game, /key === 'Enter' \|\| key === ' '\)\) \{ event\.preventDefault\(\); if \(S\.freshKey\(s, event\.timeStamp, event\.repeat\)\) begin\(round\.level\)/);
  assert.match(game, /if \(event\.repeat\) return;/, "a held key never lifts a piece or presses the ➜");
});

test("Enter and Space go to the game: buttons blur after a press, and the window handler prevents the default", () => {
  const game = read("components/game.tsx"), end = read("components/end-screen.tsx");
  assert.ok((game.match(/element\.blur\(\)/g) ?? []).length >= 5);
  assert.match(game, /event\.preventDefault\(\);\s+if \(event\.repeat\) return;/);
  assert.match(end, /event\.currentTarget\.blur\(\)/);
});

test("bug 4, ParentGate: a share link exists only behind the gate, and the open gate shuts on the next touch outside", () => {
  const game = read("components/game.tsx");
  const at = game.indexOf("<ShareToolLink");
  assert.ok(at > 0 && game.lastIndexOf("<ParentGate", at) > game.lastIndexOf("</ParentGate>", at), "ShareToolLink sits inside a ParentGate");
  assert.match(game, /setGateKey\(key => key \+ 1\)/);
  assert.match(game, /key=\{gateKey\}/);
  assert.doesNotMatch(read("page.tsx"), /ShareToolLink|<a /);
});

test("a held piece is returned when the menu opens or the window blurs, and a drag keeps to the first finger", () => {
  const game = read("components/game.tsx");
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); setNudge\(false\); letGo\(\); \}/);
  assert.match(game, /const out = \(\) => \{ S\.blur\(session\.current\); setAway\(true\); setNudge\(false\); letGo\(\); \}/);
  assert.match(game, /!event\.isPrimary/);
  assert.match(read("components/board.tsx"), /event\.isPrimary && event\.button <= 0/);
  assert.match(game, /pointercancel/);
});

test("pass onLevels so the pause menu has সব লেভেল, and pick levels without touching history or the hash", () => {
  const game = read("components/game.tsx");
  assert.match(game, /onLevels:/);
  assert.doesNotMatch(game, /location\.hash\s*=[^=]|history\.(push|replace)State|pushState/);
});

test("a full serving then ➜ walks the whole round: the end comes only from the last ➜", () => {
  const s = S.createSession();
  S.begin(s, false);
  let round: Round = createRound(1, 8);
  for (let served = 0; served < round.length; served++) {
    const fair = target(round);
    for (let plate = 0; plate < round.plates.length; plate++) for (let count = 0; count < fair; count++) {
      assert.equal(S.tapBoard(s), "counts");
      round = tapPlate(tapBasket(round).round, plate).round;
    }
    assert.ok(isDone(round));
    const last = served === round.length - 1;
    finish(s, last);
    assert.equal(S.tapBoard(s), "ignored");
    assert.equal(S.tapNext(s, served), last ? "end" : "next");
    const more = nextItem(round);
    if (!last) round = more!;
  }
  assert.equal(s.screen, "end");
  assert.equal(resultOf(round).stars, 3);
});
