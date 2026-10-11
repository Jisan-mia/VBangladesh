import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import {
  bands, birdAt, caption, compareLine, createGame, flight, groupSize, humanLine, makeSchedule, maxSaved, nextBird, nibblesBy, parseShareHash,
  previewTitle, shareHash, shoo, stepGame, tappable, DURATION, FIELD, FIRST_NIBBLE, FLY, GRAIN, HIT_R, LAST_LANDING, NIBBLE_EVERY, SCARECROW,
  SHOOED, SITTING, TAPPABLE, WAITING, FLYING, type Game,
} from "../lib/game";
import { share } from "../share";

const DT = 1 / 60;

/** A scripted player: `reaction` seconds after a sparrow can be tapped, it claps `offset` units off its centre, at most one clap per `every` seconds. */
function play(seed: number, reaction: number, every: number, offset = 0) {
  const game = createGame(seed);
  let last = -9;
  for (let steps = 0; !game.over && steps < 10_000; steps++) {
    stepGame(game, DT);
    if (game.t - last < every) continue;
    const ready = game.birds.find(bird => tappable(bird, game.t) && game.t >= bird.t0 + FLY * TAPPABLE + reaction);
    if (ready) { shoo(game, ready.x + offset, ready.y); last = game.t; }
  }
  return game;
}
const eaten = (game: Game) => game.birds.reduce((sum, bird) => sum + bird.ate, 0);

test("the same seed gives the same afternoon; another seed gives another", () => {
  assert.equal(JSON.stringify(makeSchedule(48213)), JSON.stringify(makeSchedule(48213)));
  assert.notEqual(JSON.stringify(makeSchedule(48213)), JSON.stringify(makeSchedule(48214)));
  const first = play(777, 0.7, 0.45, 12), second = play(777, 0.7, 0.45, 12);
  assert.deepEqual([first.grain, first.shooed, first.t], [second.grain, second.shooed, second.t]);
});

test("every schedule is fair: singles, then pairs, then small groups, spread out, on the paddy, clear of the কাকতাড়ুয়া", () => {
  for (let seed = 1; seed <= 300; seed++) {
    const birds = makeSchedule(seed);
    assert.ok(birds.length >= 28 && birds.length <= 45, `seed ${seed}: ${birds.length} sparrows`);
    assert.equal(birds[0].land, 0, "the first one is landing as the page opens");
    for (let index = 0; index < birds.length; index++) {
      const bird = birds[index];
      assert.ok(bird.x >= FIELD.left && bird.x <= FIELD.right && bird.y >= FIELD.top && bird.y <= FIELD.bottom, `seed ${seed}: on the paddy`);
      assert.ok(Math.abs(bird.x - SCARECROW.x) >= SCARECROW.clear || bird.y <= SCARECROW.base - SCARECROW.height - 20, `seed ${seed}: never on the কাকতাড়ুয়া`);
      assert.ok(bird.land < LAST_LANDING && bird.t0 === bird.land - FLY);
      if (index) assert.ok(bird.land > birds[index - 1].land, "in landing order");
      // Sparrows arriving close together sit apart, so each clap has one clear target.
      for (let other = 0; other < index; other++) {
        if (bird.land - birds[other].land < 1) assert.ok(Math.hypot(bird.x - birds[other].x, bird.y - birds[other].y) >= 60, `seed ${seed}: ${index} and ${other} crowd`);
      }
    }
    const early = birds.filter(bird => bird.land > 0 && bird.land < 9);
    for (let index = 1; index < early.length; index++) assert.ok(early[index].land - early[index - 1].land >= 1.7, "the first nine seconds are singles");
  }
  assert.deepEqual([groupSize(3, 0), groupSize(12, 0), groupSize(25, 0.9), groupSize(35, 0.2), groupSize(35, 0.8)], [1, 2, 3, 3, 4]);
});

test("a sparrow lands, nibbles 1% at 0.9 s then every 1.5 s, and stops when shooed", () => {
  const game = createGame(5);
  game.birds = [game.birds[0]];
  const bird = game.birds[0];
  assert.equal(bird.state, WAITING);
  stepGame(game, 0.01);
  assert.equal(bird.state, FLYING);
  stepGame(game, FLY);
  assert.equal(bird.state, SITTING);
  stepGame(game, FIRST_NIBBLE - 0.02);
  assert.equal(game.grain, GRAIN);
  stepGame(game, 0.03);
  assert.deepEqual([game.grain, bird.ate], [GRAIN - 1, 1]);
  stepGame(game, NIBBLE_EVERY * 2);
  assert.equal(game.grain, GRAIN - 3);
  assert.equal(nibblesBy(bird, game.t), 3);
  assert.equal(shoo(game, bird.x, bird.y), 0);
  stepGame(game, 5);
  assert.deepEqual([game.grain, bird.state, game.shooed], [GRAIN - 3, SHOOED, 1]);
});

test("taps: near enough counts, too far doesn't, the nearest goes first, and a sparrow still high in the air can't be reached", () => {
  const game = createGame(9);
  const [a, b] = game.birds;
  Object.assign(a, { x: 100, y: 300, t0: -FLY, land: 0 });
  Object.assign(b, { x: 170, y: 300, t0: 0.5, land: 0.5 + FLY });
  game.birds = [a, b];
  stepGame(game, FLY);
  assert.equal(birdAt(game, 100 + HIT_R + 1, 300), -1, "just outside the radius");
  assert.equal(birdAt(game, 100 + HIT_R, 300), 0, "on the edge of the radius");
  stepGame(game, 0.5 + FLY * 0.3);
  assert.equal(flight(b, game.t) < TAPPABLE, true);
  assert.equal(birdAt(game, 136, 300), 0, "the far one isn't halfway in yet, so the clap goes to the one in reach");
  assert.equal(birdAt(game, 170, 300), -1);
  stepGame(game, FLY * 0.3);
  assert.equal(birdAt(game, 136, 300), 1, "past halfway in, the nearest wins");
  assert.equal(shoo(game, 136, 300), 1);
  assert.equal(b.flee, 1, "it flies away from the hand");
  assert.equal(shoo(game, 136, 300), 0);
  assert.equal(shoo(game, 136, 300), -1, "nothing left to shoo");
  assert.equal(game.shooed, 2);
});

test("the grain never goes below zero: a sleepy afternoon ends early, a full one ends at 45 seconds", () => {
  const sleepy = play(31, 99, 99);
  assert.deepEqual([sleepy.over, sleepy.grain, sleepy.shooed], [2, 0, 0]);
  assert.ok(sleepy.t > 15 && sleepy.t < 30, `the field emptied at ${sleepy.t}`);
  assert.equal(eaten(sleepy), GRAIN);
  stepGame(sleepy, 1);
  assert.equal(sleepy.grain, 0, "nothing moves after the end");
  const busy = play(31, 0.5, 0.35);
  assert.deepEqual([busy.over, busy.t], [1, DURATION]);
});

test("headless runs end sanely: quicker hands save more, a perfect one saves it all", () => {
  for (const seed of [3, 4242, 90210, 48213]) {
    const total = makeSchedule(seed).length;
    const perfect = play(seed, 0, 0.12, 20);
    const good = play(seed, 0.6, 0.4, 20);
    const casual = play(seed, 0.9, 0.6, 20);
    const slow = play(seed, 1.3, 0.9, 20);
    assert.deepEqual([perfect.grain, perfect.shooed], [GRAIN, total], `seed ${seed}: nothing is impossible`);
    assert.ok(good.grain >= 80 && good.grain < GRAIN, `seed ${seed}: good ${good.grain}`);
    assert.ok(casual.grain >= 60 && casual.grain < good.grain + 1, `seed ${seed}: casual ${casual.grain}`);
    assert.ok(slow.grain >= 15 && slow.grain < casual.grain, `seed ${seed}: slow ${slow.grain}`);
    for (const run of [perfect, good, casual, slow]) {
      assert.equal(run.grain, GRAIN - eaten(run), "grain adds up from the nibbles");
      assert.equal(run.shooed, run.birds.filter(bird => bird.state === SHOOED).length);
      // Every real run passes the link's check.
      assert.ok(parseShareHash(shareHash({ seed, saved: run.grain, shooed: run.shooed, name: "" })), `seed ${seed}: ${run.grain}/${run.shooed} refused`);
    }
  }
});

test("keyboard: arrows hop the hand to the sparrow they point at", () => {
  const game = createGame(12);
  const [a, b, c] = game.birds;
  Object.assign(a, { x: 100, y: 300, state: SITTING });
  Object.assign(b, { x: 250, y: 310, state: SITTING });
  Object.assign(c, { x: 180, y: 250, state: SITTING });
  game.birds = [a, b, c];
  game.t = 2;
  assert.equal(nextBird(game, 180, 330, 1, 0), 1);
  assert.equal(nextBird(game, 180, 330, -1, 0), 0);
  assert.equal(nextBird(game, 180, 330, 0, -1), 2);
  assert.equal(nextBird(game, 180, 330, 0, 1), -1);
});

test("score bands pick a kind line for every score", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(39), bands[0].line);
  assert.equal(humanLine(40), bands[1].line);
  assert.equal(humanLine(85), "এমন পাহারাদার থাকলে কাকতাড়ুয়ার ছুটি!");
  assert.equal(humanLine(99), bands[4].line);
  assert.equal(humanLine(100), bands[5].line);
  for (const band of bands) assert.ok([...band.line].length < 60);
});

test("the link's check: the sparrows left sitting must have eaten something", () => {
  const birds = makeSchedule(48213);
  assert.equal(maxSaved(birds, birds.length), GRAIN);
  assert.equal(maxSaved(birds, 0), 0);
  const leftOne = maxSaved(birds, birds.length - 1);
  assert.equal(leftOne, GRAIN - nibblesBy(birds[birds.length - 1], DURATION));
  for (let shooed = 1; shooed <= birds.length; shooed++) assert.ok(maxSaved(birds, shooed) >= maxSaved(birds, shooed - 1));
});

test("a result survives the link round trip and the preview names the player", () => {
  const shared = { seed: 48213, saved: 88, shooed: 34, name: "রাফি" };
  const hash = shareHash(shared);
  assert.equal(hash, "s=48213&t=88&c=34&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash("#" + hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, "রাফি চড়ুই তাড়িয়ে ৮৮% ধান বাঁচিয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "চড়ুই তাড়িয়ে ৮৮% ধান বাঁচল। তুমি পারবে?");
  assert.match(caption(shared), /৮৮% ধান.*৩৪টা চড়ুই/);
  assert.equal(share.preview("junk").title, "ধান পেকেছে, চড়ুই এসেছে!");
});

test("hostile or impossible links are refused, names are cleaned and capped", () => {
  const ok = (hash: string) => share.normalize(hash);
  const total = makeSchedule(48213).length;
  assert.equal(ok(""), null);
  assert.equal(ok("result"), null);
  assert.equal(ok("s=48213&t=88"), null, "no sparrow count");
  assert.equal(ok("s=48213&t=88&c=-1"), null);
  assert.equal(ok("s=48213&t=88&c=2.5"), null);
  assert.equal(ok("s=48213&t=88&c=1e1"), null);
  assert.equal(ok("s=48213&t=101&c=10"), null, "more than all the grain");
  assert.equal(ok("s=48213&t=88.5&c=30"), null);
  assert.equal(ok(`s=48213&t=50&c=${total + 1}`), null, "more sparrows than came");
  assert.equal(ok("s=48213&t=100&c=3"), null, "the unshooed ones would have eaten");
  assert.equal(ok("s=0&t=10&c=1"), null);
  assert.equal(ok("s=48213&t=88&c=34&n=" + "x".repeat(700)), null);
  assert.ok(ok(`s=48213&t=100&c=${total}`));
  assert.ok(ok("s=48213&t=0&c=0"), "a sleepy afternoon is still a real one");
  const bidi = parseShareHash("s=48213&t=88&c=34&n=" + encodeURIComponent("রা‮ফি<script>" + "ক".repeat(30)));
  assert.ok(bidi && !bidi.name.includes("‮") && [...bidi.name].length <= 20);
  assert.equal(ok("s=48213&t=88&c=34&n=%20%20&z=1"), "s=48213&t=88&c=34");
});

test("comparing with a friend is exact and kind; sparrows break a tie", () => {
  assert.equal(compareLine({ saved: 92, shooed: 30 }, { saved: 80, shooed: 34 }, "রাফি"), "রাফির চেয়ে ১২% বেশি ধান বাঁচালে!");
  assert.equal(compareLine({ saved: 80, shooed: 36 }, { saved: 80, shooed: 34 }, "রাফি"), "ধান সমান সমান, তবে রাফির চেয়ে ২টা চড়ুই বেশি তাড়ালে!");
  assert.equal(compareLine({ saved: 80, shooed: 33 }, { saved: 80, shooed: 34 }, "রাফি"), "ধান সমান সমান, রাফি শুধু ১টা চড়ুই বেশি তাড়িয়েছে।");
  assert.equal(compareLine({ saved: 80, shooed: 34 }, { saved: 80, shooed: 34 }, "রাফি"), "রাফি আর তুমি একদম সমান সমান!");
  assert.equal(compareLine({ saved: 77, shooed: 34 }, { saved: 80, shooed: 34 }, "রাফি"), "আর একটু হলেই! রাফির চেয়ে মাত্র ৩% কম।");
  assert.equal(compareLine({ saved: 50, shooed: 30 }, { saved: 80, shooed: 34 }, ""), "বন্ধু এবার ৩০% এগিয়ে। একই ক্ষেতে আরেকবার?");
});

test("content keeps the SEO limits", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160, `description ${[...site.description].length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.title.startsWith("পাখি তাড়ানোর"));
  assert.ok(site.privacy.some(line => line.includes("ক্ষেতের নম্বর") && line.includes("ধান") && line.includes("নাম")));
  assert.ok(!/আপনি|করুন|দেখুন/.test(JSON.stringify(site)), "তুমি voice only");
  assert.ok(!/duck|hunt|ডাক হান্ট|বন্দুক দিয়ে/i.test(JSON.stringify(site)), "no light-gun game names");
});
