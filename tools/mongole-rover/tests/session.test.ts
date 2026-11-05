// Every bug path from ai_docs/statecharts/mongole-rover/README.md, replayed against the pure page logic (lib/session.ts) and
// the run's clock (lib/run.hot.ts), plus the shared patterns from the rewrite brief and the kids' rules.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { BEST, levelOf } from "../lib/levels";
import { resultOf } from "../lib/play";
import { makeClock } from "../lib/run";
import { giveBreath, tick, STEP_MS } from "../lib/run.hot";
import { runPlan } from "../lib/rover";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");
const game = read("components/game.tsx"), end = read("components/end-screen.tsx"), css = read("product.css"), story = read("components/story.tsx"), page = read("page.tsx");

/** Starts level 3 and the run, the way go() does. */
function started(now = 1000) {
  const s = S.createSession();
  assert.ok(S.begin(s, false));
  assert.equal(S.tapGo(s, now, false), "run");
  return s;
}
/** The component's frame loop in miniature: the clock only moves while the session is live; coming back gives a breath. */
function frames(s: S.Session, clock: ReturnType<typeof makeClock>, ms: number, state = { held: false }) {
  for (let spent = 0; spent < ms; spent += 16) {
    if (!S.live(s)) { state.held = true; continue; }
    if (state.held) { giveBreath(clock); state.held = false; }
    tick(clock, 16);
  }
  return state;
}

test("OneTapOneRun: a quick second tap on the stop button, or a held Enter, never cancels the run before it moves", () => {
  const s = started(1000);
  assert.equal(S.tapStop(s, 1150), "ignored", "150 ms after চালাও");
  assert.equal(S.tapStop(s, 1000 + S.STOP_GUARD_MS - 1), "ignored");
  assert.equal(s.screen, "run");
  assert.equal(S.tapGo(s, 1200, false), "ignored", "চালাও again does nothing while it runs");
  assert.equal(s.runs, 1);
  assert.equal(S.tapStop(s, 1000 + S.STOP_GUARD_MS), "ignored", "even after the guard, not before the rover has moved (the clock was held: away, or the menu)");
  S.stepped(s);
  assert.equal(S.tapStop(s, 1000 + S.STOP_GUARD_MS), "stopped", "a real stop later works");
  assert.equal(s.screen, "plan");
  // চালাও and থামাও are two buttons with their own keys, in different places, never one reused slot.
  assert.match(game, /className="mr-stop"/);
  assert.match(game, /key="stop"/);
  assert.match(game, /data-cmd="go" key="go"/);
  assert.ok(!/running\s*\?[^:]*থামাও/.test(game), "no ternary swaps চালাও for থামাও");
  assert.match(css, /\.mr-stop\{position:absolute;inset:0/, "the stop button sits over the pad, not under the finger on চালাও");
  // A held Enter or Space during a run is swallowed; it never stops, runs or skips anything.
  assert.match(game, /if \(s\.screen === "run"\) \{\s*if \(key === "Backspace"\)[^}]*halt\(\); \}\s*else if \(key === "Enter" \|\| key === " "\) event\.preventDefault\(\);/);
});

test("NoProgressWhileAway: the rover does not drive, lift or win while you look away; it goes on after a breath", () => {
  const s = started();
  const clock = makeClock(runPlan(levelOf(3), BEST[2].arrows).steps.length, false, true);
  const held = frames(s, clock, 400);
  assert.equal(clock.reached, 1);
  S.blur(s);
  frames(s, clock, 8000, held);
  assert.equal(clock.reached, 1, "8 s away: not one step");
  assert.equal(clock.ended, false);
  S.focus(s);
  frames(s, clock, 200, held);
  assert.equal(clock.reached, 1, "the breath after coming back");
  frames(s, clock, STEP_MS + 400, held);
  assert.ok(clock.reached >= 2);
  // The same for the player's menu and a hidden tab (the game sees blur or visibility).
  S.pause(s);
  const at = clock.reached;
  frames(s, clock, 5000, held);
  assert.equal(clock.reached, at);
  assert.match(game, /if \(!S\.live\(session\.current\)\) \{ held = true; last = 0; return; \}/);
  assert.match(game, /window\.addEventListener\("blur", out\)/);
  assert.match(game, /document\.addEventListener\("visibilitychange"/);
});

test("EveryFinishCounts: the last rock saves the stars at once; the end screen only waits", () => {
  const s = started();
  assert.ok(S.lifted(s, false), "the caller records now");
  assert.equal(s.recorded, s.serial);
  assert.equal(S.lifted(s, false), false, "once");
  assert.equal(S.tapStop(s, 99999), "ignored", "a stop after the last rock cannot undo it");
  S.openLevels(s);
  assert.equal(S.showWon(s, 5), false, "a stale timer never brings the end screen back");
  assert.equal(s.recorded, s.serial);
  assert.match(game, /if \(!S\.lifted\(s, session2\.atBreak\(\)\)\) return;[\s\S]{0,260}store\.record\(/);
  assert.ok(!/setTimeout/.test(game), "no timer in the game: the run's clock is the only one");
  assert.equal(resultOf(3, BEST[2].plan, 1).stars, 3);
});

test("NoNewRoundPastLimit: past today's limit, খেলো, আবার খেলো and a level from the list show the rest screen, not a level", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.ok(S.restShows(s));
  assert.equal(S.tapEdit(s), "ignored");
  S.extend(s);
  assert.ok(S.begin(s, false));
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\), story\)/, "atBreak() is asked when a level opens, not only when it ends");
});

test("a level opening past the limit changes nothing but the rest screen: the end screen and its saved stars stay under it", () => {
  const s = started();
  S.lifted(s, false); S.showWon(s, 10);
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "won");
  assert.equal(s.recorded, s.serial);
  assert.ok(S.restShows(s));
  // The component resets the board and clears the result only after S.begin says the level starts.
  const begin = game.slice(game.indexOf("function begin(id: number)"), game.indexOf("function endStory()"));
  assert.ok(begin.indexOf("S.begin(") < begin.indexOf("setResult(null)"), "setResult(null) comes after the check");
  assert.ok(begin.indexOf("S.begin(") < begin.indexOf("resetBoard("));
});

test("RestOnlyAtBreak: never over the rover driving; after a missed run, or when the level ends, it may show", () => {
  const s = started();
  assert.ok(S.lifted(s, true));
  assert.equal(S.restShows(s), false, "the limit passing at the last rock waits for the end screen");
  assert.ok(S.live(s), "the closing beat still plays");
  assert.ok(S.showWon(s, 3));
  assert.ok(S.restShows(s));
  const m = started();
  assert.ok(S.missed(m, true));
  assert.ok(S.restShows(m), "a missed run is a natural break");
  assert.equal(S.tapGo(m, 5000, false), "ignored", "no run starts behind the rest screen");
  assert.match(game, /S\.missed\(s, now\.current\.kids\.atBreak\(\)\)/);
  assert.match(game, /const restUp = kids\.resting && screen !== "run"/);
});

test("pause freezes play: no block, no চালাও, no stop under the menu; চালিয়ে যাও gives the hand back", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.pause(s);
  assert.equal(S.tapEdit(s), "ignored");
  assert.equal(S.tapGo(s, 10, false), "ignored");
  S.resume(s);
  assert.equal(S.tapGo(s, 20, false), "run");
  S.pause(s);
  assert.equal(S.tapStop(s, 9999), "ignored");
  assert.equal(S.live(s), false);
  assert.match(game, /onPause: \(\) => \{ S\.pause/);
});

test("the tap that brings focus back is not a move", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapEdit(s), "woke");
  assert.equal(S.tapEdit(s), "counts");
  S.blur(s); S.focus(s);
  assert.equal(S.tapGo(s, 10, false), "woke");
  assert.equal(S.tapGo(s, 20, false), "run");
  S.stepped(s);
  S.blur(s); S.focus(s);
  assert.equal(S.tapStop(s, 5000), "woke", "the first tap back never stops the run");
  assert.equal(S.tapStop(s, 5001), "stopped");
});

test("result keys need a fresh press that started after the screen appeared; Enter goes to the game", () => {
  const s = started();
  S.lifted(s, false);
  S.showWon(s, 100);
  assert.equal(S.freshKey(s, 90, false), false, "a key pressed before the screen");
  assert.equal(S.freshKey(s, 150, true), false, "an auto-repeat");
  assert.equal(S.freshKey(s, 150, false), true);
  assert.match(game, /window\.addEventListener\("keydown", down\)/);
  assert.match(game, /S\.freshKey\(s, event\.timeStamp, event\.repeat\)/);
  assert.match(end, /event\.currentTarget\.blur\(\)/, "end buttons blur after a click");
});

test("arrow keys play the game on a desktop; R is আরেক বার; Backspace removes; P pauses through the player", () => {
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) assert.match(game, new RegExp(key));
  assert.match(game, /key === "r" \|\| key === "R"/);
  assert.match(game, /key === "Backspace"/);
  assert.match(game, /player\.requestPause\(\)/);
  assert.match(game, /if \(event\.ctrlKey \|\| event\.metaKey \|\| event\.altKey \|\| player\.paused\) return/, "game keys are ignored while paused");
  assert.match(game, /if \(!event\.repeat\)/, "no auto-repeat adds a block");
});

test("the story plays on the first run only, a tap shows the next panel and a 0.6 s hold skips", () => {
  assert.match(story, /const HOLD = 600/);
  assert.match(story, /window\.clearTimeout\(timer\.current\)/);
  assert.match(story, /onPause: stopHold/);
  assert.match(game, /const story = !storySeen && next === 1 && Object\.keys\(levels\.stars\)\.length === 0/);
  assert.match(game, /ektukhani-intro-\$\{SLUG\}/);
  const s = S.createSession();
  assert.ok(S.begin(s, false, true));
  assert.equal(s.screen, "story");
  assert.equal(S.tapGo(s, 1, false), "ignored", "nothing runs under the story");
  assert.ok(S.storyDone(s));
  assert.equal(s.screen, "plan");
  assert.ok(S.begin(S.createSession(), false, false));
});

test("সব লেভেল opens a choice screen that stops the run; closing returns to the title or the end screen", () => {
  const s = started();
  S.openLevels(s);
  assert.equal(s.screen, "levels");
  assert.equal(S.live(s), false);
  S.closeLevels(s);
  assert.equal(s.screen, "title");
  const w = started();
  S.lifted(w, false); S.showWon(w, 5);
  S.openLevels(w); S.closeLevels(w);
  assert.equal(w.screen, "won");
  assert.match(game, /onLevels: \(\) => \{ runRef\.current = null; S\.openLevels/);
});

test("kids' rules: no voice, no network, no history or hash, end buttons are pictures of at least 96 px, nothing outside the gate", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(root);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /speechSynthesis|SpeakButton|\bspeak\(|useBanglaVoice/, `${file} uses a voice`);
    assert.doesNotMatch(source, /location\.hash\s*=|history\.pushState|\.pushState\(|\bfetch\s*\(/, file);
  }
  // The end screen's three buttons each carry a picture.
  for (const klass of ["mr-big-next", "mr-big\"", "mr-big mr-big-done"]) assert.match(end, new RegExp(`className="${klass.replace('"', "")}[^>]*>\\{ICONS\\.`));
  assert.match(css, /\.mr-big\{min-height:112px\}/);
  assert.match(css, /\.mr-big-next\{[^}]*min-height:96px/);
  // The arrow pad, the buttons and the queue ticket keep touch sizes.
  assert.match(css, /\.mr-arrow,\.mr-repeat,\.mr-back,\.mr-go,\.mr-stop\{[^}]*min-height:7[2-9]px/);
  assert.match(page, /<GamePage site=\{site\} kids/);
  assert.match(game, /<ParentGate key=\{gateKey\}/);
  assert.equal((game.match(/ShareToolLink/g) ?? []).length, 2, "the share link is only inside the gate");
});

test("compatibility: saved stars keep their key, and the card, the og demo and the share stay", () => {
  assert.match(game, /useLevels\(SLUG, LEVEL_COUNT\)/);
  assert.equal(read("share.ts").includes("normalize: () => null"), true);
  assert.match(game, /location\.hash !== "#og"/);
  assert.match(game, /const OG_LEVEL = 12/);
});
