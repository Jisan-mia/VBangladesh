// The ladder: four cups of three, one new thing per match, a named final per cup, and the bots' target rates.
import assert from "node:assert/strict";
import test from "node:test";
import { cupRound, levelOf, worldOf, LEVELS, LEVEL_COUNT, OLD_LEVELS, PER_WORLD, WORLDS } from "../lib/levels";
import { playMatch, rate } from "./bot";

test("four cups of three rounds, each ending in a named final; old matches keep their teams", () => {
  assert.equal(WORLDS.length, 4);
  assert.equal(LEVEL_COUNT, WORLDS.length * PER_WORLD);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.equal(Boolean(levelOf(level).finale), level % PER_WORLD === 0, `match ${level}`);
  assert.equal(cupRound(3), "পাড়ার কাপ ফাইনাল"); assert.equal(cupRound(11), "জাতীয় কাপ সেমিফাইনাল");
  assert.deepEqual(LEVELS.map((_, i) => worldOf(i + 1)), [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]);
  // The eight old teams sit at their new numbers, so old links and old stars name the same team.
  const oldTeams = ["কলপাড় একাদশ", "বটতলা কিশোর সংঘ", "রেলগেট একাদশ", "হাটখোলা ক্লাব", "নদীপাড় ক্রীড়াচক্র", "ইটভাটা সংঘ", "চরপাড়া একাদশ", "সাগরপাড় একাদশ"];
  oldTeams.forEach((name, i) => assert.equal(levelOf(OLD_LEVELS[i + 1]).team.name, name));
});

test("each match brings exactly one new thing", () => {
  // What a player can notice, per match: the format, the keeper's lean, a lying kicker, a late tell, wind, a tall keeper, the clock, a watching kicker.
  const traits = (level: number) => {
    const l = levelOf(level);
    return new Set([
      `format:${l.format}${l.kicks}`, l.keeper.tell ? "keeper-lean" : "", l.shooter.honest < 1 ? "fakes" : "", l.shooter.tellAt >= 0.55 ? "late" : "",
      l.wind ? "wind" : "", l.keeper.tall ? "tall" : "", l.clock ? "clock" : "", l.shooter.watch ? "watch" : "",
    ].filter(Boolean));
  };
  const seen = new Set<string>();
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const fresh = [...traits(level)].filter(trait => !seen.has(trait) && !(trait === "late" && seen.has("late")));
    if (level < LEVEL_COUNT) assert.equal(fresh.length, 1, `match ${level} adds ${fresh.join(", ") || "nothing"}`);
    else assert.equal(fresh.length, 0, "the national final adds nothing new: it is everything at once");
    for (const trait of traits(level)) seen.add(trait);
    assert.ok(levelOf(level).teach.length > 10 && levelOf(level).teach.length < 80, `match ${level}'s teach line`);
  }
  const last = traits(LEVEL_COUNT);
  for (const trait of ["keeper-lean", "fakes", "late", "wind", "clock", "watch"]) assert.ok(last.has(trait), `the final has ${trait}`);
});

test("match 1 is won within 10 seconds, and nearly everyone wins it", () => {
  let worst = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const m = playMatch(1, seed * 101, "casual");
    worst = Math.max(worst, m.seconds);
  }
  assert.ok(worst < 10.5, `the slowest first match took ${worst.toFixed(1)} s`);
  assert.ok(rate(1, "casual", 300).win >= 0.97);
});

test("the casual bot: পাড়ার কাপ nearly always, and each later final is a real test", () => {
  const rates = LEVELS.map((_, i) => rate(i + 1, "casual", 300).win);
  for (let level = 1; level <= PER_WORLD; level++) assert.ok(rates[level - 1] >= 0.85, `match ${level}: ${rates[level - 1]}`);
  for (const level of [6, 9, 12]) assert.ok(rates[level - 1] >= 0.25 && rates[level - 1] <= 0.85, `final ${level}: ${rates[level - 1]}`);
  // Never easier than the match two before it, within a little noise.
  for (let i = 2; i < rates.length; i++) assert.ok(rates[i] <= rates[i - 2] + 0.06, `match ${i + 1} not easier than ${i - 1}: ${rates.map(r => r.toFixed(2))}`);
});

test("the strong bot clears every match at least 80% of the time, with three stars possible everywhere", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const r = rate(level, "strong", 200);
    assert.ok(r.win >= 0.8, `match ${level}: ${r.win}`);
    assert.ok(r.three > 0.1, `match ${level} three stars: ${r.three}`);
  }
});

test("ধীরে খেলো slows the clock but keeps the same rules and the same seeds", () => {
  const fast = playMatch(7, 1234, "strong"), slow = playMatch(7, 1234, "strong", true);
  assert.ok(slow.seconds > fast.seconds * 1.4, `${slow.seconds} vs ${fast.seconds}`);
  assert.deepEqual(slow.game.plans, fast.game.plans);
});
