import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { bounce, clatter, farDog, release, stretch, thwack } from "../lib/sound";
import { layoutOf, seedOf, worldOf, LEVEL_COUNT } from "../lib/levels";
import {
  bannerNote, caption, clearLine, compareLine, feat, humanLine, missLine, nearMissLine, parseShared, previewTitle, sharedHash, starsOf, throwLine,
} from "../lib/link";
import {
  createWorld, downCount, nextThrow, previewPath, settled, simulate, step, throwBall,
  ANGLE_MAX, ANGLE_MIN, FLYING, GROUND, LYING, MAX_STEPS, STANDING, STONES, WALL_X, type World,
} from "../lib/physics";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const clone = (world: World): World => structuredClone(world);
const snapshot = (w: World) => JSON.stringify([[...w.x], [...w.y], [...w.a], [...w.state], [...w.downAt], w.bx, w.by]);

/** Grid search for the throw that brings down the most stones (the solver behind "every level is fair"). */
function bestThrow(world: World, angles = 30, powers = 20) {
  let best = { down: -1, world, angle: 0, power: 0 };
  for (let a = 0; a < angles; a++) for (let p = 0; p < powers; p++) {
    const w = clone(world), angle = ANGLE_MIN + (ANGLE_MAX - ANGLE_MIN) * a / (angles - 1), power = 0.1 + 0.9 * p / (powers - 1);
    simulate(w, angle, power);
    if (downCount(w) > best.down) best = { down: downCount(w), world: w, angle, power };
  }
  return best;
}

test("30 levels in three places of ten; every pile stands still on its own", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.equal(worldOf(1).name, "গলির মোড়"); assert.equal(worldOf(11).name, "স্কুলের মাঠ"); assert.equal(worldOf(30).name, "বাড়ির উঠান");
  for (const level of levels) {
    const layout = layoutOf(level);
    assert.equal(layout.stones.length, STONES, `level ${level}`);
    const w = createWorld(layout);
    for (let i = 0; i < STONES; i++) {
      const supported = w.onFixed[i] === 1 || [...w.sup.slice(i * 4, i * 4 + 4)].some(j => j >= 0);
      assert.ok(supported, `level ${level}: stone ${i} rests on something`);
      assert.ok(w.x[i] - w.w[i] / 2 > 60 && w.x[i] + w.w[i] / 2 < WALL_X, `level ${level}: stone ${i} sits in the lane`);
    }
    // Nothing thrown: nothing may move, ever. Force a support check as if something had been hit.
    const before = snapshot(w);
    w.dirty = true;
    w.ball = 1; w.bx = -100; // a ball already gone, so step() runs
    for (let k = 0; k < 120; k++) step(w);
    assert.equal(downCount(w), 0, `level ${level}: a pile fell over by itself`);
    assert.equal(JSON.stringify(JSON.parse(snapshot(w)).slice(0, 5)), JSON.stringify(JSON.parse(before).slice(0, 5)), `level ${level}: stones moved at rest`);
  }
});

test("same throw, same result: the simulation is deterministic", () => {
  for (const level of [1, 7, 15, 24, 30]) {
    for (const [angle, power] of [[0.2, 0.55], [0.5, 0.8], [-0.1, 1], [0.9, 0.4]]) {
      const a = createWorld(layoutOf(level)), b = createWorld(layoutOf(level));
      simulate(a, angle, power); simulate(b, angle, power);
      assert.equal(snapshot(a), snapshot(b), `level ${level} ${angle}/${power}`);
      assert.equal(a.steps, b.steps);
    }
  }
  // The seed shapes the stones; the same seed gives the same pile, a different seed a different one.
  assert.deepEqual(layoutOf(5, 42), layoutOf(5, 42));
  assert.notDeepEqual(layoutOf(5, 42).stones, layoutOf(5, 43).stones);
  assert.deepEqual(layoutOf(5), layoutOf(5, seedOf(5)));
});

test("every throw settles well before the safety stop, and nothing jitters once still", () => {
  for (const level of [1, 4, 12, 20, 25, 30]) {
    for (let a = 0; a < 8; a++) for (let p = 0; p < 6; p++) {
      const w = createWorld(layoutOf(level));
      simulate(w, ANGLE_MIN + (ANGLE_MAX - ANGLE_MIN) * a / 7, 0.1 + 0.9 * p / 5);
      assert.ok(w.steps < MAX_STEPS * 0.8, `level ${level}: settled in ${w.steps} steps`);
      assert.ok(!w.state.includes(FLYING));
      for (let i = 0; i < STONES; i++) {
        if (w.state[i] !== LYING) continue;
        assert.ok(Math.abs(Math.sin(w.a[i])) < 1e-9, "a lying stone lies flat");
        assert.ok(w.y[i] + w.h[i] / 2 <= GROUND + 1e-6, "and never sinks into the ground");
      }
      const still = snapshot(w);
      for (let k = 0; k < 60; k++) step(w);
      assert.equal(snapshot(w), still, "a settled world stays exactly still");
    }
  }
});

test("collisions: a low hit on the base brings the whole pile down; a soft lob onto the top leaves the pile standing", () => {
  const w = createWorld(layoutOf(1));
  // Find the throw that skims the bottom stone; any throw that knocks the base should take all seven.
  let base: World | null = null;
  for (let p = 0; p < 40 && !base; p++) {
    const t = createWorld(layoutOf(1));
    simulate(t, 0.02, 0.3 + p * 0.0175);
    if (t.downAt[0] === 0) base = t;
  }
  assert.ok(base, "some throw hits the base");
  assert.equal(downCount(base!), STONES, "no support, no pile");
  // A ball dropped gently straight down on the top stone doesn't knock it off.
  w.ball = 1; w.bx = w.x[6]; w.by = w.y[6] - 30; w.bvx = 0; w.bvy = 0;
  while (!settled(w)) step(w);
  assert.equal(downCount(w), 0);
  assert.ok([...w.state].every(s => s === STANDING));
  // A wild throw over everything hits the far wall and comes back; it stays inside the lane.
  const wild = createWorld(layoutOf(1));
  throwBall(wild, 0.3, 1);
  let maxX = 0;
  while (!settled(wild)) { step(wild); maxX = Math.max(maxX, wild.bx); }
  assert.ok(maxX <= WALL_X);
  // Throwing twice without a reset is refused.
  assert.equal(throwBall(wild, 0.3, 1), false);
});

test("the preview dots are the true start of the flight", () => {
  const out = new Float32Array(18), w = createWorld({ stones: [], blocks: [] });
  previewPath(0.6, 0.7, out, 9);
  throwBall(w, 0.6, 0.7);
  // 0.045 s per dot is 2.7 steps; compare the third dot (0.135 s) with 8.1 steps of flight, interpolated.
  for (let k = 0; k < 8; k++) step(w);
  const x8 = w.bx; step(w); const x9 = w.bx;
  assert.ok(Math.abs(out[4] - (x8 + (x9 - x8) * 0.1)) < 1.5, `${out[4]} vs ${x8}`);
  for (let k = 1; k < 9; k++) assert.ok(out[k * 2] > out[k * 2 - 2], "dots move forward");
});

test("every level is fair: a solver clears it within three balls, and most can be cleared with one", () => {
  let oneBall = 0;
  for (const level of levels) {
    let world = createWorld(layoutOf(level)), balls = 0, first = 0;
    while (downCount(world) < STONES && balls < 3) {
      const best = bestThrow(world);
      world = best.world; balls++;
      if (balls === 1) first = best.down;
      if (downCount(world) < STONES) nextThrow(world);
    }
    assert.equal(downCount(world), STONES, `level ${level} needs more than three balls`);
    if (first === STONES) oneBall++;
    if (level <= 3) assert.equal(balls, 1, `level ${level} is a first-ten-seconds win`);
  }
  assert.ok(oneBall >= 26, `${oneBall}/30 levels can be cleared with one ball`);
});

test("level 1 is nearly impossible to fail: most throws knock something", () => {
  let hit = 0, total = 0;
  for (let a = 0; a < 12; a++) for (let p = 0; p < 10; p++) {
    const w = createWorld(layoutOf(1));
    if (simulate(w, (a / 11) * 60 * Math.PI / 180, 0.25 + 0.75 * p / 9) > 0) hit++;
    total++;
  }
  assert.ok(hit / total > 0.5, `${hit}/${total}`);
});

test("a headless game: three scripted balls end sanely", () => {
  const w = createWorld(layoutOf(8));
  const throws: number[] = [];
  for (const [angle, power] of [[0.9, 0.3], [0.35, 0.7], [0.05, 0.75]]) {
    throws.push(simulate(w, angle, power));
    if (downCount(w) === STONES) break;
    nextThrow(w);
  }
  assert.ok(throws.length >= 1 && throws.length <= 3);
  assert.equal(throws.reduce((s, v) => s + v, 0), downCount(w));
  assert.ok(downCount(w) >= 0 && downCount(w) <= STONES);
});

test("stars, progress and the near-miss lines", () => {
  assert.deepEqual([1, 2, 3].map(starsOf), [3, 2, 1]);
  let stars = readLevels("{\"1\":3,\"2\":9,\"x\":1,\"31\":2}", LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3 });
  stars = recordLevel(stars, 2, starsOf(3));
  stars = recordLevel(stars, 2, starsOf(2));
  stars = recordLevel(stars, 2, starsOf(3));
  assert.equal(stars[2], 2, "the better result stays");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(readLevels("not json", LEVEL_COUNT)[1], undefined);
  assert.equal(nearMissLine(1, 7), "");
  assert.equal(nearMissLine(2, 5), "প্রথম বলে ৫টা পড়েছিল। আর ২টা পড়লে ৩ তারা হতো।");
  assert.equal(nearMissLine(3, 0), "দুই বলে সাতটা ফেললে ২ তারা, এক বলে ৩ তারা।");
  assert.equal(throwLine(0, 7, 2), "ফসকে গেছে। দূরে একটা কুকুর ডেকে উঠল।");
  assert.equal(throwLine(6, 1, 1), "৬টা পড়ল। আর মাত্র ১টা! শেষ বল।");
  assert.equal(throwLine(3, 4, 2), "৩টা পড়ল। আর ৪টা বাকি।");
  assert.equal(missLine(1), "আর মাত্র ১টা চাড়া বাকি ছিল!");
  assert.equal(missLine(3), "আর ৩টা চাড়া বাকি ছিল।");
  assert.match(missLine(7), /গোড়া বরাবর/);
  for (const level of levels) assert.ok(clearLine(level).length > 5);
  assert.match(clearLine(10), /স্কুলের মাঠে/); assert.match(clearLine(30), /৩০টা/);
  assert.equal(humanLine(1), "প্রথম বলেই খটাখট।");
  assert.equal(compareLine(1, 2, "রাফি"), "রাফির চেয়ে ১ বল কম লাগল!");
  assert.equal(compareLine(2, 2, "রাফি"), "সমান সমান! রাফিও ২ বলে ফেলেছিল।");
  assert.equal(compareLine(3, 1, ""), "বন্ধু এক বলে পেরেছিল। আর একটু হলেই!");
  assert.equal(caption({ level: 4, balls: 1 }), "সাত চাড়ার লেভেল ৪: সাতটা চাড়া ফেললাম এক বলে। তুমি কয় বলে পারবে?");
});

test("a challenge link round-trips with the level's own seed", () => {
  const shared = { level: 12, balls: 2, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.match(hash, new RegExp(`s=${seedOf(12)}`));
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি লেভেল ১২-এর সাত চাড়া ২ বলে ফেলেছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, balls: 1, name: "" }), "এক বন্ধু লেভেল ১-এর সাত চাড়া এক বলে ফেলেছে");
  assert.match(bannerNote(shared), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(parseShared(sharedHash({ ...shared, balls: 9 }))!.balls, 3);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 3, balls: 1, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: "4" }), variant({ t: "1.5" }), variant({ t: "-1" }),
    variant({ l: "31" }), variant({ l: "0" }), variant({ l: "03" }), variant({ l: null }), variant({ l: "1e1" }),
    variant({ s: String(seedOf(4)) }), variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared(variant({ l: "30", s: String(seedOf(30)) })), "the last level is fine");
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^সাত চাড়া খেলা/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /হাঁড়িভাঙা|ডাংগুলি/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "বল"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|গুলতি|slingshot|angry|বাজি|জিতে নাও/i);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { clatter(3); thwack(); bounce(); farDog(); release(); const hum = stretch(); hum.set(0.5); hum.stop(); });
});
