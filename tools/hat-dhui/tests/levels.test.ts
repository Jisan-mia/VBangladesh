// The levels as data, and the headless bots that prove them fair: the quiz's guesser, a five-year-old and a learner; and
// that a routine's stars never depend on how well anyone does (a finished routine is a finished routine).
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { MODES, completesSet, firstToPlay, modeOf, nextMode } from "../lib/levels";
import { QUESTIONS } from "../lib/quiz";
import { createQuizRound, currentQuestion, hintOn, isLastQuestion, nextQuestion, quizResult, tapMoment } from "../lib/quiz-round";

type Bot = (round: ReturnType<typeof createQuizRound>, rng: () => number) => string;
/** Plays a whole quiz. `knows` is the chance the bot taps the right picture straight away; else it picks any picture at random. */
function play(seed: number, knows: number) {
  const rng = makeRng(seed * 31 + 7);
  let round = createQuizRound(seed), taps = 0, worst = 0;
  for (;;) {
    let here = 0;
    while (!round.solved) {
      const question = currentQuestion(round);
      const open = round.choices.filter(choice => !round.wrong.includes(choice.id));
      const id = hintOn(round) ? question.right.id : rng() < knows ? question.right.id : open[Math.floor(rng() * open.length)].id;
      round = tapMoment(round, id); taps++; here++;
    }
    worst = Math.max(worst, here);
    if (isLastQuestion(round)) return { ...quizResult(round), taps, worst };
    round = nextQuestion(round);
  }
}
const SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1);
const rate = (test: (seed: number) => boolean) => SEEDS.filter(test).length / SEEDS.length;

test("levels: ids 1–3 in play order, one routine each for the sink and a picture quiz", () => {
  assert.deepEqual(MODES.map(mode => [mode.id, mode.level, mode.kind]), [["hat", 1, "routine"], ["dat", 2, "routine"], ["kokhon", 3, "quiz"]]);
  assert.equal(modeOf("nope").id, "hat");
});

test("what's ready next: the first level without a star, then the next one in order after শেষ", () => {
  assert.equal(firstToPlay({}), "hat");
  assert.equal(firstToPlay({ 1: 3 }), "dat");
  assert.equal(firstToPlay({ 1: 3, 2: 3, 3: 1 }), "hat");
  assert.equal(nextMode("hat", { 1: 3 }), "dat");
  assert.equal(nextMode("dat", { 1: 3, 2: 3 }), "kokhon");
  assert.equal(nextMode("kokhon", { 1: 3, 2: 3, 3: 3 }), "kokhon", "all done: the same one stays ready");
  assert.equal(nextMode("kokhon", { 2: 3 }), "hat");
});

test("confetti only when a finish closes the whole set for the first time", () => {
  assert.equal(completesSet({ 1: 3, 2: 3 }, 3), true);
  assert.equal(completesSet({ 1: 3 }, 3), false);
  assert.equal(completesSet({ 1: 3, 2: 3, 3: 1 }, 3), false, "a replay is not the first time");
  assert.equal(completesSet({}, 1), false);
});

test("the quiz is the same for the same seed", () => {
  const run = (seed: number) => { let round = createQuizRound(seed); const out: string[] = []; for (;;) { out.push(round.choices.map(c => c.id).join("")); round = tapMoment(round, currentQuestion(round).right.id); if (isLastQuestion(round)) return out.join("|"); round = nextQuestion(round); } };
  assert.equal(run(4), run(4));
  assert.notEqual(run(4), run(5));
});

test("guesser: every quiz finishes on every seed in at most four taps a question, and 3 stars come on under 10% of seeds", () => {
  const results = SEEDS.map(seed => play(seed, 0));
  assert.ok(results.every(result => result.worst <= 4), `worst ${Math.max(...results.map(r => r.worst))}`);
  assert.ok(results.every(result => result.stars >= 1));
  const three = results.filter(result => result.stars === 3).length / SEEDS.length;
  assert.ok(three < 0.1, `guesser 3 stars ${three}`);
});

test("a five-year-old who knows it 70% of the time gets 2 or more stars on 80% of seeds, and 3 stars on 40–85%", () => {
  const twoUp = rate(seed => play(seed, 0.7).stars >= 2), three = rate(seed => play(seed, 0.7).stars === 3);
  assert.ok(twoUp >= 0.8, `2+ stars ${twoUp}`);
  assert.ok(three >= 0.4 && three <= 0.85, `3 stars ${three}`);
});

test("a learner who knows it 90% of the time gets 3 stars on 90% of seeds", () => {
  const three = rate(seed => play(seed, 0.9).stars === 3);
  assert.ok(three >= 0.9, `learner 3 stars ${three}`);
});

test("the quiet sweet spot: three misses in a row take a picture away, five right in a row add one; never fewer than 2 or more than 4", () => {
  let round = createQuizRound(9);
  for (let n = 0; n < 3; n++) {
    const q = currentQuestion(round);
    round = tapMoment(round, round.choices.find(c => c.id !== q.right.id)!.id);
    round = tapMoment(round, q.right.id);
    round = nextQuestion(round);
  }
  assert.equal(round.choices.length, 2, "after three misses");
  let strong = createQuizRound(9);
  const sizes: number[] = [];
  for (;;) { sizes.push(strong.choices.length); strong = tapMoment(strong, currentQuestion(strong).right.id); if (isLastQuestion(strong)) break; strong = nextQuestion(strong); }
  assert.deepEqual(sizes, [3, 3, 3, 3, 3, 3].map((n, i) => i < 5 ? n : 4), "five right in a row make the sixth four pictures");
  assert.ok(sizes.every(size => size >= 2 && size <= 4));
  assert.equal(QUESTIONS.length, 6);
});

test("a wrong tap is only a hint: repeats and taps after the answer change nothing, and the right one glows after two misses", () => {
  let round = createQuizRound(3);
  const q = currentQuestion(round), wrongs = round.choices.filter(c => c.id !== q.right.id);
  const first = tapMoment(round, wrongs[0].id);
  assert.equal(first.wrong.length, 1);
  assert.equal(tapMoment(first, wrongs[0].id), first, "the same wrong picture again changes nothing");
  assert.equal(hintOn(first), false);
  const second = tapMoment(first, wrongs[1].id);
  assert.ok(hintOn(second));
  const solved = tapMoment(second, q.right.id);
  assert.ok(solved.solved);
  assert.equal(solved.firstTry, 0, "not first-try after misses");
  assert.equal(tapMoment(solved, wrongs[0].id), solved, "nothing after the answer");
  assert.equal(tapMoment(round, "nope"), round, "a picture that isn't there");
  assert.equal(nextQuestion(round), round, "no next before it is solved");
});
