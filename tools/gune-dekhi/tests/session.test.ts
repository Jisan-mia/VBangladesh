// Every bug path from ai_docs/statecharts/gune-dekhi/README.md, replayed against the pure page logic (lib/session.ts),
// the round (lib/round.ts) and the tap recogniser (lib/tap.ts), plus the shared patterns from the rewrite brief.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { answer, answerOf, createRound, isLast, nextItem, resultOf, tapFish, type Round } from "../lib/round";
import * as S from "../lib/session";
import { TAP_MS, TAP_SLOP, pressEnd, pressStart } from "../lib/tap";
import { share } from "../share";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const game = read("components/game.tsx"), css = read("product.css");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

/** Plays up to the last pond and answers it right: what the component does, in order. */
function toLastRight(s: S.Session, over = false) {
  let round: Round = createRound(5, 9);
  while (!isLast(round)) {
    assert.equal(S.tapOn(s), "counts");
    round = answer(round, answerOf(round)).round;
    assert.equal(S.solved(s, false, false), false);
    S.timerFires(s, 0);
    round = nextItem(round)!;
  }
  assert.equal(S.tapOn(s), "counts");
  round = answer(round, answerOf(round)).round;
  return { round, record: S.solved(s, true, over) };
}

test("bug 1, FinishCounts: the fifth pond right, then anything else within 1.1 s, and the stars still count", () => {
  for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.toTitle(s); S.openLevels(s); }, (s: S.Session) => { S.pause(s); S.toTitle(s); }, (s: S.Session) => S.openLevels(s)]) {
    const s = S.createSession();
    assert.ok(S.begin(s, false));
    const { round, record } = toLastRight(s);
    assert.ok(record, "the round is recorded at the last tap");
    assert.equal(s.recorded, s.serial);
    assert.equal(resultOf(round).stars, 3);
    leave(s);
    S.timerFires(s, 5);
    assert.equal(s.recorded, s.serial);
  }
  // The component records in the same tap, never inside the end timer, and no mode button is left to restart the round.
  assert.match(game, /if \(S\.solved\(s, last, last \? kids\.atBreak\(\) : false\)\) \{[\s\S]{0,160}levels\.record\(/);
  assert.doesNotMatch(game, /gd-modes/);
});

test("bug 3, GlimpseOnlyWhileWatching: the 1.5 s never run out while you look away; they run in full when you are back", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.showPattern(s);
  assert.ok(S.glimpseMayRun(s));
  S.blur(s);
  assert.equal(S.glimpseMayRun(s), false, "no clock while away");
  assert.equal(S.glimpseEnds(s), false, "a stale timer cannot hide the pattern");
  assert.ok(s.looking);
  S.focus(s);
  assert.ok(S.glimpseMayRun(s));
  // The player's menu is the same: nothing runs under it.
  S.pause(s);
  assert.equal(S.glimpseEnds(s), false);
  S.resume(s);
  assert.ok(S.glimpseEnds(s));
  assert.equal(s.looking, false);
  // The level list too.
  S.showPattern(s); S.openLevels(s);
  assert.equal(S.glimpseEnds(s), false);
  S.closeLevels(s);
  assert.ok(S.glimpseEnds(s));
  // The component re-arms a full 1.5 s whenever it is watched again.
  assert.match(game, /GLIMPSE_MS = 1500/);
  assert.match(game, /\[looking, screen, watch, glimpseKey/);
});

test("bug 2, SilentWhenMuted: the game has no voice at all", () => {
  for (const file of files(root)) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /speak\(|SpeakButton|speechSynthesis|useBanglaVoice|SpeechSynthesisUtterance/, file);
  }
});

test("bug 4, ParentGate: GamePage with the kids frame, and nothing in the game links out", () => {
  const page = read("page.tsx");
  assert.match(page, /<GamePage site=\{site\} kids /);
  assert.doesNotMatch(page, /PageFrame/);
  for (const file of files(root).filter(name => name.endsWith(".tsx"))) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /<a\s|<Link|href=\{?["'`]\//, file);
  }
  assert.match(game, /<ParentGate key=\{gateKey\} label="বড়দের জন্য"><ShareToolLink/, "sharing the address is behind the gate");
});

test("bug 5, NoReadingNeeded: the end buttons are pictures, at least 96 px", () => {
  const end = read("components/end-screen.tsx");
  assert.match(end, /<AgainIcon \/>/); assert.match(end, /<DoneIcon \/>/);
  const big = css.match(/\.gd-big\{[^}]*min-height:(\d+)px/);
  assert.ok(big && Number(big[1]) >= 96, "the picture buttons are tall enough");
  assert.match(css, /\.gd-tile\{[^}]*min-height:96px/);
  assert.match(css, /\.gd-close\{[^}]*width:56px/);
});

test("gap 1, a scroll that starts on the pond counts no fish; a tap does", () => {
  const down = { pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: 200, timeStamp: 1000 };
  const fish = {};
  const press = pressStart(down, fish);
  assert.ok(press);
  // A tap: up in the same spot, soon after.
  assert.ok(pressEnd(press, { pointerId: 1, clientX: 103, clientY: 201, timeStamp: 1090 }, fish));
  // A scroll: the finger moved, the browser sends pointercancel (the component drops the press) or the finger lifts far away.
  assert.equal(pressEnd(press, { pointerId: 1, clientX: 100, clientY: 200 + TAP_SLOP + 20, timeStamp: 1120 }, fish), false);
  assert.equal(pressEnd(null, { pointerId: 1, clientX: 100, clientY: 200, timeStamp: 1100 }, fish), false);
  assert.equal(pressEnd(press, { pointerId: 1, clientX: 100, clientY: 200, timeStamp: 1000 + TAP_MS + 50 }, fish), false, "a long rest is not a tap");
  assert.equal(pressEnd(press, { pointerId: 1, clientX: 100, clientY: 200, timeStamp: 1050 }, {}), false, "up on something else");
  assert.equal(pressEnd(press, { pointerId: 2, clientX: 100, clientY: 200, timeStamp: 1050 }, fish), false, "another finger");
  assert.equal(pressStart({ ...down, isPrimary: false }, fish), null, "a second finger or palm starts nothing");
  assert.equal(pressStart({ ...down, button: 2 }, fish), null);
  assert.match(game, /onPointerUp:[\s\S]{0,200}pressEnd\(/);
  assert.match(game, /onPointerCancel: \(\) => \{ press\.current = null; \}/);
  assert.doesNotMatch(game, /onPointerDown=\{[^}]*(onFish|onAnswer)/, "nothing acts on pointerdown");
  // A fish counts once even if the lift happens twice.
  let round = createRound(1, 3);
  round = tapFish(round, 0)!;
  assert.equal(tapFish(round, 0), null);
});

test("gap 2, one stray tap restarts nothing: play has no mode buttons or drawer, the list opens only by choice", () => {
  assert.doesNotMatch(game, /restart\(|gd-drawer|MODES/);
  // The list from the player's menu keeps the pond: closing goes back to play, the same pond waiting.
  const s = S.createSession();
  S.begin(s, false);
  const serial = s.serial;
  S.openLevels(s);
  assert.equal(s.screen, "levels");
  assert.equal(S.tapOn(s), "ignored", "nothing is tappable under the list");
  S.closeLevels(s);
  assert.equal(s.screen, "play");
  assert.equal(s.serial, serial, "the round was not restarted");
});

test("gap 3, the game starts at the top of the stage", () => {
  assert.match(css, /\.gd\{[^}]*justify-content:flex-start/);
  assert.match(css, /\.gd-title\{[^}]*justify-content:flex-start/);
});

test("pause freezes the next-pond and end timers and the glimpse; resume gives them back", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.solved(s, false, false);
  assert.ok(S.timerMayRun(s));
  S.pause(s);
  assert.equal(S.timerMayRun(s), false);
  S.timerFires(s, 1);
  assert.equal(s.pending, "next", "a stale timer does nothing under the menu");
  S.resume(s);
  assert.ok(S.timerMayRun(s));
  S.blur(s);
  assert.equal(S.timerMayRun(s), false, "nor while the window is away");
  S.focus(s);
  S.timerFires(s, 2);
  assert.equal(s.pending, "none");
  assert.match(game, /onPause: \(\) => \{ S\.pause\(s\); stopPending\(\); sync\(\); \}/);
});

test("the tap that brings focus back is not a move", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapOn(s), "woke");
  assert.equal(S.tapOn(s), "counts");
  // The player's menu takes that first tap itself.
  S.blur(s); S.pause(s); S.focus(s); S.resume(s);
  assert.equal(S.tapOn(s), "counts");
});

test("RestOnlyAtBreak and NoNewRoundPastLimit: the rest screen waits for the end of a round, and past the limit no round starts", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.ok(S.restShows(s));
  assert.equal(S.tapOn(s), "ignored");
  S.extend(s);
  assert.ok(S.begin(s, false));
  const { record } = toLastRight(s, true);
  assert.ok(record);
  assert.equal(S.restShows(s), false, "never over a pond: the last answer's own timer is still on the play screen");
  S.timerFires(s, 10);
  assert.equal(s.screen, "end");
  assert.ok(S.restShows(s), "the rest screen comes with the end screen");
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "end");
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/, "opening a round asks the limit too");
});

test("the level list is a choice screen: nothing advances under it, and a pending timer waits", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.solved(s, false, false);
  S.openLevels(s);
  assert.equal(S.timerMayRun(s), false);
  S.timerFires(s, 3);
  assert.equal(s.pending, "next");
  S.closeLevels(s);
  assert.ok(S.timerMayRun(s));
  assert.match(game, /onLevels: \(\) => openLevels\(\)/);
});

test("result keys need a fresh press after the end screen appears, never a held or repeating key", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  S.timerFires(s, 100);
  assert.equal(s.screen, "end");
  assert.equal(S.freshKey(s, 90, false), false, "a key pressed before the screen appeared");
  assert.equal(S.freshKey(s, 150, true), false, "auto-repeat");
  assert.ok(S.freshKey(s, 150, false));
  assert.match(game, /key === 'Enter' \|\| key === ' '\)\) \{ event\.preventDefault\(\); if \(S\.freshKey/);
});

test("a won round is recorded even if the child leaves during the finish timer", () => {
  const s = S.createSession();
  S.begin(s, false);
  const { record } = toLastRight(s);
  assert.ok(record);
  S.toTitle(s);
  assert.equal(s.recorded, s.serial);
  S.begin(s, false);
  assert.notEqual(s.recorded, s.serial, "the new round is its own");
});

test("kids: no network, no child data, share is only the plain link", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
  const sources = [...files(root), join(root, "../../app/gune-dekhi/page.tsx")];
  assert.ok(sources.length >= 14);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\/|location\.hash|pushState/, file);
    assert.doesNotMatch(text, /Math\.random|Date\.now\(\)/, file);
    nfc(text);
  }
  assert.doesNotMatch(game, /<input|<textarea/);
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("শিশুদের সংখ্যা শেখানোর খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^প্রতিটা জিনিস একবার করে ছুঁয়ে/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});

test("saved progress and the address keep working: the same storage key and slug", () => {
  assert.match(game, /const SLUG = 'gune-dekhi'/);
  assert.match(game, /useLevels\(SLUG, LEVEL_COUNT\)/);
  assert.equal(site.slug, "gune-dekhi");
  assert.equal(site.socialImage, "/social/gune-dekhi.png");
});
