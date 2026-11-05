import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRIES, TRIPS, countryOf } from "../lib/countries";
import { LEVEL_COUNT, ORDER, WORLDS, isWorldEnd, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf, stampedIds, stopIds } from "../lib/levels";
import { MAX_CHOICES, MIN_CHOICES, START_PACE, advance, allVisited, answer, cardsFor, choiceCount, choicesFor, createTrip, fly, hintOn, isLast, land, nextCard, nextPace, questionNow, resultOf, starsOf, totalQuestions } from "../lib/trip";
import { FIVE, GUESSER, LEARNER, playTrip } from "./bot";

const SEEDS = 1000;
const rate = (level: number, child: typeof FIVE, ok: (stars: number) => boolean) => {
  let hits = 0;
  for (let seed = 1; seed <= SEEDS; seed++) if (ok(resultOf(playTrip(level, seed, child).trip).stars)) hits++;
  return hits / SEEDS;
};

test("levels: ids 1–6 are the six trips in their old order (saved stars), three passport checks are new ids", () => {
  assert.equal(LEVEL_COUNT, 9);
  for (let id = 1; id <= 6; id++) assert.deepEqual(stopIds(id), TRIPS[id - 1].ids, `trip ${id}`);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9], "the play order lists every level once");
  assert.deepEqual(ORDER.map(id => placeOf(id)), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const id of [7, 8, 9]) { const level = levelOf(id); assert.ok(level.finale && level.recall && level.stops.length === 3, `check ${id}`); }
  for (const id of [1, 2, 3, 4, 5, 6]) assert.ok(!levelOf(id).recall && !levelOf(id).finale);
  assert.equal(levelOf(0).id, 1); assert.equal(levelOf(99).id, 1); assert.equal(levelOf(Number.NaN).id, 1);
});

test("worlds: three, each with two trips and a named passport check of three of its countries, asked a different way", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 2, 7], [3, 4, 8], [5, 6, 9]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), check = levelOf(ids[2]);
    assert.ok(isWorldEnd(ids[2]) && !isWorldEnd(ids[0]) && !isWorldEnd(ids[1]));
    assert.match(check.title, /^পাসপোর্ট চেক/);
    const visited = new Set(ids.slice(0, 2).flatMap(id => stopIds(id)));
    if (world.id < 2) for (const stop of check.stops) assert.ok(visited.has(stop.id) || world.id === 1, `${check.title}: ${stop.id} is a country of its world`);
  }
  // Every country appears on exactly one of the six trips, and a check re-asks countries already visited, but about something else.
  for (const check of [7, 8]) for (const stop of levelOf(check).stops) {
    const trip = [1, 2, 3, 4, 5, 6].find(id => stopIds(id).includes(stop.id))!;
    assert.notDeepEqual(levelOf(trip).stops.find(item => item.id === stop.id)!.asks, stop.asks, `${stop.id}: the check asks something new`);
  }
  assert.equal(nextInOrder(7), 3); assert.equal(nextInOrder(9), 0);
  assert.equal(nextToPlay({}), 1); assert.equal(nextToPlay({ 1: 3 }), 2);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1, "everything done: back to the start");
  assert.deepEqual(stampedIds({ 1: 2 }), ["in", "np", "bt"]);
  assert.deepEqual(stampedIds({}), []);
  assert.equal(stampedIds(Object.fromEntries(ORDER.map(id => [id, 1]))).length, COUNTRIES.length);
});

test("each level teaches one thing: its idea shows in the data", () => {
  assert.equal(levelOf(1).opening, 2); assert.ok(levelOf(1).short);
  assert.ok(levelOf(2).stops.some(stop => stop.asks.includes("flag")), "level 2 asks a flag");
  assert.ok(!levelOf(1).stops.some(stop => stop.asks.includes("flag")), "level 1 asks none");
  assert.equal(levelOf(3).base, 4); assert.equal(levelOf(2).base, 3);
  assert.ok(levelOf(4).near && !levelOf(3).near);
  assert.ok(levelOf(5).stops.some(stop => stop.asks.includes("hello")));
  for (const id of [1, 2, 3, 4]) assert.ok(!levelOf(id).stops.some(stop => stop.asks.includes("hello")), `level ${id} has no hello question yet`);
  assert.ok(levelOf(6).stops.every(stop => stop.asks.length === 2), "level 6 stamps twice at every country");
  assert.equal(totalQuestions(levelOf(6)), 6); assert.equal(totalQuestions(levelOf(1)), 3);
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9]) for (const stop of levelOf(id).stops) {
    const c = countryOf(stop.id)!;
    for (const ask of stop.asks) assert.ok(ask !== "flag" || c.ask === "flag" || ["mm", "sg", "jp", "it", "us"].includes(stop.id), `${id}/${stop.id}: a flag we draw`);
  }
});

test("postcards: five a stop, or on a short level the greeting, what is asked, and the like card", () => {
  assert.deepEqual(cardsFor(levelOf(2), 0), ["hello", "food", "place", "animal", "like"]);
  assert.deepEqual(cardsFor(levelOf(1), 0), ["hello", "place", "like"]);
  assert.deepEqual(cardsFor(levelOf(1), 1), ["hello", "animal", "like"]);
  assert.deepEqual(cardsFor(levelOf(7), 2), ["hello", "like"], "a flag question is answered from the greeting card");
  for (let id = 1; id <= LEVEL_COUNT; id++) levelOf(id).stops.forEach((stop, at) => {
    const cards = cardsFor(levelOf(id), at);
    assert.equal(new Set(cards).size, cards.length);
    for (const ask of stop.asks) if (ask === "food" || ask === "place" || ask === "animal") assert.ok(cards.includes(ask), `${id}/${stop.id}: ${ask} is shown before it is asked`);
  });
});

test("choices: one right, no repeats, 2–4; flag questions only offer flags we draw; near puts this trip's other countries first", () => {
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    const level = levelOf(id);
    level.stops.forEach((stop, at) => stop.asks.forEach(ask => {
      for (const count of [2, 3, 4]) for (const seed of [1, 7, 99]) {
        const choices = choicesFor(level, at, ask, count, seed);
        assert.equal(choices.length, count);
        assert.equal(choices.filter(c => c === stop.id).length, 1);
        assert.equal(new Set(choices).size, count);
        if (ask === "flag") for (const c of choices) assert.ok(countryOf(c) && ["bd", "in", "mm", "my", "sg", "cn", "jp", "ae", "it", "gb", "us"].includes(c), `${stop.id}: ${c}`);
        if (level.near && count >= 3) {
          const others = level.stops.map(item => item.id).filter(c => c !== stop.id && (ask !== "flag" || ["mm", "sg", "jp", "it", "us", "cn", "ae", "gb", "in", "my"].includes(c)));
          for (const other of others.slice(0, count - 1)) assert.ok(choices.includes(other), `${id}/${stop.id}: ${other} is on the map, so it is a picture`);
        }
      }
    }));
  }
  assert.deepEqual(choicesFor(levelOf(4), 0, "food", 4, 5), choicesFor(levelOf(4), 0, "food", 4, 5), "seeded");
});

test("difficulty: three missed in a row take one picture away, five right add one, always 2–4, carried from trip to trip", () => {
  const level = levelOf(2);
  assert.equal(choiceCount(level, START_PACE, 1), 3);
  assert.equal(choiceCount(levelOf(1), START_PACE, 0), 2, "the very first question of level 1 has two pictures");
  assert.equal(choiceCount(levelOf(1), START_PACE, 1), 3);
  let pace = START_PACE;
  for (let i = 0; i < 2; i++) pace = nextPace(pace, false);
  assert.equal(pace.offset, 0);
  pace = nextPace(pace, false);
  assert.equal(pace.offset, -1);
  assert.equal(choiceCount(level, pace, 1), 2);
  pace = START_PACE;
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.offset, 1);
  assert.equal(choiceCount(levelOf(3), pace, 1), MAX_CHOICES);
  assert.equal(choiceCount(levelOf(1), { offset: -1, right: 0, missed: 0 }, 5), MIN_CHOICES);
  // five right in a row across the end of a trip adds a picture to the next trip
  let play = playTrip(2, 3, { knows: 1, think: 1 });
  assert.equal(play.trip.pace.right, 3);
  play = playTrip(2, 4, { knows: 1, think: 1 }, play.trip.pace);
  assert.equal(play.trip.pace.offset, 1, "the streak crossed the trip's end");
  assert.ok(play.sizes.slice(-1)[0] === 4);
});

test("stars: all first-try → 3, two thirds → 2, any finished trip → 1; six questions allow one slip", () => {
  assert.deepEqual([0, 1, 2, 3].map(n => starsOf(n, 3)), [1, 1, 2, 3]);
  assert.deepEqual([0, 3, 4, 5, 6].map(n => starsOf(n, 6)), [1, 1, 2, 3, 3]);
});

test("a trip walks map → fly → postcards → questions → map, and nothing is skipped or out of turn", () => {
  let trip = createTrip(1, 5);
  assert.equal(trip.phase, "map");
  assert.equal(nextCard(trip), trip, "no postcard on the map");
  assert.equal(answer(trip, "in"), trip, "no answer on the map");
  assert.equal(fly(trip, 9), trip);
  trip = fly(trip, 1);
  assert.equal(trip.phase, "fly"); assert.equal(fly(trip, 0), trip, "no second flight in the air");
  assert.equal(nextCard(trip), trip, "no card while flying");
  trip = land(trip);
  assert.deepEqual([trip.phase, trip.card, trip.visited], ["card", 0, [1]]);
  assert.equal(land(trip), trip);
  trip = nextCard(trip); trip = nextCard(trip);
  assert.equal(trip.phase, "card"); assert.equal(trip.card, 2);
  trip = nextCard(trip);
  assert.equal(trip.phase, "ask");
  assert.equal(questionNow(trip)!.ask, "animal");
  assert.equal(advance(trip), trip, "➜ needs a right answer");
  const right = "np", wrong = trip.choices.find(c => c !== right)!;
  const t1 = answer(trip, wrong);
  assert.deepEqual([t1.solved, t1.tried, t1.misses], [false, [wrong], 1]);
  assert.equal(answer(t1, wrong), t1, "the same wrong picture twice is not a new miss");
  assert.equal(answer(t1, "zz"), t1, "a picture not shown");
  const t2 = answer(t1, right);
  assert.ok(t2.solved); assert.equal(t2.firstTry, 0); assert.deepEqual(t2.stamped, [1]);
  assert.equal(answer(t2, right), t2, "no second answer");
  assert.ok(!isLast(t2));
  const back = advance(t2);
  assert.equal(back.phase, "map"); assert.deepEqual(back.visited, [1]);
  assert.equal(fly(back, 1), back, "a visited country is not a destination");
  assert.ok(!allVisited(back));
});

test("a passport check visits every country first and asks afterwards; every question is asked once", () => {
  let trip = createTrip(7, 11);
  for (let at = 0; at < 3; at++) {
    trip = fly(trip, at); trip = land(trip);
    while (trip.phase === "card") trip = nextCard(trip);
    if (at < 2) { assert.equal(trip.phase, "map", "a check asks nothing until the last stop"); assert.equal(trip.queue.length, 0); }
  }
  assert.equal(trip.phase, "ask"); assert.equal(trip.queue.length, 3);
  assert.deepEqual(trip.queue.map(q => q.stop).sort(), [0, 1, 2]);
  const seen: number[] = [];
  for (;;) {
    seen.push(questionNow(trip)!.stop);
    const target = stopIds(7)[questionNow(trip)!.stop];
    trip = answer(trip, target);
    if (isLast(trip)) break;
    trip = advance(trip);
  }
  assert.deepEqual(seen.sort(), [0, 1, 2]);
  assert.deepEqual(trip.stamped.sort(), [0, 1, 2]);
  assert.equal(resultOf(trip).stars, 3);
});

test("a country with two questions stamps once, after the second", () => {
  let trip = createTrip(6, 3);
  trip = fly(trip, 0); trip = land(trip);
  while (trip.phase === "card") trip = nextCard(trip);
  assert.equal(trip.queue.length, 2);
  trip = answer(trip, "ca");
  assert.deepEqual(trip.stamped, [], "the first question does not stamp the country");
  trip = advance(trip);
  assert.equal(questionNow(trip)!.ask, "hello");
  trip = answer(trip, "ca");
  assert.deepEqual(trip.stamped, [0]);
  assert.equal(advance(trip).phase, "map");
});

test("hints: after two different wrong pictures the right one glows, so no question takes more than three taps", () => {
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9]) for (const seed of [1, 2, 3]) assert.ok(playTrip(id, seed, GUESSER).mostTaps <= 3, `level ${id} seed ${seed}`);
  let trip = createTrip(1, 9);
  trip = fly(trip, 0); trip = land(trip); while (trip.phase === "card") trip = nextCard(trip);
  assert.equal(trip.choices.length, 2);
  assert.ok(!hintOn(trip));
  trip = answer(trip, trip.choices.find(c => c !== "in")!);
  assert.ok(hintOn(trip), "with two pictures one wrong tap is enough");
});

test("bots: a guesser always finishes but rarely earns three stars; a six-year-old gets the first stars; a learner nearly always does", () => {
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    const guess = rate(id, GUESSER, stars => stars === 3), child = rate(id, FIVE, stars => stars === 3), learner = rate(id, LEARNER, stars => stars === 3);
    assert.ok(guess <= (id === 1 ? 0.1 : 0.06), `level ${id}: a guesser got ৩ stars ${(guess * 100).toFixed(0)}%`);
    assert.ok(learner >= (totalQuestions(levelOf(id)) === 6 ? 0.88 : 0.72), `level ${id}: a learner got ৩ stars ${(learner * 100).toFixed(0)}%`);
    assert.ok(child >= 0.35 && child <= 0.68, `level ${id}: a six-year-old got ৩ stars ${(child * 100).toFixed(0)}%`);
    assert.ok(rate(id, FIVE, stars => stars >= 2) >= 0.8, `level ${id}: a six-year-old nearly always gets two`);
  }
});

test("the first win comes within 10 seconds on level 1: tap a country, the flight, three postcards, one tap", () => {
  for (const child of [GUESSER, FIVE, LEARNER]) {
    let fast = 0;
    for (let seed = 1; seed <= 300; seed++) if (playTrip(1, seed, child).firstRightAt <= 10) fast++;
    assert.ok(fast / 300 >= 0.8, `${child.knows}: ${fast}/300 within 10 s`);
    assert.ok(playTrip(1, 1, { ...child, knows: 1 }).firstRightAt <= 10);
  }
});

test("a whole level is a few minutes, never a long wait", () => {
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    const play = playTrip(id, 5, FIVE);
    assert.ok(play.seconds <= 150, `level ${id}: ${play.seconds.toFixed(0)} s`);
    assert.ok(play.seconds >= 20, `level ${id}: ${play.seconds.toFixed(0)} s`);
  }
});

test("determinism: the same seed plays the same trip", () => {
  for (const id of [1, 5, 9]) assert.deepEqual(playTrip(id, 77, FIVE).trip, playTrip(id, 77, FIVE).trip);
  assert.notDeepEqual(playTrip(5, 1, FIVE).trip.choices, playTrip(5, 2, FIVE).trip.choices);
});
