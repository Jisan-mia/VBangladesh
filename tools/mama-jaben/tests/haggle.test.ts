import assert from "node:assert/strict";
import test from "node:test";
import {
  GONE_LINE, MAX_NAME_LENGTH, bucketOf, cleanName, compareLine, createCard, finalAnswer, humanLine, isValidResult, offer, parseShareHash, quickLines,
  resultOf, routeById, routes, shareHash, sliderMin, startGame, suggestedOffer, threshold, tierOf, type Game, type Result, type RouteId,
} from "../lib/haggle";
import { share } from "../share";

const play = (id: RouteId, offers: number[], final?: boolean) => {
  let game = startGame(id);
  for (const amount of offers) game = offer(game, amount);
  return final === undefined ? game : finalAnswer(game, final);
};

test("routes: unique ascii ids, round numbers, and the bars fall from the ask to the slider's end", () => {
  assert.equal(new Set(routes.map(route => route.id)).size, routes.length);
  for (const route of routes) {
    assert.match(route.id, /^[a-z0-9]+-[a-z0-9]+$/);
    assert.ok(route.ask % 10 === 0 && route.fair % 10 === 0 && route.ask > route.fair, route.id);
    assert.ok(route.ask >= threshold(route, 1) && threshold(route, 1) >= threshold(route, 2) && threshold(route, 2) >= threshold(route, 3), route.id);
    assert.ok(threshold(route, 3) <= route.fair, `${route.id}: a patient haggler can reach the fair fare`);
    assert.ok(sliderMin(route) < threshold(route, 3), route.id);
  }
});

test("a full haggle: lowball refused, a counter, then a fair deal in three rounds", () => {
  let game = startGame("farmgate-dhanmondi");
  assert.equal(game.ask, 100);
  assert.match(game.mama, /ধানমন্ডি\? যামু। ১০০ টাকা/);
  game = offer(game, 50);
  assert.equal(game.status, "talk");
  assert.equal(game.ask, 100, "a refused lowball does not move mama");
  game = offer(game, 60);
  assert.equal(game.ask, 80);
  game = offer(game, 65);
  assert.deepEqual(resultOf(game), { route: "farmgate-dhanmondi", fare: 65, rounds: 3 });
  assert.equal(tierOf(resultOf(game)!), "fair");
});

test("giving in at once, an insulting offer, and mama's last word", () => {
  const given = play("farmgate-dhanmondi", [100]);
  assert.deepEqual(resultOf(given), { route: "farmgate-dhanmondi", fare: 100, rounds: 1 });
  assert.equal(tierOf(resultOf(given)!), "dildar");
  const insulted = play("farmgate-dhanmondi", [30]);
  assert.equal(insulted.status, "gone");
  assert.equal(insulted.mama, GONE_LINE);
  const last = play("farmgate-dhanmondi", [55, 55, 55]);
  assert.equal(last.status, "final");
  assert.match(last.mama, /শেষ কথা/);
  assert.deepEqual(resultOf(finalAnswer(last, true)), { route: "farmgate-dhanmondi", fare: last.ask, rounds: 3 });
  assert.deepEqual(resultOf(finalAnswer(last, false)), { route: "farmgate-dhanmondi", fare: 0, rounds: 3 });
  // A lowball in the last round ends it.
  assert.equal(play("farmgate-dhanmondi", [55, 55, 45]).status, "gone");
});

test("offers are clamped to the slider and finished games ignore further moves", () => {
  const game = offer(startGame("shahbag-lalbag"), 9999);
  assert.equal(game.fare, 120);
  assert.equal(offer(game, 50), game);
  assert.equal(offer(startGame("shahbag-lalbag"), Number.NaN).round, 0);
  assert.equal(offer(startGame("shahbag-lalbag"), 1).last, sliderMin(routeById("shahbag-lalbag")));
  assert.equal(finalAnswer(startGame("shahbag-lalbag"), true).status, "talk");
});

test("the same route and offers always meet the same mama", () => {
  for (const route of routes) {
    const a = play(route.id, [route.ask * 0.6, route.ask * 0.7, route.ask * 0.8]);
    const b = play(route.id, [route.ask * 0.6, route.ask * 0.7, route.ask * 0.8]);
    assert.deepEqual(a, b);
  }
});

test("quick lines: half, a middle step, and giving in; the slider starts between", () => {
  const game = startGame("farmgate-dhanmondi");
  assert.deepEqual(quickLines(game).map(line => line.amount), [50, 75, 100]);
  const next = offer(game, 60);
  assert.deepEqual(quickLines(next).map(line => line.amount), [40, 70, 80]);
  assert.equal(suggestedOffer(game), 65);
  assert.equal(suggestedOffer(next), 70);
  assert.deepEqual(quickLines(play("farmgate-dhanmondi", [100])), []);
});

/** Every result the game can produce, by trying every slider value in every round. */
function reachable(id: RouteId) {
  const found = new Set<string>();
  const walk = (game: Game) => {
    if (game.status === "final") { for (const yes of [true, false]) { const r = resultOf(finalAnswer(game, yes))!; found.add(`${r.fare}/${r.rounds}`); } return; }
    const done = resultOf(game);
    if (done) { found.add(`${done.fare}/${done.rounds}`); return; }
    for (let amount = sliderMin(routeById(id)); amount <= game.ask; amount += 5) walk(offer(game, amount));
  };
  walk(startGame(id));
  return found;
}

test("links accept exactly the results the game can produce", () => {
  for (const route of routes) {
    const found = reachable(route.id);
    for (let rounds = 1; rounds <= 3; rounds++) {
      for (let fare = 0; fare <= route.ask + 10; fare += 5) {
        assert.equal(isValidResult({ route: route.id, fare, rounds }), found.has(`${fare}/${rounds}`), `${route.id} ${fare}/${rounds}`);
      }
    }
  }
});

test("share hash round-trips and rejects hostile input", () => {
  const shared = { route: "gulistan-sadarghat" as const, fare: 65, rounds: 2, name: "রাফি" };
  const hash = shareHash(shared);
  assert.equal(hash, `#r=gulistan-sadarghat&f=65&k=2&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShareHash(hash), shared);
  assert.deepEqual(parseShareHash("r=farmgate-dhanmondi&f=0&k=1"), { route: "farmgate-dhanmondi", fare: 0, rounds: 1, name: "" });
  for (const bad of ["", "#", "#r=uttara-gulshan&f=60&k=2", "#r=farmgate-dhanmondi&f=62&k=2", "#r=farmgate-dhanmondi&f=10&k=3", "#r=farmgate-dhanmondi&f=200&k=1",
    "#r=farmgate-dhanmondi&f=80&k=0", "#r=farmgate-dhanmondi&f=80&k=4", "#r=farmgate-dhanmondi&f=-80&k=2", "#r=farmgate-dhanmondi&f=8e1&k=2", "#r=farmgate-dhanmondi&f=80&k=2.0",
    "#r=__proto__&f=80&k=2", `#r=farmgate-dhanmondi&f=80&k=2&n=${"ক".repeat(500)}`, "#r=farmgate-dhanmondi&f=%E0%A7%AE%E0%A7%A6&k=2"]) {
    assert.equal(parseShareHash(bad), null, bad);
  }
});

test("names are capped, NFC and stripped of control and bidi characters", () => {
  const chars = (...codes: number[]) => String.fromCharCode(...codes);
  assert.equal(cleanName(`  রা${chars(0x202e)}ফি${chars(0, 0x2066)}  `), "রাফি");
  assert.equal(cleanName("ক".repeat(40)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName(chars(0x995, 0x9c7, 0x9be)), chars(0x995, 0x9cb), "ক + ে + া composes to কো");
  assert.equal(parseShareHash(`#r=farmgate-dhanmondi&f=80&k=2&n=${encodeURIComponent("<b>মিম</b>")}`)?.name, "<b>মিম</b>");
});

test("human lines follow the rounds and how it ended", () => {
  const line = (fare: number, rounds: number) => humanLine({ route: "farmgate-dhanmondi", fare, rounds });
  assert.match(line(0, 1), /এক কথাতেই/);
  assert.match(line(0, 3), /৩ দফা/);
  assert.match(line(100, 1), /দরদাম ছাড়াই/);
  assert.match(line(90, 2), /জিতলেন মামা/);
  assert.match(line(75, 2), /ন্যায্য/);
  assert.match(line(65, 3), /মামাও খুশি/);
});

test("cards and friend comparisons", () => {
  const own: Result & { name: string } = { route: "farmgate-dhanmondi", fare: 65, rounds: 3, name: "মিম" };
  const card = createCard(own, { route: "farmgate-dhanmondi", fare: 70, rounds: 2, name: "রাফি" });
  assert.equal(card.title, "মিমের দরদাম");
  assert.equal(card.route, "ফার্মগেট → ধানমন্ডি");
  assert.equal(card.headline, "৬৫ টাকায় রাজি");
  assert.equal(card.rounds, "৩ দফায়");
  assert.equal(card.compare, "রাফির চেয়ে ৫ টাকা কম!");
  assert.equal(createCard({ ...own, name: "" }).title, "আমার দরদাম");
  assert.equal(compareLine(own, { route: "shahbag-lalbag", fare: 90, rounds: 2, name: "" }), "");
  assert.equal(compareLine({ ...own, fare: 0 }, { ...own, fare: 0 }), "মামা দুজনকেই ফিরিয়ে দিলেন!");
  assert.equal(compareLine(own, { ...own, fare: 0, name: "" }), "বন্ধু যা পারেনি, তুমি পারলে!");
  // The card's mama line comes from the result alone, so a shared link shows the same words as the game did.
  const game = play("farmgate-dhanmondi", [50, 60, 65]);
  assert.equal(createCard({ ...resultOf(game)!, name: "" }).mama, game.mama);
});

test("share: normalize, a personal preview, and tally over fixed round buckets only", () => {
  assert.equal(share.normalize(`r=farmgate-dhanmondi&f=65&k=3&n=${encodeURIComponent(" রাফি ")}&x=1`), `r=farmgate-dhanmondi&f=65&k=3&n=${encodeURIComponent("রাফি")}`);
  assert.equal(share.normalize("r=farmgate-dhanmondi&f=5&k=3"), null);
  assert.match(share.preview(`r=farmgate-dhanmondi&f=65&k=3&n=${encodeURIComponent("রাফি")}`).title, /^রাফি ৬৫ টাকায় মামাকে রাজি করিয়েছে/);
  assert.match(share.preview("r=farmgate-dhanmondi&f=0&k=2").title, /এক বন্ধুর দরদামে রাজি হননি/);
  assert.deepEqual(share.tally, ["k1", "k2", "k3", "na"]);
  assert.equal(bucketOf({ route: "farmgate-dhanmondi", fare: 0, rounds: 3 }), "na");
  assert.equal(bucketOf({ route: "farmgate-dhanmondi", fare: 75, rounds: 2 }), "k2");
});
