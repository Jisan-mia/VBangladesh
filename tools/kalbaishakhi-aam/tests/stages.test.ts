import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import {
  caption, createGame, makeStorm, migrateLevels, milestoneOf, nearMiss, nextMilestone, parseShareHash, pathAt, previewTitle, safePath, shareHash, starTargets, stepGame, stormStars,
  BRANCH, CLASSIC_STAGE, DURATION, REACH, RIPE, STAGE_COUNT, STAGES, W, type Game,
} from "../lib/storm";
import { share } from "../share";

const DT = 1 / 60;
function play(game: Game, aim: (game: Game) => number, speed = REACH) {
  for (let steps = 0; !game.over && steps < 10_000; steps++) stepGame(game, DT, aim(game), speed * DT);
  return game;
}
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

test("storm 4 is the original storm, draw for draw, so old links replay it exactly", () => {
  // Fingerprint of the original generator's seed-48213 storm, taken before storms became stages.
  assert.equal(createHash("sha256").update(JSON.stringify(makeStorm(48213).drops)).digest("hex").slice(0, 16), "366cfb3892fe3ebb");
  for (const seed of [1, 777, 999_999_999]) assert.deepEqual(makeStorm(seed), makeStorm(seed, CLASSIC_STAGE));
  assert.equal(STAGES[CLASSIC_STAGE - 1].name, "কালবৈশাখী");
});

test("every storm is fair, and each one is a small step harder than the last", () => {
  const mangoes: number[] = [], twigs: number[] = [];
  for (let stage = 1; stage <= STAGE_COUNT; stage++) {
    const counts: number[] = [], branches: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const storm = makeStorm(seed, stage), fruit = storm.drops.filter(drop => drop.kind !== BRANCH);
      counts.push(fruit.length); branches.push(storm.drops.length - fruit.length);
      assert.ok(fruit.length >= 30 && fruit.length <= 140, `storm ${stage}, seed ${seed}: ${fruit.length} mangoes`);
      const game = createGame(seed, 99, stage), path = safePath(game.storm.drops);
      play(game, current => pathAt(path, current.t + DT));
      assert.equal(game.caught, fruit.length, `storm ${stage}, seed ${seed}: every mango reachable`);
      assert.equal(game.lives, 99, `storm ${stage}, seed ${seed}: a twig-free path exists`);
      assert.equal(stormStars(game.storm, game.caught, true), 3, "three stars are always possible");
    }
    mangoes.push(average(counts)); twigs.push(average(branches));
  }
  assert.equal(twigs[0], 0, "the first storm drops no twigs");
  for (let stage = 1; stage < STAGE_COUNT; stage++) {
    // Each storm drops at least as much (some mangoes turn into twigs), falls faster and starts twigs no later.
    assert.ok(mangoes[stage] + twigs[stage] >= mangoes[stage - 1] + twigs[stage - 1] - 1, `storm ${stage + 1} drops as much or more`);
    const [now, before] = [STAGES[stage], STAGES[stage - 1]];
    assert.ok(now.fall[1] <= before.fall[1] && now.gap[1] <= before.gap[1] && now.twigFrom <= before.twigFrom && now.gust[0] >= before.gust[0], `storm ${stage + 1} is no easier`);
  }
  assert.ok(twigs[STAGE_COUNT - 1] > twigs[1] * 2);
});

test("the first storm can't be lost: a player who never moves still gets a star", () => {
  for (const seed of [3, 4242, 90210]) {
    const sleepy = play(createGame(seed, 3, 1), () => W / 2);
    assert.equal(sleepy.over, 1);
    assert.ok(stormStars(sleepy.storm, sleepy.caught, true) >= 1);
    assert.ok(sleepy.caught > 0, "and catches a few");
  }
});

test("stars: survive for one, 45% of the mangoes for two, 70% for three", () => {
  const storm = makeStorm(48213, 2), { three, two, mangoes } = starTargets(storm);
  assert.equal(three, Math.ceil(mangoes * 0.7));
  assert.equal(two, Math.ceil(mangoes * 0.45));
  assert.deepEqual([stormStars(storm, mangoes, false), stormStars(storm, 0, true), stormStars(storm, two, true), stormStars(storm, three, true)], [0, 1, 2, 3]);
});

test("near-miss lines give the exact number", () => {
  const base = { stage: 3, three: 48, two: 31, score: 200, best: null, t: DURATION, caught: 0, stars: 0 };
  assert.equal(nearMiss({ ...base, t: 33.2 }), "আর ১২ সেকেন্ড টিকলেই ঝড় ৩ পার।");
  assert.equal(nearMiss({ ...base, stars: 2, caught: 44 }), "আর ৪টা আম হলেই ৩ তারা।");
  assert.equal(nearMiss({ ...base, stars: 1, caught: 29 }), "আর ২টা আম হলেই ২ তারা।");
  assert.equal(nearMiss({ ...base, stars: 1, caught: 10 }), "", "too far to call it close");
  assert.equal(nearMiss({ ...base, stars: 3, caught: 50, score: 360, best: 400 }), "আর ৪০ পয়েন্ট হলেই নতুন সেরা।");
});

test("an old phone's best from the original storm opens storms 1–5, once", () => {
  assert.equal(migrateLevels(null, "180"), JSON.stringify({ 4: 1 }));
  assert.equal(unlockedLevel(readLevels(migrateLevels(null, "180"), STAGE_COUNT), STAGE_COUNT), 5);
  assert.equal(migrateLevels(null, null), null, "a new phone");
  assert.equal(migrateLevels(null, "0"), null);
  assert.equal(migrateLevels(null, "junk"), null);
  assert.equal(migrateLevels("{\"1\":3}", "180"), null, "already moved or already playing storms");
});

test("milestones count every mango on this phone", () => {
  assert.deepEqual([0, 49, 50, 99, 100, 260, 6000].map(milestoneOf), [0, 0, 50, 50, 100, 250, 5000]);
  assert.deepEqual([0, 50, 120, 6000].map(nextMilestone), [50, 100, 250, 0]);
});

test("old links open the original storm; storm links carry the stage and are checked against that storm", () => {
  assert.deepEqual(parseShareHash("s=48213&t=180&a=24"), { seed: 48213, score: 180, count: 24, name: "" });
  const shared = { seed: 777, score: 150, count: 20, name: "মিম", stage: 7 };
  const hash = shareHash(shared);
  assert.equal(hash, "s=777&t=150&a=20&l=7&n=" + encodeURIComponent("মিম"));
  assert.deepEqual(parseShareHash(hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(shareHash({ ...shared, stage: CLASSIC_STAGE }), "s=777&t=150&a=20&n=" + encodeURIComponent("মিম"), "storm 4 keeps the old link shape");
  assert.equal(previewTitle(shared), "মিম ঝড় ৭-এ ২০টা আম কুড়িয়েছে, ১৫০ পয়েন্ট। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "কালবৈশাখী আমের ঝড় ৭-এ ২০টা আম, ১৫০ পয়েন্ট। তুমি পারবে?");
  assert.equal(caption(shared), "কালবৈশাখী আমের ঝড় ৭-এ ২০টা আম কুড়ালাম, ১৫০ পয়েন্ট! একই ঝড়ে তুমি কয়টা পারো?");
  for (const bad of ["s=777&t=150&a=20&l=0", "s=777&t=150&a=20&l=9", "s=777&t=150&a=20&l=x", "s=777&t=150&a=20&l=1.5"]) assert.equal(share.normalize(bad), null, bad);
  const most = makeStorm(777, 1).drops.filter(drop => drop.kind !== BRANCH).length;
  assert.equal(share.normalize(`s=777&t=${most * 5 + 5}&a=${most + 1}&l=1`), null, "more mangoes than storm 1 drops");
  const ripes = makeStorm(777, 1).drops.filter(drop => drop.kind === RIPE).length;
  assert.ok(share.normalize(`s=777&t=${most * 5 + ripes * 5}&a=${most}&l=1`), "every mango of storm 1 is a fair claim");
});
