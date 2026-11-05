// Every bug path from ai_docs/statecharts/borno-likhi/README.md, replayed against the pure page logic (lib/session.ts),
// the tracing rules (lib/trace.ts) and the layout (lib/layout.ts), plus the shared patterns from the rewrite brief.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { BUTTON, PICTURE_MIN, boardSize, pictureSize } from "../lib/layout";
import { newRound } from "../lib/trace";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const game = readFileSync(join(root, "components/likhi-game.tsx"), "utf8");
const css = readFileSync(join(root, "product.css"), "utf8");
const started = (over = false) => { const s = S.createSession(); assert.ok(S.begin(s, over)); return s; };
const px = (rule: string, prop: string) => {
  const body = new RegExp(`(?:^|\\n|,)${rule.replace(/[.[\]]/g, "\\$&")}(?:,[^{]*)?\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
  return Number(new RegExp(`${prop}:(\\d+)px`).exec(body)?.[1] ?? 0);
};

test("bug 1, InputReleasedWhenAway: switch windows mid-stroke, come back, move the mouse with no button: nothing writes, a fresh touch counts", () => {
  const s = started();
  assert.equal(S.touchDown(s, 1), "counts");
  assert.ok(S.touchMove(s, 1, 1));
  S.blur(s);                                    // the window loses focus, the pointerup never arrives
  assert.equal(s.pointer, null, "blur releases the finger");
  S.focus(s);
  assert.equal(S.touchMove(s, 1, 0), false, "a mouse move with no button pressed writes nothing");
  assert.equal(S.touchMove(s, 1, 1), false, "and the old pointer is gone");
  assert.equal(S.touchDown(s, 7), "woke", "the first tap back only wakes the game");
  assert.equal(S.touchDown(s, 7), "counts", "the next fresh touch writes (before: pointer.current stayed set and the board was dead)");
  assert.equal(s.pointer, 7);
});

test("bug 1, the other way in: a lift we never heard of (buttons 0) releases the finger", () => {
  const s = started();
  S.touchDown(s, 1);
  assert.equal(S.touchMove(s, 1, 0), false);
  assert.equal(s.pointer, null);
  assert.equal(S.touchDown(s, 2), "counts");
});

test("bug 1, the player's menu: pause drops the finger, moves under the menu write nothing, resume is a fresh hand", () => {
  const s = started();
  S.touchDown(s, 1);
  S.pause(s);
  assert.equal(s.pointer, null);
  assert.equal(S.touchMove(s, 1, 1), false);
  assert.equal(S.touchDown(s, 2), "ignored", "nothing counts under the menu");
  S.resume(s);
  assert.equal(S.touchDown(s, 2), "counts");
});

test("only the first finger counts; a second finger or a palm is ignored", () => {
  const s = started();
  assert.equal(S.touchDown(s, 1), "counts");
  assert.equal(S.touchDown(s, 2), "ignored");
  assert.equal(S.touchUp(s, 2), false);
  assert.ok(S.touchUp(s, 1));
  assert.equal(S.touchDown(s, 3), "counts");
});

test("bug 2, EnterWritesTheStroke: Enter and Space never write a stroke, whatever has focus; they only replay the moving dot", () => {
  const s = started();
  for (const key of ["Enter", " "]) {
    assert.equal(S.route(s, key, false, 100), "demo", `${key} on the board is a hint`);
    assert.equal(S.route(s, key, true, 101), null, `${key} held down does nothing more`);
  }
  assert.equal(S.route(s, "ArrowRight", true, 5), "right", "the arrow keys move the pen, repeating");
  // The source: no handler writes a stroke from Enter, no focusable top-row control swallows it, no sound toggle in the game.
  assert.doesNotMatch(game, /finishStroke/);
  assert.doesNotMatch(game, /SoundToggle|setSlow|onKeyDown/);
  assert.match(game, /window\.addEventListener\('keydown'/);
});

test("bug 3, FocusStaysOnTheBoard: keys go by screen, so Enter after পরেরটা still works and never needs a Tab", () => {
  const s = started();
  S.letterDone(s, false, false, 50);
  assert.equal(S.route(s, "Enter", false, 40), null, "a key that began before the picture appeared is not a press on →");
  assert.equal(S.route(s, "Enter", false, 60), "next");
  assert.equal(S.goNext(s, 60), "next");
  assert.equal(s.letter, "tracing");
  assert.equal(S.route(s, "Enter", false, 90), "demo", "the very next Enter is the board's, with no focus anywhere");
  assert.equal(S.route(s, "ArrowDown", false, 91), "down");
});

test("bug 7, NoReadingNeeded: every end button is a picture, at least 96 px; the reward picture is at least 180 px", () => {
  assert.equal(BUTTON, 96);
  for (const rule of [".bl-show,.bl-again,.bl-next", ".bl-big"]) assert.ok(px(rule, "min-height") >= 96, `${rule} is 96 px or more`);
  assert.ok(px(".bl-show,.bl-again,.bl-next", "min-width") >= 96);
  assert.ok(px(".bl-big", "min-height") >= 112);
  for (const label of [/className="bl-again"[\s\S]*?<svg/, /className="bl-next"[\s\S]*?<svg/, /className="bl-show"[\s\S]*?<svg/]) assert.match(game, label, "a picture in the button");
  const end = readFileSync(join(root, "components/end-screen.tsx"), "utf8");
  assert.equal([...end.matchAll(/className="bl-big/g)].length, 2);
  assert.equal([...end.matchAll(/<svg viewBox="0 0 48 48"/g)].length, 2, "the end buttons are drawings");
  for (const [w, h] of [[320, 480], [360, 640], [388, 760], [412, 800], [480, 900], [560, 1000], [0, 0]]) {
    const board = boardSize(w, h);
    assert.ok(pictureSize(board) >= PICTURE_MIN, `${w}×${h}: ${pictureSize(board)} px`);
    assert.ok(board <= (w || 360), `${w}×${h}: the board fits the stage's width`);
  }
  assert.ok(PICTURE_MIN >= 180, "up from about 64 px");
});

test("RestOnlyAtBreak: past the limit a set doesn't start; the rest screen shows on the end card, never over a letter", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false, "atBreak() at the start: no set past the limit");
  assert.ok(s.resting && s.screen === "title");
  assert.equal(S.restShows(s), true);
  S.extend(s);
  assert.ok(S.begin(s, false));
  assert.equal(S.letterDone(s, true, true, 10), true, "the limit passes on the last letter");
  assert.equal(S.restShows(s), false, "still the picture: the rest waits");
  assert.equal(S.goNext(s, 20), "end");
  assert.equal(S.restShows(s), true, "the rest screen comes with the end card");
  assert.equal(S.route(s, "Enter", false, 99), null, "no key reaches the game under it");
  S.toTitle(s);
  assert.equal(S.restShows(s), true);
});

test("EveryFinishCounts: the last letter records the stars at that moment, once, whatever the hand does next", () => {
  const s = started();
  assert.equal(S.letterDone(s, false, false, 1), false, "a middle letter records nothing");
  S.goNext(s, 2);
  assert.equal(S.letterDone(s, true, false, 3), true, "the last letter records");
  assert.equal(s.recorded, s.serial);
  assert.ok(S.writeAgain(s));
  assert.equal(S.letterDone(s, true, false, 4), false, "writing it again never records a second time");
  S.toTitle(s);
  assert.equal(s.recorded, s.serial, "leaving before the end card keeps it");
  assert.ok(game.includes("kids.atBreak()"), "the component asks the daily limit");
  assert.equal([...game.matchAll(/kids\.atBreak\(\)/g)].length, 2, "at a set's start and at its last letter");
});

test("ResultNeedsFreshPress: a key held through the last stroke or the end card never skips the result or starts a round", () => {
  const s = started();
  S.letterDone(s, true, false, 100);
  assert.equal(S.route(s, " ", true, 150), null, "a repeating key");
  assert.equal(S.route(s, " ", false, 90), null, "a key that went down before the picture");
  assert.equal(S.route(s, " ", false, 120), "next");
  S.goNext(s, 200);
  assert.equal(S.route(s, "Enter", true, 300), null);
  assert.equal(S.route(s, "Enter", false, 150), null);
  assert.equal(S.route(s, "Enter", false, 250), "again");
});

test("the tap that brings focus back is not a stroke: blur arms a swallow, the player's menu or the next tap clears it", () => {
  const s = started();
  S.blur(s);
  assert.ok(s.swallow);
  S.pause(s); S.resume(s); S.focus(s);            // the player's চালিয়ে যাও sends a window focus too
  assert.equal(s.swallow, false, "চালিয়ে যাও clears it");
  assert.equal(S.touchDown(s, 1), "counts");
  const t = started();
  S.blur(t);
  assert.equal(S.touchDown(t, 1), "woke", "the click that brings focus back arrives before its focus event: it wakes, it never writes");
  S.focus(t);
  assert.equal(S.touchDown(t, 2), "counts", "and the next tap is a real one, not a second swallow");
});

test("a choice screen freezes play: the set list opens from the title, the end card or the player's menu, and nothing writes under it", () => {
  const s = started();
  S.touchDown(s, 1);
  S.openLevels(s);
  assert.equal(s.screen, "levels");
  assert.equal(s.pointer, null);
  assert.equal(S.touchDown(s, 2), "ignored");
  S.closeLevels(s);
  assert.equal(s.screen, "play", "← goes back to the letter");
  const t = S.createSession();
  S.openLevels(t);
  assert.equal(t.screen, "levels");
  assert.equal(S.begin(t, true), false);
  assert.equal(t.screen, "title", "a set picked past the limit lands on the cover, the rest screen over it");
});

test("Enter on the title starts once, a repeating key never starts a second round; P pauses through the player", () => {
  const s = S.createSession();
  assert.equal(S.route(s, "Enter", false, 1), "start");
  assert.equal(S.route(s, "Enter", true, 2), null);
  assert.equal(S.route(s, "p", false, 3), "pause");
  S.pause(s);
  assert.equal(S.route(s, "p", false, 4), null, "no game key reaches the game under the menu");
});

test("shared patterns in the source: no history or hash writes, no voice, one pause menu, stars and limit at the win", () => {
  assert.doesNotMatch(game, /location\.hash\s*=[^=]|pushState|history\./);
  assert.doesNotMatch(game, /speak|speechSynthesis/);
  assert.match(game, /action === 'pause'\) player\.requestPause\(\)/);
  assert.match(game, /useGamePlayer\(\{[\s\S]*onPause[\s\S]*onResume[\s\S]*onRestart[\s\S]*onLevels/);
  assert.match(game, /window\.addEventListener\('blur'/);
  assert.match(game, /document\.addEventListener\('visibilitychange'/);
  assert.match(game, /levels\.record\(done\.level, done\.stars\)/);
  assert.match(game, /GamePage|useGamePlayer/);
  assert.equal(newRound(1).level, 1);
});
