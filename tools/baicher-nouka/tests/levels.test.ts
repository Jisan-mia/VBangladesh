import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { createRace, laneX, roomIn, steer, stepRace, tapBeat, BOAT_LEN, LANES, LEGACY_LEVEL, LEVEL_COUNT, LEVELS, type Race } from "../lib/race";
import { nearMiss, openingLevel, parseShareHash, shareHash, starsForRank } from "../lib/result";

const DT = 1 / 60;

/** Steers for the nearest open lane of the next row of কচুরিপানা, one tap at a time (as in race.test.ts). */
function careful(race: Race) {
  const you = race.boats[0];
  if (Math.abs(you.x - laneX(you.lane)) > 0.5) return;
  let row = -1, mask = 0;
  for (const patch of race.patches) {
    if (patch.hitBy >= 0 || patch.y <= you.y) continue;
    if (row === -1) row = patch.row;
    if (patch.row !== row) break;
    mask |= 1 << patch.lane;
  }
  if (!(mask & (1 << you.lane)) && you.held < 0.3) return;
  const alongside = (lane: number) => race.patches.some(patch => patch.lane === lane && patch.hitBy < 0 && patch.y < you.y + 30 && patch.y + patch.len > you.y - BOAT_LEN - 10);
  for (const step of [-1, 1, -2, 2, -3, 3, -4, 4]) {
    const lane = you.lane + step, towards = step < 0 ? -1 : 1;
    if (lane < 0 || lane >= LANES || mask & (1 << lane) || !roomIn(race, 0, you.lane + towards) || alongside(you.lane + towards)) continue;
    steer(race, towards);
    return;
  }
}
function drummer(offset: number | null) {
  let next = 0;
  return (race: Race) => { if (offset === null) return; while (next < race.beats.length && race.t >= race.beats[next] + offset) { tapBeat(race); next++; } };
}
function row(race: Race, ...players: Array<(race: Race) => void>) {
  for (let steps = 0; !race.over && steps < 60 * 150; steps++) { for (const player of players) player(race); stepRace(race, DT); }
  assert.ok(race.over);
  return race;
}

test("race 7 is the race from before levels: same rivals, same river, and old links open it unchanged", () => {
  // Rival speeds captured from the old code.
  assert.deepEqual(createRace(4821).boats.map(boat => boat.base), [0, 202.73956901034927, 176.2532856203175, 186.18480354000442]);
  assert.deepEqual(createRace(77, 0, LEGACY_LEVEL).boats.map(boat => boat.base), [0, 179.14443877643922, 207.02718187654563, 191.54562067417356]);
  assert.equal(LEVELS[LEGACY_LEVEL - 1], 1);
  const old = "s=48213&t=384&r=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  assert.equal(parseShareHash(old)?.level, LEGACY_LEVEL);
  assert.equal(share.normalize(old), old);
  assert.equal(createRace(5, 0, 99).level, LEGACY_LEVEL, "a nonsense race number falls back");
});

test("the race number travels in the link (`l`) and junk is refused", () => {
  const shared = { seed: 48213, tenths: 384, rank: 2, level: 3, name: "রাফি" };
  const hash = shareHash(shared);
  assert.match(hash, /&r=2&l=3&n=/);
  assert.deepEqual(parseShareHash(hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.doesNotMatch(shareHash({ ...shared, level: LEGACY_LEVEL }), /l=/);
  for (const bad of ["0", "13", "x", "03", "3.5", ""]) assert.equal(share.normalize(hash.replace("l=3", `l=${bad}`)), null, `l=${bad}`);
});

test("every race is a step up, race 1 is nearly a sure place, and every race can be won", () => {
  for (let level = 2; level <= LEVEL_COUNT; level++) assert.ok(LEVELS[level - 1] < LEVELS[level - 2], `race ${level} rivals are faster`);
  for (let seed = 1; seed <= 20; seed++) {
    const rivals = (level: number) => createRace(seed, 0, level).boats.slice(1).map(boat => boat.base);
    for (let level = 2; level <= LEVEL_COUNT; level++) rivals(level).forEach((speed, index) => assert.ok(speed > rivals(level - 1)[index]));
    // Even a boat that only steers and never taps the drum places in race 1.
    assert.ok(row(createRace(seed, 0, 1), careful, drummer(null)).rank <= 3, `seed ${seed}: race 1 without tapping`);
    // Rowing right on every beat wins even the last race.
    assert.equal(row(createRace(seed, 0, LEVEL_COUNT), careful, drummer(0)).rank, 1, `seed ${seed}: perfect timing in race ${LEVEL_COUNT}`);
  }
});

test("stars by place, the near-miss lines and the opening race", () => {
  assert.deepEqual([1, 2, 3, 4].map(starsForRank), [3, 2, 1, 0]);
  assert.equal(nearMiss(2, 8, 400, null), "আর ০.৮ সেকেন্ড আগে পৌঁছালেই ১ম।");
  assert.equal(nearMiss(3, 60, 400, null), "", "six seconds back isn't close");
  assert.equal(nearMiss(1, 0, 404, 400), "আর ০.৫ সেকেন্ড কম লাগলেই নতুন সেরা।");
  assert.equal(nearMiss(1, 0, 398, 400), "", "already a new best");
  assert.equal(openingLevel({}, 1), 1);
  assert.equal(openingLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(openingLevel({ 1: 3, 2: 2, 3: 3 }, 4), 4);
  assert.equal(openingLevel(Object.fromEntries(LEVELS.map((_, index) => [index + 1, index === 4 ? 2 : 3])), LEVEL_COUNT), 5);
});
