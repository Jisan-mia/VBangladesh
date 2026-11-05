// The levels as data, the boards a seed makes, and the bots that play every level at its target rate.
import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_COUNT, ORDER, WALLS, WORLDS, isWorldEnd, levelOf, levelsOfWorld, matchesOf, nextInOrder, nextToPlay, placeOf } from "../lib/levels";
import { newsOf, taskOf } from "../lib/lines";
import {
  MAX_TOYS, boardDone, boardsOf, createRound, hintSlot, isDone, makeBoard, nextBoard, place, resultOf, shelfToys, starsOf, toyCount, total, toyPlaced,
} from "../lib/round";
import { SHAPES, shapeOf, silhouette } from "../lib/shapes";
import { FIVE, GUESSER, LEARNER, playRound } from "./bot";

const SEEDS = 1200;
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("levels: ids 1–5 keep their old meaning (saved stars), ids 6–11 are new, every level is in the play order once", () => {
  assert.equal(LEVEL_COUNT, 11);
  assert.deepEqual([1, 2, 3].map(id => levelOf(id).toys), [2, 3, 4], "ids 1–3: two, three, four toys");
  assert.ok(levelOf(4).kin && levelOf(4).shadows === 1, "id 4: look-alikes");
  assert.equal(levelOf(5).turn, "turns", "id 5: turned shadows");
  assert.deepEqual([...ORDER].sort((a, b) => a - b), Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1));
  for (const id of ORDER) { nfc(levelOf(id).title); nfc(levelOf(id).finale ?? ""); nfc(newsOf(id)); nfc(taskOf(id)); }
  for (const world of WORLDS) { nfc(world.name); nfc(world.idea); nfc(world.place); }
});

test("worlds: one new idea each, every world ends in a named finale, one palette per world", () => {
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[1, 2, 3], [6, 7, 8], [4, 9], [10, 5, 11]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), last = ids[ids.length - 1];
    assert.ok(levelOf(last).finale, `${world.name} ends in a finale`);
    assert.ok(isWorldEnd(last) && ids.slice(0, -1).every(id => !isWorldEnd(id)));
    for (const id of ids.slice(0, -1)) assert.equal(levelOf(id).finale, undefined);
  }
  assert.equal(new Set(WALLS.map(wall => wall.wall)).size, WORLDS.length);
  assert.equal(placeOf(6), 4); assert.equal(placeOf(11), 11);
  assert.equal(nextInOrder(3), 6); assert.equal(nextInOrder(11), 0);
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 2 }), 3);
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1);
});

test("each level teaches exactly one new thing over the one before it in its world", () => {
  const diff = (a: number, b: number) => {
    const x = levelOf(a), y = levelOf(b);
    return [x.shadows !== y.shadows, x.toys !== y.toys, x.kin !== y.kin, x.turn !== y.turn].filter(Boolean).length;
  };
  assert.equal(diff(1, 2), 1); assert.equal(diff(2, 3), 1);
  assert.equal(diff(6, 7), 2, "from two to three shadows the toys follow"); // shadows and toys rise together by design
  assert.equal(diff(7, 8), 1);
  assert.equal(diff(10, 5), 1, "a lean and a full turn differ in the kind of turn only");
  assert.equal(levelOf(10).turn, "lean"); assert.equal(levelOf(5).turn, "turns");
  for (const id of ORDER) {
    const spec = levelOf(id);
    assert.ok(spec.toys >= spec.shadows && spec.toys <= MAX_TOYS, `${id}: toys between the shadows and 4`);
    assert.equal(spec.sample.length, spec.toys, `${id}: the card's tiny wall shows the toys`);
    for (const toy of spec.sample) assert.ok(shapeOf(toy), toy);
    assert.ok(matchesOf(id) >= 6 && matchesOf(id) <= 9, `${id}: a round is 6–9 matches`);
  }
});

test("every object is drawn in code, and its shadow is the same drawing in one flat colour", () => {
  assert.equal(new Set(SHAPES.map(shape => shape.id)).size, SHAPES.length);
  for (const shape of SHAPES) {
    nfc(shape.bn);
    assert.doesNotMatch(shape.art, /<script|href|url\(|<image/, shape.id);
    const dark = silhouette(shape.art, "#123456");
    assert.doesNotMatch(dark.replace(/#123456/g, ""), /#[0-9a-fA-F]{3,6}/, `${shape.id} has no other colour left`);
    assert.equal(dark.length, shape.art.replace(/#[0-9a-fA-F]{3,8}\b/g, "#123456").length);
  }
});

test("boards: every seed makes a fair wall for every level", () => {
  for (const id of ORDER) {
    const spec = levelOf(id);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const round = createRound(id, seed), { board } = round;
      assert.equal(board.shadows.length, spec.shadows);
      assert.equal(board.toys.length, spec.toys);
      assert.equal(new Set(board.toys).size, board.toys.length, "no toy twice on a shelf");
      for (const shadow of board.shadows) assert.ok(board.toys.includes(shadow.id), "every shadow's toy is on the shelf");
      const families = board.toys.map(toy => shapeOf(toy)!.family);
      const shadowFamilies = board.shadows.map(shadow => shapeOf(shadow.id)!.family);
      if (spec.kin) {
        assert.equal(new Set(families).size, 1, `${id}/${seed}: one family on the shelf`);
        if (spec.families) assert.ok(spec.families.includes(families[0]));
      } else {
        assert.equal(new Set(shadowFamilies).size, spec.shadows, `${id}/${seed}: the shadows look different`);
        for (const toy of board.toys.filter(toy => !board.shadows.some(shadow => shadow.id === toy))) assert.ok(!shadowFamilies.includes(shapeOf(toy)!.family), "a spare never looks like a shadow");
      }
      for (const shadow of board.shadows) {
        if (spec.turn === "none") assert.deepEqual(shadow.turn, { deg: 0, flip: false });
        if (spec.turn === "lean") assert.ok(Math.abs(shadow.turn.deg) >= 25 && Math.abs(shadow.turn.deg) <= 40 && !shadow.turn.flip);
        if (spec.turn === "turns") assert.ok(shadow.turn.flip || [90, 180, -90].includes(shadow.turn.deg));
      }
    }
  }
});

test("a round never repeats a shadow's toy while others are free, and the same seed gives the same round", () => {
  for (const id of ORDER) {
    for (let seed = 1; seed <= 200; seed++) {
      let round = createRound(id, seed);
      const same = createRound(id, seed);
      assert.deepEqual(round, same, "deterministic");
      for (let at = 1; at < boardsOf(round); at++) {
        for (let slot = 0; slot < round.placed.length; slot++) round = place(round, round.board.shadows[slot].id, slot).round;
        round = nextBoard(round);
      }
      for (let slot = 0; slot < round.placed.length; slot++) round = place(round, round.board.shadows[slot].id, slot).round;
      assert.ok(isDone(round));
      const ids = resultOf(round).ids;
      assert.equal(ids.length, matchesOf(id));
      if (!levelOf(id).kin) assert.equal(new Set(ids).size, ids.length, `${id}/${seed}: nothing repeats`);
    }
  }
});

test("toy count: quietly one fewer after three slipped matches, one more after five clean, never under the shadows nor over four", () => {
  assert.equal(toyCount(3, 1, 0, 0), 3); assert.equal(toyCount(3, 1, 3, 0), 2); assert.equal(toyCount(2, 1, 3, 0), 2);
  assert.equal(toyCount(3, 1, 0, 5), 4); assert.equal(toyCount(4, 1, 0, 9), 4);
  assert.equal(toyCount(3, 3, 3, 0), 3, "never fewer than the shadows");
  assert.equal(toyCount(2, 2, 0, 5), 3);
});

test("place: a match lands, a slip only counts, a repeat of a wrong pair counts once, nothing is lost", () => {
  const round = createRound(2, 7), right = round.board.shadows[0].id, wrong = round.board.toys.find(toy => toy !== right)!;
  const slip = place(round, wrong, 0);
  assert.equal(slip.outcome, "miss"); assert.equal(slip.round.misses, 1);
  assert.equal(place(slip.round, wrong, 0).outcome, "same");
  assert.equal(place(slip.round, wrong, 0).round, slip.round, "a repeat changes nothing");
  assert.equal(hintSlot(slip.round), -1, "one slip: no hint yet");
  assert.equal(slip.round.matches, 0); assert.equal(toyPlaced(slip.round, wrong), false);
  const hit = place(slip.round, right, 0);
  assert.equal(hit.outcome, "match"); assert.deepEqual(hit.round.placed, [true]); assert.equal(hit.round.firstTry, 0, "a slip first: not a first-try match");
  assert.equal(place(hit.round, right, 0).outcome, "ignored", "a placed toy and a filled shadow are done");
  assert.equal(place(round, "no-such-toy", 0).outcome, "ignored");
  assert.equal(place(round, right, 5).outcome, "ignored");
  assert.ok(boardDone(hit.round) && isDone(hit.round) === (boardsOf(round) === 1));
});

test("hint: after two slips the first open shadow is named, and it goes when it is matched", () => {
  let round = createRound(7, 11);
  const wrong = round.board.toys.filter(toy => toy !== round.board.shadows[0].id);
  round = place(round, wrong[0], 0).round; round = place(round, wrong[1], 0).round;
  assert.equal(round.misses, 2); assert.equal(hintSlot(round), 0);
  round = place(round, round.board.shadows[0].id, 0).round;
  assert.equal(round.misses, 0); assert.equal(hintSlot(round), -1);
  assert.deepEqual(shelfToys(round), round.board.toys.filter(toy => toy !== round.board.shadows[0].id));
});

test("hint: with one wrong toy on the shelf, a single slip is enough (there is only one wrong pair to try)", () => {
  const round = createRound(1, 7), right = round.board.shadows[0].id, wrong = round.board.toys.find(toy => toy !== right)!;
  assert.equal(hintSlot(round), -1);
  const slip = place(round, wrong, 0).round;
  assert.equal(slip.misses, 1); assert.equal(hintSlot(slip), 0);
  assert.equal(hintSlot(place(slip, wrong, 0).round), 0, "and the repeat keeps it");
});

test("stars: 3 for all but one first try, 2 for half, 1 for finishing", () => {
  assert.deepEqual([6, 5, 4, 3, 2, 0].map(first => starsOf(first, 6)), [3, 3, 2, 2, 1, 1]);
  assert.deepEqual([3, 2, 1, 0].map(first => starsOf(first, 3)), [3, 3, 1, 1], "three scored matches: two clean ones earn 3, one earns 1");
  assert.deepEqual([9, 8, 5, 4, 0].map(first => starsOf(first, 9)), [3, 3, 2, 1, 1]);
  assert.equal(total(createRound(8, 1)), 9);
  // A last toy on a last shadow can only be right: it earns nothing and costs nothing.
  let round = createRound(7, 5);
  for (let slot = 0; slot < 3; slot++) round = place(round, round.board.shadows[slot].id, slot).round;
  assert.equal(round.matches, 3); assert.equal(round.scored, 2); assert.equal(round.firstTry, 2);
});

test("bots: a guesser finishes every level; a learner earns 3 stars on easy levels; the first match comes inside 10 seconds on level 1", () => {
  const rate = (level: number, child: typeof FIVE, pass: (stars: number) => boolean) => {
    let hits = 0;
    for (let seed = 1; seed <= 400; seed++) { const play = playRound(level, seed, child); if (pass(resultOf(play.round).stars)) hits++; }
    return hits / 400;
  };
  for (const id of ORDER) {
    for (let seed = 1; seed <= 300; seed++) {
      const play = playRound(id, seed, GUESSER);
      assert.ok(isDone(play.round));
      assert.equal(resultOf(play.round).count, matchesOf(id));
      assert.ok(play.tries <= matchesOf(id) * (levelOf(id).toys + 1), `${id}/${seed}: ${play.tries} tries for a pure guesser`);
    }
  }
  for (let seed = 1; seed <= 400; seed++) assert.ok(playRound(1, seed, GUESSER).firstMatchAt <= 10, "level 1: the first match inside 10 s even for a guesser");
  for (const id of [1, 2, 3, 7, 8]) assert.ok(rate(id, LEARNER, stars => stars === 3) >= 0.7, `level ${id}: a 90% learner mostly gets 3 stars`);
  for (const id of [1, 2, 3, 4, 6, 7, 8, 9, 10, 5, 11]) assert.ok(rate(id, LEARNER, stars => stars >= 2) >= 0.95, `level ${id}: a 90% learner nearly always gets 2+`);
  // A guesser still gets a star on a two-toy level, and a five-year-old (70%) mostly 2+ even where look-alikes begin.
  assert.ok(rate(1, GUESSER, stars => stars >= 1) === 1);
  assert.ok(rate(4, FIVE, stars => stars >= 2) >= 0.85, "level 4: a 70% five-year-old gets 2+ most of the time");
  assert.ok(rate(5, FIVE, stars => stars >= 2) >= 0.85);
  const three = (level: number) => rate(level, FIVE, stars => stars === 3);
  assert.ok(three(1) >= 0.35 && three(1) <= 0.6, "level 1: a 70% five-year-old earns 3 stars about half the time");
  assert.ok(three(3) < three(1) && three(8) < three(2), "the finales, with more toys, are harder than the plain levels");
  assert.ok(rate(3, GUESSER, stars => stars === 3) === 0, "a child who gets everything wrong first never earns 3 stars");
});

test("round length in seconds: every level is 1–4 minutes for a 5-year-old", () => {
  for (const id of ORDER) {
    let sum = 0;
    for (let seed = 1; seed <= 100; seed++) sum += playRound(id, seed, FIVE).seconds;
    const mean = sum / 100;
    assert.ok(mean >= 15 && mean <= 130, `level ${id}: ${mean.toFixed(0)} s`);
  }
});

test("makeBoard falls back safely when asked for more toys than the family has", () => {
  const board = makeBoard(4, 3, 0, SHAPES.map(shape => shape.id), 4);
  assert.equal(board.toys.length, 4);
});
