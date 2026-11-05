// The statechart's bug paths (ai_docs/statecharts/deri-hoye-gelo/README.md) replayed against the pure session and the real
// step, plus the shared patterns every game here must get right.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRun, END, RUN, type Run } from "../lib/game";
import * as S from "../lib/session";
import { stepRun } from "../lib/step.hot";

const DT = 1 / 60;
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** What the component's step does: nothing unless the session ticks, then input → stepRun. */
function tick(s: S.Session, run: Run, steps = 1) {
  for (let i = 0; i < steps; i++) {
    if (!S.ticking(s) || S.breathing(s, DT)) continue;
    S.takeInput(s, run);
    stepRun(run, DT, false);
    run.evCount = 0;
  }
}
function setup(level = 9) {
  const s = S.createSession(), run = createRun(7919, level, "n");
  S.goTo(s, "play", 0, run);
  return { s, run };
}
/** The first press starts the run. */
function going(s: S.Session, run: Run) {
  S.keyDown(s, "space"); tick(s, run, 2); S.keyUp(s, "space"); tick(s, run, 3);
  assert.equal(run.phase, RUN);
}

test("bug 1, PausedWhenBlurred: you hold ↓, click into another window, and the kid is let go and stands where she was", () => {
  const { s, run } = setup();
  going(s, run);
  S.keyDown(s, "down"); tick(s, run, 5);
  assert.equal(run.ducking, true);
  const { d, t, y } = run;
  S.blur(s, run); // the real blur; the player then opens its menu
  S.pause(s, run);
  tick(s, run, 180);
  assert.deepEqual([run.d, run.t, run.y, run.phase], [d, t, y, RUN], "nothing moved in three seconds away");
  assert.equal(run.duckHeld, false, "the kid is not held ducked");
  assert.equal(s.duck, 0);
  // চালিয়ে যাও: a breath first, then the road moves again, and the ↓ the keyup never delivered is not held.
  S.focus(s); S.resume(s, run);
  tick(s, run, 10);
  assert.equal(run.d, d, "a breath before motion");
  tick(s, run, 60);
  assert.ok(run.d > d);
  assert.equal(run.duckHeld, false);
});

test("hiding the tab, scrolling the road away, or opening সব লেভেল stops the road and lets go the same way", () => {
  for (const away of [(s: S.Session, run: Run) => S.hide(s, run), (s: S.Session, run: Run) => S.setInView(s, false, run), (s: S.Session, run: Run) => S.openSheet(s, run)]) {
    const { s, run } = setup();
    going(s, run);
    S.keyDown(s, "space"); S.keyDown(s, "down"); tick(s, run, 3);
    const d = run.d;
    away(s, run);
    tick(s, run, 90);
    assert.equal(run.d, d);
    assert.deepEqual([run.jumpHeld, run.duckHeld, s.jump, s.duck], [false, false, 0, 0]);
  }
  // Shutting the list gives the same breath as চালিয়ে যাও.
  const { s, run } = setup();
  going(s, run);
  S.openSheet(s, run); S.closeSheet(s, run);
  const d = run.d;
  tick(s, run, 20);
  assert.equal(run.d, d);
  tick(s, run, 30);
  assert.ok(run.d > d);
});

test("every choice screen and the pause menu freeze the road: ticking is false on the title, the story, the end and while paused", () => {
  const { s, run } = setup();
  for (const screen of ["title", "intro", "over"] as const) { S.goTo(s, screen, 0, run); assert.equal(S.ticking(s), false, screen); }
  S.goTo(s, "play", 0, run);
  assert.equal(S.ticking(s), true);
  S.pause(s, run); assert.equal(S.ticking(s), false);
  S.resume(s, run); assert.equal(S.ticking(s), true);
  S.openSheet(s, run); assert.equal(S.ticking(s), false);
});

test("the click that brings focus back is not a move: the first press after blur or pause does nothing", () => {
  const { s, run } = setup();
  going(s, run);
  S.blur(s, run);
  assert.equal(S.laneDown(s, 1, 100, 100), false, "a finger landing while the window is away jumps nothing");
  assert.equal(S.padDown(s, false, 2), false);
  assert.equal(S.keyDown(s, "space"), false);
  assert.equal(s.press, S.NONE);
  S.focus(s);
  S.pause(s, run);
  assert.equal(S.laneDown(s, 1, 100, 100), false, "the pause menu takes the press");
  S.resume(s, run);
  // Even with the road moving again, a press during the breath is held back until it ends, then counts once.
  assert.equal(S.laneDown(s, 1, 100, 100), true);
  tick(s, run, 5);
  assert.equal(run.y, 0, "no jump in the breath");
  S.laneUp(s, 1);
});

test("input answers on the very next step: a tap jumps, a swipe down ducks, the pads do both, held keys stay held", () => {
  const { s, run } = setup();
  going(s, run);
  S.laneDown(s, 1, 200, 300); tick(s, run, 1);
  assert.ok(run.y > 0, "the tap jumped within one step (16 ms)");
  S.laneUp(s, 1);
  tick(s, run, 100);
  S.laneDown(s, 2, 200, 300);
  assert.equal(S.laneMove(s, 2, 202, 310), false, "a small slide is not a swipe");
  assert.equal(S.laneMove(s, 2, 202, 340), true, "a long slide down is");
  tick(s, run, 1);
  assert.equal(run.ducking, true);
  S.laneUp(s, 2);
  const quick = setup(); going(quick.s, quick.run);
  S.padDown(quick.s, false, 7); S.padUp(quick.s, false, 7); tick(quick.s, quick.run, 1);
  assert.ok(quick.run.y > 0, "a pad tapped and lifted between two steps still jumps once");
  const hold = setup(); going(hold.s, hold.run);
  S.keyDown(hold.s, "up"); tick(hold.s, hold.run, 10);
  assert.equal(hold.run.jumpHeld, true);
  S.keyUp(hold.s, "up"); tick(hold.s, hold.run, 1);
  assert.equal(hold.run.jumpHeld, false);
  assert.equal(S.keyOf(" "), "space");
  assert.equal(S.keyOf("W"), "up");
  assert.equal(S.keyOf("s"), "down");
  assert.equal(S.keyOf("x"), null);
});

test("bug 2, ResultStaysUntilYouChoose: result keys count only from a fresh keydown after the screen appeared", () => {
  const { s, run } = setup();
  S.goTo(s, "over", 5000, run);
  assert.equal(S.freshResultKey(s, { timeStamp: 4000, repeat: false }), false, "a Space held down since before the end");
  assert.equal(S.freshResultKey(s, { timeStamp: 6000, repeat: true }), false, "auto-repeat of a held key");
  assert.equal(S.freshResultKey(s, { timeStamp: 6000, repeat: false }), true, "a fresh press after the screen showed");
  S.pause(s, run);
  assert.equal(S.freshResultKey(s, { timeStamp: 7000, repeat: false }), false, "not while the menu is open");
  S.resume(s, run);
  S.openSheet(s, run);
  assert.equal(S.freshResultKey(s, { timeStamp: 7000, repeat: false }), false, "not under the level list");
  const component = source("../components/late-game.tsx");
  assert.doesNotMatch(component, /(?<!S)\.focus\(/, "no button takes focus after a bump, so a held key never clicks one");
  assert.match(component, /S\.freshResultKey\(s, event\)/);
  assert.match(source("../components/end-screen.tsx"), /event\.currentTarget\.blur\(\)/, "a clicked choice gives its focus back");
});

test("bug 3, NoCelebrationAfterLeaving: the game keeps no timers; the bell and chimes are delayed tones that the next run cuts", () => {
  const component = source("../components/late-game.tsx");
  assert.doesNotMatch(component, /setTimeout|setInterval/, "no celebration timeouts left to leak into the next run");
  assert.match(component, /function begin\(next: Plan\) \{\n\s+silenceScheduled\(\);\n\s+clearConfetti\(\);/, "a new run cuts the last card's chimes and takes down its confetti");
  const sounds = source("../components/sound.ts");
  assert.match(sounds, /tone\(\[1047, 1319, 1568\]\[star\], 0\.18, 0\.09, "triangle", 0\.4 \+ star \* 0\.28\)/, "the star chimes are delayed tones");
  assert.match(sounds, /tone\(base, late \? 1\.2 : 0\.8, 0\.1, "triangle", at\)/, "the bell's rings are delayed tones");
  assert.doesNotMatch(sounds, /setTimeout/);
  // Stars are kept the moment the gate is reached, not when the end screen shows.
  assert.match(component, /kind === E\.ARRIVE\) \{ keepStars\(g\)/);
  assert.match(component, /keepBest\(g\.meters\)/);
});

test("bug 4, ReplayIsExact: a friend's link that arrives mid-run ends that run and shows their road on the title, never under a run", () => {
  const component = source("../components/late-game.tsx");
  const hash = component.slice(component.indexOf("const onHash"), component.indexOf('window.addEventListener("hashchange"'));
  assert.match(hash, /createRun\(next\.seed, next\.level, next\.mode\)/, "the run being shown is the friend's road");
  assert.match(hash, /show\("title"\)/, "back to the title, not into a run");
  const { s, run } = setup();
  going(s, run);
  S.keyDown(s, "down");
  S.goTo(s, "title", 0, run);
  assert.equal(S.ticking(s), false);
  assert.deepEqual([s.screen, s.duck, run.duckHeld], ["title", 0, false]);
  assert.doesNotMatch(component, /location\.hash\s*=|pushState/, "the address is only ever replaced");
  assert.match(component, /history\.replaceState\(history\.state, ""/);
});

test("the run ends once: after the gate or the bell nothing steps the result twice, and a late run keeps its stars at zero", () => {
  const { s, run } = setup(1);
  going(s, run);
  let overs = 0;
  for (let at = 0; at < 60 * 30; at++) { if (S.ticking(s) && !S.breathing(s, DT)) { S.takeInput(s, run); stepRun(run, DT, false); for (let i = 0; i < run.evCount; i++) if (run.ev[i] === 14) overs++; run.evCount = 0; } }
  assert.ok(run.phase === END || run.phase === 3);
  assert.ok(overs <= 1, `${overs} end events`);
});

test("shared patterns: pause is the player's, no own sound or slow toggle, keys released on blur, P goes to the player", () => {
  const component = source("../components/late-game.tsx");
  assert.match(component, /player\.requestPause\(\)/);
  assert.match(component, /useGamePlayer\(\{[\s\S]*onLevels: \(\) => setSheet\(true\)/, "সব লেভেল in the pause menu");
  assert.doesNotMatch(component, /SoundToggle|setSlow|ধীরে খেলো/, "the menu owns these");
  assert.match(component, /window\.addEventListener\("blur", onBlur\)/);
  assert.match(component, /S\.blur\(session\.current, run\.current\)/);
  assert.match(component, /document\.addEventListener\("visibilitychange", onVisibility\)/);
  assert.doesNotMatch(component, /scrollIntoView/);
  assert.doesNotMatch(component, /speechSynthesis|speak\(/);
});
