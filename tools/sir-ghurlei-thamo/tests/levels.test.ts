import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { carefulRun, classStars, CLASSIC, GRACE, LEVEL_COUNT, LEVELS, levelOf, makeClass, starTargets } from "../lib/game";
import { parseShared, previewTitle, sharedHash } from "../lib/link";
import { migrateLevels, nearMiss } from "../lib/words";
import { share } from "../share";

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 13);

test("class 5 is the original routine, draw for draw, so old links replay it exactly", () => {
  // Fingerprint of the original generator for four seeds, taken before classes existed.
  const strip = (seed: number) => { const { level, ...rest } = makeClass(seed); assert.equal(level, CLASSIC); return rest; };
  assert.equal(createHash("sha256").update(JSON.stringify([48213, 1, 777, 999999999].map(strip))).digest("hex").slice(0, 16), "c704efe9b0233ff6");
  assert.equal(levelOf(CLASSIC).name, "রোজকার ক্লাস");
});

test("each class adds one thing: fakes come in one by one, then the turns get quicker", () => {
  const kinds = (level: number) => new Set(SEEDS.flatMap(seed => makeClass(seed, level).segments.map(segment => segment.kind)));
  assert.deepEqual([...kinds(1)].sort(), ["look", "tell", "write"], "class 1: no fakes at all");
  assert.ok(kinds(2).has("cough") && !kinds(2).has("drop") && !kinds(2).has("peek"), "class 2 adds the cough");
  assert.ok(kinds(3).has("drop") && !kinds(3).has("peek"), "class 3 adds the dropped chalk");
  assert.ok(kinds(4).has("peek"), "class 4 adds the fake turn");
  const shortestTell = (level: number) => Math.min(...SEEDS.flatMap(seed => makeClass(seed, level).segments.filter(s => s.kind === "tell").map(s => s.dur)));
  for (let level = 2; level <= LEVEL_COUNT; level++) assert.ok(shortestTell(level) <= shortestTell(level - 1) + 1e-9, `class ${level} turns no slower`);
  assert.ok(shortestTell(LEVEL_COUNT) >= 0.34, "even the last class warns for a third of a second");
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.equal(LEVELS[level - 1].name.length > 0, true);
});

test("every class is fair: a careful player with a 0.35 s reaction is never caught, and 3 stars are always within reach", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const seed of SEEDS.slice(0, 15)) {
      const slowpoke = carefulRun({ seed, level }, 0.35);
      assert.equal(slowpoke.catches, 0, `class ${level} seed ${seed}`);
      const targets = starTargets({ seed, level }), sharp = carefulRun({ seed, level });
      assert.equal(classStars(sharp.tenths, targets), 3, `class ${level} seed ${seed}: the careful time earns 3 stars`);
      assert.ok(classStars(slowpoke.tenths, targets) >= 2, `class ${level} seed ${seed}: a slower reaction still earns 2`);
    }
  }
  assert.ok(GRACE > 0);
});

test("stars: within the target is three, five seconds more is two, finishing is one; slow mode counts its time at its rate", () => {
  const targets = { three: 160, two: 210 };
  assert.deepEqual([150, 160, 161, 210, 211, 900].map(t => classStars(t, targets)), [3, 3, 2, 2, 1, 1]);
  assert.equal(classStars(228, targets, 0.7), 3, "22.8 s in slow mode counts as 16 s");
});

test("near-miss lines give the exact seconds", () => {
  const base = { three: 160, two: 210, rate: 1, best: null };
  assert.equal(nearMiss({ ...base, tenths: 172, stars: 2 }), "আর ১.২ সেকেন্ড আগে পৌঁছালেই ৩ তারা।");
  assert.equal(nearMiss({ ...base, tenths: 230, stars: 1 }), "আর ২.০ সেকেন্ড আগে পৌঁছালেই ২ তারা।");
  assert.equal(nearMiss({ ...base, tenths: 150, stars: 3, best: 140 }), "আর ১.০ সেকেন্ড আগে হলেই নতুন সেরা।");
  assert.equal(nearMiss({ ...base, tenths: 150, stars: 3, best: 100 }), "", "too far to call it close");
  assert.equal(nearMiss({ ...base, tenths: 240, stars: 2, rate: 0.7 }), "আর ১.২ সেকেন্ড আগে পৌঁছালেই ৩ তারা।", "8 tenths at the slow rate are about 1.2 s on the clock");
});

test("an old phone's best time opens classes 1–6, once", () => {
  assert.equal(migrateLevels(null, "224"), JSON.stringify({ 5: 1 }));
  assert.equal(unlockedLevel(readLevels(migrateLevels(null, "224"), LEVEL_COUNT), LEVEL_COUNT), 6);
  assert.equal(migrateLevels(null, null), null);
  assert.equal(migrateLevels(null, "junk"), null);
  assert.equal(migrateLevels("{}", "224"), null, "already moved");
});

test("old links open the original class; class links carry the class", () => {
  assert.deepEqual(parseShared("s=5&t=224&c=1"), { seed: 5, tenths: 224, catches: 1, name: "" });
  const card = { seed: 777, tenths: 180, catches: 0, name: "মিম", level: 8 };
  const hash = sharedHash(card);
  assert.equal(hash, `s=777&t=180&c=0&l=8&n=${encodeURIComponent("মিম")}`);
  assert.deepEqual(parseShared(hash), card);
  assert.equal(share.normalize(hash), hash);
  assert.equal(sharedHash({ ...card, level: CLASSIC }), `s=777&t=180&c=0&n=${encodeURIComponent("মিম")}`, "class 5 keeps the old link shape");
  assert.equal(parseShared("s=777&t=180&l=5")?.level, undefined);
  assert.equal(previewTitle(card), "মিম ক্লাস ৮-এ ১৮.০ সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। তুমি পারবে?");
  for (const bad of ["s=7&t=180&l=0", "s=7&t=180&l=11", "s=7&t=180&l=x", "s=7&t=180&l=03"]) assert.equal(parseShared(bad), null, bad);
});
