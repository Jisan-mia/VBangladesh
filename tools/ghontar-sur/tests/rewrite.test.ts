// The rewrite: every statechart bug replayed against the pure run, the shared patterns pinned in the component,
// saved progress and its one-time migration, old links and the old tune, and the bot-tuned rates of the ladder.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { recordLevel, unlockedLevel } from "../../../shared/game-core";
import { answerBell, beatMs, makeDeal, makeEndless, roundLen, type Deal } from "../lib/deal";
import { legacyBeat, legacyTune, MAX_LEN } from "../lib/legacy";
import { LEVEL_COUNT, PER_WORLD, isFinale, worldOf } from "../lib/levels";
import { parseShared } from "../lib/links";
import * as R from "../lib/run";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import { starsOf } from "../lib/score";
import { PLAYERS, play, type Skill } from "./bot";

const component = readFileSync(new URL("../components/bell-game.tsx", import.meta.url), "utf8");
const T = R.TIMING;

function runTo(run: R.Run, deal: Deal, from: number, at: number) {
  for (let now = from; now <= at; now += 16) run = R.tick(run, deal, now, T);
  return R.tick(run, deal, at, T);
}
/** A deal started at 0 and run to your first turn. */
function toAnswer(deal: Deal) {
  let run = R.begin(R.ready(), deal, 0, T), now = 0;
  while (run.phase !== "answer") { now = run.since + run.dur + 0.01; run = R.tick(run, deal, now, T); }
  return { run, now };
}
function echoRound(deal: Deal, run: R.Run, now: number) {
  let last: R.TapResult = { run, kind: "ignored", grade: null };
  const round = run.round, len = roundLen(deal, round), beat = beatMs(deal, round, 1);
  for (let index = 0; index < len; index++) { now += index === 0 ? 400 : beat; last = R.tap(last.run.phase === "answer" ? last.run : run, deal, answerBell(deal, round, index), now, T); }
  return { ...last, now };
}

// ---- bug 1: PausedMeansSilent (the cheer under a pause) ----
test("bug 1 · PausedMeansSilent: a round cleared and then the tab hides — nothing plays under the pause, and the next call waits for you", () => {
  const deal = makeDeal(3, 5);
  const { run, now } = toAnswer(deal);
  const cleared = echoRound(deal, run, now);
  let s = cleared.run;
  assert.equal(s.phase, "cheer");
  const at = cleared.now + 100;
  s = R.pause(s, at, "away");
  s = runTo(s, deal, at, at + 20000);                        // the old game played the next tune under "থেমে আছে" here
  assert.equal(s.phase, "cheer", "still the cheer, 20 s later");
  assert.equal(R.ringing(s), false);
  assert.equal(R.canTap(s), false);
  s = R.resume(s, deal, at + 21000, "away", T);
  s = runTo(s, deal, at + 21000, at + 21000 + T.breath + T.cheer + 50);
  assert.equal(s.phase, "lead");
  assert.equal(s.round, 1);
  // one pause menu, one overlay: the component draws its own cover only outside the player
  assert.match(component, /covered && player\.stage\.width === 0 && run\.why === "away"/);
});

// ---- bug 2: EveryClearIsShown ----
test("bug 2 · EveryClearIsShown: the last note of a level is recorded at once, so hiding the tab right after can't skip the end screen", () => {
  const deal = makeDeal(1, 6);
  const { run, now } = toAnswer(deal);
  const won = echoRound(deal, run, now);
  assert.equal(won.kind, "won");
  assert.equal(won.run.done, "won");
  assert.equal(starsOf(deal, won.run), 3, "the stars are known the moment the last bell rings");
  let s = R.pause(won.run, won.now + 10, "away");            // the tab hides 10 ms after the last tap
  s = R.resume(s, deal, won.now + 5000, "away", T);
  s = runTo(s, deal, won.now + 5000, won.now + 5000 + T.breath + T.cheer + 50);
  assert.equal(s.phase, "over", "the end screen still comes");
  assert.equal(s.done, "won");
  assert.match(component, /if \(result\.kind === "won" \|\| result\.kind === "lost"\) finalize\(next\);/);
  assert.doesNotMatch(component, /later\(\(\) => levels\.record/);
});

// ---- bug 3: PausedWhenBlurred / NoProgressWhileAway ----
test("bug 3 · PausedWhenBlurred: clicking into another window stops the call; coming back plays it from its lead-in", () => {
  const deal = makeDeal(5, 9);
  let s = R.begin(R.ready(), deal, 0, T);
  s = runTo(s, deal, 0, T.lead + 900);
  assert.equal(s.phase, "call");
  assert.equal(R.ringing(s), true);
  s = R.pause(s, T.lead + 900, "away");                      // blur
  assert.equal(R.ringing(s), false, "no bell rings while you're away");
  s = runTo(s, deal, T.lead + 900, T.lead + 9000);           // the old game played the whole tune to nobody
  assert.equal(s.phase, "call");
  assert.equal(R.elapsed(s, T.lead + 9000), 900, "the call's clock holds at 900 ms");
  s = R.resume(s, deal, T.lead + 9000, "away", T);
  assert.equal(s.phase, "lead", "you missed part of it, so it starts over");
  assert.equal(s.heard, 1);
  assert.match(component, /window\.addEventListener\("blur", away\)/);
  assert.match(component, /const hide = \(\) => \{ if \(document\.hidden\) away\(\); \};/);
  assert.match(component, /onPause: \(\) => pauseFor\("away"\)/);
});

// ---- bug 4: ChoiceFreezesPlay ----
test("bug 4 · ChoiceFreezesPlay: সব লেভেল pauses the call; coming back from another window doesn't close it", () => {
  const deal = makeDeal(4, 2);
  let s = R.begin(R.ready(), deal, 0, T);
  s = runTo(s, deal, 0, T.lead + 500);
  s = R.pause(s, T.lead + 500, "sheet");                     // open সব লেভেল
  s = R.pause(s, T.lead + 1500, "away");                     // the window blurs too
  s = R.resume(s, deal, T.lead + 2500, "away", T);           // চালিয়ে যাও in the player's menu
  assert.equal(s.why, "sheet", "the sheet still holds the pause");
  s = runTo(s, deal, T.lead + 2500, T.lead + 9000);
  assert.equal(s.phase, "call");
  assert.equal(R.elapsed(s, T.lead + 9000), 500, "not a millisecond of the call went by");
  assert.equal(R.canTap(s), false);
  s = R.resume(s, deal, T.lead + 9000, "sheet", T);
  assert.equal(R.running(s), true);
  assert.match(component, /function openSheet\(\) \{\n\s+pauseFor\("sheet"\);/);
  assert.match(component, /function closeSheet\(\) \{ now\.current\.sheet = false; setSheet\(false\); resumeFrom\("sheet"\); \}/);
  assert.match(component, /onLevels: \(\) => openSheet\(\)/);
});

// ---- bug 5: ReplayIsExact ----
test("bug 5 · ReplayIsExact: a friend's level link opens that level and that tune; an endless link starts at the first note", () => {
  const fresh = parseShared("#s=777&t=50&l=9&v=2")!;
  assert.deepEqual(fresh, { seed: 777, score: 50, name: "", level: 9 });
  assert.deepEqual(makeDeal(fresh.level, fresh.seed).tune, makeDeal(9, 777).tune, "the same tune on every phone");
  assert.equal(makeDeal(fresh.level, fresh.seed).level, 9, "not level 1");
  const old = parseShared("#s=241554142&t=7")!;
  assert.equal(old.level, 0);
  const deal = makeEndless(old.seed);
  assert.equal(R.begin(R.ready(), deal, 0, T).round, 0, "a friend's endless run starts at the first note");
  assert.deepEqual(deal.tune.notes.slice(0, 20).map(note => note.bell), legacyTune(241554142, 20));
  assert.match(component, /if \(got\.level\) \{ setMode\("ladder"\); setVisit\(got\.level\); load\(makeDeal\(got\.level, got\.seed\)\); \}/);
});

// ---- shared patterns ----
test("the game's P opens the player's one pause menu; result keys need a fresh press after the screen shows", () => {
  assert.match(component, /if \(player\.stage\.width > 0\) player\.requestPause\(\); else pauseFor\("away"\);/);
  assert.match(component, /fresh && event\.timeStamp > overAt\.current \+ 400/);
  assert.match(component, /if \(enter && element\?\.closest\?\.\("button, a, summary"\)\) return;/);
  assert.match(component, /if \(s\.why === "away"\) \{ if \(enter\) \{ event\.preventDefault\(\); if \(fresh\) resumeFrom\("away"\); \} return; \}/);
});

test("shared patterns: no hash or history writes, no speech, no own sound toggle, timers and lights cleared, buttons drop focus", () => {
  assert.doesNotMatch(component, /location\.hash\s*=|pushState|history\./);
  assert.doesNotMatch(component, /speechSynthesis|speak\(/);
  assert.doesNotMatch(component, /SoundToggle|setSlow|ধীরে খেলো/, "the player's menu owns these");
  assert.doesNotMatch(component, /\?\?=/, "no loop to keep, and never a silent stub");
  assert.match(component, /function clearLights\(\)/);
  assert.match(component, /window\.clearTimeout\(lit\.current\[index\]\)/);
  assert.match(component, /clearLights\(\);\n\s+silenceScheduled\(\);\n\s+\};/, "unmount cuts lights and notes");
  assert.match(component, /if \(next\.why !== null && before\.why === null\) \{ clearLights\(\); silenceScheduled\(\); \}/);
  assert.match(component, /event\.currentTarget\.blur\(\); ring\(bell\)/);
  assert.match(component, /if \(event\.detail === 0\) return;\n\s+const button/);
});

test("a tap shows and sounds inside its own event: the bell lights and swings before React renders", () => {
  const ring = component.slice(component.indexOf("function ring(bell: number)"), component.indexOf("function finalize"));
  assert.ok(ring.indexOf("sound.bell(bell)") > 0 && ring.indexOf("flash(bell, 380)") > ring.indexOf("sound.bell(bell)"));
  assert.ok(ring.indexOf("flash(bell, 380)") < ring.indexOf("setMarks"), "the bell is lit before any state update");
  assert.match(readFileSync(new URL("../components/bells.tsx", import.meta.url), "utf8"), /onPointerDown=\{onDown\(index\)\}/);
});

test("the pure sim has no Math.random and no clock; the hot file allocates nothing", () => {
  for (const file of ["deal.ts", "levels.ts", "run.ts", "score.ts", "tune.ts", "legacy.ts", "save.ts"]) {
    const text = readFileSync(new URL(`../lib/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(text, /Math\.random|Date\.now|performance\.now/, file);
  }
});

// ---- saved progress ----
test("saved progress: stars carry over, your own open level migrates once, a friend's far-ahead level opens nothing in between", () => {
  assert.equal(readOpen(null, {}), 1);
  assert.equal(readOpen(null, { 1: 3, 2: 2, 5: 1 }), 6, "the old rule: one past the highest level with stars");
  assert.equal(readOpen(null, { 10: 1 }), 11, "an old level 10 now sits in the second world");
  assert.equal(readOpen("4", { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 }), 4, "after the first time only your own play opens levels");
  for (const bad of ["", "0", "25", "x", "2.5", "-1"]) assert.equal(readOpen(bad, { 3: 1 }), 4, bad);
  assert.equal(OPEN_KEY, "ektukhani-ghontar-sur-open");
  assert.equal(openAfter(4, 4), 5);
  assert.equal(openAfter(4, 3), 4);
  assert.equal(openAfter(4, 9), 4, "a friend's level 9 records stars but opens nothing");
  assert.equal(openAfter(24, 24), 24);
  const stars = recordLevel({ 3: 3 }, 9, 2);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 10, "the shared helper would open the levels in between; the game doesn't use it for this");
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2, 3: 3 }, 3), 2, "an open level with fewer than three stars comes first");
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 3 }, 3), 3);
  assert.deepEqual(recordLevel({ 4: 3 }, 4, 1), { 4: 3 }, "stars never drop");
});

// ---- old links and the old tune ----
test("compatibility: the old endless tune and speed are byte for byte what they were", () => {
  assert.deepEqual(legacyTune(42, 24), [2, 1, 3, 2, 0, 2, 1, 2, 3, 1, 0, 3, 2, 1, 0, 2, 2, 3, 1, 3, 0, 2, 0, 1]);
  assert.deepEqual(legacyTune(20261105, 12), [0, 2, 0, 1, 1, 2, 1, 3, 0, 1, 3, 0]);
  assert.deepEqual(makeEndless(42).tune.notes.slice(0, 24).map(note => note.bell), legacyTune(42, 24));
  assert.deepEqual(legacyTune(7, 20), legacyTune(7).slice(0, 20), "a longer tune only adds notes");
  assert.equal(legacyTune(1).length, MAX_LEN);
  assert.deepEqual([1, 5, 6, 10, 11, 50, 51, 99].map(legacyBeat), [760, 760, 720, 720, 680, 400, 400, 400]);
  const counts = [0, 0, 0, 0];
  for (let seed = 1; seed <= 300; seed++) for (const bell of legacyTune(seed)) counts[bell]++;
  const total = counts.reduce((a, b) => a + b);
  for (const count of counts) assert.ok(Math.abs(count / total - 0.25) < 0.02, String(counts));
  // the pitches of bells 1–4 are the old pots' four notes
  assert.deepEqual([392, 440, 523, 587], [0, 1, 2, 3].map(bell => ({ 0: 392, 1: 440, 2: 523, 3: 587 })[bell]));
});

// ---- the ladder, tuned by bots ----
const N = 200;
function rates(level: number, skill: Skill) {
  let win = 0, three = 0;
  for (let seed = 1; seed <= N; seed++) {
    const result = play(makeDeal(level, seed * 7919), skill, seed);
    if (result.run.done === "won") win++;
    if (result.stars === 3) three++;
  }
  return { win: win / N, three: three / N };
}
const table = {
  casual: Array.from({ length: LEVEL_COUNT }, (_, at) => rates(at + 1, PLAYERS.casual)),
  steady: Array.from({ length: LEVEL_COUNT }, (_, at) => rates(at + 1, PLAYERS.steady)),
  strong: Array.from({ length: LEVEL_COUNT }, (_, at) => rates(at + 1, PLAYERS.strong)),
};

test("bots · a casual player clears level one every time, the first four levels of each world ≥ 80%, and every other level that isn't a finale ≥ 25%", () => {
  assert.ok(table.casual[0].win >= 0.99, String(table.casual[0].win));
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { win } = table.casual[level - 1];
    if (isFinale(level)) assert.ok(win >= 0.05, `finale ${level}: ${win}`);
    else assert.ok(win >= 0.25, `level ${level}: ${win}`);
    if ((level - 1) % PER_WORLD < 4) assert.ok(win >= 0.8, `level ${level}: ${win}`);
  }
});

test("bots · a steady player clears every level ≥ 88% and every finale ≥ 60%; each finale is the hardest in its world", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { win } = table.steady[level - 1];
    assert.ok(win >= (isFinale(level) ? 0.6 : 0.88), `level ${level}: ${win}`);
  }
  for (let world = 0; world < 3; world++) {
    const first = world * PER_WORLD, finale = table.steady[first + PER_WORLD - 1].win;
    for (let level = first; level < first + PER_WORLD - 1; level++) assert.ok(finale < table.steady[level].win, `world ${world}: level ${level + 1} is not harder than the finale`);
  }
});

test("bots · a strong player gets ★★★ on every other level ≥ 60% and on each finale 35–85%", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { three, win } = table.strong[level - 1];
    assert.ok(win >= 0.97, `level ${level}: ${win}`);
    if (isFinale(level)) assert.ok(three >= 0.35 && three <= 0.85, `finale ${level}: ${three}`);
    else assert.ok(three >= 0.6, `level ${level}: ${three}`);
  }
});

test("bots · the endless run is fair: a steady player gets past 10 notes in 15–70% of runs", () => {
  let past = 0, total = 120;
  for (let seed = 1; seed <= total; seed++) if (play(makeEndless(seed * 31), PLAYERS.steady, seed).run.rounds >= 10) past++;
  assert.ok(past / total > 0.15 && past / total < 0.7, String(past / total));
  assert.equal(worldOf(24), 2);
});
