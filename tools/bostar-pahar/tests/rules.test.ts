// The rules: swings, judging, the sway, slips and spares, finales, old-link replay, stars and saved progress.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { site } from "../content";
import { defOf, LEVEL_COUNT, LEVELS, migrateBest, MODE_INFO, nextAhead, OLD_GHATS, openLevel, readAhead, starsOf, toNextStar, WORLDS } from "../lib/levels";
import {
  createGame, DANGER, DROP_TIME, E_DANGER, E_DARK, E_GUST, E_GUST_WARN, E_LIGHT, E_PERFECT, E_TOPPLE, FALL_TIME, GUST_WARN, HALF_VIEW, judge, levelSwingInto,
  MIN_SWING, PERFECT, placePivot, scoreOf, SETTLE_TIME, SLIP, SLOW, STRAIGHTEN, swayOmega, swingOf, swingX, topWorld, type Game, type Swing,
} from "../lib/rules";
import { stepGame, tap } from "../lib/step.hot";
import * as Old from "./old-game";
import { play, runOf, SKILLED } from "./bot";

const DT = 1 / 240;
const run = (game: Game, seconds: number, slow = false) => { for (let i = 0; i < Math.round(seconds / DT); i++) { stepGame(game, DT, slow); } };
/** Swings until the sack is over the top (plus `aim`), then taps; returns once the drop has landed. */
function dropAt(game: Game, aim = 0, slow = false) {
  let previous = NaN;
  for (let i = 0; i < 240 * 20 && (game.phase === "ready" || game.phase === "swing"); i++) {
    const gap = swingX(game) - topWorld(game) - aim;
    if (game.t >= MIN_SWING && !Number.isNaN(previous) && Math.sign(gap) !== Math.sign(previous)) { tap(game); break; }
    previous = gap;
    stepGame(game, DT, slow);
  }
  for (let i = 0; i < 240 && game.phase === "drop"; i++) stepGame(game, DT, slow);
}

test("the same seed and taps give the same pile: the game is deterministic", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const a = play(runOf(48213, level), SKILLED).game, b = play(runOf(48213, level), SKILLED).game;
    assert.equal(a.n, b.n);
    assert.deepEqual(Array.from(a.xs.slice(0, a.n)), Array.from(b.xs.slice(0, b.n)));
    assert.equal(a.sway, b.sway);
    assert.equal(a.end, b.end);
  }
  const one: Swing = { period: 0, amp: 0, shift: 0, phase: 0, kind: 0 }, two: Swing = { ...one };
  assert.deepEqual(levelSwingInto(7, 3, LEVELS[4], 1, one), levelSwingInto(7, 3, LEVELS[4], 1, two));
  assert.notDeepEqual(levelSwingInto(7, 3, LEVELS[4], 1, one), { ...levelSwingInto(8, 3, LEVELS[4], 1, two) });
});

test("old links replay exactly: the old ghats, the old swings and the old rules give the same pile as the old game", () => {
  const rng = makeRng(99);
  for (let ghat = 1; ghat <= OLD_GHATS.length; ghat++) for (const seed of [1, 48213, 999_999_999, 31337]) {
    const aims = Array.from({ length: 60 }, () => (rng() - 0.5) * 0.7);
    const before = Old.newGame(seed, ghat), after = createGame(seed, "old", ghat);
    let previousOld = NaN, previousNew = NaN;
    for (let i = 0; i < 240 * 60 && before.phase !== "over"; i++) {
      const sack = Old.scoreOf(before), aim = aims[sack % aims.length];
      if (before.phase === "ready" || before.phase === "swing") {
        const gapOld = Old.swingX(before) - Old.topX(before) - aim, gapNew = swingX(after) - topWorld(after) - aim;
        assert.equal(gapNew, gapOld, `ghat ${ghat} seed ${seed}: the swing is the same`);
        if (before.t >= Old.MIN_SWING && Math.sign(gapOld) !== Math.sign(previousOld) && !Number.isNaN(previousOld)) { Old.tap(before); tap(after); }
        previousOld = gapOld; previousNew = gapNew;
      }
      Old.step(before, DT, false);
      stepGame(after, DT);
      assert.equal(after.phase === "end" ? "fall" : after.phase, before.phase, `ghat ${ghat} seed ${seed}: phase at step ${i}`);
    }
    assert.equal(after.phase, before.phase);
    assert.equal(scoreOf(after), Old.scoreOf(before));
    assert.deepEqual(Array.from(after.xs.slice(0, after.n)), before.xs);
    assert.equal(after.perfect, before.perfect);
    assert.equal(after.bestCombo, before.bestCombo);
    assert.equal(after.verdict, before.verdict);
    void previousNew;
  }
});

test("judging: with no sway it is the old rule exactly; sway counts toward the lean", () => {
  const rng = makeRng(5);
  for (let i = 0; i < 4000; i++) {
    const top = (rng() - 0.5) * 2, base = 0, x = top + (rng() - 0.5) * 1.4;
    assert.deepEqual(judge(top, base, x), Old.judge(top, base, x));
  }
  assert.equal(judge(0.6, 0, 0.85).verdict, "good");
  assert.equal(judge(0.6, 0, 0.85, 0.2).verdict, "lean", "the same drop on a pile swayed right tips it");
  assert.equal(judge(0.5, 0, 0.75, 0, 0.75).verdict, "good");
  assert.equal(judge(0.5, 0, 0.8, 0, 0.75).verdict, "lean", "the small truck's limit");
  assert.equal(judge(0, 0, 0.1, 0, 1, PERFECT * SLOW).verdict, "good", "slow mode's narrower ঠিক মাঝে window");
});

test("the step's landing agrees with judge() (sway, the truck's roll, the limit)", () => {
  const rng = makeRng(11);
  for (let i = 0; i < 600; i++) {
    const game = createGame(1 + i, "level", 1 + (i % LEVEL_COUNT));
    game.n = 3; game.xs[0] = 0; game.xs[1] = (rng() - 0.5) * 0.4; game.xs[2] = (rng() - 0.5) * 0.9;
    game.sway = (rng() - 0.5) * 0.3; game.swayV = 0; game.truckX = 0; game.def = { ...game.def, pontoon: 0, gusts: 0, dark: false, clock: 0 };
    game.phase = "drop"; game.timer = DROP_TIME - 1e-9; game.dropX = game.xs[2] + game.sway + (rng() - 0.5) * 1.3; game.started = true;
    const want = judge(game.xs[2], 0, game.dropX - game.sway, game.sway, game.limit);
    const sway = game.sway, w = swayOmega(3), v = -w * w * sway * 1e-9;
    stepGame(game, 1e-9);
    void v;
    assert.equal(game.verdict, want.verdict, `case ${i}`);
    if (want.verdict !== "slip" && want.verdict !== "lean") assert.ok(Math.abs(game.xs[3] - want.x) < 1e-6);
  }
});

test("every level's swing stays on screen and passes over the top sack", () => {
  const swing: Swing = { period: 0, amp: 0, shift: 0, phase: 0, kind: 0 };
  LEVELS.forEach((def, index) => {
    for (let seed = 1; seed < 200; seed++) for (let sack = 0; sack <= def.goal + 4; sack++) {
      levelSwingInto(seed * 7919, sack, def, MODE_INFO.h.speed, swing);
      assert.ok(swing.period > 1.2, `level ${index + 1}: never frantic (${swing.period})`);
      for (const top of [-def.limit, -0.4, 0, 0.6, def.limit]) {
        const pivot = placePivot(top, swing, def.roll);
        assert.ok(Math.abs(pivot) + def.roll + swing.amp + 0.5 <= HALF_VIEW + 1e-9, "the sack stays on screen");
        assert.ok(Math.abs(top - pivot) <= swing.amp - 0.2 + def.roll, `level ${index + 1}: the swing passes over the top`);
      }
      if (!def.heavy) assert.notEqual(swing.kind, 2, `level ${index + 1}: no jute before world 2`);
    }
  });
  assert.equal(levelSwingInto(5, 0, LEVELS[2], 1, swing).shift, 0, "the first sack always swings over the pile");
});

test("the sway: an off-centre landing rocks the pile, ঠিক মাঝে calms it, it dies down, a tall pile sways slower", () => {
  const wide = createGame(3, "level", 2);
  dropAt(wide, 0.35);
  assert.equal(wide.verdict, "wide");
  run(wide, 0.15);
  assert.ok(Math.abs(wide.sway) > 0.05, `the pile rocks: ${wide.sway}`);
  assert.ok(Math.sign(wide.sway) === 1, "toward the side the sack landed");
  run(wide, 14);
  assert.ok(Math.abs(wide.sway) < 0.01 && Math.abs(wide.swayV) < 0.02, "it dies down on its own");
  const middle = createGame(3, "level", 2);
  dropAt(middle, 0);
  assert.equal(middle.verdict, "perfect");
  run(middle, 0.15);
  assert.ok(Math.abs(middle.sway) < 0.02, "a ঠিক মাঝে barely moves it");
  assert.ok(swayOmega(12) < swayOmega(3), "taller is slower");
  const stiff = createGame(3, "level", 1);
  dropAt(stiff, 0.35);
  run(stiff, 0.15);
  assert.ok(Math.abs(stiff.sway) < Math.abs(wide.sway === 0 ? 1 : 0.6), "level 1's pile barely sways");
});

test("tension: past the danger line the edge warns, past the limit the pile topples", () => {
  const game = createGame(21, "level", 2);
  dropAt(game, 0);
  let events = 0;
  game.swayV = 0; game.sway = 0;
  game.xs[game.n - 1] = 0.75; // a strained pile
  for (let i = 0; i < 240 && game.phase !== "end"; i++) { stepGame(game, DT); events |= game.events; game.events = 0; }
  assert.ok(events & E_DANGER, "the danger line rang first");
  game.swayV = 3;
  for (let i = 0; i < 240 && game.phase !== "end"; i++) { stepGame(game, DT); events |= game.events; game.events = 0; }
  assert.ok(events & E_TOPPLE);
  assert.equal(game.end, "topple");
  assert.ok(game.peak > 1 && DANGER < 1);
  run(game, 2);
  assert.equal(game.phase, "over");
});

test("a slip costs a spare sack; losing the last ends the round; old rules end on the first", () => {
  const game = createGame(9, "level", 2, "h");
  assert.equal(game.spares, MODE_INFO.h.spares);
  for (let miss = 1; miss <= game.spares; miss++) {
    dropAt(game, SLIP + 0.2);
    assert.equal(game.verdict, "slip");
    assert.equal(game.lost, miss);
    run(game, FALL_TIME + 0.02);
    assert.equal(game.phase, "swing", "a spare: the next sack comes");
  }
  dropAt(game, -(SLIP + 0.2));
  run(game, FALL_TIME + 0.02);
  assert.equal(game.phase, "over");
  assert.equal(game.end, "spent");
  const old = createGame(9, "old", 1);
  dropAt(old, SLIP + 0.2);
  run(old, FALL_TIME + 0.02);
  assert.equal(old.phase, "over");
});

test("the truck fills at the goal and the round clears; ঠিক মাঝে straightens the lean", () => {
  const game = createGame(4, "level", 1);
  for (let sack = 0; sack < LEVELS[0].goal; sack++) { dropAt(game, 0); run(game, SETTLE_TIME + 0.02); }
  assert.equal(scoreOf(game), LEVELS[0].goal);
  assert.equal(game.end, "clear");
  run(game, 2);
  assert.equal(game.phase, "over");
  const lean = createGame(4, "level", 2);
  lean.xs[0] = 0; lean.n = 2; lean.xs[1] = 0.4; lean.phase = "drop"; lean.timer = DROP_TIME; lean.dropX = 0.4; lean.started = true;
  stepGame(lean, DT);
  assert.equal(lean.verdict, "perfect");
  assert.ok(Math.abs(lean.xs[2] - (0.4 - STRAIGHTEN)) < 1e-9);
  assert.ok(lean.events & E_PERFECT);
});

test("a finale's clock starts at the first drop, and the horn ends the round", () => {
  const def = LEVELS[3];
  assert.ok(def.clock > 0 && def.finale);
  const game = createGame(6, "level", 4);
  run(game, def.clock + 5);
  assert.equal(game.phase, "ready", "no clock before the first drop");
  assert.equal(game.left, def.clock);
  dropAt(game, 0);
  run(game, def.clock + 1);
  assert.equal(game.end, "late");
  run(game, 2);
  assert.equal(game.phase, "over");
});

test("gusts warn a second ahead, only after the first drop, and replay the same; lights-out only on dark levels", () => {
  const gusty = createGame(12, "level", 6);
  run(gusty, 12);
  assert.equal(gusty.gusted, 0, "nothing before the first drop");
  dropAt(gusty, 0);
  let warned = -1, hit = -1;
  for (let i = 0; i < 240 * 12 && hit < 0; i++) {
    stepGame(gusty, DT);
    if (gusty.events & E_GUST_WARN && warned < 0) warned = i;
    if (gusty.events & E_GUST) hit = i;
    gusty.events = 0;
  }
  assert.ok(warned >= 0 && hit > warned);
  assert.ok(Math.abs((hit - warned) * DT - GUST_WARN) < 0.02, "a full second of warning");
  const dark = createGame(12, "level", 9);
  dropAt(dark, 0);
  let out = 0, back = 0;
  for (let i = 0; i < 240 * 14; i++) { stepGame(dark, DT); if (dark.events & E_DARK) out++; if (dark.events & E_LIGHT) back++; dark.events = 0; if (dark.phase === "end") break; }
  assert.ok(out >= 1 && back >= 1);
  const lit = createGame(12, "level", 8);
  dropAt(lit, 0);
  run(lit, 10);
  assert.equal(lit.darkLeft, 0);
});

test("slow mode runs the whole game at 0.75× and narrows ঠিক মাঝে to the same milliseconds", () => {
  const fast = createGame(9, "level", 2), slow = createGame(9, "level", 2);
  run(fast, 1); run(slow, 1, true);
  assert.ok(Math.abs(slow.t - fast.t * SLOW) < 1e-6);
  // A landing 0.1 off the middle: ঠিক মাঝে at full speed, only "good" in slow mode.
  for (const [slowMode, want] of [[false, "perfect"], [true, "good"]] as const) {
    const game = createGame(9, "level", 2);
    game.phase = "drop"; game.timer = DROP_TIME; game.dropX = 0.1; game.started = true;
    stepGame(game, DT, slowMode);
    assert.equal(game.verdict, want);
  }
});

test("worlds and levels: three worlds of four, a named finale closing each, one new thing per level", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.equal(WORLDS.length, 3);
  const seen = new Set<string>();
  const things = (def: typeof LEVELS[number]) => [def.sway >= 1 && "sway", def.shift > 0 && "shift", def.clock > 0 && "clock", def.heavy && "heavy", def.gusts > 0 && "gusts",
    def.roll > 0 && "roll", def.storm && "storm", def.dark && "dark", def.pontoon > 0 && "pontoon", def.limit < 1 && "limit"].filter(Boolean) as string[];
  LEVELS.forEach((def, index) => {
    assert.equal(def.world, Math.floor(index / 4));
    assert.equal(def.finale !== "", index % 4 === 3, `level ${index + 1}: finales close each world`);
    assert.ok(def.name && def.teach && def.goal >= 4 && def.stars[0] < def.stars[1] && def.stars[1] <= def.goal);
    const fresh = things(def).filter(thing => !seen.has(thing));
    if (index > 0) assert.ok(fresh.length <= 1, `level ${index + 1} adds one thing at most: ${fresh.join(", ")}`);
    if (index > 0 && !def.finale && index !== 8) assert.equal(fresh.length, 1, `level ${index + 1} adds exactly one thing`);
    things(def).forEach(thing => seen.add(thing));
    if (index > 0) assert.ok(def.goal >= LEVELS[index - 1].goal || def.world !== LEVELS[index - 1].world, "the load never shrinks within a world");
  });
  assert.equal(new Set(LEVELS.map(def => def.name)).size, LEVEL_COUNT);
  assert.equal(LEVELS[0].goal, 4, "level 1 is four sacks");
});

test("stars: none unless the truck filled, then by ঠিক মাঝে; easy tops out at two; the next star is exact", () => {
  const [two, three] = LEVELS[3].stars;
  assert.equal(starsOf(4, false, 99), 0);
  assert.equal(starsOf(4, true, 0), 1);
  assert.equal(starsOf(4, true, two), 2);
  assert.equal(starsOf(4, true, three), 3);
  assert.equal(starsOf(4, true, three, "e"), 2);
  assert.equal(toNextStar(4, 0), two);
  assert.equal(toNextStar(4, two), three - two);
  assert.equal(toNextStar(4, three), 0);
  assert.equal(toNextStar(4, three, "e"), 0);
  assert.equal(defOf({ kind: "endless", level: 1 }).goal, 0);
});

test("saved progress: the old best moves into level 1 once; a friend's far level opens no gap; junk reads as nothing", () => {
  assert.equal(migrateBest({}, "12"), 2);
  assert.equal(migrateBest({}, "30"), 3);
  assert.equal(migrateBest({}, "3"), 0);
  assert.equal(migrateBest({}, null), 0);
  assert.equal(migrateBest({ 1: 1 }, "30"), 0, "already moved");
  // The old game's stars keep their level numbers, so what was open stays open.
  assert.equal(openLevel({ 1: 3, 2: 1, 3: 2 }, []), 4);
  const ahead = nextAhead({ 1: 2, 2: 1 }, [], 9);
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel({ 1: 2, 2: 1, 9: 3 }, ahead), 3, "clearing a friend's level 9 doesn't open 3–8");
  assert.deepEqual(readAhead("[3,\"x\",99,3]"), [3]);
  assert.deepEqual(readAhead("{broken"), []);
});

test("content meets the SEO limits, has at least six FAQs and stays clear of gambling words", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("বস্তা"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  const copy = JSON.stringify(site);
  assert.doesNotMatch(copy, /টাকা জিত|বাজি|জুয়া|লটারি|আপনি|করুন/);
  assert.equal(copy, copy.normalize("NFC"));
});
