import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { STAGES, STAGE_COUNT, TEACH_SEED, stageAt } from "../lib/levels";
import { FINGER, LAMP, MIN_FOOTPRINT, MIN_REGION, PHONE_SCALE, VARIANTS, hintCircle, makePuzzle, nextHint, shadeOf, sweep, tapAt, type Puzzle } from "../lib/puzzle";
import { TEMPLATES } from "../lib/scenes";
import { changedShapes, colorDistance, itemBox, matrixOf, overlaps, pathPoints, SCENE_H, SCENE_W, type Box, type Look } from "../lib/shapes";

const inside = (inner: Box, outer: Box, slack = 0.01) =>
  inner.x >= outer.x - slack && inner.y >= outer.y - slack && inner.x + inner.w <= outer.x + outer.w + slack && inner.y + inner.h <= outer.y + outer.h + slack;
const centre = ({ region }: Puzzle["diffs"][number]) => [region.x + region.w / 2, region.y + region.h / 2] as const;

/** Everything a fair puzzle must be, checked from the shapes alone (independent of how the picker chose). */
function checkFair(puzzle: Puzzle, label: string) {
  const { items, looks, diffs, stage, motion } = puzzle;
  const base = items.map(item => item.look);
  assert.equal(diffs.length, stage.count, `${label}: count`);
  for (const kind of stage.must) assert.ok(diffs.some(diff => diff.kind === kind), `${label}: the level teaches ${kind} but has none`);
  for (const diff of diffs) assert.ok(stage.kinds[diff.kind], `${label}: ${diff.kind} isn't one of this level's kinds`);
  diffs.forEach((diff, index) => {
    const { region } = diff, item = items[diff.item];
    assert.ok(region.w * PHONE_SCALE >= 44 && region.h * PHONE_SCALE >= 44, `${label} #${index}: tap region under 44px at 390 wide`);
    assert.ok(region.w >= MIN_REGION && region.h >= MIN_REGION);
    assert.ok(region.x >= 0 && region.y >= 0 && region.x + region.w <= SCENE_W && region.y + region.h <= SCENE_H, `${label} #${index}: region off the picture`);
    for (const other of diffs.slice(index + 1)) assert.ok(!overlaps(region, other.region), `${label}: regions ${diff.name} and ${other.name} overlap`);
    assert.ok(diff.effort > 0 && diff.effort < 40, `${label} #${index}: effort ${diff.effort}`);
    if (diff.kind === "still") {
      assert.ok(motion[diff.item], `${label} ${diff.name}: still, but it never moved`);
      assert.ok(motion[diff.item]!.kind === "sway" ? motion[diff.item]!.amp >= 5 : motion[diff.item]!.amp >= 4, `${label} ${diff.name}: too little motion to see it stop`);
      const reach = sweep(item, item.look, motion[diff.item]);
      assert.ok(reach && region.w >= Math.min(SCENE_W, reach.w) - 0.01, `${label} ${diff.name}: the region misses the swing`);
      return;
    }
    // This difference alone changes shapes, and every changed shape sits inside its tap region.
    const changed = base.slice();
    changed[diff.item] = diff.look;
    const shapes = changedShapes(items, base, changed);
    assert.ok(shapes.length > 0, `${label} #${index} ${diff.kind} ${diff.name}: changes nothing`);
    for (const shape of shapes) assert.ok(inside(shape.box, region), `${label} #${index} ${diff.name}: a change pokes out of its region`);
    const footprint = shapes.reduce((box, shape) => ({ x: Math.min(box.x, shape.box.x), y: Math.min(box.y, shape.box.y), r: Math.max(box.r, shape.box.x + shape.box.w), b: Math.max(box.b, shape.box.y + shape.box.h) }), { x: Infinity, y: Infinity, r: -Infinity, b: -Infinity });
    const w = footprint.r - footprint.x, h = footprint.b - footprint.y;
    assert.ok(Math.max(w, h) >= MIN_FOOTPRINT.long && w * h >= MIN_FOOTPRINT.area, `${label} #${index} ${diff.name}: too small to see at 320px (${w.toFixed(1)}×${h.toFixed(1)})`);
    const before = item.look, after = diff.look;
    if (diff.kind === "color") assert.ok(colorDistance(before.color!, after.color!) >= stage.bold, `${label} ${diff.name}: colours too close`);
    if (diff.kind === "shade") { const away = colorDistance(before.color!, after.color!); assert.ok(away >= 40 && away <= 95, `${label} ${diff.name}: shade ${away}`); }
    if (diff.kind === "flip" || diff.kind === "turn") assert.ok(!item.draw(after).some(shape => shape.k === "t"), "words never flip or tilt");
    if (diff.kind === "count") assert.ok(after.count! < before.count! && after.count! >= (item.can?.count ?? 1));
    if (diff.kind === "size") assert.ok(after.scale! <= 0.8);
    if (diff.kind === "turn") assert.ok(Math.abs(after.turn!) >= 14 && Math.abs(after.turn!) <= 20);
    if (diff.kind === "shift") { const box = itemBox(item, after)!; assert.ok(Math.abs(after.dx!) >= 10 && box.x >= 1 && box.x + box.w <= SCENE_W - 1); }
    if (diff.kind === "text") assert.ok(Object.values(VARIANTS).includes(after.label!));
  });
  // The two pictures differ in exactly these places and nowhere else.
  for (const shape of changedShapes(items, looks[0], looks[1])) assert.ok(diffs.some(diff => inside(shape.box, diff.region)), `${label}: a stray change outside every region`);
}

test("every scene still parses on the dusk sky, and a turned box is never too small", () => {
  for (const template of TEMPLATES) {
    const items = template.build(makeRng(7), 3);
    for (const item of items) for (const shape of item.draw(item.look)) if (shape.k === "p") pathPoints(shape.d);
  }
  const square = { id: "x", name: "x", x: 100, y: 100, look: {}, draw: () => [{ k: "r" as const, x: -10, y: -10, w: 20, h: 20 }] };
  const turned = itemBox(square, { turn: 45 })!;
  assert.ok(Math.abs(turned.w - 20 * Math.SQRT2) < 0.01 && Math.abs(turned.h - 20 * Math.SQRT2) < 0.01);
  const [a, b, c, d] = matrixOf(square, { turn: 90, flip: true });
  assert.deepEqual([a, b, c, d].map(value => Math.round(value) + 0), [0, -1, -1, 0]);
});

test("all 30 levels are fair on several seeds: big regions, no overlaps, every change inside its region and visible", () => {
  for (const stage of STAGES) for (const seed of [1, 4242, 90_001, stage.level * 7777]) checkFair(makePuzzle(stage.level, seed), `level ${stage.level} seed ${seed}`);
  checkFair(makePuzzle(1, TEACH_SEED), "level 1 teaching seed");
});

test("the picker never fails, whatever the seed", () => {
  const rng = makeRng(2026);
  for (let run = 0; run < 60; run++) {
    const level = 1 + pick(rng, STAGE_COUNT), seed = 1 + pick(rng, 900_000_000);
    checkFair(makePuzzle(level, seed), `level ${level} seed ${seed}`);
  }
});

test("the same level and seed give the same two pictures on every phone; another seed gives others", () => {
  const strip = (puzzle: Puzzle) => JSON.stringify({ looks: puzzle.looks, diffs: puzzle.diffs, motion: puzzle.motion, items: puzzle.items.map(item => [item.id, item.x, item.y, item.s]) });
  for (const level of [1, 13, 30]) assert.equal(strip(makePuzzle(level, 555)), strip(makePuzzle(level, 555)));
  assert.notEqual(strip(makePuzzle(13, 4242)), strip(makePuzzle(13, 4243)));
});

test("the ladder: one new thing per level, a named finale per world, more differences as it climbs", () => {
  assert.equal(STAGE_COUNT, 30);
  assert.equal(stageAt(1).count, 3);
  assert.deepEqual(Object.keys(stageAt(1).kinds), ["missing"]);
  for (const stage of STAGES) {
    assert.ok(stage.lesson.length > 10 && stage.lesson.length < 90, `level ${stage.level} lesson`);
    assert.equal(Boolean(stage.finale), stage.level % 5 === 0);
    assert.ok(stage.three < stage.two);
  }
  const finales = STAGES.filter(stage => stage.finale).map(stage => stage.finale);
  assert.equal(new Set(finales).size, 6);
  // Each world's twist arrives in it, and nowhere before it.
  const first = (test: (s: (typeof STAGES)[number]) => boolean) => STAGES.find(test)!.level;
  assert.equal(first(s => Boolean(s.kinds.flip)), 6);
  assert.equal(first(s => s.movers), 11);
  assert.equal(first(s => Boolean(s.kinds.turn)), 16);
  assert.equal(first(s => Boolean(s.kinds.text)), 17);
  assert.equal(first(s => Boolean(s.kinds.shade)), 21);
  assert.equal(first(s => s.dark), 26);
  // No two levels in a row show the same place.
  for (let level = 2; level <= STAGE_COUNT; level++) assert.ok(stageAt(level).template !== stageAt(level - 1).template || stageAt(level).finale, `levels ${level - 1} and ${level}`);
});

test("taps: a fingertip's slack counts, the nearest wins, found ones answer 'again', and the dark only moves the lamp", () => {
  const puzzle = makePuzzle(7, 31), [first] = puzzle.diffs, [x, y] = centre(first);
  assert.deepEqual(tapAt(puzzle, [], x, y), { kind: "found", index: 0 });
  assert.deepEqual(tapAt(puzzle, [0], x, y), { kind: "again", index: 0 });
  assert.deepEqual(tapAt(puzzle, [], first.region.x - FINGER + 1, y), { kind: "found", index: 0 }, "just outside the region still counts");
  assert.equal(tapAt(puzzle, [], -5, 10).kind, "miss");
  assert.equal(tapAt(puzzle, [], Number.NaN, 10).kind, "miss");
  let missAt: [number, number] | null = null;
  for (let py = 2; py < SCENE_H && !missAt; py += 6) for (let px = 2; px < SCENE_W && !missAt; px += 6) if (tapAt(puzzle, [], px, py).kind === "miss") missAt = [px, py];
  assert.ok(missAt);
  assert.equal(tapAt(puzzle, [], x, y, { x: x + LAMP + 5, y }).kind, "lamp");
  assert.equal(tapAt(puzzle, [], x, y, { x: x + LAMP - 5, y }).kind, "found");
});

test("hints point at the hardest one left, and the first circle holds the whole region without centring on it", () => {
  for (const level of [3, 12, 25]) {
    const puzzle = makePuzzle(level, 99), index = nextHint(puzzle, [], []);
    for (const diff of puzzle.diffs) assert.ok(diff.effort <= puzzle.diffs[index].effort);
    assert.equal(nextHint(puzzle, [], [2]), 2, "a hinted one stays the hint until it's found");
    puzzle.diffs.forEach((diff, at) => {
      const circle = hintCircle(puzzle, at), { region } = diff;
      for (const [cx, cy] of [[region.x, region.y], [region.x + region.w, region.y], [region.x, region.y + region.h], [region.x + region.w, region.y + region.h]]) {
        assert.ok(Math.hypot(cx - circle.x, cy - circle.y) <= circle.r + 0.5, `level ${level} #${at}: the hint circle cuts the region`);
      }
      assert.ok(circle.r >= Math.max(region.w, region.h) / 2 + 30);
    });
  }
});

test("moving things: only from the river world on, their regions hold the whole swing", () => {
  for (const stage of STAGES) {
    const puzzle = makePuzzle(stage.level, 12);
    assert.equal(puzzle.motion.some(Boolean), stage.movers, `level ${stage.level}`);
    for (const diff of puzzle.diffs) {
      const motion = puzzle.motion[diff.item], item = puzzle.items[diff.item];
      if (!motion) continue;
      for (const look of [item.look, diff.look] as Look[]) {
        const reach = sweep(item, look, motion);
        if (reach) assert.ok(inside({ x: Math.max(0, reach.x), y: Math.max(0, reach.y), w: Math.min(SCENE_W, reach.x + reach.w) - Math.max(0, reach.x), h: Math.min(SCENE_H, reach.y + reach.h) - Math.max(0, reach.y) }, diff.region, 0.6), `level ${stage.level} ${diff.name}`);
      }
    }
  }
});

test("a shade is the same colour, a little lighter or darker", () => {
  for (const color of ["#d9433b", "#2f6fb2", "#f4d03f", "#ffffff", "#2b2b2b"]) {
    const shade = shadeOf(color, 0.32), away = colorDistance(color, shade);
    assert.match(shade, /^#[0-9a-f]{6}$/);
    assert.ok(away > 20 && away < 150, `${color} → ${shade}: ${away}`);
  }
});
