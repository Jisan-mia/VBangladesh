import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import {
  bands, banner, caption, compareLine, humanLine, noteText, parseShared, piecesLine, previewTitle, sharedHash, RULES, SOLO_RULE, type Shared,
} from "../lib/link";
import {
  createWorld, firstHit, isFree, kineticEnergy, shoot, step, BASE_Y, BOARD, COIN_R, COUNT, MAX_SHOT_TIME, POCKET_R, POCKET_X, POCKET_Y, QUEEN, STEP, STRIKER,
  type World,
} from "../lib/physics";
import {
  duoPoints, formation, nearestFree, newGame, onBoard, placeStriker, returnToCentre, scatter, settle, shooter, sideOf, soloPoints, strikerFree, strikerSpot,
  MAX_DUO, MAX_SOLO, PER_SIDE, STRIKES, type Game,
} from "../lib/rules";

const LIMIT = 60 * 30;

/** Steps until everything stops; returns the seconds it took. */
function settleWorld(w: World) {
  let frames = 0;
  while (w.moving && frames < LIMIT) { step(w, STEP); frames++; }
  return frames / 60;
}

function snapshot(w: World) {
  return [...w.x, ...w.y, ...w.on, ...w.pocket];
}

/** A plain "ghost-ball" player: for each spot on the baseline, the cleanest straight pot it can see, else a smash into the pack. */
function bestShot(g: Game) {
  const w = g.world, side = shooter(g), radius = w.r[STRIKER];
  let best: { u: number; dx: number; dy: number; p: number; score: number } | null = null;
  const blocked = (j: number, ax: number, ay: number, bx: number, by: number, clear: number) => {
    const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy;
    const t = Math.max(0, Math.min(1, ((w.x[j] - ax) * vx + (w.y[j] - ay) * vy) / len2));
    return Math.hypot(w.x[j] - ax - t * vx, w.y[j] - ay - t * vy) < clear;
  };
  for (let k = 0; k <= 16; k++) {
    const u = k / 16, s = strikerSpot(side, u);
    if (!placeStriker(g, u)) continue;
    for (let i = 0; i < STRIKER; i++) {
      if (!w.on[i]) continue;
      if (g.mode === "duo" && (i === QUEEN ? g.queen !== "board" : sideOf(i) !== g.turn)) continue;
      for (let p = 0; p < 4; p++) {
        const ux = w.x[i] - POCKET_X[p], uy = w.y[i] - POCKET_Y[p], l = Math.hypot(ux, uy);
        const gx = w.x[i] + (ux / l) * (radius + COIN_R), gy = w.y[i] + (uy / l) * (radius + COIN_R);
        const dx = gx - s.x, dy = gy - s.y, d = Math.hypot(dx, dy);
        if ((side === 0 ? -dy : dy) / d < 0.17) continue;
        const cut = (dx * -ux + dy * -uy) / (d * l);
        if (cut < 0.3) continue;
        let clear = true;
        for (let j = 0; j < STRIKER && clear; j++) if (j !== i && w.on[j] && (blocked(j, s.x, s.y, gx, gy, radius + COIN_R) || blocked(j, w.x[i], w.y[i], POCKET_X[p], POCKET_Y[p], 2 * COIN_R))) clear = false;
        if (!clear) continue;
        const score = (cut * cut) / (1 + (d + l) / 900);
        if (!best || score > best.score) best = { u, dx, dy, p: Math.min(1, 0.25 + (d + l / cut) / 1500), score };
      }
    }
  }
  if (best) return best;
  for (let k = 0; k <= 8; k++) {
    const u = k / 8, s = strikerSpot(side, u);
    if (!placeStriker(g, u)) continue;
    for (let i = 0; i < STRIKER; i++) {
      if (!w.on[i] || (g.mode === "duo" && i !== QUEEN && sideOf(i) !== g.turn)) continue;
      const dx = w.x[i] - s.x, dy = w.y[i] - s.y, d = Math.hypot(dx, dy);
      if ((side === 0 ? -dy : dy) / d < 0.2) continue;
      if (!best || -d > best.score) best = { u, dx, dy, p: 0.55, score: -d };
    }
  }
  return best;
}

/** Plays one shot like the page does: place, flick, step to rest, apply the rules. */
function playShot(g: Game, shot: ReturnType<typeof bestShot>) {
  if (shot) placeStriker(g, shot.u); else placeStriker(g, nearestFree(g, g.u));
  const forward = shooter(g) === 0 ? -1 : 1;
  shoot(g.world, shot ? shot.dx : 0, shot ? shot.dy : forward, shot ? shot.p : 1);
  g.phase = "moving";
  const seconds = settleWorld(g.world);
  assert.ok(!g.world.moving && seconds < 8, `a shot settles quickly (${seconds}s)`);
  return settle(g);
}

function checkCounts(g: Game) {
  const w = g.world;
  for (let i = 0; i < COUNT; i++) {
    if (!w.on[i]) continue;
    assert.ok(w.x[i] >= w.r[i] - 1e-9 && w.x[i] <= BOARD - w.r[i] + 1e-9 && w.y[i] >= w.r[i] - 1e-9 && w.y[i] <= BOARD - w.r[i] + 1e-9, `disc ${i} on the board`);
  }
  assert.ok(w.on[STRIKER], "the striker is back for the next shot");
}

test("the same seed lays out the same board, and the same shot plays out identically", () => {
  const a = newGame("solo", 48213), b = newGame("solo", 48213), other = newGame("solo", 48214);
  assert.deepEqual(snapshot(a.world), snapshot(b.world));
  assert.notDeepEqual(snapshot(a.world), snapshot(other.world));
  for (const g of [a, b]) { shoot(g.world, 0.3, -1, 0.9); settleWorld(g.world); }
  assert.deepEqual(snapshot(a.world), snapshot(b.world), "bit-for-bit the same on one engine");
  // Step by step, not just at the end.
  const c = newGame("duo", 7), d = newGame("duo", 7);
  shoot(c.world, -0.05, -1, 1); shoot(d.world, -0.05, -1, 1);
  for (let k = 0; k < 120; k++) { step(c.world); step(d.world); assert.deepEqual([...c.world.x, ...c.world.vy], [...d.world.x, ...d.world.vy]); }
});

test("every scatter has all 19 pieces, apart, clear of pockets and baseline, with two straight lanes to the far pockets", () => {
  for (let seed = 1; seed <= 300; seed++) {
    const w = createWorld(), lanes = scatter(w, seed);
    assert.equal(lanes.length, 2, `seed ${seed} has two lanes`);
    for (let i = 0; i < STRIKER; i++) {
      assert.equal(w.on[i], 1, `seed ${seed} piece ${i} placed`);
      assert.ok(w.y[i] + COIN_R < BASE_Y - 21, "nothing on your baseline");
      for (let p = 0; p < 4; p++) assert.ok(Math.hypot(w.x[i] - POCKET_X[p], w.y[i] - POCKET_Y[p]) > POCKET_R + COIN_R, "nothing in a pocket's mouth");
      for (let j = i + 1; j < STRIKER; j++) assert.ok(Math.hypot(w.x[i] - w.x[j], w.y[i] - w.y[j]) >= 2 * COIN_R, `seed ${seed}: ${i} and ${j} apart`);
    }
  }
  assert.equal(newGame("solo", 5).world.on[STRIKER], 1);
  assert.ok(strikerFree(newGame("solo", 5)), "the striker starts on a free spot");
});

test("the planted lane really pots: a straight shot down it sinks the coin", () => {
  let potted = 0, tried = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const lanes = scatter(createWorld(), seed);
    for (const lane of lanes) {
      const g = newGame("solo", seed), w = g.world, coin = lane.pocket === 0 ? 0 : PER_SIDE;
      w.x[STRIKER] = lane.sx; w.y[STRIKER] = BASE_Y;
      const ux = lane.cx - POCKET_X[lane.pocket], uy = lane.cy - POCKET_Y[lane.pocket], l = Math.hypot(ux, uy);
      shoot(w, lane.cx + (ux / l) * (w.r[STRIKER] + COIN_R) - lane.sx, lane.cy + (uy / l) * (w.r[STRIKER] + COIN_R) - BASE_Y, 0.55);
      settleWorld(w);
      tried++;
      if (!w.on[coin]) potted++;
    }
  }
  assert.equal(potted, tried);
});

test("the opening pattern: 9 white, 9 black, the queen in the middle, nothing overlapping", () => {
  const spots = formation();
  assert.equal(spots.length, 19);
  assert.deepEqual([spots.filter(s => s.side === 0).length, spots.filter(s => s.side === 1).length, spots.filter(s => s.side === 2).length], [9, 9, 1]);
  assert.deepEqual([spots[0].x, spots[0].y], [BOARD / 2, BOARD / 2]);
  for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) assert.ok(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y) >= 2 * COIN_R);
  const g = newGame("duo", 3);
  assert.equal(onBoard(g.world, 0), 9);
  assert.equal(onBoard(g.world, 1), 9);
  assert.equal(g.world.on[QUEEN], 1);
});

test("discs always come to rest in finite time, energy never grows, and resting discs never jitter", () => {
  let slowest = 0;
  for (let seed = 1; seed <= 60; seed++) {
    for (const power of [0.15, 0.6, 1]) {
      const g = newGame(seed % 2 ? "solo" : "duo", seed), w = g.world;
      const a = ((seed * 0.618) % 1) * 2.6 - 1.3;
      shoot(w, Math.sin(a), -Math.cos(a), power);
      let energy = kineticEnergy(w), frames = 0;
      while (w.moving) {
        step(w);
        const next = kineticEnergy(w);
        assert.ok(next <= energy + 1e-6, "no energy from nowhere");
        energy = next;
        frames++;
      }
      assert.ok(frames / 60 < MAX_SHOT_TIME / 2, "settles well before the safety stop");
      slowest = Math.max(slowest, frames / 60);
      const before = snapshot(w);
      for (let k = 0; k < 30; k++) step(w);
      assert.deepEqual(snapshot(w), before, "nothing creeps once stopped");
    }
  }
  assert.ok(slowest < 6, `slowest shot ${slowest}s`);
});

test("collisions: a head-on hit passes the speed on; cushions bounce; pockets catch; aim assist finds the first disc", () => {
  const w = createWorld();
  w.on[0] = 1; w.x[0] = 370; w.y[0] = 300;
  w.on[STRIKER] = 1; w.x[STRIKER] = 370; w.y[STRIKER] = 500;
  const hit = firstHit(w, 370, 500, 0, -1, { t: 0, disc: -1 });
  assert.equal(hit.disc, 0);
  assert.ok(Math.abs(hit.t - (200 - COIN_R - w.r[STRIKER])) < 1e-9);
  shoot(w, 0, -1, 0.5);
  for (let k = 0; k < 60 && w.vy[0] === 0; k++) step(w);
  assert.ok(w.vy[0] < 0, "the coin moves on");
  assert.ok(Math.abs(w.vx[0]) < 1e-9, "straight hit, straight on");
  // A cushion turns a disc round.
  const c = createWorld();
  c.on[1] = 1; c.x[1] = 370; c.y[1] = 40; c.vy[1] = -800; c.moving = true;
  for (let k = 0; k < 10; k++) step(c);
  assert.ok(c.vy[1] > 0 && c.y[1] >= COIN_R, "bounced off the top cushion");
  // A disc rolled into a corner drops in, and the pocket and order are recorded.
  const p = createWorld();
  p.on[2] = 1; p.x[2] = 120; p.y[2] = 120; p.vx[2] = -900; p.vy[2] = -900; p.moving = true;
  settleWorld(p);
  assert.equal(p.on[2], 0);
  assert.equal(p.pocket[2], 0);
  assert.equal(p.sunkCount, 1);
  assert.ok(isFree(p, 120, 120, COIN_R));
});

test("solo scoring: a coin is 1, the queen 3, a striker in a pocket returns this strike's pieces plus one earlier coin", () => {
  const g = newGame("solo", 11), w = g.world;
  const sink = (i: number) => { w.on[i] = 0; w.pocket[i] = 0; w.order[i] = w.nextOrder++; w.sunk[w.sunkCount++] = i; };
  w.sunkCount = 0; sink(3); sink(QUEEN);
  assert.equal(settle(g), "queen");
  assert.equal(g.gained, 4);
  assert.equal(soloPoints(w), 4);
  w.sunkCount = 0; sink(4); sink(STRIKER);
  assert.equal(settle(g), "foul");
  assert.equal(w.on[4], 1, "this strike's coin comes back");
  assert.equal(w.on[3], 1, "plus the earlier coin");
  assert.equal(w.on[QUEEN], 0, "the queen from an earlier strike stays in");
  assert.equal(soloPoints(w), 3);
  assert.equal(w.on[STRIKER], 1);
  w.sunkCount = 0;
  assert.equal(settle(g), "miss");
  assert.equal(g.strikes, 3);
  for (let k = g.strikes; k < STRIKES; k++) { w.sunkCount = 0; settle(g); }
  assert.equal(g.phase, "over", "ten strikes and done");
  assert.ok(isFree(w, w.x[4], w.y[4], COIN_R, 4), "returned coins land on a free spot");
});

test("house rules for two: turn continues on an own coin, queen needs cover, fouls return a coin or are owed, last coin waits for the queen", () => {
  const g = newGame("duo", 2), w = g.world;
  const sink = (...ids: number[]) => { w.sunkCount = 0; for (const i of ids) { w.on[i] = 0; w.pocket[i] = 1; w.order[i] = w.nextOrder++; w.sunk[w.sunkCount++] = i; } };
  sink(); assert.equal(settle(g), "turn"); assert.equal(g.turn, 1);
  sink(PER_SIDE); assert.equal(settle(g), "again"); assert.equal(g.turn, 1, "black pocketed black: black again");
  sink(0); assert.equal(settle(g), "theirs"); assert.equal(g.turn, 0, "black pocketed white: white's turn, coin stays white's");
  assert.equal(onBoard(w, 0), 8);
  // Foul with nothing pocketed yet? White has one in (pocketed by black), so that one returns.
  sink(STRIKER); assert.equal(settle(g), "foul"); assert.equal(g.turn, 1); assert.equal(onBoard(w, 0), 9);
  // Black pockets the queen alone: pending, black keeps the turn; then fails to cover: the queen goes back.
  sink(QUEEN); assert.equal(settle(g), "queen"); assert.equal(g.queen, "pending"); assert.equal(g.turn, 1);
  sink(); assert.equal(settle(g), "queen-back"); assert.equal(g.queen, "board"); assert.equal(w.on[QUEEN], 1); assert.equal(g.turn, 0);
  // White fouls with no coin in: owes one, paid with the next coin white pockets.
  sink(STRIKER); assert.equal(settle(g), "foul"); assert.deepEqual(g.dues, [1, 0]);
  sink(); settle(g); // black misses
  sink(1); assert.equal(settle(g), "again"); assert.deepEqual(g.dues, [0, 0]); assert.equal(onBoard(w, 0), 9, "the owed coin went back");
  // White pockets queen and own coin together: covered at once.
  sink(QUEEN, 2); assert.equal(settle(g), "cover"); assert.equal(g.queen, "covered"); assert.equal(g.queenBy, 0); assert.equal(g.turn, 0);
  assert.equal(noteText("cover", { mode: "duo", gained: 0, turn: g.turn, queenBy: g.queenBy }), "কভার! কুইন এখন সাদার। আবার তোমার চাল।");
  // White clears the rest and wins: black's coins left + 3 for the queen.
  sink(...Array.from({ length: PER_SIDE }, (_, i) => i).filter(i => w.on[i])); assert.equal(settle(g), "won");
  assert.equal(g.winner, 0);
  assert.equal(duoPoints(g), onBoard(w, 1) + 3);
  assert.ok(duoPoints(g) <= MAX_DUO);
});

test("a striker foul also undoes a pending queen, and a last coin before the queen comes back", () => {
  const g = newGame("duo", 9), w = g.world;
  const sink = (...ids: number[]) => { w.sunkCount = 0; for (const i of ids) { w.on[i] = 0; w.pocket[i] = 2; w.order[i] = w.nextOrder++; w.sunk[w.sunkCount++] = i; } };
  sink(QUEEN); settle(g); assert.equal(g.queen, "pending");
  sink(0, STRIKER); assert.equal(settle(g), "foul");
  assert.equal(w.on[QUEEN], 1, "pending queen back");
  assert.equal(w.on[0], 1, "own coin in a foul comes back");
  assert.equal(g.dues[0], 1, "no coin to give back yet, so one is owed");
  // Black sinks every black coin while the queen is still on the board: the last one returns.
  sink(...Array.from({ length: PER_SIDE }, (_, k) => PER_SIDE + k));
  assert.equal(settle(g), "last-back");
  assert.equal(onBoard(w, 1), 1);
  assert.equal(g.winner, -1);
  assert.equal(g.phase, "aim");
});

test("returned coins never land on another disc, even when the centre is crowded", () => {
  const g = newGame("duo", 1), w = g.world;
  for (const i of [0, 9, 1]) { w.on[i] = 0; returnToCentre(w, i); assert.ok(isFree(w, w.x[i], w.y[i], COIN_R, i)); }
});

test("a striker never sits on a coin: nearestFree slides it along the baseline", () => {
  const g = newGame("solo", 3), w = g.world;
  w.on[5] = 1; w.x[5] = 370; w.y[5] = BASE_Y;
  assert.equal(placeStriker(g, 0.5), false);
  const u = nearestFree(g, 0.5);
  assert.notEqual(u, 0.5);
  assert.equal(placeStriker(g, u), true);
  // The top player's spot mirrors the bottom one.
  assert.deepEqual(strikerSpot(1, 0.25), { x: BOARD - strikerSpot(0, 0.25).x, y: BOARD - BASE_Y });
});

test("a headless solo run of ten strikes ends sanely with a plausible score", () => {
  const scores: number[] = [];
  for (let seed = 1; seed <= 12; seed++) {
    const g = newGame("solo", seed * 7919);
    let strikes = 0;
    while (g.phase !== "over") { playShot(g, bestShot(g)); checkCounts(g); strikes++; assert.ok(strikes <= STRIKES); }
    const points = soloPoints(g.world);
    assert.ok(points >= 0 && points <= MAX_SOLO);
    scores.push(points);
  }
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  assert.ok(average >= 4 && average <= 18, `a careful player averages ${average}`);
});

test("a headless two-player board ends with a winner and consistent counts", () => {
  let wins = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const g = newGame("duo", seed);
    while (g.phase !== "over" && g.strikes < 250) {
      playShot(g, g.strikes === 0 ? null : bestShot(g));
      checkCounts(g);
      assert.ok(g.dues[0] >= 0 && g.dues[1] >= 0);
      if (g.queen === "board") assert.equal(g.world.on[QUEEN], 1);
      else assert.equal(g.world.on[QUEEN], 0);
      if (g.queen !== "covered") assert.ok(onBoard(g.world, 0) > 0 && onBoard(g.world, 1) > 0, "nobody finishes before the queen");
    }
    if (g.winner !== -1) { wins++; assert.ok(duoPoints(g) >= 0 && duoPoints(g) <= MAX_DUO); assert.equal(onBoard(g.world, g.winner), 0); }
  }
  assert.ok(wins >= 5, `${wins} of 6 boards finished`);
});

test("score bands and lines read naturally", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(3), bands[1].line);
  assert.equal(humanLine(7), bands[2].line);
  assert.equal(humanLine(12), bands[3].line);
  assert.equal(humanLine(MAX_SOLO), bands[4].line);
  assert.equal(piecesLine(8, true), "৫টা গুটি, কুইন সহ");
  assert.equal(piecesLine(3, true), "শুধু কুইনটা");
  assert.equal(piecesLine(0, false), "একটাও না");
  assert.equal(compareLine(9, 7, "রাফি"), "রাফির চেয়ে ২ পয়েন্ট বেশি!");
  assert.equal(compareLine(7, 7, "রাফি"), "একদম সমান! রাফিও ৭ পয়েন্ট করেছে।");
  assert.equal(compareLine(6, 7, ""), "আর একটু হলেই! মাত্র ১ পয়েন্ট কম।");
  assert.match(compareLine(2, 9, "মিতু"), /মিতু এখনো ৭ পয়েন্ট এগিয়ে/);
  assert.equal(RULES.length, 6);
  assert.match(SOLO_RULE, /কুইন ৩/);
});

test("challenge links round-trip, and hostile or impossible ones are refused or trimmed", () => {
  const solo: Shared = { mode: "solo", seed: 48213, points: 8, queen: true, name: "রাফি" };
  const hash = sharedHash(solo);
  assert.equal(hash, "s=48213&t=8&q=1&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseShared("#" + hash), solo);
  assert.equal(share.normalize(hash), hash);
  const duo: Shared = { mode: "duo", seed: 5, points: 7, queen: true, winner: 1, name: "মিতু", other: "রাফি" };
  assert.deepEqual(parseShared(sharedHash(duo)), duo);
  assert.equal(share.normalize("s=48213&t=8&n=রাফি&x=<script>"), sharedHash({ ...solo, queen: false }), "unknown keys are dropped");
  for (const bad of [
    "", "result", "s=0&t=1", "s=1000000000&t=1", "s=12&t=-1", `s=12&t=${MAX_SOLO + 1}`, "s=12&t=19", "s=12&t=2&q=1", "s=1.5&t=1", "s=12&t=ten",
    "s=12&t=13&m=d&w=0", "s=12&t=5&m=d", "s=12&t=5&m=d&w=2", "s=12&t=5&m=x", "s=12&t=1&n=" + "ক".repeat(700),
  ]) assert.equal(share.normalize(bad), null, bad);
  assert.equal(parseShared("s=12&t=18")?.points, 18);
  assert.equal(parseShared(`s=12&t=${MAX_SOLO}&q=1`)?.points, MAX_SOLO);
  assert.equal(parseShared(`s=12&t=${MAX_DUO}&q=1&m=d&w=0`)?.points, MAX_DUO);
  const odd = parseShared("s=12&t=3&n=" + encodeURIComponent("  রিমা‮\u0000 আক্তার আক্তার আক্তার  ") + "&m=d&w=1&o=" + encodeURIComponent("<b>" + "x".repeat(40)));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
  assert.equal(odd?.mode === "duo" && odd.other.length, 20);
});

test("previews, banner and caption are personal and honest", () => {
  const solo: Shared = { mode: "solo", seed: 1, points: 7, queen: false, name: "রাফি" };
  assert.equal(previewTitle(solo), "রাফি ক্যারমে ৭ পয়েন্ট করেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...solo, name: "" }), "ক্যারমে ১০ চালে ৭ পয়েন্ট! তুমি পারবে?");
  assert.equal(banner(solo), "রাফি ১০ চালে ৭ পয়েন্ট করেছে। একই বোর্ড, এবার তোমার পালা।");
  const duo: Shared = { mode: "duo", seed: 1, points: 6, queen: false, winner: 1, name: "", other: "" };
  assert.equal(previewTitle(duo), "ক্যারমে কালো জিতেছে, ৬ পয়েন্টে। তোমরাও খেলবে?");
  assert.match(caption(duo), /কালোর ঘরে/);
  assert.match(caption(solo), /৭ পয়েন্ট/);
  assert.match(caption({ ...solo, points: 0 }), /একটাও/);
  assert.equal(share.preview(sharedHash(solo)).title, previewTitle(solo));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits, says what a link carries, and stays clear of stakes and rulings", () => {
  assert.ok([...site.title].length <= 45, `${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `${site.description.length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.ok(site.headline && site.headline !== site.title);
  const privacy = site.privacy.join(" ");
  for (const word of ["নম্বর", "পয়েন্ট", "নাম", "নিজের ফোনে"]) assert.match(privacy, new RegExp(word));
  const everything = JSON.stringify(site) + share.preview("").description + RULES.join(" ") + SOLO_RULE;
  assert.doesNotMatch(everything, /আপনি|করুন|জুয়া|বাজি|টাকা জিত|হারাম|হালাল|জায়েজ|Carrom Pool/);
});
