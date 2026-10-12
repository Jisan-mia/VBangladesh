import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  bannerNote, caption, clearLine, compareLine, feat, hitWord, humanLine, lossLine, nearMissLine, newsLine, parseShared, previewTitle, sharedHash, tallyLine,
} from "../lib/link";
import {
  closest, makeBugs, makeNight, needZaps, specOf, starsOf, step, swing, toDawn,
  BIT, ENTER, FLY, GONE, HIT_R, LEVEL_COUNT, MAX_BITES, MIN_DIVE, NEAR_R, NET_TOP, PILLOW_X, WAIT, ZAPPED, type Night,
} from "../lib/night";
import { bite, crackle, lightSwitch, swish, whine } from "../lib/sound";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const seeds = Array.from({ length: 12 }, (_, index) => 1 + index * 7919);
const DT = 1 / 60;

/**
 * A whole night with a scripted player, stepping the same pure rules the page uses.
 * Every `react` seconds it swings at the mosquito nearest what it's after (what a person watches), aiming where it was
 * `lag` seconds ago (hands are slower than eyes) with up to `error` units of wobble.
 */
function play(level: number, seed: number, { react = 0.35, lag = 0.15, error = 4, idle = false } = {}) {
  const night = makeNight(level, seed), rng = makeRng(seed ^ 0x2545f491);
  let wait = 0;
  while (!night.over) {
    step(night, DT);
    wait -= DT;
    assert.ok(night.t < 120, "a night always ends");
    if (idle || wait > 0) continue;
    let target = -1, nearest = Infinity;
    for (let i = 0; i < night.bugs.length; i++) {
      if (night.state[i] !== FLY || night.t - night.bugs[i].at < 0.3) continue;
      const d = Math.hypot(night.x[i] - night.bugs[i].tx, night.y[i] - night.bugs[i].ty);
      if (d < nearest) { nearest = d; target = i; }
    }
    if (target < 0) continue;
    const vx = (night.x[target] - night.px[target]) / DT;
    swing(night, night.x[target] - vx * lag + (rng() - 0.5) * 2 * error, night.y[target] + (rng() - 0.5) * 2 * error);
    wait = react;
  }
  return night;
}

test("twenty nights, each a little harder: more mosquitoes, faster, longer, never a jump", () => {
  for (const level of levels.slice(1)) {
    const before = specOf(level - 1), now = specOf(level);
    assert.ok(now.count > before.count && now.count - before.count <= 3, `night ${level} count`);
    assert.ok(now.speed > before.speed && now.length >= before.length, `night ${level} pace`);
    assert.ok(now.loiter[0] <= before.loiter[0] && now.swarm >= before.swarm, `night ${level} pressure`);
  }
  assert.equal(specOf(1).swarm, 1);
  assert.equal(specOf(1).entries, 1);
  assert.deepEqual(levels.filter(level => specOf(level).guard === "net"), [5, 8, 13, 15, 18]);
  assert.deepEqual(specOf(5).holes, [180]);
  assert.equal(specOf(0).count, specOf(1).count, "out-of-range nights clamp");
});

test("same seed, same night: every mosquito's path and timing replay exactly", () => {
  for (const level of [1, 7, 13, 20]) {
    assert.deepEqual(makeBugs(level, 4242), makeBugs(level, 4242));
    assert.notDeepEqual(makeBugs(level, 4242), makeBugs(level, 4243));
    const a = makeNight(level, 99), b = makeNight(level, 99);
    for (let i = 0; i < 600; i++) { step(a, DT); step(b, DT); }
    assert.deepEqual([...a.x], [...b.x]);
    assert.deepEqual([...a.state], [...b.state]);
  }
});

test("spawns are fair: every mosquito is on screen for seconds before it can bite, and swarms stay inside one swing", () => {
  for (const level of levels) for (const seed of seeds) {
    const spec = specOf(level), bugs = makeBugs(level, seed);
    assert.equal(bugs.length, spec.count);
    for (const bug of bugs) {
      assert.ok(bug.dive >= MIN_DIVE - 1e-9, "a visible dive");
      assert.ok(bug.bite - bug.at >= ENTER + spec.loiter[0] + MIN_DIVE - 1e-9, `night ${level}: ${bug.bite - bug.at}s on screen`);
      assert.ok(bug.bite - bug.at >= 2.6, "time to react, even on the last night");
      assert.ok(bug.at >= 0.4 && bug.at <= spec.length, "arrives during the night");
      assert.ok(Math.hypot(bug.ox, bug.oy) <= HIT_R - 10, "a swarm member stays within one bat head");
      if (spec.guard === "net") assert.ok(spec.holes.includes(bug.tx) && bug.ty === NET_TOP, "net nights head for a hole");
      else assert.equal(bug.tx, PILLOW_X);
    }
    // Never more than a handful of separate threats landing at once.
    const bites = bugs.filter(bug => bug.swarm < 0).map(bug => bug.bite).sort((a, b) => a - b);
    for (let i = 3; i < bites.length; i++) assert.ok(bites[i] - bites[i - 3] > 0.9, `night ${level}: four lone bites within a second`);
  }
});

test("a swing zaps everything under the bat head, misses build no streak, near misses are told", () => {
  const night = makeNight(4, 7);
  while (!night.bugs.some((_, i) => night.state[i] === FLY)) step(night, DT);
  for (let i = 0; i < 30; i++) step(night, DT);
  const i = night.state.indexOf(FLY);
  const x = night.x[i], y = night.y[i];
  const miss = swing(night, x + NEAR_R + 40, y + NEAR_R + 40);
  assert.equal(miss.hits, 0);
  assert.equal(night.combo, 0);
  const near = swing(night, x + HIT_R + 6, y);
  assert.equal(near.hits === 0 ? near.near : true, true);
  const hit = swing(night, x, y);
  assert.ok(hit.hits >= 1);
  assert.equal(night.state[i], ZAPPED);
  assert.equal(night.zaps, hit.hits + (near.hits || 0));
  assert.equal(night.combo, hit.hits);
  assert.equal(swing(night, x, y).hits, 0, "a zapped mosquito can't be zapped twice");
  assert.equal(night.combo, 0);
});

test("bites, a lost night, dawn and the last mosquito", () => {
  const idle = play(1, 5, { idle: true });
  assert.equal(idle.over, "lost");
  assert.equal(idle.bites, MAX_BITES);
  assert.ok(idle.t < specOf(1).length, "idle loses before dawn");
  assert.ok(toDawn(idle) > 0);
  const won = play(1, 5);
  assert.equal(won.over, "won");
  assert.equal(won.zaps + won.bites + [...won.state].filter(s => s === GONE).length, won.bugs.length, "every mosquito is accounted for");
  assert.ok([...won.state].every(s => s === ZAPPED || s === BIT || s === GONE));
  assert.equal(step(won, DT), 0, "a finished night stays finished");
  const n: Night = makeNight(2, 3);
  assert.equal(n.state[0], WAIT);
  assert.equal(closest(n).index, -1);
});

test("headless nights: a steady player three-stars every night, a slow one clears the early ones, nobody idles through", () => {
  for (const level of levels) {
    for (const seed of seeds.slice(0, 6)) {
      const steady = play(level, seed);
      assert.equal(starsOf(level, steady.zaps, steady.bites), 3, `night ${level} seed ${seed}: ${steady.zaps}/${steady.bugs.length}, ${steady.bites} bites`);
      assert.equal(play(level, seed, { idle: true }).over, "lost");
      if (level <= 5) {
        const slow = play(level, seed, { react: 0.9, lag: 0.4, error: 16 });
        assert.ok(starsOf(level, slow.zaps, slow.bites) >= 1, `night ${level} is gentle`);
      }
    }
  }
});

test("stars: ★ for dawn, ★ for three in four zapped, ★ for no bite", () => {
  const need = needZaps(7);
  assert.equal(need, Math.ceil(specOf(7).count * 0.75));
  assert.equal(starsOf(7, 0, MAX_BITES), 0);
  assert.equal(starsOf(7, 0, 2), 1);
  assert.equal(starsOf(7, need, 2), 2);
  assert.equal(starsOf(7, need - 1, 0), 2);
  assert.equal(starsOf(7, need, 0), 3);
  assert.equal(starsOf(7, specOf(7).count, 1), 2);
});

test("level progress goes through readLevels / recordLevel", () => {
  let stars = readLevels(null, LEVEL_COUNT);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 1);
  stars = recordLevel(stars, 1, starsOf(1, 8, 0));
  stars = recordLevel(stars, 1, starsOf(1, 2, 2));
  assert.equal(stars[1], 3, "the better result stays");
  stars = recordLevel(stars, 2, 2);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(totalStars(stars), 5);
  assert.deepEqual(readLevels(JSON.stringify({ 1: 3, 21: 3, 4: 9, x: 2 }), LEVEL_COUNT), { 1: 3 });
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("lines: exact, kind, and in তুমি", () => {
  assert.equal(levels.map(clearLine).length, new Set(levels.map(clearLine)).size, "a different morning each night");
  assert.equal(new Set(levels.map(newsLine)).size, LEVEL_COUNT);
  assert.match(newsLine(19), /৩৭টা/);
  assert.equal(specOf(19).count, 37);
  assert.match(newsLine(20), /৪০টা/);
  assert.equal(specOf(20).count, 40);
  assert.equal(nearMissLine(7, needZaps(7) - 2, 1), "আর ২টা মশা মারলে আরেকটা তারা। একটাও কামড় না খেলে আরেকটা।");
  assert.equal(nearMissLine(7, needZaps(7), 1), "একটাও কামড় না খেলে আরেকটা তারা।");
  assert.equal(nearMissLine(7, needZaps(7), 0), "");
  assert.match(lossLine(3, 6), /আর ৬ সেকেন্ড/);
  assert.match(lossLine(5, 0), /ফুটো/);
  assert.match(humanLine({ level: 5, zaps: 14, bites: 0 }), /মশারি/);
  assert.match(humanLine({ level: 20, zaps: 30, bites: 2 }), /২০ রাত/);
  assert.equal(tallyLine({ level: 7, zaps: 15, bites: 1 }), "১৭টা মশার ১৫টা ব্যাটে · কামড় ১টা");
  assert.equal(compareLine({ zaps: 15, bites: 0 }, { zaps: 12, bites: 0 }, "রাফি"), "রাফির চেয়ে ৩টা বেশি!");
  assert.match(compareLine({ zaps: 12, bites: 0 }, { zaps: 12, bites: 2 }, "রাফি"), /কামড় কম/);
  assert.match(compareLine({ zaps: 11, bites: 0 }, { zaps: 12, bites: 0 }, ""), /আর একটু হলেই! বন্ধু/);
  assert.match(compareLine({ zaps: 4, bites: 0 }, { zaps: 12, bites: 0 }, "রাফি"), /৮টা এগিয়ে/);
  assert.equal(hitWord(1, 1), "চট!");
  assert.equal(hitWord(3, 5), "এক চাপে ৩টা!");
  assert.equal(hitWord(1, 4), "টানা ৪");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  const all = [...levels.flatMap(level => [clearLine(level), newsLine(level), lossLine(level, 3)]), caption({ level: 3, zaps: 9, bites: 0 }), bannerNote("")].join(" ");
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|রক্ত|ডেঙ্গু/);
});

test("a challenge link round-trips and refuses forged or hostile input", () => {
  const shared = { level: 7, seed: 4242, zaps: 15, bites: 1, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, "s=4242&t=15&l=7&b=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(previewTitle(shared), "রাফি রাত ৭-এ ১৫টা মশা মেরেছে। তুমি পারবে?");
  assert.equal(feat({ ...shared, name: "" }), "এক বন্ধু রাত ৭-এ ১৫টা মশা মেরেছে");
  for (const bad of [
    "s=4242&t=17&l=7&b=1", // more zaps than mosquitoes, counting the bite
    "s=4242&t=5&l=7&b=3", // a lost night
    "s=4242&t=5&l=21&b=0", "s=4242&t=5&l=0&b=0", "s=4242&t=5&l=07&b=0", "s=4242&t=5&l=7", "s=4242&t=5&b=0",
    "s=0&t=5&l=7&b=0", "s=4242&t=-1&l=7&b=0", "s=4242&t=1.5&l=7&b=0", "s=4242&t=5&l=7&b=-1", "s=4242&t=999&l=20&b=0",
    `s=4242&t=5&l=7&b=0&n=${"x".repeat(700)}`, "", "junk",
  ]) assert.equal(parseShared(bad), null, bad);
  const long = parseShared(`s=1&t=3&l=1&b=0&n=${encodeURIComponent("রাফি‮\u0007" + "ক".repeat(40))}`);
  assert.ok(long && [...long.name].length <= 20 && !/[‮\u0007]/.test(long.name));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.preview(hash).title, previewTitle(shared));
  assert.match(caption(shared), /তুমি কয়টা মারবে\?$/);
});

test("content meets the SEO limits, speaks তুমি, and carries the dengue tip exactly once, calmly", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("মশা মারার গেম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /চড়ুই তাড়াও|ছিপ ফেলো/.test(item.answer)));
  const tip = site.faq.filter(item => /জমা পানি/.test(item.answer));
  assert.equal(tip.length, 1);
  assert.match(tip[0].answer, /মশারি টানাও/);
  const text = JSON.stringify(site);
  assert.equal(text.match(/জমা পানি/g)?.length, 1, "the tip appears once on the page");
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|ডেঙ্গু|জ্বর|মৃত্যু|বিপদ|সাবধান|ভয়|অসাধারণ|দারুণ/);
  assert.match(site.privacy.join(" "), /সিড/);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { crackle(3); swish(); bite(); lightSwitch(); const w = whine(); w.set(0.7, 0.2); w.set(0, 0); w.stop(); w.stop(); });
});
