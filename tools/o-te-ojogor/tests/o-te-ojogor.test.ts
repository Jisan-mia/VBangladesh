import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import {
  aim, errorsOf, fallTime, makeGame, planRound, starsOf, step,
  BASKET_SPEED, CATCH_HALF, CATCH_Y, EV_CATCH, EV_DONE, EV_MISS, EV_WRONG, FALL, FREE, HANG, LAND_GAP, LANES, REACT, type Game,
} from "../lib/game";
import { levelOf, starLimits, units, CONSONANTS, LEVELS, LEVEL_COUNT, NUMBERS, VOWELS, WORDS } from "../lib/levels";
import {
  bannerNote, caption, clearLine, compareLine, feat, humanLine, missLine, nearMissLine, newsLine, parseShared, previewTitle, sharedHash, shortTitle, tallyLine, wrongLine,
} from "../lib/link";
import { boing, chime, thump } from "../lib/sound";
import { hasPicture } from "../lib/art";
import { site } from "../content";
import { share } from "../share";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const seeds = Array.from({ length: 10 }, (_, index) => 1 + index * 7919);
const DT = 1 / 60;

/**
 * A whole level with a scripted player stepping the same pure rules the page uses. It notices a fruit `react` seconds after it
 * appears, heads for the right one at full basket speed, and (when `careful`) holds still or steps aside rather than catch a wrong one.
 */
function play(level: number, seed: number, { react = REACT, careful = true, idle = false, wild = 0 } = {}) {
  const game = makeGame(level, seed), seen = new Float64Array(game.fruits.length).fill(-1), rng = makeRng(seed ^ 0x51ed);
  while (!game.over) {
    game.fruits.forEach((fruit, slot) => { if (fruit.state === FREE) seen[slot] = -1; else if (seen[slot] < 0) seen[slot] = game.t; });
    if (!idle) {
      const want = game.spec.items[game.index].text;
      const target = game.fruits.findIndex((fruit, slot) => fruit.text === want && (fruit.state === HANG || fruit.state === FALL) && game.t - seen[slot] >= react);
      let goal = target >= 0 ? game.fruits[target].x : game.basketX;
      if (wild && rng() < wild) goal = LANES[Math.floor(rng() * 5)];
      if (careful) {
        const bad = (to: number) => game.fruits.some(fruit => {
          if (fruit.state !== FALL || fruit.text === want) return false;
          const tau = (CATCH_Y - fruit.y) / game.spec.speed;
          if (tau <= 0 || tau > 0.6) return false;
          const at = game.basketX + Math.max(-BASKET_SPEED * tau, Math.min(BASKET_SPEED * tau, to - game.basketX));
          return Math.abs(at - fruit.x) <= CATCH_HALF + 4;
        });
        if (bad(goal)) goal = !bad(game.basketX) ? game.basketX : [LANES[0], LANES[4], LANES[2]].find(to => !bad(to)) ?? goal;
      }
      aim(game, goal);
    }
    step(game, DT);
    assert.ok(game.t < 600, "a level always ends");
    if (idle && game.t > 60) break;
  }
  return game;
}

test("the sequences are the বর্ণমালা in order, NFC, with a picture word for every letter", () => {
  assert.deepEqual(VOWELS.map(item => item.text).join(""), "অআইঈউঊঋএঐওঔ");
  assert.equal(CONSONANTS.length, 39);
  assert.deepEqual(CONSONANTS.slice(0, 5).map(item => item.text), ["ক", "খ", "গ", "ঘ", "ঙ"]);
  assert.deepEqual(CONSONANTS.slice(-7).map(item => item.text), ["ড়", "ঢ়", "য়", "ৎ", "ং", "ঃ", "ঁ"]);
  assert.equal(NUMBERS.map(item => item.text).join(" "), "১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ ১০ ১১ ১২ ১৩ ১৪ ১৫ ১৬ ১৭ ১৮ ১৯ ২০");
  assert.equal(VOWELS[0].label, "অ-তে অজগর");
  assert.equal(VOWELS[1].label, "আ-তে আম");
  assert.equal(CONSONANTS[4].label, "ব্যাঙের ঙ");
  for (const item of [...VOWELS, ...CONSONANTS, ...NUMBERS]) {
    assert.equal(item.text, item.text.normalize("NFC"));
    assert.equal(item.label, item.label.normalize("NFC"));
    assert.ok(item.label.includes(item.text), `${item.label} shows ${item.text}`);
    assert.ok(item.pic, item.text);
  }
  assert.equal(new Set(VOWELS.concat(CONSONANTS).map(item => item.pic)).size, 50, "every letter has its own picture");
});

test("words are NFC, free of যুক্তবর্ণ, and split into the units a child spells", () => {
  assert.deepEqual(units("নৌকা"), ["নৌ", "কা"]);
  assert.deepEqual(units("হাঁস"), ["হাঁ", "স"]);
  assert.deepEqual(units("ঘুড়ি"), ["ঘু", "ড়ি"]);
  assert.deepEqual(units("আম"), ["আ", "ম"]);
  for (const word of Object.keys(WORDS)) {
    assert.equal(word, word.normalize("NFC"), word);
    assert.doesNotMatch(word, /্/u, `${word} has no হসন্ত, so no যুক্তবর্ণ`);
    assert.equal(units(word).join(""), word);
    assert.ok(units(word).length >= 2 && units(word).length <= 4, word);
  }
  for (const level of LEVELS.filter(level => level.world === "word")) {
    const ends = level.items.filter(item => item.word);
    assert.ok(ends.length >= 2);
    for (const item of ends) assert.equal(item.text, units(item.word!).at(-1));
    assert.equal(level.items.map(item => item.text).join(""), ends.map(item => item.word).join(""));
  }
});

test("levels rise in small steps inside each world, and the alphabet's end is a milestone", () => {
  assert.equal(LEVEL_COUNT, 22);
  assert.deepEqual([...new Set(LEVELS.map(level => level.world))], ["vowel", "consonant", "word", "number"]);
  for (let i = 1; i < LEVELS.length; i++) {
    const before = LEVELS[i - 1], now = LEVELS[i];
    if (before.world !== now.world) continue;
    assert.ok(now.speed >= before.speed && now.speed - before.speed <= 35, `level ${i + 1} speed`);
    assert.ok(now.decoys >= before.decoys && now.decoys - before.decoys <= 1, `level ${i + 1} decoys`);
    assert.ok(now.ripen <= before.ripen, `level ${i + 1} ripen`);
  }
  assert.equal(LEVELS[9].items.at(-1)!.text, "ঁ");
  assert.ok(LEVELS[9].milestone && LEVELS[2].milestone && LEVELS.at(-1)!.milestone);
  assert.deepEqual(LEVELS.at(-1)!.items.slice(0, 2).map(item => item.text), ["২০", "১৯"]);
  assert.equal(levelOf(0), LEVELS[0]);
  assert.equal(levelOf(99), LEVELS.at(-1));
});

test("rounds are seeded, fair, and the right fruit is always reachable in time from anywhere", () => {
  const far = (LANES[4] - LANES[0]) / BASKET_SPEED + REACT;
  for (const level of levels) for (const seed of seeds) {
    const spec = levelOf(level);
    for (let index = 0; index < spec.items.length; index++) for (const round of [0, 1, 5, 17]) {
      const plans = planRound(level, seed, round + index, index);
      assert.deepEqual(plans, planRound(level, seed, round + index, index), "same seed, same round");
      const [target, ...decoys] = plans;
      assert.ok(target.target && target.text === spec.items[index].text);
      assert.ok(target.drop + fallTime(spec, target.lane) >= far, `level ${level}: ${target.drop + fallTime(spec, target.lane)}s is enough to cross the board`);
      assert.equal(new Set(plans.map(plan => plan.lane)).size, plans.length, "one fruit per branch");
      const close = new Set(spec.items.slice(index, index + 3).map(item => item.text));
      for (const decoy of decoys) assert.ok(!close.has(decoy.text), "a wrong fruit is never the right one or the next two");
      assert.equal(new Set(decoys.map(decoy => decoy.text)).size, decoys.length);
      const lands = plans.map(plan => plan.drop + fallTime(spec, plan.lane)).sort((a, b) => a - b);
      for (let k = 1; k < lands.length; k++) assert.ok(lands[k] - lands[k - 1] >= LAND_GAP - 1e-9, "never two at once");
      assert.equal(decoys.length, level === 1 && round + index < 2 ? 0 : spec.decoys);
    }
  }
  assert.notDeepEqual(planRound(5, 11, 3, 2), planRound(5, 12, 3, 2));
  assert.deepEqual(planRound(1, 9, 0, 0).length, 1, "the first fruit of the game falls alone");
});

test("a careful player clears every level with 3 stars on every seed", () => {
  for (const level of levels) for (const seed of seeds) {
    const game = play(level, seed);
    assert.ok(game.over && game.index === game.spec.items.length);
    assert.equal(game.missed, 0, `level ${level} seed ${seed}: the right fruit is always reachable`);
    assert.equal(starsOf(level, errorsOf(game)), 3, `level ${level} seed ${seed}: ${game.wrong} wrong`);
    assert.equal(game.wrong, 0, `level ${level} seed ${seed}: every wrong fruit can be dodged`);
  }
});

test("a slow, careless player still finishes (no game over) and the same seed replays exactly", () => {
  for (const level of [1, 9, 18, 22]) {
    const a = play(level, 77, { react: 1, careful: false, wild: 0.02 }), b = play(level, 77, { react: 1, careful: false, wild: 0.02 });
    assert.ok(a.over);
    assert.equal(a.t, b.t); assert.equal(a.wrong, b.wrong); assert.equal(a.missed, b.missed);
    assert.ok(a.t < 40 * a.spec.items.length, `level ${level} took ${a.t}s`);
  }
  const idle = play(3, 5, { idle: true });
  assert.ok(!idle.over && idle.missed > 3, "nobody playing: the right fruit keeps coming back, nothing breaks");
});

test("star thresholds: fewer mistakes, more stars; a short level forgives one, a long one two", () => {
  assert.deepEqual(starLimits(1), [1, 5]);
  assert.deepEqual(starLimits(3), [2, 6]);
  assert.deepEqual(starLimits(11), [2, 8]);
  assert.equal(starsOf(1, 0), 3); assert.equal(starsOf(1, 1), 3); assert.equal(starsOf(1, 2), 2); assert.equal(starsOf(1, 5), 2); assert.equal(starsOf(1, 6), 1);
  assert.equal(starsOf(22, 2), 3); assert.equal(starsOf(22, 3), 2); assert.equal(starsOf(22, 99), 1);
  for (const level of levels) { const [three, two] = starLimits(level); assert.ok(three >= 1 && two > three); }
});

test("catching: the right letter advances, a wrong one rocks the basket, a dropped one comes back", () => {
  const game = makeGame(4, 99);
  while (!game.fruits.some(fruit => fruit.state === HANG)) step(game, DT);
  const right = game.fruits.find(fruit => fruit.item === 0)!;
  aim(game, right.x);
  while (game.index === 0) { step(game, DT); assert.equal(game.events & EV_WRONG, 0); }
  assert.equal(game.caught, 0); assert.equal(game.streak, 1);
  // Park under a wrong fruit of the next round.
  let wrongSeen = false, missSeen = false;
  for (let i = 0; i < 60 * 30 && !(wrongSeen && missSeen); i++) {
    const decoy = game.fruits.find(fruit => fruit.state === FALL && fruit.item < 0 && fruit.y > 200);
    if (decoy) aim(game, decoy.x);
    step(game, DT);
    if (game.events & EV_WRONG) { wrongSeen = true; assert.ok(game.wobble > 0.4 && errorsOf(game) > 0); }
    if (game.events & EV_MISS) missSeen = true;
  }
  assert.ok(wrongSeen && missSeen);
  assert.equal(game.index, 1, "chasing wrong fruit never moves the sequence on");
  assert.ok(errorsOf(game) >= 2);
  const fresh = makeGame(1, 3);
  for (let i = 0; i < 60 * 40 && !(fresh.events & EV_CATCH); i++) { aim(fresh, fresh.fruits.find(fruit => fruit.state === HANG || fruit.state === FALL)?.x ?? fresh.basketX); step(fresh, DT); }
  assert.ok(fresh.index >= 1, "the very first letter falls alone and is easy to catch");
});

test("level progress goes through readLevels / recordLevel", () => {
  let stars = readLevels(null, LEVEL_COUNT);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 1);
  stars = recordLevel(stars, 1, starsOf(1, 0));
  stars = recordLevel(stars, 1, starsOf(1, 9));
  assert.equal(stars[1], 3, "the better result stays");
  stars = recordLevel(stars, 2, 2);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(totalStars(stars), 5);
  assert.deepEqual(readLevels(JSON.stringify({ 1: 3, 23: 3, 4: 9, x: 2 }), LEVEL_COUNT), { 1: 3 });
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("lines: exact, kind, true to the data, and in তুমি", () => {
  assert.equal(new Set(levels.map(clearLine)).size, LEVEL_COUNT);
  assert.equal(new Set(levels.map(newsLine)).size, LEVEL_COUNT);
  assert.match(newsLine(11), /২০টা/); assert.equal(levelOf(11).items.length, 20);
  assert.match(newsLine(12), /১৯টা/); assert.equal(levelOf(12).items.length, 19);
  for (const level of [3, 5]) { assert.match(newsLine(level), /তিনটা/); assert.equal(levelOf(level).decoys, 2); }
  for (const level of [9, 17, 20]) { assert.match(newsLine(level), /চারটা/); assert.equal(levelOf(level).decoys, 3); }
  assert.equal(shortTitle(3), "অ থেকে ঔ"); assert.equal(shortTitle(11), "ক থেকে ন"); assert.equal(shortTitle(13), "আম, বই"); assert.equal(shortTitle(22), "২০ থেকে ১");
  assert.equal(nearMissLine(1, 1), "");
  assert.equal(nearMissLine(1, 3), "আর ২টা ভুল কম হলে ৩ তারা।");
  assert.equal(nearMissLine(1, 7), "আর ২টা ভুল কম হলে ২ তারা।");
  assert.match(humanLine({ level: 19, errors: 0 }), /ভুল সংখ্যা/);
  assert.match(humanLine({ level: 2, errors: 3 }), /দুলেছে/);
  assert.equal(tallyLine({ level: 3, errors: 2 }), "১১টা বর্ণ · ভুল ২টা");
  assert.equal(compareLine(1, 4, "রাফি"), "রাফির চেয়ে ৩টা ভুল কম!");
  assert.equal(compareLine(0, 0, "রাফি"), "একদম সমান! দুজনেরই একটাও ভুল নেই।");
  assert.match(compareLine(3, 2, ""), /আর একটু হলেই! বন্ধু/);
  assert.match(compareLine(9, 1, "রাফি"), /রাফির ভুল ছিল ১টা, তোমার ৯টা/);
  assert.equal(wrongLine("ঈ", "ই"), "ওটা ঈ। এবার ই খোঁজো।");
  assert.match(missLine("ই", true), /একটুর জন্য/);
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  const all = [...levels.flatMap(level => [clearLine(level), newsLine(level), levelOf(level).title, nearMissLine(level, 9), humanLine({ level, errors: 4 })]),
    ...[...VOWELS, ...CONSONANTS, ...NUMBERS].map(item => item.label), caption({ level: 3, errors: 0 }), bannerNote("")].join(" ");
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|সেরা|ভয়|মরে|হেরে|(^|\s)জল[\s,।]/);
  assert.ok((all.match(/!/g) ?? []).length <= 1);
});

test("a challenge link round-trips and refuses forged or hostile input", () => {
  const shared = { level: 3, seed: 4242, errors: 2, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, "s=4242&t=2&l=3&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(previewTitle(shared), "রাফি ঝুড়িতে ধরেছে অ থেকে ঔ, ভুল ২টা। তুমি পারবে?");
  assert.equal(feat({ ...shared, errors: 0, name: "" }), "এক বন্ধু ঝুড়িতে ধরেছে অ থেকে ঔ, একটাও ভুল ছাড়া");
  for (const bad of [
    "s=4242&t=2&l=23", "s=4242&t=2&l=0", "s=4242&t=2&l=03", "s=4242&t=2", "s=4242&t=100&l=3", "s=4242&t=-1&l=3", "s=4242&t=1.5&l=3",
    "s=0&t=2&l=3", "s=1000000000&t=2&l=3", "s=4242&t=2&l=3x", `s=4242&t=2&l=3&n=${"x".repeat(700)}`, "", "junk",
  ]) assert.equal(parseShared(bad), null, bad);
  const long = parseShared(`s=1&t=3&l=1&n=${encodeURIComponent("রাফি‮\u0007" + "ক".repeat(40))}`);
  assert.ok(long && [...long.name].length <= 20 && !/[‮\u0007]/.test(long.name));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.preview(hash).title, previewTitle(shared));
  assert.match(caption(shared), /তুমি পারবে\?$/);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("বাংলা বর্ণমালা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && item.answer.startsWith("২২টা")));
  assert.ok(site.faq.some(item => /কালবৈশাখী আম|শব্দ খোঁজা/.test(item.answer)));
  assert.match(site.privacy.join(" "), /সিড/);
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|সেরা|সহজেই/);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { chime(); boing(); thump(); });
});

test("every picture id has a drawing", () => {
  const pics = [...VOWELS, ...CONSONANTS, ...NUMBERS].map(item => item.pic).concat(Object.values(WORDS), LEVELS.flatMap(level => level.items.filter(item => item.word).map(item => item.pic)));
  for (const pic of pics) assert.ok(hasPicture(pic), pic);
  assert.ok(!hasPicture("dots21") && !hasPicture("nothing"));
});
