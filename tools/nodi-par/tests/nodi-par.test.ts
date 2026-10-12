import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import {
  bn, compareLine, detailLine, humanLine, nearLine, newsOf, parseShareHash, previewTitle, riverLabel, secs, shareHash, MAX_SPLASHES, PLACES, type Shared,
} from "../lib/result";
import {
  act, createRun, dipOf, drain, floaterAt, holds, leftOf, levelSeed, makeRiver, mangoCount, minTenths, openingLevel, specOf, starsOf, stepRun, tenths,
  ARRIVED, BANK, BLOCKED, CHAR, COLS, DIP_PERIOD, DIP_UNDER, DIP_WARN, DOWN, EDGY, FERRY, FERRY_IN, HOP_T, HOPPED, LEFT, LEVEL_COUNT, MANGO, MAX_TENTHS, NEAR,
  PANA, PAR, RESPAWN_T, RESPAWNED, RIGHT, RING, SPLASHED, START_X, UP, VELA, WATER, type Lane, type River, type Run,
} from "../lib/river";
import { allMangoTime, crossTime } from "../lib/solve";
import { share } from "../share";

const DT = 1 / 60;
const rivers = Array.from({ length: LEVEL_COUNT }, (_, index) => makeRiver(index + 1));

/** A tiny hand-made river for rule tests: start bank, the given water lanes, goal bank. */
function custom(lanes: Partial<Lane>[], mangoes: River["mangoes"] = []): River {
  const land = (type: number): Lane => ({ type, dir: 1, speed: 0, floaters: [], wake: false, ring: RING });
  return { level: 1, seed: levelSeed(1), lanes: [land(BANK), ...lanes.map(lane => ({ ...land(WATER), ...lane }) as Lane), land(BANK)], mangoes, rain: false, par: 10, ferry: false };
}
/** Steps until the run settles (no hop in the air, not in the water) or `seconds` pass; returns every event seen. */
function settle(run: Run, seconds = 2) {
  let events = drain(run);
  for (let t = 0; t < seconds && (run.hop > 0 || run.down > 0 || run.falling); t += DT) { stepRun(run, DT); events |= drain(run); }
  return events;
}
/** A floater sitting still under the kid's column. */
const raft = (at = START_X - 1 + (RING - COLS) / 2, len = 2, kind = VELA) => ({ kind, at, len, dip: -1 });

test("the same level gives the same river; different levels differ", () => {
  assert.deepEqual(makeRiver(7), makeRiver(7));
  assert.deepEqual(makeRiver(23, 555), makeRiver(23, 555));
  assert.notDeepEqual(makeRiver(7).lanes, makeRiver(8).lanes);
  assert.notDeepEqual(makeRiver(7, 1).lanes, makeRiver(7, 2).lanes);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.equal(rivers[level - 1].seed, levelSeed(level));
});

test("every river is built fairly: banks at both ends, opposite currents side by side, no wide gaps, the first hop lands", () => {
  for (const river of rivers) {
    const spec = specOf(river.level), lanes = river.lanes;
    assert.equal(lanes[0].type, BANK); assert.equal(lanes.at(-1)!.type, BANK);
    assert.equal(lanes.filter(lane => lane.type === WATER).length, spec.water, `river ${river.level}`);
    assert.equal(lanes.filter(lane => lane.type === CHAR).length, spec.chars);
    assert.equal(lanes.some(lane => lane.floaters.some(floater => floater.kind === FERRY)), spec.ferry);
    assert.equal(lanes.filter(lane => lane.wake).length, spec.wake);
    for (let row = 1; row < lanes.length - 1; row++) {
      const lane = lanes[row];
      if (lane.type !== WATER) continue;
      if (lanes[row + 1].type === WATER) assert.notEqual(lane.dir, lanes[row + 1].dir, `river ${river.level} rows ${row}/${row + 1} flow the same way`);
      assert.ok(lane.floaters.length >= 2 && lane.speed > 0 && lane.speed < 3);
      const sorted = [...lane.floaters].sort((a, b) => a.at - b.at);
      sorted.forEach((floater, index) => {
        const next = sorted[(index + 1) % sorted.length];
        const gap = (((next.at - floater.at - floater.len) % lane.ring) + lane.ring) % lane.ring;
        assert.ok(gap >= spec.gap[0] - 1e-6 && gap <= spec.gap[1] + 1e-6, `river ${river.level} row ${row} gap ${gap.toFixed(2)}`);
      });
    }
    assert.ok(holds(lanes[1], START_X, 0, -0.5), `river ${river.level}: the first hop must land`);
    assert.equal(river.mangoes.length, mangoCount(river.level));
    for (const mango of river.mangoes) assert.ok(lanes[mango.row].type !== BANK && !lanes[mango.row].wake && !lanes[mango.row].floaters.some(f => f.kind === FERRY && mango.floater >= 0 && lanes[mango.row].floaters[mango.floater] === f));
  }
});

test("a careful player crosses every river, from the start and after a splash on any bank or চর, whenever they begin", () => {
  for (const river of rivers) {
    river.lanes.forEach((lane, row) => {
      if (lane.type === WATER || row === river.lanes.length - 1) return;
      for (const t of [0, 3.7, 9.1]) for (const x of row === 0 ? [START_X] : [1.5, START_X, 7.5]) {
        const seconds = crossTime(river, { row, x, t });
        assert.ok(seconds !== null && seconds < 60, `river ${river.level} from row ${row} x ${x} at ${t}s: ${seconds}`);
      }
    });
  }
});

test("the careful player is not a pushover: it refuses a river nobody could stand on", () => {
  const sliver = custom([{ dir: 1, speed: 1, floaters: [{ kind: VELA, at: 3, len: 0.3, dip: -1 }, { kind: VELA, at: 11, len: 0.3, dip: -1 }] }]);
  assert.equal(crossTime(sliver), null);
});

test("every mango can be picked up, and the time star is in reach with every mango", () => {
  for (const river of rivers) {
    const perfect = allMangoTime(river);
    assert.ok(perfect !== null, `river ${river.level}: a mango is out of reach`);
    // PAR is recomputed from the careful player, so changing the river generator can't silently break the stars.
    assert.equal(PAR[river.level - 1], Math.ceil(perfect * 1.25 + river.lanes.length * 0.9 + 2), `river ${river.level}`);
    assert.equal(starsOf(river, perfect, river.mangoes.length), 3);
  }
});

test("stars: one for crossing, one for the time, one for every mango", () => {
  const river = rivers[4];
  assert.equal(starsOf(river, river.par + 5, 0), 1);
  assert.equal(starsOf(river, river.par, 0), 2);
  assert.equal(starsOf(river, river.par + 0.1, river.mangoes.length), 2);
  assert.equal(starsOf(river, river.par - 1, river.mangoes.length), 3);
  assert.equal(tenths(12.34), 123);
  assert.equal(tenths(0), 1);
  assert.equal(tenths(5000), MAX_TENTHS);
  assert.equal(nearLine(PAR[4] * 10 + 24, mangoCount(5), 5), "আর ২.৪ সেকেন্ড আগে পৌঁছালেই আরেকটা তারা।");
  assert.equal(nearLine(PAR[4] * 10, mangoCount(5) - 1, 5), "আর ১টা আম তুললেই আরেকটা তারা।");
  assert.match(nearLine(PAR[4] * 10 + 5, 0, 5), /^আরেকটা তারা: ০.৫ সেকেন্ড আগে পৌঁছাও, বা আরও ২টা আম তোলো।$/);
  assert.equal(nearLine(10, mangoCount(5), 5), "");
});

test("a hop onto empty water is a splash, then back on the last bank", () => {
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [raft(0)] }]);
  const run = createRun(river);
  assert.equal(act(run, UP), true);
  assert.equal(run.falling, true);
  let events = settle(run);
  assert.ok(events & HOPPED && events & SPLASHED && events & RESPAWNED);
  assert.equal(run.splashes, 1); assert.equal(run.row, 0); assert.equal(run.x, START_X);
  assert.ok(run.t >= HOP_T + RESPAWN_T - 0.02);
  // A miss by a hair gets the kinder word.
  const hair = custom([{ dir: 1, speed: 0.0001, floaters: [raft(START_X + 0.3 + (RING - COLS) / 2)] }]);
  const close = createRun(hair);
  act(close, UP);
  events = settle(close);
  assert.ok(events & SPLASHED && events & NEAR);
});

test("standing on a raft carries you; past the screen's edge the current takes you", () => {
  const river = custom([{ dir: 1, speed: 1.5, floaters: [raft(), raft(12)] }]);
  const run = createRun(river);
  act(run, UP); settle(run);
  assert.equal(run.row, 1);
  const before = run.x;
  stepRun(run, 0.5); drain(run);
  assert.ok(Math.abs(run.x - before - 0.75) < 1e-6);
  let events = 0;
  for (let t = 0; t < 6 && !(events & SPLASHED); t += DT) { stepRun(run, DT); events |= drain(run); }
  assert.ok(events & SPLASHED);
  assert.ok(run.splashX > COLS);
});

test("কচুরিপানা in the wake sinks on its rhythm and drops you", () => {
  const pana = { kind: PANA, at: START_X - 1 + (RING - COLS) / 2, len: 2, dip: 0 };
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [pana], wake: true }]);
  assert.equal(dipOf(pana, 0), 0);
  assert.ok(dipOf(pana, DIP_PERIOD - DIP_UNDER - DIP_WARN / 2) > 0 && dipOf(pana, DIP_PERIOD - DIP_UNDER - DIP_WARN / 2) < 1);
  assert.equal(dipOf(pana, DIP_PERIOD - DIP_UNDER / 2), 1);
  assert.equal(floaterAt(river.lanes[1], START_X, DIP_PERIOD - 0.5), -1);
  const run = createRun(river);
  act(run, UP); settle(run);
  assert.equal(run.row, 1);
  let events = 0;
  for (let t = 0; t < DIP_PERIOD && !(events & SPLASHED); t += DT) { stepRun(run, DT); events |= drain(run); }
  assert.ok(events & SPLASHED);
  assert.ok(run.t >= DIP_PERIOD - DIP_UNDER - 0.05 && run.t <= DIP_PERIOD - DIP_UNDER + 0.05);
});

test("edges, the start bank, a queued hop, mangoes, a landing past the end and arrival", () => {
  const river = custom([{ dir: 1, speed: 0.0001, floaters: [raft(), raft(12)] }], [{ row: 1, floater: 0, offset: 1, x: 0 }]);
  const run = createRun(river);
  assert.equal(act(run, DOWN), false);
  assert.ok(drain(run) & BLOCKED);
  for (let i = 0; i < 4; i++) { act(run, LEFT); settle(run); }
  assert.equal(run.x, 0.5);
  assert.equal(act(run, LEFT), false);
  for (let i = 0; i < 4; i++) { act(run, RIGHT); settle(run); }
  assert.equal(run.x, START_X);
  // Up, and up again while still in the air: the second hop waits for the landing.
  const before = run.t;
  act(run, UP); act(run, UP);
  assert.equal(run.queued, UP);
  const events = settle(run, 1) | (() => { let more = 0; for (let t = 0; t < 1 && !run.done; t += DT) { stepRun(run, DT); more |= drain(run); } return more; })();
  assert.ok(events & MANGO, "picked the mango on the way");
  assert.ok(events & ARRIVED);
  assert.equal(run.done, true); assert.equal(run.got, 1); assert.equal(run.row, 2);
  assert.ok(Math.abs(run.time - before - 2 * HOP_T) < 0.05);

  const edge = custom([{ dir: 1, speed: 0.0001, floaters: [raft(START_X + 0.1 + (RING - COLS) / 2)] }]);
  const slide = createRun(edge);
  act(slide, UP);
  assert.ok(drain(slide) & EDGY);
  assert.ok(slide.x > START_X && slide.falling === false, "slides onto the raft");
});

test("the ferry announces itself once as it comes into view", () => {
  const river = rivers[12];
  assert.ok(river.ferry);
  const run = createRun(river);
  let horns = 0;
  for (let t = 0; t < 40; t += DT) { stepRun(run, DT); if (drain(run) & FERRY_IN) horns++; }
  const lane = river.lanes.find(each => each.floaters.some(floater => floater.kind === FERRY))!;
  const loops = 40 * lane.speed / lane.ring;
  assert.ok(horns >= Math.floor(loops) - 1 && horns <= Math.ceil(loops) + 1, `${horns} horns in ${loops.toFixed(1)} loops`);
});

/** A thumb with a little lag: hops up when the next row looks like it'll hold, sidesteps away from the edge. */
function play(river: River, seed: number) {
  const run = createRun(river);
  let wait = 0, decided = 0, state = seed;
  const noise = () => { state = (state * 1103515245 + 12345) % 2147483648; return state / 2147483648 - 0.5; };
  while (!run.done && run.t < 240) {
    stepRun(run, DT); drain(run);
    if (run.done || run.down > 0 || run.hop > 0 || run.falling) continue;
    if (decided) { wait -= DT; if (wait <= 0) { act(run, decided); decided = 0; } continue; }
    if (holds(river.lanes[run.row + 1], run.x + noise() * 0.8, run.t + 0.35, -0.1)) { decided = UP; wait = 0.35; continue; }
    const lane = river.lanes[run.row];
    if (lane.type === WATER) {
      const drift = run.x + lane.dir * lane.speed;
      const away = lane.dir > 0 ? LEFT : RIGHT;
      if ((drift < 1 || drift > COLS - 1) && holds(lane, run.x + (away === LEFT ? -1 : 1), run.t + 0.35, -0.1)) { decided = away; wait = 0.35; }
    }
  }
  return run;
}

test("headless runs: a laggy thumb crosses every river in a sane time", () => {
  for (const river of rivers) {
    const run = play(river, river.level * 31);
    assert.ok(run.done, `river ${river.level} not crossed`);
    assert.ok(run.time > minTenths(river.level) / 10 && run.time < 90, `river ${river.level}: ${run.time.toFixed(1)}s`);
    assert.ok(run.splashes < 15 && run.got <= river.mangoes.length);
    assert.ok(starsOf(river, run.time, run.got) >= 1);
  }
  // The first river is a near-certain win inside 10 seconds.
  const first = play(rivers[0], 7);
  assert.ok(first.time < 10 && first.splashes === 0);
});

const sample: Shared = { level: 7, seed: levelSeed(7), tenths: 154, mangoes: 2, splashes: 1, name: "রাফি" };

test("challenge links round-trip and reject anything that doesn't fit its river", () => {
  const hash = shareHash(sample);
  assert.deepEqual(parseShareHash(`#${hash}`), sample);
  assert.equal(share.normalize(hash), hash);
  const bad = [
    `s=${levelSeed(7) + 1}&t=154&l=7&a=2&p=1`, // another seed
    `s=${levelSeed(7)}&t=154&l=31&a=2&p=1`, `s=${levelSeed(7)}&t=154&l=0&a=2&p=1`, `s=${levelSeed(7)}&t=154&a=2&p=1`,
    `s=${levelSeed(7)}&t=${minTenths(7) - 1}&l=7&a=2&p=1`, // faster than one hop a row
    `s=${levelSeed(7)}&t=${MAX_TENTHS + 1}&l=7&a=2&p=1`, `s=${levelSeed(7)}&t=15.4&l=7&a=2&p=1`,
    `s=${levelSeed(7)}&t=154&l=7&a=${mangoCount(7) + 1}&p=1`, `s=${levelSeed(7)}&t=154&l=7&a=-1&p=1`, `s=${levelSeed(7)}&t=154&l=7&a=2`,
    `s=${levelSeed(7)}&t=154&l=7&a=2&p=${MAX_SPLASHES + 1}`, `s=${levelSeed(7)}&t=154&l=7&a=2&p=1e2`, `s=${levelSeed(7)}&t=154&l=07x&a=2&p=1`,
    `s=${levelSeed(7)}&t=154&l=7&a=2&p=1&n=${"x".repeat(700)}`, "", "garbage", "s=<script>",
  ];
  for (const state of bad) { assert.equal(parseShareHash(state), null, state); assert.equal(share.normalize(state), null, state); }
  // Names are cleaned and capped, never trusted.
  const named = parseShareHash(`s=${levelSeed(7)}&t=154&l=7&a=2&p=1&n=${encodeURIComponent("  <b>রাফি</b>‮ আহমেদ খুব লম্বা নাম আরও আরও")}`)!;
  assert.ok(named && [...named.name].length <= 20 && !named.name.includes("‮"));
  assert.equal(share.preview(hash).title, "রাফি ১৫.৪ সেকেন্ডে নদী পার হয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...sample, name: "" }), "১৫.৪ সেকেন্ডে নদী পার! তুমি পারবে?");
  assert.ok(share.preview("nonsense").title.length > 10);
});

test("words: labels, bands, comparisons", () => {
  assert.equal(secs(154), "১৫.৪"); assert.equal(secs(7), "০.৭"); assert.equal(bn(30), "৩০");
  assert.equal(riverLabel(7), "নদী ৭ · ওপারে বটতলা");
  assert.equal(PLACES.length, LEVEL_COUNT);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(newsOf(level).length > 5);
  assert.equal(humanLine({ level: 7, splashes: 0, mangoes: mangoCount(7) }), "একবারও পানিতে পড়োনি, আমও সব তোলা। ব্যাগ শুকনো।");
  assert.equal(humanLine({ level: 7, splashes: 0, mangoes: 0 }), "একবারও পানিতে পড়োনি। স্কুলব্যাগ একদম শুকনো।");
  assert.equal(humanLine({ level: 7, splashes: 1, mangoes: 0 }), "একবার ছপাৎ। গামছায় মুছে আবার লাফ।");
  assert.match(humanLine({ level: 7, splashes: 4, mangoes: 0 }), /^৪ বার পানিতে/);
  assert.match(humanLine({ level: 7, splashes: 9, mangoes: 0 }), /গোসল/);
  assert.equal(detailLine(sample), "আম ২/২ · ১ বার পানিতে");
  assert.equal(compareLine(140, 154, "রাফি"), "রাফির চেয়ে ১.৪ সেকেন্ড আগে পৌঁছালে!");
  assert.equal(compareLine(154, 154, ""), "বন্ধু আর তুমি একদম সমান।");
  assert.match(compareLine(165, 154, "রাফি"), /^আর একটু হলেই! রাফির চেয়ে মাত্র ১.১ সেকেন্ড পিছে।$/);
  assert.match(compareLine(400, 154, "রাফি"), /এগিয়ে/);
});

test("progress goes through the kit's readLevels and recordLevel; returning players open where they left off", () => {
  let stars = readLevels('{"1":3,"2":2,"3":1,"40":3,"x":2,"4":7}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 2, 3: 1 });
  assert.equal(openingLevel(stars, unlockedLevel(stars, LEVEL_COUNT)), 2);
  stars = recordLevel(recordLevel(stars, 2, 3), 2, 1);
  assert.equal(stars[2], 3);
  assert.equal(openingLevel(stars, unlockedLevel(stars, LEVEL_COUNT)), 3);
  assert.equal(openingLevel(readLevels(null, LEVEL_COUNT), 1), 1);
  const done = Object.fromEntries(Array.from({ length: LEVEL_COUNT }, (_, index) => [index + 1, 3]));
  assert.equal(openingLevel(done, LEVEL_COUNT), LEVEL_COUNT);
});

test("content meets the SEO limits and keeps clear of famous names", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => item.answer.includes("পিয়নের সাইকেল")));
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  const all = JSON.stringify(site) + newsOf(13) + newsOf(15);
  for (const word of ["frogger", "crossy", "ফ্রগার", "ক্রসি", "chicken", "মুরগি", "গাড়ি"]) assert.ok(!all.toLowerCase().includes(word), word);
  for (const line of [site.lead, site.guideIntro, ...site.steps, ...site.faq.map(item => item.answer)]) assert.ok((line.match(/!/g) ?? []).length <= 1, line);
});

test("leftOf and floaterAt agree near the loop's seam", () => {
  const lane: Lane = { type: WATER, dir: -1, speed: 1, floaters: [{ kind: VELA, at: 0.5, len: 2, dip: -1 }], wake: false, ring: RING };
  for (let t = 0; t < 20; t += 0.37) {
    const left = leftOf(lane, lane.floaters[0], t);
    if (left > 0.3 && left + 2 < COLS - 0.3) { assert.equal(floaterAt(lane, left + 1, t, 0), 0); assert.equal(floaterAt(lane, left - 0.5, t, 0), -1); }
  }
});
