// Replays the statechart's bug paths (ai_docs/statecharts/sat-tukro/README.md) against the pure session and round logic.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { drop, newRound, resultOf, type Round } from "../lib/game";
import * as S from "../lib/session";
import { place } from "./sat-tukro.test";

const root = join(import.meta.dirname, "..");
const source = (path: string) => readFileSync(join(root, path), "utf8");

/** A session on the play screen, a round just begun. */
function playing(over = false) { const s = S.createSession(); assert.ok(S.begin(s, over)); return s; }
/** The round's last piece goes in: what Play does at that drop. */
function lastDrop(s: S.Session, over = false) {
  let round: Round = newRound(1, 9);
  while (round.pieces.filter(p => !p.done).length > 1) round = place(round, round.shown[0]);
  const recorded: number[] = [];
  const result = drop(round, round.pieces.find(p => !p.done)!.id, round.shown[0].x, round.shown[0].y);
  assert.equal(result.outcome, "done");
  if (S.finished(s, over)) recorded.push(resultOf(result.round).stars);
  return { round: result.round, recorded };
}

test("bug 1, FinishCounts: the picture is recorded and the limit checked at the last drop, whatever the hand does next", () => {
  for (const next of ["open the list", "begin another", "pause and restart"] as const) {
    const s = playing(), { recorded } = lastDrop(s, true);
    assert.deepEqual(recorded, [3], "stars recorded at the drop, before any timer");
    assert.equal(s.recorded, s.serial);
    assert.equal(s.resting, true, "the limit was checked at the drop");
    if (next === "open the list") S.openLevels(s, 50);
    else if (next === "begin another") S.begin(s, false);
    else { S.pause(s); S.toTitle(s); }
    assert.equal(s.recorded, s.serial - (next === "begin another" ? 1 : 0), "the round was already counted");
  }
});

test("bug 1 again: a second finish of the same round records nothing (one result per round)", () => {
  const s = playing();
  assert.equal(S.finished(s, false), true);
  assert.equal(S.finished(s, false), false);
  S.timerFires(s, 10);
  assert.equal(S.finished(s, false), false, "not on the end screen either");
});

test("bug 2, ChoiceFreezesPlay: the list during the cheer shows the end screen first, and no timer fires into the list", () => {
  const s = playing();
  lastDrop(s);
  assert.equal(s.pending, "end");
  S.openLevels(s, 100);
  assert.equal(s.screen, "levels");
  assert.equal(s.back, "end", "closing returns to the end screen, not a vanished picture");
  assert.equal(s.pending, "none", "nothing is waiting under the list");
  S.timerFires(s, 200);
  assert.equal(s.screen, "levels", "a stale timer does nothing");
  S.closeLevels(s);
  assert.equal(s.screen, "end");
});

test("bug 3, PickerKeepsWork: the list mid-picture goes back to it, and the same picture resumes (no restart)", () => {
  const s = playing(), serial = s.serial;
  S.openLevels(s, 10);
  assert.equal(s.back, "play");
  assert.equal(S.pickFromList(s, true), "resume");
  S.closeLevels(s);
  assert.equal(s.screen, "play");
  assert.equal(s.serial, serial, "no new round");
  // Another picture is a new round; from the title or end screen, even the same picture is.
  S.openLevels(s, 20);
  assert.equal(S.pickFromList(s, false), "begin");
  S.toTitle(s); S.openLevels(s, 30);
  assert.equal(S.pickFromList(s, true), "begin");
});

test("the list is a choice screen: opened only from the title, the end screen or play, and ← changes nothing", () => {
  const s = S.createSession();
  S.openLevels(s, 0); assert.equal(s.screen, "levels"); assert.equal(s.back, "title");
  S.closeLevels(s); assert.equal(s.screen, "title");
  S.closeLevels(s); assert.equal(s.screen, "title", "closing twice is nothing");
});

test("bug 4, InputReleasedWhenAway: blur arms a swallow, so the first press back never picks or drops; the table drops a held piece", () => {
  const s = playing();
  assert.equal(S.pressTable(s), "counts");
  S.blur(s); S.focus(s);
  assert.equal(S.pressTable(s), "woke", "the click that brings focus back only wakes");
  assert.equal(S.pressTable(s), "counts");
  const table = source("components/table.tsx");
  for (const must of ["addEventListener('blur'", "visibilitychange", "onLostPointerCapture", "event.buttons === 0", "onPointerCancel={cancel}", "stale press"]) assert.ok(table.includes(must), must);
  assert.ok(/if \(now && now\.pointer !== event\.pointerId\)/.test(table) && /press\.current = null;\s*\/\/ A stale press|A stale press/.test(table), "a stale drag is replaced, not trusted");
});

test("bug 5, ParentGate: nothing in the child's view links out; the print link and the share link sit behind the gate", () => {
  const anchors = /<a[\s>]/;
  for (const file of ["components/title.tsx", "components/end-screen.tsx", "components/level-list.tsx", "components/table.tsx", "components/figure-art.tsx"]) assert.ok(!anchors.test(source(file)), `${file} has a link`);
  const game = source("components/game.tsx"), gate = game.slice(game.indexOf("<ParentGate"), game.indexOf("</ParentGate>"));
  assert.ok(anchors.test(gate) && gate.includes("ShareToolLink"), "the print link and ShareToolLink are inside the gate");
  assert.equal(game.split("<a ").length - 1, 1, "one link in the whole game, inside the gate");
  const page = source("page.tsx");
  assert.ok(page.includes("<GamePage") && page.includes("kids"), "the kids' frame");
});

test("bug 6, NoReadingNeeded: the end buttons are pictures at least 96 px, the list shows pictures", () => {
  const end = source("components/end-screen.tsx"), css = source("product.css");
  assert.equal((end.match(/<svg viewBox="0 0 48 48"/g) ?? []).length, 2, "both end buttons carry an icon");
  assert.ok(/\.st-big\{[^}]*min-height:112px/.test(css), "112 px");
  assert.ok(/\.st-ctl\{[^}]*min-height:72px/.test(css) || /min-width:96px;min-height:72px/.test(css), "turn buttons 72 px");
  assert.ok(source("components/level-list.tsx").includes("<FigureArt"), "the list has thumbnails");
  assert.ok(/\.st-close\{[^}]*width:64px;height:64px/.test(css), "ফিরে যাও is 64 px");
});

test("আবার খেলো replays the same picture; শেষ goes to the title; neither starts the next picture by itself", () => {
  const game = source("components/game.tsx");
  assert.ok(game.includes("onAgain={() => begin(round.level)}"), "same level again");
  assert.ok(/const finishRound[\s\S]*?toTitle\(\);/.test(game), "শেষ ends on the title");
  assert.ok(!/level % LEVEL_COUNT/.test(game), "no auto-advance");
});

test("pause freezes the cheer timer; চালিয়ে যাও gives it back; the timer never runs under the menu", () => {
  const s = playing();
  lastDrop(s);
  S.pause(s);
  assert.equal(S.timerMayRun(s), false);
  S.timerFires(s, 5);
  assert.equal(s.screen, "play", "nothing moved under the menu");
  S.resume(s);
  assert.equal(S.timerMayRun(s), true);
  S.timerFires(s, 6);
  assert.equal(s.screen, "end");
  assert.equal(s.endAt, 6);
});

test("RestOnlyAtBreak: the rest screen never covers a half-built picture; opening a round past the limit shows it instead", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(S.restShows(s), true);
  assert.equal(s.screen, "title");
  S.extend(s);
  assert.equal(S.begin(s, false), true);
  s.resting = true;
  assert.equal(S.restShows(s), false, "not over play");
  assert.equal(S.pressTable(s), "counts");
});

test("a past-the-limit finish still records, and the rest screen waits for the end screen", () => {
  const s = playing(); const { recorded } = lastDrop(s, true);
  assert.equal(recorded.length, 1);
  assert.equal(S.restShows(s), false);
  S.timerFires(s, 1);
  assert.equal(S.restShows(s), true);
  assert.equal(S.pressTable(s), "ignored");
});

test("result keys need a fresh press that began after the end screen appeared", () => {
  const s = playing(); lastDrop(s); S.timerFires(s, 100);
  assert.equal(S.freshKey(s, 90, false), false, "a key held through the finish");
  assert.equal(S.freshKey(s, 150, true), false, "auto-repeat");
  assert.equal(S.freshKey(s, 150, false), true);
  const game = source("components/game.tsx");
  assert.ok(game.includes("S.freshKey(s, event.timeStamp, event.repeat)"));
  assert.ok(game.includes("window.addEventListener('keydown', down)"), "keys at window: Enter never presses a stale button");
});

test("the hint timer runs only while a picture is being built and nothing covers it", () => {
  const s = playing();
  assert.equal(S.hintMayShow(s), true);
  S.blur(s); assert.equal(S.hintMayShow(s), false); S.focus(s);
  S.pause(s); assert.equal(S.hintMayShow(s), false); S.resume(s);
  S.openLevels(s, 1); assert.equal(S.hintMayShow(s), false);
});

test("timers are cleared on unmount, restart and the start of a round; sound loops: none exist", () => {
  const game = source("components/game.tsx");
  assert.ok(/useEffect\(\(\) => \(\) => \{ clearAll\(\); silenceScheduled\(\); \}, \[\]\)/.test(game), "unmount");
  assert.ok(/onRestart: \(\) => \{ clearAll\(\)/.test(game), "restart");
  assert.ok(/function begin\(id: number\) \{\s*const s = session\.current;\s*clearAll\(\)/.test(game), "begin");
  assert.ok(!/\bloop\(/.test(source("lib/sound.ts")), "no loops");
});
