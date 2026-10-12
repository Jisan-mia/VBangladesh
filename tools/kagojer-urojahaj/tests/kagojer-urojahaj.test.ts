import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { BALL_R, EV, HITS_MAX, dragBy, launch, newGame, starsOf, step, steer, type Game } from "../lib/game";
import { LEVEL_COUNT, LEVELS, isStorm } from "../lib/levels";
import { bn, cardHash, cardStars, caption, friendBanner, humanLine, nearLine, parseCard, previewTitle, versusLine, type Card } from "../lib/result";
import { BUTTON_SPEED, DRAG_SPEED, LANE, PLANE_Y, X_MAX, X_MIN, ballReach, cloudHalfX, dropHitsPlane, makeWave, sweep, type CloudPlan } from "../lib/wave";
import { share } from "../share";

const DT = 1 / 60;
const fingerprint = (game: Game) => [game.phase, game.t.toFixed(4), game.px.toFixed(3), game.score, game.popped, game.suns, game.hits].join("|");

/** Steps until the wave ends, calling `input` before each step. */
function run(game: Game, input: (game: Game, index: number) => void = () => {}) {
  launch(game);
  const seen: number[] = [];
  for (let index = 0; game.phase === "play" && index < 60 * 120; index++) {
    input(game, index);
    step(game, DT);
    for (let event = 0; event < game.eventCount; event++) seen.push(game.events[event]);
    game.eventCount = 0;
  }
  return seen;
}

/** Follows the fairness sweep's own dry path, at button speed. */
function followPath(game: Game) {
  const { path } = sweep(game.wave, DT, 0.3, true);
  assert.ok(path, `level ${game.level} has a path`);
  return run(game, (g, index) => { g.target = path![Math.min(path!.length - 1, index + 1)]; });
}

/** Chases the lowest cloud still above the plane (fine on waves without drops). */
const hunter = (g: Game) => {
  let best = -1;
  for (let index = 0; index < g.nextCloud; index++) if (g.cloudState[index] === 1 && g.cloudY[index] < PLANE_Y - 14 && (best < 0 || g.cloudY[index] > g.cloudY[best])) best = index;
  if (best >= 0) dragBy(g, g.cloudX[best] - (Number.isNaN(g.target) ? g.px : g.target));
};

test("the same seed makes the same sky, and the same input plays out the same", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.deepEqual(makeWave(48213, level), makeWave(48213, level));
  assert.notDeepEqual(makeWave(1, 7).clouds, makeWave(2, 7).clouds);
  const a = newGame(777, 8), b = newGame(777, 8);
  run(a, hunter); run(b, hunter);
  assert.equal(fingerprint(a), fingerprint(b));
  const c = newGame(778, 8);
  run(c, hunter);
  assert.notEqual(fingerprint(a), fingerprint(c), "a different seed is a different sky");
});

test("every level is fair: a dry path always exists at button speed, even if nothing is ever popped", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (let seed = 1; seed <= 40; seed++) {
    const wave = makeWave(seed * 7919, level);
    assert.equal(sweep(wave, DT, 0).failAt, -1, `level ${level} seed ${seed}`);
    assert.ok(wave.clouds.length >= LEVELS[level - 1].groups * 0.6, `level ${level} seed ${seed} kept most of its clouds`);
  }
});

test("following that path finishes every level without getting wet", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of [11, 4242]) {
    const game = newGame(seed, level);
    followPath(game);
    assert.equal(game.phase, "clear", `level ${level} seed ${seed}`);
    assert.equal(game.hits, 0, `level ${level} seed ${seed}`);
    assert.ok(starsOf(game.wave, game.popped, game.hits) >= 2);
  }
});

test("level 1 is a win in the first seconds and can't be lost by holding still", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const game = newGame(seed * 31, 1);
    let firstPop = Infinity;
    run(game, g => { if (g.popped && firstPop === Infinity) firstPop = g.t; });
    assert.equal(game.hits, 0, `seed ${seed}`);
    assert.equal(game.phase, "clear");
    assert.ok(firstPop < 3, `first pop at ${firstPop}`);
  }
});

test("a player who chases clouds clears the early levels with a plausible score", () => {
  for (let level = 1; level <= 3; level++) for (const seed of [5, 66, 909]) {
    const game = newGame(seed, level);
    run(game, hunter);
    const stars = starsOf(game.wave, game.popped, game.hits);
    assert.ok(stars >= 2, `level ${level} seed ${seed}: ${game.popped}/${game.wave.goal}, hits ${game.hits}`);
    assert.ok(game.score >= game.popped * 10 && game.score <= game.wave.maxScore, `score ${game.score}`);
  }
});

test("standing still under the storm gets you soaked; the storm only rains in readable lanes with a gap", () => {
  for (const level of [5, 10, 15, 20]) {
    assert.ok(isStorm(level));
    const wave = makeWave(99, level);
    assert.ok(wave.storm && wave.storm.curtains.length >= 4, `level ${level} curtains`);
    for (const curtain of wave.storm!.curtains) {
      assert.ok(curtain.warn >= 0.8, "each curtain is shaded at least 0.8 s ahead");
      const free = Array.from({ length: 9 }, (_, slot) => !curtain.slots.includes(slot));
      assert.ok(free.some((open, slot) => open && free[slot + 1]), `level ${level}: two free lanes side by side`);
    }
    assert.equal(LANE(0), 10); assert.equal(LANE(8), 90);
  }
  const idle = newGame(99, 20);
  run(idle);
  assert.equal(idle.phase, "over", "three soakings end the wave");
  assert.equal(idle.hits, HITS_MAX);
  assert.equal(starsOf(idle.wave, idle.popped, idle.hits), 0);
});

test("hitboxes: a cloud can't wet the plane unless a paper ball would hit it first; drops hit only up close", () => {
  for (const level of [3, 12, 20]) for (const c of makeWave(1, level).clouds as CloudPlan[]) assert.ok(cloudHalfX(c) < ballReach(c) + BALL_R, c.kind);
  assert.ok(dropHitsPlane(50, PLANE_Y, 50));
  assert.ok(dropHitsPlane(54.7, PLANE_Y, 50));
  assert.ok(!dropHitsPlane(54.9, PLANE_Y, 50), "a drop beside the wing misses");
  assert.ok(!dropHitsPlane(50, PLANE_Y - 6, 50));
  assert.ok(DRAG_SPEED > BUTTON_SPEED, "a drag is never slower than the buttons the fairness check uses");
});

test("the plane stays in the sky, steers at button speed, and a drag moves it by the finger's distance", () => {
  const game = newGame(3, 2);
  launch(game);
  steer(game, -1);
  for (let index = 0; index < 120; index++) step(game, DT);
  assert.equal(game.px, X_MIN);
  steer(game, 1); step(game, DT);
  assert.ok(Math.abs(game.px - (X_MIN + BUTTON_SPEED * DT)) < 1e-6);
  steer(game, 0);
  dragBy(game, 500);
  for (let index = 0; index < 60; index++) step(game, DT);
  assert.equal(game.px, X_MAX);
  dragBy(game, -10); dragBy(game, -10);
  for (let index = 0; index < 30; index++) step(game, DT);
  assert.ok(Math.abs(game.px - (X_MAX - 20)) < 1e-6, "relative drags add up");
});

test("scoring: a dark cloud takes two balls and drops রোদ; quick pops build a combo", () => {
  const game = newGame(12, 3), dark = game.wave.clouds.findIndex(c => c.kind === "dark");
  assert.ok(dark >= 0);
  const events = run(game, g => { if (g.cloudState[dark] === 1) dragBy(g, g.cloudX[dark] - (Number.isNaN(g.target) ? g.px : g.target)); else if (g.cloudState[dark] === 2) hunter(g); });
  assert.equal(game.cloudState[dark], 2, "the dark cloud burst");
  assert.ok(events.indexOf(EV.crack) >= 0 && events.indexOf(EV.crack) < events.indexOf(EV.burst), "cracks before it bursts");
  assert.ok(events.includes(EV.sun) && game.suns >= 1);
  const plain = newGame(12, 3);
  run(plain, hunter);
  assert.ok(events.includes(EV.combo) || plain.bestCombo >= 2, "pops close together make a combo");
});

test("stars: 1 for clearing, +1 for the cloud goal, +1 for staying dry; 0 when soaked", () => {
  const wave = { goal: 10 };
  assert.equal(starsOf(wave, 10, 0), 3);
  assert.equal(starsOf(wave, 14, 0), 3);
  assert.equal(starsOf(wave, 9, 0), 2);
  assert.equal(starsOf(wave, 10, 2), 2);
  assert.equal(starsOf(wave, 3, 1), 1);
  assert.equal(starsOf(wave, 99, HITS_MAX), 0);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const w = makeWave(7, level);
    assert.ok(w.goal >= 1 && w.goal < w.total, `level ${level} goal ${w.goal}/${w.total}`);
  }
});

test("progress on the phone goes through the kit's readLevels and recordLevel", () => {
  let stars = readLevels("{\"1\":3,\"2\":1,\"21\":3,\"x\":2,\"3\":7}", LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, starsOf({ goal: 5 }, 6, 0));
  assert.equal(stars[2], 3);
  stars = recordLevel(stars, 2, 1);
  assert.equal(stars[2], 3, "a worse run never lowers the stars");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(totalStars(stars), 6);
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

const sample: Card = { seed: 4242, level: 5, score: 310, popped: 9, suns: 4, hits: 0, name: "রাফি" };

test("the link round-trips and every number is checked against the seed's own sky", () => {
  assert.deepEqual(parseCard(cardHash(sample)), sample);
  assert.equal(cardHash({ ...sample, name: "" }), "s=4242&t=310&l=5&c=9&r=4&h=0");
  const wave = makeWave(4242, 5);
  assert.equal(cardStars(sample), starsOf(wave, 9, 0));
  for (const state of ["", "#result", "s=0&t=10&l=1", "s=1000000000&t=10&l=1", "s=abc&t=10&l=1", "s=7&t=-1&l=1", "s=7&t=10.5&l=1", "s=7&t=10&l=0", "s=7&t=10&l=21",
    "s=7&t=10&l=01", "s=7&t=10", "s=7&t=10&l=1&h=4", "s=7&t=10&l=1&c=-1", "s=7&t=10&l=1&c=99", "s=7&t=10&l=1&r=99", "s=7&t=9999&l=1", "s=7&t=10&l=1&r=3",
    "s=7&t=10&l=1&c=%3Cscript%3E", `s=7&t=10&l=1&n=${"x".repeat(700)}`]) {
    assert.equal(share.normalize(state), null, state);
  }
  assert.equal(share.normalize("n=রাফি&h=0&r=4&c=9&l=5&t=310&s=4242"), cardHash(sample));
  assert.equal(parseCard(`s=7&t=10&l=1&n=${encodeURIComponent("ক".repeat(50))}`)?.name.length, 20);
  assert.equal(share.preview("s=7&t=60&l=1").title, "এক বন্ধু কাগজের প্লেনে ৬০ পয়েন্ট করেছে। তুমি পারবে?");
  assert.equal(previewTitle(sample), "রাফি কাগজের প্লেনে ৩১০ পয়েন্ট করেছে। তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
});

test("lines: kind comparisons, exact near misses, and the card's human line", () => {
  assert.equal(versusLine(320, 300, "রাফি"), "রাফির চেয়ে ২০ পয়েন্ট বেশি!");
  assert.equal(versusLine(300, 300, "রাফি"), "সমান সমান! দুজনেরই ৩০০ পয়েন্ট।");
  assert.equal(versusLine(280, 300, ""), "আর একটু হলেই! বন্ধুর চেয়ে মাত্র ২০ পয়েন্ট কম।");
  assert.match(versusLine(100, 300, "মিম"), /মিম এগিয়ে, ২০০ পয়েন্ট/);
  assert.equal(nearLine({ ...sample, popped: 7 }, 9, 0), "আর ২টা মেঘ ফাটালে আরেকটা তারা।");
  assert.equal(nearLine({ ...sample, hits: 1 }, 9, 0), "একবারও না ভিজলে ৩ তারা। এবার ভিজেছ ১ বার।");
  assert.equal(nearLine({ ...sample, hits: 3 }, 9, 12), "লেভেল শেষ হতে আর ১২ সেকেন্ড বাকি ছিল।");
  assert.equal(nearLine(sample, 9, 0), "");
  assert.match(humanLine({ ...sample, hits: 3 }, 9), /তিনবার ভিজে/);
  assert.notEqual(humanLine(sample, 9), humanLine({ ...sample, popped: 2 }, 9));
  assert.match(friendBanner(sample), /^রাফি লেভেল ৫-এ ৩১০ পয়েন্ট/);
  assert.match(caption(sample), /একবারও ভিজিনি/);
  assert.equal(bn(20), "২০");
});

test("content meets the SEO limits", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("প্লেন গেম"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  const copy = JSON.stringify(site) + JSON.stringify(share.preview(cardHash(sample))) + LEVELS.map(level => level.news).join(" ");
  assert.doesNotMatch(copy, /টাকা জিত|বাজি|জুয়া|আপনি|করুন|গুলি|বন্দুক|শত্রু|বিস্ফোরণ/);
});
