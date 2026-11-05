// Every bug path from ai_docs/statecharts/abc-bazar/README.md, replayed against the pure page logic (lib/session.ts) and
// the round (lib/play.ts), plus the shared patterns from the rewrite brief.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { answer, answerOf, createRound, currentItem, isLast, nextItem, resultOf } from "../lib/play";
import * as S from "../lib/session";

const root = join(import.meta.dirname, "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");
const game = read("components/game.tsx"), page = read("page.tsx"), css = read("product.css"), end = read("components/end-screen.tsx");

/** Plays to the last item and taps it right: what the component's pick() and goNext() do, in order. */
function toLastRight(s: S.Session, over = false) {
  let round = createRound(1, 9);
  while (!isLast(round)) {
    assert.equal(S.tapTile(s), "counts");
    round = answer(round, answerOf(currentItem(round)));
    assert.equal(S.solvedItem(s, false, false), false);
    assert.equal(S.tapNext(s, 0), "next");
    round = nextItem(round);
  }
  assert.equal(S.tapTile(s), "counts");
  round = answer(round, answerOf(currentItem(round)));
  return { round, record: S.solvedItem(s, true, over) };
}

test("EveryFinishCounts: the last right tap saves the stars at once, whatever the hand does next", () => {
  for (const leave of [(s: S.Session) => S.toTitle(s), (s: S.Session) => { S.toTitle(s); S.openLevels(s); }, (s: S.Session) => { S.pause(s); S.toTitle(s); }]) {
    const s = S.createSession();
    assert.ok(S.begin(s, false));
    const { round, record } = toLastRight(s);
    assert.ok(record, "the round is recorded at the last tap");
    assert.equal(s.recorded, s.serial);
    assert.equal(resultOf(round).stars, 3);
    leave(s);
    assert.equal(S.tapNext(s, 5), "ignored");
    assert.notEqual(s.screen, "end", "a stale ➜ never brings the end screen back");
    assert.equal(s.recorded, s.serial);
  }
  // The component records in the same tap, never in the ➜ or a timer.
  assert.match(game, /if \(S\.solvedItem\(s, last, last \? kids\.atBreak\(\) : false\)\) \{[\s\S]{0,120}levels\.record\(/);
  assert.ok(!/setTimeout/.test(game.replace(/NUDGE_MS[\s\S]*?clearTimeout\(id\)/, "")), "no other timer in the game");
});

test("NoNewRoundPastLimit: past today's limit, খেলো, আবার খেলো and a level from the list show the rest screen, not a round", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.ok(S.restShows(s));
  assert.equal(S.tapTile(s), "ignored");
  S.extend(s);
  assert.ok(S.begin(s, false), "a grown-up's ten minutes open the next round");
  toLastRight(s, true);
  assert.equal(S.tapNext(s, 10), "end");
  assert.equal(S.begin(s, true), false);
  assert.equal(s.screen, "end");
  assert.match(game, /S\.begin\(s, kids\.atBreak\(\)\)/, "atBreak() is asked when a round opens, not only when it ends");
});

test("RestOnlyAtBreak: the limit passing on the last item waits for the end screen", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s, true);
  assert.equal(s.screen, "play");
  assert.equal(S.restShows(s), false, "never over an item");
  assert.equal(S.tapNext(s, 3), "end");
  assert.ok(S.restShows(s));
});

test("pause freezes play: no tile and no ➜ counts under the menu; চালিয়ে যাও gives the hand back", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.pause(s);
  assert.equal(S.tapTile(s), "ignored");
  S.resume(s);
  S.solvedItem(s, false, false);
  S.pause(s);
  assert.equal(S.tapNext(s, 1), "ignored");
  assert.ok(s.solved, "the solved item waits");
  S.resume(s);
  assert.equal(S.tapNext(s, 2), "next");
  assert.match(game, /onPause: \(\) => \{ S\.pause\(session\.current\); setNudge\(false\)/);
  assert.match(game, /onResume: \(\) => \{ S\.resume\(session\.current\)/);
});

test("the tap that brings focus back is not a move: not a tile, not the ➜", () => {
  const s = S.createSession();
  S.begin(s, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapTile(s), "woke");
  assert.equal(S.tapTile(s), "counts");
  S.solvedItem(s, false, false);
  S.blur(s); S.focus(s);
  assert.equal(S.tapNext(s, 1), "woke");
  assert.equal(S.tapNext(s, 2), "next");
  S.blur(s); S.pause(s); S.resume(s);
  assert.equal(S.tapTile(s), "counts", "when the player's menu took the tap, the next one counts");
});

test("no tile counts off the play screen, while solved, and the ➜ only counts once an item is solved", () => {
  const s = S.createSession();
  assert.equal(S.tapTile(s), "ignored");
  assert.equal(S.tapNext(s, 0), "ignored");
  S.begin(s, false);
  assert.equal(S.tapNext(s, 0), "ignored", "nothing to move on from yet");
  S.solvedItem(s, false, false);
  assert.equal(S.tapTile(s), "ignored", "a second tile after the right one does nothing");
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
  assert.ok(!/<details|সব লেভেল/.test(game), "no drawer in the middle of play");
});

test("result keys need a fresh press after the end screen appears", () => {
  const s = S.createSession();
  S.begin(s, false);
  toLastRight(s);
  S.tapNext(s, 100);
  assert.equal(S.freshKey(s, 90, false), false, "held through the last tap");
  assert.equal(S.freshKey(s, 150, true), false, "auto-repeat");
  assert.ok(S.freshKey(s, 150, false));
  assert.match(game, /S\.freshKey\(s, event\.timeStamp, event\.repeat\)/);
});

test("bug 5, SilentWhenMuted: the game never speaks (no voice anywhere on the site)", () => {
  for (const file of ["components/game.tsx", "components/title.tsx", "components/end-screen.tsx", "components/pieces.tsx", "components/print-sheet.tsx", "lib/sound.ts"]) {
    assert.ok(!/\bspeak\(|speechSynthesis|SpeakButton|useBanglaVoice|sayEnglish|SayEnglish/.test(read(file)), `${file} speaks`);
  }
});

test("bugs 1–2, the parent gate: the share link and the print link sit only behind it, and it shuts on a tap anywhere else", () => {
  assert.match(game, /<ParentGate key=\{gateKey\} label="বড়দের জন্য">\s*<ShareToolLink/);
  assert.equal((game.match(/<ShareToolLink/g) ?? []).length, 1);
  assert.match(game, /addEventListener\('pointerdown', down, true\)/);
  assert.match(game, /setGateKey\(key => key \+ 1\)/);
  // The one print link in the game is inside the gate; the one under the guide is inside a gate too.
  for (const [name, source] of [["game", game], ["page", page]] as const) {
    const links = [...source.matchAll(/href="\/abc-bazar\?print"/g)];
    assert.equal(links.length, 1, `${name}: one print link`);
    const before = source.slice(0, links[0].index);
    assert.ok(before.lastIndexOf("<ParentGate") > before.lastIndexOf("</ParentGate>"), `${name}: the print link is inside ParentGate`);
  }
  assert.match(page, /<GamePage site=\{site\} kids /, "the kids frame");
  assert.ok(!/<a |<Link/.test(read("components/end-screen.tsx") + read("components/level-list.tsx") + read("components/title.tsx")), "no link in the child's screens");
});

test("bug 3, NoReadingNeeded: the end buttons are pictures at least 96 px, equal in size; tiles, ➜ and list cards are big too", () => {
  assert.equal((end.match(/<svg viewBox="0 0 48 48"/g) ?? []).length, 2, "আবার খেলো and শেষ each carry a picture");
  const px = (rule: RegExp) => Number(css.match(rule)?.[1]);
  assert.ok(px(/\.ab-big\{[^}]*min-height:(\d+)px/) >= 96);
  assert.ok(px(/\.ab-tile\{[^}]*min-height:(\d+)px/) >= 96);
  assert.ok(px(/\.ab-next\{[^}]*width:(\d+)px;height:(\d+)px/) >= 96);
  assert.ok(Number(css.match(/\.ab-next\{[^}]*height:(\d+)px/)?.[1]) >= 96);
  assert.ok(px(/\.ab-card\{[^}]*min-height:(\d+)px/) >= 96);
  assert.ok(px(/\.ab-close\{[^}]*width:(\d+)px/) >= 56);
  assert.match(css, /\.ab-tiles\{[^}]*gap:16px/, "16 px gaps");
  assert.match(game, /aria-label=\{isLast\(round\) \? 'শেষ দেখো' : 'পরেরটা'\}/, "the ➜ is a picture with a spoken label for screen readers");
  assert.ok(!/ধীরে খেলো|SoundToggle|useSlowMode\(\)\[1\]|setSlow/.test(game), "no sound or slow toggle of its own");
});

test("a wrong tap teaches with a picture on the tile, the sign swings in, nothing in the child's view needs reading", () => {
  assert.match(game, /ab-chip-why/);
  assert.match(game, /ab-why-pic/);
  assert.match(game, /<Glyph letter=\{value\} order=/);
  assert.match(game, /className="ab-arrow"/);
});

test("Enter and Space go to the game at the window, never to a stale focused button; P pauses through the player", () => {
  assert.match(game, /window\.addEventListener\('keydown', down\)/);
  assert.match(game, /key === 'p' \|\| key === 'P'\) \{ event\.preventDefault\(\); player\.requestPause\(\)/);
  const blurs = (game.match(/currentTarget\.blur\(\)/g) ?? []).length + (read("components/title.tsx").match(/currentTarget\.blur\(\)/g) ?? []).length + (end.match(/currentTarget\.blur\(\)/g) ?? []).length;
  assert.ok(blurs >= 4);
});

test("never sets location.hash or pushes history, and only keeps its own storage keys", () => {
  for (const file of ["components/game.tsx", "components/title.tsx", "components/end-screen.tsx", "components/level-list.tsx"]) {
    assert.ok(!/location\.hash|pushState|history\./.test(read(file)), file);
    assert.ok(!/localStorage|sessionStorage/.test(read(file)), `${file} writes storage on its own`);
  }
  assert.match(game, /const SLUG = 'abc-bazar'/);
});
