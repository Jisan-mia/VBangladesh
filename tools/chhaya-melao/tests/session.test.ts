// Every bug path from ai_docs/statecharts/chhaya-melao/README.md, replayed against the pure page logic (lib/session.ts) and the
// round (lib/round.ts), plus the shared patterns from the rewrite brief.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { boardDone, createRound, isDone, nextBoard, onLastBoard, place, resultOf, type Round } from "../lib/round";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");
const game = read("components/game.tsx"), css = read("product.css"), end = read("components/end-screen.tsx");
const HOLD = 1500;

/** Matches every shadow of the wall on screen, in order, the way the component's attempt() does; returns whether the round must be recorded. */
function matchWall(s: S.Session, round: Round, over = false): { round: Round; record: boolean } {
  let record = false;
  for (let slot = 0; slot < round.placed.length; slot++) {
    assert.equal(S.touch(s), "counts");
    round = place(round, round.board.shadows[slot].id, slot).round;
    record = S.matched(s, boardDone(round), isDone(round), isDone(round) ? over : false, HOLD) || record;
  }
  return { round, record };
}
/** Plays every wall but the last, with the hold running out between them. */
function toLastWall(s: S.Session, level = 1) {
  let round = createRound(level, 9);
  while (!onLastBoard(round)) {
    ({ round } = matchWall(s, round));
    assert.equal(S.tick(s, HOLD, 1), "next");
    round = nextBoard(round);
  }
  return round;
}

test("NoProgressWhileAway: matching the last shadow and switching apps never ends the round, plays the chime or saves a second time", () => {
  const s = S.createSession();
  assert.ok(S.begin(s, false));
  const round = toLastWall(s);
  const { round: finished, record } = matchWall(s, round, true);
  assert.ok(record, "the stars are recorded at the match itself, with the child there");
  assert.equal(s.recorded, s.serial);
  assert.equal(resultOf(finished).stars, 3);
  S.blur(s);
  for (let ms = 0; ms < 5000; ms += 100) assert.equal(S.tick(s, 100, ms), "none", "no end screen, no chime to an empty room");
  assert.equal(s.screen, "play"); assert.equal(s.hold, HOLD, "the hold waited");
  S.focus(s);
  assert.equal(S.tick(s, 100, 1), "none");
  assert.equal(S.tick(s, HOLD, 2), "end", "back in the room the hold runs out and the end screen comes");
  assert.equal(s.recorded, s.serial, "recorded once");
});

test("NoProgressWhileAway: the next wall never comes while away, paused, or behind the level list", () => {
  for (const hide of [(s: S.Session) => S.blur(s), (s: S.Session) => S.pause(s), (s: S.Session) => S.openLevels(s)]) {
    const s = S.createSession();
    S.begin(s, false);
    matchWall(s, createRound(1, 3));
    hide(s);
    for (let i = 0; i < 100; i++) assert.equal(S.tick(s, 100, i), "none");
    assert.equal(s.hold, HOLD);
  }
  // A hidden tab ('visibilitychange') is the same as a blur: the component sends both to S.blur.
  assert.match(game, /document\.addEventListener\('visibilitychange', onVisibility\)/);
  assert.match(game, /const out = \(\) => \{ S\.blur\(session\.current\); abortAll\(\)/);
});

test("the hold is the only clock, it is kept by the session, and the component's timers are all cleared", () => {
  assert.match(game, /const id = setInterval\(\(\) => \{[\s\S]*?S\.tick\(session\.current, dt, now\)[\s\S]*?clearInterval\(id\)/);
  assert.ok(!/setTimeout\(\(\) => \{ *advance|NEXT_MS/.test(game), "no next-wall timer that blur could miss");
  assert.match(game, /const clearAll = \(\) => \{ for \(const id of small\.current\) clearTimeout\(id\)/);
  assert.match(game, /useEffect\(\(\) => \(\) => \{ clearAll\(\); silenceScheduled\(\); cancelAnimationFrame\(raf\.current\)/);
  assert.match(game, /if \(screen !== 'play' \|\| boardDone\(round\) \|\| !fresh \|\| player\.paused \|\| away\) return;\s*const id = setTimeout\(\(\) => setNudge\(true\), NUDGE_MS\);\s*return \(\) => clearTimeout\(id\)/);
});

test("EveryFinishCounts: the last match saves the stars at once, whatever the hand does next", () => {
  for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.toTitle(s); S.openLevels(s); }, (s: S.Session) => { S.pause(s); S.toTitle(s); }]) {
    const s = S.createSession();
    S.begin(s, false);
    const { record } = matchWall(s, toLastWall(s));
    assert.ok(record);
    leave(s);
    assert.equal(S.tick(s, 5000, 5), "none");
    assert.notEqual(s.screen, "end", "a stale hold never brings the end screen back");
    assert.equal(s.recorded, s.serial);
  }
  assert.match(game, /if \(S\.matched\(s, boardDone\(next\), last, last \? kids\.atBreak\(\) : false, [^)]*\)\) \{[\s\S]{0,120}levels\.record\(/);
});

test("NoNewRoundPastLimit: past today's limit, the lamp, আবার খেলো and a level from the list show the rest screen, not a round", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title"); assert.ok(S.restShows(s)); assert.equal(S.touch(s), "ignored");
  S.extend(s);
  assert.ok(S.begin(s, false), "a grown-up's ten minutes open the next round");
  matchWall(s, toLastWall(s), true);
  assert.equal(S.tick(s, HOLD, 10), "end");
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "end");
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/, "atBreak() is asked when a round opens, not only when it ends");
});

test("RestOnlyAtBreak: the limit passing on the last match waits for the end screen", () => {
  const s = S.createSession();
  S.begin(s, false);
  matchWall(s, toLastWall(s), true);
  assert.equal(s.screen, "play"); assert.equal(S.restShows(s), false, "never over a wall");
  assert.equal(S.tick(s, HOLD, 3), "end");
  assert.ok(S.restShows(s));
});

test("pause freezes play: nothing counts under the menu, and the hold keeps what it had", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.pause(s);
  assert.equal(S.touch(s), "ignored");
  S.resume(s);
  matchWall(s, createRound(1, 2));
  S.tick(s, 600, 1);
  S.pause(s);
  assert.equal(S.tick(s, 5000, 2), "none");
  assert.equal(s.hold, HOLD - 600, "the hold waited with the menu open");
  S.resume(s);
  assert.equal(S.tick(s, HOLD - 600, 3), "next");
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); abortAll\(\)/);
  assert.match(game, /onResume: \(\) => \{ S\.resume\(session\.current\)/);
});

test("the tap that brings focus back is not a move: it lifts no toy and puts none down", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.touch(s), "woke");
  assert.equal(S.touch(s), "counts");
  S.blur(s); S.pause(s); S.resume(s);
  assert.equal(S.touch(s), "counts", "when the player's menu took the tap, the next one counts");
  // A touch while the window is still away counts for nothing.
  S.blur(s);
  assert.equal(S.touch(s), "ignored");
});

test("StrayTap: the level list is not on screen during play, and a level cannot be picked by accident", () => {
  assert.ok(!/LevelGrid/.test(game), "no level grid under the wall");
  assert.match(game, /\{screen === 'levels' && <LevelList/, "the list only shows as its own screen");
  const s = S.createSession();
  S.begin(s, false);
  const round = createRound(1, 4);
  matchWall(s, round);
  S.openLevels(s);
  assert.equal(s.screen, "levels"); assert.equal(s.back, "play");
  assert.equal(S.touch(s), "ignored", "nothing plays under the list");
  S.closeLevels(s);
  assert.equal(s.screen, "play", "closing the list gives the round back");
  assert.equal(S.touch(s), "woke", "and the first tap only wakes it");
  const t = S.createSession();
  S.openLevels(t); assert.equal(t.back, "title"); S.closeLevels(t); assert.equal(t.screen, "title");
  S.begin(t, false); S.toTitle(t); S.openLevels(t); S.closeLevels(t);
  assert.equal(t.screen, "title");
  assert.match(game, /onLevels: openLevels/, "the pause menu's সব লেভেল opens the list");
});

test("NoReadingNeeded: the end buttons are pictures of at least 96 px, equal, above the fold, and the lamp is the start", () => {
  assert.match(end, /<button type="button" className="cs-big" onClick=\{done\(onAgain\)\}>\s*<svg/);
  assert.match(end, /<button type="button" className="cs-big cs-big-done" onClick=\{done\(onDone\)\}>\s*<svg/);
  assert.match(css, /\.cs-big\{[^}]*min-height:112px/);
  assert.match(css, /\.cs-end-actions\{[^}]*grid-template-columns:repeat\(2,minmax\(112px/);
  // The buttons come right after the counts; the parent's lines come after them.
  assert.ok(end.indexOf("cs-end-actions") < end.indexOf("cs-end-news") && end.indexOf("cs-end-count") < end.indexOf("cs-end-actions"));
  assert.ok(end.indexOf("cs-found") < end.indexOf("cs-end-actions"));
  const title = read("components/title.tsx");
  assert.match(title, /className="cs-stall"[\s\S]*<Lamp lit=\{false\}/);
});

test("kids' rules: no voice, no network, no child data, a gate before anything grown-up, no outbound link", () => {
  const files = ["components", "lib"].flatMap(dir => readdirSync(join(root, dir)).map(file => `${dir}/${file}`));
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /\bspeak\(|SpeakButton|speechSynthesis|useBanglaVoice/, `${file}: no voice`);
    assert.doesNotMatch(text, /\bfetch\(|XMLHttpRequest|sendBeacon|\/api\/|share-client|WebSocket|navigator\.vibrate|Math\.random|Date\.now/, `${file}: no network, no raw random or clock`);
    assert.doesNotMatch(text, /<a [^>]*href=|location\.hash\s*=|history\.pushState|\.pushState\(/, `${file}: no link, no history push`);
    assert.doesNotMatch(text, /<input|<textarea|contentEditable/, `${file}: nothing typed`);
  }
  assert.match(game, /<ParentGate key=\{gateKey\} label="বড়দের জন্য">\s*<ShareToolLink/);
  assert.match(read("share.ts"), /normalize: \(\) => null/);
});

test("result keys need a fresh press: a held Space or Enter never skips the end screen or starts the next round", () => {
  const s = S.createSession();
  S.begin(s, false);
  matchWall(s, toLastWall(s));
  assert.equal(S.tick(s, HOLD, 100), "end");
  assert.equal(S.freshKey(s, 90, false), false, "a key that began before the screen came");
  assert.equal(S.freshKey(s, 150, true), false, "a repeating key");
  assert.equal(S.freshKey(s, 150, false), true);
  assert.match(game, /s\.screen === 'end' && \(key === 'Enter' \|\| key === ' '\)\) \{ event\.preventDefault\(\); if \(S\.freshKey\(s, event\.timeStamp, event\.repeat\)\)/);
});

test("Enter and Space go to the game: end buttons blur after a click, and keys are read at the window", () => {
  assert.match(end, /const done = \(action: \(\) => void\) => \(event: \{ currentTarget: HTMLButtonElement \}\) => \{ event\.currentTarget\.blur\(\); action\(\)/);
  assert.match(game, /window\.addEventListener\('keydown', down\)/);
  assert.match(game, /if \(key === 'p' \|\| key === 'P'\) \{ event\.preventDefault\(\); player\.requestPause\(\)/);
});

test("compat: the saved-progress key and the #og demo keep their meaning; no hash or history changes", () => {
  assert.match(game, /const SLUG = 'chhaya-melao'/);
  assert.match(game, /useLevels\(SLUG, LEVEL_COUNT\)/);
  assert.match(read("lib/lines.ts"), /isOgHash = \(hash: string\) => hash === "#og"/);
  assert.doesNotMatch(game, /location\.hash\s*=|history\./);
});

test("the player: the page is a GamePage in kids mode, and the game reads useGamePlayer", () => {
  const page = read("page.tsx");
  assert.match(page, /<GamePage site=\{site\} kids /);
  assert.match(game, /useGamePlayer\(\{[\s\S]*onPause[\s\S]*onResume[\s\S]*onRestart[\s\S]*onLevels: openLevels/);
  assert.doesNotMatch(game, /SoundToggle|useSound\(|setSlow|aria-pressed/, "the player's menu owns the sound and slow switches");
});
