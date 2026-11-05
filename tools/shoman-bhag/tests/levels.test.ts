import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { LEVEL_COUNT, ORDER, WORLDS, isWorldEnd, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf } from "../lib/levels";
import { FOOD_NAME, FRACTIONS, GUESTS, LITTLE, SHARE_FOODS, guestsFor } from "../lib/people";
import {
  START_PACE, answerOf, createRound, cut, decide, doneLine, glows, hintTarget, isDone, isLast, makeItem, moods, newsOf, nextItem, paceOf, pick, question, release, resultOf, slipLine,
  starsOf, tapBasket, tapPlate, target, taskOf, type Round,
} from "../lib/round";
import { cutLines, faceArt, FOOD_ART, pieceArt, wedge } from "../lib/shapes";
import { FIVE, GUESSER, LEARNER, PERFECT, playRound } from "./bot";

const SEEDS = 400;
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const give = (round: Round, plate: number) => tapPlate(tapBasket(round).round, plate);

test("content data: foods, guests and fractions are complete, NFC and distinct", () => {
  assert.equal(new Set(SHARE_FOODS).size, 4);
  for (const food of [...SHARE_FOODS, "ruti" as const]) { nfc(FOOD_NAME[food]); assert.ok(FOOD_ART[food].length > 0 && FOOD_ART[food].every(layer => layer.d.length > 0)); }
  assert.equal(new Set([...GUESTS, ...LITTLE].map(guest => guest.name)).size, GUESTS.length + LITTLE.length);
  assert.ok(LITTLE.every(guest => guest.small) && GUESTS.every(guest => !guest.small));
  for (const parts of [2, 3, 4]) { nfc(FRACTIONS[parts].word); nfc(FRACTIONS[parts].school); }
  assert.equal(cutLines(4).split("M").length - 1, 4);
  assert.ok(wedge(3, 0).startsWith("M50 50L"));
  assert.equal(pieceArt(2).length, 1);
  assert.ok(faceArt(GUESTS[1], "happy").length > faceArt(GUESTS[0], "happy").length - 1);
});

test("levels: ids 1–5 keep their old meaning (saved stars), 6–10 are new", () => {
  assert.equal(LEVEL_COUNT, 10);
  assert.deepEqual([1, 2, 3].map(id => levelOf(id).slots.map(slot => slot.n)[0]), [2, 3, 4]);
  assert.ok([1, 2, 3].every(id => levelOf(id).slots.every(slot => slot.kind === "share")));
  assert.ok(levelOf(4).slots.every(slot => slot.kind === "cut"));
  assert.deepEqual(levelOf(5).slots.map(slot => slot.kind), ["name", "name", "fair", "name"]);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "the play order lists every level once");
  for (const id of ORDER) { nfc(levelOf(id).title); nfc(levelOf(id).finale ?? ""); nfc(newsOf(id)); nfc(taskOf(id)); assert.ok(newsOf(id) && taskOf(id), `news and task for ${id}`); }
});

test("worlds: one new idea each (halves, thirds, quarters, the last piece), every world ends in a named finale", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 6], [2, 7], [3, 4, 8], [9, 5, 10]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), last = ids[ids.length - 1];
    assert.ok(levelOf(last).finale, `${world.name} ends in a finale`);
    assert.ok(isWorldEnd(last) && ids.slice(0, -1).every(id => !isWorldEnd(id)));
    for (const id of ids.slice(0, -1)) assert.equal(levelOf(id).finale, undefined);
    nfc(world.name); nfc(world.place);
  }
  // Halves, thirds, quarters: the guests count of a world's sharing level is its idea.
  assert.deepEqual([1, 2, 3].map(id => levelOf(id).slots[0].n), [2, 3, 4]);
  // The leftover choice is its own level now, and never appears in the sharing levels.
  assert.ok([1, 2, 3, 4, 6, 7, 8].every(id => levelOf(id).slots.every(slot => slot.kind !== "left")));
  assert.ok(levelOf(9).slots.every(slot => slot.kind === "left"));
  assert.equal(placeOf(6), 2); assert.equal(placeOf(10), 10);
  assert.equal(nextInOrder(6), 2); assert.equal(nextInOrder(10), 0);
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3 }), 6);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1);
  assert.ok(ORDER.every(id => levelOf(id).slots.length === 4 || levelOf(id).slots.length === 6));
  assert.ok(ORDER.filter(id => levelOf(id).finale).every(id => levelOf(id).slots.length === 6), "finales are the long ones");
});

test("every serving is complete and solvable in every level, eased or not", () => {
  for (const id of ORDER) for (const eased of [false, true]) for (let seed = 1; seed <= 100; seed++) {
    const rng = makeRng(seed), length = levelOf(id).slots.length;
    for (let index = 0; index < length; index++) {
      const item = makeItem(id, rng, eased, index);
      if (item.kind === "share") {
        assert.ok(item.guests.length >= 2 && item.guests.length <= 4);
        assert.equal(item.total % item.guests.length, item.extra, "one over only when the serving has a leftover");
        assert.ok(item.total >= item.guests.length + item.extra && item.total <= item.guests.length * 3 + 1);
        assert.equal(item.guests.filter(guest => guest.small).length, 1, "the youngest sits somewhere");
        if (item.cut) assert.equal(item.food, "ruti");
      } else if (item.kind === "name") {
        assert.ok(item.choices.includes(item.parts) && item.shaded >= 0 && item.shaded < item.parts);
        if (eased) assert.equal(item.choices.length, 2);
      } else assert.ok(item.fairSide === 0 || item.fairSide === 1);
    }
  }
});

test("a round is a list of servings that never moves on by itself: only nextItem after the ➜", () => {
  for (const id of ORDER) {
    let round = createRound(id, 7);
    assert.equal(round.length, levelOf(id).slots.length);
    const done = playRound(id, 7, PERFECT).round;
    assert.ok(isDone(done) && isLast(done));
    assert.equal(nextItem(done), null, "after the last serving the round ends");
    assert.equal(nextItem(round), null, "an unfinished serving never moves on");
    assert.equal(round.index, 0);
    round = createRound(id, 7);
    assert.deepEqual(round, createRound(id, 7), "the same seed is the same round");
  }
});

test("difficulty: level 1's first win comes inside ten seconds, and every level is clearable at its target rate", () => {
  const summary = (level: number, child: typeof FIVE) => {
    let three = 0, two = 0, seconds = 0, first = 0;
    for (let seed = 1; seed <= SEEDS; seed++) { const play = playRound(level, seed, child); if (play.result.stars === 3) three++; if (play.result.stars >= 2) two++; seconds += play.seconds; first += play.firstServedAt; }
    return { three: three / SEEDS, two: two / SEEDS, seconds: seconds / SEEDS, first: first / SEEDS };
  };
  assert.ok(summary(1, FIVE).first <= 10, "a five-year-old's first serving on level 1 is done within 10 s");
  assert.ok(summary(1, FIVE).two >= 0.95);
  for (const id of ORDER) {
    const perfect = summary(id, PERFECT), learner = summary(id, LEARNER), five = summary(id, FIVE);
    assert.equal(perfect.three, 1, `a perfect player gets 3 stars on ${id}`);
    assert.ok(learner.two >= 0.95, `${id}: a learner earns 2+ stars ${learner.two}`);
    assert.ok(five.two >= (levelOf(id).finale ? 0.65 : 0.75), `${id}: a five-year-old earns 2+ stars ${five.two}`);
    assert.ok(five.three < 0.7 || id === 1, `${id}: 3 stars are earned, not free`);
    assert.ok(learner.seconds <= 150 && five.seconds <= 210, `${id}: a round is about 1–3 minutes (${learner.seconds}/${five.seconds})`);
  }
  // A child who guesses every time still always finishes (the quiet ease and the glow lead the way); nothing sticks.
  for (const id of ORDER) for (let seed = 1; seed <= 80; seed++) assert.doesNotThrow(() => playRound(id, seed, GUESSER));
});

test("sharing: lift from the basket, drop on a plate; take back; a plate past its share is a gentle miss", () => {
  let round = createRound(2, 3);
  const fair = target(round), n = round.plates.length;
  assert.equal(round.hand, null);
  let step = tapBasket(round);
  assert.equal(step.event, "pick"); assert.equal(step.round.hand, "basket");
  assert.equal(tapBasket(step.round).event, "cancel", "tap the basket again to put it back");
  step = tapPlate(step.round, 0);
  assert.equal(step.round.plates[0], 1); assert.equal(step.round.basket, round.item.kind === "share" ? round.item.total - 1 : 0);
  // pick it back up from the plate and put it in the basket
  const up = tapPlate(step.round, 0);
  assert.equal(up.event, "pick"); assert.equal(up.round.hand, 0);
  const back = tapBasket(up.round);
  assert.equal(back.event, "drop"); assert.equal(back.round.plates[0], 0); assert.equal(back.round.hand, null);
  // fill plate 0 past its share: a miss, the face is surprised, a picture arrow marks the plate, the hint line says what to do
  round = createRound(2, 3);
  for (let count = 0; count <= fair; count++) { step = give(round, 0); round = step.round; }
  assert.equal(step.event, "over");
  assert.deepEqual(round.miss, { kind: "over", plate: 0 });
  assert.equal(round.tries, 1); assert.equal(round.clean, false);
  assert.equal(moods(round)[0], "oh");
  assert.ok(moods(round).slice(1).every(mood => mood !== "oh"));
  assert.match(slipLine(round), /বেশি/);
  assert.deepEqual(hintTarget(round), { plate: 0 }, "the finger points at the plate to take one back from");
  // put it right: the hint is gone
  step = tapBasket(tapPlate(round, 0).round);
  assert.equal(step.round.miss, null);
  assert.equal(n >= 2, true);
});

test("the last one: every choice is fine, only the faces change, stars stay the same", () => {
  const toLeft = (seed: number) => {
    let round = createRound(9, seed);
    const fair = target(round);
    for (let plate = 0; plate < round.plates.length; plate++) for (let count = 0; count < fair; count++) round = give(round, plate).round;
    return round;
  };
  const choices = ["share", "small", "keep", 0, 1] as const;
  const stars = new Set<number>();
  for (const choice of choices) {
    const round = toLeft(4);
    assert.equal(round.stage, "left");
    assert.equal(round.basket, 1);
    assert.ok(moods(round).every(mood => mood === "happy"), "everyone has the same, so every face is happy");
    const done = decide(round, choice);
    assert.equal(done.event, "right"); assert.equal(done.round.stage, "done"); assert.equal(done.round.basket, 0);
    assert.equal(done.round.clean, true, "no choice is a mistake");
    stars.add(done.round.firstTry);
    assert.ok(doneLine(done.round).length > 0); nfc(doneLine(done.round));
    assert.doesNotMatch(doneLine(done.round), /ঠিক|ভুল/, "never says which choice was right");
  }
  assert.equal(stars.size, 1, "the choice never changes the stars");
  // the faces: one plate gets it and everyone else is a little sad; the little one gets it and the big ones smile
  const round = toLeft(4), small = round.item.kind === "share" ? round.item.guests.findIndex(guest => guest.small) : -1;
  assert.deepEqual(moods(decide(round, 0).round).map((mood, at) => at === 0 ? mood === "happy" : mood === "sad"), moods(round).map(() => true));
  assert.equal(moods(decide(round, "small").round)[small], "happy");
  assert.ok(moods(decide(round, "keep").round).every(mood => mood === "smile"));
  assert.equal(decide(round, 9).event, "ignore");
  // tapping a plate gives it to that guest, the same as the picture choices
  assert.equal(tapPlate(round, 1).round.choice, 1);
  assert.deepEqual(hintTarget(round), { plate: small });
});

test("cutting: one piece per guest; a wrong cut shows heads over pieces; the piece is named", () => {
  let round = createRound(4, 5);
  const n = round.item.kind === "share" ? round.item.guests.length : 0, fair = target(round);
  for (let plate = 0; plate < n; plate++) for (let count = 0; count < fair; count++) round = give(round, plate).round;
  assert.equal(round.stage, "cut");
  assert.deepEqual(hintTarget(round), { cut: n });
  const wrong = [2, 3, 4].find(parts => parts !== n)!;
  let step = cut(round, wrong);
  assert.equal(step.event, "again");
  assert.deepEqual(step.round.miss, { kind: "cut", parts: wrong });
  assert.equal(step.round.stage, "cut");
  assert.match(slipLine(step.round), new RegExp(`${["", "", "২", "৩", "৪"][wrong]}টা`));
  assert.equal(glows(step.round), false);
  step = cut(step.round, [2, 3, 4].find(parts => parts !== n && parts !== wrong)!);
  assert.equal(glows(step.round), true, "after two tries the right knife glows");
  step = cut(round, n);
  assert.equal(step.event, "right"); assert.equal(step.round.stage, "give"); assert.equal(step.round.cutInto, n);
  assert.deepEqual(step.round.cuts, [n]);
  // hand each guest a piece, one by one; the last piece finishes the serving
  round = step.round;
  for (let plate = 0; plate < n; plate++) {
    assert.deepEqual(hintTarget(round), { plate });
    step = tapPlate(round, plate);
    assert.equal(step.event, plate === n - 1 ? "right" : "drop");
    assert.equal(tapPlate(step.round, plate).event, "ignore", "a piece is given once");
    round = step.round;
  }
  assert.ok(isDone(round)); assert.equal(round.served, n);
  assert.ok(moods(round).every(mood => mood === "happy"));
  assert.match(doneLine(round), new RegExp(FRACTIONS[n].word));
});

test("naming: a miss costs a try, two tries make the answer glow, three in a row quietly ease the next card", () => {
  let round = createRound(5, 11);
  assert.equal(round.stage, "pick");
  const right = answerOf(round), wrongs = (round.item.kind === "name" ? round.item.choices : []).filter(value => value !== right);
  let step = pick(round, wrongs[0]);
  assert.equal(step.event, "again");
  assert.deepEqual(step.round.miss, { kind: "pick", value: wrongs[0] }, "the wrong tile is remembered so its picture can show the numbered pieces");
  assert.equal(glows(step.round), false);
  step = pick(step.round, wrongs[1]);
  assert.equal(glows(step.round), true);
  assert.deepEqual(hintTarget(step.round), { pick: right });
  step = pick(step.round, right);
  assert.equal(step.event, "right"); assert.ok(isDone(step.round)); assert.equal(step.round.firstTry, 0);
  assert.equal(pick(step.round, right).event, "ignore", "a finished card takes no more answers");
  // three misses in a row quietly ease the next serving: two choices, not three
  round = createRound(5, 11);
  round = pick(pick(pick(round, wrongs[0]).round, wrongs[1]).round, wrongs[0]).round;
  assert.equal(round.eased, true);
  assert.equal(paceOf(round).eased, true);
  const next = nextItem(pick(round, right).round)!;
  assert.equal(next.item.kind === "name" ? next.item.choices.length : 0, 2);
});

test("five first-try servings lift the ease, and the ease carries into the next round", () => {
  const eased = playRound(2, 9, GUESSER).round;
  const carried = createRound(2, 3, { eased: true, rightRun: 0 });
  assert.equal(carried.eased, true);
  const lifted = playRound(1, 3, PERFECT, { eased: true, rightRun: 4 }).round;
  assert.equal(lifted.eased, false);
  assert.deepEqual(paceOf(createRound(1, 1)), START_PACE);
  assert.equal(typeof eased.rightRun, "number");
});

test("stars only record the round, and slow mode has no say in them", () => {
  assert.equal(starsOf(4, 4), 3); assert.equal(starsOf(3, 4), 2); assert.equal(starsOf(2, 4), 2); assert.equal(starsOf(1, 4), 1); assert.equal(starsOf(0, 4), 1);
  assert.equal(starsOf(6, 6), 3); assert.equal(starsOf(3, 6), 2); assert.equal(starsOf(2, 6), 1);
  const result = resultOf(playRound(8, 2, PERFECT).round);
  assert.equal(result.stars, 3); assert.equal(result.count, 6); assert.equal(result.foods.length, 6);
});

test("a piece in the hand goes back where it came from when the window blurs, the menu opens or a drag lets go in the air", () => {
  let round = createRound(1, 4);
  round = tapBasket(round).round;
  const before = round.basket;
  assert.equal(round.hand, "basket");
  const back = release(round);
  assert.equal(back.hand, null); assert.equal(back.basket, before, "nothing was lost or given");
  assert.equal(release(back), back, "letting go twice is harmless");
  round = tapPlate(round, 0).round;
  round = tapPlate(round, 0).round; // picks it up again from the plate
  assert.equal(round.hand, 0);
  const home = release(round);
  assert.equal(home.hand, null); assert.deepEqual(home.plates, round.plates);
});

test("tables: the youngest moves seat; guests never repeat at one table", () => {
  for (let n = 2; n <= 4; n++) for (let index = 0; index < 8; index++) {
    const guests = guestsFor(n, index);
    assert.equal(guests.length, n);
    assert.equal(guests.findIndex(guest => guest.small), index % n);
    assert.equal(new Set(guests.map(guest => guest.name)).size, n);
  }
});

test("words: every question, hint and end line is NFC plain Bangla, and none gives a verdict", () => {
  for (const id of ORDER) for (let seed = 1; seed <= 30; seed++) {
    const round = createRound(id, seed);
    nfc(question(round)); assert.ok(question(round).length > 0);
    const play = playRound(id, seed, FIVE);
    nfc(doneLine(play.round)); nfc(slipLine({ ...play.round, miss: { kind: "pick", value: 9 } }));
    assert.doesNotMatch(question(round) + doneLine(play.round), /আপনি|করুন|ভুল হয়েছে/, "তুমি voice, no scolding");
  }
});
