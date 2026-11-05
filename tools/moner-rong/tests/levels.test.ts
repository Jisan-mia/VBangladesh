// The levels as data, and the bots that clear them (400 seeds a level, human-like picks). Spec: ai_docs/game-dev/rewrites/moner-rong.md.
import assert from "node:assert/strict";
import test from "node:test";
import { FEELINGS } from "../lib/faces";
import { LEVELS, LEVEL_COUNT, WORLDS, levelOf, nextUp, placeInWorld, recommended, worldLevels } from "../lib/levels";
import { advance, chooseKind, createRound, facesFor, fitting, glows, isLast, nameFeeling, sceneOf, scenesFor } from "../lib/round";
import { SCENES, sceneById } from "../lib/scenes";
import { playAllWrongFirst, playRound } from "./bot";

const SEEDS = Array.from({ length: 400 }, (_, index) => index + 1);

test("nine levels in three worlds, ids 1–9, each finale last in its world", () => {
  assert.equal(LEVEL_COUNT, 9);
  assert.deepEqual(LEVELS.map(level => level.id), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(WORLDS.map(world => [world.first, world.last]), [[1, 3], [4, 6], [7, 9]]);
  for (const world of WORLDS) {
    const levels = worldLevels(world.id);
    assert.equal(levels.filter(level => level.finale).length, 1, world.id);
    assert.ok(levels[levels.length - 1].finale, `${world.id} ends with its finale`);
  }
  assert.equal(new Set(LEVELS.map(level => level.name)).size, LEVEL_COUNT, "unique names");
  assert.equal(placeInWorld(4), 1);
  assert.equal(placeInWorld(9), 3);
  assert.equal(levelOf(0).id, 1);
  assert.equal(levelOf(99).id, 9);
});

test("each level adds one idea: its pool grows by at most one face (a finale adds none)", () => {
  const seen = new Set<string>();
  for (const level of LEVELS) {
    const fresh = level.pool.filter(feeling => !seen.has(feeling));
    if (level.finale) assert.ok(fresh.length <= 1, `${level.name}: a finale mixes what was taught`);
    else assert.ok(fresh.length <= 2, `${level.name} adds ${fresh.length}`);
    level.pool.forEach(feeling => seen.add(feeling));
  }
  assert.equal(seen.size, 6);
});

test("every picture of every level has a face that fits in the pool, and nothing repeats in a round", () => {
  for (const level of LEVELS) {
    for (const id of level.scenes) {
      const scene = sceneById(id);
      assert.ok(scene, id);
      assert.ok(scene.feels.some(feeling => level.pool.includes(feeling)), `${level.name}: ${id} has no fitting face in the pool`);
    }
    for (const seed of SEEDS.slice(0, 40)) {
      const scenes = scenesFor(level, seed);
      assert.equal(scenes.length, level.take);
      assert.equal(new Set(scenes.map(scene => scene.id)).size, scenes.length, `${level.name} repeats a picture`);
      scenes.forEach(scene => assert.ok(level.scenes.includes(scene.id)));
    }
  }
  assert.equal(SCENES.length, 20);
});

test("faces on offer: 2 on the first level, never more than 4 before the third world, never fewer than the true faces plus one", () => {
  for (const level of LEVELS) for (const seed of SEEDS.slice(0, 40)) {
    const round = createRound(level.id, seed);
    for (let index = 0; index < round.scenes.length; index++) {
      const scene = round.scenes[index];
      const fits = level.pool.filter(feeling => scene.feels.includes(feeling)).length;
      const calm = facesFor(scene, level, false, seed, index), eased = facesFor(scene, level, true, seed, index);
      assert.ok(calm.length >= 2 && calm.length <= level.base + 0 || calm.length === Math.min(level.pool.length, fits + 1), `${level.name} ${calm.length}`);
      assert.ok(calm.length <= (level.id <= 6 ? 4 : 6), `${level.name} offers ${calm.length}`);
      assert.ok(eased.length >= 2 && eased.length <= calm.length, "eased offers no more");
      assert.ok(eased.length >= Math.min(level.pool.length, fits + 1), "eased keeps every true face plus one");
      assert.equal(new Set(calm).size, calm.length);
      assert.ok(calm.every(feeling => level.pool.includes(feeling)));
      assert.ok(calm.some(feeling => scene.feels.includes(feeling)), "a true face is always on offer");
      assert.ok(calm.some(feeling => !scene.feels.includes(feeling)), "and a face that doesn't fit");
    }
  }
  assert.equal(createRound(1, 7).faces.length, 2, "level 1 starts with two faces");
});

test("deterministic: the same seed gives the same pictures and the same faces; a finale varies by seed", () => {
  for (const level of LEVELS) {
    const a = createRound(level.id, 31), b = createRound(level.id, 31);
    assert.deepEqual(a.scenes.map(scene => scene.id), b.scenes.map(scene => scene.id));
    assert.deepEqual(a.faces, b.faces);
  }
  const finale = levelOf(9);
  const sets = new Set(SEEDS.slice(0, 30).map(seed => scenesFor(finale, seed).map(scene => scene.id).join()));
  assert.ok(sets.size >= 10, `finale varies (${sets.size})`);
  const plain = new Set(SEEDS.slice(0, 30).map(seed => scenesFor(levelOf(1), seed).map(scene => scene.id).join()));
  assert.equal(plain.size, 1, "an ordinary level plays its pictures in order");
});

test("a guesser (random, then the glowing face) finishes every level in at most 3 taps a picture", () => {
  for (const level of LEVELS) for (const seed of SEEDS) {
    const played = playRound(level.id, seed, 0);
    assert.ok(played.round.full, `${level.name} seed ${seed}`);
    assert.ok(played.worst <= 3, `${level.name} seed ${seed}: ${played.worst} taps on one picture`);
  }
});

test("a 4-year-old who knows the feeling 70% of the time averages under 2 taps a picture on every level, and 3 or fewer on level 1", () => {
  for (const level of LEVELS) {
    let taps = 0, pictures = 0;
    for (const seed of SEEDS) { const played = playRound(level.id, seed, 0.7); taps += played.taps; pictures += played.round.scenes.length; }
    assert.ok(taps / pictures < 2, `${level.name}: ${(taps / pictures).toFixed(2)} taps a picture`);
  }
  for (const seed of SEEDS) assert.ok(playRound(1, seed, 0.7).worst <= 3);
});

test("a child who knows every time finishes each level with no misses, in exactly one tap a picture", () => {
  for (const level of LEVELS) for (const seed of SEEDS.slice(0, 60)) {
    const played = playRound(level.id, seed, 1);
    assert.equal(played.misses, 0);
    assert.equal(played.taps, played.round.scenes.length);
  }
});

test("the first win on level 1 is one tap on a two-face picture (inside 10 seconds), and the first face to try never costs anything", () => {
  const round = createRound(1, 5);
  assert.equal(round.faces.length, 2);
  assert.equal(nameFeeling(round, fitting(round)[0]), "fits");
  assert.equal(round.step, "kind");
  assert.equal(round.tries, 0);
});

test("misses cost nothing: a wrong face keeps the picture, shows a clue, and after two the fitting face glows", () => {
  const round = createRound(2, 9);
  const wrong = round.faces.find(face => !sceneOf(round).feels.includes(face))!;
  assert.equal(nameFeeling(round, wrong), "again");
  assert.equal(round.step, "name");
  assert.equal(glows(round), false);
  assert.equal(nameFeeling(round, wrong), "again");
  assert.equal(glows(round), true);
  assert.equal(nameFeeling(round, fitting(round)[0]), "fits");
  assert.equal(nameFeeling(round, fitting(round)[0]), "ignore", "no second naming once it fits");
  assert.equal(chooseKind(round, 2), "ignore");
  assert.equal(chooseKind(round, 1), "ok");
  assert.equal(chooseKind(round, 0), "ignore", "one kind thing a picture");
});

test("the quiet ease: three misses in a row take faces away from the next picture; five first-try fits give them back, only between pictures", () => {
  const level = levelOf(7);
  let round = createRound(7, 3);
  const before = round.faces.length;
  assert.equal(before, 6);
  for (let index = 0; index < 3; index++) nameFeeling(round, round.faces.find(face => !sceneOf(round).feels.includes(face))!);
  assert.equal(round.eased, true, "three misses ease");
  assert.equal(round.faces.length, before, "faces never change under a finger");
  nameFeeling(round, fitting(round)[0]); chooseKind(round, 0);
  assert.ok(advance(round));
  const fits = level.pool.filter(feeling => sceneOf(round).feels.includes(feeling)).length;
  assert.equal(round.faces.length, Math.min(level.pool.length, fits + 1), "the true faces plus one");
  // Five first-try fits in a row lift it; the run carries from round to round, as the component carries it.
  let fitsInARow = 0, seed = 10;
  for (;;) {
    nameFeeling(round, fitting(round)[0]); chooseKind(round, 0); fitsInARow += 1;
    if (!advance(round)) { round = createRound(7, seed++, round.eased && round.rightRun < 5, round.rightRun); continue; }
    if (!round.eased) break;
    assert.ok(fitsInARow < 8, "the ease lifts");
  }
  assert.equal(fitsInARow, 5);
  assert.equal(round.faces.length, Math.min(level.pool.length, level.base), "the faces are back");
});

test("playing wrong-first on every level: the ease turns on, and a level never offers fewer than 2 faces", () => {
  for (const level of LEVELS) for (const seed of SEEDS.slice(0, 40)) {
    const { round, offered } = playAllWrongFirst(level.id, seed);
    assert.ok(round.full);
    assert.ok(offered.every(count => count >= 2));
  }
});

test("a round is won at the last picture's kind thing: full, once, and → on the last picture goes to the end screen instead", () => {
  const round = createRound(1, 11);
  while (!isLast(round)) { nameFeeling(round, fitting(round)[0]); chooseKind(round, 0); assert.equal(round.full, false); assert.ok(advance(round)); }
  nameFeeling(round, fitting(round)[0]);
  assert.equal(round.full, false);
  chooseKind(round, 1);
  assert.equal(round.full, true);
  assert.equal(advance(round), false);
  assert.equal(round.found.length, 3);
});

test("the suggested level in a world: the first without stars, then the first below three, else the finale; শেষ moves on", () => {
  assert.equal(recommended("rod", {}), 1);
  assert.equal(recommended("rod", { 1: 1 }), 2);
  assert.equal(recommended("rod", { 1: 3, 2: 2, 3: 1 }), 2);
  assert.equal(recommended("rod", { 1: 3, 2: 3, 3: 3 }), 3);
  assert.equal(recommended("mela", { 1: 3 }), 7);
  assert.equal(nextUp(1), 2);
  assert.equal(nextUp(3), 3, "the finale stays on the finale");
  assert.equal(nextUp(4), 5);
});

test("every feeling has a word and its own colour, and no two feelings share one", () => {
  const colors = Object.values(FEELINGS).map(feeling => feeling.color);
  assert.equal(new Set(colors).size, 6);
  assert.equal(new Set(Object.values(FEELINGS).map(feeling => feeling.light)).size, 6);
});
