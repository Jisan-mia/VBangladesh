import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import {
  humanLine, levelAt, liftPot, makePots, newRound, parseShare, potScore, potWord, previewTitle, shareHash, startPot, stepRound, totalOf, versusLine,
  HOLD_MS, POTS, RESULT_SECONDS, type Round,
} from "../lib/dudh";
import { share } from "../share";

const DT = 1 / 60;

/** Plays a whole round headlessly: the bot lifts each pot once the foam reaches `liftAt` (never, if above 1). */
function play(seed: number, liftAt: number, slow = false) {
  const round = newRound(seed);
  let steps = 0;
  while (round.phase !== "over" && steps < 60 * 120) {
    if (round.phase === "waiting") startPot(round);
    stepRound(round, DT, slow);
    if (round.phase === "rising" && round.level >= liftAt) liftPot(round);
    steps++;
  }
  return { round, seconds: steps * DT };
}

test("the same seed gives the same five pots, a different seed different ones", () => {
  assert.deepEqual(makePots(4242), makePots(4242));
  assert.notDeepEqual(makePots(4242), makePots(4243));
  assert.equal(makePots(1).length, POTS);
  assert.deepEqual(play(77, 0.93).round.scores, play(77, 0.93).round.scores);
});

test("pots get harder in order, and the first is a calm ডেকচি on gas", () => {
  for (let seed = 1; seed < 400; seed++) {
    const pots = makePots(seed);
    assert.equal(pots[0].vessel, "dekchi");
    assert.equal(pots[0].stove, "gas");
    assert.ok(pots[4].seconds < pots[0].seconds && pots[4].power > pots[0].power && pots[4].wobble > pots[0].wobble);
    for (const pot of pots) assert.equal(pot.stove === "clay", pot.vessel === "hari");
  }
});

test("never an impossible pot: there is always time to lift between 90% and the spill", () => {
  for (let seed = 1; seed < 1500; seed++) {
    makePots(seed).forEach(pot => {
      for (const slow of [false, true]) {
        let t = 0, ninety = -1;
        for (; t < 30; t += 1 / 240) {
          const level = levelAt(pot, t, slow);
          if (ninety < 0 && level >= 0.9) ninety = t;
          if (level >= 1) break;
        }
        assert.ok(t < 30, "every pot boils over eventually");
        // On the pot's own clock; slow mode stretches real time by 1 / SLOW on top of this.
        assert.ok(t - ninety >= 0.15, `seed ${seed}: window ${(t - ninety).toFixed(3)}s`);
      }
    });
  }
});

test("scores: percent of the rim, floored, 99 at most; a spill is zero", () => {
  assert.equal(potScore(0), 0);
  assert.equal(potScore(0.93), 93);
  assert.equal(potScore(0.999), 99);
  assert.equal(potScore(1.4), 99);
  assert.equal(potScore(-0.2), 0);
  assert.equal(totalOf([90, 95, 0, 99, 88]), 74);
  assert.equal(totalOf([99, 99, 99, 99, 99]), 99);
  assert.equal(potWord(0, true), "উথলে গেল!");
  assert.equal(potWord(98, false), "একদম কিনারায়!");
  assert.equal(potWord(91, false), "প্রায় কিনারায়!");
  assert.equal(potWord(12, false), "দুধ তো ফুটলই না!");
});

test("score bands pick a kind human line", () => {
  assert.match(humanLine([97, 96, 95, 98, 94], [false, false, false, false, false]), /ফোঁটাও পড়েনি/);
  assert.match(humanLine([88, 86, 85, 90, 84], [false, false, false, false, false]), /একটা পাতিলও উথলায়নি/);
  assert.match(humanLine([50, 60, 55, 40, 70], [false, false, false, false, false]), /সাহস/);
  assert.match(humanLine([90, 0, 95, 92, 91], [false, true, false, false, false]), /একটা উথলেছে/);
  assert.match(humanLine([0, 0, 95, 0, 91], [true, true, false, true, false]), /দুধটা দেখিস/);
  assert.match(humanLine([0, 0, 0, 0, 0], [true, true, true, true, true]), /গোসল/);
  assert.equal(versusLine(95, 91, "রাফি"), "রাফির চেয়ে ৪% বেশি! এবার লিংকটা ফেরত পাঠাও।");
  assert.match(versusLine(88, 91, "রাফি"), /^আর একটু হলেই! রাফির চেয়ে মাত্র ৩% কম।/);
  assert.match(versusLine(60, 91, ""), /^এবার বন্ধু এগিয়ে/);
  assert.match(versusLine(91, 91, "মিম"), /সমান/);
});

test("rules: start, lift, spill and the five-pot round", () => {
  const round: Round = newRound(9);
  assert.equal(liftPot(round), false, "can't lift a pot that isn't heating");
  assert.equal(startPot(round), true);
  assert.equal(startPot(round), false);
  for (let index = 0; index < 120; index++) stepRound(round, DT, false);
  assert.ok(round.level > 0 && round.level < 1);
  const expected = potScore(round.level);
  assert.equal(liftPot(round), true);
  assert.deepEqual(round.scores, [expected]);
  assert.equal(round.phase, "result");
  for (let index = 0; index < Math.ceil(RESULT_SECONDS / DT) + 1; index++) stepRound(round, DT, false);
  assert.equal(round.phase, "waiting");
  assert.equal(round.index, 1);
  // Left on the stove, the next pot boils over and scores zero.
  startPot(round);
  while (round.phase === "rising") stepRound(round, DT, false);
  assert.deepEqual(round.spills, [false, true]);
  assert.equal(round.scores[1], 0);
  assert.ok(HOLD_MS > 150 && HOLD_MS < 400, "a tap and a hold are told apart quickly");
});

test("a headless run ends sanely with a plausible score", () => {
  for (let seed = 1; seed < 200; seed++) {
    const careful = play(seed, 0.9);
    assert.equal(careful.round.phase, "over");
    assert.equal(careful.round.scores.length, POTS);
    assert.ok(careful.round.spills.every(spilled => !spilled), `seed ${seed}: lifting at 90% never spills`);
    const total = totalOf(careful.round.scores);
    assert.ok(total >= 90 && total <= 99, `seed ${seed}: ${total}`);
    assert.ok(careful.seconds > 20 && careful.seconds < 45, `a round takes about half a minute, not ${careful.seconds}`);
  }
  const greedy = play(3, 2);
  assert.ok(greedy.round.spills.every(Boolean));
  assert.equal(totalOf(greedy.round.scores), 0);
  const slow = play(3, 0.9, true);
  assert.ok(slow.seconds > play(3, 0.9).seconds, "slow mode really is slower");
});

test("the link round-trips, and the total is always recomputed", () => {
  const result = { seed: 123456, scores: [94, 88, 0, 97, 91], spills: [false, false, true, false, false], name: "রাফি", slow: false };
  const hash = shareHash(result);
  assert.equal(hash, "s=123456&t=74&p=94.88.x.97.91&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShare(`#${hash}`), { ...result, total: 74, kitchen: 3 });
  assert.equal(share.normalize(hash), hash);
  assert.equal(parseShare(shareHash({ ...result, slow: true }))?.slow, true);
  assert.equal(previewTitle({ total: 91, name: "রাফি" }), "রাফি দুধ উথলানোর খেলায় ৯১% করেছে। তুমি পারবে?");
  assert.match(share.preview(hash).title, /^রাফি দুধ উথলানোর খেলায় ৭৪%/);
  assert.match(share.preview("junk").title, /দুধটা দেখিস/);
});

test("hostile, broken or inflated links are refused or capped", () => {
  for (const bad of ["", "#", "#result", "s=0&t=50&p=50.50.50.50.50", "s=5&t=50", "s=5&t=50&p=50.50.50.50", "s=5&t=50&p=50.50.50.50.50.50",
    "s=5&t=99&p=50.50.50.50.50", "s=5&t=100&p=99.99.99.99.99", "s=5&t=20&p=100.0.0.0.0", "s=5&t=10&p=-1.20.10.10.10", "s=5&t=50&p=5e1.50.50.50.50",
    "s=1.5&t=50&p=50.50.50.50.50", "s=1000000000&t=50&p=50.50.50.50.50", "s=5&t=50&p=50.50.50.50.50&n=" + "ক".repeat(700), "s=5&t=50&p=<script>.1.1.1.1"]) {
    assert.equal(parseShare(bad), null, bad);
    assert.equal(share.normalize(bad), null, bad);
  }
  // Names are cleaned and capped; out-of-range scores in our own hash builder are clamped.
  const named = parseShare(shareHash({ seed: 5, scores: [50, 50, 50, 50, 50], spills: [false, false, false, false, false], name: "  রিমা‮\n আক্তার " + "ক".repeat(40), slow: false }));
  assert.ok(named && [...named.name].length <= 20 && !named.name.includes("‮"));
  assert.equal(parseShare(shareHash({ seed: 5, scores: [500, -3, NaN, 50, 50], spills: [false, false, false, false, false], name: "", slow: false }))?.total, 40);
});

test("content meets the SEO limits", () => {
  assert.ok([...site.title].length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /নাম/);
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|বাজি|টাকা জিতো/);
});
