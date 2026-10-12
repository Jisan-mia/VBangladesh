import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import {
  clearance, ensureGates, makeGusts, newRun, puff, stageOf, stageStars, stepRun, twoStarGrazes, windAt,
  GRAZE, HIT, STAGE_COUNT, STAGES, type Run,
} from "../lib/game";
import { cardHash, migrateLevels, nearMiss, parseCard, previewTitle } from "../lib/result";
import { share } from "../share";

const DT = 1 / 60;

/** A beam search over "tap or not" every 6 frames: the most crossings any tapping clears (up to `goal`), and the fewest scrapes on the way. */
function solve(seed: number, stage: number, big = false): { best: number; won: Run | null } {
  const first = newRun(seed, big, stage), goal = first.goal;
  puff(first);
  let frontier: Run[] = [first], best = 0;
  while (frontier.length) {
    const next = new Map<string, Run>();
    for (const state of frontier) for (const tap of [false, true]) {
      const run = { ...state };
      if (tap) puff(run);
      for (let i = 0; i < 6 && run.phase === "playing"; i++) stepRun(run, DT, false);
      if (run.cleared) return { best: goal, won: run };
      if (run.phase !== "playing") continue;
      best = Math.max(best, run.score);
      const key = `${Math.round(run.y / 3)}|${Math.round(run.vy / 30)}`;
      if (!next.has(key)) next.set(key, run);
    }
    const all = [...next.values()].sort((a, b) => a.y - b.y);
    frontier = all.length <= 90 ? all : Array.from({ length: 90 }, (_, i) => all[Math.floor(i * all.length / 90)]);
  }
  return { best, won: null };
}
const bestReachable = (seed: number, stage: number, big = false) => solve(seed, stage, big).best;

test("the endless street is the original one, wire for wire, so old links replay it exactly", () => {
  const run = newRun(48213, false);
  while (run.gates.length < 60) { run.dist += 200; ensureGates(run); }
  // Fingerprint of the original generator's seed-48213 street, taken before levels existed.
  assert.equal(createHash("sha256").update(JSON.stringify(run.gates.slice(0, 60))).digest("hex").slice(0, 16), "102cae76f1b96149");
  assert.equal(run.stage, 0);
  assert.equal(windAt(run, 5000), 0, "no wind on the endless street");
});

test("levels rise in small steps: more crossings, a tighter gap, stronger wind", () => {
  assert.equal(STAGES[0].gust + STAGES[0].base, 0, "the first level has no wind at all");
  for (let stage = 2; stage <= STAGE_COUNT; stage++) {
    const [now, before] = [stageOf(stage), stageOf(stage - 1)];
    assert.ok(now.gates >= before.gates && now.floor < before.floor, `level ${stage}`);
    assert.ok(now.gust + Math.max(0, now.base) >= before.gust + Math.max(0, before.base) - 40, `level ${stage} wind`);
  }
  for (const seed of [1, 99, 4242]) {
    const gusts = makeGusts(seed, 6);
    assert.deepEqual(gusts, makeGusts(seed, 6));
    assert.ok(gusts.length >= 3 && gusts[0].at > 285, "calm until after the first crossing");
    const run = newRun(seed, false, 6);
    for (let d = 0; d < 4000; d += 37) assert.ok(Math.abs(windAt(run, d)) <= stageOf(6).gust + Math.abs(stageOf(6).base) + 1e-9);
  }
});

test("every level is clearable: some tapping gets through all its crossings, with and without বড় ফাঁক", () => {
  for (let stage = 1; stage <= STAGE_COUNT; stage++) {
    for (const seed of [11, 7919, 31337, 900001]) assert.equal(bestReachable(seed, stage), stageOf(stage).gates, `level ${stage} seed ${seed}`);
    assert.equal(bestReachable(stage * 101, stage, true), stageOf(stage).gates, `level ${stage} big`);
  }
});

test("a level ends cleared at its last crossing; scrapes and clean streaks are counted once per crossing", () => {
  const run = solve(5, 1).won!;
  assert.equal(run.phase, "over");
  assert.equal(run.cleared, true);
  assert.equal(run.score, 6);
  assert.equal(run.popped, null);
  assert.ok(run.grazes <= 6 && run.streak + run.grazes <= 6);
  assert.ok(clearance(newRun(5, false, 1)) === Infinity, "nothing near at the start");
});

test("stars: no scrape is three, one per five crossings is two, more is one", () => {
  assert.equal(twoStarGrazes(1), 2);
  assert.equal(twoStarGrazes(10), 4);
  assert.deepEqual([0, 1, 2, 3].map(g => stageStars(1, g)), [3, 2, 2, 1]);
  assert.deepEqual([0, 4, 5].map(g => stageStars(10, g)), [3, 2, 1]);
  assert.ok(GRAZE > HIT);
});

test("near-miss lines give the exact number", () => {
  assert.equal(nearMiss({ stage: 3, score: 7, cleared: false, grazes: 0, best: null }), "আর ৩টা ফাঁক হলেই লেভেল ৩ পার।");
  assert.equal(nearMiss({ stage: 3, score: 10, cleared: true, grazes: 1, best: null }), "আর ১টা ঘষা কম হলেই ৩ তারা।");
  assert.equal(nearMiss({ stage: 3, score: 10, cleared: true, grazes: 4, best: null }), "আর ২টা ঘষা কম হলেই ২ তারা।");
  assert.equal(nearMiss({ stage: 3, score: 10, cleared: true, grazes: 0, best: null }), "");
  assert.equal(nearMiss({ stage: 0, score: 33, cleared: false, grazes: 0, best: 37 }), "আর ৪টা ফাঁক হলেই নতুন সেরা।");
  assert.equal(nearMiss({ stage: 0, score: 3, cleared: false, grazes: 0, best: 37 }), "");
});

test("an old phone's best on the endless street opens levels it has shown it can handle, once", () => {
  assert.equal(migrateLevels(null, "9"), JSON.stringify({ 1: 1, 2: 1 }));
  assert.equal(unlockedLevel(readLevels(migrateLevels(null, "9"), STAGE_COUNT), STAGE_COUNT), 3);
  assert.equal(migrateLevels(null, "37"), JSON.stringify({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }), "never more than half the levels");
  assert.equal(migrateLevels(null, "3"), null, "too short to count");
  assert.equal(migrateLevels(null, null), null);
  assert.equal(migrateLevels(null, "junk"), null);
  assert.equal(migrateLevels("{}", "37"), null, "already moved");
});

test("old links open the endless street; level links carry the level and are checked against it", () => {
  assert.deepEqual(parseCard("s=9&t=40&b=1"), { seed: 9, score: 40, name: "", big: true, slow: false, stage: 0 });
  const card = { seed: 777, score: 8, name: "মিম", big: false, slow: true, stage: 2 };
  const hash = cardHash(card);
  assert.equal(hash, `s=777&t=8&l=2&d=1&n=${encodeURIComponent("মিম")}`);
  assert.deepEqual(parseCard(hash), card);
  assert.equal(share.normalize(hash), hash);
  assert.equal(cardHash({ ...card, stage: 0 }), `s=777&t=8&d=1&n=${encodeURIComponent("মিম")}`, "endless keeps the old shape");
  assert.equal(previewTitle(card), "মিম বেলুনের লেভেল ২-এ ৮টা ফাঁক পার করেছে। তুমি পারবে?");
  for (const bad of ["s=7&t=3&l=0", "s=7&t=3&l=11", "s=7&t=3&l=x", "s=7&t=3&l=02", "s=7&t=9&l=2"]) assert.equal(parseCard(bad), null, bad);
});
