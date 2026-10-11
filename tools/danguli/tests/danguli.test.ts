import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash } from "../../../shared/game-core";
import { site } from "../content";
import { CONTACT, SWEET_Y, ballAt, makeField, newGame, popTime, popY, step, strike, tap, tokenOf, totalOf, type Field, type Game } from "../lib/game";
import { HITS, MAX_HIT, bandOf, cardHash, hitLabel, humanLine, parseCard, previewTitle, versusLine, type Card } from "../lib/result";
import { share } from "../share";

const calm = (overrides: Partial<Field> = {}): Field => ({ winds: [0, 0, 0], pops: [2, 2, 2], pond: { from: 100, to: 104 }, cow: 200, fielders: [], ...overrides });

test("the same seed always lays out the same field; different seeds differ", () => {
  assert.deepEqual(makeField(48213), makeField(48213));
  assert.notDeepEqual(makeField(1), makeField(2));
  for (let seed = 1; seed < 500; seed++) {
    const field = makeField(seed);
    assert.ok(field.pond.from >= 13 && field.pond.to > field.pond.from);
    assert.ok(field.cow > field.pond.to + 5, "the cow never stands in the pond");
    assert.ok(Math.abs(field.winds[0]) <= 0.8, "the first hit is calm");
    assert.ok(field.pops[0] >= field.pops[2], "later hits fall faster");
  }
});

test("waist height flies farthest; higher goes up and short, lower skims; out of reach misses", () => {
  const field = calm();
  const best = strike(field, 0, SWEET_Y);
  assert.equal(best.kind, "clean");
  assert.ok(best.distance >= 30 && best.distance <= 40, `perfect hit ${best.distance}`);
  assert.ok(strike(field, 0, SWEET_Y + 0.5).distance < best.distance);
  assert.ok(strike(field, 0, SWEET_Y - 0.5).distance < best.distance);
  const high = strike(field, 0, SWEET_Y + 0.6), low = strike(field, 0, SWEET_Y - 0.6);
  assert.ok(high.vy / high.vx > low.vy / low.vx, "a high strike leaves steeper");
  assert.equal(strike(field, 0, SWEET_Y + CONTACT + 0.01).kind, "whiff");
  assert.equal(strike(field, 0, 0).kind, "ground");
  assert.equal(strike(field, 0, 0).distance, 0);
});

test("a fielder catches a lofted hit that comes down within reach, but not a low skimmer", () => {
  const free = strike(calm(), 0, SWEET_Y + 0.4);
  const field = calm({ fielders: [{ x: free.land, speed: 2.5 }] });
  const caught = strike(field, 0, SWEET_Y + 0.4);
  assert.equal(caught.kind, "caught");
  assert.equal(caught.distance, 0);
  assert.equal(caught.catcher, 0);
  const skim = strike(calm(), 0, 0.2);
  assert.equal(strike(calm({ fielders: [{ x: skim.land, speed: 3 }] }), 0, 0.2).kind, "clean", "it never rises to hand height");
});

test("the pond counts only to its near bank, and the cow stops a roll", () => {
  const free = strike(calm(), 0, SWEET_Y);
  const wet = strike(calm({ pond: { from: free.land - 2, to: free.land + 2 } }), 0, SWEET_Y);
  assert.equal(wet.kind, "pond");
  assert.equal(wet.distance, Math.floor(free.land - 2));
  const bank = strike(calm({ pond: { from: free.land + 0.5, to: free.land + 4 } }), 0, SWEET_Y);
  assert.equal(bank.rest, free.land + 0.5, "a roll stops on the bank");
  const cow = strike(calm({ cow: free.land + 1.5 }), 0, SWEET_Y);
  assert.equal(cow.kind, "cow");
  assert.ok(cow.rest <= free.land + 1.5 - 0.9 + 1e-9);
  const at = ballAt(wet, wet.flyTime + 1, { x: 0, y: 0 });
  assert.ok(at.y < 0, "it sinks where it fell");
});

test("every field is fair: each hit has a safe shot worth at least 10 ডাং and a good one worth 20", () => {
  for (let seed = 1; seed < 400; seed++) {
    const field = makeField(seed * 7919);
    for (let hit = 0; hit < HITS; hit++) {
      let safe = 0, top = 0;
      for (let y = 0.06; y < SWEET_Y + CONTACT; y += 0.02) {
        const shot = strike(field, hit, y);
        if (shot.kind !== "caught") { top = Math.max(top, shot.distance); if (shot.distance >= 10) safe++; }
        assert.ok(shot.distance >= 0 && shot.distance <= MAX_HIT);
      }
      assert.ok(safe > 3, `seed ${seed} hit ${hit} has a safe shot`);
      assert.ok(top >= 20, `seed ${seed} hit ${hit} best ${top}`);
    }
  }
});

test("taps: flick, ignore a double tap, swing; a missed swing and a late one score nothing", () => {
  const game = newGame(7);
  assert.equal(tap(game), true);
  assert.equal(game.phase, "pop");
  assert.equal(tap(game), false, "a double tap is not a swing");
  step(game, popTime(game.field.pops[0]) + 0.1, false);
  assert.equal(game.phase, "rest");
  assert.equal(game.shots[0].kind, "ground");
  assert.equal(tap(game), false, "the landing is shown for a moment");
  step(game, 0.5, false);
  assert.equal(tap(game), true);
  assert.equal(game.hit, 1);
  tap(game); step(game, 0.15, false); tap(game);
  assert.equal(game.shots[1].kind, "whiff", "swinging right after the flick hits only air");
});

test("slow mode floats the কাঠি, so the same height comes later", () => {
  const fast = newGame(9), slow = newGame(9);
  tap(fast); tap(slow);
  step(fast, 0.3, false); step(slow, 0.3, true);
  assert.ok(slow.t < fast.t);
  assert.ok(popY(2, slow.t) < popY(2, fast.t));
});

/** Plays a whole game headlessly at 60 steps a second, swinging when the falling কাঠি reaches `aim[hit]`. */
function play(seed: number, aim: number[], slow = false) {
  const game: Game = newGame(seed);
  let steps = 0;
  while (game.phase !== "over" && steps++ < 5000) {
    if (game.phase === "aim") tap(game);
    else if (game.phase === "pop" && game.t > popTime(game.field.pops[game.hit]) / 2 && popY(game.field.pops[game.hit], game.t) <= aim[game.hit]) tap(game);
    else if (game.phase === "rest" && game.t > 0.5) tap(game);
    step(game, 1 / 60, slow);
  }
  return { game, steps };
}

test("a headless run ends sanely with a plausible score", () => {
  const { game, steps } = play(48213, [SWEET_Y, SWEET_Y, SWEET_Y]);
  assert.equal(game.phase, "over");
  assert.ok(steps < 1500, `${steps} steps`);
  assert.equal(game.shots.length, HITS);
  const total = totalOf(game.shots);
  assert.equal(total, game.shots.reduce((sum, shot) => sum + shot.distance, 0));
  assert.ok(total >= 40 && total <= 3 * MAX_HIT, `good timing scores well: ${total}`);
  const lazy = play(48213, [-1, -1, -1]);
  assert.equal(totalOf(lazy.game.shots), 0, "never swinging scores nothing");
  assert.deepEqual(play(555, [0.7, 0.9, 0.4]).game.shots, play(555, [0.7, 0.9, 0.4]).game.shots, "same seed and timing, same game");
  assert.equal(play(555, [0.7, 0.9, 0.4], true).game.phase, "over");
});

test("score bands and lines", () => {
  assert.equal(bandOf(0), "zero");
  assert.equal(bandOf(1), "warm");
  assert.equal(bandOf(24), "warm");
  assert.equal(bandOf(25), "good");
  assert.equal(bandOf(54), "good");
  assert.equal(bandOf(55), "great");
  assert.equal(bandOf(85), "master");
  assert.notEqual(humanLine(10), humanLine(40));
  assert.equal(versusLine(42, 37, "রাফি"), "রাফির চেয়ে ৫ ডাং বেশি!");
  assert.equal(versusLine(37, 37, "রাফি"), "সমান সমান! দুজনেরই ৩৭ ডাং।");
  assert.equal(versusLine(34, 37, ""), "আর একটু হলেই! বন্ধুর চেয়ে মাত্র ৩ ডাং কম।");
  assert.match(versusLine(10, 37, "রাফি"), /^রাফি এগিয়ে, ২৭ ডাং/);
  assert.equal(hitLabel("12"), "১২ ডাং");
  assert.equal(hitLabel("c"), "ক্যাচ");
});

test("a card survives the link round trip in the game kit's link format", () => {
  const card: Card = { seed: 48213, total: 37, hits: ["12", "c", "25"], name: "রাফি" };
  const hash = cardHash(card);
  assert.equal(hash, challengeHash({ seed: 48213, target: 37, name: "রাফি", extra: { h: "12-c-25" } }));
  assert.deepEqual(parseCard(`#${hash}`), card);
  const game = play(31337, [0.8, 1.2, 0.3]).game;
  const played: Card = { seed: game.seed, total: totalOf(game.shots), hits: game.shots.map(tokenOf), name: "" };
  assert.deepEqual(parseCard(cardHash(played)), played);
});

test("share refuses hostile or impossible links and caps names", () => {
  for (const state of ["", "#result", "s=0&t=10&h=5-5-0", "s=1000000000&t=10&h=5-5-0", "s=abc&t=10&h=5-5-0", "s=7&t=-1&h=0-0-0", "s=7&t=181&h=60-60-61",
    "s=7&t=10&h=5-5", "s=7&t=10&h=5-5-0-0", "s=7&t=11&h=5-5-0", "s=7&t=10&h=05-5-0", "s=7&t=70&h=61-9-0", "s=7&t=10&h=5-x-5", "s=7&t=10.5&h=5-5-0",
    `s=7&t=10&h=5-5-0&n=${"x".repeat(700)}`, "s=7&t=10&h=<script>-5-5"]) {
    assert.equal(share.normalize(state), null, state);
  }
  assert.equal(share.normalize("n=রাফি&h=12-c-25&t=37&s=48213"), "s=48213&t=37&h=12-c-25&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("s=7&t=180&h=60-60-60"), "s=7&t=180&h=60-60-60");
  const long = parseCard(`s=7&t=10&h=5-5-0&n=${encodeURIComponent("ক".repeat(50))}`);
  assert.equal(long?.name.length, 20);
  assert.equal(previewTitle({ seed: 7, total: 37, hits: ["12", "c", "25"], name: "রাফি" }), "রাফি ৩৭ ডাং মেরেছে। তুমি পারবে?");
  assert.equal(share.preview("s=7&t=37&h=12-c-25").title, "এক বন্ধু ৩৭ ডাং মেরেছে। তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
});

test("content meets the SEO limits and never says গুলি on its own", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("ডাংগুলি"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  const copy = JSON.stringify(site) + JSON.stringify(share.preview("s=7&t=37&h=12-c-25"));
  assert.doesNotMatch(copy.replaceAll("ডাংগুলি", ""), /গুলি/);
  assert.doesNotMatch(copy, /টাকা জিত|বাজি|জুয়া/);
});
