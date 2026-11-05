import assert from "node:assert/strict";
import test from "node:test";
import { oldPots } from "../lib/legacy";
import { LEVELS, LEVEL_COUNT, levelDef } from "../lib/levels";
import { collapsed, FALL, FLARE_DUR, FLARE_TELL, flareTell, heatAt, makePots, popSwell, potLevel, potScore, warp } from "../lib/pot";
import { liftPot, newRound, startPot, RESULT_SECONDS, SLOW } from "../lib/round";
import { EV_BELL, EV_COLLAPSE, EV_FLARE, EV_NEXT, EV_OVER, EV_POP, EV_SPILL, stepRound } from "../lib/step.hot";

const DT = 1 / 60;

test("the same seed gives the same pots, a different seed different ones, and each level has its own", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    assert.deepEqual(makePots(4242, level), makePots(4242, level));
    assert.notDeepEqual(makePots(4242, level), makePots(4243, level));
    assert.equal(makePots(4242, level).length, levelDef(level).pots);
  }
  assert.notDeepEqual(makePots(4242, 2).map(pot => pot.seconds), makePots(4242, 3).map(pot => pot.seconds));
});

test("the ladder: 3 worlds of 4, each level one new thing, finales at 4, 8 and 12 with a named boss pot", () => {
  assert.equal(LEVEL_COUNT, 12);
  const names = new Set(LEVELS.map(def => def.name));
  assert.equal(names.size, 12, "every level has its own name");
  LEVELS.forEach((def, index) => {
    assert.equal(def.world, Math.floor(index / 4));
    assert.equal(def.boss !== null, index % 4 === 3, `level ${index + 1}`);
    assert.ok(def.teach.length > 10);
  });
  const first = makePots(5, 1);
  assert.equal(first.length, 2, "level 1 is two calm pots, so it is won in about ten seconds");
  for (const pot of first) assert.ok(!pot.lid && !pot.dark && pot.fire === 0 && pot.flareAt < 0 && pot.peak === 0 && pot.popAt1 < 0 && pot.bell < 0);
  for (const level of [4, 8, 12]) {
    const pots = makePots(9, level);
    assert.ok(pots[pots.length - 1].boss && pots.slice(0, -1).every(pot => !pot.boss), "only the last pot of a finale is the boss");
  }
  assert.ok(makePots(9, 4)[3].peak > 0 && makePots(9, 4).slice(0, 3).every(pot => pot.peak === 0), "level 4: the second boil on the boss pot only");
  assert.ok(makePots(9, 12)[4].peak > 0 && makePots(9, 12)[4].popAt1 >= 0);
});

test("each element is new where the design says, and carries on inside its world only", () => {
  const has = (level: number, test: (pot: ReturnType<typeof makePots>[number]) => boolean) => makePots(11, level).some(test);
  assert.ok(!has(1, pot => pot.wobble > 0.02) && has(2, pot => pot.wobble > 0.03), "2: the foam ripples");
  assert.ok(!has(2, pot => pot.bell >= 0) && has(3, pot => pot.bell >= 0), "3: the doorbell");
  assert.ok(!has(7, pot => pot.fire === 0) && !has(8, pot => pot.fire === 0) && has(5, pot => pot.fire > 0) && !has(4, pot => pot.fire > 0), "5: the fire breathes");
  assert.ok(!has(5, pot => pot.lid) && has(6, pot => pot.lid) && !makePots(11, 6)[0].lid, "6: a lid from the second pot");
  assert.ok(!has(6, pot => pot.flareAt >= 0) && has(7, pot => pot.flareAt >= 0), "7: the flame leaps");
  assert.ok(!has(8, pot => pot.dark) && has(9, pot => pot.dark) && has(12, pot => pot.dark), "9: the lights go out");
  assert.ok(!has(9, pot => pot.popAt1 >= 0) && has(10, pot => pot.popAt1 >= 0), "10: bubbles burst");
  assert.ok(!has(10, pot => pot.quick) && has(11, pot => pot.quick), "11: small, fast pots");
  assert.ok(makePots(11, 11).filter(pot => pot.quick).every(pot => pot.vessel === "patil" && pot.seconds < 3.1), "a quick pot is a small পাতিল that climbs in under about 3 s");
  assert.ok(makePots(11, 6).every(pot => pot.stove === "clay" && pot.vessel === "hari") && makePots(11, 2).every(pot => pot.stove === "gas"));
  assert.equal(makePots(3, 5)[0].scene, 1);
  assert.equal(makePots(3, 9)[0].scene, 2);
});

test("old links replay the old kitchens draw for draw (fingerprints from before the rewrite)", () => {
  const fingerprint = (seed: number, kitchen: number) => {
    const text = oldPots(seed, kitchen).map(p => [p.vessel[0], p.stove[0], p.seconds.toFixed(4), p.power.toFixed(4), p.wobble.toFixed(5), p.hz.toFixed(4), p.phase.toFixed(4), p.bell.toFixed(4)].join(",")).join(";");
    let hash = 0;
    for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return String(hash);
  };
  const pinned: Record<string, string> = {"1:1":"1703342871","1:2":"205631583","1:3":"284233826","1:4":"2325407890","1:5":"3658875756","1:6":"3730579149","1:7":"397906372","1:8":"196536958","4242:1":"2238858074","4242:2":"1405124143","4242:3":"1836366694","4242:4":"850069329","4242:5":"3399787803","4242:6":"1216778696","4242:7":"2152041376","4242:8":"3444604929","999999999:1":"2685073978","999999999:2":"865185213","999999999:3":"4135358352","999999999:4":"2943483261","999999999:5":"2424902326","999999999:6":"657827400","999999999:7":"403162132","999999999:8":"92713718"};
  for (const [key, expected] of Object.entries(pinned)) {
    const [seed, kitchen] = key.split(":").map(Number);
    assert.equal(fingerprint(seed, kitchen), expected, key);
  }
  assert.equal(oldPots(4242, 3).length, 5);
  assert.ok(oldPots(4242, 3).every(pot => pot.bell === -1), "kitchen 3 is the original game: no doorbell");
  assert.ok(oldPots(4242, 4).some(pot => pot.bell >= 0));
});

test("never an impossible pot: there is always a moment to lift between 90% and the spill, in every mode", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    let least = 9;
    for (let seed = 1; seed < 300; seed++) {
      makePots(seed, level).forEach(pot => {
        // The widest ripples of any mode (কঠিন) are the worst case.
        let t = 0, ninety = -1;
        for (; t < 30; t += 1 / 240) {
          const value = potLevel(pot, t, 1.2);
          if (ninety < 0 && value >= 0.9) ninety = t;
          if (value >= 1) break;
        }
        assert.ok(t < 30, `level ${level} seed ${seed}: every pot boils over eventually`);
        least = Math.min(least, t - ninety);
      });
    }
    assert.ok(least >= 0.09, `level ${level}: the shortest window is ${least.toFixed(3)} s`);
  }
});

test("the second boil: the foam peaks, collapses, then climbs again and reaches the rim", () => {
  const pot = makePots(21, 4)[3];
  let top = 0, low = 1, beforePeak = true;
  for (let t = 0; t < 12; t += 1 / 240) {
    const value = potLevel(pot, t, 1);
    if (value >= 1) break;
    if (beforePeak) { top = Math.max(top, value); if (collapsed(pot, t)) beforePeak = false; }
    else low = Math.min(low, value);
  }
  assert.ok(top > 0.65 && top < 0.76, `first peak ${top}`);
  assert.ok(low < pot.low + 0.03 && low > pot.low - 0.03, `it sinks to ${low}`);
  assert.ok(!collapsed(pot, 0.1) && collapsed(pot, pot.seconds * 1.3));
  assert.ok(potLevel(pot, pot.seconds * Math.pow(pot.peak, 1 / pot.power) + FALL * 0.5, 1) < pot.peak - 0.05, "the fall is visible mid-way");
});

test("bursting bubbles drop the foam and it recovers", () => {
  const pot = makePots(31, 10).find(each => each.popAt1 >= 0)!;
  const before = potLevel(pot, pot.popAt1 - 0.02, 0), after = potLevel(pot, pot.popAt1 + 0.01, 0), later = potLevel(pot, pot.popAt1 + 1, 0);
  assert.ok(before - after > pot.popDepth1 * 0.8, "a sudden drop");
  assert.ok(later > after, "then it climbs back");
  assert.ok(popSwell(pot, pot.popAt1 - 0.2) > 0.4 && popSwell(pot, pot.popAt1 - 1) === 0 && popSwell(pot, pot.popAt1 + 0.1) === 0, "the bubble swells before it bursts");
});

test("a flare is warned first, then the foam surges; the fire breathes with the flame's height", () => {
  const pot = makePots(41, 7).find(each => each.flareAt >= 0)!;
  assert.equal(flareTell(pot, pot.flareAt - FLARE_TELL - 0.1), 0);
  assert.ok(flareTell(pot, pot.flareAt - 0.2) > 0.5);
  assert.equal(flareTell(pot, pot.flareAt + 0.1), 0);
  const without = { ...pot, flareAt: -1 };
  assert.ok(Math.abs(heatAt(pot, pot.flareAt + 0.5) - heatAt(without, pot.flareAt + 0.5) - pot.flareBoost) < 1e-9, "the flame is higher during the surge");
  assert.equal(heatAt(pot, pot.flareAt + FLARE_DUR + 0.1), heatAt(without, pot.flareAt + FLARE_DUR + 0.1), "and back to normal after");
  const gained = warp(pot, pot.flareAt + FLARE_DUR + 1) - warp(without, pot.flareAt + FLARE_DUR + 1);
  assert.ok(Math.abs(gained - pot.flareBoost * FLARE_DUR) < 1e-9, "the surge adds exactly boost × duration to the foam's clock");
  const fire = makePots(41, 5)[0];
  const rates = Array.from({ length: 60 }, (_, index) => heatAt(fire, index * 0.1));
  assert.ok(Math.max(...rates) - Math.min(...rates) > 0.3 && Math.min(...rates) > 0.5, "the fire breathes, never out");
  // The warped clock is smooth: it only ever moves forward.
  for (let t = 0; t < 8; t += 0.01) assert.ok(warp(fire, t + 0.01) > warp(fire, t));
});

test("scores: percent of the rim, floored, 99 at most; a spill is zero", () => {
  assert.equal(potScore(0), 0);
  assert.equal(potScore(0.93), 93);
  assert.equal(potScore(0.999), 99);
  assert.equal(potScore(1.4), 99);
  assert.equal(potScore(-0.2), 0);
});

test("rules: start, lift, spill and the round's events", () => {
  const round = newRound(9, 3);
  assert.equal(liftPot(round), false, "can't lift a pot that isn't heating");
  assert.equal(startPot(round), true);
  assert.equal(startPot(round), false);
  let events = 0;
  for (let index = 0; index < 120; index++) events |= stepRound(round, DT, 1, 1);
  assert.ok(round.foam > 0 && round.foam < 1);
  const expected = potScore(round.foam);
  assert.equal(liftPot(round), true);
  assert.equal(round.scores[0], expected);
  assert.equal(round.scored, 1);
  assert.equal(round.phase, "result");
  for (let index = 0; index < Math.ceil(RESULT_SECONDS / DT) + 1; index++) events |= stepRound(round, DT, 1, 1);
  assert.ok(events & EV_NEXT);
  assert.equal(round.phase, "waiting");
  assert.equal(round.index, 1);
  // Left on the stove, the next pot boils over and scores zero.
  startPot(round);
  let spilled = 0;
  while (round.phase === "rising") spilled |= stepRound(round, DT, 1, 1);
  assert.ok(spilled & EV_SPILL);
  assert.deepEqual(round.spills.slice(0, 2), [false, true]);
  assert.equal(round.scores[1], 0);
  assert.equal(round.foam, 1);
  assert.equal(round.scored, 2);
  let over = 0;
  for (let index = 0; index < 3600 && round.phase !== "over"; index++) { over |= stepRound(round, DT, 1, 1); if (round.phase === "waiting") startPot(round); }
  assert.ok(over & EV_OVER || round.phase === "over");
});

test("events fire once each: the bell, the flare's warning, a burst, the collapse", () => {
  const seen = new Map<number, number>();
  const watch = (level: number, flag: number) => {
    for (let seed = 1; seed < 80; seed++) {
      const round = newRound(seed, level);
      const index = round.pots.findIndex(pot => flag === EV_BELL ? pot.bell >= 0 : flag === EV_FLARE ? pot.flareAt >= 0 : flag === EV_POP ? pot.popAt1 >= 0 : pot.peak > 0);
      if (index < 0) continue;
      round.index = index; startPot(round);
      let count = 0;
      while (round.phase === "rising") { if (stepRound(round, DT, 1, 1) & flag) count++; }
      seen.set(flag, (seen.get(flag) ?? 0) + 1);
      assert.equal(count, flag === EV_POP ? count : 1, `flag ${flag} seed ${seed}`);
      if (flag === EV_POP) assert.ok(count >= 2 - 0 && count <= 2 + 0, "two bubbles burst, once each");
    }
  };
  watch(3, EV_BELL); watch(7, EV_FLARE); watch(10, EV_POP); watch(4, EV_COLLAPSE);
  for (const flag of [EV_BELL, EV_FLARE, EV_POP, EV_COLLAPSE]) assert.ok((seen.get(flag) ?? 0) > 10, `flag ${flag} was exercised`);
});

test("slow mode really is slower, and the foam is the same height at the same pot-clock time", () => {
  const run = (rate: number) => { const round = newRound(3, 2); startPot(round); let steps = 0; while (round.phase === "rising") { stepRound(round, DT, rate, 1); steps++; } return steps * DT; };
  assert.ok(run(SLOW) > run(1) * 1.5);
  assert.ok(run(0.8) > run(1) && run(1.15) < run(1));
});
