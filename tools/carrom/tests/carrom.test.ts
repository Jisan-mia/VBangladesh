import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import {
  bands, banner, caption, compareLine, compareStrikes, humanLine, levelLine, noteText, oldBoardStars, parseShared, piecesLine, pointsNear, previewTitle, sharedHash,
  strikesNear, RULES, SOLO_RULE, type Shared,
} from "../lib/link";
import { firstHit, step, traceAim, HIT, TRACE, T_DISC, T_POCKET } from "../lib/physics.hot";
import {
  createWorld, isFree, kineticEnergy, shoot, slideDistance, speedFor, BASE_Y, BIG_STRIKER_R, BOARD, COIN_R, COUNT, MAX_SHOT_TIME, PER_SIDE, POCKET_R, POCKET_X, POCKET_Y,
  QUEEN, STEP, STRIKER, STRIKER_R, type World,
} from "../lib/table";
import {
  cloneGame, duoPoints, fire, formation, levelStars, nearestFree, newBoard, newDuo, newLevel, onBoard, placeStriker, returnToCentre, scatter, settle, soloPoints,
  strikerFree, strikerSpot, whites, MAX_DUO, MAX_SOLO, STRIKES, type Game,
} from "../lib/game";
import { LEVELS, OLD_BOARDS } from "../lib/levels";
import { migrateBest, readHand } from "../lib/save";
import { advance } from "../lib/tick.hot";
import { makeView } from "../lib/view";
import { plansAll } from "../lib/aim";
import { roll } from "./bot";

const LIMIT = 60 * 30;
function settleWorld(w: World) {
  let frames = 0;
  while (w.moving && frames < LIMIT) { step(w, STEP); frames++; }
  return frames / 60;
}
const snapshot = (w: World) => [...w.x, ...w.y, ...w.on, ...w.pocket];
/** Marks pieces as sunk by the current strike, the way step() does. */
function sink(g: Game, ...ids: number[]) {
  const w = g.world;
  w.sunkCount = 0;
  for (const i of ids) { w.on[i] = 0; w.pocket[i] = 0; w.order[i] = w.nextOrder++; w.sunk[w.sunkCount++] = i; }
}

test("the same seed lays out the same board, and the same strike plays out identically, step by step", () => {
  const a = newBoard(48213, "n"), b = newBoard(48213, "n"), other = newBoard(48214, "n");
  assert.deepEqual(snapshot(a.world), snapshot(b.world));
  assert.notDeepEqual(snapshot(a.world), snapshot(other.world));
  for (const g of [a, b]) { shoot(g.world, 0.3, -1, 0.9); settleWorld(g.world); }
  assert.deepEqual(snapshot(a.world), snapshot(b.world));
  const c = newDuo(7, "n"), d = newDuo(7, "n");
  shoot(c.world, -0.05, -1, 1); shoot(d.world, -0.05, -1, 1);
  for (let k = 0; k < 120; k++) { step(c.world); step(d.world); assert.deepEqual([...c.world.x, ...c.world.vy], [...d.world.x, ...d.world.vy]); }
});

test("ধীরে খেলো runs the very same steps: a strike ends on exactly the same board", () => {
  const fast = newLevel(5, "n"), slow = newLevel(5, "n"), vf = makeView(), vs = makeView();
  fire(fast, -0.2, 0.8); fire(slow, -0.2, 0.8);
  while (fast.world.moving) advance(vf, fast.world, 1 / 60, false);
  while (slow.world.moving) advance(vs, slow.world, 1 / 60, true);
  assert.deepEqual(snapshot(fast.world), snapshot(slow.world));
});

test("old links lay out the same দশ চাল board as before the ladder: the scatter is unchanged", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const w = createWorld(), lanes = scatter(w, seed);
    assert.equal(lanes.length, 2, `seed ${seed} has two lanes`);
    for (let i = 0; i < STRIKER; i++) {
      assert.equal(w.on[i], 1);
      assert.ok(w.y[i] + COIN_R < BASE_Y - 21, "nothing on your baseline");
      for (let p = 0; p < 4; p++) assert.ok(Math.hypot(w.x[i] - POCKET_X[p], w.y[i] - POCKET_Y[p]) > POCKET_R + COIN_R);
      for (let j = i + 1; j < STRIKER; j++) assert.ok(Math.hypot(w.x[i] - w.x[j], w.y[i] - w.y[j]) >= 2 * COIN_R);
    }
  }
  // A pinned checksum of board 1's scatter, so a change can't quietly move the coins behind old board links.
  const w = createWorld();
  scatter(w, OLD_BOARDS[0].seed);
  let sum = 0;
  for (let i = 0; i < STRIKER; i++) sum += Math.round(w.x[i]) * (i + 1) + Math.round(w.y[i]) * (i + 7);
  assert.equal(sum, 171_219, "checked against the scatter from before the rewrite");
});

test("discs always come to rest in finite time, energy never grows, and resting discs never jitter", () => {
  let slowest = 0;
  for (let seed = 1; seed <= 40; seed++) {
    for (const power of [0.15, 0.6, 1]) {
      const g = seed % 2 ? newBoard(seed, "n") : newDuo(seed, "n"), w = g.world;
      const a = ((seed * 0.618) % 1) * 2.6 - 1.3;
      shoot(w, Math.sin(a), -Math.cos(a), power);
      let energy = kineticEnergy(w), frames = 0;
      while (w.moving) { step(w); const next = kineticEnergy(w); assert.ok(next <= energy + 1e-6); energy = next; frames++; }
      assert.ok(frames / 60 < MAX_SHOT_TIME / 2);
      slowest = Math.max(slowest, frames / 60);
      const before = snapshot(w);
      for (let k = 0; k < 30; k++) step(w);
      assert.deepEqual(snapshot(w), before, "nothing creeps once stopped");
    }
  }
  assert.ok(slowest < 7, `slowest strike ${slowest}s`);
});

test("collisions, cushions and pockets; the aim guide finds the first disc and where it will go", () => {
  const w = createWorld();
  w.on[0] = 1; w.x[0] = 370; w.y[0] = 300;
  w.on[STRIKER] = 1; w.x[STRIKER] = 370; w.y[STRIKER] = 500;
  firstHit(w, 370, 500, 0, -1, w.r[STRIKER], STRIKER, -1);
  assert.equal(HIT[1], 0);
  assert.ok(Math.abs(HIT[0] - (200 - COIN_R - w.r[STRIKER])) < 1e-9);
  shoot(w, 0, -1, 0.5);
  for (let k = 0; k < 60 && w.vy[0] === 0; k++) step(w);
  assert.ok(w.vy[0] < 0 && Math.abs(w.vx[0]) < 1e-9, "straight hit, straight on");
  const p = createWorld();
  p.on[2] = 1; p.x[2] = 120; p.y[2] = 120; p.vx[2] = -900; p.vy[2] = -900; p.moving = true;
  settleWorld(p);
  assert.equal(p.on[2], 0);
  assert.equal(p.pocket[2], 0);
  // Board 1's set aim: the guide shows the coin heading into the top-left pocket.
  const g = newLevel(1, "e"), spec = LEVELS[0];
  const dx = spec.aim![0] - g.world.x[STRIKER], dy = spec.aim![1] - g.world.y[STRIKER], l = Math.hypot(dx, dy);
  traceAim(g.world, g.world.x[STRIKER], g.world.y[STRIKER], dx / l, dy / l, g.world.r[STRIKER], 1);
  assert.equal(TRACE[T_DISC], 0);
  assert.equal(TRACE[T_POCKET], 0);
});

test("the easiest pot's power drops the coin and sits inside the window: a little less or more still pots", () => {
  for (const level of [1, 2, 3, 4]) {
    const g = newLevel(level, "n"), plan = plansAll(g, 16)[0];
    assert.ok(plan, `board ${level} has a pot`);
    for (const k of [0.92, 1, 1.08]) {
      const c = cloneGame(g);
      placeStriker(c, plan.u);
      assert.equal(fire(c, plan.angle, plan.power * k), "ok");
      roll(c);
      const sunk = [...c.world.sunk.slice(0, c.world.sunkCount)];
      assert.ok(sunk.includes(plan.target) && !sunk.includes(STRIKER), `board ${level} at ×${k}`);
    }
  }
  assert.ok(Math.abs(slideDistance(speedFor(300)) - 300) < 0.5);
});

test("দশ চাল scoring: a coin is 1, the queen 3, a striker in a pocket returns this strike's pieces plus one earlier coin", () => {
  const g = newBoard(11, "n"), w = g.world;
  sink(g, 3, QUEEN);
  assert.equal(settle(g), "queen");
  assert.equal(g.gained, 4);
  assert.equal(soloPoints(w), 4);
  sink(g, 4, STRIKER);
  assert.equal(settle(g), "foul");
  assert.equal(w.on[4], 1);
  assert.equal(w.on[3], 1);
  assert.equal(w.on[QUEEN], 0);
  assert.equal(soloPoints(w), 3);
  for (let k = g.strikes; k < STRIKES; k++) { w.sunkCount = 0; settle(g); }
  assert.equal(g.phase, "over");
});

test("house rules for two: own coin plays again, the queen needs cover, fouls return a coin or owe one, the last coin waits for the queen", () => {
  const g = newDuo(2, "n"), w = g.world;
  sink(g); assert.equal(settle(g), "turn"); assert.equal(g.turn, 1);
  sink(g, PER_SIDE); assert.equal(settle(g), "again"); assert.equal(g.turn, 1);
  sink(g, 0); assert.equal(settle(g), "theirs"); assert.equal(g.turn, 0);
  sink(g, STRIKER); assert.equal(settle(g), "foul"); assert.equal(g.turn, 1); assert.equal(onBoard(w, 0), 9);
  sink(g, QUEEN); assert.equal(settle(g), "queen"); assert.equal(g.queen, "pending"); assert.equal(g.turn, 1);
  sink(g); assert.equal(settle(g), "queen-back"); assert.equal(w.on[QUEEN], 1); assert.equal(g.turn, 0);
  sink(g, STRIKER); assert.equal(settle(g), "foul"); assert.deepEqual(g.dues, [1, 0]);
  sink(g); settle(g);
  sink(g, 1); assert.equal(settle(g), "again"); assert.deepEqual(g.dues, [0, 0]); assert.equal(onBoard(w, 0), 9);
  sink(g, QUEEN, 2); assert.equal(settle(g), "cover"); assert.equal(g.queenBy, 0);
  assert.equal(noteText("cover", { mode: "duo", gained: 0, turn: g.turn, queenBy: g.queenBy, left: 0 }), "কভার! কুইন এখন সাদার। আবার তোমার চাল।");
  sink(g, ...Array.from({ length: PER_SIDE }, (_, i) => i).filter(i => w.on[i])); assert.equal(settle(g), "won");
  assert.equal(g.winner, 0);
  assert.equal(duoPoints(g), onBoard(w, 1) + 3);
  assert.ok(duoPoints(g) <= MAX_DUO);
});

test("a board's rules: a black costs a strike, a foul returns whites, the queen needs cover, and a coin never placed never appears", () => {
  const g = newLevel(6, "n"), w = g.world;
  sink(g, PER_SIDE);
  assert.equal(settle(g), "black");
  assert.equal(g.strikes, 2, "one strike plus one for the black");
  assert.equal(w.on[PER_SIDE], 1, "the black is back in the middle");
  sink(g, 0);
  assert.equal(settle(g), "pocket");
  sink(g, 1, STRIKER);
  assert.equal(settle(g), "foul");
  assert.equal(w.on[1], 1, "this strike's white comes back");
  assert.equal(w.on[0], 1, "and the earlier white");
  // Board 1 has one white: a foul there must not bring back a coin the board never placed.
  const one = newLevel(1, "n");
  sink(one, STRIKER);
  settle(one);
  assert.equal(onBoard(one.world, 0), 1);
  assert.deepEqual([...one.world.on.slice(1, PER_SIDE)], Array(PER_SIDE - 1).fill(0));
  // The queen board: the last white waits until the queen is covered; then queen + white clears it.
  const q = newLevel(9, "n");
  sink(q, 0); assert.equal(settle(q), "pocket");
  sink(q, 1); assert.equal(settle(q), "last-back");
  assert.equal(onBoard(q.world, 0), 1);
  sink(q, QUEEN); assert.equal(settle(q), "queen"); assert.equal(q.queen, "pending");
  const last = q.world.on[0] ? 0 : 1;
  sink(q, last); assert.equal(settle(q), "clear");
  assert.ok(q.cleared && (q.queen as string) === "covered");
  assert.equal(levelStars(q), q.strikes <= LEVELS[8].par ? 3 : q.strikes <= LEVELS[8].two ? 2 : 1);
});

test("stars come from strikes used; running out of strikes ends the board with none", () => {
  const g = newLevel(2, "n");
  sink(g, 0); assert.equal(settle(g), "clear"); assert.equal(levelStars(g), 3);
  const late = newLevel(2, "n");
  for (let k = 0; k < LEVELS[1].strikes - 1; k++) { late.world.sunkCount = 0; settle(late); }
  sink(late, 0); settle(late);
  assert.equal(levelStars(late), 1);
  const out = newLevel(2, "n");
  for (let k = 0; k < LEVELS[1].strikes; k++) { out.world.sunkCount = 0; settle(out); }
  assert.equal(out.phase, "over");
  assert.equal(out.note, "out");
  assert.equal(levelStars(out), 0);
});

test("every board is laid out fairly: on the board, apart, clear of pockets, and the striker starts on a free spot", () => {
  LEVELS.forEach((spec, index) => {
    const g = newLevel(index + 1, "e"), w = g.world;
    assert.ok(strikerFree(g), spec.name);
    const total = whites(g).total;
    assert.ok(total >= 1 && whites(g).need <= total && spec.par < spec.two && spec.two < spec.strikes, spec.name);
    for (let i = 0; i < STRIKER; i++) {
      if (!w.on[i]) continue;
      assert.ok(w.x[i] >= COIN_R && w.x[i] <= BOARD - COIN_R && w.y[i] >= COIN_R && w.y[i] <= BOARD - COIN_R, `${spec.name} ${i}`);
      for (let p = 0; p < 4; p++) assert.ok(Math.hypot(w.x[i] - POCKET_X[p], w.y[i] - POCKET_Y[p]) > POCKET_R + COIN_R, `${spec.name} ${i} out of the pocket`);
      for (let j = i + 1; j < COUNT; j++) if (w.on[j]) assert.ok(Math.hypot(w.x[i] - w.x[j], w.y[i] - w.y[j]) >= w.r[i] + w.r[j] - 0.01, `${spec.name}: ${i} and ${j} apart`);
    }
  });
  assert.equal(new Set(LEVELS.map(level => level.seed)).size, LEVELS.length);
  assert.equal(LEVELS.filter(level => level.boss).length, 3, "a named finale for each world");
});

test("returned coins never land on another disc, and a striker never sits on a coin", () => {
  const g = newDuo(1, "n"), w = g.world;
  for (const i of [0, 9, 1]) { w.on[i] = 0; returnToCentre(w, i); assert.ok(isFree(w, w.x[i], w.y[i], COIN_R, i)); }
  const b = newBoard(3, "n");
  b.world.on[5] = 1; b.world.x[5] = 370; b.world.y[5] = BASE_Y;
  assert.equal(placeStriker(b, 0.5), false);
  assert.equal(placeStriker(b, nearestFree(b, 0.5)), true);
  assert.deepEqual(strikerSpot(1, 0.25), { x: BOARD - strikerSpot(0, 0.25).x, y: BOARD - BASE_Y });
});

test("lines read naturally", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(MAX_SOLO), bands[4].line);
  assert.equal(piecesLine(8, true), "৫টা গুটি, কুইন সহ");
  assert.equal(piecesLine(0, false), "একটাও না");
  assert.equal(compareLine(9, 7, "রাফি"), "রাফির চেয়ে ২ পয়েন্ট বেশি!");
  assert.equal(compareStrikes(3, 5, "মিতু"), "মিতুর চেয়ে ২ চাল কম!");
  assert.equal(compareStrikes(4, 4, "মিতু"), "একদম সমান! মিতুও ৪ চালে সাফ করেছে।");
  assert.equal(strikesNear(LEVELS[4], LEVELS[4].par + 1), "আর ১ চাল কম হলে ৩ তারা।");
  assert.equal(strikesNear(LEVELS[4], LEVELS[4].par), "");
  assert.match(levelLine(LEVELS[4], true, 3, 0), /মন্টু ভাই/);
  assert.match(levelLine(LEVELS[1], false, 0, 1), /একটা গুটি বাকি/);
  assert.equal(oldBoardStars(0, 1), 0);
  assert.equal(oldBoardStars(6, 1), 3);
  assert.equal(pointsNear(0, 2, null), "আর ২ পয়েন্ট হলেই বোর্ড পার।");
  assert.equal(pointsNear(9, 0, 9), "আর ১ পয়েন্ট হলেই নতুন সেরা।");
  assert.equal(RULES.length, 6);
  assert.match(SOLO_RULE, /কুইন ৩/);
});

test("challenge links: old দশ চাল and board links still open, new board links carry c and d, hostile ones are refused", () => {
  const solo: Shared = { mode: "solo", seed: 48213, points: 8, queen: true, name: "রাফি" };
  assert.equal(sharedHash(solo), "s=48213&t=8&q=1&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseShared("#" + sharedHash(solo)), solo);
  const old: Shared = { mode: "solo", seed: OLD_BOARDS[2].seed, points: 6, queen: false, name: "রাফি", level: 3 };
  assert.match(sharedHash(old), /&l=3/);
  assert.deepEqual(parseShared(sharedHash(old)), old);
  const duo: Shared = { mode: "duo", seed: 5, points: 7, queen: true, winner: 1, name: "মিতু", other: "রাফি" };
  assert.deepEqual(parseShared(sharedHash(duo)), duo);
  const level: Shared = { mode: "level", level: 7, seed: LEVELS[6].seed, strikes: 2, name: "রাফি", hand: "h" };
  assert.equal(sharedHash(level), `s=${LEVELS[6].seed}&t=2&c=7&d=h&n=` + encodeURIComponent("রাফি"));
  assert.deepEqual(parseShared(sharedHash(level)), level);
  assert.equal(share.normalize(sharedHash(level)), sharedHash(level));
  assert.equal(share.normalize("s=48213&t=8&n=রাফি&x=<script>"), sharedHash({ ...solo, queen: false }), "unknown keys are dropped");
  for (const bad of [
    "", "result", "s=0&t=1", "s=1000000000&t=1", "s=12&t=-1", `s=12&t=${MAX_SOLO + 1}`, "s=12&t=19", "s=12&t=2&q=1", "s=1.5&t=1", "s=12&t=ten",
    "s=12&t=13&m=d&w=0", "s=12&t=5&m=d", "s=12&t=5&m=d&w=2", "s=12&t=5&m=x", "s=12&t=1&n=" + "ক".repeat(700),
    "s=48213&t=6&l=3", `s=${OLD_BOARDS[0].seed}&t=6&l=11`, `s=${LEVELS[0].seed}&t=2&c=2`, `s=${LEVELS[0].seed}&t=0&c=1`, `s=${LEVELS[0].seed}&t=2&c=1&d=x`,
    `s=${LEVELS[0].seed}&t=2&c=1&m=d`, `s=${LEVELS[0].seed}&t=2&c=99`,
  ]) assert.equal(share.normalize(bad), null, bad);
});

test("previews, banners and captions are personal and honest", () => {
  const solo: Shared = { mode: "solo", seed: 1, points: 7, queen: false, name: "রাফি" };
  assert.equal(previewTitle(solo), "রাফি ক্যারমে ৭ পয়েন্ট করেছে। তুমি পারবে?");
  assert.equal(banner(solo), "রাফি ১০ চালে ৭ পয়েন্ট করেছে। একই বোর্ড, এবার তোমার পালা।");
  const level: Shared = { mode: "level", level: 3, seed: LEVELS[2].seed, strikes: 2, name: "রাফি" };
  assert.equal(previewTitle(level), "রাফি ক্যারমের বোর্ড ৩ সাফ করেছে ২ চালে। তুমি পারবে?");
  assert.match(banner(level), /বোর্ড ৩ · কোণাকুণি/);
  assert.match(caption(level), /২ চালে সাফ/);
  assert.match(caption({ ...solo, points: 0 }), /একটাও/);
  assert.equal(share.preview(sharedHash(level)).title, previewTitle(level));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits and stays clear of stakes and rulings", () => {
  assert.ok([...site.title].length <= 45);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3);
  assert.ok(site.headline && site.headline !== site.title);
  const privacy = site.privacy.join(" ");
  for (const word of ["নম্বর", "চালে", "নাম", "নিজের ফোনে"]) assert.match(privacy, new RegExp(word));
  const everything = JSON.stringify(site) + share.preview("").description + RULES.join(" ") + SOLO_RULE + JSON.stringify(LEVELS);
  assert.doesNotMatch(everything, /আপনি|করুন|জুয়া|বাজি|টাকা জিত|হারাম|হালাল|জায়েজ|Carrom Pool/);
  assert.equal(everything, everything.normalize("NFC"));
});

test("migrations run once: the old best becomes board 1's stars, the old toggles become a difficulty", () => {
  assert.equal(migrateBest({}, "7"), 3);
  assert.equal(migrateBest({}, "2"), 1);
  assert.equal(migrateBest({}, "0"), 0);
  assert.equal(migrateBest({}, null), 0);
  assert.equal(migrateBest({ 1: 1 }, "9"), 0);
  assert.deepEqual(readHand(null, null, "1"), { hand: "e", migrated: true });
  assert.deepEqual(readHand(null, "0", null), { hand: "h", migrated: true });
  assert.deepEqual(readHand(null, null, null), { hand: "n", migrated: true });
  assert.deepEqual(readHand("h", null, "1"), { hand: "h", migrated: false });
  assert.equal(newLevel(1, "e").world.r[STRIKER], BIG_STRIKER_R);
  assert.equal(newLevel(1, "n").world.r[STRIKER], STRIKER_R);
});
