import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import {
  caption, clearLine, friendBanner, kitchenStars, levelAt, liftPot, makePots, migrateLevels, nearMiss, newRound, parseShare, potsIn, shareHash, startPot, stepRound, totalOf, versusLine,
  CLASSIC, KITCHEN_COUNT, KITCHENS,
} from "../lib/dudh";
import { share } from "../share";

const DT = 1 / 60;
function play(seed: number, kitchen: number, liftAt: number) {
  const round = newRound(seed, kitchen);
  for (let steps = 0; round.phase !== "over" && steps < 60 * 200; steps++) {
    if (round.phase === "waiting") startPot(round);
    stepRound(round, DT, false);
    if (round.phase === "rising" && round.level >= liftAt) liftPot(round);
  }
  return round;
}

test("kitchen 3 is the original game: same pots from the same seed, no doorbell", () => {
  for (const seed of [1, 4242, 999_999_999]) {
    const pots = makePots(seed, CLASSIC);
    assert.deepEqual(pots, makePots(seed));
    assert.equal(pots.length, 5);
    assert.ok(pots.every(pot => pot.bell === -1));
  }
  // Pinned from the original rules, so an old link replays the very same pots.
  const first = makePots(4242)[0];
  assert.equal(first.vessel, "dekchi");
  assert.ok(first.seconds >= 5.2 * 0.92 && first.seconds <= 5.2 * 1.08);
});

test("every kitchen is fair: harder pot by pot, a calm first pot, always a moment to lift between 90% and the spill", () => {
  assert.equal(KITCHEN_COUNT, 8);
  for (let kitchen = 1; kitchen <= KITCHEN_COUNT; kitchen++) {
    for (let seed = 1; seed < 300; seed++) {
      const pots = makePots(seed, kitchen);
      assert.equal(pots.length, KITCHENS[kitchen - 1].pots.length);
      assert.deepEqual([pots[0].vessel, pots[0].stove], ["dekchi", "gas"]);
      for (const pot of pots) {
        for (const slow of [false, true]) {
          let t = 0, ninety = -1;
          for (; t < 30; t += 1 / 240) {
            const level = levelAt(pot, t, slow);
            if (ninety < 0 && level >= 0.9) ninety = t;
            if (level >= 1) break;
          }
          assert.ok(t - ninety >= 0.15, `kitchen ${kitchen}, seed ${seed}: window ${(t - ninety).toFixed(3)}s`);
          if (pot.bell >= 0) assert.ok(pot.bell < t, "the bell rings before the milk can spill");
        }
      }
      assert.equal(pots.filter(pot => pot.bell >= 0).length, KITCHENS[kitchen - 1].bells);
      assert.equal(pots[0].bell, -1, "never a bell on the first pot");
    }
    // The table climbs pot by pot (each pot then varies ±8% by seed), and each kitchen has at least as many pots as the last.
    const heats = KITCHENS[kitchen - 1].pots;
    heats.slice(1).forEach((heat, index) => assert.ok(heat.seconds < heats[index].seconds && heat.power > heats[index].power && heat.wobble >= heats[index].wobble, `kitchen ${kitchen}, pot ${index + 2}`));
    if (kitchen > 1) assert.ok(potsIn(kitchen) >= potsIn(kitchen - 1) && heats[0].seconds <= KITCHENS[kitchen - 2].pots[0].seconds);
  }
});

test("every kitchen can be 3-starred, and the first is hard to fail", () => {
  for (let kitchen = 1; kitchen <= KITCHEN_COUNT; kitchen++) {
    for (const seed of [3, 77, 4242]) {
      const careful = play(seed, kitchen, 0.92);
      assert.ok(careful.spills.every(spilled => !spilled));
      assert.equal(kitchenStars(totalOf(careful.scores)), 3, `kitchen ${kitchen}, seed ${seed}`);
    }
  }
  // A beginner who lifts early, at 60%, still clears the first kitchen.
  assert.ok(kitchenStars(totalOf(play(9, 1, 0.6).scores)) >= 1);
});

test("stars from the average, and near-miss lines with the exact gap", () => {
  assert.deepEqual([49, 50, 74, 75, 89, 90, 99].map(kitchenStars), [0, 1, 1, 2, 2, 3, 3]);
  assert.equal(nearMiss(86), "গড় আর ৪% বেশি হলেই ৩ তারা।");
  assert.equal(nearMiss(70), "গড় আর ৫% বেশি হলেই ২ তারা।");
  assert.equal(nearMiss(41), "গড় আর ৯% হলেই রান্নাঘর পার।");
  assert.equal(nearMiss(93), "");
  for (let stars = 0; stars <= 3; stars++) assert.ok(clearLine(stars).length > 5);
});

test("an old phone's best from the five pots becomes kitchen 3's stars, once", () => {
  assert.equal(migrateLevels(null, "93"), JSON.stringify({ 3: 3 }));
  assert.equal(migrateLevels(null, "80"), JSON.stringify({ 3: 2 }));
  assert.equal(migrateLevels(null, "52"), JSON.stringify({ 3: 1 }));
  const moved = readLevels(migrateLevels(null, "93"), KITCHEN_COUNT);
  assert.equal(unlockedLevel(moved, KITCHEN_COUNT), 4, "kitchens 1–4 open");
  assert.equal(migrateLevels(null, "41"), null, "below a star: nothing to carry");
  assert.equal(migrateLevels(null, null), null, "a new phone");
  assert.equal(migrateLevels(null, "junk"), null);
  assert.equal(migrateLevels("{\"1\":2}", "93"), null, "already moved or already playing kitchens");
  assert.equal(migrateLevels("{}", "93"), null);
});

test("old links open kitchen 3; kitchen links carry the kitchen and one score per pot", () => {
  const old = parseShare("s=123456&t=74&p=94.88.x.97.91");
  assert.equal(old?.kitchen, CLASSIC);
  assert.equal(shareHash(old!), "s=123456&t=74&p=94.88.x.97.91", "kitchen 3 keeps the old link shape");

  const result = { seed: 777, scores: [95, 91, 0, 88, 93, 90, 96], spills: [false, false, true, false, false, false, false], name: "", slow: true, kitchen: 7 };
  const hash = shareHash(result);
  assert.equal(hash, "s=777&t=79&p=95.91.x.88.93.90.96&l=7&d=1");
  assert.deepEqual(parseShare(hash), { ...result, total: 79 });
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).description, /সাতটা পাতিল/);
  assert.equal(friendBanner({ total: 79, name: "মিম", scores: result.scores }), "মিম ৭৯% করেছে। একই সাতটা পাতিল, এবার তোমার পালা।");
  assert.match(caption({ ...result, total: 79 }), /সাতটা পাতিলে ৭৯%/);
  assert.match(versusLine(60, 79, "মিম", 3), /একই তিনটা পাতিল/);

  for (const bad of ["s=777&t=50&p=50.50.50.50.50&l=1", "s=777&t=50&p=50.50.50&l=0", "s=777&t=50&p=50.50.50&l=9", "s=777&t=50&p=50.50.50&l=1.5", "s=777&t=51&p=50.50.50&l=1"]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  assert.equal(parseShare("s=777&t=50&p=50.50.50&l=1")?.kitchen, 1);
});
