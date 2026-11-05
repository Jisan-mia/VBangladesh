// The statechart's bug paths (ai_docs/statecharts/tarer-fanke-belun/README.md), replayed against the pure session and
// the real step, plus the shared patterns every game here must get right.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createGame, FLY, OVER, type Game } from "../lib/belun";
import * as S from "../lib/session";
import { stepGame } from "../lib/step.hot";

const DT = 1 / 60;
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** What the component's step does: nothing unless the session ticks, then input → stepGame → syncLoops. */
function tick(s: S.Session, game: Game, loops: S.Loops, steps = 1) {
  for (let i = 0; i < steps; i++) {
    if (!S.ticking(s) || S.breathing(s, DT)) continue;
    stepGame(game, S.takeInput(s), DT, false);
    game.evCount = 0;
    S.syncLoops(s, game, loops);
  }
}
function setup(level = 9) {
  const s = S.createSession(true), game = createGame(7919, level, "n"), playing = new Set<S.LoopKind>();
  const starts: S.LoopKind[] = [];
  const loops: S.Loops = { start: kind => { playing.add(kind); starts.push(kind); }, stop: kind => { playing.delete(kind); } };
  S.goTo(s, "play");
  return { s, game, loops, playing, starts };
}
/** You press and hold for a moment: the run starts. */
function fly(s: S.Session, game: Game, loops: S.Loops) {
  S.pointerDown(s, 1); tick(s, game, loops, 10); S.pointerUp(s, 1); tick(s, game, loops, 5);
  assert.equal(game.phase, FLY);
}

test("bug 1, PausedWhenBlurred: you tap, click into another window, and the balloon waits exactly where it was", () => {
  const { s, game, loops, playing } = setup();
  fly(s, game, loops);
  S.pointerDown(s, 1);
  const { y, dist, time } = game;
  S.blur(s); // the real blur; the player then opens its menu (pause)
  S.pause(s); S.syncLoops(s, game, loops);
  tick(s, game, loops, 120);
  assert.deepEqual([game.y, game.dist, game.time, game.phase], [y, dist, time, FLY], "nothing moved in two seconds away");
  assert.equal(s.pointer, null, "the held finger was let go");
  assert.equal(playing.size, 0, "no loop plays while away");
  // চালিয়ে যাও: a breath first, then the street moves again with fresh hands.
  S.focus(s); S.resume(s); S.syncLoops(s, game, loops);
  tick(s, game, loops, 10);
  assert.equal(game.dist, dist, "a breath before motion");
  tick(s, game, loops, 30);
  assert.ok(game.dist > dist);
});

test("hiding the tab, scrolling the lane away, or opening সব লেভেল stops the street the same way", () => {
  for (const away of [(s: S.Session) => S.hide(s), (s: S.Session) => S.setInView(s, false), (s: S.Session) => S.openSheet(s)]) {
    const { s, game, loops } = setup();
    fly(s, game, loops);
    const dist = game.dist;
    away(s); S.syncLoops(s, game, loops);
    tick(s, game, loops, 60);
    assert.equal(game.dist, dist);
  }
});

test("bug 2, NoCelebrationAfterLeaving: the game keeps no timers; the fanfare is scheduled tones that the next run cuts", () => {
  const game = source("../components/belun-game.tsx");
  assert.doesNotMatch(game, /setTimeout|setInterval/, "no celebration timeouts left to leak into the next run");
  assert.match(game, /function begin\(next: Run\) \{\n\s+silenceScheduled\(\);/, "a new run cuts the last card's chimes");
  assert.match(source("../components/sound.ts"), /tone\(\[1047, 1319, 1568\]\[star\], 0\.18, 0\.09, "triangle", 0\.3 \+ star \* 0\.28\)/, "the star chimes are delayed tones");
  // Stars are kept the moment the level is won, not when the card shows after the glide.
  assert.match(game, /kind === E\.WIN\) \{ keepStars\(g\)/);
});

test("bug 3, LoopComesBack: turning sound back on, or চালিয়ে যাও, brings the wire hum back at once", () => {
  const { s, game, loops, playing, starts } = setup();
  fly(s, game, loops);
  assert.ok(playing.has("hum") && playing.has("wind"));
  S.setSound(s, false); playing.clear(); S.syncLoops(s, game, loops);
  assert.equal(playing.size, 0);
  S.setSound(s, true); S.syncLoops(s, game, loops);
  assert.ok(playing.has("hum") && playing.has("wind"), "back without waiting for a press");
  S.pause(s); S.syncLoops(s, game, loops);
  assert.equal(playing.size, 0);
  S.resume(s); S.syncLoops(s, game, loops);
  assert.ok(playing.has("hum"), "back on চালিয়ে যাও");
  assert.ok(starts.filter(kind => kind === "hum").length >= 3, "each time a fresh loop (never a muted stub kept with ??=)");
  assert.doesNotMatch(source("../components/belun-game.tsx"), /\?\?= loop/);
});

test("loops play only while you fly: not on the title, the ready balloon, after the end, muted or paused", () => {
  const { s, game, loops, playing } = setup(5);
  S.syncLoops(s, game, loops);
  assert.equal(playing.size, 0, "waiting for the first press");
  fly(s, game, loops);
  assert.deepEqual([...playing], ["hum"], "no wind on a street without gusts");
  game.phase = OVER; S.syncLoops(s, game, loops);
  assert.equal(playing.size, 0);
});

test("the click that brings focus back is not a press; keys while paused hold nothing; a blur lets every key go", () => {
  const { s, game, loops } = setup();
  fly(s, game, loops);
  S.blur(s);
  assert.equal(S.pointerDown(s, 2), false, "a click into a blurred window does nothing");
  assert.equal(S.keyDown(s, "space"), false);
  S.focus(s); S.pause(s);
  assert.equal(S.keyDown(s, "up"), false, "paused: game keys are ignored");
  S.resume(s);
  assert.equal(S.keyDown(s, "space"), true);
  S.blur(s);
  assert.equal(S.lifting(s), false, "Space held through a blur is released");
});

test("a tap that comes and goes between two steps still lifts once", () => {
  const { s, game, loops } = setup();
  fly(s, game, loops);
  tick(s, game, loops, 20);
  const vy = game.vy;
  S.pointerDown(s, 3); S.pointerUp(s, 3);
  tick(s, game, loops, 1);
  assert.ok(game.vy < vy - 30);
});

test("result keys need a fresh press after the end screen appears; Enter and Space go to the game, not a stale button", () => {
  const s = S.createSession(true);
  S.goTo(s, "over", 1000);
  assert.equal(S.freshResultKey(s, { timeStamp: 990, repeat: false }), false, "a key from before the screen");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: true }), false, "a held key's repeat");
  assert.equal(S.freshResultKey(s, { timeStamp: 1200, repeat: false }), true);
  S.openSheet(s);
  assert.equal(S.freshResultKey(s, { timeStamp: 1300, repeat: false }), false, "not while the list is open");
  const game = source("../components/belun-game.tsx");
  assert.match(game, /window\.addEventListener\("keydown", down\)/);
  assert.match(source("../components/end-screen.tsx"), /event\.currentTarget\.blur\(\); choice\.run\(\)/, "a clicked choice gives up focus");
});

test("the player owns pause: P asks for its menu; the game never writes location.hash or pushes history", () => {
  const files = ["../components/belun-game.tsx", "../components/title-screen.tsx", "../components/end-screen.tsx", "../components/level-sheet.tsx", "../components/story.tsx", "../components/result-card.tsx"].map(source).join("\n");
  assert.match(files, /key === "p" \|\| key === "P"\) \{ event\.preventDefault\(\); player\.requestPause\(\)/);
  assert.doesNotMatch(files, /location\.hash\s*=|pushState/);
  assert.match(files, /history\.replaceState\(history\.state/);
  assert.doesNotMatch(files, /speechSynthesis|speak\(/);
});
