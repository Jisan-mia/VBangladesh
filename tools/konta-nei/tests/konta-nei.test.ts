import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  fastMs, levelOf, makeLevel, nextStar, possibleScore, resultOf, rightFromScore, roundScore, startLevel, starsOf,
  LEVEL_COUNT, MAX_SCORE, ROUNDS, THREE_STAR, type Answer, type Round,
} from "../lib/game";
import { ITEMS, ITEM_IDS, itemName } from "../lib/items";
import { LEVELS } from "../lib/levels";
import { caption, compareLine, feat, humanLine, nearLine, parseShared, previewTitle, sharedHash } from "../lib/link";

const SEEDS = Array.from({ length: 150 }, (_, i) => 1 + ((i * 2654435761) >>> 0) % 999_999_999);
const present = (round: Round) => new Set(round.after.filter(Boolean));

test("the catalogue: 20 distinct items with Bangla names, no brand words", () => {
  assert.equal(ITEMS.length, 20);
  assert.equal(new Set(ITEM_IDS).size, 20);
  assert.equal(new Set(ITEMS.map(item => item.name)).size, 20);
  for (const id of ["chal", "dal", "tel", "lobon", "cha", "biskut", "dim", "peyaj", "alu", "saban", "deshlai", "chini", "ata", "muri", "dudh"] as const) assert.ok(itemName(id));
});

test("30 levels: items grow 4 → 12, the shop changes every 10, and every level's numbers fit the catalogue", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.equal(LEVELS[0].count, 4);
  assert.equal(LEVELS[29].count, 12);
  assert.deepEqual([1, 10, 11, 20, 21, 30].map(level => levelOf(level).twist), ["gap", "gap", "move", "move", "swap", "swap"]);
  for (const [index, { count, view, choices, unseen, twist }] of LEVELS.entries()) {
    assert.ok(count >= 4 && count <= 12 && view >= 4 && view <= 8 && (choices === 3 || choices === 4 || choices === 6), `level ${index + 1}`);
    assert.ok(choices - 1 - unseen <= count - 1, `level ${index + 1}: enough items still on the shelf for the wrong choices`);
    assert.ok(count + unseen + (twist === "swap" ? 1 : 0) <= ITEM_IDS.length, `level ${index + 1}: enough never-seen items`);
  }
  // Within each shop the shelf never shrinks.
  for (let level = 2; level <= LEVEL_COUNT; level++) if ((level - 1) % 10) assert.ok(levelOf(level).count >= levelOf(level - 1).count, `level ${level}`);
});

test("every level is fair over many seeds: exactly one choice was on the shelf and is gone now", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { count, choices, unseen, twist } = levelOf(level);
    for (const seed of SEEDS) {
      const rounds = makeLevel(level, seed);
      assert.equal(rounds.length, ROUNDS);
      assert.equal(new Set(rounds.map(round => round.missing)).size, ROUNDS, `level ${level} seed ${seed}: the same item went twice`);
      for (const round of rounds) {
        const where = `level ${level} seed ${seed}`;
        assert.equal(round.shelf.length, count, where);
        assert.equal(new Set(round.shelf).size, count, where);
        assert.equal(round.shelf[round.slot], round.missing, where);
        const now = present(round);
        assert.ok(!now.has(round.missing), where);
        for (const id of round.shelf) if (id !== round.missing) assert.ok(now.has(id), `${where}: ${id} vanished too`);
        if (twist === "gap") { assert.equal(round.after.length, count); assert.equal(round.after[round.slot], null); assert.equal(round.newcomer, null); }
        if (twist === "move") {
          assert.equal(round.after.length, count - 1, where);
          assert.ok(!round.after.includes(null), where);
          assert.notDeepEqual(round.after, round.shelf.filter(id => id !== round.missing), `${where}: nothing moved`);
        }
        if (twist === "swap") {
          assert.ok(round.newcomer && !round.shelf.includes(round.newcomer), where);
          assert.equal(round.after[round.slot], round.newcomer, where);
          assert.ok(round.choices.includes(round.newcomer!), `${where}: the newcomer is offered as a lure`);
        }
        assert.equal(round.choices.length, choices, where);
        assert.equal(new Set(round.choices).size, choices, where);
        assert.deepEqual(round.choices.filter(id => round.shelf.includes(id) && !now.has(id)), [round.missing], `${where}: not exactly one answer`);
        assert.equal(round.choices.filter(id => !round.shelf.includes(id) && id !== round.newcomer).length, unseen, where);
      }
    }
  }
});

test("the same level and seed give the same shelves; another seed changes them", () => {
  assert.deepEqual(makeLevel(12, 4242), makeLevel(12, 4242));
  assert.notDeepEqual(makeLevel(12, 4242), makeLevel(12, 4243));
  assert.notDeepEqual(makeLevel(12, 4242), makeLevel(13, 4242));
});

test("scores: 100 a right answer plus up to 50 for speed; wrong is 0", () => {
  const fast = fastMs(1);
  assert.equal(fast, 3500);
  assert.equal(roundScore(1, true, 0), 150);
  assert.equal(roundScore(1, true, fast), 125);
  assert.equal(roundScore(1, true, fast * 2), 100);
  assert.equal(roundScore(1, true, 60_000), 100);
  assert.equal(roundScore(1, false, 100), 0);
  assert.ok(fastMs(30) > fastMs(1), "more choices on a reshuffled shelf get more time");
});

test("stars: 2 of 3 right clears, 3 right is 2 stars, 3 right and quick is 3", () => {
  assert.equal(THREE_STAR, 375);
  assert.equal(starsOf(0, 0), 0);
  assert.equal(starsOf(1, 150), 0);
  assert.equal(starsOf(2, 300), 1);
  assert.equal(starsOf(3, 374), 2);
  assert.equal(starsOf(3, 375), 3);
  assert.deepEqual(nextStar(3, 360), { points: 15 });
  assert.deepEqual(nextStar(2, 250), { right: 1 });
  assert.deepEqual(nextStar(0, 0), { right: 2 });
  assert.equal(nextStar(3, 400), null);
  assert.equal(nearLine(3, 360), "আর ১৫ পয়েন্ট পেলে ৩ তারা। উত্তরটা একটু আগে দাও।");
  assert.equal(nearLine(1, 120), "আর ১টা ঠিক হলেই লেভেল পার।");
  assert.equal(nearLine(2, 220), "আর ১টা ঠিক হলে ২ তারা।");
  assert.equal(nearLine(3, 420), "");
});

test("a result adds up the answers, and a link's score tells how many were right", () => {
  const rounds = makeLevel(5, 77);
  const answers: Answer[] = [{ pick: rounds[0].missing, ms: 1000 }, { pick: rounds[1].choices.find(id => id !== rounds[1].missing)!, ms: 2000 }, { pick: rounds[2].missing, ms: 9000 }];
  const result = resultOf(5, rounds, answers);
  assert.equal(result.right, 2);
  assert.equal(result.ms, 12_000);
  assert.equal(result.score, roundScore(5, true, 1000) + roundScore(5, true, 9000));
  for (const score of [0, 100, 150, 200, 300, 301, 375, 450]) assert.ok(possibleScore(score), String(score));
  for (const score of [1, 99, 151, 199, 451, -100, 12.5]) assert.ok(!possibleScore(score), String(score));
  assert.deepEqual([0, 130, 260, 300, 450].map(rightFromScore), [0, 1, 2, 3, 3]);
});

test("a headless run through every level with a player who forgets now and then ends sanely", () => {
  const rng = makeRng(99);
  let stars: Record<number, number> = {}, level = 1, plays = 0;
  while (level <= LEVEL_COUNT && plays < 400) {
    plays++;
    const rounds = makeLevel(level, 1 + pick(rng, 999_999));
    const answers = rounds.map(round => {
      const remembers = rng() < 0.85;
      const wrong = round.choices.filter(id => id !== round.missing);
      return { pick: remembers ? round.missing : wrong[pick(rng, wrong.length)], ms: 800 + pick(rng, 6000) };
    });
    const { right, score } = resultOf(level, rounds, answers);
    assert.ok(score >= 0 && score <= MAX_SCORE && possibleScore(score));
    const earned = starsOf(right, score);
    if (earned) { stars = recordLevel(stars, level, earned); level = unlockedLevel(stars, LEVEL_COUNT) === level ? LEVEL_COUNT + 1 : level + 1; }
  }
  assert.ok(Object.keys(stars).length === LEVEL_COUNT, `cleared ${Object.keys(stars).length} levels in ${plays} plays`);
  assert.ok(plays < 120, `took ${plays} plays`);
});

test("progress: readLevels/recordLevel keep the best, and the game opens where you left off", () => {
  const saved = recordLevel(recordLevel(readLevels('{"1":3,"2":1}', LEVEL_COUNT), 2, 2), 2, 1);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  assert.deepEqual(readLevels('{"1":9,"x":2,"40":3}', LEVEL_COUNT), {});
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.equal(startLevel(saved, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 1 }, 4), 4);
  assert.equal(startLevel({ 1: 3, 2: 1, 3: 3 }, 3), 2);
});

test("links: round-trip, names cleaned, hostile and impossible input refused", () => {
  const hash = sharedHash({ seed: 12345, level: 7, score: 410, name: "  রাফি‮ " });
  assert.equal(hash, "s=12345&t=410&l=7&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(`#${hash}`), { seed: 12345, level: 7, score: 410, name: "রাফি" });
  for (const bad of ["", "#s=0&t=10&l=1", "#s=1&t=10&l=0", "#s=1&t=120&l=31", "#s=1&t=170&l=3", "#s=1&t=451&l=3", "#s=1&t=200&l=3.5", "#s=1&t=200&l=03",
    "#s=abc&t=200&l=3", "#s=1&t=-5&l=3", `#s=1&t=200&l=3&n=${"x".repeat(700)}`]) assert.equal(parseShared(bad), null, bad);
  assert.equal(parseShared(`#s=5&t=300&l=2&n=${"ক".repeat(40)}`)?.name.length, 20);
});

test("share.ts normalises, rejects junk and writes a personal preview", () => {
  assert.equal(share.normalize("s=9&t=300&l=4&n=মিতু&x=evil"), "s=9&t=300&l=4&n=%E0%A6%AE%E0%A6%BF%E0%A6%A4%E0%A7%81");
  assert.equal(share.normalize("s=9&t=999&l=4"), null);
  assert.equal(share.normalize("<script>"), null);
  assert.equal(share.preview("s=9&t=300&l=4&n=মিতু").title, "মিতু লেভেল ৪-এ ৩০০ পেয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ seed: 1, level: 2, score: 0, name: "" }), "এক বন্ধু লেভেল ২-এ ০ পেয়েছে। তুমি পারবে?");
  assert.ok(share.preview("nonsense").title.length > 10);
  assert.equal(share.tally, undefined);
});

test("words: kind comparisons, concrete misses, a caption with one fact and a question", () => {
  assert.equal(compareLine(400, 380, "রাফি"), "রাফির চেয়ে ২০ বেশি!");
  assert.equal(compareLine(380, 380, "রাফি"), "একদম সমান! রাফিও ৩৮০ পেয়েছিল।");
  assert.equal(compareLine(360, 380, ""), "আর একটু হলেই! মাত্র ২০ কম।");
  assert.equal(compareLine(200, 380, "রাফি"), "রাফি এখনো ১৮০ এগিয়ে। আরেকবার?");
  assert.equal(humanLine(2, 260, ["chini"]), "তিনটার দুটো ধরেছ। শুধু চিনি চোখ এড়িয়ে গেছে।");
  assert.match(humanLine(1, 120, ["dim", "ata"]), /ডিম আর আটা/);
  assert.ok(humanLine(2, 250).length > 10, "a link's card has no names to show and still reads well");
  assert.equal(feat({ level: 7, score: 410, name: "রাফি" }), "রাফি লেভেল ৭-এ ৪১০ পেয়েছে");
  assert.equal(caption(7, 3, 410), "‘কোনটা নেই?’ খেলার লেভেল ৭-এ ৩টায় ৩টা ধরলাম, স্কোর ৪১০। তুমি কয়টা ধরতে পারবে?");
  for (const line of [humanLine(3, 400), humanLine(3, 330), humanLine(2, 250), humanLine(0, 0)]) assert.ok(!/অসাধারণ|দারুণ|সেরা|আপনি|করুন/.test(line), line);
});

test("content: SEO limits, enough FAQs in search words, no trademarks", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ব্রেন গেম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /জোড়া মেলাও/.test(item.answer)), "names a related game");
  assert.ok(site.privacy.some(line => /লেভেল/.test(line) && /স্কোর/.test(line) && /নাম/.test(line)), "says what a link carries");
  const text = JSON.stringify(site);
  assert.ok(!/আপনি|করুন|দেখুন|অসাধারণ|সহজেই/.test(text));
});
