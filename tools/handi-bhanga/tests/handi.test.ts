import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { banner, caption, chancesFrom, migrateBest, nearLine, parseShared, potsFrom, previewTitle, sharedHash, starsOf, tallyLine, validScore, LEVEL_COUNT, LEVELS, MAX_SCORE } from "../lib/link";
import {
  MAX_SWAY, potX, swayOf, windOf, bands, bounceAngle, compareLine, createGame, humanLine, launch, moveStick, nudge, overlaps, potLeft, potTop, speed, step,
  BALL_R, CELL, COLS, MAX_ANGLE, MAX_SPEED, POT_H, POT_W, ROW_GAP, STICK_SPEED, STICK_W, STICK_Y, TOP, TOUGH, W, WALL, type Game, type GameEvent,
} from "../lib/game";

const DT = 1 / 60;
const POTS = 35;
const live = (game: Game) => [...game.hits].filter(hits => hits > 0).length;

/** A fair bot: it can only move the stick as fast as the buttons do, and it aims by picking where on the stick to meet the ball. */
function play(seed: number, { skill = 1, slow = false, limit = 60 * 60 * 20, level = 1 } = {}) {
  const game = createGame(seed, level);
  const events: Record<string, number> = {};
  let bounces = 0, frames = 0;
  const aims = [-0.55, 0.35, 0.75, -0.15, 0.6, -0.8, 0.1, -0.4];
  for (; frames < limit && !game.over; frames++) {
    if (game.resting) { nudge(game, frames % 2 ? 1 : -1, DT); launch(game); }
    // Where it would like the stick: under the ball, offset so the bounce leans the chosen way; a clumsy bot drifts.
    const aim = aims[bounces % aims.length] * (STICK_W / 2) * 0.8;
    const wobble = skill < 1 ? Math.sin(frames / 23) * (1 - skill) * 90 : 0;
    const want = game.x - aim + wobble;
    if (Math.abs(want - game.stick) > 2) nudge(game, Math.sign(want - game.stick), DT);
    step(game, DT, slow, (event: GameEvent) => {
      events[event] = (events[event] ?? 0) + 1;
      if (event === "stick") bounces++;
    });
    // On a swaying stall a pot may brush into the ball between substeps; the next substep hits it. Still rope, never inside.
    if (level === 1) for (let i = 0; i < POTS; i++) if (game.hits[i] > 0) assert.ok(!overlaps(game, i), `ball inside pot ${i}`);
    assert.ok(game.x - BALL_R >= WALL - 1e-9 && game.x + BALL_R <= W - WALL + 1e-9, "ball between the poles");
    assert.ok(game.y - BALL_R >= TOP - 1e-9, "ball under the awning");
  }
  return { game, events, frames };
}

test("the same seed gives the same stall, and the same play gives the same game", () => {
  const one = createGame(48213), two = createGame(48213), other = createGame(48214);
  assert.deepEqual(one.tough, two.tough);
  assert.deepEqual(one.design, two.design);
  assert.notDeepEqual([...one.tough, ...one.design], [...other.tough, ...other.design]);
  assert.equal([...one.tough].filter(Boolean).length, TOUGH);
  for (let i = 0; i < POTS; i++) {
    assert.equal(one.hits[i], one.tough[i] ? 2 : 1);
    if (i % COLS) assert.notEqual(one.design[i], one.design[i - 1], "neighbours wear different paintings");
  }
  const a = play(777, { limit: 60 * 90 }), b = play(777, { limit: 60 * 90 });
  assert.deepEqual([a.game.x, a.game.y, a.game.score, a.game.chances, [...a.game.hits]], [b.game.x, b.game.y, b.game.score, b.game.chances, [...b.game.hits]]);
});

test("pots and poles leave no gap the ball can slip through", () => {
  assert.ok(CELL - POT_W < BALL_R * 2, "between two pots on a rope");
  assert.ok(ROW_GAP - POT_H < BALL_R * 2, "between two ropes");
  assert.ok(potLeft(0) - WALL < BALL_R * 2, "between the pole and the first pot");
  assert.ok(potTop(0) - TOP >= BALL_R * 2, "but the ball fits above the top rope, for that satisfying rally");
});

test("scoring: 10 a pot, tough pots need two hits, a full clear adds 50 per chance left", () => {
  const game = createGame(5);
  const tough = game.tough.indexOf(1), plain = game.tough.indexOf(0);
  const seen: GameEvent[] = [];
  const at = (index: number) => { game.resting = false; game.x = potLeft(index) + POT_W / 2; game.y = potTop(index) + POT_H + BALL_R + 2; game.dx = 0; game.dy = -1; };
  // Clear the pots under the target first, so the ball reaches it straight up.
  for (let i = plain + COLS; i < POTS; i += COLS) game.hits[i] = 0;
  at(plain);
  for (let i = 0; i < 20 && game.hits[plain]; i++) step(game, DT, false, event => seen.push(event));
  assert.equal(game.hits[plain], 0);
  assert.equal(game.score, 10);
  assert.ok(seen.includes("break"));
  assert.ok(game.dy > 0, "the ball comes back down after a hit");

  for (let i = tough + COLS; i < POTS; i += COLS) game.hits[i] = 0;
  seen.length = 0;
  at(tough);
  for (let i = 0; i < 20 && !seen.length; i++) step(game, DT, false, event => { if (event !== "wall") seen.push(event); });
  assert.deepEqual(seen, ["crack"]);
  assert.equal(game.hits[tough], 1);
  assert.equal(game.score, 10, "a crack scores nothing yet");
  at(tough);
  for (let i = 0; i < 20 && game.hits[tough]; i++) step(game, DT, false);
  assert.equal(game.score, 20);

  // Leave one pot and break it with two chances left.
  const last = createGame(9);
  last.hits.fill(0); last.broken = POTS - 1; last.score = (POTS - 1) * 10; last.chances = 2;
  last.hits[POTS - 1] = 1;
  last.resting = false; last.x = potLeft(POTS - 1) + POT_W / 2; last.y = potTop(POTS - 1) + POT_H + BALL_R + 1; last.dx = 0; last.dy = -1;
  const done: GameEvent[] = [];
  for (let i = 0; i < 10 && !last.over; i++) step(last, DT, false, event => done.push(event));
  assert.ok(last.over && last.won && done.includes("win"));
  assert.equal(last.score, 350 + 100);
  assert.equal(tallyLine(last.score), "৩৫টার ৩৫টা, ২ চান্স বাকি");
});

test("valid scores, tallies and bands", () => {
  for (let score = 0; score <= 340; score += 10) assert.ok(validScore(score), String(score));
  for (const score of [400, 450, 500]) assert.ok(validScore(score));
  for (const score of [-10, 5, 345, 350, 360, 390, 410, 505, 510, 1.5, NaN]) assert.ok(!validScore(score), String(score));
  assert.equal(MAX_SCORE, 500);
  assert.deepEqual([potsFrom(280), chancesFrom(280)], [28, 0]);
  assert.deepEqual([potsFrom(450), chancesFrom(450)], [35, 2]);
  assert.equal(tallyLine(280), "৩৫টার ২৮টা");
  assert.equal(tallyLine(500), "৩৫টার ৩৫টা, ৩ চান্সই বাকি");
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(90), bands[0].line);
  assert.equal(humanLine(100), bands[1].line);
  assert.equal(humanLine(340), bands[2].line);
  assert.equal(humanLine(400), bands[3].line);
  assert.equal(humanLine(450), bands[3].line);
  assert.equal(humanLine(500), bands[4].line);
  assert.equal(compareLine(300, 180, "রাফি"), "রাফির চেয়ে ১২০ বেশি!");
  assert.equal(compareLine(240, 240, "রাফি"), "একদম সমান! রাফিও ২৪০।");
  assert.equal(compareLine(210, 240, "রাফি"), "আর একটু হলেই! মাত্র ৩০ কম।");
  assert.equal(compareLine(100, 240, ""), "বন্ধু এখনো ১৪০ এগিয়ে। আরেকবার?");
  for (let score = 0; score <= 500; score += 10) assert.doesNotMatch(compareLine(score, 250, "রাফি") + humanLine(score), /হেরে|খারাপ|ব্যর্থ/);
});

test("the stick decides the angle: straight up from the middle, leaning out towards the ends, never flat", () => {
  assert.equal(bounceAngle(100, 100), 0);
  assert.ok(Math.abs(bounceAngle(100 + STICK_W / 2, 100) - MAX_ANGLE) < 1e-9);
  assert.ok(Math.abs(bounceAngle(100 - STICK_W, 100) + MAX_ANGLE) < 1e-9, "clamped past the end");
  assert.ok(bounceAngle(110, 100) > 0 && bounceAngle(90, 100) < 0);
  for (const offset of [-40, -20, 0, 15, 38]) {
    const game = createGame(3);
    moveStick(game, 180);
    game.resting = false; game.x = 180 + offset; game.y = STICK_Y - BALL_R - 20; game.dx = 0; game.dy = 1;
    const seen: GameEvent[] = [];
    for (let i = 0; i < 30 && !seen.includes("stick"); i++) step(game, DT, false, event => seen.push(event));
    assert.ok(seen.includes("stick"), `caught at ${offset}`);
    assert.ok(game.dy < 0 && -game.dy >= Math.cos(MAX_ANGLE) - 1e-9, "always climbs");
    assert.equal(Math.sign(game.dx), Math.sign(offset));
  }
});

test("a fast ball never tunnels through a pot, even with a huge time step", () => {
  const game = createGame(11);
  const column = 3, bottom = 4 * COLS + column;
  game.resting = false; game.x = potLeft(bottom) + POT_W / 2; game.y = STICK_Y - 30; game.dx = 0; game.dy = -1;
  game.rowsCleared = 9;
  const broken: number[] = [];
  step(game, 0.75, false, (event, pot) => { if (event === "break" || event === "crack") broken.push(pot); });
  assert.deepEqual(broken.slice(0, 1), [bottom], "the first pot in the way is the one hit");
  assert.ok(!broken.some(pot => pot % COLS === column && pot < bottom - COLS && !broken.includes(pot + COLS)), "never one behind a live pot");
  for (let i = 0; i < POTS; i++) if (game.hits[i] > 0) assert.ok(!overlaps(game, i));
  // Diagonal into a corner of the wall of pots, at the cap.
  const corner = createGame(12);
  corner.resting = false; corner.x = WALL + 40; corner.y = 330; corner.dx = Math.sin(0.9); corner.dy = -Math.cos(0.9);
  step(corner, 2, false);
  for (let i = 0; i < POTS; i++) if (corner.hits[i] > 0) assert.ok(!overlaps(corner, i));
});

test("speed rises a little per cleared row, stays under the cap, and slow mode is slower", () => {
  assert.ok(speed(1, false) > speed(0, false));
  for (let rows = 0; rows <= 10; rows++) assert.ok(speed(rows, false) <= MAX_SPEED);
  assert.ok(speed(0, true) < speed(0, false));
  assert.ok(speed(10, true) < MAX_SPEED);
});

test("a missed ball costs a chance and waits on the stick; the third miss ends the game", () => {
  const game = createGame(2);
  assert.equal(launch(game), true);
  assert.equal(launch(game), false, "only a resting ball launches");
  moveStick(game, -999);
  assert.equal(game.stick, WALL + STICK_W / 2, "the stick stays between the poles");
  nudge(game, 1, 0.5);
  assert.ok(Math.abs(game.stick - (WALL + STICK_W / 2 + STICK_SPEED * 0.5)) < 1e-9);
  const seen: GameEvent[] = [];
  for (let round = 0; round < 3; round++) {
    game.resting = false; game.x = 300; game.y = STICK_Y + 10; game.dx = 0; game.dy = 1;
    moveStick(game, 40);
    for (let i = 0; i < 60 && !game.resting && !game.over; i++) step(game, DT, false, event => seen.push(event));
  }
  assert.equal(seen.filter(event => event === "lost").length, 3);
  assert.ok(game.over && !game.won && seen.includes("over"));
  assert.equal(game.chances, 0);
  assert.equal(game.score, 0);
});

test("headless runs end sanely with plausible scores", () => {
  for (const seed of [1, 48213, 999_999_999]) {
    const good = play(seed);
    assert.ok(good.game.over, `seed ${seed} ends`);
    assert.ok(validScore(good.game.score), `seed ${seed}: ${good.game.score}`);
    assert.equal(good.game.broken, POTS - live(good.game));
    assert.equal(good.game.score, good.game.broken * 10 + (good.game.won ? good.game.chances * 50 : 0));
    assert.ok(good.game.broken >= 30, `a steady player breaks most pots (seed ${seed}: ${good.game.broken})`);
    const clumsy = play(seed, { skill: 0.2, limit: 60 * 60 * 10 });
    assert.ok(clumsy.game.over && validScore(clumsy.game.score));
    assert.ok(clumsy.game.score < good.game.score, `skill shows (seed ${seed}: ${clumsy.game.score} vs ${good.game.score})`);
  }
  const still = createGame(4);
  for (let i = 0; i < 60 * 120 && !still.over; i++) { launch(still); step(still, DT, false); }
  assert.ok(still.over && still.score <= 100, `a stick nobody moves loses quickly (${still.score})`);
  const calm = play(48213, { slow: true });
  assert.ok(calm.game.over && validScore(calm.game.score));
});

test("challenge links round-trip, and hostile or impossible ones are refused or capped", () => {
  const shared = { seed: 48213, score: 280, name: "রাফি", level: 1 };
  assert.equal(sharedHash(shared), "s=48213&t=280&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseShared("#" + sharedHash(shared)), shared);
  assert.equal(share.normalize(sharedHash(shared)), sharedHash(shared));
  assert.equal(share.normalize("s=48213&t=280&n=রাফি&x=<script>"), sharedHash(shared), "unknown keys are dropped");
  for (const bad of ["", "result", "#result", "s=0&t=10", "s=1000000000&t=10", "s=-4&t=10", "s=12&t=285", "s=12&t=350", "s=12&t=420", "s=12&t=-10", `s=12&t=${MAX_SCORE + 50}`, "s=1.5&t=10", "s=12&t=ten", "s=12&t=10&n=" + "ক".repeat(700)]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  const odd = parseShared("s=12&t=10&n=" + encodeURIComponent("  রিমা‮\u0000 আক্তার আক্তার আক্তার  "));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
  assert.equal(parseShared("s=12&t=0")?.score, 0);
  assert.equal(parseShared("s=12&t=500")?.score, 500);
});

test("previews, banner and caption are personal and honest", () => {
  const shared = { seed: 48213, score: 280, name: "রাফি", level: 1 };
  assert.equal(previewTitle(shared), "রাফি ২৮০ করেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "হাঁড়িভাঙায় ২৮০! তুমি পারবে?");
  assert.equal(banner(shared), "রাফি ২৮০ করেছে। একই হাঁড়ির সারি, এবার তোমার পালা।");
  assert.match(caption(shared), /২৮টা/);
  assert.match(caption({ score: 450 }), /৩৫টা হাঁড়িই/);
  assert.equal(share.preview(sharedHash(shared)).title, "রাফি ২৮০ করেছে। তুমি পারবে?");
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits and never names a trademark", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.ok(site.headline && site.headline !== site.title);
  assert.match(site.privacy.join(" "), /স্কোর/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /breakout|arkanoid|vaus|ব্রেকআউট|আরকানয়েড|অ্যারকানয়েড|atari|আটারি/i);
  assert.doesNotMatch(everything, /আপনি|করুন|জুয়া|বাজি|টাকা জিত/);
});

test("ten stalls: level 1 is the original stall, and each later stall adds one thing and never gets easier", () => {
  for (const seed of [1, 48213, 999_999_999]) {
    const old = createGame(seed), first = createGame(seed, 1);
    assert.deepEqual([...first.tough, ...first.design], [...old.tough, ...old.design], "level 1 lays out the old stall");
    assert.equal(swayOf(first, 2), 0);
    assert.equal(windOf(first), 0);
  }
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const [before, now] = [LEVELS[level - 2], LEVELS[level - 1]];
    assert.ok(now.tough >= before.tough && now.speed >= before.speed && now.sway >= before.sway && now.wind >= before.wind && now.pass >= before.pass, `level ${level} never gets easier`);
    assert.ok([now.tough > before.tough, now.speed > before.speed, now.sway > before.sway, now.wind > before.wind].some(Boolean), `level ${level} adds something`);
    assert.equal([...createGame(48213, level).tough].filter(Boolean).length, now.tough);
    assert.ok(now.sway <= MAX_SWAY, "a swaying edge pot never pokes into a pole");
  }
});

test("swaying ropes stay inside the poles and keep the gaps tight; the wind bends but never flattens the ball", () => {
  const game = createGame(48213, LEVEL_COUNT);
  for (let t = 0; t < 60; t += 0.05) {
    game.clock = t;
    for (let row = 0; row < 5; row++) {
      const left = potX(game, row * COLS), right = potX(game, row * COLS + COLS - 1) + POT_W;
      assert.ok(left >= WALL - 1e-9 && right <= W - WALL + 1e-9, "inside the poles");
      assert.ok(left - WALL < BALL_R * 2 && W - WALL - right < BALL_R * 2, "no gap by a pole the ball fits through");
      assert.ok(Math.abs(swayOf(game, row)) <= MAX_SWAY + 1e-9);
    }
    assert.ok(Math.abs(windOf(game)) <= LEVELS[LEVEL_COUNT - 1].wind + 1e-9);
  }
  launch(game);
  for (let i = 0; i < 60 * 30 && !game.over; i++) {
    moveStick(game, game.x);
    step(game, DT, false);
    if (!game.resting) assert.ok(Math.abs(game.dy) >= Math.cos(MAX_ANGLE) - 1e-9, "never flatter than the stick's steepest bounce");
  }
});

test("every stall can be cleared with 3 stars, a steady hand clears most, and real scores pass the link check", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    let three = 0, cleared = 0;
    for (const seed of [11, 48213, 999_999_999, 2024, 7919]) {
      const good = play(seed, { level });
      assert.ok(good.game.over && validScore(good.game.score), `level ${level} seed ${seed} ends with a real score`);
      if (starsOf(good.game.score, level) === 3) three++;
      const steady = play(seed, { level, skill: 0.7 });
      if (starsOf(steady.game.score, level) >= 1) cleared++;
      assert.deepEqual(parseShared(sharedHash({ seed, score: good.game.score, name: "", level })), { seed, score: good.game.score, name: "", level });
    }
    assert.equal(three, 5, `level ${level}: a perfect hand always gets 3 stars`);
    assert.ok(cleared >= 4, `level ${level}: a steady hand clears it (${cleared}/5)`);
  }
  // Level 1 is nearly impossible to fail: even a clumsy hand clears it most of the time.
  let clumsy = 0;
  for (let seed = 1; seed <= 10; seed++) if (starsOf(play(seed * 7919, { skill: 0.3, limit: 60 * 60 * 10 }).game.score, 1)) clumsy++;
  assert.ok(clumsy >= 8, `clumsy on level 1: ${clumsy}/10`);
});

test("stars and near-miss lines use exact numbers", () => {
  assert.deepEqual([starsOf(70, 1), starsOf(80, 1), starsOf(340, 1), starsOf(400, 1), starsOf(450, 1), starsOf(500, 1)], [0, 1, 1, 2, 3, 3]);
  assert.equal(starsOf(150, LEVEL_COUNT), 0, "the last stall asks for more pots");
  assert.equal(nearLine(50, 1, null), "আর ৩টা হাঁড়ি ভাঙলেই ১ তারা।");
  assert.equal(nearLine(310, 1, null), "আর ৪টা হাঁড়ি ভাঙলেই দোকান সাফ, ২ তারা।");
  assert.equal(nearLine(400, 1, null), "আর একটা চান্স হাতে রেখে সাফ করলেই ৩ তারা।");
  assert.equal(nearLine(450, 1, 450), "আর ৫০ পয়েন্ট হলেই নতুন সেরা।");
  assert.equal(nearLine(500, 1, 500), "");
});

test("the old best moves into level 1's stars once, and only when there is nothing newer", () => {
  assert.equal(migrateBest({}, "280"), 1);
  assert.equal(migrateBest({}, "450"), 3);
  assert.equal(migrateBest({}, "40"), 0, "never passed: nothing to move");
  assert.equal(migrateBest({}, "285"), 0, "not a real score");
  assert.equal(migrateBest({}, null), 0);
  assert.equal(migrateBest({ 3: 2 }, "450"), 0, "already moved");
});

test("links carry the stall; old links without it open stall 1; bad stalls are refused", () => {
  const shared = { seed: 48213, score: 280, name: "", level: 6 };
  assert.equal(sharedHash(shared), "s=48213&t=280&l=6");
  assert.deepEqual(parseShared(sharedHash(shared)), shared);
  assert.equal(parseShared("s=48213&t=280")?.level, 1);
  assert.equal(sharedHash({ ...shared, level: 1 }), "s=48213&t=280");
  for (const bad of ["0", "11", "1.5", "-2", "x", "07"]) assert.equal(parseShared(`s=48213&t=280&l=${bad}`), null, `l=${bad}`);
});
