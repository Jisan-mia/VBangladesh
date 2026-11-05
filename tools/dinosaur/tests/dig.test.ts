import assert from "node:assert/strict";
import test from "node:test";
import type { BoneKind } from "../lib/art";
import { allBonesFound, BONE_HALF, BRUSH_R, cleared, COLS, coverage, DECOY_HALF, FOUND_AT, KEY_R, makePit, PIT, ROWS, TAP_R, type Pit, type PitSpec } from "../lib/pit";
import { stamp, sweep } from "../lib/pit.hot";
import { createRound, pitKinds, pitSeed } from "../lib/round";
import { LEVELS } from "../lib/worlds";
import { digBot } from "./bot";

const KINDS: BoneKind[] = ["skull", "ribs", "leg", "tail", "neck", "arm"];
const plain: PitSpec = { depth: 1, rocks: 0, decoys: 0 };
const one = (spec: PitSpec = plain, seed = 7, kinds = KINDS.slice(0, 3)) => makePit(kinds, spec, seed);
const at = (pit: Pit) => ({ x: pit.bones[0].x, y: pit.bones[0].y });

test("a tap clears a patch and three taps find a bone; one key press finds it too", () => {
  const pit = one(), { x, y } = at(pit);
  assert.equal(coverage(pit, x, y, BONE_HALF.w, BONE_HALF.h), 0);
  stamp(pit, x, y, TAP_R, 1);
  const once = coverage(pit, x, y, BONE_HALF.w, BONE_HALF.h);
  assert.ok(once > 0.3 && once < FOUND_AT, `one tap is not enough: ${once}`);
  assert.equal(pit.foundBone[0], 0);
  stamp(pit, x - 24, y, TAP_R, 2); stamp(pit, x + 24, y, TAP_R, 3);
  assert.equal(pit.foundBone[0], 1, "three taps uncover it");
  const key = one();
  stamp(key, x, y, KEY_R, 1);
  assert.equal(key.foundBone[0], 1, "a key press finds a bone");
  const edge = one();
  assert.equal(stamp(edge, -50, -50, 20, 1), 0, "brushing off the box does nothing");
});

test("deep sand needs a second stroke: the same stroke again clears nothing more", () => {
  const pit = one({ depth: 2, rocks: 0, decoys: 0 }), { x, y } = at(pit);
  stamp(pit, x, y, KEY_R, 1);
  assert.equal(pit.foundBone[0], 0, "one pass over deep sand shows no bone");
  assert.equal(stamp(pit, x, y, KEY_R, 1), 0, "the same stroke number takes nothing more from a cell");
  assert.ok(stamp(pit, x, y, KEY_R, 2) > 0, "a new stroke takes the next layer");
  assert.equal(pit.foundBone[0], 1);
  // The changed list says which level each cell reached, so the wet layer is painted exactly where the second stroke went.
  const levels = new Set(Array.from(pit.changedTo.subarray(0, pit.nChanged)));
  assert.deepEqual([...levels], [2]);
});

test("a rock never clears, says it was touched, and never covers a bone or a not-bone", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const pit = makePit(KINDS, { depth: 1, rocks: 2, decoys: 1 }, seed);
    for (const bone of pit.bones) assert.equal(blockedIn(pit, bone.x, bone.y, BONE_HALF.w, BONE_HALF.h), 0, `seed ${seed}: a rock over a bone`);
    for (const decoy of pit.decoys) assert.equal(blockedIn(pit, decoy.x, decoy.y, DECOY_HALF.w, DECOY_HALF.h), 0, `seed ${seed}: a rock over a shell`);
  }
  const pit = makePit(KINDS.slice(0, 3), { depth: 1, rocks: 2, decoys: 0 }, 3), rock = pit.rocks[0];
  stamp(pit, rock.x, rock.y, KEY_R, 1);
  assert.ok(pit.hitRock, "the brush meets the rock");
  const i = Math.floor(rock.y / PIT.cell) * COLS + Math.floor(rock.x / PIT.cell);
  assert.equal(pit.cells[i], 0, "the cell under the rock stays");
  assert.equal(pit.blocked[i], 1);
});
function blockedIn(pit: Pit, x: number, y: number, hw: number, hh: number) {
  let n = 0;
  for (let row = Math.floor((y - hh) / PIT.cell); row <= Math.floor((y + hh) / PIT.cell); row++) for (let col = Math.floor((x - hw) / PIT.cell); col <= Math.floor((x + hw) / PIT.cell); col++) n += pit.blocked[row * COLS + col] ?? 0;
  return n;
}

test("a shell, a pebble or a leaf print shows but is not a bone", () => {
  const pit = makePit(KINDS.slice(0, 3), { depth: 1, rocks: 0, decoys: 2 }, 11), decoy = pit.decoys[0];
  stamp(pit, decoy.x, decoy.y, KEY_R, 1);
  assert.equal(pit.nFreshDecoy, 1);
  assert.equal(pit.nFreshBone, 0, "nothing in the tray");
  assert.equal(pit.foundDecoy[0], 1);
  assert.ok(pit.bones.every(bone => !pit.foundBone[pit.bones.indexOf(bone)]), "no bone came out");
  assert.equal(pit.decoys.length, 2);
});

test("a pit is the same for the same seed, and nothing overlaps or leaves the box", () => {
  for (const seed of [1, 2, 3, 77, 9999]) {
    const a = makePit(KINDS, { depth: 1, rocks: 2, decoys: 1 }, seed), b = makePit(KINDS, { depth: 1, rocks: 2, decoys: 1 }, seed);
    assert.deepEqual(a.bones, b.bones); assert.deepEqual(a.rocks, b.rocks); assert.deepEqual(a.decoys, b.decoys);
    const all = [...a.bones, ...a.rocks, ...a.decoys];
    for (const item of all) assert.ok(item.x >= 40 && item.x <= PIT.width - 40 && item.y >= 30 && item.y <= PIT.height - 30, JSON.stringify(item));
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.ok(Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y) >= 55, "things never overlap");
  }
  assert.equal(COLS * ROWS, 4608);
});

test("a quick swipe leaves a clean path: every stamp along it is reported", () => {
  const pit = one();
  let stamps = 0;
  const total = sweep(pit, 20, 100, 340, 100, BRUSH_R, 1, () => { stamps++; });
  assert.ok(stamps >= 60 && total > 0, `${stamps} stamps`);
  for (let x = 20; x <= 340; x += 5) assert.ok(pit.cells[Math.floor(100 / PIT.cell) * COLS + Math.floor(x / PIT.cell)] >= 1, `gap at ${x}`);
  assert.ok(cleared(pit) > 0.1 && cleared(pit) < 0.4);
});

test("the headless digger clears every level's pits: the first in about 5 seconds, all in under 20", () => {
  const rate = (id: number, limit: number) => {
    const spec = LEVELS.find(level => level.id === id)!;
    let within = 0, found = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const round = createRound(id, seed * 37);
      for (let dig = 0; dig < spec.digs; dig++) {
        const pit = makePit(pitKinds({ ...round, dig }), { depth: spec.depth, rocks: spec.rocks, decoys: spec.decoys }, pitSeed({ ...round, dig }));
        const result = digBot(pit, spec.marks, seed);
        if (result.found) found++;
        if (result.found && result.seconds <= limit) within++;
      }
    }
    return { within: within / (120 * spec.digs), found: found / (120 * spec.digs) };
  };
  for (const spec of LEVELS) assert.equal(rate(spec.id, 60).found, 1, `level ${spec.id} is always clearable`);
  assert.ok(rate(1, 10).within >= 0.97, "level ১: the first bones are out inside 10 seconds, 97% of the time");
  assert.ok(rate(1, 7).within >= 0.9, "…and inside 7 seconds nine times in ten");
  for (const spec of LEVELS) assert.ok(rate(spec.id, 20).within >= 0.95, `level ${spec.id}: a pit in under 20 seconds, 95%`);
});
