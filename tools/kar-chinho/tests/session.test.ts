// Every bug path from ai_docs/statecharts/kar-chinho/README.md, replayed against the pure page logic (lib/session.ts)
// and the round (lib/round.ts), plus the shared patterns from the rewrite brief.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { answer, createRound, currentItem, isLast, nextWord, resultOf } from "../lib/round";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const game = readFileSync(join(root, "components/game.tsx"), "utf8");

/** Plays to the last word and taps it right: what the component's pick() does, in order. */
function toLastRight(s: S.Session, over = false) {
  let round = createRound(1, 9);
  while (!isLast(round)) {
    assert.equal(S.tapTile(s), "counts");
    round = answer(round, currentItem(round).kar);
    assert.equal(S.solved(s, false, false), false);
    S.timerFires(s, 0);
    round = nextWord(round);
  }
  assert.equal(S.tapTile(s), "counts");
  round = answer(round, currentItem(round).kar);
  return { round, record: S.solved(s, true, over) };
}

test("bug 6, EveryFinishCounts: all ten words right, then the level list or a restart within 1.1 s, and the stars still count", () => {
  for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.toTitle(s); S.openLevels(s); }, (s: S.Session) => { S.pause(s); S.toTitle(s); }]) {
    const s = S.createSession();
    assert.ok(S.begin(s, false));
    const { round, record } = toLastRight(s);
    assert.ok(record, "the round is recorded at the last tap");
    assert.equal(s.recorded, s.serial);
    assert.equal(resultOf(round).stars, 3);
    leave(s);
    S.timerFires(s, 5);
    assert.notEqual(s.screen, "end", "the dead timer never brings the end screen back");
    assert.equal(s.recorded, s.serial);
  }
  // The component records in the same tap, never inside the end timer.
  assert.match(game, /if \(S\.solved\(s, last, last \? kids\.atBreak\(\) : false\)\) \{[\s\S]{0,120}levels\.record\(/);
});

test("bug 4, NoNewRoundPastLimit: past today's limit, খেলো, আবার খেলো and a level from the list show the rest screen, not a round", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.ok(S.restShows(s));
  assert.equal(S.tapTile(s), "ignored");
  S.extend(s);
  assert.ok(S.begin(s, false), "a grown-up's ten minutes open the next round");
  // From the end screen too.
  toLastRight(s, true);
  S.timerFires(s, 10);
  assert.equal(s.screen, "end");
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "end");
  // The component asks atBreak() when a round opens, not only when it ends.
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/);
});

test("RestOnlyAtBreak: the limit passing on the last word waits for the end screen", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s, true);
  assert.equal(s.screen, "play");
  assert.equal(S.restShows(s), false, "never over a word");
  S.timerFires(s, 3);
  assert.ok(S.restShows(s));
});

test("pause freezes the next-word and end timers; চালিয়ে যাও gives them back", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.solved(s, false, false);
  S.pause(s);
  assert.equal(S.timerMayRun(s), false);
  S.timerFires(s, 1);
  assert.equal(s.pending, "next", "nothing moves under the menu");
  S.resume(s);
  assert.ok(S.timerMayRun(s));
  S.timerFires(s, 2);
  assert.equal(s.pending, "none");
  // The player's pause is wired: it stops the pending timer and re-arms it after a breath.
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); stopPending\(\);/);
  assert.match(game, /onResume: \(\) => \{ S\.resume\(session\.current\); if \(session\.current\.pending !== 'none'\) armPending\(BREATH_MS\)/);
});

test("the tap that brings focus back is not a move", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapTile(s), "woke");
  assert.equal(S.tapTile(s), "counts");
  // When the player's menu took the tap, resume clears it: the next tap counts.
  S.blur(s); S.pause(s); S.resume(s);
  assert.equal(S.tapTile(s), "counts");
});

test("no tile counts while paused, mid-hop or off the play screen", () => {
  const s = S.createSession();
  assert.equal(S.tapTile(s), "ignored");
  S.begin(s, false);
  S.pause(s);
  assert.equal(S.tapTile(s), "ignored");
  S.resume(s);
  S.solved(s, false, false);
  assert.equal(S.tapTile(s), "ignored", "the word is hopping to the next one");
});

test("ChoiceFreezesPlay: the level list opens only from the title or the end screen", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.openLevels(s);
  assert.equal(s.screen, "play");
  S.toTitle(s); S.openLevels(s);
  assert.equal(s.screen, "levels");
  S.closeLevels(s);
  assert.equal(s.screen, "title");
});

test("result keys need a fresh press after the end screen appears", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  S.timerFires(s, 100);
  assert.equal(S.freshKey(s, 90, false), false, "held through the last word");
  assert.equal(S.freshKey(s, 150, true), false, "auto-repeat");
  assert.ok(S.freshKey(s, 150, false));
  assert.match(game, /S\.freshKey\(s, event\.timeStamp, event\.repeat\)/);
});

test("bug 5, SilentWhenMuted: the game never speaks (no voice anywhere on the site)", () => {
  for (const file of ["components/game.tsx", "components/title.tsx", "components/end-screen.tsx", "lib/sound.ts"]) {
    const source = readFileSync(join(root, file), "utf8");
    assert.ok(!/\bspeak\(|speechSynthesis|SpeakButton|useBanglaVoice/.test(source), `${file} speaks`);
  }
});

test("bugs 1–3, the parent gate: the share link and print sheet sit only behind it, and it shuts on a tap anywhere else", () => {
  assert.match(game, /<ParentGate key=\{gateKey\} label="বড়দের জন্য">\s*<ShareToolLink/);
  assert.equal((game.match(/<ShareToolLink/g) ?? []).length, 1);
  assert.match(game, /addEventListener\('pointerdown', down, true\)/);
  assert.match(game, /setGateKey\(key => key \+ 1\)/);
});

test("Enter and Space go to the game at the window, never to a stale focused button", () => {
  assert.match(game, /window\.addEventListener\('keydown', down\)/);
  assert.match(game, /key === 'p' \|\| key === 'P'\) \{ event\.preventDefault\(\); player\.requestPause\(\)/);
  assert.ok((game.match(/currentTarget\.blur\(\)/g) ?? []).length + (readFileSync(join(root, "components/title.tsx"), "utf8").match(/currentTarget\.blur\(\)/g) ?? []).length >= 2);
});
