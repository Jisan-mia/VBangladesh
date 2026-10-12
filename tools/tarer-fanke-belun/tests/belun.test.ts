import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import {
  ensureGates, gapFor, lowWire, newRun, puff, speedAt, stepRun, topWire, touchesGate,
  BX, GROUND, HIT, POP_SECONDS, START_Y, type Gate, type Run,
} from "../lib/game";
import { caption, cardHash, friendBanner, friendNote, humanLine, parseCard, previewTitle, versusLine, MAX_SCORE } from "../lib/result";
import { share } from "../share";

const DT = 1 / 60;

/** Plays with a fixed tapping rhythm until the balloon pops (or the time runs out). */
function rhythm(seed: number, everySeconds: number, big = false, slow = false) {
  const run = newRun(seed, big);
  let since = everySeconds, steps = 0;
  while (run.phase !== "over" && steps < 60 * 300) {
    if (run.phase !== "pop" && (since += DT) >= everySeconds) { puff(run); since = 0; }
    stepRun(run, DT, slow);
    steps++;
  }
  return run;
}

/**
 * Fairness check: a beam search over "tap or not" every 8 frames. Returns the most gaps any tapping reaches (up to `goal`).
 * If this falls short, the seed made a crossing nobody could get through.
 */
function bestReachable(seed: number, big: boolean, goal: number) {
  const first = newRun(seed, big);
  puff(first);
  let frontier: Run[] = [first], best = 0;
  while (frontier.length) {
    const next = new Map<string, Run>();
    for (const state of frontier) for (const tap of [false, true]) {
      const run = { ...state };
      if (tap) puff(run);
      for (let i = 0; i < 8 && run.phase === "playing"; i++) stepRun(run, DT, false);
      if (run.phase !== "playing") continue;
      best = Math.max(best, run.score);
      if (best >= goal) return best;
      const key = `${Math.round(run.y / 3)}|${Math.round(run.vy / 30)}`;
      if (!next.has(key)) next.set(key, run);
    }
    const all = [...next.values()].sort((a, b) => a.y - b.y);
    frontier = all.length <= 80 ? all : Array.from({ length: 80 }, (_, i) => all[Math.floor(i * all.length / 80)]);
  }
  return best;
}

const gatesOf = (seed: number, big: boolean, count: number) => {
  const run = newRun(seed, big);
  while (run.gates.length < count) { run.dist += 200; ensureGates(run); }
  return run.gates.slice(0, count);
};

test("the same seed gives the same wires; another seed gives others", () => {
  assert.deepEqual(gatesOf(4242, false, 40), gatesOf(4242, false, 40));
  assert.notDeepEqual(gatesOf(4242, false, 40), gatesOf(4243, false, 40));
  assert.equal(rhythm(77, 0.7).score, rhythm(77, 0.7).score);
  assert.equal(rhythm(77, 0.7).dist, rhythm(77, 0.7).dist);
});

test("বড় ফাঁক widens every gap but keeps the same crossings in the same places", () => {
  const small = gatesOf(99, false, 30), big = gatesOf(99, true, 30);
  small.forEach((gate, index) => {
    assert.equal(big[index].x, gate.x);
    assert.equal(big[index].k, gate.k);
    assert.equal(big[index].w, gate.w);
    assert.equal(big[index].gap, gate.gap + 34);
  });
});

test("gaps: generous for the first three, then tighter down to a floor", () => {
  assert.equal(gapFor(0, false), 168);
  assert.equal(gapFor(2, false), 168);
  assert.ok(gapFor(3, false) < 168);
  assert.equal(gapFor(200, false), 108);
  assert.equal(gapFor(200, true), 142);
  for (let seed = 1; seed < 300; seed++) {
    const gates = gatesOf(seed, false, 60);
    assert.ok(Math.abs(gates[0].y - START_Y) <= 20, "the first gap sits where the balloon starts");
    for (const gate of gates) {
      // The narrowest point is the middle and equals the gap, and both bundles stay on screen above the street.
      for (let u = -1; u <= 1; u += 0.125) assert.ok(lowWire(gate, u) - topWire(gate, u) >= gate.gap - 1e-9);
      assert.ok(topWire(gate, 0) >= 34 && lowWire(gate, 0) <= GROUND - 56);
      assert.ok(gate.sagLow <= gate.sagTop);
    }
    for (let i = 1; i < gates.length; i++) assert.ok(gates[i].x - gates[i - 1].x >= 180 && gates[i].x - gates[i - 1].x <= 250);
  }
});

test("never an impossible run: some tapping always gets through the first 40 crossings", () => {
  for (let seed = 1; seed <= 12; seed++) {
    for (const big of [false, true]) assert.equal(bestReachable(seed * 7919, big, 40), 40, `seed ${seed * 7919} big ${big}`);
  }
});

test("touching: the middle of the gap is safe, the wires and the edge walls are not", () => {
  const gate: Gate = { x: 500, w: 50, y: 200, gap: 120, k: 10, sagTop: 20, sagLow: 6, crows: 0, perch: 0, kite: -1 };
  assert.equal(touchesGate(gate, 500, 200, HIT), false);
  assert.equal(touchesGate(gate, 500, topWire(gate, 0) + HIT - 0.5, HIT), true);
  assert.equal(touchesGate(gate, 500, topWire(gate, 0) + HIT + 0.5, HIT), false);
  assert.equal(touchesGate(gate, 500, lowWire(gate, 0) - HIT + 0.5, HIT), true);
  assert.equal(touchesGate(gate, 400, 20, HIT), false, "far before the crossing nothing counts");
  // Right at the left edge: above the hanging loop's end is solid, the open gap is not.
  assert.equal(touchesGate(gate, 450 - HIT + 1, topWire(gate, -1) - 5, HIT), true);
  assert.equal(touchesGate(gate, 450 - HIT + 1, (topWire(gate, -1) + lowWire(gate, -1)) / 2, HIT), false);
  assert.equal(touchesGate(gate, 450 - HIT - 1, 0, HIT), false);
});

test("the run: waits for the first tap, scores each gap once, pops on a wire or the street, then ends", () => {
  const run = newRun(5);
  for (let i = 0; i < 120; i++) stepRun(run, DT, false);
  assert.equal(run.phase, "ready");
  assert.equal(run.dist, 0);
  assert.ok(Math.abs(run.y - START_Y) <= 5);
  assert.equal(puff(run), true);
  assert.equal(run.phase, "playing");
  // No more taps, from low down: it lands on the street long before the first crossing.
  run.y = GROUND - 40;
  let changed = 0;
  while (run.phase === "playing") if (stepRun(run, DT, false)) changed++;
  assert.equal(run.phase, "pop");
  assert.equal(run.popped, "street");
  assert.ok(run.dist + BX < run.gates[0].x - run.gates[0].w);
  assert.equal(run.score, 0);
  assert.equal(changed, 1);
  assert.equal(puff(run), false, "a popped balloon ignores taps");
  for (let i = 0; i < Math.ceil(POP_SECONDS * 60) + 1; i++) stepRun(run, DT, false);
  assert.equal(run.phase, "over");
  // Tapping hard sends it up into the sky's soft edge and then into a hanging loop.
  const eager = rhythm(5, 0.15);
  assert.equal(eager.popped, "wire");
  assert.ok(eager.y >= HIT);
});

test("slow mode slows the clock, not the street's shape", () => {
  const fast = newRun(8), slow = newRun(8);
  puff(fast); puff(slow);
  for (let i = 0; i < 30; i++) { stepRun(fast, DT, false); stepRun(slow, DT, true); }
  assert.ok(Math.abs(slow.dist / fast.dist - 0.7) < 0.01);
  assert.deepEqual(slow.gates.slice(0, 3), fast.gates.slice(0, 3));
  assert.ok(speedAt(0) < speedAt(5000) && speedAt(1e6) === speedAt(1e7));
});

test("a headless run with a steady rhythm ends sanely with a plausible score", () => {
  let total = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const run = rhythm(seed, 0.72);
    assert.equal(run.phase, "over");
    assert.ok(Number.isInteger(run.score) && run.score >= 0 && run.score < 60);
    assert.ok(run.popped === "wire" || run.popped === "street");
    assert.equal(run.score, run.next);
    assert.ok(run.gates[run.next].x > run.dist + BX - 1);
    total += run.score;
  }
  assert.ok(total > 0, "a steady rhythm gets through some gaps");
});

test("score bands give a kind line; the friend lines compare honestly", () => {
  assert.match(humanLine(0), /প্রথম তারেই/);
  assert.match(humanLine(3), /বেলুনওয়ালা/);
  assert.match(humanLine(10), /পথ খুঁজে/);
  assert.match(humanLine(20), /কাক/);
  assert.match(humanLine(45), /সহজে ফাটে না/);
  assert.match(humanLine(120), /সব তারের জট/);
  assert.equal(versusLine(15, 12, "রাফি"), "রাফির চেয়ে ৩টা ফাঁক বেশি!");
  assert.equal(versusLine(12, 12, "রাফি"), "সমান সমান! দুজনেই ১২টা ফাঁক।");
  assert.equal(versusLine(10, 12, "জাহিদ"), "আর একটু হলেই! জাহিদের চেয়ে মাত্র ২টা কম।");
  assert.equal(versusLine(2, 12, ""), "এবার বন্ধু এগিয়ে। একই তার, আরেকবার চেষ্টা করো।");
  const card = { seed: 7, score: 37, name: "রাফি", big: true, slow: false, stage: 0 };
  assert.equal(friendBanner(card), "রাফি ৩৭টা ফাঁক পার করেছে। একই তারের জট, এবার তোমার পালা।");
  assert.equal(friendNote(card), "রাফির নিজের ফোনের স্কোর, বড় ফাঁকে");
  assert.equal(previewTitle({ ...card, name: "" }), "এক বন্ধু তারের জটে ৩৭টা ফাঁক পার করেছে। তুমি পারবে?");
  assert.match(caption(card), /৩৭টা ফাঁক/);
  assert.match(caption({ ...card, score: 0 }), /প্রথম তারেই/);
});

test("links round-trip and reject hostile or broken input", () => {
  const card = { seed: 123456, score: 37, name: "রাফি", big: true, slow: true, stage: 0 };
  const hash = cardHash(card);
  assert.equal(hash, `s=123456&t=37&b=1&d=1&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseCard(`#${hash}`), card);
  assert.deepEqual(parseCard("s=9&t=0"), { seed: 9, score: 0, name: "", big: false, slow: false, stage: 0 });
  assert.equal(cardHash({ ...card, score: 5000 }).includes(`t=${MAX_SCORE}`), true);
  for (const bad of ["", "s=0&t=3", "s=1&t=-1", "s=1&t=1000", "s=1.5&t=3", "s=1&t=3.2", "s=abc&t=3", "s=1&t=3&b=2", "s=1&t=3&d=yes", "s=1000000000&t=3", `s=1&t=3&n=${"x".repeat(700)}`]) {
    assert.equal(parseCard(bad), null, bad);
  }
  const hostile = parseCard(`s=5&t=8&n=${encodeURIComponent("  রা‮ফি\u0000  খুব লম্বা একটা নাম যেটা বিশ অক্ষরের বেশি ")}`);
  assert.ok(hostile && !/[\u0000‮]/.test(hostile.name) && [...hostile.name].length <= 20);
});

test("share.ts normalizes, caps and previews", () => {
  assert.equal(share.normalize("t=37&s=123&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&b=1"), `s=123&t=37&b=1&n=${encodeURIComponent("রাফি")}`);
  assert.equal(share.normalize("s=1&t=99999"), null);
  assert.equal(share.normalize("<script>"), null);
  assert.equal(share.preview("s=7&t=12&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF").title, "রাফি তারের জটে ১২টা ফাঁক পার করেছে। তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content fits the SEO limits and never names a trademark", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("বেলুন গেম"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.privacy.some(line => line.includes("লিংক")));
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /flappy|ফ্ল্যাপি|bird|পাখি/i);
});
