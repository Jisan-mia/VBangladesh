// The ladder: three classes of four periods, each adding one thing and ending in a named finale; fair to a careful classmate,
// and tuned with headless players (tests/bot.ts) to the rates the design promises.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { BACK, BLIND, COUGH, DROP, LOOK, makeClass, PEEK, TELL, WIPE } from "../lib/class";
import { carefulRun, starTargets } from "../lib/bot";
import { LEVEL_COUNT, LEVELS, levelDef, MODE_INFO, nextAhead, openLevel, readAhead, readBests, starsOf, toNextStar, WORLDS, type Mode } from "../lib/levels";
import { casualRun, median, rate, recklessRun, SEEDS } from "./bot";

const FINALES = [4, 8, 12];
const NORMAL = [1, 2, 3, 5, 6, 7, 9, 10, 11];
const MODES: Mode[] = ["e", "n", "h"];

test("three classes of four periods, each ending in a named finale", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.equal(WORLDS.length, 3);
  for (let world = 0; world < 3; world++) assert.equal(LEVELS.filter(def => def.world === world).length, 4);
  assert.deepEqual(LEVELS.map((def, index) => def.finale ? index + 1 : 0).filter(Boolean), FINALES);
  for (const level of FINALES) assert.ok(levelDef(level).finale!.boss.length > 3, `finale ${level} has a name`);
  for (const def of LEVELS) { assert.ok(def.name.length > 0 && def.teach.length > 10); assert.ok(def.benches >= 5 && def.benches <= 8); }
  assert.equal(LEVELS[0].benches, 5, "level 1 is the short one");
});

test("each level adds exactly one new thing", () => {
  const features = (level: number) => {
    const d = levelDef(level), set = new Set<string>();
    if (d.cough > 0) set.add("cough");
    if (d.peek > 0) set.add("peek");
    if (d.finale?.watcher) set.add(`watcher-${d.finale.watcher.kind}`);
    if (d.glasses > 0) set.add("glasses");
    if (d.duster > 0) set.add("duster");
    if (d.sleepers.length) set.add("sleeper");
    if (d.dark) set.add("dark");
    if (d.double > 0) set.add("double");
    if (d.tell[0] < 0.5 && !d.head) set.add("quick");
    if (d.head) set.add("head");
    return set;
  };
  const seen = new Set<string>();
  const fresh: string[][] = [];
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const now = features(level), added = [...now].filter(item => !seen.has(item));
    fresh.push(added);
    for (const item of now) seen.add(item);
  }
  assert.deepEqual(fresh[0], []);
  for (let level = 2; level <= LEVEL_COUNT; level++) assert.equal(fresh[level - 1].length, 1, `level ${level} adds ${JSON.stringify(fresh[level - 1])}`);
});

test("what each level adds is really in its routines, and not before", () => {
  const kinds = (level: number) => new Set(SEEDS.flatMap(seed => Array.from(makeClass(seed, level).kinds)));
  assert.deepEqual([...kinds(1)].sort(), [LOOK, 0, TELL].sort(), "level 1: write, tell, look and nothing else");
  assert.ok(kinds(2).has(COUGH) && !kinds(2).has(PEEK) && !kinds(2).has(DROP));
  assert.ok(kinds(3).has(PEEK));
  assert.ok(kinds(5).has(BLIND) && !kinds(5).has(WIPE));
  assert.ok(kinds(6).has(WIPE));
  assert.ok(kinds(10).has(BACK) && !kinds(9).has(BACK), "the second look arrives at level 10");
  assert.equal(makeClass(1, 1).wKinds.length, 0);
  assert.ok(makeClass(1, 4).watcher === "monitor" && makeClass(1, 8).watcher === "door", "the finales' watchers");
  assert.equal(makeClass(1, 12).watcher, "", "the headmaster teaches level 12 himself");
  assert.equal(makeClass(1, 12).teacher, "head");
  assert.ok(makeClass(1, 7).sleeper.some(Boolean) && makeClass(1, 7).throwAt.some(Boolean), "a sleeper means a throw");
  assert.ok(makeClass(1, 9).dKinds.length > 0 && makeClass(1, 8).dKinds.length === 0, "the power cuts begin at level 9");
  assert.ok(makeClass(1, 12).dKinds.length === 0, "the headmaster's room has a generator");
  assert.equal(makeClass(1, 4).lives, 3);
  assert.equal(makeClass(1, 3).lives, 0);
});

test("every class is fair: a careful classmate with a 0.35 s reaction is never caught, in every mode", () => {
  for (const mode of MODES) for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of SEEDS.slice(0, 15)) {
    const slow = carefulRun(makeClass(seed, level, mode), 0.35);
    assert.equal(slow.catches, 0, `level ${level}${mode} seed ${seed}`);
    assert.ok(slow.won);
  }
});

test("stars: reaching the end is one, a careful classmate earns two, riding the edge of every warning earns three", () => {
  for (const mode of ["n", "h"] as const) for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of SEEDS.slice(0, 15)) {
    const targets = starTargets(seed, level, mode), klass = makeClass(seed, level, mode);
    const daring = carefulRun(klass, 0.25, true), careful = carefulRun(klass), slow = carefulRun(klass, 0.35);
    assert.equal(daring.catches, 0, `level ${level}${mode} seed ${seed}: the daring classmate is never caught either`);
    assert.equal(starsOf(daring.tenths, targets, mode), 3, `level ${level}${mode} seed ${seed}: three stars are within reach`);
    assert.ok(starsOf(careful.tenths, targets, mode) >= 2, `level ${level}${mode} seed ${seed}: careful earns 2`);
    assert.ok(starsOf(slow.tenths, targets, mode) >= 2, `level ${level}${mode} seed ${seed}: a 0.35 s reaction earns 2`);
    assert.ok(targets.two >= targets.three + 10);
  }
});

test("level 1 is a gift: a casual classmate wins in about ten seconds, a reckless one too", () => {
  const casual = SEEDS.map(seed => casualRun(seed, 1));
  assert.equal(rate(casual.map(r => r.won)), 1);
  assert.ok(median(casual.map(r => r.tenths)) <= 100, `median ${median(casual.map(r => r.tenths))} tenths`);
  assert.ok(rate(SEEDS.map(seed => recklessRun(seed, 1).won)) === 1, "no way to lose level 1");
  assert.ok(Math.max(...casual.map(r => r.tenths)) <= 140);
});

test("a casual classmate (0.3–0.45 s) clears every level, finales at 90% or better, and is rarely caught before them", () => {
  for (const mode of MODES) for (let level = 1; level <= LEVEL_COUNT; level++) {
    const runs = SEEDS.map(seed => casualRun(seed, level, mode)), wins = rate(runs.map(r => r.won));
    assert.ok(wins >= (FINALES.includes(level) ? 0.9 : 0.98), `level ${level}${mode}: wins ${wins}`);
    if (NORMAL.includes(level)) assert.ok(runs.reduce((sum, r) => sum + r.catches, 0) / runs.length <= 0.5, `level ${level}${mode} is gentle`);
  }
});

test("a slow human (0.5 s and up) still wins the first two classes' finales, and the headmaster's class is a real test", () => {
  const seeds = Array.from({ length: 100 }, (_, index) => index * 7919 + 13);
  const winRate = (level: number) => rate(seeds.map(seed => casualRun(seed, level, "n", 0, 0.5).won));
  assert.ok(winRate(4) >= 0.95);
  assert.ok(winRate(8) >= 0.9);
  const last = winRate(12);
  assert.ok(last >= 0.4 && last <= 0.92, `level 12 wins ${last}`);
  for (const level of NORMAL) assert.ok(winRate(level) >= 0.98, `level ${level}`);
});

test("a reckless classmate (never lets go) wins every ordinary level but loses almost every finale", () => {
  for (const level of NORMAL) assert.equal(rate(SEEDS.map(seed => recklessRun(seed, level).won)), 1, `level ${level}`);
  for (const level of FINALES) assert.ok(rate(SEEDS.map(seed => recklessRun(seed, level).won)) <= 0.3, `finale ${level}`);
  // Reckless is also slower than careful: being caught costs time.
  const reckless = median(SEEDS.map(seed => recklessRun(seed, 5).tenths)), careful = median(SEEDS.map(seed => carefulRun(makeClass(seed, 5)).tenths));
  assert.ok(reckless > careful * 1.25, `reckless ${reckless} vs careful ${careful}`);
  let threes = 0, total = 0;
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of SEEDS) {
    const run = recklessRun(seed, level);
    if (run.won) { total++; if (starsOf(run.tenths, starTargets(seed, level), "n") === 3) threes++; }
  }
  assert.ok(threes / total <= 0.03, `never letting go earned three stars ${threes} times in ${total}`);
});

test("a finale ends on the third catch, an ordinary level never does", () => {
  for (const level of [3, 4]) {
    const reckless = SEEDS.map(seed => recklessRun(seed, level));
    if (level === 3) assert.ok(reckless.every(r => r.won));
    else assert.ok(reckless.every(r => !r.won ? r.catches === 3 : r.catches <= 2));
  }
});

test("modes keep their promise: easy warns longer and tops out at two stars; hard warns less", () => {
  const warn = (mode: Mode) => Math.min(...SEEDS.flatMap(seed => { const k = makeClass(seed, 5, mode); return Array.from(k.kinds).flatMap((kind, i) => kind === TELL ? [k.durs[i]] : []); }));
  assert.ok(warn("e") > warn("n") && warn("n") > warn("h"));
  const targets = { three: 100, two: 150 };
  assert.equal(starsOf(90, targets, "n"), 3);
  assert.equal(starsOf(90, targets, "e"), 2, "easy has no third star");
  assert.equal(starsOf(90, targets, "h"), 3);
  assert.equal(starsOf(300, targets, "e"), 1);
  assert.equal(starsOf(90, targets, "n", false), 0, "a lost finale has none");
  assert.ok(MODE_INFO.e.maxStars === 2 && MODE_INFO.n.maxStars === 3);
  // The sharpest classmate still wins everything on hard.
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of SEEDS.slice(0, 10)) assert.ok(carefulRun(makeClass(seed, level, "h")).won);
});

test("star thresholds and toNextStar agree", () => {
  const t = { three: 100, two: 150 };
  assert.deepEqual([60, 100, 101, 150, 151, 900].map(x => starsOf(x, t, "n")), [3, 3, 2, 2, 1, 1]);
  assert.equal(toNextStar(120, t, "n"), 20);
  assert.equal(toNextStar(200, t, "n"), 50);
  assert.equal(toNextStar(90, t, "n"), 0, "already three");
  assert.equal(toNextStar(120, t, "e"), 0, "easy has no third star to chase");
});

test("saved progress: old stars carry over, a friend's far level records stars without opening the levels between", () => {
  const old = readLevels(JSON.stringify({ 1: 3, 2: 2, 5: 1, 9: 2, 12: 1, 13: 3 }), LEVEL_COUNT);
  assert.deepEqual(old, { 1: 3, 2: 2, 5: 1, 9: 2, 12: 1 }, "junk and levels past 12 are dropped");
  assert.equal(openLevel({ 1: 3, 2: 2, 5: 1 }, []), unlockedLevel({ 1: 3, 2: 2, 5: 1 }, LEVEL_COUNT), "saved progress opens exactly what it did");
  assert.equal(openLevel({ 1: 2 }, []), 2);
  const ahead = nextAhead({ 1: 2 }, [], 9);
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel({ 1: 2, 9: 3 }, ahead), 2, "level 9 is recorded but 3–8 stay shut");
  assert.equal(openLevel({ 1: 2, 2: 2, 9: 3 }, ahead), 3);
  assert.equal(openLevel({ 1: 2 }, [9]), 2);
  assert.deepEqual(nextAhead({ 1: 2 }, [], 2), [], "the next level is not 'ahead'");
  assert.deepEqual(readAhead("[9, 3, 99, \"x\", 9]"), [3, 9]);
  assert.deepEqual(readAhead("junk"), []);
  assert.deepEqual(readBests(JSON.stringify({ "4n": 130, "13n": 5, "2x": 5, "3e": 0, "1h": 99.5 })), { "4n": 130 });
});
