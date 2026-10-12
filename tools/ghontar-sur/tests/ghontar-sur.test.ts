import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { beat, firstRound, levelOf, levelsCleared, listen, makeTune, newGame, starsForMistakes, tap, yourTurn, LEVEL_COUNT, MAX_LEN, MAX_MISTAKES, MIN_BEAT, POTS, STAGE, type Game, type Outcome } from "../lib/game";
import { bannerNote, caption, cardLine, clearLine, compareLine, dhakaDate, feat, isDailySeed, levelLabel, nearMiss, parseShared, previewTitle, sharedHash } from "../lib/link";

/** Taps the whole round back correctly; returns the last outcome. */
function playRound(game: Game) {
  let current = yourTurn(game.phase === "listen" ? game : listen(game)), outcome: Outcome = { kind: "ignored" };
  const notes = current.round;
  for (let index = 0; index < notes; index++) ({ game: current, outcome } = tap(current, current.tune[index]));
  return { game: current, outcome };
}
const wrongPot = (game: Game) => (game.tune[game.at] + 1) % POTS;

test("the same seed gives the same tune, and a longer tune only adds notes", () => {
  assert.deepEqual(makeTune(42), makeTune(42));
  assert.notDeepEqual(makeTune(42), makeTune(43));
  assert.deepEqual(makeTune(7, 20), makeTune(7).slice(0, 20));
  assert.equal(makeTune(1).length, MAX_LEN);
});

test("tunes use all four pots, never one pot three times running, and spread fairly", () => {
  const counts = [0, 0, 0, 0];
  for (let seed = 1; seed <= 300; seed++) {
    const tune = makeTune(seed);
    for (let index = 0; index < tune.length; index++) {
      assert.ok(tune[index] >= 0 && tune[index] < POTS);
      counts[tune[index]]++;
      if (index >= 2) assert.ok(!(tune[index] === tune[index - 1] && tune[index] === tune[index - 2]), `seed ${seed} at ${index}`);
    }
  }
  const total = counts.reduce((a, b) => a + b);
  for (const count of counts) assert.ok(Math.abs(count / total - 0.25) < 0.02, String(counts));
});

test("the beat speeds up each level, never past 2.5 flashes a second, and slow mode stretches it", () => {
  for (let length = 1; length <= MAX_LEN; length++) {
    const { on, off } = beat(length), slow = beat(length, true);
    assert.ok(on + off >= MIN_BEAT && MIN_BEAT >= 1000 / 3, `length ${length}`);
    assert.ok(off >= 160, "a dark gap between two flashes of the same pot");
    assert.ok(slow.on + slow.off > on + off && slow.off > off);
    if (length > 1) assert.ok(on + off <= beat(length - 1).on + beat(length - 1).off);
  }
  assert.ok(beat(1).on + beat(1).off > beat(6).on + beat(6).off);
  assert.deepEqual([levelOf(1), levelOf(5), levelOf(6), levelOf(50), levelOf(51)], [1, 1, 2, 10, 11]);
  assert.deepEqual([firstRound(1), firstRound(3)], [1, 11]);
});

test("a right tap moves on, a full round grows the tune, every fifth note clears a level", () => {
  let game = newGame(99);
  assert.equal(game.phase, "ready");
  assert.equal(tap(game, 0).outcome.kind, "ignored", "no taps before the tune plays");
  game = listen(game);
  assert.equal(tap(game, game.tune[0]).outcome.kind, "ignored", "no taps while the tune plays");
  let result = playRound(game);
  assert.equal(result.outcome.kind, "round");
  assert.equal(result.game.round, 2);
  assert.equal(result.game.score, 1);
  assert.equal(result.game.phase, "listen");
  for (let round = 2; round <= 4; round++) result = playRound(result.game);
  result = playRound(result.game);
  assert.deepEqual(result.outcome, { kind: "level", level: 1, stars: 3 });
  assert.equal(result.game.score, 5);
  assert.equal(levelsCleared(result.game.score), 1);
  assert.equal(tap(yourTurn(result.game), 9).outcome.kind, "ignored", "a pot that doesn't exist");
});

test("mistakes replay the round, cost stars, and the third ends the run", () => {
  let game = yourTurn(listen(newGame(5)));
  let step = tap(game, wrongPot(game));
  assert.deepEqual(step.outcome, { kind: "miss", expected: game.tune[0] });
  assert.equal(step.game.phase, "listen");
  assert.equal(step.game.round, 1, "same round again");
  game = step.game;
  for (let round = 1; round <= 5; round++) ({ game } = playRound(game));
  assert.equal(game.score, 5);
  // The level-1 outcome above came with one mistake: 2 stars.
  assert.equal(starsForMistakes(1), 2);
  assert.deepEqual([starsForMistakes(0), starsForMistakes(1), starsForMistakes(2)], [3, 2, 1]);
  game = yourTurn(game);
  ({ game } = tap(game, game.tune[0]));
  step = tap(game, wrongPot(game));
  assert.equal(step.outcome.kind, "miss");
  assert.equal(step.game.at, 0, "a miss starts the round over");
  game = yourTurn(step.game);
  step = tap(game, wrongPot(game));
  assert.equal(step.outcome.kind, "over");
  assert.equal(step.game.mistakes, MAX_MISTAKES);
  assert.equal(step.game.score, 5, "the score is the longest round repeated");
  assert.equal(tap(step.game, 0).outcome.kind, "ignored");
  assert.equal(listen(step.game).phase, "over");
});

test("starting from a later level begins at its first round; repeating all 99 notes is a win", () => {
  const later = newGame(3, 4);
  assert.equal(later.round, 16);
  assert.equal(later.from, 4);
  assert.equal(newGame(3, 99).round, firstRound(LEVEL_COUNT));
  assert.equal(newGame(3, -2).round, 1);
  let game: Game = { ...newGame(3), round: MAX_LEN, phase: "listen" };
  const result = playRound(game);
  assert.equal(result.outcome.kind, "done");
  assert.equal(result.game.phase, "over");
  assert.equal(result.game.score, MAX_LEN);
  game = { ...newGame(3), round: 50, phase: "listen" };
  assert.deepEqual(playRound(game).outcome, { kind: "level", level: 10, stars: 3 });
  game = { ...newGame(3), round: 55, phase: "listen" };
  assert.equal(playRound(game).outcome.kind, "round", "past level 10 the tune keeps growing without new levels");
});

test("a simulated player with a limited memory ends with a plausible score", () => {
  for (const memory of [3, 9, 17, 40]) {
    const rng = makeRng(memory);
    let game = listen(newGame(1000 + memory)), cleared = 0, rounds = 0;
    while (game.phase !== "over" && rounds++ < 500) {
      game = yourTurn(game);
      while (game.phase === "play") {
        // Remembers up to `memory` notes; past that, guesses one pot in three right.
        const knows = game.at < memory || pick(rng, 3) === 0;
        const result = tap(game, knows ? game.tune[game.at] : wrongPot(game));
        if (result.outcome.kind === "level") cleared++;
        game = result.game;
      }
    }
    assert.equal(game.phase, "over");
    assert.ok(game.score >= memory && game.score <= memory + 12, `memory ${memory} scored ${game.score}`);
    assert.equal(cleared, levelsCleared(game.score));
  }
});

test("levels: progress goes through readLevels and recordLevel, the best stars stay", () => {
  let stars = readLevels(null, LEVEL_COUNT);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 1);
  stars = recordLevel(stars, 1, starsForMistakes(2));
  stars = recordLevel(stars, 1, starsForMistakes(0));
  stars = recordLevel(stars, 1, starsForMistakes(1));
  assert.equal(stars[1], 3);
  const saved = readLevels(JSON.stringify({ ...stars, 2: 2, 11: 3, x: 1, 3: 9 }), LEVEL_COUNT);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
  // Every level is reachable: level n ends exactly at n×5 notes, inside the 99-note tune.
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(level * STAGE <= MAX_LEN && levelOf(level * STAGE) === level);
});

test("the daily tune is Dhaka's date", () => {
  assert.equal(dhakaDate(Date.UTC(2026, 9, 12, 17, 59)), 20261012);
  assert.equal(dhakaDate(Date.UTC(2026, 9, 12, 18, 0)), 20261013, "midnight in Dhaka is 18:00 UTC");
  assert.ok(isDailySeed(20261012));
  for (const seed of [20260230, 20261301, 123456789, 20251231, 0]) assert.equal(isDailySeed(seed), false, String(seed));
});

test("lines are kind, concrete and fit the score", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.ok(clearLine(level).startsWith(`${["", "৫", "১০", "১৫", "২০", "২৫", "৩০", "৩৫", "৪০", "৪৫", "৫০"][level]}টা সুর।`));
    assert.match(levelLabel(level), /^লেভেল /);
  }
  for (const score of [0, 1, 4, 5, 9, 14, 49, 50, 98, 99]) assert.ok(cardLine(score).length > 10 && !/অসাধারণ|দারুণ|!!/.test(cardLine(score)), String(score));
  assert.equal(nearMiss(8, null), "আর ২টা সুর হলেই লেভেল ২ পার।");
  assert.equal(nearMiss(9, 12), "আর ১টা সুর হলেই লেভেল ২ পার।");
  assert.equal(nearMiss(12, 14), "তোমার সেরা ১৪। আর ২টা হলেই সেরাটা ছুঁতে।");
  assert.equal(nearMiss(6, 20), "");
  assert.equal(nearMiss(99, null), "");
  assert.equal(compareLine(17, 14, "রাফি"), "রাফির চেয়ে ৩টা সুর বেশি!");
  assert.equal(compareLine(14, 14, "রাফি"), "একদম সমান! রাফিও ১৪টা পেরেছিল।");
  assert.equal(compareLine(12, 14, "রাফি"), "আর একটু হলেই! মাত্র ২টা সুর কম।");
  assert.match(compareLine(5, 14, ""), /বন্ধু এখনো ৯টা সুর এগিয়ে/);
  assert.match(caption({ seed: 20261012, score: 14 }), /^১২ অক্টোবরের রোজের সুরে ১৪টা সুর/);
  assert.match(caption({ seed: 777, score: 3 }), /^ঘণ্টার সুরে ৩টা সুর/);
  assert.match(bannerNote({ seed: 777, name: "রাফি" }), /রাফির নিজের ফোনের স্কোর/);
});

test("a challenge link round-trips and carries only seed, score and name", () => {
  const hash = sharedHash({ seed: 123456, score: 14, name: "রাফি" });
  assert.equal(hash, `s=123456&t=14&n=${encodeURIComponent("রাফি")}`);
  const parsed = parseShared(`#${hash}`);
  assert.deepEqual(parsed, { seed: 123456, score: 14, name: "রাফি" });
  assert.equal(previewTitle(parsed!), "রাফি ১৪টা সুর মনে রেখে বাজিয়েছে। তুমি পারবে?");
  assert.equal(feat({ score: 3, name: "" }), "এক বন্ধু ৩টা সুর মনে রেখে বাজিয়েছে");
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.normalize(`s=123456&t=14&x=1&n=${encodeURIComponent("রাফি")}`), hash, "unknown keys are dropped");
  assert.match(share.preview(hash).title, /রাফি ১৪টা/);
  const desc = share.preview(hash).description;
  assert.ok(desc.length > 40);
});

test("forged, broken or hostile links are refused or cleaned", () => {
  for (const bad of ["", "#", "garbage", "s=0&t=3", "s=-1&t=3", "s=1.5&t=3", "s=1&t=-1", `s=1&t=${MAX_LEN + 1}`, "s=1000000000&t=3", "s=1&t=2.5", "t=3", `#${"a".repeat(700)}`, "<script>alert(1)</script>"]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null, bad);
  }
  const hostile = parseShared(`s=9&t=4&n=${encodeURIComponent("‮রাফি\u0000" + "ক".repeat(40))}`)!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^সুরের মেমোরি গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /জোড়া মেলাও/.test(item.answer)));
  assert.match(site.privacy.join(" "), /নাম/);
  assert.match(site.privacy.join(" "), /স্কোর/);
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|Simon|সাইমন|অসাধারণ|দারুণ/);
});
