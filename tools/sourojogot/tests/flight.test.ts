// The rocket's flight: it reaches where it was sent, leaves a trail that fades, never allocates, and a pause just holds it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createSky, flightMs, launch, moving, PUFFS, snap } from "../lib/flight";
// @ts-expect-error the lint script is plain JavaScript with no types
import { lintSource as lint } from "../../../scripts/lint-games.mjs";
import { stepSky } from "../components/sky.hot";

const lintSource = lint as (rel: string, text: string) => { rule: string }[];
const root = join(import.meta.dirname, "..");

test("a flight ends exactly on the target, heading along the curve, and the trail fades away", () => {
  const sky = createSky(66, 64);
  assert.equal(moving(sky), false);
  launch(sky, 200, 300);
  assert.ok(moving(sky));
  let ms = 0, bent = false;
  while (stepSky(sky, 16)) {
    ms += 16;
    // the path leaves the straight line, so it swoops
    const along = (sky.x - 66) * (300 - 64) - (sky.y - 64) * (200 - 66);
    if (Math.abs(along) > 200) bent = true;
    assert.ok(ms < 3000, "stuck");
  }
  assert.ok(bent, "an arc, not a straight line");
  assert.equal(sky.x, 200); assert.equal(sky.y, 300);
  assert.ok(Math.abs(ms - flightMs(Math.hypot(134, 236))) < 1100 + 16 * 4, "about the flight time, plus the trail's fade");
  assert.equal(moving(sky), false, "nothing moves once the trail is gone");
});

test("the same flight steps the same way every time (deterministic)", () => {
  const trace = () => { const sky = createSky(10, 10); launch(sky, 150, 220); const out: number[] = []; for (let i = 0; i < 40; i++) { stepSky(sky, 16); out.push(sky.x, sky.y, sky.heading, sky.puffX[0], sky.puffAge[3]); } return out; };
  assert.deepEqual(trace(), trace());
});

test("a frame that took too long (a tab coming back) never throws the rocket past its target", () => {
  const sky = createSky(0, 0);
  launch(sky, 100, 100);
  stepSky(sky, 50);
  stepSky(sky, 5000);
  assert.equal(sky.x, 100); assert.equal(sky.y, 100); assert.equal(sky.flying, false);
});

test("a new launch mid-flight bends from where the rocket is; snap and a zero-length flight land at once", () => {
  const sky = createSky(0, 0);
  launch(sky, 200, 0);
  for (let i = 0; i < 20; i++) stepSky(sky, 16);
  const here = { x: sky.x, y: sky.y };
  assert.ok(here.x > 0 && here.x < 200);
  launch(sky, 100, 300);
  assert.equal(sky.fx, here.x); assert.equal(sky.fy, here.y);
  snap(sky, 5, 6);
  assert.deepEqual([sky.x, sky.y, sky.flying], [5, 6, false]);
  launch(sky, 5, 6);
  assert.equal(sky.flying, false);
  assert.ok(flightMs(0) >= 480 && flightMs(10_000) <= 1000, "quick hops, never a long wait");
});

test("the trail is a fixed ring of slots", () => {
  const sky = createSky(0, 0);
  launch(sky, 300, 400);
  for (let i = 0; i < 80; i++) stepSky(sky, 8);
  assert.equal(sky.puffX.length, PUFFS);
  assert.ok(sky.puffNext < PUFFS);
});

test("sky.hot.ts passes the repo's hot-path lint (no literals, closures, new or templates inside its functions)", () => {
  const code = readFileSync(join(root, "components/sky.hot.ts"), "utf8");
  const found = lintSource("tools/sourojogot/components/sky.hot.ts", code).filter(item => item.rule === "hot-alloc");
  assert.deepEqual(found, []);
});
