import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createGame, starsOf, type Game } from "../lib/game";
import { lightningTimes, makeLevelStorm, makeOldStorm, makeStorm, pointRange } from "../lib/gen";
import { CLASSIC_STAGE, LEGACY_DURATION, makeLegacyStorm } from "../lib/legacy";
import { LEVEL_COUNT, LEVELS } from "../lib/levels";
import {
  isHazard, isMango, pathAt, reachOf, safePath, windAt, BASKET_MAX, BASKET_MIN, BIG, BIG_HALF, BRANCH, CATCH, CAUGHT, FALLING, GOLD, GREEN, HAIL, HIT, MISSED, REACH, RIPE, W,
} from "../lib/physics";
import { dangerSide, stepGame } from "../lib/step.hot";

const DT = 1 / 60;
function play(game: Game, aim: (game: Game) => number, speed = REACH) {
  for (let steps = 0; !game.over && steps < 20_000; steps++) stepGame(game, DT, aim(game), speed * DT);
  return game;
}
const strip = (seed: number, level: number) => JSON.stringify(makeLevelStorm(seed, level));

test("determinism: the same seed and storm give the same storm and the same run; another seed gives another", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.equal(strip(48213, level), strip(48213, level));
    assert.notEqual(strip(48213, level), strip(48214, level));
  }
  const a = play(createGame(makeLevelStorm(777, 6), 3), game => (game.t * 40) % W);
  const b = play(createGame(makeLevelStorm(777, 6), 3), game => (game.t * 40) % W);
  assert.deepEqual([a.score, a.caught, a.lives, a.knocked, a.t], [b.score, b.caught, b.lives, b.knocked, b.t]);
});

test("old links: the old generator is kept bit for bit (fingerprint of the original seed-48213 storm)", () => {
  assert.equal(createHash("sha256").update(JSON.stringify(makeLegacyStorm(48213).drops)).digest("hex").slice(0, 16), "366cfb3892fe3ebb");
  assert.equal(makeOldStorm(48213).duration, LEGACY_DURATION);
  assert.deepEqual(makeOldStorm(48213).drops, makeLegacyStorm(48213, CLASSIC_STAGE).drops);
  assert.equal(makeOldStorm(48213).pass, 0, "an old storm still gives a star for surviving");
});

test("every storm is fair: in bounds, catch-sorted, and a 230 u/s thumb can catch every mango without touching a hazard", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (let seed = 1; seed <= 40; seed++) {
      const storm = makeLevelStorm(seed * 101, level);
      for (let index = 0; index < storm.drops.length; index++) {
        const drop = storm.drops[index];
        assert.ok(drop.xc >= BASKET_MIN && drop.xc <= BASKET_MAX, `storm ${level}: catch point in the yard`);
        assert.ok(drop.tc < storm.duration && drop.state === FALLING);
        if (index) assert.ok(drop.tc >= storm.drops[index - 1].tc, "sorted by catch time");
      }
      const game = createGame(storm, 99), path = safePath(storm.drops);
      play(game, current => pathAt(path, current.t + DT));
      assert.equal(game.caught, storm.mangoes, `storm ${level}, seed ${seed}: every mango reachable`);
      assert.equal(game.lives, 99, `storm ${level}, seed ${seed}: the safe path never takes a twig`);
      assert.equal(game.knocked, 0, `storm ${level}, seed ${seed}: the safe path never takes hail`);
      assert.equal(starsOf(game), 3, "three stars are always possible");
    }
  }
});

test("each storm adds what its row says, and nothing before its time", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const row = LEVELS[level - 1], kinds = new Set<number>(), storm = makeLevelStorm(4242, level);
    for (let seed = 1; seed <= 20; seed++) for (const drop of makeLevelStorm(seed, level).drops) kinds.add(drop.kind);
    assert.equal(kinds.has(BRANCH), row.twigFrom < Infinity, `storm ${level} twigs`);
    assert.equal(kinds.has(GOLD), row.gold > 0, `storm ${level} gold`);
    assert.equal(kinds.has(HAIL), row.hail + row.sweeps > 0, `storm ${level} hail`);
    assert.equal(kinds.has(BIG), row.big > 0, `storm ${level} big branches`);
    assert.equal(storm.gusts.length > 0, Boolean(row.gusts), `storm ${level} gusts`);
    assert.equal(storm.shakes.length, row.shakes);
    assert.equal(storm.sweeps.length, row.sweeps);
    for (const drop of storm.drops) if (drop.kind === BRANCH) assert.ok(drop.t0 > row.twigFrom, "twigs only after their time");
  }
  const first = makeLevelStorm(1, 1);
  assert.ok(first.drops.every(drop => isMango(drop.kind)), "storm 1 is mangoes only");
  assert.equal(first.duration, 10, "storm 1 is won or lost in 10 seconds");
});

test("the wind stays between -1 and 1, swings back on পাল্টা হাওয়া and leans one way all storm on টানা হাওয়া", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { gusts, steady, duration } = makeLevelStorm(31, level);
    for (let t = 0; t <= duration; t += 0.05) assert.ok(Math.abs(windAt(gusts, t, steady)) <= 1);
  }
  const swing = makeLevelStorm(31, 7), gust = swing.gusts[0];
  assert.ok(gust.swing);
  const early = windAt([gust], gust.at + gust.length * 0.25) - 0.14 * Math.sin((gust.at + gust.length * 0.25) * 0.7);
  const late = windAt([gust], gust.at + gust.length * 0.75) - 0.14 * Math.sin((gust.at + gust.length * 0.75) * 0.7);
  assert.ok(Math.sign(early) === -Math.sign(late), "a swinging gust turns round");
  const steady = makeLevelStorm(31, 11);
  assert.ok(Math.abs(steady.steady) > 0.3);
  let same = 0;
  for (let t = 0; t < steady.duration; t += 0.5) if (Math.sign(windAt([], t, steady.steady)) === Math.sign(steady.steady)) same++;
  assert.equal(same, Math.ceil(steady.duration / 0.5), "the steady wind never changes side");
});

test("catching: green 5, ripe 10, gold 25; a twig costs a জান; hail knocks the top mango out; the big branch reaches wider", () => {
  const game = createGame(makeLevelStorm(5, 12), 3);
  const kinds = [GREEN, RIPE, GOLD, BRANCH, HAIL, BIG, HAIL];
  const drops = game.drops.slice(0, kinds.length);
  kinds.forEach((kind, index) => { drops[index].kind = kind; drops[index].xc = 180; drops[index].tc = 1 + index * 0.5; });
  drops[5].xc = 180 + CATCH + BIG_HALF - 1; // inside the big branch's reach, outside a twig's
  drops[6].xc = 300; // hail that misses
  game.drops = drops;
  stepGame(game, 1.01, 180, 0);
  assert.deepEqual([game.score, game.caught, drops[0].state], [5, 1, CAUGHT]);
  stepGame(game, 0.5, 180, 0); stepGame(game, 0.5, 180, 0);
  assert.deepEqual([game.score, game.caught, game.ripe, game.gold, game.pileCount], [40, 3, 1, 1, 3]);
  stepGame(game, 0.5, 180, 0);
  assert.deepEqual([game.lives, drops[3].state, game.score, game.streak], [2, HIT, 40, 0]);
  stepGame(game, 0.5, 180, 0);
  assert.deepEqual([game.score, game.caught, game.gold, game.knocked, game.pileCount], [15, 2, 0, 1, 2], "hail took the golden mango off the top");
  assert.equal(game.events[(game.eventCount - 1) % game.events.length].lost, GOLD);
  stepGame(game, 0.5, 180, 0);
  assert.deepEqual([game.lives, drops[5].state], [1, HIT], "the big branch hits wider than the rim");
  stepGame(game, 0.5, 180, 0);
  assert.deepEqual([drops[6].state, game.knocked], [MISSED, 1]);
  assert.equal(reachOf(BIG), CATCH + BIG_HALF);
  assert.ok(isHazard(HAIL) && isHazard(BIG) && !isHazard(GOLD));
});

test("stars: survive with 40% of the mangoes for one, 60% for two, 80% for three; out of জান is none", () => {
  const storm = makeLevelStorm(48213, 3);
  assert.deepEqual([storm.pass, storm.two, storm.three], [Math.ceil(storm.mangoes * 0.4), Math.ceil(storm.mangoes * 0.6), Math.ceil(storm.mangoes * 0.8)]);
  const at = (caught: number, over: 0 | 1 | 2) => { const game = createGame(storm, 3); game.caught = caught; game.over = over; return starsOf(game); };
  assert.deepEqual([at(storm.pass - 1, 1), at(storm.pass, 1), at(storm.two, 1), at(storm.three, 1), at(storm.mangoes, 2)], [0, 1, 2, 3, 0]);
});

test("the ডালা moves at most `moveBy` a step and never leaves the yard; three twigs end the storm early", () => {
  const game = createGame(makeLevelStorm(9, 1), 3);
  stepGame(game, DT, 0, 5);
  assert.equal(game.basket, W / 2 - 5);
  for (let index = 0; index < 200; index++) stepGame(game, DT, -500, 50);
  assert.equal(game.basket, BASKET_MIN);
  const twiggy = createGame(makeLevelStorm(11, 3), 3);
  for (const drop of twiggy.drops) drop.kind = BRANCH;
  play(twiggy, current => current.drops[current.next]?.xc ?? W / 2, 5000);
  assert.deepEqual([twiggy.over, twiggy.lives], [2, 0]);
  assert.ok(twiggy.t < twiggy.storm.duration);
});

test("danger: the edge warns only when a hazard is about to land within reach", () => {
  const game = createGame(makeLevelStorm(3, 3), 3), twig = game.drops.find(drop => drop.kind === BRANCH)!;
  game.next = game.drops.indexOf(twig); game.t = twig.tc - 0.3;
  game.basket = twig.xc + 20;
  assert.equal(dangerSide(game, 0.45), -1);
  game.basket = twig.xc - 20;
  assert.equal(dangerSide(game, 0.45), 1);
  game.basket = twig.xc > W / 2 ? BASKET_MIN : BASKET_MAX;
  assert.equal(dangerSide(game, 0.45), 0);
});

test("lightning is rare: never closer than 3 seconds, a handful a storm", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (let seed = 1; seed <= 30; seed++) {
    const times = lightningTimes(makeLevelStorm(seed, level));
    assert.ok(times.length <= 8);
    for (let index = 1; index < times.length; index++) assert.ok(times[index] - times[index - 1] >= 3);
  }
});

test("point ranges bound what a link may claim", () => {
  const storm = makeStorm(7, { level: 5 }), range = pointRange(storm, 3)!;
  assert.ok(range.low >= 15 && range.high <= 75 && range.low <= range.high);
  assert.equal(pointRange(storm, storm.mangoes + 1), null);
});
