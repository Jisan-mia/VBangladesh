import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { aimFrom, powerFrom, spotShot, swipeShot, GH, GW, GX, GY, SPOT_X, SPOT_Y } from "../lib/aim";
import {
  bannerNote, caption, clearLine, compareLine, feat, humanLine, kickLine, lossLine, nearMissLine, parseShared, previewTitle, realWin, sharedHash,
} from "../lib/link";
import {
  decided, finalScores, makePlans, nextSide, resolveSave, resolveShot, roundOf, shotTarget, starsOf, suddenDeath, tally, KICKS, MAX_ROUNDS,
  type Kick, type Plans, type Shot, type ShotPlan, type Zone,
} from "../lib/match";
import { bambooKnock, crowd, gloveSave, kickThump, murmur, netSwish, whistle } from "../lib/sound";
import { opponentOf, roundName, stageOf, LEVEL_COUNT, OPPONENTS } from "../lib/teams";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const t = (us: number, them: number, usTaken: number, themTaken: number) => ({ us, them, usTaken, themTaken });

/** A whole match with scripted players, stepping the same pure rules the page uses. */
function playMatch(level: number, seed: number, shooter: (round: number) => Shot, keeper: (plan: ShotPlan, round: number) => Zone | null) {
  const plans = makePlans(level, seed), kicks: Kick[] = [];
  while (!decided(tally(kicks))) {
    const round = roundOf(kicks) % MAX_ROUNDS;
    const result = nextSide(kicks) === 0 ? resolveShot(level, plans.keeper[round], shooter(round)) : resolveSave(plans.shots[round], keeper(plans.shots[round], round));
    kicks.push({ side: nextSide(kicks), scored: result.outcome === "goal", result });
    assert.ok(kicks.length < MAX_ROUNDS * 2, "a match always ends");
  }
  return { kicks, ...tally(kicks) };
}

/** A player with a steady hand: low or high corners with a little seeded wobble, and a keeper who mostly reads the lean. */
function skilled(seed: number, wobble = 0.07, reads = 0.85) {
  const rng = makeRng(seed ^ 0x5bd1e995), noise = () => (rng() + rng() + rng() - 1.5) * wobble * 2;
  return {
    shooter: (): Shot => { const side = rng() < 0.5 ? -1 : 1, high = rng() < 0.5; return { x: side * 0.84 + noise(), y: (high ? 0.8 : 0.14) + noise(), power: 0.78 + noise(), curve: 0.25 }; },
    keeper: (plan: ShotPlan): Zone => rng() < reads ? ((plan.lean + 1) as Zone) : (Math.floor(rng() * 3) as Zone),
  };
}

test("eight made-up teams, two per stage, each a little sharper than the last", () => {
  assert.equal(LEVEL_COUNT, 8);
  assert.deepEqual(levels.map(stageOf), ["পাড়া", "পাড়া", "থানা", "থানা", "জেলা", "জেলা", "জাতীয়", "জাতীয়"]);
  assert.equal(roundName(1), "পাড়ার ম্যাচ"); assert.equal(roundName(4), "থানার ম্যাচ"); assert.equal(roundName(7), "জাতীয় সেমিফাইনাল"); assert.equal(roundName(8), "জাতীয় ফাইনাল");
  for (let i = 1; i < OPPONENTS.length; i++) {
    const [a, b] = [OPPONENTS[i - 1], OPPONENTS[i]];
    assert.ok(b.keeper.read >= a.keeper.read && b.keeper.reach > a.keeper.reach, `keeper ${i + 1}`);
    assert.ok(b.shooter.miss < a.shooter.miss && b.shooter.honest <= a.shooter.honest && b.shooter.tellAt > a.shooter.tellAt, `shooter ${i + 1}`);
  }
  assert.equal(new Set(OPPONENTS.map(o => o.name)).size, 8);
  assert.equal(new Set(OPPONENTS.map(o => o.kit)).size, 8);
});

test("same seed, same match: keeper guesses and opponent kicks replay exactly", () => {
  const a = makePlans(5, 424242), b = makePlans(5, 424242), c = makePlans(5, 424243);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.equal(a.keeper.length, MAX_ROUNDS); assert.equal(a.shots.length, MAX_ROUNDS);
  // The plans don't depend on what the player does: two different players meet the same keeper and kicks.
  const one = skilled(1), two = skilled(2, 0.2, 0.3);
  const same = skilled(1);
  const first = playMatch(5, 424242, one.shooter, one.keeper), again = playMatch(5, 424242, same.shooter, same.keeper);
  assert.deepEqual(first.kicks, again.kicks);
  // Whenever the keeper doesn't read the kick, he dives where the seed says, whoever is shooting.
  const other = playMatch(5, 424242, two.shooter, two.keeper);
  for (const match of [first, other]) match.kicks.forEach((kick, i) => {
    const plan = a.keeper[Math.floor(i / 2)];
    if (kick.side === 0 && plan.u >= opponentOf(5).keeper.read) assert.equal(kick.result.keeper, plan.zone);
  });
});

test("a run-up lean tells the truth at the honest rate and never points nowhere on a lie", () => {
  let honest = 0, total = 0;
  for (let seed = 1; seed <= 200; seed++) for (const plan of makePlans(8, seed).shots) {
    total++;
    if (plan.lean === plan.zone - 1) honest++;
    if (plan.corner) assert.notEqual(plan.zone, 1, "corners are only on the sides");
  }
  const rate = honest / total;
  assert.ok(Math.abs(rate - opponentOf(8).shooter.honest) < 0.04, String(rate));
  for (const plan of makePlans(1, 99).shots) assert.equal(plan.lean, plan.zone - 1, "the first team never fakes");
});

test("shootout rules: five each, early finish, sudden death", () => {
  assert.equal(decided(t(0, 0, 0, 0)), false);
  assert.equal(decided(t(3, 0, 3, 2)), false, "they still have three kicks");
  assert.equal(decided(t(3, 0, 3, 3)), true, "two left can't make up three");
  assert.equal(decided(t(0, 3, 3, 3)), true);
  assert.equal(decided(t(4, 3, 5, 4)), false, "their last kick could level it");
  assert.equal(decided(t(4, 4, 5, 5)), false, "level after five: sudden death");
  assert.equal(decided(t(5, 4, 5, 5)), true);
  assert.equal(decided(t(5, 4, 6, 5)), false, "sudden death waits for their reply");
  assert.equal(decided(t(5, 5, 6, 6)), false);
  assert.equal(decided(t(6, 5, 6, 6)), true);
  assert.equal(decided(t(5, 6, 6, 6)), true);
  const kicks = (n: number) => Array.from({ length: n }, () => ({ side: 0, scored: true, result: null })) as unknown as Kick[];
  assert.equal(nextSide(kicks(0)), 0); assert.equal(nextSide(kicks(3)), 1);
  assert.equal(roundOf(kicks(9)), 4); assert.equal(suddenDeath(kicks(9)), false); assert.equal(suddenDeath(kicks(10)), true);
});

test("only real shootout scores count as wins", () => {
  const finals = finalScores();
  for (const real of ["3-0", "4-1", "3-1", "4-2", "5-4", "3-2", "1-0", "0-1", "6-5", "12-11"]) assert.ok(finals.has(real), real);
  for (const fake of ["4-0", "5-0", "5-1", "9-0", "2-2", "7-5", "6-4"]) assert.ok(!finals.has(fake), fake);
  assert.ok(realWin(3, 0) && realWin(6, 5) && !realWin(0, 1) && !realWin(4, 0) && !realWin(31, 30));
});

test("stars by margin, and three is the most a shootout allows", () => {
  assert.equal(starsOf(1, 0), 1); assert.equal(starsOf(5, 4), 1); assert.equal(starsOf(4, 2), 2); assert.equal(starsOf(3, 0), 3); assert.equal(starsOf(4, 1), 3);
  assert.equal(starsOf(2, 3), 0); assert.equal(starsOf(2, 2), 0);
  const margins = [...finalScores()].map(score => score.split("-").map(Number)).map(([us, them]) => us - them);
  assert.equal(Math.max(...margins), 3);
});

test("our kick: frame, wide and over before the keeper; corners and curl beat him", () => {
  const plan = (zone: Zone, u = 0.99) => ({ u, zone });
  const shot = (x: number, y: number, power = 0.6, curve = 0): Shot => ({ x, y, power, curve });
  assert.equal(resolveShot(1, plan(1), shot(1.0, 0.5)).outcome, "post");
  assert.equal(resolveShot(1, plan(1), shot(-1.02, 0.3)).outcome, "post");
  assert.equal(resolveShot(1, plan(1), shot(0.3, 1.0)).outcome, "bar");
  assert.equal(resolveShot(1, plan(1), shot(1.3, 0.3)).outcome, "wide");
  assert.equal(resolveShot(1, plan(1), shot(0.2, 1.3)).outcome, "over");
  assert.equal(resolveShot(1, plan(1), shot(0.2, 0.9, 1)).outcome, "bar", "full power lifts a high shot onto the bar");
  assert.equal(resolveShot(1, plan(1), shot(0.2, 0.9, 0.8)).outcome !== "bar", true);
  // A soft kick straight at a keeper who stayed: saved. The same kick when he dives away: goal.
  assert.equal(resolveShot(1, plan(1), shot(0, 0.3, 0.3)).outcome, "saved");
  assert.equal(resolveShot(1, plan(0), shot(0, 0.3, 0.3)).outcome, "goal");
  // A keeper who reads you (u under his read rate) dives your way even if his free guess was elsewhere.
  assert.equal(resolveShot(8, plan(0, 0), shot(0.6, 0.3)).keeper, 2);
  // Top corner: the first keeper can't reach it even diving the right way; the final's keeper can, unless it's curled.
  assert.equal(resolveShot(1, plan(2, 0), shot(0.86, 0.85, 0.8)).outcome, "goal");
  assert.equal(resolveShot(8, plan(2, 0), shot(0.86, 0.85, 0.8)).outcome, "saved");
  assert.equal(resolveShot(8, plan(2, 0), shot(0.9, 0.86, 0.85, 0.8)).outcome, "goal");
});

test("their kick: the right dive saves, a top corner still goes in, misses miss", () => {
  const base: ShotPlan = { zone: 0, high: false, miss: false, missKind: 0, corner: false, lean: -1, jitter: 0.5 };
  assert.equal(resolveSave(base, 0).outcome, "saved");
  assert.equal(resolveSave(base, 2).outcome, "goal");
  assert.equal(resolveSave({ ...base, zone: 1 }, null).outcome, "saved", "staying put covers the middle");
  const corner = resolveSave({ ...base, corner: true }, 0);
  assert.equal(corner.outcome, "goal"); assert.equal(corner.close, true);
  assert.equal(resolveSave({ ...base, miss: true, missKind: 0 }, 2).outcome, "wide");
  assert.equal(resolveSave({ ...base, miss: true, missKind: 1 }, 2).outcome, "over");
  assert.equal(resolveSave({ ...base, miss: true, missKind: 2 }, 2).outcome, "post");
  for (let seed = 1; seed < 60; seed++) for (const plan of makePlans(6, seed).shots) {
    const { x, y } = shotTarget(plan);
    if (!plan.miss) assert.ok(Math.abs(x) < 0.95 && y > 0 && y < 0.96, `on target ${x},${y}`);
    else assert.ok(Math.abs(x) >= 0.95 || y > 1.08, `off target ${x},${y}`);
  }
});

test("a swipe becomes a kick: direction to the spot, flick to power, bow to curl", () => {
  // Finger from the ball to the top-left of the goal.
  const corner = aimFrom(GX - 0.8 * GW - SPOT_X, GY - 0.7 * GH - SPOT_Y)!;
  assert.ok(Math.abs(corner.x + 0.8) < 1e-9 && Math.abs(corner.y - 0.7) < 1e-9);
  // A short flick the same way: same side, along the grass.
  const short = aimFrom(-30, -60)!;
  assert.ok(short.x < -0.4 && short.y === 0.05);
  assert.equal(aimFrom(20, 30), null, "pulling down isn't a kick");
  assert.equal(aimFrom(80, -5), null, "nor is a sideways drag");
  assert.equal(powerFrom(0), 0.1); assert.equal(powerFrom(5), 1); assert.ok(powerFrom(0.5) > 0.3 && powerFrom(0.5) < 0.6);

  const path = (bow: number, ms: number) => {
    const xs: number[] = [], ys: number[] = [], ts: number[] = [];
    for (let i = 0; i <= 8; i++) { const k = i / 8; xs.push(SPOT_X - 90 * k + Math.sin(k * Math.PI) * bow); ys.push(SPOT_Y - 180 * k); ts.push(k * ms); }
    return swipeShot(xs, ys, ts, xs.length)!;
  };
  const flick = path(0, 120), drag = path(0, 1200);
  assert.ok(flick.power > 0.9 && drag.power < 0.3, `${flick.power} ${drag.power}`);
  assert.equal(flick.curve, 0);
  assert.ok(Math.abs(flick.x - drag.x) < 1e-9 && flick.x < -0.7);
  // Travelling up-left, a bow toward screen right is to the right of travel: positive curl.
  assert.ok(path(25, 150).curve > 0.15 && path(-25, 150).curve < -0.15);
  assert.equal(swipeShot([180, 182], [296, 290], [0, 10], 2), null, "too short");
  assert.equal(swipeShot([180], [296], [0], 1), null);
  const tap = spotShot(GX, GY - GH / 2, 2);
  assert.deepEqual(tap, { x: 0, y: 0.5, power: 1, curve: 0 });
});

test("headless matches end sanely, the first is easy, the final is hard but fair", () => {
  const rate = (level: number, player: (seed: number) => ReturnType<typeof skilled>, runs = 300) => {
    let wins = 0, three = 0;
    for (let seed = 1; seed <= runs; seed++) {
      const p = player(seed), m = playMatch(level, seed * 7919, p.shooter, p.keeper);
      assert.ok(realWin(Math.max(m.us, m.them), Math.min(m.us, m.them)), `${m.us}-${m.them} is a real score`);
      assert.ok(m.kicks.length >= 6, "at least three rounds");
      if (m.us > m.them) wins++;
      if (starsOf(m.us, m.them) === 3) three++;
    }
    return { win: wins / runs, three: three / runs };
  };
  // A first-timer who kicks at the middle and never dives still usually wins match 1.
  const lazy = (seed: number) => { const rng = makeRng(seed); return { shooter: (): Shot => ({ x: (rng() - 0.5) * 0.5, y: 0.3, power: 0.6, curve: 0 }), keeper: () => null }; };
  assert.ok(rate(1, lazy as never).win > 0.7, "match 1 forgives a lazy player");
  const first = rate(1, seed => skilled(seed)), final = rate(LEVEL_COUNT, seed => skilled(seed));
  assert.ok(first.win > 0.95, String(first.win));
  assert.ok(final.win > 0.25 && final.win < 0.9, String(final.win));
  // Every match can be won with three stars by a steady player on some seed.
  for (const level of levels) assert.ok(rate(level, seed => skilled(seed, 0.04, 0.95), 120).three > 0, `match ${level} has a 3-star path`);
  // Harder each match for the same player.
  const wins = levels.map(level => rate(level, seed => skilled(seed, 0.1, 0.7), 200).win);
  for (let i = 2; i < wins.length; i++) assert.ok(wins[i] <= wins[i - 2] + 0.05, `match ${i + 1} not easier than ${i - 1}: ${wins}`);
});

test("level progress goes through readLevels / recordLevel", () => {
  let stars = readLevels(JSON.stringify({ 1: 3, 2: 1, 9: 3, x: 2, 3: 7 }), LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, starsOf(4, 2));
  assert.equal(stars[2], 2);
  stars = recordLevel(stars, 2, starsOf(5, 4));
  assert.equal(stars[2], 2, "a worse win keeps the better stars");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(totalStars(stars), 5);
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
});

test("lines: exact, kind, and in তুমি", () => {
  for (const level of levels) assert.ok(clearLine(level).length > 10);
  assert.match(clearLine(2), /থানার/); assert.match(clearLine(8), /জাতীয় চ্যাম্পিয়ন/);
  assert.equal(nearMissLine(4, 2), "আর ১ গোলের ব্যবধানে জিতলে ৩ তারা।");
  assert.equal(nearMissLine(3, 0), "");
  assert.equal(lossLine(2, 3, false, 0), "২–৩ গোলে হার। আর ১টা গোল হলেই সাডেন ডেথ।");
  assert.equal(lossLine(2, 3, false, 2), "২–৩ গোলে হার। ২টা শট বাঁশে লেগে ফিরেছে।");
  assert.match(lossLine(5, 6, true, 0), /সাডেন ডেথে/);
  assert.equal(humanLine({ level: 1, us: 3, them: 0 }), "কিপার এখনো মাটিতে বসে আছে।");
  assert.equal(humanLine({ level: 3, us: 7, them: 6 }), "সাডেন ডেথে ফয়সালা।");
  assert.equal(humanLine({ level: 8, us: 4, them: 3 }), "পাড়ার দল এখন জাতীয় চ্যাম্পিয়ন।");
  assert.equal(compareLine({ us: 3, them: 0 }, { us: 4, them: 2 }, "রাফি"), "রাফি জিতেছিল ২ গোলে, তুমি ৩ গোলে!");
  assert.equal(compareLine({ us: 4, them: 2 }, { us: 3, them: 1 }, "রাফি"), "সমান সমান! রাফিও ২ গোলে জিতেছিল।");
  assert.equal(compareLine({ us: 5, them: 4 }, { us: 3, them: 0 }, ""), "বন্ধু জিতেছিল ৩ গোলে। আর একটু হলেই!");
  assert.equal(caption({ level: 4, us: 4, them: 2 }), "পেনাল্টি কিকের থানার ম্যাচ: টাইব্রেকারে হাটখোলা ক্লাবকে ৪–২ গোলে হারালাম। তুমি পারবে?");
  const result = (outcome: "goal" | "saved" | "post" | "bar" | "wide" | "over", close = false) => ({ outcome, close, bx: 0, by: 0, keeper: 1 as Zone });
  assert.equal(kickLine(0, result("goal"), null), "গোল!");
  assert.match(kickLine(0, result("post"), null), /পোস্টে/);
  assert.equal(kickLine(1, result("saved"), 0), "ঠেকিয়ে দিলে!");
  assert.match(kickLine(1, result("goal", true), 0), /কোণে/);
  assert.match(kickLine(1, result("goal"), null), /দাঁড়িয়েই/);
});

test("a challenge link round-trips and refuses forged scores", () => {
  const shared = { level: 4, seed: 123456, us: 4, them: 2, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=123456&t=4&a=2&l=4&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি টাইব্রেকারে হাটখোলা ক্লাবকে ৪–২ গোলে হারিয়েছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, us: 3, them: 0, name: "" }), "এক বন্ধু টাইব্রেকারে কলপাড় একাদশকে ৩–০ গোলে হারিয়েছে");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "2", a: "4" }), variant({ t: "2" }), variant({ t: "4", a: "0" }), variant({ t: "9", a: "0" }), variant({ t: "1.5" }), variant({ t: "-1" }), variant({ t: "31", a: "30" }),
    variant({ a: "02" }), variant({ a: "x" }), variant({ a: null }), variant({ l: "9" }), variant({ l: "0" }), variant({ l: "04" }), variant({ l: null }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared(variant({ t: "6", a: "5", l: "8" })), "a sudden-death final is fine");
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^পেনাল্টি কিক গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /শেষ বলে ছয়|সাত চাড়া/.test(item.answer)));
  for (const word of ["নাম", "ম্যাচ", "সিড", "স্কোর"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|বাজি|জিতে নাও|ফিফা|fifa|বিশ্বকাপ|আবাহনী|মোহামেডান|বার্সা|রিয়াল|মেসি|রোনালদো/i);
  assert.doesNotMatch(OPPONENTS.map(o => o.name).join(" "), /আবাহনী|মোহামেডান|কিংস|শেখ/);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { kickThump(); netSwish(); bambooKnock(); gloveSave(); crowd(true); crowd(false); whistle(); whistle(true); const hum = murmur(); hum.set(0.5); hum.stop(); });
});

test("plans are typed for every round", () => {
  const plans: Plans = makePlans(1, 1);
  assert.equal(plans.shots.every(plan => plan.zone >= 0 && plan.zone <= 2 && plan.lean >= -1 && plan.lean <= 1), true);
  assert.equal(KICKS, 5);
});
