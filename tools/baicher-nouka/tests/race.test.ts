import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import {
  createRace, fair, lagFrom, laneX, makeBeats, makeCourse, placeNow, reachIn, roomIn, steer, stepRace, tapBeat,
  BLOCKED, BOAT_LEN, BURST, CALIB_BEATS, CLEAR_END, COURSE, CRUISE, FIRST_BEAT, FIRST_ROW, HIT, LANES, MAX_LAG, MISSED,
  OFF, PATCH, PERFECT_BURST, PLAYER_LANE, SLACK, SLOW_LOW, STREAK_MAX, SWITCH_T, VMAX, WINDOW, type Race,
} from "../lib/race";
import { banner, caption, compareLine, humanLine, ordinal, parseShareHash, previewTitle, rankLines, resultLine, secs, shareHash, MAX_TENTHS, MIN_TENTHS } from "../lib/result";
import { makeRng } from "../../../shared/game-core";
import { share } from "../share";

const DT = 1 / 60;

/** Live patches of the next row still ahead of your bow, as a lane bitmask. */
function nextRow(race: Race) {
  const you = race.boats[0];
  let row = -1, mask = 0;
  for (const patch of race.patches) {
    if (patch.hitBy >= 0 || patch.y <= you.y) continue;
    if (row === -1) row = patch.row;
    if (patch.row !== row) break;
    mask |= 1 << patch.lane;
  }
  return mask;
}

/** A live patch beside your hull in `lane`: sliding there now would clip it. */
function alongside(race: Race, lane: number) {
  const you = race.boats[0];
  return race.patches.some(patch => patch.lane === lane && patch.hitBy < 0 && patch.y < you.y + 30 && patch.y + patch.len > you.y - BOAT_LEN - 10);
}

/** A careful rower: heads for the nearest open lane of the next row (or out from behind a slower boat) on a side with room, one tap at a time. */
function careful(race: Race) {
  const you = race.boats[0];
  if (Math.abs(you.x - laneX(you.lane)) > 0.5) return;
  const mask = nextRow(race);
  if (!(mask & (1 << you.lane)) && you.held < 0.3) return;
  for (const step of [-1, 1, -2, 2, -3, 3, -4, 4]) {
    const lane = you.lane + step, towards = step < 0 ? -1 : 1;
    if (lane < 0 || lane >= LANES || mask & (1 << lane) || !roomIn(race, 0, you.lane + towards) || alongside(race, you.lane + towards)) continue;
    steer(race, towards);
    return;
  }
}

/** Taps the drum `offset` seconds after each beat (every `every`-th beat), or never when offset is null. */
function drummer(offset: number | null, every = 1) {
  let next = 0;
  return (race: Race) => {
    if (offset === null) return;
    while (next < race.beats.length && race.t >= race.beats[next] + offset) { if (next % every === 0) tapBeat(race); next++; }
  };
}

function row(race: Race, ...players: Array<(race: Race) => void>) {
  for (let steps = 0; !race.over && steps < 60 * 150; steps++) {
    for (const player of players) player(race);
    stepRace(race, DT);
  }
  assert.ok(race.over, "every race ends");
  return race;
}

test("the same seed gives the same river, rivals and drum; another seed gives another", () => {
  const a = createRace(4821), b = createRace(4821), c = createRace(4822);
  assert.deepEqual(a.patches, b.patches);
  assert.deepEqual(a.beats, b.beats);
  assert.deepEqual(a.boats.map(boat => [boat.lane, boat.base, boat.pref, [...boat.miss]]), b.boats.map(boat => [boat.lane, boat.base, boat.pref, [...boat.miss]]));
  assert.notDeepEqual(a.patches, c.patches);
  const first = row(createRace(77), careful, drummer(0.12)), second = row(createRace(77), careful, drummer(0.12));
  assert.deepEqual([first.tenths, first.rank, first.hits, first.patchHits], [second.tenths, second.rank, second.hits, second.patchHits]);
  assert.deepEqual(first.boats.map(boat => boat.done), second.boats.map(boat => boat.done));
});

test("every river is fair: never more than two lanes covered, an open lane always in reach, the first patch easy", () => {
  for (let seed = 1; seed <= 400; seed++) {
    const { patches } = makeCourse(makeRng(seed));
    const rows: Array<{ y: number; end: number; mask: number }> = [];
    for (const patch of patches) {
      const last = rows.at(-1);
      if (!last || patch.row !== rows.length - 1) rows.push({ y: patch.y, end: patch.y + patch.len, mask: 1 << patch.lane });
      else { last.y = Math.min(last.y, patch.y); last.end = Math.max(last.end, patch.y + patch.len); last.mask |= 1 << patch.lane; }
    }
    assert.deepEqual([rows[0].y, rows[0].mask], [FIRST_ROW, 1 << PLAYER_LANE], `seed ${seed}: the first patch sits in your lane`);
    let open = (1 << LANES) - 1;
    rows.forEach((current, index) => {
      const covered = [...Array(LANES).keys()].filter(lane => current.mask & (1 << lane)).length;
      assert.ok(covered >= 1 && covered <= 2, `seed ${seed}: row ${index} covers ${covered} lanes`);
      if (index > 0) {
        const time = (current.y - rows[index - 1].end - BOAT_LEN) / VMAX;
        assert.ok(time >= SLACK + SWITCH_T, `seed ${seed}: row ${index} leaves ${time.toFixed(2)}s`);
        assert.ok(fair(open, ((1 << LANES) - 1) & ~current.mask, reachIn(time)), `seed ${seed}: row ${index} can trap you`);
      }
      open = ((1 << LANES) - 1) & ~current.mask;
    });
    assert.ok(rows.at(-1)!.y < COURSE - CLEAR_END, "open water before the finish");
    // You start with a free lane beside you, so the first patch can always be dodged.
    const race = createRace(seed);
    assert.ok(roomIn(race, 0, PLAYER_LANE - 1) || roomIn(race, 0, PLAYER_LANE + 1), `seed ${seed}: boxed in at the start`);
  }
});

test("the drum: a slow, steady first line, then quicker lines, all fixed by the seed", () => {
  const beats = makeBeats(makeRng(9));
  assert.equal(beats[0], FIRST_BEAT);
  for (let index = 1; index < 4; index++) assert.ok(Math.abs(beats[index] - beats[index - 1] - 2.2) < 1e-9);
  for (let index = 1; index < beats.length; index++) {
    const gap = beats[index] - beats[index - 1];
    assert.ok(gap >= 1.6 - 1e-9 && gap <= 2.2 + 1e-9, "never faster than a beat every 1.6 s (well under 3 a second)");
  }
  assert.ok(beats.filter(beat => beat < 45).length >= 20);
  assert.notDeepEqual(makeBeats(makeRng(9)), makeBeats(makeRng(10)));
});

test("taps on the beat: দারুণ, তালে, off the beat, double taps, missed beats and the phone's lag", () => {
  const race = createRace(5);
  const at = (t: number) => { while (race.t + DT <= t) stepRace(race, DT); race.t = t; };
  at(race.beats[0] + 0.05);
  assert.equal(tapBeat(race), 2);
  assert.equal(race.boost, PERFECT_BURST);
  assert.equal(tapBeat(race), 0, "a second tap on a caught beat does no harm");
  at(race.beats[1] + 0.2);
  assert.equal(tapBeat(race), 1);
  assert.equal(race.streak, 2);
  at(race.beats[1] + 0.8);
  assert.equal(tapBeat(race), -1, "a tap between beats");
  assert.equal(race.streak, 0);
  assert.ok(race.stumble > 0);
  at(race.beats[3] + WINDOW + 0.05);
  assert.equal(race.marks[2], -1, "an uncaught beat is a miss");
  const kinds = race.events.slice(0, race.eventCount).map(event => event.type);
  assert.ok(kinds.includes(HIT) && kinds.includes(OFF) && kinds.includes(MISSED));

  // A phone that registers touches 0.2 s late still lands taps on the beat once its lag is known.
  const late = createRace(5), none = createRace(5);
  late.lag = 0.2;
  for (const it of [late, none]) { while (it.t < it.beats[0] + 0.27) stepRace(it, DT); }
  assert.equal(tapBeat(late), 2);
  assert.equal(tapBeat(none), -1);
});

test("the streak and bursts are capped; mashing the drum is slower than rowing in time", () => {
  const steady = row(createRace(31), careful, drummer(0.04));
  assert.ok(steady.hits >= 18 && steady.perfect === steady.hits);
  assert.ok(steady.streak <= STREAK_MAX);
  const mashed = row(createRace(31), careful, (race: Race) => { if (Math.round(race.t * 60) % 6 === 0) tapBeat(race); });
  assert.ok(mashed.offbeats > 50);
  assert.ok(mashed.tenths > steady.tenths + 50, `mashing ${mashed.tenths} vs in time ${steady.tenths}`);
  assert.ok(BURST < PERFECT_BURST);
});

test("কচুরিপানা slows the first boat into it and scatters; the next lane passes clean", () => {
  const race = createRace(12);
  race.streak = 4; race.boost = 60;
  while (race.patchHits === 0 && race.t < 10) stepRace(race, DT);
  const hit = race.patches[0];
  assert.equal(hit.hitBy, 0, "you rowed straight into the first patch");
  assert.equal(race.streak, 0);
  assert.equal(race.boost, 0);
  assert.ok(race.boats[0].speed < CRUISE * SLOW_LOW + 20);
  assert.ok(race.events.slice(0, race.eventCount).some(event => event.type === PATCH && event.n === 0));
  const dodged = createRace(12);
  while (dodged.boats[0].y < FIRST_ROW - 300) stepRace(dodged, DT);
  assert.ok(steer(dodged, dodged.boats[0].lane === 2 && roomIn(dodged, 0, 1) ? -1 : 1));
  while (dodged.boats[0].y < FIRST_ROW + 200) stepRace(dodged, DT);
  assert.equal(dodged.patchHits, 0);
  assert.equal(dodged.patches[0].hitBy, -1);
});

test("boats never sail through each other: no lane change into a boat alongside, and a slower boat ahead holds you", () => {
  const race = createRace(3);
  const you = race.boats[0], rival = race.boats[1];
  // Park a rival right alongside, one lane over.
  rival.lane = you.lane - 1; rival.x = laneX(rival.lane); rival.y = you.y;
  assert.equal(steer(race, -1), false);
  assert.equal(race.events[race.eventCount - 1].type, BLOCKED);
  // Now put it in your lane just ahead, rowing slowly: you wait behind its stern.
  rival.lane = you.lane; rival.x = you.x; rival.y = you.y + BOAT_LEN + 20; rival.base = 60; rival.speed = 60;
  you.speed = 200; race.boost = 200;
  for (let step = 0; step < 60; step++) stepRace(race, DT);
  assert.ok(you.y <= rival.y - BOAT_LEN, "your bow never passes into its stern");
  assert.ok(you.held > 0.3);
  assert.equal(placeNow(race), 4 - race.boats.slice(1).filter(boat => boat.y < you.y).length);
});

test("headless races: good timing beats all three rivals; never tapping comes last; times stay sane", () => {
  let wins = 0;
  for (let seed = 1; seed <= 150; seed++) {
    const good = row(createRace(seed), careful, drummer(seed % 2 ? 0.15 : -0.15));
    if (good.rank === 1) wins++;
    assert.ok(good.tenths >= 360 && good.tenths <= 460, `seed ${seed}: good timing took ${secs(good.tenths)}s`);
    assert.ok(good.rank <= 2, `seed ${seed}: good timing came ${good.rank}`);
    const idle = row(createRace(seed), careful, drummer(null));
    assert.ok(idle.rank >= 3, `seed ${seed}: never tapping came ${idle.rank}`);
    assert.ok(idle.tenths >= 500 && idle.tenths <= 620, `seed ${seed}: idle took ${secs(idle.tenths)}s`);
    const best = row(createRace(seed), careful, drummer(0));
    assert.ok(best.tenths > MIN_TENTHS && best.rank === 1, "perfect timing wins, and no real run is shorter than a link allows");
    const lost = row(createRace(seed), drummer(null));
    assert.ok(lost.tenths < MAX_TENTHS, "even a boat that never steers or taps finishes");
  }
  assert.ok(wins >= 145, `good timing won ${wins} of 150`);
});

test("slow mode races the very same river (the course never depends on the clock)", () => {
  const fast = row(createRace(44), careful, drummer(0.1));
  const slow = createRace(44);
  slow.lag = 0;
  for (let steps = 0; !slow.over && steps < 60 * 200; steps++) { careful(slow); drummer(0.1)(slow); stepRace(slow, DT * 0.75); }
  assert.deepEqual(slow.patches.map(patch => [patch.lane, patch.y]), fast.patches.map(patch => [patch.lane, patch.y]));
  assert.deepEqual(slow.beats, fast.beats);
});

test("তাল মেলাও: the median of the taps, clamped, and only with enough taps near a pulse", () => {
  assert.equal(lagFrom(CALIB_BEATS.map(beat => beat + 0.12)), 0.12);
  assert.equal(lagFrom([...CALIB_BEATS.slice(0, 6).map(beat => beat + 0.1), 0.2, 9.9]), 0.1, "stray taps are ignored");
  assert.equal(lagFrom(CALIB_BEATS.map(beat => beat + 0.38)), MAX_LAG);
  assert.equal(lagFrom(CALIB_BEATS.slice(0, 3)), null);
  assert.equal(lagFrom([]), null);
});

test("words: seconds, places, a line for every place, the friend comparison", () => {
  assert.equal(secs(384), "৩৮.৪");
  assert.equal(secs(400), "৪০.০");
  assert.deepEqual([1, 2, 3, 4].map(ordinal), ["১ম", "২য়", "৩য়", "৪র্থ"]);
  assert.equal(resultLine({ tenths: 384, rank: 1 }), "৩৮.৪ সেকেন্ডে ১ম");
  for (const rank of [1, 2, 3, 4]) assert.equal(humanLine(rank), rankLines[rank]);
  assert.match(humanLine(1), /মাঝি/);
  assert.equal(compareLine(380, 392, "রাফি"), "রাফির চেয়ে ১.২ সেকেন্ড আগে পৌঁছালে!");
  assert.equal(compareLine(392, 392, "রাফি"), "রাফি আর তুমি একদম সমান সমান!");
  assert.match(compareLine(398, 392, "রাফি"), /^আর একটু হলেই!/);
  assert.match(compareLine(450, 392, ""), /^বন্ধু এবার ৫.৮ সেকেন্ড এগিয়ে/);
  const shared = { seed: 48213, tenths: 384, rank: 1, level: 7, name: "রাফি" };
  assert.equal(banner(shared), "রাফি ৩৮.৪ সেকেন্ডে ১ম হয়েছে। একই নদী, এবার তোমার পালা।");
  assert.equal(previewTitle(shared), "রাফি ৩৮.৪ সেকেন্ডে ১ম হয়েছে। তুমি পারবে?");
  assert.match(previewTitle({ ...shared, name: "" }), /তুমি পারবে\?$/);
  assert.match(caption(shared), /৩৮.৪ সেকেন্ডে/);
});

test("share links: round trip, caps, and hostile input rejected", () => {
  const shared = { seed: 48213, tenths: 384, rank: 2, level: 7, name: "রাফি" };
  const hash = shareHash(shared);
  assert.deepEqual(parseShareHash(`#${hash}`), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.normalize(`${hash}&x=<script>`), hash, "unknown keys are dropped");
  for (const bad of ["", "junk", "s=0&t=384&r=1", "s=1&t=100&r=1", `s=1&t=${MAX_TENTHS + 1}&r=1`, "s=1&t=384", "s=1&t=384&r=0", "s=1&t=384&r=5",
    "s=1&t=384&r=1.5", "s=1&t=38.4&r=1", "s=1&t=-384&r=1", "s=abc&t=384&r=1", `s=1&t=384&r=1&n=${"ক".repeat(700)}`]) {
    assert.equal(share.normalize(bad), null, bad.slice(0, 40));
  }
  const odd = parseShareHash("#s=7&t=410&r=3&n=%E2%80%AE%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF%0A%20%20" + "x".repeat(40));
  assert.ok(odd && !/[\u0000-\u001f‮]/.test(odd.name) && [...odd.name].length <= 20);
  assert.equal(share.preview(hash).title, "রাফি ৩৮.৪ সেকেন্ডে ২য় হয়েছে। তুমি পারবে?");
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits and never names a trademark or a real race", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.notEqual(site.guideTitle, site.title);
  assert.match(site.privacy.join(" "), /সময়/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /road rash|mario|nintendo|sega|konami|atari|guitar hero|osu/i);
  assert.doesNotMatch(everything, /আপনি|করুন|জুয়া|বাজি|টাকা জিত|পুরস্কার/);
});
