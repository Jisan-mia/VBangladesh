// The statechart's bug paths, replayed against the pure session (ai_docs/statecharts/sur-banai/README.md).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { DRAFT_KEY, draftText, readDraft } from "../lib/draft";
import { emptyTune, parseTune } from "../lib/music";
import * as S from "../lib/session";

const here = (name: string) => readFileSync(join(import.meta.dirname, "..", name), "utf8");
const free = () => { const s = S.createSession(); assert.equal(S.begin(s, false, true), true); return s; };
const level = () => { const s = S.createSession(); assert.equal(S.begin(s, false, false), true); return s; };

test("bug 1, RestOnlyAtBreak and RestKeepsYourTune: pressing থামাও is midway, never a break", () => {
  const s = free();
  assert.equal(S.startPlay(s, "free"), true);
  S.stopPlay(s);
  assert.equal(s.resting, false, "stopping never sets the rest screen, whatever the daily limit says");
  assert.equal(s.playing, "none");
  assert.equal(s.screen, "free");
  // Even with today's limit past, the rest screen can't cover the grid: the grid is where the tune is.
  s.resting = true;
  assert.equal(S.restShows(s), false);
  assert.equal(S.tapCell(s), "counts", "the cells still answer under a pending rest");
  // The break is the keep: the tune is on the shelf first, then the limit is checked.
  assert.equal(S.kept(s, true, 100), true);
  assert.equal(s.screen, "end"); assert.equal(s.endKind, "kept");
  assert.equal(S.restShows(s), true);
  assert.equal(S.tapCell(s), "ignored", "nothing reacts under the rest screen");
  assert.equal(S.canPlay(s, "free"), false);
});

test("bug 1: a tune on the free grid is in storage as it is made, so no screen can lose it", () => {
  const tune = parseTune("0 2 4 . . .");
  const text = draftText(tune, 1);
  assert.equal(DRAFT_KEY, "ektukhani-sur-banai-draft");
  assert.deepEqual(readDraft(text), { tune, sound: 1 });
  assert.equal(draftText(emptyTune(6), 0), "", "an empty grid leaves no draft");
  assert.equal(readDraft(""), null);
  assert.equal(readDraft("{oops"), null);
  assert.equal(readDraft(JSON.stringify({ tune: [1, 2, 3], sound: 0 })), null);
  assert.equal(readDraft(JSON.stringify({ tune: [99, 0, 0, 0, 0, 0], sound: 0 })), null);
  // Opening the page past today's limit starts on the rest screen, not a fresh round: the draft is untouched.
  const s = S.createSession();
  assert.equal(S.begin(s, true, true), false);
  assert.equal(s.screen, "title"); assert.equal(s.resting, true); assert.equal(S.restShows(s), true);
  assert.deepEqual(readDraft(text), { tune, sound: 1 });
});

test("bug 2, NoProgressWhileAway: blur, hide and the pause menu stop the beat and keep the tune", () => {
  const s = free();
  S.startPlay(s, "free");
  S.blur(s);
  assert.equal(s.playing, "none", "the tune doesn't play on in another window");
  S.focus(s);
  assert.equal(s.playing, "none", "coming back never restarts it");
  S.startPlay(s, "free");
  S.pause(s);
  assert.equal(s.playing, "none");
  assert.equal(S.canPlay(s, "free"), false, "nothing starts under the menu");
  assert.equal(S.tapCell(s), "ignored");
  S.resume(s);
  assert.equal(s.playing, "none", "resuming doesn't restart it either");
  assert.equal(S.canPlay(s, "free"), true);
});

test("the first tap back from another window only wakes the game", () => {
  const s = level();
  S.blur(s); S.focus(s);
  assert.equal(S.tapCell(s), "woke");
  assert.equal(S.tapCell(s), "counts");
  const g = free();
  S.blur(g);
  S.pause(g); S.resume(g);
  assert.equal(S.tapCell(g), "counts", "the pause menu took the tap");
});

test("bug 5, ChoiceFreezesPlay: the level list stops the beat and nothing plays under it", () => {
  const s = level();
  S.startPlay(s, "target");
  S.openLevels(s, true);
  assert.equal(s.screen, "levels");
  assert.equal(s.playing, "none");
  for (const kind of ["free", "mine", "target", "echo"] as const) assert.equal(S.canPlay(s, kind), false, kind);
  assert.equal(S.tapCell(s), "ignored");
  S.closeLevels(s);
  assert.equal(s.screen, "title");
  // A key or a button can't open the list over a grid; only the pause menu may.
  const grid = level();
  S.openLevels(grid);
  assert.equal(grid.screen, "play");
  const f = free();
  S.startPlay(f, "free");
  S.openLevels(f, true);
  assert.equal(f.playing, "none"); assert.equal(f.screen, "levels");
});

test("a win is recorded at the ✓ tap, the limit is checked there, and the rest screen waits for the end screen", () => {
  const s = level();
  S.startPlay(s, "mine"); S.stopPlay(s);
  assert.equal(S.won(s, true, 50), true);
  assert.equal(s.recorded, s.serial, "recorded at the tap, not after a delay");
  assert.equal(s.resting, true);
  assert.equal(S.restShows(s), false, "the grid is not covered while the tune plays through");
  assert.equal(S.canPlay(s, "echo"), true);
  assert.equal(S.canPlay(s, "target"), false);
  assert.equal(S.tapCell(s), "ignored", "a won grid takes no more notes");
  assert.equal(S.won(s, false, 60), false, "a round is won once");
  assert.equal(S.advance(s, 70), true);
  assert.equal(s.screen, "end"); assert.equal(s.playing, "none");
  assert.equal(S.restShows(s), true, "past the limit the rest screen comes at the break");
  S.extend(s);
  assert.equal(S.restShows(s), false);
  // The pause menu blocks a win and an advance.
  const p = level();
  S.pause(p);
  assert.equal(S.won(p, false, 1), false);
});

test("opening a round is a break too: past the limit it doesn't start, and a held key can't skip a result", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true, false), false);
  assert.equal(s.screen, "title");
  S.pause(s);
  assert.equal(S.begin(s, false, false), false, "not under the menu");
  const w = level();
  S.won(w, false, 100);
  assert.equal(S.freshNext(w, 90, false), false, "a key that began before the win");
  assert.equal(S.freshNext(w, 150, true), false, "a repeating key");
  assert.equal(S.freshNext(w, 150, false), true);
  S.advance(w, 200);
  assert.equal(S.freshKey(w, 190, false), false);
  assert.equal(S.freshKey(w, 250, true), false);
  assert.equal(S.freshKey(w, 250, false), true);
});

test("the beat plays only where it means something: the title and end screens have none", () => {
  const s = S.createSession();
  for (const kind of ["free", "mine", "target", "echo"] as const) assert.equal(S.canPlay(s, kind), false);
  const k = free();
  S.kept(k, false, 10);
  for (const kind of ["free", "mine", "target", "echo"] as const) assert.equal(S.canPlay(k, kind), false);
  assert.equal(S.freshKey(k, 20, false), true);
});

test("bug 7, NoWayOutWithoutGate: the page uses the kids' frame and nothing in the game links out", () => {
  const page = here("page.tsx");
  assert.match(page, /<GamePage[^>]*\bkids\b/);
  assert.doesNotMatch(page, /PageFrame|<a |href=|<Link/);
  for (const file of ["components/game.tsx", "components/title.tsx", "components/end-screen.tsx", "components/level-list.tsx", "components/grid.tsx", "components/card-canvas.tsx"]) {
    assert.doesNotMatch(here(file), /<a |href=|<Link|window\.open|location\.href/, file);
  }
  // Sharing the plain address sits behind the parent gate.
  assert.match(here("components/game.tsx"), /<ParentGate[^>]*>\s*<ShareToolLink/);
});

test("bug 8, NoReadingNeeded: every control is a picture, and the end buttons are big", () => {
  const end = here("components/end-screen.tsx"), css = here("product.css");
  assert.equal((end.match(/<button type="button" className="sb-big/g) ?? []).length, 2);
  assert.match(end, /<Icon id="again"[^>]*\/>\s*<span>আবার খেলো<\/span>/);
  assert.match(end, /<Icon id="home"[^>]*\/>\s*<span>শেষ<\/span>/);
  const px = (selector: string, prop: string) => Number(new RegExp(`${selector.replace(/[.]/g, "\\.")}\\{[^}]*${prop}:(\\d+)px`).exec(css)?.[1]);
  assert.ok(px(".sb-big", "min-height") >= 96, "end buttons are at least 96 px");
  assert.ok(px(".sb-act-main", "min-height") >= 96 && px(".sb-act-keep", "min-height") >= 96 || /\.sb-act-main,\.sb-act-keep\{min-height:9\d+px/.test(css), "বাজাও and রাখো are 96 px");
  assert.ok(px(".sb-next", "height") >= 96 && px(".sb-card-go", "font-size") >= 28);
  assert.ok(px(".sb-act", "min-height") >= 72 && px(".sb-chip", "min-height") >= 72);
  // Both modes' buttons carry an icon.
  const game = here("components/game.tsx");
  for (const id of ["ear", "play", "tick", "eraser", "heart", "home", "stop"]) assert.match(game, new RegExp(`<Icon id=[^>]*['"]${id}['"]`), id);
  // No voice anywhere.
  for (const file of ["components/game.tsx", "components/title.tsx", "components/end-screen.tsx", "lib/sound.ts"]) assert.doesNotMatch(here(file), /speak|SpeakButton|speechSynthesis|useBanglaVoice/, file);
});

test("the game keeps no timer that a pause could miss, and stops its beat on every way of leaving", () => {
  const game = here("components/game.tsx");
  assert.match(game, /addEventListener\('blur'/);
  assert.match(game, /visibilitychange/);
  assert.match(game, /onPause:[^\n]*halt\(\)/);
  assert.match(game, /onLevels:[^\n]*halt\(\)/);
  assert.match(game, /onRestart:[^\n]*halt\(\)/);
  assert.match(game, /useEffect\(\(\) => \(\) => \{ clearTimeout\(timer\.current\)/);
  assert.doesNotMatch(game, /setInterval|speechSynthesis|history\.pushState|location\.hash\s*=[^=]/);
});
