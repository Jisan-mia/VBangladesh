import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import {
  BONUS, GOOD_SWAY, LEVEL_COUNT, LEVELS, NUDGE_GAP, PICK_SPIN, PICK_STEADY, badgesOf, canPick, lean, makeSurface, newGame, nextMark, nudge,
  pickUp, readBadges, scoreOf, starsOf, step, swipeThrow, throwTop, WIND_STRAIGHT, windPower, type Game,
} from "../lib/game";
import { MAX_SCORE, bandOf, cardHash, caption, friendBanner, humanLine, parseCard, previewTitle, secs, stageLine, versusLine, type Card } from "../lib/result";
import { share } from "../share";

const DT = 1 / 60;
type Player = { power: number; straight: number; taps: "none" | "timed" | "spam"; pick?: boolean };

/** A headless spin: throw, then step the pure state with scripted taps until it stops. */
function spin(seed: number, level: number, player: Player) {
  const game = newGame(seed, level);
  throwTop(game, player.power, player.straight);
  let next = 0.3, steps = 0;
  while (game.phase === "spin" && steps++ < 60 * 200) {
    step(game, DT);
    if (player.taps === "timed" && game.wobble > 0.3 && Math.abs(lean(game)) > 0.93) nudge(game);
    if (player.taps === "spam" && game.t > next) { nudge(game); next = game.t + 0.25; }
    if (player.pick && canPick(game) && game.omega < 0.12) pickUp(game);
  }
  return game;
}
const fingerprint = (game: Game) => [game.phase, game.t, game.omega, game.wobble, game.nudges, game.goodNudges, game.bonus, game.fall].join("|");
const GOOD: Player = { power: 0.95, straight: 0.92, taps: "timed" };

test("the same seed lays the same surface, and the same seed plus the same input gives the same spin", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.deepEqual(makeSurface(48213, level), makeSurface(48213, level));
  assert.notDeepEqual(makeSurface(1, 3).bumps, makeSurface(2, 3).bumps);
  assert.equal(fingerprint(spin(777, 6, GOOD)), fingerprint(spin(777, 6, GOOD)));
  assert.equal(fingerprint(spin(777, 9, { power: 0.7, straight: 0.6, taps: "spam" })), fingerprint(spin(777, 9, { power: 0.7, straight: 0.6, taps: "spam" })));
  assert.notEqual(fingerprint(spin(777, 9, GOOD)), fingerprint(spin(778, 9, GOOD)), "pebbles and gusts differ by seed");
});

test("every surface gives a clean start: no bump in the first 2 seconds, and level 1 has none at all", () => {
  for (let seed = 1; seed < 300; seed++) for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { bumps } = makeSurface(seed * 7919, level);
    assert.ok(bumps.every(bump => bump.at >= 2), `seed ${seed} level ${level}`);
    if (level === 1) assert.equal(bumps.length, 0);
  }
});

test("a harder, straighter throw spins longer and steadier", () => {
  const weak = newGame(5), strong = newGame(5), crooked = newGame(5);
  throwTop(weak, 0.2, 0.9); throwTop(strong, 1, 0.9); throwTop(crooked, 1, 0.2);
  assert.ok(strong.omega > weak.omega);
  assert.ok(crooked.wobble > strong.wobble);
  assert.equal(throwTop(strong, 1, 1), false, "one throw per spin");
  assert.ok(spin(5, 1, { power: 1, straight: 0.9, taps: "none" }).t > spin(5, 1, { power: 0.2, straight: 0.9, taps: "none" }).t);
});

test("the swipe: down and fast is strong, sideways is crooked, up or tiny is no throw", () => {
  const flick = swipeThrow(0, 0.6, 0.12, null)!;
  assert.ok(flick.power > 0.95 && flick.straight > 0.99);
  const slow = swipeThrow(0, 0.4, 0.8, null)!;
  assert.ok(slow.power < 0.1);
  assert.ok(swipeThrow(0.3, 0.5, 0.12, null)!.straight < 0.6, "a slanted pull is less straight");
  assert.ok(swipeThrow(0, 0.5, 0.12, null, 0.2)!.straight < 0.8, "a wobbly path is less straight");
  assert.ok(swipeThrow(0, 0.5, 0.9, { dy: 0.3, seconds: 0.08 })!.power > 0.9, "a late flick after a slow start counts");
  assert.equal(swipeThrow(0, -0.5, 0.1, null), null);
  assert.equal(swipeThrow(0, 0.05, 0.1, null), null);
  assert.equal(swipeThrow(0.5, 0.3, 0.1, null), null, "mostly sideways");
  assert.equal(swipeThrow(Number.NaN, Number.NaN, 0.1, null), null);
});

test("the hold-to-wind bar fills, then slips back", () => {
  assert.equal(windPower(0), 0);
  assert.ok(Math.abs(windPower(0.8) - 1) < 1e-9);
  assert.ok(Math.abs(windPower(1.2) - 0.5) < 1e-9);
  assert.ok(Math.abs(windPower(1.6)) < 1e-9);
});

test("nudges: at the lean's edge steadies, at the centre knocks, and a hammered button counts once", () => {
  const game = newGame(9); throwTop(game, 0.9, 0.5);
  game.sway = Math.PI / 2; const before = game.wobble;
  assert.equal(nudge(game), "good");
  assert.ok(Math.abs(game.wobble - before / 2) < 1e-9);
  assert.equal(nudge(game), null, "too soon after the last tap");
  game.t += NUDGE_GAP; game.sway = 0; const steady = game.wobble;
  assert.equal(nudge(game), "miss");
  assert.ok(game.wobble > steady);
  assert.equal(game.combo, 0);
  game.t += NUDGE_GAP; game.sway = Math.asin(0.7);
  assert.equal(nudge(game), "ok");
  assert.ok(Math.abs(Math.sin(Math.asin(GOOD_SWAY))) >= GOOD_SWAY - 1e-12);
});

test("timed taps beat no taps, and hammering does worse than timing", () => {
  for (const level of [1, 4, 7, 9]) {
    let timed = 0, idle = 0, spam = 0;
    for (let seed = 1; seed <= 40; seed++) {
      timed += scoreOf(spin(seed * 31, level, GOOD));
      idle += scoreOf(spin(seed * 31, level, { ...GOOD, taps: "none" }));
      spam += scoreOf(spin(seed * 31, level, { ...GOOD, taps: "spam" }));
    }
    assert.ok(timed > idle, `level ${level}: timed ${timed} idle ${idle}`);
    assert.ok(timed > spam * 1.2, `level ${level}: timed ${timed} spam ${spam}`);
  }
});

test("the palm trick: only late, only when steady, and it adds the bonus", () => {
  const early = newGame(3); throwTop(early, 1, 1);
  assert.equal(canPick(early), false);
  assert.equal(pickUp(early), null);
  const steady = newGame(3); throwTop(steady, 0.1, 1); steady.omega = PICK_SPIN - 0.01; steady.wobble = PICK_STEADY - 0.1; steady.t = 12.34;
  assert.equal(pickUp(steady), true);
  assert.equal(steady.phase, "palm");
  assert.equal(scoreOf(steady), 123 + BONUS);
  const shaky = newGame(3); throwTop(shaky, 0.1, 1); shaky.omega = 0.1; shaky.wobble = PICK_STEADY + 0.05;
  assert.equal(pickUp(shaky), false);
  assert.equal(shaky.phase, "fallen");
  assert.equal(shaky.fall, "drop");
  assert.equal(shaky.bonus, 0);
});

test("headless runs end sanely: every spin stops, with a plausible time", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (let seed = 1; seed < 60; seed++) {
    const rng = makeRng(seed);
    const game = spin(seed * 101, level, { power: rng(), straight: rng(), taps: rng() > 0.5 ? "timed" : "none", pick: rng() > 0.5 });
    assert.ok(game.phase === "fallen" || game.phase === "palm", `level ${level} seed ${seed} ended`);
    assert.ok(game.t > 2 && game.t < 60, `level ${level} seed ${seed}: ${game.t}`);
    assert.ok(scoreOf(game) <= MAX_SCORE);
  }
});

test("every level is fair: a good player 3-stars it on every seed, and level 1 is cleared by the weakest throw", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (let seed = 1; seed <= 150; seed++) {
    const good = spin(seed * 7919, level, GOOD);
    assert.equal(starsOf(scoreOf(good), level), 3, `level ${level} seed ${seed}: ${scoreOf(good)}`);
    // The hold-to-wind button (no swipe) can 3-star it too.
    const held = spin(seed * 7919, level, { ...GOOD, power: windPower(0.78), straight: WIND_STRAIGHT });
    assert.equal(starsOf(scoreOf(held), level), 3, `hold: level ${level} seed ${seed}: ${scoreOf(held)}`);
  }
  for (let seed = 1; seed <= 150; seed++) assert.ok(starsOf(scoreOf(spin(seed, 1, { power: 0, straight: 0, taps: "none" })), 1) >= 1, `seed ${seed}`);
  // Each level asks a little more: the 3-star mark never needs less play than a casual throw gives.
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(starsOf(scoreOf(spin(11, level, { power: 0.6, straight: 0.6, taps: "none" })), level) < 3);
});

test("star thresholds and the next mark", () => {
  const [one, two, three] = LEVELS[0].stars;
  assert.equal(starsOf(one * 10 - 1, 1), 0);
  assert.equal(starsOf(one * 10, 1), 1);
  assert.equal(starsOf(two * 10, 1), 2);
  assert.equal(starsOf(three * 10, 1), 3);
  assert.equal(nextMark(0, 1), one * 10);
  assert.equal(nextMark(one * 10, 1), two * 10);
  assert.equal(nextMark(three * 10, 1), 0);
  for (const level of LEVELS) assert.ok(level.stars[0] < level.stars[1] && level.stars[1] < level.stars[2]);
});

test("progress goes through the kit's readLevels and recordLevel", () => {
  let stars = readLevels("{\"1\":3,\"2\":1,\"x\":2,\"12\":3,\"3\":7}", LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, starsOf(LEVELS[1].stars[2] * 10, 2));
  assert.equal(stars[2], 3);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("badges: milestones from the run, and only fixed ids survive storage", () => {
  assert.deepEqual(badgesOf(99, false, 4, 3), []);
  assert.deepEqual(badgesOf(205, true, 5, 9), ["t10", "t20", "palm", "combo5"]);
  assert.deepEqual(badgesOf(120, false, 0, 0), ["t10", "still"]);
  assert.deepEqual(readBadges("[\"palm\",\"evil\",\"t10\",\"palm\"]"), ["t10", "palm"]);
  assert.deepEqual(readBadges("{\"t10\":1}"), []);
  assert.deepEqual(readBadges("<script>"), []);
});

test("score bands, words and the friend comparison", () => {
  assert.equal(secs(184), "১৮.৪");
  assert.equal(secs(50), "৫.০");
  assert.deepEqual([0, 59, 60, 119, 120, 179, 180, 249, 250].map(bandOf), ["short", "short", "warm", "warm", "good", "good", "great", "great", "master"]);
  assert.ok(humanLine(300).length > 0);
  assert.equal(versusLine(200, 180, "রাফি"), "রাফির চেয়ে ২.০ সেকেন্ড বেশি!");
  assert.equal(versusLine(180, 180, "রাফি"), "সমান সমান! দুজনেরই ১৮.০ সেকেন্ড।");
  assert.match(versusLine(170, 180, "রাফি"), /আর একটু হলেই/);
  assert.match(versusLine(100, 180, ""), /^বন্ধু এগিয়ে/);
  assert.match(stageLine(30, 1), /আর ১.০ সেকেন্ড লাগত/);
  assert.match(stageLine(200, 1), /৩ তারা/);
});

const sample: Card = { seed: 48213, level: 3, score: 184 + BONUS, palm: true, badges: ["t10", "palm", "combo5"], name: "রাফি" };

test("challenge links round-trip, and the preview is personal", () => {
  const hash = cardHash(sample);
  assert.deepEqual(parseCard(`#${hash}`), sample);
  assert.equal(previewTitle(sample), "রাফির লাটিম ২৩.৪ সেকেন্ড ঘুরেছে। তুমি পারবে?");
  assert.equal(friendBanner(sample), "রাফির লাটিম ২৩.৪ সেকেন্ড ঘুরেছে। একই উঠান, এবার তোমার পালা।");
  assert.match(caption(sample), /মাটির উঠানে/);
  assert.match(caption({ ...sample, level: 5 }), /পাকা মেঝেতে/);
  const plain: Card = { seed: 7, level: 1, score: 62, palm: false, badges: [], name: "" };
  assert.equal(cardHash(plain), "s=7&t=62&l=1");
  assert.deepEqual(parseCard(cardHash(plain)), plain);
});

test("share refuses hostile or impossible links and caps names", () => {
  for (const state of ["", "#result", "s=0&t=10&l=1", "s=1000000000&t=10&l=1", "s=abc&t=10&l=1", "s=7&t=-1&l=1", "s=7&t=1000&l=1", "s=7&t=10.5&l=1",
    "s=7&t=10&l=0", "s=7&t=10&l=10", "s=7&t=10&l=01", "s=7&t=10&l=1&p=2", "s=7&t=40&l=1&p=1", "s=7&t=120&l=1&b=t20", "s=7&t=120&l=1",
    "s=7&t=120&l=1&b=t10-t10", "s=7&t=120&l=1&b=t10-evil", "s=7&t=120&l=1&b=t10-palm", "s=7&t=60&l=1&p=1&b=t10", "s=7&t=10&l=1&b=%3Cscript%3E",
    `s=7&t=10&l=1&n=${"x".repeat(700)}`]) {
    assert.equal(share.normalize(state), null, state);
  }
  assert.equal(share.normalize("n=রাফি&b=combo5-t10&t=120&l=2&s=48213"), "s=48213&t=120&l=2&b=t10-combo5&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("s=7&t=999&l=9&b=t10-t20-t30"), "s=7&t=999&l=9&b=t10-t20-t30");
  assert.equal(parseCard(`s=7&t=10&l=1&n=${encodeURIComponent("ক".repeat(50))}`)?.name.length, 20);
  assert.equal(share.preview("s=7&t=62&l=1").title, "এক বন্ধুর লাটিম ৬.২ সেকেন্ড ঘুরেছে। তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
});

test("content meets the SEO limits", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("লাটিম"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  const copy = JSON.stringify(site) + JSON.stringify(share.preview(cardHash(sample)));
  assert.doesNotMatch(copy, /টাকা জিত|বাজি|জুয়া|আপনি|করুন/);
});
