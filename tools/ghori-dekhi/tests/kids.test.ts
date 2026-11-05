import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { LEVELS } from "../lib/levels";

const read = (path: string) => readFileSync(join(import.meta.dirname, "..", path), "utf8");
const game = read("components/game.tsx"), cards = read("components/cards.tsx"), css = read("product.css");

// ── bug 3 (NoReadingNeeded): "সাড়ে ৮টা" was text only, so a 5-year-old had nothing to match ──

test("bug 3: the target is a picture, not only text: a small clock, the sky, and for read items a clock on every card", () => {
  assert.match(cards, /<MiniClock time=\{item\.time\}/, "the set item's target is drawn as a clock");
  assert.match(cards, /<Scene activity=/, "…beside the sky, whose sun shows the part of the day");
  assert.match(cards, /<MiniClock time=\{time\}/, "each read card has its own small clock");
  // Worlds 1–3 never hide the picture; the last world shows it after a first slip, and a wrong card reveals its own.
  for (const level of LEVELS) if (level.world < 3) { assert.equal(level.targetClock, "always", String(level.id)); assert.equal(level.pickClock, "always", String(level.id)); }
  assert.match(game, /showClock=\{spec\.targetClock === 'always' \|\| slipped \|\| round\.solved\}/);
  assert.match(cards, /level\.pickClock === "always" \|\| tried/);
  // The first item of a round shows the ghost finger; the long hand is locked in level ১ so a 5-year-old turns one hand.
  assert.match(game, /const demo = !touched && round\.index === 0/);
  assert.equal(LEVELS.find(level => level.id === 1)!.lockMinute, true);
});

test("no voice anywhere: no speak(), SpeakButton or speechSynthesis in the game", () => {
  for (const file of ["components/game.tsx", "components/cards.tsx", "components/face.tsx", "components/end-screen.tsx", "components/title.tsx", "components/level-list.tsx", "components/art.tsx", "lib/sound.ts"]) {
    assert.doesNotMatch(read(file), /\bspeak\s*\(|SpeakButton|speechSynthesis|useBanglaVoice/, file);
  }
});

test("the picture buttons are big: ✓ and ▶ 96 px, the end buttons 112 px, a card 100 px", () => {
  assert.match(css, /\.gd-go\{[^}]*width:96px;height:96px/);
  assert.match(css, /\.gd-big\{[^}]*min-height:112px/);
  assert.match(css, /\.gd-pick\{[^}]*min-height:116px/);
  assert.match(css, /\.gd-chip-hand\{[^}]*width:76px;min-height:84px/);
  assert.doesNotMatch(css.split("\n").filter(line => !line.includes(".gd-sheet")).join("\n"), /font-size:1[0-5]px/, "nothing under 16 px (the paper sheet is exempt)");
});

test("the game lives in the player and the kids' rules hold", () => {
  assert.match(read("page.tsx"), /<GamePage site=\{site\} kids /);
  assert.match(game, /useGamePlayer\(\{[\s\S]*?onPause[\s\S]*?onResume[\s\S]*?onRestart[\s\S]*?onLevels/);
  assert.match(game, /kids\.atBreak\(\)/g, "atBreak at a round's start and at the last item");
  assert.equal((game.match(/kids\.atBreak\(\)/g) ?? []).length, 2);
  assert.doesNotMatch(game + read("components/face.tsx"), /location\.hash|history\.(push|replace)State|pushState/, "no history or hash");
  assert.match(game, /window\.addEventListener\('keydown'/, "keys at the window");
  assert.match(game, /event\.currentTarget\.blur\(\)/, "buttons blur after a click");
  assert.match(game, /<RestScreen/);
  assert.match(game, /<ParentGate/);
  // No SoundToggle or ধীরে খেলো pill of its own: the player's menu has them.
  assert.doesNotMatch(game, /SoundToggle|setSlow|ধীরে খেলো/);
});
