// The shelves, the score, the links (old and new) and the words. The rewrite's statechart replays, saved progress and
// bot-tuned rates are in rewrite.test.ts.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { ITEMS, ITEM_IDS, familyOf, itemName } from "../lib/items";
import { LEVELS, LEVEL_COUNT, PER_WORLD, WORLDS, changeKinds, changes, finaleName, isFinale, levelAt, worldOf } from "../lib/levels";
import { legacyLevel, LEVELS as OLD_LEVELS } from "../lib/legacy";
import { ROUNDS, answerOf, makeDeal, specOf } from "../lib/shelf";
import { MAX_SCORE, THREE_STAR, bonusLeft, fastMs, isDecided, isRight, nextStar, possibleScore, resultOf, rightFromScore, roundScore, starsOf, type Answer } from "../lib/score";
import { askLine, caption, compareLine, feat, friendClaim, humanLine, nearLine, parseShared, previewTitle, revealLine, sharedHash } from "../lib/link";

const SEEDS = Array.from({ length: 150 }, (_, i) => 1 + ((i * 2654435761) >>> 0) % 999_999_999);

test("the catalogue: 20 distinct things with Bangla names, each in one look-alike family", () => {
  assert.equal(ITEMS.length, 20);
  assert.equal(new Set(ITEM_IDS).size, 20);
  assert.equal(new Set(ITEMS.map(item => item.name)).size, 20);
  for (const id of ITEM_IDS) { assert.ok(itemName(id)); assert.ok(familyOf(id)); }
  for (const family of ["white", "brown", "red", "yellow"]) assert.ok(ITEM_IDS.filter(id => familyOf(id) === family).length >= 4, family);
});

test("old links replay byte for byte the shelves from before the rewrite", () => {
  // Pinned from the pre-rewrite lib/game.ts makeLevel, 7 seeds on every level.
  const hash = createHash("sha256");
  for (let level = 1; level <= 30; level++) for (const seed of [1, 7, 303, 4242, 99991, 123456789, 999999999]) hash.update(JSON.stringify(legacyLevel(level, seed)));
  assert.equal(hash.digest("hex").slice(0, 16), "78558c8e1cb6d9f5");
  assert.equal(OLD_LEVELS.length, 30);
  // and in the new shape, an old link's level still reads as one thing gone with the old numbers
  const deal = makeDeal(15, 4242, 1);
  assert.deepEqual(deal.spec, { ...OLD_LEVELS[14], alike: false, plain: false, two: false });
  assert.deepEqual(deal.rounds.map(r => r.gone[0]), legacyLevel(15, 4242).map(r => r.missing));
});

test("the ladder: 3 shops × 10, things grow 4 → 10, one new thing a level, a named finale where two go", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.equal(LEVELS[0].count, 4);
  assert.equal(Math.max(...LEVELS.map(level => level.count)), 10);
  assert.deepEqual([1, 10, 11, 20, 21, 30].map(level => levelAt(level).twist), ["gap", "gap", "move", "move", "swap", "swap"]);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = levelAt(level), where = `level ${level}`;
    assert.ok(spec.lesson.length > 8 && spec.lesson.length <= 90, where);
    assert.equal(spec.two, isFinale(level), `${where}: only finales take two`);
    const gone = spec.two ? 2 : 1;
    assert.ok(spec.choices - gone - spec.unseen >= 1, `${where}: at least one wrong picture on the shelf`);
    assert.ok(spec.count - gone >= spec.choices - gone - spec.unseen, `${where}: enough things left for the wrong pictures`);
    assert.ok(spec.count + spec.unseen + (spec.twist === "swap" ? gone : 0) + (spec.alike ? 1 : 0) <= ITEM_IDS.length, where);
    if (level === 1 || (level - 1) % PER_WORLD === 0) continue;
    const kinds = changeKinds(level);
    if (isFinale(level)) assert.ok(kinds.includes("two") && kinds.length <= 3, `${where}: the finale adds two-gone (and room for it) ${kinds}`);
    else assert.equal(kinds.length, 1, `${where}: exactly one new thing, got ${kinds}`);
    assert.ok(changes(level).length >= 1, `${where}: the start card names the change`);
  }
  assert.deepEqual(WORLDS.map(w => w.finale), ["ঈদের আগের রাত", "মাসের প্রথম বাজার", "হাটবার"]);
  assert.deepEqual([9, 10, 20, 30].map(finaleName), ["", "ঈদের আগের রাত", "মাসের প্রথম বাজার", "হাটবার"]);
  assert.deepEqual(changes(2), ["বাইরের ছবি ০ → ১"]);
  assert.deepEqual(changes(3), ["জিনিস ৪ → ৫"]);
  assert.deepEqual(changes(5), ["সময় ৫ → ৪ সে."]);
  assert.deepEqual(changes(10).slice(0, 1), ["নেই ১ → ২"]);
  assert.deepEqual(changes(11), ["নতুন দোকান"]);
});

test("every new level is fair over many seeds: exactly the gone things were on the shelf and are gone now", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = levelAt(level), howMany = spec.two ? 2 : 1;
    for (const seed of SEEDS) {
      const { rounds } = makeDeal(level, seed), where = `level ${level} seed ${seed}`;
      assert.equal(rounds.length, ROUNDS);
      assert.equal(new Set(rounds.flatMap(r => r.gone)).size, ROUNDS * howMany, `${where}: something went twice`);
      for (const round of rounds) {
        assert.equal(round.shelf.length, spec.count, where);
        assert.equal(new Set(round.shelf).size, spec.count, where);
        assert.equal(round.gone.length, howMany, where);
        assert.deepEqual(round.slots.map(slot => round.shelf[slot]), round.gone, where);
        const now = new Set(round.after.filter(Boolean));
        for (const id of round.gone) assert.ok(!now.has(id), where);
        for (const id of round.shelf) if (!round.gone.includes(id)) assert.ok(now.has(id), `${where}: ${id} vanished too`);
        // `from` points every remaining thing back to its old place, so the reveal can slide it home
        round.after.forEach((id, index) => { if (id && round.from[index] >= 0) assert.equal(round.shelf[round.from[index]], id, where); });
        if (spec.twist === "gap") { assert.equal(round.after.length, spec.count); for (const slot of round.slots) assert.equal(round.after[slot], null); }
        if (spec.twist === "move") {
          assert.equal(round.after.length, spec.count - howMany, where);
          assert.ok(round.from.some((from, index) => from !== round.from.filter(f => f >= 0).sort((a, b) => a - b)[index]), `${where}: nothing moved`);
        }
        if (spec.twist === "swap") {
          assert.equal(round.newcomers.length, howMany, where);
          for (const id of round.newcomers) { assert.ok(!round.shelf.includes(id), where); assert.ok(round.choices.includes(id), `${where}: the newcomer is offered as a lure`); }
        }
        assert.equal(round.choices.length, spec.choices, where);
        assert.equal(new Set(round.choices).size, spec.choices, where);
        assert.deepEqual(round.choices.filter(id => round.shelf.includes(id) && !now.has(id)).sort(), [...round.gone].sort(), `${where}: not exactly the answer`);
        assert.equal(round.choices.filter(id => !round.shelf.includes(id) && !round.newcomers.includes(id)).length, spec.unseen, where);
        assert.deepEqual(answerOf(round).sort(), [...round.gone].sort());
        if (spec.alike) assert.ok(round.gone.some(gone => round.choices.some(id => !round.gone.includes(id) && familyOf(id) === familyOf(gone))), `${where}: no look-alike among the pictures`);
      }
    }
  }
});

test("the same level, seed and version give the same shelves; anything else changes them", () => {
  assert.deepEqual(makeDeal(12, 4242), makeDeal(12, 4242));
  assert.notDeepEqual(makeDeal(12, 4242).rounds, makeDeal(12, 4243).rounds);
  assert.notDeepEqual(makeDeal(12, 4242).rounds, makeDeal(13, 4242).rounds);
  assert.notDeepEqual(makeDeal(12, 4242, 2).rounds, makeDeal(12, 4242, 1).rounds);
  assert.equal(specOf(10, 2).two, true);
  assert.equal(specOf(10, 1).two, false);
});

test("scores: 100 a right shelf plus up to 50 for speed, the same formula as before", () => {
  const one = specOf(1, 2);
  assert.equal(fastMs(one), 2000 + 500 * 3);
  assert.equal(fastMs(specOf(1, 1)), 3500, "an old link's level 1 times answers as it always did");
  assert.equal(roundScore(3500, true, 0), 150);
  assert.equal(roundScore(3500, true, 3500), 125);
  assert.equal(roundScore(3500, true, 7000), 100);
  assert.equal(roundScore(3500, false, 100), 0);
  assert.equal(bonusLeft(3500, 0), 50);
  assert.equal(bonusLeft(3500, 9000), 0);
  assert.ok(fastMs(specOf(30, 2)) > fastMs(specOf(29, 2)), "a second pick gets more time");
});

test("a finale shelf needs both gone things; a wrong pick decides it at once", () => {
  const round = makeDeal(10, 77).rounds[0], [a, b] = round.gone, wrong = round.choices.find(id => !round.gone.includes(id))!;
  assert.equal(isDecided(round, [a]), false, "one found, one to go");
  assert.equal(isDecided(round, [a, b]), true);
  assert.equal(isDecided(round, [wrong]), true);
  assert.equal(isRight(round, { picks: [b, a], ms: 2000 }), true, "either order");
  assert.equal(isRight(round, { picks: [a, wrong], ms: 2000 }), false);
});

test("stars: 2 of 3 right clears, 3 right is 2 stars, 3 right and quick is 3", () => {
  assert.equal(THREE_STAR, 375);
  assert.deepEqual([starsOf(0, 0), starsOf(1, 150), starsOf(2, 300), starsOf(3, 374), starsOf(3, 375)], [0, 0, 1, 2, 3]);
  assert.deepEqual(nextStar(3, 360), { points: 15 });
  assert.deepEqual(nextStar(2, 250), { right: 1 });
  assert.equal(nextStar(3, 400), null);
  assert.equal(nearLine(3, 360), "আর ১৫ পয়েন্ট পেলে ৩ তারা। উত্তরটা একটু আগে দাও।");
  assert.equal(nearLine(1, 120), "আর ১টা ঠিক হলেই লেভেল পার।");
  assert.equal(nearLine(3, 420), "");
});

test("a result adds up the shelves; a link's score tells how many were right", () => {
  const deal = makeDeal(5, 77), r = deal.rounds, fast = fastMs(deal.spec);
  const answers: Answer[] = [{ picks: [r[0].gone[0]], ms: 1000 }, { picks: [r[1].choices.find(id => !r[1].gone.includes(id))!], ms: 2000 }, { picks: [r[2].gone[0]], ms: 9000 }];
  const result = resultOf(deal.spec, r, answers);
  assert.equal(result.right, 2);
  assert.equal(result.ms, 12_000);
  assert.equal(result.fastest, 1000);
  assert.equal(result.score, roundScore(fast, true, 1000) + roundScore(fast, true, 9000));
  assert.deepEqual(result.points, [roundScore(fast, true, 1000), 0, roundScore(fast, true, 9000)]);
  for (const score of [0, 100, 150, 200, 300, 375, 450]) assert.ok(possibleScore(score), String(score));
  for (const score of [1, 99, 151, 199, 451, -100, 12.5]) assert.ok(!possibleScore(score), String(score));
  assert.deepEqual([0, 130, 260, 300, 450].map(rightFromScore), [0, 1, 2, 3, 3]);
  assert.equal(MAX_SCORE, 450);
});

test("links: old ones parse as v1, new ones carry v=2, hostile and impossible input refused", () => {
  // every link shared before the rewrite still opens, on the old generator
  const old = "s=12345&t=410&l=7&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  assert.deepEqual(parseShared(`#${old}`), { seed: 12345, level: 7, score: 410, name: "রাফি", v: 1 });
  assert.equal(sharedHash({ seed: 12345, level: 7, score: 410, name: "  রাফি‮ ", v: 1 }), old, "an old link round-trips unchanged");
  const fresh = sharedHash({ seed: 12345, level: 7, score: 410, name: "রাফি", v: 2 });
  assert.equal(fresh, "s=12345&t=410&l=7&v=2&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(`#${fresh}`), { seed: 12345, level: 7, score: 410, name: "রাফি", v: 2 });
  for (const bad of ["", "#s=0&t=10&l=1", "#s=1&t=10&l=0", "#s=1&t=120&l=31", "#s=1&t=170&l=3", "#s=1&t=451&l=3", "#s=1&t=200&l=3.5", "#s=1&t=200&l=03",
    "#s=abc&t=200&l=3", "#s=1&t=-5&l=3", "#s=1&t=200&l=3&v=3", "#s=1&t=200&l=3&v=", `#s=1&t=200&l=3&n=${"x".repeat(700)}`]) assert.equal(parseShared(bad), null, bad);
  assert.equal(parseShared(`#s=5&t=300&l=2&n=${"ক".repeat(40)}`)?.name.length, 20);
});

test("share.ts normalises old and new links, rejects junk and writes a personal preview", () => {
  assert.equal(share.normalize("s=9&t=300&l=4&n=মিতু&x=evil"), "s=9&t=300&l=4&n=%E0%A6%AE%E0%A6%BF%E0%A6%A4%E0%A7%81");
  assert.equal(share.normalize("s=9&t=300&l=4&v=2"), "s=9&t=300&l=4&v=2");
  assert.equal(share.normalize("s=9&t=999&l=4"), null);
  assert.equal(share.normalize("<script>"), null);
  assert.equal(share.preview("s=9&t=300&l=4&n=মিতু").title, "মিতু লেভেল ৪-এ ৩০০ পেয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ seed: 1, level: 2, score: 0, name: "", v: 2 }), "এক বন্ধু লেভেল ২-এ ০ পেয়েছে। তুমি পারবে?");
  assert.ok(share.preview("nonsense").title.length > 10);
  assert.equal(share.tally, undefined);
});

test("words: kind comparisons, concrete misses, the reveal says why, a caption with one fact and a question", () => {
  assert.equal(compareLine(400, 380, "রাফি"), "রাফির চেয়ে ২০ বেশি!");
  assert.equal(compareLine(360, 380, ""), "আর একটু হলেই! মাত্র ২০ কম।");
  assert.equal(humanLine(2, 260, ["chini"]), "তিনটার দুটো ধরেছ। শুধু চিনি চোখ এড়িয়ে গেছে।");
  assert.match(humanLine(1, 120, ["dim", "ata"]), /ডিম আর আটা/);
  assert.equal(feat({ level: 7, score: 410, name: "রাফি" }), "রাফি লেভেল ৭-এ ৪১০ পেয়েছে");
  assert.match(friendClaim({ name: "রাফি" }), /রাফির নিজের ফোনের/);
  assert.equal(caption(7, 3, 410), "‘কোনটা নেই?’ খেলার লেভেল ৭-এ ৩টায় ৩টা ধরলাম, স্কোর ৪১০। তুমি কয়টা ধরতে পারবে?");
  const round = makeDeal(1, 5).rounds[0], gone = round.gone[0], still = round.choices.find(id => id !== gone)!;
  assert.equal(revealLine(round, [gone], 3), `ঠিক! মামা ${itemName(gone)} সরিয়েছিল। টানা ৩টা।`);
  assert.equal(revealLine(round, [still], 0), `উঁহু, মামা ${itemName(gone)} সরিয়েছিল। ${itemName(still)} তো তাকেই আছে।`);
  assert.equal(askLine("কোনটা নেই?", true, 1), "একটা পেয়েছ। আরেকটা কোনটা নেই?");
  const texts = [humanLine(3, 400), humanLine(3, 330), humanLine(2, 250), humanLine(0, 0), ...LEVELS.map(l => l.lesson), ...WORLDS.flatMap(w => [w.rule, w.ask])];
  for (const line of texts) { assert.ok(!/অসাধারণ|দারুণ|সেরা|আপনি|করুন/.test(line), line); assert.equal(line, line.normalize("NFC"), line); }
  assert.equal(worldOf(30), 2);
});

test("content: SEO limits, at least 6 FAQs, the levels told right, no trademarks", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.equal(site.title, "ব্রেন গেম: মুদি দোকানের তাকে কোনটা নেই?");
  assert.equal(site.headline, "মুদি দোকানের তাক: মামা কোনটা সরাল?");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /৪ থেকে ১০টা/.test(item.answer) && /দুটো/.test(item.answer)));
  assert.ok(site.faq.some(item => /জোড়া মেলাও/.test(item.answer)), "names a related game");
  assert.ok(site.privacy.some(line => /লেভেল/.test(line) && /স্কোর/.test(line) && /নাম/.test(line)), "says what a link carries");
  const text = JSON.stringify(site);
  assert.ok(!/আপনি|করুন|দেখুন|অসাধারণ|সহজেই/.test(text));
  assert.equal(text, text.normalize("NFC"));
});
