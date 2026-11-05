import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { parseShared, sharedHash } from "../lib/challenge";
import { createGame, dive, keeperLean, leanShown, footShown, moveAim, pressKick, shoot, Ev, Stage, RUN } from "../lib/game";
import { LEVELS, LEVEL_COUNT, OLD_LEVELS } from "../lib/levels";
import { bannerNote, caption, clearLine, compareLine, feat, humanLine, kickLine, lossLine, nearMissLine, previewTitle } from "../lib/lines";
import { decided, drift, finalScores, kickZone, makePlans, makeResult, realWin, resolveSave, resolveShot, starsOf, Outcome, type ShotPlan, type Shot, type Zone } from "../lib/rules";
import { bambooKnock, crowd, crowdLoop, cupFanfare, cupMotif, gloveSave, kickThump, netSwish, whistle, clockTick } from "../lib/sfx";
import { stepGame } from "../lib/step.hot";
import { aimFrom, powerFrom, spotShot, swipeShot, GH, GW, GX, GY, SPOT_X, SPOT_Y } from "../lib/swipe";

const t = (goals: number, conceded: number, usTaken: number, themTaken: number) => ({ goals, conceded, usTaken, themTaken });

test("same seed, same match: keeper dives, leans, wind and their kicks replay exactly", () => {
  const a = makePlans(12, 424242), b = makePlans(12, 424242), c = makePlans(12, 424243);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  // The whole match, step for step, for the same inputs.
  const run = () => {
    const g = createGame(8, 777);
    while (g.stage !== Stage.Over) {
      if (g.stage === Stage.Aim && g.t > 0.4) shoot(g, { x: 0.7, y: 0.6, power: 0.8, curve: 0.2 });
      if (g.stage === Stage.Run && g.t > 0.9) dive(g, 0);
      stepGame(g, 1 / 60);
    }
    return Array.from(g.outcomes.slice(0, g.count)).join(",") + `|${g.tally.goals}-${g.tally.conceded}`;
  };
  assert.equal(run(), run());
});

test("tells: the first kickers never lie, later ones do at their rate, and a lean always points somewhere real", () => {
  for (const plan of makePlans(2, 99).shots) assert.equal(plan.lean, plan.zone - 1, "the first kicker never fakes");
  let honest = 0, total = 0, keeperHonest = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const plans = makePlans(12, seed);
    for (const plan of plans.shots) { total++; if (plan.lean === plan.zone - 1) honest++; if (plan.corner) assert.notEqual(plan.zone, 1); }
    for (const plan of plans.keeper) if (plan.lean === plan.zone - 1) keeperHonest++;
  }
  assert.ok(Math.abs(honest / total - LEVELS[11].shooter.honest) < 0.04, String(honest / total));
  assert.ok(Math.abs(keeperHonest / total - LEVELS[11].keeper.tell) < 0.04, String(keeperHonest / total));
  for (const plan of makePlans(1, 5).keeper) assert.equal(plan.lean, 0, "no keeper tell before থানা কাপ");
  for (const plan of makePlans(5, 5).keeper) assert.equal(plan.lean, plan.zone - 1, "the first leaning keeper is honest");
  assert.ok(makePlans(8, 5).keeper.some(plan => plan.wind !== 0) && makePlans(7, 5).keeper.every(plan => plan.wind === 0), "wind only where the match has it");
});

test("the tells show on the clock: the keeper's lean, the shoulders, then the planted foot", () => {
  const g = createGame(5, 31);
  assert.equal(keeperLean(g), 0);
  for (let i = 0; i < 60; i++) stepGame(g, 1 / 60);
  assert.equal(keeperLean(g), 1, "a second into your aim, he has shown his side");
  const k = createGame(7, 31);
  shoot(k, { x: 0.5, y: 0.5, power: 0.8, curve: 0 });
  while (k.stage !== Stage.Run) stepGame(k, 1 / 60);
  assert.equal(leanShown(k), 0); assert.equal(footShown(k), false);
  while (k.t < RUN * 0.7) stepGame(k, 1 / 60);
  assert.equal(leanShown(k), 1);
  assert.equal(footShown(k), false);
  while (k.t < RUN * 0.8) stepGame(k, 1 / 60);
  assert.ok(footShown(k), "the foot shows before the kick");
  assert.equal(k.stage, Stage.Run);
});

test("shoot-out rules: three or five each, early finish, sudden death; drills end after their kicks", () => {
  assert.equal(decided("shootout", 5, t(0, 0, 0, 0)), false);
  assert.equal(decided("shootout", 5, t(3, 0, 3, 3)), true, "two left can't make up three");
  assert.equal(decided("shootout", 5, t(4, 3, 5, 4)), false);
  assert.equal(decided("shootout", 5, t(4, 4, 5, 5)), false, "level after five: sudden death");
  assert.equal(decided("shootout", 5, t(5, 4, 6, 5)), false, "sudden death waits for their reply");
  assert.equal(decided("shootout", 5, t(6, 5, 6, 6)), true);
  assert.equal(decided("shootout", 3, t(2, 0, 2, 2)), true, "two up with one each left");
  assert.equal(decided("shootout", 3, t(2, 2, 3, 3)), false);
  assert.equal(decided("shots", 3, t(0, 0, 2, 0)), false);
  assert.equal(decided("shots", 3, t(1, 0, 3, 0)), true);
  assert.equal(decided("saves", 3, t(0, 3, 0, 3)), true);
});

test("only real scores count as wins, by each match's own format", () => {
  const five = finalScores(5), three = finalScores(3);
  for (const real of ["3-0", "4-1", "5-4", "6-5", "12-11"]) assert.ok(five.has(real), real);
  for (const fake of ["4-0", "5-0", "9-0", "2-2", "7-5"]) assert.ok(!five.has(fake), fake);
  assert.ok(three.has("2-0") && three.has("3-1") && three.has("4-3") && !three.has("3-0"));
  assert.ok(realWin(1, 3, 0) && realWin(1, 1, 2) && !realWin(1, 0, 3) && !realWin(1, 2, 2) && !realWin(1, 4, 0));
  assert.ok(realWin(3, 2, 0) && !realWin(3, 3, 0) && realWin(4, 3, 0) && !realWin(4, 4, 0) && !realWin(4, 0, 1));
});

test("stars: a drill counts kicks made, a three-kick final wants a clean 2–0, five kicks go by margin", () => {
  assert.equal(starsOf(1, 3, 0), 3); assert.equal(starsOf(1, 1, 2), 1); assert.equal(starsOf(1, 0, 3), 0);
  assert.equal(starsOf(2, 2, 1), 2);
  assert.equal(starsOf(3, 2, 0), 3); assert.equal(starsOf(3, 3, 1), 2); assert.equal(starsOf(3, 4, 3), 1);
  assert.equal(starsOf(4, 3, 0), 3); assert.equal(starsOf(4, 4, 2), 2); assert.equal(starsOf(4, 5, 4), 1); assert.equal(starsOf(4, 2, 3), 0);
  for (const level of [3, 4, 12]) assert.ok([...finalScores(LEVELS[level - 1].kicks)].some(s => { const [u, v] = s.split("-").map(Number); return starsOf(level, u, v) === 3; }), `match ${level} has a 3-star score`);
});

test("our kick: frame, wide and over before the keeper; wind drifts a soft shot more; a soft shot can be read", () => {
  const out = makeResult(), plan = (zone: Zone, u = 0.99, wind = 0) => ({ u, zone, lean: 0 as const, wind });
  const shot = (x: number, y: number, power = 0.6, curve = 0): Shot => ({ x, y, power, curve });
  assert.equal(resolveShot(4, plan(1), shot(1.0, 0.5), out).outcome, Outcome.Post);
  assert.equal(resolveShot(4, plan(1), shot(0.3, 1.0), out).outcome, Outcome.Bar);
  assert.equal(resolveShot(4, plan(1), shot(1.3, 0.3), out).outcome, Outcome.Wide);
  assert.equal(resolveShot(4, plan(1), shot(0.2, 1.3), out).outcome, Outcome.Over);
  assert.equal(resolveShot(4, plan(1), shot(0.2, 0.9, 1), out).outcome, Outcome.Bar, "full power lifts a high shot onto the bar");
  assert.equal(resolveShot(4, plan(1), shot(0, 0.3, 0.3), out).outcome, Outcome.Saved);
  assert.equal(resolveShot(4, plan(0), shot(0, 0.3, 0.3), out).outcome, Outcome.Goal);
  // Wind: the same aim drifts into the post when it's soft, stays in when it's hard.
  assert.ok(drift(0.3, 0.3) > drift(0.3, 0.9));
  assert.equal(resolveShot(8, plan(0, 0.99, 0.3), shot(0.7, 0.4, 0.3), out).outcome, Outcome.Post);
  assert.equal(resolveShot(8, plan(0, 0.99, 0.3), shot(0.7, 0.4, 0.9), out).outcome, Outcome.Goal);
  // Reading: a soft shot under his read rate brings him your way; a hard one never.
  assert.equal(resolveShot(12, plan(0, 0), shot(0.6, 0.3, 0.5), out).keeper, 2);
  assert.equal(resolveShot(12, plan(0, 0), shot(0.6, 0.3, 0.8), out).keeper, 0);
  // The tall keeper reaches a high-ish shot the right way that a small one can't; the very corner still beats him.
  assert.equal(resolveShot(1, plan(2), shot(0.7, 0.7, 0.8), out).outcome, Outcome.Goal);
  assert.equal(resolveShot(9, plan(2), shot(0.7, 0.7, 0.8), out).outcome, Outcome.Saved);
  assert.equal(resolveShot(9, plan(2), shot(0.93, 0.93, 0.84), out).outcome, Outcome.Goal);
  assert.equal(resolveShot(9, plan(2), shot(0.88, 0.85, 0.84, 0.5), out).outcome, Outcome.Goal, "or curl it");
});

test("their kick: the right dive saves, a top corner still goes in, a watching kicker punishes an early dive", () => {
  const out = makeResult(), base: ShotPlan = { zone: 0, high: false, miss: false, missKind: 0, corner: false, lean: -1, jitter: 0.5 };
  assert.equal(resolveSave(4, base, 0, false, out).outcome, Outcome.Saved);
  assert.equal(resolveSave(4, base, 2, false, out).outcome, Outcome.Goal);
  assert.equal(resolveSave(4, { ...base, zone: 1 }, null, false, out).outcome, Outcome.Saved, "staying put covers the middle");
  assert.equal(resolveSave(4, { ...base, corner: true }, 0, false, out).outcome, Outcome.Goal);
  assert.equal(resolveSave(4, { ...base, miss: true, missKind: 1 }, 2, false, out).outcome, Outcome.Over);
  assert.equal(kickZone(10, base, 0, true), 0, "no watching before the semi-final");
  assert.equal(kickZone(11, base, 0, true), 2, "you moved first: he goes the other way");
  assert.equal(resolveSave(11, base, 0, true, out).outcome, Outcome.Goal);
  assert.equal(resolveSave(11, base, 0, false, out).outcome, Outcome.Saved, "wait for his lean and the dive holds");
  const g = createGame(11, 5);
  shoot(g, { x: 0.5, y: 0.5, power: 0.8, curve: 0 });
  while (g.stage !== Stage.Run) stepGame(g, 1 / 60);
  dive(g, 2);
  assert.equal(g.early, true, "a dive before the lean shows is early");
});

test("the shot clock: it ticks its last seconds and a kick not taken is scuffed soft", () => {
  const g = createGame(10, 9);
  let ticks = 0;
  while (g.stage === Stage.Aim) { stepGame(g, 1 / 60); if (g.events & Ev.Tick) ticks++; g.events &= ~Ev.Tick; }
  assert.equal(ticks, 3, "3, 2, 1");
  assert.equal(g.stage, Stage.Fly);
  assert.ok(g.scuffed && g.shot.power <= 0.25);
  const slow = createGame(10, 9, true);
  let seconds = 0;
  while (slow.stage === Stage.Aim) { stepGame(slow, 1 / 60); seconds += 1 / 60; }
  assert.ok(seconds > 8, "ধীরে খেলো gives more time");
});

test("a swipe becomes a kick: direction to the spot, flick to power, bow to curl; the tap path aims and meters", () => {
  const corner = aimFrom(GX - 0.8 * GW - SPOT_X, GY - 0.7 * GH - SPOT_Y)!;
  assert.ok(Math.abs(corner.x + 0.8) < 1e-9 && Math.abs(corner.y - 0.7) < 1e-9);
  assert.equal(aimFrom(20, 30), null, "pulling down isn't a kick");
  assert.equal(powerFrom(0), 0.1); assert.equal(powerFrom(5), 1);
  const path = (bow: number, ms: number) => {
    const xs: number[] = [], ys: number[] = [], ts: number[] = [];
    for (let i = 0; i <= 8; i++) { const k = i / 8; xs.push(SPOT_X - 90 * k + Math.sin(k * Math.PI) * bow); ys.push(SPOT_Y - 180 * k); ts.push(k * ms); }
    return swipeShot(xs, ys, ts, xs.length)!;
  };
  assert.ok(path(0, 120).power > 0.9 && path(0, 1200).power < 0.3);
  assert.ok(path(25, 150).curve > 0.15 && path(-25, 150).curve < -0.15);
  assert.deepEqual(spotShot(GX, GY - GH / 2, 2), { x: 0, y: 0.5, power: 1, curve: 0 });
  const g = createGame(4, 3);
  moveAim(g, GX + 60, GY - 40);
  assert.ok(pressKick(g) && g.meter, "the first press starts the bar");
  for (let i = 0; i < 20; i++) stepGame(g, 1 / 60);
  assert.ok(g.power > 0.1);
  assert.ok(pressKick(g) && g.stage === Stage.Fly, "the second kicks");
  assert.equal(pressKick(g), false, "nothing while the ball is in the air");
});

test("lines: exact, kind, in তুমি, and the call never lies about the dive", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(clearLine(level).length > 10);
  assert.match(clearLine(3), /পাড়ার কাপ/); assert.match(clearLine(12), /জাতীয় চ্যাম্পিয়ন/);
  assert.equal(nearMissLine(1, 2, 1), "আর ১টা গোল হলে ৩ তারা।");
  assert.equal(nearMissLine(4, 4, 2), "আর ১ গোলের ব্যবধানে জিতলে ৩ তারা।");
  assert.equal(nearMissLine(4, 3, 0), "");
  assert.equal(lossLine(4, 2, 3, false, 0), "২–৩ গোলে হার। আর ১টা গোল হলেই সাডেন ডেথ।");
  assert.match(lossLine(4, 5, 6, true, 0), /সাডেন ডেথে/);
  assert.match(lossLine(1, 0, 3, false, 0), /কিপার যেদিকে নেই/);
  assert.equal(humanLine({ level: 4, us: 3, them: 0 }), "কিপার এখনো মাটিতে বসে আছে।");
  assert.equal(humanLine({ level: 12, us: 4, them: 3 }), "পাড়ার দল এখন জাতীয় চ্যাম্পিয়ন।");
  const shared = { level: 4, seed: 1, us: 4, them: 2, name: "রাফি" };
  assert.equal(compareLine(4, { us: 3, them: 0 }, shared), "রাফি জিতেছিল ২ গোলে, তুমি ৩ গোলে!");
  assert.equal(compareLine(1, { us: 3, them: 0 }, { level: 1, seed: 1, us: 2, them: 1, name: "" }), "বন্ধু জিতেছিল ২ টায়, তুমি ৩ টায়!");
  assert.equal(caption({ level: 5, us: 4, them: 2 }), "পেনাল্টি কিক, থানা কাপ সেমিফাইনাল: টাইব্রেকারে হাটখোলা ক্লাবকে ৪–২ গোলে হারালাম। তুমি পারবে?");
  const res = (outcome: Outcome, close = false) => ({ outcome, close, bx: 0, by: 0, keeper: 1 as Zone });
  assert.equal(kickLine(0, res(Outcome.Goal), null, false, false, false), "গোল!");
  assert.match(kickLine(0, res(Outcome.Saved), null, true, false, false), /সময় শেষ/);
  assert.equal(kickLine(1, res(Outcome.Saved), 0, false, false, false), "ঠেকিয়ে দিলে!");
  assert.match(kickLine(1, res(Outcome.Goal), 0, false, true, true), /আগে নড়েছিলে/);
  assert.match(kickLine(1, res(Outcome.Goal), null, false, false, false), /দাঁড়িয়েই/);
});

test("links round-trip, old eight-match links still open on the same team, forged scores are refused", () => {
  const shared = { level: 5, seed: 123456, us: 4, them: 2, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=123456&t=4&a=2&m=5&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি টাইব্রেকারে হাটখোলা ক্লাবকে ৪–২ গোলে হারিয়েছে। তুমি পারবে?");
  assert.match(feat({ level: 1, us: 3, them: 0, name: "" }), /আমতলা একাদশের কিপারকে ৩ শটে ৩ গোল/);
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(share.normalize(hash), hash);
  // The old ladder: `l=4` was হাটখোলা ক্লাব, `l=1` কলপাড় (a five-kick 4–2 was real then, and still opens).
  const old = "s=123456&t=4&a=2&l=4&n=" + encodeURIComponent("রাফি");
  assert.deepEqual(parseShared(old), { ...shared, level: OLD_LEVELS[4], legacy: 4 });
  assert.equal(share.normalize(old), old, "an old link keeps its own form");
  assert.match(share.preview(old).title, /হাটখোলা ক্লাবকে ৪–২/);
  assert.ok(parseShared("s=9&t=4&a=2&l=1"), "a five-kick score on old match 1 (now the three-kick পাড়ার ফাইনাল) still opens");
  assert.equal(parseShared("s=9&t=4&a=2&m=3"), null, "but a new link to the three-kick final can't be 4–2");
  for (let l = 1; l <= 8; l++) assert.equal(LEVELS[OLD_LEVELS[l] - 1].format, "shootout");
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "2", a: "4" }), variant({ t: "4", a: "0" }), variant({ t: "9", a: "0" }), variant({ t: "1.5" }), variant({ t: "31", a: "30" }),
    variant({ a: "02" }), variant({ a: null }), variant({ m: "13" }), variant({ m: "0" }), variant({ m: "05" }), variant({ m: null }),
    variant({ m: null, l: "9" }), variant({ s: "0" }), variant({ s: null }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared("s=5&t=3&a=0&m=1") && !parseShared("s=5&t=3&a=1&m=1"), "a drill adds up to its three kicks");
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
});

test("content meets the SEO limits and speaks তুমি; no real team or brand", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^পেনাল্টি কিক গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /১২টা ম্যাচ/.test(item.answer)));
  assert.ok(site.faq.some(item => /শেষ বলে ছয়|সাত চাড়া/.test(item.answer)));
  for (const word of ["নাম", "ম্যাচ", "সিড", "স্কোর"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const all = JSON.stringify(site) + LEVELS.map(level => level.name + level.team.name + level.teach).join(" ");
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|বাজি|জিতে নাও|ফিফা|fifa|বিশ্বকাপ|আবাহনী|মোহামেডান|বার্সা|রিয়াল|মেসি|রোনালদো/i);
  assert.doesNotMatch(LEVELS.map(level => level.team.name).join(" "), /আবাহনী|মোহামেডান|কিংস|শেখ|বাংলাদেশ/);
  assert.equal(new Set(LEVELS.map(level => level.team.name)).size, LEVEL_COUNT);
  assert.equal(all, all.normalize("NFC"));
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { kickThump(); netSwish(); bambooKnock(); gloveSave(); crowd(true); crowd(false); whistle(); whistle(true); cupMotif(2); cupFanfare(); clockTick(true); const hum = crowdLoop(); hum.swell(0.5); hum.stop(); });
});
