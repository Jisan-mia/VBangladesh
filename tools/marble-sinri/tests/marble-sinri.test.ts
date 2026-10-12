import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  below, fallTime, landable, landingPoint, makeStairs, newRun, openColours, reachable, scoreOf, segments, speedAt, stageOf, stageStars, startRowOf, step,
  BONUS, CHANCES, CLEAR, CLEAR_STAGE, FIRST_Y, GAP, H, HURT, LAND, MARBLES, OVER, PICK, R, SAFE, STAGE_COUNT, STAGE_ROWS, STAGES, STEP, TOP, VX, W,
  type Ledge, type Run,
} from "../lib/game";
import { caption, cardHash, compareLine, friendBanner, friendNote, humanLine, MAX_SCORE, nearLine, parseCard, previewTitle, type Card } from "../lib/result";
import { landClick, oof, rollHum, ting } from "../lib/sound";

const seeds = Array.from({ length: 40 }, (_, index) => 1 + index * 7_654_321);

function rowsFor(seed: number, stage: number, count: number) {
  const stairs = makeStairs(seed, stage), rows = [stairs.first];
  while (rows.length < count) rows.push(stairs.next(rows[rows.length - 1]));
  return rows;
}

/**
 * A player who keeps pace: waits until its ledge has risen to mid-board, then takes the nearest way down onto the next row,
 * steering in the air to a safe spot. It follows the same model the fairness rule promises, so it should never lose a chance.
 */
function pacer(run: Run) {
  let target = NaN;
  return () => {
    const on = run.on;
    if (!on) return Number.isNaN(target) || Math.abs(target - run.x) <= VX * STEP ? 0 : Math.sign(target - run.x);
    target = NaN;
    if (on.y > H * 0.55) return 0;
    const next = below(run, on);
    if (!next) return 0;
    const reach = VX * (fallTime(run.speed) - STEP);
    const mine = segments(on).find(segment => run.x >= segment.x0 - 0.5 && run.x <= segment.x1 + 0.5);
    if (!mine) return 0;
    let best = NaN, bestEdge = NaN;
    for (const [ok, edge] of [[mine.left, mine.x0], [mine.right, mine.x1]] as const) {
      if (!ok) continue;
      const point = landingPoint(next, edge, reach, 6);
      if (!Number.isNaN(point) && (Number.isNaN(bestEdge) || Math.abs(edge - run.x) < Math.abs(bestEdge - run.x))) { best = point; bestEdge = edge; }
    }
    if (Number.isNaN(bestEdge)) return 0;
    target = best;
    return bestEdge < run.x ? -1 : 1;
  };
}

/** A sloppier player: heads for the next row late and with a shaky aim. */
function sloppy(run: Run, seed: number) {
  const rng = makeRng(seed), pace = pacer(run);
  let hold = 0, mood = 0;
  return () => {
    if (hold > 0) { hold--; return mood; }
    if (rng() < 0.03) { hold = 6 + Math.floor(rng() * 20); mood = Math.floor(rng() * 3) - 1; return mood; }
    return pace();
  };
}

function play(run: Run, player: () => number, steps: number) {
  const seen = { land: 0, pick: 0, hurt: 0, clear: 0, bonus: 0, over: 0 };
  for (let i = 0; i < steps && !run.over; i++) {
    step(run, STEP, player());
    if (run.events & LAND) seen.land++;
    if (run.events & PICK) seen.pick++;
    if (run.events & HURT) seen.hurt++;
    if (run.events & CLEAR_STAGE) seen.clear++;
    if (run.events & BONUS) seen.bonus++;
    if (run.events & OVER) seen.over++;
  }
  return seen;
}

test("same seed and stage, same stairs; another seed or stage, different stairs", () => {
  assert.deepEqual(rowsFor(4242, 1, 80), rowsFor(4242, 1, 80));
  assert.notDeepEqual(rowsFor(4242, 1, 80), rowsFor(4243, 1, 80));
  assert.notDeepEqual(rowsFor(4242, 3, 30).map(l => l.x0), rowsFor(4242, 4, 30).map(l => l.x0));
  const a = newRun(99, 2), b = newRun(99, 2);
  play(a, () => 1, 300); play(b, () => 1, 300);
  assert.equal(a.x, b.x); assert.equal(a.chances, b.chances); assert.deepEqual(a.rows, b.rows);
});

test("eight stages, each faster with narrower ledges and more pots", () => {
  assert.equal(STAGE_COUNT, 8);
  for (let i = 1; i < STAGE_COUNT; i++) {
    assert.ok(STAGES[i].speed > STAGES[i - 1].speed && STAGES[i].width[1] <= STAGES[i - 1].width[1] && STAGES[i].pots > STAGES[i - 1].pots, `stage ${i + 1}`);
  }
  assert.equal(stageOf(0), 0); assert.equal(stageOf(19), 0); assert.equal(stageOf(20), 1); assert.equal(stageOf(10_000), STAGE_COUNT - 1);
  assert.equal(startRowOf(1), 0); assert.equal(startRowOf(4), 3 * STAGE_ROWS);
  assert.equal(MARBLES.length, STAGE_COUNT + 1);
  assert.deepEqual(openColours({}), [true, false, false, false, false, false, false, false, false]);
  assert.deepEqual(openColours({ 1: 3, 2: 1 }).slice(0, 4), [true, true, true, false]);
});

test("fair: every generated ledge can be reached from the one above at that row's speed, and at every slower speed", () => {
  for (const seed of seeds) {
    for (const stage of [1, 4, 8]) {
      const rows = rowsFor(seed, stage, 220);
      for (let i = 1; i < rows.length; i++) {
        const [a, b] = [rows[i - 1], rows[i]];
        assert.ok(b.x0 >= 0 && b.x1 <= W && b.x1 - b.x0 >= STAGES[stageOf(b.row)].width[0] - 1e-9, `inside the board, seed ${seed} row ${b.row}`);
        assert.ok(landable(b).length > 0, `a safe landing spot, seed ${seed} row ${b.row}`);
        assert.ok(b.pot < 0 || (b.pot - CLEAR >= b.x0 - 1e-9 && b.pot + CLEAR <= b.x1 + 1e-9), "the pot sits on its ledge");
        for (const speed of new Set(STAGES.map(s => s.speed).filter(s => s <= speedAt(b.row)))) {
          assert.ok(reachable(a, b, speed), `seed ${seed} stage ${stage} row ${b.row} at ${speed}`);
        }
      }
    }
  }
});

test("the fairness rule refuses what a marble can't do", () => {
  const ledge = (x0: number, x1: number, pot = -1): Ledge => ({ row: 1, x0, x1, y: 0, kind: "concrete", pot, pick: -1, picked: false });
  assert.ok(reachable(ledge(100, 160), ledge(60, 140), 124), "a step down to the left");
  assert.ok(!reachable(ledge(100, 200), ledge(60, 140), 124), "too long a roll to the only way down");
  assert.ok(!reachable(ledge(100, 200), ledge(300, 360), 124), "too far to the side");
  assert.ok(!reachable(ledge(0, 100), ledge(0, 80), 124), "against the wall, no way off that side");
  assert.ok(!reachable(ledge(40, 320), ledge(10, 60), 124), "a ledge too wide to roll off in time");
  assert.ok(!reachable(ledge(100, 200), ledge(60, 140, 100), 124), "the only spot in reach is the cactus pot");
  assert.ok(!reachable(ledge(100, 200), ledge(160, 300), 124) || reachable(ledge(100, 200), ledge(160, 300), 50), "slower is never harder");
  // A pot in the middle splits the ledge: both halves need their own way down.
  assert.ok(!reachable(ledge(100, 220, 160), ledge(40, 110), 124), "the right half can't reach a ledge on the left");
  assert.ok(fallTime(50) > fallTime(124) && fallTime(124) > 0.2);
});

test("a player who keeps pace clears all eight stages without losing a chance", () => {
  for (const seed of seeds.slice(0, 15)) {
    const run = newRun(seed, 1), seen = play(run, pacer(run), 60 * 60 * 6);
    assert.equal(seen.hurt, 0, `seed ${seed}: ${run.hurt} at row ${run.deepest}`);
    assert.ok(scoreOf(run) >= STAGE_COUNT * STAGE_ROWS, `seed ${seed} reached ${scoreOf(run)}`);
    assert.equal(run.cleared.length, STAGE_COUNT);
    assert.ok(run.cleared.every(stage => stage.stars === 3));
  }
  // From a later stage too.
  const later = newRun(777, 6), seen = play(later, pacer(later), 60 * 90);
  assert.equal(seen.hurt, 0);
  assert.deepEqual(later.cleared.map(c => c.stage), [6, 7, 8]);
});

test("headless runs end sanely: no input, holding one side, and a sloppy player", () => {
  const idle = newRun(31337, 1), quiet = play(idle, () => 0, 60 * 120);
  assert.ok(idle.over && quiet.hurt === CHANCES, "the first ledge rises to the top, three times");
  assert.ok(scoreOf(idle) <= 2);
  const lean = newRun(31337, 1), leaning = play(lean, () => 1, 60 * 120);
  assert.ok(lean.over && leaning.hurt >= CHANCES);
  for (const seed of seeds.slice(0, 10)) {
    const run = newRun(seed, 1), seen = play(run, sloppy(run, seed), 60 * 60 * 10);
    assert.ok(run.over, `seed ${seed} ends`);
    assert.ok(scoreOf(run) > 5 && scoreOf(run) < 5000, `seed ${seed}: ${scoreOf(run)}`);
    assert.ok(run.marbles <= scoreOf(run) + 1 && seen.pick === run.marbles);
    assert.ok(run.chances === 0 && seen.over === 1);
  }
});

test("collisions: the top, the bottom, a cactus pot, landing, marbles and the refill", () => {
  const run = newRun(5, 1);
  run.on = null; run.y = TOP + R - 1; step(run, STEP, 0);
  assert.equal(run.hurt, "top"); assert.equal(run.chances, CHANCES - 1); assert.ok(run.wait > 0 && run.on);
  while (run.wait > 0) step(run, STEP, 0);
  run.on = null; run.skip = null; run.x = W - R; run.y = H + R + 2; step(run, STEP, 0);
  assert.equal(run.hurt, "bottom"); assert.equal(run.chances, CHANCES - 2);

  const pot = newRun(5, 1);
  const ledge = pot.on!;
  ledge.pot = pot.x + CLEAR + 2;
  step(pot, STEP, 1);
  assert.equal(pot.hurt, "cactus");
  assert.ok(pot.on && (pot.on.pot < 0 || Math.abs(pot.x - pot.on.pot) >= CLEAR), "respawns clear of any pot");

  // Landing: a falling marble lands on the ledge under it and counts the row.
  const land = newRun(8, 1), next = land.rows[1];
  land.on = null; land.x = (next.x0 + next.x1) / 2; land.y = next.y - R - 30; next.pot = -1;
  let landed = false;
  for (let i = 0; i < 60 && !landed; i++) { step(land, STEP, 0); landed = (land.events & LAND) > 0; }
  assert.ok(landed && (land.on as Ledge | null) === next && land.deepest === next.row && scoreOf(land) === 1);

  // Marbles: the fifth refills a lost chance, never above three.
  const picks = newRun(9, 1);
  picks.chances = 2; picks.marbles = 4;
  const row = picks.on!;
  row.pick = picks.x; row.picked = false;
  step(picks, STEP, 0);
  assert.equal(picks.marbles, 5); assert.equal(picks.chances, 3); assert.ok(picks.events & BONUS);

  // The last chance ends the run.
  const last = newRun(10, 1);
  last.chances = 1; last.on = null; last.y = TOP;
  step(last, STEP, 0);
  assert.ok(last.over && (last.events & OVER));
  step(last, STEP, 1);
  assert.equal(last.events, 0, "nothing moves after the end");
});

test("stage stars: no chance lost = 3, one = 2, more = 1, saved through readLevels and recordLevel", () => {
  assert.deepEqual([0, 1, 2, 3, 5].map(stageStars), [3, 2, 1, 1, 1]);
  const run = newRun(12, 1);
  run.stageHits = 1;
  const ledge = run.rows[2];
  run.deepest = STAGE_ROWS - 1; run.on = null; run.skip = null; ledge.row = STAGE_ROWS; ledge.pot = -1;
  run.x = (ledge.x0 + ledge.x1) / 2; run.y = ledge.y - R - 20;
  for (let i = 0; i < 60 && !(run.events & CLEAR_STAGE); i++) step(run, STEP, 0);
  assert.deepEqual(run.cleared, [{ stage: 1, stars: 2 }]);
  assert.equal(run.stageHits, 0);
  assert.equal(run.speed, STAGES[1].speed, "the stairs speed up with the new stage");

  let saved = readLevels(null, STAGE_COUNT);
  for (const { stage, stars } of [{ stage: 1, stars: 2 }, { stage: 2, stars: 3 }, { stage: 1, stars: 1 }]) saved = recordLevel(saved, stage, stars);
  assert.deepEqual(saved, { 1: 2, 2: 3 });
  assert.equal(totalStars(saved), 5); assert.equal(unlockedLevel(saved, STAGE_COUNT), 3);
  assert.deepEqual(readLevels(JSON.stringify(saved), STAGE_COUNT), saved);
  assert.deepEqual(readLevels('{"9":3,"1":7,"2":"x","3":2}', STAGE_COUNT), { 3: 2 });
  assert.deepEqual(readLevels("not json", STAGE_COUNT), {});
});

test("score bands, near misses and lines", () => {
  assert.equal(new Set(Array.from({ length: STAGE_COUNT }, (_, index) => humanLine(index * STAGE_ROWS, 1))).size, STAGE_COUNT, "one line per stage reached");
  assert.equal(humanLine(0, 3), humanLine(40, 1), "counted from the starting stage");
  assert.equal(humanLine(MAX_SCORE, 1), humanLine(STAGE_COUNT * STAGE_ROWS, 1));
  assert.equal(nearLine({ score: 36, start: 1, best: null, cleared: [] }), "আর ৪ ধাপ নামলে চিলেকোঠা পার।");
  assert.equal(nearLine({ score: 12, start: 1, best: 15, cleared: [] }), "আর ৪ ধাপ নামলে নতুন রেকর্ড।");
  assert.equal(nearLine({ score: 25, start: 1, best: 100, cleared: [{ stage: 1, stars: 2 }] }), "ছাদ পার হলো ২ তারায়। একবারও না পড়লে ৩ তারা।");
  assert.equal(nearLine({ score: 175, start: 1, best: 100, cleared: [{ stage: 8, stars: 2 }] }), "গলি পার হলো ২ তারায়। একবারও না পড়লে ৩ তারা।");
  assert.equal(nearLine({ score: 50, start: 1, best: 40, cleared: [{ stage: 1, stars: 3 }, { stage: 2, stars: 3 }] }), "");
  assert.equal(compareLine(50, 40, "রাফি"), "রাফির চেয়ে ১০ ধাপ বেশি!");
  assert.equal(compareLine(40, 40, "রাফি"), "সমান সমান! দুজনেই ৪০ ধাপ।");
  assert.equal(compareLine(37, 40, ""), "আর একটু হলেই! বন্ধুর চেয়ে মাত্র ৩ ধাপ কম।");
  assert.match(compareLine(10, 40, "রাফি"), /রাফি এগিয়ে, ৩০ ধাপ/);
});

test("a challenge link round-trips and refuses hostile or impossible input", () => {
  const card: Card = { seed: 123456, stage: 2, score: 86, marbles: 21, colour: 3, name: "রাফি" };
  const hash = cardHash(card);
  assert.equal(hash, `s=123456&t=86&l=2&m=21&c=3&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseCard(`#${hash}`), card);
  assert.equal(previewTitle(card), "রাফি মার্বেল গড়িয়ে ৮৬ ধাপ নেমেছে। তুমি পারবে?");
  assert.match(friendBanner(card), /রাফি ৮৬ ধাপ নেমেছে/);
  assert.match(friendNote(card), /রাফির নিজের ফোনের স্কোর/);
  assert.match(caption(card), /৮৬ ধাপ/);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  assert.deepEqual(parseCard(cardHash({ ...card, name: "", colour: 0, marbles: 0 })), { ...card, name: "", colour: 0, marbles: 0 });
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "-1" }), variant({ t: "1.5" }), variant({ t: String(MAX_SCORE + 1) }), variant({ m: "87" }), variant({ m: "-1" }), variant({ m: "02" }), variant({ m: "x" }),
    variant({ l: "0" }), variant({ l: "9" }), variant({ l: "02" }), variant({ l: null }), variant({ c: "9" }), variant({ c: "-1" }), variant({ c: "1.0" }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseCard(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseCard(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^মার্বেল/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /লাটিম|ক্যারম/.test(item.answer)));
  for (const word of ["নাম", "সিড", "ধাপ", "মার্বেল"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|বাজি|জিতে নাও|nokia|নোকিয়া|rapid|র‍্যাপিড/i);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { landClick(); ting(0); ting(9); oof(); const hum = rollHum(); hum.update(80, true, true); hum.update(124, false, false); hum.stop(); });
});

test("the first screen is a gentle start", () => {
  const run = newRun(1, 1);
  assert.equal(run.on?.y, FIRST_Y);
  assert.ok(run.rows[1].pick >= 0 && run.rows[2].pick >= 0, "a marble to collect on each of the first two rows");
  assert.ok(run.rows.slice(0, 8).every(ledge => ledge.pot < 0), "no cactus in the first rows");
  assert.equal(GAP, 90); assert.ok(SAFE > 2 * R);
});
