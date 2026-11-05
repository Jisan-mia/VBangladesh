// The statechart's bug paths (ai_docs/statecharts/dinosaur/README.md), replayed against the pure logic.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { KEY_R, makePit, PIT, BRUSH_R } from "../lib/pit";
import { stamp, sweep } from "../lib/pit.hot";
import * as S from "../lib/session";
import { createHand, drag, lift, press, release, strokeOf, type PointerLike } from "../lib/stroke";

const read = (path: string) => readFileSync(join(import.meta.dirname, "..", path), "utf8");
const mouse = (buttons: number, pointerId = 1): PointerLike => ({ pointerId, isPrimary: true, pointerType: "mouse", buttons });
const touch = (pointerId: number, isPrimary = true): PointerLike => ({ pointerId, isPrimary, pointerType: "touch", buttons: 1 });
const bone = () => makePit(["skull", "ribs", "leg"], { depth: 1, rocks: 0, decoys: 0 }, 5);

// ── bug 1 (InputReleasedWhenAway, SandClearsOnlyUnderAFinger): the sand cleared under a mouse with no button held, and the finger was ignored ──

test("bug 1: a press lost in another window ends the stroke; hover never brushes; the next finger works", () => {
  const pit = bone(), far = { x: 5, y: 5 }, target = pit.bones[0];
  const hand = createHand();
  assert.ok(press(hand, mouse(1), far.x, far.y));
  release(hand);                                   // the window blurs, or the tab hides: the stroke ends
  assert.equal(hand.on, false);
  let changed = 0;
  for (let x = target.x - 40; x <= target.x + 40; x += 2) changed += drag(hand, mouse(0), x, target.y) > 0 ? 1 : 0; // 45 hover moves, no button
  assert.equal(changed, 0, "hover over the bone brushes nothing");
  assert.equal(pit.foundBone[0], 0);
  // two complete touch taps now work (before the fix the second was ignored: stroke.current was still set)
  for (const id of [7, 8]) {
    assert.ok(press(hand, touch(id), target.x, target.y), `finger ${id} is heard`);
    stamp(pit, target.x, target.y, KEY_R, strokeOf(hand));
    assert.equal(lift(hand, touch(id)), "tap");
  }
  assert.equal(pit.foundBone[0], 1, "the tap found the bone");
});

test("bug 1: a mouse move with the button gone ends the stroke by itself; a new press replaces a stuck one; a palm is ignored", () => {
  const hand = createHand();
  assert.ok(press(hand, mouse(1), 10, 10));
  assert.ok(drag(hand, mouse(1), 40, 10) > 0);
  assert.equal(drag(hand, mouse(0), 80, 10), -1, "buttons 0: the stroke is over");
  assert.equal(hand.on, false);
  assert.ok(press(hand, touch(3), 10, 10));
  const first = strokeOf(hand);
  assert.ok(press(hand, touch(4), 20, 20), "a new press replaces a stroke whose finger is gone");
  assert.equal(strokeOf(hand), first + 1, "every press is its own stroke number");
  assert.equal(drag(hand, touch(3), 99, 99), 0, "the old pointer is no longer ours");
  assert.equal(press(hand, touch(9, false), 1, 1), false, "a second finger or a palm is not primary");
  assert.equal(press(createHand(), mouse(0), 1, 1), false, "a mouse press with no left button isn't a press");
  assert.equal(lift(hand, touch(3)), "none");
  assert.equal(lift(hand, touch(4)), "tap");
  assert.equal((() => { const h = createHand(); press(h, touch(1), 0, 0); drag(h, touch(1), 60, 0); return lift(h, touch(1)); })(), "stroke");
  // after a cancel or lostpointercapture (release) nothing is held
  press(hand, touch(5), 0, 0); release(hand);
  assert.equal(drag(hand, touch(5), 50, 0), 0);
});

test("bug 1: the sand layer drops the stroke on blur, hidden tab, cancel, lost capture and pause", () => {
  const code = read("components/sand-layer.tsx");
  assert.match(code, /addEventListener\("blur", drop\)/);
  assert.match(code, /visibilitychange/);
  assert.match(code, /onPointerCancel=\{\(\) => release\(hand\.current\)\}/);
  assert.match(code, /onLostPointerCapture=\{\(\) => release\(hand\.current\)\}/);
  assert.match(code, /if \(!live\) release\(hand\.current\)/);
  const game = read("components/game.tsx");
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); sand\.current\?\.release\(\)/);
});

// ── bug 2 (RestOnlyAtBreak): Tab and Enter started a dig behind the rest screen ──

test("bug 2: a round never starts under the rest screen, and nothing on the sand or board counts behind it", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false, "past the limit: no round");
  assert.deepEqual([s.screen, s.resting, S.restShows(s)], ["title", true, true]);
  assert.equal(S.begin(s, false), true);
  assert.equal(S.touch(s), "counts");
  // The rest screen only ever covers a break: at the last food the limit is checked, and the round still ends on its own screens.
  assert.equal(S.solve(s, true, true, 100), true);
  assert.equal(s.resting, true);
  assert.equal(S.restShows(s), false, "never over the play screen");
  assert.equal(S.advance(s), "end");
  assert.equal(S.restShows(s), true, "on the end screen it covers everything");
  assert.equal(S.freshKey(s, 9999, false), true);
  s.screen = "end"; S.extend(s);
  assert.equal(S.restShows(s), false);
  // The kit's rest screen is a real modal now: everything else goes inert and Tab can't leave it.
  const kit = read("../../shared/kids-kit.tsx");
  assert.match(kit, /sibling\.inert = true/);
  assert.match(kit, /aria-modal="true" aria-label="আজকের খেলা শেষ"/);
  assert.match(read("components/game.tsx"), /if \(kids\.resting && s\.screen !== 'play'\) return;/);
});

test("bug 2: opening a round is a break, and so is the last food: atBreak() runs at both, not in a timer", () => {
  const game = read("components/game.tsx");
  assert.equal((game.match(/kids\.atBreak\(\)/g) ?? []).length, 2);
  assert.match(game, /if \(!S\.begin\(s, kids\.atBreak\(\)\)\)/);
  assert.match(game, /S\.solve\(s, last, last \? kids\.atBreak\(\) : false/);
  // the stars are saved in the very tap that wins, never in a delayed callback
  const sort = game.slice(game.indexOf("function sort("), game.indexOf("/** ▶ : the next"));
  assert.match(sort, /levels\.record\(done\.level, done\.stars\)/);
  assert.doesNotMatch(sort, /setTimeout|later\(/);
});

// ── bug 3 (ParentGate): the share button stayed open while the child played ──

test("bug 3: an open parent gate shuts at the next tap anywhere else, and after one action inside it", () => {
  const game = read("components/game.tsx");
  assert.match(game, /node\.addEventListener\('pointerdown', down, true\)/);
  assert.match(game, /setGateKey\(key => key \+ 1\)/);
  assert.match(game, /<ParentGate key=\{gateKey\}/);
  const kit = read("../../shared/kids-kit.tsx");
  assert.match(kit, /afterAction[\s\S]*setStage\('closed'\)/);
  assert.match(kit, /setTimeout\(close, 20000\)/);
});

// ── bug 4 (NoReadingNeeded): the end buttons were words only ──

test("bug 4: every end button is a picture, at least 96 px", () => {
  const end = read("components/end-screen.tsx"), css = read("product.css");
  for (const label of ["আবার খেলো", "শেষ"]) assert.match(end, new RegExp(`<svg viewBox="0 0 48 48" aria-hidden="true">[\\s\\S]{0,160}</svg>\\s*<span>${label}</span>`), label);
  assert.match(end, /<ShowParentButton/);
  assert.match(css, /\.dn-big\{[^}]*min-height:112px/);
  assert.match(css, /\.dn-go\{[^}]*width:96px;height:96px/);
  assert.match(css, /\.dn-diet-button\{[^}]*min-height:112px/);
  assert.match(css, /\.dn-bone\{[^}]*width:96px/);
});

// ── the quality-bar gaps ──

test("gap: the fact card has picture ways in (a size picture beside buses, the food in pictures)", () => {
  const pieces = read("components/pieces.tsx"), game = read("components/game.tsx");
  assert.match(pieces, /dn-size-bus/);
  assert.match(pieces, /<FoodRow dino=\{dino\} \/>/);
  assert.match(pieces, /<Mouth dino=\{dino\} id=/);
  assert.match(game, /<SizePicture dino=\{dino\} scene \/>/, "the board itself shows the size");
});

test("gap: the level list shows which dinosaurs each level holds", () => {
  const list = read("components/level-list.tsx");
  assert.match(list, /dinosOf\(id\)/);
  assert.match(list, /<DinoArt dino=\{dino\}/);
  assert.match(list, /book\.includes\(dino\.id\) \? undefined : "#a89a8a"/, "a shadow until found");
});

test("gap: a world ends with a named giant over two pits, with a banner and a world tune", () => {
  const game = read("components/game.tsx");
  assert.match(game, /spec\.finale && round\.phase === 'meet'/);
  assert.match(game, /sound\.tune\(world\)/);
  assert.match(game, /isWorldEnd\(done\.level\)/);
});

// ── the session: pause, away, book, keys ──

test("pause, away and the book: nothing counts under them, and the first tap back only wakes the game", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.pause(s);
  assert.equal(S.touch(s), "ignored");
  S.resume(s);
  assert.equal(S.touch(s), "counts");
  S.blur(s);
  assert.equal(s.swallow, true);
  S.focus(s);
  assert.equal(S.touch(s), "woke", "the click that brings focus back is not a brush");
  assert.equal(S.touch(s), "counts");
  S.openBook(s);
  assert.equal(S.touch(s), "ignored", "the book stops play");
  assert.equal(S.advance(s), "no");
  S.closeBook(s);
  assert.equal(S.touch(s), "counts");
  S.blur(s); S.pause(s); S.resume(s);
  assert.equal(S.touch(s), "counts", "the menu took that tap");
});

test("▶ and the end keys need a fresh press: a held Enter never skips the facts or starts the next round", () => {
  const s = S.createSession();
  S.begin(s, false);
  assert.equal(S.solve(s, false, false, 500), false, "not the last dinosaur: nothing recorded yet");
  assert.equal(S.touch(s), "ignored", "the facts are showing");
  assert.equal(S.advance(s, { timeStamp: 400, repeat: false }), "no", "a key that began before the facts");
  assert.equal(S.advance(s, { timeStamp: 900, repeat: true }), "no", "a repeat");
  assert.equal(S.advance(s, { timeStamp: 900, repeat: false }), "next");
  assert.equal(S.advance(s), "no", "once");
  assert.equal(S.touch(s), "counts");
  assert.equal(S.solve(s, true, false, 2000), true, "the last: record now");
  assert.equal(S.solve(s, true, false, 2100) && s.recorded === s.serial, true);
  assert.equal(S.advance(s, { timeStamp: 3000, repeat: false }), "end");
  assert.equal(S.advance(s, { timeStamp: 3100, repeat: false }), "no", "the end screen opens once");
  assert.equal(S.freshKey(s, 2900, false), false, "a key held through the end");
  assert.equal(S.freshKey(s, 3500, true), false);
  assert.equal(S.freshKey(s, 3500, false), true);
});

test("the level list and the title: from the player's menu a round is left; back goes where it came from", () => {
  const s = S.createSession();
  S.openLevels(s);
  assert.deepEqual([s.screen, s.back], ["levels", "title"]);
  S.closeLevels(s);
  assert.equal(s.screen, "title");
  S.begin(s, false);
  S.openLevels(s);
  assert.deepEqual([s.screen, s.back, s.solved], ["levels", "title", false]);
  S.closeLevels(s);
  S.begin(s, false);
  S.solve(s, true, false, 1); S.advance(s);
  S.openLevels(s);
  assert.equal(s.back, "end");
  S.closeLevels(s);
  assert.equal(s.screen, "end");
  S.toTitle(s);
  assert.deepEqual([s.screen, s.paused, s.book], ["title", false, false]);
});

test("a deterministic sweep: the same strokes make the same cleared sand", () => {
  const run = () => { const pit = makePit(["skull", "ribs", "leg"], { depth: 2, rocks: 1, decoys: 1 }, 21); sweep(pit, 10, 60, 340, 60, BRUSH_R, 1, () => undefined); sweep(pit, 340, 60, 10, 60, BRUSH_R, 2, () => undefined); return Array.from(pit.cells).join(""); };
  assert.equal(run(), run());
  assert.ok(PIT.width === 360);
});
