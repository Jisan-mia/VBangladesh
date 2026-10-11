import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import {
  bands, caption, compareLine, createGame, humanLine, inBasket, lightningTimes, makeStorm, parseShareHash, pathAt, previewTitle, ripeOf,
  safePath, shareHash, stepGame, windAt, BASKET_MAX, BASKET_MIN, BRANCH, CATCH, CAUGHT, DURATION, FALLING, GREEN, HIT, MISSED, REACH, RIPE, W,
  type Game,
} from "../lib/storm";
import { share } from "../share";

const DT = 1 / 60;
/** Plays a whole storm headless: `aim` says where the ডালা should go at each moment, moving at most REACH a second. */
function play(game: Game, aim: (game: Game) => number, speed = REACH) {
  for (let steps = 0; !game.over && steps < 10_000; steps++) stepGame(game, DT, aim(game), speed * DT);
  return game;
}

test("the same seed gives the same storm; another seed gives another", () => {
  const strip = (seed: number) => JSON.stringify(makeStorm(seed));
  assert.equal(strip(48213), strip(48213));
  assert.notEqual(strip(48213), strip(48214));
  const first = play(createGame(777), game => (game.t * 40) % W), second = play(createGame(777), game => (game.t * 40) % W);
  assert.deepEqual([first.score, first.caught, first.lives, first.t], [second.score, second.caught, second.lives, second.t]);
});

test("every storm is fair: in bounds, catch-sorted, no twig before 7 s, and a steady thumb can catch every mango without a twig", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const storm = makeStorm(seed);
    const mangoes = storm.drops.filter(drop => drop.kind !== BRANCH);
    assert.ok(mangoes.length >= 50 && mangoes.length <= 90, `seed ${seed}: ${mangoes.length} mangoes`);
    for (let index = 0; index < storm.drops.length; index++) {
      const drop = storm.drops[index];
      assert.ok(drop.xc >= BASKET_MIN && drop.xc <= BASKET_MAX, `seed ${seed}: catch point in the courtyard`);
      assert.ok(drop.tc < DURATION && drop.state === FALLING);
      if (index) assert.ok(drop.tc >= storm.drops[index - 1].tc, "sorted by catch time");
      if (drop.kind === BRANCH) assert.ok(drop.t0 > 7, "the first seconds are only mangoes");
    }
    const game = createGame(seed, 99), path = safePath(game.storm.drops);
    play(game, current => pathAt(path, current.t + DT));
    assert.equal(game.caught, mangoes.length, `seed ${seed}: every mango reachable`);
    assert.equal(game.lives, 99, `seed ${seed}: the safe path never takes a twig`);
  }
});

test("lightning is rare: a soft pulse only with strong gusts, several seconds apart", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const times = lightningTimes(makeStorm(seed));
    assert.ok(times.length <= 6);
    for (let index = 1; index < times.length; index++) assert.ok(times[index] - times[index - 1] >= 6);
  }
});

test("the wind stays between -1 and 1", () => {
  const { gusts } = makeStorm(31);
  for (let t = 0; t <= DURATION; t += 0.05) assert.ok(Math.abs(windAt(gusts, t)) <= 1);
});

test("catching: inside the ডালা's mouth counts, just outside doesn't; green 5, ripe 10, a twig costs a life", () => {
  assert.equal(inBasket(100 + CATCH, 100), true);
  assert.equal(inBasket(100 - CATCH, 100), true);
  assert.equal(inBasket(100 + CATCH + 0.01, 100), false);

  const game = createGame(5);
  const drops = game.storm.drops.slice(0, 3);
  drops[0].kind = GREEN; drops[1].kind = RIPE; drops[2].kind = BRANCH;
  for (const drop of drops) { drop.xc = 180; drop.tc = 1 + drops.indexOf(drop) * 0.5; }
  game.storm.drops = drops;
  stepGame(game, 1.01, 180, 0);
  assert.deepEqual([game.score, game.caught, drops[0].state], [5, 1, CAUGHT]);
  stepGame(game, 0.5, 180, 0);
  assert.deepEqual([game.score, game.caught, game.ripe], [15, 2, 1]);
  stepGame(game, 0.5, 180, 0);
  assert.deepEqual([game.lives, drops[2].state, game.score], [2, HIT, 15]);
  assert.equal(game.events[game.eventCount - 1].kind, BRANCH);
});

test("the ডালা moves at most `moveBy` a step and never leaves the courtyard", () => {
  const game = createGame(9);
  stepGame(game, DT, 0, 5);
  assert.equal(game.basket, W / 2 - 5);
  for (let index = 0; index < 200; index++) stepGame(game, DT, -500, 50);
  assert.equal(game.basket, BASKET_MIN);
});

test("three twigs end the game early; otherwise the storm passes at 45 seconds", () => {
  const game = createGame(11);
  for (const drop of game.storm.drops) drop.kind = BRANCH;
  play(game, current => current.storm.drops[current.next]?.xc ?? W / 2, 5000);
  assert.deepEqual([game.over, game.lives], [2, 0]);
  assert.ok(game.t < DURATION);
  const passed = play(createGame(11), () => W / 2);
  assert.equal(passed.over, passed.lives > 0 ? 1 : 2);
});

test("headless runs end sanely with plausible scores", () => {
  for (const seed of [3, 4242, 90210]) {
    const storm = makeStorm(seed);
    const max = storm.drops.reduce((sum, drop) => sum + (drop.kind === RIPE ? 10 : drop.kind === GREEN ? 5 : 0), 0);
    const path = safePath(storm.drops);
    const perfect = play(createGame(seed), game => pathAt(path, game.t + DT));
    assert.deepEqual([perfect.over, perfect.score, perfect.lives, perfect.t], [1, max, 3, DURATION]);
    // A sleepy player who never moves still gets a few, and the score always adds up from the mangoes.
    const sleepy = play(createGame(seed), () => W / 2);
    assert.ok(sleepy.score > 0 && sleepy.score < max * 0.6);
    // A wiggler sweeping side to side.
    const wiggle = play(createGame(seed), game => W / 2 + Math.sin(game.t * 2) * 140, 400);
    for (const result of [perfect, sleepy, wiggle]) {
      assert.equal(result.score, 5 * result.caught + 5 * result.ripe);
      assert.equal(result.storm.drops.filter(drop => drop.state === CAUGHT).length, result.caught);
      assert.ok(result.storm.drops.slice(0, result.next).every(drop => drop.state !== FALLING));
      assert.ok(result.storm.drops.slice(result.next).every(drop => drop.state === FALLING));
      assert.ok([MISSED, HIT, CAUGHT].includes(result.storm.drops[0].state));
    }
  }
});

test("score bands pick a kind line for every score", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(79), bands[0].line);
  assert.equal(humanLine(80), bands[1].line);
  assert.equal(humanLine(180), "মাথা বাঁচিয়ে আম কুড়ানো চাট্টিখানি কথা না!");
  assert.equal(humanLine(450), bands[4].line);
  for (const band of bands) assert.ok(band.line.length < 60);
});

test("ripe count comes from score and count; impossible mixes are refused", () => {
  assert.equal(ripeOf(180, 24), 12);
  assert.equal(ripeOf(120, 24), 0);
  assert.equal(ripeOf(240, 24), 24);
  assert.equal(ripeOf(245, 24), -1);
  assert.equal(ripeOf(119, 24), -1);
  assert.equal(ripeOf(0, 0), 0);
});

test("a result survives the link round trip and the preview names the player", () => {
  const shared = { seed: 48213, score: 180, count: 24, name: "রাফি" };
  const hash = shareHash(shared);
  assert.equal(hash, "s=48213&t=180&a=24&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash("#" + hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, "রাফি ঝড়ের মধ্যে ২৪টা আম কুড়িয়েছে, ১৮০ পয়েন্ট। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "কালবৈশাখীর ঝড়ে ২৪টা আম, ১৮০ পয়েন্ট। তুমি পারবে?");
  assert.match(caption(shared), /২৪টা আম.*১৮০ পয়েন্ট/);
  assert.equal(share.preview("junk").title, "ঝড় উঠেছে, আম কুড়াও!");
});

test("hostile or impossible links are refused, names are cleaned and capped", () => {
  const ok = (hash: string) => share.normalize(hash);
  assert.equal(ok(""), null);
  assert.equal(ok("result"), null);
  assert.equal(ok("s=48213&t=180"), null, "no mango count");
  assert.equal(ok("s=48213&t=180&a=-1"), null);
  assert.equal(ok("s=48213&t=180&a=2.5"), null);
  assert.equal(ok("s=48213&t=180&a=1e1"), null);
  assert.equal(ok("s=48213&t=183&a=24"), null, "5 a green, 10 a ripe: never 183");
  assert.equal(ok("s=48213&t=250&a=24"), null, "24 mangoes make at most 240");
  assert.equal(ok("s=48213&t=2000&a=200"), null, "more mangoes than that storm drops");
  assert.equal(ok("s=0&t=10&a=1"), null);
  assert.equal(ok("s=48213&t=99999&a=24"), null);
  assert.equal(ok("s=48213&t=180&a=24&n=" + "x".repeat(700)), null);
  const max = makeStorm(48213).drops.filter(drop => drop.kind !== BRANCH);
  const best = max.reduce((sum, drop) => sum + (drop.kind === RIPE ? 10 : 5), 0);
  assert.ok(ok(`s=48213&t=${best}&a=${max.length}`));
  assert.equal(ok(`s=48213&t=${best + 5}&a=${max.length + 1}`), null);
  const bidi = parseShareHash("s=48213&t=180&a=24&n=" + encodeURIComponent("রা‮ফি<script>" + "ক".repeat(30)));
  assert.ok(bidi && !bidi.name.includes("‮") && [...bidi.name].length <= 20);
  assert.equal(ok("s=48213&t=180&a=24&n=%20%20&z=1"), "s=48213&t=180&a=24");
});

test("comparing with a friend is exact and kind", () => {
  assert.equal(compareLine(300, 180, "রাফি"), "রাফির চেয়ে ১২০ পয়েন্ট বেশি!");
  assert.equal(compareLine(180, 180, "রাফি"), "রাফি আর তুমি একদম সমান সমান!");
  assert.equal(compareLine(170, 180, "রাফি"), "আর একটু হলেই! রাফির চেয়ে মাত্র ১০ কম।");
  assert.equal(compareLine(50, 180, ""), "বন্ধু এবার ১৩০ পয়েন্ট এগিয়ে। একই ঝড়ে আরেকবার?");
});

test("content keeps the SEO limits", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160, `description ${[...site.description].length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.title.startsWith("আম কুড়ানোর গেম"));
  assert.ok(site.privacy.some(line => line.includes("ঝড়ের নম্বর") && line.includes("পয়েন্ট") && line.includes("নাম")));
  assert.ok(!/আপনি|করুন|দেখুন/.test(JSON.stringify(site)), "তুমি voice only");
});
