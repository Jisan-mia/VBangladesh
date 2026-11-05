// The field and the levels as data: old links open the same ridge, every curve is followable, every obstacle is fair, each level adds one thing.
import assert from "node:assert/strict";
import test from "node:test";
import {
  bridgeHalf, centreAt, gustAt, makeField, safeOffset, slipAt, slopeAt, windAt, FIRST_OBSTACLE, FOOT, GUST_PUSH, MIN_GAP, SLIP_BRIDGE, SLIP_GOAT, SLIP_MUD, SLIP_NONE, SLIP_PUDDLE, W,
} from "../lib/field";
import { defOfLevel, isLevel, legacySpec, LEVELS, LEVEL_COUNT, MODES, sceneOf, specOf, WORLDS, type LevelSpec, type Mode } from "../lib/levels";
import { TAP_SPEED } from "../lib/rules";
import { makeField as oldMakeField } from "./old-walk";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

test("twenty fields in four worlds of five; the 5th of each is the named finale", () => {
  assert.equal(LEVELS.length, 20);
  assert.equal(WORLDS.length, 4);
  assert.deepEqual([1, 5, 6, 10, 11, 15, 16, 20].map(sceneOf), ["morning", "morning", "noon", "noon", "afternoon", "afternoon", "evening", "evening"]);
  assert.deepEqual(LEVELS.filter(def => def.finale).map(def => def.level), [5, 10, 15, 20]);
  for (const def of LEVELS) {
    assert.equal(def.level, LEVELS.indexOf(def) + 1);
    assert.equal(def.world, Math.floor((def.level - 1) / 5));
    assert.equal(def.scene, WORLDS[def.world].scene);
    assert.ok(def.name.length > 0 && def.teach.length > 10, `level ${def.level} has a name and a teach line`);
    if (def.finale) assert.equal(def.finale, def.name, "a finale's bar carries its name");
  }
  assert.equal(new Set(LEVELS.map(def => def.name)).size, 20);
  assert.ok(isLevel(1) && isLevel(20) && !isLevel(0) && !isLevel(21) && !isLevel(2.5));
});

/** What a level shows for the first time in the whole game, and the steps in what it asks. */
const features = (spec: LevelSpec) => ({
  pull: spec.pull > 0, puddles: spec.puddles > 0, goats: spec.goats > 0, bridges: spec.bridges > 0, wind: spec.wind > 0, gusts: spec.gusts > 0,
  rain: spec.rain, tired: spec.tired > 0, dark: spec.dark > 0, flies: spec.flies,
});
test("each level adds one thing: at most one feature seen for the first time, and a real step in what it asks", () => {
  const seen = new Set<string>();
  const first: Record<string, number> = {};
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const now = features(LEVELS[n - 1]), fresh = Object.entries(now).filter(([key, on]) => on && !seen.has(key)).map(([key]) => key);
    for (const key of fresh) { seen.add(key); first[key] = n; }
    assert.ok(fresh.length <= 1, `level ${n} introduces ${fresh.join(", ")}`);
    if (n === 1 || LEVELS[n - 1].finale) continue;
    const a = LEVELS[n - 2], b = LEVELS[n - 1];
    const step = fresh.length > 0 || a.half - b.half >= 5 || b.speed - a.speed >= 8 || b.bend - a.bend >= 0.1;
    assert.ok(step, `level ${n} (${b.name}) must change something the player feels`);
  }
  assert.deepEqual({ ...first }, { pull: 3, puddles: 4, goats: 7, bridges: 9, wind: 11, gusts: 12, rain: 13, dark: 16, tired: 17, flies: 18 });
  // a finale brings nothing the world hasn't shown
  for (const n of [5, 10, 15, 20]) for (const [key, on] of Object.entries(features(LEVELS[n - 1]))) if (on) assert.ok(first[key] <= n, `${key} in finale ${n}`);
  // and every finale is the longest field of its world
  for (const n of [5, 10, 15, 20]) for (let m = n - 4; m < n; m++) assert.ok(LEVELS[n - 1].metres > LEVELS[m - 1].metres, `finale ${n} outlasts ${m}`);
});

test("old links: the old levelSpec and field generator are kept exactly, so an old link opens the same ridge, puddles, goats and wind", () => {
  for (const level of levels) {
    for (const seed of [1, 7, 4242, 99999, 123456789]) {
      const now = makeField(legacySpec(level), seed), then = oldMakeField(level, seed);
      assert.deepEqual({ path: now.path, wind: now.wind, obstacles: now.obstacles, decor: now.decor, length: now.length }, { path: then.path, wind: then.wind, obstacles: then.obstacles, decor: then.decor, length: then.length }, `level ${level} seed ${seed}`);
      assert.equal(now.gusts.length, 0);
      assert.equal(now.spec.pull, 0, "no edge pull on the old fields");
    }
  }
  // The old numbers, from the shipped game: [metres, speed, half, bend, puddles, goats, wind].
  const OLD = [
    [30, 62, 30, 0.14, 0, 0, 0], [35, 63, 29, 0.19, 0, 0, 0], [40, 64, 29, 0.21, 0, 0, 0], [45, 65, 28, 0.24, 1, 0, 0], [50, 67, 28, 0.26, 1, 0, 0],
    [55, 68, 27, 0.28, 1, 0, 0], [60, 69, 27, 0.3, 2, 1, 0], [65, 70, 26, 0.32, 2, 1, 0], [70, 71, 25, 0.34, 2, 1, 0], [75, 72, 25, 0.35, 3, 1, 0],
    [80, 74, 24, 0.37, 3, 2, 10], [85, 75, 24, 0.39, 3, 2, 11], [90, 76, 23, 0.4, 4, 2, 12], [95, 77, 22, 0.42, 4, 2, 13], [100, 78, 22, 0.43, 4, 3, 14],
    [105, 79, 21, 0.45, 5, 3, 15], [110, 81, 21, 0.46, 5, 3, 16], [115, 82, 20, 0.47, 5, 3, 17], [120, 83, 20, 0.49, 5, 3, 18], [125, 84, 19, 0.5, 5, 3, 19],
  ];
  OLD.forEach(([metres, speed, half, bend, puddles, goats, wind], index) => {
    const spec = legacySpec(index + 1);
    assert.deepEqual([spec.metres, spec.speed, spec.half, spec.bend, spec.puddles, spec.goats, spec.wind], [metres, speed, half, bend, puddles, goats, wind], `old level ${index + 1}`);
    assert.deepEqual([spec.bridges, spec.gusts, spec.pull, spec.rain, spec.tired, spec.dark, spec.flies], [0, 0, 0, false, 0, 0, false]);
  });
});

test("same seed, same field, in every mode; another seed, another field", () => {
  for (const mode of MODES) {
    const a = makeField(specOf(14, mode), 4242), b = makeField(specOf(14, mode), 4242), c = makeField(specOf(14, mode), 4243);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a.obstacles, c.obstacles);
    assert.equal(centreAt(a, 0), W / 2, "every field starts at the middle");
  }
  const easy = specOf(9, "e"), normal = specOf(9, "n"), hard = specOf(9, "h");
  assert.ok(easy.half > normal.half && normal.half > hard.half && easy.speed < normal.speed && normal.speed < hard.speed);
  assert.ok(easy.pull < normal.pull);
});

/** The steering a spot asks for, px/s: following the bend plus fighting the wind. */
test("every curve is followable at the field's speed, holding a side only", () => {
  for (const mode of MODES) for (const level of levels) {
    for (let seed = 1; seed <= 30; seed++) {
      const field = makeField(specOf(level, mode), seed), { half, speed, bend, tired } = field.spec;
      let need = 0;
      for (let d = 0; d <= field.length + 400; d += 2) {
        assert.ok(Math.abs(slopeAt(field, d)) <= bend + 1e-9, `level ${level} seed ${seed}: slope at ${d}`);
        const steer = TAP_SPEED * (1 - tired * Math.min(1, d / field.length));
        need = Math.max(need, (Math.abs(slopeAt(field, d)) * speed + Math.abs(windAt(field, d))) / steer);
        const x = centreAt(field, d);
        assert.ok(x - half >= 8 && x + half <= W - 8, `level ${level} ${mode} seed ${seed}: ridge leaves the board at ${d}`);
      }
      assert.ok(need <= 0.92, `level ${level} ${mode} seed ${seed}: needs ${(need * 100).toFixed(0)}% of the feet's speed`);
    }
  }
});

test("obstacles are fair: never in the opening, spaced apart, always a dry lane wide enough to stand in", () => {
  for (const mode of MODES) for (const level of levels) {
    for (let seed = 1; seed <= 40; seed++) {
      const field = makeField(specOf(level, mode), seed), half = field.spec.half;
      assert.equal(field.obstacles.length, field.spec.puddles + field.spec.goats + field.spec.bridges);
      field.obstacles.forEach((o, i) => {
        assert.ok(o.d >= FIRST_OBSTACLE && o.d + o.len <= field.length - 40, `level ${level}: obstacle at ${o.d}`);
        if (i) { const prev = field.obstacles[i - 1]; assert.ok(o.d - prev.d - prev.len >= MIN_GAP, `level ${level} ${mode} seed ${seed}: gap ${o.d - prev.d - prev.len}`); }
        const lane = o.kind === "bridge" ? 2 * o.hi : o.side > 0 ? o.lo - FOOT + half : half - (o.hi + FOOT);
        assert.ok(lane >= 14, `level ${level} ${mode} seed ${seed}: dry lane ${lane.toFixed(1)}px`);
        const mid = o.d + o.len / 2;
        assert.equal(slipAt(field, mid, safeOffset(field, mid)), SLIP_NONE, "the dry lane's middle is dry");
        if (o.kind === "bridge") assert.equal(o.hi, bridgeHalf(half));
      });
      // The edge is mud, anywhere.
      assert.equal(slipAt(field, 10, half + 1), SLIP_MUD);
      assert.equal(slipAt(field, 10, -half - 1), SLIP_MUD);
      assert.equal(slipAt(field, 10, 0), SLIP_NONE);
    }
  }
});

test("slip reasons: a puddle, a goat and the bridge's edge each name themselves", () => {
  const field = makeField(specOf(20, "n"), 5);
  const puddle = field.obstacles.find(o => o.kind === "puddle")!, goat = field.obstacles.find(o => o.kind === "goat")!, bridge = field.obstacles.find(o => o.kind === "bridge")!;
  const inside = (o: typeof puddle) => (o.lo + o.hi) / 2;
  assert.equal(slipAt(field, puddle.d + 5, inside(puddle)), SLIP_PUDDLE);
  assert.equal(slipAt(field, goat.d + 5, inside(goat)), SLIP_GOAT);
  assert.equal(slipAt(field, bridge.d + 5, 0), SLIP_NONE);
  assert.equal(slipAt(field, bridge.d + 5, bridge.hi + 2), SLIP_BRIDGE);
  assert.equal(slipAt(field, bridge.d + 5, -bridge.hi - 2), SLIP_BRIDGE);
  // the same offset is fine on the open ridge
  assert.equal(slipAt(field, bridge.d - 30, bridge.hi + 2), SLIP_NONE);
});

test("gusts: only where the level has them, inside the field, apart from each other, never harder than GUST_PUSH", () => {
  for (const level of levels) {
    for (let seed = 1; seed <= 40; seed++) {
      const field = makeField(specOf(level, "n"), seed);
      assert.equal(field.gusts.length, field.spec.gusts, `level ${level}`);
      field.gusts.forEach((gust, i) => {
        assert.ok(gust.d >= 300 && gust.d + gust.len <= field.length - 100, `level ${level} seed ${seed}: gust at ${gust.d}`);
        if (i) assert.ok(gust.d - (field.gusts[i - 1].d + field.gusts[i - 1].len) >= 80, "gusts keep apart");
        assert.equal(Math.abs(gust.push), GUST_PUSH);
        assert.ok(Math.abs(gustAt(field, gust.d + gust.len / 2)) > GUST_PUSH * 0.95);
        assert.equal(gustAt(field, gust.d - 1), 0);
      });
    }
  }
});

test("the mode only changes how wide, how fast and how hard it pulls: the same ridge for a seed", () => {
  const a = makeField(specOf(8, "e"), 31), b = makeField(specOf(8, "h"), 31);
  assert.deepEqual(a.path, b.path);
  assert.equal(a.length, b.length);
  assert.equal(defOfLevel(8).metres, a.spec.metres);
  const modes: Mode[] = ["e", "n", "h"];
  assert.deepEqual(modes.map(m => specOf(1, m).metres), [24, 24, 24]);
});
