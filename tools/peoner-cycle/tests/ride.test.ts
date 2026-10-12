import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import {
  createRun, fair, inPath, laneX, migrateBest, nextMark, pieceAt, planRoad, reachIn, scoreOf, speedAt, starsOf, steer, stepRun, LEVEL_COUNT, ROUTES,
  AHEAD, BELL, BIKE_LEN, BIKE_W, CART, COW, CRASH, FIRST_Y, FRONT_Y, GOAT, GOT_LETTER, HIT, LANE_W, LETTER, PASSED, PUDDLE, RING,
  SLACK, SLOW_CAP, SPEC, START, SWITCH_T, TAKEN, TOP, UNIT, W, type Piece, type Run,
} from "../lib/ride";
import { bands, banner, bellsOf, bumpLine, caption, compareLine, detailLine, humanLine, parseShareHash, previewTitle, shareHash, MAX_METERS, MAX_SCORE } from "../lib/result";
import { share } from "../share";

const DT = 1 / 60;

type Row = { y: number; end: number; blocked: number; things: Piece[] };
function rows(pieces: Piece[]) {
  const list: Row[] = [];
  for (const piece of pieces) {
    if (piece.kind === LETTER) continue;
    let row = list.at(-1);
    if (!row || row.things[0].row !== piece.row) list.push(row = { y: piece.y, end: 0, blocked: 0, things: [] });
    row.things.push(piece);
    row.y = Math.min(row.y, piece.y);
    row.end = Math.max(row.end, piece.y + piece.len);
    row.blocked |= 1 << piece.lane;
  }
  return list;
}

/** Is any obstacle beside the bike right now? Then a lane change could clip it, so a careful rider waits. */
function beside(run: Run) {
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.kind === LETTER || piece.state === TAKEN) continue;
    if (piece.y <= run.d && piece.y + piece.len >= run.d - BIKE_LEN) return true;
  }
  return false;
}

/** The next row still ahead of the bike's front wheel, as a bitmask of blocked lanes. */
function nextBlocked(run: Run) {
  let row = -1, blocked = 0;
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.kind === LETTER || piece.state !== AHEAD || piece.y <= run.d) continue;
    if (row === -1) row = piece.row;
    if (piece.row !== row) break;
    blocked |= 1 << piece.lane;
  }
  return blocked;
}

/**
 * A careful rider: waits until nothing is beside the bike (plus `delay` seconds, a human's reaction), then heads for the
 * nearest open lane of the next row. Taps one lane at a time, like a thumb.
 */
function careful(delay = 0) {
  let clearSince = 0;
  return (run: Run) => {
    if (beside(run)) { clearSince = run.t; return; }
    if (run.t - clearSince < delay) return;
    const blocked = nextBlocked(run);
    if (!(blocked & (1 << run.lane))) return;
    let best = -1;
    for (const lane of [run.lane - 1, run.lane + 1, run.lane - 2, run.lane + 2]) if (lane >= 0 && lane < 3 && !(blocked & (1 << lane))) { best = lane; break; }
    if (best >= 0 && Math.abs(run.x - laneX(run.lane)) < 1) steer(run, best < run.lane ? -1 : 1);
  };
}

function ride(run: Run, meters: number, player: (run: Run) => void, timeScale = 1) {
  for (let steps = 0; !run.over && run.d < meters * UNIT && steps < 500_000; steps++) {
    player(run);
    stepRun(run, DT * timeScale);
    assert.ok(run.count - run.first <= RING, "the ring never overwrites a piece still in play");
  }
  return run;
}

test("the same seed lays the same road; another seed lays another", () => {
  assert.deepEqual(planRoad(4821, 1500), planRoad(4821, 1500));
  assert.notDeepEqual(planRoad(4821, 1500), planRoad(4822, 1500));
  const first = ride(createRun(77), 900, careful()), second = ride(createRun(77), 900, careful());
  assert.deepEqual([first.d, first.t, first.letters, first.bells, first.score], [second.d, second.t, second.letters, second.bells, second.score]);
});

test("slow mode rides the very same road (the road never depends on the real speed)", () => {
  const seen = (run: Run) => { const list: string[] = []; for (let index = 0; index < run.count; index++) list.push(`${pieceAt(run, index).kind}/${pieceAt(run, index).lane}@${pieceAt(run, index).y}`); return list; };
  const fast = ride(createRun(31), 300, careful()), slow = ride(createRun(31, SLOW_CAP), 300, careful(), 0.7);
  assert.deepEqual(seen(fast).slice(0, 20), seen(slow).slice(0, 20));
});

test("speed starts gentle, ramps slowly and is capped; slow mode caps it lower", () => {
  assert.equal(speedAt(0), START);
  assert.ok(speedAt(500) > speedAt(100) && speedAt(500) < TOP);
  assert.equal(speedAt(1_000_000), TOP);
  const run = ride(createRun(5, SLOW_CAP), 1200, careful(), 0.7);
  assert.equal(run.over, false);
  assert.ok(run.speed <= SLOW_CAP);
  // A row coming in at the top of the screen is in view for most of a second even at top speed.
  assert.ok(FRONT_Y / TOP >= 0.9);
});

test("every road is fair: never three lanes shut, never overlapping, and an open lane is always in reach in time", () => {
  for (let seed = 1; seed <= 400; seed++) {
    const pieces = planRoad(seed, 3000), list = rows(pieces);
    assert.equal(list[0].y, FIRST_Y);
    assert.deepEqual([list[0].blocked, list[0].things[0].kind, list[0].things[0].hint], [0b010, PUDDLE, 1], `seed ${seed}: a puddle in your own lane comes first`);
    assert.ok(FIRST_Y / START > 2.5, "time to read the first hint");
    let open = 0b010;
    for (let index = 0; index < list.length; index++) {
      const row = list[index];
      assert.ok(row.blocked !== 0b111, `seed ${seed}: row ${index} shuts every lane`);
      assert.equal(row.things.length, new Set(row.things.map(piece => piece.lane)).size, "one thing a lane");
      if (index > 0) {
        const before = list[index - 1];
        assert.ok(row.y > before.end, `seed ${seed}: rows overlap`);
        const time = (row.y - before.end - BIKE_LEN) / speedAt(row.y / UNIT);
        assert.ok(time >= SLACK + SWITCH_T, `seed ${seed}: row ${index} leaves ${time.toFixed(2)}s`);
        assert.ok(fair(open, 0b111 & ~row.blocked, reachIn(time)), `seed ${seed}: row ${index} can trap a rider`);
      }
      const meters = row.y / UNIT;
      for (const piece of row.things) {
        if (meters < 60) assert.ok(piece.kind === PUDDLE || piece.kind === GOAT, `seed ${seed}: only puddles and goats at first`);
        if (piece.kind === COW) assert.ok(meters >= 130);
        if (piece.kind === CART) assert.ok(meters >= 60);
        // In the next lane, a thing never touches a bike riding the middle of its lane.
        assert.ok(LANE_W - piece.w / 2 - BIKE_W / 2 > 10);
      }
      open = 0b111 & ~row.blocked;
    }
    const letters = pieces.filter(piece => piece.kind === LETTER);
    assert.ok(letters.length > 10, `seed ${seed}: letters along the way`);
    assert.equal(letters[0].hint, 2);
    for (const letter of letters) {
      const after = list.find(row => row.y > letter.y)!, before = list.filter(row => row.y < letter.y).at(-1)!;
      assert.ok(letter.y > before.end && letter.y + letter.len < after.y, "a letter sits in a gap, never on a thing");
      if (after.y / UNIT < 150) assert.ok(!(after.blocked & (1 << letter.lane)), "early letters are free to take");
    }
  }
});

test("a careful rider never crashes: full speed, slow mode, and with a human's reaction time", () => {
  for (let seed = 1; seed <= 150; seed++) {
    for (const [cap, scale, delay] of [[TOP, 1, 0], [SLOW_CAP, 0.7, 0], [TOP, 1, 0.2], [TOP, 1, SLACK - 0.08], [SLOW_CAP, 0.7, 0.25]] as const) {
      const run = ride(createRun(seed, cap), 1600, careful(delay), scale);
      assert.equal(run.over, false, `seed ${seed} cap ${cap} delay ${delay}: hit kind ${run.hitKind} at ${run.meters} m`);
    }
  }
});

test("a rider who never taps stops at the first puddle, with a sane score", () => {
  const run = ride(createRun(9), 5000, () => {});
  assert.deepEqual([run.over, run.hitKind], [true, PUDDLE]);
  assert.ok(run.meters >= 20 && run.meters <= 27, `${run.meters}`);
  assert.equal(run.score, run.meters);
  assert.equal(run.events[(run.eventCount - 1) % run.events.length].type, CRASH);
  assert.equal(pieceAt(run, run.hitAt).state, HIT);
});

test("a random tapper ends sanely with a plausible score and a link that parses", () => {
  let state = 12345;
  const random = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let seed = 1; seed <= 40; seed++) {
    const run = ride(createRun(seed), 8000, current => { const roll = random(); if (roll < 0.015) steer(current, -1); else if (roll < 0.03) steer(current, 1); });
    assert.equal(run.over, true);
    assert.ok(run.meters >= 20 && run.meters < 3000, `seed ${seed}: ${run.meters}`);
    assert.equal(run.score, scoreOf(run.meters, run.letters, run.bells));
    assert.ok(run.x >= laneX(0) && run.x <= laneX(2));
    const shared = { seed, score: run.score, meters: run.meters, letters: run.letters, name: "", level: 1 };
    assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  }
});

test("a long careful ride scores in a believable range", () => {
  const run = ride(createRun(2024), 1000, careful(0.1));
  assert.equal(run.over, false);
  assert.ok(run.letters >= 5 && run.letters <= 60, `letters ${run.letters}`);
  assert.ok(run.score >= 1000 && run.score < 2500, `score ${run.score}`);
  const types = run.events.map(event => event.type);
  assert.ok(types.length > 0);
});

/** One obstacle (or letter) placed by hand right in front of a fresh run, after one step so the road exists. */
function runWith(piece: Partial<Piece>) {
  const run = createRun(1);
  stepRun(run, DT);
  for (let index = run.first; index < run.count; index++) pieceAt(run, index).state = PASSED;
  const slot = pieceAt(run, run.first);
  Object.assign(slot, { kind: GOAT, lane: 1, x: laneX(1), w: SPEC[GOAT].w, y: run.d + 2, len: SPEC[GOAT].len, row: 99, state: AHEAD, close: 0, hint: 0, look: 0 }, piece);
  return { run, slot };
}

test("collisions: the same lane hits, the next lane is clear, and a half-way lane change clips", () => {
  const ahead = runWith({});
  assert.ok(inPath(ahead.run, ahead.slot));
  stepRun(ahead.run, DT);
  assert.deepEqual([ahead.run.over, ahead.run.hitKind, ahead.slot.state], [true, GOAT, HIT]);
  assert.match(bumpLine(GOAT), /ছাগল/);

  const side = runWith({ lane: 2, x: laneX(2), kind: COW, w: SPEC[COW].w, len: SPEC[COW].len });
  for (let index = 0; index < 30; index++) stepRun(side.run, DT);
  assert.equal(side.run.over, false);

  const clip = runWith({ lane: 2, x: laneX(2), kind: CART, w: SPEC[CART].w, y: 0, len: 4000 });
  clip.run.d = 200;
  steer(clip.run, 1);
  for (let index = 0; index < 20 && !clip.run.over; index++) stepRun(clip.run, DT);
  assert.deepEqual([clip.run.over, clip.run.hitKind], [true, CART], "steering into a cart beside you clips it");
  assert.ok(clip.run.x < laneX(2), "it clips on the way, before the lane is reached");
});

test("steering: one tap is one lane, two quick taps two, the edges hold, and a lane change takes SWITCH_T", () => {
  const run = createRun(3);
  steer(run, -1); steer(run, -1);
  assert.equal(run.lane, 0);
  steer(run, 1); steer(run, 1); steer(run, 1);
  assert.equal(run.lane, 2);
  const fresh = createRun(3);
  steer(fresh, 1);
  let steps = 0;
  while (fresh.x !== laneX(2)) { stepRun(fresh, DT); steps++; }
  assert.ok(Math.abs(steps * DT - SWITCH_T) <= DT, `${steps} steps`);
  assert.ok(laneX(0) - LANE_W / 2 >= 60 && laneX(2) + LANE_W / 2 <= W - 60, "grass verges on both sides");
});

test("letters: riding through one takes it (+10); a late dodge rings the bell (+5); an early dodge doesn't", () => {
  const letter = runWith({ kind: LETTER, w: SPEC[LETTER].w, len: SPEC[LETTER].len });
  stepRun(letter.run, DT);
  assert.deepEqual([letter.run.letters, letter.slot.state, letter.run.over], [1, TAKEN, false]);
  assert.equal(letter.run.events[(letter.run.eventCount - 1) % 8].type, GOT_LETTER);
  assert.equal(letter.run.score, letter.run.meters + 10);

  const late = runWith({ y: 0 });
  late.slot.y = late.run.d + late.run.speed * 0.2;
  stepRun(late.run, DT);
  assert.equal(late.slot.close, 1, "in its path inside the bell window");
  steer(late.run, -1);
  for (let index = 0; index < 60; index++) stepRun(late.run, DT);
  assert.deepEqual([late.run.over, late.run.bells, late.slot.state], [false, 1, PASSED]);
  assert.ok(late.run.events.slice(0, late.run.eventCount).some(event => event.type === BELL));
  assert.equal(late.run.score, scoreOf(late.run.meters, 0, 1));

  const early = runWith({ y: 0 });
  early.slot.y = early.run.d + early.run.speed * 0.8;
  steer(early.run, 1);
  for (let index = 0; index < 90; index++) stepRun(early.run, DT);
  assert.deepEqual([early.run.over, early.run.bells], [false, 0]);
});

test("score bands and lines", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(149), bands[0].line);
  assert.equal(humanLine(150), bands[1].line);
  assert.equal(humanLine(799), bands[2].line);
  assert.equal(humanLine(60000), bands[4].line);
  for (const kind of [PUDDLE, GOAT, CART, COW]) assert.ok(bumpLine(kind).length > 8);
  assert.equal(compareLine(642, 522, "রাফি"), "রাফির চেয়ে ১২০ বেশি!");
  assert.match(compareLine(500, 522, "রাফি"), /^আর একটু হলেই!/);
  assert.match(compareLine(100, 900, ""), /^বন্ধু এবার/);
  assert.equal(compareLine(300, 300, "নীলা"), "নীলা আর তুমি একদম সমান সমান!");
  const shared = { seed: 1, score: 527, meters: 387, letters: 12, name: "রাফি", level: 1 };
  assert.equal(bellsOf(shared), 4);
  assert.equal(detailLine(shared), "৩৮৭ মিটার · ১২টা চিঠি · ৪ বার ক্রিং");
  assert.equal(detailLine({ score: 507, meters: 387, letters: 12 }), "৩৮৭ মিটার · ১২টা চিঠি");
  assert.equal(banner(shared), "রাফি ৫২৭ করেছে। একই রাস্তা, এবার তোমার পালা।");
  assert.match(caption(shared), /৩৮৭ মিটার/);
});

test("challenge links round-trip, add up, and refuse hostile or impossible input", () => {
  const shared = { seed: 4821, score: 527, meters: 387, letters: 12, name: "রাফি", level: 1 };
  assert.equal(shareHash(shared), "s=4821&t=527&m=387&c=12&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(`#${shareHash(shared)}`), shared);
  for (const bad of [
    "", "#", "s=abc&t=10&m=10&c=0", "s=1&t=-5&m=20&c=0", "s=1&t=30.5&m=30&c=0", "s=0&t=100&m=100&c=0",
    "s=1&t=100", "s=1&t=100&m=100", "s=1&t=5&m=5&c=0", `s=1&t=${MAX_SCORE + 1}&m=100&c=0`, `s=1&t=30000&m=${MAX_METERS + 1}&c=0`,
    "s=1&t=103&m=100&c=0", "s=1&t=90&m=100&c=0", "s=1&t=600&m=100&c=50", "s=1&t=1000&m=100&c=0", "s=1&t=120&m=1e2&c=2",
    "s=99999999999&t=100&m=100&c=0", `s=1&t=100&m=100&c=0&n=${"x".repeat(700)}`,
  ]) assert.equal(parseShareHash(bad), null, bad);
  const odd = parseShareHash("s=7&t=300&m=300&c=0&n=%E2%80%AE%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF%20%20%20%E0%A6%AD%E0%A6%BE%E0%A6%87%00&evil=1")!;
  assert.equal(odd.name, "রাফি ভাই");
  assert.equal(parseShareHash(`s=7&t=300&m=300&c=0&n=${"ক".repeat(40)}`)!.name.length, 20);

  assert.equal(share.normalize("c=12&m=387&t=527&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&s=4821&x=1"), shareHash(shared));
  assert.equal(share.normalize("s=1&t=999999&m=10&c=0"), null);
  assert.equal(share.normalize("<script>alert(1)</script>"), null);
  assert.equal(share.preview(shareHash(shared)).title, "রাফি ৫২৭ করেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "পিয়নের সাইকেলে ৫২৭! তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
});

test("content meets the SEO limits and keeps clear of famous names", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  assert.doesNotMatch(JSON.stringify(site), /road rash|need for speed|subway|tetris|nokia|ডাক বিভাগ|বাংলাদেশ ডাক|আপনি|করুন/i);
});

test("routes: route 1 is the original road; later routes start faster and denser", () => {
  assert.equal(LEVEL_COUNT, 10);
  assert.deepEqual(planRoad(4821, 1500, 1), planRoad(4821, 1500), "route 1 lays the old road");
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const [before, now] = [ROUTES[level - 2], ROUTES[level - 1]];
    assert.ok(now.boost >= before.boost && now.goal >= before.goal, `route ${level} never gets easier`);
    assert.ok(now.goal < now.stars[0] && now.stars[0] < now.stars[1]);
    const run = createRun(7, TOP, level);
    stepRun(run, DT);
    assert.ok(run.speed > createRun(7).speed, `route ${level} rides off faster`);
  }
  assert.ok(ROUTES[0].goal <= 100, "the first route ends within half a minute");
});

test("every route's road is fair: an open lane is always in reach in time, at the route's own speed", () => {
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const boost = ROUTES[level - 1].boost;
    for (let seed = 1; seed <= 60; seed++) {
      const list = rows(planRoad(seed, 1200, level));
      let open = 0b010;
      for (let index = 0; index < list.length; index++) {
        const row = list[index];
        assert.ok(row.blocked !== 0b111, `route ${level} seed ${seed}: row ${index} shuts every lane`);
        if (index > 0) {
          const time = (row.y - list[index - 1].end - BIKE_LEN) / speedAt(row.y / UNIT + boost);
          assert.ok(time >= SLACK + SWITCH_T, `route ${level} seed ${seed}: row ${index} leaves ${time.toFixed(2)}s`);
          assert.ok(fair(open, 0b111 & ~row.blocked, reachIn(time)), `route ${level} seed ${seed}: row ${index} can trap a rider`);
        }
        open = 0b111 & ~row.blocked;
      }
    }
  }
});

test("every route can be finished with three stars: a careful rider never crashes, at full speed, slow, and with a human's reaction", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const far = ROUTES[level - 1].stars[1] + 20;
    for (let seed = 1; seed <= 25; seed++) {
      for (const [cap, scale, delay] of [[TOP, 1, 0], [SLOW_CAP, 0.7, 0], [TOP, 1, 0.2]] as const) {
        const run = ride(createRun(seed, cap, level), far, careful(delay), scale);
        assert.equal(run.over, false, `route ${level} seed ${seed} cap ${cap} delay ${delay}: hit at ${run.meters} m`);
        assert.equal(starsOf(run.meters, level), 3);
      }
    }
  }
});

test("stars and marks by মিটার; the letter streak climbs and a missed letter resets it", () => {
  assert.equal(starsOf(99, 1), 0);
  assert.equal(starsOf(100, 1), 1);
  assert.equal(starsOf(200, 1), 2);
  assert.equal(starsOf(320, 1), 3);
  assert.equal(nextMark(40, 1), 100);
  assert.equal(nextMark(150, 1), 200);
  assert.equal(nextMark(400, 1), 0);
  const first = runWith({ kind: LETTER, w: SPEC[LETTER].w, len: SPEC[LETTER].len });
  stepRun(first.run, DT);
  assert.equal(first.run.streak, 1);
  const missed = runWith({ kind: LETTER, lane: 2, x: laneX(2), w: SPEC[LETTER].w, len: SPEC[LETTER].len });
  missed.run.streak = 4;
  for (let index = 0; index < 30; index++) stepRun(missed.run, DT);
  assert.deepEqual([missed.run.streak, missed.slot.state, missed.run.over], [0, PASSED, false], "riding past a letter ends the streak");
});

test("the old best moves into route 1's stars once, counting only the মিটার it must have had", () => {
  assert.equal(migrateBest({}, "340"), 1, "340 could be 100 m with letters and bells");
  assert.equal(migrateBest({}, "1000"), 3);
  assert.equal(migrateBest({}, "300"), 0, "300 might be under 100 m: no unearned star");
  assert.equal(migrateBest({}, null), 0);
  assert.equal(migrateBest({}, "x"), 0);
  assert.equal(migrateBest({ 1: 1 }, "1000"), 0, "already moved");
  for (const score of [340, 527, 999]) {
    // The bound holds: no ride that scores this has fewer মিটার than the migration assumes.
    const meters = Math.floor((score - 40) / 3);
    assert.ok(scoreOf(meters - 1, Math.floor((meters - 1) / 10) + 2, Math.floor((meters - 1) / 5) + 4) < score);
  }
});

test("links carry the route; old links without it open route 1; bad routes are refused", () => {
  const shared = { seed: 4821, score: 527, meters: 387, letters: 12, name: "", level: 3 };
  assert.equal(shareHash(shared), "s=4821&t=527&m=387&c=12&l=3");
  assert.deepEqual(parseShareHash(shareHash(shared)), shared);
  assert.equal(parseShareHash("s=4821&t=527&m=387&c=12")?.level, 1);
  assert.equal(shareHash({ ...shared, level: 1 }), "s=4821&t=527&m=387&c=12");
  for (const bad of ["s=1&t=100&m=100&c=0&l=0", "s=1&t=100&m=100&c=0&l=11", "s=1&t=100&m=100&c=0&l=03", "s=1&t=100&m=100&c=0&l=x"]) assert.equal(parseShareHash(bad), null, bad);
});
