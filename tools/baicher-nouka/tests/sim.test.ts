import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { BOAT_LEN, FIRST_BEAT_NEW, FRONT_Y, LANES, PLAYER_LANE, VMAX, fair, laneX, makeCourse, planOf, reachIn } from "../lib/course";
import { CALIB_BEATS, lagFrom } from "../lib/calib";
import { LEVELS, LEVEL_COUNT, LEGACY_LEVEL, OLD_LEVELS, MODE_INFO, isFinale } from "../lib/levels";
import {
  ACCENT, BLOCKED, CRUISE, GOOD_SHARE, GUST, GUST_WARN, HIT, LEAD, NEW_PERFECT, NARROW_WARN, OFF, SHOVED, SLOW_TIME, SURGE, SURGE_WARN,
  closed, createRace, pending, placeNow, roomIn, steer, tapBeat, type Race,
} from "../lib/rowing";
import { stepRace } from "../lib/step.hot";
import { rowRace, SHARP, STEADY } from "./bot";

const DT = 1 / 60;
const run = (race: Race, seconds: number) => { for (let n = 0; n < Math.round(seconds / DT); n++) stepRace(race, DT); };
const goTo = (race: Race, t: number) => { while (race.t < t) stepRace(race, DT); };
const kinds = (race: Race) => Array.from({ length: Math.min(race.eventCount, race.events.length) }, (_, i) => race.events[(race.eventCount - 1 - i + race.events.length * 4) % race.events.length].type);

test("old links replay the first version's river exactly: same course, drum and rivals", () => {
  // Rival speeds and patch rows captured from the code before the rewrite.
  assert.deepEqual(createRace(4821, LEGACY_LEVEL, "n", true).boats.map(boat => boat.base), [0, 202.73956901034927, 176.2532856203175, 186.18480354000442]);
  assert.deepEqual(createRace(77, LEGACY_LEVEL, "n", true).boats.map(boat => boat.base), [0, 179.14443877643922, 207.02718187654563, 191.54562067417356]);
  const race = createRace(4821, LEGACY_LEVEL, "n", true);
  assert.equal(race.patches.length, 20);
  assert.equal(race.rows, 16);
  assert.deepEqual([race.patches[0].lane, race.patches[0].y, race.patches[0].len], [2, 820, 44]);
  assert.equal(race.beats.length, 56);
  assert.equal(race.beats[0], 1.6);
  assert.equal(race.plan.course, 9000);
  assert.equal(race.t, 0, "the old race starts at once, with no count-in");
  assert.equal(OLD_LEVELS[LEGACY_LEVEL - 1].k, 1);
  assert.equal(createRace(5, 99, "n", true).level, LEGACY_LEVEL, "a nonsense old race number falls back");
});

test("the same seed gives the same river, rivals and drum; another seed gives another", () => {
  for (const level of [1, 4, 8, 12]) {
    const a = createRace(4821, level), b = createRace(4821, level), c = createRace(4822, level);
    assert.deepEqual(a.patches, b.patches);
    assert.deepEqual(a.beats, b.beats);
    assert.deepEqual(a.gusts, b.gusts);
    assert.deepEqual(a.boats.map(boat => [boat.lane, boat.base, boat.pref, [...boat.miss]]), b.boats.map(boat => [boat.lane, boat.base, boat.pref, [...boat.miss]]));
    if (level > 1) assert.notDeepEqual(a.patches, c.patches);
    const first = rowRace(level, 77, STEADY), second = rowRace(level, 77, STEADY);
    assert.deepEqual([first.tenths, first.rank, first.hits, first.patchHits], [second.tenths, second.rank, second.hits, second.patchHits]);
    assert.deepEqual(first.boats.map(boat => boat.done), second.boats.map(boat => boat.done));
  }
});

test("every river is fair: at most two lanes covered a row, an open lane always in reach, clean gaps, the first patch easy", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const def = LEVELS[level - 1], plan = planOf(def, false);
    for (let seed = 1; seed <= 150; seed++) {
      const { patches, narrows, gusts } = makeCourse(makeRng(seed), plan, makeRng(seed * 7 + 13));
      const rows = new Map<number, { y: number; end: number; mask: number }>();
      for (const patch of patches) {
        const row = rows.get(patch.row) ?? { y: patch.y, end: 0, mask: 0 };
        row.mask |= 1 << patch.lane; row.end = Math.max(row.end, patch.y + patch.len); row.y = Math.min(row.y, patch.y);
        rows.set(patch.row, row);
      }
      if (def.patches === 0) { assert.equal(patches.length, 0); continue; }
      let previous: { y: number; end: number; mask: number } | null = null;
      for (const [index, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
        const lanes = row.mask.toString(2).split("1").length - 1;
        assert.ok(lanes >= 1 && lanes <= (def.patches === 1 ? 1 : 2), `L${level} seed ${seed} row ${index}: ${lanes} lanes`);
        assert.ok(row.end < plan.course - plan.clearEnd + 100, "the last stretch is open water");
        const inside = narrows.some(n => row.y > n.y0 && row.y < n.y1);
        if (inside) assert.equal(row.mask & 0b10001, 0, `L${level} seed ${seed}: a patch in a closed lane`);
        if (index === 0) assert.equal(row.mask, 1 << PLAYER_LANE);
        if (previous) {
          // Never closer than the shortest gap anyone could row at top speed.
          assert.ok(row.y - previous.end - BOAT_LEN >= 0.7 * VMAX - 1, `L${level} seed ${seed} row ${index}: gap`);
          if (!def.gusts && !def.narrow) {
            const reach = reachIn((row.y - previous.end - BOAT_LEN) / VMAX);
            assert.ok(fair(31 & ~previous.mask, 31 & ~row.mask, reach), `L${level} seed ${seed} row ${index}: unfair`);
          }
        }
        previous = row;
      }
      for (const gust of gusts) {
        assert.ok(!narrows.some(n => gust.y > n.y0 - 150 && gust.y < n.y1 + 50), "a gust never lands near the banks closing");
        const after = [...rows.values()].find(row => row.y > gust.y);
        if (after) assert.ok(after.y - gust.y >= 0.75 * 1.75 * VMAX - 2, "a gust leaves time to answer it");
      }
    }
  }
});

test("the drum: ratings by how close the tap is, one catch a beat, nothing before the start, a miss breaks the run", () => {
  const race = createRace(11, 3);
  assert.ok(race.t < 0, "a count-in comes first");
  assert.equal(tapBeat(race), 0, "a tap during the count-in does nothing");
  assert.equal(steer(race, 1), false, "and so does a lane change");
  goTo(race, race.beats[0]);
  assert.equal(tapBeat(race), 2, "right on the beat");
  assert.equal(tapBeat(race), 0, "a second tap on a caught beat is harmless");
  assert.equal(race.hits, 1);
  assert.equal(race.streak, 1);
  goTo(race, race.beats[1] + 0.17);
  assert.equal(tapBeat(race), 1, "17 hundredths late is still on the beat");
  goTo(race, race.beats[2] + 0.4);
  const events = race.eventCount;
  assert.equal(tapBeat(race), -1, "far off the beat stumbles");
  assert.equal(race.streak, 0);
  assert.ok(race.stumble > 0);
  assert.equal(race.events[events % race.events.length].type, OFF);
  assert.equal(race.events[(events - 1 + race.events.length) % race.events.length].type !== HIT, true);
});

test("a tap counts at its own moment, not at the frame's: the extra time moves it", () => {
  const a = createRace(11, 3), b = createRace(11, 3);
  goTo(a, a.beats[0] - 0.05); goTo(b, b.beats[0] - 0.05);
  assert.equal(tapBeat(a, 0), 2);
  assert.equal(tapBeat(b, 0.05), 2);
  const c = createRace(11, 3);
  goTo(c, c.beats[0] - 0.14);
  assert.equal(tapBeat(c, 0), 1, "0.14 early is a plain catch");
  const d = createRace(11, 3);
  goTo(d, d.beats[0] - 0.14);
  assert.equal(tapBeat(d, 0.05), 2, "the tap was 0.05 later in real life: now 0.09 early, within the sharp window");
});

test("the mode sets the tap window in real time, and slow mode keeps the window the same in milliseconds", () => {
  for (const [mode, width] of [["e", 0.25 * MODE_INFO.e.window], ["n", 0.25], ["h", 0.25 * MODE_INFO.h.window]] as const) {
    const inside = createRace(11, 3, mode), outside = createRace(11, 3, mode);
    goTo(inside, inside.beats[0] + width - 0.02); goTo(outside, outside.beats[0] + width + 0.02);
    assert.notEqual(tapBeat(inside), -1, `${mode}: inside`);
    assert.equal(tapBeat(outside), -1, `${mode}: outside`);
  }
  // Slow mode: game time runs at 0.8, so 0.2 s of real time late is 0.16 game seconds, and the window in real seconds is unchanged.
  const slow = createRace(11, 3, "n", false, 0, SLOW_TIME);
  while (slow.t < slow.beats[0] + 0.2 * SLOW_TIME) stepRace(slow, DT);
  assert.equal(tapBeat(slow) > 0, true);
  const late = createRace(11, 3, "n", false, 0, SLOW_TIME);
  while (late.t < late.beats[0] + 0.27 * SLOW_TIME) stepRace(late, DT);
  assert.equal(tapBeat(late), -1, "0.27 real seconds late is off the beat in slow mode too");
});

test("a big stroke counts 1.6 times on the beat and not off it; the stroke is sized by the gap so every tempo adds the same", () => {
  const race = createRace(11, 3);
  assert.deepEqual([...race.accents.slice(0, 5)], [0, 0, 0, 1, 0]);
  goTo(race, race.beats[0]);
  tapBeat(race);
  assert.ok(Math.abs(race.boost - NEW_PERFECT * race.def.gap) < 0.5);
  goTo(race, race.beats[3]);
  race.boost = 0;
  tapBeat(race);
  assert.ok(Math.abs(race.boost - NEW_PERFECT * race.def.gap * ACCENT) < 0.5);
  // Merely good on a big stroke gets no bonus.
  const good = createRace(11, 3);
  goTo(good, good.beats[3] + 0.18);
  tapBeat(good);
  assert.ok(Math.abs(good.boost - NEW_PERFECT * good.def.gap * GOOD_SHARE) < 0.5);
  assert.equal(createRace(11, 1).accents.some(Boolean), false, "race 1 has no big strokes");
  for (const level of [1, 5, 9]) assert.ok(Math.abs(createRace(3, level).beats[1] - createRace(3, level).beats[0] - LEVELS[level - 1].gap) < 1e-9);
  assert.equal(createRace(3, 1).beats[0], FIRST_BEAT_NEW);
});

test("the tempo quickens where the race says, and not before", () => {
  const race = createRace(5, 7);
  const [after, gap] = race.def.quicken!;
  assert.ok(Math.abs(race.beats[after] - race.beats[after - 1] - race.def.gap) < 1e-9);
  assert.ok(Math.abs(race.beats[after + 1] - race.beats[after] - gap) < 1e-9);
  assert.ok(gap < race.def.gap);
});

test("the count-in holds the boats on the rope, then they go", () => {
  const race = createRace(3, 2);
  assert.equal(race.t, -LEAD);
  run(race, LEAD - 0.1);
  assert.deepEqual(race.boats.map(boat => boat.y), [0, 0, 0, 0]);
  run(race, 1);
  assert.ok(race.boats.every(boat => boat.y > 0));
});

test("lane changes: one lane a tap, edges refuse, a boat alongside refuses; banks that close refuse the edge lanes", () => {
  const race = createRace(3, 2);
  goTo(race, 0.5);
  for (let rival = 1; rival < 4; rival++) race.boats[rival].y = 3000;
  assert.equal(steer(race, -1), true);
  assert.equal(race.boats[0].lane, PLAYER_LANE - 1);
  assert.equal(steer(race, -1), true);
  assert.equal(steer(race, -1), false, "the bank");
  const narrow = createRace(3, 6);
  goTo(narrow, 0.5);
  const seg = narrow.narrows[0];
  narrow.boats[0].y = seg.y0 + 20;
  assert.equal(closed(narrow, narrow.boats[0].y, 0), true);
  narrow.boats[0].lane = 1;
  assert.equal(steer(narrow, -1), false, "the closed lane is refused");
  assert.equal(narrow.events[(narrow.eventCount - 1) % narrow.events.length].type, BLOCKED);
  narrow.boats[0].y = seg.y1 + BOAT_LEN + 5;
  assert.equal(closed(narrow, narrow.boats[0].y, 0), false, "open again once the stern is clear");
  const crowd = createRace(3, 2);
  goTo(crowd, 0.5);
  crowd.boats[1].lane = 1; crowd.boats[1].x = laneX(1); crowd.boats[1].y = crowd.boats[0].y;
  assert.equal(roomIn(crowd, 0, 1), false);
});

test("the banks close: a boat in an edge lane is squeezed in, flagged ahead of time", () => {
  const race = createRace(9, 6);
  goTo(race, 0.2);
  const seg = race.narrows[0];
  race.boats[0].lane = 0; race.boats[0].x = laneX(0); race.boats[0].y = seg.y0 - 400; race.boats[0].speed = 200;
  const before = race.eventCount;
  let warned = -1;
  for (let step = 0; step < 600 && race.boats[0].y < seg.y0 + 30; step++) {
    stepRace(race, DT);
    for (let n = before; n < race.eventCount; n++) if (race.events[n % race.events.length].type === NARROW_WARN && warned < 0) warned = race.boats[0].y;
  }
  assert.ok(warned > 0 && warned < seg.y0 && seg.y0 - warned > 150, `flagged ${seg.y0 - warned} units ahead`);
  assert.equal(race.boats[0].lane, 1);
  assert.ok(kinds(race).includes(SHOVED));
});

test("a current runs a boat in its lane faster, and only there", () => {
  const race = createRace(9, 5);
  const seg = race.currents[0];
  const probe = (lane: number) => {
    const copy = createRace(9, 5);
    goTo(copy, 0.1);
    const you = copy.boats[0];
    you.lane = lane; you.x = laneX(lane); you.y = seg.y0 + 300; you.speed = 165;
    for (let n = 0; n < 90; n++) { copy.boost = 0; stepRace(copy, DT); }
    return you.speed;
  };
  assert.ok(probe(seg.lane) > probe((seg.lane + 2) % LANES) * 1.2);
});

test("a crosswind is flagged on its side, then shoves you one lane over", () => {
  const race = createRace(5, 10);
  assert.ok(race.gusts.length > 0);
  const gust = race.gusts[0];
  goTo(race, 0.1);
  const you = race.boats[0];
  you.lane = gust.dir > 0 ? 1 : 3; you.x = laneX(you.lane); you.y = gust.y - 500; you.speed = 200;
  let warned = -1, hit = -1;
  const startLane = you.lane;
  for (let step = 0; step < 900 && hit < 0; step++) {
    const seen = race.eventCount;
    stepRace(race, DT);
    for (let n = seen; n < race.eventCount; n++) {
      const type = race.events[n % race.events.length].type;
      if (type === GUST_WARN && warned < 0) warned = gust.y - you.y;
      if (type === GUST) hit = step;
    }
  }
  assert.ok(warned > 150, `flagged ${warned} units ahead`);
  assert.ok(hit >= 0);
  assert.equal(you.lane, startLane + gust.dir);
});

test("the champion: blocks you now and then, flags its last pull before it comes, then pulls", () => {
  for (const level of [4, 8, 12]) {
    assert.ok(isFinale(LEVELS[level - 1]));
    const race = createRace(21, level);
    assert.ok(race.boss > 0);
    const boss = race.boats[race.boss];
    assert.equal(boss.boss, true);
    assert.equal(boss.miss.some(Boolean), false, "it never misses a patch");
  }
  const race = createRace(21, 4);
  const boss = race.boats[race.boss];
  let warnY = -1, surgeY = -1, shifts = 0, lane = boss.lane;
  for (let step = 0; step < 60 * 40 && !race.over; step++) {
    const seen = race.eventCount;
    // You hover just behind it, to give it something to block.
    const you = race.boats[0];
    if (race.t > 2 && you.y < boss.y - BOAT_LEN - 30) you.y = boss.y - BOAT_LEN - 30;
    you.lane = boss.lane === 0 ? 1 : boss.lane - 1;
    stepRace(race, DT);
    for (let n = seen; n < race.eventCount; n++) {
      const type = race.events[n % race.events.length].type;
      if (type === SURGE_WARN && warnY < 0) warnY = boss.y;
      if (type === SURGE && surgeY < 0) surgeY = boss.y;
    }
    if (boss.lane !== lane) { shifts++; lane = boss.lane; }
  }
  assert.ok(warnY > 0 && surgeY > warnY, `warned at ${warnY}, pulled at ${surgeY}`);
  assert.ok(shifts >= 2, "it moves across to block");
});

test("rivals have a style you can read: red bolts then tires, green holds, yellow closes", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const race = createRace(seed, 3);
    const [red, green, yellow] = [race.boats[1], race.boats[2], race.boats[3]];
    assert.ok(red.style[0] > red.style[2] && yellow.style[2] > yellow.style[0]);
    assert.deepEqual([...green.style], [1, 1, 1]);
  }
});

test("a race ends once, with the places in the order they crossed", () => {
  const race = rowRace(1, 9, SHARP);
  assert.equal(race.rank, 1);
  assert.equal(race.tenths, Math.round(race.boats[0].done * 10));
  assert.equal(placeNow(race), race.rank);
  const eventsBefore = race.eventCount;
  run(race, 1);
  assert.equal(race.eventCount, eventsBefore, "nothing counts after the finish");
  assert.equal(race.rank, 1);
});

test("the ring points at the next beat not yet caught", () => {
  const race = createRace(1, 1);
  goTo(race, 0.5);
  assert.equal(pending(race), 0);
  goTo(race, race.beats[0]);
  tapBeat(race);
  assert.equal(pending(race), 1);
  assert.ok(FRONT_Y < 500);
});

test("তাল মেলাও measures a phone's touch lag from eight pulses", () => {
  const taps = CALIB_BEATS.map(beat => beat + 0.12);
  assert.equal(lagFrom(taps), 0.12);
  assert.equal(lagFrom(CALIB_BEATS.slice(0, 3).map(beat => beat + 0.12)), null, "too few taps");
  assert.equal(lagFrom([0.1, 9, 10, 11, 12]), null, "taps far from any pulse");
  assert.equal(lagFrom(CALIB_BEATS.map(beat => beat + 0.45)), null);
  assert.equal(lagFrom(CALIB_BEATS.map(beat => beat + 0.38)), 0.3, "capped");
  assert.equal(lagFrom(CALIB_BEATS.map(beat => beat - 0.03)), -0.03);
  void CRUISE;
});
