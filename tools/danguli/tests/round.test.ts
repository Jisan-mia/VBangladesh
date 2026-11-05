// The rules of the round, against the pure simulation: the flick, the strike, the flight, the field, scoring and stars.
import assert from "node:assert/strict";
import test from "node:test";
import { HITS, LEVEL_COUNT, LEVELS, MAX_HIT, MODE_INFO, levelDef, nextMark, starsOf } from "../lib/levels";
import {
  createRound, distanceOf, fielderX, integrate, launch, popApexTime, popTimeAt, popY, press, reachAt, zoneAt,
  AIM, CONTACT, DONE, DT, FLY, GOLD, GOOD, K_CAUGHT, K_CLEAN, K_FALL, K_POND, K_WHIFF, MIN_SWING, POP, REST, RING_T, SWEET, WEAK, Z_SAND, Z_WATER,
  type Round,
} from "../lib/round";
import { advance } from "../lib/step.hot";
import { botRound, SEEDS, STEADY } from "./bot";

/** Steps until the কাঠি, after the flick, is falling through height `y`. */
function fallTo(r: Round, y: number) {
  const at = popTimeAt(r, y);
  while (r.phase === POP && r.t + DT <= at) advance(r);
}
/** Strike this hit at height `y` (flick first) and let it settle. */
function strikeAt(r: Round, y: number) {
  if (r.phase === AIM) press(r);
  fallTo(r, y);
  const result = press(r);
  for (let i = 0; i < 2000 && r.phase !== REST && r.phase !== DONE; i++) advance(r);
  return result;
}
const shot = (r: Round, y: number) => { launch(r, y); integrate(r, y, 0); return { kind: r.kind, dist: distanceOf(r), land: r.landX, apex: r.apex, loft: r.loft }; };

test("the same seed lays out the same field and plays the same round; different seeds differ", () => {
  const a = createRound(48213, 7), b = createRound(48213, 7), c = createRound(48214, 7);
  assert.deepEqual([...a.pops, ...a.winds, ...a.fx0, a.sandFrom], [...b.pops, ...b.winds, ...b.fx0, b.sandFrom]);
  assert.notDeepEqual([...a.pops, ...a.winds], [...c.pops, ...c.winds]);
  const run = () => botRound(9, 555, STEADY).r;
  const x = run(), y = run();
  assert.deepEqual([...x.dists, ...x.kinds, x.total, x.clock], [...y.dists, ...y.kinds, y.total, y.clock]);
});

test("the middle of the band flies farthest; the upper half lofts, the lower half skims; out of reach is a weak touch", () => {
  const r = createRound(1, 1);
  const middle = shot(r, SWEET), high = shot(r, SWEET + 0.25), low = shot(r, SWEET - 0.25), weak = shot(r, SWEET + 0.7);
  assert.ok(middle.dist >= 32 && middle.dist <= MAX_HIT, `middle ${middle.dist}`);
  assert.ok(high.loft === 1 && high.apex > 5, "the upper half goes up");
  assert.ok(low.loft === 0 && low.apex < 1.5, "the lower half stays low");
  assert.ok(low.dist >= 18, `a low skimmer still rolls on: ${low.dist}`);
  assert.ok(weak.dist < middle.dist && weak.dist < high.dist);
  launch(r, SWEET); assert.equal(r.grade, GOLD);
  launch(r, SWEET + r.band * 0.9); assert.equal(r.grade, GOOD);
  launch(r, SWEET + r.band + 0.1); assert.equal(r.grade, WEAK);
});

test("taps: flick, ignore a double tap, swing at air while it rises, a late kathi lands untouched", () => {
  const r = createRound(7, 1);
  assert.equal(press(r), 1);
  assert.equal(r.phase, POP);
  assert.equal(press(r), 0, "a double tap is not a swing");
  for (let t = 0; t < MIN_SWING + DT; t += DT) advance(r);
  assert.equal(press(r), 3, "a swing while it still rises meets only air");
  assert.equal(press(r), 0, "and only one swing a hit");
  for (let i = 0; i < 400 && r.phase === POP; i++) advance(r);
  assert.equal(r.kinds[0], K_WHIFF);
  assert.equal(r.dists[0], 0);
  for (let i = 0; i < 200 && (r.phase as number) === REST; i++) advance(r);
  assert.equal(r.hit, 1);
  press(r);
  for (let i = 0; i < 400 && r.phase === POP; i++) advance(r);
  assert.equal(r.kinds[1], K_FALL, "no swing at all: it lands");
});

test("a strike stops on the ডাং for a few steps, then flies; pegs tick and the hit settles once", () => {
  const r = createRound(11, 1);
  press(r); fallTo(r, SWEET);
  assert.equal(press(r), 2);
  assert.equal(r.phase, FLY);
  const at = r.pi;
  advance(r); advance(r);
  assert.equal(r.pi, at, "hit-stop");
  let pegs = 0, rests = 0;
  for (let i = 0; i < 2000 && r.phase === FLY; i++) { advance(r); for (let e = 0; e < r.evN; e++) { if (r.evType[e] === 7) pegs++; if (r.evType[e] === 8) rests++; } r.evN = 0; }
  assert.equal(rests, 1);
  assert.equal(pegs, Math.floor(r.dists[0] / 5));
  assert.equal(r.total, r.dists[0]);
});

test("a fielder catches a lofted কাঠি that comes down in their ring, never a low skimmer", () => {
  const r = createRound(3, 2);
  const free = shot(createRound(3, 1), SWEET + 0.2);
  r.fn = 1; r.fx0[0] = free.land; r.famp[0] = 0;
  assert.equal(shot(r, SWEET + 0.2).kind, K_CAUGHT);
  const low = shot(createRound(3, 1), SWEET - 0.25);
  r.fx0[0] = low.land;
  assert.notEqual(shot(r, SWEET - 0.25).kind, K_CAUGHT, "it never rises to hand height");
  assert.ok(reachAt(r, 0, RING_T) < 2, "the ring stays small");
});

test("the pond counts only to its near bank; sand stops a roll; wet grass carries a skimmer farther", () => {
  const pond = createRound(5, 3);
  assert.ok(pond.pondTo > pond.pondFrom && pond.pondFrom >= 13);
  for (let y = 0.1; y < SWEET + CONTACT; y += 0.02) {
    const result = shot(pond, y);
    if (result.kind === K_POND) assert.equal(result.dist, Math.floor(pond.pondFrom));
    assert.ok(result.dist >= 0 && result.dist <= MAX_HIT);
  }
  assert.equal(zoneAt(pond, (pond.pondFrom + pond.pondTo) / 2), Z_WATER);
  const sand = createRound(5, 6);
  assert.equal(zoneAt(sand, sand.sandFrom + 1), Z_SAND);
  // A skimmer on a calm field with sand right in its path stops shorter than without.
  const calm = (level: number) => { const r = createRound(5, level); r.winds.fill(0); r.gustAt.fill(-1); r.fn = 0; return r; };
  const plain = shot(calm(1), SWEET - 0.25).dist, sandy = calm(6), wet = calm(9);
  sandy.sandFrom = 12; sandy.sandTo = 40; wet.wetFrom = 5; wet.wetTo = 50; wet.pondFrom = wet.pondTo = 0;
  assert.ok(shot(sandy, SWEET - 0.25).dist < plain, "sand");
  assert.ok(shot(wet, SWEET - 0.25).dist > plain, "wet grass");
});

test("wind carries a loft much more than a skimmer; a tailwind loft goes farther", () => {
  const field = (wind: number) => { const r = createRound(9, 5); r.winds.fill(wind); r.gustAt.fill(-1); r.fn = 0; return r; };
  const loft = (w: number) => shot(field(w), SWEET + 0.2).dist, skim = (w: number) => shot(field(w), SWEET - 0.25).dist;
  assert.ok(loft(5) - loft(-5) >= 5, `loft ${loft(5)} vs ${loft(-5)}`);
  assert.ok(Math.abs(skim(5) - skim(-5)) < loft(5) - loft(-5), "the skimmer feels less");
});

test("the captain runs to where your last hit came down", () => {
  const r = createRound(21, 4);
  assert.ok(r.cap >= 0);
  strikeAt(r, SWEET - 0.2);
  const landed = r.lands[0];
  for (let i = 0; i < 400; i++) advance(r);
  assert.ok(Math.abs(fielderX(r, r.cap, r.clock) - Math.min(45, Math.max(8, landed))) < 0.01, "he got there");
});

test("walking fielders pace with the round clock; the storm turns the wind every hit", () => {
  const r = createRound(4, 11);
  assert.ok(r.famp[0] > 0);
  assert.notEqual(fielderX(r, 0, 0), fielderX(r, 0, 1.5));
  const storm = createRound(4, 12);
  assert.ok(Math.sign(storm.winds[0]) === -Math.sign(storm.winds[1]) && Math.sign(storm.winds[1]) === -Math.sign(storm.winds[2]));
  assert.ok([...storm.gustAt].every(at => at >= 0), "a gust every hit");
});

test("nobody stands in the pond", () => {
  for (const seed of SEEDS) for (let level = 1; level <= LEVEL_COUNT; level++) {
    const r = createRound(seed, level);
    for (let i = 0; i < r.fn; i++) assert.notEqual(zoneAt(r, r.fx0[i]), Z_WATER, `seed ${seed} level ${level} fielder ${i}`);
  }
});

test("a round is three hits and ends once; nothing moves after it", () => {
  const { r } = botRound(1, 99, STEADY);
  assert.equal(r.phase, DONE);
  assert.ok([...r.kinds].every(kind => kind >= 0));
  assert.equal(r.total, r.dists.reduce((sum, d) => sum + d, 0));
  const clock = r.clock;
  advance(r); advance(r);
  assert.equal(r.clock, clock);
  assert.equal(press(r), 0);
});

test("stars: none without beating the neighbour, then 1–3; easy tops out at two; the next mark is exact", () => {
  assert.equal(starsOf(10, 1), 0, "a tie is not a win");
  assert.equal(starsOf(11, 1), 1);
  assert.equal(starsOf(LEVELS[0].stars[0], 1), 2);
  assert.equal(starsOf(LEVELS[0].stars[1], 1), 3);
  assert.equal(starsOf(LEVELS[0].stars[1], 1, "e"), 2);
  assert.equal(nextMark(0, 1), 11);
  assert.equal(nextMark(11, 1), LEVELS[0].stars[0]);
  assert.equal(nextMark(LEVELS[0].stars[1], 1), 0);
  assert.equal(nextMark(LEVELS[0].stars[0], 1, "e"), 0);
  for (const def of LEVELS) assert.ok(def.target < def.stars[0] && def.stars[0] < def.stars[1] && def.stars[1] <= HITS * MAX_HIT);
});

test("levels: one new element each, a named finale closing every মাঠ", () => {
  assert.equal(LEVEL_COUNT, 12);
  for (const world of [0, 1, 2]) {
    const finale = LEVELS[world * 4 + 3];
    assert.ok(finale.special && finale.move, `world ${world} finale`);
    for (let i = 0; i < 3; i++) assert.equal(LEVELS[world * 4 + i].special, null);
  }
  const elements = (level: number) => {
    const d = levelDef(level);
    return [d.fielders > 0, d.pond, d.sand, d.wet, d.wind > 0, d.gusts > 0, d.walk > 0, d.fall > 1, d.special];
  };
  // Every level after the first shows exactly one element the game hasn't shown before (a finale's move counts as its one;
  // the storm brings back the চর's wind and gusts, which the player already knows).
  const seen = new Set<string>();
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const now = elements(level).map((value, index) => value ? `${index}:${value}` : "").filter(Boolean);
    const fresh = now.filter(item => !seen.has(item));
    assert.equal(fresh.length, level === 1 ? 0 : 1, `level ${level} shows ${fresh.join(", ") || "nothing"} new`);
    for (const item of now) seen.add(item);
  }
  assert.equal(MODE_INFO.e.maxStars, 2);
});

test("ধীরে খেলো shrinks the band by the slow step, so the band lasts the same real time", () => {
  const fast = createRound(8, 2), slow = createRound(8, 2, "n", true);
  assert.ok(Math.abs(slow.band - fast.band * 0.8) < 1e-9);
  // Real seconds the falling কাঠি spends in the band: game seconds ÷ the speed the round runs at.
  const inBand = (r: Round, speed: number) => (popTimeAt(r, SWEET - r.band) - popTimeAt(r, SWEET + r.band)) / speed;
  assert.ok(Math.abs(inBand(slow, 0.8) - inBand(fast, 1)) < 0.01);
  assert.ok(popApexTime(fast) > 0 && popY(fast, popApexTime(fast)) > SWEET + fast.band);
});
