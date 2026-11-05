// Levels as data: each one is solvable on every seed, each world adds one kind of clue per level and ends in a finale,
// and headless bots (a guesser, a 3-year-old, a 4-year-old matching word shapes, a reader) hit their target rates.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { advance, answerOf, askable, cardOf, choiceCount, choose, createRound, hinting, namedKind, onFigure, starsOf, type Card } from "../lib/book";
import { KIND_TEXT, LEVELS, LEVEL_COUNT, WORLDS, isFinale, levelLine, levelName, levelOf, newLevelFor, placeInWorld, worldLevels, type Kind } from "../lib/levels";
import { HABITATS, PACKS, packOf } from "../lib/packs";

const SEEDS = Array.from({ length: 400 }, (_, index) => 1 + index * 7919);

/** Plays one round: `know(card)` is the chance the child knows the answer; otherwise a random untried sticker, and the glow after two misses. */
function play(levelId: number, seed: number, know: (card: Card) => number) {
  const round = createRound(levelId, seed), rng = makeRng(seed ^ 0x5bd1e995), level = levelOf(levelId);
  let maxTaps = 0;
  for (;;) {
    const card = cardOf(round), answer = answerOf(card);
    const options = onFigure(level) ? packOf("shorir").items.filter(item => item.view === card.target.view).map(item => item.id) : round.choices.map(choice => choice.id);
    assert.ok(options.includes(answer), `level ${levelId} seed ${seed}: the answer is on offer`);
    let taps = 0;
    while (!round.solved) {
      let id = answer;
      if (!hinting(round) && rng() >= know(card)) {
        const left = options.filter(option => !round.wrong.includes(option));
        id = left[Math.floor(rng() * left.length)];
      }
      assert.notEqual(choose(round, id), "ignored");
      taps++;
    }
    maxTaps = Math.max(maxTaps, taps);
    if (round.full) break;
    assert.ok(advance(round));
  }
  return { stars: starsOf(round.firstTry, round.cards.length), maxTaps, cards: round.cards.length };
}
const rate = (levelId: number, know: (card: Card) => number, atLeast: number) =>
  SEEDS.filter(seed => play(levelId, seed, know).stars >= atLeast).length / SEEDS.length;

test("31 levels in 6 worlds, ids in order, each world ends with a named finale", () => {
  assert.equal(LEVEL_COUNT, 31);
  LEVELS.forEach((level, index) => assert.equal(level.id, index + 1));
  for (const world of WORLDS) {
    const levels = worldLevels(world.id);
    assert.deepEqual([levels[0].id, levels[levels.length - 1].id], [world.first, world.last], world.id);
    assert.ok(levels.length >= 5, world.id);
    assert.ok(isFinale(world.last) && levelOf(world.last).finale, `${world.id} ends in a finale`);
    assert.ok(levels.slice(0, -1).every(level => !level.finale && level.kinds.length === 1), `${world.id}: one kind per ordinary level`);
    // One new thing per level: no two ordinary levels of a world share a clue (শরীর's two lens levels differ by view).
    const seen = levels.slice(0, -1).map(level => `${level.kinds[0]}:${level.view ?? ""}`);
    assert.equal(new Set(seen).size, seen.length, world.id);
    // The finale mixes only kinds the world has taught.
    for (const kind of levelOf(world.last).kinds) assert.ok(levels.slice(0, -1).some(level => level.kinds[0] === kind), `${world.id} finale ${kind}`);
    assert.equal(placeInWorld(world.first), 1);
  }
  for (const level of LEVELS) {
    assert.ok(levelName(level.id) && levelLine(level.id), `${level.id} has a name and a line`);
    if (!onFigure(level)) assert.ok(level.base >= 2 && level.base <= 4, `${level.id} offers 2–4`);
  }
  // Pre-readers first: every picture world opens with a clue that needs no reading.
  for (const world of WORLDS) assert.ok(!["bn", "en", "role"].includes(levelOf(world.first).kinds[0]), world.id);
  for (const kind of Object.keys(KIND_TEXT) as Kind[]) assert.ok(LEVELS.some(level => level.kinds.includes(kind)), `${kind} is used`);
});

test("every level has enough to ask, and a round is six (or five) different cards", () => {
  for (const level of LEVELS) for (const kind of level.kinds) assert.ok(askable(packOf(level.world), kind, level.view).length >= level.cards, `${level.id} ${kind}`);
  for (const level of LEVELS) for (const seed of SEEDS.slice(0, 60)) {
    const round = createRound(level.id, seed);
    assert.equal(round.cards.length, level.cards);
    assert.equal(new Set(round.cards.map(card => card.target.id)).size, level.cards, `${level.id}/${seed} no repeats`);
  }
});

test("stickers: the answer once, no repeats, 2–4 of them; a home never offers an animal that also lives there", () => {
  for (const level of LEVELS) for (const seed of SEEDS.slice(0, 80)) {
    const round = createRound(level.id, seed);
    for (;;) {
      const card = cardOf(round);
      if (onFigure(level)) assert.equal(round.choices.length, 0);
      else {
        const ids = round.choices.map(choice => choice.id);
        assert.ok(ids.length >= 2 && ids.length <= 4, `${level.id}: ${ids.length}`);
        assert.equal(new Set(ids).size, ids.length);
        assert.equal(ids.filter(id => id === answerOf(card)).length, 1);
        assert.equal(new Set(round.choices.map(choice => choice.art)).size, ids.length, "no two stickers look alike");
        if (card.kind === "home") for (const choice of round.choices) {
          const animal = packOf("pashu").items.find(item => item.id === choice.id)!;
          assert.ok(choice.id === card.target.id || (animal.home !== card.target.home && !animal.also?.includes(card.target.home!)), `${choice.id} doesn't live in ${card.target.home}`);
        }
      }
      choose(round, answerOf(card));
      if (round.full) break;
      advance(round);
    }
  }
});

test("a round replays exactly from its seed", () => {
  for (const level of [1, 6, 19, 26, 31]) {
    const a = createRound(level, 4242), b = createRound(level, 4242);
    assert.deepEqual(a.cards.map(card => [card.kind, card.target.id]), b.cards.map(card => [card.kind, card.target.id]));
    assert.deepEqual(a.choices, b.choices);
    assert.deepEqual(play(level, 77, () => 0.5), play(level, 77, () => 0.5));
  }
});

test("the habitat level spreads its homes; মাথা থেকে পা runs head to foot", () => {
  for (const seed of SEEDS.slice(0, 100)) {
    const homes = new Set(createRound(3, seed).cards.map(card => card.target.home));
    assert.ok(homes.size >= 5, `${homes.size} homes`);
    const tops = createRound(21, seed).cards.map(card => Math.min(...card.target.spots!.map(([, y]) => y)));
    assert.deepEqual(tops, [...tops].sort((a, b) => a - b));
  }
  assert.ok(HABITATS.length === 6);
});

test("the quiet easing: three misses in a row take a sticker away, five right add one, always 2–4 and within one of the level", () => {
  assert.equal(choiceCount(0, 0, 3), 3);
  assert.equal(choiceCount(3, 0, 3), 2);
  assert.equal(choiceCount(0, 5, 3), 4);
  assert.equal(choiceCount(3, 0, 2), 2, "never below 2");
  assert.equal(choiceCount(0, 5, 4), 4, "never above 4");
  assert.equal(choiceCount(0, 5, 2), 3);
  const round = createRound(4, 9);
  for (let card = 0; card < 3; card++) {
    const answer = answerOf(cardOf(round)), wrong = round.choices.find(choice => choice.id !== answer)!.id;
    choose(round, wrong); choose(round, answer); advance(round);
  }
  assert.equal(round.choices.length, 2, "after three missed cards the next card offers two");
});

test("feedback: a wrong sticker is remembered (its name shows), the glow comes after two, and nothing is ever lost", () => {
  const round = createRound(2, 5), answer = answerOf(cardOf(round));
  const [first, second] = round.choices.filter(choice => choice.id !== answer);
  assert.equal(choose(round, first.id), "wrong");
  assert.equal(hinting(round), false);
  assert.equal(choose(round, first.id), "again", "the same wrong sticker twice counts once");
  assert.deepEqual(round.wrong, [first.id]);
  if (second) { assert.equal(choose(round, second.id), "wrong"); assert.equal(hinting(round), true); }
  assert.equal(choose(round, "elephant-from-nowhere"), "ignored");
  assert.equal(choose(round, answer), "right");
  assert.equal(choose(round, answer), "ignored", "a placed sticker can't be placed twice");
  assert.equal(round.firstTry, 0);
});

test("stars are a record: 3 for all but one right first time, 2 for half, 1 for finishing", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(n => starsOf(n, 6)), [1, 1, 1, 2, 2, 3, 3]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(n => starsOf(n, 5)), [1, 1, 1, 2, 3, 3]);
});

test("bots: a guesser finishes every level in at most 3 taps a card, on every seed", () => {
  for (const level of LEVELS) for (const seed of SEEDS.slice(0, 150)) {
    const result = play(level.id, seed, () => 0);
    assert.ok(result.maxTaps <= 3, `${level.id}/${seed}: ${result.maxTaps} taps`);
    assert.ok(result.stars >= 1);
  }
});

test("bots: a 3-year-old (knows a picture clue 80% of the time) gets ≥ 2 stars on every world's first level on ≥ 90% of seeds", () => {
  for (const world of WORLDS) {
    const got = rate(world.first, () => 0.8, 2);
    assert.ok(got >= 0.9, `${world.id} level ${world.first}: ${got}`);
  }
});

test("bots: a 4-year-old matching word shapes 65% of the time gets ≥ 2 stars on the বাংলা নাম levels on ≥ 75% of seeds", () => {
  for (const level of LEVELS.filter(item => item.kinds.length === 1 && item.kinds[0] === "bn")) {
    const got = rate(level.id, card => (namedKind(card.kind) ? 0.65 : 0.3), 2);
    assert.ok(got >= 0.75, `level ${level.id}: ${got}`);
  }
});

test("bots: a reader (95%) gets 3 stars on every finale on ≥ 75% of seeds; a guesser rarely does", () => {
  for (const world of WORLDS) {
    const reader = rate(world.last, () => 0.95, 3), guesser = rate(world.last, () => 0, 3);
    assert.ok(reader >= 0.75, `${world.id} finale reader ${reader}`);
    assert.ok(guesser <= 0.1, `${world.id} finale guesser ${guesser}`);
  }
});

test("bots: level 1 is a 2-sticker card, so even a guesser's first card is right half the time (the first win in seconds)", () => {
  assert.equal(createRound(1, 1).choices.length, 2);
  const firstRight = SEEDS.filter(seed => { const round = createRound(1, seed); return choose(round, round.choices[0].id) === "right"; }).length / SEEDS.length;
  assert.ok(firstRight > 0.35 && firstRight < 0.65, String(firstRight));
});

test("old saved progress: every old (pack, level) has a new home", () => {
  const old: Record<string, string[]> = { pashu: ["bn", "en", "home", "read"], fol: ["bn", "en", "read"], sobji: ["bn", "en", "read"], shorir: ["bn", "en", "read"], rong: ["bn", "en", "thing"], protik: ["bn", "en", "role"] };
  for (const pack of PACKS) for (const mode of old[pack.id]) {
    const level = newLevelFor(pack.id, mode as never);
    assert.ok(level && levelOf(level).world === pack.id && !isFinale(level), `${pack.id}/${mode} → ${level}`);
  }
  assert.equal(newLevelFor("pashu", "home"), 3);
  assert.equal(newLevelFor("rong", "thing"), 22);
  assert.equal(newLevelFor("protik", "role"), 29);
  assert.equal(newLevelFor("fol", "read"), 9);
});
