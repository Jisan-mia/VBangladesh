import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  answerRun, comboOf, digitCount, freshRun, levelOf, makeChoices, makeQuestions, maxScore, nextStar, pointsFor, possibleScore,
  readTyped, startLevel, starsOf, LEVEL_COUNT, MAX_DIGITS, MAX_RIGHT, MAX_SCORE, QUESTIONS,
} from "../lib/game";
import { worldOf, LEVELS } from "../lib/levels";
import { caption, compareLine, feat, humanLine, nearLine, parseShared, previewTitle, sharedHash } from "../lib/link";

const SEEDS = Array.from({ length: 60 }, (_, i) => 1 + ((i * 2654435761) >>> 0) % 999_999_999);
const parsed = (text: string) => Number(text.replace(/[০-৯]/g, d => String(d.charCodeAt(0) - 0x09e6)));

test("30 levels in three worlds; the first ten use four choices, the rest the pad; star thresholds rise", () => {
  assert.equal(LEVEL_COUNT, 30);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { stars, choices, label } = levelOf(level);
    assert.equal(choices, level <= 10, `level ${level}`);
    assert.ok(label.length > 2);
    assert.ok(stars[0] >= 3 && stars[0] < stars[1] && stars[1] < stars[2] && stars[2] <= 45, `level ${level}: ${stars}`);
  }
  assert.equal(new Set(LEVELS.map(level => level.label)).size, 30, "every level has its own name");
  assert.deepEqual([1, 10, 11, 20, 21, 30].map(worldOf), [0, 0, 1, 1, 2, 2]);
});

test("every question over many seeds: a whole answer from 1 up, fitting the pad; kids levels small with one right choice", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const kids = levelOf(level).choices;
    for (const seed of SEEDS) {
      const questions = makeQuestions(level, seed);
      assert.equal(questions.length, QUESTIONS);
      questions.forEach((q, index) => {
        const where = `level ${level} seed ${seed} #${index}: ${q.lines.join(" / ")}`;
        assert.ok(Number.isInteger(q.answer) && q.answer >= 1, where);
        assert.ok(digitCount(q.answer) <= MAX_DIGITS, where);
        assert.ok(q.lines.length >= 1 && q.lines.every(line => line.length > 0 && !/\d/.test(line)), `${where}: Bangla digits only`);
        if (index) assert.notEqual(q.lines.join(), questions[index - 1].lines.join(), `${where}: same sum twice in a row`);
        if (kids) {
          assert.ok(q.answer <= 99, where);
          assert.ok(q.choices && q.choices.length === 4, where);
          assert.equal(new Set(q.choices).size, 4, where);
          assert.deepEqual(q.choices.filter(c => c === q.answer), [q.answer], where);
          assert.ok(q.choices.every(c => Number.isInteger(c) && c >= 0), where);
        } else assert.equal(q.choices, null, where);
        assert.equal(q.bazar, level > 20, where);
        if (q.bazar) assert.ok(q.ask.endsWith("?"), where);
      });
    }
  }
});

test("plain sums check out: the written sum gives the answer", () => {
  for (let level = 1; level <= 20; level++) for (const seed of SEEDS.slice(0, 10)) for (const q of makeQuestions(level, seed, 40)) {
    const terms = q.lines[0].split(" ");
    let total = parsed(terms[0]);
    for (let i = 1; i < terms.length; i += 2) {
      const value = parsed(terms[i + 1]);
      total = terms[i] === "+" ? total + value : terms[i] === "−" ? total - value : terms[i] === "×" ? total * value : total / value;
    }
    assert.equal(total, q.answer, q.lines[0]);
  }
});

test("bazaar sums: prices are whole, a half kilo only of an even price, change below the note", () => {
  for (const seed of SEEDS) {
    for (const q of makeQuestions(25, seed, 30)) {
      const [word, price] = [q.lines[0].split(" ")[0], parsed(q.lines[0].split(" ").at(-2)!)];
      assert.equal(q.answer, price * ({ আধা: 0.5, দেড়: 1.5, আড়াই: 2.5 } as Record<string, number>)[word], q.lines[0]);
    }
    for (const q of makeQuestions(29, seed, 30)) {
      const cost = parsed(q.lines[0].split(" ")[1]), note = parsed(q.lines[1].split(" ")[1]);
      assert.ok(cost > 0 && cost < note && [100, 200, 500].includes(note));
      assert.equal(q.answer, note - cost);
    }
    for (const q of makeQuestions(26, seed, 30)) assert.equal(q.ask, "সমান ভাগে একেকজন কত দেবে?");
  }
});

test("the same level and seed give the same sums; another seed or level changes them", () => {
  assert.deepEqual(makeQuestions(14, 4242), makeQuestions(14, 4242));
  assert.notDeepEqual(makeQuestions(14, 4242), makeQuestions(14, 4243));
  assert.notDeepEqual(makeQuestions(14, 4242), makeQuestions(15, 4242));
});

test("choices: four, distinct, never negative, even for an answer of 1", () => {
  const rng = makeRng(7);
  for (const answer of [1, 2, 5, 9, 10, 45, 99]) for (let i = 0; i < 50; i++) {
    const choices = makeChoices(rng, answer);
    assert.equal(new Set(choices).size, 4);
    assert.ok(choices.includes(answer) && choices.every(c => c >= 0));
  }
});

test("combo points: 10 a right answer, 20 from five in a row, up to 40; a wrong answer breaks the streak", () => {
  assert.deepEqual([1, 4, 5, 6, 10, 11, 15, 16, 40].map(pointsFor), [10, 10, 10, 20, 20, 30, 30, 40, 40]);
  assert.equal(comboOf(0), 1);
  assert.equal(comboOf(5), 2);
  let run = freshRun();
  for (let i = 0; i < 6; i++) run = answerRun(run, true);
  assert.deepEqual(run, { index: 6, right: 6, wrong: 0, streak: 6, bestStreak: 6, score: 70, slips: 0 });
  run = answerRun(run, false);
  assert.deepEqual(run, { index: 7, right: 6, wrong: 1, streak: 0, bestStreak: 6, score: 70, slips: 1 });
  run = answerRun(run, true);
  assert.equal(run.score, 80);
  assert.equal(maxScore(6), 70);
});

test("typed digits: Bangla or ASCII, nothing else", () => {
  assert.equal(readTyped("৪৫"), 45);
  assert.equal(readTyped("45"), 45);
  assert.equal(readTyped("০৭"), 7);
  assert.equal(readTyped(""), null);
  assert.equal(readTyped("4a"), null);
  assert.equal(readTyped("-3"), null);
});

test("stars and the near-miss: thresholds from the level, exact numbers left", () => {
  assert.deepEqual([0, 4, 5, 17, 18, 23, 24, 40].map(right => starsOf(1, right)), [0, 0, 1, 1, 2, 2, 3, 3]);
  assert.deepEqual(nextStar(1, 4), { stars: 1, need: 1 });
  assert.deepEqual(nextStar(1, 21), { stars: 3, need: 3 });
  assert.equal(nextStar(1, 24), null);
  assert.equal(nearLine(1, 21), "আর ৩টা মিললে ৩ তারা।");
  assert.equal(nearLine(1, 2), "আর ৩টা মিললেই লেভেল পার।");
  assert.equal(nearLine(1, 30), "");
});

test("possible scores: whole tens between 10 a right answer and one long streak", () => {
  assert.ok(possibleScore(0, 0));
  assert.ok(possibleScore(6, 60) && possibleScore(6, 70));
  assert.ok(!possibleScore(6, 80) && !possibleScore(6, 50) && !possibleScore(6, 65));
  assert.ok(!possibleScore(-1, 0) && !possibleScore(1.5, 10));
  let total = 0;
  for (let streak = 1; streak <= 2000; streak++) { total += pointsFor(streak); if ([1, 5, 6, 15, 16, 120, 2000].includes(streak)) assert.equal(maxScore(streak), total, `maxScore(${streak})`); }
  assert.equal(MAX_SCORE, maxScore(MAX_RIGHT));
});

test("progress: readLevels/recordLevel keep the best, and the game opens where you left off", () => {
  let saved = readLevels('{"1":3,"2":1,"99":3,"x":2,"3":7}', LEVEL_COUNT);
  assert.deepEqual(saved, { 1: 3, 2: 1 });
  saved = recordLevel(saved, 2, 3);
  saved = recordLevel(saved, 2, 1);
  assert.equal(saved[2], 3);
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.equal(startLevel(saved, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 3 }, 4), 4);
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("links: round-trip, names cleaned, hostile and impossible input refused", () => {
  const shared = { seed: 4242, level: 12, right: 9, score: 100, name: " মিতু‮ ", marks: "110" };
  const back = parseShared(`#${sharedHash(shared)}`);
  assert.deepEqual(back, { ...shared, name: "মিতু" });
  assert.equal(parseShared("#s=1&t=100&l=31&r=9"), null);
  assert.equal(parseShared("#s=1&t=100&l=0&r=9"), null);
  assert.equal(parseShared("#s=1&t=500&l=3&r=9"), null, "too many points for 9 right");
  assert.equal(parseShared("#s=1&t=95&l=3&r=9"), null);
  assert.equal(parseShared("#s=1&t=100&l=3&r=-9"), null);
  assert.equal(parseShared("#s=1&t=100&l=3"), null);
  assert.equal(parseShared("#s=0&t=100&l=3&r=9"), null);
  assert.equal(parseShared(`#s=1&t=100&l=3&r=9&n=${"ক".repeat(700)}`), null, "over-long hash");
  assert.equal(parseShared(`#s=1&t=100&l=3&r=9&n=${"ক".repeat(40)}`)?.name.length, 20);
});

test("share.ts normalises, rejects junk and writes a personal preview", () => {
  assert.equal(share.normalize("s=9&t=100&l=4&r=9&n=মিতু&x=evil"), "s=9&t=100&l=4&r=9&n=%E0%A6%AE%E0%A6%BF%E0%A6%A4%E0%A7%81");
  assert.equal(share.normalize("s=9&t=9999&l=4&r=9"), null);
  assert.equal(share.normalize("<script>alert(1)</script>"), null);
  assert.equal(share.preview("s=9&t=100&l=4&r=9&n=মিতু").title, "মিতু লেভেল ৪-এ ৯টা হিসাব মিলিয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ seed: 1, level: 4, right: 9, score: 100, name: "", marks: null }), "এক বন্ধু লেভেল ৪-এ ৯টা হিসাব মিলিয়েছে। তুমি পারবে?");
  assert.equal(share.normalize("s=9&t=100&l=4&r=9&k=101"), "s=9&t=100&l=4&r=9&k=101", "the marks key survives");
  assert.ok(share.preview("nonsense").title.length > 10);
  assert.equal(share.tally, undefined);
});

test("words: kind comparisons, exact numbers, a caption with one fact and a question", () => {
  const friend = { seed: 1, level: 4, right: 10, score: 120, name: "রাফি", marks: null };
  assert.equal(compareLine({ right: 12, score: 150 }, friend), "রাফির চেয়ে ২টা বেশি!");
  assert.equal(compareLine({ right: 9, score: 90 }, friend), "আর একটু হলেই! মাত্র ১টা কম।");
  assert.equal(compareLine({ right: 3, score: 30 }, friend), "রাফি এখনো ৭টা এগিয়ে। আরেকবার?");
  assert.match(compareLine({ right: 10, score: 100 }, friend), /সমান/);
  assert.equal(feat(friend), "রাফি লেভেল ৪-এ ১০টা হিসাব মিলিয়েছে");
  assert.match(caption(4, 10, 120), /১০টা.*১২০.*\?$/);
  for (const level of [1, 10, 15, 25, 30]) for (const right of [0, 2, 6, 10, 20, 45]) for (const wrong of [0, 4, 30]) {
    const line = humanLine(level, right, wrong);
    assert.ok(line.length > 10 && !/অসাধারণ|দারুণ|সেরা|আপনি|করুন|!!/.test(line), line);
  }
});

test("content: SEO limits, enough FAQs in search words, related games, honest privacy", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("অঙ্কের খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /নামতা চ্যালেঞ্জ/.test(item.answer)), "points to namta for times tables");
  assert.ok(site.faq.some(item => /আনুমানিক/.test(item.answer)), "bazaar prices are called rough");
  assert.ok(site.privacy.some(line => /লেভেল/.test(line) && /পয়েন্ট/.test(line) && /নাম/.test(line)), "says what a link carries");
  const text = JSON.stringify(site);
  assert.ok(!/আপনি|করুন|দেখুন|অসাধারণ|সহজেই|টাকা জিত|পুরস্কার জিত/.test(text));
});
